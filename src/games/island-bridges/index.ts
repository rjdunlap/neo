import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import type { LineId } from '../../content/voice-script';
import { courseMinimum, courseSeas, isBridgeCourse } from './course';
import {
  canAdd, directionOf, edgeToward, focusPath, hintFor, isSolved, islandToward, makePuzzles, otherEnd, planFor, planksAt, trouble, type BridgePlan, type Hint, type Puzzle,
} from './logic';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 4 } };

const SEA = 0xcfe8f7;
const SEA_LINE = 0x7aa7c7;
const SAND = 0xf6e3b0;
const SAND_LINE = 0xb98f4b;
const DONE_FILL = 0xcdeccb;
const DONE_LINE = 0x4a9a35;

type Mode = 'move' | 'add' | 'remove';

class IslandBridges implements Game {
  readonly plan: BridgePlan;
  index = -1;
  misses = 0;
  hints = 0;
  /** Planks beyond each sea's answer, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  puzzle!: Puzzle;
  /** Planks on every edge, 0 to 2. */
  planks: number[] = [];
  /** The island the highlight is on. */
  focus = 0;
  /** `move`: the stick moves the highlight. `add` / `remove`: it lays or takes off a plank toward the island it points at. */
  mode: Mode = 'move';
  /** Planks laid on this sea, taken off again or not: every plank laid counts, taking one off does not. */
  entries = 0;
  hinted: Hint | null = null;

  private readonly puzzles: Puzzle[];
  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly bridges = new Graphics();
  private readonly islands = new Container();
  private readonly glow = new Graphics();
  private readonly tally = label('', 26, ink, '500');
  private numbers: ReturnType<typeof label>[] = [];
  private cell = 60;
  private clock = 0;
  private view: View;
  private dirty = true;
  private readonly held = new HeldDirection();
  private botWait = 0.8;
  private told = { cross: false };
  /** Couch challenge course: fixed seas in a row. Null in ordinary play, where seas are drawn from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Planks already spent on the sea we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private spoken = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isBridgeCourse(run.id)) {
      this.puzzles = courseSeas(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.puzzles = makePuzzles(this.plan, ctx.rng);
      this.course = null;
    }
    for (const part of [this.board, this.water, this.bridges, this.islands, this.glow, this.tally]) part.eventMode = 'none';
    this.board.addChild(this.water, this.bridges, this.islands, this.glow);
    ctx.stage.addChild(this.board, this.tally);
  }

  get layout() { return this.puzzle.layout; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    const size = this.puzzle.size;
    // The controller reminder covers the bottom of the screen for the first ten seconds, so the sea stays above it.
    this.cell = Math.max(40, Math.min(76, Math.floor((v.h - 100 - 200) / size)));
    const w = size * this.cell, left = Math.max(160, (v.w - w - 300) / 2);
    this.board.position.set(left, 104);
    this.tally.anchor.set(0, 0.5);
    this.tally.position.set(left + w + 44, 128);
    this.layoutNumbers();
    this.dirty = true;
  }

  private at(i: number) {
    const il = this.layout.islands[i];
    return { x: il.c * this.cell + this.cell / 2, y: il.r * this.cell + this.cell / 2 };
  }

  private buildNumbers() {
    this.islands.removeChildren().forEach((c) => c.destroy());
    this.numbers = this.layout.islands.map((il) => { const t = label(String(il.n), 30, ink); t.eventMode = 'none'; this.islands.addChild(t); return t; });
  }

  private layoutNumbers() {
    this.numbers.forEach((t, i) => { const p = this.at(i); t.style.fontSize = Math.round(this.cell * 0.46); t.position.set(p.x, p.y + 1); });
  }

  /** The sea, the bridges and the islands, redrawn when anything changes. */
  private paint() {
    this.dirty = false;
    const size = this.puzzle.size, cell = this.cell, w = size * cell, rad = cell * 0.38;
    const wet = this.water.clear();
    wet.roundRect(-16, -16, w + 32, w + 32, 22).fill(SEA).stroke({ width: 6, color: SEA_LINE });
    for (let k = 0; k < size * 2; k++) wet.moveTo((k * 83) % w, (k * 47 + 13) % w).lineTo(((k * 83) % w) + 22, (k * 47 + 13) % w).stroke({ width: 3, color: 0xffffff, alpha: 0.5, cap: 'round' });
    const g = this.bridges.clear();
    this.layout.edges.forEach((e, k) => {
      const n = this.planks[k];
      if (!n) return;
      const a = this.at(e.a), b = this.at(e.b), horizontal = e.dir === 'h', off = n === 2 ? cell * 0.11 : 0;
      for (const side of n === 2 ? [-1, 1] : [0]) {
        const dx = horizontal ? 0 : side * off, dy = horizontal ? side * off : 0;
        g.moveTo(a.x + dx, a.y + dy).lineTo(b.x + dx, b.y + dy).stroke({ width: cell * 0.12, color: wood.line, cap: 'butt' });
        g.moveTo(a.x + dx, a.y + dy).lineTo(b.x + dx, b.y + dy).stroke({ width: cell * 0.07, color: wood.light, cap: 'butt' });
      }
    });
    const bad = new Set(trouble(this.layout, this.planks));
    this.layout.islands.forEach((il, i) => {
      const p = this.at(i), have = planksAt(this.layout, this.planks, i), done = have === il.n;
      g.circle(p.x, p.y, rad).fill(done ? DONE_FILL : SAND).stroke({ width: 4, color: bad.has(i) ? 0xc23a40 : done ? DONE_LINE : SAND_LINE });
    });
    this.tally.text = `${this.entries} ${this.entries === 1 ? 'plank' : 'planks'} laid`;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.puzzle) return;
    if (this.dirty) this.paint();
    const g = this.glow.clear();
    if (this.finished || this.busy) return;
    const cell = this.cell, rad = cell * 0.38, p = this.at(this.focus);
    // What a push would reach from the highlighted island: a faint line to each neighbour, in the mode's color.
    if (this.mode !== 'move') {
      const color = this.mode === 'add' ? swatch.yellow.fill : swatch.red.fill;
      for (const k of this.layout.at[this.focus]) {
        const q = this.at(otherEnd(this.layout, k, this.focus));
        g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: 4, color, alpha: 0.5 });
      }
    }
    if (this.hinted) {
      const h = this.hinted, e = this.layout.edges[h.edge], a = this.at(e.a), b = this.at(e.b);
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: cell * 0.2 + 3 * Math.sin(this.clock * 6), color: h.kind === 'fix' ? swatch.red.fill : swatch.yellow.fill, alpha: 0.7 });
      const ring = (i: number) => { const q = this.at(i); g.circle(q.x, q.y, rad + 7 + 2 * Math.sin(this.clock * 6)).stroke({ width: 5, color: h.kind === 'fix' ? swatch.red.fill : swatch.orange.fill }); };
      ring(e.a);
      ring(e.b);
    }
    g.circle(p.x, p.y, rad + 6).stroke({ width: this.mode === 'move' ? 5 : 8, color: this.mode === 'add' ? swatch.yellow.line : this.mode === 'remove' ? swatch.red.line : ink });
  }

  destroy() {}

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and seas                                                                               */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.puzzles.length) return void this.finale();
    this.puzzle = this.puzzles[this.index];
    this.planks = this.puzzle.solution.map(() => 0);
    this.entries = this.carry;
    this.carry = 0;
    this.hinted = null;
    this.mode = 'move';
    this.told = { cross: false };
    this.focus = 0;
    this.buildNumbers();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.spoken) return;
    this.spoken = true;
    return this.ctx.instruct('bridges.go');
  }

  /** Hand a course's numbers to the shell. `finished` means the sea just ended, so none of its planks are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.puzzles.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.entries,
      par: this.puzzle.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the sea just joined, over the board for a moment. */
  private async seaScore() {
    const best = this.puzzle.par, total = this.puzzles.length;
    const text = this.entries === best ? `Sea ${this.index + 1} of ${total}: ${this.entries} planks, the fewest possible!` : `Sea ${this.index + 1} of ${total}: ${this.entries} planks (fewest ${best})`;
    const note = label(text, 32, ink);
    note.position.set(this.view.w / 2, 52);
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.3);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  /** Every island has its planks and they are all one group: the islands bob in turn. */
  private async joined() {
    this.busy = true;
    this.hinted = null;
    this.mode = 'move';
    this.excess += Math.max(0, this.entries - this.puzzle.par);
    if (this.course) {
      this.done.push(this.entries);
      this.report(true);
    }
    const order = this.layout.islands.map((_, i) => i).sort((a, b) => this.layout.islands[a].r - this.layout.islands[b].r || this.layout.islands[a].c - this.layout.islands[b].c);
    for (const [step, i] of order.entries()) {
      const t = this.numbers[i];
      void this.ctx.tw.to(t.scale, { x: 1.5, y: 1.5 }, { duration: 0.1 }).then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.14 }));
      sfx.bell(3 + (step % 7), 0.2);
      await this.ctx.tw.wait(0.06);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.puzzle.size * this.cell) / 2, y: (this.puzzle.size * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.blue.light], count: 28, speed: [160, 400], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (this.course) await this.seaScore();
    else await this.ctx.say('bridges.joined');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.tally.visible = false;
    sfx.tada();
    await this.ctx.say('bridges.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || !this.puzzle) return;
    for (const dir of this.held.poll(input, dt)) this.push(dir);
    if (input.players.some((p) => p.action)) this.arm('add');
    else if (input.players.some((p) => p.undo)) this.arm('remove');
  }

  /** The bottom button arms laying planks from this island, the left button taking them off; pressing the same one again lets go. */
  private arm(mode: 'add' | 'remove') {
    this.mode = this.mode === mode ? 'move' : mode;
    this.hinted = null;
    sfx.pop(this.mode === 'move' ? 2 : mode === 'add' ? 6 : 3);
  }

  private push(dir: number) {
    if (this.mode === 'move') {
      const next = islandToward(this.layout, this.focus, dir);
      if (next === null) return;
      this.focus = next;
      sfx.tick();
      return;
    }
    const edge = edgeToward(this.layout, this.focus, dir);
    if (edge === null) return void sfx.squeak();
    if (this.mode === 'add') this.lay(edge);
    else this.lift(edge);
  }

  /** Lay a plank: allowed where there are fewer than two, nothing crosses, and both islands have room. Anything else bumps and counts nothing. */
  private lay(edge: number) {
    if (!canAdd(this.layout, this.planks, edge)) {
      sfx.boing();
      if (this.layout.crossing[edge].some((f) => this.planks[f] > 0) && !this.told.cross) {
        this.told.cross = true;
        void this.ctx.say('bridges.cross');
      }
      return;
    }
    this.planks[edge]++;
    this.entries++;
    // A plank that is not in the answer is a miss for adaptation, never refused and never shown as one.
    if (this.planks[edge] > this.puzzle.solution[edge]) this.misses++;
    if (this.hinted?.edge === edge) this.hinted = null;
    sfx.pop(4 + (edge % 6));
    this.dirty = true;
    this.report();
    if (isSolved(this.layout, this.planks)) void this.joined();
  }

  /** Take a plank off: free. */
  private lift(edge: number) {
    if (!this.planks[edge]) return void sfx.squeak();
    this.planks[edge]--;
    if (this.hinted?.kind === 'fix' && this.hinted.edge === edge) this.hinted = null;
    sfx.pop(2);
    this.dirty = true;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint". Marks the run helped for good. */
  askForHint() {
    if (this.busy || this.finished || !this.puzzle) return;
    const h = hintFor(this.layout, this.planks, this.puzzle.solution);
    if (!h) return;
    this.hinted = h;
    this.hints++;
    this.assisted = true;
    this.mode = 'move';
    const e = this.layout.edges[h.edge];
    this.focus = h.kind === 'forced' ? h.island : e.a;
    this.report();
    const line: LineId = h.kind === 'fix' ? 'bridges.hint-fix' : h.kind === 'forced' ? 'bridges.hint-forced' : 'bridges.hint-next';
    void this.ctx.say(line);
  }

  /** Couch pause menu: clear the sea of planks. Planks already laid keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.puzzle || this.busy) return;
    this.planks = this.puzzle.solution.map(() => 0);
    this.hinted = null;
    this.mode = 'move';
    this.focus = 0;
    this.dirty = true;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** A bot that lays the answer's planks: walk to an island that still needs one, arm it, push toward the neighbour, let go. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.puzzle || this.botWait > 0) return out;
    const p = out.players[0];
    p.active = true;
    const sol = this.puzzle.solution;
    // A plank that does not belong comes off first; otherwise the first edge that still needs one (the lower island of the pair).
    const wrong = this.planks.findIndex((n, k) => n > sol[k]);
    const need = wrong >= 0 ? wrong : sol.findIndex((s, k) => this.planks[k] < s);
    if (need < 0) return out;
    const e = this.layout.edges[need], from = e.a;
    if (this.mode !== 'move' && !(this.focus === from && this.mode === (wrong >= 0 ? 'remove' : 'add'))) {
      // Armed in the wrong place or the wrong way: let go with the same button that armed it.
      if (this.mode === 'add') p.action = true; else p.undo = true;
      this.botWait = 0.2;
      return out;
    }
    if (this.focus !== from) {
      const path = focusPath(this.layout, this.focus, from);
      if (!path?.length) return out;
      p.direction = path[0];
      this.botWait = 0.22;
      return out;
    }
    if (this.mode === 'move') {
      if (wrong >= 0) p.undo = true; else p.action = true;
      this.botWait = 0.22;
      return out;
    }
    p.direction = directionOf(this.layout, from, need);
    this.botWait = 0.3;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** A little sea: three islands joined by planks. */
function miniSea(cell: number): Container {
  const c = new Container();
  const w = 4 * cell;
  c.addChild(new Graphics().roundRect(-w / 2 - 10, -w / 2 - 10, w + 20, w + 20, 18).fill(SEA).stroke({ width: 5, color: SEA_LINE }));
  const spots: [number, number, number][] = [[0, 0, 3], [3, 0, 2], [0, 3, 2], [3, 3, 3]];
  const at = (r: number, k: number) => ({ x: -w / 2 + cell / 2 + k * cell, y: -w / 2 + cell / 2 + r * cell });
  const g = new Graphics();
  const line = (a: { x: number; y: number }, b: { x: number; y: number }, off: number, horizontal: boolean) => g.moveTo(a.x + (horizontal ? 0 : off), a.y + (horizontal ? off : 0)).lineTo(b.x + (horizontal ? 0 : off), b.y + (horizontal ? off : 0)).stroke({ width: cell * 0.12, color: wood.line });
  line(at(0, 0), at(0, 3), -cell * 0.1, true);
  line(at(0, 0), at(0, 3), cell * 0.1, true);
  line(at(0, 0), at(3, 0), 0, false);
  line(at(0, 3), at(3, 3), 0, false);
  line(at(3, 0), at(3, 3), -cell * 0.1, true);
  line(at(3, 0), at(3, 3), cell * 0.1, true);
  c.addChild(g);
  for (const [r, k, n] of spots) {
    const p = at(r, k);
    c.addChild(new Graphics().circle(p.x, p.y, cell * 0.4).fill(SAND).stroke({ width: 4, color: SAND_LINE }));
    const t = label(String(n), Math.round(cell * 0.46), ink);
    t.position.set(p.x, p.y + 1);
    c.addChild(t);
  }
  return c;
}

class BridgeIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const sea = miniSea(46);
    sea.position.set(0, -110);
    c.addChild(sea);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(SEA).stroke({ width: 6, color: SEA_LINE }));
  const g = new Graphics();
  g.moveTo(-42, 8).lineTo(42, 8).stroke({ width: 10, color: wood.line }).moveTo(-42, 8).lineTo(42, 8).stroke({ width: 5, color: wood.light });
  for (const x of [-42, 42]) g.circle(x, 8, 26).fill(SAND).stroke({ width: 4, color: SAND_LINE });
  c.addChild(g);
  const a = label(String(rng.int(1, 4)), 28, ink), b = label(String(rng.int(1, 4)), 28, ink);
  a.position.set(-42, 9);
  b.position.set(42, 9);
  c.addChild(a, b);
  return c;
}

export const islandBridges: GameModule = {
  id: 'island-bridges',
  name: 'Island Bridges',
  titleLine: 'game.island-bridges',
  region: 'puzzle-peaks',
  skills: ['logic', 'planning', 'deduction'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new BridgeIcon(),
  sticker,
  create: (ctx) => new IslandBridges(ctx),
};
