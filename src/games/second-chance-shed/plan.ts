import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { bellArt, bubbleArt, filledArt, friendArt, itemArt, madeArt, placeArt } from './art';
import {
  centre, checkPlan, friendOf, friendSpot, ITEMS, madeAt, moveTo, nextMove, PLACE_H, planLayout, PlanTally, roundFor, spotAt, THING,
  type ItemId, type Place, type PlanLayout, type PlanMap, type Plan, type Rect, type Round, type Spot,
} from './logic';

interface Thing { id: ItemId; node: Container; drag: DragHandle; stamp: number }
interface Friend { node: Container; critter: Critter; bubble: Container }

/**
 * Levels 5–6: the whole cart laid out, friends with picture bubbles and a bell. She plans where every thing goes, moves
 * things as often as she likes, and rings the bell; only a ring on a plan that fails counts (docs/definitions/second-chance-shed-5-6.md).
 */
export class PlanShed implements Game {
  readonly round: Round;
  readonly tally = new PlanTally();
  spots: PlanMap;
  busy = true;
  finished = false;
  readonly things: Thing[] = [];
  readonly friends: Friend[] = [];
  readonly bell: Container;
  private readonly bellSwing: Container;
  private readonly places = new Map<Place, Container>();
  private readonly backdrop: Backdrop;
  private readonly plank = new Graphics();
  private readonly glow = new Graphics();
  private alive = true;
  private clock = 0;
  private stamps = 0;
  private lastNamed: ItemId | null = null;
  private view: View;
  private layoutNow: PlanLayout;
  private moveCache: { sig: string; move: ReturnType<typeof nextMove> } | null = null;

  constructor(private readonly ctx: GameContext, readonly plan: Plan) {
    this.view = ctx.view;
    this.round = roundFor(plan.level, ctx.rng);
    this.spots = this.round.items.map((): Spot => 'cart');
    this.layoutNow = planLayout(this.view, this.round);
    this.backdrop = new Backdrop({ sky: [0xffe2c4, cream], hills: [swatch.green.light, 0xbfe39a], horizon: 0.5, clouds: 2, sun: true, seed: 137 }, ctx.view);
    this.plank.eventMode = this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.plank);
    for (const place of this.round.open) {
      const node = placeArt(place);
      node.eventMode = 'none';
      ctx.stage.addChild(node);
      this.places.set(place, node);
    }
    this.round.requests.forEach((r, i) => {
      const node = new Container();
      const critter = friendArt(r);
      const bubble = bubbleArt(r);
      node.addChild(critter, bubble);
      ctx.track(critter);
      onTap(node, () => this.tapFriend(i));
      ctx.stage.addChild(node);
      this.friends.push({ node, critter, bubble });
    });
    const b = bellArt();
    this.bell = b.node;
    this.bellSwing = b.bell;
    this.bell.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(this.bell, () => this.ring(), { cooldown: 300 });
    ctx.stage.addChild(this.bell);
    this.round.items.forEach((id, i) => {
      const node = new Container();
      node.addChild(itemArt(id, THING));
      node.hitArea = new Rectangle(-THING / 2, -THING / 2, THING, THING);
      const drag = draggable(node, ctx.tw, { onPick: () => this.picked(i), onDrop: (x, y) => this.drop(i, x, y) });
      drag.enabled = false;
      ctx.stage.addChild(node);
      this.things.push({ id, node, drag, stamp: 0 });
    });
    ctx.stage.addChild(this.glow);
  }

  /** What a scripted play reads. */
  get state() {
    return { level: this.plan.level, items: this.round.items.slice(), requests: this.round.requests.slice(), spots: this.spots.slice(), misses: this.tally.misses, hints: this.tally.hints, glowing: this.tally.glowing, busy: this.busy, finished: this.finished };
  }

  start() {
    this.layout();
    void this.begin();
  }

  destroy() {
    this.alive = false;
    for (const t of this.things) t.drag.destroy();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private layout() {
    const l = this.layoutNow = planLayout(this.view, this.round);
    this.moveCache = null;
    const row = l.row;
    // Drawn about the row's centre so the cart rattles in place.
    const cx = row.x + row.w / 2, cy = row.y + row.h;
    this.plank.position.set(cx, cy);
    this.plank.clear()
      .roundRect(-row.w / 2 - 16, -4, row.w + 32, 24, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
    for (const x of [-row.w / 2 + 40, row.w / 2 - 40]) this.plank.circle(x, 28, 16).fill(0x2b2b3a).circle(x, 28, 6).fill(swatch.white.light);
    for (const [place, node] of this.places) {
      const c = centre(l.places[place]!);
      node.position.set(c.x, c.y);
    }
    l.friends.forEach((r, i) => {
      const f = this.friends[i];
      f.node.position.set(r.x + r.w / 2, r.y);
      f.node.hitArea = new Rectangle(-r.w / 2, 0, r.w, r.h);
      f.bubble.position.set(0, 46);
      f.critter.position.set(-30, r.h - 6);
    });
    const bell = centre(l.bell);
    this.bell.position.set(bell.x, bell.y);
    this.placeThings(false);
  }

  /** Where a thing in this plan rests: its cart slot, fanned in its place (newest on top), or at a friend's feet. */
  private restAt(i: number): { x: number; y: number } {
    const l = this.layoutNow;
    const s = this.spots[i];
    if (s === 'cart') return centre(l.slots[i]);
    const f = friendOf(s);
    if (f !== null) {
      const r = l.friends[f];
      return { x: r.x + r.w / 2 + 20, y: r.y + r.h - 50 };
    }
    // Every thing in a place stays grabbable (not only the top one), so Show me one and the ghost finger can always reach it.
    const here = this.spots.flatMap((t, k) => (t === s ? [k] : [])).sort((a, b) => this.things[a].stamp - this.things[b].stamp);
    const k = here.indexOf(i), n = here.length;
    const c = centre(l.places[s as Place]!);
    return { x: c.x + (k - (n - 1) / 2) * 22, y: c.y + 24 - k * 12 };
  }

  private placeThings(animate: boolean) {
    const order = this.things.map((_, i) => i).sort((a, b) => this.things[a].stamp - this.things[b].stamp);
    for (const i of order) {
      const t = this.things[i];
      this.ctx.stage.setChildIndex(t.node, this.ctx.stage.children.length - 1);
      if (t.drag.dragging) continue;
      const at = this.restAt(i);
      t.drag.home = at;
      this.ctx.tw.kill(t.node);
      if (animate) void this.ctx.tw.to(t.node, { x: at.x, y: at.y }, { duration: 0.25, ease: ease.outQuad });
      else t.node.position.set(at.x, at.y);
    }
    this.ctx.stage.setChildIndex(this.glow, this.ctx.stage.children.length - 1);
  }

  private async begin() {
    await this.ctx.instruct(`shed.instruct.${this.plan.level}` as 'shed.instruct.5');
    if (!this.alive) return;
    for (const t of this.things) t.drag.enabled = true;
    this.busy = false;
    for (let i = 0; i < this.friends.length; i++) {
      this.friends[i].critter.hop();
      await this.ctx.say(`shed.request.${this.round.requests[i]}` as 'shed.request.pencils');
      if (!this.alive) return;
    }
  }

  private tapFriend(i: number) {
    if (this.finished) return;
    this.friends[i].critter.poke();
    void this.ctx.say(`shed.request.${this.round.requests[i]}` as 'shed.request.pencils');
  }

  /** Touch-down: the thing wobbles and says its name (once until another is picked). */
  private picked(i: number) {
    const t = this.things[i];
    sfx.tick();
    this.ctx.stage.setChildIndex(t.node, this.ctx.stage.children.length - 1);
    this.ctx.stage.setChildIndex(this.glow, this.ctx.stage.children.length - 1);
    if (this.lastNamed !== t.id) {
      this.lastNamed = t.id;
      void this.ctx.say(`shed.item.${t.id}` as 'shed.item.peel');
    }
  }

  /** A drop is never judged: the thing settles where she put it (a friend's earlier gift goes back to the cart). */
  private drop(i: number, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const at = spotAt(this.layoutNow, x, y);
    if (at === null) return false;
    this.moveThing(i, at);
    return true;
  }

  private moveThing(i: number, at: Spot) {
    this.spots = moveTo(this.spots, i, at);
    this.things[i].stamp = ++this.stamps;
    sfx.tick();
    const p = at === 'cart' ? null : friendOf(at) !== null ? this.friends[friendOf(at)!].node : this.places.get(at as Place)!;
    if (p) void this.breathe(p);
    this.placeThings(true);
  }

  private async breathe(n: Container, size = 1.06) {
    await this.ctx.tw.to(n.scale, { x: size, y: size }, { duration: 0.15 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
  }

  private async wiggle(n: Container) {
    for (const r of [0.08, -0.08, 0.05, -0.05, 0]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n, { rotation: r }, { duration: 0.07 });
    }
  }

  private async swing() {
    sfx.bell(9, 0.3);
    for (const r of [0.35, -0.3, 0.18, -0.1, 0]) {
      if (!this.alive) return;
      await this.ctx.tw.to(this.bellSwing, { rotation: r }, { duration: 0.09 });
    }
  }

  /** The bell: always dings and swings; a plan that works finishes once, a failed plan says its first unmet condition. */
  ring() {
    if (this.finished) return;
    void this.swing();
    if (this.busy || this.things.some((t) => t.drag.dragging)) return;
    const r = this.tally.ring(this.round, this.spots);
    if (r.kind === 'ok') { void this.finale(); return; }
    if (r.kind === 'cart') {
      void this.wiggle(this.plank);
      for (const i of r.indices) void this.wiggle(this.things[i].node);
      void this.ctx.say('shed.bell.cart');
      return;
    }
    sfx.boing();
    void this.explain(r.check, r.glowed);
  }

  private async explain(c: Exclude<ReturnType<typeof checkPlan>, { kind: 'ok' } | { kind: 'onCart' }>, glowed: boolean) {
    if (c.kind === 'misplaced') {
      void this.wiggle(this.things[c.index].node);
      const f = friendOf(c.at);
      if (f !== null) {
        this.friends[f].critter.poke();
        await this.ctx.say(`shed.nofit.${this.round.requests[f]}` as 'shed.nofit.pencils');
      } else await this.ctx.say(`shed.reason.${c.at}` as 'shed.reason.worm');
    } else {
      this.friends[c.friend].critter.hop();
      void this.breathe(this.friends[c.friend].bubble, 1.15);
      await this.ctx.say(`shed.need.${this.round.requests[c.friend]}` as 'shed.need.pencils');
    }
    if (glowed && this.alive && !this.finished) await this.ctx.say('shed.hint-glow');
  }

  private move() {
    const sig = this.spots.join(',');
    if (this.moveCache?.sig !== sig) this.moveCache = { sig, move: nextMove(this.round, this.spots) };
    return this.moveCache.move;
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.tally.glowing || this.finished) return;
    const m = this.move();
    const w = 7 + 2 * Math.sin(this.clock * 5);
    if (!m) {
      const b = this.layoutNow.bell;
      this.glow.roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 24).stroke({ width: w, color: swatch.yellow.fill });
      return;
    }
    const t = this.things[m.index].node;
    this.glow.roundRect(t.x - THING / 2 - 10, t.y - THING / 2 - 10, THING + 20, THING + 20, 24).stroke({ width: w, color: swatch.yellow.fill });
    const r = this.spotRect(m.to);
    this.glow.roundRect(r.x - 12, r.y - 12, r.w + 24, r.h + 24, 26).stroke({ width: w, color: swatch.yellow.fill });
  }

  private spotRect(s: Spot): Rect {
    const f = friendOf(s);
    if (f !== null) return this.layoutNow.friends[f];
    if (s === 'cart') return this.layoutNow.row;
    return this.layoutNow.places[s as Place]!;
  }

  /** Show a hint: the glow (one hint per round); asked again, Show me one moves one thing toward the nearest working plan. */
  askForHint() {
    if (this.busy || this.finished || this.things.some((t) => t.drag.dragging)) return;
    const m = nextMove(this.round, this.spots);
    if (!m) { void this.ctx.say('shed.ring-now'); return; }
    if (this.tally.ask() === 'glow') { void this.ctx.say('shed.hint-glow'); return; }
    const from = this.spots[m.index];
    const toFriend = friendOf(m.to);
    this.moveThing(m.index, m.to);
    const both = ITEMS[this.round.items[m.index]].fits.filter((r) => this.round.requests.includes(r)).length > 1;
    if (both && friendOf(from) !== null && toFriend !== null) void this.ctx.say(`shed.only.${this.round.requests[toFriend]}` as 'shed.only.bed');
  }

  /** Start again: every thing back on the cart in its first order, friends empty; misses and hints stay. */
  restart() {
    if (this.busy || this.finished) return;
    this.spots = this.spots.map((): Spot => 'cart');
    for (const t of this.things) t.stamp = 0;
    this.placeThings(true);
  }

  /** The plan works: every place makes its things in turn, then each friend uses the gift, then the round ends once. */
  private async finale() {
    this.finished = true;
    this.busy = true;
    this.glow.clear();
    for (const t of this.things) t.drag.enabled = false;
    this.ctx.pet.cheer();
    for (const step of [5, 7, 9]) {
      sfx.bell(step, 0.3);
      await this.ctx.tw.wait(0.14);
      if (!this.alive) return;
    }
    for (const place of this.round.open) {
      // Every thing in a place stays grabbable (not only the top one), so Show me one and the ghost finger can always reach it.
    const here = this.spots.flatMap((s, i) => (s === place ? [i] : []));
      for (const i of here) {
        if (!this.alive) return;
        await this.make(place, i);
      }
    }
    for (let f = 0; f < this.friends.length; f++) {
      if (!this.alive) return;
      const i = this.spots.indexOf(friendSpot(f));
      const t = this.things[i];
      const filled = filledArt(this.round.requests[f], t.id);
      filled.eventMode = 'none';
      filled.position.set(t.node.x, t.node.y + 10);
      filled.scale.set(0.2);
      t.node.visible = false;
      this.ctx.stage.addChild(filled);
      sfx.sparkle();
      this.friends[f].critter.cheer();
      await this.ctx.tw.to(filled.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      if (!this.alive) return;
      await this.ctx.say(`shed.filled.${this.round.requests[f]}` as 'shed.filled.pencils');
    }
    if (!this.alive) return;
    for (const s of [3, 5, 7, 9]) {
      sfx.bell(s);
      await this.ctx.tw.wait(0.16);
      if (!this.alive) return;
    }
    sfx.tada();
    await this.ctx.say('shed.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  /** One thing goes into its place, and the place shows what it made. */
  private async make(place: Place, i: number) {
    const t = this.things[i];
    const at = centre(this.layoutNow.places[place]!);
    await this.ctx.tw.to(t.node.scale, { x: 0.3, y: 0.3 }, { duration: 0.2 });
    if (!this.alive) return;
    t.node.visible = false;
    const made = madeAt(t.id, place);
    if (place === 'worm') sfx.munch(); else if (place === 'mend') sfx.marimba(5); else sfx.bell(place === 'shelf' ? 8 : 5);
    void this.breathe(this.places.get(place)!, 1.1);
    const m = madeArt(made, t.id);
    m.eventMode = 'none';
    m.position.set(at.x, at.y - PLACE_H / 2 - 30);
    m.scale.set(0.1);
    this.ctx.stage.addChild(m);
    await this.ctx.tw.to(m.scale, { x: 0.9, y: 0.9 }, { duration: 0.35, ease: ease.outBack });
    if (!this.alive) return;
    await this.ctx.say(`shed.made.${made}` as 'shed.made.sprout');
    if (!this.alive || m.destroyed) return;
    await this.ctx.tw.to(m, { alpha: 0 }, { duration: 0.3 });
    if (!m.destroyed) m.destroy({ children: true });
  }

  /** The ghost finger: the same next move as Show me one, then the bell once the plan works. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.things.some((t) => t.drag.dragging)) return null;
    const m = nextMove(this.round, this.spots);
    if (!m) return { tap: { on: this.bell } };
    const c = centre(this.spotRect(m.to));
    return { drag: { on: this.things[m.index].node }, to: { on: this.ctx.stage, x: c.x, y: c.y } };
  }
}
