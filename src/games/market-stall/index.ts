import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { prop, type PropKind } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  CARD_HIT,
  COIN_R,
  matCoinScale,
  matSlot,
  TAG,
  tagMarks,
  countOn,
  purseCards,
  purseMiss,
  stallFor,
  stallLayout,
  MAT_BOX,
  purseFor,
  goodPlacement,
  type StallId,
  PLANS,
  PIP_LEVELS,
  PIP_NUMERAL,
  pips,
  teachLine,
  coinToName,
  countsUp,
  showsTotal,
  totalShown,
  TOTAL_SLATE,
  countUpSaid,
  tenStrip,
  stripLayout,
  paidCoins,
  paidFor,
  countUpHint,
  hintCountsUp,
  missKind,
  hintCharge,
  stickerGood,
  anotherWay,
  fewest,
  makeOrders,
  paymentFor,
  payTouch,
  planFor,
  sameWay,
  sum,
  target,
  usesFewestCoins,
  type Order,
  type ShopPlan,
} from './logic';

const GOODS: { kind: PropKind; color: ColorName; name: string }[] = [
  { kind: 'apple', color: 'red', name: 'apple' },
  { kind: 'orange', color: 'orange', name: 'orange' },
  { kind: 'lemon', color: 'yellow', name: 'lemon' },
  { kind: 'pear', color: 'green', name: 'pear' },
  { kind: 'grapes', color: 'purple', name: 'bunch of grapes' },
  { kind: 'blueberries', color: 'blue', name: 'box of blueberries' },
];

/** Round-only scenery and stock; GOODS above remains the six-fruit sticker recipe. */
export const STALLS = {
  fruit: { awning: 'red', keeper: 'pig', goods: GOODS },
  flower: {
    awning: 'purple',
    keeper: 'cat',
    goods: [
      { kind: 'flower', color: 'pink', name: 'pink flower' },
      { kind: 'flower', color: 'yellow', name: 'yellow flower' },
      { kind: 'flower', color: 'purple', name: 'purple flower' },
      { kind: 'flower', color: 'blue', name: 'blue flower' },
    ],
  },
  balloon: {
    awning: 'teal',
    keeper: 'bear',
    goods: [
      { kind: 'balloon', color: 'red', name: 'red balloon' },
      { kind: 'balloon', color: 'yellow', name: 'yellow balloon' },
      { kind: 'balloon', color: 'blue', name: 'blue balloon' },
      { kind: 'balloon', color: 'pink', name: 'pink balloon' },
    ],
  },
} satisfies Record<StallId, { awning: ColorName; keeper: keyof typeof CRITTERS; goods: typeof GOODS }>;

const COIN_COLOR: Record<number, ColorName> = { 1: 'yellow', 2: 'teal', 3: 'green', 5: 'pink', 10: 'purple' };
const COIN_LOOK = (value: number) => ({ color: COIN_COLOR[value], r: COIN_R[value] });

/** A shell coin: bigger coins are worth more, and each shows its number. */
export function coinArt(value: number): Container {
  const { color, r } = COIN_LOOK(value);
  const sw = swatch[color];
  const c = new Container();
  const g = new Graphics()
    .circle(0, 3, r)
    .fill(sw.line)
    .circle(0, 0, r)
    .fill(sw.fill)
    .stroke({ width: 4, color: sw.line });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.circle(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.08).fill({ color: 0xffffff, alpha: 0.6 });
  }
  c.addChild(g, label(String(value), r * 0.95, ink));
  return c;
}

/** A coin for the stall: at the first levels it also shows its value as pips, on a layer of its own (fresh 2). */
function shopCoin(value: number, level: number): Container {
  const c = coinArt(value);
  if (level > PIP_LEVELS) return c;
  const r = COIN_R[value];
  // Shrink and lift the numeral so the pips sit clear of it.
  c.children[1].scale.set(PIP_NUMERAL.scale);
  c.children[1].y = r * PIP_NUMERAL.y;
  const g = new Graphics();
  for (const d of pips(value, r)) g.circle(d.x, d.y, d.r).fill(ink);
  c.addChild(g);
  return c;
}

/** A price tag: the numeral and counting dots; from 11, a ten bar for the first ten and dots for the ones (`tagMarks`). */
export function tagArt(price: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-TAG.w / 2, -TAG.h / 2, TAG.w, TAG.h, 16)
      .fill(0xffffff)
      .stroke({ width: 5, color: wood.line })
      .circle(0, TAG.hole.y, TAG.hole.r)
      .fill(wood.line),
  );
  const marks = tagMarks(price);
  const n = label(String(price), marks.numeral.size, ink);
  n.y = marks.numeral.y;
  c.addChild(n);
  const g = new Graphics();
  if (marks.bar) {
    const { x, y, cell, h } = marks.bar;
    for (let i = 0; i < 10; i++)
      g.rect(x + i * cell, y, cell, h)
        .fill(swatch.green.fill)
        .stroke({ width: 1.5, color: swatch.green.line });
    g.rect(x, y, cell * 10, h).stroke({ width: 3, color: swatch.green.line });
  }
  for (const d of marks.dots) g.circle(d.x, d.y, d.r).fill(swatch.green.fill);
  c.addChild(g);
  return c;
}

/** The purse the coins were tipped out of, open on the counter (purse levels). */
function pouchArt(): Graphics {
  const sw = swatch.brown;
  const g = new Graphics();
  g.moveTo(-50, -30)
    .bezierCurveTo(-80, 10, -60, 50, 0, 50)
    .bezierCurveTo(60, 50, 80, 10, 50, -30)
    .closePath()
    .fill(sw.fill)
    .stroke({ width: 5, color: sw.line, join: 'round' });
  g.ellipse(0, -32, 54, 14).fill(sw.line);
  g.roundRect(-58, -16, 116, 12, 6).fill(swatch.red.fill);
  g.position.set(0, -48);
  return g;
}

class MarketStall implements Game {
  readonly stallId: StallId;
  readonly plan: ShopPlan;
  readonly orders: Order[];
  /** Coins on the counter, in the order they were put down. */
  readonly onMat: { value: number; node: Container }[] = [];
  readonly purse: { value: number; node: Container }[] = [];
  readonly bell: RoundButton;
  readonly mat = new Container();
  index = -1;
  /** On 'ways' levels: the first way paid for this order, or null before it. */
  firstWay: number[] | null = null;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly stall = new Graphics();
  private readonly keeper: Critter;
  private readonly goods = new Container();
  private readonly ghost = new Container();
  /** On purse levels: the three number cards along the foot, and the glow the hint puts behind the right one. */
  readonly cards: { n: number; node: Container }[] = [];
  readonly glow = new Graphics();
  /** On change levels: the ten strip under the tag, redrawn as change lands (fresh 4). */
  private strip: Graphics | null = null;
  /** The running total on the counter, where the game also says it; null when nothing is shown. */
  shownTotal: number | null = null;
  private readonly slate = new Container();
  private readonly slateNumber = label('', 34, ink);
  private view: View;
  private wrongs = 0;
  /** Exact but inefficient payments heard at the bell this order. The second is a supported miss. */
  private fewestOffers = 0;
  private hinted = false;
  private hintCharged = false;
  private names: string[] = [];
  /** Coin values already named this game start (fresh 1). */
  private readonly named = new Set<number>();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.orders = makeOrders(this.plan, ctx.rng);
    this.stallId = stallFor(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.55,
        clouds: 2,
        sun: true,
        seed: 29,
      },
      ctx.view,
    );
    this.keeper = new Critter(CRITTERS[STALLS[this.stallId].keeper]);
    this.keeper.scale.set(0.5);
    ctx.track(this.keeper);
    this.mat.eventMode = 'static';
    onTap(this.mat, (e) => this.takeBack(e), { cooldown: 120 });
    this.bell = new RoundButton(this.bellArt(), swatch.white, 56, () => void this.pay());
    this.ghost.eventMode = 'none';
    this.slate.eventMode = 'none';
    this.slate.position.set(TOTAL_SLATE.x, TOTAL_SLATE.y);
    this.slate.addChild(
      new Graphics()
        .roundRect(-TOTAL_SLATE.w / 2, -TOTAL_SLATE.h / 2, TOTAL_SLATE.w, TOTAL_SLATE.h, 12)
        .fill(0xffffff)
        .stroke({ width: 5, color: wood.line }),
      this.slateNumber,
    );
    this.slate.visible = false;
    this.mat.addChild(this.slate);
    ctx.stage.addChild(this.backdrop, this.keeper, this.stall, this.goods, this.mat, this.ghost, this.bell);
    this.glow
      .roundRect(-CARD_HIT.w / 2 - 14, -CARD_HIT.h / 2 - 14, CARD_HIT.w + 28, CARD_HIT.h + 28, 26)
      .fill({ color: swatch.yellow.fill, alpha: 0.85 });
    this.glow.visible = false;
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.glow);
    // A purse level asks how much is already on the counter, so there is no purse to pay from and no bell.
    const counting = this.plan.mode === 'purse';
    this.bell.visible = !counting;
    if (counting) this.bell.eventMode = 'none';
    for (const value of counting ? [] : this.plan.coins) {
      const node = shopCoin(value, ctx.level);
      node.scale.set(1.25);
      node.hitArea = new Circle(0, 0, 46);
      onTap(node, () => this.add(value), { cooldown: 140 });
      this.purse.push({ value, node });
      ctx.stage.addChild(node);
    }
  }

  private bellArt() {
    const g = new Graphics();
    g.poly([-26, 14, -20, -14, 0, -26, 20, -14, 26, 14])
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    g.roundRect(-32, 12, 64, 10, 5).fill(swatch.yellow.line).circle(0, -30, 6).fill(swatch.yellow.line);
    return g;
  }

  get order() {
    return this.orders[this.index];
  }

  start() {
    void this.next();
  }

  private counterY() {
    return stallLayout(this.view).cy;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cy = this.counterY();
    const { cx, stockX, awningTop } = stallLayout(v);
    const s = this.stall.clear();
    const awning = swatch[STALLS[this.stallId].awning];
    // An awning with stripes, two posts and a counter.
    s.rect(cx - 330, awningTop + 10, 20, cy - awningTop - 10)
      .rect(cx + 310, awningTop + 10, 20, cy - awningTop - 10)
      .fill(wood.fill);
    for (let i = 0; i < 8; i++)
      s.rect(cx - 340 + i * 85, awningTop, 85, 56).fill(i % 2 ? 0xffffff : awning.fill);
    s.rect(cx - 340, awningTop, 680, 56).stroke({ width: 5, color: awning.line });
    // Scalloped edge hanging below the stripes.
    for (let i = 0; i < 8; i++)
      s.moveTo(cx - 340 + i * 85, awningTop + 56).arc(
        cx - 297.5 + i * 85,
        awningTop + 56,
        42.5,
        Math.PI,
        0,
        true,
      );
    s.fill(awning.fill);
    s.roundRect(cx - 360, cy, 720, 50, 14)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    s.rect(cx - 340, cy + 50, 680, 200)
      .fill(wood.light)
      .stroke({ width: 5, color: wood.line });
    this.keeper.position.set(cx + 200, cy + 20);
    this.goods.position.set(stockX, cy);
    // The mat where coins go, on the front of the stall.
    const mw = MAT_BOX.w;
    this.mat.position.set(cx - 50, cy + 140);
    this.mat.hitArea = new Rectangle(-mw / 2, -80, mw, MAT_BOX.h);
    this.drawMat(mw);
    this.layoutMat();
    this.bell.position.set(cx + mw / 2 + 30, cy + 140);
    const homes = purseFor(v, this.purse.length);
    this.purse.forEach((p, i) => p.node.position.set(homes[i].x, homes[i].y));
    this.ghost.position.set(this.mat.x, this.mat.y);
    this.placeCards();
  }

  /** The number cards stand where the purse's coins would, clear of the guide. */
  private placeCards() {
    const homes = purseFor(this.view, this.cards.length);
    this.cards.forEach((c, i) => c.node.position.set(homes[i].x, homes[i].y));
    const lit = this.cards.find((c) => c.n === (this.order ? target(this.plan, this.order) : -1));
    if (lit) this.glow.position.set(lit.node.x, lit.node.y);
  }

  private matArt = new Graphics();

  private drawMat(w: number) {
    if (!this.matArt.parent) this.mat.addChildAt(this.matArt, 0);
    this.matArt
      .clear()
      .roundRect(-w / 2, -70, w, 140, 26)
      .fill(swatch.green.light)
      .stroke({ width: 5, color: swatch.green.line });
  }

  /** Coins sit on the mat in rows of six. */
  private layoutMat() {
    this.onMat.forEach((c, i) => {
      const at = matSlot(i);
      c.node.position.set(at.x, at.y);
    });
  }

  update() {}

  /** The ghost finger: put the coins of the payment on the counter one at a time, then ring the bell. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.order) return null;
    if (this.order.purse) {
      const want = target(this.plan, this.order);
      const card = this.cards.find((c) => c.n === want);
      return card ? { tap: { on: card.node } } : null;
    }
    const touch = payTouch(
      paymentFor(this.plan, this.order, this.firstWay),
      this.onMat.map((c) => c.value),
    );
    if (touch === 'bell') return { tap: { on: this.bell } };
    const coin = this.purse.find((p) => p.value === touch.coin);
    return coin ? { tap: { on: coin.node } } : null;
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    this.hintCharged = false;
    this.fewestOffers = 0;
    this.firstWay = null;
    this.clearGhost();
    this.glow.visible = false;
    this.cards.splice(0).forEach((c) => c.node.destroy({ children: true }));
    if (this.index >= this.orders.length) return void this.finale();
    const o = this.order;
    if (o.purse) this.layPurse(o.purse);
    this.goods.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.names = [];
    o.prices.forEach((price, i) => {
      const good = this.ctx.rng.pick(STALLS[this.stallId].goods.filter((g) => !this.names.includes(g.name)));
      this.names.push(good.name);
      const art = prop(good.kind, good.color);
      const place = goodPlacement(good.kind, o.prices.length, i);
      art.scale.set(place.scale);
      art.position.set(place.x, place.y);
      const tag = tagArt(price);
      tag.position.set(art.x, -150);
      this.goods.addChild(art, tag);
    });
    if (o.purse) this.goods.addChild(pouchArt());
    if (this.plan.mode === 'change') {
      // The customer's payment on the counter beside the fruit: a 10, or two 10s for a 20.
      for (const c of paidCoins(paidFor(this.plan))) {
        const coin = coinArt(c.value);
        coin.position.set(c.x, c.y);
        this.goods.addChild(coin);
      }
    }
    this.strip = null;
    if (countsUp(this.plan)) {
      this.strip = new Graphics();
      this.strip.position.set(0, stripLayout(paidFor(this.plan)).y);
      this.goods.addChild(this.strip);
      this.drawStrip();
    }
    this.goods.alpha = 0;
    await this.ctx.tw.to(this.goods, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    const n = o.prices[0];
    if (this.plan.mode === 'pair')
      return this.ctx.instruct('shop.pair', { a: this.names[0], n, b: this.names[1], m: o.prices[1] });
    if (this.plan.mode === 'change')
      return this.ctx.instruct(paidFor(this.plan) > 10 ? 'shop.change20' : 'shop.change', {
        fruit: this.names[0],
        n,
      });
    if (this.plan.mode === 'fewest') return this.ctx.instruct('shop.fewest', { fruit: this.names[0], n });
    if (o.purse) return this.ctx.instruct('shop.purse');
    return this.ctx.instruct('shop.pay', { fruit: this.names[0], n });
  }

  private add(value: number) {
    if (this.busy || this.finished) return;
    if (this.onMat.length >= 12) {
      sfx.boing();
      void this.ctx.say('shop.full');
      return;
    }
    const node = shopCoin(value, this.ctx.level);
    node.eventMode = 'none';
    node.scale.set(matCoinScale(this.plan));
    this.mat.addChild(node);
    this.onMat.push({ value, node });
    this.layoutMat();
    const end = { x: node.x, y: node.y };
    const from = this.mat.toLocal(this.purse.find((p) => p.value === value)!.node.getGlobalPosition());
    node.position.set(from.x, from.y);
    void this.ctx.tw.to(node, end, { duration: 0.22, ease: ease.outQuad });
    sfx.pop(4 + value);
    // A coin that is new at this level is named the first time it lands; otherwise count on aloud,
    // except where adding up is the puzzle.
    const total = sum(this.onMat.map((c) => c.value));
    const word = coinToName(this.ctx.level, value, this.named);
    if (word) {
      this.named.add(value);
      const purse = this.purse.find((p) => p.value === value)!.node;
      const big = purse.scale.x;
      void this.ctx.tw
        .to(purse.scale, { x: big * 1.25, y: big * 1.25 }, { duration: 0.18, ease: ease.outQuad })
        .then(() => this.ctx.tw.to(purse.scale, { x: big, y: big }, { duration: 0.2, ease: ease.outQuad }));
      void this.ctx.say('shop.name', { word });
    } else if (countsUp(this.plan)) {
      // The coin's value, then a count up from the price as the change lands: "2. 7… 8, 9".
      const price = this.order.prices[0];
      this.drawStrip();
      void this.ctx.say('shop.countup', { n: countUpSaid(price, total - value, value) });
    } else if (showsTotal(this.plan)) void this.ctx.say('count', { n: total });
    else void this.ctx.say('count', { n: value });
    this.drawTotal();
  }

  /**
   * A purse level: its coins lie on the counter at once, largest first, and three number cards come up along the foot. The
   * coins stay put; a tap on one only says what it is worth.
   */
  private layPurse(purse: number[]) {
    this.onMat.splice(0).forEach((c) => c.node.destroy({ children: true }));
    for (const value of purse) {
      const node = shopCoin(value, this.ctx.level);
      node.eventMode = 'none';
      node.alpha = 0;
      this.mat.addChild(node);
      this.onMat.push({ value, node });
      void this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.3 });
    }
    this.layoutMat();
    for (const n of purseCards(purse, this.ctx.rng)) {
      const node = new Container();
      node.addChild(tile(104, 110, 'white'), label(String(n), 52, ink));
      node.hitArea = new Rectangle(-CARD_HIT.w / 2, -CARD_HIT.h / 2, CARD_HIT.w, CARD_HIT.h);
      onTap(node, () => void this.tapCard(n), { cooldown: 300 });
      this.cards.push({ n, node });
      this.ctx.stage.addChild(node);
    }
    this.placeCards();
  }

  /** The coin nearest a tap on the mat. */
  private nearest(e: FederatedPointerEvent) {
    const p = this.mat.toLocal(e.global);
    let best = 0;
    this.onMat.forEach((c, i) => {
      if (
        Math.hypot(c.node.x - p.x, c.node.y - p.y) <
        Math.hypot(this.onMat[best].node.x - p.x, this.onMat[best].node.y - p.y)
      )
        best = i;
    });
    return best;
  }

  /** A little hop for a coin that is being counted or named. */
  private hop(node: Container) {
    void this.ctx.tw
      .to(node.scale, { x: 1.2, y: 1.2 }, { duration: 0.15, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outQuad }));
  }

  /** Tap the mat: the coin nearest the finger goes back to the purse, or on a purse level says its own value (never scored). */
  private takeBack(e: FederatedPointerEvent) {
    if (this.busy || this.finished || !this.onMat.length) return;
    const best = this.nearest(e);
    if (this.order?.purse) {
      const coin = this.onMat[best];
      sfx.pop(4 + coin.value);
      this.hop(coin.node);
      void this.ctx.say('count', { n: coin.value });
      return;
    }
    const [c] = this.onMat.splice(best, 1);
    c.node.destroy({ children: true });
    this.layoutMat();
    this.drawStrip();
    this.drawTotal();
    sfx.pop(3);
  }

  private async pay() {
    if (this.busy || this.finished) return;
    const coins = this.onMat.map((c) => c.value);
    if (!coins.length) {
      sfx.boing();
      return;
    }
    this.busy = true;
    const want = target(this.plan, this.order);
    const got = sum(coins);
    const n = this.order.prices.reduce((a, b) => a + b, 0);
    const twenty = this.plan.mode === 'change' && paidFor(this.plan) > 10;
    if (got === want && this.firstWay && sameWay(coins, this.firstWay)) {
      await this.wrong('shop.sameway', {});
      return;
    }
    if (got !== want) {
      const kind = missKind(this.plan, this.order, coins)!;
      const lines = {
        price: twenty ? 'shop.price20' : 'shop.price',
        'one-price': 'shop.oneprice',
        'counted-coins': this.plan.coins.includes(10) ? 'shop.values.ten' : 'shop.values',
        'one-more': 'shop.one.more',
        'one-less': 'shop.one.less',
        'big-coin': 'shop.big',
        short: twenty
          ? 'shop.change20.short'
          : this.plan.mode === 'change'
            ? 'shop.change.short'
            : 'shop.short',
        over: twenty ? 'shop.change20.over' : this.plan.mode === 'change' ? 'shop.change.over' : 'shop.over',
      } as const;
      await this.wrong(lines[kind], { n });
      return;
    }
    if (this.plan.mode === 'fewest' && !usesFewestCoins(want, this.plan.coins, coins)) {
      this.fewestOffers++;
      if (this.fewestOffers >= 2) await this.wrong('shop.fewer', { n: want });
      else {
        await this.ctx.say('shop.fewer', { n: want });
        this.busy = false;
      }
      return;
    }
    await this.slideOver();
    if (this.plan.mode === 'ways' && !this.firstWay) {
      this.firstWay = coins;
      this.wrongs = 0;
      this.hinted = false;
      // The second purchase must be paid another way (the same coins are a miss), so this is the instruction now.
      await this.ctx.instruct('shop.again');
      this.busy = false;
      return;
    }
    await this.ctx.say('shop.thanks');
    await this.ctx.tw.to(this.goods, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /** Paid, or the purse counted: the coins slide over the counter to the shopkeeper, who cheers. */
  private async slideOver() {
    sfx.bell(7, 0.3);
    sfx.bell(9, 0.3);
    this.clearGhost();
    const to = this.mat.toLocal(this.keeper.getGlobalPosition());
    await Promise.all(
      this.onMat.map((c) =>
        this.ctx.tw.to(c.node, { x: to.x, y: to.y - 60, alpha: 0 }, { duration: 0.4, ease: ease.inQuad }),
      ),
    );
    this.onMat.splice(0).forEach((c) => c.node.destroy({ children: true }));
    this.drawTotal();
    this.keeper.cheer();
    this.ctx.pet.cheer();
  }

  /**
   * A purse level's answer. The right total sends the purse to the shopkeeper. A wrong card names its kind (the number of
   * coins, or one off); the second miss counts the purse aloud largest first, each coin hopping, and lights the right card.
   */
  private async tapCard(n: number) {
    const purse = this.order?.purse;
    if (this.busy || this.finished || !purse) return;
    this.busy = true;
    const card = this.cards.find((c) => c.n === n)!.node;
    const kind = purseMiss(purse, n);
    if (kind === null) {
      this.glow.visible = false;
      this.hop(card);
      await this.slideOver();
      await this.ctx.say('shop.purse.right', { n });
      await Promise.all([
        this.ctx.tw.to(this.goods, { alpha: 0 }, { duration: 0.3 }),
        ...this.cards.map((c) => this.ctx.tw.to(c.node, { alpha: 0 }, { duration: 0.3 })),
      ]);
      await this.next();
      return;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(
      kind === 'coins' ? 'shop.purse.coins' : kind === 'near' ? 'shop.purse.near' : 'shop.purse.other',
    );
    if (this.wrongs >= 2 && !this.hinted) {
      this.hints += hintCharge(this.wrongs, this.hinted, this.hintCharged);
      this.hintCharged = true;
      this.hinted = true;
      this.placeCards();
      this.glow.visible = true;
      // The coins are already largest first, so each hops as its running total is said.
      this.onMat.forEach((c, i) => void this.ctx.tw.wait(0.6 * i).then(() => this.hop(c.node)));
      await this.ctx.say('shop.purse.hint', { n: countOn(purse).join(', ') });
    }
    this.busy = false;
  }

  private async wrong(
    line:
      | 'shop.short'
      | 'shop.over'
      | 'shop.change.short'
      | 'shop.change.over'
      | 'shop.change20.short'
      | 'shop.change20.over'
      | 'shop.price20'
      | 'shop.sameway'
      | 'shop.fewer'
      | 'shop.price'
      | 'shop.oneprice'
      | 'shop.values'
      | 'shop.values.ten'
      | 'shop.one.more'
      | 'shop.one.less'
      | 'shop.big',
    vars: { n?: number },
  ) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.hinted) {
      this.hints += hintCharge(this.wrongs, this.hinted, this.hintCharged);
      this.hintCharged = true;
      this.hinted = true;
      // A strategy first, then one payment that follows it (fresh 7).
      const teach = teachLine(this.plan, this.firstWay);
      if (teach) await this.ctx.say(teach === 'swap' ? 'shop.hint.swap' : 'shop.hint.biggest');
      const want = target(this.plan, this.order);
      // From a 20 the hint counts up: the change smallest first, so from below 15 the count passes 15 on its way to 20.
      const up = hintCountsUp(this.plan)
        ? countUpHint(this.order.prices[0], paidFor(this.plan), this.plan.coins)
        : null;
      const idea = up
        ? up.coins
        : this.firstWay
          ? anotherWay(want, this.plan.coins, this.firstWay)
          : fewest(want, this.plan.coins);
      idea.forEach((v, i) => {
        const c = shopCoin(v, this.ctx.level);
        c.alpha = 0.45;
        c.scale.set(0.7);
        c.position.set(-200 + i * 60, -110);
        this.ghost.addChild(c);
      });
      if (up)
        void this.ctx.say('shop.hint.countup', { n: `${this.order.prices[0]}… ${up.stops.join(', ')}` });
      else void this.ctx.say('shop.hint');
    }
    this.busy = false;
  }

  /**
   * One cell per shell up to what the customer paid (a strip of ten, or two for a 20): the price filled, then one cell per
   * shell of change; too much turns the edge red.
   */
  private drawStrip() {
    if (!this.strip || !this.order) return;
    const paid = paidFor(this.plan);
    const { cells, over } = tenStrip(this.order.prices[0], sum(this.onMat.map((c) => c.value)), paid);
    const at = stripLayout(paid);
    const g = this.strip.clear();
    cells.forEach((cell, i) => {
      const fill = cell === 'price' ? swatch.green.fill : cell === 'change' ? swatch.yellow.fill : 0xffffff;
      const r = at.cells[i];
      g.rect(r.x, r.y, r.w, r.h).fill(fill).stroke({ width: 2, color: ink });
    });
    g.roundRect(at.frame.x, at.frame.y, at.frame.w, at.frame.h, 6).stroke({
      width: 4,
      color: over ? swatch.red.line : wood.line,
    });
  }

  /** The slate shows what is on the counter so far, so the count survives a missed or muted voice. It never judges the amount. */
  private drawTotal() {
    this.shownTotal = totalShown(
      this.plan,
      this.onMat.map((c) => c.value),
    );
    this.slate.visible = this.shownTotal !== null;
    if (this.shownTotal !== null) this.slateNumber.text = String(this.shownTotal);
  }

  private clearGhost() {
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('shop.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class StallIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    for (let i = 0; i < 4; i++) g.rect(-100 + i * 50, -200, 50, 34).fill(i % 2 ? 0xffffff : swatch.red.fill);
    g.rect(-96, -166, 10, 120).rect(86, -166, 10, 120).fill(wood.fill);
    g.roundRect(-110, -60, 220, 34, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
    c.addChild(g);
    const apple = prop('apple', 'red');
    apple.position.set(-40, -70);
    c.addChild(apple);
    const coin = coinArt(5);
    coin.position.set(50, -100);
    c.addChild(coin);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const good = GOODS[stickerGood(rng)];
  const art = prop(good.kind, good.color);
  art.scale.set(1.6);
  art.y = -20;
  c.addChild(art);
  [1, 2, 5].forEach((v, i) => {
    const coin = coinArt(v);
    coin.position.set(-70 + i * 70, 80);
    coin.scale.set(0.8);
    c.addChild(coin);
  });
  return c;
}

export const marketStall: GameModule = {
  id: 'market-stall',
  name: 'Market Stall',
  titleLine: 'game.market-stall',
  region: 'cozy-village',
  challenge: 'numbers',
  skills: ['counting', 'money', 'adding', 'counting-on'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => PLANS[level - 1]?.name,
  music: STYLES.stickers,
  coplayHint: 'Take turns being the shopkeeper: "That will be 4, please!" and count the coins together.',
  offScreen: 'Play shop with real coins or buttons: price a few toys and pay for them.',
  hubIcon: () => new StallIcon(),
  touchDemo: true,
  upright: true,
  sticker,
  create: (ctx) => new MarketStall(ctx),
};
