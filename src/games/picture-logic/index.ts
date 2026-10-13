import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT, label } from '../../ui/text';
import { LETTERS } from '../pixel-pictures/logic';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseMinimum, coursePictures, isPictureCourse } from './course';
import {
  allLines, axisOf, brushFor, cellsOf, clueDepths, clueText, CLUE_STEP_X, CLUE_STEP_Y, CROSSED, EMPTY, FILLED, headStart, hintFor, isSolved, lineName, makePuzzles, PAD, paint,
  planFor, statusOf, strokeCells, toolForHint, touchFrame, type Axis, type Brush, type Hint, type Line, type LineStatus, type Mark, type PicturePlan, type PicturePuzzle,
  type Tool, type TouchFrame,
} from './logic';

/** Grown-up play only. */
const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };

const PAPER = 0xfffdf6;
const GRID_LINE = 0xb9b0a0;
const GUIDE_LINE = 0x6d6558;
const FILL = 0x2f4a8a;
const DONE = 0xa8a294;
const OVER = 0xc23a40;

interface Stroke {
  brush: Brush;
  button: 'fill' | 'cross';
}

/** A finger on the picture: either painting a stroke along a row or column, or sliding the picture under it. */
interface Touch {
  id: number;
  mode: 'paint' | 'slide';
  /** Painting: the square it began on and the row or column it settled on. */
  start: number;
  axis: Axis | null;
  /** Where the finger is, in stage units, and where a slide began. */
  x: number;
  y: number;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
}

/** Touch play: how close to the window's edge a painting finger starts to slide the picture along, and how fast (units a second). */
const EDGE_ZONE = 48;
const EDGE_SPEED = 420;

class PictureLogic implements Game {
  readonly plan: PicturePlan;
  index = -1;
  misses = 0;
  hints = 0;
  /** Fills beyond each picture's squares, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  puzzle!: PicturePuzzle;
  marks: Mark[] = [];
  cursor = 0;
  /** Squares made filled on this picture, taken out again or not: every fill counts, emptying and crosses do not. */
  fills = 0;
  hinted: Hint | null = null;

  /** Touch play (every play outside the couch): tap or drag along a row or column to fill. Couch play drives the same picture with a controller. */
  touch: boolean;
  tool: Tool = 'fill';
  frame: TouchFrame | null = null;
  /** How far the picture is slid under its window (0 when all of it is in view), in logical units. */
  scrollX = 0;
  scrollY = 0;
  /** The buttons' hit areas over the stage. */
  slotNodes: Container[] = [];
  /** The hit layer over the paper: a finger that lands on it paints or slides. */
  readonly touchLayer = new Graphics();
  private readonly buttonLayer = new Container();
  private readonly buttonsG = new Graphics();
  private readonly buttonText = new Container();
  private readonly paper = new Graphics();
  private readonly edges = new Graphics();
  private readonly gridClip = new Container();
  private readonly gridMask = new Graphics();
  private readonly rowMask = new Graphics();
  private readonly colMask = new Graphics();
  private readonly rowLayer = new Container();
  private readonly colLayer = new Container();
  private pressed: { slot: number; until: number } | null = null;
  private drag: Touch | null = null;
  /** The square last touched shows its row and column; before any touch, a touch game shows none. */
  private touched = false;
  private edgesDirty = true;

  private readonly puzzles: PicturePuzzle[];
  private readonly board = new Container();
  private readonly cells = new Graphics();
  private readonly clueLayer = new Container();
  private readonly glow = new Graphics();
  private readonly info = label('', 30, ink);
  private readonly sub = label('', 22, ink, '500');
  private readonly banner: Text;
  private readonly bannerBox = new Container();
  private readonly bannerBg = new Graphics();
  private rowTexts: Text[][] = [];
  private colTexts: Text[][] = [];
  private status: LineStatus[] = [];
  private cell = 30;
  private gap = 16;
  private rowDepth = 1;
  private colDepth = 1;
  private clock = 0;
  private view: View;
  private dirty = true;
  private stroke: Stroke | null = null;
  private readonly held = new HeldDirection();
  private botWait = 0.8;
  private botRun: { cells: number[]; at: number } | null = null;
  /** Couch challenge course: fixed pictures in a row. Null in ordinary play, where pictures are drawn from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Fills already spent on the picture we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private told = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isPictureCourse(run.id)) {
      this.puzzles = coursePictures(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.puzzles = makePuzzles(ctx.level, ctx.rng);
      this.course = null;
    }
    this.banner = new Text({ text: '', style: { fontFamily: FONT, fontSize: 22, fill: ink, fontWeight: '500', align: 'left', wordWrap: true, wordWrapWidth: 260, lineHeight: 28 } });
    this.banner.position.set(12, 8);
    this.bannerBox.addChild(this.bannerBg, this.banner);
    this.bannerBox.visible = false;
    for (const part of [this.board, this.cells, this.clueLayer, this.rowLayer, this.colLayer, this.glow, this.info, this.sub, this.banner, this.bannerBox, this.bannerBg]) part.eventMode = 'none';
    for (const part of [this.paper, this.edges, this.gridClip, this.gridMask, this.rowMask, this.colMask, this.buttonsG, this.buttonText]) part.eventMode = 'none';
    this.board.addChild(this.cells, this.glow);
    this.gridClip.addChild(this.board, this.gridMask);
    this.clueLayer.addChild(this.rowLayer, this.colLayer, this.rowMask, this.colMask);
    ctx.stage.addChild(this.paper, this.gridClip, this.clueLayer, this.edges, this.info, this.sub, this.bannerBox);
    this.touch = !ctx.couch;
    if (this.touch) {
      // One layer over the paper decides what a finger meant: on a square it paints, anywhere else (or with Slide on) it slides.
      const L = this.touchLayer;
      L.eventMode = 'static';
      L.cursor = 'pointer';
      L.on('pointerdown', this.onDown);
      L.on('globalpointermove', this.onMove);
      L.on('pointerup', this.onUp);
      L.on('pointerupoutside', this.onUp);
      L.on('pointercancel', this.onUp);
      ctx.stage.addChild(this.touchLayer, this.buttonsG, this.buttonText, this.buttonLayer);
    }
  }

  get n() { return this.puzzle.size; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    if (this.touch) return this.resizeTouch(v);
    const n = this.n;
    // The controller reminder covers the bottom of the screen for the first ten seconds, so the picture stays above it.
    const room = v.h - 100 - 200;
    this.gap = Math.min(24, Math.max(15, Math.floor(room / (n * 2.2))));
    this.cell = Math.max(22, Math.min(46, Math.floor((room - this.colDepth * this.gap) / n)));
    const gutter = this.rowDepth * this.gap * 1.1 + 30, width = gutter + n * this.cell;
    const left = Math.max(152, (v.w - width - 300) / 2);
    this.board.position.set(left + gutter, 100 + this.colDepth * this.gap + 30);
    this.clueLayer.position.set(this.board.x, this.board.y);
    const right = this.board.x + n * this.cell + 36;
    this.info.anchor.set(0, 0.5);
    this.sub.anchor.set(0, 0.5);
    this.info.position.set(right, this.board.y + 20);
    this.sub.position.set(right, this.board.y + 60);
    this.bannerBox.position.set(right, this.board.y + 100);
    (this.banner.style as { wordWrapWidth: number }).wordWrapWidth = Math.max(220, v.w - right - 44);
    this.showBanner(this.banner.text);
    this.layoutClues();
    this.dirty = true;
  }

  /**
   * Touch layout. The squares are at least 64 across, so a picture that does not fit its window slides: the clue numbers stay
   * pinned along its top and left and the squares move under them. The buttons sit beside the picture, or under it on a tall view.
   */
  private resizeTouch(v: View) {
    const { rowDepth, colDepth } = clueDepths(this.puzzle);
    const f = touchFrame(v.w, v.h, this.n, rowDepth, colDepth);
    this.frame = f;
    this.cell = f.cell;
    this.scrollX = Math.min(f.maxX, Math.max(0, this.scrollX));
    this.scrollY = Math.min(f.maxY, Math.max(0, this.scrollY));
    const { paper, grid } = f;
    this.paper.clear().roundRect(paper.x, paper.y, paper.w, paper.h, 16).fill(PAPER).stroke({ width: 4, color: GUIDE_LINE });
    // The strips the clue numbers sit in.
    this.paper.rect(paper.x + 2, grid.y, f.gutterX - 2, grid.h - 2).fill({ color: swatch.blue.light, alpha: 0.35 });
    this.paper.rect(grid.x, paper.y + 2, grid.w - 2, f.gutterY - 2).fill({ color: swatch.blue.light, alpha: 0.35 });
    this.gridMask.clear().rect(grid.x, grid.y, grid.w - 2, grid.h - 2).fill(0xffffff);
    this.rowMask.clear().rect(paper.x, grid.y, f.gutterX, grid.h).fill(0xffffff);
    this.colMask.clear().rect(grid.x, paper.y, grid.w, f.gutterY).fill(0xffffff);
    this.gridClip.mask = this.gridMask;
    this.rowLayer.mask = this.rowMask;
    this.colLayer.mask = this.colMask;
    this.paper.visible = true;
    this.clueLayer.position.set(0, 0);
    this.touchLayer.clear().rect(paper.x, paper.y, paper.w, paper.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.touchLayer.hitArea = new Rectangle(paper.x, paper.y, paper.w, paper.h);
    this.touchLayer.visible = true;
    for (const node of this.buttonLayer.removeChildren()) node.destroy();
    this.slotNodes = f.slots.map((slot, k) => {
      const node = new Container();
      node.position.set(slot.x, slot.y);
      node.hitArea = new Rectangle(0, 0, slot.w, slot.h);
      onTap(node, () => this.tapSlot(k), { cooldown: 60 });
      this.buttonLayer.addChild(node);
      return node;
    });
    const i = f.info;
    this.info.anchor.set(f.side ? 0.5 : 0, 0.5);
    this.sub.anchor.set(f.side ? 0.5 : 0, 0.5);
    this.info.style.fontSize = 26;
    this.sub.style.fontSize = 18;
    if (f.side) {
      this.info.position.set(i.x + i.w / 2, i.y + 14);
      this.sub.position.set(i.x + i.w / 2, i.y + 52);
      (this.sub.style as { wordWrap: boolean; wordWrapWidth: number; align: string }).wordWrap = true;
      (this.sub.style as { wordWrapWidth: number }).wordWrapWidth = i.w;
    } else {
      this.info.style.fontSize = 24;
      this.info.position.set(i.x + 8, i.y + 22);
    }
    this.sub.style.align = f.side ? 'center' : 'left';
    // The hint's words go along the top, clear of the home button.
    this.bannerBox.position.set(160, 10);
    (this.banner.style as { wordWrapWidth: number }).wordWrapWidth = Math.max(220, v.w - 160 - 140 - 24);
    this.showBanner(this.banner.text);
    this.layoutBoard();
    this.paintButtons();
    this.edgesDirty = true;
    this.dirty = true;
  }

  /** The squares sit at the window's top left, slid by the scroll; a picture smaller than its window is centred in it. */
  private layoutBoard() {
    const f = this.frame;
    if (!f) return;
    const size = this.n * this.cell, { grid } = f;
    const offX = f.maxX > 0 ? PAD / 2 : (grid.w - size) / 2, offY = f.maxY > 0 ? PAD / 2 : (grid.h - size) / 2;
    this.board.position.set(grid.x + offX - this.scrollX, grid.y + offY - this.scrollY);
    // The clue numbers: along the squares they describe, and held at the paper's edge across them.
    this.rowLayer.position.set(f.paper.x, this.board.y);
    this.colLayer.position.set(this.board.x, f.paper.y);
    this.layoutClues();
  }

  /** Slide the picture to `x`, `y` (kept inside what there is to see). */
  setScroll(x: number, y: number) {
    const f = this.frame;
    if (!f) return;
    this.scrollX = Math.min(f.maxX, Math.max(0, x));
    this.scrollY = Math.min(f.maxY, Math.max(0, y));
    this.layoutBoard();
    this.edgesDirty = true;
  }

  /** Slide so that a square is in the middle of the window (or as near as the edges allow). */
  private showCell(i: number) {
    const f = this.frame;
    if (!this.touch || !f || (f.maxX <= 0 && f.maxY <= 0)) return;
    const c = this.centerOf(i);
    this.setScroll(c.x + PAD / 2 - f.grid.w / 2, c.y + PAD / 2 - f.grid.h / 2);
  }

  /** Is this square wholly inside the window? */
  private inView(i: number, margin = 4) {
    const f = this.frame;
    if (!f) return true;
    const c = this.centerOf(i), r = this.cell / 2, x = this.board.x + c.x, y = this.board.y + c.y, g = f.grid;
    return x - r >= g.x + margin && x + r <= g.x + g.w - margin && y - r >= g.y + margin && y + r <= g.y + g.h - margin;
  }

  private centerOf(i: number) {
    return { x: (i % this.n) * this.cell + this.cell / 2, y: Math.floor(i / this.n) * this.cell + this.cell / 2 };
  }

  /** The tool and help buttons, each a tile that sinks while it is pressed; the tool in use is lit. */
  private paintButtons() {
    const f = this.frame, g = this.buttonsG.clear();
    this.buttonText.removeChildren().forEach((c) => c.destroy());
    if (!f) return;
    f.slots.forEach((s, k) => {
      const down = this.pressed?.slot === k && this.clock < this.pressed.until ? 3 : 0;
      const sw = s.kind === 'fill' ? swatch.blue : s.kind === 'cross' ? swatch.red : s.kind === 'slide' ? swatch.orange : s.kind === 'hint' ? swatch.yellow : swatch.teal;
      const on = s.kind === this.tool;
      const text = s.kind === 'fill' ? 'Fill' : s.kind === 'cross' ? 'Cross' : s.kind === 'slide' ? 'Slide' : s.kind === 'hint' ? 'Hint' : 'Start over';
      const mark = s.kind === 'fill' ? '■' : s.kind === 'cross' ? '✕' : s.kind === 'slide' ? '✥' : s.kind === 'hint' ? '◇' : '↺';
      g.roundRect(s.x, s.y + 4, s.w, s.h, 14).fill(sw.line);
      g.roundRect(s.x, s.y + down, s.w, s.h, 14).fill(on ? sw.fill : sw.light).stroke({ width: on ? 6 : 3, color: on ? ink : sw.line });
      const t = label(`${mark} ${text}`, 24, on && s.kind !== 'cross' && s.kind !== 'fill' ? ink : on ? 0xffffff : ink);
      if (t.width > s.w - 12) t.scale.set((s.w - 12) / t.width);
      t.position.set(s.x + s.w / 2, s.y + s.h / 2 + down);
      this.buttonText.addChild(t);
    });
  }

  /** A soft strip along each edge of the window that has more of the picture beyond it. */
  private paintEdges() {
    this.edgesDirty = false;
    const f = this.frame, g = this.edges.clear();
    if (!f || (f.maxX <= 0 && f.maxY <= 0)) return;
    const { x, y, w, h } = f.grid, t = 12, col = swatch.orange.fill;
    const tri = (cx: number, cy: number, dx: number, dy: number) => g.poly([cx + dx * 7, cy + dy * 7, cx - dy * 8 - dx * 5, cy + dx * 8 - dy * 5, cx + dy * 8 - dx * 5, cy - dx * 8 - dy * 5]).fill(col);
    if (this.scrollX > 1) { g.rect(x, y, t, h - 2).fill({ color: col, alpha: 0.3 }); tri(x + t / 2, y + h / 2, -1, 0); }
    if (this.scrollX < f.maxX - 1) { g.rect(x + w - t - 2, y, t, h - 2).fill({ color: col, alpha: 0.3 }); tri(x + w - t / 2 - 2, y + h / 2, 1, 0); }
    if (this.scrollY > 1) { g.rect(x, y, w - 2, t).fill({ color: col, alpha: 0.3 }); tri(x + w / 2, y + t / 2, 0, -1); }
    if (this.scrollY < f.maxY - 1) { g.rect(x, y + h - t - 2, w - 2, t).fill({ color: col, alpha: 0.3 }); tri(x + w / 2, y + h - t / 2 - 2, 0, 1); }
  }

  private showBanner(text: string) {
    this.banner.text = text;
    this.bannerBox.visible = text !== '';
    const g = this.bannerBg.clear();
    if (text) g.roundRect(0, 0, this.banner.width + 24, this.banner.height + 16, 14).fill({ color: swatch.yellow.light, alpha: 0.95 }).stroke({ width: 3, color: swatch.yellow.line });
  }

  private at(i: number) {
    return { x: (i % this.n) * this.cell, y: Math.floor(i / this.n) * this.cell };
  }

  /** The clue numbers, drawn once per picture and placed again on a resize. */
  private buildClues() {
    this.rowLayer.removeChildren().forEach((c) => c.destroy());
    this.colLayer.removeChildren().forEach((c) => c.destroy());
    this.rowTexts = [];
    this.colTexts = [];
    const p = this.puzzle;
    this.rowDepth = Math.max(...p.rowClues.map((c) => c.length));
    this.colDepth = Math.max(...p.colClues.map((c) => c.length));
    for (const [texts, clues, layer] of [[this.rowTexts, p.rowClues, this.rowLayer], [this.colTexts, p.colClues, this.colLayer]] as const) {
      for (const clue of clues) {
        const line = clue.map((n) => { const t = label(String(n), 20, ink); t.eventMode = 'none'; layer.addChild(t); return t; });
        texts.push(line);
      }
    }
  }

  private layoutClues() {
    const f = this.touch ? this.frame : null;
    if (f) {
      // Touch: each strip is as deep as the picture's longest clue; the last number of a clue sits next to the squares.
      this.rowTexts.forEach((texts, r) => texts.forEach((t, k) => {
        t.style.fontSize = 22;
        t.position.set(f.gutterX - 8 - CLUE_STEP_X / 2 - (texts.length - 1 - k) * CLUE_STEP_X, r * this.cell + this.cell / 2);
      }));
      this.colTexts.forEach((texts, c) => texts.forEach((t, k) => {
        t.style.fontSize = 22;
        t.position.set(c * this.cell + this.cell / 2, f.gutterY - 8 - CLUE_STEP_Y / 2 - (texts.length - 1 - k) * CLUE_STEP_Y);
      }));
      return this.paintClues();
    }
    const cell = this.cell, gap = this.gap, size = Math.round(Math.min(26, Math.max(15, cell * 0.5)));
    this.rowTexts.forEach((texts, r) => texts.forEach((t, k) => {
      t.style.fontSize = size;
      t.position.set(-28 - (texts.length - 1 - k) * gap * 1.1, r * cell + cell / 2);
    }));
    this.colTexts.forEach((texts, c) => texts.forEach((t, k) => {
      t.style.fontSize = size;
      t.position.set(c * cell + cell / 2, -26 - (texts.length - 1 - k) * gap);
    }));
    this.paintClues();
  }

  private paintClues() {
    const colorOf = (s: LineStatus) => (s === 'done' ? DONE : s === 'over' ? OVER : ink);
    allLines(this.n).forEach((line, k) => {
      const texts = line.kind === 'row' ? this.rowTexts[line.index] : this.colTexts[line.index], s = this.status[k] ?? 'open';
      for (const t of texts) { t.style.fill = colorOf(s); t.style.fontWeight = s === 'done' ? '500' : '600'; }
    });
  }

  /** The grid: paper, the guide lines every five, the cursor's row and column, and the marks. */
  private paint() {
    this.dirty = false;
    const g = this.cells.clear(), n = this.n, cell = this.cell, w = n * cell;
    g.roundRect(-14, -14, w + 28, w + 28, 14).fill(PAPER).stroke({ width: 4, color: GUIDE_LINE });
    const cr = Math.floor(this.cursor / n), cc = this.cursor % n;
    // The cursor's row and column, so a number far away is easy to follow (by touch, those of the square last touched).
    if (!this.touch || this.touched) {
      g.rect(0, cr * cell, w, cell).fill({ color: swatch.blue.fill, alpha: 0.12 });
      g.rect(cc * cell, 0, cell, w).fill({ color: swatch.blue.fill, alpha: 0.12 });
    }
    for (let k = 1; k < n; k++) {
      const guide = k % 5 === 0;
      g.moveTo(k * cell, 0).lineTo(k * cell, w).stroke({ width: guide ? 3 : 1, color: guide ? GUIDE_LINE : GRID_LINE });
      g.moveTo(0, k * cell).lineTo(w, k * cell).stroke({ width: guide ? 3 : 1, color: guide ? GUIDE_LINE : GRID_LINE });
    }
    for (let i = 0; i < this.marks.length; i++) {
      const { x, y } = this.at(i), m = this.marks[i];
      if (m === FILLED) g.roundRect(x + 2, y + 2, cell - 4, cell - 4, Math.max(3, cell * 0.14)).fill(FILL);
      else if (m === CROSSED) {
        const a = cell * 0.3;
        g.moveTo(x + a, y + a).lineTo(x + cell - a, y + cell - a).moveTo(x + cell - a, y + a).lineTo(x + a, y + cell - a).stroke({ width: Math.max(2, cell * 0.08), color: 0x8a8478, cap: 'round' });
      }
    }
    const fills = `${this.fills} ${this.fills === 1 ? 'fill' : 'fills'}`, size = `${this.puzzle.par} squares in the picture`;
    // Upright, the tally and the size share one line above the buttons.
    const line = this.touch && this.frame && !this.frame.side;
    this.info.text = line ? `${fills} · ${size}` : fills;
    this.sub.text = line ? '' : size;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.puzzle) return;
    if (this.dirty) this.paint();
    if (this.touch) {
      if (this.pressed && this.clock >= this.pressed.until) { this.pressed = null; this.paintButtons(); }
      if (this.edgesDirty) this.paintEdges();
      this.edgeSlide(dt);
    }
    const g = this.glow.clear();
    if (this.finished || this.busy) return;
    const cell = this.cell, at = this.at(this.cursor);
    if (this.hinted) {
      const h = this.hinted, pulse = 5 + 2 * Math.sin(this.clock * 6);
      if (h.kind !== 'fix') {
        const line = h.line;
        const first = this.at(cellsOf(this.n, line)[0]);
        if (line.kind === 'row') g.roundRect(-6, first.y + 1, this.n * cell + 12, cell - 2, 8).stroke({ width: 4, color: swatch.yellow.fill });
        else g.roundRect(first.x + 1, -6, cell - 2, this.n * cell + 12, 8).stroke({ width: 4, color: swatch.yellow.fill });
      }
      const m = this.at(h.cell);
      g.roundRect(m.x - 3, m.y - 3, cell + 6, cell + 6, 10).stroke({ width: pulse, color: h.kind === 'fix' ? swatch.red.fill : swatch.yellow.fill });
    }
    // By touch the square under a painting finger is ringed; a couch player's cursor always is.
    if (!this.touch || this.drag?.mode === 'paint') g.roundRect(at.x, at.y, cell, cell, 8).stroke({ width: 4, color: ink });
  }

  destroy() {
    this.drag = null;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and pictures                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.puzzles.length) return void this.finale();
    this.puzzle = this.puzzles[this.index];
    // The how-to card's demonstration shows a few strokes, not a whole picture: most of it is already filled in.
    this.marks = this.ctx.demo ? headStart(this.puzzle) : this.puzzle.solution.map((): Mark => EMPTY);
    this.fills = this.carry;
    this.carry = 0;
    this.hinted = null;
    this.stroke = null;
    this.drag = null;
    this.botRun = null;
    this.touched = false;
    this.tool = 'fill';
    this.scrollX = 0;
    this.scrollY = 0;
    this.cursor = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    this.showBanner('');
    this.buildClues();
    this.status = allLines(this.n).map((l) => statusOf(this.marks, this.puzzle, l));
    this.resize(this.view);
    this.board.scale.set(1);
    this.board.alpha = 0;
    this.clueLayer.alpha = 0;
    await Promise.all([this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 }), this.ctx.tw.to(this.clueLayer, { alpha: 1 }, { duration: 0.3 })]);
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    const f = this.frame;
    return this.ctx.instruct(!this.touch ? 'picture.go' : f && (f.maxX > 0 || f.maxY > 0) ? 'picture.go-slide' : 'picture.go-touch');
  }

  /** Hand a course's numbers to the shell. `finished` means the picture just ended, so none of its fills are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.puzzles.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.fills,
      par: this.puzzle.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the picture just finished, over the board for a moment. */
  private async pictureScore() {
    const best = this.puzzle.par, total = this.puzzles.length;
    const text = this.fills === best ? `Picture ${this.index + 1} of ${total}: ${this.fills} fills, the fewest possible!` : `Picture ${this.index + 1} of ${total}: ${this.fills} fills (fewest ${best})`;
    const note = label(text, 32, ink);
    note.position.set(this.view.w / 2, Math.max(44, this.board.y - this.colDepth * this.gap - 40));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.3);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  /** By touch, a picture bigger than its window shrinks to show all of itself on the paper before it takes its colors. */
  private async zoomOut() {
    const f = this.frame;
    if (!this.touch || !f || (f.maxX <= 0 && f.maxY <= 0)) return;
    const size = this.n * this.cell, k = Math.min((f.paper.w - 40) / size, (f.paper.h - 40) / size, 1);
    this.gridClip.mask = null;
    const x = f.paper.x + (f.paper.w - size * k) / 2, y = f.paper.y + (f.paper.h - size * k) / 2;
    await Promise.all([
      this.ctx.tw.to(this.clueLayer, { alpha: 0 }, { duration: 0.3 }),
      this.ctx.tw.to(this.board, { x, y }, { duration: 0.45 }),
      this.ctx.tw.to(this.board.scale, { x: k, y: k }, { duration: 0.45 }),
    ]);
  }

  /** The picture is complete: its squares take their colors, row by row, and it says what it is. */
  private async reveal() {
    this.busy = true;
    this.hinted = null;
    this.stroke = null;
    this.drag = null;
    this.showBanner('');
    this.excess += Math.max(0, this.fills - this.puzzle.par);
    if (this.course) {
      this.done.push(this.fills);
      this.report(true);
    }
    const n = this.n, cell = this.cell, paintLayer = new Graphics();
    paintLayer.eventMode = 'none';
    this.board.addChild(paintLayer);
    await this.zoomOut();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const ch = this.puzzle.rows[r][c];
        if (ch === '.') continue;
        paintLayer.roundRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4, Math.max(3, cell * 0.14)).fill(swatch[LETTERS[ch] ?? 'blue'].fill);
      }
      paintLayer.alpha = 1;
      sfx.bell(3 + (r % 7), 0.2);
      await this.ctx.tw.wait(0.08);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (n * cell) / 2, y: (n * cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 30, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('picture.reveal', { name: this.puzzle.name });
    if (this.course) await this.pictureScore();
    else await this.ctx.tw.wait(1.2);
    await Promise.all([this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 }), this.ctx.tw.to(this.clueLayer, { alpha: 0 }, { duration: 0.3 })]);
    paintLayer.destroy();
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.info.visible = false;
    this.sub.visible = false;
    this.touchLayer.visible = false;
    this.buttonLayer.visible = false;
    this.buttonsG.visible = false;
    this.buttonText.visible = false;
    this.edges.visible = false;
    this.drag = null;
    sfx.tada();
    await this.ctx.say('picture.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------------------------- */
  /* Touch controls                                                                                */
  /* -------------------------------------------------------------------------------------------- */

  /** The square under a point in stage units, or -1 when the point is off the squares. */
  private cellAt(x: number, y: number, clamp = false) {
    const c = Math.floor((x - this.board.x) / this.cell), r = Math.floor((y - this.board.y) / this.cell), n = this.n;
    if (!Number.isFinite(c) || !Number.isFinite(r)) return -1;
    if (clamp) return Math.min(n - 1, Math.max(0, r)) * n + Math.min(n - 1, Math.max(0, c));
    return c < 0 || r < 0 || c >= n || r >= n ? -1 : r * n + c;
  }

  private inGrid(x: number, y: number) {
    const g = this.frame?.grid;
    return !!g && x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h;
  }

  /** A finger went down. On a square it starts painting at once; on the clue strips, or with Slide on, it slides the picture. */
  private onDown = (e: FederatedPointerEvent) => {
    if (this.busy || this.finished || !this.puzzle || !this.frame || palmOnGlass()) return;
    // A release that never arrived (a system gesture can swallow it) must not freeze the picture: a new first finger starts afresh.
    if (this.drag) {
      if (!e.isPrimary) return;
      this.drag = null;
      this.stroke = null;
    }
    const p = this.touchLayer.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const base = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, ox: this.scrollX, oy: this.scrollY, axis: null };
    const at = this.tool === 'slide' || !this.inGrid(p.x, p.y) ? -1 : this.cellAt(p.x, p.y);
    if (at < 0) {
      this.drag = { ...base, mode: 'slide', start: -1 };
      return;
    }
    this.touched = true;
    this.cursor = at;
    this.dirty = true;
    const button = this.tool === 'cross' ? 'cross' : 'fill';
    this.stroke = { button, brush: brushFor(button, this.marks[at]) };
    this.drag = { ...base, mode: 'paint', start: at };
    this.apply(at);
  };

  private onMove = (e: FederatedPointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || this.busy || this.finished) return;
    const p = this.touchLayer.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    d.x = p.x;
    d.y = p.y;
    if (d.mode === 'slide') this.setScroll(d.ox - (p.x - d.sx), d.oy - (p.y - d.sy));
    else this.extend(d);
  };

  /** The stroke follows the finger along the row or column it began to move along, painting every square it passes. */
  private extend(d: Touch) {
    const at = this.cellAt(d.x, d.y, true);
    d.axis ??= axisOf(this.n, d.start, at);
    for (const i of strokeCells(this.n, d.start, d.axis, at)) {
      if (this.busy || !this.stroke) return;
      this.cursor = i;
      this.apply(i);
    }
    this.dirty = true;
  }

  /** A painting finger near the window's edge carries the picture along under it, so one stroke can cross a picture bigger than its window. */
  private edgeSlide(dt: number) {
    const d = this.drag, f = this.frame;
    if (!d || d.mode !== 'paint' || !f || this.busy || this.finished) return;
    const g = f.grid, step = EDGE_SPEED * dt;
    const vx = d.x < g.x + EDGE_ZONE ? -1 : d.x > g.x + g.w - EDGE_ZONE ? 1 : 0, vy = d.y < g.y + EDGE_ZONE ? -1 : d.y > g.y + g.h - EDGE_ZONE ? 1 : 0;
    // Only along the stroke's own line, so a sideways stroke does not wander up the picture.
    const ax = d.axis === 'column' ? 0 : vx, ay = d.axis === 'row' ? 0 : vy;
    if (!ax && !ay) return;
    const before = this.scrollX + this.scrollY * 1e4;
    this.setScroll(this.scrollX + ax * step, this.scrollY + ay * step);
    if (before !== this.scrollX + this.scrollY * 1e4) this.extend(d);
  }

  private onUp = (e: FederatedPointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    this.stroke = null;
    this.dirty = true;
  };

  /** A finger on a button: it sinks at once. A tool button picks the tool; Hint and Start over do their work. */
  private tapSlot(k: number) {
    const s = this.frame?.slots[k];
    if (!s || this.busy || this.finished || !this.puzzle) return;
    this.pressed = { slot: k, until: this.clock + 0.15 };
    if (s.kind === 'hint') this.askForHint();
    else if (s.kind === 'again') this.restart();
    else { this.tool = s.kind; sfx.pop(s.kind === 'fill' ? 3 : s.kind === 'cross' ? 2 : 4); }
    this.paintButtons();
  }

  /** Only a controller (the couch, or the couch's own demonstration) calls `control`: from then on the picture is laid out for it. */
  private useController() {
    this.touch = false;
    this.drag = null;
    this.stroke = null;
    for (const part of [this.touchLayer, this.buttonLayer, this.buttonsG, this.buttonText, this.edges, this.paper]) part.visible = false;
    this.gridClip.mask = null;
    this.rowLayer.mask = null;
    this.colLayer.mask = null;
    this.rowLayer.position.set(0, 0);
    this.colLayer.position.set(0, 0);
    this.scrollX = 0;
    this.scrollY = 0;
    this.info.anchor.set(0, 0.5);
    this.sub.anchor.set(0, 0.5);
    this.info.style.fontSize = 30;
    this.sub.style.fontSize = 22;
    (this.sub.style as { wordWrap: boolean }).wordWrap = false;
    this.sub.style.align = 'left';
    this.resize(this.view);
  }

  control(input: CouchControls, dt: number) {
    if (this.touch) this.useController();
    if (this.busy || this.finished || !this.puzzle) return;
    const fillHeld = input.players.some((p) => p.hold), crossHeld = input.players.some((p) => p.holdUndo);
    if (!fillHeld && !crossHeld) this.stroke = null;
    // A press starts a stroke on the square under the cursor; moving while it is held carries it along.
    if (input.players.some((p) => p.action)) {
      this.stroke = { button: 'fill', brush: brushFor('fill', this.marks[this.cursor]) };
      this.apply(this.cursor);
    } else if (input.players.some((p) => p.undo)) {
      this.stroke = { button: 'cross', brush: brushFor('cross', this.marks[this.cursor]) };
      this.apply(this.cursor);
    }
    for (const dir of this.held.poll(input, dt)) {
      this.move(dir);
      if (this.stroke && (this.stroke.button === 'fill' ? fillHeld : crossHeld)) this.apply(this.cursor);
    }
  }

  private move(dir: number) {
    const n = this.n, r = Math.floor(this.cursor / n), c = this.cursor % n;
    const nr = Math.min(n - 1, Math.max(0, r + [0, 1, 0, -1][dir])), nc = Math.min(n - 1, Math.max(0, c + [1, 0, -1, 0][dir]));
    const to = nr * n + nc;
    if (to === this.cursor) return;
    this.cursor = to;
    this.dirty = true;
  }

  /** Paint the square under the cursor with the stroke's brush. Only a fill counts. */
  private apply(i: number) {
    if (!this.stroke) return;
    const out = paint(this.marks[i], this.stroke.brush);
    if (!out.changed) return;
    this.marks[i] = out.mark;
    if (out.counted) {
      this.fills++;
      // A filled square that the picture does not have is a miss; it is never refused, and never shown as one.
      if (!this.puzzle.solution[i]) this.misses++;
      sfx.pop(3 + (i % 7));
      this.report();
    } else sfx.tick();
    if (this.hinted && this.hinted.cell === i) this.dismissHint();
    this.refreshLines(i);
    this.dirty = true;
    if (isSolved(this.marks, this.puzzle)) void this.reveal();
  }

  /** Re-read the two lines through a square: their clues turn grey when done, red when no way of filling them fits. */
  private refreshLines(i: number) {
    const n = this.n, row: Line = { kind: 'row', index: Math.floor(i / n) }, col: Line = { kind: 'column', index: i % n };
    this.status[row.index] = statusOf(this.marks, this.puzzle, row);
    this.status[n + col.index] = statusOf(this.marks, this.puzzle, col);
    this.paintClues();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": a mark that cannot be right first, otherwise a square one line decides. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.puzzle) return;
    const h = hintFor(this.marks, this.puzzle, this.cursor);
    if (!h) return;
    this.hinted = h;
    this.hints++;
    this.assisted = true;
    this.cursor = h.cell;
    this.stroke = null;
    this.dirty = true;
    // By touch, the hint switches to the tool it needs and slides its square into view.
    if (this.touch) {
      this.tool = toolForHint(h);
      this.showCell(h.cell);
      this.paintButtons();
    }
    this.report();
    const [line, vars] = this.hintLine(h);
    this.showBanner(voice.line(line, vars));
    void this.ctx.say(line, vars);
  }

  private hintLine(h: Hint): [LineId, Record<string, string | number>] {
    if (h.kind === 'fix') return [h.mark === FILLED ? (this.touch ? 'picture.hint-fix-touch' : 'picture.hint-fix') : this.touch ? 'picture.hint-fix-cross-touch' : 'picture.hint-fix-cross', {}];
    return [h.kind === 'fill' ? 'picture.hint-fill' : 'picture.hint-cross', { line: lineName(h.line), clue: clueText(h.clue) }];
  }

  private dismissHint() {
    this.hinted = null;
    this.showBanner('');
  }

  /** Couch pause menu: clear the picture back to empty. Fills already made keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.puzzle || this.busy) return;
    this.marks = this.puzzle.solution.map((): Mark => EMPTY);
    this.status = allLines(this.n).map((l) => statusOf(this.marks, this.puzzle, l));
    this.cursor = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    this.stroke = null;
    this.drag = null;
    this.touched = false;
    this.tool = 'fill';
    this.botRun = null;
    this.dismissHint();
    if (this.touch) this.paintButtons();
    this.paintClues();
    this.dirty = true;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /**
   * The ghost finger on the how-to card: it picks Fill, then drags along the next run of squares the picture still needs (sliding
   * the picture first when a run is out of view), and takes out a square that does not belong with Fill or Cross lifting it.
   */
  autotouch(): TouchIntent | null {
    const f = this.frame;
    if (this.busy || this.finished || !this.puzzle || !this.touch || !f) return null;
    const n = this.n, sol = this.puzzle.solution;
    const slot = (kind: Tool) => f.slots.findIndex((s) => s.kind === kind);
    const press = (kind: Tool) => {
      const k = slot(kind), s = f.slots[k];
      return { tap: { on: this.buttonLayer, x: s.x + s.w / 2, y: s.y + s.h / 2 }, receiver: this.slotNodes[k], pause: 0.3 } satisfies TouchIntent;
    };
    const wrong = this.marks.findIndex((m, i) => (m === FILLED && !sol[i]) || (m === CROSSED && sol[i]));
    const run = wrong >= 0 ? [wrong] : this.nextRun();
    if (!run) return null;
    const want: Tool = wrong >= 0 && this.marks[wrong] === CROSSED ? 'cross' : 'fill';
    // The part of the run that is in view from its first square; a run longer than the window is painted a piece at a time.
    const seen: number[] = [];
    for (const i of run) { if (!this.inView(i)) break; seen.push(i); }
    if (seen.length === 0) {
      // Slide first: the finger drags the picture the other way, so it ends where the picture has moved by the same distance. A run that
      // fits the window is centred in it; a longer one starts near the left edge, so most of it can be painted at once.
      const a = this.centerOf(run[0]), z = this.centerOf(run[run.length - 1]), g = f.grid;
      const fits = z.x - a.x + this.cell <= g.w - PAD * 2;
      const nx = Math.min(f.maxX, Math.max(0, (fits ? (a.x + z.x) / 2 + PAD / 2 - g.w / 2 : a.x + PAD / 2 - g.w * 0.12)));
      const ny = Math.min(f.maxY, Math.max(0, a.y + PAD / 2 - g.h / 2));
      const dx = nx - this.scrollX, dy = ny - this.scrollY, cx = g.x + g.w / 2, cy = g.y + g.h / 2;
      if (this.tool !== 'slide') return press('slide');
      return { trace: { on: this.touchLayer, x: cx + dx / 2, y: cy + dy / 2 }, via: [{ on: this.touchLayer, x: cx - dx / 2, y: cy - dy / 2 }], receiver: this.touchLayer, pause: 0.4 };
    }
    // A square that is wrong is taken out by a tap with the tool that put it there.
    if (this.tool !== want) return press(want);
    const at = (i: number) => ({ on: this.board, x: (i % n) * this.cell + this.cell / 2, y: Math.floor(i / n) * this.cell + this.cell / 2 });
    return seen.length === 1
      ? { tap: at(seen[0]), receiver: this.touchLayer, pause: 0.45 }
      : { trace: at(seen[0]), via: [at(seen[seen.length - 1])], receiver: this.touchLayer, pause: 0.5 };
  }

  /**
   * A bot that paints the picture the way a person does with a held button: it walks to the start of a run of squares, holds the
   * fill button while it moves along the run, and lets go at the end. It keeps the button down in every frame of a run, because
   * a stroke ends the moment the button is not held.
   */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.puzzle) return out;
    const p = out.players[0];
    p.active = true;
    const run = this.botRun;
    if (run) p.hold = run.at >= 0;
    if (this.botWait > 0) return out;
    if (!run) {
      const cells = this.nextRun();
      if (!cells) return out;
      this.botRun = { cells, at: -1 };
      return this.autoplay(0);
    }
    const start = run.cells[0], n = this.n;
    if (run.at < 0) {
      if (this.cursor !== start) {
        const fr = Math.floor(this.cursor / n), fc = this.cursor % n, tr = Math.floor(start / n), tc = start % n;
        p.direction = fc !== tc ? (tc > fc ? 0 : 2) : tr > fr ? 1 : 3;
        this.botWait = 0.07;
        return out;
      }
      // At the start of the run: press the fill button, and keep it down.
      p.action = true;
      p.hold = true;
      run.at = 0;
      this.botWait = 0.12;
      return out;
    }
    if (run.at + 1 < run.cells.length) {
      p.hold = true;
      p.direction = 0;
      run.at++;
      this.botWait = 0.09;
      return out;
    }
    // The end of the run: let go.
    p.hold = false;
    this.botRun = null;
    this.botWait = 0.1;
    return out;
  }

  /** The next horizontal run of the picture's squares that is not filled yet, scanning the rows from the top. */
  private nextRun(): number[] | null {
    const n = this.n;
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!this.puzzle.solution[r * n + c] || this.marks[r * n + c] === FILLED) { c++; continue; }
        const cells: number[] = [];
        while (c < n && this.puzzle.solution[r * n + c]) { cells.push(r * n + c); c++; }
        return cells;
      }
    }
    return null;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** A little picture-logic puzzle: a 5 by 5 grid with clue numbers and a heart half filled in. */
function miniPuzzle(cell: number): Container {
  const c = new Container();
  const heart = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const w = 5 * cell, clues = [[1, 1], [5], [5], [3], [1]], cols = [[2], [4], [4], [4], [2]];
  const g = new Graphics().roundRect(-w / 2 - 6, -w / 2 - 6, w + 12, w + 12, 12).fill(PAPER).stroke({ width: 4, color: GUIDE_LINE });
  heart.forEach((row, r) => [...row].forEach((ch, k) => {
    const x = -w / 2 + k * cell, y = -w / 2 + r * cell;
    g.roundRect(x + 1, y + 1, cell - 2, cell - 2, 5).fill(ch === '#' && r < 3 ? FILL : swatch.white.light).stroke({ width: 1, color: GRID_LINE });
  }));
  c.addChild(g);
  clues.forEach((cl, r) => { const t = label(cl.join(' '), Math.round(cell * 0.38), ink); t.position.set(-w / 2 - 22 - cl.length * 4, -w / 2 + r * cell + cell / 2); c.addChild(t); });
  cols.forEach((cl, k) => { const t = label(cl.join(' '), Math.round(cell * 0.38), ink); t.position.set(-w / 2 + k * cell + cell / 2, -w / 2 - 20); c.addChild(t); });
  return c;
}

class PictureIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const mini = miniPuzzle(34);
    mini.position.set(10, -100);
    c.addChild(mini);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const pool = makePuzzles(2, new Rng(seed)).concat(makePuzzles(3, new Rng(seed)));
  const pic = rng.pick(pool), cell = 11, w = pic.size * cell;
  c.addChild(new Graphics().circle(0, 0, 78).fill(swatch.blue.light).stroke({ width: 6, color: swatch.blue.line }));
  const g = new Graphics();
  for (let r = 0; r < pic.size; r++) for (let k = 0; k < pic.size; k++) {
    const ch = pic.rows[r][k];
    if (ch !== '.') g.rect(-w / 2 + k * cell, -w / 2 + r * cell, cell, cell).fill(swatch[LETTERS[ch] ?? 'blue'].fill);
  }
  g.scale.set(0.9);
  c.addChild(g);
  return c;
}

export const pictureLogic: GameModule = {
  id: 'picture-logic',
  name: 'Picture Logic',
  titleLine: 'game.picture-logic',
  region: 'puzzle-peaks',
  skills: ['logic', 'deduction', 'patterns'],
  bands: ['grownup'],
  inputs: ['touch', 'controller'],
  touchDemo: true,
  coplayHint: 'Fill the squares a number allows, and cross out the ones it rules out. Ask which row or column has a clue that leaves only one way to fit.',
  offScreen: 'Draw a grid on squared paper, write numbers beside the rows and columns, and shade the runs they ask for.',
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new PictureIcon(),
  sticker,
  create: (ctx) => new PictureLogic(ctx),
};
