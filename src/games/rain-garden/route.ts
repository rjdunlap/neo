/**
 * Rain Garden levels 4 and 5, beds downhill: two or three beds on a slope, the rain falling on the top one and what a
 * bed can't hold running down to the next and on to the pond. She sets each bed's ground (the tree's bed and the stone
 * path of level 5 stay put), tries it with the cloud as often as she likes, then taps the Check: every marked bed must
 * keep exactly two and the pond must get some. The rules are in logic.ts (`runRoute`, `check`, `routeHint`,
 * `narration`); this file draws and times them.
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
import {
  arrowArt,
  checkArt,
  cloudArt,
  cloudDropsArt,
  dropArt,
  fixedArt,
  friendArt,
  markerArt,
  motionArt,
  needSignArt,
  patchArt,
  pondArt,
  rewindArt,
  rippleArt,
} from './art';
import {
  CHECK,
  check,
  flipBed,
  makeRoute,
  narration,
  planFor,
  routeFresh,
  routeHint,
  routeLayout,
  routeNext,
  routeRestart,
  tryRoute,
  type Plan,
  type Place,
  type RouteLayout,
  type RouteRound,
  type RouteState,
  type RouteTrial,
} from './logic';

/** Each level's authored board leads its first round of a session. */
const authoredShown = new Set<number>();

/** A drop that has settled: in a bed's pocket or a pond slot. */
interface Settled {
  node: Container;
  at: Place;
  index: number;
}

export class RainRoute implements Game {
  readonly plan: Plan;
  readonly round: RouteRound;
  s: RouteState;
  busy = false;
  finished = false;
  readonly cloud: Container;
  readonly check: Container;
  /** Each bed's tap target, from the top; the bed's drawing is underneath. */
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
    const level = this.plan.level === 5 ? 5 : 4;
    const first = ctx.demo || !authoredShown.has(level);
    if (first && !ctx.demo) authoredShown.add(level);
    this.round = makeRoute(ctx.rng, first, level);
    this.s = routeFresh(this.round);
    this.backdrop = new Backdrop(
      {
        sky: [0xcfe4f5, 0xfff6e0],
        hills: [0xd6efc8, 0xc5e7a8],
        horizon: 0.86,
        clouds: 0,
        sun: false,
        seed: 157,
      },
      ctx.view,
    );
    this.layout = routeLayout(ctx.view, this.round.board, this.round.mirror)!;
    const c = this.layout.cloud;
    this.cloud = cloudArt(c.w, c.h);
    // Level 5's shower size changes by board, so the cloud shows it before it rains.
    if (this.round.level === 5) this.cloud.addChild(cloudDropsArt(this.round.board.units, c.h / 2 - 16));
    this.cloud.hitArea = new Rectangle(-c.w / 2, -c.h / 2, c.w, c.h);
    onTap(this.cloud, () => this.tapCloud());
    this.rewind.visible = false;
    this.rewind.position.set(0, -c.h / 2 + 10);
    this.cloud.addChild(this.rewind);
    this.check = checkArt(CHECK);
    this.check.hitArea = new Rectangle(-CHECK / 2, -CHECK / 2, CHECK, CHECK);
    onTap(this.check, () => this.tapCheck());
    for (const n of [this.boardLayer, this.patchLayer, this.glow, this.dropLayer, this.signLayer])
      n.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.boardLayer,
      this.patchLayer,
      this.glow,
      this.dropLayer,
      this.signLayer,
    );
    for (let i = 0; i < this.round.board.fixed.length; i++) {
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
      level: this.round.level,
      board: this.round.board.id,
      bed: this.round.board.marked[0].socket,
      marked: this.round.board.marked.map((m) => m.socket),
      units: this.round.board.units,
      start: this.round.start.slice(),
      surfaces: this.s.sockets.slice(),
      mirror: this.round.mirror,
      friend: this.round.friend,
      current: cur ? [...cur.stored, cur.pond] : null,
      misses: this.s.misses,
      hints: this.s.hints,
      glow: this.s.glow,
      pointing: this.s.pointing ? 'check' : null,
      passed: this.s.passed,
      busy: this.busy,
      finished: this.finished,
      drops: this.settled.length,
    };
  }

  start() {
    void this.ctx.instruct(`rain.instruct.${this.round.level}`);
  }

  destroy() {
    this.finished = true;
    for (const n of [this.cloud, this.check, ...this.patches]) this.ctx.tw.kill(n.scale);
    for (const n of this.signs) this.ctx.tw.kill(n);
    if (this.friend) this.ctx.tw.kill(this.friend);
    for (const n of this.flying) this.ctx.tw.kill(n);
    for (const s of this.settled) this.ctx.tw.kill(s.node);
  }

  // ---- drawing ----

  /** The way bed `i`'s arrow runs out of it: its low side. */
  private dir(i: number): 1 | -1 {
    const b = this.layout.beds[i].patch;
    return this.layout.arrows[i].x1 < b.x ? -1 : 1;
  }

  private drawBoard() {
    const l = this.layout;
    this.boardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.patchLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.boardLayer.addChild(...l.arrows.map((a) => arrowArt(a)), pondArt(l.pond, l.slots));
    this.friend = friendArt(this.round.friend);
    this.friend.position.set(l.friend.x, l.friend.y);
    this.boardLayer.addChild(this.friend);
    this.patches = l.beds.map((_, i) => this.patchGraphic(i));
    this.drawSigns();
  }

  private patchGraphic(i: number): Graphics {
    const b = this.layout.beds[i];
    const g = patchArt(
      this.s.sockets[i],
      b.patch.w,
      b.patch.h,
      b.pockets.map((p) => ({ x: p.x - b.patch.x, y: p.y - b.patch.y, w: p.w, h: p.h })),
      this.dir(i),
    );
    const fixed = this.round.board.fixed[i];
    if (fixed) g.addChild(fixedArt(fixed, b.patch.w, b.patch.h, this.dir(i)));
    // A marked bed wears its sign's marker in its lower uphill corner, so a sign and its bed match without reading.
    const mark = this.round.level === 5 ? this.round.board.marked.find((m) => m.socket === i) : undefined;
    if (mark) {
      const m = markerArt(mark.marker);
      m.position.set(-this.dir(i) * (b.patch.w / 2 - 28), b.patch.h / 2 - 24);
      g.addChild(m);
    }
    g.position.set(b.patch.x, b.patch.y);
    this.patchLayer.addChild(g);
    return g;
  }

  /** The need signs, filled from the drops on the board now. */
  private drawSigns() {
    this.signLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const l = this.layout;
    const beds = this.round.board.marked.map((m, i) => {
      const n = Math.min(2, this.settled.filter((d) => d.at === m.socket).length);
      const b = l.bedSigns[i];
      const sign = needSignArt('bed', n, n === 2, b.w, b.h, m.marker);
      sign.position.set(b.x, b.y);
      return sign;
    });
    const inPond = Math.min(1, this.settled.filter((d) => d.at === 'pond').length);
    const pond = needSignArt('pond', inPond, inPond === 1, l.pondSign.w, l.pondSign.h);
    pond.position.set(l.pondSign.x, l.pondSign.y);
    /** The marked beds' signs in `board.marked` order, then the pond's. */
    this.signs = [...beds, pond];
    this.signLayer.addChild(...this.signs);
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
    if (this.settled.length) {
      await this.freshen();
      if (this.finished) return;
    }
    this.drawSigns();
    const next = tryRoute(this.s, this.round);
    await this.showRun(next.current!);
    if (this.finished) return;
    this.s = next;
    this.idle();
    this.drawSigns();
    if (narrate) await this.narrate();
  }

  /** Where the water went: level 4's one line per arrangement, or level 5's short clips, one per bed from the top, then the pond. */
  private async narrate() {
    const t = this.s.current;
    if (!t) return;
    const lines =
      this.round.level === 4 ? [`rain.route.${this.s.sockets.join('-')}`] : narration(t, this.round.board);
    for (const id of lines) {
      await this.ctx.say(id as LineId);
      if (this.finished) return;
    }
  }

  private async showRun(t: RouteTrial) {
    const count = { pocket: this.s.sockets.map(() => 0), slot: 0 };
    for (const step of t.steps) {
      await this.fall(step.path, count, step.unit);
      if (this.finished) return;
      this.drawSigns();
    }
  }

  /** One drop along its path: from the cloud onto the top bed, then over each bed it runs past and down its arrow, into a pocket or a pond slot. */
  private async fall(path: Place[], count: { pocket: number[]; slot: number }, unit: number) {
    const l = this.layout;
    const pace = this.round.level === 5 ? 0.7 : 1;
    const go = (to: { x?: number; y?: number }, duration: number, e: (t: number) => number) =>
      this.ctx.tw.to(node, to, { duration: duration * pace, ease: e });
    const end = path[path.length - 1];
    const index = end === 'pond' ? count.slot++ : count.pocket[end]++;
    const node = new Container();
    node.addChild(dropArt(44));
    const top = l.beds[0];
    const cloudY = l.cloud.y + l.cloud.h / 2 - 20;
    const startX =
      end === 0 ? top.pockets[index].x : top.patch.x + this.dir(0) * (top.patch.w / 2 - 50 - 30 * (unit % 2));
    node.position.set(startX, cloudY);
    this.dropLayer.addChild(node);
    this.flying.add(node);
    const done = () => {
      this.flying.delete(node);
      this.settled.push({ node, at: end, index });
    };
    const settle = async (bed: number) => {
      const p = l.beds[bed].pockets[index];
      await go({ x: p.x, y: p.y }, bed === 0 ? 0.6 : 0.35, bed === 0 ? ease.inQuad : ease.outQuad);
      if (this.finished) return;
      sfx.marimba(5 + index * 2 + bed, 0.4);
      this.ctx.particles.burst(p.x, p.y, {
        kind: 'dot',
        colors: [swatch.blue.light, 0xffffff],
        count: 6,
        speed: [40, 100],
        gravity: 200,
        life: [0.2, 0.4],
      });
      done();
      await this.ctx.tw.wait(0.2 * pace);
    };
    if (end === 0) {
      await settle(0);
      return;
    }
    const lines = motionArt();
    // Run past each bed it can't stay in: onto its ground, across to its low side, down its arrow.
    for (let k = 0; k < path.length - 1; k++) {
      const i = path[k] as number;
      const patch = l.beds[i].patch;
      const dir = this.dir(i);
      if (k === 0) await go({ y: patch.y - patch.h / 2 + 10 }, 0.5, ease.inQuad);
      else
        await go(
          { x: patch.x + dir * (patch.w / 2 - 40), y: patch.y - patch.h / 2 + 14 },
          0.35,
          ease.inOutSine,
        );
      if (this.finished) return;
      sfx.pluck(Math.max(0, 3 - k), 0.2);
      lines.scale.x = dir;
      if (k === 0) node.addChildAt(lines, 0);
      const a = l.arrows[i];
      await go({ x: a.x1, y: a.y1 }, k === 0 ? 0.25 : 0.2, ease.inOutSine);
      if (this.finished) return;
      await go({ x: a.x2, y: a.y2 }, k === 0 ? 0.35 : 0.4, ease.inQuad);
      if (this.finished) return;
    }
    if (end !== 'pond') {
      lines.visible = false;
      await settle(end);
      return;
    }
    lines.destroy();
    const slot = l.slots[index];
    await go({ x: slot.x, y: slot.y }, 0.3, ease.outQuad);
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
    if (this.round.friend === 'frog') sfx.ribbit();
    else if (this.round.friend === 'duck') sfx.animal('quack');
    else sfx.squeak(6);
    this.ctx.tw.kill(f);
    const y = this.layout.friend.y;
    void this.ctx.tw
      .to(f, { y: y - 24 }, { duration: 0.18, ease: ease.outQuad })
      .then(() =>
        this.finished ? undefined : this.ctx.tw.to(f, { y }, { duration: 0.25, ease: ease.outBack }),
      );
  }

  /** Back to fresh ground: the pond tips into its drain and fresh beds slide in under the rewind badge. Nothing rises to the cloud. */
  private async freshen() {
    sfx.whoosh();
    this.rewind.visible = true;
    const old = this.settled;
    this.settled = [];
    for (const d of old)
      void this.ctx.tw.to(
        d.node,
        { alpha: 0, y: d.node.y + (d.at === 'pond' ? 40 : 0) },
        { duration: 0.4, ease: ease.inQuad },
      );
    const dx = -this.dir(0) * 80;
    const olds = this.patches;
    this.patches = olds.map((_, i) => {
      void this.ctx.tw.to(olds[i], { alpha: 0 }, { duration: 0.4 });
      const n = this.patchGraphic(i);
      n.x += dx;
      n.alpha = 0;
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
    const fixed = this.round.board.fixed[i];
    if (fixed) {
      // The tree's bed and the stone path never change: a line, never a miss or a hint.
      this.squash(this.patches[i]);
      void this.ctx.say(fixed === 'tree' ? 'rain.fixed.tree' : 'rain.fixed.path');
      return;
    }
    this.flipTo(flipBed(this.s, i, this.round.board), i);
  }

  /** Show a flipped bed: its new ground, a squash and its sound; a board with drops on it wipes to fresh. */
  private flipTo(next: RouteState, i: number) {
    this.s = next;
    if (next.sockets[i] === 'stone') sfx.clunk();
    else sfx.squish();
    if (this.settled.length) {
      this.busy = true;
      void this.freshen().then(() => {
        if (!this.finished) this.idle();
      });
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
    if (!this.s.current) {
      await this.tryIt(false);
      if (this.finished) return;
    }
    const before = this.s.glow;
    const { state, verdict } = check(this.s, this.round);
    this.s = state;
    if (verdict.result === 'ignored') return;
    this.busy = true;
    if (verdict.result === 'pass') {
      this.drawSigns();
      sfx.tada();
      this.cheer();
      await this.ctx.say(this.round.board.marked.length === 2 ? 'rain.check.yes.both' : 'rain.check.yes');
      if (this.finished) return;
      this.finished = true;
      this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
      return;
    }
    sfx.boing();
    const sign = verdict.need ?? this.signs.length - 1;
    this.wobble(sign);
    // The drops have settled; she can change a bed while the pet explains.
    this.idle();
    const flower = verdict.need !== null && this.round.board.marked[verdict.need].marker === 'flower';
    await this.ctx.say(
      verdict.cause === 'pond' ? 'rain.miss.pond' : flower ? 'rain.miss.dry.flower' : 'rain.miss.dry',
    );
    if (this.finished) return;
    await this.narrate();
    if (this.finished) return;
    if (this.s.glow !== null && this.s.glow !== before) await this.ctx.say('rain.glow');
  }

  /** The unmet need's sign wobbles (an index into `signs`). */
  private wobble(i: number) {
    const sign = this.signs[i];
    if (!sign) return;
    this.ctx.tw.kill(sign);
    sign.rotation = 0;
    void this.ctx.tw
      .to(sign, { rotation: 0.12 }, { duration: 0.1 })
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
      if (this.busy) {
        void this.ctx.tw.wait(0.2).then(go);
        return;
      }
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
    if (this.stale) {
      this.stale = false;
      this.resize(this.ctx.view);
    }
  }

  resize(view: View) {
    this.layout = routeLayout(view, this.round.board, this.round.mirror) ?? this.layout;
    const l = this.layout;
    this.backdrop.resize(view);
    if (this.busy) this.stale = true;
    else {
      this.drawBoard();
      this.placeSettled();
    }
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
      this.glow
        .roundRect(x - w / 2 - pulse, y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 26)
        .stroke({ width: 7, color: swatch.yellow.fill });
    // The causal glow sits behind the bed's tap target, so it never blocks a tap.
    if (this.s.glow !== null) {
      const p = this.layout.beds[this.s.glow].patch;
      ring(p.x, p.y, p.w, p.h);
    }
    if (this.s.pointing && !this.busy) {
      const c = this.layout.check;
      ring(c.x, c.y, c.w, c.h);
    }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.s.passed) return null;
    const n = routeNext(this.s, this.round);
    const on = n.kind === 'cloud' ? this.cloud : n.kind === 'check' ? this.check : this.beds[n.bed];
    return { tap: { on }, pause: 0.8 };
  }
}
