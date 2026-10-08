import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT, label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { courseBeds, courseMinimum, isBedCourse } from './course';
import {
  conflicts, deadEnds, geometry, hintFor, houseName, isSolved, makeBeds, placements, planFor, remaining, type Hint, type Puzzle, type SudokuPlan,
} from './logic';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 6 } };

/** One soft color for each number, so a bed can be read at a glance as well as by its digits. */
const DIGIT_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'white'];
const ENTERED = 0x2f78c9;
const CLASH = 0xc23a40;
const COLS = 3;
const NOTE_POSITIONS = (d: number) => ({ x: 0.2 + 0.3 * ((d - 1) % 3), y: 0.2 + 0.3 * Math.floor((d - 1) / 3) });

type Mode = 'board' | 'tray';

class SudokuGarden implements Game {
  readonly plan: SudokuPlan;
  puzzle!: Puzzle;
  index = -1;
  misses = 0;
  hints = 0;
  /** Entries on every bed so far beyond each bed's empty squares: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  /** What is in the bed now (0 is empty), which squares came with a number, and the pencil marks. */
  grid: number[] = [];
  given: boolean[] = [];
  notes: number[] = [];
  cursor = 0;
  mode: Mode = 'board';
  /** The tray's highlight: a number's tile, or `n` for the pencil. */
  trayAt = 0;
  noting = false;
  /** Numbers placed on this bed, taken back or not: every placement counts, erasing and pencil marks do not. */
  entries = 0;

  private readonly beds: Puzzle[];
  private readonly board = new Container();
  private readonly cellsG = new Graphics();
  private readonly digits = new Container();
  private readonly notesLayer = new Container();
  private readonly glow = new Graphics();
  private readonly tray = new Container();
  private readonly trayG = new Graphics();
  private readonly trayText = new Container();
  private readonly trayRing = new Graphics();
  private readonly banner: Text;
  private readonly bannerBox = new Container();
  private readonly bannerBg = new Graphics();
  private readonly tally: Text;
  private texts: Text[] = [];
  private noteTexts: (Text | null)[][] = [];
  private cell = 80;
  private trayTile = 66;
  private clock = 0;
  private view: View;
  private hinted: Hint | null = null;
  private flash: { cells: number[]; color: number; until: number } | null = null;
  private lastDigit = 1;
  private readonly held = new HeldDirection();
  private dirty = true;
  private told = { clash: false, stuck: false };
  private botWait = 0.8;
  private botPick: { cell: number; digit: number } | null = null;
  /** Couch challenge course: fixed beds in a row. Null in ordinary play, where beds are generated. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Entries already spent on the bed we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private spoken = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isBedCourse(run.id)) {
      this.beds = courseBeds(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.beds = makeBeds(this.plan, ctx.rng);
      this.course = null;
    }
    for (const part of [this.board, this.cellsG, this.digits, this.notesLayer, this.glow, this.tray, this.trayG, this.trayText, this.trayRing]) part.eventMode = 'none';
    this.board.addChild(this.cellsG, this.notesLayer, this.digits, this.glow);
    this.tray.addChild(this.trayG, this.trayText, this.trayRing);
    this.banner = new Text({ text: '', style: { fontFamily: FONT, fontSize: 22, fill: ink, fontWeight: '500', align: 'left', wordWrap: true, wordWrapWidth: 260, lineHeight: 28 } });
    this.banner.position.set(12, 8);
    this.bannerBox.eventMode = 'none';
    this.bannerBox.visible = false;
    this.bannerBox.addChild(this.bannerBg, this.banner);
    this.banner.eventMode = 'none';
    this.bannerBg.eventMode = 'none';
    this.tally = label('', 26, ink, '500');
    this.tally.eventMode = 'none';
    ctx.stage.addChild(this.board, this.tray, this.bannerBox, this.tally);
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
    // The controller reminder covers the bottom of the screen for the first ten seconds, so the bed stays above it.
    this.cell = Math.max(52, Math.min(96, Math.floor((v.h - 262) / n)));
    this.trayTile = Math.min(76, Math.max(54, Math.floor(this.cell * 0.78)));
    const w = n * this.cell, trayW = COLS * this.trayTile + (COLS - 1) * 10;
    const total = w + 44 + trayW;
    // Clear of the pet in the bottom-left corner.
    const x = Math.max(172, (v.w - total) / 2);
    const y = 104;
    this.board.position.set(x, y);
    this.tray.position.set(x + w + 44, y + 6);
    // The hint is written under the tray, in the free column beside the bed.
    const trayH = Math.ceil(n / COLS) * (this.trayTile + 10) + this.trayTile * 0.8;
    this.bannerBox.position.set(this.tray.x, this.tray.y + trayH + 18);
    (this.banner.style as { wordWrapWidth: number }).wordWrapWidth = Math.max(230, v.w - this.tray.x - 44);
    this.showBanner(this.banner.text);
    this.tally.position.set(this.tray.x + trayW / 2, y + w - 4);
    this.dirty = true;
    this.paintTray();
  }

  /** The hint's words, in a small panel (or nothing). */
  private showBanner(text: string) {
    this.banner.text = text;
    this.bannerBox.visible = text !== '';
    const g = this.bannerBg.clear();
    if (text) g.roundRect(0, 0, this.banner.width + 24, this.banner.height + 16, 14).fill({ color: swatch.yellow.light, alpha: 0.95 }).stroke({ width: 3, color: swatch.yellow.line });
  }

  private center(i: number) {
    const g = geometry(this.puzzle.size);
    return { x: g.colOf[i] * this.cell + this.cell / 2, y: g.rowOf[i] * this.cell + this.cell / 2 };
  }

  private color(d: number) { return swatch[DIGIT_COLORS[(d - 1) % DIGIT_COLORS.length]]; }

  /** The bed: soil, the numbers' blossoms and the box lines. Drawn again whenever something in it changes. */
  private paint() {
    this.dirty = false;
    const g = this.cellsG.clear(), geo = geometry(this.puzzle.size), n = this.n, cell = this.cell, w = n * cell;
    const bad = new Set(conflicts(this.grid, n)), stuck = new Set(deadEnds(this.grid, n));
    const here = this.grid[this.cursor];
    g.roundRect(-16, -16, w + 32, w + 32, 26).fill(wood.light).stroke({ width: 7, color: wood.line });
    for (let i = 0; i < this.grid.length; i++) {
      const x = geo.colOf[i] * cell + 3, y = geo.rowOf[i] * cell + 3, s = cell - 6;
      g.roundRect(x, y, s, s, 12).fill(this.given[i] ? cream : swatch.brown.light).stroke({ width: 2, color: swatch.brown.line });
      if (bad.has(i)) g.roundRect(x, y, s, s, 12).fill({ color: swatch.red.light, alpha: 0.75 });
      else if (geo.peers[this.cursor].includes(i) || i === this.cursor) g.roundRect(x, y, s, s, 12).fill({ color: 0xffffff, alpha: 0.3 });
      if (stuck.has(i)) g.roundRect(x + 2, y + 2, s - 4, s - 4, 11).stroke({ width: 5, color: swatch.orange.fill });
      const d = this.grid[i];
      if (d) {
        const c = this.color(d), mid = this.center(i);
        g.circle(mid.x, mid.y, cell * 0.38).fill(c.light).stroke({ width: 3, color: this.given[i] ? ink : c.line });
        if (here && d === here && i !== this.cursor) g.circle(mid.x, mid.y, cell * 0.44).stroke({ width: 4, color: swatch.yellow.fill });
      }
    }
    for (let k = 1; k < n / geo.bc; k++) g.moveTo(k * geo.bc * cell, 2).lineTo(k * geo.bc * cell, w - 2).stroke({ width: 6, color: wood.line, cap: 'round' });
    for (let k = 1; k < n / geo.br; k++) g.moveTo(2, k * geo.br * cell).lineTo(w - 2, k * geo.br * cell).stroke({ width: 6, color: wood.line, cap: 'round' });
    this.syncTexts(bad);
    const left = this.grid.filter((d) => !d).length;
    this.tally.text = `${left} to fill · ${this.entries} entered`;
  }

  /** Numbers and pencil marks, laid over the blossoms. */
  private syncTexts(bad: Set<number>) {
    const cell = this.cell;
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i], d = this.grid[i], mid = this.center(i);
      t.text = d ? String(d) : '';
      t.style.fill = bad.has(i) ? CLASH : this.given[i] ? ink : ENTERED;
      t.style.fontSize = Math.round(cell * 0.5);
      t.position.set(mid.x, mid.y + 1);
      const marks = this.noteTexts[i];
      for (let k = 1; k <= this.n; k++) {
        const on = !d && (this.notes[i] & (1 << (k - 1))) !== 0;
        let note = marks[k - 1];
        if (!on) { if (note) note.visible = false; continue; }
        if (!note) {
          note = label(String(k), 14, ink, '500');
          note.eventMode = 'none';
          this.notesLayer.addChild(note);
          marks[k - 1] = note;
        }
        const at = NOTE_POSITIONS(k), geo = geometry(this.puzzle.size);
        note.visible = true;
        note.style.fontSize = Math.max(13, Math.round(cell * 0.22));
        note.position.set(geo.colOf[i] * cell + at.x * cell, geo.rowOf[i] * cell + at.y * cell);
      }
    }
  }

  /** The tray at the right of the bed: one tile for each number, and a pencil for marks. */
  private paintTray() {
    if (!this.puzzle) return;
    const n = this.n, tile = this.trayTile, g = this.trayG.clear(), left = remaining(this.grid, n);
    this.trayText.removeChildren().forEach((c) => c.destroy());
    const open = this.mode === 'tray';
    for (let d = 1; d <= n; d++) {
      const col = (d - 1) % COLS, row = Math.floor((d - 1) / COLS);
      const x = col * (tile + 10), y = row * (tile + 10), c = this.color(d), done = left[d - 1] <= 0;
      g.roundRect(x, y + 4, tile, tile, 14).fill(c.line);
      g.roundRect(x, y, tile, tile, 14).fill(done ? swatch.white.light : c.light).stroke({ width: 3, color: c.line });
      const t = label(String(d), Math.round(tile * 0.5), done ? swatch.white.line : ink);
      t.position.set(x + tile / 2, y + tile / 2 - 3);
      const rest = label(done ? '✓' : String(left[d - 1]), 15, done ? swatch.green.line : swatch.white.line, '500');
      rest.position.set(x + tile - 13, y + tile - 12);
      this.trayText.addChild(t, rest);
    }
    const rows = Math.ceil(n / COLS), py = rows * (tile + 10), pw = COLS * tile + (COLS - 1) * 10;
    g.roundRect(0, py + 4, pw, tile * 0.8, 14).fill(swatch.yellow.line);
    g.roundRect(0, py, pw, tile * 0.8, 14).fill(this.noting ? swatch.yellow.fill : swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
    // A pencil: a slanted body, a point and a pink eraser.
    const mx = pw / 2 - 52, my = py + tile * 0.4;
    g.poly([mx - 14, my + 12, mx + 18, my - 20, mx + 26, my - 12, mx - 6, my + 20]).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line });
    g.poly([mx - 14, my + 12, mx - 6, my + 20, mx - 20, my + 24]).fill(cream).stroke({ width: 2, color: swatch.orange.line });
    g.poly([mx + 18, my - 20, mx + 26, my - 12, mx + 32, my - 18, mx + 24, my - 26]).fill(swatch.pink.fill).stroke({ width: 2, color: swatch.pink.line });
    const word = label(this.noting ? 'Marks: on' : 'Marks', Math.round(tile * 0.3), ink);
    word.position.set(pw / 2 + 12, py + tile * 0.4 - 2);
    this.trayText.addChild(word);
    this.tray.alpha = open ? 1 : 0.8;
  }

  private trayCell(at: number) {
    const tile = this.trayTile, n = this.n;
    if (at >= n) return { x: 0, y: Math.ceil(n / COLS) * (tile + 10), w: COLS * tile + (COLS - 1) * 10, h: tile * 0.8 };
    return { x: (at % COLS) * (tile + 10), y: Math.floor(at / COLS) * (tile + 10), w: tile, h: tile };
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.puzzle) return;
    if (this.dirty) this.paint();
    const g = this.glow.clear(), ring = this.trayRing.clear();
    if (this.finished || this.busy) return;
    const cell = this.cell;
    if (this.flash && this.clock < this.flash.until) for (const i of this.flash.cells) {
      const mid = this.center(i);
      g.roundRect(mid.x - cell / 2 + 3, mid.y - cell / 2 + 3, cell - 6, cell - 6, 12).stroke({ width: 6, color: this.flash.color });
    } else this.flash = null;
    if (this.hinted) {
      const h = this.hinted, pulse = 6 + 2 * Math.sin(this.clock * 6);
      if (h.kind === 'place') for (const c of h.house.cells) { const m = this.center(c); g.roundRect(m.x - cell / 2 + 6, m.y - cell / 2 + 6, cell - 12, cell - 12, 10).stroke({ width: 3, color: swatch.yellow.line, alpha: 0.9 }); }
      if (h.kind === 'rules-out') for (const c of h.via.pattern ?? []) { const m = this.center(c); g.roundRect(m.x - cell / 2 + 4, m.y - cell / 2 + 4, cell - 8, cell - 8, 12).stroke({ width: 6, color: swatch.blue.fill }); }
      const m = this.center(h.cell);
      g.roundRect(m.x - cell / 2 - 3, m.y - cell / 2 - 3, cell + 6, cell + 6, 16).stroke({ width: pulse, color: h.kind === 'fix' ? swatch.red.fill : swatch.yellow.fill });
    }
    const mid = this.center(this.cursor);
    g.roundRect(mid.x - cell / 2 + 1, mid.y - cell / 2 + 1, cell - 2, cell - 2, 14).stroke({ width: this.mode === 'board' ? 7 : 4, color: ink, alpha: this.mode === 'board' ? 1 : 0.55 });
    // The tray's highlight.
    if (this.mode === 'tray') {
      const t = this.trayCell(this.trayAt);
      ring.roundRect(t.x - 5, t.y - 5, t.w + 10, t.h + 10, 18).stroke({ width: 7 + Math.sin(this.clock * 8), color: ink });
    }
  }

  destroy() {}

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and beds                                                                               */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.beds.length) return void this.finale();
    this.puzzle = this.beds[this.index];
    this.grid = this.puzzle.start.slice();
    this.given = this.puzzle.start.map((d) => d > 0);
    this.notes = this.grid.map(() => 0);
    this.entries = this.carry;
    this.carry = 0;
    this.hinted = null;
    this.flash = null;
    this.mode = 'board';
    this.noting = false;
    this.botPick = null;
    this.told = { clash: false, stuck: false };
    this.cursor = Math.max(0, this.grid.findIndex((d) => !d));
    this.showBanner('');
    this.digits.removeChildren().forEach((c) => c.destroy());
    this.notesLayer.removeChildren().forEach((c) => c.destroy());
    this.texts = this.grid.map(() => { const t = label('', 40, ink); t.eventMode = 'none'; this.digits.addChild(t); return t; });
    this.noteTexts = this.grid.map(() => Array<Text | null>(this.n).fill(null));
    this.resize(this.view);
    this.paint();
    this.board.alpha = 0;
    this.tray.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.paintTray();
    this.busy = false;
    this.report();
    if (this.spoken) return;
    this.spoken = true;
    return this.ctx.instruct('sudoku.go');
  }

  /** Hand a course's numbers to the shell. `finished` means the bed just ended, so none of its entries are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.beds.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.entries,
      par: this.puzzle.blanks,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the bed just finished, over the board for a moment. */
  private async bedScore() {
    const best = this.puzzle.blanks, total = this.beds.length;
    const text = this.entries === best ? `Bed ${this.index + 1} of ${total}: ${this.entries} entries, a perfect bed!` : `Bed ${this.index + 1} of ${total}: ${this.entries} entries (fewest ${best})`;
    const note = label(text, 34, ink);
    note.position.set(this.board.x + (this.n * this.cell) / 2, Math.max(48, this.board.y - 56));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async bloom() {
    this.busy = true;
    this.hinted = null;
    this.flash = null;
    this.mode = 'board';
    this.showBanner('');
    this.excess += Math.max(0, this.entries - this.puzzle.blanks);
    if (this.course) {
      this.done.push(this.entries);
      this.report(true);
    }
    const n = this.n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const t = this.texts[r * n + c];
        void this.ctx.tw.to(t.scale, { x: 1.35, y: 1.35 }, { duration: 0.12 }).then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.14 }));
      }
      sfx.bell(3 + (r % 7), 0.25);
      await this.ctx.tw.wait(0.11);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (n * this.cell) / 2, y: (n * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 28, speed: [160, 400], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.bedScore();
    else await this.ctx.say('sudoku.bloom');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.tray.visible = false;
    this.tally.visible = false;
    sfx.tada();
    await this.ctx.say('sudoku.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || !this.puzzle) return;
    for (const dir of this.held.poll(input, dt)) this.move(dir);
    if (input.players.some((p) => p.action)) this.press();
    else if (input.players.some((p) => p.undo)) this.back();
  }

  private move(dir: number) {
    const n = this.n;
    if (this.mode === 'board') {
      const r = Math.floor(this.cursor / n), c = this.cursor % n;
      const nr = Math.min(n - 1, Math.max(0, r + [0, 1, 0, -1][dir])), nc = Math.min(n - 1, Math.max(0, c + [1, 0, -1, 0][dir]));
      const to = nr * n + nc;
      if (to === this.cursor) return;
      this.cursor = to;
      this.dirty = true;
      sfx.tick();
      return;
    }
    const at = this.trayAt;
    let to = at;
    if (at === n) { if (dir === 3) to = n - COLS; }
    else if (dir === 0 && at % COLS < COLS - 1) to = at + 1;
    else if (dir === 2 && at % COLS > 0) to = at - 1;
    else if (dir === 1) to = at + COLS < n ? at + COLS : n;
    else if (dir === 3 && at - COLS >= 0) to = at - COLS;
    if (to === at) return;
    this.trayAt = to;
    this.paintTray();
    sfx.tick();
  }

  /** The bottom button: open the tray on a square, choose from it, or flip the pencil. */
  private press() {
    const n = this.n;
    if (this.mode === 'board') {
      if (this.given[this.cursor]) return void sfx.squeak();
      this.mode = 'tray';
      this.trayAt = Math.min(n - 1, Math.max(0, (this.grid[this.cursor] || this.lastDigit) - 1));
      this.paintTray();
      sfx.pop(5);
      return;
    }
    if (this.trayAt === n) {
      this.noting = !this.noting;
      this.paintTray();
      sfx.pop(this.noting ? 8 : 4);
      return;
    }
    const digit = this.trayAt + 1;
    if (this.noting) return this.mark(digit);
    this.mode = 'board';
    this.lastDigit = digit;
    this.paintTray();
    this.enter(digit);
  }

  /** The left button: close the tray; on a square, take its number (or marks) back out. Nothing it does is counted. */
  private back() {
    if (this.mode === 'tray') {
      this.mode = 'board';
      this.paintTray();
      return;
    }
    const i = this.cursor;
    if (this.given[i]) return;
    if (this.grid[i]) this.clear(i);
    else if (this.notes[i]) { this.notes[i] = 0; this.dirty = true; sfx.pop(2); }
  }

  private mark(digit: number) {
    const i = this.cursor;
    if (this.grid[i]) return void sfx.squeak();
    this.notes[i] ^= 1 << (digit - 1);
    this.dirty = true;
    sfx.pop(6);
  }

  private clear(i: number) {
    this.grid[i] = 0;
    if (this.hinted?.cell === i && this.hinted.kind === 'fix') this.dismissHint();
    this.dirty = true;
    this.paintTray();
    sfx.pop(2);
  }

  /** Put a number in the cursor's square. Placing counts one entry; what it clashes with is shown, and never forbidden. */
  private enter(digit: number) {
    const i = this.cursor, geo = geometry(this.puzzle.size);
    if (this.given[i] || this.grid[i] === digit) return void sfx.tick();
    this.grid[i] = digit;
    this.notes[i] = 0;
    for (const p of geo.peers[i]) this.notes[p] &= ~(1 << (digit - 1));
    this.entries++;
    this.dirty = true;
    this.paintTray();
    if (this.hinted?.cell === i) this.dismissHint();
    this.report();
    if (digit !== this.puzzle.solution[i]) this.misses++;
    const mine = geo.housesOf[i].find((h) => h.cells.some((c) => c !== i && this.grid[c] === digit));
    if (mine) {
      const twin = mine.cells.filter((c) => this.grid[c] === digit);
      this.flash = { cells: twin, color: swatch.red.fill, until: this.clock + 1.4 };
      sfx.boing();
      if (!this.told.clash) {
        this.told.clash = true;
        void this.ctx.say('sudoku.clash', { house: houseName(mine) });
      }
      return;
    }
    sfx.pop(4 + (i % 6));
    this.ctx.particles.burst(...this.stagePoint(i), { kind: 'dot', colors: [this.color(digit).fill, 0xffffff], count: 5, speed: [40, 110], gravity: 0, life: [0.25, 0.45] });
    if (isSolved(this.grid, this.n)) return void this.bloom();
    if (deadEnds(this.grid, this.n).length && !this.told.stuck) {
      this.told.stuck = true;
      this.flash = { cells: deadEnds(this.grid, this.n), color: swatch.orange.fill, until: this.clock + 2.2 };
      void this.ctx.say('sudoku.stuck');
    }
  }

  private stagePoint(i: number): [number, number] {
    const mid = this.center(i), at = this.ctx.stage.toLocal(this.board.toGlobal(mid));
    return [at.x, at.y];
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint". Marks the run as helped for good. */
  askForHint() {
    if (this.busy || this.finished || !this.puzzle) return;
    const h = hintFor(this.grid, this.puzzle.start, this.puzzle.solution, this.n);
    if (!h) return;
    this.hinted = h;
    this.hints++;
    this.assisted = true;
    this.cursor = h.cell;
    this.mode = 'board';
    this.paintTray();
    this.dirty = true;
    this.report();
    const [line, vars] = this.hintLine(h);
    this.showBanner(voice.line(line, vars));
    void this.ctx.say(line, vars);
  }

  private hintLine(h: Hint): [LineId, Record<string, string | number>] {
    switch (h.kind) {
      case 'fix': return ['sudoku.hint-fix', {}];
      case 'lone': return ['sudoku.hint-lone', { n: h.digit }];
      case 'place': return ['sudoku.hint-place', { n: h.digit, house: houseName(h.house) }];
      case 'few': return ['sudoku.hint-few', {}];
      default: {
        const via = h.via, house = houseName(via.house!);
        return via.tech === 'pair'
          ? ['sudoku.hint-pair', { a: via.digits![0], b: via.digits![1], house, n: h.digit }]
          : ['sudoku.hint-locked', { n: via.digits![0], house, m: h.digit }];
      }
    }
  }

  private dismissHint() {
    this.hinted = null;
    this.showBanner('');
  }

  /**
   * Couch pause menu: start this bed over from its first position. Entries already made keep counting, so a restart is never
   * a way to improve a score.
   */
  restart() {
    if (this.finished || !this.puzzle || this.busy) return;
    this.grid = this.puzzle.start.slice();
    this.notes = this.grid.map(() => 0);
    this.cursor = Math.max(0, this.grid.findIndex((d) => !d));
    this.mode = 'board';
    this.noting = false;
    this.botPick = null;
    this.dismissHint();
    this.flash = null;
    this.dirty = true;
    this.paintTray();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** A bot that solves the way the techniques do: the nearest number the easy steps can place, walked to and chosen from the tray. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.puzzle || this.botWait > 0) return out;
    const p = out.players[0];
    p.active = true;
    if (!this.botPick || this.grid[this.botPick.cell]) this.botPick = this.pickNext();
    const pick = this.botPick;
    if (!pick) return out;
    if (this.mode === 'board') {
      if (this.cursor !== pick.cell) { p.direction = this.towards(this.cursor, pick.cell); this.botWait = 0.12; }
      else { p.action = true; this.botWait = 0.18; }
      return out;
    }
    const want = pick.digit - 1;
    if (this.trayAt === want) { p.action = true; this.botWait = 0.3; return out; }
    const r = Math.floor(this.trayAt / COLS), c = this.trayAt % COLS, wr = Math.floor(want / COLS), wc = want % COLS;
    p.direction = r !== wr ? (wr > r ? 1 : 3) : wc > c ? 0 : 2;
    this.botWait = 0.12;
    return out;
  }

  private pickNext() {
    const n = this.n, from = this.cursor;
    const dist = (c: number) => Math.abs(Math.floor(c / n) - Math.floor(from / n)) + Math.abs((c % n) - (from % n));
    const options = placements(this.grid, n);
    if (options.length) return options.sort((a, b) => dist(a.cell) - dist(b.cell))[0];
    const cell = this.grid.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0).sort((a, b) => dist(a) - dist(b))[0];
    return cell === undefined ? null : { cell, digit: this.puzzle.solution[cell] };
  }

  private towards(from: number, to: number) {
    const n = this.n, fr = Math.floor(from / n), fc = from % n, tr = Math.floor(to / n), tc = to % n;
    return fc !== tc ? (tc > fc ? 0 : 2) : tr > fr ? 1 : 3;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** A little bed of nine numbered blossoms, no number repeated in any row or column. */
function miniBed(cell: number): Container {
  const c = new Container();
  const n = 3, w = n * cell;
  c.addChild(new Graphics().roundRect(-w / 2 - 10, -w / 2 - 10, w + 20, w + 20, 18).fill(wood.light).stroke({ width: 6, color: wood.line }));
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++) {
      const d = ((r + col) % n) + 1, sw = swatch[DIGIT_COLORS[d - 1]];
      const x = -w / 2 + col * cell + cell / 2, y = -w / 2 + r * cell + cell / 2;
      c.addChild(new Graphics().roundRect(x - cell / 2 + 3, y - cell / 2 + 3, cell - 6, cell - 6, 10).fill(swatch.brown.light).circle(x, y, cell * 0.36).fill(sw.light).stroke({ width: 3, color: sw.line }));
      const t = label(String(d), Math.round(cell * 0.5), ink);
      t.position.set(x, y + 1);
      c.addChild(t);
    }
  return c;
}

class SudokuIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const bed = miniBed(62);
    bed.position.set(0, -108);
    c.addChild(bed);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const d = rng.int(1, 9), sw = swatch[DIGIT_COLORS[d - 1]];
  c.addChild(new Graphics().circle(0, 0, 78).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line }));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    c.addChild(new Graphics().circle(Math.cos(a) * 46, Math.sin(a) * 46, 22).fill(sw.fill).stroke({ width: 3, color: sw.line }));
  }
  c.addChild(new Graphics().circle(0, 0, 38).fill(sw.light).stroke({ width: 4, color: sw.line }));
  c.addChild(label(String(d), 52, ink));
  return c;
}

export const sudokuGarden: GameModule = {
  id: 'sudoku-garden',
  name: 'Sudoku Garden',
  titleLine: 'game.sudoku-garden',
  region: 'puzzle-peaks',
  skills: ['logic', 'deduction', 'planning'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new SudokuIcon(),
  sticker,
  create: (ctx) => new SudokuGarden(ctx),
};

