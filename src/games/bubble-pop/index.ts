import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, RAINBOW, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import type { Game, GameContext, GameModule } from '../types';
import { Bubble, drawBubble } from './bubble';

type Mode = 'free' | 'color' | 'count';

interface Plan {
  mode: Mode;
  /** Pops (or numbers) needed before the rainbow bubble. */
  goal: number;
  /** Pixels per second. */
  speed: number;
  /** Most bubbles on screen at once. */
  most: number;
  /** Colors in play (color mode). */
  colors: number;
  radius: [number, number];
}

/** One entry per level. Lap levels are pure popping; then colors; then numbers in order. */
const PLANS: Plan[] = [
  { mode: 'free', goal: 12, speed: 55, most: 5, colors: 0, radius: [72, 96] },
  { mode: 'free', goal: 15, speed: 65, most: 6, colors: 0, radius: [64, 90] },
  { mode: 'free', goal: 18, speed: 75, most: 7, colors: 0, radius: [58, 84] },
  { mode: 'color', goal: 8, speed: 55, most: 5, colors: 2, radius: [66, 86] },
  { mode: 'color', goal: 10, speed: 60, most: 6, colors: 3, radius: [62, 82] },
  { mode: 'color', goal: 12, speed: 70, most: 7, colors: 5, radius: [56, 76] },
  { mode: 'count', goal: 5, speed: 35, most: 5, colors: 0, radius: [62, 74] },
  { mode: 'count', goal: 7, speed: 42, most: 7, colors: 0, radius: [56, 68] },
  { mode: 'count', goal: 10, speed: 48, most: 10, colors: 0, radius: [50, 60] },
];

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 3 },
  toddler: { min: 1, max: 6 },
  preschool: { min: 4, max: 9 },
  prek: { min: 6, max: 9 },
};

const FRIENDS: CritterName[] = ['duck', 'pig', 'cat', 'bunny', 'cow', 'bear', 'dog'];

class BubblePop implements Game {
  private readonly plan: Plan;
  private readonly backdrop: Backdrop;
  private readonly layer = new Container();
  private bubbles: Bubble[] = [];
  private view: View;
  private phase: 'play' | 'finale' | 'done' = 'play';
  private spawnIn = 0.2;
  private spawned = 0;
  private scored = 0;
  private misses = 0;
  private hints = 0;
  private missStreak = 0;
  private clock = 0;
  private lastNag = -10;
  private idle = 0;
  /** Color mode: the color to pop, and the colors in play (target first). */
  private target: ColorName | null = null;
  private palette: ColorName[] = [];
  /** Count mode: the number to find next. */
  private nextNumber = 1;

  constructor(private readonly ctx: GameContext) {
    this.plan = PLANS[Math.min(PLANS.length, Math.max(1, ctx.level)) - 1];
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0x7cc4f2, 0xf6dfb0], horizon: 0.78, clouds: 3, sun: true, seed: 3 }, ctx.view),
    );
    ctx.stage.addChild(this.backdrop, this.layer);
    if (this.plan.mode === 'color') {
      this.palette = ctx.rng.shuffle([...RAINBOW]).slice(0, this.plan.colors);
      this.target = this.palette[0];
    }
  }

  start() {
    const p = this.plan;
    if (p.mode === 'free') void this.ctx.instruct('bubble.free');
    if (p.mode === 'color') void this.ctx.instruct('bubble.color', { color: this.target! });
    if (p.mode === 'count') {
      void this.ctx.instruct('bubble.count');
      for (let n = 1; n <= p.goal; n++) this.spawn(n);
    }
  }

  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
  }

  update(dt: number) {
    this.clock += dt;
    const p = this.plan;
    if (this.phase === 'play' && p.mode !== 'count') {
      this.spawnIn -= dt;
      const alive = this.bubbles.filter((b) => !b.popped).length;
      if (this.spawnIn <= 0 && alive < p.most) {
        this.spawn();
        this.spawnIn = this.ctx.rng.range(0.35, 0.9);
      }
    }
    if (this.phase === 'play' && p.mode === 'count') {
      // Stuck for a while? Gently point at the next number (not counted as a hint).
      this.idle += dt;
      if (this.idle > 6) {
        this.idle = 0;
        const next = this.bubbles.find((b) => b.number === this.nextNumber);
        if (next) next.glow = 2.5;
      }
    }
    for (const b of [...this.bubbles]) {
      if (b.popped) continue;
      b.update(dt);
      if (b.rainbow || p.mode === 'count') {
        this.drift(b, dt);
      } else {
        b.vx *= 1 - 1.5 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -b.r - 20) this.remove(b);
      }
    }
  }

  destroy() {
    this.bubbles = [];
  }

  private spawn(number?: number) {
    const { rng } = this.ctx;
    const p = this.plan;
    const v = this.view;
    const r = rng.range(p.radius[0], p.radius[1]);
    let color: ColorName | null = null;
    if (p.mode === 'color') {
      const targetShowing = this.bubbles.some((b) => !b.popped && b.color === this.target);
      // Errorless start: the first bubbles are always the right color.
      const wantTarget = this.spawned < 2 || !targetShowing || rng.chance(0.55);
      color = wantTarget ? this.target : rng.pick(this.palette.slice(1));
    }
    if (p.mode === 'count') color = RAINBOW[((number ?? 1) - 1) % RAINBOW.length];
    const critter = p.mode === 'free' && rng.chance(0.3) ? rng.pick(FRIENDS) : undefined;

    const b = new Bubble({ r, color, number, critter });
    if (p.mode === 'count') {
      b.position.set(rng.range(150 + r, v.w - 50 - r), rng.range(130 + r, v.h - 60 - r));
      const a = rng.range(0, Math.PI * 2);
      b.vx = Math.cos(a) * p.speed;
      b.vy = Math.sin(a) * p.speed;
    } else {
      b.position.set(rng.range(130 + r, v.w - 40 - r), v.h + r + 10);
      b.vy = -p.speed * rng.range(0.8, 1.25);
    }
    onTap(b, () => this.tapped(b), { radius: r * 1.2, cooldown: 300 });
    this.layer.addChild(b);
    this.bubbles.push(b);
    this.spawned++;
  }

  /** Floats about inside the screen, bouncing off the edges. */
  private drift(b: Bubble, dt: number) {
    const v = this.view;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const [x0, x1, y0, y1] = [b.r + 30, v.w - b.r - 30, b.r + 110, v.h - b.r - 30];
    if (b.x < x0 || b.x > x1) b.vx = Math.abs(b.vx) * (b.x < x0 ? 1 : -1);
    if (b.y < y0 || b.y > y1) b.vy = Math.abs(b.vy) * (b.y < y0 ? 1 : -1);
  }

  private tapped(b: Bubble) {
    if (b.popped || this.phase === 'done') return;
    if (b.rainbow) {
      if (this.phase === 'finale') this.popRainbow(b);
      return;
    }
    const p = this.plan;
    const right = p.mode === 'free' || (p.mode === 'color' ? b.color === this.target : b.number === this.nextNumber);
    if (!right) {
      this.wrong(b);
      return;
    }
    this.missStreak = 0;
    this.idle = 0;
    this.pop(b);
    this.scored++;
    if (p.mode === 'color' && this.scored % 3 === 1) void this.ctx.say(`color.${this.target!}`);
    if (p.mode === 'count') {
      void this.ctx.say('count', { n: b.number! });
      this.nextNumber++;
    }
    if (this.scored % 5 === 0) this.ctx.pet.cheer();
    if (this.phase === 'play' && this.scored >= p.goal) void this.finale();
  }

  private wrong(b: Bubble) {
    b.bounce();
    sfx.boing();
    this.misses++;
    this.missStreak++;
    this.idle = 0;
    if (this.clock - this.lastNag > 4) {
      this.lastNag = this.clock;
      if (this.plan.mode === 'color') void this.ctx.say('bubble.wrong', { wrong: b.color!, color: this.target! });
      else void this.ctx.say('bubble.find', { n: this.nextNumber });
    }
    if (this.missStreak >= 2) {
      // Two misses in a row: light up the right ones.
      this.missStreak = 0;
      this.hints++;
      for (const o of this.bubbles) {
        const right = this.plan.mode === 'color' ? o.color === this.target : o.number === this.nextNumber;
        if (right && !o.popped) o.glow = 3;
      }
    }
  }

  private pop(b: Bubble) {
    b.popped = true;
    const tint = b.color ? swatch[b.color].fill : 0x9fd8ff;
    this.ctx.particles.burst(b.x, b.y, {
      colors: [tint, 0xffffff],
      count: 14,
      speed: [140, 340],
      gravity: 260,
      size: [0.25, 0.55],
      life: [0.4, 0.8],
    });
    sfx.pop(stepFromUnit(b.x / this.view.w, 5, 8));
    if (b.critter) this.release(b);
    void this.ctx.tw.to(b, { alpha: 0 }, { duration: 0.12 });
    void this.ctx.tw.to(b.scale, { x: 1.3, y: 1.3 }, { duration: 0.12 }).then(() => this.remove(b));
  }

  /** A friend was inside! It drops to the sand, hops, giggles and waves goodbye. */
  private release(b: Bubble) {
    const c = b.critter!;
    b.critter = null;
    c.position.set(b.x, b.y + b.r * 0.55);
    this.layer.addChild(c);
    this.ctx.track(c);
    c.poke();
    const floor = this.view.h - 24;
    const fall = Math.max(0.25, Math.sqrt(Math.max(0, floor - c.y) / 900));
    void this.ctx.tw.to(c, { y: floor }, { duration: fall, ease: ease.inQuad }).then(async () => {
      c.hop(0.8);
      sfx.giggle();
      await this.ctx.tw.wait(1.4);
      await this.ctx.tw.to(c, { alpha: 0 }, { duration: 0.4 });
      this.ctx.untrack(c);
      c.destroy({ children: true });
    });
  }

  private remove(b: Bubble) {
    this.bubbles = this.bubbles.filter((o) => o !== b);
    b.destroy({ children: true });
  }

  /** Goal reached: pop the stragglers in a cascade, then float up the rainbow bubble. */
  private async finale() {
    this.phase = 'finale';
    const rest = this.bubbles.filter((b) => !b.popped);
    rest.forEach((b, i) => void this.ctx.tw.wait(0.2 + i * 0.09).then(() => !b.popped && this.pop(b)));
    await this.ctx.tw.wait(0.5 + rest.length * 0.09);

    const v = this.view;
    const rainbow = new Bubble({ r: 120, color: null, rainbow: true });
    rainbow.position.set(v.w / 2, v.h + 140);
    this.layer.addChild(rainbow);
    this.bubbles.push(rainbow);
    onTap(rainbow, () => this.tapped(rainbow), { radius: 150, cooldown: 300 });
    void this.ctx.instruct('bubble.rainbow');
    sfx.sparkle();
    rainbow.vy = -260;
    rainbow.vx = 0;
    await this.ctx.tw.wait(1.2);
    rainbow.vx = 40;
    rainbow.vy = 26;
  }

  private async popRainbow(b: Bubble) {
    this.phase = 'done';
    b.popped = true;
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(b.x, b.y, { colors, kind: 'confetti', count: 70, speed: [250, 650], gravity: 500, size: [0.6, 1.1], life: [1, 1.8] });
    this.ctx.particles.burst(b.x, b.y, { colors: [0xffffff, 0xfff3a0], kind: 'star', count: 16, speed: [120, 300], gravity: 0, life: [0.6, 1] });
    sfx.pop(10);
    sfx.tada();
    this.ctx.pet.cheer();
    void this.ctx.tw.to(b, { alpha: 0 }, { duration: 0.15 });
    await this.ctx.tw.to(b.scale, { x: 1.4, y: 1.4 }, { duration: 0.15 });
    this.remove(b);
    await this.ctx.tw.wait(1.0);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** The hub's bubble machine: a happy box that blows a bubble now and then. */
class BubbleMachine extends Container {
  private readonly puffs: { g: Graphics; vx: number; vy: number; life: number }[] = [];
  private readonly box = new Container();
  private next = 0.5;
  private clock = 0;

  constructor() {
    super();
    const sw = swatch.teal;
    const line = (color: number, width = 7) => ({ width, color, join: 'round' as const, cap: 'round' as const });
    const g = new Graphics()
      .roundRect(-66, -14, 34, 16, 7)
      .roundRect(32, -14, 34, 16, 7)
      .fill(sw.line)
      .roundRect(-22, -170, 44, 40, 12)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line, 6))
      .circle(0, -186, 24)
      .stroke(line(swatch.pink.fill, 8))
      .roundRect(-86, -136, 172, 128, 30)
      .fill(sw.fill)
      .stroke(line(sw.line))
      .roundRect(-62, -66, 124, 44, 16)
      .fill(sw.light)
      .stroke(line(sw.line, 5));
    // Bubbles waiting in the window.
    const waiting = (['pink', 'yellow', 'blue'] as const).map((color, i) => {
      const b = drawBubble(new Graphics(), [12, 9, 13][i], color);
      b.position.set([-28, 4, 34][i], [-44, -40, -46][i]);
      return b;
    });
    const face = new Graphics()
      .circle(-26, -102, 11)
      .circle(26, -102, 11)
      .fill(0xffffff)
      .circle(-24, -100, 6)
      .circle(28, -100, 6)
      .fill(ink)
      .moveTo(-10, -86)
      .quadraticCurveTo(0, -78, 10, -86)
      .stroke(line(ink, 4));
    this.box.addChild(g, ...waiting, face);
    this.addChild(this.box);
  }

  update(dt: number) {
    this.clock += dt;
    this.box.scale.y = 1 + 0.02 * Math.sin(this.clock * 3);
    this.next -= dt;
    if (this.next <= 0 && this.puffs.length < 8) {
      this.next = 0.5 + Math.random() * 0.8;
      const colors: (ColorName | null)[] = [null, 'pink', 'blue', 'yellow', 'green', 'purple'];
      const g = drawBubble(new Graphics(), 10 + Math.random() * 14, colors[Math.floor(Math.random() * colors.length)]);
      g.position.set(0, -190);
      this.addChild(g);
      this.puffs.push({ g, vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 40, life: 2.6 });
    }
    for (const p of [...this.puffs]) {
      p.life -= dt;
      p.g.x += p.vx * dt + Math.sin(this.clock * 2 + p.vx) * 0.4;
      p.g.y += p.vy * dt;
      p.g.alpha = Math.min(1, p.life);
      if (p.life <= 0) {
        this.puffs.splice(this.puffs.indexOf(p), 1);
        p.g.destroy();
      }
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const friend = new Critter(CRITTERS[rng.pick(FRIENDS)]);
  friend.alive = false;
  friend.scale.set(0.42);
  friend.y = 58;
  c.addChild(friend, drawBubble(new Graphics(), 100, rng.chance(0.5) ? rng.pick(RAINBOW) : null, 0.25));
  return c;
}

export const bubblePop: GameModule = {
  id: 'bubble-pop',
  name: 'Bubble Pop',
  titleLine: 'game.bubble-pop',
  region: 'bubble-beach',
  skills: ['cause-effect', 'tracking', 'colors', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => {
    const p = PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
    if (p.mode === 'free') return `Pop anything, ${p.goal} pops`;
    if (p.mode === 'color') return `Pop one color, ${p.colors} colors in play`;
    return `Numbers in order, 1 to ${p.goal}`;
  },
  music: STYLES.bubbles,
  coplayHint: 'Say "pop!" together, and name the colors as {name} pops them.',
  offScreen: 'Blow real bubbles outside and pop them together. Count the pops out loud.',
  hubIcon: () => new BubbleMachine(),
  sticker,
  create: (ctx) => new BubblePop(ctx),
};
