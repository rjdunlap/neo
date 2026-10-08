import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { COURSES, courseMinimum, coursePonds, isCongaCourse } from './course';
import { hintDir, hintPath, makePond, nextCrumb, opposite, planFor, startState, step, type Cell, type Conga, type Dir, type Pond } from './logic';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 6 } };

const WATER = 0xa9e0f2;
const WATER_LINE = 0x4f9fbf;
const RIPPLE = 0xd2f1fb;
const PAD = 0x6cbd54;
const PAD_LINE = 0x3f8a36;
const BREAD = 0xf2d199;
const BREAD_LINE = 0xbf8a45;
/** How much of a cell a duckling fills: a little less than all of it, so a line that turns does not pile up. */
const DUCK = 0.86;
/** A breather after a bonk, so there is time to choose where to go next. */
const BREATHER = 0.9;

/** One duckling facing right, filling about `size` units around (0, 0). The leader has a bigger head and a red bow. */
function ducklingArt(size: number, leader: boolean): Container {
  const c = new Container();
  const g = new Graphics(), s = size;
  g.ellipse(-0.06 * s, 0, 0.4 * s, 0.31 * s).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.ellipse(-0.14 * s, 0.02 * s, 0.17 * s, 0.1 * s).fill(swatch.yellow.line);
  const head = leader ? 0.25 : 0.2;
  g.circle(0.27 * s, 0, head * s).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.poly([0.27 * s + head * s * 0.8, -0.08 * s, 0.27 * s + head * s * 0.8 + 0.17 * s, 0, 0.27 * s + head * s * 0.8, 0.08 * s]).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line });
  g.circle(0.33 * s, -0.08 * s, 0.035 * s).fill(ink);
  g.circle(0.33 * s, 0.08 * s, 0.035 * s).fill(ink);
  if (leader) {
    g.poly([0.08 * s, 0, 0.0, -0.1 * s, 0.0, 0.1 * s]).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
    g.poly([0.08 * s, 0, 0.16 * s, -0.1 * s, 0.16 * s, 0.1 * s]).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
  }
  c.addChild(g);
  return c;
}

/** A piece of bread, about `size` across. */
function crumbArt(size: number): Container {
  const c = new Container();
  const g = new Graphics(), s = size;
  g.roundRect(-0.32 * s, -0.28 * s, 0.64 * s, 0.56 * s, 0.14 * s).fill(BREAD).stroke({ width: 4, color: BREAD_LINE });
  for (const [x, y] of [[-0.12, -0.06], [0.1, 0.08], [0.0, 0.14], [0.14, -0.12]]) g.circle(x * s, y * s, 0.032 * s).fill(BREAD_LINE);
  g.ellipse(-0.14 * s, -0.17 * s, 0.1 * s, 0.045 * s).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  return c;
}

/** A lily pad about `size` across, with its notch turned to `turn` and, now and then, a pink flower. */
function padArt(size: number, turn: number, flower: boolean): Container {
  const c = new Container();
  const g = new Graphics(), r = size * 0.46;
  g.moveTo(0, 0).arc(0, 0, r, turn + 0.35, turn + Math.PI * 2 - 0.35).closePath().fill(PAD).stroke({ width: 4, color: PAD_LINE });
  g.moveTo(0, 0).lineTo(Math.cos(turn + Math.PI) * r * 0.6, Math.sin(turn + Math.PI) * r * 0.6).stroke({ width: 2, color: PAD_LINE, alpha: 0.6 });
  if (flower) {
    for (let k = 0; k < 5; k++) g.circle(Math.cos(k * 1.2566) * size * 0.1, Math.sin(k * 1.2566) * size * 0.1, size * 0.07).fill(swatch.pink.fill);
    g.circle(0, 0, size * 0.06).fill(swatch.yellow.fill);
  }
  c.addChild(g);
  return c;
}

class PondConga implements Game {
  index = -1;
  /** Bonks in the whole round: the couch's misses. */
  misses = 0;
  hints = 0;
  /** Steps beyond each pond's fewest, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  pond!: Pond;
  state!: Conga;
  /** Every step and every bonk on this pond. */
  tries = 0;
  /** Showing the way to the next crumb. */
  hinted = false;
  private hintCells: Cell[] = [];
  /** Waiting for the first turn of the stick, so nothing moves before somebody is ready. */
  waiting = true;

  private readonly ponds: Pond[];
  private readonly speed: number;
  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly pads = new Container();
  private readonly trail = new Graphics();
  private readonly crumbs = new Container();
  private readonly line = new Container();
  private readonly top = label('', 30, ink);
  private readonly note = label('', 26, ink, '500');
  private crumbNext = crumbArt(70);
  private crumbAfter = crumbArt(70);
  private ducks: Container[] = [];
  private cell = 56;
  private clock = 0;
  private acc = 0;
  private breather = 0;
  /** The line as it was one step ago, to glide from. */
  private before: Cell[] = [];
  private queue: Dir[] = [];
  private view: View;
  private botWait = 0.9;
  /** Whether the line is still on the pond's own route, which is what the demo bot follows. */
  private onRoute = true;
  private routeAt = 0;
  private told = false;
  private bonked = false;
  private ate = false;
  private settled = false;
  /** Couch challenge course: fixed ponds in a row. Null in ordinary play, where one pond is made from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Steps already spent on the pond we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const run = ctx.couch?.course;
    if (run && isCongaCourse(run.id)) {
      this.ponds = coursePonds(run.id);
      this.speed = COURSES[run.id].speed;
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      const plan = planFor(ctx.level);
      this.ponds = [makePond(plan, ctx.rng)];
      this.speed = plan.speed;
      this.course = null;
    }
    for (const part of [this.board, this.water, this.pads, this.trail, this.crumbs, this.line, this.top, this.note]) part.eventMode = 'none';
    this.crumbs.addChild(this.crumbAfter, this.crumbNext);
    this.board.addChild(this.water, this.pads, this.trail, this.crumbs, this.line);
    ctx.stage.addChild(this.board, this.top, this.note);
  }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.pond) return;
    // Clear of the buttons along the top, the controller reminder along the bottom, and the pet in the corner (a crumb must never hide behind it).
    this.cell = Math.max(24, Math.min(80, Math.floor((v.w - 60) / this.pond.cols), Math.floor((v.h - 312) / this.pond.rows)));
    this.board.position.set((v.w - this.pond.cols * this.cell) / 2, 138);
    this.top.position.set(v.w / 2, 96);
    this.note.position.set(v.w / 2, v.h - 130);
    this.layout();
  }

  private center(c: Cell) {
    return { x: c.x * this.cell + this.cell / 2, y: c.y * this.cell + this.cell / 2 };
  }

  /** The water, the lily pads and the crumbs' size. */
  private layout() {
    const p = this.pond, cell = this.cell, w = p.cols * cell, h = p.rows * cell;
    this.water.clear().roundRect(-14, -14, w + 28, h + 28, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE });
    for (let k = 0; k < p.cols * 2; k++) {
      const x = (k * 97) % (w - 40), y = (k * 53 + 17) % (h - 8);
      this.water.moveTo(x + 10, y + 6).lineTo(x + 38, y + 6).stroke({ width: 3, color: RIPPLE, cap: 'round' });
    }
    this.pads.removeChildren().forEach((c) => c.destroy({ children: true }));
    p.pads.forEach((pad, i) => {
      const art = padArt(cell, (i * 1.7) % (Math.PI * 2), i % 3 === 0);
      const at = this.center(pad);
      art.position.set(at.x, at.y);
      this.pads.addChild(art);
    });
    for (const art of [this.crumbNext, this.crumbAfter]) art.scale.set(cell / 70);
    this.ducks.forEach((d, i) => d.scale.set(DUCK * cell / 100 * (i === 0 ? 1.06 : 1)));
  }

  /** Make sure there is a duckling picture for every duckling in the line. */
  private grow() {
    while (this.ducks.length < this.state.body.length) {
      const leader = this.ducks.length === 0;
      const d = ducklingArt(100, leader);
      d.scale.set(DUCK * this.cell / 100 * (leader ? 1.06 : 1));
      d.eventMode = 'none';
      this.ducks.push(d);
      this.line.addChildAt(d, 0);
    }
  }

  /** Every frame: the line glides from where it was to where it is, the next crumb pulses, and the hint's dots show. */
  private draw(glide: number) {
    if (!this.pond) return;
    const body = this.state.body, before = this.before;
    this.grow();
    this.ducks.forEach((d, i) => {
      d.visible = i < body.length;
      if (i >= body.length) return;
      const to = this.center(body[i]), from = this.center(before[i] ?? body[i]);
      d.position.set(from.x + (to.x - from.x) * glide, from.y + (to.y - from.y) * glide);
      const ahead = i === 0 ? null : body[i - 1];
      const dir = ahead ? this.toward(body[i], ahead) : this.state.heading;
      d.rotation = dir * Math.PI / 2;
    });
    const next = nextCrumb(this.pond, this.state), after = this.pond.crumbs[this.state.eaten + 1];
    this.crumbNext.visible = !!next;
    this.crumbAfter.visible = !!after;
    const pulse = 1 + 0.07 * Math.sin(this.clock * 5);
    if (next) {
      const at = this.center(next);
      this.crumbNext.position.set(at.x, at.y);
      this.crumbNext.scale.set(this.cell / 70 * pulse);
    }
    if (after) {
      const at = this.center(after);
      this.crumbAfter.position.set(at.x, at.y);
      this.crumbAfter.scale.set(this.cell / 70 * 0.62);
      this.crumbAfter.alpha = 0.5;
    }
    const t = this.trail.clear();
    if (this.hinted && !this.busy) {
      for (const c of this.hintCells) {
        const m = this.center(c);
        t.circle(m.x, m.y, this.cell * 0.13).fill({ color: swatch.yellow.fill, alpha: 0.95 }).stroke({ width: 2, color: swatch.yellow.line });
      }
    }
  }

  /** The dots of a hint: the next few cells of the way to the crumb from where the line is now. Worked out once a step, not every frame. */
  private refreshHint() {
    this.hintCells = [];
    if (!this.hinted) return;
    let at = this.state.body[0];
    for (const d of hintPath(this.pond, this.state).slice(0, 7)) {
      at = { x: at.x + [1, 0, -1, 0][d], y: at.y + [0, 1, 0, -1][d] };
      this.hintCells.push(at);
    }
  }

  private toward(from: Cell, to: Cell): Dir {
    return to.x > from.x ? 0 : to.y > from.y ? 1 : to.x < from.x ? 2 : 3;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.pond) return;
    let glide = 1;
    if (!this.busy && !this.finished && !this.waiting) {
      if (this.breather > 0) {
        this.breather = Math.max(0, this.breather - dt);
        if (this.breather === 0) this.acc = 0;
      } else {
        this.acc += dt;
        const period = 1 / this.speed;
        while (this.acc >= period && !this.busy && this.breather <= 0 && !this.finished) {
          this.acc -= period;
          this.tick();
        }
        glide = this.breather > 0 || this.busy ? 1 : Math.min(1, this.acc / period);
      }
    }
    this.draw(glide);
  }

  destroy() {}

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and ponds                                                                              */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.ponds.length) return void this.finale();
    this.pond = this.ponds[this.index];
    this.state = startState(this.pond);
    this.before = this.state.body.map((c) => ({ ...c }));
    this.tries = this.carry;
    this.carry = 0;
    this.queue = [];
    this.hinted = false;
    this.waiting = true;
    this.acc = 0;
    this.breather = 0;
    this.onRoute = true;
    this.routeAt = 0;
    this.ducks.forEach((d) => d.destroy({ children: true }));
    this.ducks = [];
    this.line.removeChildren();
    this.resize(this.view);
    this.tally();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    return this.ctx.instruct('conga.go');
  }

  private tally() {
    const n = this.pond.crumbs.length;
    this.top.text = `${this.tries} ${this.tries === 1 ? 'step' : 'steps'}  ·  ${Math.min(this.state.eaten, n)} of ${n} crumbs`;
    this.note.text = this.waiting ? 'Press a direction to set off' : '';
  }

  /** Hand a course's numbers to the shell. `finished` means the pond just ended, so none of its steps are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.ponds.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.tries,
      par: this.pond.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** One step of the line, at the pace the pond sets. */
  private tick() {
    const want = this.takeTurn();
    if (want !== null && want !== this.state.heading) sfx.tick();
    const r = step(this.pond, this.state, want);
    const heading = r.state.heading;
    this.tries++;
    if (r.event === 'bonk') {
      this.misses++;
      this.before = r.state.body.map((c) => ({ ...c }));
      this.state = r.state;
      this.onRoute = false;
      this.breather = BREATHER;
      this.queue = [];
      this.acc = 0;
      sfx.boing();
      this.ctx.pet.hop(0.5);
      this.bonkAt(r.state.body[0]);
      if (!this.bonked) {
        this.bonked = true;
        void this.ctx.say('conga.bonk');
      }
    } else {
      this.before = this.state.body.map((c) => ({ ...c }));
      this.state = r.state;
      if (this.onRoute && this.pond.route[this.routeAt] === heading) this.routeAt++;
      else this.onRoute = false;
      if (r.event === 'crumb') this.crumbEaten();
    }
    this.refreshHint();
    this.tally();
    if (r.event === 'crumb' && this.state.eaten >= this.pond.crumbs.length) void this.pondDone();
    else this.report();
  }

  /** The next turn she asked for that still makes sense: one that goes straight back is dropped. */
  private takeTurn(): Dir | null {
    while (this.queue.length) {
      const d = this.queue.shift()!;
      if (d !== opposite(this.state.heading)) return d;
    }
    return null;
  }

  private crumbEaten() {
    const at = this.ctx.stage.toLocal(this.board.toGlobal(this.center(this.state.body[0])));
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [BREAD, 0xfff3a0, 0xffffff], count: 10, speed: [90, 220], gravity: 0, life: [0.35, 0.7] });
    sfx.pop(2 + (this.state.eaten % 7));
    this.hinted = false;
    this.hintCells = [];
    if (!this.ate) {
      this.ate = true;
      void this.ctx.say('conga.crumb');
    }
  }

  /** A little burst where the leader bumped, so the bump is seen as well as heard. */
  private bonkAt(cell: Cell) {
    const at = this.ctx.stage.toLocal(this.board.toGlobal(this.center(cell)));
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [swatch.orange.fill, 0xffffff], count: 8, speed: [80, 190], gravity: 0, life: [0.3, 0.55] });
    const text = label('Bonk!', 34, swatch.orange.line);
    text.position.set(at.x, at.y - this.cell * 0.9);
    this.ctx.stage.addChild(text);
    void this.ctx.tw.to(text, { y: text.y - 24, alpha: 0 }, { duration: 0.8 }).then(() => text.destroy());
  }

  /** The score for the pond just cleared, over the board for a moment. */
  private async pondScore() {
    const best = this.pond.par, total = this.ponds.length;
    const text = this.tries === best
      ? `Pond ${this.index + 1} of ${total}: ${this.tries} steps, the fewest possible!`
      : `Pond ${this.index + 1} of ${total}: ${this.tries} steps (fewest ${best})`;
    const note = label(text, 32, ink);
    note.position.set(this.view.w / 2, 100);
    note.alpha = 0;
    this.top.visible = false;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.3);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
    this.top.visible = true;
  }

  private async pondDone() {
    this.busy = true;
    this.hinted = false;
    this.hintCells = [];
    this.excess += Math.max(0, this.tries - this.pond.par);
    if (this.course) {
      this.done.push(this.tries);
      this.report(true);
    }
    sfx.sparkle();
    this.ctx.pet.cheer();
    // The whole line does a little hop.
    for (let i = 0; i < this.ducks.length; i++) {
      const d = this.ducks[i];
      void this.ctx.tw.wait(i * 0.05).then(() => this.ctx.tw.to(d, { y: d.y - this.cell * 0.28 }, { duration: 0.14 })).then(() => this.ctx.tw.to(d, { y: d.y + this.cell * 0.28 }, { duration: 0.16 }));
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.pond.cols * this.cell) / 2, y: (this.pond.rows * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, BREAD], count: 28, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.pondScore();
    else await this.ctx.say('conga.pond');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.top.visible = false;
    this.note.visible = false;
    sfx.tada();
    await this.ctx.say('conga.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls) {
    if (this.busy || this.finished || !this.pond) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.press(p.direction as Dir);
      else if (p.action && this.waiting) this.press(this.state.heading);
    }
  }

  /** A turn of the stick: the first one sets the line off; after that a turn waits for the next step, two at most, and straight back is ignored. */
  private press(dir: Dir) {
    if (this.waiting) {
      this.waiting = false;
      this.acc = 0;
      this.queue = dir === this.state.heading || dir === opposite(this.state.heading) ? [] : [dir];
      this.tally();
      return;
    }
    if (this.queue.length >= 2) return;
    const last = this.queue.at(-1) ?? this.state.heading;
    if (dir === last || dir === opposite(last)) return;
    this.queue.push(dir);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": dots along the way to the next crumb, until it is eaten. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.pond) return;
    this.hinted = true;
    this.hints++;
    this.assisted = true;
    this.refreshHint();
    this.report();
    void this.ctx.say('conga.hint');
  }

  /** Couch pause menu: put the line back at the start of the pond. Steps already taken keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.pond || this.busy) return;
    this.state = startState(this.pond);
    this.before = this.state.body.map((c) => ({ ...c }));
    this.ducks.forEach((d) => d.destroy({ children: true }));
    this.ducks = [];
    this.line.removeChildren();
    this.queue = [];
    this.hinted = false;
    this.waiting = true;
    this.acc = 0;
    this.breather = 0;
    this.onRoute = true;
    this.routeAt = 0;
    this.hintCells = [];
    this.tally();
    this.report();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** A bot that paddles a fewest-steps route: the pond's own while the line is on it, else straight to the next crumb. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.pond || this.botWait > 0) return out;
    const want = this.onRoute ? this.pond.route[this.routeAt] ?? this.state.heading : hintDir(this.pond, this.state);
    const p = out.players[0];
    p.active = true;
    if (this.waiting) { p.direction = want; return out; }
    const last = this.queue.at(-1) ?? this.state.heading;
    if (want !== last && this.queue.length === 0) p.direction = want;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

class PondIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-130, -190, 260, 170, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
    const pad = padArt(70, 0.6, true);
    pad.position.set(78, -128);
    c.addChild(pad);
    const bread = crumbArt(54);
    bread.position.set(-96, -138);
    c.addChild(bread);
    [-64, 0, 64].forEach((x) => {
      const d = ducklingArt(70, x === 64);
      d.position.set(x, -92);
      c.addChild(d);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
  const d = ducklingArt(130, true);
  d.rotation = rng.range(-0.3, 0.3);
  d.position.set(0, 2);
  c.addChild(d);
  return c;
}

export const pondConga: GameModule = {
  id: 'pond-conga',
  name: 'Pond Conga',
  titleLine: 'game.pond-conga',
  region: 'puzzle-peaks',
  skills: ['planning', 'steering', 'sequencing'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  hubIcon: () => new PondIcon(),
  sticker,
  create: (ctx) => new PondConga(ctx),
};
