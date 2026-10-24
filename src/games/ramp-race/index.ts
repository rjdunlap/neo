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
import {
  CARD_H,
  CARD_W,
  classifyFair,
  distance,
  fairLine,
  fairRepair,
  farther,
  FLOORS,
  HEIGHT_PX,
  HEIGHTS,
  makeQuestions,
  makeShelf,
  makeStars,
  MAX_DISTANCE,
  onStar,
  planFor,
  RAMP_W,
  RAMP_X0,
  rampTouch,
  recordOf,
  shelfLayout,
  sideOf,
  tally,
  waysTo,
  type FairQuestion,
  type RampEvent,
  type RampPlan,
  type Setup,
  type TrialRecord,
} from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 5 },
};

/** Trial Shelf card art: a mark on a card's ruler, and where the ruler and the mini ramp's foot sit. */
const CARD_MARK = 29;
const CARD_RULER = 150;
const CARD_FLOOR = 84;
const CARD_STEP = 18;

function carGraphic(color: number): Graphics {
  const g = new Graphics();
  g.roundRect(-34, -30, 68, 24, 10).fill(color).stroke({ width: 4, color: ink, alpha: 0.4 });
  g.roundRect(-18, -46, 36, 20, 8).fill(color).stroke({ width: 4, color: ink, alpha: 0.4 });
  g.circle(-18, -4, 9).circle(18, -4, 9).fill(ink).circle(-18, -4, 3).circle(18, -4, 3).fill(0xffffff);
  return g;
}

function carArt(color: number): Container {
  const c = new Container();
  c.addChild(carGraphic(color));
  return c;
}

/** Repaint a car (decorative: colors only match the card it will fill, and never change a result). */
function paintCar(c: Container, color: number) {
  c.removeChildren().forEach((ch) => ch.destroy());
  c.addChild(carGraphic(color));
}

/** A record's pennant flag: a pole standing on `y` with a triangle at its top. */
function flag(g: Graphics, x: number, y: number, tall: number, color: number) {
  g.moveTo(x, y).lineTo(x, y - tall).stroke({ width: 4, color: ink, alpha: 0.7 });
  g.poly([x, y - tall, x + tall * 0.5, y - tall * 0.8, x, y - tall * 0.6]).fill(color).stroke({ width: 3, color: ink, alpha: 0.5, join: 'round' });
}

/** A guess's paw print: a pad and four toes, a different shape from any flag. */
function paw(g: Graphics, x: number, y: number, r: number) {
  g.ellipse(x, y + r * 0.35, r, r * 0.8).fill(swatch.purple.fill);
  for (const [dx, dy] of [[-1.05, -0.55], [-0.38, -1.05], [0.38, -1.05], [1.05, -0.55]]) g.circle(x + dx * r, y + dy * r, r * 0.36).fill(swatch.purple.fill);
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
  /** Trial Shelf: each pair's first height, the cards so far, the paw she placed (in marks) and where the pair is. */
  shelfStarts: number[] = [];
  records: TrialRecord[] = [];
  guess: { side: 'before' | 'past'; at: number } | null = null;
  phase: 'first' | 'change' | 'ask' = 'first';
  /** What each pair counted, so misses and hints come from `tally`. */
  events: RampEvent[][] = [];
  ring = false;
  readonly cards: Container[] = [];
  readonly guessHit = new Container();

  private readonly backdrop: Backdrop;
  private readonly star = new Graphics();
  private readonly sign = new Container();
  private readonly glow = new Graphics();
  private readonly marks = new Graphics();
  private readonly badge = new Graphics();
  private view: View;
  private wrongs = 0;
  private hint: Setup | null = null;
  /** Fair mode: the corrective glow is on for this question (from the second unfair Check until `next()`). */
  private fairGlow = false;
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
    this.marks.eventMode = 'none';
    this.badge.eventMode = 'none';
    this.badge.visible = false;
    ctx.stage.addChild(this.marks, this.badge);
    if (this.plan.mode === 'shelf') {
      // The guess zone lies over the floor and above it, and takes touches only while she may guess.
      onTap(this.guessHit, (e) => this.placeGuess(this.guessHit.toLocal(e.global).x), { cooldown: 200 });
      this.guessHit.eventMode = 'none';
      ctx.stage.addChild(this.guessHit);
      this.shelfStarts = makeShelf(ctx.rng);
    }
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
    this.lanes.forEach((l, i) => l.layout(RAMP_X0, ys[i], v.w - 150));
    this.go.position.set(v.w - 80, v.h - 80);
    this.sign.position.set(v.w / 2 + 60, 80);
    this.drawStar();
    if (this.plan.mode === 'shelf') this.layoutShelf();
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
    if (this.fairGlow && !this.busy) this.drawFairGlow(g);
    if (this.ring && this.phase === 'ask' && !this.busy && this.records.length === 2) {
      const box = this.cardBoxes()[farther(this.records[0], this.records[1])];
      const pulse = 0.35 + 0.25 * Math.sin(this.clock * 5);
      g.roundRect(box.x - 9, box.y - 9, box.w + 18, box.h + 18, 26).stroke({ width: 8, color: swatch.yellow.fill, alpha: 0.5 + pulse });
    }
  }

  /**
   * The part of the orange lane to change next, worked out from the lanes as they are now (nothing is frozen in a
   * remembered target, so editing either lane is fine): a ghost ramp at the height to match, the floor strip, or a ring
   * around go once the pair is fair.
   */
  private drawFairGlow(g: Graphics) {
    const q = this.questions[this.index];
    const [a, b] = this.lanes;
    if (!q || !b) return;
    const pulse = 0.35 + 0.25 * Math.sin(this.clock * 5);
    const fix = fairRepair(q, a.setup, b.setup);
    if (fix === 'ramp') {
      const x0 = b.rampEnd - RAMP_W;
      const height = b.setup.height !== a.setup.height ? a.setup.height : HEIGHTS[(HEIGHTS.indexOf(b.setup.height as 2 | 3 | 4) + 1) % HEIGHTS.length];
      g.poly([x0, b.floorY, b.rampEnd, b.floorY, x0, b.floorY - height * HEIGHT_PX]).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.5 + pulse });
    } else if (fix === 'floor') {
      g.roundRect(b.rampEnd, b.floorY - 6, MAX_DISTANCE * b.unit, 46, 10).stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.4 + pulse });
    } else {
      g.circle(this.go.x, this.go.y, 74).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.5 + pulse });
    }
  }

  /** The ghost finger: change the ramp (and the floor where it can change) to what the question needs, then press go. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = rampTouch(this.plan, this.lanes.map((l) => l.setup), {
      star: this.stars[this.index],
      question: this.questions[this.index],
      rolls: this.rolls,
      records: this.records,
      guess: this.guess?.side,
    });
    if (!move) return null;
    if (move === 'go') return { tap: { on: this.go } };
    if ('card' in move) return { tap: { on: this.cards[move.card], x: CARD_W / 2, y: CARD_H / 2 } };
    if ('guess' in move) {
      // The middle of the chosen side of the blue flag, a little above the floor.
      const zone = shelfLayout(this.view, this.records[0].stop).guess[move.guess];
      return { tap: { on: this.guessHit, x: zone.x + zone.w / 2, y: this.lanes[0].floorY - 40 }, pause: 0.4 };
    }
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
    this.fairGlow = false;
    for (const l of this.lanes) l.reset();
    const mode = this.plan.mode;
    const total = mode === 'fair' ? this.questions.length : mode === 'shelf' ? this.shelfStarts.length : this.stars.length;
    if (mode !== 'explore' && this.index >= total) return void this.finale();
    if (mode === 'shelf') {
      // A fresh pair: the ramp at its start height, no cards, a blue car.
      this.lanes[0].setup = { height: this.shelfStarts[this.index], floor: 'wood' };
      this.records = [];
      this.guess = null;
      this.ring = false;
      this.phase = 'first';
      this.events[this.index] = [];
      paintCar(this.lanes[0].car, swatch.blue.fill);
    }
    this.resize(this.view);
    this.drawSign();
    this.busy = false;
    if (mode === 'explore') return this.index === 0 ? this.ctx.instruct('ramp.explore') : undefined;
    if (mode === 'shelf') return this.ctx.instruct('ramp.shelf');
    if (mode === 'fair') return this.ctx.instruct(this.questions[this.index].compare === 'floor' ? 'ramp.fair.floor' : 'ramp.fair.height');
    if (this.index === 0) return this.ctx.instruct(mode === 'height' ? 'ramp.height' : 'ramp.both');
  }

  private cycleHeight(l: Lane) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'shelf') {
      // Locked until the first card lands, so every pair really starts at 2 or 4; inert while the cards ask.
      if (this.phase === 'first') return void this.ctx.say('ramp.shelf.first');
      if (this.phase === 'ask') return;
    }
    const i = HEIGHTS.indexOf(l.setup.height as 2 | 3 | 4);
    l.setup = { ...l.setup, height: HEIGHTS[(i + 1) % HEIGHTS.length] };
    sfx.bell(3 + i, 0.2);
    l.draw();
    l.reset();
  }

  private cycleFloor(l: Lane) {
    if (this.busy || this.finished || (this.plan.mode === 'shelf' && this.phase === 'ask')) return;
    if (this.plan.mode === 'height' || this.plan.mode === 'explore' || this.plan.mode === 'shelf') return void this.ctx.say('ramp.woodonly');
    const i = FLOORS.indexOf(l.setup.floor);
    l.setup = { ...l.setup, floor: FLOORS[(i + 1) % FLOORS.length] };
    sfx.tick();
    l.draw();
  }

  private async roll() {
    if (this.busy || this.finished || (this.plan.mode === 'shelf' && this.phase === 'ask')) return;
    this.busy = true;
    const mode = this.plan.mode;
    if (mode === 'fair') return void this.fairTest();
    if (mode === 'shelf') return void this.shelfRoll();
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
    const kind = classifyFair(q, a.setup, b.setup);
    const line = fairLine(q, kind);
    if (kind === 'same') {
      // Identical lanes get a nudge, not a miss.
      await this.ctx.say(line!);
      this.busy = false;
      return;
    }
    if (line) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      await this.ctx.say(line);
      if (this.wrongs >= 2) this.hints++;
      if (this.wrongs >= 2 && !this.fairGlow) {
        // The glow turns on once per question and is never restarted or re-announced.
        this.fairGlow = true;
        await this.ctx.say('ramp.fairhint');
      }
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

  /** Trial Shelf: log an event for this pair; misses and hints are always the pairs' `tally`. */
  private count(e: RampEvent) {
    this.events[this.index].push(e);
    const counts = this.events.map(tally);
    this.misses = counts.reduce((n, c) => n + c.misses, 0);
    this.hints = counts.reduce((n, c) => n + c.hints, 0);
  }

  /** Trial Shelf: the first roll fills card A; the second, at a different height, fills card B; then the cards ask. */
  private async shelfRoll() {
    const lane = this.lanes[0];
    const second = this.phase === 'change';
    if (second && lane.setup.height === this.records[0].setup.height) {
      // The same ramp again teaches nothing new: a nudge, never a miss, and nothing rolls.
      this.count('free');
      await this.ctx.say('ramp.shelf.same');
      this.busy = false;
      return;
    }
    this.guessHit.eventMode = 'none';
    await lane.roll(this.ctx.tw);
    this.records.push(recordOf(lane.setup, second ? this.guess?.side : undefined));
    // One landing note acknowledges the stop; it never judges.
    sfx.bell(second ? 4 : 2, 0.25);
    this.drawMarks();
    await this.slideCard(this.records.length - 1);
    await this.ctx.tw.wait(0.3);
    lane.reset();
    if (!second) {
      this.phase = 'change';
      paintCar(lane.car, swatch.orange.fill);
      this.guessHit.eventMode = 'static';
      this.busy = false;
      return void this.ctx.instruct('ramp.shelf.change');
    }
    // The lane's flags and paw clear: the cards are now the only record.
    const [a, b] = this.records;
    const guess = this.guess?.side;
    this.guess = null;
    this.phase = 'ask';
    this.drawMarks();
    this.badge.visible = true;
    if (guess) {
      const side = sideOf(b.stop, a.stop);
      await this.ctx.say(guess === side ? 'ramp.guess.right' : 'ramp.guess.new', { side, guess });
    }
    this.busy = false;
    void this.ctx.instruct('ramp.shelf.ask');
  }

  /** A guess is free: a paw where she tapped, moved by the next tap, before or past the blue flag. */
  private placeGuess(x: number) {
    if (this.busy || this.finished || this.phase !== 'change' || !this.records[0]) return;
    const l = this.lanes[0];
    const at = Math.max(0, Math.min(MAX_DISTANCE, (x - l.rampEnd) / l.unit));
    this.guess = { side: sideOf(at, this.records[0].stop), at };
    this.count('free');
    sfx.tick();
    this.drawMarks();
  }

  private async tapCard(i: 0 | 1) {
    if (this.busy || this.finished || this.phase !== 'ask' || this.records.length < 2) return;
    this.busy = true;
    const [a, b] = this.records;
    const right = farther(a, b);
    const card = this.cards[i];
    if (i === right) {
      this.count('free');
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.ctx.particles.burst(card.x + CARD_W / 2, card.y + CARD_H / 2, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      // On wood the taller ramp always goes farther.
      await this.ctx.say('ramp.shelf.yay', { what: 'taller' });
      this.badge.visible = false;
      await Promise.all(this.cards.splice(0).map(async (c) => {
        await this.ctx.tw.to(c, { x: this.view.w + 40 }, { duration: 0.35, ease: ease.inQuad });
        c.destroy({ children: true });
      }));
      return void this.next();
    }
    this.count('wrong-card');
    sfx.boing();
    // Both cards replay at once: each mini car slides from its ramp to its flag.
    await Promise.all([this.ctx.say('ramp.shelf.wrong'), ...this.cards.map((c, k) => this.replayCard(c, this.records[k]))]);
    if (!this.ring && this.events[this.index].filter((e) => e === 'wrong-card').length >= 2) {
      this.ring = true;
      await this.ctx.say('ramp.shelf.hint');
    }
    this.busy = false;
  }

  private cardBoxes() {
    return shelfLayout(this.view, this.records[0]?.stop ?? 0).cards;
  }

  /** Cards sit at their slots and the guess zone over the floor; flags and the paw are redrawn from marks. */
  private layoutShelf() {
    const L = shelfLayout(this.view, this.records[0]?.stop ?? 0);
    this.cards.forEach((c, k) => c.position.set(L.cards[k].x, L.cards[k].y));
    const z = L.guess;
    this.guessHit.hitArea = new Rectangle(z.before.x, z.before.y, z.before.w + z.past.w, z.before.h);
    const g = this.badge.clear();
    const { x, y, w, h } = L.badge;
    g.roundRect(x, y, w, h, 24).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 4, color: wood.line });
    g.poly([x + 16, y + 40, x + 56, y + 40, x + 56, y + 22, x + 86, y + 50, x + 56, y + 78, x + 56, y + 60, x + 16, y + 60]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    this.drawMarks();
  }

  /** On the lane floor while she changes the ramp: each card's flag and her paw. Cleared once the cards ask. */
  private drawMarks() {
    const g = this.marks.clear();
    if (this.plan.mode !== 'shelf' || this.phase === 'ask') return;
    const l = this.lanes[0];
    this.records.forEach((r, k) => flag(g, l.rampEnd + r.stop * l.unit, l.floorY, 70, k ? swatch.orange.fill : swatch.blue.fill));
    if (this.guess) paw(g, l.rampEnd + this.guess.at * l.unit, l.floorY - 44, 18);
  }

  /** One record card: a color stripe with its car, the ramp at its height, the floor, and a ruler with the flag at the stop. */
  private cardArt(k: 0 | 1, r: TrialRecord): Container {
    const c = new Container();
    const color = k ? swatch.orange.fill : swatch.blue.fill;
    const g = new Graphics();
    g.roundRect(0, 0, CARD_W, CARD_H, 18).fill(0xffffff).stroke({ width: 5, color: wood.line });
    g.roundRect(0, 0, 46, CARD_H, 18).fill(color);
    const h = r.setup.height * CARD_STEP;
    g.poly([56, CARD_FLOOR, 126, CARD_FLOOR, 56, CARD_FLOOR - h]).fill(wood.light).stroke({ width: 3, color: wood.line, join: 'round' });
    for (let s = 1; s < r.setup.height; s++) g.moveTo(56, CARD_FLOOR - s * CARD_STEP).lineTo(66, CARD_FLOOR - s * CARD_STEP).stroke({ width: 3, color: wood.line });
    // The floor swatch carries its texture, so surfaces never depend on color alone.
    const floorColor = r.setup.floor === 'carpet' ? swatch.red.fill : r.setup.floor === 'wood' ? wood.fill : 0xbfe6fb;
    g.roundRect(126, CARD_FLOOR, CARD_W - 140, 12, 4).fill(floorColor);
    if (r.setup.floor === 'carpet') for (let x = 134; x < CARD_W - 16; x += 14) g.circle(x, CARD_FLOOR + 6, 2).fill(swatch.red.light);
    else if (r.setup.floor === 'wood') for (let x = 160; x < CARD_W - 16; x += 40) g.moveTo(x, CARD_FLOOR).lineTo(x, CARD_FLOOR + 12).stroke({ width: 2, color: wood.line });
    else for (let x = 140; x < CARD_W - 16; x += 46) g.moveTo(x, CARD_FLOOR + 10).lineTo(x + 12, CARD_FLOOR + 2).stroke({ width: 3, color: 0xffffff });
    for (let m = 0; m <= 10; m++) g.moveTo(CARD_RULER + m * CARD_MARK, CARD_FLOOR).lineTo(CARD_RULER + m * CARD_MARK, CARD_FLOOR - (m % 5 ? 6 : 12)).stroke({ width: 2, color: ink, alpha: 0.45 });
    flag(g, CARD_RULER + r.stop * CARD_MARK, CARD_FLOOR, 52, color);
    if (r.guess && this.records[0]) {
      const at = this.records[0].stop;
      const x = r.guess === 'before' ? CARD_RULER + (at * CARD_MARK) / 2 : CARD_RULER + ((at + 10) * CARD_MARK) / 2;
      // Above the flags' pennants (they reach up to y 32), so a guess never touches or looks like a record.
      paw(g, x, 16, 9);
    }
    const icon = carArt(color);
    icon.scale.set(0.5);
    icon.position.set(23, 28);
    const mini = carArt(color);
    mini.scale.set(0.38);
    mini.label = 'mini';
    mini.position.set(60, CARD_FLOOR - h);
    c.addChild(g, icon, mini);
    c.hitArea = new Rectangle(0, 0, CARD_W, CARD_H);
    onTap(c, () => void this.tapCard(k), { cooldown: 250 });
    return c;
  }

  private async slideCard(k: number) {
    const card = this.cardArt(k as 0 | 1, this.records[k]);
    const box = this.cardBoxes()[k];
    card.position.set(this.view.w + 20, box.y);
    this.cards[k] = card;
    this.ctx.stage.addChild(card);
    await this.ctx.tw.to(card, { x: box.x }, { duration: 0.4, ease: ease.outQuad });
  }

  private async replayCard(c: Container, r: TrialRecord) {
    const mini = c.getChildByLabel('mini');
    if (!mini) return;
    mini.position.set(60, CARD_FLOOR - r.setup.height * CARD_STEP);
    await this.ctx.tw.to(mini, { x: 126, y: CARD_FLOOR }, { duration: 0.3, ease: ease.inQuad });
    await this.ctx.tw.to(mini, { x: CARD_RULER + r.stop * CARD_MARK }, { duration: 0.6, ease: ease.outQuad });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    const mode = this.plan.mode;
    await this.ctx.say(mode === 'explore' ? 'ramp.done.explore' : mode === 'fair' ? 'ramp.done' : mode === 'shelf' ? 'ramp.done.shelf' : 'ramp.done.stars');
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
  coplayHint: 'Guess together before each roll: how far will the car go, and why?',
  offScreen: 'Roll a toy car down a book propped up at different heights. Does a carpet or the kitchen floor let it roll farther?',
  hubIcon: () => new RampIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RampRace(ctx),
};
