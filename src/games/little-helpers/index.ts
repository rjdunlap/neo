import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { FRUIT_FOR, prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { CROWD, makeFruits, planFor, skipCount, tryLift, usesWhistle, type Fruit, type HelperPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 6 },
};

const HELPER_COLORS: ColorName[] = ['pink', 'blue', 'yellow', 'purple', 'teal', 'orange', 'green'];
const FRUIT_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'purple'];

/** A little leaf-topped helper. */
class Helper extends Container {
  home = { x: 0, y: 0 };
  /** Which fruit slot it holds, or -1 when waiting in the crowd. */
  slot = -1;
  moving = false;
  private clock = Math.random() * 6;
  private readonly body = new Container();

  constructor(color: ColorName) {
    super();
    const sw = swatch[color];
    const g = new Graphics();
    g.moveTo(0, -46).lineTo(0, -62).stroke({ width: 4, color: 0x4a9a35, cap: 'round' });
    g.ellipse(10, -66, 12, 6).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.ellipse(0, -22, 26, 26).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.circle(-9, -26, 6).circle(9, -26, 6).fill(0xffffff).circle(-8, -25, 3).circle(10, -25, 3).fill(ink);
    for (const s of [-1, 1]) g.ellipse(s * 12, 2, 9, 5).fill(sw.line);
    this.body.addChild(g);
    this.addChild(this.body);
  }

  update(dt: number) {
    this.clock += dt;
    this.body.y = this.moving ? -Math.abs(Math.sin(this.clock * 14)) * 8 : 0;
    this.body.rotation = this.moving ? 0.12 * Math.sin(this.clock * 14) : 0.04 * Math.sin(this.clock * 2);
  }
}

class LittleHelpers implements Game {
  readonly plan: HelperPlan;
  readonly fruits: Fruit[];
  readonly helpers: Helper[] = [];
  readonly whistle: RoundButton;
  readonly fruitNode = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly basket = new Graphics();
  private readonly pile = new Container();
  private readonly badge = new Container();
  private readonly ghosts = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.fruits = makeFruits(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 41 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.basket, this.pile, this.ghosts, this.fruitNode, this.badge);
    onTap(this.fruitNode, () => this.send(), { cooldown: 180 });
    for (let i = 0; i < CROWD; i++) {
      const h = new Helper(HELPER_COLORS[i % HELPER_COLORS.length]);
      h.hitArea = new Circle(0, -24, 50);
      onTap(h, () => this.recall(h), { cooldown: 250 });
      ctx.track(h);
      this.helpers.push(h);
      ctx.stage.addChild(h);
    }
    const icon = new Graphics().roundRect(-24, -12, 40, 24, 10).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }).circle(18, 0, 12).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }).circle(-10, 0, 5).fill(ink);
    this.whistle = new RoundButton(icon, swatch.white, 54, () => void this.blow());
    this.whistle.visible = usesWhistle(this.plan);
    ctx.stage.addChild(this.whistle);
  }

  get fruit(): Fruit | undefined {
    return this.fruits[this.index];
  }

  get carrying(): Helper[] {
    return this.helpers.filter((h) => h.slot >= 0).sort((a, b) => a.slot - b.slot);
  }

  start() {
    void this.next();
  }

  private spot() {
    const v = this.view;
    // A bunch's wider row of teams sits a little right, clear of the waiting crowd.
    return { x: v.w * (this.plan.mode === 'groups' ? 0.58 : 0.55), y: v.h - 190 };
  }

  private basketAt() {
    return { x: this.view.w - 120, y: this.view.h - 120 };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const b = this.basketAt();
    this.basket.clear().moveTo(b.x - 90, b.y - 40).lineTo(b.x + 90, b.y - 40).lineTo(b.x + 70, b.y + 50).lineTo(b.x - 70, b.y + 50).closePath().fill(wood.fill).stroke({ width: 6, color: wood.line, join: 'round' });
    for (let y = b.y - 20; y < b.y + 50; y += 20) this.basket.moveTo(b.x - 84, y).lineTo(b.x + 84, y).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    this.pile.position.set(b.x, b.y - 40);
    this.helpers.forEach((h, i) => {
      h.home = { x: 190 + (i % 4) * 62 + (i >= 4 ? 30 : 0), y: v.h - 210 + (i >= 4 ? 90 : 0) };
      if (h.slot < 0 && !h.moving) h.position.copyFrom(h.home);
    });
    const s = this.spot();
    this.fruitNode.position.set(s.x, s.y);
    this.whistle.position.set(s.x + 190, s.y - 210);
    for (const h of this.carrying) if (!h.moving) h.position.copyFrom(this.slotAt(h.slot));
  }

  update() {}

  destroy() {}

  /** The center of fruit `g` in a bunch, relative to the spot; each fruit's team stands under it. */
  private groupX(g: number, f: Fruit) {
    const each = f.need / f.groups;
    return (g - (f.groups - 1) / 2) * (each * 50 + 30);
  }

  /** Where carrying helper `i` stands: a row under the fruit, or a team under each fruit of a bunch. */
  private slotAt(i: number) {
    const s = this.spot();
    const f = this.fruit;
    if (this.plan.mode === 'groups' && f) {
      const each = f.need / f.groups;
      const g = Math.floor(i / each);
      return { x: s.x + this.groupX(g, f) + (i % each - (each - 1) / 2) * 50, y: s.y + 70 };
    }
    const need = this.fruit?.need ?? 1;
    const n = Math.max(need, this.carrying.length, i + 1);
    return { x: s.x + (i - (n - 1) / 2) * 58, y: s.y + 70 };
  }

  // Fruit ---------------------------------------------------------------------------------

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    this.ghosts.clear();
    const f = this.fruit;
    if (!f) return void this.finale();
    const color = this.ctx.rng.pick(FRUIT_COLORS);
    this.fruitNode.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'groups') {
      // A bunch: every fruit the same size, since each needs the same team.
      const each = f.need / f.groups;
      for (let g = 0; g < f.groups; g++) {
        const art = prop(FRUIT_FOR[color]!, color);
        art.scale.set(0.75 + each * 0.2);
        art.position.set(this.groupX(g, f), -10 - each * 12);
        this.fruitNode.addChild(art);
      }
      const w = f.groups * (each * 50 + 30) + 40;
      this.fruitNode.hitArea = new Rectangle(-w / 2, -10 - each * 12 - 80, w, 160);
    } else {
      const art = prop(FRUIT_FOR[color]!, color);
      // Heavier fruit is bigger.
      art.scale.set(0.9 + f.need * 0.28);
      art.y = -10 - f.need * 12;
      this.fruitNode.addChild(art);
      this.fruitNode.hitArea = new Circle(0, art.y, 60 + f.need * 16);
    }
    this.fruitNode.alpha = 1;
    const s = this.spot();
    this.fruitNode.position.set(s.x, s.y - 300);
    await this.ctx.tw.to(this.fruitNode, { y: s.y }, { duration: 0.5, ease: ease.outBack });
    sfx.clunk();
    this.drawBadge(f);
    for (let i = 0; i < f.already; i++) this.send(true);
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    switch (this.plan.mode) {
      case 'tap':
        if (this.index === 0) await this.ctx.instruct('helpers.tap');
        return;
      case 'two':
        return this.ctx.instruct('helpers.send', { n: f.need });
      case 'more':
        return this.ctx.instruct('helpers.more', { m: f.already, n: f.need });
      case 'groups':
        return this.ctx.instruct('helpers.groups', { n: f.groups, m: f.need / f.groups });
      default:
        return this.ctx.instruct('helpers.count', { n: f.need });
    }
  }

  /** How many it needs: dots for younger levels, a number for older ones. */
  private drawBadge(f: Fruit) {
    this.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'tap') return;
    const s = this.spot();
    this.badge.position.set(s.x - 200, s.y - 210);
    if (this.plan.mode === 'groups') {
      // Dots in little teams, one team per fruit: two twos look different from four.
      const each = f.need / f.groups;
      const step = each * 30 + 26;
      const w = 40 + f.groups * each * 30 + (f.groups - 1) * 26;
      const g = new Graphics().roundRect(-w / 2, -36, w, 72, 24).fill(0xffffff).stroke({ width: 5, color: wood.line });
      for (let k = 0; k < f.groups; k++) for (let j = 0; j < each; j++) g.circle(-w / 2 + 35 + k * step + j * 30, 0, 12).fill(swatch.green.fill);
      this.badge.addChild(g);
      return;
    }
    const numeral = this.plan.mode === 'numeral' || this.plan.mode === 'more';
    const w = numeral ? 90 : 40 + f.need * 34;
    const g = new Graphics().roundRect(-w / 2, -36, w, 72, 24).fill(0xffffff).stroke({ width: 5, color: wood.line });
    this.badge.addChild(g);
    if (numeral) {
      const n = label(String(f.need), 52, ink);
      this.badge.addChild(n);
    } else {
      for (let i = 0; i < f.need; i++) g.circle(-w / 2 + 37 + i * 34, 0, 12).fill(swatch.green.fill);
    }
  }

  // Helpers ---------------------------------------------------------------------------------

  /** Tap the fruit: the nearest waiting helper runs over and takes hold. */
  private send(quiet = false) {
    const f = this.fruit;
    if (!f || (this.busy && !quiet) || this.finished) return;
    const h = this.helpers.filter((x) => x.slot < 0 && !x.moving).sort((a, b) => Math.hypot(a.x - this.fruitNode.x, a.y - this.fruitNode.y) - Math.hypot(b.x - this.fruitNode.x, b.y - this.fruitNode.y))[0];
    if (!h) {
      sfx.boing();
      return;
    }
    h.slot = this.carrying.length;
    const n = h.slot + 1;
    const to = this.slotAt(h.slot);
    h.moving = true;
    if (!quiet) sfx.pop(5 + Math.min(6, n));
    // Everyone shuffles to make room in the row.
    for (const x of this.carrying) if (x !== h && !x.moving) void this.ctx.tw.to(x, this.slotAt(x.slot), { duration: 0.2 });
    void this.ctx.tw.to(h, { x: to.x, y: to.y }, { duration: quiet ? 0.01 : 0.35, ease: ease.outQuad }).then(() => {
      h.moving = false;
      if (quiet) return;
      void this.ctx.say('count', { n });
      // Only the arrival that completes the team starts the lift (two can land in the same moment).
      if (!usesWhistle(this.plan) && !this.busy && this.fruit === f && this.carrying.length >= f.need && !this.carrying.some((x) => x.moving)) void this.lift();
    });
  }

  /** Tap a carrying helper and it goes back to wait: easy take-backs before the whistle. */
  private recall(h: Helper) {
    if (h.slot < 0 || this.busy || this.finished || h.moving) return;
    if (this.index >= 0 && h.slot < (this.fruit?.already ?? 0)) return;
    this.release(h);
    sfx.pop(3);
  }

  private release(h: Helper) {
    const gone = h.slot;
    h.slot = -1;
    for (const x of this.carrying) if (x.slot > gone) x.slot--;
    h.moving = true;
    void this.ctx.tw.to(h, { x: h.home.x, y: h.home.y }, { duration: 0.4 }).then(() => (h.moving = false));
    for (const x of this.carrying) void this.ctx.tw.to(x, this.slotAt(x.slot), { duration: 0.2 });
  }

  /** The whistle: lift if there are exactly enough helpers. */
  private async blow() {
    const f = this.fruit;
    if (!f || this.busy || this.finished) return;
    if (this.carrying.some((h) => h.moving)) return;
    const result = tryLift(f.need, this.carrying.length);
    if (result === 'lift') return void this.lift();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const groups = this.plan.mode === 'groups';
    const vars = { n: f.need, m: f.need / f.groups, list: skipCount(f) };
    if (result === 'short') {
      // They strain, but it won't budge.
      for (const h of this.carrying) void this.ctx.tw.to(h, { y: h.y - 10 }, { duration: 0.12 }).then(() => this.ctx.tw.to(h, { y: h.y + 10 }, { duration: 0.12 }));
      void this.ctx.tw.to(this.fruitNode, { rotation: 0.08 }, { duration: 0.1 }).then(() => this.ctx.tw.to(this.fruitNode, { rotation: 0 }, { duration: 0.2 }));
      await this.ctx.say(groups ? 'helpers.groups.short' : 'helpers.heavy', vars);
    } else {
      await this.ctx.say(groups ? 'helpers.groups.extra' : 'helpers.extra', vars);
      for (const h of this.carrying.slice(f.need)) this.release(h);
      await this.ctx.tw.wait(0.5);
    }
    if (this.wrongs >= 2 && !this.hinting) this.hint(f);
    this.busy = false;
  }

  /** Empty circles where the helpers should stand, one per helper needed. */
  private hint(f: Fruit) {
    this.hinting = true;
    this.hints++;
    const g = this.ghosts.clear();
    for (let i = 0; i < f.need; i++) {
      const p = this.slotAt(i);
      g.circle(p.x, p.y - 24, 32).stroke({ width: 5, color: swatch.yellow.fill });
    }
  }

  /** Heave ho: up it goes, off to the basket, and the helpers walk back. */
  private async lift() {
    this.busy = true;
    this.ghosts.clear();
    const tw = this.ctx.tw;
    const team = this.carrying;
    void this.ctx.say('helpers.lift');
    sfx.whoosh();
    for (const h of team) h.moving = true;
    await Promise.all([tw.to(this.fruitNode, { y: this.fruitNode.y - 40 }, { duration: 0.3 }), ...team.map((h) => tw.to(h, { y: h.y - 40 }, { duration: 0.3 }))]);
    const b = this.basketAt();
    const dx = b.x - this.fruitNode.x;
    await Promise.all([tw.to(this.fruitNode, { x: b.x, y: b.y - 120 }, { duration: 1.1, ease: ease.inOutSine }), ...team.map((h) => tw.to(h, { x: h.x + dx - 60, y: h.y - 20 }, { duration: 1.1, ease: ease.inOutSine }))]);
    // Into the basket it goes.
    const keep = this.fruitNode.children[0];
    if (keep) {
      this.fruitNode.removeChild(keep);
      keep.scale.set(0.6);
      keep.position.set((this.pile.children.length - 2) * 30, -10 - (this.pile.children.length % 2) * 14);
      this.pile.addChild(keep);
    }
    sfx.sparkle();
    this.ctx.particles.burst(b.x, b.y - 60, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    for (const h of team) {
      h.slot = -1;
      void tw.to(h, { x: h.home.x, y: h.home.y }, { duration: 0.9, ease: ease.inOutSine }).then(() => (h.moving = false));
    }
    const f = this.fruit;
    if (this.plan.mode === 'groups' && f) await this.ctx.say('helpers.groups.total', { n: f.groups, m: f.need / f.groups, total: f.need });
    else await this.ctx.say('praise');
    await tw.wait(0.6);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('helpers.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class HelpersIcon extends WigglyIcon {
  private readonly crew: Helper[];
  constructor() {
    const c = new Container();
    const apple = prop('apple', 'red');
    apple.scale.set(1.3);
    apple.y = -110;
    c.addChild(apple);
    const crew = ['pink', 'blue', 'yellow'].map((color, i) => {
      const h = new Helper(color as ColorName);
      h.position.set((i - 1) * 56, -20);
      c.addChild(h);
      return h;
    });
    super(c);
    this.crew = crew;
  }
  update(dt: number) {
    super.update(dt);
    for (const h of this.crew) h.update(dt);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const color = rng.pick(FRUIT_COLORS);
  const fruit = prop(FRUIT_FOR[color]!, color);
  fruit.scale.set(1.1);
  fruit.y = -50;
  c.addChild(fruit);
  for (let i = 0; i < 2; i++) {
    const h = new Helper(rng.pick(HELPER_COLORS));
    h.position.set(i ? 40 : -40, 40);
    c.addChild(h);
  }
  return c;
}

export const littleHelpers: GameModule = {
  id: 'little-helpers',
  name: 'Little Helpers',
  titleLine: 'game.little-helpers',
  region: 'counting-cove',
  skills: ['counting', 'one-to-one', 'number-sense', 'adding'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Count the helpers together as they line up: "one, two, three... heave ho!"',
  offScreen: 'Carry a big pillow together: how many hands does it take?',
  hubIcon: () => new HelpersIcon(),
  sticker,
  create: (ctx) => new LittleHelpers(ctx),
};
