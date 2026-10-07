import { Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { simulate, stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { idle, type CouchControls } from '../../engine/controller';
import { AIM_LIMIT, aimVelocity, BOARD, makeBoard, planFor, targets, type PegPlan, type PegSpot } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

const PETALS: ColorName[] = ['pink', 'purple', 'blue', 'yellow', 'teal', 'red'];
const SPECIAL: ColorName = 'orange';

/** A sea-garden bud that opens into a flower when the pearl touches it. */
class Bud extends Container {
  readonly art = new Graphics();
  bloomed = false;
  private readonly color: ColorName;

  constructor(
    readonly spot: PegSpot,
    rng: Rng,
  ) {
    super();
    this.color = spot.kind === 'special' ? SPECIAL : rng.pick(PETALS.filter((c) => c !== SPECIAL));
    this.position.set(spot.x, spot.y);
    this.addChild(this.art);
    if (typeof spot.kind === 'number') {
      const n = label(String(spot.kind), 30, ink);
      n.y = 1;
      this.addChild(n);
    }
    this.draw();
  }

  bloom() {
    if (this.bloomed) return false;
    this.bloomed = true;
    this.draw();
    this.scale.set(1.35);
    return true;
  }

  draw() {
    const g = this.art.clear();
    const sw = swatch[this.color];
    const r = BOARD.peg;
    const numbered = typeof this.spot.kind === 'number';
    if (!this.bloomed) {
      // A closed bud: the special ones already show their color.
      const fill = this.spot.kind === 'special' ? sw.light : numbered ? 0xffffff : 0xc8ecb0;
      const line = this.spot.kind === 'special' ? sw.line : numbered ? swatch.blue.line : 0x7cc463;
      g.circle(0, 0, r).fill(fill).stroke({ width: 5, color: line });
      if (!numbered) g.moveTo(0, -r * 0.6).lineTo(0, r * 0.6).stroke({ width: 3, color: line, alpha: 0.6 });
      return;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.circle(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.55);
    }
    g.fill(sw.fill).stroke({ width: 3, color: sw.line });
    g.circle(0, 0, r * 0.55).fill(numbered ? 0xffffff : 0xffe066);
  }

  update(dt: number) {
    const k = Math.min(1, dt * 8);
    this.scale.x += (1 - this.scale.x) * k;
    this.scale.y += (1 - this.scale.y) * k;
  }
}

class PegGarden implements Game {
  readonly plan: PegPlan;
  readonly buds: Bud[];
  readonly targets: number[];
  readonly world: BallWorld;
  ball: Ball | null = null;
  aim = 0;
  shots = 0;
  goal = 0;
  misses = 0;
  hints = 0;
  hinting = false;
  finished = false;

  private readonly sea = new Sprite(gradientTexture(0x8fd3f7, 0x3f8fd0));
  private readonly board = new Container();
  private readonly frame = new Graphics();
  private readonly guide = new Graphics();
  private readonly launcher = new Graphics();
  private readonly pearl = new Graphics();
  private readonly arrow = new Graphics();
  private readonly touch = new Container();
  private aiming: number | null = null;
  private lit: number[] = [];
  private wrongs = 0;
  private clock = 0;
  private ballAge = 0;
  private lastChime = 0;
  // Couch play: the stick sweeps the launcher, the bottom button lets go. `shots` is the face-off score (fewer is better).
  private couchOn = false;
  private botAim: number | null = null;
  private botWait = 1.2;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const spots = makeBoard(this.plan, ctx.rng);
    this.targets = targets(this.plan, ctx.rng);
    this.buds = spots.map((s) => new Bud(s, ctx.rng));
    this.world = { pegs: spots.map((s) => ({ x: s.x, y: s.y, r: BOARD.peg })), left: 0, right: BOARD.w, gravity: 900, bounce: 0.62 };
    this.pearl.circle(0, 0, BOARD.ball).fill(0xfffaf0).stroke({ width: 3, color: 0xd9cbb0 }).circle(-5, -5, 5).fill({ color: 0xffffff, alpha: 0.9 });
    this.pearl.visible = false;
    this.board.addChild(this.frame, this.guide, ...this.buds, this.arrow, this.launcher, this.pearl, this.touch);
    ctx.stage.addChild(this.sea, this.board);
    for (const b of this.buds) ctx.track(b);

    this.touch.eventMode = 'static';
    this.touch.hitArea = new Rectangle(0, 0, BOARD.w, BOARD.h);
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.aiming && this.steerAim(e));
    this.touch.on('pointerup', (e: FederatedPointerEvent) => this.up(e));
    this.touch.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e));
  }

  private get aimed() {
    return this.plan.mode === 'number' || this.plan.mode === 'order';
  }

  get target(): number | undefined {
    return this.targets[this.goal];
  }

  start() {
    switch (this.plan.mode) {
      case 'drop':
        return void this.ctx.instruct('peg.drop');
      case 'bloom':
        return void this.ctx.instruct('peg.bloom');
      case 'color':
        return void this.ctx.instruct('peg.color');
      case 'number':
        return void this.ctx.instruct('peg.number', { n: this.target! });
      case 'order':
        return void this.ctx.instruct('peg.order');
    }
  }

  resize(v: View) {
    this.sea.width = v.w;
    this.sea.height = v.h;
    const s = Math.min(1, (v.h - 60) / (BOARD.h + 30), (v.w - 220) / BOARD.w);
    this.board.scale.set(s);
    this.board.position.set(Math.max(180, (v.w - BOARD.w * s) / 2), (v.h - BOARD.h * s) / 2 + 10);
    const f = this.frame.clear();
    f.roundRect(-14, -14, BOARD.w + 28, BOARD.h + 28, 30).fill({ color: 0xffffff, alpha: 0.18 }).stroke({ width: 8, color: 0xffffff, alpha: 0.6 });
    // Sand and seaweed along the bottom, where pearls roll away.
    f.rect(0, BOARD.h - 30, BOARD.w, 30).fill({ color: 0xf6dfb0, alpha: 0.9 });
    for (let x = 30; x < BOARD.w; x += 90) f.moveTo(x, BOARD.h - 30).quadraticCurveTo(x - 20, BOARD.h - 80, x + 4, BOARD.h - 110).stroke({ width: 8, color: 0x4a9a35, cap: 'round', alpha: 0.7 });
    this.drawLauncher();
  }

  update(dt: number) {
    this.clock += dt;
    this.drawArrow();
    const b = this.ball;
    if (!b) return;
    this.ballAge += dt;
    for (const i of stepBall(b, this.world, dt)) this.touchBud(i);
    this.pearl.position.set(b.x, b.y);
    if (b.y - b.r > BOARD.h || this.ballAge > 10) void this.shotOver();
  }

  destroy() {
    this.touch.removeAllListeners();
  }

  /** Couch play: hold left or right to swing the launcher, press the bottom button to let the pearl go. */
  control(input: CouchControls, dt: number) {
    this.couchOn = true;
    if (!this.aimed || this.finished) return;
    if (this.ball) return;
    const p = input.players.find((q) => q.x || q.action);
    if (p) {
      this.aim = Math.max(-AIM_LIMIT, Math.min(AIM_LIMIT, this.aim + p.x * dt * 1.2));
      if (p.action) {
        this.guide.clear();
        this.fire(this.shotStart());
        return;
      }
    }
    this.drawLauncher();
  }

  /** The "watch me" demo: find an angle whose simulated shot touches the wanted flower, swing to it, and let go. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (!this.aimed || this.ball || this.finished || this.botWait > 0) return out;
    if (this.botAim === null) this.botAim = this.bestAim();
    const gap = this.botAim - this.aim;
    if (Math.abs(gap) > 0.015) out.players[0].x = Math.max(-1, Math.min(1, gap / (Math.max(dt, 1e-3) * 1.2)));
    else {
      out.players[0].action = true;
      this.botAim = null;
      this.botWait = 1.4;
    }
    return out;
  }

  /** An angle near the current one whose shot (and its neighbors) touches the wanted flower; straight down if none does. */
  private bestAim(): number {
    const want = this.buds.findIndex((b) => b.spot.kind === this.target);
    const hits = (a: number) => simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, this.world, BOARD.h, 12, 1 / 30).hits.includes(want);
    let best: number | null = null;
    for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.02) {
      if (!hits(a) || !hits(a - 0.012) || !hits(a + 0.012)) continue;
      if (best === null || Math.abs(a - this.aim) < Math.abs(best - this.aim)) best = a;
    }
    return best ?? 0;
  }

  // Shooting ----------------------------------------------------------------------------

  private local(e: FederatedPointerEvent) {
    return this.board.toLocal(e.global);
  }

  private down(e: FederatedPointerEvent) {
    if (this.ball || this.finished || palmOnGlass()) return;
    const p = this.local(e);
    if (!this.aimed) {
      this.fire({ x: Math.max(BOARD.ball, Math.min(BOARD.w - BOARD.ball, p.x)), y: 40, vx: this.ctx.rng.range(-20, 20), vy: 60, r: BOARD.ball });
      return;
    }
    this.aiming = e.pointerId;
    this.steerAim(e);
  }

  private steerAim(e: FederatedPointerEvent) {
    const p = this.local(e);
    const dx = p.x - BOARD.w / 2;
    const dy = Math.max(10, p.y - 40);
    this.aim = Math.max(-AIM_LIMIT, Math.min(AIM_LIMIT, Math.atan2(dx, dy)));
    this.drawLauncher();
  }

  private up(e: FederatedPointerEvent) {
    if (e.pointerId !== this.aiming) return;
    this.aiming = null;
    this.guide.clear();
    if (!this.ball && !this.finished) this.fire(this.shotStart());
  }

  private shotStart(): Ball {
    return { x: BOARD.w / 2, y: 40, ...aimVelocity(this.aim), r: BOARD.ball };
  }

  fire(b: Ball) {
    this.ball = b;
    this.ballAge = 0;
    this.lit = [];
    this.pearl.visible = true;
    this.pearl.position.set(b.x, b.y);
    sfx.pop(9);
  }

  private touchBud(i: number) {
    const bud = this.buds[i];
    if (!this.lit.includes(i)) this.lit.push(i);
    const fresh = bud.bloom();
    if (fresh || this.clock - this.lastChime > 0.08) {
      this.lastChime = this.clock;
      // Higher on the board, higher the note.
      sfx.bell(4 + Math.round((1 - bud.y / BOARD.h) * 7), fresh ? 0.3 : 0.12);
    }
    if (!fresh) return;
    const g = this.board.toGlobal(bud.position);
    const p = this.ctx.stage.toLocal(g);
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 6, speed: [60, 160], gravity: 0, size: [0.3, 0.45], life: [0.4, 0.7] });
    if (bud.spot.kind === 'special') void this.ctx.say('count', { n: this.buds.filter((x) => x.spot.kind === 'special' && x.bloomed).length });
  }

  /** The pearl rolled away: see what this shot did. */
  private async shotOver() {
    if (!this.ball) return;
    this.ball = null;
    this.pearl.visible = false;
    this.shots++;
    const lit = this.lit.map((i) => this.buds[i]);
    switch (this.plan.mode) {
      case 'drop':
        if (this.shots >= this.plan.count) return void this.finale();
        return;
      case 'bloom':
        if (this.buds.every((b) => b.bloomed)) return void this.finale();
        return;
      case 'color': {
        const specials = this.buds.filter((b) => b.spot.kind === 'special');
        if (specials.every((b) => b.bloomed)) return void this.finale();
        if (lit.some((b) => b.spot.kind === 'special')) {
          this.wrongs = 0;
          return;
        }
        this.miss('peg.miss');
        return;
      }
      default: {
        const t = this.target!;
        if (lit.some((b) => b.spot.kind === t)) {
          this.wrongs = 0;
          this.hinting = false;
          this.goal++;
          sfx.sparkle();
          this.ctx.pet.cheer();
          await this.ctx.say('praise');
          if (this.target === undefined) return void this.finale();
          await this.ctx.instruct('peg.next', { n: this.target });
          return;
        }
        this.miss('peg.missed', { n: t });
      }
    }
  }

  private miss(line: 'peg.miss' | 'peg.missed', vars?: { n: number }) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      this.wrongs = 0;
    }
  }

  // Drawing ------------------------------------------------------------------------------

  private drawLauncher() {
    const g = this.launcher.clear();
    if (!this.aimed) {
      // A sandy ledge along the top: tap anywhere to drop.
      g.roundRect(0, 0, BOARD.w, 70, 20).fill({ color: 0xffffff, alpha: 0.25 });
      return;
    }
    const x = BOARD.w / 2;
    g.circle(x, 40, 34).fill(swatch.pink.light).stroke({ width: 5, color: swatch.pink.line });
    const dx = Math.sin(this.aim);
    const dy = Math.cos(this.aim);
    g.moveTo(x, 40).lineTo(x + dx * 66, 40 + dy * 66).stroke({ width: 24, color: swatch.pink.line, cap: 'round' });
    g.moveTo(x, 40).lineTo(x + dx * 62, 40 + dy * 62).stroke({ width: 14, color: swatch.pink.fill, cap: 'round' });
    if (this.aiming !== null || this.couchOn) this.drawGuide();
  }

  /** While aiming: a short dotted guide, or the whole path once a hint is on. */
  private drawGuide() {
    const g = this.guide.clear();
    const { path } = simulate(this.shotStart(), this.world, BOARD.h, this.hinting ? 6 : 0.35, 1 / 30);
    for (let i = 1; i < path.length; i += 2) g.circle(path[i].x, path[i].y, 5).fill({ color: 0xffffff, alpha: 0.9 });
  }

  /** Color levels with a hint: a bobbing arrow over a bud still waiting to bloom. */
  private drawArrow() {
    const g = this.arrow.clear();
    if (!this.hinting) return;
    let bud: Bud | undefined;
    if (this.plan.mode === 'color') bud = this.buds.find((b) => b.spot.kind === 'special' && !b.bloomed);
    else if (this.target !== undefined) bud = this.buds.find((b) => b.spot.kind === this.target);
    if (!bud) return;
    const y = bud.y - 44 - 8 * Math.abs(Math.sin(this.clock * 4));
    g.poly([bud.x - 16, y - 20, bud.x + 16, y - 20, bud.x, y]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    for (const b of this.buds) b.bloom();
    const c = this.ctx.stage.toLocal(this.board.toGlobal({ x: BOARD.w / 2, y: BOARD.h / 2 }));
    this.ctx.particles.burst(c.x, c.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 30, speed: [150, 400], gravity: 0, life: [0.8, 1.3] });
    await this.ctx.say('peg.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.shots });
  }
}

class PegIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const rng = new Rng(5);
    const frame = new Graphics().roundRect(-110, -230, 220, 220, 26).fill({ color: 0x7cc4f2, alpha: 0.9 }).stroke({ width: 6, color: 0xffffff });
    c.addChild(frame);
    [[-60, -180], [0, -180], [60, -180], [-30, -120], [30, -120], [-60, -60], [0, -60], [60, -60]].forEach(([x, y], i) => {
      const b = new Bud({ x, y, kind: i % 3 === 0 ? 'special' : 'plain' }, rng);
      if (i % 2 === 0) b.bloom();
      b.scale.set(0.9);
      c.addChild(b);
    });
    const pearl = new Graphics().circle(-12, -150, 13).fill(0xfffaf0).stroke({ width: 3, color: 0xd9cbb0 });
    c.addChild(pearl);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  for (let i = 0; i < 4; i++) {
    const b = new Bud({ x: (i - 1.5) * 50, y: (i % 2) * 40 - 20, kind: 'plain' }, rng);
    b.bloom();
    b.scale.set(1.4);
    c.addChild(b);
  }
  c.addChild(new Graphics().circle(0, 40, 18).fill(0xfffaf0).stroke({ width: 3, color: 0xd9cbb0 }));
  return c;
}

export const pegGarden: GameModule = {
  id: 'peg-garden',
  name: 'Peg Garden',
  titleLine: 'game.peg-garden',
  region: 'bubble-beach',
  skills: ['cause-and-effect', 'tracking', 'counting', 'aiming'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Guess together where the pearl will land before {name} lets go.',
  offScreen: 'Roll a marble down a tilted tray with toy blocks as bumpers.',
  hubIcon: () => new PegIcon(),
  sticker,
  create: (ctx) => new PegGarden(ctx),
};
