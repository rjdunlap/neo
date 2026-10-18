import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { acceptsTap, makeNight, makeRequests, COLORS, NAMES, noteFor, planFor, ROOM_NAMES, SLOTS, thingToTap, isLight, type NightPlan, type NightRoom, type Thing } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
  prek: { min: 5, max: 10 },
};

const WALL = 0x9fb8e8;
const NIGHT = 0x1d2350;

/** Two eyes, open or sleepy, for the things that aren't critters. */
function eyes(g: Graphics, x: number, y: number, open: boolean, size = 7) {
  for (const dx of [-size * 2, size * 2]) {
    if (open) g.circle(x + dx, y, size).fill(ink);
    else g.moveTo(x + dx - size, y).quadraticCurveTo(x + dx, y + size, x + dx + size, y).stroke({ width: 4, color: ink, cap: 'round' });
  }
}

/** A thing in the room that can be told goodnight. */
class Sleeper extends Container {
  asleep = false;
  /** Where a finger points: the middle of what can be tapped, in this thing's own units. */
  mid = 0;
  private readonly critter: Critter | null = null;
  private readonly art = new Graphics();
  private readonly glow = new Graphics();
  private clock = Math.random() * 5;

  constructor(readonly thing: Thing, private readonly colorRound = false) {
    super();
    const critters: Partial<Record<Thing, keyof typeof CRITTERS>> = { teddy: 'bear', kitten: 'cat', puppy: 'dog', cow: 'cow', pig: 'pig', duck: 'duck', bunny: 'bunny', cat: 'cat' };
    const kind = critters[thing];
    if (kind) {
      this.critter = new Critter(CRITTERS[kind]);
      this.critter.scale.set(0.46);
      this.addChild(this.critter);
      this.hitArea = new Circle(0, -60, 80);
      this.mid = -60;
    } else {
      this.addChild(this.glow, this.art);
      this.hitArea = thing === 'lamp' ? new Rectangle(-75, -260, 150, 270) : new Circle(0, 0, 75);
      this.mid = thing === 'lamp' ? -140 : 0;
    }
    this.drawArt();
  }

  private drawArt() {
    const g = this.art.clear();
    const open = !this.asleep;
    if (this.thing === 'lantern') {
      g.roundRect(-45, -60, 90, 120, 12).fill(open ? swatch.yellow.light : wood.light).stroke({ width: 7, color: wood.line });
      g.roundRect(-25, -85, 50, 25, 10).stroke({ width: 6, color: wood.line });
      g.rect(-52, 50, 104, 12).rect(-52, -62, 104, 12).fill(wood.line);
      eyes(g, 0, 0, open, 6);
      this.glow.clear();
      if (open) this.glow.circle(0, 0, 100).fill({ color: swatch.yellow.light, alpha: 0.25 });
    } else if (this.thing === 'lamp') {
      g.rect(-6, -170, 12, 170).fill(wood.line).ellipse(0, 0, 44, 12).fill(wood.line);
      g.poly([-60, -170, 60, -170, 36, -250, -36, -250]).fill(this.asleep ? 0xd9c38a : swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
      eyes(g, 0, -205, open, 6);
      this.glow.clear();
      if (open) this.glow.ellipse(0, -120, 120, 90).fill({ color: 0xfff3a0, alpha: 0.35 });
    } else if (this.thing === 'campfire') {
      g.ellipse(0, 42, 65, 18).fill(wood.line);
      g.moveTo(-44, 35).lineTo(42, 56).moveTo(-42, 56).lineTo(44, 35).stroke({ width: 14, color: wood.fill, cap: 'round' });
      // A sleeping fire banks down to warm coals; the lantern is the tent's one light.
      if (open) {
        g.poly([-48, 30, -35, -20, -15, -5, 0, -68, 28, -15, 40, -28, 52, 30]).fill(swatch.orange.fill);
        g.poly([-22, 30, -12, 0, 0, -30, 25, 30]).fill(swatch.yellow.fill);
      } else g.ellipse(0, 32, 30, 8).fill(swatch.orange.line);
      eyes(g, 0, 20, open, 5);
    } else if (this.thing === 'pot') {
      g.roundRect(-46, -35, 92, 76, 20).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
      g.roundRect(-62, -22, 124, 22, 10).stroke({ width: 6, color: swatch.blue.line });
      g.ellipse(0, -36, 50, 12).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line });
      g.circle(0, -51, 10).fill(swatch.blue.line);
      eyes(g, 0, 10, open, 6);
    } else if (this.thing === 'anchor') {
      g.circle(0, -44, 17).stroke({ width: 10, color: swatch.blue.line });
      g.moveTo(0, -27).lineTo(0, 52).moveTo(-32, -6).lineTo(32, -6)
        .moveTo(-52, 16).quadraticCurveTo(-48, 52, 0, 52).quadraticCurveTo(48, 52, 52, 16)
        .stroke({ width: 12, color: swatch.blue.line, cap: 'round' });
      g.poly([-63, 28, -52, 6, -38, 28]).poly([38, 28, 52, 6, 63, 28]).fill(swatch.blue.line);
      eyes(g, 0, 23, open, 4);
    } else if (this.thing === 'clock') {
      g.circle(0, 0, 62).fill(0xffffff).stroke({ width: 8, color: wood.line });
      g.moveTo(0, 0).lineTo(0, -38).moveTo(0, 0).lineTo(26, 10).stroke({ width: 6, color: ink, cap: 'round' });
      eyes(g, 0, 26, open, 6);
    } else if (this.thing === 'fish') {
      g.roundRect(-80, 52, 160, 20, 6).fill(this.colorRound ? swatch.blue.fill : wood.fill).stroke({ width: 4, color: this.colorRound ? swatch.blue.line : wood.line });
      g.circle(0, 0, 58).fill({ color: 0xcde6ff, alpha: 0.85 }).stroke({ width: 5, color: swatch.blue.line });
      g.ellipse(4, 6, 24, 15).fill(swatch.orange.fill).poly([24, 6, 42, -6, 42, 18]).fill(swatch.orange.fill);
      if (open) g.circle(-8, 2, 4).fill(ink);
      else g.moveTo(-13, 2).lineTo(-3, 2).stroke({ width: 3, color: ink, cap: 'round' });
    }
  }

  sleep() {
    this.asleep = true;
    if (this.critter) this.critter.setMood('sleepy');
    this.drawArt();
  }

  update(dt: number) {
    this.clock += dt;
    this.critter?.update(dt);
    if (!this.critter && !this.asleep) this.art.rotation = 0.02 * Math.sin(this.clock * 2);
  }
}

/** The big arrow that leads a tour on to the next room: no words, a tap anywhere on it. */
class TourArrow extends Container {
  private clock = 0;
  constructor() {
    super();
    this.addChild(new Graphics()
      .circle(0, 0, 95).fill({ color: swatch.yellow.light, alpha: 0.9 }).stroke({ width: 8, color: swatch.yellow.line })
      .poly([-55, -22, 5, -22, 5, -55, 62, 0, 5, 55, 5, 22, -55, 22]).fill(swatch.yellow.fill).stroke({ width: 6, color: wood.line, join: 'round' }));
    this.hitArea = new Circle(0, 0, 105);
    this.visible = false;
  }

  update(dt: number) {
    this.clock += dt;
    this.scale.set(1 + 0.06 * Math.sin(this.clock * 4));
  }
}

class GoodnightRoom implements Game {
  readonly plan: NightPlan;
  readonly requests: Thing[][];
  /** The friends in the room this round, in the order they are drawn. */
  friends: Thing[];
  setting: NightRoom;
  /** The rooms of this round; a level-10 tour visits three, one after another. */
  readonly tour: NightRoom[];
  /** Which room of the tour she is in. */
  stop = 0;
  readonly targetCount: number;
  readonly color: string | null;
  sleepers: Sleeper[] = [];
  readonly arrow = new TourArrow();
  index = -1;
  /** Within a two-step request, how many are done. */
  step = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly room = new Graphics();
  private readonly sky = new Graphics();
  private readonly dark = new Graphics();
  private readonly friendLayer = new Container();
  /** Darkens the whole screen while a tour walks to the next room. */
  private readonly curtain = new Graphics();
  private readonly glow = new Graphics();
  private readonly tally = label('', 38, ink);
  private readonly dots = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Sleeper | null = null;
  private clock = 0;
  private stars = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const night = makeNight(this.plan, ctx.rng);
    this.friends = night.room;
    this.setting = night.setting;
    this.tour = night.tour;
    this.targetCount = night.targetCount;
    this.color = night.color;
    this.requests = makeRequests(this.plan, ctx.rng, this.friends, this.color);
    this.dark.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.curtain.eventMode = 'none';
    this.curtain.alpha = 0;
    ctx.stage.addChild(this.room, this.sky, this.friendLayer);
    this.placeFriends(night.asleep);
    ctx.stage.addChild(this.dark, this.glow);
    this.tally.eventMode = this.dots.eventMode = 'none';
    this.tally.visible = this.dots.visible = this.plan.mode === 'count';
    ctx.stage.addChild(this.tally, this.dots, this.curtain, this.arrow);
    onTap(this.arrow, () => void this.walkOn(), { cooldown: 600 });
    ctx.track(this.arrow);
    this.drawCount();
    this.stars = night.asleep.length * 3;
  }

  /** Put this room's friends in their slots, replacing the last room's on a tour. */
  private placeFriends(asleep: readonly Thing[] = []) {
    for (const s of this.sleepers) {
      this.ctx.untrack(s);
      s.destroy({ children: true });
    }
    this.sleepers = [];
    for (const thing of this.friends) {
      const s = new Sleeper(thing, this.plan.mode === 'color');
      if (asleep.includes(thing)) s.sleep();
      onTap(s, () => void this.tap(s), { cooldown: 400 });
      this.ctx.track(s);
      this.sleepers.push(s);
      this.friendLayer.addChild(s);
    }
  }

  /** Friends asleep so far on the whole tour (or in the one room). */
  private asleepSoFar() {
    const before = this.tour.slice(0, this.stop).reduce((n, room) => n + room.friends.length, 0);
    return before + this.sleepers.filter(x => x.asleep).length;
  }

  /** The arrow was tapped: the room goes dark, the next room's friends wait awake, and the voice names it. */
  private async walkOn() {
    if (!this.arrow.visible || this.busy || this.finished) return;
    this.busy = true;
    this.arrow.visible = false;
    sfx.bell(6, 0.2);
    await this.ctx.tw.to(this.curtain, { alpha: 1 }, { duration: 0.6 });
    this.stop++;
    this.setting = this.tour[this.stop];
    this.friends = [...this.setting.friends];
    this.placeFriends();
    this.resize(this.view);
    await this.ctx.tw.to(this.curtain, { alpha: 0 }, { duration: 0.6 });
    this.busy = false;
    return this.ctx.instruct('night.tourRoom', { room: ROOM_NAMES[this.setting.id] });
  }

  start() {
    void this.next();
  }

  /** Where each thing sits, as fractions of the room. */
  private spot(thing: Thing) {
    const v = this.view;
    const slot = this.setting.friends.findIndex(t => t === thing);
    const [x, y] = SLOTS[slot];
    return { x: v.w * x, y: v.h * y };
  }

  resize(v: View) {
    this.view = v;
    const floor = v.h * 0.7;
    this.room.clear().rect(0, 0, v.w, floor).fill(this.setting.id === 'barn' ? wood.light : WALL).rect(0, floor, v.w, v.h - floor).fill(wood.light);
    for (let x = 0; x < v.w; x += 90) this.room.moveTo(x, floor).lineTo(x, v.h).stroke({ width: 2, color: wood.fill, alpha: 0.6 });
    this.room.ellipse(v.w * 0.55, v.h * 0.9, 300, 50).fill({ color: swatch.pink.light, alpha: 0.8 });
    if (this.setting.id === 'barn') {
      for (let x = 0; x < v.w; x += 110) this.room.moveTo(x, 0).lineTo(x, floor).stroke({ width: 4, color: wood.fill });
      this.room.roundRect(v.w * 0.55, v.h * 0.47, v.w * 0.22, 20, 6).fill(wood.line);
      for (const [x, y] of SLOTS.filter((_, i) => i !== 3)) this.room.ellipse(v.w * x, v.h * y + 4, 70, 18).fill(swatch.yellow.light);
    }
    if (this.setting.id === 'tent') {
      this.room.rect(0, 0, v.w, floor).fill(swatch.green.light);
      this.room.poly([0, floor, v.w * 0.5, 0, v.w, floor]).fill(swatch.yellow.light)
        .stroke({ width: 8, color: swatch.green.line });
      this.room.moveTo(v.w * 0.5, 0).lineTo(v.w * 0.5, floor).stroke({ width: 4, color: wood.fill });
      this.room.roundRect(v.w * 0.55, v.h * 0.46 + 44, v.w * 0.22, 16, 6).fill(wood.line);
      for (const i of [0, 1, 2]) {
        const [x, y] = SLOTS[i];
        this.room.roundRect(v.w * x - 65, v.h * y - 15, 130, 40, 18).fill(swatch.green.fill);
      }
    } else if (this.setting.id === 'boat') {
      this.room.rect(0, 0, v.w, floor).fill(wood.light);
      for (let y = 20; y < floor; y += 65) this.room.moveTo(0, y).lineTo(v.w, y).stroke({ width: 3, color: wood.fill });
      this.room.roundRect(v.w * 0.14, v.h * 0.87, v.w * 0.34, 30, 12).fill(swatch.blue.fill);
    }
    this.drawSky();
    for (const s of this.sleepers) {
      const p = this.spot(s.thing);
      s.position.set(p.x, p.y);
    }
    this.drawDark();
    this.curtain.clear().rect(0, 0, v.w, v.h).fill(NIGHT);
    this.arrow.position.set(v.w * 0.5, v.h * 0.56);
    this.tally.position.set(v.w / 2, 65);
    this.dots.position.set(v.w / 2, 110);
  }

  private drawCount() {
    if (this.plan.mode !== 'count') return;
    const count = this.sleepers.filter(s => s.asleep).length;
    this.tally.text = `${count} / ${this.targetCount}`;
    this.dots.clear();
    for (let i = 0; i < this.targetCount; i++) {
      this.dots.circle((i - (this.targetCount - 1) / 2) * 32, 0, 10)
        .fill(i < count ? swatch.yellow.fill : wood.light).stroke({ width: 3, color: wood.line });
    }
  }

  /** The window: evening, then a night sky with the moon and as many stars as friends asleep. */
  private drawSky() {
    const v = this.view;
    const x = v.w - 260;
    const g = this.sky.clear();
    const boat = this.setting.id === 'boat';
    if (boat) {
      g.circle(x + 100, 140, 100).fill(swatch.yellow.fill).stroke({ width: 6, color: wood.line });
      g.circle(x + 100, 140, 86).fill(this.stars ? NIGHT : swatch.blue.line);
      for (const [dx, dy] of [[0, -92], [92, 0], [0, 92], [-92, 0]]) g.circle(x + 100 + dx, 140 + dy, 4).fill(wood.line);
    } else {
      g.roundRect(x - 10, 50, 220, 180, 16).fill(wood.fill);
      g.roundRect(x, 60, 200, 160, 10).fill(this.stars ? NIGHT : 0x6f86c9);
    }
    g.circle(x + 150, 110, 28).fill(swatch.yellow.light).circle(x + 162, 102, 24).fill(this.stars ? NIGHT : boat ? swatch.blue.line : 0x6f86c9);
    for (let i = 0; i < this.stars; i++) {
      const angle = i * 2.4;
      const radius = 28 + (i * 17) % 40;
      const sx = boat ? x + 100 + Math.cos(angle) * radius : x + 20 + ((i * 53) % 110);
      const sy = boat ? 140 + Math.sin(angle) * radius : 80 + ((i * 37) % 110);
      g.poly(starPoints(9, 4).map((n, k) => n + (k % 2 ? sy : sx))).fill(swatch.yellow.fill);
    }
    if (!boat) g.rect(x + 97, 60, 6, 160).rect(x, 137, 200, 6).fill(wood.fill);
  }

  private drawDark() {
    const asleep = this.sleepers.filter((s) => s.asleep).length;
    this.dark.clear().rect(0, 0, this.view.w, this.view.h).fill({ color: NIGHT, alpha: (0.32 * asleep) / this.sleepers.length });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const b = this.glowing.getBounds();
      g.roundRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20, 30).stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
  }

  /** The ghost finger on the how-to card: say goodnight to each friend, or to the one named and then the next. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.arrow.visible) return { tap: { on: this.arrow } };
    const asleep = new Set(this.sleepers.filter((s) => s.asleep).map((s) => s.thing));
    const thing = thingToTap(this.plan, this.requests[this.index], this.step, asleep, this.friends, this.targetCount);
    const sleeper = this.sleepers.find((s) => s.thing === thing);
    return sleeper ? { tap: { on: sleeper, y: sleeper.mid } } : null;
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.step = 0;
    this.wrongs = 0;
    this.glowing = null;
    if (this.plan.mode === 'count') {
      this.busy = false;
      return this.ctx.instruct('night.count', { n: this.targetCount });
    }
    if (this.plan.mode === 'all') {
      this.busy = false;
      return this.ctx.instruct('night.all');
    }
    if (this.plan.mode === 'tour') {
      this.busy = false;
      return this.ctx.instruct('night.tour', { room: ROOM_NAMES[this.setting.id] });
    }
    const r = this.requests[this.index];
    if (!r) {
      // Friends left settle together; an exception round keeps its night-light awake.
      for (const s of this.sleepers.filter((x) => !x.asleep && (this.plan.mode !== 'except' || !isLight(x.thing)))) await this.goodnight(s, false);
      return void this.finale();
    }
    this.busy = false;
    if (this.plan.mode === 'except') return this.ctx.instruct('night.except', { light: NAMES[this.friends.find(isLight)!] });
    if (this.plan.mode === 'named') return this.ctx.instruct('night.named', { who: NAMES[r[0]] });
    if (this.plan.mode === 'color') return this.ctx.instruct('night.color', { color: this.color! });
    if (this.plan.mode === 'animals') return this.ctx.instruct('night.animals');
    if (this.plan.mode === 'lightLast') return this.ctx.instruct('night.lightLast', { light: NAMES[r[r.length - 1]] });
    return this.ctx.instruct('night.two', { a: NAMES[r[0]], b: NAMES[r[1]] });
  }

  private async goodnight(s: Sleeper, speak = true) {
    s.sleep();
    sfx.bell(noteFor(s.thing, this.setting), 0.25);
    this.stars = this.plan.mode === 'tour' ? this.asleepSoFar() * 2 : this.sleepers.filter((x) => x.asleep).length * 3;
    this.drawSky();
    this.drawDark();
    // A little "z" floats up.
    const z = label('z', 34, 0xffffff);
    const b = s.getBounds();
    z.position.set(b.x + b.width * 0.7, b.y + 10);
    this.ctx.stage.addChild(z);
    void this.ctx.tw.to(z, { y: z.y - 70, alpha: 0 }, { duration: 1.4 }).then(() => z.destroy());
    if (speak) {
      this.drawCount();
      if (this.plan.mode === 'count') await this.ctx.say('night.counted', { n: this.sleepers.filter(x => x.asleep).length, who: NAMES[s.thing] });
      else await this.ctx.say('night.goodnight', { who: NAMES[s.thing] });
    }
  }

  private async tap(s: Sleeper) {
    if (this.busy || this.finished) return;
    if (s.asleep) {
      // Already asleep: a soft "shh", never a mistake.
      sfx.tick();
      return;
    }
    if (this.plan.mode === 'count') {
      const asleep = new Set(this.sleepers.filter(x => x.asleep).map(x => x.thing));
      if (!acceptsTap(this.plan, [], this.step, asleep, s.thing, this.targetCount)) return;
      this.busy = true;
      await this.goodnight(s);
      if (this.sleepers.filter(x => x.asleep).length === this.targetCount) {
        await this.ctx.say('night.countDone', { n: this.targetCount });
        await this.ctx.tw.wait(1.2);
        for (const other of this.sleepers.filter(x => !x.asleep)) await this.goodnight(other, false);
        return void this.finale();
      }
      this.busy = false;
      return;
    }
    if (this.plan.mode === 'all' || this.plan.mode === 'tour') {
      this.busy = true;
      await this.goodnight(s);
      if (!this.sleepers.every((x) => x.asleep)) return void (this.busy = false);
      if (this.stop + 1 >= this.tour.length) return void this.finale();
      // Everyone here is asleep: the big arrow leads on to the next room.
      this.arrow.visible = true;
      await this.ctx.instruct('night.tourNext');
      this.busy = false;
      return;
    }
    const r = this.requests[this.index];
    const want = thingToTap(this.plan, r, this.step, new Set(this.sleepers.filter(x => x.asleep).map(x => x.thing)), this.friends)!;
    if (acceptsTap(this.plan, r, this.step, new Set(this.sleepers.filter(x => x.asleep).map(x => x.thing)), s.thing)) {
      this.busy = true;
      this.glowing = null;
      this.wrongs = 0;
      await this.goodnight(s);
      this.step++;
      if (this.step >= r.length) return void this.next();
      this.busy = false;
      return;
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'except') await this.ctx.say('night.keepAwake', { light: NAMES[s.thing] });
    else if (this.plan.mode === 'color') await this.ctx.say('night.notcolor', { what: NAMES[s.thing], actual: COLORS[s.thing].main, color: this.color! });
    else if (this.plan.mode === 'lightLast') await this.ctx.say('night.lightEarly', { light: NAMES[s.thing] });
    else if (this.plan.mode === 'animals') await this.ctx.say('night.notanimal', { what: NAMES[s.thing] });
    else if (r.includes(s.thing)) await this.ctx.say('night.order', { a: NAMES[r[0]], b: NAMES[r[1]] });
    else await this.ctx.say('night.notthat', { what: NAMES[s.thing], who: NAMES[want] });
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      this.glowing = this.sleepers.find((x) => x.thing === want) ?? null;
    }
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    // A tour fills the sky; the stars never shrink.
    this.stars = Math.max(this.stars, this.plan.mode === 'tour' ? 48 : 12);
    this.drawSky();
    for (const step of [7, 5, 4, 2]) {
      sfx.bell(step, 0.2);
      await this.ctx.tw.wait(0.35);
    }
    this.ctx.pet.setMood('sleepy', 4);
    if (this.plan.mode === 'except') await this.ctx.say('night.exceptDone', { light: NAMES[this.friends.find(isLight)!] });
    else if (this.plan.mode === 'tour') await this.ctx.say('night.tourDone');
    else await this.ctx.say('night.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class NightIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-100, -210, 200, 200, 24).fill(NIGHT).circle(40, -150, 30).fill(swatch.yellow.light).circle(52, -158, 26).fill(NIGHT));
    const bear = new Critter(CRITTERS.bear);
    bear.alive = false;
    bear.setMood('sleepy');
    bear.scale.set(0.5);
    bear.position.set(-20, -14);
    c.addChild(bear);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 100).fill(NIGHT).circle(30, -30, 34).fill(swatch.yellow.light).circle(44, -40, 30).fill(NIGHT));
  for (let i = 0; i < 5; i++) c.addChild(new Graphics().poly(starPoints(10, 4)).fill(swatch.yellow.fill).moveTo(0, 0)).position.set(rng.int(-70, 20), rng.int(-60, 60));
  return c;
}

export const goodnightRoom: GameModule = {
  id: 'goodnight-room',
  name: 'Goodnight Room',
  titleLine: 'game.goodnight-room',
  region: 'story-grove',
  skills: ['words', 'listening', 'routines', 'cause-and-effect'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Whisper "goodnight" together as each one falls asleep. It makes a calm last game before bed.',
  offScreen: 'At bedtime, say goodnight to the things in her room together: "Goodnight, lamp. Goodnight, teddy."',
  hubIcon: () => new NightIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new GoodnightRoom(ctx),
};
