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
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { anotherWay, fewest, makeOrders, PAID, paymentFor, payTouch, planFor, sameWay, sum, target, usesFewestCoins, type Order, type ShopPlan } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 7 },
};

const GOODS: { kind: PropKind; color: ColorName; name: string }[] = [
  { kind: 'apple', color: 'red', name: 'apple' },
  { kind: 'orange', color: 'orange', name: 'orange' },
  { kind: 'lemon', color: 'yellow', name: 'lemon' },
  { kind: 'pear', color: 'green', name: 'pear' },
  { kind: 'grapes', color: 'purple', name: 'bunch of grapes' },
  { kind: 'blueberries', color: 'blue', name: 'box of blueberries' },
];

const COIN_LOOK: Record<number, { color: ColorName; r: number }> = {
  1: { color: 'yellow', r: 30 },
  2: { color: 'teal', r: 35 },
  3: { color: 'green', r: 38 },
  5: { color: 'pink', r: 40 },
  10: { color: 'purple', r: 44 },
};

/** A shell coin: bigger coins are worth more, and each shows its number. */
export function coinArt(value: number): Container {
  const { color, r } = COIN_LOOK[value];
  const sw = swatch[color];
  const c = new Container();
  const g = new Graphics().circle(0, 3, r).fill(sw.line).circle(0, 0, r).fill(sw.fill).stroke({ width: 4, color: sw.line });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.circle(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.08).fill({ color: 0xffffff, alpha: 0.6 });
  }
  c.addChild(g, label(String(value), r * 0.95, ink));
  return c;
}

function tagArt(price: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-56, -44, 112, 88, 16).fill(0xffffff).stroke({ width: 5, color: wood.line }).circle(0, -36, 6).fill(wood.line));
  const n = label(String(price), 40, ink);
  n.y = -8;
  c.addChild(n);
  // Dots for counting, five to a row.
  const dots = new Graphics();
  for (let i = 0; i < price; i++) dots.circle(-40 + (i % 5) * 20, 22 + Math.floor(i / 5) * 14, 5).fill(swatch.green.fill);
  c.addChild(dots);
  return c;
}

class MarketStall implements Game {
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
  private view: View;
  private wrongs = 0;
  /** Exact but inefficient payments heard at the bell this order. The second is a supported miss. */
  private fewestOffers = 0;
  private hinted = false;
  private names: string[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.orders = makeOrders(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.55, clouds: 2, sun: true, seed: 29 }, ctx.view);
    this.keeper = new Critter(CRITTERS[ctx.rng.pick(['pig', 'bear', 'cat', 'dog', 'cow'] as const)]);
    this.keeper.scale.set(0.5);
    ctx.track(this.keeper);
    this.mat.eventMode = 'static';
    onTap(this.mat, (e) => this.takeBack(e), { cooldown: 120 });
    this.bell = new RoundButton(this.bellArt(), swatch.white, 56, () => void this.pay());
    this.ghost.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.keeper, this.stall, this.goods, this.mat, this.ghost, this.bell);
    for (const value of this.plan.coins) {
      const node = coinArt(value);
      node.scale.set(1.25);
      node.hitArea = new Circle(0, 0, 46);
      onTap(node, () => this.add(value), { cooldown: 140 });
      this.purse.push({ value, node });
      ctx.stage.addChild(node);
    }
  }

  private bellArt() {
    const g = new Graphics();
    g.poly([-26, 14, -20, -14, 0, -26, 20, -14, 26, 14]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
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
    return Math.min(this.view.h * 0.5, 420);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cy = this.counterY();
    const cx = v.w / 2;
    const s = this.stall.clear();
    // An awning with stripes, two posts and a counter.
    s.rect(cx - 330, 70, 20, cy - 70).rect(cx + 310, 70, 20, cy - 70).fill(wood.fill);
    for (let i = 0; i < 8; i++) s.rect(cx - 340 + i * 85, 60, 85, 56).fill(i % 2 ? 0xffffff : swatch.red.fill);
    s.rect(cx - 340, 60, 680, 56).stroke({ width: 5, color: swatch.red.line });
    // Scalloped edge hanging below the stripes.
    for (let i = 0; i < 8; i++) s.moveTo(cx - 340 + i * 85, 116).arc(cx - 297.5 + i * 85, 116, 42.5, Math.PI, 0, true);
    s.fill(swatch.red.fill);
    s.roundRect(cx - 360, cy, 720, 50, 14).fill(wood.fill).stroke({ width: 6, color: wood.line });
    s.rect(cx - 340, cy + 50, 680, 200).fill(wood.light).stroke({ width: 5, color: wood.line });
    this.keeper.position.set(cx + 200, cy + 20);
    this.goods.position.set(cx - 150, cy);
    // The mat where coins go, on the front of the stall.
    const mw = 500;
    this.mat.position.set(cx - 50, cy + 140);
    this.mat.hitArea = new Rectangle(-mw / 2, -80, mw, 160);
    this.drawMat(mw);
    this.layoutMat();
    this.bell.position.set(cx + mw / 2 + 30, cy + 140);
    const xs = spread(this.purse.length, 220, v.w - 160, 170);
    this.purse.forEach((p, i) => p.node.position.set(xs[i], v.h - 85));
    this.ghost.position.set(this.mat.x, this.mat.y);
  }

  private matArt = new Graphics();

  private drawMat(w: number) {
    if (!this.matArt.parent) this.mat.addChildAt(this.matArt, 0);
    this.matArt.clear().roundRect(-w / 2, -70, w, 140, 26).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line });
  }

  /** Coins sit on the mat in rows of six. */
  private layoutMat() {
    this.onMat.forEach((c, i) => c.node.position.set(-200 + (i % 6) * 80, -32 + Math.floor(i / 6) * 64));
  }

  update() {}

  /** The ghost finger: put the coins of the payment on the counter one at a time, then ring the bell. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.order) return null;
    const touch = payTouch(paymentFor(this.plan, this.order, this.firstWay), this.onMat.map((c) => c.value));
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
    this.fewestOffers = 0;
    this.firstWay = null;
    this.clearGhost();
    if (this.index >= this.orders.length) return void this.finale();
    const o = this.order;
    this.goods.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.names = [];
    o.prices.forEach((price, i) => {
      const good = this.ctx.rng.pick(GOODS.filter((g) => !this.names.includes(g.name)));
      this.names.push(good.name);
      const art = prop(good.kind, good.color);
      art.scale.set(1.2);
      art.position.set(i * 150 - (o.prices.length - 1) * 75, -10);
      const tag = tagArt(price);
      tag.position.set(art.x, -150);
      this.goods.addChild(art, tag);
    });
    if (this.plan.mode === 'change') {
      // The customer's 10 coin, on the counter beside the fruit.
      const ten = coinArt(PAID);
      ten.position.set(150, -40);
      this.goods.addChild(ten);
    }
    this.goods.alpha = 0;
    await this.ctx.tw.to(this.goods, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    const n = o.prices[0];
    if (this.plan.mode === 'pair') return this.ctx.instruct('shop.pair', { a: this.names[0], n, b: this.names[1], m: o.prices[1] });
    if (this.plan.mode === 'change') return this.ctx.instruct('shop.change', { fruit: this.names[0], n });
    if (this.plan.mode === 'fewest') return this.ctx.instruct('shop.fewest', { fruit: this.names[0], n });
    return this.ctx.instruct('shop.pay', { fruit: this.names[0], n });
  }

  private add(value: number) {
    if (this.busy || this.finished) return;
    if (this.onMat.length >= 12) {
      sfx.boing();
      return;
    }
    const node = coinArt(value);
    node.eventMode = 'none';
    this.mat.addChild(node);
    this.onMat.push({ value, node });
    this.layoutMat();
    const end = { x: node.x, y: node.y };
    const from = this.mat.toLocal(this.purse.find((p) => p.value === value)!.node.getGlobalPosition());
    node.position.set(from.x, from.y);
    void this.ctx.tw.to(node, end, { duration: 0.22, ease: ease.outQuad });
    sfx.pop(4 + value);
    // Counting on aloud, except where adding up is the puzzle.
    const total = sum(this.onMat.map((c) => c.value));
    if (this.plan.mode === 'pair' || this.plan.mode === 'change') void this.ctx.say('count', { n: value });
    else void this.ctx.say('count', { n: total });
  }

  /** Tap the mat: the coin nearest the finger goes back to the purse. */
  private takeBack(e: FederatedPointerEvent) {
    if (this.busy || this.finished || !this.onMat.length) return;
    const p = this.mat.toLocal(e.global);
    let best = 0;
    this.onMat.forEach((c, i) => {
      if (Math.hypot(c.node.x - p.x, c.node.y - p.y) < Math.hypot(this.onMat[best].node.x - p.x, this.onMat[best].node.y - p.y)) best = i;
    });
    const [c] = this.onMat.splice(best, 1);
    c.node.destroy({ children: true });
    this.layoutMat();
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
    if (got === want && this.firstWay && sameWay(coins, this.firstWay)) {
      await this.wrong('shop.sameway', {});
      return;
    }
    if (got !== want) {
      const change = this.plan.mode === 'change';
      await this.wrong(got < want ? (change ? 'shop.change.short' : 'shop.short') : change ? 'shop.change.over' : 'shop.over', { n });
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
    // Paid: the coins slide over the counter.
    sfx.bell(7, 0.3);
    sfx.bell(9, 0.3);
    this.clearGhost();
    const to = this.mat.toLocal(this.keeper.getGlobalPosition());
    await Promise.all(this.onMat.map((c) => this.ctx.tw.to(c.node, { x: to.x, y: to.y - 60, alpha: 0 }, { duration: 0.4, ease: ease.inQuad })));
    this.onMat.splice(0).forEach((c) => c.node.destroy({ children: true }));
    this.keeper.cheer();
    this.ctx.pet.cheer();
    if (this.plan.mode === 'ways' && !this.firstWay) {
      this.firstWay = coins;
      this.wrongs = 0;
      this.hinted = false;
      await this.ctx.say('shop.again');
      this.busy = false;
      return;
    }
    await this.ctx.say('shop.thanks');
    await this.ctx.tw.to(this.goods, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async wrong(line: 'shop.short' | 'shop.over' | 'shop.change.short' | 'shop.change.over' | 'shop.sameway' | 'shop.fewer', vars: { n?: number }) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
      const want = target(this.plan, this.order);
      const idea = this.firstWay ? anotherWay(want, this.plan.coins, this.firstWay) : fewest(want, this.plan.coins);
      idea.forEach((v, i) => {
        const c = coinArt(v);
        c.alpha = 0.45;
        c.scale.set(0.7);
        c.position.set(-200 + i * 60, -110);
        this.ghost.addChild(c);
      });
      void this.ctx.say('shop.hint');
    }
    this.busy = false;
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
  const good = rng.pick(GOODS);
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
  skills: ['counting', 'money', 'adding', 'counting-on'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'Take turns being the shopkeeper: "That will be 4, please!" and count the coins together.',
  offScreen: 'Play shop with real coins or buttons: price a few toys and pay for them.',
  hubIcon: () => new StallIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new MarketStall(ctx),
};
