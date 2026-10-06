import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { ink, RAINBOW, swatch, type ColorName } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import {
  aimFor,
  CATCH_Y,
  FLIPPER,
  flipperPoints,
  funnel,
  LAUNCH,
  launchVelocity,
  makeBumpers,
  makeWorld,
  planFor,
  TABLE,
  type Bumper,
  type BumperPlan,
  type FlipperSide,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

/** Colors a flower can be; on color levels the first is the one to bloom. */
const FLOWER_COLORS: ColorName[] = ['yellow', 'pink', 'blue', 'purple'];
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A flower bumper: closed petals until it is bumped the right way, then it blooms. */
class Flower extends Container {
  bloomed = false;
  /** When it last chimed, so a long touch rings once. */
  lastHit = -1;
  private readonly head = new Container();
  private readonly petals = new Graphics();
  private bump = 0;

  constructor(
    readonly bumper: Bumper,
    readonly color: ColorName,
  ) {
    super();
    this.position.set(bumper.x, bumper.y);
    this.head.addChild(this.petals);
    const center = new Graphics().circle(0, 0, 20).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
    this.head.addChild(center);
    if (bumper.number !== null) {
      const n = label(String(bumper.number), 30, 0xffffff);
      n.style.stroke = { color: swatch.orange.line, width: 6, join: 'round' };
      this.head.addChild(n);
    }
    this.addChild(this.head);
    this.draw();
  }

  private draw() {
    const sw = swatch[this.color];
    const g = this.petals.clear();
    const open = this.bloomed ? 1 : 0.62;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      g.circle(Math.cos(a) * 24 * open, Math.sin(a) * 24 * open, this.bloomed ? 18 : 15).fill(this.bloomed ? sw.fill : sw.light).stroke(line(sw.line, 4));
    }
  }

  bloom() {
    this.bloomed = true;
    this.draw();
  }

  hit() {
    this.bump = 1;
  }

  update(dt: number) {
    this.bump = Math.max(0, this.bump - dt * 4);
    this.head.scale.set(1 + 0.25 * Math.sin(this.bump * Math.PI));
    // The petals turn slowly once open; the number stays upright.
    this.petals.rotation += dt * (this.bloomed ? 0.5 : 0);
  }
}

/** The ladybug ball. */
function ladybug(): Container {
  const c = new Container();
  const r = TABLE.ball;
  const g = new Graphics()
    .circle(0, -r * 0.75, r * 0.55)
    .fill(ink)
    .circle(0, 0, r)
    .fill(swatch.red.fill)
    .stroke(line(swatch.red.line, 3))
    .moveTo(0, -r)
    .lineTo(0, r)
    .stroke(line(ink, 3));
  for (const [x, y] of [[-8, -4], [8, -4], [-7, 8], [7, 8]]) g.circle(x, y, 3.5).fill(ink);
  c.addChild(g);
  return c;
}

class BumperGarden implements Game {
  readonly plan: BumperPlan;
  readonly bumpers: Bumper[];
  readonly flowers: Flower[];
  readonly world: BallWorld;
  ball: Ball;
  /** In the pot waiting to launch, or flying about. */
  state: 'held' | 'flying' = 'held';
  launches = 0;
  misses = 0;
  hints = 0;
  /** Shots in a row that did not help; two bring a hint. */
  wrongs = 0;
  hinting = false;
  finished = false;
  /** Order levels: the number to bump next. */
  next = 1;
  readonly target: ColorName;
  readonly board = new Container();
  readonly flippers: Record<FlipperSide, { node: Graphics; angle: number; upFor: number }>;

  private readonly ballNode = ladybug();
  private readonly glow = new Graphics();
  private readonly input = new Container();
  private readonly sides: Record<FlipperSide, Graphics> = { left: new Graphics(), right: new Graphics() };
  private readonly flipperPegs: number;
  private progressed = false;
  private holdFor = 0;
  private view: View;
  private clock = 0;
  private idle = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.bumpers = makeBumpers(this.plan, ctx.rng);
    const colors = ctx.rng.shuffle([...FLOWER_COLORS]);
    this.target = colors[0];
    this.flowers = this.bumpers.map((b) => ctx.track(new Flower(b, colors[b.color % colors.length])));
    this.world = makeWorld(this.bumpers);
    this.flipperPegs = this.world.pegs.length - 12;
    this.ball = { x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0, r: TABLE.ball };

    // The garden bed, hedges steering down to the flippers, and the pot that catches the ladybug.
    const bed = new Graphics().roundRect(-14, -14, TABLE.w + 28, TABLE.h + 28, 40).fill(swatch.green.line).roundRect(0, 0, TABLE.w, TABLE.h, 30).fill(0xb9e3a0);
    for (let k = 0; k < 18; k++) bed.circle(40 + ((k * 137) % (TABLE.w - 80)), 60 + ((k * 211) % (TABLE.h - 240)), 5).fill({ color: 0xffffff, alpha: 0.4 });
    const hedge = new Graphics();
    puffs(hedge, funnel().filter((_, i) => i % 2 === 0).map((p) => [p.x, p.y + 6, 16] as [number, number, number]), swatch.green.fill, swatch.green.line);
    const pot = new Graphics()
      .moveTo(LAUNCH.x - 48, TABLE.h - 40)
      .lineTo(LAUNCH.x + 48, TABLE.h - 40)
      .lineTo(LAUNCH.x + 36, TABLE.h + 8)
      .lineTo(LAUNCH.x - 36, TABLE.h + 8)
      .closePath()
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line, 5));
    this.flippers = {
      left: { node: this.flipperArt(), angle: FLIPPER.rest, upFor: 0 },
      right: { node: this.flipperArt(), angle: FLIPPER.rest, upFor: 0 },
    };
    this.flippers.left.node.position.set(FLIPPER.x, FLIPPER.y);
    this.flippers.right.node.position.set(TABLE.w - FLIPPER.x, FLIPPER.y);
    this.flippers.right.node.scale.x = -1;
    this.board.addChild(bed, this.glow, hedge, ...this.flowers, this.flippers.left.node, this.flippers.right.node, pot, this.ballNode);
    this.ballNode.position.set(this.ball.x, this.ball.y);

    // Tap anywhere: the left half flips the left flipper, the right half the right one.
    this.input.eventMode = 'static';
    onTap(this.input, (e) => this.press(e.global.x), { cooldown: 60 });
    ctx.stage.addChild(this.sides.left, this.sides.right, this.board, this.input);
  }

  private flipperArt() {
    return new Graphics()
      .moveTo(0, -14)
      .quadraticCurveTo(FLIPPER.length * 0.6, -16, FLIPPER.length + 8, 0)
      .quadraticCurveTo(FLIPPER.length * 0.6, 16, 0, 14)
      .arc(0, 0, 14, Math.PI / 2, (Math.PI * 3) / 2)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 5));
  }

  start() {
    const p = this.plan;
    if (p.mode === 'spring') void this.ctx.instruct('bumper.spring');
    else if (p.mode === 'bloom') void this.ctx.instruct('bumper.bloom');
    else if (p.mode === 'color') void this.ctx.instruct('bumper.color', { color: this.target });
    else void this.ctx.instruct('bumper.order', { n: this.next });
    this.holdFor = p.mode === 'spring' ? Infinity : 2.2;
  }

  resize(v: View) {
    this.view = v;
    const s = Math.min((v.h - 40) / TABLE.h, (v.w - 340) / TABLE.w, 1.15);
    this.board.scale.set(s);
    this.board.position.set((v.w - TABLE.w * s) / 2, 20);
    this.input.hitArea = new Rectangle(0, 0, v.w, v.h);
    for (const side of ['left', 'right'] as FlipperSide[]) {
      const g = this.sides[side].clear();
      g.circle(0, 0, 70).fill({ color: 0xffffff, alpha: 0.5 }).stroke(line(swatch.green.line, 6));
      g.moveTo(side === 'left' ? 22 : -22, -26).lineTo(side === 'left' ? -18 : 18, 0).lineTo(side === 'left' ? 22 : -22, 26).stroke(line(swatch.green.line, 9));
      g.position.set(side === 'left' ? 110 : v.w - 110, v.h * 0.48);
    }
  }

  /** The ladybug in screen space, for checks and hints. */
  ballAt() {
    return this.board.toGlobal({ x: this.ball.x, y: this.ball.y });
  }

  private press(x: number) {
    if (this.finished) return;
    this.idle = 0;
    if (this.state === 'held' && this.plan.mode === 'spring') {
      this.launch();
      return;
    }
    const local = this.board.toLocal({ x, y: 0 });
    const side: FlipperSide = local.x < TABLE.w / 2 ? 'left' : 'right';
    const f = this.flippers[side];
    f.upFor = 0.2;
    sfx.tick();
    this.sides[side].scale.set(0.85);
    void this.ctx.tw.to(this.sides[side].scale, { x: 1, y: 1 }, { duration: 0.2 });
    this.kick(side);
  }

  /** Batting the ladybug: if it is on or just above the flipper, it flies back up. */
  private kick(side: FlipperSide) {
    if (this.state !== 'flying') return;
    const b = this.ball;
    const pts = flipperPoints(side, FLIPPER.rest, 12);
    let best = Infinity;
    let at = 0;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d < best) [best, at] = [d, i / (pts.length - 1)];
    });
    // Young players get a wider reach.
    const reach = b.r + 12 + (this.plan.mode === 'spring' || this.plan.mode === 'bloom' ? 46 : 30);
    if (best > reach || b.vy < -250) return;
    const s = side === 'left' ? 1 : -1;
    b.vx = s * (320 - 420 * at) + this.ctx.rng.range(-40, 40);
    b.vy = -880 - 80 * at;
    sfx.boing();
  }

  private launch() {
    const angle = this.hinting ? this.aim() : this.ctx.rng.range(-LAUNCH.spread, LAUNCH.spread);
    Object.assign(this.ball, { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(angle) });
    this.state = 'flying';
    this.progressed = false;
    this.launches++;
    sfx.whoosh();
  }

  /** A launch aimed at what is wanted now (a hint), or anywhere if no aim works. */
  private aim(): number {
    const a = aimFor(this.world, this.bumpers.length, (i) => this.wanted(i));
    return a ?? this.ctx.rng.range(-LAUNCH.spread, LAUNCH.spread);
  }

  /** Whether bumping this flower is progress right now. */
  wanted(i: number): boolean {
    const f = this.flowers[i];
    if (f.bloomed) return false;
    if (this.plan.mode === 'color') return f.color === this.target;
    if (this.plan.mode === 'order') return f.bumper.number === this.next;
    return true;
  }

  update(dt: number) {
    this.clock += dt;
    // Flippers swing up fast and settle back; their pegs follow.
    let k = this.flipperPegs;
    for (const side of ['left', 'right'] as FlipperSide[]) {
      const f = this.flippers[side];
      f.upFor = Math.max(0, f.upFor - dt);
      const target = f.upFor > 0 ? FLIPPER.up : FLIPPER.rest;
      f.angle += Math.sign(target - f.angle) * Math.min(Math.abs(target - f.angle), dt * (f.upFor > 0 ? 22 : 9));
      // The right flipper is drawn mirrored, so it turns the other way to match.
      f.node.rotation = side === 'left' ? f.angle : -f.angle;
      for (const p of flipperPoints(side, f.angle)) Object.assign(this.world.pegs[k++], p);
    }
    if (this.state === 'flying' && !this.finished) {
      const hits = stepBall(this.ball, this.world, Math.min(dt, 1 / 30));
      for (const i of hits) if (i < this.bumpers.length) this.bumped(i);
      if (this.ball.y + this.ball.r >= CATCH_Y) void this.caught();
    } else if (this.state === 'held' && !this.finished) {
      this.holdFor -= dt;
      this.idle += dt;
      if (this.holdFor <= 0) this.launch();
      if (this.plan.mode === 'spring' && this.idle > 8) {
        this.idle = 0;
        void this.ctx.instruct('bumper.spring');
      }
    }
    this.ballNode.position.set(this.ball.x, this.ball.y);
    this.ballNode.rotation = Math.atan2(this.ball.vy, this.ball.vx) + Math.PI / 2;
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.hinting || this.finished) return;
    const a = 0.5 + 0.35 * Math.sin(this.clock * 6);
    this.flowers.forEach((f, i) => {
      if (this.wanted(i)) g.circle(f.x, f.y, 64).fill({ color: 0xfff3a0, alpha: a });
    });
  }

  private bumped(i: number) {
    const f = this.flowers[i];
    if (this.clock - f.lastHit > 0.2) sfx.bell(stepFromUnit(1 - f.y / TABLE.h, 4, 11), 0.25);
    f.lastHit = this.clock;
    f.hit();
    if (!this.wanted(i) || this.finished) return;
    f.bloom();
    this.progressed = true;
    this.wrongs = 0;
    this.hinting = false;
    const p = this.board.toGlobal({ x: f.x, y: f.y });
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [swatch[f.color].fill, 0xffffff], count: 10, speed: [100, 240], gravity: 0, life: [0.4, 0.8] });
    const mode = this.plan.mode;
    if (mode === 'color') void this.ctx.say('count', { n: this.flowers.filter((o) => o.bloomed).length });
    if (mode === 'order') {
      void this.ctx.say('count', { n: this.next });
      this.next++;
    }
    if (this.done()) void this.finale();
    else if (mode === 'order') void this.ctx.tw.wait(0.9).then(() => {
      if (!this.finished) void this.ctx.instruct('bumper.next', { n: this.next });
    });
  }

  private done(): boolean {
    const p = this.plan;
    if (p.mode === 'spring') return false;
    if (p.mode === 'order') return this.next > p.goal;
    return this.flowers.every((f, i) => f.bloomed || !this.wanted(i));
  }

  /** The pot catches the ladybug and pops it back up. A shot that did not help counts on goal levels. */
  private async caught() {
    this.state = 'held';
    Object.assign(this.ball, { x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0 });
    sfx.squish();
    const mode = this.plan.mode;
    if (mode === 'spring') {
      this.holdFor = Infinity;
      if (this.launches >= this.plan.goal) return this.finale();
      return;
    }
    this.holdFor = 1.2;
    if ((mode === 'color' || mode === 'order') && !this.progressed) {
      this.misses++;
      this.wrongs++;
      if (this.wrongs === 2) {
        this.hints++;
        this.hinting = true;
        void this.ctx.say('bumper.hint');
      } else if (mode === 'color') void this.ctx.say('bumper.again-color', { color: this.target });
      else void this.ctx.say('bumper.again-order', { n: this.next });
    }
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.state = 'held';
    this.flowers.forEach((f, i) => void this.ctx.tw.wait(i * 0.08).then(() => (f.bloom(), f.hit(), sfx.bell(4 + i, 0.2))));
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('bumper.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {}
}

/** A small table for the hub: two flowers, a flipper and the ladybug. */
function tableArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics().roundRect(-90, -200, 180, 200, 26).fill(swatch.green.line).roundRect(-80, -190, 160, 180, 22).fill(0xb9e3a0);
  c.addChild(g);
  const colors = rng.shuffle([...FLOWER_COLORS]);
  for (const [x, y, k] of [[-36, -140, 0], [36, -110, 1]] as const) {
    const sw = swatch[colors[k]];
    const f = new Graphics();
    for (let i = 0; i < 6; i++) f.circle(x + Math.cos((i * Math.PI) / 3) * 16, y + Math.sin((i * Math.PI) / 3) * 16, 12).fill(sw.fill).stroke(line(sw.line, 3));
    f.circle(x, y, 12).fill(swatch.orange.fill);
    c.addChild(f);
  }
  const bug = ladybug();
  bug.position.set(rng.range(-30, 30), -62);
  bug.scale.set(1.1);
  c.addChild(bug);
  c.hitArea = new Circle(0, -100, 100);
  return c;
}

export const bumperGarden: GameModule = {
  id: 'bumper-garden',
  name: 'Bumper Garden',
  titleLine: 'game.bumper-garden',
  region: 'bubble-beach',
  skills: ['cause-effect', 'tracking', 'colors', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Say "flip!" together, and count each flower as it blooms.',
  offScreen: 'Roll a ball down a tilted tray with a few cups as bumpers. Which cup does it hit first?',
  hubIcon: () => new WigglyIcon(tableArt(1)),
  sticker: (seed) => tableArt(seed),
  create: (ctx) => new BumperGarden(ctx),
};

