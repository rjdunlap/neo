import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseGrids, courseMinimum, isWordCourse } from './course';
import { cellsOfWord, hintFor, lineBetween, makeGrids, planFor, wordAt, type WordGrid, type WordPlan } from './logic';
import { themeById } from './words';

/** Grown-up play only: the island's Lantern Lake holds it, with touch or a controller. */
const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };

const PAPER = 0xfffdf6;
const BAND_COLORS: ColorName[] = ['pink', 'blue', 'green', 'orange', 'purple', 'teal', 'yellow', 'red'];

/** The smallest touch target in a grown-up game, in logical units: a letter's square is never smaller. */
const MIN_TOUCH = 64;
/** The paper around a grid, and half of it: the margin kept at each edge of the window when the grid slides. */
const PAD = 24;
const EDGE = PAD / 2;
/** A finger that travels this far (logical units) between touching and lifting is sliding the grid, not tapping a letter. */
const SLIDE = 14;
/** Touch play's two buttons, each a target of its own. */
type SlotKind = 'hint' | 'again';
interface Slot { kind: SlotKind; x: number; y: number; w: number; h: number }
/** The window on the grid: stage units. */
interface Viewport { x: number; y: number; w: number; h: number }

/** "FROG" read aloud and shown in the list as "frog". */
const spoken = (w: string) => w.charAt(0) + w.slice(1).toLowerCase();

class WordSearch implements Game {
  readonly plan: WordPlan;
  index = -1;
  misses = 0;
  hints = 0;
  /** Guesses beyond each grid's words, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  grid!: WordGrid;
  cursor = 0;
  /** The first letter of the line being marked, if one is. */
  anchor: number | null = null;
  found = new Set<number>();
  /** Lines marked and checked on this grid, right or wrong: every one counts, a cancelled mark does not. */
  guesses = 0;
  hinted: { word: number; cell: number } | null = null;

  /** Touch play (every play outside the couch): tap a word's first letter, then its last. Couch play drives the same grid with a controller. */
  touch: boolean;
  /** Touch: the window on the grid and how far it is slid (0 when the whole grid is in view), in logical units. */
  vp: Viewport = { x: 0, y: 0, w: 0, h: 0 };
  scrollX = 0;
  scrollY = 0;
  maxX = 0;
  maxY = 0;
  slots: Slot[] = [];
  slotNodes: Container[] = [];
  /** A finger on the grid: where it began, how far the grid had slid, and whether it has become a slide. */
  drag: { id: number; sx: number; sy: number; ox: number; oy: number; cell: number; moved: boolean; marking: boolean } | null = null;
  readonly touchLayer = new Graphics();
  readonly buttonLayer = new Container();
  private readonly frame = new Graphics();
  private readonly clip = new Container();
  private readonly clipMask = new Graphics();
  private readonly edges = new Graphics();
  private readonly buttonsG = new Graphics();
  private readonly buttonText = new Container();
  private readonly slideNote = label('', 20, 0x7a746a, '500');
  private pressed: { slot: number; until: number } | null = null;
  private edgesDirty = true;
  /** The geometry of the word list, so the list's marks and words agree: columns, rows' step, the first row, a column's width. */
  private listBox = { cols: 1, step: 38, top: 96, colW: 260 };

  private readonly grids: WordGrid[];
  private readonly board = new Container();
  private readonly paper = new Graphics();
  private readonly bands = new Graphics();
  private readonly letters = new Container();
  private readonly glow = new Graphics();
  private readonly list = new Container();
  private readonly listMarks = new Graphics();
  private readonly title = label('', 28, ink);
  private readonly tally = label('', 24, ink, '500');
  private texts: Text[] = [];
  private entries: Text[] = [];
  private cell = 56;
  private clock = 0;
  private view: View;
  private dirty = true;
  private readonly held = new HeldDirection();
  private botWait = 0.8;
  private told = { miss: false };
  /** Couch challenge course: fixed grids in a row. Null in ordinary play, where grids are drawn from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Guesses already spent on the grid we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private spokenGo = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isWordCourse(run.id)) {
      this.grids = courseGrids(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      // The how-to card's demonstration shows the taps, not a whole list of words.
      this.grids = makeGrids(ctx.demo ? { ...this.plan, words: Math.min(this.plan.words, 3) } : this.plan, ctx.rng);
      this.course = null;
    }
    for (const part of [this.board, this.paper, this.bands, this.letters, this.glow, this.list, this.listMarks, this.title, this.tally]) part.eventMode = 'none';
    this.board.addChild(this.paper, this.bands, this.letters, this.glow);
    this.list.addChild(this.listMarks);
    for (const part of [this.frame, this.clip, this.clipMask, this.edges, this.buttonsG, this.buttonText, this.slideNote]) part.eventMode = 'none';
    this.clip.addChild(this.board, this.clipMask);
    ctx.stage.addChild(this.frame, this.clip, this.edges, this.list, this.title, this.tally, this.slideNote);
    this.touch = !ctx.couch;
    if (this.touch) {
      // One layer over the grid decides what a finger meant: a short touch is a tap on a letter, a longer one slides the grid.
      const L = this.touchLayer;
      L.eventMode = 'static';
      L.cursor = 'pointer';
      L.on('pointerdown', this.onDown);
      L.on('globalpointermove', this.onMove);
      L.on('pointerup', this.onUp);
      L.on('pointerupoutside', this.onUp);
      L.on('pointercancel', this.onCancel);
      ctx.stage.addChild(this.touchLayer, this.buttonsG, this.buttonText, this.buttonLayer);
    }
  }

  get n() { return this.grid.size; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.grid) return;
    if (this.touch) return this.resizeTouch(v);
    const n = this.n;
    // The controller reminder covers the bottom of the screen for the first ten seconds, so the grid stays above it.
    this.cell = Math.max(34, Math.min(66, Math.floor((v.h - 100 - 200) / n)));
    const w = n * this.cell, left = Math.max(160, (v.w - w - 320) / 2);
    this.board.position.set(left, 104);
    this.list.position.set(left + w + 44, 104);
    this.title.anchor.set(0, 0.5);
    this.tally.anchor.set(0, 0.5);
    this.title.position.set(this.list.x, this.list.y);
    this.tally.position.set(this.list.x, this.list.y + 38);
    this.listBox = { cols: 1, step: Math.min(38, Math.floor((n * this.cell - 96) / this.grid.words.length)), top: 96, colW: 260 };
    this.layoutLetters();
    this.layoutList();
    this.dirty = true;
  }

  /**
   * Touch layout. A letter's square is at least 64 across, so a grid that does not fit beside (or above) the word list
   * slides: the window shows part of it and a drag moves it. The list sits to the right, or under the grid on a tall view.
   */
  private resizeTouch(v: View) {
    const n = this.n, words = this.grid.words.length, side = v.w >= v.h;
    // The home and help buttons are at the top left: on a tall view the grid starts below them.
    const top = side ? 100 : 150, left = 150, gap = 24;
    let listX: number, listY: number, vp: Viewport, btn: Slot[];
    if (side) {
      const listW = 262;
      listX = v.w - listW - 16;
      listY = top + 4;
      vp = { x: left, y: top, w: listX - gap - left, h: v.h - top - 24 };
      const bw = (listW - 10) / 2, by = v.h - 24 - 72;
      btn = [{ kind: 'hint', x: listX, y: by, w: bw, h: 72 }, { kind: 'again', x: listX + bw + 10, y: by, w: bw, h: 72 }];
      this.listBox = { cols: 1, step: Math.min(36, Math.floor((by - 12 - (listY + 102)) / words)), top: 102, colW: listW };
      this.title.position.set(listX, listY + 8);
      this.tally.position.set(listX, listY + 40);
      this.slideNote.position.set(listX, listY + 66);
    } else {
      const panel = 280;
      listX = 160;
      listY = v.h - panel;
      vp = { x: 24, y: top, w: v.w - 48, h: listY - 12 - top };
      const by = v.h - 24 - 72, bw = 200;
      btn = [{ kind: 'hint', x: 160, y: by, w: bw, h: 72 }, { kind: 'again', x: 160 + bw + 12, y: by, w: bw, h: 72 }];
      const colW = Math.floor((v.w - 160 - 24) / 3);
      this.listBox = { cols: 3, step: 34, top: 44, colW };
      this.title.position.set(listX, listY + 8);
      this.tally.position.set(listX + 330, listY + 8);
      this.slideNote.position.set(listX + 560, listY + 8);
    }
    this.list.position.set(listX, listY);
    this.title.anchor.set(0, 0.5);
    this.tally.anchor.set(0, 0.5);
    this.slideNote.anchor.set(0, 0.5);
    this.title.style.fontSize = 26;
    this.tally.style.fontSize = 20;
    // The biggest square that shows the whole grid, no bigger than 96 and no smaller than 64 (then the grid slides).
    const pad = PAD;
    const fit = Math.floor(Math.min(vp.w - pad, vp.h - pad) / n);
    this.cell = Math.max(MIN_TOUCH, Math.min(96, fit));
    const size = n * this.cell;
    this.maxX = Math.max(0, size + pad - vp.w);
    this.maxY = Math.max(0, size + pad - vp.h);
    this.vp = vp;
    this.scrollX = Math.min(this.maxX, Math.max(0, this.scrollX));
    this.scrollY = Math.min(this.maxY, Math.max(0, this.scrollY));
    // The paper hugs a grid that is all in view, and fills the window when the grid slides.
    const fw = this.maxX > 0 ? vp.w : size + pad, fh = this.maxY > 0 ? vp.h : size + pad;
    this.frame.clear().roundRect(vp.x + (vp.w - fw) / 2 - 6, vp.y + (vp.h - fh) / 2 - 6, fw + 12, fh + 12, 18).fill(PAPER).stroke({ width: 5, color: 0x9c6b3c });
    this.clipMask.clear().roundRect(vp.x, vp.y, vp.w, vp.h, 12).fill(0xffffff);
    this.clip.mask = this.clipMask;
    this.frame.visible = true;
    this.touchLayer.visible = true;
    this.touchLayer.clear().rect(vp.x, vp.y, vp.w, vp.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.touchLayer.hitArea = new Rectangle(vp.x, vp.y, vp.w, vp.h);
    this.layoutBoard();
    this.slots = btn;
    for (const node of this.buttonLayer.removeChildren()) node.destroy();
    this.slotNodes = btn.map((slot, k) => {
      const node = new Container();
      node.position.set(slot.x, slot.y);
      node.hitArea = new Rectangle(0, 0, slot.w, slot.h);
      onTap(node, () => this.tapSlot(k), { cooldown: 60 });
      this.buttonLayer.addChild(node);
      return node;
    });
    this.slideNote.text = this.maxX > 0 || this.maxY > 0 ? 'Drag the grid to slide it' : '';
    this.slideNote.style.fontSize = 18;
    this.layoutLetters();
    this.layoutList();
    this.paintButtons();
    this.edgesDirty = true;
    this.dirty = true;
  }

  /** The grid sits at the window's top left, slid by the scroll; a grid smaller than the window is centred in it. */
  private layoutBoard() {
    const size = this.n * this.cell, { x, y, w, h } = this.vp;
    const offX = this.maxX > 0 ? EDGE : (w - size) / 2, offY = this.maxY > 0 ? EDGE : (h - size) / 2;
    this.board.position.set(x + offX - this.scrollX, y + offY - this.scrollY);
  }

  /** Slide the grid to `x`, `y` (kept inside what there is to see). */
  setScroll(x: number, y: number) {
    this.scrollX = Math.min(this.maxX, Math.max(0, x));
    this.scrollY = Math.min(this.maxY, Math.max(0, y));
    this.layoutBoard();
    this.edgesDirty = true;
  }

  /** Slide so that a square is in the middle of the window (or as near as the edges allow). */
  private showCell(i: number) {
    if (!this.touch || (this.maxX <= 0 && this.maxY <= 0)) return;
    const c = this.center(i);
    this.setScroll(c.x + EDGE - this.vp.w / 2, c.y + EDGE - this.vp.h / 2);
  }

  /** Is this square wholly inside the window? */
  private inView(i: number, margin = 4) {
    const c = this.center(i), r = this.cell / 2, x = this.board.x + c.x, y = this.board.y + c.y;
    return x - r >= this.vp.x + margin && x + r <= this.vp.x + this.vp.w - margin && y - r >= this.vp.y + margin && y + r <= this.vp.y + this.vp.h - margin;
  }

  private center(i: number) {
    return { x: (i % this.n) * this.cell + this.cell / 2, y: Math.floor(i / this.n) * this.cell + this.cell / 2 };
  }

  private buildLetters() {
    this.letters.removeChildren().forEach((c) => c.destroy());
    this.texts = this.grid.letters.map((ch) => { const t = label(ch, 36, ink); t.eventMode = 'none'; this.letters.addChild(t); return t; });
  }

  private layoutLetters() {
    const size = Math.round(this.cell * 0.6);
    this.texts.forEach((t, i) => { t.style.fontSize = size; const c = this.center(i); t.position.set(c.x, c.y + 1); });
  }

  private buildList() {
    for (const c of this.list.removeChildren()) if (c !== this.listMarks) c.destroy();
    this.list.addChild(this.listMarks);
    this.entries = this.grid.words.map((p) => { const t = label(spoken(p.word), 26, ink); t.anchor.set(0, 0.5); t.eventMode = 'none'; this.list.addChild(t); return t; });
  }

  /** Where word `i` sits in the list: down a column, then across to the next. */
  private entryAt(i: number) {
    const { cols, step, top, colW } = this.listBox, rows = Math.ceil(this.grid.words.length / cols);
    return { x: 34 + Math.floor(i / rows) * colW, y: top + (i % rows) * step };
  }

  private layoutList() {
    const { step } = this.listBox;
    this.entries.forEach((t, i) => { const at = this.entryAt(i); t.style.fontSize = Math.round(Math.min(28, step * 0.72)); t.position.set(at.x, at.y); });
    this.paintList();
  }

  /** The word list: a dot before each, the found ones struck through and grey, the hinted one on a marker. */
  private paintList() {
    const g = this.listMarks.clear(), { step, colW } = this.listBox;
    this.grid.words.forEach((_, i) => {
      const { x, y } = this.entryAt(i), t = this.entries[i], done = this.found.has(i);
      t.style.fill = done ? 0x9a948a : ink;
      if (this.hinted?.word === i && !done) g.roundRect(x - 42, y - step / 2 + 2, Math.min(220, colW - 16), step - 4, 10).fill({ color: swatch.yellow.light, alpha: 0.95 }).stroke({ width: 2, color: swatch.yellow.line });
      const col = swatch[BAND_COLORS[i % BAND_COLORS.length]];
      g.circle(x - 24, y, 7).fill(done ? col.fill : swatch.white.light).stroke({ width: 2, color: done ? col.line : 0xb9b0a0 });
      if (done) g.moveTo(x - 8, y).lineTo(x + t.width + 6, y).stroke({ width: 3, color: 0x7a746a, cap: 'round' });
    });
    this.tally.text = this.touch ? `${this.found.size} of ${this.grid.words.length} found` : `${this.found.size} of ${this.grid.words.length} found · ${this.guesses} ${this.guesses === 1 ? 'guess' : 'guesses'}`;
  }

  /** The grid's paper and the bands over found words, redrawn when something changes. */
  private paint() {
    this.dirty = false;
    const w = this.n * this.cell, r = this.cell * 0.42;
    // Touch play has the window's own paper; the grid slides over it.
    if (this.touch) this.paper.clear();
    else this.paper.clear().roundRect(-14, -14, w + 28, w + 28, 18).fill(PAPER).stroke({ width: 5, color: 0x9c6b3c });
    const g = this.bands.clear();
    this.found.forEach((idx) => {
      const cells = cellsOfWord(this.n, this.grid.words[idx]), a = this.center(cells[0]), b = this.center(cells[cells.length - 1]);
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: r * 2, color: swatch[BAND_COLORS[idx % BAND_COLORS.length]].fill, alpha: 0.5, cap: 'round' });
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.grid) return;
    if (this.dirty) this.paint();
    if (this.touch) {
      if (this.pressed && this.clock >= this.pressed.until) { this.pressed = null; this.paintButtons(); }
      if (this.edgesDirty) this.paintEdges();
    }
    const g = this.glow.clear();
    if (this.finished || this.busy) return;
    const cell = this.cell, r = cell * 0.42;
    if (this.anchor !== null) {
      const line = lineBetween(this.n, this.anchor, this.cursor), a = this.center(this.anchor);
      if (line) {
        const b = this.center(this.cursor);
        g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: r * 2, color: swatch.yellow.fill, alpha: 0.55, cap: 'round' });
      } else g.circle(a.x, a.y, r).fill({ color: swatch.yellow.fill, alpha: 0.55 });
    }
    if (this.hinted && !this.found.has(this.hinted.word)) {
      const m = this.center(this.hinted.cell);
      g.circle(m.x, m.y, cell * 0.5 + 2 * Math.sin(this.clock * 6)).stroke({ width: 5, color: swatch.orange.fill });
    }
    if (this.touch) {
      // The square under a finger lights at once.
      const d = this.drag;
      if (d && !d.moved && d.cell >= 0) {
        const at = this.center(d.cell);
        g.circle(at.x, at.y, r).fill({ color: swatch.orange.fill, alpha: 0.45 });
      }
      return;
    }
    const at = this.center(this.cursor);
    g.roundRect(at.x - cell / 2 + 2, at.y - cell / 2 + 2, cell - 4, cell - 4, 10).stroke({ width: 4, color: ink });
  }

  destroy() {
    this.drag = null;
    const L = this.touchLayer;
    L.off('pointerdown', this.onDown);
    L.off('globalpointermove', this.onMove);
    L.off('pointerup', this.onUp);
    L.off('pointerupoutside', this.onUp);
    L.off('pointercancel', this.onCancel);
  }

  /** A soft strip along each edge that has more of the grid beyond it. */
  private paintEdges() {
    this.edgesDirty = false;
    const g = this.edges.clear(), { x, y, w, h } = this.vp, t = 12, col = swatch.orange.fill;
    if (!this.touch || (this.maxX <= 0 && this.maxY <= 0)) return;
    const tri = (cx: number, cy: number, dx: number, dy: number) => g.poly([cx + dx * 9 - dy * 12, cy + dy * 9 + dx * 12, cx + dx * 9 + dy * 12, cy + dy * 9 - dx * 12, cx - dx * 9, cy - dy * 9]).fill({ color: swatch.orange.line, alpha: 0.9 });
    if (this.scrollX > 1) { g.rect(x, y, t, h).fill({ color: col, alpha: 0.3 }); tri(x + t / 2, y + h / 2, -1, 0); }
    if (this.scrollX < this.maxX - 1) { g.rect(x + w - t, y, t, h).fill({ color: col, alpha: 0.3 }); tri(x + w - t / 2, y + h / 2, 1, 0); }
    if (this.scrollY > 1) { g.rect(x, y, w, t).fill({ color: col, alpha: 0.3 }); tri(x + w / 2, y + t / 2, 0, -1); }
    if (this.scrollY < this.maxY - 1) { g.rect(x, y + h - t, w, t).fill({ color: col, alpha: 0.3 }); tri(x + w / 2, y + h - t / 2, 0, 1); }
  }

  /** Touch play's two buttons: Hint and Start over. A button sinks while it is pressed. */
  private paintButtons() {
    const g = this.buttonsG.clear();
    this.buttonText.removeChildren().forEach((c) => c.destroy());
    this.slots.forEach((s, k) => {
      const down = this.pressed?.slot === k && this.clock < this.pressed.until ? 3 : 0;
      const sw = s.kind === 'hint' ? swatch.blue : swatch.teal, text = s.kind === 'hint' ? 'Hint ◇' : 'Start over ↺';
      g.roundRect(s.x, s.y + 4, s.w, s.h, 14).fill(sw.line);
      g.roundRect(s.x, s.y + down, s.w, s.h, 14).fill(sw.light).stroke({ width: 3, color: sw.line });
      const t = label(text, 22, ink);
      if (t.width > s.w - 14) t.scale.set((s.w - 14) / t.width);
      t.position.set(s.x + s.w / 2, s.y + s.h / 2 + down);
      this.buttonText.addChild(t);
    });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and grids                                                                              */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.grids.length) return void this.finale();
    this.grid = this.grids[this.index];
    this.found = new Set();
    this.guesses = this.carry;
    this.carry = 0;
    this.anchor = null;
    this.hinted = null;
    this.told = { miss: false };
    this.cursor = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    this.scrollX = 0;
    this.scrollY = 0;
    this.drag = null;
    this.title.text = themeById(this.grid.theme).name;
    this.buildLetters();
    this.buildList();
    this.resize(this.view);
    this.board.alpha = 0;
    this.list.alpha = 0;
    await Promise.all([this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 }), this.ctx.tw.to(this.list, { alpha: 1 }, { duration: 0.3 })]);
    this.busy = false;
    this.report();
    if (this.spokenGo) return;
    this.spokenGo = true;
    return this.ctx.instruct(!this.touch ? 'wordsearch.go' : this.maxX > 0 || this.maxY > 0 ? 'wordsearch.go-slide' : 'wordsearch.go-touch');
  }

  /** Hand a course's numbers to the shell. `finished` means the grid just ended, so none of its guesses are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.grids.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.guesses,
      par: this.grid.words.length,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the grid just finished, over the board for a moment. */
  private async gridScore() {
    const best = this.grid.words.length, total = this.grids.length;
    const text = this.guesses === best ? `Grid ${this.index + 1} of ${total}: ${this.guesses} guesses, every one right!` : `Grid ${this.index + 1} of ${total}: ${this.guesses} guesses (fewest ${best})`;
    const note = label(text, 32, ink);
    note.position.set(this.view.w / 2, 52);
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.3);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async cleared() {
    this.busy = true;
    this.hinted = null;
    this.anchor = null;
    this.excess += Math.max(0, this.guesses - this.grid.words.length);
    if (this.course) {
      this.done.push(this.guesses);
      this.report(true);
    }
    const n = this.n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const t = this.texts[r * n + c];
        void this.ctx.tw.to(t.scale, { x: 1.3, y: 1.3 }, { duration: 0.1 }).then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.12 }));
      }
      sfx.bell(3 + (r % 7), 0.2);
      await this.ctx.tw.wait(0.07);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (n * this.cell) / 2, y: (n * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 28, speed: [160, 400], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (this.course) await this.gridScore();
    else await this.ctx.say('wordsearch.cleared');
    await Promise.all([this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 }), this.ctx.tw.to(this.list, { alpha: 0 }, { duration: 0.3 })]);
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.title.visible = false;
    this.tally.visible = false;
    this.slideNote.visible = false;
    this.touchLayer.visible = false;
    this.buttonLayer.visible = false;
    this.buttonsG.visible = false;
    this.buttonText.visible = false;
    this.edges.visible = false;
    this.drag = null;
    sfx.tada();
    await this.ctx.say('wordsearch.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  /** A finger went down on the grid: the square lights at once, and what it does waits for the finger to move or lift. */
  private onDown = (e: FederatedPointerEvent) => {
    if (this.drag || this.busy || this.finished || !this.grid || palmOnGlass()) return;
    const p = this.touchLayer.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const cell = this.cellAt(e.global.x, e.global.y);
    this.drag = { id: e.pointerId, sx: p.x, sy: p.y, ox: this.scrollX, oy: this.scrollY, cell, moved: false, marking: false };
    if (cell >= 0) this.cursor = cell;
  };

  private onMove = (e: FederatedPointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || this.busy || this.finished) return;
    const p = this.touchLayer.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const dx = p.x - d.sx, dy = p.y - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < SLIDE) return;
    d.moved = true;
    if (this.maxX > 0 || this.maxY > 0) {
      // A grid bigger than its window slides under the finger.
      this.setScroll(d.ox - dx, d.oy - dy);
      return;
    }
    // A grid that is all in view: drag from a first letter to a last one, as on paper.
    if (d.cell >= 0 && !d.marking) {
      d.marking = true;
      this.anchor = d.cell;
      this.hinted = null;
      this.paintList();
      sfx.pop(5);
    }
    const at = this.cellAt(e.global.x, e.global.y);
    if (at >= 0) this.cursor = at;
  };

  private onUp = (e: FederatedPointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (this.busy || this.finished || !this.grid) return;
    if (!d.moved) {
      if (d.cell >= 0) this.tapCell(d.cell);
      return;
    }
    if (!d.marking) return;
    const end = this.cellAt(e.global.x, e.global.y);
    if (end < 0 || end === d.cell) return void this.cancel();
    this.cursor = end;
    // A drag that does not run straight is let go: neither right nor wrong, and it costs nothing.
    if (!lineBetween(this.n, d.cell, end)) { this.anchor = null; sfx.squeak(); return; }
    this.press();
  };

  private onCancel = () => {
    const d = this.drag;
    this.drag = null;
    if (d?.marking) this.cancel();
  };

  /** The square under a point on the screen, or -1. */
  private cellAt(gx: number, gy: number) {
    const p = this.board.toLocal({ x: gx, y: gy });
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return -1;
    const c = Math.floor(p.x / this.cell), r = Math.floor(p.y / this.cell);
    return c < 0 || r < 0 || c >= this.n || r >= this.n ? -1 : r * this.n + c;
  }

  /**
   * A tap on a square. The first marks a word's first letter; a second on the same square lets go; a second on a square the
   * mark does not run straight to moves the first letter there (free); a second on a straight line checks it.
   */
  private tapCell(i: number) {
    this.cursor = i;
    if (this.anchor !== null && i !== this.anchor && !lineBetween(this.n, this.anchor, i)) {
      this.anchor = i;
      this.hinted = null;
      this.paintList();
      sfx.pop(5);
      return;
    }
    this.press();
  }

  /** A finger on a button: it sinks at once, then does its work. */
  private tapSlot(k: number) {
    if (this.busy || this.finished || !this.grid) return;
    this.pressed = { slot: k, until: this.clock + 0.15 };
    if (this.slots[k].kind === 'hint') this.askForHint();
    else this.restart();
    this.paintButtons();
  }

  /** Only a controller (the couch, or the couch's own demonstration) calls `control`: from then on the grid is laid out for it. */
  private useController() {
    this.touch = false;
    this.drag = null;
    this.touchLayer.visible = false;
    this.buttonLayer.visible = false;
    this.buttonsG.visible = false;
    this.buttonText.visible = false;
    this.frame.visible = false;
    this.edges.visible = false;
    this.slideNote.visible = false;
    this.clip.mask = null;
    this.scrollX = 0;
    this.scrollY = 0;
    this.board.position.set(0, 0);
    this.title.style.fontSize = 28;
    this.tally.style.fontSize = 24;
    this.resize(this.view);
  }

  control(input: CouchControls, dt: number) {
    if (this.touch) this.useController();
    if (this.busy || this.finished || !this.grid) return;
    for (const dir of this.held.poll(input, dt)) this.move(dir);
    if (input.players.some((p) => p.action)) this.press();
    else if (input.players.some((p) => p.undo)) this.cancel();
  }

  private move(dir: number) {
    const n = this.n, r = Math.floor(this.cursor / n), c = this.cursor % n;
    const nr = Math.min(n - 1, Math.max(0, r + [0, 1, 0, -1][dir])), nc = Math.min(n - 1, Math.max(0, c + [1, 0, -1, 0][dir]));
    const to = nr * n + nc;
    if (to === this.cursor) return;
    this.cursor = to;
    sfx.tick();
  }

  /** The bottom button: mark the first letter of a line, then (with the cursor on its last letter) check the line. */
  private press() {
    if (this.anchor === null) {
      this.anchor = this.cursor;
      this.hinted = null;
      this.paintList();
      sfx.pop(5);
      return;
    }
    if (this.cursor === this.anchor) return this.cancel();
    const line = lineBetween(this.n, this.anchor, this.cursor);
    // A crooked mark cannot be checked: it is neither right nor wrong, and costs nothing.
    if (!line) return void sfx.squeak();
    this.anchor = null;
    this.guesses++;
    const hit = wordAt(this.grid, line, this.found);
    if (hit < 0) {
      this.misses++;
      sfx.boing();
      if (!this.told.miss) {
        this.told.miss = true;
        void this.ctx.say('wordsearch.miss');
      }
    } else {
      this.found.add(hit);
      this.dirty = true;
      if (this.hinted?.word === hit) this.hinted = null;
      line.forEach((_, k) => sfx.bell(3 + (k % 7), 0.12));
      void this.ctx.say('wordsearch.found', { word: spoken(this.grid.words[hit].word) });
    }
    this.paintList();
    this.report();
    if (this.found.size === this.grid.words.length) void this.cleared();
  }

  /** The left button: let go of the line being marked. Nothing is counted. */
  private cancel() {
    if (this.anchor === null) return;
    this.anchor = null;
    sfx.pop(2);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": the first letter of a word not found yet, with the word named. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.grid) return;
    const h = hintFor(this.grid, this.found, this.cursor);
    if (!h) return;
    this.hinted = h;
    this.hints++;
    this.assisted = true;
    this.anchor = null;
    this.cursor = h.cell;
    // A ring off the window would be no hint at all: slide the grid so the letter is in view.
    this.showCell(h.cell);
    this.report();
    this.paintList();
    void this.ctx.say('wordsearch.hint', { word: spoken(this.grid.words[h.word].word) });
  }

  /** Couch pause menu: forget what was found and look again. Guesses already made keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.grid || this.busy) return;
    this.found = new Set();
    this.anchor = null;
    this.hinted = null;
    this.dirty = true;
    this.paintList();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** The ghost finger on the how-to card: tap a word's first letter and its last, sliding the grid first when a letter is out of view. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.grid || !this.touch) return null;
    const i = this.grid.words.findIndex((_, k) => !this.found.has(k));
    if (i < 0) return null;
    const cells = cellsOfWord(this.n, this.grid.words[i]);
    const first = cells[0], last = cells[cells.length - 1];
    // A mark begun at the wrong letter is let go by tapping it again.
    const target = this.anchor !== null && this.anchor !== first ? this.anchor : this.anchor === null ? first : last;
    if (!this.inView(target)) {
      const c = this.center(target), L = this.touchLayer, { x, y, w, h } = this.vp;
      const nx = Math.min(this.maxX, Math.max(0, c.x + EDGE - w / 2)), ny = Math.min(this.maxY, Math.max(0, c.y + EDGE - h / 2));
      const dx = nx - this.scrollX, dy = ny - this.scrollY;
      // The finger drags the grid the other way: it ends where the grid has moved by the same distance.
      const cx = x + w / 2, cy = y + h / 2;
      return { trace: { on: L, x: cx + dx / 2, y: cy + dy / 2 }, via: [{ on: L, x: cx - dx / 2, y: cy - dy / 2 }], receiver: L, pause: 0.4 };
    }
    const at = this.center(target);
    return { tap: { on: this.board, x: at.x, y: at.y }, receiver: this.touchLayer, pause: this.anchor === null ? 0.35 : 0.7 };
  }

  /** A bot that finds the words in list order: walk to a word's first letter, mark it, walk to its last letter, check. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.grid || this.botWait > 0) return out;
    const i = this.grid.words.findIndex((_, k) => !this.found.has(k));
    if (i < 0) return out;
    const cells = cellsOfWord(this.n, this.grid.words[i]);
    const p = out.players[0];
    p.active = true;
    const first = cells[0], last = cells[cells.length - 1], n = this.n;
    // A mark begun in the wrong place is let go first.
    if (this.anchor !== null && this.anchor !== first) { p.undo = true; this.botWait = 0.2; return out; }
    const target = this.anchor === null ? first : last;
    if (this.cursor !== target) {
      const fr = Math.floor(this.cursor / n), fc = this.cursor % n, tr = Math.floor(target / n), tc = target % n;
      p.direction = Math.abs(tc - fc) >= Math.abs(tr - fr) && fc !== tc ? (tc > fc ? 0 : 2) : tr > fr ? 1 : tr < fr ? 3 : tc > fc ? 0 : 2;
      this.botWait = 0.07;
      return out;
    }
    p.action = true;
    this.botWait = this.anchor === null ? 0.25 : 0.7;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** A little grid of letters with a word found across it. */
function miniGrid(cell: number): Container {
  const c = new Container();
  const rows = ['SFROG', 'WEATK', 'IPQLN', 'MNEWT', 'DUCKS'];
  const w = rows.length * cell;
  c.addChild(new Graphics().roundRect(-w / 2 - 8, -w / 2 - 8, w + 16, w + 16, 14).fill(PAPER).stroke({ width: 5, color: 0x9c6b3c }));
  const band = new Graphics().moveTo(-w / 2 + cell * 1.5, -w / 2 + cell * 0.5).lineTo(-w / 2 + cell * 4.5, -w / 2 + cell * 0.5).stroke({ width: cell * 0.82, color: swatch.pink.fill, alpha: 0.55, cap: 'round' });
  c.addChild(band);
  rows.forEach((row, r) => [...row].forEach((ch, k) => {
    const t = label(ch, Math.round(cell * 0.62), ink);
    t.position.set(-w / 2 + k * cell + cell / 2, -w / 2 + r * cell + cell / 2 + 1);
    c.addChild(t);
  }));
  return c;
}

class WordIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const mini = miniGrid(34);
    mini.position.set(0, -100);
    c.addChild(mini);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(swatch.pink.light).stroke({ width: 6, color: swatch.pink.line }));
  const word = rng.pick(['FROG', 'DUCK', 'LILY', 'SWAN', 'ROSE', 'BLOOM']);
  const band = new Graphics().moveTo(-46, 0).lineTo(46, 0).stroke({ width: 52, color: 0xffffff, alpha: 0.8, cap: 'round' });
  c.addChild(band);
  [...word].forEach((ch, k) => { const t = label(ch, 30, ink); t.position.set(-34 + k * 23, 1); c.addChild(t); });
  return c;
}

export const wordSearch: GameModule = {
  id: 'word-search',
  name: 'Word Search',
  titleLine: 'game.word-search',
  region: 'story-grove',
  skills: ['vocabulary', 'visual-scanning', 'spelling'],
  bands: ['grownup'],
  inputs: ['touch', 'controller'],
  touchDemo: true,
  coplayHint: 'Tap the first letter of a word, then its last letter. Ask which word to hunt for next, and where the tricky ones might hide: slanted, or backwards.',
  offScreen: 'Hide a few words in a grid of letters on paper for someone else to find.',
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  hubIcon: () => new WordIcon(),
  sticker,
  create: (ctx) => new WordSearch(ctx),
};
