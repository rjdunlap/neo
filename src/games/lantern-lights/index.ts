import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { courseMinimum, coursePonds, isLanternCourse } from './course';
import { allLit, footprint, hintFor, litCount, makePonds, planFor, press, type LanternPlan, type Pond } from './logic';

/** Grown-up play only: this game lives on the couch, not on the child's island. */
const LEVELS: BandLevels = { school: { min: 1, max: 6 } };

const WATER = 0x25315f;
const WATER_LINE = 0x151d3d;
const RIPPLE = 0x3a4a82;

/** One paper lantern, lit or dark, with its string above and its tassel below; it fills about `size` units around (0, 0). */
function lanternArt(lit: boolean, size: number): Container {
  const c = new Container();
  const g = new Graphics(), w = size * 0.6, h = size * 0.66;
  const body = lit ? swatch.orange.fill : 0x56648c, line = lit ? swatch.orange.line : 0x39456b, cap = lit ? 0xb4561c : 0x2c3556;
  g.moveTo(0, -h / 2 - size * 0.18).lineTo(0, -h / 2).stroke({ width: 3, color: line });
  g.ellipse(0, 0, w / 2, h / 2).fill(body).stroke({ width: 4, color: line });
  for (const k of [0.62, 0.3]) g.ellipse(0, 0, (w / 2) * k, h / 2).stroke({ width: 2, color: line, alpha: 0.55 });
  g.roundRect(-w * 0.3, -h / 2 - 4, w * 0.6, 12, 5).fill(cap);
  g.roundRect(-w * 0.3, h / 2 - 8, w * 0.6, 12, 5).fill(cap);
  g.moveTo(0, h / 2 + 4).lineTo(0, h / 2 + size * 0.15).stroke({ width: 3, color: line });
  g.circle(0, h / 2 + size * 0.17, 5).fill(lit ? swatch.yellow.fill : 0x6d7bab);
  if (lit) {
    g.ellipse(0, 0, w * 0.3, h * 0.34).fill({ color: 0xfff6c8, alpha: 0.95 });
    g.ellipse(-w * 0.13, -h * 0.12, w * 0.08, h * 0.12).fill({ color: 0xffffff, alpha: 0.7 });
  }
  c.addChild(g);
  return c;
}

class LanternLights implements Game {
  readonly plan: LanternPlan;
  index = -1;
  misses = 0;
  hints = 0;
  /** Presses beyond each pond's fewest, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  pond!: Pond;
  /** The lanterns now: `true` is lit. */
  lit: boolean[] = [];
  cursor = 0;
  /** Presses on this pond, undone ones included. */
  presses = 0;
  hinted: number | null = null;

  private readonly ponds: Pond[];
  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly halos = new Graphics();
  private readonly lanterns = new Container();
  private readonly glow = new Graphics();
  private readonly score = label('', 34, ink);
  private readonly sub = label('', 24, ink, '500');
  private nodes: Container[] = [];
  private onArt: Container[] = [];
  private offArt: Container[] = [];
  private tokens: number[] = [];
  private history: number[] = [];
  private cell = 100;
  private clock = 0;
  private view: View;
  private readonly held = new HeldDirection();
  private botWait = 0.8;
  /** Couch challenge course: fixed ponds in a row. Null in ordinary play, where ponds are generated. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Presses already spent on the pond we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private told = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isLanternCourse(run.id)) {
      this.ponds = coursePonds(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.ponds = makePonds(this.plan, ctx.rng);
      this.course = null;
    }
    for (const part of [this.board, this.water, this.halos, this.lanterns, this.glow, this.score, this.sub]) part.eventMode = 'none';
    this.board.addChild(this.water, this.halos, this.lanterns, this.glow);
    ctx.stage.addChild(this.board, this.score, this.sub);
  }

  get n() { return this.pond.size; }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.pond) return;
    this.cell = Math.min(116, Math.floor((v.h - 262) / this.n));
    const bw = this.n * this.cell;
    this.board.position.set((v.w - bw) / 2, 112);
    // The counts sit beside the pond, clear of the edge.
    const x = Math.min((v.w + bw) / 2 + 150, v.w - 120);
    this.score.position.set(x, 190);
    this.sub.position.set(x, 236);
    this.layout();
  }

  private center(i: number) {
    return { x: (i % this.n) * this.cell + this.cell / 2, y: Math.floor(i / this.n) * this.cell + this.cell / 2 };
  }

  /** The pond's water, and every lantern where it hangs. */
  private layout() {
    const n = this.n, cell = this.cell, w = n * cell;
    this.water.clear().roundRect(-18, -18, w + 36, w + 36, 30).fill(WATER).stroke({ width: 7, color: WATER_LINE });
    for (let k = 0; k < n * 2; k++) {
      const x = ((k * 97) % w), y = ((k * 53 + 17) % w);
      this.water.moveTo(x, y).lineTo(x + 26, y).stroke({ width: 3, color: RIPPLE, cap: 'round' });
    }
    this.nodes.forEach((node, i) => {
      const at = this.center(i);
      node.position.set(at.x, at.y + cell * 0.02);
      this.onArt[i].scale.set(cell / 100);
      this.offArt[i].scale.set(cell / 100);
    });
    this.drawHalos();
  }

  /** A warm glow under every lit lantern, which spills a little across its neighbours. */
  private drawHalos() {
    const g = this.halos.clear(), cell = this.cell;
    this.lit.forEach((on, i) => {
      if (!on) return;
      const at = this.center(i);
      g.circle(at.x, at.y, cell * 0.54).fill({ color: 0xff9d3c, alpha: 0.2 });
      g.circle(at.x, at.y, cell * 0.42).fill({ color: 0xffc247, alpha: 0.3 });
    });
  }

  private setArt(i: number, lit: boolean) {
    this.onArt[i].visible = lit;
    this.offArt[i].visible = !lit;
  }

  /** Flip a lantern's picture to match the board, with a quick turn. A later flip takes over from an earlier one. */
  private flip(i: number) {
    const node = this.nodes[i], to = this.lit[i], token = ++this.tokens[i];
    void this.ctx.tw.to(node.scale, { x: 0.12 }, { duration: 0.07 }).then(() => {
      if (this.tokens[i] !== token) return;
      this.setArt(i, to);
      this.drawHalos();
      return this.ctx.tw.to(node.scale, { x: 1 }, { duration: 0.1, ease: ease.outBack });
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.pond) return;
    const g = this.glow.clear(), cell = this.cell;
    if (this.finished || this.busy) return;
    const at = this.center(this.cursor);
    // The cursor shows what a press would flip: the lantern and the four beside it.
    for (const c of footprint(this.n, this.cursor)) {
      const m = this.center(c);
      g.roundRect(m.x - cell / 2 + 5, m.y - cell / 2 + 5, cell - 10, cell - 10, 14).fill({ color: 0xffffff, alpha: c === this.cursor ? 0.2 : 0.1 });
    }
    g.roundRect(at.x - cell / 2 + 3, at.y - cell / 2 + 3, cell - 6, cell - 6, 16).stroke({ width: 6, color: 0xffffff });
    if (this.hinted !== null) {
      const m = this.center(this.hinted);
      g.roundRect(m.x - cell / 2 - 2, m.y - cell / 2 - 2, cell + 4, cell + 4, 18).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    }
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
    this.lit = this.pond.board.slice();
    this.presses = this.carry;
    this.carry = 0;
    this.history = [];
    this.hinted = null;
    this.cursor = Math.floor((this.n * this.n) / 2);
    this.nodes.forEach((n) => n.destroy({ children: true }));
    this.lanterns.removeChildren();
    this.nodes = [];
    this.onArt = [];
    this.offArt = [];
    this.tokens = this.lit.map(() => 0);
    for (let i = 0; i < this.lit.length; i++) {
      const node = new Container(), on = lanternArt(true, 100), off = lanternArt(false, 100);
      node.addChild(off, on);
      node.eventMode = 'none';
      this.lanterns.addChild(node);
      this.nodes.push(node);
      this.onArt.push(on);
      this.offArt.push(off);
      this.setArt(i, this.lit[i]);
    }
    this.resize(this.view);
    this.tally();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    return this.ctx.instruct('lantern.go');
  }

  private tally() {
    this.score.text = `${this.presses} ${this.presses === 1 ? 'press' : 'presses'}`;
    this.sub.text = `${litCount(this.lit)} of ${this.lit.length} lit`;
  }

  /** Hand a course's numbers to the shell. `finished` means the pond just ended, so none of its presses are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.ponds.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.presses,
      par: this.pond.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the pond just lit, over the board for a moment. */
  private async pondScore() {
    const best = this.pond.par, total = this.ponds.length;
    const text = this.presses === best ? `Pond ${this.index + 1} of ${total}: ${this.presses} presses, the fewest possible!` : `Pond ${this.index + 1} of ${total}: ${this.presses} presses (fewest ${best})`;
    const note = label(text, 34, ink);
    note.position.set(this.view.w / 2, Math.max(48, this.board.y - 56));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async glowUp() {
    this.busy = true;
    this.hinted = null;
    this.excess += Math.max(0, this.presses - this.pond.par);
    if (this.course) {
      this.done.push(this.presses);
      this.report(true);
    }
    const n = this.n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const node = this.nodes[r * n + c];
        void this.ctx.tw.to(node.scale, { y: 1.28 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node.scale, { y: 1 }, { duration: 0.16 }));
      }
      sfx.bell(3 + (r % 7), 0.25);
      await this.ctx.tw.wait(0.11);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (n * this.cell) / 2, y: (n * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.orange.light], count: 30, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.pondScore();
    else await this.ctx.say('lantern.lit');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.score.visible = false;
    this.sub.visible = false;
    sfx.tada();
    await this.ctx.say('lantern.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || !this.pond) return;
    for (const dir of this.held.poll(input, dt)) this.move(dir);
    if (input.players.some((p) => p.action)) this.press();
    else if (input.players.some((p) => p.undo)) this.back();
  }

  private move(dir: number) {
    const n = this.n, r = Math.floor(this.cursor / n), c = this.cursor % n;
    const nr = Math.min(n - 1, Math.max(0, r + [0, 1, 0, -1][dir])), nc = Math.min(n - 1, Math.max(0, c + [1, 0, -1, 0][dir]));
    const to = nr * n + nc;
    if (to === this.cursor) return;
    this.cursor = to;
    sfx.tick();
  }

  /** Press the lantern under the cursor: it and its neighbours flip, and the press counts. */
  private press() {
    const i = this.cursor;
    this.lit = press(this.lit, this.n, i);
    this.history.push(i);
    this.presses++;
    if (this.hinted === i) this.hinted = null;
    for (const c of footprint(this.n, i)) this.flip(c);
    sfx.pop(3 + (i % 7));
    this.tally();
    this.report();
    if (allLit(this.lit)) void this.glowUp();
  }

  /** The left button: take the last press back. The press stays counted; taking it back is free. */
  private back() {
    const i = this.history.pop();
    if (i === undefined) return void sfx.squeak();
    this.lit = press(this.lit, this.n, i);
    this.cursor = i;
    this.hinted = null;
    for (const c of footprint(this.n, i)) this.flip(c);
    sfx.pop(2);
    this.tally();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": a lantern in a fewest-press way to light the pond from here. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.pond) return;
    const at = hintFor(this.lit, this.n, this.cursor);
    if (at === null) return;
    this.hinted = at;
    this.hints++;
    this.assisted = true;
    this.cursor = at;
    this.report();
    void this.ctx.say('lantern.hint');
  }

  /** Couch pause menu: put the pond back as it began. Presses already made keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.pond || this.busy) return;
    this.lit = this.pond.board.slice();
    this.history = [];
    this.hinted = null;
    this.lit.forEach((_, i) => this.flip(i));
    this.tally();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** A bot that plays a fewest-press way: the nearest lantern in one of them, walked to and pressed. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.pond || this.botWait > 0) return out;
    const next = hintFor(this.lit, this.n, this.cursor);
    if (next === null) return out;
    const p = out.players[0];
    p.active = true;
    if (next === this.cursor) { p.action = true; this.botWait = 0.45; return out; }
    const n = this.n, fr = Math.floor(this.cursor / n), fc = this.cursor % n, tr = Math.floor(next / n), tc = next % n;
    p.direction = fc !== tc ? (tc > fc ? 0 : 2) : tr > fr ? 1 : 3;
    this.botWait = 0.16;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

class LanternIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-130, -190, 260, 170, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
    [[-80, true], [0, false], [80, true]].forEach(([x, on], k) => {
      const l = lanternArt(on as boolean, 96);
      l.position.set(x as number, -108 + (k === 1 ? 6 : 0));
      c.addChild(l);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
  const l = lanternArt(true, 150);
  l.rotation = rng.range(-0.15, 0.15);
  l.position.set(0, 4);
  c.addChild(l);
  return c;
}

export const lanternLights: GameModule = {
  id: 'lantern-lights',
  name: 'Lantern Lights',
  titleLine: 'game.lantern-lights',
  region: 'puzzle-peaks',
  skills: ['logic', 'planning', 'pattern-finding'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  hubIcon: () => new LanternIcon(),
  sticker,
  create: (ctx) => new LanternLights(ctx),
};
