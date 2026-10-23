import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { carTap, crossTouch, doneLine, GO_TARGET, hintOn, judgeGo, lampRolls, lightAt, nextLamp, nextLight, planFor, rightNow, safe, touchCounts, VEHICLES, cycleFor, type Cycle, type GoPlan, type Lamp, type Light, type Road, type Vehicle } from './logic';

const LEVELS: BandLevels = {
  // Level 9 is the easiest, so lap plays it first and then 1 (see `order`).
  lap: { min: 1, max: 9, order: [9, 1] },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
};

const LAMP: Record<Light, number> = { red: swatch.red.fill, yellow: swatch.yellow.fill, green: swatch.green.fill };
const CAR_COLORS: ColorName[] = ['blue', 'pink', 'orange', 'purple', 'teal', 'red'];

/** A three-lamp traffic light on a pole; the lit lamp is bright, the others dim. */
class TrafficLight extends Container {
  light: Light = 'red';
  private readonly box = new Graphics();
  constructor(pole = true) {
    super();
    if (pole) this.addChild(new Graphics().rect(-8, 0, 16, 150).fill(0x6b778a));
    this.addChild(this.box);
    this.hitArea = new Rectangle(-60, -170, 120, 180);
    this.set('red');
  }
  set(l: Light) {
    this.light = l;
    const g = this.box.clear().roundRect(-44, -164, 88, 168, 22).fill(ink);
    (['red', 'yellow', 'green'] as Light[]).forEach((x, i) => g.circle(0, -134 + i * 52, 22).fill({ color: LAMP[x], alpha: x === l ? 1 : 0.22 }));
  }
}

/** One of the lap level's two huge lamps (160 across): a bright disc with a shape, so colour is not the only cue (play triangle, stop bar). */
class BigLamp extends Container {
  constructor(readonly lamp: Lamp) {
    super();
    const sw = swatch[lamp];
    const g = new Graphics().circle(0, 0, 80).fill(ink).circle(0, 0, 68).fill(sw.fill);
    if (lamp === 'green') g.poly([-18, -30, -18, 30, 32, 0]).fill(0xffffff);
    else g.roundRect(-26, -26, 52, 52, 10).fill(0xffffff);
    this.addChild(g);
    this.hitArea = new Circle(0, 0, 92);
  }
}

/** A car (or another vehicle): its drawing (`art`, which bounces, squashes and idles inside the car's place) and its headlight. */
type Car = Container & { art: Container; lamp: Graphics; kind: Vehicle; road?: Road };

/** The windshield face every vehicle shares: two eyes and a smile around (x, y). */
function face(g: Graphics, x: number, y: number) {
  g.circle(x - 12, y, 5).circle(x + 12, y, 5).fill(ink);
  g.moveTo(x - 10, y + 10).quadraticCurveTo(x, y + 16, x + 10, y + 10).stroke({ width: 3, color: ink, cap: 'round' });
}

function wheel(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r).fill(ink).circle(x, y, r * 0.4).fill(0xdfe3ea);
}

const GLASS = 0xdff3ff;

/**
 * The six vehicles, drawn inside the same 160-wide box (x −80…80, y −90…30) so the line-up, the hit area and the
 * north–south queue fit every kind; the headlamp sits at the front, drawn about its own centre so its blink stays put.
 */
const DRAW: Record<Vehicle, (g: Graphics, sw: (typeof swatch)[ColorName]) => [number, number]> = {
  car: (g, sw) => {
    g.roundRect(-70, -40, 140, 50, 18).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-40, -78, 76, 44, 16).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-30, -70, 56, 30, 10).fill(GLASS);
    face(g, -2, -56);
    for (const x of [-40, 40]) wheel(g, x, 12, 18);
    return [66, -20];
  },
  bus: (g, sw) => {
    g.roundRect(-76, -84, 152, 94, 18).fill(sw.fill).stroke({ width: 5, color: sw.line });
    for (const x of [-64, -26]) g.roundRect(x, -72, 30, 28, 8).fill(GLASS);
    g.roundRect(14, -72, 52, 34, 10).fill(GLASS);
    face(g, 40, -58);
    g.rect(-72, -26, 144, 8).fill(sw.line);
    for (const x of [-46, 46]) wheel(g, x, 12, 17);
    return [70, -8];
  },
  bike: (g, sw) => {
    for (const x of [-46, 46]) g.circle(x, 8, 22).stroke({ width: 7, color: ink }).circle(x, 8, 5).fill(ink);
    g.moveTo(-46, 8).lineTo(-10, -26).lineTo(30, -26).lineTo(46, 8).moveTo(-10, -26).lineTo(2, 8).lineTo(-46, 8).stroke({ width: 7, color: sw.line, cap: 'round', join: 'round' });
    g.moveTo(30, -26).lineTo(38, -44).stroke({ width: 7, color: ink, cap: 'round' });
    // The rider leans to the handlebars, with the shared face and a helmet in the bike's colour.
    g.roundRect(-30, -58, 32, 40, 12).fill(sw.fill).stroke({ width: 4, color: sw.line });
    g.moveTo(-2, -48).lineTo(36, -44).stroke({ width: 8, color: sw.fill, cap: 'round' });
    g.circle(-10, -70, 20).fill(0xf6d2b0);
    g.moveTo(-31, -72).arc(-10, -72, 21, Math.PI, 0).fill(sw.line);
    face(g, -8, -66);
    return [42, -40];
  },
  tractor: (g, sw) => {
    g.roundRect(-8, -34, 76, 38, 10).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.rect(36, -60, 9, 28).fill(ink);
    g.roundRect(-64, -88, 60, 76, 12).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-56, -80, 44, 36, 10).fill(GLASS);
    face(g, -34, -64);
    wheel(g, -36, 0, 30);
    wheel(g, 48, 14, 16);
    return [66, -20];
  },
  van: (g, sw) => {
    g.roundRect(-74, -78, 148, 88, 20).fill(0xfff7ef).stroke({ width: 5, color: sw.line });
    // A stripe awning over the serving hatch, and an ice-cream cone painted on the side.
    g.roundRect(-62, -58, 64, 36, 8).fill(sw.light);
    for (let i = 0; i < 4; i++) g.rect(-62 + i * 16, -66, 16, 10).fill(i % 2 ? 0xffffff : sw.fill);
    g.poly([-38, -24, -26, -24, -32, -6]).fill(wood.fill);
    g.circle(-32, -30, 9).fill(sw.fill);
    g.roundRect(16, -68, 48, 34, 10).fill(GLASS);
    face(g, 40, -54);
    g.rect(-70, -14, 140, 8).fill(sw.fill);
    for (const x of [-44, 44]) wheel(g, x, 12, 17);
    return [70, -14];
  },
  digger: (g, sw) => {
    // The arm reaches up and forward, the bucket resting low at the front.
    g.moveTo(-8, -50).lineTo(40, -76).lineTo(62, -30).stroke({ width: 13, color: sw.line, cap: 'round', join: 'round' });
    g.poly([50, -32, 78, -30, 74, -4, 54, -8]).fill(ink);
    g.roundRect(-70, -4, 112, 34, 17).fill(ink);
    for (const x of [-52, -24, 4, 26]) g.circle(x, 13, 8).fill(0xdfe3ea);
    g.roundRect(-64, -84, 64, 80, 12).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-56, -76, 48, 36, 10).fill(GLASS);
    face(g, -32, -60);
    return [-4, -22];
  },
};

/** A vehicle with a face on its windshield (or on its rider). */
function carArt(color: ColorName, kind: Vehicle = 'car'): Car {
  const c = new Container() as Car;
  const art = new Container();
  const g = new Graphics();
  const [lx, ly] = DRAW[kind](g, swatch[color]);
  const lamp = new Graphics().circle(0, 0, 7).fill(0xffffff);
  lamp.position.set(lx, ly);
  lamp.tint = swatch.yellow.light;
  art.addChild(g, lamp);
  c.addChild(art);
  c.art = art;
  c.lamp = lamp;
  c.kind = kind;
  return c;
}

class StopAndGo implements Game {
  readonly plan: GoPlan;
  readonly light = new TrafficLight();
  /** The crossing's second light, for the up-and-down road. */
  readonly light2 = new TrafficLight();
  readonly cars: Car[] = [];
  /** Lap level: the green and red lamps, and whether the car is rolling. */
  readonly lamps: BigLamp[] = [new BigLamp('green'), new BigLamp('red')];
  rolling = false;
  readonly step: RoundButton;
  /** Cars sent, steps taken, or cars through the crossing. */
  done = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  pet: CompanionRig | null = null;

  private readonly backdrop: Backdrop;
  private readonly road = new Graphics();
  /** Cars drive under the traffic lights. */
  private readonly carLayer = new Container();
  private readonly flag = new Graphics();
  private readonly glow = new Graphics();
  private view: View;
  private clock = 0;
  /** This round's seeded light cycle (send and walk). */
  private readonly cycle: Cycle;
  private wrongs = 0;
  private hinting = false;
  private driving = false;
  private speed = 0;
  private puff = 0;
  /** Crossing: seconds until the next car may roll through. */
  private gap = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.cycle = cycleFor(ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 66 }, ctx.view);
    this.glow.eventMode = 'none';
    this.step = new RoundButton(this.feet(), swatch.green, 64, () => void this.walk());
    this.step.visible = this.plan.mode === 'walk';
    ctx.stage.addChild(this.backdrop, this.road, this.flag, this.carLayer);
    onTap(this.light, () => this.tapLight(this.light), { cooldown: 300 });
    onTap(this.light2, () => this.tapLight(this.light2), { cooldown: 300 });
    this.light2.visible = this.plan.mode === 'cross';
    this.light.visible = this.plan.mode !== 'lamps';
    for (const l of this.lamps) {
      l.visible = this.plan.mode === 'lamps';
      onTap(l, () => this.tapLamp(l.lamp), { cooldown: 300 });
    }
    if (this.plan.mode === 'walk') {
      this.pet = ctx.companion();
      this.pet.scale.set(0.5);
      ctx.track(this.pet);
      ctx.stage.addChild(this.pet);
    } else {
      const n = this.plan.mode === 'cross' ? this.plan.goal : this.plan.mode === 'send' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const car = this.addCar(i);
        // The crossing: half the cars wait on each road, so both roads need a turn.
        if (this.plan.mode === 'cross') car.road = i % 2 ? 'ns' : 'ew';
      }
    }
    ctx.stage.addChild(this.light, this.light2, ...this.lamps, this.glow, this.step);
    if (this.plan.mode === 'cross') {
      this.light.set('red');
      this.light2.set('red');
    }
  }

  private feet() {
    const g = new Graphics();
    for (const [x, y, flip] of [[-14, 6, 1], [14, -8, -1]]) g.ellipse(x, y, 11, 17).fill(0xffffff).circle(x - 6 * flip, y - 22, 4).circle(x, y - 24, 4).circle(x + 6 * flip, y - 22, 4).fill(0xffffff);
    return g;
  }

  private addCar(i: number) {
    const car = carArt(CAR_COLORS[(i + this.done) % CAR_COLORS.length], this.ctx.rng.pick(VEHICLES));
    car.hitArea = new Rectangle(-80, -90, 160, 120);
    onTap(car, () => void this.tapCar(car), { cooldown: 300 });
    this.cars.push(car);
    this.carLayer.addChild(car);
    return car;
  }

  start() {
    this.layoutCars(true);
    this.busy = false;
    const line = { lamps: 'go.lamps', toy: 'go.toy', send: 'go.send', walk: 'go.walk', cross: 'go.cross' } as const;
    void this.ctx.instruct(line[this.plan.mode]);
  }

  private roadY() {
    return this.view.h * 0.66;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const y = this.roadY();
    const r = this.road.clear().rect(0, y - 60, v.w, 120).fill(0x8e96a3);
    for (let x = 20; x < v.w; x += 90) r.rect(x, y - 4, 50, 8).fill(0xffffff);
    if (this.plan.mode === 'cross') {
      // The up-and-down road crosses in the middle.
      r.rect(v.w * 0.62 - 60, 0, 120, v.h).fill(0x8e96a3);
      r.rect(v.w * 0.62 - 60, y - 60, 120, 120).fill(0x9ba3ae);
    }
    this.light.position.set(this.plan.mode === 'cross' ? v.w * 0.62 - 120 : v.w * 0.55, y - 80);
    this.light2.position.set(v.w * 0.62 + 130, y - 80);
    // The lamps sit low and centred, clear of the pet in the bottom-left.
    this.lamps[0].position.set(v.w / 2 + 120, v.h - 110);
    this.lamps[1].position.set(v.w / 2 - 120, v.h - 110);
    this.flag.clear();
    if (this.plan.mode === 'walk') {
      const fx = v.w - 110;
      this.flag.rect(fx, y - 190, 8, 190).fill(wood.line).poly([fx + 8, y - 190, fx + 80, y - 165, fx + 8, y - 140]).fill(swatch.red.fill);
      this.step.position.set(v.w / 2, v.h - 80);
    }
    this.layoutCars(true);
  }

  /** Waiting cars line up before the light (and below the crossing). */
  private layoutCars(snap = false) {
    const y = this.roadY() + 30;
    if (this.plan.mode === 'cross') {
      const [a, b] = [this.cars.filter((c) => c.road !== 'ns'), this.cars.filter((c) => c.road === 'ns')];
      a.forEach((c, i) => this.place(c, this.light.x - 120 - i * 170, y, 0, snap));
      b.forEach((c, i) => this.place(c, this.view.w * 0.62 + 30, this.roadY() + 160 + i * 170, -Math.PI / 2, snap));
      return;
    }
    if (this.plan.mode === 'walk' && this.pet) {
      const x0 = 190;
      const x1 = this.view.w - 170;
      this.pet.position.set(x0 + ((x1 - x0) * this.done) / this.plan.goal, this.roadY() + 10);
      return;
    }
    if (this.plan.mode === 'lamps') {
      // The car keeps its place on the road when the view changes; only its first placing sets x.
      const car = this.cars[0];
      if (snap && !this.clock) car.position.set(this.view.w * 0.3, y);
      else car.y = y;
      return;
    }
    this.cars.forEach((c, i) => this.place(c, this.light.x - 120 - i * 170, y, 0, snap));
  }

  private place(c: Container, x: number, y: number, rotation: number, snap: boolean) {
    c.rotation = rotation;
    if (snap) c.position.set(x, y);
    else void this.ctx.tw.to(c, { x, y }, { duration: 0.4, ease: ease.outQuad });
  }

  update(dt: number) {
    this.clock += dt;
    // The light runs itself on the send and walk levels.
    if (this.plan.mode === 'send' || this.plan.mode === 'walk') {
      const l = lightAt(this.clock, this.cycle);
      if (l !== this.light.light) {
        this.light.set(l);
        if (l === 'green') this.greenNow();
      }
    }
    if (this.plan.mode === 'lamps') this.loopCar(dt);
    // Waiting on red, the cars idle: a small rumble, a different motion from green's blink, so colour is not the only cue.
    const idle = this.plan.mode !== 'cross' && this.light.light === 'red';
    for (const c of this.cars) c.art.y = idle ? -Math.abs(Math.sin((this.clock * Math.PI) / 0.6)) * 3 : 0;
    if (this.plan.mode === 'cross' && !this.finished) this.crossing(dt);
    const g = this.glow.clear();
    const ring = (t: TrafficLight) => {
      const b = t.getBounds();
      g.roundRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20, 24).stroke({ width: 7 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.light });
    };
    // The glow sits on the thing to touch (the front car or the feet), and only while touching it is right.
    const on = this.hinting ? hintOn(this.plan.mode, this.light.light) : null;
    const target = on === 'car' ? this.cars[0] : on === 'step' ? this.step : null;
    if (target) {
      const b = target.getBounds();
      g.roundRect(b.x - 12, b.y - 12, b.width + 24, b.height + 24, 30).stroke({ width: 7 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.light });
    }
    // At the crossing, glow a green light whose road has fewer cars waiting: that one should turn red.
    if (this.hinting && this.plan.mode === 'cross' && this.light.light === 'green' && this.light2.light === 'green') {
      const ns = this.cars.filter((c) => c.road === 'ns').length;
      ring(ns < this.cars.length - ns ? this.light2 : this.light);
    }
  }

  /** Lap level: the car speeds up on green, brakes on red, and loops round the road without stopping on its own. */
  private loopCar(dt: number) {
    const car = this.cars[0];
    this.speed += ((this.rolling ? 380 : 0) - this.speed) * Math.min(1, dt * 4);
    if (this.speed < 4) this.speed = 0;
    car.x += this.speed * dt;
    if (car.x > this.view.w + 120) car.x = -120;
    this.puff -= dt;
    if (this.speed > 60 && this.puff <= 0) {
      this.puff = 0.12;
      this.ctx.particles.burst(car.x - 70, car.y + 20, { colors: [0xffffff, 0xdfe3ea], kind: 'dot', count: 2, speed: [20, 60], size: [0.5, 0.9], life: [0.4, 0.7], gravity: -40, angle: Math.PI, spread: 0.8 });
    }
  }

  /**
   * The ghost finger: tap the light at the toy level; at the others wait over the car at the front (or the step button) until the
   * light is green and tap then; at the crossing give one road its green at a time.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const mode = this.plan.mode;
    const spot = (t: TrafficLight) => ({ on: t, y: -84 });
    if (mode === 'cross') {
      const road = crossTouch({ ew: this.light.light, ns: this.light2.light }, { ew: this.waiting('ew'), ns: this.waiting('ns') });
      return road ? { tap: spot(road === 'ew' ? this.light : this.light2) } : null;
    }
    if (mode === 'lamps') return { tap: { on: this.lamps[nextLamp(this.rolling) === 'green' ? 0 : 1] } };
    if (GO_TARGET[mode] === 'light') return { tap: spot(this.light) };
    const car = this.cars[0];
    const target = GO_TARGET[mode] === 'car' ? car : this.step;
    if (!target) return null;
    return {
      tap: { on: target, y: GO_TARGET[mode] === 'car' ? -30 : 0 },
      when: () => (this.finished || (GO_TARGET[mode] === 'car' && this.cars[0] !== car) ? 'cancel' : !this.busy && rightNow(mode, this.light.light)),
    };
  }

  /** Cars at the crossing that have not begun to roll, on one road. */
  private waiting(road: Road) {
    return this.cars.filter((c) => (c.road === 'ns') === (road === 'ns')).length;
  }

  destroy() {}

  // Lamps (lap) ---------------------------------------------------------------------------

  /** Green sets the car going, red brakes it; each touch is one of the round's, whichever lamp. */
  private tapLamp(lamp: Lamp) {
    if (this.finished || this.busy) return;
    this.rolling = lampRolls(lamp);
    this.light.set(lamp);
    sfx.bell(lamp === 'green' ? 9 : 4, 0.25);
    if (touchCounts('lamps', 'light')) this.done++;
    if (this.rolling) {
      this.greenNow();
      sfx.whoosh();
    } else this.squash(this.cars[0]);
    if (this.done >= this.plan.goal) void this.finale();
  }

  // Toy ------------------------------------------------------------------------------------

  private tapLight(t: TrafficLight) {
    if (this.finished) return;
    if (this.plan.mode === 'toy') {
      t.set(nextLight(t.light));
      sfx.bell(t.light === 'green' ? 9 : t.light === 'yellow' ? 7 : 4, 0.25);
      if (touchCounts('toy', 'light')) this.done++;
      if (t.light === 'green') {
        this.greenNow();
        void this.drive(this.cars[0]);
      } else if (t.light === 'red' && !this.driving && this.cars[0]) this.squash(this.cars[0]);
      if (this.done >= this.plan.goal) void this.finale();
      return;
    }
    if (this.plan.mode === 'cross') {
      t.set(t.light === 'green' ? 'red' : 'green');
      sfx.bell(t.light === 'green' ? 9 : 4, 0.25);
      if (!safe({ ns: this.light2.light, ew: this.light.light })) {
        // Both roads green: everyone waits politely. The one mistake at the crossing.
        this.misses++;
        this.wrongs++;
        sfx.boing();
        void this.ctx.say('go.both');
        if (this.wrongs >= 2 && !this.hinting) {
          this.hinting = true;
          this.hints++;
        }
      }
      return;
    }
    // The light runs itself; tapping it just shows which color it is.
    void this.ctx.say(`go.is.${t.light}`);
  }

  /** The light has just turned green: a tick, and every waiting car blinks its headlight and looks ready. */
  private greenNow() {
    sfx.tick();
    for (const c of this.cars) {
      c.lamp.tint = 0xffffff;
      c.lamp.scale.set(1.6);
      void this.ctx.tw.to(c.lamp.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outQuad }).then(() => {
        if (!c.destroyed) c.lamp.tint = swatch.yellow.light;
      });
    }
  }

  /** A two-note horn and a hop: the car heard her. */
  private toot(car: Car) {
    sfx.bell(5, 0.22);
    void this.ctx.tw.wait(0.12).then(() => sfx.bell(7, 0.22));
    void this.ctx.tw.to(car.art.scale, { x: 0.94, y: 1.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(car.art.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack }));
  }

  /** On red the car brakes: a squash, then back. */
  private squash(car: Car) {
    void this.ctx.tw.to(car.art.scale, { x: 1.1, y: 0.9 }, { duration: 0.08 }).then(() => this.ctx.tw.to(car.art.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack }));
  }

  /** A car zooms off to the right, then comes back round to wait again (toy level). */
  private async drive(car: Car, away = false) {
    if (this.driving && !away) return;
    this.driving = true;
    sfx.whoosh();
    await this.ctx.tw.to(car, { x: this.view.w + 120 }, { duration: 0.9, ease: ease.inQuad });
    if (away) {
      car.destroy({ children: true });
      this.driving = false;
      return;
    }
    car.x = -120;
    await this.ctx.tw.to(car, { x: this.light.x - 120 }, { duration: 0.8, ease: ease.outQuad });
    this.driving = false;
  }

  // Sending cars on green ---------------------------------------------------------------------

  private async tapCar(car: Car) {
    if (this.busy || this.finished || (this.plan.mode !== 'send' && this.plan.mode !== 'toy' && this.plan.mode !== 'lamps')) return;
    const answer = carTap(this.plan.mode, this.light.light, car === this.cars[0]);
    if (answer === 'toot' || answer === 'drive') {
      this.toot(car);
      if (touchCounts(this.plan.mode, answer)) this.done++;
      if (answer === 'drive') void this.drive(car);
      if (this.done >= this.plan.goal) void this.finale();
      return;
    }
    if (answer === 'send') {
      this.busy = true;
      this.cars.shift();
      this.done++;
      this.wrongs = 0;
      this.hinting = false;
      void this.drive(car, true);
      void this.ctx.say('go.zoom');
      this.addCar(this.cars.length);
      this.cars[this.cars.length - 1].x = -150;
      this.layoutCars();
      await this.ctx.tw.wait(0.5);
      this.busy = false;
      if (this.done >= this.plan.goal) void this.finale();
      return;
    }
    if (answer === 'nudge') {
      this.toot(car);
      return void this.ctx.say('go.yellow');
    }
    this.squash(car);
    this.stopMiss();
  }

  private stopMiss() {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say('go.red');
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
    }
  }

  // Red light, green light ---------------------------------------------------------------------

  private async walk() {
    if (this.busy || this.finished || !this.pet) return;
    const judge = judgeGo(this.light.light);
    if (judge === 'wait') return void this.ctx.say('go.yellow');
    if (judge === 'stop') {
      this.pet.setMood('surprised', 1);
      return this.stopMiss();
    }
    this.busy = true;
    this.done++;
    // A good step clears the hint, as a good send does: the next red tap counts toward a fresh one.
    this.wrongs = 0;
    this.hinting = false;
    this.pet.hop(1);
    sfx.animal('hop');
    const x0 = 190;
    const x1 = this.view.w - 170;
    await this.ctx.tw.to(this.pet, { x: x0 + ((x1 - x0) * this.done) / this.plan.goal }, { duration: 0.35, ease: ease.outQuad });
    this.busy = false;
    if (this.done >= this.plan.goal) {
      this.pet.cheer();
      void this.finale();
    }
  }

  // The crossing ---------------------------------------------------------------------------------

  /** Cars roll through on their road's green, one at a time, unless both roads are green. */
  private crossing(dt: number) {
    this.gap -= dt;
    if (this.gap > 0 || this.busy) return;
    if (!safe({ ns: this.light2.light, ew: this.light.light })) return;
    const type = (c: Car) => c.road;
    const front = this.light.light === 'green' ? this.cars.find((c) => type(c) !== 'ns') : this.light2.light === 'green' ? this.cars.find((c) => type(c) === 'ns') : undefined;
    if (!front) return;
    this.gap = 1.1;
    this.cars.splice(this.cars.indexOf(front), 1);
    this.done++;
    // At the crossing, mistakes count across the round (cars keep moving in between); the glow fades once traffic flows.
    this.hinting = false;
    sfx.whoosh();
    const ns = type(front) === 'ns';
    void this.ctx.tw.to(front, ns ? { y: -150 } : { x: this.view.w + 150 }, { duration: 1, ease: ease.inQuad }).then(() => front.destroy({ children: true }));
    this.layoutCars();
    // One road empty while its light is still green: a nudge to give the other road a turn.
    if (!this.cars.some((c) => (type(c) === 'ns') === ns) && this.cars.length) void this.ctx.say('go.turn');
    if (this.done >= this.plan.goal) void this.finale();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    await this.ctx.say(doneLine(this.plan.mode));
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class GoIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const l = new TrafficLight(false);
    l.set('green');
    l.scale.set(0.8);
    l.position.set(60, 0);
    const car = carArt('blue');
    car.scale.set(0.8);
    car.position.set(-50, -20);
    c.addChild(car, l);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const color = rng.pick(CAR_COLORS);
  const car = carArt(color, rng.pick(VEHICLES));
  car.y = 40;
  const l = new TrafficLight(false);
  l.set(rng.pick(['red', 'green'] as Light[]));
  l.scale.set(0.5);
  l.position.set(80, 0);
  c.addChild(car, l);
  return c;
}

export const stopAndGo: GameModule = {
  id: 'stop-and-go',
  name: 'Stop and Go',
  titleLine: 'game.stop-and-go',
  region: 'cozy-village',
  skills: ['self-control', 'colors', 'safety', 'turn-taking'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [9],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Say it together: "Red means stop! Green means go!" and freeze like statues on red.',
  offScreen: 'Play red light, green light in the hallway: walk on green, freeze on red.',
  hubIcon: () => new GoIcon(),
  sticker,
  create: (ctx) => new StopAndGo(ctx),
};
