import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { typingPicture } from '../../art/word-pictures';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { isParentPanelOpen } from '../../parent/panel';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { markArt } from '../secret-code/marks';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { wordLayout, type WordLayout } from './layout';
import {
  LEVELS,
  OPENER,
  ORDINALS,
  absentLetters,
  bestMarks,
  consistent,
  describeLevel,
  hintFor,
  ignoredMarks,
  pickAnswer,
  planFor,
  schoolSet,
  score,
  solverTries,
  visibleTries,
  type Mark,
  type Try,
  type WordPlan,
} from './logic';
import { ANSWERS, GUESSES } from './words';

const FILL: Record<Mark, number> = { green: swatch.green.fill, yellow: swatch.yellow.fill, gray: 0xc9ccd6 };
const LINE: Record<Mark, number> = { green: swatch.green.line, yellow: swatch.yellow.line, gray: 0x9ea2b3 };

/** A letter tile, blank, faint (a hint) or marked, with Secret Code's mark badge in the corner so a mark never rests on hue alone. */
function tileArt(size: number, letter: string, mark: Mark | null, faint = false): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, size * 0.18)
    .fill(mark ? FILL[mark] : 0xffffff)
    .stroke({ width: 5, color: mark ? LINE[mark] : faint ? swatch.teal.line : 0xc9ccd6 });
  c.addChild(g);
  if (letter) {
    const t = label(letter, size * 0.58, mark === 'gray' ? 0x555b70 : ink);
    t.anchor.set(0.5);
    t.alpha = faint ? 0.4 : 1;
    c.addChild(t);
  }
  if (mark) {
    const m = markArt(mark, size * 0.17);
    m.position.set(size * 0.31, size * 0.31);
    c.addChild(m);
  }
  return c;
}

function backArt(): Graphics {
  return new Graphics()
    .moveTo(22, 0)
    .lineTo(-18, 0)
    .moveTo(-4, -16)
    .lineTo(-20, 0)
    .lineTo(-4, 16)
    .stroke({ width: 10, color: swatch.blue.line, cap: 'round', join: 'round' });
}

function checkArt(): Graphics {
  return new Graphics()
    .moveTo(-20, 2)
    .lineTo(-6, 18)
    .lineTo(22, -16)
    .stroke({ width: 10, color: swatch.green.line, cap: 'round', join: 'round' });
}

/** The hint's lamp: a round bulb on a small base. */
function hintArt(): Graphics {
  const g = new Graphics()
    .circle(0, -6, 17)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.yellow.line });
  g.roundRect(-9, 12, 18, 9, 3).fill(swatch.yellow.line);
  return g;
}

/** A hub icon and sticker: three marked tiles. */
function marksArt(): Container {
  const c = new Container();
  (['green', 'yellow', 'gray'] as Mark[]).forEach((m, i) => {
    const t = tileArt(46, 'WCD'[i], m);
    t.x = (i - 1) * 54;
    c.addChild(t);
  });
  return c;
}

class WordCode implements Game {
  readonly plan: WordPlan;
  private hidden = '';
  private words: string[] = [];
  private tray: string[] = [];
  private readonly history: Try[] = [];
  private entry: string[] = [];
  private misses = 0;
  private hints = 0;
  private wrongs = 0;
  private busy = true;
  private finished = false;
  /** A hint's letter, shown faint in its spot of the current row until she fills the spot. */
  private ghost: { index: number; letter: string } | null = null;
  private view: View;
  /** When the shell last ran a frame of the game: it stops while paused or while the how-to card covers it. */
  private lastFrame = 0;

  private readonly pics = new Container();
  private readonly rowsLayer = new Container();
  private readonly entryLayer = new Container();
  private readonly keyLayer = new Container();
  private readonly glow = new Graphics();
  private readonly keyCells = new Map<string, Container>();
  private readonly pictureCards: Container[] = [];
  private readonly backBtn: RoundButton;
  private readonly checkBtn: RoundButton;
  private readonly hintBtn: RoundButton;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    if (this.plan.picture) {
      const set = schoolSet(this.plan, ctx.rng);
      this.words = set.words;
      this.hidden = set.hidden;
      this.tray = set.tray;
    } else {
      // The how-to card's demonstration plays a hidden word the reference solver reaches quickly, so the demo stays short.
      let h = pickAnswer(ctx.rng);
      if (ctx.demo) for (let i = 0; i < 80 && solverTries(h) > 3; i++) h = pickAnswer(ctx.rng);
      this.hidden = h;
    }
    this.backBtn = new RoundButton(backArt(), swatch.white, 56, () => this.erase());
    this.checkBtn = new RoundButton(checkArt(), swatch.white, 56, () => void this.submit());
    this.hintBtn = new RoundButton(hintArt(), swatch.white, 56, () => this.askHint());
    for (const l of [this.pics, this.rowsLayer, this.entryLayer, this.glow]) l.eventMode = 'none';
    ctx.stage.addChild(this.pics, this.rowsLayer, this.entryLayer, this.keyLayer, this.glow, this.hintBtn);
    if (this.plan.picture) {
      ctx.stage.addChild(this.backBtn, this.checkBtn);
      this.buildPictures();
      this.tray.forEach((l) => this.buildKey(l));
    } else {
      this.backBtn.visible = this.checkBtn.visible = false;
      [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'back', 'enter'].forEach((ch) => this.buildKey(ch));
    }
  }

  start() {
    // The how-to card's demonstration copy never takes the grown-up's keys.
    if (!this.plan.picture && !this.ctx.demo) this.ctx.listen(window, 'keydown', this.onKey);
    this.resize(this.view);
    this.busy = false;
    void this.ctx.instruct(this.plan.picture ? 'wc.school' : 'wc.grownup');
  }

  update() {
    this.lastFrame = performance.now();
    const g = this.glow.clear();
    if (this.wrongs >= 2 && !this.finished) {
      const L = this.lay();
      const pulse = 4 + Math.sin(performance.now() / 280) * 2;
      g.circle(L.hint.x, L.hint.y, 66 + pulse).stroke({ width: 7, color: swatch.yellow.line });
    }
  }

  destroy() {}

  private lay(): WordLayout {
    return wordLayout(this.view, this.plan);
  }

  // Building -----------------------------------------------------------------------------

  private buildPictures() {
    this.words.forEach((w) => {
      const card = new Container();
      card.addChild(
        new Graphics().roundRect(-50, -65, 100, 130, 18).fill(0xffffff).stroke({ width: 4, color: 0xc9ccd6 }),
      );
      const pic = typingPicture(w);
      const b = pic.getLocalBounds();
      pic.scale.set(80 / Math.max(b.width, b.height, 1));
      const c = b.x + b.width / 2;
      pic.position.set(-c * pic.scale.x, -22 - (b.y + b.height / 2) * pic.scale.y);
      pic.eventMode = 'none';
      const t = label(w, 26, ink);
      t.anchor.set(0.5);
      t.y = 44;
      t.eventMode = 'none';
      card.addChild(pic, t);
      // Tapping a picture says its word: free, nothing counted.
      onTap(card, () => void this.ctx.say('wc.word', { word: w.toLowerCase() }), { cooldown: 300 });
      this.pictureCards.push(card);
      this.pics.eventMode = 'passive';
      this.pics.addChild(card);
    });
  }

  private buildKey(ch: string) {
    const c = new Container();
    const special = ch === 'back' || ch === 'enter';
    if (special) {
      const art = ch === 'back' ? backArt() : checkArt();
      art.scale.set(0.8);
      c.addChild(new Graphics(), art);
    } else {
      c.addChild(new Graphics());
      const t = label(ch, this.plan.picture ? 56 : 46, ink);
      t.anchor.set(0.5);
      t.eventMode = 'none';
      c.addChild(t);
    }
    onTap(c, () => this.press(ch), { cooldown: 90 });
    this.keyCells.set(ch, c);
    this.keyLayer.addChild(c);
  }

  /** A key's or tray letter's face: the best mark the tries have shown for its letter, dimmed once two misses have gone by. */
  private paintKeys() {
    const L = this.lay();
    const best = bestMarks(this.history);
    const absent = absentLetters(this.history);
    const w = this.plan.picture ? L.trayTile : L.keyBox.w;
    const h = this.plan.picture ? L.trayTile : L.keyBox.h;
    for (const [ch, cell] of this.keyCells) {
      const g = cell.children[0] as Graphics;
      const m = best.get(ch);
      g.clear();
      g.roundRect(-w / 2, -h / 2, w, h, 16)
        .fill(
          m ? FILL[m] : ch === 'enter' ? swatch.green.light : ch === 'back' ? swatch.blue.light : 0xffffff,
        )
        .stroke({ width: 5, color: m ? LINE[m] : 0xc9ccd6 });
      cell.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      cell.alpha = this.wrongs >= 2 && absent.has(ch) ? 0.35 : 1;
    }
  }

  // Layout -------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    const L = this.lay();
    this.pictureCards.forEach((c, i) => c.position.set(L.pics[i].x, L.pics[i].y));
    if (this.plan.picture) {
      this.tray.forEach((l, i) => this.keyCells.get(l)?.position.set(L.tray[i].x, L.tray[i].y));
      this.backBtn.position.set(L.back.x, L.back.y);
      this.checkBtn.position.set(L.check.x, L.check.y);
    } else for (const k of L.keys) this.keyCells.get(k.ch)?.position.set(k.x, k.y);
    this.hintBtn.position.set(L.hint.x, L.hint.y);
    this.paintKeys();
    this.drawRows();
    this.drawEntry();
  }

  /** The latest tries stack above the current row, newest nearest it; the oldest visible one fades. */
  private drawRows() {
    const L = this.lay();
    this.rowsLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const shown = visibleTries(this.history, L.rows);
    shown.forEach((t, i) => {
      const fromEnd = shown.length - 1 - i;
      const row = new Container();
      t.word.split('').forEach((ch, j) => {
        const tile = tileArt(L.tile, ch, t.marks[j]);
        tile.x = (j - (this.plan.letters - 1) / 2) * L.pitch;
        row.addChild(tile);
      });
      row.alpha = fromEnd === L.rows - 1 && L.rows > 1 ? 0.5 : 1;
      row.position.set(L.cx, L.entryY - L.pitch * (fromEnd + 1));
      this.rowsLayer.addChild(row);
    });
  }

  private drawEntry() {
    const L = this.lay();
    this.entryLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.entryLayer.position.set(L.cx, L.entryY);
    for (let j = 0; j < this.plan.letters; j++) {
      const typed = this.entry[j] ?? '';
      const faint = !typed && this.ghost?.index === j;
      const tile = tileArt(L.tile, typed || (faint ? this.ghost!.letter : ''), null, faint);
      tile.x = (j - (this.plan.letters - 1) / 2) * L.pitch;
      this.entryLayer.addChild(tile);
    }
  }

  // Input --------------------------------------------------------------------------------

  private onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (performance.now() - this.lastFrame > 250 || isParentPanelOpen()) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]'))
      return;
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      this.add(e.key.toUpperCase());
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.erase();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void this.submit();
    }
  };

  private press(ch: string) {
    if (ch === 'back') this.erase();
    else if (ch === 'enter') void this.submit();
    else this.add(ch);
  }

  private add(letter: string) {
    if (this.busy || this.finished || this.entry.length >= this.plan.letters) return;
    this.entry.push(letter);
    sfx.pop(2 + this.entry.length);
    this.drawEntry();
  }

  private erase() {
    if (this.busy || this.finished || !this.entry.length) return;
    this.entry.pop();
    sfx.pop(2);
    this.drawEntry();
  }

  private askHint() {
    if (this.busy || this.finished) return;
    this.hints++;
    this.ghost = hintFor(this.hidden, this.history);
    sfx.sparkle();
    this.drawEntry();
    void this.ctx.say('wc.hint', { nth: ORDINALS[this.ghost.index], letter: this.ghost.letter });
  }

  private shake() {
    sfx.boing();
    const g = this.entryLayer;
    const x = this.lay().cx;
    void this.ctx.tw
      .to(g.position, { x: x - 12 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(g.position, { x: x + 12 }, { duration: 0.08 }))
      .then(() => this.ctx.tw.to(g.position, { x }, { duration: 0.06 }));
  }

  private async submit() {
    if (this.busy || this.finished) return;
    const word = this.entry.join('');
    if (word.length < this.plan.letters) {
      sfx.boing();
      return void this.ctx.say('wc.fill');
    }
    // A word that is not on the guess list is turned down with no cost.
    if (!this.plan.picture && !GUESSES.has(word)) {
      this.shake();
      return void this.ctx.say('wc.notword');
    }
    this.busy = true;
    // Only the tries still on screen count: a mark that has scrolled away is never a miss.
    const ignored = ignoredMarks(visibleTries(this.history, this.lay().rows), word);
    const marks = score(this.hidden, word);
    this.history.push({ word, marks });
    this.entry = [];
    this.ghost = null;
    sfx.knock();
    this.drawRows();
    this.drawEntry();
    const row = this.rowsLayer.children.at(-1);
    if (row) {
      row.children.forEach((t) => t.scale.set(0));
      for (const t of row.children) {
        if (t.destroyed) break;
        await this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.16, ease: ease.outBack });
        if (!this.ctx.alive) return;
        sfx.tick();
      }
    }
    this.paintKeys();
    if (word === this.hidden) return void this.found();
    if (this.plan.picture) await this.ctx.say('wc.readout', { text: readout(word, marks) });
    if (ignored.length) {
      // The only mistake here: ignoring a mark that is still showing. The try already played, so she has its marks.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const i = ignored[0];
      await this.ctx.say(
        i.kind === 'check' ? 'wc.ignoredCheck' : i.kind === 'spot' ? 'wc.ignoredSpot' : 'wc.ignoredAbsent',
        {
          letter: i.letter,
        },
      );
      this.paintKeys();
    }
    if (!this.ctx.alive) return;
    this.busy = false;
  }

  private async found() {
    this.finished = true;
    this.glow.clear();
    sfx.tada();
    await this.ctx.say('wc.found', { word: this.hidden.toLowerCase() });
    await this.ctx.tw.wait(0.5);
    if (!this.ctx.alive) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The ghost finger: the picture word's letters from the tray, or the reference solver's next try on the keyboard, then the check. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const want = this.plan.picture ? this.hidden : this.nextDemoTry();
    const next = want.split('')[this.entry.length];
    if (next === undefined)
      return { tap: { on: this.plan.picture ? this.checkBtn : this.keyCells.get('enter')! }, pause: 0.9 };
    if (this.entry.join('') !== want.slice(0, this.entry.length))
      return { tap: { on: this.plan.picture ? this.backBtn : this.keyCells.get('back')! }, pause: 0.2 };
    return { tap: { on: this.keyCells.get(next)! }, pause: 0.3 };
  }

  private nextDemoTry(): string {
    if (!this.history.length) return OPENER;
    return ANSWERS.find((w) => consistent(w, this.history)) ?? this.hidden;
  }
}

/** A try's marks said aloud: "C is not in it. A is in another place. T is in the right place." */
function readout(word: string, marks: Mark[]): string {
  return word
    .split('')
    .map(
      (l, i) =>
        `${l} is ${marks[i] === 'green' ? 'in the right place' : marks[i] === 'yellow' ? 'in another place' : 'not in it'}.`,
    )
    .join(' ');
}

export const game: GameModule = {
  id: 'word-code',
  name: 'Word Code',
  titleLine: 'game.word-code',
  region: 'story-grove',
  challenge: 'logic',
  skills: ['deduction', 'using-evidence', 'short words', 'spelling'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'After each try, say what the marks tell you: "The C is a cross, so it is not in the word. Which letters could still fit?"',
  offScreen:
    'Pick a short word in your head and let her guess it, telling her for each letter whether it is in the word and in the right place.',
  ownKeys: true,
  hubIcon: () => new WigglyIcon(marksArt()),
  touchDemo: true,
  upright: true,
  typing: true,
  sticker: () => marksArt(),
  create: (ctx) => new WordCode(ctx),
};
