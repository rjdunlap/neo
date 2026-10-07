import { Circle, Container, Graphics } from 'pixi.js';
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
import type { Game, GameContext, GameModule } from '../types';
import { isMapMode, letterShows, mailboxShows, makeLetters, makeStreet, planFor, type House, type MailPlan } from './logic';
import { WoodsMail } from './woods';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 4, max: 7 },
};

const NEIGHBORS: CritterName[] = ['cat', 'dog', 'bear', 'bunny', 'pig', 'cow'];

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

  constructor(
    readonly house: House,
    kind: CritterName,
    shows: { numeral: boolean; dots: boolean },
  ) {
    super();
    const door = swatch[house.door];
    this.glow.roundRect(-92, -250, 184, 270, 30).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    const g = new Graphics();
    g.rect(-70, -150, 140, 150).fill(cream).stroke({ width: 5, color: wood.line });
    g.poly([-86, -146, 0, -226, 86, -146]).fill(door.line).stroke({ width: 5, color: wood.line, join: 'round' });
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

    // The mailbox out front, with its number.
    const b = new Graphics();
    b.rect(-6, -10, 12, 70).fill(wood.fill).stroke({ width: 3, color: wood.line });
    b.roundRect(-46, -66, 92, 60, 20).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
    this.flag.rect(40, -66, 8, 40).fill(0x8c9aa8).rect(40, -66, 26, 16).fill(swatch.red.fill);
    this.box.addChild(this.flag, b);
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
    this.flag.rotation = 0;
    this.addChild(this.box);
    this.hitArea = new Circle(0, -60, 110);
  }

  /** A letter arrived: flag up, and the neighbor peeks out happily. */
  async welcome(tw: GameContext['tw']) {
    this.delivered++;
    this.flag.pivot.set(44, -26);
    this.flag.position.set(44, -26);
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
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly road = new Graphics();
  private wrongs = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.street = makeStreet(this.plan, ctx.rng);
    this.letters = makeLetters(this.plan, this.street, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.55, clouds: 3, sun: true, seed: 52 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.road);
    const kinds = ctx.rng.shuffle([...NEIGHBORS]);
    this.street.forEach((house, i) => {
      const h = new HouseView(house, kinds[i % kinds.length], mailboxShows(this.plan.mode));
      onTap(h, () => void this.post(i), { cooldown: 400 });
      ctx.track(h.neighbor);
      this.houses.push(h);
      ctx.stage.addChild(h);
    });
    ctx.stage.addChild(this.envelope);
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
    this.envelope.position.set(v.w / 2, 150);
  }

  update() {}

  destroy() {}

  /** The next letter comes out of the bag. */
  private async next() {
    this.busy = true;
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
    // The letter flies over to the mailbox.
    const flying = new Graphics().roundRect(-40, -26, 80, 52, 6).fill(0xffffff).stroke({ width: 4, color: 0xb9c6d1 }).moveTo(-40, -26).lineTo(0, 4).lineTo(40, -26).stroke({ width: 3, color: 0xd6dde4 });
    flying.position.copyFrom(this.envelope.position);
    this.ctx.stage.addChild(flying);
    const target = { x: h.x, y: h.y + 40 };
    sfx.whoosh();
    // Wait for both halves of the arc: destroying the letter mid-tween would crash the tweener.
    const across = tw.to(flying, { x: target.x }, { duration: 0.5, ease: ease.inOutSine });
    await tw.to(flying, { y: Math.min(flying.y, target.y) - 60 }, { duration: 0.2, ease: ease.outQuad });
    await tw.to(flying, { y: target.y }, { duration: 0.3, ease: ease.inQuad });
    await across;
    const right = this.plan.mode === 'drop' || h === to;
    if (right) {
      flying.destroy();
      sfx.pop(8);
      this.envelope.scale.set(0);
      await h.welcome(tw);
      this.ctx.particles.burst(h.x, h.y - 120, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 6, speed: [60, 140], gravity: -40, size: [0.3, 0.45] });
      if (this.plan.mode === 'dots' || this.plan.mode === 'count' || this.plan.mode === 'numeral') await this.ctx.say('mail.number', { n: h.house.number });
      await this.ctx.say('mail.thanks');
      await this.next();
      return;
    }
    // Not for this house: the letter comes politely back.
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'color') void this.ctx.say('mail.notme.color', { color: h.house.door });
    else void this.ctx.say('mail.notme.number', { n: h.house.number });
    await tw.to(flying, { x: this.envelope.x, y: this.envelope.y }, { duration: 0.5, ease: ease.inOutSine });
    flying.destroy();
    if (this.wrongs >= 2) {
      to.glow.visible = true;
      this.hints++;
      this.wrongs = 0;
    }
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    for (const h of this.houses) h.neighbor.cheer();
    await this.ctx.say('mail.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class MailIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const h = new HouseView({ number: 3, door: 'red' }, 'cat', { numeral: true, dots: false });
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
  coplayHint: 'Read the house numbers together as you pass them: "two, four, five..."',
  offScreen: 'Find the number on your own front door, then spot numbers on a walk.',
  hubIcon: () => new MailIcon(),
  sticker,
  create: (ctx) => (isMapMode(planFor(ctx.level).mode) ? new WoodsMail(ctx) : new MailCarrier(ctx)),
};
