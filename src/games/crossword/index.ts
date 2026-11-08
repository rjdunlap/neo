import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter } from '../../art/critter';
import { cream, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { safeArea, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { typingPicture } from '../../art/word-pictures';
import { WigglyIcon } from '../shared';
import { GrownCrossword } from './grownup';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  applyHelp,
  bankFor,
  clueOf,
  decoysFor,
  firstOpen,
  helpFor,
  judge,
  makeRound,
  nearest,
  nextFill,
  planFor,
  riddleLine,
  solved,
  spelled,
  squaresOf,
  wordRight,
  wordsAt,
  wrongSquares,
  WORDS_1,
  type Plan,
  type Puzzle,
} from './logic';

const INSTRUCT = ['cw.one', 'cw.two', 'cw.three', 'cw.four'] as const;

const SQ = 100;
const PITCH = 104;
/** How far from a blank's middle a dropped tile still lands in it. */
const REACH = 80;

/** "a hat", but "mud" and "rain". */
const named = (word: string) => (word === 'mud' || word === 'rain' ? word : `a ${word}`);

/** A letter tile she drags from the bank into a square. */
class Tile extends Container {
  readonly glow = new Graphics();
  drag: DragHandle | null = null;
  /** The square it sits in, or null in the bank. */
  square: string | null = null;
  constructor(readonly letter: string) {
    super();
    this.glow
      .roundRect(-SQ / 2 - 12, -SQ / 2 - 12, SQ + 24, SQ + 24, 26)
      .fill({ color: 0xfff3a0, alpha: 0.9 });
    this.glow.visible = false;
    this.glow.eventMode = 'none';
    const g = new Graphics()
      .roundRect(-SQ / 2 + 4, -SQ / 2 + 4, SQ - 8, SQ - 8, 18)
      .fill(cream)
      .stroke({ width: 5, color: swatch.purple.line });
    const t = label(letter.toUpperCase(), 64, ink);
    t.eventMode = 'none';
    this.addChild(this.glow, g, t);
    this.hitArea = new Rectangle(-SQ / 2, -SQ / 2, SQ, SQ);
  }
}

class Crossword implements Game {
  readonly plan: Plan;
  readonly puzzles: Puzzle[];
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The word whose squares are outlined and whose letters fill the bank. */
  active = 0;
  fills = new Map<string, string>();
  bank: Tile[] = [];
  readonly placed = new Map<string, Tile>();
  /** Every tile made, so leaving mid-animation still frees each one's window listeners. */
  private readonly tiles = new Set<Tile>();

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly grid = new Container();
  private readonly outline = new Graphics();
  private readonly hintGlow = new Graphics();
  private readonly layer = new Container();
  private readonly help = new Container();
  private readonly pictures = new Map<number, Container>();
  /** Level 4: each riddle word's speaker, until Show me or a solved word turns it into the picture. */
  private readonly speakers = new Map<number, Container>();
  /** Riddle words whose picture shows. */
  readonly revealed = new Set<number>();
  /** Level 4's Show me button: the active word's picture, for one hint. */
  readonly show = new Container();
  private wordMisses: number[] = [];
  private decoys: string[][] = [];
  private view: View;
  private readonly rng: Rng;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.rng = ctx.rng;
    this.plan = planFor(ctx.level);
    this.puzzles = makeRound(this.plan, ctx.rng);
    this.backdrop = new Backdrop(
      { sky: [0xd6efc8, 0xfff6e0], hills: [0x9fd3a8, 0x8fcf73], horizon: 0.7, clouds: 2, seed: 211 },
      ctx.view,
    );
    this.hintGlow.eventMode = 'none';
    this.outline.eventMode = 'none';
    this.board.addChild(this.hintGlow, this.grid, this.outline);
    const hb = new Graphics()
      .roundRect(-60, -50, 120, 100, 26)
      .fill(swatch.yellow.fill)
      .stroke({ width: 5, color: swatch.yellow.line });
    const q = label('?', 60, ink);
    q.eventMode = 'none';
    this.help.addChild(hb, q);
    this.help.hitArea = new Rectangle(-60, -50, 120, 100);
    onTap(this.help, () => this.useHelp(), { cooldown: 500 });
    const sb = new Graphics()
      .roundRect(-60, -50, 120, 100, 26)
      .fill(swatch.green.light)
      .stroke({ width: 5, color: swatch.green.line })
      .ellipse(0, 0, 40, 24)
      .fill(0xffffff)
      .stroke({ width: 5, color: ink })
      .circle(0, 0, 13)
      .fill(swatch.blue.fill)
      .circle(0, 0, 6)
      .fill(ink);
    this.show.addChild(sb);
    this.show.hitArea = new Rectangle(-60, -50, 120, 100);
    this.show.visible = !!this.plan.riddles;
    onTap(this.show, () => this.showMe(), { cooldown: 500 });
    ctx.stage.addChild(this.backdrop, this.board, this.help, this.show, this.layer);
  }

  get puzzle(): Puzzle | undefined {
    return this.puzzles[this.index];
  }

  start() {
    this.setPuzzle();
    void this.intro();
  }

  /** A themed round says its title first. */
  private async intro() {
    const theme = this.puzzle?.theme;
    if (theme) await this.ctx.say('cw.theme', { theme: theme.name });
    const told = this.ctx.instruct(INSTRUCT[Math.min(INSTRUCT.length, this.plan.level) - 1]);
    // A riddle round reads the first word's riddle straight away, so she never has to find the speaker first.
    if (this.plan.riddles) {
      await told;
      if (!this.revealed.has(this.active) && !this.finished)
        void this.ctx.say(riddleLine(this.puzzle!.words[this.active].word) as LineId);
    }
  }

  update() {}

  destroy() {
    for (const t of this.tiles) t.drag?.destroy();
  }

  // Layout -------------------------------------------------------------------------------

  private get upright() {
    return this.view.h > this.view.w * 1.1;
  }

  /** Level 3's bank holds up to six tiles: two columns beside the grid, or two rows below it. */
  private get wideBank() {
    return this.plan.decoys >= 2 && this.plan.blank === 'all';
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const p = this.puzzle;
    if (!p) return;
    const gw = p.w * PITCH - 4,
      gh = p.h * PITCH - 4;
    const safe = safeArea(v);
    if (this.upright) {
      this.board.position.set((v.w - gw) / 2, Math.max(160, v.h * 0.18));
      const y = this.board.y + gh + (this.wideBank ? 170 : 110);
      this.help.position.set(Math.min(v.w - 110, v.w / 2 + 300), y);
      // Show me sits just above Help, under the grid's last row.
      this.show.position.set(this.help.x, y - 112);
    } else {
      const left = safe.x + 180,
        right = v.w - (this.wideBank ? 220 : 160);
      this.board.position.set(
        Math.max(left, left + (right - left - gw) / 2),
        Math.max(144, 150 + (v.h - 190 - gh) / 2),
      );
      this.help.position.set(v.w - 90, Math.min(v.h - 80, 660));
      this.show.position.set(this.help.x, this.help.y - 116);
    }
    this.layoutBank();
    for (const [k, t] of this.placed)
      if (!t.drag?.dragging) {
        t.position.copyFrom(this.center(k));
        if (t.drag) t.drag.home = { x: t.x, y: t.y };
      }
    this.drawGlow();
  }

  /** A square's middle in stage units. */
  center(k: string) {
    const [r, c] = k.split(',').map(Number);
    return { x: this.board.x + c * PITCH + SQ / 2, y: this.board.y + r * PITCH + SQ / 2 };
  }

  private layoutBank() {
    const v = this.view;
    const n = this.bank.length;
    this.bank.forEach((t, i) => {
      if (this.upright && this.wideBank) {
        const row = Math.floor(i / 3),
          cols = Math.min(3, n - row * 3);
        t.position.set(v.w / 2 - 120 - ((cols - 1) / 2) * 112 + (i % 3) * 112, this.help.y - 54 + row * 108);
      } else if (this.upright) t.position.set(v.w / 2 - 120 - ((n - 1) / 2) * 112 + i * 112, this.help.y);
      else if (this.wideBank) t.position.set(v.w - 162 + (i % 2) * 108, 210 + Math.floor(i / 2) * 108);
      else t.position.set(v.w - 90, 210 + i * 108);
      if (t.drag) t.drag.home = { x: t.x, y: t.y };
    });
  }

  // The grid -----------------------------------------------------------------------------

  private setPuzzle() {
    const p = this.puzzle!;
    for (const t of [...this.bank, ...this.placed.values()]) this.dropTile(t);
    this.bank = [];
    this.placed.clear();
    this.fills = new Map();
    this.pictures.clear();
    this.speakers.clear();
    this.revealed.clear();
    this.grid.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.wordMisses = p.words.map(() => 0);
    this.decoys = p.words.map((_, i) => decoysFor(this.plan, p, i, this.rng));
    const letters = new Map<string, string>();
    for (const w of p.words) for (const s of squaresOf(w)) letters.set(s.key, s.letter);
    for (const [k, letter] of letters) {
      const [r, c] = k.split(',').map(Number);
      const sq = new Container();
      const blank = p.blanks.includes(k);
      sq.addChild(
        new Graphics()
          .roundRect(0, 0, SQ, SQ, 16)
          .fill(blank ? 0xfffbe6 : 0xffffff)
          .stroke({ width: blank ? 6 : 4, color: blank ? swatch.orange.line : swatch.purple.line }),
      );
      if (!blank) {
        const t = label(letter.toUpperCase(), 64, ink);
        t.position.set(SQ / 2, SQ / 2);
        sq.addChild(t);
      }
      sq.position.set(c * PITCH, r * PITCH);
      sq.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(sq, () => this.tapSquare(k), { cooldown: 300 });
      this.grid.addChild(sq);
    }
    p.words.forEach((w, i) => {
      const at = clueOf(w);
      const sq = new Container();
      sq.addChild(
        new Graphics()
          .roundRect(0, 0, SQ, SQ, 16)
          .fill(swatch.green.light)
          .stroke({ width: 4, color: swatch.green.line }),
      );
      const pic = typingPicture(w.word);
      pic.scale.set(0.36);
      pic.position.set(SQ / 2, SQ / 2 - 4);
      pic.eventMode = 'none';
      sq.addChild(pic);
      this.pictures.set(i, pic);
      if (this.plan.riddles) {
        pic.visible = false;
        const sp = new Graphics()
          .poly([-30, -12, -16, -12, 2, -28, 2, 28, -16, 12, -30, 12])
          .fill(ink)
          .moveTo(12, -20)
          .quadraticCurveTo(32, 0, 12, 20)
          .stroke({ width: 5, color: ink, cap: 'round' })
          .moveTo(20, -32)
          .quadraticCurveTo(48, 0, 20, 32)
          .stroke({ width: 5, color: ink, cap: 'round' });
        sp.position.set(SQ / 2 - 4, SQ / 2);
        sp.eventMode = 'none';
        sq.addChild(sp);
        this.speakers.set(i, sp);
      }
      // A small arrow points the way the word reads.
      const a = new Graphics();
      if (w.dir === 'across')
        a.poly([SQ - 4, SQ / 2 - 12, SQ + 10, SQ / 2, SQ - 4, SQ / 2 + 12]).fill(swatch.green.line);
      else a.poly([SQ / 2 - 12, SQ - 4, SQ / 2, SQ + 10, SQ / 2 + 12, SQ - 4]).fill(swatch.green.line);
      sq.addChild(a);
      sq.position.set(at.col * PITCH, at.row * PITCH);
      sq.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(sq, () => this.tapClue(i), { cooldown: 300 });
      this.grid.addChild(sq);
    });
    this.active = 0;
    this.board.alpha = 0;
    void this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.35 }).then(() => (this.busy = false));
    this.rebuildBank();
    this.resize(this.view);
    this.drawOutline();
  }

  private drawOutline() {
    const p = this.puzzle;
    const g = this.outline.clear();
    this.drawShow();
    if (!p || this.finished) return;
    for (const s of squaresOf(p.words[this.active]))
      g.roundRect(s.col * PITCH - 6, s.row * PITCH - 6, SQ + 12, SQ + 12, 20).stroke({
        width: 6,
        color: swatch.blue.line,
      });
    const c = clueOf(p.words[this.active]);
    g.roundRect(c.col * PITCH - 6, c.row * PITCH - 6, SQ + 12, SQ + 12, 20).stroke({
      width: 6,
      color: swatch.blue.line,
    });
  }

  /** After two misses on the active word, its next square and the tile for it glow. Free, never a hint. */
  private drawGlow() {
    const g = this.hintGlow.clear();
    for (const t of this.bank) t.glow.visible = false;
    const p = this.puzzle;
    if (!p || this.wordMisses[this.active] < 2) return;
    const s = nextFill(p, this.fills, this.active);
    if (!s) return;
    g.roundRect(s.col * PITCH - 12, s.row * PITCH - 12, SQ + 24, SQ + 24, 26).fill({
      color: 0xfff3a0,
      alpha: 0.9,
    });
    const t = this.bank.find((x) => x.letter === s.letter);
    if (t) t.glow.visible = true;
  }

  private activate(i: number) {
    if (i === this.active) return;
    this.active = i;
    this.rebuildBank();
    this.drawOutline();
  }

  private tapClue(i: number) {
    if (this.busy || this.finished) return;
    sfx.pop(4);
    this.activate(i);
    const word = this.puzzle!.words[i].word;
    if (this.plan.riddles && !this.revealed.has(i)) {
      // The riddle is free to hear again and again.
      void this.ctx.say(riddleLine(word) as LineId);
      const sp = this.speakers.get(i);
      if (sp)
        void this.ctx.tw
          .to(sp.scale, { x: 1.2, y: 1.2 }, { duration: 0.12 })
          .then(() => this.ctx.tw.to(sp.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }));
      return;
    }
    void this.ctx.say('cw.word', { word });
    this.bounce(i);
  }

  /** A riddle word's speaker turns into its picture. */
  private reveal(i: number) {
    if (!this.plan.riddles || this.revealed.has(i)) return;
    this.revealed.add(i);
    const sp = this.speakers.get(i),
      pic = this.pictures.get(i);
    if (sp) sp.visible = false;
    if (pic) pic.visible = true;
    this.drawShow();
  }

  /** Show me is lit only while the active word's picture is still hidden. */
  private drawShow() {
    this.show.alpha = this.plan.riddles && !this.revealed.has(this.active) && !this.finished ? 1 : 0.4;
  }

  /** Level 4: Show me turns the active word's speaker into its picture and says the word. One hint, once per word. */
  showMe() {
    const p = this.puzzle;
    if (!p || !this.plan.riddles || this.busy || this.finished) return;
    // Already shown: it says the word again, free.
    if (this.revealed.has(this.active))
      return void this.ctx.say('cw.word', { word: p.words[this.active].word });
    this.hints++;
    sfx.pop(4);
    const i = this.active;
    this.reveal(i);
    this.bounce(i);
    void this.ctx.say('cw.word', { word: p.words[i].word });
  }

  /** Tapping a square makes its word active; tapping a crossing again switches to the other word. */
  private tapSquare(k: string) {
    if (this.busy || this.finished) return;
    const p = this.puzzle!;
    const ws = wordsAt(p.words, k);
    const at = ws.indexOf(this.active);
    this.activate(at >= 0 ? ws[(at + 1) % ws.length] : ws[0]);
    const letter =
      this.fills.get(k) ??
      (p.blanks.includes(k) ? undefined : squaresOf(p.words[ws[0]]).find((s) => s.key === k)!.letter);
    if (letter) void this.ctx.say('cw.letter', { letter: letter.toUpperCase() });
    sfx.pop(5);
  }

  // Tiles --------------------------------------------------------------------------------

  private makeTile(letter: string) {
    const t = new Tile(letter);
    t.drag = draggable(t, this.ctx.tw, { onPick: () => this.pick(t), onDrop: (x, y) => this.drop(t, x, y) });
    this.layer.addChild(t);
    this.tiles.add(t);
    return t;
  }

  private dropTile(t: Tile) {
    this.tiles.delete(t);
    t.drag?.destroy();
    t.destroy({ children: true });
  }

  /** The bank holds the active word's missing letters and the decoys, in a seeded order. */
  private rebuildBank() {
    const p = this.puzzle;
    if (!p) return;
    if (this.bank.some((t) => t.drag?.dragging)) return;
    const letters = wordRight(p, this.fills, this.active)
      ? []
      : bankFor(p, this.fills, this.active, this.decoys[this.active]);
    // The same letters stay put rather than popping again.
    const same = (a: string[]) => [...a].sort().join('');
    if (this.bank.length && same(letters) === same(this.bank.map((t) => t.letter))) return this.drawGlow();
    for (const t of this.bank) this.dropTile(t);
    this.bank = new Rng(this.index * 97 + this.active * 13 + letters.length).shuffle(
      letters.map((l) => this.makeTile(l)),
    );
    this.layoutBank();
    for (const t of this.bank) {
      t.scale.set(0);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    }
    this.drawGlow();
  }

  private pick(t: Tile) {
    sfx.pop(6);
    // A tile in a square makes its word active, as tapping the square would.
    if (t.square && !this.busy) {
      const ws = wordsAt(this.puzzle!.words, t.square);
      if (!ws.includes(this.active)) this.activate(ws[0]);
    }
    void this.ctx.say('cw.letter', { letter: t.letter.toUpperCase() });
  }

  private drop(t: Tile, x: number, y: number): boolean {
    const p = this.puzzle;
    if (!p || this.busy || this.finished) return false;
    const open = p.blanks.filter((k) => !this.locked(k)).map((k) => ({ key: k, ...this.center(k) }));
    // The tile rides above the finger, so either the tile or the finger over a square counts.
    const target = nearest(open, x, y, REACH) ?? nearest(open, x, y + 40, REACH);
    const from = t.square;
    if (!target) {
      if (!from) return false;
      // Dragged out of its square: back to the bank.
      this.placed.delete(from);
      this.fills.delete(from);
      this.dropTile(t);
      this.rebuildBank();
      return true;
    }
    if (target.key === from) return false;
    const other = this.placed.get(target.key);
    if (other) {
      // The tile already there goes back to the bank.
      this.placed.delete(target.key);
      other.eventMode = 'none';
      void this.ctx.tw.to(other, { alpha: 0 }, { duration: 0.2 }).then(() => this.dropTile(other));
    }
    if (from) {
      this.placed.delete(from);
      this.fills.delete(from);
    } else this.bank = this.bank.filter((b) => b !== t);
    this.place(t, target.key);
    this.afterFill(target.key);
    return true;
  }

  /** A square of a word already solved keeps its letter. */
  private locked(k: string) {
    const p = this.puzzle!;
    return wordsAt(p.words, k).some((i) => wordRight(p, this.fills, i)) && this.fills.get(k) !== undefined;
  }

  private place(t: Tile, k: string) {
    t.square = k;
    t.glow.visible = false;
    this.placed.set(k, t);
    this.fills.set(k, t.letter);
    const c = this.center(k);
    if (t.drag) t.drag.home = { ...c };
    void this.ctx.tw.to(t, { x: c.x, y: c.y }, { duration: 0.2, ease: ease.outBack });
    sfx.squish();
    const p = this.puzzle!;
    const ws = wordsAt(p.words, k);
    if (!ws.includes(this.active)) this.active = ws[0];
  }

  /** Judges the words the square finished: one miss for the fill, however many words it got wrong. */
  private afterFill(k: string) {
    const p = this.puzzle!;
    const j = judge(p, this.fills, k);
    if (j.wrong.length) {
      this.misses++;
      sfx.boing();
      for (const i of j.wrong) {
        this.wordMisses[i]++;
        const said = spelled(p, this.fills, i);
        for (const s of wrongSquares(p, this.fills, i)) {
          const t = this.placed.get(s);
          this.placed.delete(s);
          this.fills.delete(s);
          if (t) {
            t.drag!.enabled = false;
            t.eventMode = 'none';
            void this.ctx.tw
              .to(t, { y: t.y - 50, alpha: 0 }, { duration: 0.35 })
              .then(() => this.dropTile(t));
          }
        }
        if (i === j.wrong[0])
          void this.ctx.say(this.plan.riddles ? 'cw.spellsRiddle' : 'cw.spells', {
            spelled: said,
            word: named(p.words[i].word),
          });
      }
      this.active = j.wrong[0];
    }
    for (const i of j.right) this.lockWord(i);
    if (j.right.length) void this.celebrate(j.right);
    else this.settle();
  }

  private lockWord(i: number) {
    for (const s of squaresOf(this.puzzle!.words[i])) {
      const t = this.placed.get(s.key);
      if (t?.drag) t.drag.enabled = false;
      // A solved letter lets touches through to its square, which says the letter and switches words.
      if (t) t.eventMode = 'none';
    }
  }

  /** Picks the next word to work on, refreshes the bank and outline. */
  private settle() {
    const p = this.puzzle!;
    if (wordRight(p, this.fills, this.active)) {
      const open = firstOpen(p, this.fills);
      if (open >= 0) this.active = open;
    }
    this.rebuildBank();
    this.drawOutline();
  }

  private bounce(i: number) {
    const pic = this.pictures.get(i);
    if (!pic) return;
    void this.ctx.tw
      .to(pic.scale, { x: 0.44, y: 0.44 }, { duration: 0.15, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(pic.scale, { x: 0.36, y: 0.36 }, { duration: 0.25, ease: ease.outBack }));
    for (const c of pic.children) if (c instanceof Critter) c.cheer();
  }

  private async celebrate(words: number[]) {
    const p = this.puzzle!;
    const done = solved(p, this.fills);
    if (done) this.busy = true;
    this.settle();
    for (const i of words) {
      this.reveal(i);
      this.bounce(i);
      const at = this.center(squaresOf(p.words[i])[1].key);
      this.ctx.particles.burst(at.x, at.y, {
        kind: 'star',
        colors: [0xffffff, 0xfff3a0, swatch.orange.light],
        count: 14,
        speed: [100, 260],
        gravity: 0,
        life: [0.5, 0.9],
      });
    }
    sfx.sparkle();
    for (const i of words) {
      const w = p.words[i].word;
      await this.ctx.say('cw.spellout', { letters: w.toUpperCase().split('').join(', '), word: w });
    }
    if (!done || this.finished) return;
    sfx.tada();
    this.outline.clear();
    await this.ctx.tw.wait(0.5);
    this.index++;
    if (!this.puzzle) return void this.end();
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    this.setPuzzle();
    void this.ctx.say('cw.next');
  }

  /** Help puts one right letter in the active word, preferring a crossing, after clearing wrong tiles. One hint each time. */
  useHelp() {
    const p = this.puzzle;
    if (!p || this.busy || this.finished) return;
    if (this.bank.some((t) => t.drag?.dragging)) return;
    if (wordRight(p, this.fills, this.active)) this.active = Math.max(0, firstOpen(p, this.fills));
    const h = helpFor(p, this.fills, this.active);
    if (!h) return;
    this.hints++;
    const next = applyHelp(this.fills, h);
    for (const k of [...h.clear, h.key]) {
      const t = this.placed.get(k);
      if (t) {
        this.placed.delete(k);
        this.dropTile(t);
      }
    }
    this.fills = next;
    const t = this.makeTile(h.letter);
    t.position.copyFrom(this.help.position);
    this.place(t, h.key);
    void this.ctx.say('cw.letter', { letter: h.letter.toUpperCase() });
    this.afterFill(h.key);
  }

  /**
   * The ghost finger: with the active word solved, it taps the next open word's picture; otherwise it carries the right tile to
   * the word's first empty square.
   */
  autotouch(): TouchIntent | null {
    const p = this.puzzle;
    if (!p || this.busy || this.finished) return null;
    if (wordRight(p, this.fills, this.active)) {
      const open = firstOpen(p, this.fills);
      if (open < 0) return null;
      const c = clueOf(p.words[open]);
      return { tap: { on: this.grid, x: c.col * PITCH + SQ / 2, y: c.row * PITCH + SQ / 2 } };
    }
    const s = nextFill(p, this.fills, this.active);
    if (!s) return null;
    const t = this.bank.find((x) => x.letter === s.letter && !x.drag?.dragging);
    if (!t) return null;
    const c = this.center(s.key);
    return { drag: { on: t }, to: { on: this.layer, x: c.x, y: c.y } };
  }

  /** The active word's first empty square and its letter (for scripted checks). */
  nextSquare() {
    return nextFill(this.puzzle!, this.fills, this.active);
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.ctx.pet.cheer();
    await this.ctx.say('cw.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** Two crossing words of squares with a cat at one head. */
function miniGrid(): Container {
  const c = new Container();
  const g = new Graphics();
  const sq = (x: number, y: number, fill: number) =>
    g
      .roundRect(x - 34, y - 34, 68, 68, 12)
      .fill(fill)
      .stroke({ width: 4, color: swatch.purple.line });
  for (let i = 0; i < 3; i++) sq(-36 + i * 72, 0, 0xffffff);
  for (const y of [-72, 72]) sq(36, y, 0xffffff);
  g.roundRect(-142, -34, 68, 68, 12).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line });
  c.addChild(g);
  const cat = typingPicture('cat');
  cat.scale.set(0.24);
  cat.position.set(-108, -2);
  const a = label('A', 46, ink);
  a.position.set(36, 0);
  c.addChild(cat, a);
  c.y = -40;
  return c;
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-80, -80, 160, 160, 24)
      .fill(0xffffff)
      .stroke({ width: 7, color: swatch.purple.line }),
  );
  const pic = typingPicture(rng.pick([...WORDS_1]));
  pic.scale.set(0.55);
  c.addChild(pic);
  return c;
}

export const crossword: GameModule = {
  id: 'crossword',
  name: 'Crossword',
  titleLine: 'game.crossword',
  region: 'story-grove',
  challenge: 'words',
  skills: ['spelling', 'letters', 'vocabulary'],
  bands: ['prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Say the word slowly together while {name} finds the letter that fits.',
  offScreen: 'Think of a word that starts with the last letter of mine.',
  hubIcon: () => new WigglyIcon(miniGrid()),
  sticker,
  create: (ctx) => (planFor(ctx.level).grown ? new GrownCrossword(ctx) : new Crossword(ctx)),
};
