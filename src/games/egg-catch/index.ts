import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { caught, exitFor, gatesFor, LANES, makeEggs, planFor, predictGates, targetsFor, type Egg, type EggPlan, type Shell } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 6 },
};

const SHELL = { brown: { fill: 0xd9a066, line: 0x9c6b3c }, white: { fill: 0xfffdf6, line: 0xc9bfae } };
const HAY = { fill: 0xf3dc8a, line: 0xd9b95a };

function eggArt(shell: Shell): Graphics {
  const c = SHELL[shell];
  return new Graphics().ellipse(0, 0, 26, 33).fill(c.fill).stroke({ width: 4, color: c.line }).ellipse(-8, -12, 6, 9).fill({ color: 0xffffff, alpha: 0.6 });
}

function hen(): Critter {
  const h = new Critter({ ...CRITTERS.duck, color: 'white' });
  const comb = new Graphics().circle(-14, -258, 14).circle(4, -266, 16).circle(22, -256, 13).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  h.attach(comb);
  return h;
}

function hayArt(w = 150): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, w / 2, 26).fill(HAY.fill).stroke({ width: 4, color: HAY.line });
  for (let i = 0; i < 9; i++) g.moveTo(-w / 2 + 12 + i * (w - 24) / 8, -6).lineTo(-w / 2 + 20 + i * (w - 24) / 8, -24).stroke({ width: 3, color: HAY.line });
  return g;
}

function basketArt(): Graphics {
  return new Graphics()
    .moveTo(-80, -40).lineTo(80, -40).lineTo(62, 34).lineTo(-62, 34).closePath()
    .fill(wood.fill).stroke({ width: 6, color: wood.line, join: 'round' })
    .moveTo(-70, -12).lineTo(70, -12).moveTo(-66, 12).lineTo(66, 12).stroke({ width: 3, color: wood.line, alpha: 0.5 });
}

interface Falling {
  egg: Egg;
  node: Graphics;
  t: number;
  x: number;
  done: boolean;
}

class EggCatch implements Game {
  readonly plan: EggPlan;
  readonly eggs: Egg[];
  readonly hens: Critter[] = [];
  readonly basket = new Container();
  readonly falling: Falling[] = [];
  caughtCount = 0;
  misses = 0;
  hints = 0;
  finished = false;
  hinting = false;
  /** Route levels: gate directions (true = right), and where the basket and nest wait. */
  gates: [boolean, boolean, boolean] = [false, false, false];
  target = { basket: 0, nest: 1 };
  rolling = false;
  readonly gateHits: Container[] = [];

  private readonly backdrop: Backdrop;
  private readonly shelf = new Graphics();
  private readonly chutes = new Graphics();
  private readonly gateArt = new Graphics();
  private readonly exits = new Container();
  private readonly touch = new Container();
  private readonly hay = new Container();
  private view: View;
  private next = 0;
  private spawnIn = 1.2;
  private basketTarget = 0;
  private pointer: number | null = null;
  private wrongs = 0;
  private clock = 0;
  private readonly targets: { basket: number; nest: number }[];
  private routed = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.eggs = makeEggs(this.plan, ctx.rng);
    this.targets = targetsFor(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xf6d1b8, 0xfff1e3], hills: [0xc8ecb0, 0x9edb86], horizon: 0.72, clouds: 2, seed: 9 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.shelf, this.chutes, this.exits, this.hay, this.gateArt);
    const routing = this.routing;
    const henCount = routing ? 1 : LANES;
    for (let i = 0; i < henCount; i++) {
      const h = hen();
      h.scale.set(0.42);
      if (this.plan.mode === 'tap') {
        onTap(h, () => this.lay(i), { cooldown: 900 });
        h.hitArea = new Circle(0, -120, 200);
      }
      ctx.track(h);
      this.hens.push(h);
      ctx.stage.addChild(h);
    }
    this.basket.addChild(basketArt());
    this.basket.visible = !routing;
    ctx.stage.addChild(this.basket, this.touch);

    if (!routing && this.plan.mode !== 'tap') {
      this.touch.eventMode = 'static';
      this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
        if (palmOnGlass()) return;
        this.pointer = e.pointerId;
        this.steer(e);
      });
      this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.steer(e));
      const up = (e: { pointerId: number }) => e.pointerId === this.pointer && (this.pointer = null);
      this.touch.on('pointerup', up);
      this.touch.on('pointerupoutside', up);
    }
    if (routing) {
      // The steering layer is only for catching; here it would sit over the bins and swallow taps.
      this.touch.eventMode = 'none';
      // Each gate is a big tap target at its junction.
      for (let i = 0; i < 3; i++) {
        const hit = new Container();
        hit.hitArea = new Circle(0, 0, 80);
        onTap(hit, () => this.flip(i), { cooldown: 250 });
        this.gateHits.push(hit);
        ctx.stage.addChild(hit);
      }
    }
  }

  get routing() {
    return this.plan.mode === 'route' || this.plan.mode === 'sort' || this.plan.mode === 'predict';
  }

  /** Predict levels: the gates for each egg, and the egg waiting at the top for a guess. */
  private predictions: [boolean, boolean, boolean][] = [];
  private waiting: { node: Graphics; egg: Egg } | null = null;

  start() {
    const line = { tap: 'egg.tap', catch: 'egg.catch', brown: 'egg.brown', route: 'egg.route', sort: 'egg.sort', predict: 'egg.predict' } as const;
    if (this.plan.mode === 'predict') this.predictions = predictGates(this.ctx.rng, this.plan.eggs * 3);
    void this.ctx.instruct(line[this.plan.mode]);
    if (this.routing) void this.nextRoute();
  }

  private laneX(i: number) {
    return spread(LANES, 230, this.view.w - 110, 190)[i];
  }

  private get floor() {
    return this.view.h - 70;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.touch.hitArea = new Rectangle(0, v.h * 0.4, v.w, v.h * 0.6);
    const s = this.shelf.clear();
    if (this.routing) {
      this.hens[0].position.set(v.w / 2, 150);
      s.roundRect(v.w / 2 - 110, 150, 220, 24, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
      this.drawChutes();
    } else {
      s.roundRect(150, 150, v.w - 190, 24, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
      this.hens.forEach((h, i) => h.position.set(this.laneX(i), 152));
      this.hay.removeChildren().forEach((c) => c.destroy());
      for (let i = 0; i < LANES; i++) {
        const pile = hayArt(170);
        pile.position.set(this.laneX(i), this.floor + 20);
        this.hay.addChild(pile);
      }
      if (!this.basketTarget) this.basketTarget = this.laneX(1);
      this.basket.position.set(this.basket.x || this.laneX(1), this.floor - 50);
    }
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finished || this.routing) {
      this.drawGates();
      return;
    }
    // The basket glides toward the finger (or, at lap, toward the next egg).
    if (this.plan.mode === 'tap') {
      const f = this.falling.find((x) => !x.done);
      if (f) this.basketTarget = f.x;
    }
    const dx = this.basketTarget - this.basket.x;
    this.basket.x += Math.sign(dx) * Math.min(Math.abs(dx), 900 * dt);
    // Lay eggs on their own, one or two at a time.
    if (this.plan.mode !== 'tap') {
      this.spawnIn -= dt;
      const inAir = this.falling.filter((f) => !f.done).length;
      const max = this.plan.mode === 'brown' ? 2 : 1;
      if (this.spawnIn <= 0 && inAir < max) {
        this.lay(this.eggs[this.next % this.eggs.length].lane);
        this.spawnIn = this.plan.mode === 'brown' ? 1.8 : 1.2;
      }
    }
    const fall = this.plan.fall * (this.hinting ? 1.4 : 1);
    for (const f of this.falling) {
      if (f.done) continue;
      f.t += dt / fall;
      const top = 200;
      const bottom = this.floor - 70;
      f.node.position.set(f.x + 6 * Math.sin(f.t * 12), top + (bottom - top) * f.t);
      f.node.rotation = 0.2 * Math.sin(f.t * 10);
      if (f.t >= 1) this.land(f);
    }
  }

  destroy() {
    this.touch.removeAllListeners();
  }

  /** Couch play on the catching levels: the stick slides the basket, and with two controllers both can steer it. */
  control(input: CouchControls, dt: number) {
    if (this.finished || this.routing || this.plan.mode === 'tap') return;
    const push = Math.max(-1, Math.min(1, input.players.reduce((sum, p) => sum + p.x, 0)));
    if (push) this.basketTarget = Math.max(160, Math.min(this.view.w - 80, this.basketTarget + push * 760 * dt));
  }

  /** The "watch me" demo: slide under the next brown egg that is falling. */
  autoplay(): CouchControls {
    const out = idle();
    out.players[0].active = true;
    const egg = this.falling.find((f) => !f.done && f.egg.shell === 'brown');
    const dx = (egg ? egg.x : this.basketTarget) - this.basket.x;
    out.players[0].x = Math.abs(dx) < 16 ? 0 : Math.max(-1, Math.min(1, dx / 80));
    return out;
  }

  private steer(e: FederatedPointerEvent) {
    const p = this.ctx.stage.toLocal(e.global);
    this.basketTarget = Math.max(160, Math.min(this.view.w - 80, p.x));
  }

  // Catching -------------------------------------------------------------------------------

  /** A hen lays an egg in her lane. */
  lay(lane: number) {
    if (this.finished) return;
    if (this.plan.mode === 'tap' && this.falling.some((f) => !f.done)) return;
    const egg = this.plan.mode === 'tap' ? { lane, shell: 'brown' as Shell } : this.eggs[this.next++ % this.eggs.length];
    const h = this.hens[egg.lane];
    h.cheer();
    sfx.pop(8);
    const node = eggArt(egg.shell);
    // Brown eggs glow while a hint is on.
    if (this.hinting && egg.shell === 'brown' && this.plan.mode === 'brown') node.circle(0, 0, 40).stroke({ width: 6, color: 0xfff3a0 });
    node.position.set(this.laneX(egg.lane), 200);
    this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.basket));
    this.falling.push({ egg, node, t: 0, x: this.laneX(egg.lane), done: false });
  }

  private land(f: Falling) {
    f.done = true;
    const inBasket = caught(f.node.x, this.basket.x);
    const want = f.egg.shell === 'brown';
    if (inBasket && want) {
      this.caughtCount++;
      f.node.destroy();
      sfx.squish();
      this.basket.scale.set(1.12, 0.88);
      void this.ctx.tw.to(this.basket.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      void this.ctx.say('count', { n: this.caughtCount });
      this.wrongs = 0;
      if (this.caughtCount >= this.plan.eggs) void this.finale();
      return;
    }
    if (inBasket && !want) {
      // A white egg in the basket hops back out into the hay.
      this.miss('egg.white');
      void this.ctx.tw.to(f.node, { y: f.node.y - 90, x: f.node.x + 60 }, { duration: 0.3, ease: ease.outQuad }).then(() => this.hatch(f.node));
      return;
    }
    if (want) this.miss(null);
    this.hatch(f.node);
  }

  /** Into the soft hay: the egg wobbles, cracks and a chick pops out. */
  private hatch(node: Graphics) {
    const tw = this.ctx.tw;
    void tw.to(node, { y: this.floor - 10 }, { duration: 0.25, ease: ease.inQuad }).then(async () => {
      sfx.pop(3);
      await tw.to(node, { rotation: 0.3 }, { duration: 0.12 });
      await tw.to(node, { rotation: -0.3 }, { duration: 0.12 });
      const chick = new Graphics().circle(0, 0, 22).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line }).circle(8, -4, 4).fill(0x2b2b3a).poly([18, 0, 30, 4, 18, 8]).fill(swatch.orange.fill);
      chick.position.copyFrom(node.position);
      this.ctx.stage.addChildAt(chick, this.ctx.stage.getChildIndex(this.basket));
      node.destroy();
      sfx.chirp(11);
      await tw.to(chick, { y: chick.y - 40 }, { duration: 0.3, ease: ease.outQuad });
      await tw.to(chick, { x: chick.x + (Math.random() < 0.5 ? -400 : 400), alpha: 0 }, { duration: 1.4 });
      chick.destroy();
    });
  }

  private miss(line: 'egg.white' | 'egg.wrongway' | 'egg.predictwrong' | null) {
    this.misses++;
    this.wrongs++;
    if (line) void this.ctx.say(line);
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      this.wrongs = 0;
    }
  }

  // Routing ---------------------------------------------------------------------------------

  /** Junction and exit positions for the chutes. */
  private geo() {
    const v = this.view;
    const cx = v.w / 2 + 40;
    const top = 210;
    return {
      entry: { x: cx, y: top },
      gate: [
        { x: cx, y: top + 90 },
        { x: cx - 190, y: top + 220 },
        { x: cx + 190, y: top + 220 },
      ],
      exit: [-285, -95, 95, 285].map((dx) => ({ x: cx + dx, y: top + 350 })),
      bin: [-285, -95, 95, 285].map((dx) => ({ x: cx + dx, y: v.h - 90 })),
    };
  }

  private drawChutes() {
    const g = this.chutes.clear();
    const o = this.geo();
    const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 34, color: wood.line, cap: 'round' });
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 24, color: wood.light, cap: 'round' });
    };
    seg(o.entry, o.gate[0]);
    seg(o.gate[0], o.gate[1]);
    seg(o.gate[0], o.gate[2]);
    for (let i = 0; i < 4; i++) {
      seg(o.gate[i < 2 ? 1 : 2], o.exit[i]);
      seg(o.exit[i], o.bin[i]);
    }
    this.gateHits.forEach((h, i) => h.position.copyFrom(o.gate[i]));
    this.drawExits();
  }

  private drawExits() {
    this.exits.removeChildren().forEach((c) => c.destroy({ children: true }));
    const o = this.geo();
    for (let i = 0; i < 4; i++) {
      const node = i === this.target.basket ? basketArt() : i === this.target.nest && this.plan.mode === 'sort' ? this.nestArt() : hayArt(150);
      node.position.set(o.bin[i].x, o.bin[i].y + 20);
      // Predict levels: tap a bin to say where the egg will land.
      if (this.plan.mode === 'predict') {
        node.hitArea = new Rectangle(-80, -90, 160, 140);
        onTap(node, () => void this.predict(i), { cooldown: 400 });
      }
      this.exits.addChild(node);
    }
  }

  private nestArt(): Graphics {
    const g = hayArt(170);
    g.ellipse(0, -6, 52, 14).fill(0xc9a46a);
    return g;
  }

  private drawGates() {
    if (!this.routing) return;
    const g = this.gateArt.clear();
    const o = this.geo();
    if (this.plan.mode === 'predict') {
      // Gates are locked; after two misses the egg's whole path glows.
      for (let i = 0; i < 3; i++) {
        const p = o.gate[i];
        const right = this.gates[i];
        const to = { x: p.x + (right ? (i === 0 ? 190 : 95) : -(i === 0 ? 190 : 95)) * 0.42, y: p.y + 130 * 0.42 };
        g.circle(p.x, p.y, 40).fill({ color: 0xffffff, alpha: 0.8 }).stroke({ width: 5, color: swatch.purple.line });
        g.moveTo(p.x, p.y).lineTo(to.x, to.y).stroke({ width: 18, color: swatch.purple.fill, cap: 'round' });
      }
      if (this.hinting && this.waiting) {
        const exit = exitFor(this.gates);
        const path = [o.entry, o.gate[0], o.gate[exit >= 2 ? 2 : 1], o.exit[exit], o.bin[exit]];
        g.moveTo(path[0].x, path[0].y);
        for (const q of path.slice(1)) g.lineTo(q.x, q.y);
        g.stroke({ width: 14, color: swatch.yellow.fill, alpha: 0.6 + 0.3 * Math.sin(this.clock * 6), cap: 'round', join: 'round' });
      }
      return;
    }
    const want = this.hinting ? this.wanted() : [];
    for (let i = 0; i < 3; i++) {
      const p = o.gate[i];
      const right = this.gates[i];
      const dx = i === 0 ? 190 : 95;
      const to = { x: p.x + (right ? dx : -dx) * 0.42, y: p.y + (i === 0 ? 130 : 130) * 0.42 };
      const glow = want.find((w) => w.gate === i);
      if (glow) g.circle(p.x, p.y, 62 + 5 * Math.sin(this.clock * 7)).fill({ color: 0xfff3a0, alpha: glow.right === right ? 0.35 : 0.85 });
      g.circle(p.x, p.y, 40).fill({ color: 0xffffff, alpha: 0.8 }).stroke({ width: 5, color: swatch.purple.line });
      g.moveTo(p.x, p.y).lineTo(to.x, to.y).stroke({ width: 18, color: swatch.purple.fill, cap: 'round' });
      g.circle(p.x, p.y, 10).fill(swatch.purple.line);
    }
  }

  /** The gates this egg needs, for the hint. */
  private wanted() {
    const egg = this.eggs[this.routed % this.eggs.length];
    const exit = this.plan.mode === 'sort' && egg.shell === 'white' ? this.target.nest : this.target.basket;
    return gatesFor(exit);
  }

  private flip(i: number) {
    if (this.finished || this.plan.mode === 'predict') return;
    this.gates[i] = !this.gates[i];
    sfx.tick();
    sfx.pop(4 + i * 2);
  }

  private async nextRoute() {
    if (this.finished) return;
    this.target = this.targets[this.routed % this.targets.length];
    this.drawExits();
    const egg = this.eggs[this.routed % this.eggs.length];
    const node = eggArt(egg.shell);
    const o = this.geo();
    node.position.set(o.entry.x, o.entry.y - 30);
    node.scale.set(0);
    this.ctx.stage.addChild(node);
    this.hens[0].cheer();
    sfx.pop(8);
    await this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    if (this.plan.mode === 'predict') {
      // The gates are set for this egg; it waits until she says where it will land.
      this.gates = [...this.predictions[this.routed % this.predictions.length]];
      this.target = { basket: -1, nest: -1 };
      this.drawExits();
      this.waiting = { node, egg };
      return;
    }
    // A moment to set the gates before it rolls.
    await this.ctx.tw.wait(this.routed === 0 ? 3.5 : 2);
    await this.roll(node, egg);
  }

  /** Predict: the chosen bin gets the basket, then the egg rolls (slowly) to show where it really goes. */
  private async predict(bin: number) {
    if (!this.waiting || this.finished) return;
    const { node, egg } = this.waiting;
    this.waiting = null;
    this.target = { basket: bin, nest: -1 };
    this.drawExits();
    sfx.pop(6);
    await this.roll(node, egg);
  }

  /** Down the chutes; each gate is read as the egg reaches it, so it can be flipped mid-roll. */
  private async roll(node: Graphics, egg: Egg) {
    const tw = this.ctx.tw;
    const o = this.geo();
    const speed = this.hinting ? 1.3 : 1;
    const go = async (p: { x: number; y: number }) => {
      const d = Math.hypot(p.x - node.x, p.y - node.y);
      await tw.to(node, { x: p.x, y: p.y }, { duration: (d / 170) * speed, ease: ease.linear });
      sfx.tick();
    };
    await go(o.gate[0]);
    const right = this.gates[0];
    const second = right ? 2 : 1;
    await go(o.gate[second]);
    // The first gate was read when the egg passed it; the second is read now.
    const exit = right ? (this.gates[2] ? 3 : 2) : this.gates[1] ? 1 : 0;
    await go(o.exit[exit]);
    await go({ x: o.bin[exit].x, y: o.bin[exit].y - 10 });
    const want = this.plan.mode === 'sort' && egg.shell === 'white' ? this.target.nest : this.target.basket;
    if (exit === want) {
      sfx.sparkle();
      this.ctx.particles.burst(node.x, node.y - 30, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 12, speed: [100, 240], gravity: 0, life: [0.5, 0.8] });
      node.destroy();
      this.caughtCount++;
      this.wrongs = 0;
      this.hinting = false;
      void this.ctx.say('count', { n: this.caughtCount });
      if (this.caughtCount >= this.plan.eggs) return void this.finale();
    } else {
      this.miss(this.plan.mode === 'predict' ? 'egg.predictwrong' : 'egg.wrongway');
      this.hatch(node);
    }
    this.routed++;
    await tw.wait(0.8);
    void this.nextRoute();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    for (const h of this.hens) h.cheer();
    sfx.tada();
    await this.ctx.say('egg.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class EggIcon extends WigglyIcon {
  private readonly h: Critter;
  constructor() {
    const c = new Container();
    const h = hen();
    h.scale.set(0.5);
    h.y = -60;
    const b = basketArt();
    b.scale.set(0.8);
    b.y = -10;
    const e1 = eggArt('brown');
    e1.position.set(-30, -40);
    const e2 = eggArt('white');
    e2.position.set(20, -36);
    c.addChild(h, e1, e2, b);
    super(c);
    this.h = h;
  }
  update(dt: number) {
    super.update(dt);
    this.h.update(dt);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const b = basketArt();
  b.y = 30;
  c.addChild(b);
  for (let i = 0; i < 3; i++) {
    const e = eggArt(rng.chance(0.6) ? 'brown' : 'white');
    e.position.set((i - 1) * 44, -10 - (i % 2) * 10);
    c.addChildAt(e, 0);
  }
  return c;
}

export const eggCatch: GameModule = {
  id: 'egg-catch',
  name: 'Egg Catch',
  titleLine: 'game.egg-catch',
  region: 'barnyard',
  skills: ['tracking', 'hand-eye', 'colors', 'prediction'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Point and say "here it comes!" as each egg rolls down.',
  offScreen: 'Roll a ball down a cardboard tube and catch it in a bowl.',
  hubIcon: () => new EggIcon(),
  sticker,
  create: (ctx) => new EggCatch(ctx),
};
