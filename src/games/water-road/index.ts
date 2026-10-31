/**
 * Water Road: close a ring of stones and pull the frame away. Level 1 taps the stones onto the frame from both ends until
 * the keystone chimes, then pulls the frame and the pet walks through (nothing counted); level 2 pulls pairs of frames,
 * one ring closed and one with a gap, and asks on the last pair which will stand; level 3 drags a buttress block to the
 * side with no wall and pulls. One rule decides every pull: a ring that is closed and pushed back at both ends stands.
 * Levels 4–5 (the water road and the arches over the valley) are their own scene in ./flow.ts. Rules: ./logic.ts; definition: docs/definitions/water-road.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import type { CompanionRig } from '../../creatures/companion';
import { WaterFlow } from './flow';
import { arrowArt, blockArt, frameArt, groundArt, iconArt, SKY, slotArt, stickerArt, stoneArt, wallArt } from './art';
import {
  BLOCK, botMove, buttressPlan, buttressStart, centre, explain, hintFor, inner, isAsked, keystone, keystoneArch, keystonePlan, keystoneStart, nextArch, nextPair, outer, pairsPlan,
  pairsStart, place, placeOrder, planFor, predict, pull, pullFree, pullKeystone, SLOT, stoneAngles, stoneCentre, Tally, tapPile, waterRoadLayout, withBlock,
  type Arch, type Block, type ButtressPlan, type ButtressState, type KeystonePlan, type KeystoneState, type PairsPlan, type PairsState, type Pt, type Side, type WrLayout,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 5 },
};

/** The handle glows brighter when nothing has been tapped for this long after the ring closes (level 1, uncounted). */
const IDLE_GLOW = 6;
const countLine = (n: number) => `wr.count.${Math.max(1, Math.min(n, 7))}` as LineId;

interface FrameView {
  /** The timber frame. */
  frame: Container;
  /** The tap box over the frame (level 2) or the push-arrow touch area (level 3). */
  box: Container;
  stones: (Container | null)[];
  arch: Arch;
  centre: Pt;
}

class WaterRoad implements Game {
  readonly plan: KeystonePlan | PairsPlan | ButtressPlan;
  readonly level: 1 | 2 | 3;
  ks: KeystoneState | null = null;
  ps: PairsState | null = null;
  bs: ButtressState | null = null;
  readonly tallies = new Tally();
  /** An animation is running; inputs wait. */
  busy = false;
  finished = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private idle = 0;
  /** Stones still in flight at level 1. */
  private flying = 0;
  private view: View;
  private relayout = false;
  layoutNow: WrLayout | null = null;
  private readonly stepSeconds: number;
  private readonly reduce: boolean;
  /** A short blink on the gap of a wrongly chosen ring (level 2). */
  private blink: { at: Pt; until: number } | null = null;
  /** Push arrows showing on the unheld sides while the arch is touched (level 3). */
  private arrowsUntil = 0;
  private arrowSide: Side | 'both' | null = null;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private readonly arrows = new Container();
  private tapLayer: Container | null = null;
  frames: FrameView[] = [];
  handleNodes: Container[] = [];
  blockNode: Container | null = null;
  private blockHandle: DragHandle | null = null;
  slotNodes: { left: Container; right: Container } | null = null;
  private walker: CompanionRig | null = null;
  private walking = false;
  /** The asked pair's question has been put (once, not again on a rebuild). */
  private asked = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level as 1 | 2 | 3;
    this.plan = this.level === 1 ? keystonePlan(ctx.band, ctx.rng) : this.level === 2 ? pairsPlan(ctx.band, ctx.rng) : buttressPlan(ctx.band, ctx.rng);
    if (this.plan.level === 1) this.ks = keystoneStart();
    else if (this.plan.level === 2) this.ps = pairsStart();
    else this.bs = buttressStart();
    this.reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.stepSeconds = ctx.demo || this.reduce ? 0.2 : 0.6;
    this.backdrop = new Backdrop({ sky: [SKY.top, SKY.bottom], hills: [0xe9d3b0, 0xdcc097, 0xcfae84], horizon: 0.5, clouds: 2, sun: false, seed: 311 }, ctx.view);
    this.glow.eventMode = 'none';
    this.arrows.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  /** Round totals so far, for a check or the finish. */
  get tally() {
    return { misses: this.tallies.misses, hints: this.tallies.hints };
  }

  /** The arch in play at level 3, as held with the block where it is. */
  get heldArch(): Arch | null {
    if (this.plan.level !== 3 || !this.bs) return null;
    return withBlock(this.plan.arches[this.bs.arch], this.bs.block);
  }

  start() {
    this.build();
    const ask = this.ctx.instruct(`wr.instruct.${this.level}` as LineId);
    if (this.level >= 2) void ask.then(() => this.ctx.say('wr.history')).then(() => { if (this.alive && !this.finished) void this.ctx.say('wr.rule'); });
  }

  destroy() {
    this.alive = false;
    this.blockHandle?.destroy();
    this.blockHandle = null;
    if (this.walker) this.ctx.untrack(this.walker);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  /** A guard after every await: the scene is alive and nothing rebuilt the board meanwhile. */
  private live(epoch: number) {
    return this.alive && epoch === this.epoch && !this.finished;
  }

  // ——— Building ———

  private build() {
    this.epoch++;
    this.relayout = false;
    this.flying = 0;
    this.blink = null;
    this.arrowSide = null;
    this.frames = [];
    this.handleNodes = [];
    this.blockNode = null;
    this.slotNodes = null;
    this.tapLayer = null;
    this.blockHandle?.destroy();
    this.blockHandle = null;
    if (this.walker) { this.ctx.untrack(this.walker); this.walker.removeFromParent(); this.walker = null; }
    this.glow.removeFromParent();
    this.arrows.removeFromParent();
    for (const c of this.arrows.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const stones = this.plan.level === 1 ? this.plan.stones : 7;
    const l = waterRoadLayout(this.level, this.view, stones);
    this.layoutNow = l;
    if (!l) return;
    const v = this.view;
    if (this.plan.level === 1) {
      // The whole stage is the target: a tap anywhere lifts the next stone.
      const tap = new Container();
      tap.hitArea = new Rectangle(0, 0, v.w, v.h);
      onTap(tap, () => this.tapStage(), { cooldown: 90 });
      this.board.addChild(tap);
      this.tapLayer = tap;
    }
    this.board.addChild(groundArt(v.w, l.ground, v.h));
    if (this.plan.level === 1) this.buildKeystone(l, this.plan);
    else if (this.plan.level === 2) this.buildPairs(l, this.plan);
    else this.buildButtress(l, this.plan);
    this.board.addChild(this.arrows, this.glow);
  }

  /** A frame with its walls and the stones that are on it; `on` lists which stones sit on the ring. */
  private placeFrame(l: WrLayout, index: number, arch: Arch, tints: number[], on: (i: number) => boolean, handle: boolean, framed = true): FrameView {
    const f = l.frames[index];
    const ring = l.ring;
    for (const side of ['left', 'right'] as const) {
      if (!arch[side].held) continue;
      const w = wallArt(ring.t + 16, ring.post);
      w.position.set(f.centre.x + (side === 'left' ? -ring.r : ring.r), f.centre.y);
      this.board.addChild(w);
    }
    const frame = frameArt(ring, handle, handle && l.handles[0] ? centre(l.handles[0]).y - f.centre.y : -40);
    frame.position.copyFrom(f.centre);
    frame.eventMode = 'none';
    if (framed) this.board.addChild(frame);
    const stones: (Container | null)[] = [];
    for (let i = 0; i < arch.stones; i++) {
      if (arch.gap === i || !on(i)) { stones.push(null); continue; }
      const s = this.stoneNode(ring, arch.stones, i, tints[i] ?? 0);
      s.position.copyFrom(stoneCentre(f.centre, ring, arch.stones, i));
      this.board.addChild(s);
      stones.push(s);
    }
    const box = new Container();
    box.position.copyFrom(centre(f.box));
    box.hitArea = new Rectangle(-f.box.w / 2, -f.box.h / 2, f.box.w, f.box.h);
    this.board.addChild(box);
    const view: FrameView = { frame, box, stones, arch, centre: f.centre };
    this.frames.push(view);
    return view;
  }

  private stoneNode(ring: WrLayout['ring'], count: number, i: number, tint: number): Container {
    const c = new Container();
    c.addChild(stoneArt(ring, count, i, tint, i === keystone(count)));
    c.eventMode = 'none';
    return c;
  }

  private placeHandle(l: WrLayout, index: number, fn: () => void): Container {
    const r = l.handles[index];
    const node = new Container();
    node.position.copyFrom(centre(r));
    node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    onTap(node, fn, { cooldown: 250 });
    this.board.addChild(node);
    this.handleNodes.push(node);
    return node;
  }

  private buildKeystone(l: WrLayout, plan: KeystonePlan) {
    const s = this.ks!;
    const order = placeOrder(plan.stones);
    const placed = new Set(order.slice(0, s.placed));
    const view = this.placeFrame(l, 0, keystoneArch(plan), plan.tints, (i) => placed.has(i), true, !s.pulled);
    // The stones still in the pile, lying on the ground.
    order.slice(s.placed).forEach((i, k) => {
      const node = this.stoneNode(l.ring, plan.stones, i, plan.tints[i]);
      node.position.copyFrom(l.pile[k]);
      node.rotation = this.pileRotation(plan.stones, i);
      this.board.addChild(node);
      view.stones[i] = node;
    });
    view.box.eventMode = 'none';
    const handle = this.placeHandle(l, 0, () => this.pullFrame());
    if (s.pulled) handle.eventMode = 'none';
  }

  /** A stone in the pile points up, whichever place on the ring it is for. */
  private pileRotation(count: number, i: number) {
    return 1.5 * Math.PI - stoneAngles(count, i).mid;
  }

  private buildPairs(l: WrLayout, plan: PairsPlan) {
    const s = this.ps!;
    const pair = plan.pairs[s.pair];
    for (const side of [0, 1] as const) {
      const arch = pair.arches[side];
      const pulled = s.pulled[side];
      const fell = pulled && !this.standsIf(arch);
      const view = this.placeFrame(l, side, arch, plan.tints[s.pair][side], () => !fell, false, !pulled);
      if (fell) {
        // A rebuild mid-pair: the fallen stones lie on the ground.
        view.stones.forEach((st, i) => { if (st) { st.position.set(view.centre.x + (i - arch.stones / 2) * 44, l.ground - 20); st.rotation = (i % 2 ? 1 : -1) * 0.6; } });
      }
      onTap(view.box, () => this.tapFrame(side), { cooldown: 250 });
      if (pulled) view.box.eventMode = 'none';
    }
    if (isAsked(plan, s) && !s.done && !this.asked) { this.asked = true; void this.ctx.say('wr.ask'); }
  }

  private standsIf(arch: Arch) {
    return arch.gap === null && arch.left.held && arch.right.held;
  }

  private buildButtress(l: WrLayout, plan: ButtressPlan) {
    const s = this.bs!;
    const arch = plan.arches[s.arch];
    const view = this.placeFrame(l, 0, arch, plan.tints[s.arch], () => true, true, !s.standing);
    // Touching the arch shows where the push goes.
    view.box.eventMode = 'static';
    view.box.on('pointerdown', () => this.showArrows());
    view.box.on('pointerup', () => this.hideArrows());
    view.box.on('pointerupoutside', () => this.hideArrows());
    const slots = l.slots!;
    const slot = (side: Side) => {
      const node = new Container();
      node.position.copyFrom(centre(slots[side]));
      node.addChild(slotArt(SLOT, 'idle'));
      node.eventMode = 'none';
      this.board.addChild(node);
      return node;
    };
    this.slotNodes = { left: slot('left'), right: slot('right') };
    this.redrawSlots();
    const handle = this.placeHandle(l, 0, () => this.pullButtress());
    if (s.standing) handle.eventMode = 'none';
    const block = new Container();
    block.addChild(blockArt(BLOCK));
    block.hitArea = new Rectangle(-BLOCK / 2, -BLOCK / 2, BLOCK, BLOCK);
    block.position.copyFrom(this.blockHome(s.block));
    this.board.addChild(block);
    this.blockNode = block;
    this.blockHandle = draggable(block, this.ctx.tw, {
      onPick: () => { this.idle = 0; sfx.pop(4); },
      onMove: (x, y) => this.redrawSlots(this.slotAt(x, y)),
      onDrop: (x, y) => this.dropBlock(x, y),
    });
    if (s.standing) this.blockHandle.enabled = false;
  }

  private blockHome(block: Block): Pt {
    const l = this.layoutNow!;
    return block === 'tray' ? centre(l.tray!) : centre(l.slots![block]);
  }

  /** The slot under a point, by the nearest centre within a slot's reach. */
  private slotAt(x: number, y: number): Side | null {
    const l = this.layoutNow;
    if (!l?.slots) return null;
    let best: Side | null = null;
    let d = SLOT * 0.75;
    for (const side of ['left', 'right'] as const) {
      const c = centre(l.slots[side]);
      const dd = Math.hypot(c.x - x, c.y - y);
      if (dd < d) { d = dd; best = side; }
    }
    return best;
  }

  private redrawSlots(under: Side | null = null) {
    const nodes = this.slotNodes;
    const arch = this.plan.level === 3 && this.bs ? this.plan.arches[this.bs.arch] : null;
    if (!nodes || !arch) return;
    for (const side of ['left', 'right'] as const) {
      const n = nodes[side];
      for (const c of n.removeChildren()) c.destroy({ children: true });
      const glow = this.tallies.glowing && hintFor(arch) === side && this.bs?.block !== side;
      n.addChild(slotArt(SLOT, glow ? 'glow' : under === side ? 'bright' : 'idle'));
    }
  }

  // ——— Shared motion ———

  /** A frame felt under a finger: it and its stones dip for a moment. */
  private press(view: FrameView) {
    for (const node of [view.frame, ...view.stones]) {
      if (!node || this.ctx.tw.busy(node.position)) continue;
      const y = node.y;
      void this.ctx.tw.to(node.position, { y: y + 6 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node.position, { y }, { duration: 0.16, ease: ease.outBack }));
    }
  }

  private wobble(node: Container) {
    const x = node.x;
    void this.ctx.tw.to(node.position, { x: x + 8 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node.position, { x: x - 8 }, { duration: 0.08 })).then(() => this.ctx.tw.to(node.position, { x }, { duration: 0.08 }));
  }

  /** The frame slides out from under the arch with a creak and fades; the arch is on its own. */
  private async pullAway(view: FrameView) {
    sfx.ratchet(2);
    if (this.reduce) { view.frame.alpha = 0; return; }
    await this.ctx.tw.to(view.frame.position, { y: view.frame.y + 260 }, { duration: this.stepSeconds * 1.4, ease: ease.inQuad });
    view.frame.alpha = 0;
  }

  /** The arch holds: a low hum and a little dust. */
  private hold(view: FrameView) {
    sfx.marimba(-5, 0.35);
    sfx.marimba(-3, 0.25);
    this.ctx.particles.burst(view.centre.x, view.centre.y - this.layoutNow!.ring.r, { colors: [0xffffff, swatch.yellow.light], count: 8, speed: [20, 60] });
  }

  /**
   * The ring comes apart: its stones slide down to the ground (a gap: softly, every stone; a spread: outward on the
   * unheld side), with a soft stone slide.
   */
  private async tumble(view: FrameView, spread: Side | null) {
    const l = this.layoutNow!;
    sfx.rumble();
    const n = view.arch.stones;
    const moves: Promise<void>[] = [];
    view.stones.forEach((st, i) => {
      if (!st) return;
      const k = keystone(n);
      const outward = spread ? (spread === 'left' ? -1 : 1) : i < k ? -1 : i > k ? 1 : 0;
      const far = spread ? (spread === 'left' ? n - i : i + 1) : Math.abs(i - k) + 1;
      const to = { x: st.x + outward * (40 + far * 26), y: l.ground - 18 - (i % 2) * 8 };
      if (this.reduce) { st.position.copyFrom(to); st.rotation = outward * 0.7; return; }
      moves.push(this.ctx.tw.to(st.position, { x: to.x, y: to.y }, { duration: this.stepSeconds * 1.2, ease: ease.inQuad, delay: (spread ? far : Math.abs(i - k)) * 0.05 }));
      moves.push(this.ctx.tw.to(st, { rotation: outward * (0.5 + far * 0.15) }, { duration: this.stepSeconds * 1.2, delay: (spread ? far : Math.abs(i - k)) * 0.05 }));
    });
    await Promise.all(moves);
  }

  /** The pet walks through the standing arch, left to right, and cheers on the far side. */
  private async walkThrough(view: FrameView, epoch: number) {
    const l = this.layoutNow!;
    const rig = this.ctx.companion();
    const bounds = rig.bodyBounds();
    const fit = inner(l.ring) * 1.05;
    rig.scale.set(Math.min(0.6, fit / Math.max(1, bounds.height)));
    rig.position.set(view.centre.x - outer(l.ring) - 110, l.ground);
    rig.eventMode = 'none';
    this.ctx.track(rig);
    this.board.addChild(rig);
    this.walker = rig;
    this.walking = true;
    void this.ctx.say('wr.through');
    await this.ctx.tw.to(rig.position, { x: view.centre.x + outer(l.ring) + 110 }, { duration: this.reduce ? 0.3 : this.stepSeconds * 3.2, ease: ease.inOutSine });
    this.walking = false;
    if (!this.live(epoch)) return;
    rig.scale.x = Math.abs(rig.scale.x);
    rig.cheer();
  }

  // ——— Level 1: Keystone ———

  /** Any tap: the next stone flies to its place; once the ring is closed, a toddler's tap pulls the frame. */
  tapStage() {
    const s = this.ks;
    if (!s || this.finished || this.plan.level !== 1) return;
    this.idle = 0;
    if (this.busy) return;
    const { state, event, index } = tapPile(this.plan, s);
    this.ks = state;
    if (event === 'full') {
      if (this.ctx.band === 'toddler' || this.ctx.band === 'lap') this.pullFrame();
      return;
    }
    void this.fly(index!, state.placed, event === 'keystone');
  }

  private async fly(index: number, placed: number, isKeystone: boolean) {
    const epoch = this.epoch;
    const view = this.frames[0];
    const l = this.layoutNow;
    const st = view?.stones[index];
    if (!view || !l || !st) return;
    sfx.marimba(placed, 0.4);
    void this.ctx.say(countLine(placed));
    const to = stoneCentre(view.centre, l.ring, view.arch.stones, index);
    this.flying++;
    if (this.reduce) { st.position.copyFrom(to); st.rotation = 0; }
    else {
      const up = { x: (st.x + to.x) / 2, y: Math.min(st.y, to.y) - 90 };
      await this.ctx.tw.to(st.position, { x: up.x, y: up.y }, { duration: this.stepSeconds * 0.5, ease: ease.outQuad });
      if (!this.live(epoch)) return;
      await Promise.all([
        this.ctx.tw.to(st.position, { x: to.x, y: to.y }, { duration: this.stepSeconds * 0.5, ease: ease.inQuad }),
        this.ctx.tw.to(st, { rotation: 0 }, { duration: this.stepSeconds, ease: ease.outQuad }),
      ]);
      if (!this.live(epoch)) return;
    }
    this.flying--;
    sfx.clunk();
    if (isKeystone) {
      sfx.bell(9, 0.3);
      sfx.bell(12, 0.25);
      this.ctx.particles.burst(to.x, to.y, { colors: [swatch.yellow.fill, 0xffffff], count: 10 });
      void this.ctx.say('wr.keystone').then(() => { if (this.live(epoch)) void this.ctx.say('wr.pull-now'); });
    }
  }

  pullFrame() {
    const s = this.ks;
    const view = this.frames[0];
    if (!s || !view || this.finished || this.plan.level !== 1) return;
    this.idle = 0;
    if (this.busy) return;
    const { state, event } = pullKeystone(this.plan, s);
    this.ks = state;
    if (event === 'wobble') { this.wobble(view.frame); return; }
    if (event === 'pulled') void this.finishKeystone();
  }

  private async finishKeystone() {
    const epoch = this.epoch;
    const view = this.frames[0];
    this.busy = true;
    for (const h of this.handleNodes) h.eventMode = 'none';
    if (this.tapLayer) this.tapLayer.eventMode = 'none';
    // The last stone lands first.
    while (this.flying > 0) {
      await this.ctx.tw.wait(0.1);
      if (!this.live(epoch)) return;
    }
    await this.pullAway(view);
    if (!this.live(epoch)) return;
    this.hold(view);
    void this.ctx.say('wr.held');
    await this.ctx.tw.wait(this.stepSeconds);
    if (!this.live(epoch)) return;
    await this.walkThrough(view, epoch);
    if (!this.live(epoch)) return;
    this.celebrate();
  }

  // ——— Level 2: Which one stands? ———

  tapFrame(side: 0 | 1) {
    const s = this.ps;
    const view = this.frames[side];
    if (!s || !view || this.finished || this.plan.level !== 2) return;
    this.idle = 0;
    this.press(view);
    if (this.busy) return;
    if (isAsked(this.plan, s)) {
      const { state, event } = predict(this.plan, s, side);
      this.ps = state;
      if (event === 'stands') void this.answer(side);
      else if (event === 'wrong') this.wrongGuess(side);
      return;
    }
    const { state, event } = pullFree(this.plan, s, side);
    this.ps = state;
    if (event !== 'none') void this.freePull(side, event === 'stands');
  }

  private async freePull(side: 0 | 1, holds: boolean) {
    const epoch = this.epoch;
    const plan = this.plan as PairsPlan;
    const view = this.frames[side];
    this.busy = true;
    view.box.eventMode = 'none';
    await this.pullAway(view);
    if (!this.live(epoch)) return;
    if (holds) { this.hold(view); void this.ctx.say('wr.held'); }
    else {
      void this.ctx.say(`wr.fell.${explain(view.arch)}` as LineId);
      await this.tumble(view, null);
      if (!this.live(epoch)) return;
    }
    await this.ctx.tw.wait(this.stepSeconds);
    if (!this.live(epoch)) return;
    const s = this.ps!;
    if (s.pulled[0] && s.pulled[1]) {
      this.ps = nextPair(s);
      this.busy = false;
      this.build();
      if (!isAsked(plan, this.ps)) void this.ctx.say('wr.next-pair');
      return;
    }
    this.busy = false;
    if (this.relayout) this.build();
  }

  /** The asked pair, answered right: both frames come away together; hers stands, the other falls; the pet walks through. */
  private async answer(side: 0 | 1) {
    const epoch = this.epoch;
    const mine = this.frames[side];
    const other = this.frames[1 - side];
    this.busy = true;
    for (const f of this.frames) f.box.eventMode = 'none';
    await Promise.all([this.pullAway(mine), this.pullAway(other)]);
    if (!this.live(epoch)) return;
    this.hold(mine);
    void this.ctx.say('wr.stood');
    await this.tumble(other, null);
    if (!this.live(epoch)) return;
    await this.walkThrough(mine, epoch);
    if (!this.live(epoch)) return;
    this.celebrate();
  }

  /** The open ring was chosen: its gap blinks, the pet says where it is; one miss, and after two the closed ring glows. */
  private wrongGuess(side: 0 | 1) {
    const view = this.frames[side];
    const l = this.layoutNow!;
    const gap = view.arch.gap!;
    sfx.boing();
    this.blink = { at: stoneCentre(view.centre, l.ring, view.arch.stones, gap), until: this.clock + 1.6 };
    this.tallies.miss();
    void this.ctx.say(`wr.wrong.${explain(view.arch)}` as LineId).then(() => {
      if (this.alive && this.tallies.glowing && !this.finished) void this.ctx.say('wr.glow');
    });
  }

  // ——— Level 3: Hold it up ———

  private dropBlock(x: number, y: number): boolean {
    const s = this.bs;
    const block = this.blockNode;
    const handle = this.blockHandle;
    const l = this.layoutNow;
    if (!s || !block || !handle || !l || this.busy || this.finished) return false;
    const slot = this.slotAt(x, y);
    const tray = l.tray!;
    const inTray = x >= tray.x - 40 && x <= tray.x + tray.w + 40 && y >= tray.y - 40 && y <= tray.y + tray.h + 40;
    const to: Block | null = slot ?? (inTray ? 'tray' : null);
    this.redrawSlots();
    if (!to) return false;
    this.bs = place(s, to);
    const home = this.blockHome(to);
    handle.home = home;
    sfx.clunk();
    void this.ctx.tw.to(block.position, { x: home.x, y: home.y }, { duration: 0.2, ease: ease.outQuad });
    this.redrawSlots();
    return true;
  }

  private showArrows() {
    const arch = this.heldArch;
    if (!arch || this.busy) return;
    this.idle = 0;
    const need = hintFor(arch);
    this.arrowSide = need;
    this.arrowsUntil = Infinity;
    this.redrawArrows();
  }

  private hideArrows() {
    this.arrowsUntil = this.clock + 0.2;
  }

  private redrawArrows() {
    for (const c of this.arrows.removeChildren()) c.destroy({ children: true });
    const view = this.frames[0];
    const l = this.layoutNow;
    if (!view || !l || !this.arrowSide) return;
    const sides: Side[] = this.arrowSide === 'both' ? ['left', 'right'] : [this.arrowSide];
    for (const side of sides) {
      const a = arrowArt(side);
      a.position.set(view.centre.x + (side === 'left' ? -1 : 1) * (l.ring.r - 10), view.centre.y - l.ring.post * 0.2);
      this.arrows.addChild(a);
    }
  }

  pullButtress() {
    const s = this.bs;
    if (!s || this.finished || this.plan.level !== 3) return;
    this.idle = 0;
    if (this.busy || this.blockHandle?.dragging) return;
    const r = pull(this.plan, s);
    this.bs = r.state;
    if (r.stands) void this.standButtress(s.block === 'tray' && hintFor(this.plan.arches[s.arch]) === null);
    else void this.spread(r.spread!);
  }

  private async standButtress(neededNothing: boolean) {
    const epoch = this.epoch;
    const view = this.frames[0];
    this.busy = true;
    for (const h of this.handleNodes) h.eventMode = 'none';
    if (this.blockHandle) this.blockHandle.enabled = false;
    await this.pullAway(view);
    if (!this.live(epoch)) return;
    this.hold(view);
    void this.ctx.say(neededNothing ? 'wr.needs-nothing' : 'wr.pushed-back');
    await this.ctx.tw.wait(this.stepSeconds);
    if (!this.live(epoch)) return;
    const s = this.bs!;
    if (s.arch + 1 < (this.plan as ButtressPlan).arches.length) {
      this.tallies.next();
      this.bs = nextArch(s);
      this.busy = false;
      this.build();
      void this.ctx.say('wr.next-arch');
      return;
    }
    await this.walkThrough(view, epoch);
    if (!this.live(epoch)) return;
    this.celebrate();
  }

  /** Nothing pushed back on one side: the ring spreads that way, the block floats home, the stones climb back. One miss. */
  private async spread(side: Side) {
    const epoch = this.epoch;
    const view = this.frames[0];
    const l = this.layoutNow!;
    this.busy = true;
    if (this.blockHandle) this.blockHandle.enabled = false;
    await this.pullAway(view);
    if (!this.live(epoch)) return;
    this.arrowSide = side;
    this.arrowsUntil = this.clock + 2.5;
    this.redrawArrows();
    void this.ctx.say(`wr.spread.${side}` as LineId);
    await this.tumble(view, side);
    if (!this.live(epoch)) return;
    this.tallies.miss();
    const home = this.blockHome('tray');
    if (this.blockHandle && this.blockNode) { this.blockHandle.home = home; void this.blockHandle.floatHome(); }
    await this.ctx.tw.wait(this.stepSeconds * 1.5);
    if (!this.live(epoch)) return;
    // The stones climb back onto a fresh frame.
    view.frame.alpha = 1;
    view.frame.position.copyFrom(view.centre);
    const climbs: Promise<void>[] = [];
    view.stones.forEach((st, i) => {
      if (!st) return;
      const to = stoneCentre(view.centre, l.ring, view.arch.stones, i);
      if (this.reduce) { st.position.copyFrom(to); st.rotation = 0; return; }
      climbs.push(this.ctx.tw.to(st.position, { x: to.x, y: to.y }, { duration: this.stepSeconds, ease: ease.outQuad, delay: i * 0.04 }));
      climbs.push(this.ctx.tw.to(st, { rotation: 0 }, { duration: this.stepSeconds, delay: i * 0.04 }));
    });
    await Promise.all(climbs);
    if (!this.live(epoch)) return;
    if (this.blockHandle) this.blockHandle.enabled = true;
    this.redrawSlots();
    if (this.tallies.glowing) void this.ctx.say('wr.glow-side');
    this.busy = false;
    if (this.relayout) this.build();
  }

  // ——— Finishing and help ———

  private celebrate() {
    if (this.finished) return;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const view = this.frames[0];
    if (view) this.ctx.particles.burst(view.centre.x, view.centre.y - 60, { colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff], count: 14 });
    const result = this.tally;
    void this.ctx.say('wr.done').then(() => {
      if (!this.alive || this.finished) return;
      this.finished = true;
      this.ctx.finish(result);
    });
  }

  hintLabel = 'Help';

  /** The pet's Help: at level 1 the ask again (free); in a free pair the gap blinks (free); in the asked pair or at level 3 the glow, counted once per part. */
  askForHint() {
    if (this.finished) return;
    if (this.plan.level === 1) { void this.ctx.instruct('wr.instruct.1'); return; }
    if (this.plan.level === 2) {
      const s = this.ps!;
      const pair = this.plan.pairs[s.pair];
      const open = this.frames[1 - pair.closed];
      if (open && this.layoutNow && !s.pulled[1 - pair.closed]) this.blink = { at: stoneCentre(open.centre, this.layoutNow.ring, open.arch.stones, open.arch.gap!), until: this.clock + 1.6 };
      if (!isAsked(this.plan, s)) { void this.ctx.instruct('wr.instruct.2'); return; }
      if (this.busy) { void this.ctx.say('wr.help'); return; }
      this.tallies.help();
      void this.ctx.say('wr.help');
      return;
    }
    const need = this.bs ? hintFor(this.plan.arches[this.bs.arch]) : null;
    if (!need) { void this.ctx.say('wr.needs-nothing-help'); return; }
    if (this.busy) { void this.ctx.say('wr.help-side'); return; }
    this.tallies.help();
    this.redrawSlots();
    void this.ctx.say('wr.help-side');
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished) this.build();
    if (this.walker && this.walking) this.walker.y = this.layoutNow!.ground - Math.abs(Math.sin(this.clock * 12)) * 8;
    if (!this.busy && !this.finished) this.idle += dt;
    if (this.arrowSide && this.clock > this.arrowsUntil) { this.arrowSide = null; this.redrawArrows(); }
    this.glow.clear();
    if (this.finished || !this.layoutNow) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    const ring = (p: Pt, w: number, h: number, color = swatch.yellow.fill) => {
      this.glow.roundRect(p.x - w / 2 - 10 * r, p.y - h / 2 - 10 * r, w + 20 * r, h + 20 * r, 30).stroke({ width: 8, color });
    };
    if (this.blink && this.blink.until > this.clock && Math.floor(this.clock * 6) % 2 === 0) {
      this.glow.circle(this.blink.at.x, this.blink.at.y, this.layoutNow.ring.t * 0.7).stroke({ width: 8, color: swatch.red.fill });
    }
    if (this.busy) return;
    if (this.plan.level === 1 && this.ks && this.ks.placed >= this.plan.stones && !this.ks.pulled) {
      const h = this.layoutNow.handles[0];
      const strong = this.idle >= IDLE_GLOW;
      this.glow.roundRect(h.x - 8 * r, h.y - 8 * r, h.w + 16 * r, h.h + 16 * r, 26).stroke({ width: strong ? 10 : 5, color: swatch.yellow.fill, alpha: strong ? 1 : 0.55 });
    } else if (this.plan.level === 2 && this.ps && this.tallies.glowing && isAsked(this.plan, this.ps) && !this.ps.done) {
      const f = this.layoutNow.frames[this.plan.pairs[this.ps.pair].closed];
      ring(centre(f.box), f.box.w, f.box.h);
    } else if (this.plan.level === 3 && this.bs && this.tallies.glowing && !this.bs.standing) {
      const need = hintFor(this.plan.arches[this.bs.arch]);
      if (need && this.bs.block === need) { const h = this.layoutNow.handles[0]; ring(centre(h), h.w, h.h); }
    }
  }

  /** The ghost finger: every stone then the handle; the closed frame then the open one, and the closed ring when asked; the block to the unheld slot, then the handle. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    const state = this.plan.level === 1 ? this.ks! : this.plan.level === 2 ? this.ps! : this.bs!;
    const move = botMove(this.plan, state);
    if (!move) return null;
    if ('drag' in move) {
      const to = centre(this.layoutNow.slots![move.to]);
      return this.blockNode ? { drag: { on: this.blockNode }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.4 } : null;
    }
    if (move.tap === 'pile') {
      const l = this.layoutNow;
      return this.tapLayer ? { tap: { on: this.tapLayer, x: l.pile[0].x, y: l.pile[0].y + 70 }, pause: 0.5 } : null;
    }
    if (move.tap === 'handle') return this.handleNodes[0] ? { tap: { on: this.handleNodes[0] }, pause: 0.8 } : null;
    const f = this.frames[move.side];
    return f ? { tap: { on: f.box }, pause: 0.8 } : null;
  }
}

class ArchIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: a standing arch of five or seven stones with the frame leaning beside it. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const count = rng.pick([5, 7]);
  return stickerArt(count, Array.from({ length: count }, () => rng.int(0, 2)));
}

export const waterRoad: GameModule = {
  id: 'water-road',
  name: 'Water Road',
  titleLine: 'game.water-road',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'prediction', 'spatial-reasoning', 'reasons'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'Frame-puller and stone counter: one of you counts the stones aloud (or says which ring has the gap), the other taps and pulls; swap after each arch. On the water roads, a spring-keeper says "open!" only when both agree every stretch goes down.',
  hubIcon: () => new ArchIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => (planFor(ctx.level).level >= 4 ? new WaterFlow(ctx) : new WaterRoad(ctx)),
};

