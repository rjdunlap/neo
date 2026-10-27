import { CapacityGame } from './compare';
import { PairGame } from './pair';
import { PourGame } from './pour';
import { Circle, Container, Graphics, Sprite } from 'pixi.js';
import { ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
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
  countSign,
  contentFor,
  describeFill,
  landingSpots,
  groundTap,
  kindFor,
  nextTouch,
  outsideIndexes,
  planFor,
  startState,
  tap,
  targetFor,
  type CountSign,
  type FillEvent,
  type FillState,
  type Hint,
  type Rect,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 6, order: [1, 2, 6, 3, 4] },
  preschool: { min: 1, max: 7, order: [1, 2, 6, 3, 4, 5, 7] },
};

import { BASKET_SCALE, BODY_H, Basket, FRUITS, GROUND_SCALE, fillPiece, line } from './basket';

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

/** Dots on the count sign sit this far apart, up to three to a row. */
const DOT_GAP = 46;
const DOT_R = 17;
const DOTS_PER_ROW = 3;
const SIGN_PAD = 14;

/**
 * The count sign beside the basket in the counting levels: a card with one hollow dot for each fruit asked for, filled
 * as fruit goes in, and a filled dot hanging below the card for each fruit beyond the number, so "too many" shows
 * without a word or a color. Decoration only: it takes no touches.
 */
class CountSignCard extends Container {
  private readonly card = new Graphics();
  private readonly dots = new Graphics();
  private readonly extras = new Graphics();
  /** The sign's card, as drawn: its half width and height, for placing it. */
  halfW = 0;
  halfH = 0;

  constructor(private readonly color: ColorName) {
    super();
    this.addChild(this.card, this.dots, this.extras);
    this.eventMode = 'none';
  }

  /** Redraw for what the basket holds now. */
  show(sign: CountSign) {
    const cols = Math.min(DOTS_PER_ROW, sign.slots);
    const rows = Math.ceil(sign.slots / DOTS_PER_ROW);
    this.halfW = (cols * DOT_GAP) / 2 + SIGN_PAD;
    this.halfH = (rows * DOT_GAP) / 2 + SIGN_PAD;
    this.card.clear().roundRect(-this.halfW, -this.halfH, this.halfW * 2, this.halfH * 2, 18).fill(0xfffaf0).stroke(line(wood.line, 5));
    const d = this.dots.clear();
    const fill = swatch[this.color].fill;
    const edge = swatch[this.color].line;
    for (let i = 0; i < sign.slots; i++) {
      const row = Math.floor(i / DOTS_PER_ROW);
      const inRow = Math.min(DOTS_PER_ROW, sign.slots - row * DOTS_PER_ROW);
      const col = i % DOTS_PER_ROW;
      const x = (col - (inRow - 1) / 2) * DOT_GAP;
      const y = (row - (rows - 1) / 2) * DOT_GAP;
      d.circle(x, y, DOT_R);
      if (i < sign.filled) d.fill(fill).stroke(line(edge, 4));
      else d.fill(0xffffff).stroke({ width: 4, color: ink, alpha: 0.45 });
    }
    const e = this.extras.clear();
    for (let i = 0; i < sign.extras; i++) {
      const x = (i - (sign.extras - 1) / 2) * DOT_GAP;
      e.circle(x, this.halfH + DOT_R + 12, DOT_R).fill(fill).stroke(line(edge, 4));
    }
  }
}

interface Piece {
  view: Container;
  i: number;
}

class FillDump implements Game {
  private readonly state: FillState;
  private readonly content: ReturnType<typeof contentFor>;
  private readonly bg = new Sprite(gradientTexture(0xcdeefc, 0xfff1d6));
  private readonly floor = new Graphics();
  private readonly halo = new Graphics();
  private readonly layer = new Container();
  private readonly basket: Basket;
  private readonly tick = drawTick();
  /** The count sign, in the counting levels only. */
  private readonly sign: CountSignCard | null;
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
  private idle = 0;
  private invitation: { target: 'basket' | number; elapsed: number } | null = null;
  private glow: { target: 'tick' | 'basket' | number; left: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    const plan = planFor(ctx.level);
    this.state = startState(plan, targetFor(plan, ctx.rng));
    this.content = contentFor(plan, ctx.rng);
    this.basket = new Basket(1, this.content.set.id);
    this.spotSeed = ctx.rng.int(1, 1e9);
    ctx.stage.addChild(this.bg, this.floor, this.halo, this.basket.back, this.layer, this.basket.front, this.tick);
    this.tick.visible = this.state.target !== null;
    this.halo.visible = false;

    onTap(this.basket.back, () => this.touchBasket(), { cooldown: 60 });
    onTap(this.basket.front, () => this.touchBasket(), { cooldown: 60 });
    this.basket.back.hitArea = this.basket.front.hitArea;
    onTap(this.tick, () => this.touchTick(), { cooldown: 250 });

    if (this.state.target === null) onTap(this.floor, (e) => {
      const action = groundTap(this.state, this.spots, this.ctx.stage.toLocal(e.global));
      if (!action || this.finished || this.busy) return;
      this.resetInvitation();
      this.basket.squish();
      sfx.tick();
      this.handle(tap(this.state, action));
    }, { cooldown: 80 });

    // Tip-out mixes four designs; counting uses identical pieces, with one shared sign color.
    const colors: ColorName[] = ['red', 'blue', 'yellow', 'green'];
    for (let i = 0; i < plan.pieces; i++) {
      const view = fillPiece(this.content.set, this.content.variants[i]);
      view.hitArea = new Circle(0, 0, PIECE_HIT / GROUND_SCALE);
      onTap(view, () => this.touchPiece(i), { cooldown: 80 });
      this.layer.addChild(view);
      this.pieces.push({ view, i });
    }
    // The count sign shows the number asked for, in the counted pieces’ color.
    this.sign = this.state.target === null ? null : new CountSignCard(this.content.set.id === 'fruit' ? FRUITS[this.content.variants[0]].color : colors[this.content.variants[0]]);
    if (this.sign) {
      ctx.stage.addChild(this.sign);
      this.showSign();
    }
    this.layout(ctx.view);
    this.snapAll();
  }

  /** The sign redrawn for what the basket holds now. */
  private showSign() {
    const sign = countSign(this.state);
    if (this.sign && sign) this.sign.show(sign);
  }

  start() {
    const t = this.state.target;
    void (t === null ? this.ctx.instruct('fill.tip', this.content.set) : this.ctx.instruct('fill.put', { n: t, ...this.content.set }));
  }

  resize(v: View) {
    this.layout(v);
    this.snapAll();
  }

  update(dt: number) {
    this.clock += dt;
    this.basket.update(dt);
    // Lap invitation only: no speech, halo or accounting, and no motion over an active flight.
    if (this.state.target === null && !this.finished && !this.gone) {
      if (this.busy || this.flying > 0) this.resetInvitation();
      else {
        this.idle += dt;
        if (this.idle >= 6 && !this.invitation) {
          const next = groundTap(this.state, this.spots, { x: this.bx, y: this.rimY });
          this.invitation = { target: next?.on === 'basket' && next.pick !== undefined ? next.pick : 'basket', elapsed: 0 };
          this.idle = 0;
        }
        if (this.invitation) {
          const invite = this.invitation;
          invite.elapsed += dt;
          const rotation = Math.sin(invite.elapsed * Math.PI * 6) * 0.12 * Math.max(0, 1 - invite.elapsed / 0.7);
          if (invite.target === 'basket') this.basket.lean = rotation;
          else this.pieces[invite.target].view.rotation = rotation;
          if (invite.elapsed >= 0.7) this.resetInvitation();
        }
      }
    }
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
    this.resetInvitation();
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
    // The sign stands to the left of the basket, its dots level with the basket's middle and its extras hanging below.
    this.sign?.position.set(this.bx - 240, this.rimY + BODY_H / 2 - 20);
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

  private resetInvitation() {
    if (this.invitation?.target === 'basket') this.basket.lean = 0;
    else if (this.invitation) this.pieces[this.invitation.target].view.rotation = 0;
    this.invitation = null;
    this.idle = 0;
  }

  // ---- Touches --------------------------------------------------------------------------------------------------

  private touchBasket() {
    this.resetInvitation();
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
    this.resetInvitation();
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
        void this.ctx.instruct('fill.put', { n: this.state.target!, ...this.content.set });
        return;
      case 'wrong':
        sfx.boing();
        this.basket.nope();
        void this.ctx.say('fill.wrong', { n: this.state.target!, have: ev.have, ...this.content.set });
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
      this.showSign();
      this.settle();
    });
  }

  private comeOut(i: number) {
    const p = this.pieces[i];
    this.flying++;
    sfx.bell(3, 0.25);
    this.showSign();
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
          sfx.pop(4 + (p.i % 4) + this.content.set.pitch);
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
    void this.ctx.instruct('fill.scoop', this.content.set);
  }

  /** After every piece lands in the basket: the basket is full again, or the round is over. */
  private settle() {
    if (this.flying > 0 || this.busy || this.finished || this.state.target !== null) return;
    if (this.state.order.length !== this.state.plan.pieces) return;
    if (this.state.done) void this.finale();
    else void this.ctx.instruct('fill.again', this.content.set);
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    // Let the last piece land.
    while (this.flying > 0) await tw.wait(0.05);
    const t = this.state.target;
    await (t === null ? this.ctx.say('fill.done') : this.ctx.say('fill.made', { n: t, ...this.content.set }));
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
    void this.ctx.say(h === 'check' ? 'fill.hintcheck' : h === 'remove' ? 'fill.hintremove' : 'fill.hintadd', this.content.set);
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
  skills: ['containment', 'counting', 'cause-effect', 'capacity'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeFill,
  music: STYLES.stickers,
  coplayHint: 'Tip the container together and say "out they come!", then count aloud as {name} puts each piece back in: "one, two, three".',
  offScreen: {
    all: 'Give a big bowl and some soft toys, blocks or dry beans in a tub: filling, dumping and scooping is the same game.',
    // Under 3: no dry beans (small parts).
    lap: 'Give a big bowl and some soft toys or blocks in a tub: filling, dumping and scooping is the same game.',
    toddler: 'Give a big bowl and some soft toys or blocks in a tub: filling, dumping and scooping is the same game.',
  },
  hubIcon: () => new BasketIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => {
    const kind = kindFor(ctx.level);
    return kind === 'capacity' ? new CapacityGame(ctx) : kind === 'pour' ? new PourGame(ctx) : kind === 'pair' ? new PairGame(ctx) : new FillDump(ctx);
  },
};
