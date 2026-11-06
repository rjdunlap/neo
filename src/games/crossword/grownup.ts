import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { safeArea, type View } from '../../engine/view';
import { FONT, label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  activeWord, allFilled, backspace, check, clueName, cursorFor, grownHelp, grownSolved, makeGrown, numbers, readyToCheck, stillCircled, tapSquare, typeLetter,
  wrongKeys, type Cursor, type GrownPuzzle,
} from './grown';
import { lettersOf, planFor, squaresOf, type Plan } from './logic';

/** Grown-up squares and keys: 64 units, the grown-up band's smallest target. */
const SQ = 64;
const KEY = 64;
const KEY_PITCH = 72;
/** The 26 letters, then backspace and Help: four columns of seven beside the grid, or seven columns of four under it. */
const KEYS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '⌫', '?'];

/**
 * Crossword levels 5–6 for grown-ups: tap a square to select it and its across word (again for the down word), type on the
 * A–Z keys or a hardware keyboard, and the grid is checked when every square is full. A wrong check is one miss and circles
 * the wrong squares, which stay editable; Help reveals one letter of the selected word for one hint.
 */
export class GrownCrossword implements Game {
  readonly plan: Plan;
  readonly puzzle: GrownPuzzle;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  fills = new Map<string, string>();
  /** Squares Help filled: right, and locked. */
  readonly revealed = new Set<string>();
  /** The last wrong check's squares and the letters they held. */
  circled = new Map<string, string>();
  cursor: Cursor;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly squares = new Map<string, { box: Container; bg: Graphics; letter: Text }>();
  private readonly marks = new Graphics();
  private readonly keys = new Container();
  private readonly keyMap = new Map<string, Container>();
  private readonly clueBar = new Container();
  private readonly clueBg = new Graphics();
  private readonly clueText: Text;
  private readonly speaker = new Container();
  private readonly title: Text;
  private readonly letters: Map<string, string>;
  private view: View;
  private readonly onKey = (e: KeyboardEvent) => this.hardwareKey(e);

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.puzzle = makeGrown(this.plan, ctx.rng);
    this.letters = lettersOf(this.puzzle.words);
    this.cursor = cursorFor(this.puzzle, this.fills, 0);
    this.backdrop = new Backdrop({ sky: [0xd6efc8, 0xfff6e0], hills: [0x9fd3a8, 0x8fcf73], horizon: 0.7, clouds: 2, seed: 211 }, ctx.view);
    this.title = label(this.puzzle.title, 30, ink);
    this.clueText = new Text({ text: '', style: { fontFamily: FONT, fontSize: 26, fill: ink, fontWeight: '500', wordWrap: true, wordWrapWidth: 600, lineHeight: 30 } });
    this.clueText.anchor.set(0, 0.5);
    this.clueText.eventMode = 'none';
    const sp = new Graphics().roundRect(-32, -32, 64, 64, 16).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line })
      .poly([-18, -7, -9, -7, 2, -17, 2, 17, -9, 7, -18, 7]).fill(ink)
      .moveTo(8, -11).quadraticCurveTo(19, 0, 8, 11).stroke({ width: 4, color: ink, cap: 'round' });
    this.speaker.addChild(sp);
    this.speaker.hitArea = new Rectangle(-32, -32, 64, 64);
    onTap(this.speaker, () => this.readClue(), { cooldown: 400 });
    this.clueBar.addChild(this.clueBg, this.clueText, this.speaker);
    this.buildGrid();
    this.buildKeys();
    this.marks.eventMode = 'none';
    this.board.addChild(this.marks);
    ctx.stage.addChild(this.backdrop, this.title, this.clueBar, this.board, this.keys);
  }

  start() {
    this.resize(this.view);
    this.draw();
    window.addEventListener('keydown', this.onKey);
    this.board.alpha = 0;
    void this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.35 }).then(() => (this.busy = false));
    void this.intro();
  }

  private async intro() {
    if (this.plan.grown === 'free') await this.ctx.say('cw.theme', { theme: this.puzzle.title });
    void this.ctx.instruct(this.plan.grown === 'mini' ? 'cw.six' : 'cw.five');
  }

  update() {}

  destroy() {
    window.removeEventListener('keydown', this.onKey);
  }

  // Building -----------------------------------------------------------------------------

  private buildGrid() {
    const nums = numbers(this.puzzle);
    // A mini's blocks are dark squares, so it reads as the 5 by 5 it is.
    if (this.plan.grown === 'mini') {
      const blocks = new Graphics();
      for (let r = 0; r < this.puzzle.h; r++) for (let c = 0; c < this.puzzle.w; c++)
        if (!this.letters.has(`${r},${c}`)) blocks.rect(c * SQ, r * SQ, SQ, SQ).fill(swatch.purple.line).stroke({ width: 2, color: swatch.purple.line });
      blocks.eventMode = 'none';
      this.board.addChild(blocks);
    }
    for (const k of this.letters.keys()) {
      const [r, c] = k.split(',').map(Number);
      const sq = new Container();
      const bg = new Graphics();
      const letter = label('', 40, ink);
      letter.position.set(SQ / 2, SQ / 2 + 4);
      sq.addChild(bg, letter);
      const n = nums.get(k);
      if (n) {
        const t = label(String(n), 16, swatch.purple.line, '500');
        t.anchor.set(0, 0);
        t.position.set(5, 3);
        sq.addChild(t);
      }
      sq.position.set(c * SQ, r * SQ);
      sq.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(sq, () => this.tapSquare(k), { cooldown: 200 });
      this.board.addChild(sq);
      this.squares.set(k, { box: sq, bg, letter });
    }
  }

  private buildKeys() {
    for (const k of KEYS) {
      const c = new Container();
      const help = k === '?';
      const g = new Graphics().roundRect(-KEY / 2, -KEY / 2, KEY, KEY, 14)
        .fill(help ? swatch.yellow.fill : k === '⌫' ? swatch.orange.light : cream)
        .stroke({ width: 4, color: help ? swatch.yellow.line : swatch.purple.line });
      const t = label(k, k === '⌫' ? 32 : 34, ink);
      t.eventMode = 'none';
      c.addChild(g, t);
      c.hitArea = new Rectangle(-KEY / 2, -KEY / 2, KEY, KEY);
      onTap(c, () => {
        this.press(c);
        if (help) this.useHelp();
        else if (k === '⌫') this.erase();
        else this.type(k.toLowerCase());
      }, { cooldown: 60 });
      this.keys.addChild(c);
      this.keyMap.set(k, c);
    }
  }

  /** Touch-down feedback: the key dips. */
  private press(c: Container) {
    sfx.pop(5);
    c.scale.set(0.9);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.15 });
  }

  // Layout -------------------------------------------------------------------------------

  private get upright() {
    return this.view.h > this.view.w * 1.1;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const p = this.puzzle;
    const gw = p.w * SQ, gh = p.h * SQ;
    const safe = safeArea(v);
    if (this.upright) {
      // Clue bar under the top buttons, keys along the bottom right of the pet, the grid centred between them.
      // An upright iPad view is taller than the design area; the corner buttons stay at its top, so the bar follows them.
      const top = 170;
      // The bar starts right of the corner buttons (Home and the how-to "?").
      this.layoutBar(150, top, v.w - 174);
      const cols = 7, rows = 4;
      const kx = v.w - 24 - (cols * KEY_PITCH - (KEY_PITCH - KEY)), ky = v.h - 16 - (rows * KEY_PITCH - (KEY_PITCH - KEY));
      this.layoutKeys(kx, ky, cols);
      const gy0 = top + 96, gy1 = ky - 16;
      this.board.position.set((v.w - gw) / 2, gy0 + Math.max(0, (gy1 - gy0 - gh) / 2));
      this.title.position.set(v.w / 2, top - 30);
    } else {
      const top = safe.y + 100;
      const left = safe.x + 176;
      const kx = v.w - 16 - (4 * KEY_PITCH - (KEY_PITCH - KEY));
      this.layoutBar(left, top, v.w - 130 - left);
      const ky = top + 96;
      this.layoutKeys(kx, ky, 4);
      const right = kx - 20;
      this.board.position.set(left + Math.max(0, (right - left - gw) / 2), ky + Math.max(0, (7 * KEY_PITCH - 8 - gh) / 2));
      this.title.position.set((left + right) / 2, top - 26);
    }
  }

  private layoutBar(x: number, y: number, w: number) {
    this.clueBar.position.set(x, y);
    this.clueBg.clear().roundRect(0, 0, w, 84, 18).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 4, color: swatch.blue.line });
    this.speaker.position.set(w - 42, 42);
    this.clueText.position.set(18, 42);
    this.clueText.style.wordWrapWidth = w - 100;
  }

  /** Keys from the top-left corner (x, y), `cols` to a row. */
  private layoutKeys(x: number, y: number, cols: number) {
    KEYS.forEach((k, i) => this.keyMap.get(k)!.position.set(x + KEY / 2 + (i % cols) * KEY_PITCH, y + KEY / 2 + Math.floor(i / cols) * KEY_PITCH));
  }

  // Drawing ------------------------------------------------------------------------------

  private draw() {
    const p = this.puzzle;
    const word = activeWord(p, this.cursor);
    const inWord = new Set(word >= 0 ? squaresOf(p.words[word]).map((s) => s.key) : []);
    const circled = new Set(stillCircled(this.fills, this.circled));
    for (const [k, sq] of this.squares) {
      const fill = this.finished ? 0xe4f6d8 : k === this.cursor.key ? 0xfff0a0 : inWord.has(k) ? 0xd8ecff : 0xffffff;
      sq.bg.clear().rect(0, 0, SQ, SQ).fill(fill).stroke({ width: 2, color: swatch.purple.line });
      sq.letter.text = (this.fills.get(k) ?? '').toUpperCase();
      sq.letter.style.fill = this.revealed.has(k) ? swatch.blue.line : ink;
    }
    const m = this.marks.clear();
    // Soft circles on the squares the last check found wrong, until each changes.
    for (const k of circled) {
      const [r, c] = k.split(',').map(Number);
      m.circle(c * SQ + SQ / 2, r * SQ + SQ / 2, SQ / 2 - 5).stroke({ width: 3, color: swatch.orange.line, alpha: 0.85 });
    }
    this.clueText.text = word >= 0 ? `${clueName(p, word)}:  ${p.clues[word]}` : '';
  }

  // Playing ------------------------------------------------------------------------------

  private tapSquare(k: string) {
    if (this.busy || this.finished) return;
    sfx.pop(4);
    this.cursor = tapSquare(this.puzzle, this.cursor, k);
    this.draw();
  }

  /** Reads the selected clue aloud; free, and never needed. */
  readClue() {
    const i = activeWord(this.puzzle, this.cursor);
    if (i < 0 || this.finished) return;
    void this.ctx.say('cw.clue', { clue: `${clueName(this.puzzle, i)}. ${this.puzzle.clues[i]}` });
  }

  type(letter: string) {
    if (this.busy || this.finished) return;
    const r = typeLetter(this.puzzle, this.fills, this.revealed, this.cursor, letter);
    this.fills = r.fills;
    this.cursor = r.cursor;
    this.afterEdit();
  }

  erase() {
    if (this.busy || this.finished) return;
    const r = backspace(this.puzzle, this.fills, this.revealed, this.cursor);
    this.fills = r.fills;
    this.cursor = r.cursor;
    this.draw();
  }

  /** A full grid is checked, and after a wrong check again only once every circled square has changed. */
  private afterEdit() {
    const p = this.puzzle;
    if (readyToCheck(p, this.fills, this.circled)) {
      const r = check(p, this.fills);
      if (r.right) return void this.solve();
      this.misses++;
      this.circled = r.circled;
      sfx.boing();
      void this.ctx.say('cw.circled');
    }
    this.draw();
  }

  /** Help reveals one right letter of the selected word, preferring a crossing. One hint each time. */
  useHelp() {
    const p = this.puzzle;
    if (this.busy || this.finished) return;
    const h = grownHelp(p, this.fills, activeWord(p, this.cursor));
    if (!h) return;
    this.hints++;
    this.fills = new Map(this.fills).set(h.key, h.letter);
    this.revealed.add(h.key);
    this.cursor = cursorFor(p, this.fills, h.word);
    const sq = this.squares.get(h.key);
    if (sq) {
      sq.letter.scale.set(1.4);
      void this.ctx.tw.to(sq.letter.scale, { x: 1, y: 1 }, { duration: 0.3 });
    }
    void this.ctx.say('cw.letter', { letter: h.letter.toUpperCase() });
    this.afterEdit();
  }

  private hardwareKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      this.type(e.key.toLowerCase());
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.erase();
    }
  }

  private async solve() {
    this.finished = true;
    this.busy = true;
    this.circled.clear();
    this.draw();
    sfx.tada();
    const p = this.puzzle;
    const mid = { x: this.board.x + (p.w * SQ) / 2, y: this.board.y + (p.h * SQ) / 2 };
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.orange.light], count: 24, speed: [120, 320], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    await this.ctx.say('cw.solved');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Ghost finger ---------------------------------------------------------------------------

  /** The first square not holding its right letter, for the ghost finger and scripted checks. */
  nextWrong(): { key: string; letter: string } | null {
    const k = wrongKeys(this.puzzle, this.fills)[0];
    return k ? { key: k, letter: this.letters.get(k)! } : null;
  }

  /** Taps the first wrong square (when the cursor is not on it), then the key for its letter, through the real controls. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const next = this.nextWrong();
    if (!next) return null;
    if (this.cursor.key !== next.key) {
      // The ghost touches the square itself (it emits on its target, without a hit test).
      return { tap: { on: this.squares.get(next.key)!.box, x: SQ / 2, y: SQ / 2 }, pause: 0.25 };
    }
    // Keys typed along a word belong together, so the finger hardly rests between them.
    return { tap: { on: this.keyMap.get(next.letter.toUpperCase())! }, pause: 0.1 };
  }

  /** Whether every square is filled (for scripted checks). */
  get full() {
    return allFilled(this.puzzle, this.fills);
  }

  get solved() {
    return grownSolved(this.puzzle, this.fills);
  }
}
