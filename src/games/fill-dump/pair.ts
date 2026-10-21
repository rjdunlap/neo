import { Container, Graphics, Sprite } from 'pixi.js';
import { RAINBOW, swatch } from '../../art/palette';
import { prop } from '../../art/props';
import { gradientTexture } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { BASKET_SCALE, BODY_H, Basket, FRUITS } from './basket';
import {
  PAIR_FRUIT,
  PAIR_SCALE,
  PILE_SCALE,
  basketSlot,
  pairLayout,
  pairNext,
  pairTap,
  rightBasket,
  startPair,
  type PairAsk,
  type PairLayout,
  type PairState,
} from './logic';

/**
 * Level 6, Full and empty: two baskets, one full of fruit and one empty, with a little pile on the grass between them.
 * Each request names one: tip out the full one, or fill the empty one. Telling them apart is by looking; every request
 * deals a fresh pair, so nothing has to be remembered.
 */
export class PairGame implements Game {
  readonly state: PairState;
  readonly baskets = [new Basket(PAIR_SCALE), new Basket(PAIR_SCALE)] as const;
  private readonly bg = new Sprite(gradientTexture(0xcdeefc, 0xfff1d6));
  private readonly floor = new Graphics();
  private readonly halo = new Graphics();
  private readonly layer = new Container();
  /** The full basket's fruit, then the pile's. */
  private readonly fruit: Container[] = [];
  private spots: PairLayout;
  /** A basket is tipping or filling, or the next pair is being dealt: taps wait. */
  busy = false;
  private finished = false;
  private gone = false;
  private clock = 0;
  private glow: { side: 0 | 1; left: number } | null = null;
  /** What the fruit show: the dealt pair (which basket is full), and whether the request has been carried out. */
  private shown: { full: 0 | 1; acted: PairAsk | null } = { full: 0, acted: null };
  /** Fruit are tweening: a resize waits for them to stop rather than kill a tween a chain is awaiting. */
  private moving = false;
  private stale = false;

  constructor(private readonly ctx: GameContext) {
    this.state = startPair(ctx.rng);
    this.spots = pairLayout(ctx.view.w, ctx.view.h);
    for (const deco of [this.bg, this.floor, this.halo, this.layer]) deco.eventMode = 'none';
    this.halo.visible = false;
    ctx.stage.addChild(this.bg, this.floor, this.halo, ...this.baskets.map((b) => b.back), this.layer, ...this.baskets.map((b) => b.front));
    this.baskets.forEach((b, side) => {
      onTap(b.back, () => this.touch(side as 0 | 1), { cooldown: 120 });
      onTap(b.front, () => this.touch(side as 0 | 1), { cooldown: 120 });
    });
    for (let i = 0; i < PAIR_FRUIT * 2; i++) {
      const view = new Container();
      view.eventMode = 'none';
      this.layer.addChild(view);
      this.fruit.push(view);
    }
    this.layout(ctx.view);
    this.deal();
  }

  start() {
    this.ask();
  }

  resize(v: View) {
    this.layout(v);
    if (this.moving) this.stale = true;
    else this.snap();
  }

  /** The fruit have stopped: catch up with a resize that came while they moved. */
  private still() {
    this.moving = false;
    if (this.stale) this.snap();
    this.stale = false;
  }

  update(dt: number) {
    this.clock += dt;
    for (const b of this.baskets) b.update(dt);
    if (this.glow) {
      this.glow.left -= dt;
      if (this.glow.left <= 0) {
        this.glow = null;
        this.halo.visible = false;
      } else {
        this.halo.alpha = 0.55 + 0.35 * Math.sin(this.clock * 8);
        this.drawGlow();
      }
    }
  }

  destroy() {
    this.gone = true;
  }

  /** The ghost finger on the how-to card taps the basket the request names. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const side = pairNext(this.state);
    if (side === null) return null;
    return { tap: { on: this.baskets[side].front, x: 0, y: -BODY_H / 2 } };
  }

  // ---- Layout ---------------------------------------------------------------------------------------------------

  private layout(v: View) {
    this.bg.width = v.w;
    this.bg.height = v.h;
    const groundY = v.h * 0.48;
    this.floor.clear().rect(0, groundY, v.w, v.h - groundY).fill(0xbfe39a).rect(0, groundY, v.w, 14).fill(0xa8dc8f);
    this.spots = pairLayout(v.w, v.h);
    this.baskets.forEach((b, side) => b.place(this.spots.xs[side], this.spots.feetY));
    if (this.glow) this.drawGlow();
  }

  private get request() {
    return this.state.requests[Math.min(this.state.round, this.state.requests.length - 1)];
  }

  private slot(side: 0 | 1, n: number) {
    const s = basketSlot(n);
    return { x: this.spots.xs[side] + s.x * PAIR_SCALE, y: this.spots.feetY + (s.y - BODY_H) * PAIR_SCALE };
  }

  /** Fresh fruit for this request: three in the full basket, three in the pile. */
  private deal() {
    const kinds = this.ctx.rng.shuffle([...FRUITS]);
    this.fruit.forEach((view, i) => {
      view.removeChildren().forEach((c) => c.destroy({ children: true }));
      const f = kinds[i % kinds.length];
      view.addChild(prop(f.kind, f.color));
    });
    this.shown = { full: this.request.full, acted: null };
    this.snap();
  }

  /** Every fruit where the pair on show has it: in the full basket or tipped out in front of it, on the pile or in the basket it filled. */
  private snap() {
    const { full, acted } = this.shown;
    const empty = full === 0 ? 1 : 0;
    this.fruit.forEach((view, i) => {
      this.ctx.tw.kill(view);
      this.ctx.tw.kill(view.scale);
      const k = i % PAIR_FRUIT;
      const inBasket = i < PAIR_FRUIT ? acted !== 'tip' : acted === 'fill';
      const at = i < PAIR_FRUIT ? (inBasket ? this.slot(full, k) : this.spots.landing[full][k]) : inBasket ? this.slot(empty, k) : this.spots.pile[k];
      view.position.set(at.x, at.y);
      view.scale.set(inBasket ? BASKET_SCALE * PAIR_SCALE : PILE_SCALE);
      view.alpha = 1;
    });
  }

  private ask() {
    void this.ctx.instruct(this.request.ask === 'tip' ? 'fill.pair.tip' : 'fill.pair.fill');
  }

  // ---- Touches --------------------------------------------------------------------------------------------------

  private touch(side: 0 | 1) {
    if (this.finished || this.busy || this.gone) return;
    const b = this.baskets[side];
    b.squish();
    sfx.tick();
    const ev = pairTap(this.state, side);
    if (ev.kind === 'ignored') return;
    if (ev.kind === 'wrong') {
      sfx.boing();
      b.nope();
      void this.ctx.say(ev.ask === 'tip' ? 'fill.pair.nothing' : 'fill.pair.noroom');
      if (ev.hint) this.hint();
      return;
    }
    this.glow = null;
    this.halo.visible = false;
    this.moving = true;
    void (ev.ask === 'tip' ? this.tip(side) : this.fill(side)).then(() => {
      if (this.gone) return;
      this.shown.acted = ev.ask;
      if (ev.done) this.still();
      if (ev.done) void this.finale();
      else void this.next();
    });
  }

  /** Hop a fruit from where it is to `to`, up and then down. */
  private async hop(view: Container, to: { x: number; y: number }, scale: number, apex: number, seconds: number) {
    const { tw } = this.ctx;
    tw.kill(view);
    tw.kill(view.scale);
    void tw.to(view.scale, { x: scale, y: scale }, { duration: seconds * 0.9 });
    void tw.to(view, { x: to.x }, { duration: seconds, ease: ease.outQuad });
    await tw.to(view, { y: Math.min(view.y, to.y) - apex }, { duration: seconds * 0.45, ease: ease.outQuad });
    await tw.to(view, { y: to.y }, { duration: seconds * 0.55, ease: ease.inQuad });
  }

  /** The full basket leans out and its fruit tumble onto the grass in front of it. */
  private async tip(side: 0 | 1) {
    const { tw } = this.ctx;
    this.busy = true;
    const b = this.baskets[side];
    sfx.clunk();
    await tw.to(b, { lean: side === 0 ? -0.8 : 0.8 }, { duration: 0.3, ease: ease.outBack });
    if (this.gone) return;
    const landed: Promise<void>[] = [];
    for (let k = 0; k < PAIR_FRUIT; k++) {
      sfx.bell(7 - k, 0.3);
      landed.push(this.hop(this.fruit[k], this.spots.landing[side][k], PILE_SCALE, 100, 0.6));
      await tw.wait(0.15);
    }
    await Promise.all(landed);
    await tw.to(b, { lean: 0 }, { duration: 0.3, ease: ease.outBack });
    if (this.gone) return;
    await this.ctx.say('fill.pair.out');
  }

  /** The pile hops, one fruit at a time, into the empty basket. */
  private async fill(side: 0 | 1) {
    const { tw } = this.ctx;
    this.busy = true;
    for (let k = 0; k < PAIR_FRUIT; k++) {
      sfx.marimba(2 + k, 0.4);
      await this.hop(this.fruit[PAIR_FRUIT + k], this.slot(side, k), BASKET_SCALE * PAIR_SCALE, 70, 0.4);
      if (this.gone) return;
      this.baskets[side].squish();
      await tw.wait(0.05);
    }
    await this.ctx.say('fill.pair.in');
  }

  /** The fruit fade, a fresh pair is dealt, and the next request is asked. */
  private async next() {
    const { tw } = this.ctx;
    await Promise.all(this.fruit.map((view) => tw.to(view, { alpha: 0 }, { duration: 0.25 })));
    if (this.gone) return;
    this.deal();
    for (const view of this.fruit) {
      const s = view.scale.x;
      view.scale.set(0.01);
      void tw.to(view.scale, { x: s, y: s }, { duration: 0.3, ease: ease.outBack });
    }
    await tw.wait(0.3);
    this.still();
    this.busy = false;
    this.ask();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    await this.ctx.say('fill.pair.done');
    this.ctx.particles.burst(this.ctx.view.w / 2, this.spots.feetY - 150, {
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

  /** After two misses on a request, the basket it names glows. */
  private hint() {
    const side = rightBasket(this.request);
    this.glow = { side, left: 4 };
    this.halo.visible = true;
    this.drawGlow();
    void this.ctx.say(this.request.ask === 'tip' ? 'fill.pair.hinttip' : 'fill.pair.hintfill');
  }

  private drawGlow() {
    if (!this.glow) return;
    const x = this.spots.xs[this.glow.side];
    const y = this.spots.feetY - (BODY_H / 2) * PAIR_SCALE;
    this.halo.clear().circle(x, y, 165).fill({ color: 0xfff3a0, alpha: 0.9 });
  }
}
