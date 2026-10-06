import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { judgeGo, lightAt, nextLight, planFor, safe, type GoPlan, type Light } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
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

/** A round little car with a face on its windshield. */
function carArt(color: ColorName): Container {
  const c = new Container();
  const sw = swatch[color];
  const g = new Graphics();
  g.roundRect(-70, -40, 140, 50, 18).fill(sw.fill).stroke({ width: 5, color: sw.line });
  g.roundRect(-40, -78, 76, 44, 16).fill(sw.fill).stroke({ width: 5, color: sw.line });
  g.roundRect(-30, -70, 56, 30, 10).fill(0xdff3ff);
  g.circle(-14, -56, 5).circle(10, -56, 5).fill(ink);
  g.moveTo(-12, -46).quadraticCurveTo(-2, -40, 8, -46).stroke({ width: 3, color: ink, cap: 'round' });
  for (const x of [-40, 40]) g.circle(x, 12, 18).fill(ink).circle(x, 12, 7).fill(0xdfe3ea);
  g.circle(66, -20, 7).fill(swatch.yellow.light);
  c.addChild(g);
  return c;
}

class StopAndGo implements Game {
  readonly plan: GoPlan;
  readonly light = new TrafficLight();
  /** The crossing's second light, for the up-and-down road. */
  readonly light2 = new TrafficLight();
  readonly cars: Container[] = [];
  readonly step: RoundButton;
  /** Cars sent, steps taken, or cars through the crossing. */
  done = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  pet: Critter | null = null;

  private readonly backdrop: Backdrop;
  private readonly road = new Graphics();
  /** Cars drive under the traffic lights. */
  private readonly carLayer = new Container();
  private readonly flag = new Graphics();
  private readonly glow = new Graphics();
  private view: View;
  private clock = 0;
  private wrongs = 0;
  private hinting = false;
  private driving = false;
  /** Crossing: seconds until the next car may roll through. */
  private gap = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 66 }, ctx.view);
    this.glow.eventMode = 'none';
    this.step = new RoundButton(this.feet(), swatch.green, 64, () => void this.walk());
    this.step.visible = this.plan.mode === 'walk';
    ctx.stage.addChild(this.backdrop, this.road, this.flag, this.carLayer);
    onTap(this.light, () => this.tapLight(this.light), { cooldown: 300 });
    onTap(this.light2, () => this.tapLight(this.light2), { cooldown: 300 });
    this.light2.visible = this.plan.mode === 'cross';
    if (this.plan.mode === 'walk') {
      this.pet = new Critter(ctx.petSpec);
      this.pet.scale.set(0.5);
      ctx.track(this.pet);
      ctx.stage.addChild(this.pet);
    } else {
      const n = this.plan.mode === 'cross' ? this.plan.goal : this.plan.mode === 'send' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const car = this.addCar(i);
        // The crossing: half the cars wait on each road, so both roads need a turn.
        if (this.plan.mode === 'cross') (car as Container & { road?: string }).road = i % 2 ? 'ns' : 'ew';
      }
    }
    ctx.stage.addChild(this.light, this.light2, this.glow, this.step);
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
    const car = carArt(CAR_COLORS[(i + this.done) % CAR_COLORS.length]);
    car.hitArea = new Rectangle(-80, -90, 160, 120);
    onTap(car, () => void this.tapCar(car), { cooldown: 300 });
    this.cars.push(car);
    this.carLayer.addChild(car);
    return car;
  }

  start() {
    this.layoutCars(true);
    this.busy = false;
    const line = { toy: 'go.toy', send: 'go.send', walk: 'go.walk', cross: 'go.cross' } as const;
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
      const [a, b] = [this.cars.filter((c) => (c as Container & { road?: string }).road !== 'ns'), this.cars.filter((c) => (c as Container & { road?: string }).road === 'ns')];
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
      const l = lightAt(this.clock);
      if (l !== this.light.light) {
        this.light.set(l);
        if (l === 'green') sfx.tick();
      }
    }
    if (this.plan.mode === 'cross' && !this.finished) this.crossing(dt);
    const g = this.glow.clear();
    const ring = (t: TrafficLight) => {
      const b = t.getBounds();
      g.roundRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20, 24).stroke({ width: 7 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.light });
    };
    if (this.hinting && this.light.light === 'green' && this.plan.mode !== 'cross') ring(this.light);
    // At the crossing, glow a green light whose road has fewer cars waiting: that one should turn red.
    if (this.hinting && this.plan.mode === 'cross' && this.light.light === 'green' && this.light2.light === 'green') {
      const ns = this.cars.filter((c) => (c as Container & { road?: string }).road === 'ns').length;
      ring(ns < this.cars.length - ns ? this.light2 : this.light);
    }
  }

  destroy() {}

  // Toy ------------------------------------------------------------------------------------

  private tapLight(t: TrafficLight) {
    if (this.finished) return;
    if (this.plan.mode === 'toy') {
      t.set(nextLight(t.light));
      sfx.bell(t.light === 'green' ? 9 : t.light === 'yellow' ? 7 : 4, 0.25);
      this.done++;
      if (t.light === 'green') void this.drive(this.cars[0]);
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

  /** A car zooms off to the right, then comes back round to wait again (toy level). */
  private async drive(car: Container, away = false) {
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

  private async tapCar(car: Container) {
    if (this.busy || this.finished || this.plan.mode !== 'send' || car !== this.cars[0]) return;
    const judge = judgeGo(this.light.light);
    if (judge === 'go') {
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
    if (judge === 'wait') return void this.ctx.say('go.yellow');
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
    const type = (c: Container) => (c as Container & { road?: string }).road;
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
    await this.ctx.say('go.done');
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
  const car = carArt(rng.pick(CAR_COLORS));
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
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'Say it together: "Red means stop! Green means go!" and freeze like statues on red.',
  offScreen: 'Play red light, green light in the hallway: walk on green, freeze on red.',
  hubIcon: () => new GoIcon(),
  sticker,
  create: (ctx) => new StopAndGo(ctx),
};
