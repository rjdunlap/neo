import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { choices, demoLoop, gridFor, inside, makeRound, nearestGroup, planFor, scatter, type LassoPlan, type LassoRound, type Point } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 5 },
};

const JAR_W = 108;
const JAR_H = 150;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A glowing little bug: a yellow tail light, a dark head and see-through wings. */
class Firefly extends Container {
  readonly halo = new Graphics().circle(0, 0, 30).fill({ color: swatch.yellow.light, alpha: 0.45 });
  readonly ring = new Graphics().circle(0, 0, 32).stroke({ width: 5, color: 0xffffff });
  /** Where it hovers, in play-area fractions; null once caught. */
  spot: Point | null;
  caught = false;
  private clock = Math.random() * 6;
  private readonly body = new Container();

  constructor(spot: Point) {
    super();
    this.spot = spot;
    const g = new Graphics()
      .ellipse(-9, -10, 9, 6).ellipse(9, -10, 9, 6).fill({ color: 0xffffff, alpha: 0.7 })
      .ellipse(0, 4, 9, 12).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3))
      .circle(0, -8, 7).fill(ink);
    this.body.addChild(g);
    this.ring.visible = false;
    this.addChild(this.halo, this.ring, this.body);
  }

  update(dt: number) {
    this.clock += dt;
    this.halo.alpha = 0.6 + 0.35 * Math.sin(this.clock * 3);
    this.body.y = this.caught ? 0 : 5 * Math.sin(this.clock * 1.7);
    this.body.x = this.caught ? 0 : 3 * Math.sin(this.clock * 1.1);
    if (this.ring.visible) this.ring.alpha = 0.5 + 0.5 * Math.sin(this.clock * 7);
  }
}

class Jar extends Container {
  readonly glow = new Graphics().roundRect(-JAR_W / 2 - 14, -JAR_H - 34, JAR_W + 28, JAR_H + 48, 26).fill({ color: 0xfff3a0, alpha: 0.85 });
  readonly flies: Firefly[] = [];
  private readonly tag = new Container();

  constructor(readonly want: number) {
    super();
    this.glow.visible = false;
    const g = new Graphics()
      .roundRect(-JAR_W / 2, -JAR_H, JAR_W, JAR_H, 22).fill({ color: swatch.blue.light, alpha: 0.35 }).stroke(line(swatch.white.fill, 5))
      .roundRect(-JAR_W / 2 + 8, -JAR_H - 22, JAR_W - 16, 24, 8).fill(wood.fill).stroke(line(wood.line, 4))
      .moveTo(-JAR_W / 2 + 16, -JAR_H + 20).lineTo(-JAR_W / 2 + 16, -30).stroke({ width: 6, color: 0xffffff, alpha: 0.5, cap: 'round' });
    this.addChild(this.glow, g, this.tag);
    this.setTag(want ? String(want) : '');
  }

  /** The jar's number: how many it wants, then how many it holds. */
  setTag(text: string) {
    this.tag.removeChildren().forEach((c) => c.destroy());
    if (!text) return;
    const badge = new Graphics().circle(0, -JAR_H - 46, 26).fill(0xffffff).stroke(line(wood.line, 4));
    const t = label(text, 30, ink);
    t.position.set(0, -JAR_H - 46);
    this.tag.addChild(badge, t);
  }

  /** Where the k-th firefly sits inside, two to a row from the bottom. */
  slot(k: number, of: number) {
    const cols = of > 2 ? 2 : 1;
    const rows = Math.ceil(of / cols);
    const r = Math.floor(k / cols);
    const c = k % cols;
    return { x: (c - (cols - 1) / 2) * 42, y: -20 - (r * (JAR_H - 40)) / Math.max(1, rows - 1) };
  }
}

class Pad extends Container {
  readonly glow = new Graphics().circle(0, 0, 76).fill({ color: 0xfff3a0, alpha: 0.85 });

  constructor(readonly value: number) {
    super();
    this.glow.visible = false;
    const n = label(String(value), 52, 0xffffff);
    n.style.stroke = { color: swatch.purple.line, width: 8, join: 'round' };
    this.addChild(this.glow, new Graphics().circle(0, 0, 60).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 6)), n);
    this.hitArea = new Circle(0, 0, 70);
  }
}

class LassoLoops implements Game {
  readonly plan: LassoPlan;
  readonly round: LassoRound;
  readonly flies: Firefly[] = [];
  readonly jars: Jar[] = [];
  pads: Pad[] = [];
  /** The jar being filled. */
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The latest loop, in stage coordinates, for checks. */
  lastLoop: Point[] = [];
  readonly sky = new Graphics();
  readonly leaf = new Graphics();

  private readonly backdrop: Backdrop;
  private readonly trail = new Graphics();
  private readonly flyLayer = new Container();
  private readonly padLayer = new Container();
  private touch: { id: number; points: Point[] } | null = null;
  private area = { x: 0, y: 0, w: 0, h: 0 };
  private wrongs = 0;
  private hinted = false;
  private view: View;
  private readonly grid: { cols: number; rows: number };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan, ctx.rng);
    this.backdrop = ctx.track(new Backdrop({ sky: [swatch.purple.line, swatch.blue.line], hills: [swatch.teal.line, swatch.green.line, 0x3f7f2e], horizon: 0.72, clouds: 0, sun: false, seed: 19 }, ctx.view));
    this.grid = gridFor(this.round.fireflies);
    for (const spot of scatter(this.round.fireflies, ctx.rng, this.grid.cols, this.grid.rows)) {
      const f = ctx.track(new Firefly(spot));
      this.flies.push(f);
      this.flyLayer.addChild(f);
    }
    for (const want of this.round.jars) {
      const jar = new Jar(want);
      this.jars.push(jar);
    }
    this.leaf.visible = false;
    this.sky.eventMode = 'static';
    this.sky.on('pointerdown', (e) => this.down(e));
    this.sky.on('globalpointermove', (e) => this.move(e));
    this.sky.on('pointerup', (e) => this.up(e));
    this.sky.on('pointerupoutside', (e) => this.up(e));
    this.sky.on('pointercancel', (e) => this.cancel(e));
    this.trail.eventMode = 'none';
    this.flyLayer.eventMode = 'none';
    // The loop layer catches touches over the meadow; jars and answer pads sit above it.
    ctx.stage.addChild(this.backdrop, this.leaf, ...this.jars, this.flyLayer, this.sky, this.trail, this.padLayer);
  }

  start() {
    void this.intro();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.area = { x: 160, y: 96, w: v.w - 210, h: v.h - 96 - JAR_H - 120 };
    this.sky.hitArea = new Rectangle(0, 0, v.w, v.h - JAR_H - 40);
    for (const f of this.flies) if (f.spot && !this.ctx.tw.busy(f)) f.position.copyFrom(this.place(f.spot));
    const xs = spread(this.jars.length, 190, v.w - (this.leafNeeded ? 210 : 40), 140);
    this.jars.forEach((j, i) => {
      j.position.set(xs[i], v.h - 30);
      j.flies.forEach((f, k) => {
        if (this.ctx.tw.busy(f)) return;
        const s = j.slot(k, j.want || j.flies.length);
        f.position.set(j.x + s.x, j.y + s.y);
      });
    });
    this.leaf.clear().moveTo(-90, 0).bezierCurveTo(-60, -70, 60, -70, 90, 0).bezierCurveTo(60, 50, -60, 50, -90, 0).fill(swatch.green.fill).stroke(line(swatch.green.line, 5)).moveTo(-80, 0).lineTo(80, 0).stroke(line(swatch.green.line, 4));
    this.leaf.position.set(v.w - 120, v.h - 90);
    this.layoutPads();
  }

  private get leafNeeded() {
    return this.round.ones > 0;
  }

  private place(spot: Point) {
    return { x: this.area.x + spot.x * this.area.w, y: this.area.y + spot.y * this.area.h };
  }

  update() {}

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.touch) return null;
    if (this.pads.length) {
      const right = this.pads.find((p) => p.value === this.round.answer);
      return right ? { tap: { on: right }, pause: 0.12 } : null;
    }
    const free = this.free;
    const jar = this.jar;
    if (!jar || !free.length) return null;
    const want = this.plan.mode === 'free' ? Math.ceil(free.length / (this.jars.length - this.index)) : jar.want;
    const move = demoLoop(free.map((f) => ({ x: f.x, y: f.y })), want, 34);
    if (!move) return null;
    const spots = move.loop.map((p) => ({ on: this.sky, x: p.x, y: p.y }));
    return { trace: spots[0], via: spots.slice(1), pause: 0.12 };
  }

  destroy() {
    this.touch = null;
  }

  get jar(): Jar | undefined {
    return this.jars[this.index];
  }

  get free(): Firefly[] {
    return this.flies.filter((f) => !f.caught);
  }

  private async intro() {
    const r = this.round;
    switch (this.plan.mode) {
      case 'free':
        await this.ctx.instruct('lasso.free');
        break;
      case 'exact':
        await this.ctx.instruct('lasso.exact', { n: r.jars[0] });
        break;
      case 'fives':
        await this.ctx.instruct('lasso.fives');
        break;
      case 'tens':
        await this.ctx.instruct('lasso.tens');
        break;
      case 'groups':
        await this.ctx.instruct('lasso.groups', { g: r.group!.count, s: r.group!.size });
        break;
    }
    this.markJar();
    this.busy = false;
  }

  /** The jar to fill next glows (except on the free level, where any loop fills the next jar). */
  private markJar() {
    this.jars.forEach((j, i) => (j.glow.visible = this.plan.mode !== 'free' && i === this.index && !this.finished));
  }

  // Drawing a loop: one finger, palm rejection, and a lost finger just drops the loop. ------------

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.touch || palmOnGlass()) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.touch = { id: e.pointerId, points: [{ x: p.x, y: p.y }] };
    sfx.tick();
  }

  private move(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    const last = t.points[t.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 8) return;
    t.points.push({ x: p.x, y: p.y });
    this.drawTrail(t.points);
  }

  private cancel(e: FederatedPointerEvent) {
    if (this.touch?.id !== e.pointerId) return;
    this.touch = null;
    this.trail.clear();
  }

  private up(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    this.touch = null;
    void this.closeLoop(t.points);
  }

  private drawTrail(points: Point[], closed = false) {
    const g = this.trail.clear();
    if (points.length < 2) return;
    g.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) g.lineTo(p.x, p.y);
    if (closed) g.closePath();
    g.stroke({ width: 16, color: swatch.yellow.fill, alpha: 0.35, cap: 'round', join: 'round' });
    g.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) g.lineTo(p.x, p.y);
    if (closed) g.closePath();
    g.stroke({ width: 6, color: 0xffffff, alpha: 0.9, cap: 'round', join: 'round' });
  }

  /** The loop always closes back to where it started, so a nearly-closed loop still counts. */
  async closeLoop(points: Point[]) {
    if (this.busy || this.finished) return;
    let length = 0;
    for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (length < 120) {
      this.trail.clear();
      return;
    }
    this.lastLoop = points;
    this.drawTrail(points, true);
    void this.ctx.tw.wait(0.5).then(() => this.trail.clear());
    const got = this.free.filter((f) => inside(points, f.position));
    const jar = this.jar;
    if (!jar) return;
    if (!got.length) return void this.ctx.say('lasso.empty');
    if (this.plan.mode !== 'free' && got.length !== jar.want) return this.wrongLoop(got, jar.want);
    await this.catch(got, jar);
  }

  /** The wrong number: they blink, flutter, and stay free. */
  private async wrongLoop(got: Firefly[], want: number) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    for (const f of got) {
      const x = f.x;
      void this.ctx.tw.to(f, { x: x + 10 }, { duration: 0.06 }).then(() => this.ctx.tw.to(f, { x }, { duration: 0.3, ease: ease.outElastic }));
    }
    await this.ctx.say('lasso.wrong', { got: got.length, n: want });
    if (this.wrongs >= 2) this.hint(want);
    this.busy = false;
  }

  private hint(n: number) {
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const free = this.free;
    const pts = free.map((f) => ({ x: f.x, y: f.y }));
    const group = nearestGroup(pts, free.map((_, i) => i), n);
    for (const f of this.flies) f.ring.visible = false;
    for (const i of group) free[i].ring.visible = true;
    void this.ctx.say('lasso.hint');
  }

  /** Into the jar they go, counted as they land. */
  private async catch(got: Firefly[], jar: Jar) {
    this.busy = true;
    this.wrongs = 0;
    for (const f of this.flies) f.ring.visible = false;
    const of = jar.want || got.length;
    for (const [k, f] of got.entries()) {
      f.caught = true;
      f.spot = null;
      jar.flies.push(f);
      // A jar of ten is full of fireflies: they snuggle up a little smaller.
      if (of > 6) void this.ctx.tw.to(f.scale, { x: 0.72, y: 0.72 }, { duration: 0.45 });
      const s = jar.slot(k, of);
      sfx.bell(4 + Math.min(10, k), 0.2);
      void this.ctx.tw.to(f, { x: jar.x + s.x, y: jar.y + s.y }, { duration: 0.45, ease: ease.inOutSine });
      await this.ctx.tw.wait(0.08);
    }
    await this.ctx.tw.wait(0.4);
    sfx.pop(9);
    jar.setTag(String(got.length));
    jar.glow.visible = false;
    await this.ctx.say('count', { n: got.length });
    this.index++;
    if (this.plan.mode === 'free') {
      if (!this.free.length || this.index >= this.jars.length) return this.finale();
    } else if (this.index >= this.jars.length) return this.allFull();
    else if (this.plan.mode === 'exact') void this.ctx.instruct('lasso.exact', { n: this.jar!.want });
    this.markJar();
    this.busy = false;
  }

  /** Every jar is full: the ones go to the leaf (or the extras fly home), then the question. */
  private async allFull() {
    const r = this.round;
    const rest = this.free;
    if (this.plan.mode === 'exact') return this.finale();
    if (r.ones) {
      this.leaf.visible = true;
      rest.forEach((f, k) => {
        f.caught = true;
        f.spot = null;
        void this.ctx.tw.to(f, { x: this.leaf.x - 60 + (k % 5) * 30, y: this.leaf.y - 14 - Math.floor(k / 5) * 30 }, { duration: 0.5, ease: ease.inOutSine });
      });
      await this.ctx.tw.wait(0.6);
      await this.ctx.say('lasso.left', { r: r.ones });
    } else {
      // Groups: the spare fireflies wander off home.
      for (const f of rest) {
        f.caught = true;
        void this.ctx.tw.to(f, { x: f.x + 400, y: f.y - 300, alpha: 0 }, { duration: 1, ease: ease.inQuad });
      }
    }
    this.pads = choices(r, this.ctx.rng).map((n) => {
      const pad = new Pad(n);
      onTap(pad, () => void this.answer(pad), { cooldown: 400 });
      pad.scale.set(0);
      this.padLayer.addChild(pad);
      void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      return pad;
    });
    this.layoutPads();
    if (r.group) await this.ctx.instruct('lasso.groups-total', { g: r.group.count, s: r.group.size });
    else await this.ctx.instruct('lasso.total');
    this.busy = false;
  }

  private layoutPads() {
    const v = this.view;
    this.pads.forEach((p, i) => p.position.set(v.w / 2 + (i - 1) * 180, this.area.y + this.area.h * 0.45));
  }

  private async answer(pad: Pad) {
    if (this.busy || this.finished) return;
    const r = this.round;
    if (pad.value === r.answer) {
      this.busy = true;
      pad.glow.visible = true;
      sfx.bell(10, 0.35);
      await this.ctx.say('lasso.right', { n: r.answer });
      return this.finale();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.countAloud();
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    if (this.wrongs >= 2) this.pads.find((p) => p.value === r.answer)!.glow.visible = true;
    this.busy = false;
  }

  /** Count the way the jars show it: by fives or tens or groups, then the ones on the leaf. */
  private async countAloud() {
    const r = this.round;
    if (this.plan.mode === 'tens') {
      for (const j of this.jars) this.bounce(j);
      await this.ctx.say('lasso.count-tens', { t: this.jars.length, tens: this.jars.length * 10, r: r.ones, n: r.answer! });
      return;
    }
    let total = 0;
    for (const j of this.jars) {
      total += j.want;
      this.bounce(j);
      sfx.bell(5 + Math.min(8, Math.round(total / 5)), 0.25);
      await this.ctx.say('count', { n: total });
    }
    for (let k = 0; k < r.ones; k++) {
      total++;
      sfx.bell(6 + k, 0.2);
      await this.ctx.say('count', { n: total });
    }
  }

  private bounce(node: Container) {
    void this.ctx.tw.to(node.scale, { x: 1.08, y: 1.08 }, { duration: 0.15 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.15 }));
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.markJar();
    sfx.tada();
    for (const j of this.jars) for (const f of j.flies) this.ctx.particles.burst(f.x, f.y, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 2, speed: [60, 140], gravity: -30, life: [0.5, 0.9] });
    await this.ctx.say('lasso.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class LassoIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const jar = new Jar(0);
    jar.scale.set(0.8);
    jar.position.set(30, 0);
    c.addChild(jar);
    const loop = new Graphics().ellipse(-60, -150, 62, 44).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
    c.addChild(loop);
    for (const [x, y] of [[-80, -160], [-45, -140], [-62, -175], [30, -40], [16, -80]]) {
      const f = new Firefly({ x: 0, y: 0 });
      f.caught = true;
      f.position.set(x, y);
      c.addChild(f);
    }
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const jar = new Jar(0);
  jar.position.set(0, 80);
  c.addChild(jar);
  const n = rng.int(3, 6);
  for (let k = 0; k < n; k++) {
    const f = new Firefly({ x: 0, y: 0 });
    f.caught = true;
    const s = jar.slot(k, n);
    f.position.set(s.x, 80 + s.y);
    c.addChild(f);
  }
  return c;
}

export const lassoLoops: GameModule = {
  id: 'lasso-loops',
  name: 'Lasso Loops',
  titleLine: 'game.lasso-loops',
  region: 'counting-cove',
  skills: ['grouping', 'counting by fives and tens', 'place value', 'equal groups'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Draw loops around groups of toys or pasta with {name}, then count the groups: "ten, twenty, and three more!"',
  offScreen: 'Bundle straws or sticks into tens with rubber bands, then count the bundles and the loose ones.',
  hubIcon: () => new LassoIcon(),
  sticker,
  touchDemo: true,
  create: (ctx) => new LassoLoops(ctx),
};
