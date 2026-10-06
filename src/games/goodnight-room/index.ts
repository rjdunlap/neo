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
import type { Game, GameContext, GameModule } from '../types';
import { makeRequests, NAMES, planFor, THINGS, type NightPlan, type Thing } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 4 },
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
  private readonly critter: Critter | null = null;
  private readonly art = new Graphics();
  private readonly glow = new Graphics();
  private clock = Math.random() * 5;

  constructor(readonly thing: Thing) {
    super();
    const critters: Partial<Record<Thing, keyof typeof CRITTERS>> = { teddy: 'bear', kitten: 'cat', puppy: 'dog' };
    const kind = critters[thing];
    if (kind) {
      this.critter = new Critter(CRITTERS[kind]);
      this.critter.scale.set(0.46);
      this.addChild(this.critter);
      this.hitArea = new Circle(0, -60, 80);
    } else {
      this.addChild(this.glow, this.art);
      this.hitArea = thing === 'lamp' ? new Rectangle(-75, -260, 150, 270) : new Circle(0, 0, 75);
    }
    this.drawArt();
  }

  private drawArt() {
    const g = this.art.clear();
    const open = !this.asleep;
    if (this.thing === 'lamp') {
      g.rect(-6, -170, 12, 170).fill(wood.line).ellipse(0, 0, 44, 12).fill(wood.line);
      g.poly([-60, -170, 60, -170, 36, -250, -36, -250]).fill(this.asleep ? 0xd9c38a : swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
      eyes(g, 0, -205, open, 6);
      this.glow.clear();
      if (open) this.glow.ellipse(0, -120, 120, 90).fill({ color: 0xfff3a0, alpha: 0.35 });
    } else if (this.thing === 'clock') {
      g.circle(0, 0, 62).fill(0xffffff).stroke({ width: 8, color: wood.line });
      g.moveTo(0, 0).lineTo(0, -38).moveTo(0, 0).lineTo(26, 10).stroke({ width: 6, color: ink, cap: 'round' });
      eyes(g, 0, 26, open, 6);
    } else if (this.thing === 'fish') {
      g.roundRect(-80, 52, 160, 20, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
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

class GoodnightRoom implements Game {
  readonly plan: NightPlan;
  readonly requests: Thing[][];
  readonly sleepers: Sleeper[] = [];
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
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Sleeper | null = null;
  private clock = 0;
  private stars = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.requests = makeRequests(this.plan, ctx.rng);
    this.dark.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.room, this.sky);
    for (const thing of THINGS.slice(0, this.plan.things)) {
      const s = new Sleeper(thing);
      onTap(s, () => void this.tap(s), { cooldown: 400 });
      ctx.track(s);
      this.sleepers.push(s);
      ctx.stage.addChild(s);
    }
    ctx.stage.addChild(this.dark, this.glow);
  }

  start() {
    void this.next();
  }

  /** Where each thing sits, as fractions of the room. */
  private spot(thing: Thing) {
    const v = this.view;
    const at: Record<Thing, [number, number]> = { lamp: [0.22, 0.86], teddy: [0.4, 0.86], kitten: [0.58, 0.88], clock: [0.42, 0.26], puppy: [0.78, 0.88], fish: [0.66, 0.46] };
    return { x: v.w * at[thing][0], y: v.h * at[thing][1] };
  }

  resize(v: View) {
    this.view = v;
    const floor = v.h * 0.7;
    this.room.clear().rect(0, 0, v.w, floor).fill(WALL).rect(0, floor, v.w, v.h - floor).fill(wood.light);
    for (let x = 0; x < v.w; x += 90) this.room.moveTo(x, floor).lineTo(x, v.h).stroke({ width: 2, color: wood.fill, alpha: 0.6 });
    this.room.ellipse(v.w * 0.55, v.h * 0.9, 300, 50).fill({ color: swatch.pink.light, alpha: 0.8 });
    this.drawSky();
    for (const s of this.sleepers) {
      const p = this.spot(s.thing);
      s.position.set(p.x, p.y);
    }
    this.drawDark();
  }

  /** The window: evening, then a night sky with the moon and as many stars as friends asleep. */
  private drawSky() {
    const v = this.view;
    const x = v.w - 260;
    const g = this.sky.clear();
    g.roundRect(x - 10, 50, 220, 180, 16).fill(wood.fill);
    g.roundRect(x, 60, 200, 160, 10).fill(this.stars ? NIGHT : 0x6f86c9);
    g.circle(x + 150, 110, 28).fill(swatch.yellow.light).circle(x + 162, 102, 24).fill(this.stars ? NIGHT : 0x6f86c9);
    for (let i = 0; i < this.stars; i++) g.poly(starPoints(9, 4).map((n, k) => n + (k % 2 ? 80 + ((i * 37) % 110) : x + 20 + ((i * 53) % 110)))).fill(swatch.yellow.fill);
    g.rect(x + 97, 60, 6, 160).rect(x, 137, 200, 6).fill(wood.fill);
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

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.step = 0;
    this.wrongs = 0;
    this.glowing = null;
    if (this.plan.mode === 'all') {
      this.busy = false;
      return this.ctx.instruct('night.all');
    }
    const r = this.requests[this.index];
    if (!r) {
      // Everyone left says goodnight together.
      for (const s of this.sleepers.filter((x) => !x.asleep)) await this.goodnight(s, false);
      return void this.finale();
    }
    this.busy = false;
    if (this.plan.mode === 'named') return this.ctx.instruct('night.named', { who: NAMES[r[0]] });
    return this.ctx.instruct('night.two', { a: NAMES[r[0]], b: NAMES[r[1]] });
  }

  private async goodnight(s: Sleeper, speak = true) {
    s.sleep();
    sfx.bell(3 + this.sleepers.filter((x) => x.asleep).length, 0.25);
    this.stars = this.sleepers.filter((x) => x.asleep).length * 3;
    this.drawSky();
    this.drawDark();
    // A little "z" floats up.
    const z = label('z', 34, 0xffffff);
    const b = s.getBounds();
    z.position.set(b.x + b.width * 0.7, b.y + 10);
    this.ctx.stage.addChild(z);
    void this.ctx.tw.to(z, { y: z.y - 70, alpha: 0 }, { duration: 1.4 }).then(() => z.destroy());
    if (speak) await this.ctx.say('night.goodnight', { who: NAMES[s.thing] });
  }

  private async tap(s: Sleeper) {
    if (this.busy || this.finished) return;
    if (s.asleep) {
      // Already asleep: a soft "shh", never a mistake.
      sfx.tick();
      return;
    }
    if (this.plan.mode === 'all') {
      this.busy = true;
      await this.goodnight(s);
      this.busy = false;
      if (this.sleepers.every((x) => x.asleep)) void this.finale();
      return;
    }
    const r = this.requests[this.index];
    const want = r[this.step];
    if (s.thing === want) {
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
    if (r.includes(s.thing)) await this.ctx.say('night.order', { a: NAMES[r[0]], b: NAMES[r[1]] });
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
    this.stars = 12;
    this.drawSky();
    for (const step of [7, 5, 4, 2]) {
      sfx.bell(step, 0.2);
      await this.ctx.tw.wait(0.35);
    }
    this.ctx.pet.setMood('sleepy', 4);
    await this.ctx.say('night.done');
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
  bands: ['lap', 'toddler', 'preschool'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Whisper "goodnight" together as each one falls asleep. It makes a calm last game before bed.',
  offScreen: 'At bedtime, say goodnight to the things in her room together: "Goodnight, lamp. Goodnight, teddy."',
  hubIcon: () => new NightIcon(),
  sticker,
  create: (ctx) => new GoodnightRoom(ctx),
};
