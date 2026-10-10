import { Circle, Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { cheek, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { prop, FRUIT_FOR, type PropKind } from '../../art/props';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  PIECE_HIT,
  basketSlot,
  describeFill,
  landingSpots,
  nextTouch,
  outsideIndexes,
  planFor,
  startState,
  tap,
  targetFor,
  type FillEvent,
  type FillState,
  type Hint,
  type Rect,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 4 },
};

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Fruit that sit well together in a basket, each with the color it always has. */
const FRUITS: { kind: PropKind; color: ColorName }[] = RAINBOW.flatMap((color) => {
  const kind = FRUIT_FOR[color];
  return kind ? [{ kind, color }] : [];
});

const GROUND_SCALE = 1.1;
const BASKET_SCALE = 0.7;
/** The basket's body is this tall above its feet; its rim is this far up. */
const BODY_H = 150;

/** A wicker basket with a handle, drawn in two parts so the fruit sits between the back of it and the front. */
class Basket {
  readonly back = new Container();
  readonly front = new Container();
  private readonly face = new Graphics();
  private pop = 0;
  private shake = 0;
  private clock = 0;
  private _lean = 0;

  constructor() {
    const rimW = 130;
    const inside = new Graphics().ellipse(0, -BODY_H, rimW, 26).fill(0x7a5330);
    const handle = new Graphics()
      .moveTo(-rimW + 14, -BODY_H)
      .bezierCurveTo(-rimW + 6, -BODY_H - 130, rimW - 6, -BODY_H - 130, rimW - 14, -BODY_H)
      .stroke(line(wood.line, 18))
      .moveTo(-rimW + 14, -BODY_H)
      .bezierCurveTo(-rimW + 6, -BODY_H - 130, rimW - 6, -BODY_H - 130, rimW - 14, -BODY_H)
      .stroke(line(wood.light, 8));
    this.back.addChild(handle, inside);

    const body = new Graphics()
      .moveTo(-rimW, -BODY_H)
      .lineTo(-104, -12)
      .quadraticCurveTo(-100, 0, -86, 0)
      .lineTo(86, 0)
      .quadraticCurveTo(100, 0, 104, -12)
      .lineTo(rimW, -BODY_H)
      .closePath()
      .fill(wood.fill)
      .stroke(line(wood.line));
    for (const y of [-112, -74, -36]) {
      const k = 1 - (y + BODY_H) / BODY_H; // narrower toward the bottom
      const half = rimW - (rimW - 100) * (1 - k);
      body.moveTo(-half + 6, y).lineTo(half - 6, y).stroke(line(wood.line, 3));
    }
    for (let x = -80; x <= 80; x += 40) body.moveTo(x, -BODY_H + 10).lineTo(x * 0.8, -6).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    const rim = new Graphics().roundRect(-rimW - 8, -BODY_H - 14, rimW * 2 + 16, 30, 15).fill(wood.light).stroke(line(wood.line));
    this.front.addChild(body, rim, this.face);
    this.drawFace(false);

    for (const part of [this.back, this.front]) part.hitArea = new Rectangle(-rimW - 10, -BODY_H - 30, rimW * 2 + 20, BODY_H + 36);
  }

  get lean() {
    return this._lean;
  }
  set lean(v: number) {
    this._lean = v;
    this.back.rotation = this.front.rotation = v;
  }

  /** A little squish when touched, and a happy face for a moment. */
  squish() {
    this.pop = 1;
    this.drawFace(true);
  }

  /** "Not quite": a head shake. */
  nope() {
    this.shake = 1;
  }

  place(x: number, y: number) {
    this.back.position.set(x, y);
    this.front.position.set(x, y);
  }

  update(dt: number) {
    this.clock += dt;
    const was = this.pop > 0;
    this.pop = Math.max(0, this.pop - dt * 3);
    if (was && this.pop === 0) this.drawFace(false);
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const s = Math.sin(this.pop * Math.PI);
    for (const part of [this.back, this.front]) {
      part.scale.set(1 + 0.06 * s, 1 - 0.07 * s);
      part.pivot.x = -10 * Math.sin(this.shake * 22) * this.shake;
    }
  }

  private drawFace(happy: boolean) {
    const f = this.face.clear();
    f.circle(-40, -80, 13).circle(40, -80, 13).fill(0xffffff).circle(-37, -77, 7).circle(43, -77, 7).fill(ink);
    f.ellipse(-72, -58, 14, 8).ellipse(72, -58, 14, 8).fill({ color: cheek, alpha: 0.55 });
    if (happy) f.ellipse(3, -50, 20, 15).fill(0x7a2e3e);
    else f.moveTo(-20, -56).quadraticCurveTo(3, -36, 26, -56).stroke(line(ink, 5));
  }
}

/** The check: a big green button that says "that many is enough". */
function drawTick(): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(0, 0, 62)
    .fill(swatch.green.fill)
    .stroke(line(swatch.green.line, 8))
    .moveTo(-26, 2)
    .lineTo(-8, 22)
    .lineTo(28, -22)
    .stroke({ width: 16, color: 0xffffff, join: 'round', cap: 'round' });
  c.addChild(g);
  c.hitArea = new Circle(0, 0, 70);
  return c;
}

interface Piece {
  view: Container;
  i: number;
}

class FillDump implements Game {
  private readonly state: FillState;
  private readonly bg = new Sprite(gradientTexture(0xcdeefc, 0xfff1d6));
  private readonly floor = new Graphics();
  private readonly halo = new Graphics();
  private readonly layer = new Container();
  private readonly basket = new Basket();
  private readonly tick = drawTick();
  private readonly pieces: Piece[] = [];
  private spots: { x: number; y: number }[] = [];
  private readonly spotSeed: number;
  /** Which landing the spots are for: each tip-out gets new ones. */
  private landing = 0;
  private bx = 0;
  private rimY = 0;
  private rect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  /** The basket is tipping: taps wait. */
  private busy = false;
  /** Pieces still flying into the basket. */
  private flying = 0;
  private finished = false;
  private gone = false;
  private clock = 0;
  private glow: { target: 'tick' | 'basket' | number; left: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    const plan = planFor(ctx.level);
    this.state = startState(plan, targetFor(plan, ctx.rng));
    this.spotSeed = ctx.rng.int(1, 1e9);
    ctx.stage.addChild(this.bg, this.floor, this.halo, this.basket.back, this.layer, this.basket.front, this.tick);
    this.tick.visible = this.state.target !== null;
    this.halo.visible = false;

    onTap(this.basket.back, () => this.touchBasket(), { cooldown: 60 });
    onTap(this.basket.front, () => this.touchBasket(), { cooldown: 60 });
    this.basket.back.hitArea = this.basket.front.hitArea;
    onTap(this.tick, () => this.touchTick(), { cooldown: 250 });

    // Fruit: a different one for each piece in a tip-out level, all one kind when she is counting.
    const rng = new Rng(this.spotSeed);
    const mixed = rng.shuffle([...FRUITS]);
    const one = rng.pick(FRUITS);
    for (let i = 0; i < plan.pieces; i++) {
      const f = this.state.target === null ? mixed[i % mixed.length] : one;
      const view = prop(f.kind, f.color);
      view.hitArea = new Circle(0, 0, PIECE_HIT / GROUND_SCALE);
      onTap(view, () => this.touchPiece(i), { cooldown: 80 });
      this.layer.addChild(view);
      this.pieces.push({ view, i });
    }
    this.layout(ctx.view);
    this.snapAll();
  }

  start() {
    const t = this.state.target;
    void (t === null ? this.ctx.instruct('fill.tip') : this.ctx.instruct('fill.put', { n: t }));
  }

  resize(v: View) {
    this.layout(v);
    this.snapAll();
  }

  update(dt: number) {
    this.clock += dt;
    this.basket.update(dt);
    if (this.glow) {
      this.glow.left -= dt;
      if (this.glow.left <= 0) {
        this.glow = null;
        this.halo.visible = false;
      } else {
        this.halo.alpha = 0.55 + 0.35 * Math.sin(this.clock * 8);
        this.followGlow();
      }
    }
  }

  destroy() {
    this.gone = true;
  }

  /** The ghost finger on the how-to card: tip the basket, scoop pieces up, or put in the number and tap the check. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.flying > 0) return null;
    const next = nextTouch(this.state);
    if (!next) return null;
    if (next.on === 'tick') return { tap: { on: this.tick } };
    if (next.on === 'basket') return { tap: { on: this.basket.front, x: 0, y: -BODY_H / 2 } };
    return { tap: { on: this.pieces[next.i].view } };
  }

  // ---- Layout ---------------------------------------------------------------------------------------------------

  private layout(v: View) {
    this.bg.width = v.w;
    this.bg.height = v.h;
    const groundY = v.h * 0.5;
    this.floor
      .clear()
      .rect(0, groundY, v.w, v.h - groundY)
      .fill(0xbfe39a)
      .rect(0, groundY, v.w, 14)
      .fill(0xa8dc8f);
    this.bx = this.state.target === null ? v.w / 2 : v.w / 2 - 70;
    this.rimY = v.h * 0.27;
    this.basket.place(this.bx, this.rimY + BODY_H);
    this.tick.position.set(this.bx + 240, this.rimY + BODY_H - 60);
    this.rect = { x: 170, y: v.h * 0.52, w: v.w - 170 - 50, h: v.h * 0.48 - 100 };
    this.deal();
  }

  /** Landing places for this tip-out, the same ones every time the view is redrawn. */
  private deal() {
    const rng = new Rng(this.spotSeed + this.landing * 7919);
    this.spots =
      landingSpots(rng, this.pieces.length, this.rect) ??
      spread(this.pieces.length, 170, this.rect.x + this.rect.w, 130).map((x) => ({ x, y: this.rect.y + this.rect.h / 2 }));
  }

  private slotAt(n: number) {
    const s = basketSlot(n);
    return { x: this.bx + s.x, y: this.rimY + s.y };
  }

  /** Every piece standing where it belongs now (no flight in progress). */
  private snapAll() {
    if (this.busy || this.flying > 0) return;
    for (const p of this.pieces) {
      this.ctx.tw.kill(p.view);
      this.ctx.tw.kill(p.view.scale);
      const slot = this.state.order.indexOf(p.i);
      const inside = slot >= 0;
      const at = inside ? this.slotAt(slot) : this.spots[p.i];
      p.view.position.set(at.x, at.y);
      p.view.scale.set(inside ? BASKET_SCALE : GROUND_SCALE);
      p.view.eventMode = inside ? 'none' : 'static';
    }
  }

  // ---- Touches --------------------------------------------------------------------------------------------------

  private touchBasket() {
    if (this.finished || this.busy) return;
    this.basket.squish();
    sfx.tick();
    // Scooping takes the piece nearest the basket, so the one she is looking at goes first.
    const out = outsideIndexes(this.state);
    let pick: number | undefined;
    let best = Infinity;
    for (const i of out) {
      const d = Math.hypot(this.spots[i].x - this.bx, this.spots[i].y - this.rimY);
      if (d < best) [best, pick] = [d, i];
    }
    this.handle(tap(this.state, { on: 'basket', pick }));
  }

  private touchPiece(i: number) {
    if (this.finished || this.busy) return;
    this.handle(tap(this.state, { on: 'piece', i }));
  }

  private touchTick() {
    if (this.finished || this.busy) return;
    sfx.tick();
    this.handle(tap(this.state, { on: 'tick' }));
  }

  private handle(ev: FillEvent) {
    switch (ev.kind) {
      case 'ignored':
        return;
      case 'dump':
        void this.dump();
        return;
      case 'in':
        this.goIn(ev.i, ev.n);
        return;
      case 'out':
        this.comeOut(ev.i);
        return;
      case 'again':
        void this.ctx.instruct('fill.put', { n: this.state.target! });
        return;
      case 'wrong':
        sfx.boing();
        this.basket.nope();
        void this.ctx.say('fill.wrong', { n: this.state.target!, have: ev.have });
        if (ev.hint) this.hint(ev.hint);
        return;
      case 'done':
        void this.finale();
        return;
    }
  }

  /** Hop up out of the basket onto the grass, or back over its rim: up, then down, with the sideways travel running through both. */
  private async hop(p: Piece, to: { x: number; y: number }, scale: number, apex: number, seconds: number) {
    const { tw } = this.ctx;
    const v = p.view;
    tw.kill(v);
    tw.kill(v.scale);
    this.layer.addChild(v);
    void tw.to(v.scale, { x: scale, y: scale }, { duration: seconds * 0.9 });
    void tw.to(v, { x: to.x }, { duration: seconds, ease: ease.outQuad });
    const peak = Math.min(v.y, to.y) - apex;
    await tw.to(v, { y: peak }, { duration: seconds * 0.45, ease: ease.outQuad });
    await tw.to(v, { y: to.y }, { duration: seconds * 0.55, ease: ease.inQuad });
  }

  private goIn(i: number, n: number) {
    const p = this.pieces[i];
    p.view.eventMode = 'none';
    this.flying++;
    sfx.marimba(1 + n, 0.4);
    if (this.state.target !== null) void this.ctx.say('fill.count', { n });
    void this.hop(p, this.slotAt(n - 1), BASKET_SCALE, 70, 0.42).then(() => {
      if (this.gone) return;
      this.flying--;
      this.basket.squish();
      this.settle();
    });
  }

  private comeOut(i: number) {
    const p = this.pieces[i];
    this.flying++;
    sfx.bell(3, 0.25);
    void this.hop(p, this.spots[i], GROUND_SCALE, 80, 0.42).then(() => {
      if (this.gone) return;
      this.flying--;
      p.view.eventMode = 'static';
    });
  }

  /** The basket tips over and the fruit tumbles out, one chime each. */
  private async dump() {
    const { tw } = this.ctx;
    this.busy = true;
    this.landing++;
    this.deal();
    sfx.clunk();
    await tw.to(this.basket, { lean: -0.95 }, { duration: 0.32, ease: ease.outBack });
    const landed: Promise<void>[] = [];
    const order = [...this.pieces].reverse();
    for (let k = 0; k < order.length; k++) {
      const p = order[k];
      sfx.bell(8 - Math.min(k, 6), 0.3);
      landed.push(
        this.hop(p, this.spots[p.i], GROUND_SCALE, 110, 0.7).then(async () => {
          if (this.gone) return;
          sfx.pop(4 + (p.i % 4));
          this.ctx.particles.burst(p.view.x, p.view.y + 30, { kind: 'dot', colors: [0xffffff, 0xfff3a0], count: 5, speed: [60, 140], gravity: 300, life: [0.25, 0.4] });
          await tw.to(p.view, { y: p.view.y - 22 }, { duration: 0.1, ease: ease.outQuad });
          await tw.to(p.view, { y: p.view.y + 22 }, { duration: 0.1, ease: ease.inQuad });
          p.view.eventMode = 'static';
        }),
      );
      await tw.wait(0.17);
    }
    await Promise.all(landed);
    await tw.to(this.basket, { lean: 0 }, { duration: 0.35, ease: ease.outBack });
    this.busy = false;
    void this.ctx.instruct('fill.scoop');
  }

  /** After every piece lands in the basket: the basket is full again, or the round is over. */
  private settle() {
    if (this.flying > 0 || this.busy || this.finished || this.state.target !== null) return;
    if (this.state.order.length !== this.state.plan.pieces) return;
    if (this.state.done) void this.finale();
    else void this.ctx.instruct('fill.again');
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    // Let the last piece land.
    while (this.flying > 0) await tw.wait(0.05);
    const t = this.state.target;
    await (t === null ? this.ctx.say('fill.done') : this.ctx.say('fill.made', { n: t }));
    const b = this.basket;
    b.squish();
    const y = this.rimY + BODY_H;
    await tw.to(b.back.position, { y: y - 40 }, { duration: 0.2, ease: ease.outQuad });
    void tw.to(b.front.position, { y: y - 40 }, { duration: 0.2, ease: ease.outQuad });
    await tw.to(b.back.position, { y }, { duration: 0.25, ease: ease.inQuad });
    void tw.to(b.front.position, { y }, { duration: 0.25, ease: ease.inQuad });
    this.ctx.particles.burst(this.bx, this.rimY, {
      kind: 'confetti',
      colors: RAINBOW.map((c) => swatch[c].fill),
      count: 60,
      speed: [300, 700],
      angle: -Math.PI / 2,
      spread: 1.6,
      gravity: 700,
      life: [1.2, 2],
    });
    sfx.tada();
    this.ctx.pet.cheer();
    await tw.wait(1.5);
    this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
  }

  // ---- Help -----------------------------------------------------------------------------------------------------

  /** A pulsing glow on what leads somewhere: a piece to add, the basket to take one out of, or the check. */
  private hint(h: Hint) {
    const target: 'tick' | 'basket' | number = h === 'check' ? 'tick' : h === 'remove' ? 'basket' : outsideIndexes(this.state)[0];
    if (target === undefined) return;
    this.glow = { target, left: 4 };
    this.halo.visible = true;
    this.followGlow();
    void this.ctx.say(h === 'check' ? 'fill.hintcheck' : h === 'remove' ? 'fill.hintremove' : 'fill.hintadd');
  }

  private followGlow() {
    const g = this.glow;
    if (!g) return;
    const at =
      g.target === 'tick'
        ? { x: this.tick.x, y: this.tick.y, r: 92 }
        : g.target === 'basket'
          ? { x: this.bx, y: this.rimY + BODY_H / 2, r: 190 }
          : { x: this.pieces[g.target].view.x, y: this.pieces[g.target].view.y, r: 82 };
    this.halo.clear().circle(at.x, at.y, at.r).fill({ color: 0xfff3a0, alpha: 0.9 });
  }
}

/** The hub's basket, with three fruit peeking over the rim and a bob now and then. */
class BasketIcon extends Container {
  private clock = 0;
  private readonly basket = new Basket();

  constructor() {
    super();
    const fruit = [FRUITS[0], FRUITS[3], FRUITS[1]];
    const top = new Container();
    this.addChild(this.basket.back, top, this.basket.front);
    fruit.forEach((f, i) => {
      const v = prop(f.kind, f.color);
      v.scale.set(BASKET_SCALE * 1.2);
      v.position.set((i - 1) * 78, -BODY_H - 10 - (i === 1 ? 26 : 0));
      top.addChild(v);
    });
    this.scale.set(0.82);
  }

  update(dt: number) {
    this.clock += dt;
    if (Math.sin(this.clock * 1.4) > 0.97) this.basket.squish();
    this.basket.update(dt);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const basket = new Basket();
  const fruit = rng.shuffle([...FRUITS]).slice(0, 3);
  const mid = new Container();
  c.addChild(basket.back, mid, basket.front);
  fruit.forEach((f, i) => {
    const v = prop(f.kind, f.color);
    v.scale.set(0.9);
    v.position.set((i - 1) * 82, -BODY_H - 20 - (i === 1 ? 30 : 0));
    mid.addChild(v);
  });
  c.scale.set(0.55);
  c.position.y = 70;
  return c;
}

export const fillDump: GameModule = {
  id: 'fill-dump',
  name: 'Fill and Dump',
  titleLine: 'game.fill-dump',
  region: 'counting-cove',
  skills: ['containment', 'counting', 'cause-effect'],
  bands: ['lap', 'toddler'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeFill,
  music: STYLES.stickers,
  coplayHint: 'Tip the basket together and say "out they come!", then count aloud as {name} puts each piece back in: "one, two, three".',
  offScreen: 'Give a big bowl and some soft toys, blocks or dry beans in a tub: filling, dumping and scooping is the same game.',
  hubIcon: () => new BasketIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new FillDump(ctx),
};
