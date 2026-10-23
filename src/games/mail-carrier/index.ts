import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { sideColumns, sideLayout, sideWrong, parity, addressedHouse, countedAloud, countsAloud, helpFixed, helpWrong, houseLooks, isMapMode, letterShows, mailboxColor, mailboxShows, makeLetters, makeStreet, nearestHouse, NEIGHBORS, planFor, shouldInvite, teenSpoken, TOOL_NAME, type HelperId, type House, type HouseLook, type MailPlan } from './logic';
import { drawProblem, drawTool } from './art';
import type { CompanionRig } from '../../creatures/companion';
import { WoodsMail } from './woods';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 10, order: [1, 2, 10] },
  preschool: { min: 2, max: 10, order: [2, 10, 3, 4] },
  prek: { min: 3, max: 12, order: [3, 4, 5, 9, 12, 6] },
  school: { min: 4, max: 15, order: [4, 5, 9, 12, 6, 13, 7, 8, 11, 14, 15] },
};

/** Dots laid out like dice faces, so small numbers can be seen at a glance. */
function dots(g: Graphics, n: number, x: number, y: number, r: number, gap: number, color: number) {
  const layouts: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[-1, 0], [1, 0]], 3: [[-1, 1], [0, 0], [1, -1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
    7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]], 8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
  };
  for (const [dx, dy] of layouts[n] ?? []) g.circle(x + dx * gap, y + dy * gap, r).fill(color);
}

class HouseView extends Container {
  readonly glow = new Graphics();
  readonly flag = new Graphics();
  readonly neighbor: Critter;
  readonly box = new Container();
  delivered = 0;
  private waving = false;

  constructor(
    readonly house: House,
    kind: CritterName,
    shows: { numeral: boolean; dots: boolean; tool: boolean },
    look: HouseLook,
    mailbox: ColorName,
  ) {
    super();
    const door = swatch[house.door];
    this.glow.roundRect(-92, -250, 184, 270, 30).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    const g = new Graphics();
    if (look.chimney) g.rect(34, -214, 26, 64).fill(swatch.brown.fill).stroke({ width: 4, color: wood.line }).rect(30, -220, 34, 10).fill(swatch.brown.line);
    g.rect(-70, -150, 140, 150).fill(cream).stroke({ width: 5, color: wood.line });
    if (look.roof === 'peak') g.poly([-86, -146, 0, -226, 86, -146]);
    else g.moveTo(-86, -146).quadraticCurveTo(0, -286, 86, -146).closePath();
    g.fill(door.line).stroke({ width: 5, color: wood.line, join: 'round' });
    g.roundRect(-24, -76, 48, 76, 8).fill(door.fill).stroke({ width: 4, color: door.line }).circle(14, -38, 4).fill(swatch.yellow.fill);
    // The window, with a neighbor who pops up when mail comes.
    const win = new Graphics().roundRect(-22, -134, 44, 40, 6).fill(0xbfe6fb).stroke({ width: 4, color: wood.line });
    this.neighbor = new Critter(CRITTERS[kind]);
    this.neighbor.scale.set(0.17);
    this.neighbor.position.set(0, -94);
    this.neighbor.visible = false;
    const mask = new Graphics().roundRect(-20, -132, 40, 36, 5).fill(0xffffff);
    this.neighbor.mask = mask;
    this.addChild(this.glow, g, win, this.neighbor, mask);
    if (look.windowBox) {
      const flowers = new Graphics().roundRect(-30, -90, 60, 12, 4).fill(wood.fill).stroke({ width: 3, color: wood.line });
      for (const [fx, c] of [[-18, swatch.pink.fill], [0, swatch.yellow.fill], [18, swatch.red.fill]] as const) flowers.circle(fx, -92, 5).fill(c);
      this.addChild(flowers);
    }

    // The mailbox out front, with its number.
    const b = new Graphics();
    b.rect(-6, -10, 12, 70).fill(wood.fill).stroke({ width: 3, color: wood.line });
    b.roundRect(-46, -66, 92, 60, 20).fill(swatch[mailbox].fill).stroke({ width: 5, color: swatch[mailbox].line });
    this.flag.rect(40, -66, 8, 40).fill(0x8c9aa8).rect(40, -66, 26, 16).fill(swatch.red.fill);
    this.box.addChild(this.flag, b);
    if (shows.tool && house.tool) {
      this.box.addChild(new Graphics().roundRect(-34, -58, 68, 44, 10).fill(0xffffff));
      const t = drawTool(house.tool, 0.55);
      t.position.set(0, -36);
      this.box.addChild(t);
    }
    if (shows.numeral || shows.dots) {
      const plate = new Graphics().roundRect(-34, -58, 68, 44, 10).fill(0xffffff);
      this.box.addChild(plate);
      if (shows.numeral) {
        const n = label(String(house.number), 38, ink);
        n.position.set(shows.dots ? -14 : 0, -36);
        this.box.addChild(n);
      }
      if (shows.dots) {
        const d = new Graphics();
        dots(d, house.number, 16, -36, 3.5, 8, ink);
        this.box.addChild(d);
      }
    }
    this.box.position.set(0, 74);
    this.flag.pivot.set(44, -26);
    this.flag.position.set(44, -26);
    this.addChild(this.box);
    this.hitArea = new Circle(0, -60, 110);
  }

  /** The flag waves hello, from wherever it rests: a free answer, never a delivery. */
  async wave(tw: GameContext['tw']) {
    if (this.waving) return;
    this.waving = true;
    const rest = this.delivered ? -1.4 : 0;
    for (const r of [rest - 0.5, rest + 0.15, rest - 0.35, rest]) {
      await tw.to(this.flag, { rotation: r }, { duration: 0.14, ease: ease.inOutSine });
      if (!this.waving) return;
    }
    this.waving = false;
  }

  /** A letter arrived: flag up, and the neighbor peeks out happily. */
  async welcome(tw: GameContext['tw']) {
    this.delivered++;
    this.waving = false;
    void tw.to(this.flag, { rotation: -1.4 }, { duration: 0.3, ease: ease.outBack });
    this.neighbor.visible = true;
    this.neighbor.y = -60;
    await tw.to(this.neighbor, { y: -94 }, { duration: 0.3, ease: ease.outBack });
    this.neighbor.cheer();
  }
}

class MailCarrier implements Game {
  readonly plan: MailPlan;
  readonly street: House[];
  readonly letters: number[];
  readonly houses: HouseView[] = [];
  readonly envelope = new Container();
  /** The pet's cart: it carries each letter along the road to a mailbox. */
  readonly cart = new Container();
  private readonly pet: CompanionRig;
  index = -1;
  misses = 0;
  hints = 0;
  /** Level 9: the helpers whose letter has landed, for the journal. */
  readonly helped = new Set<HelperId>();
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly road = new Graphics();
  private wrongs = 0;
  /** Seconds since the last touch, for level 1's invitation. */
  private idle = 0;
  private wiggling = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.street = makeStreet(this.plan.mode === 'sides' && sideColumns(ctx.view.w) === 3 ? { ...this.plan, houses: 6, top: 12 } : this.plan, ctx.rng);
    this.letters = makeLetters(this.plan, this.street, ctx.rng);
    const kinds = ctx.rng.shuffle([...NEIGHBORS]);
    // Cosmetic draws come after the letters, so a seed's deliveries stay the same.
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.55, clouds: 3, sun: true, seed: ctx.rng.int(1, 9999) }, ctx.view);
    const looks = houseLooks(this.street.length, ctx.rng);
    const mailbox = mailboxColor(this.street, ctx.rng);
    ctx.stage.addChild(this.backdrop, this.road);
    // Level 1: a touch anywhere off a house still answers (free, never a miss or a hint).
    if (this.plan.mode === 'drop') {
      const anywhere = new Container();
      anywhere.hitArea = new Rectangle(-1e4, -1e4, 2e4, 2e4);
      anywhere.eventMode = 'static';
      anywhere.on('pointerdown', (e) => this.offHouse(e.getLocalPosition(ctx.stage).x));
      ctx.stage.addChild(anywhere);
    }
    this.street.forEach((house, i) => {
      const h = new HouseView(house, kinds[i % kinds.length], mailboxShows(this.plan.mode), looks[i], mailbox);
      onTap(h, () => void this.post(i), { cooldown: 400 });
      h.on('pointerdown', () => {
        this.idle = 0;
        h.scale.set(this.plan.mode === 'sides' ? 0.832 : 1.04);
      });
      for (const up of ['pointerup', 'pointerupoutside', 'pointercancel'] as const) h.on(up, () => h.scale.set(this.plan.mode === 'sides' ? 0.8 : 1));
      ctx.track(h.neighbor);
      this.houses.push(h);
      ctx.stage.addChild(h);
    });
    // The pet's cart on the road: it rolls each letter to a mailbox. A decoration, never a touch target.
    this.pet = ctx.companion();
    this.pet.scale.set(0.3);
    this.pet.position.set(0, -24);
    ctx.track(this.pet);
    const front = new Graphics()
      .roundRect(-52, -48, 104, 40, 10).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
      .roundRect(-40, -40, 80, 8, 4).fill(swatch.red.light)
      .circle(-30, -6, 12).circle(30, -6, 12).fill(ink).circle(-30, -6, 4).circle(30, -6, 4).fill(0xffffff);
    this.cart.addChild(this.pet, front);
    this.cart.eventMode = 'none';
    this.cart.interactiveChildren = false;
    ctx.stage.addChild(this.cart, this.envelope);
  }

  get letter(): HouseView | undefined {
    const i = this.letters[this.index];
    return i === undefined ? undefined : this.houses[i];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const y = v.h - 150;
    this.road.clear().rect(0, y + 40, v.w, v.h - y).fill(0xd9d2c5).rect(0, y + 30, v.w, 14).fill(0xbfb6a6);
    for (let x = 30; x < v.w; x += 90) this.road.roundRect(x, y + 96, 50, 8, 4).fill(0xffffff);
    const xs = spread(this.houses.length, 160, v.w - 50, 178);
    this.houses.forEach((h, i) => h.position.set(xs[i], y));
    if (this.plan.mode === 'sides') {
      const layout = sideLayout(v.w, v.h, this.houses.length);
      this.houses.forEach((h, i) => { h.position.set(layout[i].x, layout[i].y); h.scale.set(layout[i].scale); });
      const roadTop = layout[0].y + 110;
      this.road.clear().rect(0, roadTop, v.w, 54).fill(0xd9d2c5);
      for (let x = 30; x < v.w; x += 90) this.road.roundRect(x, roadTop + 25, 50, 6, 3).fill(0xffffff);
    }
    this.envelope.position.set(v.w / 2, this.plan.mode === 'sides' ? 105 : 150);
    this.cart.position.set(this.cartX(this.cart.x || v.w / 2), y + 140);
  }

  update(dt: number) {
    if (!this.busy && !this.finished) this.idle += dt;
    if (shouldInvite(this.plan.mode, this.idle, this.busy, this.finished)) {
      this.idle = 0;
      void this.houses[nearestHouse(this.houses.map((h) => h.x), this.envelope.x)]?.wave(this.ctx.tw);
      void this.ctx.instruct('mail.drop');
    }
  }

  /** The cart stops in front of a mailbox, kept clear of the guide's corner. */
  private cartX(x: number) {
    return Math.max(210, Math.min(this.ctx.view.w - 70, x));
  }

  /** A touch off the houses at level 1: the envelope wiggles and the nearest mailbox's flag waves. */
  private offHouse(x: number) {
    this.idle = 0;
    if (this.finished) return;
    void this.houses[nearestHouse(this.houses.map((h) => h.x), x)]?.wave(this.ctx.tw);
    if (this.busy || this.wiggling || this.envelope.scale.x < 0.5) return;
    this.wiggling = true;
    void (async () => {
      for (const r of [0.12, -0.12, 0.06, 0]) await this.ctx.tw.to(this.envelope, { rotation: r }, { duration: 0.08, ease: ease.inOutSine });
      this.wiggling = false;
    })();
  }

  /** The ghost finger: post the letter at the house it is addressed to. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const i = addressedHouse(this.letters, this.index);
    return i === null ? null : { tap: { on: this.houses[i], y: -60 } };
  }

  destroy() {}

  /** The next letter comes out of the bag. */
  private async next() {
    this.busy = true;
    this.idle = 0;
    this.index++;
    this.wrongs = 0;
    for (const h of this.houses) h.glow.visible = false;
    const to = this.letter;
    if (!to) return void this.finale();
    this.drawEnvelope(to.house);
    this.envelope.scale.set(0);
    await this.ctx.tw.to(this.envelope.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    this.busy = false;
    const { number: n, door: color } = to.house;
    switch (this.plan.mode) {
      case 'drop':
        if (this.index === 0) await this.ctx.instruct('mail.drop');
        return;
      case 'color':
        return this.ctx.instruct('mail.color', { color });
      case 'numeral':
        return this.ctx.instruct('mail.numeral', { n });
      case 'sides':
        return this.ctx.instruct('mail.side-for', { n });
      case 'teen':
        return this.ctx.instruct('mail.teen-for', { word: teenSpoken(n).word });
      case 'tool':
        return this.ctx.instruct('mail.tool', { tool: TOOL_NAME[to.house.tool!] });
      case 'help':
        return this.ctx.instruct('mail.help');
      default:
        return this.ctx.instruct('mail.count');
    }
  }

  private drawEnvelope(house: House) {
    this.envelope.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = new Graphics();
    g.roundRect(-130, -80, 260, 160, 14).fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1 });
    g.moveTo(-130, -80).lineTo(0, 10).lineTo(130, -80).stroke({ width: 5, color: 0xd6dde4, join: 'round' });
    this.envelope.addChild(g);
    switch (letterShows(this.plan.mode)) {
      case 'color': {
        const sw = swatch[house.door];
        g.circle(0, 20, 44).fill(sw.fill).stroke({ width: 5, color: sw.line });
        break;
      }
      case 'dots': {
        g.roundRect(-60, -24, 120, 96, 16).fill(0xfff4e3).stroke({ width: 4, color: wood.line });
        dots(g, house.number, 0, 24, 9, 26, swatch.red.fill);
        break;
      }
      case 'numeral': {
        const n = label(String(house.number), 84, ink);
        n.y = 18;
        this.envelope.addChild(n);
        break;
      }
      case 'tool': {
        const t = drawTool(house.tool!, 1.5);
        t.y = 14;
        this.envelope.addChild(t);
        break;
      }
      case 'problem': {
        const p = drawProblem(house.helper!);
        p.y = 14;
        p.scale.set(1.1);
        this.envelope.addChild(p);
        break;
      }
      default:
        g.moveTo(0, 50).bezierCurveTo(-60, 10, -30, -30, 0, -6).bezierCurveTo(30, -30, 60, 10, 0, 50).fill(swatch.pink.fill);
    }
  }

  private async post(i: number) {
    const to = this.letter;
    if (!to || this.busy || this.finished) return;
    this.busy = true;
    const h = this.houses[i];
    const tw = this.ctx.tw;
    // The letter drops into the pet's cart, the cart rolls to the mailbox, and the letter hops in.
    const flying = new Graphics().roundRect(-40, -26, 80, 52, 6).fill(0xffffff).stroke({ width: 4, color: 0xb9c6d1 }).moveTo(-40, -26).lineTo(0, 4).lineTo(40, -26).stroke({ width: 3, color: 0xd6dde4 });
    flying.scale.set(0.8);
    flying.position.copyFrom(this.envelope.position);
    this.ctx.stage.addChild(flying);
    const inCart = () => ({ x: this.cart.x + 26, y: this.cart.y - 56 });
    sfx.whoosh();
    // Every tween is awaited: destroying the letter mid-tween would crash the tweener.
    await tw.to(flying, inCart(), { duration: 0.35, ease: ease.inQuad });
    const cartTo = this.cartX(h.x);
    const roll = tw.to(this.cart, { x: cartTo }, { duration: 0.45, ease: ease.inOutSine });
    await tw.to(flying, { x: cartTo }, { duration: 0.45, ease: ease.inOutSine });
    await roll;
    const target = { x: h.x, y: h.y + 40 * h.scale.y };
    const across = tw.to(flying, { x: target.x }, { duration: 0.3, ease: ease.inOutSine });
    await tw.to(flying, { y: target.y - 40 }, { duration: 0.15, ease: ease.outQuad });
    await tw.to(flying, { y: target.y }, { duration: 0.15, ease: ease.inQuad });
    await across;
    const right = this.plan.mode === 'drop' || h === to;
    if (right) {
      flying.destroy();
      sfx.pop(8);
      this.envelope.scale.set(0);
      await h.welcome(tw);
      this.ctx.particles.burst(h.x, h.y - 120, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 6, speed: [60, 140], gravity: -40, size: [0.3, 0.45] });
      const n = h.house.number;
      if (countsAloud(this.plan.mode)) await this.ctx.say('mail.counted', { counted: countedAloud(n), n });
      else if (this.plan.mode === 'numeral') await this.ctx.say('mail.number', { n });
      else if (this.plan.mode === 'teen') await this.ctx.say('mail.teen', teenSpoken(n));
      else if (this.plan.mode === 'help') {
        const id = h.house.helper!;
        this.helped.add(id);
        this.popTool(h);
        await this.ctx.say('mail.help-fixed', helpFixed(id));
      }
      await this.ctx.say('mail.thanks');
      await this.next();
      return;
    }
    // Not for this house: the letter comes politely back.
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'color') void this.ctx.say('mail.notme.color', { color: h.house.door });
    else if (this.plan.mode === 'tool') void this.ctx.say('mail.notme.tool', { tool: TOOL_NAME[h.house.tool!] });
    else if (this.plan.mode === 'help') void this.ctx.say('mail.notme.help', helpWrong(h.house.helper!, to.house.helper!));
    else if (this.plan.mode === 'sides') void this.ctx.say(parity(h.house.number) !== parity(to.house.number) ? 'mail.side-wrong' : 'mail.side-order', sideWrong(h.house.number, to.house.number));
    else void this.ctx.say('mail.notme.number', { n: h.house.number });
    await tw.to(flying, inCart(), { duration: 0.25, ease: ease.inOutSine });
    await tw.to(flying, { x: this.envelope.x, y: this.envelope.y }, { duration: 0.4, ease: ease.inOutSine });
    flying.destroy();
    if (this.wrongs >= 2) {
      to.glow.visible = true;
      this.hints++;
      this.wrongs = 0;
    }
    this.busy = false;
  }

  /** The helper holds up their tool above the house for a moment. */
  private popTool(h: HouseView) {
    const t = drawTool(h.house.tool!, 1.1);
    t.position.set(h.x, h.y - 300);
    t.scale.set(0);
    this.ctx.stage.addChild(t);
    void (async () => {
      await this.ctx.tw.to(t.scale, { x: 1.1, y: 1.1 }, { duration: 0.3, ease: ease.outBack });
      await this.ctx.tw.wait(0.9);
      await this.ctx.tw.to(t, { alpha: 0 }, { duration: 0.3 });
      t.destroy();
    })();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    for (const h of this.houses) h.neighbor.cheer();
    await this.ctx.say('mail.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.helped].map((id) => `mail-carrier:${id}`) });
  }
}

class MailIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const h = new HouseView({ number: 3, door: 'red' }, 'cat', { numeral: true, dots: false, tool: false }, { roof: 'peak', chimney: true, windowBox: true }, 'blue');
    h.scale.set(0.85);
    h.y = -40;
    const env = new Graphics().roundRect(40, -230, 90, 60, 8).fill(0xffffff).stroke({ width: 4, color: 0xb9c6d1 }).moveTo(40, -230).lineTo(85, -198).lineTo(130, -230).stroke({ width: 3, color: 0xd6dde4 });
    c.addChild(h, env);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const color = rng.pick(['red', 'blue', 'green', 'purple'] as ColorName[]);
  const env = new Graphics().roundRect(-100, -64, 200, 128, 12).fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1 }).moveTo(-100, -64).lineTo(0, 10).lineTo(100, -64).stroke({ width: 5, color: 0xd6dde4 });
  env.roundRect(52, -50, 34, 40, 4).fill(swatch[color].fill).stroke({ width: 3, color: swatch[color].line });
  c.addChild(env);
  return c;
}

export const mailCarrier: GameModule = {
  id: 'mail-carrier',
  name: 'Mail Carrier',
  titleLine: 'game.mail-carrier',
  region: 'cozy-village',
  skills: ['numerals', 'counting', 'colors', 'community', 'map reading', 'planning'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  entryLevels: [10],
  coplayHint: 'Read the house numbers together as you pass them: "two, four, five..."',
  offScreen: 'Find the number on your own front door, then spot numbers on a walk.',
  hubIcon: () => new MailIcon(),
  sticker,
  create: (ctx) => (isMapMode(planFor(ctx.level).mode) ? new WoodsMail(ctx) : new MailCarrier(ctx)),
};
