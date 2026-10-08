import { Container, Graphics, Text } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { courseGrids, courseMinimum, isWordCourse } from './course';
import { cellsOfWord, hintFor, lineBetween, makeGrids, planFor, wordAt, type WordGrid, type WordPlan } from './logic';
import { themeById } from './words';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 4 } };

const PAPER = 0xfffdf6;
const BAND_COLORS: ColorName[] = ['pink', 'blue', 'green', 'orange', 'purple', 'teal', 'yellow', 'red'];

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
      this.grids = makeGrids(this.plan, ctx.rng);
      this.course = null;
    }
    for (const part of [this.board, this.paper, this.bands, this.letters, this.glow, this.list, this.listMarks, this.title, this.tally]) part.eventMode = 'none';
    this.board.addChild(this.paper, this.bands, this.letters, this.glow);
    this.list.addChild(this.listMarks);
    ctx.stage.addChild(this.board, this.list, this.title, this.tally);
  }

  get n() { return this.grid.size; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.grid) return;
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
    this.layoutLetters();
    this.layoutList();
    this.dirty = true;
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

  private layoutList() {
    const top = 96, step = Math.min(38, Math.floor((this.n * this.cell - top) / this.grid.words.length));
    this.entries.forEach((t, i) => { t.style.fontSize = Math.round(Math.min(28, step * 0.72)); t.position.set(34, top + i * step); });
    this.paintList();
  }

  /** The word list: a dot before each, the found ones struck through and grey, the hinted one on a marker. */
  private paintList() {
    const g = this.listMarks.clear(), top = 96, step = Math.min(38, Math.floor((this.n * this.cell - top) / this.grid.words.length));
    this.grid.words.forEach((_, i) => {
      const y = top + i * step, t = this.entries[i], done = this.found.has(i);
      t.style.fill = done ? 0x9a948a : ink;
      if (this.hinted?.word === i && !done) g.roundRect(-8, y - step / 2 + 2, 220, step - 4, 10).fill({ color: swatch.yellow.light, alpha: 0.95 }).stroke({ width: 2, color: swatch.yellow.line });
      const col = swatch[BAND_COLORS[i % BAND_COLORS.length]];
      g.circle(10, y, 7).fill(done ? col.fill : swatch.white.light).stroke({ width: 2, color: done ? col.line : 0xb9b0a0 });
      if (done) g.moveTo(26, y).lineTo(34 + t.width + 6, y).stroke({ width: 3, color: 0x7a746a, cap: 'round' });
    });
    this.tally.text = `${this.found.size} of ${this.grid.words.length} found · ${this.guesses} ${this.guesses === 1 ? 'guess' : 'guesses'}`;
  }

  /** The grid's paper and the bands over found words, redrawn when something changes. */
  private paint() {
    this.dirty = false;
    const w = this.n * this.cell, r = this.cell * 0.42;
    this.paper.clear().roundRect(-14, -14, w + 28, w + 28, 18).fill(PAPER).stroke({ width: 5, color: 0x9c6b3c });
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
    const at = this.center(this.cursor);
    g.roundRect(at.x - cell / 2 + 2, at.y - cell / 2 + 2, cell - 4, cell - 4, 10).stroke({ width: 4, color: ink });
  }

  destroy() {}

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
    return this.ctx.instruct('wordsearch.go');
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
    sfx.tada();
    await this.ctx.say('wordsearch.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls, dt: number) {
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
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  hubIcon: () => new WordIcon(),
  sticker,
  create: (ctx) => new WordSearch(ctx),
};
