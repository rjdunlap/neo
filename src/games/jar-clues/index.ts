import { Container, Graphics, Rectangle, type FederatedPointerEvent, type Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { JAR_OUTER, drawCard, drawCross, drawFlag, drawJar, tenLabelAt } from './art';
import { boardBox, cardBoxes, cellBox, layout, numberAt, type Box, type Layout } from './layout';
import {
  BOT_GUESS,
  LEVELS,
  Misses,
  NUMBERS,
  clueLine,
  describeLevel,
  fault,
  faultLine,
  fresh,
  hint,
  hintLine,
  holds,
  lastStanding,
  makeBoard,
  marksKey,
  nearestByEye,
  pile,
  planFor,
  rowOf,
  sweepRun,
  toggled,
  wrongNumbers,
  type Board,
  type Hint,
  type Marks,
  type Pebble,
} from './logic';

const line = (id: string) => id as LineId;

/** `guess`: plant the first guess; `clues`: cross off; `last`: choose a card; `reveal`: the jar pours and is counted. */
type Phase = 'guess' | 'clues' | 'last' | 'reveal' | 'done';

const NOTE_GUESS = 'About how many? Tap your first guess on the board, then press First clue.';
const NOTE_CLUE =
  'Cross off every number the clue rules out (tap, or sweep along a row), then press Next clue.';

/** Seconds between rows of ten in the count, and between the ones after them. */
const TEN_PACE = 0.45;
const ONE_PACE = 0.22;

/** A box drawn as a button: a rounded card with a wood edge. */
function card(g: Graphics, b: Box, fill: number, edge: number = wood.line, width = 4) {
  g.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 20)
    .fill(fill)
    .stroke({ width, color: edge });
}

/** A finger on the board: the state its stroke gives every number it passes, and where it last was. */
interface Stroke {
  id: number;
  crossed: boolean;
  last: { x: number; y: number };
}

class JarClues implements Game {
  readonly level: number;
  readonly board: Board;
  readonly pebbles: Pebble[];
  phase: Phase = 'guess';
  finished = false;
  /** Clues shown so far. */
  shown = 0;
  marks: Marks = fresh();
  guess: number | null = null;
  chosen: number | null = null;
  /** The number a fault lit, and the hint showing with the board it was given on. */
  faultN: number | null = null;
  hintNow: (Hint & { at: string }) | null = null;
  /** The pebbles poured into the tray so far, in the reveal. */
  poured = 0;
  private readonly score = newTally();
  private readonly counted = new Misses();
  private gen = 0;
  private L: Layout;
  private clock = 0;
  /** The note's words; null shows the default for the phase (what to do, or the earlier clues). */
  private noteText: string | null = null;
  private stroke: Stroke | null = null;
  private readonly backdrop: Backdrop;
  private readonly chrome = new Graphics();
  private readonly jarArt = new Graphics();
  private readonly boardArt = new Graphics();
  private readonly marksArt = new Graphics();
  private readonly glow = new Graphics();
  private readonly texts = new Container();
  private readonly numbers: Text[] = [];
  private readonly note: Text = label('', 24);
  private readonly clueText: Text = label('', 30);
  /** The touch layer over the board: taps and sweeps. */
  readonly pad = new Container();
  readonly clueCard = new Container();
  readonly help = new Container();
  readonly next = new Container();
  readonly cards: Container[] = [0, 1, 2].map(() => new Container());

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).level;
    this.board = makeBoard(this.level, ctx.rng);
    this.pebbles = pile(this.board.count, new Rng(ctx.rng.int(1, 2 ** 30)));
    this.backdrop = new Backdrop(
      {
        sky: [0xd9c8f2, 0xffe9c4],
        hills: [0xb9c8f2, 0x9ed6d8, 0xa8dc8f],
        horizon: 0.3,
        clouds: 1,
        sun: false,
        seed: 223,
      },
      ctx.view,
    );
    this.L = layout(ctx.view);
    for (const g of [this.chrome, this.jarArt, this.boardArt, this.marksArt, this.glow]) g.eventMode = 'none';
    this.texts.eventMode = 'none';
    for (const t of [this.note, this.clueText]) {
      t.eventMode = 'none';
      t.style.wordWrap = true;
    }
    this.note.style.fontWeight = '500';
    for (const n of NUMBERS) {
      const t = label(String(n), 30);
      t.eventMode = 'none';
      this.numbers.push(t);
    }
    this.pad.eventMode = 'static';
    this.pad.on('pointerdown', this.onDown);
    this.pad.on('globalpointermove', this.onMove);
    this.pad.on('pointerup', this.onUp);
    this.pad.on('pointerupoutside', this.onUp);
    // Pixi does not pass the DOM's pointercancel on: a stroke a system gesture swallows ends here.
    ctx.listen(window, 'pointercancel', () => (this.stroke = null), { capture: true });
    onTap(this.clueCard, () => this.rehear());
    onTap(this.help, () => this.askForHint());
    onTap(this.next, () => this.pressNext());
    this.cards.forEach((c, i) => onTap(c, () => this.choose(i)));
    ctx.stage.addChild(
      this.backdrop,
      this.chrome,
      this.jarArt,
      this.boardArt,
      ...this.numbers,
      this.marksArt,
      this.glow,
      this.texts,
      this.note,
      this.clueText,
      this.pad,
      this.clueCard,
      this.help,
      this.next,
      ...this.cards,
    );
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.level,
      phase: this.phase,
      count: this.board.count,
      clues: this.board.clues.map((c) => c.words),
      shown: this.shown,
      guess: this.guess,
      chosen: this.chosen,
      crossed: NUMBERS.filter((n) => this.marks[n - 1]),
      wrong: this.phase === 'clues' ? wrongNumbers(this.board, this.shown, this.marks) : [],
      last: lastStanding(this.board),
      misses: this.score.misses,
      hints: this.score.hints,
      hint: this.hintNow ? { row: this.hintNow.row, lit: this.hintNow.lit.slice() } : null,
      fault: this.faultN,
      note: this.noteNow(),
      finished: this.finished,
    };
  }

  start() {
    void this.ctx.instruct(line('jarclues.start'));
  }

  destroy() {
    this.finished = true;
    this.stroke = null;
    this.gen++;
  }

  // ---- the board: the guess, crossing off and sweeping ----

  private onDown = (e: FederatedPointerEvent) => {
    if (this.finished || palmOnGlass()) return;
    // A release that never arrived must not freeze the board: a new first finger starts afresh.
    if (this.stroke) {
      if (!e.isPrimary) return;
      this.stroke = null;
    }
    const p = this.pad.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const n = numberAt(this.L, p.x, p.y);
    if (n === null) return;
    if (this.phase === 'guess') return this.plant(n);
    if (this.phase !== 'clues') return;
    const crossed = !this.marks[n - 1];
    this.stroke = { id: e.pointerId, crossed, last: { x: p.x, y: p.y } };
    this.mark(n, crossed);
  };

  private onMove = (e: FederatedPointerEvent) => {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id || this.phase !== 'clues') return;
    const p = this.pad.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    // Every number the finger passes takes the stroke's state, even when a quick sweep skips a frame.
    const step = this.L.board.cell / 4;
    const dx = p.x - s.last.x,
      dy = p.y - s.last.y;
    const k = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
    for (let i = 1; i <= k; i++) {
      const n = numberAt(this.L, s.last.x + (dx * i) / k, s.last.y + (dy * i) / k);
      if (n !== null) this.mark(n, s.crossed);
    }
    s.last = { x: p.x, y: p.y };
  };

  private onUp = (e: FederatedPointerEvent) => {
    if (this.stroke && e.pointerId === this.stroke.id) this.stroke = null;
  };

  private plant(n: number) {
    sfx.pop(4);
    this.guess = n;
    this.draw();
  }

  private mark(n: number, crossed: boolean) {
    if (this.marks[n - 1] === crossed) return;
    this.marks = toggled(this.marks, n, crossed);
    this.faultN = null;
    if (crossed) sfx.tick();
    else sfx.pop(6);
    this.draw();
  }

  // ---- the clues and the check ----

  private get current() {
    return this.board.clues[this.shown - 1];
  }

  /** The clue card: the clue again, and the note back to the earlier clues. */
  private rehear() {
    if (this.phase === 'clues' && this.noteText !== null) {
      this.noteText = null;
      this.draw();
    }
    if (this.phase === 'clues' && this.current) void this.ctx.say(line(clueLine(this.current)));
    else if (this.phase === 'guess') void this.ctx.say(line('jarclues.guess'));
    else if (this.phase === 'last') void this.ctx.say(line('jarclues.last'));
  }

  /** First clue, Next clue or Last look. */
  pressNext() {
    if (this.finished) return;
    if (this.phase === 'guess') {
      if (this.guess === null) {
        sfx.tick();
        void this.ctx.say(line('jarclues.guess'));
        return;
      }
      return this.nextClue();
    }
    if (this.phase !== 'clues') return;
    if (!holds(this.board, this.shown, this.marks)) return this.wrongBoard();
    if (this.shown < this.board.clues.length) this.nextClue();
    else this.lastLook();
  }

  private nextClue() {
    sfx.pluck(3 + this.shown, 0.3);
    this.phase = 'clues';
    this.shown++;
    this.faultN = null;
    this.hintNow = null;
    this.noteText = null;
    this.draw();
    void this.ctx.say(line(clueLine(this.current)));
  }

  /** A board that does not hold: a boing and the lowest wrong number with a true reason. One miss per distinct board at a clue. */
  private wrongBoard() {
    const f = fault(this.board, this.shown, this.marks)!;
    const due = this.counted.count(this.shown, this.marks) && missEvery(this.score);
    sfx.boing();
    this.faultN = f.n;
    this.hintNow = null;
    this.noteText = f.words;
    this.draw();
    const g = this.gen;
    const at = this.boardKey();
    void this.ctx
      .say(line(faultLine(f)))
      .then(() => (g === this.gen ? this.ctx.say(line(clueLine(f.clue ?? this.current))) : undefined))
      .then(() => {
        // The second counted miss brings one assisted hint, for the board it was earned on.
        if (due && g === this.gen && this.phase === 'clues' && this.boardKey() === at) this.showHint();
      });
  }

  private boardKey() {
    return `${this.shown}:${marksKey(this.marks)}`;
  }

  // ---- hints ----

  readonly hintLabel = 'Help';

  /** The lowest row with a wrong number: its wrong numbers lit and the working. A new hint counts once; a repeat is free. */
  private showHint() {
    const at = this.boardKey();
    const h = hint(this.board, this.shown, this.marks);
    if (!h) {
      this.hintNow = null;
      this.noteText = 'This board fits the clue. Ask for the next one.';
      this.draw();
      void this.ctx.say(line(hintLine(null)));
      return;
    }
    if (this.hintNow?.at !== at) {
      hinted(this.score);
      this.hintNow = { ...h, at };
    }
    this.faultN = null;
    this.noteText = this.hintNow.words;
    this.draw();
    // The hint's line, then the clue's own while the numbers are lit.
    const g = this.gen;
    void this.ctx
      .say(line(hintLine(this.hintNow)))
      .then(() =>
        g === this.gen && this.phase === 'clues' ? this.ctx.say(line(clueLine(this.current))) : undefined,
      );
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.finished) return;
    sfx.tick();
    if (this.phase === 'guess') return void this.ctx.say(line('jarclues.guess'));
    if (this.phase === 'clues') this.showHint();
  }

  // ---- the last look and the reveal ----

  private lastLook() {
    sfx.sparkle();
    this.phase = 'last';
    this.faultN = null;
    this.hintNow = null;
    this.noteText = 'The clues have run out. Look at the jar: which one does it hold?';
    this.draw();
    void this.ctx.say(line('jarclues.last'));
  }

  /** A card is chosen: a judgement, never a miss. */
  choose(i: number) {
    const ns = lastStanding(this.board);
    if (this.phase !== 'last' || i >= ns.length) return;
    sfx.pop(8);
    this.chosen = ns[i];
    void this.reveal(++this.gen);
  }

  private async reveal(g: number) {
    this.phase = 'reveal';
    this.draw();
    await this.ctx.tw.wait(0.5);
    const count = this.board.count;
    // Rows of ten first, one note each, then the ones.
    while (this.poured + 10 <= count) {
      if (g !== this.gen) return;
      this.poured += 10;
      sfx.bell(1 + this.poured / 10, 0.3);
      this.noteText = `${this.poured}`;
      this.draw();
      await this.ctx.tw.wait(TEN_PACE);
    }
    while (this.poured < count) {
      if (g !== this.gen) return;
      this.poured++;
      sfx.pop(4 + (this.poured % 5));
      this.noteText = `${this.poured}`;
      this.draw();
      await this.ctx.tw.wait(ONE_PACE);
    }
    if (g !== this.gen) return;
    const close = this.guess !== null && Math.abs(this.guess - count) <= 5;
    this.noteText = `Your first guess was ${this.guess}. You chose ${this.chosen}. The jar holds ${count}.${
      close ? ' Close from the start.' : ''
    }`;
    this.phase = 'done';
    this.finished = true;
    this.draw();
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say(line('jarclues.holds'));
    if (g !== this.gen) return;
    if (close) await this.ctx.say(line('jarclues.close'));
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.6);
    if (g !== this.gen) return;
    this.ctx.finish(tally(this.score));
  }

  // ---- drawing ----

  /** What the note says: its words, or the phase's default (the earlier clues, one per line, once there are any). */
  private noteNow() {
    if (this.noteText !== null) return this.noteText;
    if (this.phase === 'guess') return NOTE_GUESS;
    const earlier = this.board.clues.slice(0, this.shown - 1);
    if (!earlier.length) return NOTE_CLUE;
    return earlier.map((c, i) => `${i + 1}. ${c.words}.`).join('\n');
  }

  private nextLabel() {
    if (this.phase === 'guess') return 'First clue';
    return this.shown < this.board.clues.length ? 'Next clue' : 'Last look';
  }

  private draw() {
    const L = this.L;
    const c = this.chrome.clear();
    for (const t of this.texts.removeChildren()) t.destroy();
    const text = (s: string, size: number, x: number, y: number, color = ink, maxW = Infinity) => {
      const t = label(s, size, color);
      if (t.width > maxW) t.scale.set(maxW / t.width);
      t.position.set(x, y);
      this.texts.addChild(t);
      return t;
    };
    const wrap = (t: Text, b: Box, pad = 14) => {
      t.style.wordWrapWidth = b.w - 2 * pad;
      t.scale.set(1);
      if (t.height > b.h - 10) t.scale.set((b.h - 10) / t.height);
      t.position.set(b.x, b.y);
    };

    // The jar.
    const jb = L.jar;
    c.roundRect(jb.x - jb.w / 2, jb.y - jb.h / 2, jb.w, jb.h, 24)
      .fill({ color: cream, alpha: 0.9 })
      .stroke({ width: 3, color: wood.light });
    const k = Math.min((jb.w - 16) / JAR_OUTER.w, (jb.h - 16) / JAR_OUTER.h);
    const tenLine = planFor(this.level).tenLine;
    this.jarArt.clear();
    drawJar(this.jarArt, jb.x, jb.y, k, this.pebbles, tenLine, this.poured > 0);
    if (tenLine) {
      const p = tenLabelAt(jb.x, jb.y, k);
      text('10', Math.round(20 * k), p.x, p.y, swatch.red.line);
    }

    // The clue card, the earlier clues and the note.
    const last = this.phase === 'last' || this.phase === 'reveal' || this.phase === 'done';
    const cb = L.clue;
    const showClueCard = !(last && L.upright);
    this.clueCard.visible = showClueCard;
    if (showClueCard) {
      card(c, cb, this.phase === 'clues' ? 0xffffff : 0xf6f1e6, swatch.purple.line, 4);
      if (this.phase === 'clues')
        text(`Clue ${this.shown} of ${this.board.clues.length}`, 18, cb.x, cb.y - cb.h / 2 + 16, 0x6b6b78);
      this.clueText.text =
        this.phase === 'guess'
          ? 'About how many?'
          : this.phase === 'clues'
            ? `${this.current.words}.`
            : 'Which one?';
      wrap(this.clueText, { ...cb, y: cb.y + 8, h: cb.h - 26 });
      this.clueText.visible = true;
    } else this.clueText.visible = false;
    const nb = L.note;
    c.roundRect(nb.x - nb.w / 2, nb.y - nb.h / 2, nb.w, nb.h, 18)
      .fill({ color: 0xfffbea, alpha: 0.96 })
      .stroke({ width: 3, color: wood.light });
    this.note.text = this.noteNow();
    wrap(this.note, nb);

    // The board: its cells and numbers; crossed numbers carry a cross and fade.
    const b = this.boardArt.clear();
    const m = this.marksArt.clear();
    const bb = boardBox(L);
    const cell = L.board.cell;
    b.roundRect(bb.x - bb.w / 2 - 6, bb.y - bb.h / 2 - 6, bb.w + 12, bb.h + 12, 16)
      .fill({ color: cream, alpha: 0.95 })
      .stroke({ width: 4, color: wood.line });
    const standing = new Set(lastStanding(this.board));
    const lit = new Set(
      this.hintNow && this.phase === 'clues'
        ? this.hintNow.lit.filter((n) => wrongNumbers(this.board, this.shown, this.marks).includes(n))
        : [],
    );
    for (const n of NUMBERS) {
      const x = cellBox(L, n);
      const crossed = this.marks[n - 1];
      const inTray = this.poured >= n;
      const faded = crossed || (last && !standing.has(n));
      b.roundRect(x.x - cell / 2 + 2, x.y - cell / 2 + 2, cell - 4, cell - 4, 8).fill(
        inTray ? 0xf3e9d6 : faded ? 0xeee9e0 : rowOf(n) % 2 ? 0xffffff : 0xfbf8f1,
      );
      const t = this.numbers[n - 1];
      t.position.set(x.x, x.y);
      t.alpha = inTray ? 0.25 : faded ? 0.35 : 1;
      if (inTray) {
        // The pour: a pebble in each cell up to the count, so the tray reads as rows of ten.
        const tone = [swatch.white.line, swatch.brown.fill, swatch.teal.line][n % 3];
        m.ellipse(x.x, x.y, cell * 0.3, cell * 0.25)
          .fill(tone)
          .stroke({ width: 2, color: 0x5b5b6b });
      } else if (crossed && !last) drawCross(m, x.x, x.y, cell);
      if (lit.has(n) || this.faultN === n)
        m.circle(x.x, x.y, cell * 0.44).stroke({ width: 5, color: swatch.yellow.line });
      if (this.guess === n) drawFlag(m, x.x, x.y, cell);
    }

    // The last look's cards, beside the jar.
    const ns = lastStanding(this.board);
    const boxes = cardBoxes(L, ns.length);
    this.cards.forEach((node, i) => {
      const on = last && i < ns.length;
      node.visible = on;
      if (!on) return;
      const cbx = boxes[i];
      node.hitArea = new Rectangle(cbx.x - cbx.w / 2, cbx.y - cbx.h / 2, cbx.w, cbx.h);
      drawCard(c, cbx.x, cbx.y, cbx.w, cbx.h, this.chosen === ns[i]);
      text(String(ns[i]), Math.min(64, cbx.h * 0.45), cbx.x, cbx.y, ink);
    });
    if (last && !L.upright) {
      // Sideways the cards stand over the faded board.
      b.roundRect(bb.x - bb.w / 2, bb.y - bb.h / 2, bb.w, bb.h, 12).fill({
        color: cream,
        alpha: this.poured > 0 ? 0 : 0.7,
      });
      this.cards.forEach((node) => (node.visible &&= this.poured === 0 && this.phase === 'last'));
    }

    // Help and the next button.
    const nextOn = this.phase === 'guess' ? this.guess !== null : this.phase === 'clues';
    card(
      c,
      L.help,
      this.phase === 'clues' || this.phase === 'guess' ? swatch.yellow.fill : 0xf2efe8,
      wood.line,
      4,
    );
    text('Help', 30, L.help.x, L.help.y, ink, L.help.w - 20);
    card(
      c,
      L.next,
      nextOn ? swatch.teal.light : 0xf2efe8,
      nextOn ? swatch.teal.line : wood.light,
      nextOn ? 6 : 3,
    );
    text(this.nextLabel(), 32, L.next.x, L.next.y, nextOn ? ink : 0x9c98a6, L.next.w - 20);
  }

  resize(view: View) {
    this.L = layout(view);
    const L = this.L;
    this.backdrop.resize(view);
    const hit = (node: Container, b: Box) =>
      (node.hitArea = new Rectangle(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h));
    hit(this.pad, boardBox(L));
    hit(this.clueCard, L.clue);
    hit(this.help, L.help);
    hit(this.next, L.next);
    for (const t of this.numbers) t.style.fontSize = Math.round(L.board.cell * 0.42);
    this.stroke = null;
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.phase === 'guess' && this.guess !== null) {
      // First clue breathes once a guess is planted.
      const b = this.L.next;
      const t = 5 + 3 * Math.sin(this.clock * 4);
      this.glow
        .roundRect(b.x - b.w / 2 - t, b.y - b.h / 2 - t, b.w + 2 * t, b.h + 2 * t, 24)
        .stroke({ width: 5, color: swatch.teal.fill, alpha: 0.7 });
    }
  }

  // ---- the ghost finger ----

  /** Where a number's cell is, in the touch layer's (the stage's) coordinates. */
  spotOf(n: number) {
    const b = cellBox(this.L, n);
    return { on: this.pad, x: b.x, y: b.y };
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.stroke) return null;
    const at = (b: Box) => ({ x: b.x, y: b.y });
    if (this.phase === 'guess') {
      if (this.guess === null) return { tap: this.spotOf(BOT_GUESS) };
      return { tap: { on: this.next, ...at(this.L.next) } };
    }
    if (this.phase === 'last') {
      const i = lastStanding(this.board).indexOf(nearestByEye(this.board));
      return { tap: { on: this.cards[i], ...at(cardBoxes(this.L, lastStanding(this.board).length)[i]) } };
    }
    if (this.phase !== 'clues') return null;
    const run = sweepRun(this.board, this.shown, this.marks);
    if (!run) return { tap: { on: this.next, ...at(this.L.next) } };
    if (run.length === 1) return { tap: this.spotOf(run[0]), pause: 0.3 };
    return { trace: this.spotOf(run[0]), via: run.slice(1).map((n) => this.spotOf(n)), pause: 0.3 };
  }
}

/** The hub icon: a jar of pebbles beside three number cards, one of them ringed. */
function icon(): Container {
  const c = new Container();
  const g = new Graphics();
  const rng = new Rng(17);
  drawJar(g, -60, -120, 0.48, pile(34, rng), false);
  for (const [i, n] of [22, 34, 46].entries()) {
    const y = -175 + i * 50;
    g.roundRect(20, y - 20, 70, 40, 10)
      .fill(cream)
      .stroke({ width: 4, color: wood.line });
    if (n === 34) g.roundRect(14, y - 26, 82, 52, 14).stroke({ width: 5, color: swatch.yellow.line });
  }
  c.addChild(g);
  for (const [i, n] of [22, 34, 46].entries()) {
    const t = label(String(n), 26);
    t.position.set(55, -175 + i * 50);
    c.addChild(t);
  }
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const g = new Graphics();
  drawJar(g, -20, 6, 0.72, pile(12 + (seed % 45), new Rng(seed + 5)), true);
  drawFlag(g, 84, -70, 90);
  c.addChild(g);
  return c;
}

export const game: GameModule = {
  id: 'jar-clues',
  name: 'Jar Clues',
  titleLine: 'game.jar-clues',
  region: 'counting-cove',
  challenge: 'logic',
  skills: ['estimating an amount by eye', 'applying a number clue to a whole board', 'odd, even and digits'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'Before the first clue, each of you says a number that is surely too low and one that is surely too high; then one reads the clues aloud and the other crosses off.',
  offScreen:
    'Guess how many spoons are in the drawer or books on a shelf, write three clues about the real count for someone else ("an odd number", "more than 20", "the digits add to 9"), then count together. Use large household things, never small pieces near a young child.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  upright: true,
  touchDemo: true,
  create: (ctx) => new JarClues(ctx),
};
