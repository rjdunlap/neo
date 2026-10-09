import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { distance, FLOORS, HEIGHTS, judgeFair, makeQuestions, makeStars, MAX_DISTANCE, onStar, planFor, rampTouch, waysTo, type FairQuestion, type RampPlan, type Setup } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 4 },
};

const HEIGHT_PX = 46;
const RAMP_W = 170;

function carArt(color: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-34, -30, 68, 24, 10).fill(color).stroke({ width: 4, color: ink, alpha: 0.4 });
  g.roundRect(-18, -46, 36, 20, 8).fill(color).stroke({ width: 4, color: ink, alpha: 0.4 });
  g.circle(-18, -4, 9).circle(18, -4, 9).fill(ink).circle(-18, -4, 3).circle(18, -4, 3).fill(0xffffff);
  c.addChild(g);
  return c;
}

/** One ramp, its floor and its car. */
class Lane extends Container {
  setup: Setup = { height: 3, floor: 'wood' };
  readonly ramp = new Container();
  readonly floorHit = new Container();
  readonly car: Container;
  private readonly art = new Graphics();
  private readonly floorArt = new Graphics();
  /** Where the floor starts and how many pixels a floor mark is. */
  rampEnd = 0;
  unit = 60;
  floorY = 0;

  constructor(color: number) {
    super();
    this.car = carArt(color);
    this.ramp.addChild(this.art);
    this.addChild(this.floorArt, this.ramp, this.floorHit, this.car);
  }

  layout(x0: number, floorY: number, right: number) {
    this.floorY = floorY;
    this.rampEnd = x0 + RAMP_W;
    this.unit = (right - this.rampEnd) / (MAX_DISTANCE + 0.6);
    this.draw();
    this.reset();
  }

  draw() {
    const h = this.setup.height * HEIGHT_PX;
    const x0 = this.rampEnd - RAMP_W;
    const a = this.art.clear();
    a.poly([x0, this.floorY, this.rampEnd, this.floorY, x0, this.floorY - h]).fill(wood.light).stroke({ width: 5, color: wood.line, join: 'round' });
    for (let k = 1; k < this.setup.height; k++) a.moveTo(x0, this.floorY - k * HEIGHT_PX).lineTo(x0 + 18, this.floorY - k * HEIGHT_PX).stroke({ width: 4, color: wood.line });
    this.ramp.hitArea = new Rectangle(x0 - 20, this.floorY - 4 * HEIGHT_PX - 30, RAMP_W + 30, 4 * HEIGHT_PX + 40);
    const f = this.floorArt.clear();
    const w = (MAX_DISTANCE + 0.6) * this.unit;
    const color = this.setup.floor === 'carpet' ? swatch.red.fill : this.setup.floor === 'wood' ? wood.fill : 0xbfe6fb;
    f.roundRect(this.rampEnd - 4, this.floorY, w + 8, 34, 8).fill(color).stroke({ width: 4, color: ink, alpha: 0.25 });
    if (this.setup.floor === 'carpet') for (let x = this.rampEnd + 10; x < this.rampEnd + w; x += 22) f.circle(x, this.floorY + 17, 3).fill(swatch.red.light);
    else if (this.setup.floor === 'wood') for (let x = this.rampEnd + 60; x < this.rampEnd + w; x += 80) f.moveTo(x, this.floorY).lineTo(x, this.floorY + 34).stroke({ width: 3, color: wood.line });
    else for (let x = this.rampEnd + 30; x < this.rampEnd + w; x += 90) f.moveTo(x, this.floorY + 26).lineTo(x + 26, this.floorY + 8).stroke({ width: 4, color: 0xffffff });
    // Floor marks, one per unit.
    for (let k = 0; k <= MAX_DISTANCE; k++) f.moveTo(this.rampEnd + k * this.unit, this.floorY + 34).lineTo(this.rampEnd + k * this.unit, this.floorY + 44).stroke({ width: 3, color: ink, alpha: 0.4 });
    this.floorHit.hitArea = new Rectangle(this.rampEnd, this.floorY - 10, w, 70);
  }

  /** The car waits at the top of the ramp. */
  reset() {
    const x0 = this.rampEnd - RAMP_W;
    this.car.position.set(x0 + 30, this.floorY - this.setup.height * HEIGHT_PX + 30 * (this.setup.height * HEIGHT_PX / RAMP_W));
    this.car.rotation = Math.atan2(this.setup.height * HEIGHT_PX, RAMP_W);
  }

  /** Down the ramp, then gliding to a stop. */
  async roll(tw: GameContext['tw']) {
    const d = distance(this.setup.height, this.setup.floor);
    sfx.whoosh();
    await tw.to(this.car, { x: this.rampEnd, y: this.floorY }, { duration: 0.35 + this.setup.height * 0.05, ease: ease.inQuad });
    this.car.rotation = 0;
    await tw.to(this.car, { x: this.rampEnd + d * this.unit }, { duration: 0.4 + d * 0.12, ease: ease.outQuad });
    return d;
  }
}

class RampRace implements Game {
  readonly plan: RampPlan;
  readonly lanes: Lane[] = [];
  readonly go: RoundButton;
  index = -1;
  rolls = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  stars: number[] = [];
  questions: FairQuestion[] = [];

  private readonly backdrop: Backdrop;
  private readonly star = new Graphics();
  private readonly sign = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hint: Setup | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0xcde6ff, 0xf6fbff], hills: [0xd6f5c8, 0xc8ecb0], horizon: 0.4, clouds: 2, sun: true, seed: 95 }, ctx.view);
    this.glow.eventMode = 'none';
    this.star.eventMode = 'none';
    this.sign.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.sign);
    const two = this.plan.mode === 'fair';
    for (const color of two ? [swatch.blue.fill, swatch.orange.fill] : [swatch.blue.fill]) {
      const lane = new Lane(color);
      if (this.plan.mode === 'height') lane.setup = { height: 2, floor: 'wood' };
      onTap(lane.ramp, () => this.cycleHeight(lane), { cooldown: 250 });
      onTap(lane.floorHit, () => this.cycleFloor(lane), { cooldown: 250 });
      this.lanes.push(lane);
      ctx.stage.addChild(lane);
    }
    this.go = new RoundButton(playIcon(), swatch.green, 60, () => void this.roll());
    ctx.stage.addChild(this.star, this.glow, this.go);
    if (this.plan.mode === 'height' || this.plan.mode === 'both') this.stars = makeStars(this.plan, ctx.rng);
    if (this.plan.mode === 'fair') this.questions = makeQuestions(ctx.rng, this.plan.rounds);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const ys = this.lanes.length === 2 ? [v.h * 0.42, v.h * 0.78] : [v.h * 0.66];
    this.lanes.forEach((l, i) => l.layout(150, ys[i], v.w - 150));
    this.go.position.set(v.w - 80, v.h - 80);
    this.sign.position.set(v.w / 2 + 60, 80);
    this.drawStar();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.hint && !this.busy) {
      // A ghost ramp at the suggested height, and the floor to choose.
      const l = this.lanes[0];
      const x0 = l.rampEnd - RAMP_W;
      const pulse = 0.35 + 0.25 * Math.sin(this.clock * 5);
      g.poly([x0, l.floorY, l.rampEnd, l.floorY, x0, l.floorY - this.hint.height * HEIGHT_PX]).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.5 + pulse });
      if (this.hint.floor !== l.setup.floor) g.roundRect(l.rampEnd, l.floorY - 6, MAX_DISTANCE * l.unit, 46, 10).stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.4 + pulse });
    }
  }

  /** The ghost finger: change the ramp (and the floor where it can change) to what the question needs, then press go. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = rampTouch(this.plan, this.lanes.map((l) => l.setup), { star: this.stars[this.index], question: this.questions[this.index], rolls: this.rolls });
    if (!move) return null;
    if (move === 'go') return { tap: { on: this.go } };
    const lane = this.lanes[move.lane];
    // The hand lands on the slope near its foot, or on the floor strip, in the lane's own coordinates.
    return move.change === 'ramp'
      ? { tap: { on: lane.ramp, x: lane.rampEnd - RAMP_W + 40, y: lane.floorY - 25 }, pause: 0.3 }
      : { tap: { on: lane.floorHit, x: lane.rampEnd + 90, y: lane.floorY + 14 }, pause: 0.3 };
  }

  destroy() {}

  private drawStar() {
    const g = this.star.clear();
    const s = this.stars[this.index];
    if (s === undefined || this.plan.mode === 'fair' || this.plan.mode === 'explore') return;
    const l = this.lanes[0];
    const x = l.rampEnd + s * l.unit;
    g.poly(starPoints(26, 11).map((n, i) => n + (i % 2 ? l.floorY - 60 : x))).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    g.moveTo(x, l.floorY - 30).lineTo(x, l.floorY).stroke({ width: 4, color: swatch.yellow.line });
  }

  private drawSign() {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const q = this.questions[this.index];
    if (!q) return;
    const g = new Graphics().roundRect(-170, -50, 340, 100, 26).fill(0xffffff).stroke({ width: 5, color: wood.line });
    if (q.compare === 'floor') {
      for (const [x, color] of [[-90, swatch.red.fill], [0, wood.fill], [90, 0xbfe6fb]] as const) g.roundRect(x - 34, -22, 68, 44, 10).fill(color).stroke({ width: 3, color: ink, alpha: 0.3 });
    } else {
      for (const [x, h] of [[-80, 20], [10, 34], [100, 48]]) g.poly([x - 30, 26, x + 30, 26, x - 30, 26 - h]).fill(wood.light).stroke({ width: 3, color: wood.line, join: 'round' });
    }
    this.sign.addChild(g);
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hint = null;
    for (const l of this.lanes) l.reset();
    const mode = this.plan.mode;
    if (mode !== 'explore' && this.index >= (mode === 'fair' ? this.questions.length : this.stars.length)) return void this.finale();
    this.resize(this.view);
    this.drawSign();
    this.busy = false;
    if (mode === 'explore') return this.index === 0 ? this.ctx.instruct('ramp.explore') : undefined;
    if (mode === 'fair') return this.ctx.instruct(this.questions[this.index].compare === 'floor' ? 'ramp.fair.floor' : 'ramp.fair.height');
    if (this.index === 0) return this.ctx.instruct(mode === 'height' ? 'ramp.height' : 'ramp.both');
  }

  private cycleHeight(l: Lane) {
    if (this.busy || this.finished) return;
    const i = HEIGHTS.indexOf(l.setup.height as 2 | 3 | 4);
    l.setup = { ...l.setup, height: HEIGHTS[(i + 1) % HEIGHTS.length] };
    sfx.bell(3 + i, 0.2);
    l.draw();
    l.reset();
  }

  private cycleFloor(l: Lane) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'height' || this.plan.mode === 'explore') return void this.ctx.say('ramp.woodonly');
    const i = FLOORS.indexOf(l.setup.floor);
    l.setup = { ...l.setup, floor: FLOORS[(i + 1) % FLOORS.length] };
    sfx.tick();
    l.draw();
  }

  private async roll() {
    if (this.busy || this.finished) return;
    this.busy = true;
    const mode = this.plan.mode;
    if (mode === 'fair') return void this.fairTest();
    const d = await this.lanes[0].roll(this.ctx.tw);
    if (mode === 'explore') {
      this.rolls++;
      await this.ctx.say('ramp.went', { n: Math.round(d * 10) / 10 });
      if (this.rolls >= this.plan.rounds) return void this.finale();
      await this.ctx.tw.wait(0.4);
      this.lanes[0].reset();
      this.busy = false;
      return;
    }
    const star = this.stars[this.index];
    if (onStar(d, star)) {
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.ctx.particles.burst(this.lanes[0].car.x, this.lanes[0].car.y - 40, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      await this.ctx.say('ramp.yay');
      return void this.next();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const short = d < star;
    await this.ctx.say(mode === 'height' ? (short ? 'ramp.short' : 'ramp.long') : short ? 'ramp.short2' : 'ramp.long2');
    if (this.wrongs >= 2 && !this.hint) {
      this.hints++;
      this.hint = waysTo(star, mode === 'height' ? ['wood'] : FLOORS)[0];
      void this.ctx.say('ramp.hint');
    }
    this.lanes[0].reset();
    this.busy = false;
  }

  private async fairTest() {
    const q = this.questions[this.index];
    const [a, b] = this.lanes;
    const verdict = judgeFair(q, a.setup, b.setup);
    if (verdict === 'same') {
      await this.ctx.say(q.compare === 'floor' ? 'ramp.same.floor' : 'ramp.same.height');
      this.busy = false;
      return;
    }
    if (verdict === 'unfair') {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      await this.ctx.say(q.compare === 'floor' ? 'ramp.unfair.floor' : 'ramp.unfair.height');
      if (this.wrongs >= 2) this.hints++;
      this.busy = false;
      return;
    }
    const [da, db] = await Promise.all([a.roll(this.ctx.tw), b.roll(this.ctx.tw)]);
    const winner = da > db ? a : b;
    sfx.sparkle();
    this.ctx.particles.burst(winner.car.x, winner.car.y - 40, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    const what = q.compare === 'floor' ? winner.setup.floor : winner.setup.height === Math.max(a.setup.height, b.setup.height) ? 'taller ramp' : 'shorter ramp';
    await this.ctx.say('ramp.fairyay', { what });
    await this.ctx.tw.wait(0.4);
    // Back to the same start for the next question.
    for (const l of this.lanes) l.setup = { height: 3, floor: 'wood' };
    return void this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    await this.ctx.say('ramp.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class RampIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().poly([-110, -20, 30, -20, -110, -140]).fill(wood.light).stroke({ width: 5, color: wood.line, join: 'round' }).roundRect(30, -20, 90, 16, 6).fill(0xbfe6fb));
    const car = carArt(swatch.blue.fill);
    car.position.set(70, -20);
    c.addChild(car);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().poly([-90, 60, 40, 60, -90, -60]).fill(wood.light).stroke({ width: 6, color: wood.line, join: 'round' }));
  const car = carArt(rng.pick([swatch.blue.fill, swatch.orange.fill, swatch.pink.fill]));
  car.scale.set(1.4);
  car.position.set(80, 60);
  c.addChild(car);
  return c;
}

export const rampRace: GameModule = {
  id: 'ramp-race',
  name: 'Ramp Race',
  titleLine: 'game.ramp-race',
  region: 'tinker-lab',
  skills: ['science', 'fair-tests', 'predicting', 'measuring'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Guess together before each roll: "Will it reach the star? Too far? Too short?"',
  offScreen: 'Roll a toy car down a book propped up at different heights. Does a carpet or the kitchen floor let it roll farther?',
  hubIcon: () => new RampIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RampRace(ctx),
};
