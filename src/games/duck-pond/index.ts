import { Container, Graphics, Circle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease, type Tweener } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, GameModule } from '../types';
import { bankSize, padValues, planFor, SLOTS, story, tenStarts, type DuckPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 5 },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 9 },
  school: { min: 8, max: 10 },
};

const WATER = 0x7cc4f2;
const WATER_EDGE = 0x5aa9e0;
const LILY = { fill: 0x7cc463, line: 0x4a9a35 };

const plural = (n: number) => `${n} duck${n === 1 ? '' : 's'}`;

/** A duck that waits on the bank, hops along an arc, and bobs on the water up to its middle. */
class Duck extends Container {
  readonly critter = new Critter(CRITTERS.duck);
  swimming = false;
  /** Sitting this one out (for example once enough ducks are in). */
  resting = false;
  private readonly ripple = new Graphics().ellipse(0, -6, 66, 26).fill(WATER).stroke({ width: 4, color: 0xbfe6ff });
  private clock = Math.random() * 6;
  private arc: { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; h: number; done: () => void } | null = null;

  constructor() {
    super();
    this.critter.scale.set(0.36);
    this.ripple.visible = false;
    this.addChild(this.critter, this.ripple);
    this.hitArea = new Circle(0, -46, 72);
  }

  hopTo(x: number, y: number, duration = 0.65, height = 130): Promise<void> {
    return new Promise((done) => {
      this.arc = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, dur: duration, h: height, done };
      this.critter.hop(0.4);
    });
  }

  setSwimming(on: boolean) {
    this.swimming = on;
    this.ripple.visible = on;
  }

  rest() {
    this.resting = true;
    this.critter.setMood('sleepy');
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    if (this.arc) {
      const a = this.arc;
      a.t = Math.min(1, a.t + dt / a.dur);
      this.x = a.x0 + (a.x1 - a.x0) * a.t;
      this.y = a.y0 + (a.y1 - a.y0) * a.t - Math.sin(Math.PI * a.t) * a.h;
      if (a.t >= 1) {
        this.arc = null;
        a.done();
      }
    }
    this.critter.y = this.swimming ? 6 + 3 * Math.sin(this.clock * 2.6) : 0;
  }
}

/** A floating answer button. */
class Pad extends Container {
  readonly value: number;
  private readonly glowRing = new Graphics();
  private glowing = false;
  private shake = 0;
  private clock = 0;

  constructor(value: number) {
    super();
    this.value = value;
    const pad = new Graphics()
      .circle(0, 0, 62)
      .fill(LILY.fill)
      .stroke({ width: 6, color: LILY.line })
      .poly([22, -30, 42, -58, 60, -26])
      .fill(WATER);
    const n = label(String(value), 64, 0xffffff);
    n.style.stroke = { color: LILY.line, width: 8, join: 'round' };
    this.addChild(this.glowRing, pad, n);
    this.hitArea = new Circle(0, 0, 74);
  }

  glow(on: boolean) {
    this.glowing = on;
  }

  wobble() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.shake = Math.max(0, this.shake - dt * 2);
    this.rotation = 0.03 * Math.sin(this.clock * 1.5) + 0.25 * this.shake * Math.sin(this.shake * 20);
    this.glowRing.clear();
    if (this.glowing) this.glowRing.circle(0, 0, 80 + 5 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.7 });
  }
}

class DuckPond implements Game {
  private readonly plan: DuckPlan;
  private readonly backdrop: Backdrop;
  private readonly pond = new Graphics();
  private readonly sign = new Container();
  private readonly signText = label('', 76, 0x5a3a22);
  private readonly signDots = new Graphics();
  private readonly ducks = new Container();
  private readonly padLayer = new Container();
  private bank: Duck[] = [];
  private swimmers: Duck[] = [];
  private pads: Pad[] = [];
  private view: View;
  private round = 0;
  private want = 0;
  private answer = 0;
  private misses = 0;
  private hints = 0;
  private wrongThisRound = 0;
  /** Make-ten levels: how many ducks each round starts with. */
  private starts: number[] = [];
  private busy = true;
  private finished = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.42, clouds: 3, sun: true, seed: 33 }, ctx.view),
    );
    const board = new Graphics()
      .rect(-8, 40, 16, 110)
      .fill(wood.line)
      .roundRect(-110, -66, 220, 132, 18)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    this.signText.y = -14;
    this.sign.addChild(board, this.signText, this.signDots);
    this.sign.visible = false;
    // Ducks lower on the screen (nearer to us) draw in front.
    this.ducks.sortableChildren = true;
    ctx.stage.addChild(this.backdrop, this.pond, this.sign, this.ducks, this.padLayer);
  }

  private get tw(): Tweener {
    return this.ctx.tw;
  }

  start() {
    void this.nextRound();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const { x, y } = this.pondCenter();
    const g = this.pond.clear();
    g.ellipse(x, y, 390, 128).fill(WATER).stroke({ width: 10, color: WATER_EDGE });
    g.ellipse(x - 40, y - 20, 300, 80).fill({ color: 0xffffff, alpha: 0.12 });
    for (const [dx, dy, r] of [[-330, 50, 28], [310, 70, 24], [-280, -70, 20]]) {
      g.circle(x + dx, y + dy, r).fill(LILY.fill).stroke({ width: 4, color: LILY.line });
    }
    for (const [dx, h] of [[-410, 120], [-395, 90], [405, 110], [420, 80]]) {
      g.moveTo(x + dx, y + 60).quadraticCurveTo(x + dx + 6, y + 60 - h / 2, x + dx - 4, y + 60 - h).stroke({ width: 7, color: 0x4a9a35, cap: 'round' });
      g.ellipse(x + dx - 4, y + 60 - h, 7, 20).fill(0x8f6142);
    }
    this.sign.position.set(v.w / 2 + 380, 150);
    this.layoutBank();
    this.layoutPads();
    this.swimmers.forEach((d, i) => d.position.set(x + SLOTS[i][0], y + SLOTS[i][1]));
  }

  update(dt: number) {
    for (const d of [...this.bank, ...this.swimmers]) d.update(dt);
    for (const p of this.pads) p.update(dt);
  }

  destroy() {}

  private pondCenter() {
    return { x: this.view.w / 2, y: this.view.h * 0.5 };
  }

  // ----- ducks coming and going -----

  private spawnBank(n: number) {
    this.bank = Array.from({ length: n }, () => {
      const d = new Duck();
      onTap(d, () => void this.tapBank(d), { cooldown: 300 });
      this.ducks.addChild(d);
      return d;
    });
    this.layoutBank();
    this.bank.forEach((d, i) => {
      d.scale.set(0);
      void this.tw.to(d.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.08, ease: ease.outBack });
    });
  }

  private layoutBank() {
    const v = this.view;
    this.bank.forEach((d, i) => {
      d.position.set(v.w / 2 + (i - (this.bank.length - 1) / 2) * 104, v.h - 22);
      d.zIndex = 10000;
    });
  }

  /** A duck hops from wherever it is into the next free spot on the pond. */
  private async swimIn(d: Duck) {
    const slot = SLOTS[this.swimmers.length % SLOTS.length];
    this.swimmers.push(d);
    this.bank = this.bank.filter((b) => b !== d);
    const { x, y } = this.pondCenter();
    await d.hopTo(x + slot[0], y + slot[1]);
    d.setSwimming(true);
    d.zIndex = d.y;
    sfx.splash();
    this.ctx.particles.burst(d.x, d.y - 10, { colors: [0xffffff, 0xbfe6ff], count: 10, speed: [80, 220], gravity: 500, size: [0.2, 0.4], life: [0.4, 0.7] });
  }

  /** Ducks arriving from off-screen straight into the pond (no tapping needed). */
  private async arrive(n: number) {
    for (let i = 0; i < n; i++) {
      const d = new Duck();
      d.position.set(-80, this.view.h * 0.62);
      this.ducks.addChild(d);
      await this.swimIn(d);
    }
  }

  /** Everyone on the water paddles off to the right. */
  private async swimAway(ducks = this.swimmers) {
    const leaving = [...ducks];
    this.swimmers = this.swimmers.filter((d) => !leaving.includes(d));
    await Promise.all(
      leaving.map(async (d, i) => {
        await this.tw.to(d, { x: this.view.w + 120 }, { duration: 1.4 + i * 0.05, ease: ease.inQuad });
        d.destroy({ children: true });
      }),
    );
  }

  private clearBank() {
    for (const d of this.bank) {
      void this.tw.to(d, { alpha: 0 }, { duration: 0.3 }).then(() => d.destroy({ children: true }));
    }
    this.bank = [];
  }

  private quackChorus() {
    this.swimmers.forEach((d, i) =>
      void this.tw.wait(i * 0.12).then(() => {
        d.critter.cheer();
        if (i < 4) sfx.animal('quack');
      }),
    );
  }

  /** Each swimming duck bobs in turn while the voice counts. */
  private async countAloud() {
    for (let i = 0; i < this.swimmers.length; i++) {
      const d = this.swimmers[i];
      d.critter.hop(0.5);
      sfx.bell(5 + (i % 5), 0.15);
      await this.ctx.say('count', { n: i + 1 });
    }
  }

  // ----- the rounds -----

  private async nextRound() {
    this.busy = true;
    this.wrongThisRound = 0;
    const p = this.plan;
    const rng = this.ctx.rng;
    if (p.mode === 'along') {
      this.spawnBank(p.max);
      if (this.round === 0) await this.ctx.instruct('duck.along');
      this.busy = false;
      return;
    }
    if (p.mode === 'make') {
      this.want = rng.int(p.min, p.max);
      this.showSign(this.want, !!p.dots);
      this.spawnBank(bankSize(p));
      await this.ctx.instruct('duck.make', { n: plural(this.want) });
      this.busy = false;
      return;
    }
    if (p.mode === 'howmany') {
      this.answer = rng.int(p.min, p.max);
      await this.arrive(this.answer);
      await this.ctx.instruct('duck.howmany');
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    if (p.mode === 'ten') {
      if (!this.starts.length) this.starts = tenStarts(rng, p);
      const a = this.starts.shift()!;
      this.answer = 10 - a;
      await this.arrive(a);
      await this.ctx.instruct('duck.ten', { a });
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    // add / take away
    const { a, b, away, answer } = story(rng, p);
    this.answer = answer;
    if (away) {
      await this.arrive(a);
      await this.ctx.say('duck.away', { a, b });
      await this.swimAway(this.swimmers.slice(-b));
    } else {
      await this.arrive(a);
      await this.ctx.say('duck.more', { a, b });
      await this.arrive(b);
    }
    await this.ctx.instruct('duck.now');
    this.showPads(this.answer);
    this.busy = false;
  }

  private async tapBank(d: Duck) {
    if (this.busy || d.resting || !this.bank.includes(d)) return;
    const p = this.plan;
    if (p.mode === 'along') {
      const n = this.swimmers.length + 1;
      void this.swimIn(d);
      void this.ctx.say('count', { n });
      if (this.bank.length === 0) {
        this.busy = true;
        await this.tw.wait(1.1);
        await this.roundWon(n);
      }
      return;
    }
    if (p.mode === 'make') {
      const n = this.swimmers.length + 1;
      void this.swimIn(d);
      void this.ctx.say('count', { n });
      if (n === this.want) {
        // Enough! The rest sit this one out, so there's no way to overshoot.
        this.busy = true;
        this.bank.forEach((b) => b.rest());
        await this.tw.wait(1.1);
        void this.ctx.say('duck.made', { n: plural(n) });
        await this.roundWon(n, false);
      }
    }
  }

  private async roundWon(n: number, announce = true) {
    this.quackChorus();
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (announce) await this.ctx.say('duck.total', { n });
    else await this.tw.wait(1.2);
    await this.tw.wait(0.4);
    this.clearBank();
    this.hideSign();
    await this.swimAway();
    this.round++;
    if (this.round >= this.plan.rounds) void this.finale();
    else void this.nextRound();
  }

  private showSign(n: number, dots: boolean) {
    this.sign.visible = true;
    this.signText.text = String(n);
    this.signText.y = dots ? -18 : 0;
    const g = this.signDots.clear();
    if (dots) for (let i = 0; i < n; i++) g.circle((i - (n - 1) / 2) * 26, 40, 9).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    this.sign.scale.set(0);
    void this.tw.to(this.sign.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  private hideSign() {
    this.sign.visible = false;
  }

  private showPads(answer: number) {
    const values = padValues(this.ctx.rng, answer);
    this.pads = values.map((v) => {
      const pad = new Pad(v);
      onTap(pad, () => void this.tapPad(pad), { cooldown: 400 });
      pad.scale.set(0);
      this.padLayer.addChild(pad);
      return pad;
    });
    this.layoutPads();
    this.pads.forEach((pad, i) => void this.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.4, delay: i * 0.1, ease: ease.outBack }));
  }

  private layoutPads() {
    const v = this.view;
    this.pads.forEach((p, i) => p.position.set(v.w / 2 + (i - 1) * 190, v.h - 90));
  }

  private clearPads() {
    for (const p of this.pads) p.destroy({ children: true });
    this.pads = [];
  }

  private async tapPad(pad: Pad) {
    if (this.busy || this.finished) return;
    this.busy = true;
    if (pad.value === this.answer && this.plan.mode === 'ten') {
      // The missing ducks swim in and the pond is full: ten.
      pad.glow(true);
      sfx.bell(9, 0.3);
      this.clearPads();
      const a = this.swimmers.length;
      await this.arrive(this.answer);
      await this.ctx.say('duck.tenmade', { a, b: this.answer });
      await this.roundWon(10, false);
      return;
    }
    if (pad.value === this.answer) {
      pad.glow(true);
      sfx.bell(9, 0.3);
      await this.countAloud();
      await this.tw.wait(0.2);
      this.clearPads();
      await this.roundWon(this.answer);
      return;
    }
    // Not quite: count them together, then show the right pad.
    this.misses++;
    this.wrongThisRound++;
    pad.wobble();
    sfx.boing();
    if (this.plan.mode === 'ten') {
      // Count on from the ducks already swimming, up to ten, on the fingers.
      await this.ctx.say('duck.counton', { a: this.swimmers.length });
      for (let n = this.swimmers.length + 1; n <= 10; n++) {
        await this.ctx.say('count', { n });
        await this.tw.wait(0.15);
      }
    } else {
      await this.ctx.say('duck.countus');
      await this.countAloud();
    }
    if (this.wrongThisRound >= 2) this.hints++;
    this.pads.find((p) => p.value === this.answer)?.glow(true);
    this.busy = false;
  }

  private async finale() {
    this.finished = true;
    await this.arrive(5);
    this.quackChorus();
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    const { x, y } = this.pondCenter();
    this.ctx.particles.burst(x, y - 100, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.tw.wait(1.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** The hub's little pond with two ducks bobbing about. */
class PondIcon extends Container {
  private readonly ducks: Critter[] = [];
  private clock = 0;
  private next = 2;

  constructor() {
    super();
    const water = new Graphics()
      .ellipse(0, -30, 150, 52)
      .fill(WATER)
      .stroke({ width: 7, color: WATER_EDGE })
      .circle(-100, -16, 18)
      .fill(LILY.fill)
      .stroke({ width: 3, color: LILY.line });
    this.addChild(water);
    for (const x of [-40, 50]) {
      const d = new Critter(CRITTERS.duck);
      d.scale.set(0.3);
      d.position.set(x, -28);
      this.ducks.push(d);
      const ripple = new Graphics().ellipse(x, -38, 52, 14).fill(WATER).stroke({ width: 3, color: 0xbfe6ff });
      this.addChild(d, ripple);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.ducks.forEach((d, i) => {
      d.update(dt);
      d.y = -28 + 3 * Math.sin(this.clock * 2.4 + i * 2);
    });
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 1.8 + Math.random() * 2;
      this.ducks[Math.floor(Math.random() * this.ducks.length)].hop(0.5);
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const n = rng.int(1, 3);
  for (let i = 0; i < n; i++) {
    const d = new Critter(CRITTERS.duck);
    d.alive = false;
    d.scale.set(0.5);
    d.position.set((i - (n - 1) / 2) * 110, i % 2 ? 14 : 0);
    c.addChild(d);
  }
  c.addChild(new Graphics().ellipse(0, -6, 80 + n * 50, 26).fill(WATER).stroke({ width: 5, color: 0xbfe6ff }));
  return c;
}

export const duckPond: GameModule = {
  id: 'duck-pond',
  name: 'Duck Pond',
  titleLine: 'game.duck-pond',
  region: 'counting-cove',
  skills: ['counting', 'number-sense', 'adding'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.mode === 'along') return `Count along as ${p.max} ducks hop in`;
    if (p.mode === 'make') return `Put ${p.min} to ${p.max} ducks in the pond${p.dots ? ' (number and dots)' : ' (number only)'}`;
    if (p.mode === 'howmany') return `How many ducks? ${p.min} to ${p.max}`;
    if (p.mode === 'ten') return 'Make ten: how many more ducks fill the pond to 10?';
    return p.subtract ? 'Adding and taking away, up to 10' : 'Adding, up to 5';
  },
  music: STYLES.hub,
  coplayHint: 'Count out loud with {name}, and touch each duck as you count.',
  offScreen: 'Line up toy ducks or spoons and count them together, touching each one.',
  hubIcon: () => new PondIcon(),
  sticker,
  create: (ctx) => new DuckPond(ctx),
};
