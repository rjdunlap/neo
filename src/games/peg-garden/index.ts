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
import type { Game, GameContext, GameModule, Spot, TouchIntent } from '../types';
import { idle, type CouchControls } from '../../engine/controller';
import { AIM_LIMIT, aimAt, aimInto, aimVelocity, blooms, BOARD, CUP_TOP, CUP_W, cupAt, cupCentre, CUPS, CUTOFF, driftOf, dropAt, guided, ledgeX, makeBoard, makeCupRound, pickTheme, planFor, SAMPLE, targets, TRAY, traySlot, worldOf, type Backdrop, type BoardShape, type PegPlan, type PegSpot } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { ease } from '../../engine/tween';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 8, order: [8, 1] },
  toddler: { min: 1, max: 8, order: [8, 1, 2] },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
};

const PETALS: ColorName[] = ['pink', 'purple', 'blue', 'yellow', 'teal', 'red'];
const SPECIAL: ColorName = 'orange';
/** Into the cup's cups, left to right (never orange). */
const CUP_COLORS: ColorName[] = ['teal', 'purple', 'blue', 'pink'];

/** Each backdrop's sea (top and bottom of its gradient), its sand and what grows from the sand. */
const SEAS: Record<Backdrop, { sea: [number, number]; sand: number }> = {
  shallows: { sea: [0x8fd3f7, 0x3f8fd0], sand: 0xf6dfb0 },
  reef: { sea: [0xa8e6e2, 0x3a9fb4], sand: 0xfbe6cc },
  kelp: { sea: [0x9adbbf, 0x2f7a72], sand: 0xe8d6a6 },
};

/** A sea-garden bud that opens into a flower when the pearl touches it. */
class Bud extends Container {
  readonly art = new Graphics();
  bloomed = false;
  /** How hard the bud is wiggling: a numbered bud that was not asked for shakes instead of opening. */
  private wiggle = 0;
  private age = 0;
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

  shake() {
    this.wiggle = 1;
  }

  draw() {
    const g = this.art.clear();
    const sw = swatch[this.color];
    const r = this.spot.r ?? BOARD.peg;
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
    this.age += dt;
    this.wiggle = Math.max(0, this.wiggle - dt * 1.6);
    this.rotation = Math.sin(this.age * 28) * 0.3 * this.wiggle;
  }
}

/** A dropped pearl's fixed physics step: the ball engine's substep, so a drop in play is the simulated drop. */
const STEP = 1 / 240;

/** Where along the ledge each drop is made on the first level, as a fraction of the board: all over, not one place. */
const DROP_AT = [0.5, 0.2, 0.8, 0.35, 0.65, 0.1];

class PegGarden implements Game {
  readonly plan: PegPlan;
  readonly buds: Bud[];
  readonly targets: number[];
  readonly world: BallWorld;
  /** Into the cup: the dots on each cup, left to right, and where every aim across the swing lands. */
  readonly dots: number[] = [];
  readonly table: { angle: number; cup: number | null }[] = [];
  ball: Ball | null = null;
  aim = 0;
  shots = 0;
  goal = 0;
  misses = 0;
  hints = 0;
  hinting = false;
  finished = false;
  /** The round's look: a board shape and a backdrop from a seeded pool. */
  readonly theme: { shape: BoardShape; backdrop: Backdrop };

  private readonly sea: Sprite;
  private readonly board = new Container();
  private readonly frame = new Graphics();
  /** The last aimed shot's path, left as faint dots until the next shot starts. */
  private readonly trail = new Graphics();
  private path: { x: number; y: number }[] = [];
  private readonly guide = new Graphics();
  /** The shell tray along the sand, and the finished pearls in it. */
  private readonly tray = new Graphics();
  private readonly trayPearls = new Container();
  private collected = 0;
  /** Into the cup: pearls already resting in each cup, and the cup shot's samples and last position (to draw it between samples). */
  private inCup = [0, 0, 0, 0];
  private samples = 0;
  private prev = { x: 0, y: 0 };
  private readonly launcher = new Graphics();
  private readonly pearl = new Graphics();
  private readonly arrow = new Graphics();
  private readonly touch = new Container();
  private aiming: number | null = null;
  private lit: number[] = [];
  private wrongs = 0;
  private clock = 0;
  private ballAge = 0;
  private stepLeft = 0;
  /** Pearls in a row that woke no new wanted flower on the bloom and colour levels. */
  private stalled = 0;
  private freshThisShot = 0;
  private freshSpecial = 0;
  /** Whether the pearl in play was let go over a waiting flower rather than where she tapped. */
  private guidedShot = false;
  /** The first level's next pearl, tapped while one was still falling (at most one waits). */
  private queued: number | null = null;
  /** The colour level's hint: the place on the ledge whose pearl reaches a waiting orange flower. */
  private hintX: number | null = null;
  private lastChime = 0;
  // Couch play: the stick sweeps the launcher, the bottom button lets go. `shots` is the face-off score (fewer is better).
  private couchOn = false;
  private botAim: number | null = null;
  private botWait = 1.2;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    // Couch play keeps the first look, so a course's boards stay as they were.
    this.theme = pickTheme(ctx.couch ? null : ctx.rng);
    const look = SEAS[this.theme.backdrop];
    this.sea = new Sprite(gradientTexture(look.sea[0], look.sea[1]));
    let spots: PegSpot[];
    if (this.plan.mode === 'cup') {
      const round = makeCupRound(this.plan, ctx.rng, this.theme.shape);
      ({ spots, dots: this.dots, table: this.table } = round);
      this.targets = round.asks;
    } else {
      spots = makeBoard(this.plan, ctx.rng, this.theme.shape);
      this.targets = targets(this.plan, ctx.rng);
    }
    this.buds = spots.map((s) => new Bud(s, ctx.rng));
    this.world = worldOf(spots);
    this.pearl.circle(0, 0, BOARD.ball).fill(0xfffaf0).stroke({ width: 3, color: 0xd9cbb0 }).circle(-5, -5, 5).fill({ color: 0xffffff, alpha: 0.9 });
    this.pearl.visible = false;
    this.drawTray();
    // Into the cup's pearls rest in the cups instead of the tray.
    this.tray.visible = this.plan.mode !== 'cup';
    for (const g of [this.trail, this.tray, this.trayPearls]) g.eventMode = 'none';
    this.board.addChild(this.frame, this.trail, this.guide, ...this.buds, this.tray, this.trayPearls, this.arrow, this.launcher, this.pearl, this.touch);
    ctx.stage.addChild(this.sea, this.board);
    for (const b of this.buds) ctx.track(b);

    this.touch.eventMode = 'static';
    this.touch.hitArea = new Rectangle(0, 0, BOARD.w, BOARD.h);
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.aiming && this.steerAim(e));
    this.touch.on('pointerup', (e: FederatedPointerEvent) => this.up(e));
    this.touch.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e));
    // Pixi does not pass a cancelled touch on, so the window is watched for it.
    window.addEventListener('pointercancel', this.cancel, { capture: true });
  }

  private get aimed() {
    return this.plan.mode === 'number' || this.plan.mode === 'order' || this.plan.mode === 'cup';
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
      case 'big':
        return void this.ctx.instruct('peg.big');
      case 'color':
        return void this.ctx.instruct('peg.color');
      case 'number':
        return void this.ctx.instruct('peg.number', { n: this.target! });
      case 'order':
        return void this.ctx.instruct('peg.order');
      case 'cup':
        return void this.ctx.instruct('peg.cup', { n: this.target! });
    }
  }

  resize(v: View) {
    this.sea.width = v.w;
    this.sea.height = v.h;
    const s = Math.min(1, (v.h - 60) / (BOARD.h + 30), (v.w - 220) / BOARD.w);
    this.board.scale.set(s);
    this.board.position.set(Math.max(180, (v.w - BOARD.w * s) / 2), (v.h - BOARD.h * s) / 2 + 10);
    // The whole screen takes touches, the sea beside the board too (couch play takes none).
    if (!this.ctx.couch) this.touch.hitArea = new Rectangle(-this.board.x / s, -this.board.y / s, v.w / s, v.h / s);
    const f = this.frame.clear();
    f.roundRect(-14, -14, BOARD.w + 28, BOARD.h + 28, 30).fill({ color: 0xffffff, alpha: 0.18 }).stroke({ width: 8, color: 0xffffff, alpha: 0.6 });
    this.drawSeabed(f);
    this.drawLauncher();
  }

  update(dt: number) {
    this.clock += dt;
    this.drawArrow();
    const b = this.ball;
    if (!b) return;
    this.ballAge += dt;
    if (this.plan.mode === 'cup') {
      // An aimed cup shot takes the rules' own samples, so it lands exactly where the landing table says; it is drawn between them.
      this.stepLeft = Math.min(this.stepLeft + dt, 0.25);
      for (; this.stepLeft >= SAMPLE && b.y - b.r < BOARD.h && this.samples < CUTOFF / SAMPLE; this.stepLeft -= SAMPLE) {
        this.prev = { x: b.x, y: b.y };
        for (const i of stepBall(b, this.world, SAMPLE)) this.touchBud(i);
        this.samples++;
        this.path.push({ x: b.x, y: b.y });
      }
      const k = Math.min(1, this.stepLeft / SAMPLE);
      this.pearl.position.set(this.prev.x + (b.x - this.prev.x) * k, this.prev.y + (b.y - this.prev.y) * k);
      if (b.y - b.r >= BOARD.h || this.samples >= CUTOFF / SAMPLE) void this.shotOver();
      return;
    }
    if (this.aimed) {
      for (const i of stepBall(b, this.world, dt)) this.touchBud(i);
      // Where the pearl actually went, for the faint trail it leaves.
      const last = this.path.at(-1);
      if (!last || Math.hypot(b.x - last.x, b.y - last.y) >= 18) this.path.push({ x: b.x, y: b.y });
    } else {
      // A dropped pearl takes fixed steps, as the rules' simulation does, so it goes exactly where the hint, the stall guard
      // and the ghost finger expect whatever the frame rate; a long frame slows it rather than changing its path.
      this.stepLeft = Math.min(this.stepLeft + dt, 0.25);
      for (; this.stepLeft >= STEP; this.stepLeft -= STEP) for (const i of stepBall(b, this.world, STEP)) this.touchBud(i);
    }
    this.pearl.position.set(b.x, b.y);
    if (b.y - b.r > BOARD.h || this.ballAge > 10) void this.shotOver();
  }

  destroy() {
    this.touch.removeAllListeners();
    this.sea.texture.destroy(true);
    window.removeEventListener('pointercancel', this.cancel, { capture: true });
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

  /** Into the cup: the cup with the asked dots, left to right. */
  private get askedCup() {
    return this.target === undefined ? -1 : this.dots.indexOf(this.target);
  }

  /** An angle near the current one whose shot (and its neighbors) touches the wanted flower; straight down if none does. */
  private bestAim(): number {
    return aimAt(this.world, this.buds.findIndex((b) => b.spot.kind === this.target), this.aim, [0.012]) ?? 0;
  }

  /**
   * The ghost finger on the how-to card: tap along the ledge to drop a pearl (on the bloom and color levels, over the place
   * whose pearl touches the buds still waiting), or, on the aiming levels, put a finger down by the launcher, swing it round
   * to the angle whose shot reaches the wanted flower, and lift.
   */
  autotouch(): TouchIntent | null {
    if (this.ball || this.finished) return null;
    const mode = this.plan.mode;
    if (this.aimed) {
      // After the last wanted flower the round is only waiting for the praise to end.
      if (this.target === undefined) return null;
      const finger = (a: number): Spot => ({ on: this.touch, x: BOARD.w / 2 + Math.sin(a) * 200, y: 40 + Math.cos(a) * 200 });
      const to = mode === 'cup' ? aimInto(this.world, this.table, this.askedCup) : aimAt(this.world, this.buds.findIndex((b) => b.spot.kind === this.target), this.aim);
      return { trace: finger(this.aim), via: [finger(to ?? 0)] };
    }
    if (mode === 'drop') return { tap: { on: this.touch, x: BOARD.w * DROP_AT[this.shots % DROP_AT.length], y: 40 } };
    // The pearl drifts a little as it is let go; the bot looks at the draw the game is about to make.
    const spread = driftOf(mode);
    const drift = spread ? this.ctx.rng.clone().range(-spread, spread) : 0;
    const { x } = dropAt(this.world, (i) => !this.buds[i].bloomed && (mode !== 'color' || this.buds[i].spot.kind === 'special'), drift, mode === 'color');
    return { tap: { on: this.touch, x, y: 40 } };
  }

  // Shooting ----------------------------------------------------------------------------

  private local(e: FederatedPointerEvent) {
    return this.board.toLocal(e.global);
  }

  private down(e: FederatedPointerEvent) {
    if (this.finished || palmOnGlass()) return;
    const p = this.local(e);
    if (!this.aimed) {
      this.bubbles(e);
      if (this.ball) {
        // A touch while a pearl falls still answers; on the first level it is the next pearl, so a lap child's tap is never lost.
        if (this.plan.mode === 'drop' && this.queued === null && this.shots + 2 <= this.plan.count) this.queued = ledgeX(p.x);
        else sfx.pop(2);
        return;
      }
      this.drop(p.x);
      return;
    }
    if (this.ball) return;
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

  /**
   * Let a pearl go above `x`. Tapping one spot again and again must still finish: after two pearls that woke nothing wanted,
   * or while the colour level's hint is on, it is let go over a waiting flower instead.
   */
  private drop(x: number) {
    const mode = this.plan.mode;
    const spread = driftOf(mode);
    this.guidedShot = guided(mode, this.stalled, this.hinting);
    if (this.guidedShot) x = mode === 'color' && this.hintX !== null ? this.hintX : dropAt(this.world, (i) => this.wanted(i), spread ? this.ctx.rng.clone().range(-spread, spread) : 0, mode === 'color').x;
    this.fire({ x: ledgeX(x), y: 40, vx: spread ? this.ctx.rng.range(-spread, spread) : 0, vy: 60, r: BOARD.ball });
  }

  private wanted(i: number) {
    return !this.buds[i].bloomed && (this.plan.mode !== 'color' || this.buds[i].spot.kind === 'special');
  }

  /** A ring of bubbles rises where a finger lands on a dropping level. */
  private bubbles(e: FederatedPointerEvent) {
    const p = this.ctx.stage.toLocal(e.global);
    this.ctx.particles.burst(p.x, p.y, { kind: 'ring', colors: [0xffffff, 0xd8f3ff], count: 7, speed: [40, 110], gravity: -120, size: [0.25, 0.5], life: [0.5, 0.9] });
  }

  /** A cancelled aim (a system gesture, a palm) lets nothing go. */
  private readonly cancel = (e: PointerEvent) => {
    if (e.pointerId !== this.aiming) return;
    this.aiming = null;
    this.guide.clear();
    this.drawLauncher();
  };

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
    this.path = [];
    this.trail.clear();
    this.ballAge = 0;
    this.stepLeft = 0;
    this.samples = 0;
    this.prev = { x: b.x, y: b.y };
    this.lit = [];
    this.freshThisShot = 0;
    this.freshSpecial = 0;
    this.pearl.visible = true;
    this.pearl.position.set(b.x, b.y);
    sfx.pop(9);
  }

  private touchBud(i: number) {
    const bud = this.buds[i];
    if (!this.lit.includes(i)) this.lit.push(i);
    // A numbered bud that was not asked for only chimes and wiggles, so open flowers show what is done.
    const opens = blooms(bud.spot.kind, this.plan.mode, this.target);
    if (!opens && !bud.bloomed) bud.shake();
    const fresh = opens && bud.bloom();
    if (fresh || this.clock - this.lastChime > 0.08) {
      this.lastChime = this.clock;
      // Higher on the board, higher the note.
      sfx.bell(4 + Math.round((1 - bud.y / BOARD.h) * 7), fresh ? 0.3 : 0.12);
    }
    if (!fresh) return;
    this.freshThisShot++;
    if (bud.spot.kind === 'special') this.freshSpecial++;
    const g = this.board.toGlobal(bud.position);
    const p = this.ctx.stage.toLocal(g);
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 6, speed: [60, 160], gravity: 0, size: [0.3, 0.45], life: [0.4, 0.7] });
    if (bud.spot.kind === 'special') void this.ctx.say('count', { n: this.buds.filter((x) => x.spot.kind === 'special' && x.bloomed).length });
  }

  /** The pearl rolled away: see what this shot did. */
  private async shotOver() {
    if (!this.ball) return;
    const exit = this.ball.x;
    const out = this.ball.y - this.ball.r >= BOARD.h;
    this.ball = null;
    this.pearl.visible = false;
    this.shots++;
    if (this.plan.mode !== 'cup') this.collect(exit);
    else if (out) this.rest(cupAt(exit));
    if (this.aimed) this.drawTrail();
    const lit = this.lit.map((i) => this.buds[i]);
    switch (this.plan.mode) {
      case 'drop': {
        if (this.shots >= this.plan.count) return void this.finale();
        const next = this.queued;
        this.queued = null;
        if (next !== null) this.drop(next);
        return;
      }
      case 'bloom':
      case 'big':
        if (this.buds.every((b) => b.bloomed)) return void this.finale();
        this.stalled = this.freshThisShot > 0 ? 0 : this.stalled + 1;
        return;
      case 'color': {
        const specials = this.buds.filter((b) => b.spot.kind === 'special');
        if (specials.every((b) => b.bloomed)) return void this.finale();
        this.stalled = this.freshSpecial > 0 ? 0 : this.stalled + 1;
        if (this.freshSpecial > 0) this.hinting = false;
        if (lit.some((b) => b.spot.kind === 'special')) this.wrongs = 0;
        // A pearl let go over a waiting flower for her is not her choice of spot, so it is never a miss.
        else if (!this.guidedShot) this.miss('peg.miss');
        this.hintX = this.hinting ? dropAt(this.world, (i) => this.wanted(i), 0, true).x : null;
        return;
      }
      case 'cup': {
        const t = this.target!;
        // A pearl still on the board at the cutoff landed in no cup, so it counts nothing; the ask is said again.
        if (!out) return void this.ctx.instruct('peg.cup', { n: t });
        const got = this.dots[cupAt(exit)];
        if (got === t) return void this.hit('peg.cupNext');
        this.miss('peg.cupMissed', { got, n: t });
        return;
      }
      default: {
        const t = this.target!;
        if (lit.some((b) => b.spot.kind === t)) {
          return void this.hit('peg.next');
        }
        this.miss('peg.missed', { n: t });
      }
    }
  }

  /** The asked flower or cup was reached: praise, then the next ask or the finish. */
  private async hit(next: 'peg.next' | 'peg.cupNext') {
    this.wrongs = 0;
    this.hinting = false;
    this.goal++;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('praise');
    if (this.target === undefined) return void this.finale();
    await this.ctx.instruct(next, { n: this.target });
  }

  private miss(line: 'peg.miss' | 'peg.missed' | 'peg.cupMissed', vars?: { n: number; got?: number }) {
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

  /** The sand along the bottom, where pearls roll away, and what grows there: seaweed, coral or kelp. */
  private drawSeabed(f: Graphics) {
    const { backdrop } = this.theme;
    const sandTop = BOARD.h - 30;
    f.rect(0, sandTop, BOARD.w, 30).fill({ color: SEAS[backdrop].sand, alpha: 0.9 });
    if (backdrop === 'shallows') {
      for (let x = 30; x < BOARD.w; x += 90) f.moveTo(x, sandTop).quadraticCurveTo(x - 20, BOARD.h - 80, x + 4, BOARD.h - 110).stroke({ width: 8, color: 0x4a9a35, cap: 'round', alpha: 0.7 });
    } else if (backdrop === 'reef') {
      // Branching coral in pink and purple (never orange, the colour level's flowers).
      [40, 150, 530, 640].forEach((x, i) => {
        const color = i % 2 ? swatch.purple.fill : swatch.pink.fill;
        const line = { width: 10, color, cap: 'round' as const, alpha: 0.8 };
        f.moveTo(x, sandTop).lineTo(x, sandTop - 55).stroke(line);
        f.moveTo(x, sandTop - 25).lineTo(x - 22, sandTop - 50).stroke(line);
        f.moveTo(x, sandTop - 35).lineTo(x + 20, sandTop - 62).stroke(line);
        f.circle(x, sandTop - 58, 7).circle(x - 24, sandTop - 53, 6).circle(x + 22, sandTop - 65, 6).fill({ color, alpha: 0.9 });
      });
    } else {
      // Tall kelp ribbons with leaves, up the sides of the board.
      for (const x of [22, 70, BOARD.w - 70, BOARD.w - 22]) {
        f.moveTo(x, sandTop).bezierCurveTo(x + 18, sandTop - 120, x - 18, sandTop - 220, x + 6, sandTop - 320).stroke({ width: 9, color: 0x5e8f2e, cap: 'round', alpha: 0.75 });
        for (let k = 1; k <= 4; k++) f.ellipse(x + (k % 2 ? 12 : -12), sandTop - k * 70, 14, 7).fill({ color: 0x7fb23a, alpha: 0.75 });
      }
    }
    if (this.plan.mode === 'cup') this.drawCups(f);
  }

  /** Into the cup: four cups side by side along the sand, each showing its count as dots. */
  private drawCups(f: Graphics) {
    for (let i = 0; i < CUPS; i++) {
      const sw = swatch[CUP_COLORS[i]];
      const x = i * CUP_W + 10;
      f.roundRect(x, CUP_TOP, CUP_W - 20, 54, 18).fill(sw.light).stroke({ width: 5, color: sw.line });
      const n = this.dots[i];
      for (let d = 0; d < n; d++) f.circle(cupCentre(i) + (d - (n - 1) / 2) * 26, BOARD.h - 28, 9).fill(0xffffff).stroke({ width: 3, color: ink });
    }
  }

  /** A scalloped shell tray in the sand: finished pearls collect in it. */
  private drawTray() {
    const w = TRAY.slots * TRAY.gap + 16;
    const x = BOARD.w / 2 - w / 2;
    const g = this.tray.clear();
    g.roundRect(x, TRAY.y - 14, w, 26, 13).fill({ color: swatch.pink.light, alpha: 0.95 }).stroke({ width: 4, color: swatch.pink.line });
    for (let i = 1; i < TRAY.slots; i++) {
      const sx = x + 8 + i * TRAY.gap;
      g.moveTo(sx, TRAY.y - 10).lineTo(sx, TRAY.y + 8).stroke({ width: 2, color: swatch.pink.line, alpha: 0.4 });
    }
  }

  /** A pearl that has rolled away rolls into the tray. */
  private collect(x: number) {
    if (this.collected >= TRAY.slots) {
      this.collected++;
      return;
    }
    const slot = traySlot(this.collected++);
    const p = new Graphics().circle(0, 0, 10).fill(0xfffaf0).stroke({ width: 2, color: 0xd9cbb0 }).circle(-3, -3, 3).fill({ color: 0xffffff, alpha: 0.9 });
    p.position.set(Math.max(10, Math.min(BOARD.w - 10, x)), TRAY.y - 30);
    this.trayPearls.addChild(p);
    void this.ctx.tw.to(p, { x: slot.x, y: slot.y }, { duration: 0.45, ease: ease.outBack });
  }

  /** Into the cup: a pearl that rolled out rests in the cup it fell into. */
  private rest(cup: number) {
    const k = this.inCup[cup]++;
    const p = new Graphics().circle(0, 0, 10).fill(0xfffaf0).stroke({ width: 2, color: 0xd9cbb0 }).circle(-3, -3, 3).fill({ color: 0xffffff, alpha: 0.9 });
    p.position.set(cupCentre(cup), BOARD.h - 70);
    this.trayPearls.addChild(p);
    void this.ctx.tw.to(p, { x: cupCentre(cup) + ((k % 5) - 2) * 22, y: BOARD.h - 58 }, { duration: 0.35, ease: ease.outBack });
  }

  /** At the finish the tray pours its pearls back up to the top. */
  private pour() {
    this.trayPearls.children.forEach((p, i) => {
      void this.ctx.tw.to(p, { x: BOARD.w / 2, y: 40, alpha: 0 }, { duration: 0.5, delay: i * 0.06, ease: ease.inQuad });
    });
    if (this.trayPearls.children.length) sfx.pop(5);
  }

  /** The last aimed shot's path as faint dots (feedback for every shot, not a hint). */
  private drawTrail() {
    const g = this.trail.clear();
    for (const p of this.path) g.circle(p.x, p.y, 4).fill({ color: 0xffffff, alpha: 0.35 });
  }

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
    if (this.plan.mode === 'cup') {
      // The asked cup glows, with the arrow over it; the launcher's guide already shows the whole path.
      const c = this.askedCup;
      if (c < 0) return;
      const pulse = 0.35 + 0.15 * Math.sin(this.clock * 5);
      g.roundRect(c * CUP_W + 2, BOARD.h - 64, CUP_W - 4, 64, 20).fill({ color: swatch.yellow.light, alpha: pulse }).stroke({ width: 6, color: swatch.yellow.line });
      const x = cupCentre(c);
      const y = BOARD.h - 78 - 8 * Math.abs(Math.sin(this.clock * 4));
      g.poly([x - 16, y - 20, x + 16, y - 20, x, y]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
      return;
    }
    let bud: Bud | undefined;
    if (this.plan.mode === 'color') bud = this.buds.find((b) => b.spot.kind === 'special' && !b.bloomed);
    else if (this.target !== undefined) bud = this.buds.find((b) => b.spot.kind === this.target);
    if (!bud) return;
    if (this.hintX !== null) {
      // Where to act: a glowing ring on the ledge over the place whose pearl reaches the waiting flower.
      const pulse = 1 + 0.08 * Math.sin(this.clock * 5);
      g.circle(this.hintX, 40, 30 * pulse).fill({ color: swatch.yellow.light, alpha: 0.45 }).stroke({ width: 6, color: swatch.yellow.line });
    }
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
    this.pour();
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
  liveController: true,
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
  touchDemo: true,
  entryLevels: [8],
  sticker,
  create: (ctx) => new PegGarden(ctx),
};
