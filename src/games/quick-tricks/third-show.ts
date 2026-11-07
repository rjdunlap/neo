import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, RAINBOW, shadow, swatch, wood, type ColorName } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { demoLoop, nearestGroup, type Point } from '../lasso-loops/logic';
import { emptyCup, pour, pourAmount, POUR_DISTANCE, recoverTray } from '../fill-dump/logic';
import type { Game, GameContext, TouchIntent } from '../types';
import { PICNIC_FRIENDS } from './second-logic';
import {
  CRANK_ARM,
  CRANK_DEAD,
  CRANK_RING,
  atLine,
  crankCircle,
  crankLift,
  crankStep,
  cupTarget,
  halfTurns,
  judgeLoop,
  meadow,
  MEADOW,
  pourNeeded,
  releaseCup,
  startCrank,
  startCups,
  thirdAmounts,
  thirdBand,
  type CrankState,
  type CupsState,
} from './third-logic';

const stroke = (color: number = ink, width = 6) => ({ color, width, join: 'round' as const, cap: 'round' as const });
const CUP_COLORS: ColorName[] = ['pink', 'green', 'orange'];
/** The music box's tune: pentatonic steps, rising then home. */
const TUNE = [5, 7, 9, 7, 5, 4, 5];

class Firefly extends Container {
  readonly glow = new Graphics().circle(0, 0, 34).fill({ color: swatch.yellow.fill, alpha: 0.35 });
  readonly ring = new Graphics();
  caught = false;
  constructor(readonly phase: number, big: boolean) {
    super();
    const body = new Graphics().ellipse(0, 4, 13, 17).fill(ink).circle(0, 14, 11).fill(swatch.yellow.fill)
      .ellipse(-14, -6, 12, 7).ellipse(14, -6, 12, 7).fill({ color: 0xffffff, alpha: 0.7 });
    this.glow.blendMode = 'add';
    this.addChild(this.glow, body, this.ring);
    this.scale.set(big ? 1.6 : 1.2);
    this.eventMode = 'none';
  }
}

/** Level 9: wind the music box until a friend pops up, pour three cups to their line, loop the fireflies asked for. */
export class ThirdShow implements Game {
  private view: View;
  readonly amounts;
  readonly band;
  step = 0;
  waiting = false;
  finished = false;
  readonly score = { misses: 0, hints: 0 };
  readonly layer = new Container();
  private readonly bg = new Graphics();
  private readonly glow = new Graphics();
  readonly next: RoundButton;
  private readonly friends: Critter[] = [];
  private readonly kinds;
  private clock = 0;
  private quiet = 0;
  private gone = false;

  // The crank.
  crank: CrankState = startCrank();
  readonly box = new Container();
  readonly handle = new Container();
  private readonly arm = new Graphics();
  private readonly dots = new Graphics();
  private readonly lid = new Graphics();
  private readonly coil = new Graphics();
  private friend: Critter | null = null;
  private turning: number | null = null;
  armAngle = Math.PI / 2;
  popped = false;
  private sounded = 0;

  // The cups.
  cups: CupsState;
  readonly jug = new Container();
  readonly cup = new Container();
  readonly tray = new Container();
  private readonly jugArt = new Graphics();
  private readonly cupArt = new Graphics();
  private readonly trayArt = new Graphics();
  private readonly stream = new Graphics();
  private pouring: number | null = null;
  private startX = 0;
  private poured = 0;
  private tilt = 0;
  private readonly served: Container[] = [];

  // The fireflies.
  readonly sky = new Container();
  private readonly trail = new Graphics();
  private readonly jar = new Container();
  flies: Firefly[] = [];
  private spots: Point[] = [];
  private touch: { id: number; points: Point[] } | null = null;
  private readonly loopTrick = { wrong: 0 };
  private busy = false;
  private hinted: number[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.band = thirdBand(ctx.band);
    this.amounts = thirdAmounts(ctx.band);
    this.cups = startCups(ctx.band, ctx.rng);
    this.kinds = ctx.rng.shuffle([...PICNIC_FRIENDS]).slice(0, 4);
    this.spots = meadow(ctx.band, ctx.rng);
    this.next = new RoundButton(arrowIcon(1), swatch.green, 50, () => {
      if (!this.waiting || this.finished) return;
      this.quiet = 0;
      if (this.step === 2) void this.finale();
      else {
        this.step++;
        this.setup();
      }
    });
    for (const g of [this.bg, this.glow, this.stream, this.trail, this.dots, this.coil]) g.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.layer, this.glow, this.next);

    // The crank: anywhere in the ring around the axle starts a turn, so a small hand need not hit the knob.
    this.handle.hitArea = new Circle(0, 0, CRANK_RING);
    this.handle.eventMode = 'static';
    this.handle.on('pointerdown', (e) => this.grab(e));
    this.handle.on('globalpointermove', (e) => this.turn(e));
    for (const ev of ['pointerup', 'pointerupoutside'] as const) this.handle.on(ev, (e) => this.letGo(e.pointerId));

    // The jug, cup and tray, as in Fill & Dump's pour.
    this.jug.addChild(this.jugArt);
    this.cup.addChild(this.cupArt);
    this.tray.addChild(this.trayArt);
    this.jug.hitArea = new Rectangle(-100, -110, 200, 220);
    this.cup.hitArea = new Rectangle(-85, -220, 170, 240);
    this.tray.hitArea = new Rectangle(-140, -40, 280, 100);
    onTap(this.jug, (e) => this.tip(e), { cooldown: 0 });
    onTap(this.cup, () => {
      if (this.waiting || this.pouring !== null || this.cups.cup <= 0) return;
      emptyCup(this.cups);
      sfx.splash();
      this.drawCups();
    });
    onTap(this.tray, () => {
      if (this.waiting || this.pouring !== null || this.cups.tray <= 0) return;
      recoverTray(this.cups);
      sfx.tick();
      this.drawCups();
    });
    this.jug.on('globalpointermove', this.pourMove);
    for (const ev of ['pointerup', 'pointerupoutside'] as const) this.jug.on(ev, (e) => this.pourEnd(e.pointerId));

    // The loop layer catches touches over the meadow.
    this.sky.eventMode = 'static';
    this.sky.on('pointerdown', (e) => this.loopDown(e));
    this.sky.on('globalpointermove', (e) => this.loopMove(e));
    for (const ev of ['pointerup', 'pointerupoutside'] as const) this.sky.on(ev, (e) => this.loopUp(e.pointerId));

    this.ctx.listen(window, 'pointerup', this.windowUp);
    this.ctx.listen(window, 'pointercancel', this.windowCancel);
    this.ctx.listen(window, 'blur', this.stopAll);
    this.ctx.listen(document, 'visibilitychange', this.stopAll);
  }

  start() {
    void this.ctx.say('tricks.third-start').then(() => {
      if (!this.gone && this.step === 0 && !this.popped) void this.instruct();
    });
    this.setup();
  }

  private critter(i: number, scale: number) {
    const f = this.ctx.track(new Critter(CRITTERS[this.kinds[i]]));
    f.scale.set(scale);
    f.eventMode = 'none';
    this.friends.push(f);
    return f;
  }

  private clear() {
    this.stopAll();
    for (const f of this.friends) this.ctx.untrack(f);
    this.friends.length = 0;
    this.friend = null;
    this.served.length = 0;
    this.flies = [];
    for (const c of [this.box, this.jug, this.cup, this.tray, this.handle, this.sky, this.jar, this.stream, this.trail]) c.parent?.removeChild(c);
    for (const c of this.layer.removeChildren()) c.destroy({ children: true });
    // The box, handle and jar are kept; the art drawn into them each step is not.
    const kept: Container[] = [this.lid, this.dots, this.coil, this.arm];
    for (const holder of [this.box, this.handle, this.jar]) for (const c of holder.removeChildren()) if (!kept.includes(c)) c.destroy({ children: true });
    this.glow.clear();
  }

  private instruct() {
    const a = this.amounts;
    if (this.step === 0) {
      if (this.band === 'toddler') return this.ctx.instruct('tricks.crank');
      if (this.band === 'school') return this.ctx.instruct('tricks.crank-half');
      return this.ctx.instruct('tricks.crank-n', { n: a.halves / 2 });
    }
    if (this.step === 1) {
      if (a.line) return this.ctx.instruct('tricks.cups-line');
      if (!a.ticks) return this.ctx.instruct('tricks.cups');
      const t = cupTarget(this.cups);
      return this.ctx.instruct(t === 0.5 ? 'tricks.cups-half' : t === 0.25 ? 'tricks.cups-quarter' : 'tricks.cups-three-quarters');
    }
    if (this.band === 'toddler') return this.ctx.instruct('tricks.loop');
    if (this.band === 'school') return this.ctx.instruct('tricks.loop-half');
    return this.ctx.instruct('tricks.loop-n', { n: a.want });
  }

  private setup() {
    this.clear();
    this.waiting = false;
    this.quiet = 0;
    if (this.step === 0) {
      const friend = this.critter(0, 0.42);
      this.friend = friend;
      this.box.addChild(friend, this.coil,
        new Graphics().roundRect(-150, -110, 300, 220, 22).fill(wood.fill).stroke(stroke(wood.line))
          .roundRect(-118, -78, 236, 156, 14).stroke(stroke(wood.light, 5))
          .circle(0, 0, 26).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line, 4)),
        this.lid, this.dots);
      // The lid hinges at its left end.
      this.lid.clear().roundRect(0, -26, 320, 30, 12).fill(wood.line).stroke(stroke(ink, 4));
      this.lid.position.set(-160, -100);
      this.lid.rotation = 0;
      this.handle.addChild(new Graphics().rect(-70, -12, 70, 24).fill(swatch.yellow.line).stroke(stroke(ink, 4)).circle(0, 0, 22).fill(swatch.yellow.line), this.arm);
      this.layer.addChild(this.box, this.handle);
      this.drawCrank();
    } else if (this.step === 1) {
      for (let i = 1; i < 4; i++) this.layer.addChild(this.critter(i, 0.34));
      this.layer.addChild(this.stream, this.jug, this.cup, this.tray);
    } else {
      this.flies = this.spots.map((_, i) => new Firefly(i * 1.7, this.band === 'toddler'));
      this.jar.addChild(new Graphics().roundRect(-75, -95, 150, 190, 34).fill({ color: 0xffffff, alpha: 0.25 }).stroke(stroke(0xffffff, 6))
        .roundRect(-60, -118, 120, 28, 10).fill(wood.fill).stroke(stroke(wood.line, 5)));
      this.jar.eventMode = 'none';
      this.layer.addChild(this.jar, this.sky, ...this.flies, this.trail);
    }
    this.resize(this.view);
    if (this.step > 0) void this.instruct();
  }

  // ----- the crank -----

  private angleAt(e: FederatedPointerEvent): { angle: number | null; dist: number } {
    const p = this.handle.toLocal(e.global);
    const dist = Math.hypot(p.x, p.y);
    return { angle: dist < CRANK_DEAD ? null : Math.atan2(p.y, p.x), dist };
  }

  private grab(e: FederatedPointerEvent) {
    if (this.step !== 0 || this.popped || this.turning !== null || palmOnGlass()) return;
    const { angle, dist } = this.angleAt(e);
    if (dist < CRANK_DEAD || dist > CRANK_RING) return;
    this.turning = e.pointerId;
    this.crank = crankStep(crankLift(this.crank), angle);
    if (angle !== null) this.armAngle = angle;
    this.quiet = 0;
    sfx.tick();
    this.drawCrank();
  }

  private turn(e: FederatedPointerEvent) {
    if (e.pointerId !== this.turning || this.popped) return;
    const g = this.ctx.stage.toLocal(e.global);
    if (palmOnGlass() || g.x < 0 || g.y < 0 || g.x > this.view.w || g.y > this.view.h) return this.letGo(e.pointerId);
    const { angle } = this.angleAt(e);
    const before = halfTurns(this.crank);
    this.crank = crankStep(this.crank, angle);
    if (angle !== null) this.armAngle = angle;
    this.quiet = 0;
    const halves = halfTurns(this.crank);
    if (halves > before) this.ticked(halves);
    this.drawCrank();
  }

  private letGo(id: number) {
    if (id !== this.turning) return;
    this.turning = null;
    this.crank = crankLift(this.crank);
    this.drawCrank();
  }

  /** A half turn passed: the friend peeks higher, and every whole turn (every half at school) rings the next note up. */
  private ticked(halves: number) {
    const every = this.band === 'school' ? 1 : 2;
    while (this.sounded + every <= Math.min(halves, this.amounts.halves)) {
      this.sounded += every;
      sfx.bell(4 + this.sounded / every, 0.3);
    }
    if (halves >= this.amounts.halves) void this.pop();
  }

  private async pop() {
    if (this.popped) return;
    this.popped = true;
    this.turning = null;
    this.waiting = true;
    this.quiet = 0;
    this.next.visible = false;
    sfx.pop(9);
    void this.ctx.tw.to(this.lid, { rotation: -1.1 }, { duration: 0.3, ease: ease.outBack });
    if (this.friend) {
      this.friend.cheer();
      await this.ctx.tw.to(this.friend, { y: -250 }, { duration: 0.5, ease: ease.outBack });
    }
    if (this.gone) return;
    this.drawCrank();
    sfx.sparkle();
    this.ctx.pet.cheer();
    void this.playTune();
    await (this.band === 'toddler' ? this.ctx.say('tricks.pop') : this.band === 'school' ? this.ctx.say('tricks.pop-half') : this.ctx.say('tricks.pop-n', { n: this.amounts.halves / 2 }));
    if (this.gone) return;
    this.next.visible = !this.finished;
  }

  private async playTune() {
    for (const step of TUNE) {
      if (this.gone) return;
      sfx.marimba(step, 0.35);
      await this.ctx.tw.wait(0.22);
    }
  }

  private drawCrank() {
    const a = this.armAngle;
    const kx = CRANK_ARM * Math.cos(a);
    const ky = CRANK_ARM * Math.sin(a);
    const big = this.turning !== null ? 1.1 : 1;
    this.arm.clear().moveTo(0, 0).lineTo(kx, ky).stroke(stroke(swatch.yellow.line, 22))
      .circle(kx, ky, 48 * big).fill(swatch.red.fill).stroke(stroke(swatch.red.line, 6));
    const halves = Math.min(halfTurns(this.crank), this.amounts.halves);
    if (this.friend && !this.popped) this.friend.y = -78 - 7 * halves;
    if (this.friend && this.popped) {
      const top = this.friend.y + 30;
      this.coil.clear().moveTo(0, -100);
      for (let i = 1; i <= 8; i++) this.coil.lineTo(i === 8 ? 0 : i % 2 ? -22 : 22, -100 + ((top + 100) * i) / 8);
      this.coil.stroke(stroke(swatch.blue.line, 6));
    } else this.coil.clear();
    // The dots under the box: one per turn asked for, a half dot at school.
    this.dots.clear();
    if (this.band === 'toddler') return;
    const n = Math.ceil(this.amounts.halves / 2);
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 70;
      const half = this.amounts.halves % 2 === 1 && i === n - 1;
      const filled = halves >= (i + 1) * 2 || (half && halves >= this.amounts.halves);
      const r = half ? 14 : 22;
      this.dots.circle(x, 160, r).fill(filled ? swatch.yellow.fill : cream).stroke(stroke(swatch.brown.line, 4));
    }
  }

  // ----- the cups -----

  private tip(e: FederatedPointerEvent) {
    if (this.step !== 1 || this.waiting || this.pouring !== null || palmOnGlass()) return;
    this.pouring = e.pointerId;
    this.startX = this.ctx.stage.toLocal(e.global).x;
    this.poured = 0;
    this.tilt = 0.12;
    this.quiet = 0;
    sfx.tick();
    this.drawCups();
  }

  private pourMove = (e: FederatedPointerEvent) => {
    if (e.pointerId !== this.pouring || this.gone) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (palmOnGlass() || p.x < 0 || p.y < 0 || p.x > this.view.w || p.y > this.view.h) return this.pourEnd(e.pointerId);
    const dx = Math.max(0, p.x - this.startX);
    // The help pours at half speed; moving back only rights the jug.
    const amount = pourAmount(this.cups.helped ? dx / 2 : dx);
    if (amount > this.poured) {
      pour(this.cups, amount - this.poured);
      this.poured = amount;
    }
    this.tilt = Math.min(0.85, dx / POUR_DISTANCE);
    this.quiet = 0;
    this.drawCups();
  };

  private pourEnd(id: number) {
    if (id !== this.pouring) return;
    this.pouring = null;
    this.tilt = 0;
    const result = releaseCup(this.cups, this.ctx.band, this.poured > 0, this.score);
    this.poured = 0;
    if (result === 'served' || result === 'done') this.serve(result === 'done');
    else if (result === 'over' || result === 'help') {
      void this.ctx.say(result === 'help' ? 'tricks.cup-slow' : 'tricks.cup-over');
    } else if (result === 'more' || result === 'none') {
      // Not enough left in the jug for this cup: the tray pours it back.
      if (this.cups.tray > 0 && this.cups.jug + 1e-9 < cupTarget(this.cups) - this.cups.cup) void this.ctx.say('tricks.cup-tray');
      else if (result === 'more' && this.cups.unders === 1) void this.ctx.say('tricks.cup-more');
    }
    if (!this.gone) this.drawCups();
  }

  /** The cup goes to its friend, who drinks it with a gulp; the next cup slides in. */
  private serve(last: boolean) {
    const i = this.served.length;
    const friend = this.friends[i];
    sfx.bell(7, 0.3);
    void this.ctx.say('tricks.cup-yes');
    if (friend) {
      friend.cheer();
      sfx.giggle();
      const mug = new Graphics().roundRect(-22, -36, 44, 40, 8).fill(swatch[CUP_COLORS[i]].fill).stroke(stroke(swatch[CUP_COLORS[i]].line, 4));
      this.layer.addChild(mug);
      this.served.push(mug);
    }
    if (last) {
      this.waiting = true;
      this.quiet = 0;
      this.ctx.pet.cheer();
      sfx.sparkle();
    } else if (this.amounts.ticks) void this.ctx.tw.wait(1.2).then(() => {
        if (!this.gone && this.step === 1) void this.instruct();
      });
    this.resize(this.view);
  }

  private drawCups() {
    const s = this.cups;
    const blue = swatch.blue.fill;
    this.jugArt.clear()
      .roundRect(-75, -100, 140, 200, 26).fill(0xffffff).stroke(stroke(swatch.blue.line))
      .roundRect(-63, 82 - (165 * Math.min(3, s.jug)) / 3, 116, (165 * Math.min(3, s.jug)) / 3 + 1, 12).fill(blue)
      .moveTo(-75, -60).bezierCurveTo(-145, -90, -145, 70, -75, 55).stroke(stroke(swatch.blue.line, 14))
      .poly([65, -100, 100, -115, 65, -50]).fill(0xffffff).stroke(stroke(swatch.blue.line));
    this.jugArt.rotation = this.tilt;
    const color = swatch[CUP_COLORS[Math.min(s.round, 2)]];
    const g = this.cupArt.clear().roundRect(-80, -220, 160, 230, 20).fill(0xffffff).stroke(stroke(color.line, 7));
    if (s.cup > 0) g.rect(-69, -200 * Math.min(1, s.cup), 138, 200 * Math.min(1, s.cup)).fill(blue);
    const t = cupTarget(s);
    if (this.amounts.ticks) for (const q of [0.25, 0.5, 0.75]) g.moveTo(-80, -200 * q).lineTo(-52, -200 * q).stroke(stroke(swatch.purple.line, 5));
    if (this.amounts.line) {
      for (let x = -94; x < 94; x += 28) g.moveTo(x, -200 * t).lineTo(x + 16, -200 * t);
      g.stroke(stroke(swatch.purple.line, 8));
    }
    this.cupArt.visible = !this.waiting;
    this.trayArt.clear().roundRect(-140, -30, 280, 65, 20).fill(swatch.blue.light).stroke(stroke(swatch.blue.line));
    if (s.tray > 0) this.trayArt.roundRect(-128, 18 - 35 * Math.min(1, s.tray), 256, 35 * Math.min(1, s.tray), 10).fill(blue);
    this.trayArt.moveTo(45, 8).lineTo(-45, 8).lineTo(-23, -10).moveTo(-45, 8).lineTo(-23, 26).stroke(stroke(ink, 7));
    this.stream.clear();
    if (this.pouring !== null && this.tilt > 0.15 && s.jug > 0) {
      this.stream.moveTo(this.jug.x + 85, this.jug.y - 65).quadraticCurveTo(this.cup.x, this.jug.y - 90, this.cup.x, this.cup.y - 200 * Math.min(1, s.cup)).stroke(stroke(blue, 12));
    }
    this.drawGlow();
  }

  // ----- the fireflies -----

  private loopDown(e: FederatedPointerEvent) {
    if (this.step !== 2 || this.waiting || this.busy || this.touch || palmOnGlass()) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.touch = { id: e.pointerId, points: [{ x: p.x, y: p.y }] };
    this.quiet = 0;
    sfx.tick();
  }

  private loopMove(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    const last = t.points[t.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 8) return;
    t.points.push({ x: p.x, y: p.y });
    this.drawTrail(t.points);
  }

  private loopUp(id: number) {
    const t = this.touch;
    if (!t || t.id !== id) return;
    this.touch = null;
    void this.closeLoop(t.points);
  }

  private drawTrail(points: Point[], closed = false) {
    const g = this.trail.clear();
    if (points.length < 2) return;
    for (const [width, color, alpha] of [[16, swatch.yellow.fill, 0.35], [6, 0xffffff, 0.9]] as const) {
      g.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) g.lineTo(p.x, p.y);
      if (closed) g.closePath();
      g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
    }
  }

  private get free() {
    return this.flies.filter((f) => !f.caught);
  }

  private async closeLoop(points: Point[]) {
    const free = this.free;
    const { verdict, got } = judgeLoop(this.ctx.band, points, free.map((f) => f.position), this.score, this.loopTrick);
    if (verdict === 'small') {
      this.trail.clear();
      return void this.ctx.say('tricks.loop-small');
    }
    this.drawTrail(points, true);
    void this.ctx.tw.wait(0.5).then(() => !this.gone && this.trail.clear());
    if (verdict === 'free') return void this.instruct();
    const caught = got.map((i) => free[i]);
    if (verdict === 'miss') {
      this.busy = true;
      sfx.boing();
      for (const f of caught) void this.ctx.tw.to(f.scale, { x: f.scale.x * 1.3, y: f.scale.y * 1.3 }, { duration: 0.2, ease: ease.outQuad })
        .then(() => this.ctx.tw.to(f.scale, { x: f.scale.x / 1.3, y: f.scale.y / 1.3 }, { duration: 0.3, ease: ease.inOutSine }));
      await this.ctx.say('tricks.loop-count', { got: got.length, n: this.amounts.want });
      if (this.gone) return;
      this.busy = false;
      if (this.loopTrick.wrong >= 2) {
        this.hinted = nearestGroup(this.flies.map((f) => f.position), this.flies.flatMap((f, i) => (f.caught ? [] : [i])), this.amounts.want);
        void this.ctx.say('tricks.loop-hint');
      }
      this.drawGlow();
      return;
    }
    this.busy = true;
    this.hinted = [];
    sfx.sparkle();
    void this.ctx.say('tricks.loop-yes');
    // The looped fireflies fly into the jar first, the rest drift in after them.
    const order = [...caught, ...free.filter((f) => !caught.includes(f))];
    order.forEach((f, i) => {
      f.caught = true;
      const at = { x: this.jar.x + ((i % 3) - 1) * 38, y: this.jar.y + 40 - Math.floor(i / 3) * 40 };
      void this.ctx.tw.wait(i < caught.length ? i * 0.12 : 0.8 + i * 0.15).then(() => {
        if (!this.gone) void this.ctx.tw.to(f, at, { duration: 0.6, ease: ease.inOutSine });
      });
    });
    this.drawGlow();
    await this.ctx.tw.wait(1.2 + order.length * 0.15);
    if (this.gone) return;
    this.busy = false;
    this.waiting = true;
    this.quiet = 0;
    this.ctx.pet.cheer();
    this.resize(this.view);
  }

  private drawGlow() {
    this.glow.clear();
    if (this.waiting) return;
    if (this.step === 1 && this.cups.helped && (this.amounts.line || this.amounts.ticks)) {
      const y = this.cup.y - 200 * cupTarget(this.cups);
      this.glow.moveTo(this.cup.x - 105, y).lineTo(this.cup.x + 105, y).stroke(stroke(swatch.yellow.fill, 16));
    }
    if (this.step === 2) for (const i of this.hinted) {
      const f = this.flies[i];
      if (f && !f.caught) this.glow.circle(f.x, f.y, 58).stroke(stroke(swatch.yellow.line, 8));
    }
  }

  // ----- the bow -----

  private async finale() {
    this.finished = true;
    this.next.visible = false;
    await this.ctx.tw.wait(0.3);
    if (this.gone) return;
    this.clear();
    const v = this.view;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    // The jar glows on the box's lid while the music box plays its tune once more.
    const box = new Graphics().roundRect(-150, -110, 300, 220, 22).fill(wood.fill).stroke(stroke(wood.line))
      .roundRect(-75, -300, 150, 190, 34).fill({ color: swatch.yellow.fill, alpha: 0.6 }).stroke(stroke(0xffffff, 6));
    box.position.set(v.w / 2, v.h * 0.48);
    this.layer.addChild(box);
    const n = this.kinds.length;
    this.kinds.forEach((_, i) => {
      const f = this.critter(i, 0.4);
      f.setMood('happy');
      f.position.set(v.w * (0.5 + (i - (n - 1) / 2) * (0.7 / n)), v.h * 0.78);
      this.layer.addChild(f);
      void this.ctx.tw.wait(0.3 + i * 0.25).then(() => this.ctx.tw.to(f, { y: f.y - 30 }, { duration: 0.2, ease: ease.outQuad }))
        .then(() => this.ctx.tw.to(f, { y: f.y + 30 }, { duration: 0.25, ease: ease.inQuad }));
    });
    this.ctx.particles.burst(v.w / 2, v.h * 0.3, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 70, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    void this.playTune();
    sfx.tada();
    await this.ctx.say('tricks.done');
    await this.ctx.tw.wait(0.8);
    if (this.gone) return;
    this.ctx.finish({ misses: this.score.misses, hints: this.score.hints });
  }

  resize(v: View) {
    this.view = v;
    this.next.position.set(v.w - 80, v.h - 80);
    this.next.visible = this.waiting && !this.finished && (this.step !== 0 || this.popped);
    if (this.finished) return;
    const night = this.step === 2;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(night ? shadow : cream);
    if (!night) this.bg.rect(0, 0, 110, v.h).fill(swatch.purple.light).rect(v.w - 110, 0, 110, v.h).fill(swatch.purple.light);
    if (this.step === 0) {
      this.box.position.set(v.w * 0.38, v.h * 0.48);
      this.handle.position.set(this.box.x + 215, this.box.y);
      this.drawCrank();
    } else if (this.step === 1) {
      const middle = v.h * 0.56;
      this.jug.position.set(v.w * 0.29, middle - 20);
      this.cup.position.set(v.w * 0.67, middle + 115);
      this.tray.position.set(v.w * 0.67, middle + 200);
      this.bg.roundRect(170, middle + 245, v.w - 210, 24, 12).fill(wood.fill);
      const xs = spread(3, 180, v.w - 180, 200);
      this.friends.forEach((f, i) => f.position.set(xs[i], middle - 300));
      this.served.forEach((m, i) => m.position.set(xs[i] + 70, middle - 255));
      this.drawCups();
    } else {
      const ox = (v.w - MEADOW.w) / 2;
      const oy = Math.max(100, v.h * 0.42 - MEADOW.h / 2 - 40);
      this.sky.hitArea = new Rectangle(0, 0, v.w, v.h);
      this.jar.position.set(v.w * 0.55, v.h - 150);
      this.flies.forEach((f, i) => {
        if (!f.caught) f.position.set(ox + this.spots[i].x, oy + this.spots[i].y);
      });
      this.drawGlow();
    }
  }

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.waiting) return this.next.visible ? { tap: { on: this.next } } : null;
    if (this.step === 0) {
      if (this.turning !== null) return null;
      const dir = this.crank.dir === -1 ? -1 : 1;
      const via = crankCircle(this.armAngle, dir).map((p) => ({ on: this.handle, x: p.x, y: p.y }));
      return { trace: { on: this.handle, x: CRANK_ARM * Math.cos(this.armAngle), y: CRANK_ARM * Math.sin(this.armAngle) }, via };
    }
    if (this.step === 1) {
      if (this.pouring !== null) return null;
      const s = this.cups;
      if (this.amounts.counted && !atLine(s) && s.cup > cupTarget(s)) return { tap: { on: this.cup, y: -100 } };
      const need = this.amounts.counted ? cupTarget(s) - s.cup : 0.5;
      if (s.jug + 1e-9 < need && s.tray > 0) return { tap: { on: this.tray } };
      return { drag: { on: this.jug }, to: { on: this.jug, x: (this.amounts.counted ? pourNeeded(s) : 0.5) * POUR_DISTANCE }, lift: 0 };
    }
    if (this.busy || this.touch) return null;
    const free = this.free;
    const move = demoLoop(free.map((f) => ({ x: f.x, y: f.y })), Math.min(this.amounts.want, free.length), 34);
    if (!move) return null;
    const spots = move.loop.map((p) => ({ on: this.sky, x: p.x, y: p.y }));
    return { trace: spots[0], via: [...spots.slice(1), spots[0]], pause: 0.12 };
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 4);
    for (const f of this.flies) f.glow.alpha = 0.5 + 0.5 * Math.sin(this.clock * 3 + f.phase);
    if (this.finished) return;
    this.quiet += dt;
    if (this.quiet > 10) {
      this.quiet = 0;
      if (this.waiting) {
        if (this.next.visible) void this.ctx.say('tricks.next');
      } else if (this.turning === null && this.pouring === null && !this.touch && !this.busy) {
        void this.instruct();
        if (this.step === 0) this.nudge();
      }
    }
  }

  /** A curved ghost arrow circles the knob once; not a hint and not counted. */
  private nudge() {
    const g = new Graphics();
    g.arc(0, 0, CRANK_ARM, this.armAngle, this.armAngle + Math.PI * 1.5).stroke(stroke(swatch.yellow.line, 10));
    const end = this.armAngle + Math.PI * 1.5;
    const ex = CRANK_ARM * Math.cos(end);
    const ey = CRANK_ARM * Math.sin(end);
    g.circle(ex, ey, 16).fill(swatch.yellow.line);
    g.eventMode = 'none';
    g.alpha = 0.9;
    this.handle.addChild(g);
    void this.ctx.tw.to(g, { alpha: 0 }, { duration: 2.2, ease: ease.inQuad }).then(() => {
      if (!this.gone) g.destroy();
    });
  }

  private windowUp = (e: PointerEvent) => {
    this.letGo(e.pointerId);
    this.pourEnd(e.pointerId);
    this.loopUp(e.pointerId);
  };

  /** Pixi 8 never forwards `pointercancel`: a lost finger stops the crank and the pour, and drops the loop. */
  private windowCancel = (e: PointerEvent) => {
    this.letGo(e.pointerId);
    if (e.pointerId === this.pouring) this.pourEnd(e.pointerId);
    if (this.touch?.id === e.pointerId) {
      this.touch = null;
      this.trail.clear();
    }
  };

  private stopAll = () => {
    if (this.turning !== null) this.letGo(this.turning);
    if (this.pouring !== null) this.pourEnd(this.pouring);
    if (this.touch) {
      this.touch = null;
      this.trail.clear();
    }
  };

  destroy() {
    this.gone = true;
    this.finished = true;
    this.turning = this.pouring = null;
    this.touch = null;
    for (const c of [this.handle, this.jug, this.sky]) c.removeAllListeners();
    // The kept holders may be off the stage between steps, so they are freed here.
    for (const c of [this.box, this.handle, this.jug, this.cup, this.tray, this.sky, this.jar, this.stream, this.trail]) if (!c.destroyed) c.destroy({ children: true });
  }
}
