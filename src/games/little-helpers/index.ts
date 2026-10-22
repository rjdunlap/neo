import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { carryArt, drawDestination, drawScenery, PLACE_BACKDROP } from './art';
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
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  badgeRings,
  CARRY_NEEDS,
  CROWD,
  dressRound,
  fieldTouch,
  helperTouch,
  makeFruits,
  pileSpot,
  planFor,
  ringsSayWhen,
  skipCount,
  usesWhistle,
  whistleFor,
  whistleMisses,
  type CarryKind,
  type Fruit,
  type HelperPlan,
  type Place,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 9, order: [1, 2, 9] },
  preschool: { min: 2, max: 9, order: [2, 9, 3, 4] },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 6 },
};

const HELPER_COLORS: ColorName[] = ['pink', 'blue', 'yellow', 'purple', 'teal', 'orange', 'green'];

/** A little leaf-topped helper. */
class Helper extends Container {
  home = { x: 0, y: 0 };
  /** Which fruit slot it holds, or -1 when waiting in the crowd. */
  slot = -1;
  moving = false;
  private clock = Math.random() * 6;
  private readonly body = new Container();
  private readonly arm = new Graphics();
  /** A little answer to a touch: a hop, a wave or a shrug, with the time it has left. */
  private cue: { kind: 'hop' | 'wave' | 'shrug'; left: number; length: number } | null = null;

  constructor(color: ColorName) {
    super();
    const sw = swatch[color];
    const g = new Graphics();
    g.moveTo(0, -46).lineTo(0, -62).stroke({ width: 4, color: 0x4a9a35, cap: 'round' });
    g.ellipse(10, -66, 12, 6).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.ellipse(0, -22, 26, 26).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.circle(-9, -26, 6).circle(9, -26, 6).fill(0xffffff).circle(-8, -25, 3).circle(10, -25, 3).fill(ink);
    for (const s of [-1, 1]) g.ellipse(s * 12, 2, 9, 5).fill(sw.line);
    // A waving arm, shown only while it waves.
    this.arm.moveTo(0, 0).lineTo(12, -22).stroke({ width: 7, color: sw.line, cap: 'round' }).circle(12, -22, 6).fill(sw.fill).stroke({ width: 3, color: sw.line });
    this.arm.position.set(22, -26);
    this.arm.visible = false;
    this.body.addChild(g, this.arm);
    this.addChild(this.body);
  }

  /** Answer a touch without going anywhere. */
  react(kind: 'hop' | 'wave' | 'shrug') {
    const length = kind === 'wave' ? 0.9 : kind === 'shrug' ? 0.7 : 0.4;
    this.cue = { kind, left: length, length };
  }

  update(dt: number) {
    this.clock += dt;
    this.body.y = this.moving ? -Math.abs(Math.sin(this.clock * 14)) * 8 : 0;
    this.body.rotation = this.moving ? 0.12 * Math.sin(this.clock * 14) : 0.04 * Math.sin(this.clock * 2);
    this.body.scale.set(1);
    this.arm.visible = false;
    if (!this.cue) return;
    const c = this.cue;
    c.left -= dt;
    if (c.left <= 0) return void (this.cue = null);
    const k = 1 - c.left / c.length;
    const up = Math.sin(k * Math.PI);
    if (c.kind === 'hop') this.body.y -= up * 24;
    else if (c.kind === 'shrug') {
      // Up go the shoulders, down they come: "everyone's busy".
      this.body.scale.set(1 + 0.12 * up, 1 - 0.1 * up);
      this.body.rotation = 0.1 * Math.sin(k * Math.PI * 2);
    } else {
      this.arm.visible = true;
      this.arm.rotation = 0.5 * Math.sin(k * Math.PI * 5);
      this.body.rotation = 0.06 * Math.sin(k * Math.PI * 5);
    }
  }
}

class LittleHelpers implements Game {
  readonly plan: HelperPlan;
  readonly fruits: Fruit[];
  readonly helpers: Helper[] = [];
  readonly whistle: RoundButton;
  readonly fruitNode = new Container();
  /** Everything behind the fruit, the helpers and the whistle: every touch there is answered. */
  readonly field = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly scenery = new Graphics();
  private readonly basket = new Graphics();
  /** The badge's empty rings, drawn apart so they can blink after an early whistle at level 9. */
  private emptyRings: Graphics | null = null;
  private blink = 0;
  private clock = 0;
  readonly place: Place;
  readonly things: CarryKind[];
  private readonly pile = new Container();
  private readonly badge = new Container();
  private readonly ghosts = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  /** While a "busy" or "send some first" line is being said, more such touches answer without speech. */
  private talking = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.fruits = makeFruits(this.plan, ctx.rng);
    ({ place: this.place, things: this.things } = dressRound(this.fruits, ctx.rng));
    this.backdrop = new Backdrop(PLACE_BACKDROP[this.place], ctx.view);
    // Scenery, the destination and the badge are pictures: a touch on them reaches the field and is answered.
    this.scenery.eventMode = 'none';
    this.basket.eventMode = 'none';
    this.pile.eventMode = 'none';
    this.badge.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.scenery, this.field, this.basket, this.pile, this.ghosts, this.fruitNode, this.badge);
    onTap(this.field, (e) => this.touchField(e), { cooldown: 180 });
    this.field.cursor = 'default';
    onTap(this.fruitNode, (e) => this.touchFruit(e), { cooldown: 180 });
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
    this.field.hitArea = new Rectangle(0, 0, v.w, v.h);
    drawScenery(this.scenery, this.place, v, this.backdrop.groundY);
    const b = this.basketAt();
    drawDestination(this.basket, this.place, b.x, b.y);
    this.pile.position.set(b.x, b.y - 40);
    this.helpers.forEach((h, i) => {
      h.home = { x: 190 + (i % 4) * 62 + (i >= 4 ? 30 : 0), y: v.h - 210 + (i >= 4 ? 90 : 0) };
      if (h.slot < 0 && !h.moving) h.position.copyFrom(h.home);
    });
    const s = this.spot();
    this.fruitNode.position.set(s.x, s.y);
    this.whistle.position.set(s.x + 190, s.y - 210);
    for (const h of this.carrying) if (!h.moving) h.position.copyFrom(this.slotAt(h.slot));
    if (this.fruit && this.index >= 0) this.drawBadge(this.fruit);
  }

  update(dt: number) {
    this.clock += dt;
    // Level 9: once every ring is full, the whistle wiggles to say "now".
    const f = this.fruit;
    const full = ringsSayWhen(this.plan) && f && !this.busy && this.arrived() === f.need && this.carrying.length === f.need;
    this.whistle.rotation = full ? 0.18 * Math.sin(this.clock * 12) : 0;
    if (this.emptyRings) {
      this.blink = Math.max(0, this.blink - dt);
      this.emptyRings.alpha = this.blink > 0 ? 0.25 + 0.75 * Math.abs(Math.cos(this.blink * 9)) : 1;
    }
  }

  /** Helpers who have reached the fruit and are holding on: each one fills a ring. */
  private arrived() {
    return this.carrying.filter((h) => !h.moving).length;
  }

  /** The ghost finger: send a helper to the fruit until the team is big enough, then blow the whistle where there is one. */
  autotouch(): TouchIntent | null {
    const f = this.fruit;
    if (!f || this.busy || this.finished || this.helpers.some((h) => h.moving)) return null;
    const touch = helperTouch(this.plan, f.need, this.carrying.length);
    if (touch === 'whistle') return { tap: { on: this.whistle } };
    if (touch !== 'send') return null;
    // A bunch has several fruits under one tap area; the finger points at the middle one.
    const each = f.need / f.groups;
    return { tap: { on: this.fruitNode, x: this.groupX(Math.floor(f.groups / 2), f), y: -10 - each * 12 } };
  }

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
    this.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.emptyRings = null;
    const f = this.fruit;
    if (!f) return void this.finale();
    const thing = this.things[this.index];
    this.fruitNode.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'groups') {
      // A bunch: every fruit the same size, since each needs the same team.
      const each = f.need / f.groups;
      for (let g = 0; g < f.groups; g++) {
        const art = carryArt(thing);
        art.scale.set(0.75 + each * 0.2);
        art.position.set(this.groupX(g, f), -10 - each * 12);
        this.fruitNode.addChild(art);
      }
      const w = f.groups * (each * 50 + 30) + 40;
      this.fruitNode.hitArea = new Rectangle(-w / 2, -10 - each * 12 - 80, w, 160);
    } else {
      const art = carryArt(thing);
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
      case 'whistle':
        return this.ctx.instruct('helpers.whistle.fill');
      default:
        return this.ctx.instruct('helpers.count', { n: f.need });
    }
  }

  /**
   * How many it needs: hollow rings that fill as each helper grabs on, with any extras outside the frame. A number
   * sits over a row of small rings at 4 and 5, where the empty rings are how many more; a bunch's rings are in teams.
   */
  private drawBadge(f: Fruit) {
    this.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.emptyRings = null;
    if (this.plan.mode === 'tap') return;
    const s = this.spot();
    this.badge.position.set(s.x - 200, s.y - 210);
    const rings = badgeRings(f.need, this.arrived());
    const full = new Graphics();
    const empty = new Graphics();
    const extra = new Graphics();
    const ring = (x: number, y: number, r: number, filled: boolean) =>
      filled ? full.circle(x, y, r).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line }) : empty.circle(x, y, r).fill(0xffffff).stroke({ width: 4, color: swatch.green.line });
    const numeral = this.plan.mode === 'numeral' || this.plan.mode === 'more';
    let right: number;
    let ringY = 0;
    let ringR = 12;
    if (this.plan.mode === 'groups') {
      // Rings in little teams, one team per fruit: two twos look different from four.
      const each = f.need / f.groups;
      const step = each * 30 + 26;
      const w = 40 + f.groups * each * 30 + (f.groups - 1) * 26;
      this.badge.addChild(new Graphics().roundRect(-w / 2, -36, w, 72, 24).fill(0xffffff).stroke({ width: 5, color: wood.line }));
      for (let k = 0; k < f.groups; k++) for (let j = 0; j < each; j++) ring(-w / 2 + 35 + k * step + j * 30, 0, 12, k * each + j < rings.filled);
      right = w / 2;
    } else if (numeral) {
      ringR = 9;
      ringY = 26;
      const w = Math.max(100, 30 + f.need * 26);
      this.badge.addChild(new Graphics().roundRect(-w / 2, -58, w, 108, 24).fill(0xffffff).stroke({ width: 5, color: wood.line }));
      const n = label(String(f.need), 46, ink);
      n.y = -18;
      this.badge.addChild(n);
      for (let i = 0; i < f.need; i++) ring((i - (f.need - 1) / 2) * 26, ringY, ringR, i < rings.filled);
      right = w / 2;
    } else {
      const w = 40 + f.need * 34;
      this.badge.addChild(new Graphics().roundRect(-w / 2, -36, w, 72, 24).fill(0xffffff).stroke({ width: 5, color: wood.line }));
      for (let i = 0; i < f.need; i++) ring(-w / 2 + 37 + i * 34, 0, 12, i < rings.filled);
      right = w / 2;
    }
    // Extras wait outside the frame, in orange: one too many shows as a ring with no place.
    for (let i = 0; i < rings.extra; i++) extra.circle(right + 24 + i * (ringR * 2 + 8), ringY, ringR).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
    this.badge.addChild(full, empty, extra);
    this.emptyRings = empty;
  }

  // Helpers ---------------------------------------------------------------------------------

  /** The waiting helper nearest a point, or null when everyone is out helping. */
  private nearestWaiting(x: number, y: number): Helper | undefined {
    return this.helpers.filter((h) => h.slot < 0 && !h.moving).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
  }

  /** A helper hops and squeaks: the answer to a touch while a fruit drops in or is carried away. */
  private hopNear(x: number, y: number) {
    const h = this.nearestWaiting(x, y) ?? this.helpers.filter((k) => !k.moving).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!h) return;
    h.react('hop');
    sfx.squeak(6 + this.ctx.rng.int(0, 4));
  }

  /** Tap the fruit: a helper runs over, or, while it is busy, one hops. */
  private touchFruit(e: FederatedPointerEvent) {
    if (this.finished || !this.fruit) return;
    if (this.busy) {
      const p = this.ctx.stage.toLocal(e.global);
      return this.hopNear(p.x, p.y);
    }
    this.send();
  }

  /** A touch on the sky or the grass: at the first level it sends a helper; otherwise a helper waves or hops. */
  private touchField(e: FederatedPointerEvent) {
    if (this.finished || !this.fruit) return;
    const p = this.ctx.stage.toLocal(e.global);
    const answer = fieldTouch(this.plan, this.busy);
    if (answer === 'send') return this.send();
    if (answer === 'hop') return this.hopNear(p.x, p.y);
    const h = this.nearestWaiting(p.x, p.y);
    if (!h) return this.hopNear(p.x, p.y);
    h.react('wave');
    sfx.chirp(10 + this.ctx.rng.int(0, 3));
  }

  /** Nobody is left to send: the helpers shrug, and the pet says they are all busy. Not a miss. */
  private shrug() {
    for (const h of this.helpers) if (!h.moving) h.react('shrug');
    sfx.squeak(3);
    if (this.talking) return;
    this.talking = true;
    void this.ctx.say('helpers.busy').then(() => (this.talking = false));
  }

  /** Send the nearest waiting helper to the fruit. */
  private send(quiet = false) {
    const f = this.fruit;
    if (!f || (this.busy && !quiet) || this.finished) return;
    const h = this.nearestWaiting(this.fruitNode.x, this.fruitNode.y);
    if (!h) return this.shrug();
    if (ringsSayWhen(this.plan) && this.carrying.length >= f.need) return this.bounceOff(h, f);
    h.slot = this.carrying.length;
    const n = h.slot + 1;
    const to = this.slotAt(h.slot);
    h.moving = true;
    if (!quiet) sfx.pop(5 + Math.min(6, n));
    // Everyone shuffles to make room in the row.
    for (const x of this.carrying) if (x !== h && !x.moving) void this.ctx.tw.to(x, this.slotAt(x.slot), { duration: 0.2 });
    void this.ctx.tw.to(h, { x: to.x, y: to.y }, { duration: quiet ? 0.01 : 0.35, ease: ease.outQuad }).then(() => {
      h.moving = false;
      if (this.fruit === f) this.drawBadge(f);
      if (quiet) return;
      void this.ctx.say('count', { n });
      // Only the arrival that completes the team starts the lift (two can land in the same moment).
      if (!usesWhistle(this.plan) && !this.busy && this.fruit === f && this.carrying.length >= f.need && !this.carrying.some((x) => x.moving)) void this.lift();
    });
  }

  /** Level 9 with every ring full: the helper runs up, bounces off and walks back. Never a miss. */
  private bounceOff(h: Helper, f: Fruit) {
    const to = this.slotAt(f.need);
    h.moving = true;
    sfx.squeak(8);
    void this.ctx.tw
      .to(h, { x: (h.x + to.x) / 2, y: to.y }, { duration: 0.3, ease: ease.outQuad })
      .then(() => {
        h.react('hop');
        return this.ctx.tw.to(h, { x: h.home.x, y: h.home.y }, { duration: 0.4 });
      })
      .then(() => (h.moving = false));
    if (this.talking) return;
    this.talking = true;
    void this.ctx.say('helpers.full').then(() => (this.talking = false));
  }

  /** Tap a carrying helper and it goes back to wait: easy take-backs before the whistle. */
  private recall(h: Helper) {
    if (this.finished || h.moving) return;
    // A waiting helper answers with a hop; at the first level it also runs to the fruit, like any touch.
    if (h.slot < 0 && !this.busy && this.plan.mode === 'tap') return this.send();
    if (h.slot < 0 || this.busy) {
      h.react('hop');
      sfx.squeak(6 + this.ctx.rng.int(0, 4));
      return;
    }
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
    const f = this.fruit;
    if (f) this.drawBadge(f);
  }

  /** The whistle: lift if there are exactly enough helpers. */
  private async blow() {
    const f = this.fruit;
    if (!f || this.busy || this.finished) return;
    if (this.carrying.some((h) => h.moving)) return;
    const result = whistleFor(f.need, this.carrying.length);
    if (result === 'lift') return void this.lift();
    if (result === 'short' && ringsSayWhen(this.plan)) {
      // Level 9: not full yet. They strain, the empty rings blink, and nothing is counted.
      this.blink = 1.2;
      for (const h of this.carrying) void this.ctx.tw.to(h, { y: h.y - 10 }, { duration: 0.12 }).then(() => this.ctx.tw.to(h, { y: h.y + 10 }, { duration: 0.12 }));
      if (this.talking) return;
      this.talking = true;
      return void this.ctx.say('helpers.whistle.notfull').then(() => (this.talking = false));
    }
    if (!whistleMisses(result, this.plan)) {
      // Nobody is holding on yet: a reminder, not a wrong count.
      for (const h of this.helpers) if (!h.moving) h.react('hop');
      if (this.talking) return;
      this.talking = true;
      return void this.ctx.say('helpers.whistle.empty').then(() => (this.talking = false));
    }
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
      // At 5 the line names the gap: "4 are here. It needs 6. 2 more!"
      if (this.plan.mode === 'more') await this.ctx.say('helpers.more.short', { m: this.carrying.length, n: f.need, gap: f.need - this.carrying.length });
      else await this.ctx.say(groups ? 'helpers.groups.short' : 'helpers.heavy', vars);
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
    // Into the basket it goes, every fruit of a bunch.
    for (const keep of [...this.fruitNode.children]) {
      this.fruitNode.removeChild(keep);
      keep.scale.set(this.plan.mode === 'groups' ? 0.5 : 0.6);
      const at = pileSpot(this.pile.children.length);
      keep.position.set(at.x, at.y);
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
  const fruit = carryArt(rng.pick(Object.keys(CARRY_NEEDS) as CarryKind[]));
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
  touchDemo: true,
  sticker,
  create: (ctx) => new LittleHelpers(ctx),
};
