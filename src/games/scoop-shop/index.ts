import { Circle, Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { complete, makeOrders, nextNeeded, planFor, scoopToTake, tryScoop, type Order, type ScoopPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 6 },
};

const SCOOP_R = 34;
const SCOOP_STEP = 44;
const CUSTOMERS: CritterName[] = ['cat', 'dog', 'bear', 'bunny', 'pig', 'cow'];
const WAFFLE = { fill: 0xe8b46a, line: 0xb07a3a };

/** One scoop of ice cream, with a drippy edge and a shine. */
export function scoopArt(color: ColorName, r = SCOOP_R): Graphics {
  const sw = swatch[color];
  const g = new Graphics();
  g.circle(0, 0, r).fill(sw.fill).stroke({ width: 4, color: sw.line });
  for (const x of [-0.6, 0, 0.6]) g.circle(x * r, r * 0.62, r * 0.32).fill(sw.fill);
  g.moveTo(-r * 0.95, r * 0.35).quadraticCurveTo(0, r * 0.75, r * 0.95, r * 0.35).stroke({ width: 4, color: sw.line });
  g.ellipse(-r * 0.35, -r * 0.4, r * 0.24, r * 0.14).fill({ color: 0xffffff, alpha: 0.6 });
  return g;
}

function coneArt(scale = 1): Graphics {
  const g = new Graphics()
    .poly([-34, 0, 34, 0, 0, 96])
    .fill(WAFFLE.fill)
    .stroke({ width: 5, color: WAFFLE.line, join: 'round' });
  for (const t of [0.3, 0.6]) g.moveTo(-34 + 34 * t, 96 * t).lineTo(34 - 34 * t + 10, 0).moveTo(34 - 34 * t, 96 * t).lineTo(-34 + 34 * t - 10, 0);
  g.stroke({ width: 3, color: WAFFLE.line });
  g.scale.set(scale);
  return g;
}

/** A flavor tub on the counter, its ice cream heaped on top. */
function tubArt(color: ColorName): Container {
  const c = new Container();
  const sw = swatch[color];
  const heap = new Graphics();
  for (const [x, y, r] of [[-30, -44, 26], [0, -54, 30], [30, -44, 26]]) heap.circle(x, y, r);
  heap.fill(sw.fill).stroke({ width: 4, color: sw.line });
  const tub = new Graphics()
    .roundRect(-56, -44, 112, 82, 14)
    .fill(0xffffff)
    .stroke({ width: 5, color: 0xb9c6d1 })
    .roundRect(-56, -10, 112, 20, 6)
    .fill(sw.light);
  c.addChild(heap, tub);
  return c;
}

class Cone extends Container {
  readonly scoops = new Container();
  readonly colors: ColorName[] = [];

  constructor() {
    super();
    this.addChild(coneArt(), this.scoops);
  }

  /** Where the next scoop sits, in cone coordinates. */
  nextSpot() {
    return { x: 0, y: -12 - this.colors.length * SCOOP_STEP };
  }

  add(color: ColorName) {
    const s = scoopArt(color);
    s.position.copyFrom(this.nextSpot());
    this.colors.push(color);
    this.scoops.addChild(s);
  }
}

class ScoopShop implements Game {
  readonly plan: ScoopPlan;
  readonly flavors: ColorName[];
  readonly orders: Order[];
  readonly tubs = new Map<ColorName, Container>();
  customerIndex = -1;
  cone: Cone | null = null;
  customer: Critter | null = null;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly wall = new Sprite(gradientTexture(0xffe3ee, 0xfff4e3));
  private readonly room = new Graphics();
  private readonly counter = new Graphics();
  private readonly people = new Container();
  private readonly bubble = new Container();
  private readonly tubGlow = new Graphics();
  private readonly flying = new Container();
  private view: View;
  private wrongs = 0;
  private hinted = false;
  private peeked = false;
  private hidden = false;
  private lastTalk = -10;
  private clock = 0;
  private readonly kinds: CritterName[];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    ({ flavors: this.flavors, orders: this.orders } = makeOrders(this.plan, ctx.rng));
    this.kinds = ctx.rng.shuffle([...CUSTOMERS]);
    ctx.stage.addChild(this.wall, this.room, this.people, this.counter, this.bubble, this.tubGlow);
    for (const color of this.flavors) {
      const tub = tubArt(color);
      onTap(tub, () => void this.scoop(color), { radius: 72, cooldown: 200 });
      this.tubs.set(color, tub);
      ctx.stage.addChild(tub);
    }
    ctx.stage.addChild(this.flying);
  }

  start() {
    void this.nextCustomer();
  }

  get order(): Order | undefined {
    return this.orders[this.customerIndex];
  }

  private get counterTop() {
    return this.view.h * 0.6;
  }

  private customerSpot() {
    return { x: this.view.w * 0.3, y: this.counterTop + 18 };
  }

  private coneSpot() {
    // The cone rests in a stand on the counter, its tip tucked in.
    return { x: this.view.w * 0.68, y: this.counterTop - 66 };
  }

  resize(v: View) {
    this.view = v;
    this.wall.width = v.w;
    this.wall.height = v.h;
    const top = this.counterTop;
    const r = this.room.clear();
    // A striped awning and a window onto the beach.
    const stripes = Math.ceil(v.w / 80);
    for (let i = 0; i < stripes; i++) r.rect(i * 80, 0, 80, 64).fill(i % 2 ? 0xffffff : swatch.pink.fill);
    for (let i = 0; i < stripes; i++) r.circle(i * 80 + 40, 64, 40).fill(i % 2 ? 0xffffff : swatch.pink.fill);
    r.roundRect(v.w * 0.5, 130, v.w * 0.4, top - 190, 18).fill(0xbfe6fb).stroke({ width: 8, color: 0xffffff });
    r.rect(v.w * 0.5 + 4, top - 120, v.w * 0.4 - 8, 54).fill(0xf6dfb0);
    const c = this.counter.clear();
    c.rect(0, top, v.w, v.h - top).fill(wood.fill);
    c.rect(0, top, v.w, 26).fill(wood.light).stroke({ width: 4, color: wood.line });
    for (let x = 40; x < v.w; x += 120) c.moveTo(x, top + 40).lineTo(x, v.h).stroke({ width: 3, color: wood.line, alpha: 0.4 });
    const cs0 = this.coneSpot();
    c.roundRect(cs0.x - 46, top - 30, 92, 44, 12).fill(0xc9d3dc).stroke({ width: 4, color: 0x8c9aa8 });
    c.ellipse(cs0.x, top - 30, 40, 9).fill(0x8c9aa8);
    const xs = spread(this.flavors.length, 150, v.w - 40, 140);
    this.flavors.forEach((color, i) => this.tubs.get(color)!.position.set(xs[i], v.h - 70));
    if (this.customer) this.customer.position.copyFrom(this.customerSpot());
    if (this.cone) this.cone.position.copyFrom(this.coneSpot());
    const cs = this.customerSpot();
    this.bubble.position.set(cs.x + 220, Math.max(top - 190, 280));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.tubGlow.clear();
    if (this.hinted && this.order && this.cone && !this.busy) {
      const want = nextNeeded(this.order, this.cone.colors);
      const tub = want && this.tubs.get(want);
      if (tub) g.circle(tub.x, tub.y - 20, 80 + 5 * Math.sin(this.clock * 7)).fill({ color: 0xfff3a0, alpha: 0.75 });
    }
  }

  /** The ghost finger: the tub the order needs next (a new flavor each time in free play, the remembered order on the last level). */
  autotouch(): TouchIntent | null {
    const { order, cone } = this;
    if (this.busy || this.finished || !order || !cone) return null;
    const color = scoopToTake(this.plan, order, cone.colors, this.flavors);
    const tub = color && this.tubs.get(color);
    return tub ? { tap: { on: tub, x: 0, y: -20 } } : null;
  }

  destroy() {}

  // Customers -------------------------------------------------------------------------

  private async nextCustomer() {
    this.busy = true;
    this.customerIndex++;
    const order = this.order;
    if (!order) return void this.end();
    this.wrongs = 0;
    this.hinted = false;
    this.peeked = false;
    this.hidden = false;
    const tw = this.ctx.tw;

    const critter = new Critter(CRITTERS[this.kinds[this.customerIndex % this.kinds.length]]);
    critter.scale.set(0.72);
    const spot = this.customerSpot();
    critter.position.set(-160, spot.y);
    this.ctx.track(critter);
    this.people.addChild(critter);
    this.customer = critter;
    if (this.plan.mode === 'memory') {
      onTap(critter, () => void this.peek(), { cooldown: 600 });
      critter.hitArea = new Circle(0, -150, 150);
    }

    const cone = new Cone();
    const cs = this.coneSpot();
    cone.position.set(cs.x, cs.y);
    cone.scale.set(0);
    this.cone = cone;
    this.ctx.stage.addChildAt(cone, this.ctx.stage.getChildIndex(this.bubble));

    await tw.to(critter, { x: spot.x }, { duration: 0.7, ease: ease.outBack });
    void tw.to(cone.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    sfx.pop(6);
    this.showBubble(order);
    this.busy = false;
    await this.askOrder(order);
    if (this.plan.mode === 'memory' && this.order === order && this.cone?.colors.length === 0) {
      await tw.wait(1.2);
      if (this.order === order) this.hideBubble();
    }
  }

  private askOrder(order: Order) {
    const s = order.scoops;
    const [a, b, c] = s;
    switch (this.plan.mode) {
      case 'free':
        return this.ctx.instruct('scoop.free');
      case 'one':
        return this.ctx.instruct('scoop.one', { a });
      case 'pair':
        return a === b ? this.ctx.instruct('scoop.twosame', { a }) : this.ctx.instruct('scoop.two', { a, b });
      case 'count':
        return this.ctx.instruct('scoop.count', { n: s.length, a });
      default:
        return this.ctx.instruct('scoop.stack', { a, b, c });
    }
  }

  /** The order picture: a little cone, or a number and one scoop when counting. */
  private showBubble(order: Order) {
    this.bubble.removeChildren().forEach((x) => x.destroy({ children: true }));
    const count = this.plan.mode === 'count';
    const h = this.plan.mode === 'free' ? 150 : count ? 150 : 110 + order.scoops.length * 40;
    const w = count ? 240 : 170;
    const card = new Graphics()
      .roundRect(-w / 2, -h, w, h, 30)
      .fill(0xffffff)
      .stroke({ width: 5, color: 0xb9c6d1 })
      .poly([-w / 2 + 20, -40, -w / 2 - 50, 30, -w / 2 + 50, -20])
      .fill(0xffffff);
    card.moveTo(-w / 2 + 20, -40).lineTo(-w / 2 - 50, 30).lineTo(-w / 2 + 50, -20).stroke({ width: 5, color: 0xb9c6d1, join: 'round' });
    this.bubble.addChild(card);
    if (this.plan.mode === 'free') {
      const heart = new Graphics().circle(-18, -86, 24).circle(18, -86, 24).poly([-40, -76, 40, -76, 0, -30]).fill(swatch.pink.fill);
      this.bubble.addChild(heart);
    } else if (count) {
      const n = label(String(order.scoops.length), 84, ink);
      n.anchor.set(0.5);
      n.position.set(-50, -75);
      const s = scoopArt(order.scoops[0], 32);
      s.position.set(50, -75);
      this.bubble.addChild(n, s);
    } else {
      const mini = new Container();
      mini.addChild(coneArt(0.6));
      order.scoops.forEach((c, i) => {
        const s = scoopArt(c, 24);
        s.position.set(0, -8 - i * 32);
        mini.addChild(s);
      });
      mini.y = -64;
      this.bubble.addChild(mini);
    }
    this.bubble.visible = true;
    this.bubble.scale.set(0);
    void this.ctx.tw.to(this.bubble.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  private hideBubble() {
    this.hidden = true;
    void this.ctx.tw.to(this.bubble.scale, { x: 0, y: 0 }, { duration: 0.3 }).then(() => this.hidden && (this.bubble.visible = false));
  }

  /** Memory levels: tap the customer to see the order again (it counts as a hint). */
  private async peek() {
    const order = this.order;
    if (!order || !this.hidden || this.busy) return;
    if (!this.peeked) this.hints++;
    this.peeked = true;
    this.hidden = false;
    this.customer?.poke();
    this.showBubble(order);
    await this.askOrder(order);
    await this.ctx.tw.wait(1.2);
    if (this.order === order) this.hideBubble();
  }

  // Scooping ---------------------------------------------------------------------------

  private async scoop(color: ColorName) {
    const order = this.order;
    const cone = this.cone;
    if (this.busy || this.finished || !order || !cone) return;
    this.busy = true;
    const tw = this.ctx.tw;
    const tub = this.tubs.get(color)!;
    const result = tryScoop(this.plan, order, cone.colors, color);
    const s = scoopArt(color);
    s.position.set(tub.x, tub.y - 60);
    this.flying.addChild(s);
    sfx.pop(5 + this.flavors.indexOf(color));
    const spot = cone.toGlobal(cone.nextSpot());
    const to = this.ctx.stage.toLocal(spot);
    const peak = Math.min(s.y, to.y) - 90;
    const across = tw.to(s, { x: to.x }, { duration: 0.45, ease: ease.inOutSine });
    await tw.to(s, { y: peak }, { duration: 0.22, ease: ease.outQuad });
    await tw.to(s, { y: to.y }, { duration: 0.23, ease: ease.inQuad });
    await across;

    if (result === 'add') {
      s.destroy();
      cone.add(color);
      sfx.squish();
      this.ctx.particles.burst(to.x, to.y, { colors: [swatch[color].fill, 0xffffff], count: 6, speed: [60, 140], gravity: 300, size: [0.2, 0.35] });
      this.busy = false;
      if (complete(this.plan, order, cone.colors)) await this.serve();
      return;
    }

    // It doesn't belong: a boing off the top, and back into its tub.
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.customer?.poke();
    if (this.clock - this.lastTalk > 2) {
      this.lastTalk = this.clock;
      const want = nextNeeded(order, cone.colors) ?? color;
      const line = result === 'too-many' ? 'scoop.enough' : order.ordered ? 'scoop.notyet' : 'scoop.notthat';
      void this.ctx.say(line, { color, want });
    }
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    await tw.to(s, { x: tub.x, y: tub.y - 60 }, { duration: 0.5, ease: ease.outBack });
    s.destroy();
    this.busy = false;
  }

  /** The cone slides over, gets munched, and the customer waves off happy. */
  private async serve() {
    this.busy = true;
    const tw = this.ctx.tw;
    const cone = this.cone!;
    const critter = this.customer!;
    this.hidden = false;
    void tw.to(this.bubble.scale, { x: 0, y: 0 }, { duration: 0.25 });
    sfx.sparkle();
    const mouth = { x: critter.x + 70, y: critter.y - 70 };
    this.ctx.stage.addChild(cone);
    await tw.to(cone, { x: mouth.x, y: mouth.y + 40, rotation: -0.3 }, { duration: 0.6, ease: ease.inOutSine });
    for (const s of [...cone.scoops.children].reverse()) {
      sfx.munch();
      critter.poke();
      this.ctx.particles.burst(cone.x, cone.y + s.y, { colors: [0xffffff, 0xfff3a0], count: 5, speed: [40, 120], gravity: 200, size: [0.2, 0.3] });
      await tw.to(s.scale, { x: 0, y: 0 }, { duration: 0.22 });
      await tw.wait(0.12);
    }
    sfx.munch();
    await tw.to(cone.scale, { x: 0, y: 0 }, { duration: 0.25 });
    cone.destroy({ children: true });
    this.cone = null;
    critter.cheer();
    sfx.tada();
    await this.ctx.say('scoop.yum');
    await tw.to(critter, { x: this.view.w + 200 }, { duration: 0.9, ease: ease.inOutSine });
    this.ctx.untrack(critter);
    critter.destroy({ children: true });
    this.customer = null;
    void this.nextCustomer();
  }

  private async end() {
    this.finished = true;
    this.ctx.pet.cheer();
    await this.ctx.say('scoop.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class ShopIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const cone = coneArt(1.1);
    cone.y = -110;
    c.addChild(cone);
    (['pink', 'green', 'yellow'] as ColorName[]).forEach((color, i) => {
      const s = scoopArt(color, 36);
      s.position.set(0, -124 - i * 46);
      c.addChild(s);
    });
    const cherry = new Graphics().circle(6, -246, 14).fill(swatch.red.fill).moveTo(8, -258).quadraticCurveTo(12, -276, 24, -280).stroke({ width: 4, color: 0x4a9a35, cap: 'round' });
    c.addChild(cherry);
    super(c);
    this.hitArea = new Rectangle(-80, -290, 160, 290);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const cone = coneArt(1.2);
  cone.y = -20;
  c.addChild(cone);
  rng
    .shuffle(['pink', 'green', 'blue', 'yellow', 'brown', 'purple'] as ColorName[])
    .slice(0, 3)
    .forEach((color, i) => {
      const s = scoopArt(color, 40);
      s.position.set(0, -36 - i * 52);
      c.addChild(s);
    });
  return c;
}

export const scoopShop: GameModule = {
  id: 'scoop-shop',
  name: 'Scoop Shop',
  titleLine: 'game.scoop-shop',
  region: 'cozy-village',
  skills: ['colors', 'counting', 'sequencing', 'memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Be the customer! Ask {name} for "pink, please!" and say thank you.',
  offScreen: 'Play ice cream shop with colored pom-poms or blocks stacked in a cup.',
  hubIcon: () => new ShopIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new ScoopShop(ctx),
};
