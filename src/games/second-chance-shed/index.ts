import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cartArt, itemArt, madeArt, placeArt } from './art';
import { PlanShed } from './plan';
import {
  centre, ITEMS, judge, nextDrop, PLACE_H, PLACE_W, placeAt, planFor, roundFor, shedLayout, ShedTally, SORT_MAX,
  type ItemId, type Place, type Plan, type Round, type ShedLayout,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 6 },
};

interface PlaceNode { place: Place; node: Container }

class SecondChanceShed implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly tally: ShedTally;
  index = 0;
  busy = true;
  finished = false;
  item: { id: ItemId; node: Container; drag: DragHandle } | null = null;
  readonly places: PlaceNode[] = [];
  private alive = true;
  private clock = 0;
  private restartAsked = false;
  private mendNamed = false;
  private view: View;
  private layoutNow: ShedLayout;
  private readonly backdrop: Backdrop;
  private readonly cart = cartArt();
  private readonly pot = new Container();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.round = roundFor(this.plan.level, ctx.rng);
    this.tally = new ShedTally(this.plan.counts);
    this.layoutNow = shedLayout(this.view, this.round.open);
    this.backdrop = new Backdrop({ sky: [0xffe2c4, cream], hills: [swatch.green.light, 0xbfe39a], horizon: 0.5, clouds: 2, sun: true, seed: 137 }, ctx.view);
    for (const n of [this.cart, this.pot, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.cart);
    for (const place of this.round.open) {
      const node = placeArt(place);
      node.eventMode = 'none';
      ctx.stage.addChild(node);
      this.places.push({ place, node });
    }
    ctx.stage.addChild(this.pot, this.glow);
  }

  start() {
    this.layout();
    void this.begin();
  }

  destroy() {
    this.alive = false;
    this.item?.drag.destroy();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private layout() {
    this.layoutNow = shedLayout(this.view, this.round.open);
    const l = this.layoutNow;
    const cart = centre(l.cart);
    this.cart.position.set(cart.x, cart.y - 20);
    for (const p of this.places) {
      const c = centre(l.places[p.place]!);
      p.node.position.set(c.x, c.y);
    }
    const worm = l.places.worm!;
    this.pot.position.set(worm.x + PLACE_W / 2 + 63, worm.y + PLACE_H / 2 + 40);
    if (this.item) {
      const home = centre(l.item);
      this.item.drag.home = home;
      if (!this.item.drag.dragging && !this.busy) this.item.node.position.set(home.x, home.y);
    }
  }

  private nodeOf(place: Place): Container {
    return this.places.find((p) => p.place === place)!.node;
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.tally.glowing || !this.item || this.finished) return;
    const r = this.layoutNow.places[ITEMS[this.item.id].place]!;
    this.glow.roundRect(r.x - 12, r.y - 12, r.w + 24, r.h + 24, 26).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private async begin() {
    await this.ctx.instruct(`shed.instruct.${this.plan.level}` as 'shed.instruct.1');
    if (!this.alive) return;
    await this.bringItem();
  }

  /** The next used thing rolls in on the cart and says its name. */
  private async bringItem() {
    this.busy = true;
    this.tally.nextItem(this.index);
    const id = this.round.items[this.index];
    const node = itemArt(id);
    node.hitArea = new Rectangle(-80, -80, 160, 160);
    const home = centre(this.layoutNow.item);
    node.position.set(this.view.w + 120, home.y);
    this.ctx.stage.addChild(node);
    this.ctx.stage.setChildIndex(this.glow, this.ctx.stage.children.length - 1);
    const drag = draggable(node, this.ctx.tw, {
      onPick: () => this.picked(node),
      onDrop: (x, y) => this.drop(x, y),
    });
    drag.enabled = false;
    this.item = { id, node, drag };
    sfx.whoosh();
    await this.ctx.tw.to(node, { x: home.x }, { duration: 0.5, ease: ease.outBack });
    if (!this.alive || this.item?.node !== node) return;
    drag.home = { ...home };
    drag.enabled = true;
    this.busy = false;
    if (this.restartAsked) return this.restart();
    if (ITEMS[id].place === 'mend' && !this.mendNamed) {
      this.mendNamed = true;
      void this.ctx.say('shed.arrive.mend');
    } else void this.ctx.say(`shed.item.${id}` as 'shed.item.peel');
  }

  /** Touch-down: the thing wobbles and every open place breathes once. */
  private picked(node: Container) {
    sfx.tick();
    void this.ctx.tw.to(node, { rotation: 0.08 }, { duration: 0.08 }).then(() => { if (!node.destroyed) void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.12 }); });
    for (const p of this.places) void this.breathe(p.node);
  }

  private async breathe(n: Container, size = 1.06) {
    await this.ctx.tw.to(n.scale, { x: size, y: size }, { duration: 0.15 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
  }

  private drop(x: number, y: number): boolean {
    if (this.busy || this.finished || !this.item) return false;
    const at = placeAt(this.layoutNow, x, y);
    const verdict = judge(this.item.id, at);
    if (verdict === 'none') {
      // Back to the cart, never counted; at the first level the bin wiggles to show where food goes.
      if (!this.plan.counts) void this.shake(this.nodeOf('worm'));
      return false;
    }
    if (verdict === 'right') {
      void this.accept(at!);
      return true;
    }
    const wasGlowing = this.tally.glowing;
    this.tally.drop(verdict);
    sfx.boing();
    void this.shake(this.nodeOf(at!));
    void this.explain(at!, !wasGlowing && this.tally.glowing);
    return false;
  }

  private async explain(at: Place, glowed: boolean) {
    const node = this.item?.node;
    await this.ctx.say(`shed.reason.${at}` as 'shed.reason.worm');
    if (!this.alive || this.item?.node !== node) return;
    if (glowed) await this.ctx.say('shed.hint-glow');
  }

  private async shake(n: Container) {
    for (const r of [0.06, -0.06, 0.04, -0.04, 0]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n, { rotation: r }, { duration: 0.07 });
    }
  }

  /** A right drop: the thing goes into its place, the place makes something, then the cart brings the next. */
  private async accept(place: Place) {
    const item = this.item!;
    this.busy = true;
    item.drag.enabled = false;
    this.tally.glowing = false;
    const target = centre(this.layoutNow.places[place]!);
    await this.ctx.tw.to(item.node, { x: target.x, y: target.y + 10 }, { duration: 0.25 });
    if (!this.alive) return;
    await this.ctx.tw.to(item.node.scale, { x: 0.3, y: 0.3 }, { duration: 0.2 });
    if (!this.alive) return;
    item.drag.destroy();
    item.node.destroy({ children: true });
    this.item = null;
    this.ctx.pet.cheer();
    await this.consequence(place, item.id);
    if (!this.alive) return;
    this.index++;
    if (this.restartAsked && this.index < this.round.items.length) {
      this.busy = false;
      return this.restart();
    }
    this.restartAsked = false;
    if (this.index >= this.round.items.length) return this.finale();
    await this.bringItem();
  }

  private async sound(place: Place) {
    if (place === 'worm') sfx.munch();
    else if (place === 'shelf') {
      sfx.clunk();
      await this.ctx.tw.wait(0.2);
      if (this.alive) sfx.pop(8);
    }
    else {
      const steps = place === 'mend' ? [5, 5, 5] : [3, 5, 7];
      for (const s of steps) {
        if (!this.alive) return;
        if (place === 'mend') sfx.marimba(s); else sfx.bell(s);
        await this.ctx.tw.wait(0.2);
      }
    }
  }

  /** The place plays what it made: a sprout joins the pot, the other things pop up over the place and fade. */
  private async consequence(place: Place, id: ItemId, line = true) {
    const made = ITEMS[id].consequence;
    void this.sound(place);
    void this.breathe(this.nodeOf(place), 1.1);
    const at = centre(this.layoutNow.places[place]!);
    if (made === 'sprout') {
      const s = madeArt('sprout', id);
      s.eventMode = 'none';
      s.position.set((this.pot.children.length - 1) * 16, -30);
      s.scale.set(0.1);
      this.pot.addChild(s);
      await this.ctx.tw.to(s.scale, { x: 0.5, y: 0.5 }, { duration: 0.4, ease: ease.outBack });
    } else {
      const m = madeArt(made, id);
      m.eventMode = 'none';
      m.position.set(at.x, at.y - PLACE_H / 2 - 30);
      m.scale.set(0.1);
      this.ctx.stage.addChild(m);
      await this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
      if (made === 'roll' && this.alive) await this.ctx.tw.to(m, { x: at.x + 60 }, { duration: 0.5, ease: ease.inOutSine });
      if (made === 'flutter' && this.alive) await this.ctx.tw.to(m, { y: m.y - 50 }, { duration: 0.5, ease: ease.inOutSine });
      void this.fadeOut(m, line ? 1.6 : 0.6);
    }
    if (line && this.alive) await this.ctx.say(`shed.made.${made}` as 'shed.made.sprout');
  }

  private async fadeOut(n: Container, after: number) {
    await this.ctx.tw.wait(after);
    if (!this.alive || n.destroyed) return;
    await this.ctx.tw.to(n, { alpha: 0 }, { duration: 0.4 });
    if (!n.destroyed) n.destroy({ children: true });
  }

  private async finale() {
    this.finished = true;
    this.busy = true;
    void this.rise();
    // Every place plays its consequence once more, in turn.
    for (const p of this.places) {
      if (!this.alive) return;
      const first = this.round.items.find((id) => ITEMS[id].place === p.place)!;
      await this.consequence(p.place, first, false);
      await this.ctx.tw.wait(0.3);
    }
    if (!this.alive) return;
    sfx.tada();
    await this.ctx.say('shed.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  private async rise() {
    for (const s of [3, 5, 7, 9]) {
      if (!this.alive) return;
      sfx.bell(s);
      await this.ctx.tw.wait(0.16);
    }
  }

  /** The pause sheet's Show a hint: glow the item's place, then (asked again) carry the item there. */
  askForHint() {
    if (this.busy || this.finished || !this.item || this.item.drag.dragging) return;
    if (this.tally.ask() === 'glow') { void this.ctx.say('shed.hint-glow'); return; }
    const place = ITEMS[this.item.id].place;
    void this.accept(place);
  }

  /** Start again: the same round from its first thing, with misses and hints still counted. */
  restart() {
    if (this.finished) return;
    if (this.busy) { this.restartAsked = true; return; }
    this.restartAsked = false;
    if (this.item) {
      this.item.drag.destroy();
      this.item.node.destroy({ children: true });
      this.item = null;
    }
    for (const s of this.pot.removeChildren()) s.destroy({ children: true });
    this.index = 0;
    void this.bringItem();
  }

  /** The ghost finger: carry the thing on the cart to its own place. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.item || this.item.drag.dragging) return null;
    const next = nextDrop(this.round, this.index);
    if (!next) return null;
    const c = centre(this.layoutNow.places[next.place]!);
    return { drag: { on: this.item.node }, to: { on: this.ctx.stage, x: c.x, y: c.y } };
  }
}

class ShedIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.poly([-90, -20, 0, -90, 90, -20]).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line, join: 'round' });
    g.rect(-74, -20, 148, 110).fill(wood.light).stroke({ width: 6, color: wood.line });
    g.roundRect(-30, 10, 60, 80, 8).fill(wood.fill).stroke({ width: 5, color: wood.line }).circle(18, 52, 5).fill(wood.line);
    c.addChild(g);
    const sprout = madeArt('planter', 'tub');
    sprout.scale.set(0.5);
    sprout.position.set(-70, 70);
    const medal = madeArt('medal', 'can');
    medal.scale.set(0.6);
    medal.position.set(76, 60);
    c.addChild(sprout, medal);
    c.scale.set(0.85);
    super(c);
  }
}

/** A seeded consequence: a sprout pot, Bunny in the box, the mended cart or the can-lid medal. */
function sticker(seed: number): Container {
  const [made, from] = new Rng(seed).pick([['planter', 'tub'], ['nap', 'box'], ['roll', 'cart'], ['medal', 'can']] as const);
  const c = madeArt(made, from);
  c.scale.set(1.4);
  return c;
}

export const secondChanceShed: GameModule = {
  id: 'second-chance-shed',
  name: 'Second Chance Shed',
  titleLine: 'game.second-chance-shed',
  region: 'cozy-village',
  skills: ['sorting', 'materials', 'cause-and-effect', 'reuse', 'planning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Be the shed keeper: say where you think a thing goes ("I think the worms want this one"), let her check the pictures and carry it, then swap.',
  offScreen: 'Find something at home that could be used again, and use it together.',
  hubIcon: () => new ShedIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => {
    const plan = planFor(ctx.level);
    return plan.level > SORT_MAX ? new PlanShed(ctx, plan) : new SecondChanceShed(ctx);
  },
};
