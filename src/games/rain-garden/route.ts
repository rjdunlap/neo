/**
 * Rain Garden level 4, *two-socket downhill route*: two beds on a terraced slope, the rain falling on the top one and
 * what it can't hold running down to the low bed and on to the pond. She sets each bed's ground, tries it with the cloud
 * as often as she likes, then taps the Check: the leaf bed must keep exactly two and the pond must get some.
 * The rules are in logic.ts (`runRoute`, `check`, `routeHint`); this file draws and times them.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { arrowArt, checkArt, cloudArt, dropArt, friendArt, motionArt, needSignArt, patchArt, pondArt, rewindArt, rippleArt } from './art';
import {
  CHECK, check, flipBed, makeRoute, planFor, routeFresh, routeHint, routeLayout, routeNext, routeRestart, tryRoute,
  type Cause, type Plan, type Place, type RouteLayout, type RouteRound, type RouteState, type RouteTrial,
} from './logic';

/** The authored board leads the first level-4 round of a session. */
let authoredShown = false;

/** A drop that has settled: in a bed's pocket or a pond slot. */
interface Settled { node: Container; at: Place; index: number }

export class RainRoute implements Game {
  readonly plan: Plan;
  readonly round: RouteRound;
  s: RouteState;
  busy = false;
  finished = false;
  readonly cloud: Container;
  readonly check: Container;
  /** Each bed's tap target (top, then low); the bed's drawing is underneath. */
  readonly beds: Container[] = [];
  private layout: RouteLayout;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly boardLayer = new Container();
  private readonly patchLayer = new Container();
  private readonly glow = new Graphics();
  private readonly dropLayer = new Container();
  private readonly signLayer = new Container();
  private readonly rewind = rewindArt();
  private patches: Graphics[] = [];
  private friend: Container | null = null;
  private signs: Container[] = [];
  private settled: Settled[] = [];
  private readonly flying = new Set<Container>();
  private stale = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const first = ctx.demo || !authoredShown;
    if (first && !ctx.demo) authoredShown = true;
    this.round = makeRoute(ctx.rng, first);
    this.s = routeFresh(this.round);
    this.backdrop = new Backdrop({ sky: [0xcfe4f5, 0xfff6e0], hills: [0xd6efc8, 0xc5e7a8], horizon: 0.86, clouds: 0, sun: false, seed: 157 }, ctx.view);
    this.layout = routeLayout(ctx.view, this.round.bed, this.round.mirror)!;
    const c = this.layout.cloud;
    this.cloud = cloudArt(c.w, c.h);
    this.cloud.hitArea = new Rectangle(-c.w / 2, -c.h / 2, c.w, c.h);
    onTap(this.cloud, () => this.tapCloud());
    this.rewind.visible = false;
    this.rewind.position.set(0, -c.h / 2 + 10);
    this.cloud.addChild(this.rewind);
    this.check = checkArt(CHECK);
    this.check.hitArea = new Rectangle(-CHECK / 2, -CHECK / 2, CHECK, CHECK);
    onTap(this.check, () => this.tapCheck());
    for (const n of [this.boardLayer, this.patchLayer, this.glow, this.dropLayer, this.signLayer]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.boardLayer, this.patchLayer, this.glow, this.dropLayer, this.signLayer);
    for (let i = 0; i < 2; i++) {
      const t = new Container();
      const p = this.layout.beds[i].patch;
      t.hitArea = new Rectangle(-p.w / 2, -p.h / 2, p.w, p.h);
      onTap(t, () => this.tapBed(i));
      this.beds.push(t);
      ctx.stage.addChild(t);
    }
    ctx.stage.addChild(this.cloud, this.check);
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    const cur = this.s.current;
    return {
      level: 4, bed: this.round.bed, start: this.round.start.slice(), surfaces: this.s.sockets.slice(), mirror: this.round.mirror, friend: this.round.friend,
      current: cur ? [...cur.stored, cur.pond] : null, misses: this.s.misses, hints: this.s.hints, glow: this.s.glow, pointing: this.s.pointing ? 'check' : null,
      passed: this.s.passed, busy: this.busy, finished: this.finished, drops: this.settled.length,
    };
  }

  start() { void this.ctx.instruct('rain.instruct.4'); }

  destroy() {
    this.finished = true;
    for (const n of [this.cloud, this.check, ...this.patches]) this.ctx.tw.kill(n.scale);
    for (const n of this.signs) this.ctx.tw.kill(n);
    if (this.friend) this.ctx.tw.kill(this.friend);
    for (const n of this.flying) this.ctx.tw.kill(n);
    for (const s of this.settled) this.ctx.tw.kill(s.node);
  }

  // ---- drawing ----

  private dir(): 1 | -1 { return this.round.mirror ? -1 : 1; }

  private drawBoard() {
    const l = this.layout;
    this.boardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.patchLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.boardLayer.addChild(arrowArt(l.arrows[0]), arrowArt(l.arrows[1]), pondArt(l.pond, l.slots));
    this.friend = friendArt(this.round.friend);
    this.friend.position.set(l.friend.x, l.friend.y);
    this.boardLayer.addChild(this.friend);
    this.patches = [0, 1].map((i) => this.patchGraphic(i));
    this.drawSigns();
  }

  private patchGraphic(i: number): Graphics {
    const b = this.layout.beds[i];
    const g = patchArt(this.s.sockets[i], b.patch.w, b.patch.h, b.pockets.map((p) => ({ x: p.x - b.patch.x, y: p.y - b.patch.y, w: p.w, h: p.h })), this.dir());
    g.position.set(b.patch.x, b.patch.y);
    this.patchLayer.addChild(g);
    return g;
  }

  /** The need signs, filled from the drops on the board now. */
  private drawSigns() {
    this.signLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const l = this.layout;
    const inBed = Math.min(2, this.settled.filter((d) => d.at === this.round.bed).length);
    const inPond = Math.min(1, this.settled.filter((d) => d.at === 'pond').length);
    const bed = needSignArt('bed', inBed, inBed === 2, l.bedSign.w, l.bedSign.h);
    const pond = needSignArt('pond', inPond, inPond === 1, l.pondSign.w, l.pondSign.h);
    bed.position.set(l.bedSign.x, l.bedSign.y);
    pond.position.set(l.pondSign.x, l.pondSign.y);
    this.signs = [bed, pond];
    this.signLayer.addChild(bed, pond);
  }

  private placeSettled() {
    for (const d of this.settled) {
      const at = d.at === 'pond' ? this.layout.slots[d.index] : this.layout.beds[d.at].pockets[d.index];
      d.node.position.set(at.x, at.y);
    }
  }

  private squash(n: Container) {
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.08, 0.88);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  // ---- rain ----

  private tapCloud() {
    if (this.busy || this.finished || this.s.passed) return;
    this.squash(this.cloud);
    void this.tryIt(true);
  }

  /** Rain on the current arrangement from fresh, then (when `narrate`) say where the drops went. */
  private async tryIt(narrate: boolean) {
    this.busy = true;
    this.s = { ...this.s, pointing: false };
    if (this.settled.length) { await this.freshen(); if (this.finished) return; }
    this.drawSigns();
    const next = tryRoute(this.s);
    await this.showRun(next.current!);
    if (this.finished) return;
    this.s = next;
    this.idle();
    this.drawSigns();
    if (narrate) await this.ctx.say(this.routeLine());
  }

  private routeLine(): LineId { return `rain.route.${this.s.sockets.join('-')}` as LineId; }

  private async showRun(t: RouteTrial) {
    const count = { pocket: [0, 0], slot: 0 };
    for (const step of t.steps) {
      await this.fall(step.path, count, step.unit);
      if (this.finished) return;
      this.drawSigns();
    }
  }

  /** One drop along its path: into the top bed's pocket, or down the first arrow to the low bed, and maybe on to the pond. */
  private async fall(path: Place[], count: { pocket: number[]; slot: number }, unit: number) {
    const l = this.layout;
    const dir = this.dir();
    const end = path[path.length - 1];
    const index = end === 'pond' ? count.slot++ : count.pocket[end]++;
    const node = new Container();
    node.addChild(dropArt(44));
    const top = l.beds[0];
    const cloudY = l.cloud.y + l.cloud.h / 2 - 20;
    const startX = end === 0 ? top.pockets[index].x : top.patch.x + dir * (top.patch.w / 2 - 50 - 30 * (unit % 2));
    node.position.set(startX, cloudY);
    this.dropLayer.addChild(node);
    this.flying.add(node);
    const done = () => { this.flying.delete(node); this.settled.push({ node, at: end, index }); };
    const settle = async (bed: number) => {
      const p = l.beds[bed].pockets[index];
      await this.ctx.tw.to(node, { x: p.x, y: p.y }, { duration: bed === 0 ? 0.6 : 0.35, ease: bed === 0 ? ease.inQuad : ease.outQuad });
      if (this.finished) return;
      sfx.marimba(5 + index * 2 + bed, 0.4);
      this.ctx.particles.burst(p.x, p.y, { kind: 'dot', colors: [swatch.blue.light, 0xffffff], count: 6, speed: [40, 100], gravity: 200, life: [0.2, 0.4] });
      done();
      await this.ctx.tw.wait(0.2);
    };
    if (end === 0) { await settle(0); return; }
    // Run past the top bed: onto its ground, down the first arrow.
    const lines = motionArt();
    lines.scale.x = dir;
    await this.ctx.tw.to(node, { y: top.patch.y - top.patch.h / 2 + 10 }, { duration: 0.5, ease: ease.inQuad });
    if (this.finished) return;
    sfx.pluck(3, 0.2);
    node.addChildAt(lines, 0);
    const a = l.arrows[0];
    await this.ctx.tw.to(node, { x: a.x1, y: a.y1 }, { duration: 0.25, ease: ease.inOutSine });
    if (this.finished) return;
    await this.ctx.tw.to(node, { x: a.x2, y: a.y2 }, { duration: 0.35, ease: ease.inQuad });
    if (this.finished) return;
    if (end === 1) { lines.visible = false; await settle(1); return; }
    // And past the low bed: across its ground, down the second arrow, into a pond slot.
    const low = l.beds[1].patch;
    await this.ctx.tw.to(node, { x: low.x + dir * (low.w / 2 - 40), y: low.y - low.h / 2 + 14 }, { duration: 0.35, ease: ease.inOutSine });
    if (this.finished) return;
    sfx.pluck(2, 0.2);
    const b = l.arrows[1];
    await this.ctx.tw.to(node, { x: b.x1, y: b.y1 }, { duration: 0.2, ease: ease.inOutSine });
    if (this.finished) return;
    await this.ctx.tw.to(node, { x: b.x2, y: b.y2 }, { duration: 0.4, ease: ease.inQuad });
    if (this.finished) return;
    lines.destroy();
    const slot = l.slots[index];
    await this.ctx.tw.to(node, { x: slot.x, y: slot.y }, { duration: 0.3, ease: ease.outQuad });
    if (this.finished) return;
    sfx.marimba(index, 0.4);
    sfx.splash();
    const ripple = rippleArt(slot.w / 2);
    ripple.y = 14;
    node.addChildAt(ripple, 0);
    if (index === 0) this.cheer();
    done();
  }

  private cheer() {
    const f = this.friend;
    if (!f) return;
    if (this.round.friend === 'frog') sfx.ribbit(); else if (this.round.friend === 'duck') sfx.animal('quack'); else sfx.squeak(6);
    this.ctx.tw.kill(f);
    const y = this.layout.friend.y;
    void this.ctx.tw.to(f, { y: y - 24 }, { duration: 0.18, ease: ease.outQuad }).then(() => (this.finished ? undefined : this.ctx.tw.to(f, { y }, { duration: 0.25, ease: ease.outBack })));
  }

  /** Back to fresh ground: the pond tips into its drain and fresh beds slide in under the rewind badge. Nothing rises to the cloud. */
  private async freshen() {
    sfx.whoosh();
    this.rewind.visible = true;
    const old = this.settled;
    this.settled = [];
    for (const d of old) void this.ctx.tw.to(d.node, { alpha: 0, y: d.node.y + (d.at === 'pond' ? 40 : 0) }, { duration: 0.4, ease: ease.inQuad });
    const dx = -this.dir() * 80;
    const olds = this.patches;
    this.patches = [0, 1].map((i) => {
      void this.ctx.tw.to(olds[i], { alpha: 0 }, { duration: 0.4 });
      const n = this.patchGraphic(i);
      n.x += dx; n.alpha = 0;
      void this.ctx.tw.to(n, { x: n.x - dx, alpha: 1 }, { duration: 0.45, ease: ease.outQuad });
      return n;
    });
    this.drawSigns();
    await this.ctx.tw.wait(0.5);
    if (this.finished) return;
    for (const d of old) d.node.destroy({ children: true });
    for (const g of olds) g.destroy();
    this.rewind.visible = false;
  }

  // ---- ground ----

  private tapBed(i: number) {
    if (this.busy || this.finished || this.s.passed) return;
    this.flipTo(flipBed(this.s, i), i);
  }

  /** Show a flipped bed: its new ground, a squash and its sound; a board with drops on it wipes to fresh. */
  private flipTo(next: RouteState, i: number) {
    this.s = next;
    if (next.sockets[i] === 'stone') sfx.clunk(); else sfx.squish();
    if (this.settled.length) {
      this.busy = true;
      void this.freshen().then(() => { if (!this.finished) this.idle(); });
    } else {
      const old = this.patches[i];
      this.patches[i] = this.patchGraphic(i);
      old.destroy();
    }
    this.squash(this.patches[i]);
  }

  // ---- checking ----

  private tapCheck() {
    if (this.busy || this.finished || this.s.passed) return;
    this.squash(this.check);
    void this.judge();
  }

  private async judge() {
    if (!this.s.current) { await this.tryIt(false); if (this.finished) return; }
    const before = this.s.glow;
    const { state, verdict } = check(this.s, this.round);
    this.s = state;
    if (verdict.result === 'ignored') return;
    this.busy = true;
    if (verdict.result === 'pass') {
      this.drawSigns();
      sfx.tada();
      this.cheer();
      await this.ctx.say('rain.check.yes');
      if (this.finished) return;
      this.finished = true;
      this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
      return;
    }
    sfx.boing();
    this.wobble(verdict.cause!);
    await this.ctx.say(verdict.cause === 'dry' ? 'rain.miss.dry' : 'rain.miss.pond');
    if (this.finished) return;
    await this.ctx.say(this.routeLine());
    if (this.finished) return;
    if (this.s.glow !== null && this.s.glow !== before) await this.ctx.say('rain.glow');
    if (this.finished) return;
    this.idle();
  }

  /** The unmet need's sign wobbles. */
  private wobble(cause: Cause) {
    const sign = this.signs[cause === 'dry' ? 0 : 1];
    if (!sign) return;
    this.ctx.tw.kill(sign);
    sign.rotation = 0;
    void this.ctx.tw.to(sign, { rotation: 0.12 }, { duration: 0.1 })
      .then(() => (this.finished ? undefined : this.ctx.tw.to(sign, { rotation: -0.1 }, { duration: 0.14 })))
      .then(() => (this.finished ? undefined : this.ctx.tw.to(sign, { rotation: 0 }, { duration: 0.12 })));
  }

  // ---- help ----

  readonly hintLabel = 'Show me';

  /** Show me: the pet changes one bed toward a solution (one hint), or points at the Check when it already passes. */
  askForHint() {
    if (this.busy || this.finished || this.s.passed) return;
    const { state, hint } = routeHint(this.s, this.round);
    if (hint.kind === 'flip') {
      this.flipTo(state, hint.bed);
      void this.ctx.say('rain.hint.flip');
    } else {
      this.s = state;
      void this.ctx.say('rain.hint.check');
    }
  }

  restart() {
    if (this.finished) return;
    const go = () => {
      if (this.finished) return;
      if (this.busy) { void this.ctx.tw.wait(0.2).then(go); return; }
      this.s = routeRestart(this.s, this.round);
      for (const d of this.settled) d.node.destroy({ children: true });
      this.settled = [];
      this.drawBoard();
      void this.ctx.say('rain.again');
    };
    go();
  }

  // ---- shell hooks ----

  private idle() {
    this.busy = false;
    if (this.stale) { this.stale = false; this.resize(this.ctx.view); }
  }

  resize(view: View) {
    this.layout = routeLayout(view, this.round.bed, this.round.mirror) ?? this.layout;
    const l = this.layout;
    this.backdrop.resize(view);
    if (this.busy) this.stale = true;
    else { this.drawBoard(); this.placeSettled(); }
    this.cloud.position.set(l.cloud.x, l.cloud.y);
    this.check.position.set(l.check.x, l.check.y);
    this.beds.forEach((b, i) => b.position.set(l.beds[i].patch.x, l.beds[i].patch.y));
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.finished || this.s.passed) return;
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const ring = (x: number, y: number, w: number, h: number) =>
      this.glow.roundRect(x - w / 2 - pulse, y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 26).stroke({ width: 7, color: swatch.yellow.fill });
    // The causal glow sits behind the bed's tap target, so it never blocks a tap.
    if (this.s.glow !== null) { const p = this.layout.beds[this.s.glow].patch; ring(p.x, p.y, p.w, p.h); }
    if (this.s.pointing && !this.busy) { const c = this.layout.check; ring(c.x, c.y, c.w, c.h); }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.s.passed) return null;
    const n = routeNext(this.s, this.round);
    const on = n.kind === 'cloud' ? this.cloud : n.kind === 'check' ? this.check : this.beds[n.bed];
    return { tap: { on }, pause: 0.8 };
  }
}
