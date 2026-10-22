import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { fishArt, penguinArt, turtleArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type Swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  apply, check, countAloud, hintFor, LEVELS, makeRound, nearestLanding, numeral, path, planFor, request, roundState,
  shaftLayout, startStop, stopName, STOPS, TOP, word, giveHint, type Friend, type Item, type LevelId, type RoundState, type ShaftLayout,
} from './logic';

const STEP_SECONDS = 0.25;
const FISH: Swatch[] = [swatch.orange, swatch.pink, swatch.purple, swatch.yellow];
/** Levels whose authored first round has been played this session; the demonstration always opens on it and uses none up. */
const authoredShown = new Set<LevelId>();

/** A friend with its feet on (0, 0), about 64 units tall. */
function friendArt(kind: Friend, tint = 0): Container {
  const c = new Container();
  if (kind === 'fish') { const f = fishArt(FISH[tint % FISH.length]); f.scale.set(0.62); f.y = -26; c.addChild(f); }
  else if (kind === 'penguin') { const p = penguinArt(); p.scale.set(0.8); p.y = -32; c.addChild(p); }
  else if (kind === 'turtle') { const t = turtleArt(70); t.rotation = -Math.PI / 2; t.y = -26; c.addChild(t); }
  else { const k = new Critter(CRITTERS[kind]); k.alive = false; k.scale.set(0.36); c.addChild(k); }
  c.eventMode = 'none';
  return c;
}

function liftArt(): Container {
  const c = new Container(), g = new Graphics();
  g.rect(-8, -150, 16, 170).fill(wood.fill).stroke({ width: 3, color: wood.line });
  g.roundRect(-36, -150, 72, 170, 14).fill({ color: 0xffffff, alpha: 0.35 }).stroke({ width: 5, color: swatch.teal.line });
  g.rect(-110, -40, 220, 60).fill(swatch.blue.fill);
  g.moveTo(-110, -40).bezierCurveTo(-75, -52, -40, -28, 0, -40).bezierCurveTo(40, -52, 75, -28, 110, -40).stroke({ width: 5, color: 0xffffff });
  g.roundRect(-30, -95, 60, 52, 10).fill({ color: swatch.teal.light, alpha: 0.9 }).stroke({ width: 5, color: swatch.teal.line });
  c.addChild(g);
  const duck = friendArt('duck'); duck.scale.set(0.7); duck.y = -46; c.addChild(duck);
  return c;
}

interface Landing { stop: number; node: Container; art: Graphics }
interface Waiting { stop: number; node: Container }

class SeaLift implements Game {
  readonly hintLabel = 'Show a hint';
  readonly level: LevelId;
  readonly items: Item[];
  state: RoundState;
  busy = true;
  private L: ShaftLayout;
  private readonly bg = new Graphics();
  private readonly shaft = new Graphics();
  private readonly landingLayer = new Container();
  private readonly friendLayer = new Container();
  private readonly glow = new Graphics();
  readonly car = new Container();
  private readonly carArt = new Graphics();
  private readonly riders = new Container();
  readonly card = new Container();
  private readonly cardArt = new Graphics();
  private readonly cardFriend = new Container();
  /** Takes every touch and resolves it to the nearest landing, the card or the car. */
  readonly tapLayer = new Container();
  landings: Landing[] = [];
  waiting: Waiting[] = [];
  /** Where the lift is drawn (it can differ from the logic's start stop mid-ride). */
  carAt = 0;
  private gen = 0;
  private destroyed = false;
  private t = 0;
  private replayShown = false;
  private tint = 0;

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).id;
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    if (!ctx.demo) authoredShown.add(this.level);
    const items = makeRound(this.level, ctx.rng, authored);
    // The demonstration shows a short round: two rides, or one pick-up case.
    this.items = ctx.demo ? items.slice(0, this.level === 3 ? 1 : 2) : items;
    this.state = roundState(this.level, this.items);
    this.L = shaftLayout(ctx.view) ?? shaftLayout({ w: ctx.view.w, h: Math.max(ctx.view.h, 768) })!;

    for (const g of [this.bg, this.shaft, this.glow, this.landingLayer, this.friendLayer, this.car, this.card]) g.eventMode = 'none';
    this.car.addChild(this.carArt, this.riders);
    this.card.addChild(this.cardArt, this.cardFriend);
    for (const stop of STOPS) {
      const node = new Container(), art = new Graphics();
      node.addChild(art);
      this.landingLayer.addChild(node);
      this.landings.push({ stop, node, art });
    }
    ctx.stage.addChild(this.bg, this.shaft, this.landingLayer, this.friendLayer, this.glow, this.car, this.card, this.tapLayer);
    onTap(this.tapLayer, (e) => this.touch(e), { cooldown: 60 });
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.say(this.level === 1 ? 'sealift.instruct.updown' : this.level === 2 ? 'sealift.instruct.through' : 'sealift.intro');
    this.present();
  }

  private get item(): Item | undefined { return this.state.items[this.state.index]; }

  /* Drawing ------------------------------------------------------------------------------------------ */

  resize(v: View) {
    this.L = shaftLayout(v) ?? this.L;
    const L = this.L, y0 = L.stopY(0), bottom = L.stopY(-TOP) + L.pitch * 0.9;
    const g = this.bg.clear();
    g.rect(0, 0, v.w, y0).fill(swatch.blue.light);
    g.circle(v.w - 90, 70, 34).fill(swatch.yellow.fill);
    for (let i = 0; i < TOP; i++) {
      const a = y0 + i * L.pitch, shade = [0x8fd0ef, 0x74c0e8, 0x5aaedc, 0x4797cc, 0x3a84bb][i];
      g.rect(0, a, v.w, L.pitch + 1).fill(shade);
    }
    g.rect(0, y0 + TOP * L.pitch, v.w, v.h).fill(0x3a84bb);
    g.rect(0, bottom, v.w, v.h - bottom).fill(0xf3dcb0);
    g.moveTo(0, bottom).bezierCurveTo(v.w * 0.3, bottom - 14, v.w * 0.6, bottom + 12, v.w, bottom - 6).lineTo(v.w, v.h).lineTo(0, v.h).fill(0xf3dcb0);
    // The water line, zero, across the whole screen.
    g.moveTo(0, y0);
    for (let x = 0; x <= v.w; x += 60) g.quadraticCurveTo(x + 15, y0 - 8, x + 30, y0).quadraticCurveTo(x + 45, y0 + 8, x + 60, y0);
    g.stroke({ width: 6, color: 0xffffff });

    const s = this.shaft.clear(), top = L.stopY(TOP) - L.pitch * 0.9;
    s.rect(L.shaftX - 46, top, 92, bottom - top).fill({ color: 0xffffff, alpha: 0.28 }).stroke({ width: 5, color: swatch.teal.line });
    for (const stop of STOPS) {
      const y = L.stopY(stop) + 12, b = L.landings.get(stop)!;
      const inner = b.x + b.w < L.shaftX ? b.x + b.w - 6 : b.x + 6;
      s.rect(Math.min(inner, L.shaftX), y - 4, Math.abs(inner - L.shaftX), 8).fill(stop === 0 ? wood.fill : stop > 0 ? swatch.brown.light : 0x9aa7b5);
      s.circle(L.shaftX, y, 5).fill(swatch.teal.line);
    }

    for (const l of this.landings) this.drawLanding(l);
    this.tapLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.drawCard();
    this.placeCar(this.carAt);
    for (const w of this.waiting) this.placeOnLanding(w.node, w.stop);
  }

  private drawLanding(l: Landing) {
    const b = this.L.landings.get(l.stop)!, cx = b.x + b.w / 2, slabY = this.L.stopY(l.stop) + 12;
    l.node.pivot.set(cx, slabY); l.node.position.set(cx, slabY);
    const g = l.art.clear(), w = b.w, x = b.x;
    if (l.stop === 0) {
      g.roundRect(x, slabY, w, 36, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
      for (let i = 1; i < 4; i++) g.moveTo(x + (w * i) / 4, slabY + 4).lineTo(x + (w * i) / 4, slabY + 32).stroke({ width: 3, color: wood.line });
    } else if (l.stop > 0) {
      g.roundRect(x, slabY, w, 38, 14).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
      g.roundRect(x - 2, slabY - 6, w + 4, 14, 7).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    } else {
      g.roundRect(x, slabY, w, 38, 18).fill(0xb8c2cc).stroke({ width: 4, color: 0x7d8894 });
      // A bubble mark: the minus sign is never the only cue that a stop is below the water.
      g.circle(x + w - 16, slabY - 14, 7).circle(x + w - 30, slabY - 30, 5).circle(x + w - 14, slabY - 40, 4).stroke({ width: 3, color: 0xffffff });
    }
    while (l.node.children.length > 1) l.node.removeChildAt(1).destroy();
    const label = new Text({ text: numeral(l.stop), style: { fontFamily: FONT, fontSize: 30, fontWeight: '700', fill: l.stop < 0 ? 0xffffff : ink } });
    label.anchor.set(0.5); label.position.set(cx, slabY + 19);
    l.node.addChild(label);
  }

  private drawCard() {
    const c = this.L.card, g = this.cardArt.clear(), it = this.item;
    this.cardFriend.removeChildren().forEach((ch) => ch.destroy({ children: true }));
    if (!it || this.state.done) { this.card.visible = false; return; }
    this.card.visible = true;
    g.roundRect(c.x, c.y, c.w, c.h, 26).fill(0xffffff).stroke({ width: 5, color: swatch.teal.line });
    const ax = c.x + c.w - 60, ay = c.y + 80;
    if (it.kind === 'ride') {
      const r = request(this.level, it.ride);
      const f = friendArt(it.ride.friend, this.tint); f.scale.set(1.3); f.position.set(c.x + 64, c.y + 130); this.cardFriend.addChild(f);
      this.arrow(g, ax, ay, r.up);
      // One dot per stop, so the count can be seen as well as heard.
      const dots = r.count, cols = Math.min(dots, 5), sx = c.x + c.w / 2 - ((cols - 1) * 26) / 2 + 30;
      for (let i = 0; i < dots; i++) g.circle(sx + (i % 5) * 26 - 40, c.y + 170, 10).fill(swatch.teal.fill).stroke({ width: 3, color: swatch.teal.line });
    } else {
      const deep = it.pick.mode === 'deepest';
      this.arrow(g, ax, ay, !deep);
      // Three heights, the asked end marked.
      for (let i = 0; i < 3; i++) {
        const y = c.y + 50 + i * 55, first = deep ? i === 2 : i === 0;
        g.roundRect(c.x + 30, y, 70, 26, 8).fill(first ? swatch.yellow.fill : swatch.white.light).stroke({ width: 3, color: first ? swatch.yellow.line : swatch.white.line });
      }
      g.moveTo(c.x + 20, c.y + 46 + 55 * 1.5 + 13).lineTo(c.x + 112, c.y + 46 + 55 * 1.5 + 13).stroke({ width: 4, color: 0xffffff });
      g.rect(c.x + 20, c.y + 128, 92, 82).fill({ color: swatch.blue.fill, alpha: 0.25 });
    }
  }

  private arrow(g: Graphics, x: number, y: number, up: boolean) {
    const d = up ? -1 : 1;
    g.moveTo(x, y - 40 * d).lineTo(x, y + 40 * d).stroke({ width: 12, color: swatch.orange.fill, cap: 'round' });
    g.poly([x - 26, y + 18 * d, x + 26, y + 18 * d, x, y + 52 * d]).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line, join: 'round' });
  }

  private placeCar(stop: number) {
    const L = this.L, h = L.car.h, w = L.car.w;
    this.carArt.clear().roundRect(-w / 2, -h, w, h, 14).fill({ color: 0xffffff, alpha: 0.45 }).stroke({ width: 6, color: swatch.teal.line });
    this.carArt.rect(-w / 2 + 4, -6, w - 8, 6).fill(swatch.teal.line);
    this.car.position.set(L.shaftX, L.stopY(stop) + 12);
    this.carAt = stop;
    this.layRiders();
  }

  private layRiders() {
    const n = this.riders.children.length;
    this.riders.children.forEach((r, i) => { r.position.set(n > 1 ? (i - (n - 1) / 2) * 26 : 0, -6); r.scale.set(n > 1 ? 0.6 : 0.85); });
  }

  private placeOnLanding(node: Container, stop: number) {
    const b = this.L.landings.get(stop)!;
    node.position.set(b.x + b.w / 2 - 14, this.L.stopY(stop) + 8);
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.state.hinted || this.state.done) return;
    const b = this.L.landings.get(hintFor(this.state))!;
    g.roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 24).stroke({ width: 8, color: swatch.yellow.line });
    g.alpha = 0.7 + 0.3 * Math.sin(this.t * 4);
  }

  /* Flow --------------------------------------------------------------------------------------------- */

  private live(gen: number) { return !this.destroyed && gen === this.gen; }

  /** Set up the request or case in play and ask for it. */
  private present() {
    const it = this.item;
    this.clearRiders(); this.clearWaiting();
    this.drawCard();
    if (!it) return;
    this.tint++;
    if (it.kind === 'ride') {
      this.riders.addChild(friendArt(it.ride.friend, this.tint));
      this.placeCar(it.ride.from);
      this.ask();
    } else {
      it.pick.friends.forEach((f, i) => {
        const node = friendArt(f.friend, this.tint + i);
        this.friendLayer.addChild(node);
        this.placeOnLanding(node, f.stop);
        this.waiting.push({ stop: f.stop, node });
      });
      this.placeCar(this.carAt);
      this.ask();
    }
    this.busy = false;
  }

  private ask() {
    const it = this.item;
    if (!it) return;
    if (it.kind === 'ride') { const r = request(this.level, it.ride); void this.ctx.instruct(r.line, { n: r.n }); }
    else void this.ctx.instruct(it.pick.mode === 'deepest' ? 'sealift.instruct.deepest' : 'sealift.instruct.highest');
  }

  private touch(e: FederatedPointerEvent) {
    const p = this.ctx.stage.toLocal(e.global);
    const c = this.L.card;
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) { this.replay(); return; }
    const stop = nearestLanding(this.L, p.x, p.y);
    if (stop === null) {
      if (Math.abs(p.x - this.car.x) < this.L.car.w / 2 + 10 && p.y < this.car.y + 10 && p.y > this.car.y - this.L.car.h - 10) this.replay();
      return;
    }
    this.tapLanding(stop);
  }

  /** Hearing a friend again is free. */
  replay() {
    if (this.state.done) return;
    this.replayShown = true;
    sfx.pop(9);
    const f = this.cardFriend.children[0];
    if (f && !this.ctx.tw.busy(f)) { const y = f.y; void this.ctx.tw.to(f, { y: y - 16 }, { duration: 0.1 }).then(() => this.ctx.tw.to(f, { y }, { duration: 0.15 })); }
    this.ask();
  }

  private squash(stop: number) {
    const n = this.landings.find((l) => l.stop === stop)!.node;
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.06, 0.86);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.2 });
  }

  tapLanding(stop: number) {
    this.squash(stop);
    if (this.busy || this.state.done) return;
    const c = check(this.state, stop);
    if (c.kind === 'ignore') { sfx.tick(); return; }
    const it = this.item!, gen = this.gen, hintsBefore = this.state.hints;
    this.busy = true;
    apply(this.state, c);
    const newHint = this.state.hints > hintsBefore;
    if (c.kind === 'right') { void this.arrive(it, stop, gen); return; }
    sfx.boing();
    void this.ride(stop, gen).then(async () => {
      if (!this.live(gen)) return;
      if (it.kind === 'ride') {
        const r = it.ride, d = r.to - r.from;
        const want = this.level === 1 ? stopName(r.to) : `${word(d)} ${d > 0 ? 'up' : 'down'}`;
        const line = this.level === 1 ? 'sealift.miss.updown' : 'sealift.miss.through';
        await this.ctx.say(line, { where: stopName(stop, true), want, count: countAloud(r.from, stop) });
        if (!this.live(gen)) return;
        if (c.support) { await this.supported(it, c.right, gen); return; }
        await this.ride(r.from, gen, false);
      } else {
        const right = this.waiting.find((w) => w.stop === c.right);
        if (right) this.hop(right.node);
        await this.ctx.say(c.right < stop ? 'sealift.miss.deeper' : 'sealift.miss.higher');
        if (!this.live(gen)) return;
        if (c.support) { await this.supported(it, c.right, gen); return; }
      }
      if (newHint) void this.ctx.say('sealift.hint');
      this.busy = false;
    });
  }

  /** The supported finish: the lift goes to the right stop by itself, counting aloud, and nothing more is counted. */
  private async supported(it: Item, right: number, gen: number) {
    void this.ctx.say('sealift.count', { count: countAloud(this.carAt, right) });
    await this.arrive(it, right, gen);
  }

  /** The lift rides to the right stop: the friend gets off there, or gets on. */
  private async arrive(it: Item, stop: number, gen: number) {
    sfx.pop(7);
    await this.ride(stop, gen);
    if (!this.live(gen)) return;
    this.ctx.pet.cheer();
    if (it.kind === 'ride') {
      const rider = this.riders.children[0] as Container | undefined;
      if (rider) { this.riders.removeChild(rider); this.friendLayer.addChild(rider); this.placeOnLanding(rider, stop); rider.scale.set(1); this.hop(rider); }
      await this.ctx.say('sealift.at', { where: stopName(stop, true) });
      if (!this.live(gen)) return;
      if (rider) await this.ctx.tw.to(rider, { alpha: 0 }, { duration: 0.4 });
      if (!this.live(gen)) return;
      rider?.destroy({ children: true });
      if (this.level === 1 && !this.state.done) await this.ride(0, gen, false);
    } else {
      const i = this.waiting.findIndex((w) => w.stop === stop);
      if (i >= 0) { const [w] = this.waiting.splice(i, 1); this.friendLayer.removeChild(w.node); this.riders.addChild(w.node); this.layRiders(); }
      if (this.waiting.length > 0) { this.busy = false; return; }
      await this.ctx.say('sealift.aboard');
      if (!this.live(gen)) return;
      for (const r of this.riders.children) this.hop(r as Container);
      await this.ctx.tw.wait(0.6);
      if (!this.live(gen)) return;
      await this.ride(0, gen, false);
    }
    if (!this.live(gen)) return;
    if (this.state.done) { this.finish(); return; }
    this.present();
  }

  /** Glide stop by stop with a tick at each, a splash at the water; a quiet glide (`counted` false) goes back without ticks. */
  private async ride(to: number, gen: number, counted = true) {
    const from = this.carAt;
    if (from === to) return;
    if (!counted) {
      await this.ctx.tw.to(this.car, { y: this.L.stopY(to) + 12 }, { duration: Math.min(0.8, 0.12 * Math.abs(to - from) + 0.2), ease: (t) => t * t * (3 - 2 * t) });
      if (this.live(gen)) this.carAt = to;
      return;
    }
    for (const s of path(from, to)) {
      await this.ctx.tw.to(this.car, { y: this.L.stopY(s) + 12 }, { duration: STEP_SECONDS, ease: (t) => t });
      if (!this.live(gen)) return;
      this.carAt = s;
      sfx.marimba(s + 7, 0.35);
      if (s === 0) { sfx.splash(); this.ctx.particles.burst(this.car.x, this.car.y - 12, { kind: 'ring', colors: [0xffffff, 0xcde6ff], count: 10, speed: [80, 200], gravity: 300, life: [0.4, 0.7] }); }
    }
  }

  private hop(node: Container) {
    if (this.ctx.tw.busy(node)) return;
    const y = node.y;
    void this.ctx.tw.to(node, { y: y - 18 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node, { y }, { duration: 0.16 }));
  }

  private finish() {
    this.busy = true;
    this.drawCard();
    void this.ctx.say('sealift.done');
    void this.ctx.tw.wait(1).then(() => { if (!this.destroyed) this.ctx.finish({ misses: this.state.misses, hints: this.state.hints }); });
  }

  private clearRiders() {
    for (const r of this.riders.removeChildren()) { this.ctx.tw.kill(r); r.destroy({ children: true }); }
  }
  private clearWaiting() {
    for (const w of this.waiting) { this.ctx.tw.kill(w.node); w.node.destroy({ children: true }); }
    this.waiting = [];
    for (const n of this.friendLayer.removeChildren()) { this.ctx.tw.kill(n); n.destroy({ children: true }); }
  }

  /* Help --------------------------------------------------------------------------------------------- */

  askForHint() {
    if (this.state.done) return;
    if (giveHint(this.state)) void this.ctx.say('sealift.hint');
  }

  /** The same round from its first request, keeping misses and hints. */
  restart() {
    if (this.state.done) return;
    this.gen++;
    this.ctx.tw.kill(this.car);
    const keep = { misses: this.state.misses, hints: this.state.hints };
    this.state = roundState(this.level, this.items);
    Object.assign(this.state, keep);
    this.carAt = startStop(this.state);
    this.present();
  }

  /* Frame and bot ------------------------------------------------------------------------------------ */

  update(dt: number) {
    this.t += dt;
    this.drawGlow();
  }

  /** The ghost finger taps the right landing; level 1's first request also shows the free replay on the card. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.state.done) return null;
    if (this.level === 1 && !this.replayShown) {
      const c = this.L.card;
      return { tap: { on: this.tapLayer, x: c.x + 64, y: c.y + 100 }, pause: 1.2 };
    }
    const b = this.L.landings.get(hintFor(this.state))!;
    return { tap: { on: this.tapLayer, x: b.x + b.w / 2, y: b.y + b.h / 2 }, pause: 0.8 };
  }

  destroy() {
    this.destroyed = true;
    this.gen++;
  }
}

function sticker(seed: number): Container {
  const c = new Container(), g = new Graphics(), below = Math.abs(seed) % 2 === 0;
  g.rect(-90, -160, 180, 100).fill(swatch.blue.light).rect(-90, -60, 180, 80).fill(swatch.blue.fill);
  g.moveTo(-90, -60).bezierCurveTo(-50, -72, -20, -48, 0, -60).bezierCurveTo(20, -72, 60, -48, 90, -60).stroke({ width: 5, color: 0xffffff });
  g.rect(-8, -160, 16, 180).fill({ color: 0xffffff, alpha: 0.4 }).stroke({ width: 3, color: swatch.teal.line });
  const carY = below ? 0 : -78;
  g.roundRect(-34, carY - 56, 68, 56, 10).fill({ color: 0xffffff, alpha: 0.6 }).stroke({ width: 5, color: swatch.teal.line });
  c.addChild(g);
  const kinds: Friend[] = below ? ['fish', 'turtle', 'penguin'] : ['duck', 'cat', 'bunny', 'pig'];
  const f = friendArt(kinds[Math.abs(seed >> 1) % kinds.length], seed); f.scale.set(0.75); f.y = carY - 6; c.addChild(f);
  return c;
}

export const seaLift: GameModule = {
  id: 'sea-lift',
  name: 'Sea Lift',
  titleLine: 'game.sea-lift',
  region: 'counting-cove',
  skills: ['negative-numbers', 'number-line', 'counting-back', 'ordering'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Caller and driver: you call a ride ("four below the water!") and {name} drives the lift, then swap.',
  offScreen: 'Tape a line on the floor with a zero in the middle, and take turns calling "two below" and hopping there.',
  touchDemo: true,
  hubIcon: () => new WigglyIcon(liftArt()),
  sticker,
  create: (ctx) => new SeaLift(ctx),
};
