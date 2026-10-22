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
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  complete,
  customerToServe,
  makeCustomerChoices,
  type CustomerChoice,
  CONE_KINDS,
  dressShop,
  FLAVORS,
  makeOrders,
  nextNeeded,
  planFor,
  scoopToTake,
  tryScoop,
  type ConeKind,
  type Order,
  type ScoopPlan,
  type WindowScene,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 10, order: [10, 1] },
  toddler: { min: 1, max: 11, order: [1, 2, 11, 3] },
  preschool: { min: 2, max: 11, order: [2, 11, 3, 4, 5] },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 6 },
};

const SCOOP_R = 34;
const SCOOP_STEP = 44;
const CUSTOMERS: CritterName[] = ['cat', 'dog', 'bear', 'bunny', 'pig', 'cow', 'pip', 'duck'];
/** The thank-you names the flavor on top: strawberry, mint, blueberry, lemon, chocolate, grape. */
const YUM: Partial<Record<ColorName, LineId>> = {
  pink: 'scoop.yum.pink',
  green: 'scoop.yum.green',
  blue: 'scoop.yum.blue',
  yellow: 'scoop.yum.yellow',
  brown: 'scoop.yum.brown',
  purple: 'scoop.yum.purple',
};
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

/** A paper cup with a fluted rim. Its top sits where a cone's does, so scoops stack the same. */
function cupArt(scale = 1): Graphics {
  const fill = swatch.blue.light;
  const line = swatch.blue.line;
  const g = new Graphics().poly([-38, 0, 38, 0, 28, 74, -28, 74]).fill(fill).stroke({ width: 5, color: line, join: 'round' });
  for (const x of [-14, 0, 14]) g.moveTo(x * 1.4, 8).lineTo(x, 68);
  g.stroke({ width: 3, color: line, alpha: 0.6 });
  // The fluted rim: a row of little scallops along the top.
  for (let i = 0; i < 6; i++) {
    const x = -38 + 6.33 + i * 12.67;
    g.moveTo(x - 6.33, 0).arc(x, 0, 6.33, Math.PI, 0);
  }
  g.fill(0xffffff).stroke({ width: 3, color: line });
  g.scale.set(scale);
  return g;
}

/** A wide, shallow waffle bowl with the cone's lattice. */
function bowlArt(scale = 1): Graphics {
  const pts: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (Math.PI * i) / 16;
    pts.push(48 * Math.cos(a), 34 * Math.sin(a));
  }
  const g = new Graphics().poly(pts).fill(WAFFLE.fill).stroke({ width: 5, color: WAFFLE.line, join: 'round' });
  for (const x of [-24, 0, 24]) g.moveTo(x - 12, 4).lineTo(x + 8, 30 - Math.abs(x) * 0.4);
  for (const x of [-24, 0, 24]) g.moveTo(x + 12, 4).lineTo(x - 8, 30 - Math.abs(x) * 0.4);
  g.moveTo(-40, 16).lineTo(40, 16);
  g.stroke({ width: 3, color: WAFFLE.line });
  g.ellipse(0, 0, 50, 7).fill(WAFFLE.fill).stroke({ width: 4, color: WAFFLE.line });
  g.scale.set(scale);
  return g;
}

const holderArt = (kind: ConeKind, scale = 1) => (kind === 'cup' ? cupArt(scale) : kind === 'bowl' ? bowlArt(scale) : coneArt(scale));

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

  constructor(kind: ConeKind) {
    super();
    this.addChild(holderArt(kind), this.scoops);
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
  readonly choices: CustomerChoice[];
  readonly guests: (Critter | null)[] = [null, null];
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
  private guestSerial = 0;
  private hinted = false;
  private peeked = false;
  private hidden = false;
  private lastTalk = -10;
  private clock = 0;
  private readonly kinds: CritterName[];
  private readonly scene: WindowScene;
  private readonly cones: ConeKind[];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    ({ flavors: this.flavors, orders: this.orders } = makeOrders(this.plan, ctx.rng));
    this.choices = this.plan.mode === 'customer' ? makeCustomerChoices(this.flavors, ctx.rng) : [];
    this.kinds = ctx.rng.shuffle([...CUSTOMERS]);
    ({ scene: this.scene, cones: this.cones } = dressShop(this.plan.customers, ctx.rng));
    this.tubGlow.eventMode = 'none';
    this.bubble.eventMode = 'none';
    ctx.stage.addChild(this.wall, this.room, this.people, this.counter, this.bubble, this.tubGlow);
    for (const color of this.flavors) {
      const tub = tubArt(color);
      tub.visible = this.plan.mode !== 'customer';
      onTap(tub, () => this.tapTub(color), { radius: 72, cooldown: 200 });
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
    return { x: this.view.w * (this.plan.mode === 'customer' ? 0.5 : 0.68), y: this.counterTop - 66 };
  }

  resize(v: View) {
    this.view = v;
    this.wall.width = v.w;
    this.wall.height = v.h;
    const top = this.counterTop;
    const r = this.room.clear();
    // A striped awning and a window onto the round's scene.
    const stripes = Math.ceil(v.w / 80);
    for (let i = 0; i < stripes; i++) r.rect(i * 80, 0, 80, 64).fill(i % 2 ? 0xffffff : swatch.pink.fill);
    for (let i = 0; i < stripes; i++) r.circle(i * 80 + 40, 64, 40).fill(i % 2 ? 0xffffff : swatch.pink.fill);
    this.drawWindow(r, v.w * 0.5, 130, v.w * 0.4, top - 190);
    const c = this.counter.clear();
    c.rect(0, top, v.w, v.h - top).fill(wood.fill);
    c.rect(0, top, v.w, 26).fill(wood.light).stroke({ width: 4, color: wood.line });
    for (let x = 40; x < v.w; x += 120) c.moveTo(x, top + 40).lineTo(x, v.h).stroke({ width: 3, color: wood.line, alpha: 0.4 });
    const cs0 = this.coneSpot();
    c.roundRect(cs0.x - 46, top - 30, 92, 44, 12).fill(0xc9d3dc).stroke({ width: 4, color: 0x8c9aa8 });
    c.ellipse(cs0.x, top - 30, 40, 9).fill(0x8c9aa8);
    const xs = spread(this.flavors.length, 150, v.w - 40, 140);
    this.flavors.forEach((color, i) => this.tubs.get(color)!.position.set(xs[i], v.h - 70));
    this.guests.forEach((guest, side) => guest?.position.set(this.view.w * (side ? 0.76 : 0.25), this.counterTop + 18));
    if (this.customer && this.plan.mode !== 'customer') this.customer.position.copyFrom(this.customerSpot());
    if (this.cone) this.cone.position.copyFrom(this.coneSpot());
    const cs = this.customerSpot();
    this.bubble.position.set(cs.x + 220, Math.max(top - 190, 280));
  }

  /** The window: the beach, a village street, or evening lanterns. Scenery only; it changes no rule. */
  private drawWindow(r: Graphics, x: number, y: number, w: number, h: number) {
    const evening = this.scene === 'lanterns';
    r.roundRect(x, y, w, h, 18).fill(evening ? 0x4a4f8f : 0xbfe6fb);
    if (this.scene === 'beach') {
      r.rect(x + 4, y + h - 120, w - 8, 66).fill(0x7cc6ea);
      r.rect(x + 4, y + h - 60, w - 8, 56).fill(0xf6dfb0);
      r.circle(x + w - 60, y + 50, 26).fill(swatch.yellow.fill);
    } else if (this.scene === 'street') {
      const n = Math.max(2, Math.floor(w / 110));
      const hw = (w - 30) / n;
      const roofs: ColorName[] = ['red', 'blue', 'green', 'orange'];
      for (let i = 0; i < n; i++) {
        const hx = x + 15 + i * hw;
        const hb = y + h - 40;
        const ht = hb - Math.min(110, h * 0.45) - (i % 2) * 18;
        r.rect(hx + 6, ht, hw - 12, hb - ht).fill(i % 2 ? 0xfff1d6 : 0xffe0e6).stroke({ width: 3, color: 0xc7a98a });
        r.poly([hx, ht, hx + hw / 2, ht - 40, hx + hw, ht]).fill(swatch[roofs[i % roofs.length]].fill);
        r.roundRect(hx + hw / 2 - 12, hb - 40, 24, 40, 8).fill(wood.fill);
      }
      r.rect(x + 4, y + h - 40, w - 8, 36).fill(0xd8d2c8);
    } else {
      r.circle(x + 50, y + 44, 20).fill(0xfff6c8);
      r.circle(x + 58, y + 38, 18).fill(0x4a4f8f);
      for (let i = 0; i < 18; i++) r.circle(x + 30 + ((i * 97) % (w - 60)), y + 24 + ((i * 53) % (h * 0.5)), 2.5).fill(0xffffff);
      // A string of lanterns sagging across the window.
      const sy = y + h * 0.42;
      r.moveTo(x + 8, sy).quadraticCurveTo(x + w / 2, sy + 50, x + w - 8, sy).stroke({ width: 3, color: 0x2e3260 });
      const colors: ColorName[] = ['red', 'yellow', 'orange', 'pink'];
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        const lx = x + 8 + (w - 16) * t;
        const ly = sy + 100 * t * (1 - t) + 14;
        r.circle(lx, ly, 26).fill({ color: 0xfff3a0, alpha: 0.25 });
        r.roundRect(lx - 14, ly - 16, 28, 32, 10).fill(swatch[colors[i - 1]].fill);
      }
      r.rect(x + 4, y + h - 50, w - 8, 46).fill(0x2f6a4a);
    }
    r.roundRect(x, y, w, h, 18).stroke({ width: 8, color: 0xffffff });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.tubGlow.clear();
    if (this.plan.mode === 'customer') {
      const guest = this.guests[this.choices[this.customerIndex]?.match];
      if (this.hinted && guest && !this.busy) g.roundRect(guest.x - 78, guest.y - 365, 156, 130, 24).stroke({ width: 10, color: 0xffe478, alpha: 0.8 + 0.2 * Math.sin(this.clock * 7) });
      return;
    }
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
    if (this.plan.mode === 'customer') {
      const guest = this.guests[this.choices[this.customerIndex].match];
      return guest ? { tap: { on: guest, x: 0, y: -150 } } : null;
    }
    // The last level: wait for the picture to hide, so the order is scooped from memory and never copied.
    if (this.plan.mode === 'memory' && !this.hidden && cone.colors.length === 0) return null;
    const color = scoopToTake(this.plan, order, cone.colors, this.flavors);
    const tub = color && this.tubs.get(color);
    return tub ? { tap: { on: tub, x: 0, y: -20 } } : null;
  }

  destroy() {}

  // Customers -------------------------------------------------------------------------

  private async nextChoice() {
    this.busy = true;
    this.customerIndex++;
    const choice = this.choices[this.customerIndex];
    if (!choice) return void this.end();
    this.wrongs = 0;
    this.hinted = false;
    const arrivals: Promise<unknown>[] = [];
    for (let side = 0; side < 2; side++) {
      if (this.guests[side]) continue;
      const guest = new Critter(CRITTERS[this.kinds[this.guestSerial++ % this.kinds.length]]);
      guest.scale.set(0.72);
      guest.position.set(side ? this.view.w + 160 : -160, this.counterTop + 18);
      const picture = new Container();
      picture.eventMode = 'none';
      picture.addChild(new Graphics().roundRect(-95, -490, 190, 150, 28).fill(0xffffff).stroke({ width: 5, color: 0xb9c6d1 }));
      const scoop = scoopArt(choice.pictures[side], 43);
      scoop.position.set(0, -420);
      picture.addChild(scoop);
      guest.addChild(picture);
      onTap(guest, () => this.tapGuest(side), { cooldown: 600 });
      guest.hitArea = new Rectangle(-150, -500, 300, 500);
      this.ctx.track(guest);
      this.people.addChild(guest);
      this.guests[side] = guest;
      arrivals.push(this.ctx.tw.to(guest, { x: this.view.w * (side ? 0.76 : 0.25) }, { duration: 0.7, ease: ease.outBack }));
    }
    const cone = new Cone(this.cones[this.customerIndex]);
    cone.add(choice.scoop);
    cone.position.copyFrom(this.coneSpot());
    onTap(cone, () => this.wobble(cone, 0.12), { cooldown: 300 });
    cone.hitArea = new Rectangle(-55, -60, 110, 160);
    this.cone = cone;
    this.ctx.stage.addChildAt(cone, this.ctx.stage.getChildIndex(this.bubble));
    await Promise.all(arrivals);
    this.busy = false;
    void this.ctx.instruct('scoop.customer', { a: choice.scoop });
  }

  private tapGuest(side: number) {
    const guest = this.guests[side];
    if (!guest) return;
    guest.poke();
    if (this.busy || this.finished) { sfx.giggle(); return; }
    const choice = this.choices[this.customerIndex];
    if (customerToServe(choice, side)) {
      this.customer = guest;
      this.guests[side] = null;
      void this.serve();
    } else {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      this.wobble(guest, 0.08);
      void this.ctx.say('scoop.notme', { a: choice.pictures[side] });
      if (this.wrongs >= 2 && !this.hinted) { this.hinted = true; this.hints++; }
    }
  }

  private async nextCustomer() {
    if (this.plan.mode === 'customer') return this.nextChoice();
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
    // Tapping the customer: a peek on the last level (the picture hid), elsewhere the order said again, free.
    onTap(critter, () => (this.plan.mode === 'memory' ? void this.peek() : this.tapCustomer(critter)), { cooldown: 600 });
    critter.hitArea = new Circle(0, -150, 150);

    const cone = new Cone(this.cones[this.customerIndex] ?? 'cone');
    onTap(cone, () => this.wobble(cone, 0.12), { cooldown: 300 });
    cone.hitArea = new Rectangle(-55, -230, 110, 330);
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
        return this.ctx.instruct(this.ctx.level === 10 ? 'scoop.any' : 'scoop.free');
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
    const h = this.plan.mode === 'free' ? 150 : count ? 190 : 110 + order.scoops.length * 40;
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
      if (this.ctx.level === 10) {
        heart.scale.set(0.45);
        heart.position.set(40, -12);
        const mini = holderArt(this.cones[this.customerIndex], 0.5);
        mini.position.set(-10, -65);
        const scoop = scoopArt('pink', 25);
        scoop.position.set(-10, -78);
        this.bubble.addChild(mini, scoop);
      }
      this.bubble.addChild(heart);
    } else if (count) {
      // The numeral, and under it that many scoops in a row, so the card shows "three" to a child who cannot read 3.
      const n = order.scoops.length;
      const numeral = label(String(n), 72, ink);
      numeral.anchor.set(0.5);
      numeral.position.set(0, -140);
      this.bubble.addChild(numeral);
      order.scoops.forEach((c, i) => {
        const s = scoopArt(c, 18);
        s.position.set((i - (n - 1) / 2) * 42, -62);
        this.bubble.addChild(s);
      });
    } else {
      const mini = new Container();
      mini.addChild(holderArt(this.cones[this.customerIndex] ?? 'cone', 0.6));
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
    if (!order || !this.hidden || this.busy) {
      // The picture is still showing (or nobody is ordering): a giggle, never a hint.
      this.customer?.poke();
      sfx.giggle();
      return;
    }
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

  /** Every tap on a tub answers: it squashes, and while a scoop is in the air (or nobody is ordering) it wobbles and pops. */
  private tapTub(color: ColorName) {
    const tub = this.tubs.get(color)!;
    const tw = this.ctx.tw;
    tw.kill(tub.scale);
    tub.scale.set(1.08, 0.86);
    void tw.to(tub.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    if (this.busy || this.finished || !this.order || !this.cone) {
      sfx.pop(5 + this.flavors.indexOf(color));
      this.wobble(tub, 0.1);
      return;
    }
    void this.scoop(color);
  }

  /** A little side-to-side shake that settles; never fights a move already under way. */
  private wobble(obj: Container, angle: number) {
    const tw = this.ctx.tw;
    if (tw.busy(obj)) return;
    void tw
      .to(obj, { rotation: angle }, { duration: 0.08 })
      .then(() => tw.to(obj, { rotation: -angle }, { duration: 0.12 }))
      .then(() => tw.to(obj, { rotation: 0 }, { duration: 0.1 }));
  }

  /** Levels 1–5: the customer giggles and says the order again. Free, never a hint: nothing was hidden. */
  private tapCustomer(critter: Critter) {
    critter.poke();
    sfx.giggle();
    const order = this.order;
    if (order && this.customer === critter && !this.busy) void this.askOrder(order);
  }

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
      // Free play and counting count each scoop aloud as it lands.
      if (this.plan.mode === 'free' || this.plan.mode === 'count') void this.ctx.say('count', { n: cone.colors.length });
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
    const top = cone.colors[cone.colors.length - 1];
    const mouth = { x: critter.x + 70, y: critter.y - 70 };
    this.ctx.stage.addChild(cone);
    // A wobble from a last tap stops here, and the cone stops taking touches so a poke at the eating customer reaches them.
    tw.kill(cone);
    cone.eventMode = 'none';
    // As it slides over, the cone plays itself bottom to top: each scoop bobs and sings its tub's note.
    const slide = tw.to(cone, { x: mouth.x, y: mouth.y + 40, rotation: -0.3 }, { duration: 0.6, ease: ease.inOutSine });
    const scoops = [...cone.scoops.children];
    for (const [i, s] of scoops.entries()) {
      sfx.pop(5 + this.flavors.indexOf(cone.colors[i]));
      void tw.to(s.scale, { x: 1.18, y: 1.18 }, { duration: 0.07 }).then(() => tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.1 }));
      await tw.wait(Math.min(0.2, 0.75 / scoops.length));
    }
    await slide;
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
    await this.ctx.say((top && YUM[top]) || 'scoop.yum');
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
  const cone = holderArt(rng.pick(CONE_KINDS), 1.2);
  cone.y = -20;
  c.addChild(cone);
  rng
    .shuffle([...FLAVORS])
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
  entryLevels: [10],
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
