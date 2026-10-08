import { Container, Graphics, Text } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT, label } from '../../ui/text';
import { LETTERS } from '../pixel-pictures/logic';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { courseMinimum, coursePictures, isPictureCourse } from './course';
import {
  allLines, brushFor, cellsOf, clueText, CROSSED, EMPTY, FILLED, hintFor, isSolved, lineName, makePuzzles, paint, planFor, statusOf, type Brush, type Hint,
  type Line, type LineStatus, type Mark, type PicturePlan, type PicturePuzzle,
} from './logic';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 4 } };

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
    for (const part of [this.board, this.cells, this.clueLayer, this.glow, this.info, this.sub, this.banner, this.bannerBox, this.bannerBg]) part.eventMode = 'none';
    this.board.addChild(this.cells, this.glow);
    ctx.stage.addChild(this.board, this.clueLayer, this.info, this.sub, this.bannerBox);
  }

  get n() { return this.puzzle.size; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
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
    this.clueLayer.removeChildren().forEach((c) => c.destroy());
    this.rowTexts = [];
    this.colTexts = [];
    const p = this.puzzle;
    this.rowDepth = Math.max(...p.rowClues.map((c) => c.length));
    this.colDepth = Math.max(...p.colClues.map((c) => c.length));
    for (const [texts, clues] of [[this.rowTexts, p.rowClues], [this.colTexts, p.colClues]] as const) {
      for (const clue of clues) {
        const line = clue.map((n) => { const t = label(String(n), 20, ink); t.eventMode = 'none'; this.clueLayer.addChild(t); return t; });
        texts.push(line);
      }
    }
  }

  private layoutClues() {
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
    // The cursor's row and column, so a number far away is easy to follow.
    g.rect(0, cr * cell, w, cell).fill({ color: swatch.blue.fill, alpha: 0.12 });
    g.rect(cc * cell, 0, cell, w).fill({ color: swatch.blue.fill, alpha: 0.12 });
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
    this.info.text = `${this.fills} ${this.fills === 1 ? 'fill' : 'fills'}`;
    this.sub.text = `${this.puzzle.par} squares in the picture`;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.puzzle) return;
    if (this.dirty) this.paint();
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
    g.roundRect(at.x, at.y, cell, cell, 8).stroke({ width: 4, color: ink });
  }

  destroy() {}

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and pictures                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.puzzles.length) return void this.finale();
    this.puzzle = this.puzzles[this.index];
    this.marks = this.puzzle.solution.map((): Mark => EMPTY);
    this.fills = this.carry;
    this.carry = 0;
    this.hinted = null;
    this.stroke = null;
    this.botRun = null;
    this.cursor = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    this.showBanner('');
    this.buildClues();
    this.status = allLines(this.n).map((l) => statusOf(this.marks, this.puzzle, l));
    this.resize(this.view);
    this.board.alpha = 0;
    this.clueLayer.alpha = 0;
    await Promise.all([this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 }), this.ctx.tw.to(this.clueLayer, { alpha: 1 }, { duration: 0.3 })]);
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    return this.ctx.instruct('picture.go');
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

  /** The picture is complete: its squares take their colors, row by row, and it says what it is. */
  private async reveal() {
    this.busy = true;
    this.hinted = null;
    this.stroke = null;
    this.showBanner('');
    this.excess += Math.max(0, this.fills - this.puzzle.par);
    if (this.course) {
      this.done.push(this.fills);
      this.report(true);
    }
    const n = this.n, cell = this.cell, paintLayer = new Graphics();
    paintLayer.eventMode = 'none';
    this.board.addChild(paintLayer);
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
    sfx.tada();
    await this.ctx.say('picture.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls, dt: number) {
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
    this.report();
    const [line, vars] = this.hintLine(h);
    this.showBanner(voice.line(line, vars));
    void this.ctx.say(line, vars);
  }

  private hintLine(h: Hint): [LineId, Record<string, string | number>] {
    if (h.kind === 'fix') return [h.mark === FILLED ? 'picture.hint-fix' : 'picture.hint-fix-cross', {}];
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
    this.botRun = null;
    this.dismissHint();
    this.paintClues();
    this.dirty = true;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

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
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new PictureIcon(),
  sticker,
  create: (ctx) => new PictureLogic(ctx),
};
