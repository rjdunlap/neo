import { Circle, Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  applyPull, bestRig, BRANCH_Y, CARD, cardSpots, countsMisses, crateBottom, crateHook, CRATE_H, CRATE_W, endsRight, guessCards, handleAt,
  HANDLE_HIT, HOOK_HIT, hooksOf, knotsCards, ledgeSpots, ledgeY, liftLayout, makeRound, paws, pawsCards, planFor, pullDirection, pullers,
  ratio, rigOf, rigsFor, TRAY_HIT, travel, WHEEL_R, works, type Friend, type Haul, type HookId, type Hooks, type LiftLayout, type Line,
  type Plan, type Pt, type Rig,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 6 },
};

/** Each level's authored first lines lead its first round of a session. */
const authoredShown = new Set<number>();

const SPECS: Record<Friend, CritterSpec> = {
  bunny: CRITTERS.bunny,
  duck: CRITTERS.duck,
  bear: CRITTERS.bear,
  mouse: { color: 'white', ears: 'round', earColor: 'pink', snout: 'nose', noseColor: 0xff8fa3, whiskers: true },
  frog: { color: 'green', ears: 'none', snout: 'none', belly: true },
};
const NAMES: Record<Friend, string> = { bunny: 'bunnies', duck: 'ducks', mouse: 'mice', bear: 'bears', frog: 'frogs' };
const BRASS = { fill: 0xf2c14e, line: 0xb8862b };
const ROPE = 0xa8865a;
const KNOT_COLOR = 0xf3e2c0;
const LEAF = [0x6cc070, 0x5bb062, 0x7fd07c];
const STONE = 0x9a9aa8;
const FRIEND_SCALE = 0.4;
/** Visual spacing of the knots along the rope. */
const KNOT_GAP = 46;
/** The ghost finger's stroke. */
const STROKE = 190;

function voice(f: Friend) {
  if (f === 'duck') sfx.animal('quack');
  else if (f === 'bear') sfx.animal('growl');
  else if (f === 'bunny') sfx.animal('hop');
  else if (f === 'frog') sfx.croak();
  else sfx.squeak(9);
}

/* Art -------------------------------------------------------------------------------------------- */

function wheelArt(r = WHEEL_R): Graphics {
  const g = new Graphics().circle(0, 0, r).fill(BRASS.fill).stroke({ width: 5, color: BRASS.line });
  g.circle(0, 0, r - 12).stroke({ width: 3, color: BRASS.line, alpha: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12));
  }
  g.stroke({ width: 4, color: BRASS.line });
  g.circle(0, 0, 8).fill(BRASS.line);
  return g;
}

function crateArt(w: number): Graphics {
  const g = new Graphics()
    .roundRect(-CRATE_W / 2, -CRATE_H, CRATE_W, CRATE_H, 10).fill(wood.fill).stroke({ width: 5, color: wood.line })
    .moveTo(-CRATE_W / 2 + 8, -CRATE_H + 8).lineTo(CRATE_W / 2 - 8, -8).moveTo(CRATE_W / 2 - 8, -CRATE_H + 8).lineTo(-CRATE_W / 2 + 8, -8)
    .stroke({ width: 4, color: wood.line, alpha: 0.5 });
  // Stone dots: one per stone of weight, in a row of up to three.
  for (let i = 0; i < w; i++) {
    const row = Math.floor(i / 3), col = i % 3, inRow = Math.min(3, w - row * 3);
    g.circle((col - (inRow - 1) / 2) * 34, -CRATE_H / 2 - 16 + row * 34, 13).fill(STONE).stroke({ width: 3, color: 0x6e6e7c });
  }
  return g;
}

function parcelArt(): Graphics {
  return new Graphics()
    .roundRect(-26, -40, 52, 40, 6).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .moveTo(0, -40).lineTo(0, 0).stroke({ width: 5, color: swatch.yellow.fill })
    .ellipse(-9, -46, 10, 7).ellipse(9, -46, 10, 7).stroke({ width: 4, color: swatch.yellow.fill });
}

function pawArt(): Graphics {
  return new Graphics().ellipse(0, 4, 9, 8).fill(ink).circle(-9, -7, 4).circle(-3, -11, 4).circle(3, -11, 4).circle(9, -7, 4).fill(ink);
}

function card(n: number): Container {
  const c = new Container();
  const bg = new Graphics();
  c.addChild(bg);
  const t = new Text({ text: String(n), style: { fontFamily: FONT, fontSize: 52, fontWeight: '700', fill: ink } });
  t.anchor.set(0.5);
  t.y = -14;
  c.addChild(t);
  // That many knot dots under the numeral, so the card can be counted without reading.
  const dots = new Graphics();
  const per = Math.min(n, 5), rows = Math.ceil(n / 5);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5), col = i % 5, inRow = row < rows - 1 ? per : n - row * 5;
    dots.circle((col - (inRow - 1) / 2) * 18, 30 + row * 16 - (rows - 1) * 8, 6).fill(ROPE);
  }
  c.addChild(dots);
  c.hitArea = new Circle(0, 0, CARD / 2 + 4);
  return c;
}

/* The game --------------------------------------------------------------------------------------- */

interface WheelNode {
  node: Container;
  drag: DragHandle;
  on: HookId | null;
  slot: number;
}

type Question = { kind: 'guess' | 'paws' | 'knots'; values: number[]; answer: number; rig: Rig };

class LiftIt implements Game {
  readonly plan: Plan;
  readonly lines: Line[];
  readonly hintLabel = 'Show a hint';
  line = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  hooks: Hooks = { branch: false, crate: false };
  haul: Haul = { rung: 0, knots: 0 };
  /** Rigs tugged on this parcel that could not lift it or ended at the wrong friends, and this parcel's misses. */
  tried = new Set<Rig>();
  parcelMisses = 0;
  glowRig: Rig | null = null;
  glowCounted = false;
  /** The questions (levels 4 and 6) are answered for this rig on this parcel. */
  answeredFor: Rig | null = null;
  question: Question | null = null;
  guess: number | null = null;
  t = 0;

  private layout: LiftLayout;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly tree = new Graphics();
  private readonly hookRings = new Graphics();
  private readonly crate = new Container();
  private crateBody: Graphics | null = null;
  private readonly parcel = parcelArt();
  private readonly rope = new Graphics();
  private readonly fixedWheel = wheelArt();
  private readonly wheelLayer = new Container();
  private readonly wheels: WheelNode[] = [];
  private readonly friendLayer = new Container();
  private friends: { c: Critter; at: 'ground' | 'ledge' | 'waiting'; i: number }[] = [];
  readonly handle = new Container();
  private readonly knotArt = new Graphics();
  private readonly paws = new Container();
  private readonly glow = new Graphics();
  private readonly counter = new Container();
  private readonly counterText = new Text({ text: '0', style: { fontFamily: FONT, fontSize: 48, fontWeight: '700', fill: ink } });
  private readonly panel = new Container();
  private cards: { node: Container; value: number; bg: Graphics }[] = [];
  /** Shown rise of the crate, in rungs (eases toward the haul). */
  shown = 0;
  /** The empty crate coming back down. */
  private fall: { r: number } | null = null;
  /** The handle's pull offset, and a wobble. */
  private offset = { d: 0 };
  private rock = { a: 0 };
  private grab: { id: number; from: Pt; best: number; haul: boolean } | null = null;
  private hoverHook: HookId | null = null;
  private lastTick = 0;
  private lastSaid = -10;
  private creakAt = -10;
  private helperLeft = 0;
  private destroyed = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (first) authoredShown.add(this.plan.id);
    this.lines = makeRound(this.plan, ctx.rng, first).lines;
    this.layout = liftLayout(ctx.view);
    this.backdrop = new Backdrop({ sky: [0xbfe6ff, 0xf3fbe8], hills: [0xbfe3a0, 0x9fd38a, 0x86c96e], horizon: 0.78, clouds: 2, sun: true, seed: 271 }, ctx.view);
    for (const g of [this.tree, this.hookRings, this.rope, this.glow, this.fixedWheel]) g.eventMode = 'none';
    this.crate.eventMode = 'none';
    this.friendLayer.eventMode = 'none';
    this.paws.eventMode = 'none';
    this.counter.eventMode = 'none';
    this.counterText.anchor.set(0.5);
    this.counter.addChild(new Graphics().roundRect(-70, -50, 140, 100, 22).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 5, color: wood.line }), this.counterText);
    this.counter.visible = this.plan.counter;
    this.parcel.eventMode = 'none';

    this.handle.addChild(this.knotArt);
    this.handle.hitArea = new Circle(0, 0, HANDLE_HIT);
    this.handle.eventMode = 'static';
    this.handle.cursor = 'grab';
    this.handle.on('pointerdown', this.onDown);
    this.handle.on('globalpointermove', this.onMove);
    // The ghost finger lets go on the handle itself (it sends no window events); a real release reaches both.
    this.handle.on('pointerup', this.release);
    this.handle.on('pointerupoutside', this.release);
    window.addEventListener('pointerup', this.release);
    window.addEventListener('pointercancel', this.release, true);

    ctx.stage.addChild(this.backdrop, this.tree, this.hookRings, this.crate, this.rope, this.fixedWheel, this.friendLayer, this.counter, this.glow, this.paws, this.handle, this.wheelLayer, this.panel);
    this.crate.addChild(this.parcel);

    for (let i = 0; i < this.plan.tray; i++) {
      const node = new Container();
      node.addChild(new Graphics().ellipse(0, WHEEL_R + 6, WHEEL_R, 10).fill({ color: 0x000000, alpha: 0.12 }), wheelArt());
      node.hitArea = new Circle(0, 0, TRAY_HIT);
      this.wheelLayer.addChild(node);
      const w: WheelNode = { node, on: null, slot: i, drag: null as unknown as DragHandle };
      w.drag = draggable(node, ctx.tw, {
        onPick: () => sfx.pop(5),
        onMove: (x, y) => (this.hoverHook = this.hookNear(x, y, w)),
        onDrop: (x, y) => this.dropWheel(w, x, y),
      });
      this.wheels.push(w);
    }
    this.buildLine();
  }

  get cur(): Line {
    return this.lines[Math.min(this.line, this.lines.length - 1)];
  }

  get rig(): Rig {
    return this.plan.prebuilt ?? rigOf(this.hooks);
  }

  /** Whether the rope has a handle at all: at levels 5–6 a crate with no wheel has no rope to pull. */
  private get hasHandle(): boolean {
    return !(this.plan.request && this.rig === 'direct');
  }

  start() {
    const lines: Record<number, LineId> = {
      1: 'lift-it.instruct-pull', 2: 'lift-it.instruct-push-or-pull', 3: 'lift-it.instruct-heavy',
      4: 'lift-it.instruct-knots', 5: 'lift-it.instruct-who', 6: 'lift-it.instruct-numbers',
    };
    void this.ctx.instruct(lines[this.plan.id]);
    if (this.plan.request) void this.sayAsk();
  }

  private sayAsk() {
    return this.ctx.say(this.cur.ask === 'ledge' ? 'lift-it.ask-ledge' : 'lift-it.ask-ground');
  }

  /* Lines ----------------------------------------------------------------------------------------- */

  private buildLine() {
    const l = this.cur;
    for (const f of this.friends) {
      this.ctx.untrack(f.c);
      f.c.destroy({ children: true });
    }
    this.friends = [];
    const add = (kind: Friend, at: 'ground' | 'ledge' | 'waiting', i: number) => {
      const c = new Critter(SPECS[kind]);
      c.scale.set(FRIEND_SCALE);
      if (at === 'ground' && i % 2 === 1) c.scale.x = -FRIEND_SCALE;
      c.alpha = 0;
      this.friendLayer.addChild(c);
      this.ctx.track(c);
      void this.ctx.tw.to(c, { alpha: 1 }, { duration: 0.35 });
      this.friends.push({ c, at, i });
    };
    add(l.waiting, 'waiting', 0);
    for (let i = 0; i < l.g; i++) add(l.puller, 'ground', i);
    for (let i = 0; i < l.l; i++) add(l.puller, 'ledge', i);
    this.crateBody?.destroy();
    this.crateBody = crateArt(l.w);
    this.crate.addChildAt(this.crateBody, 0);
    this.parcel.visible = true;
    this.parcel.position.set(0, -CRATE_H);
    this.parcel.scale.set(1);
    this.hooks = { branch: this.plan.prebuilt === 'fixed', crate: false };
    for (const w of this.wheels) {
      w.on = null;
      w.drag.home = { ...this.layout.tray[w.slot] };
      w.node.position.copyFrom(w.drag.home);
    }
    this.haul = { rung: 0, knots: 0 };
    this.shown = 0;
    this.lastTick = 0;
    this.counterText.text = '0';
    this.tried.clear();
    this.parcelMisses = 0;
    this.glowRig = null;
    this.glowCounted = false;
    this.answeredFor = null;
    this.guess = null;
    this.helperLeft = 0;
    this.layoutAll();
    this.busy = false;
  }

  private async landed() {
    this.busy = true;
    this.grab = null;
    const l = this.cur;
    const rig = this.rig;
    sfx.clunk();
    const waiting = this.friends.find((f) => f.at === 'waiting');
    const L = this.layout;
    const spot = ledgeSpots(L, this.view, l.h).waiting;
    // The parcel hops over to the waiting friend.
    const from = this.crate.toLocal({ x: spot.x - 40, y: spot.y }, this.ctx.stage);
    await this.ctx.tw.to(this.parcel, { x: from.x, y: from.y }, { duration: 0.5, ease: ease.outBack });
    if (this.destroyed) return;
    this.parcel.visible = false;
    voice(l.waiting);
    waiting?.c.hop(1);
    waiting?.c.setMood('happy', 1.5);
    this.ctx.pet.cheer();
    this.ctx.particles.burst(spot.x, spot.y - 80, { kind: 'star', colors: [BRASS.fill, 0xffffff, swatch.yellow.light], count: 12, speed: [100, 240], gravity: 0, life: [0.5, 0.9] });
    let say: LineId = 'lift-it.landed';
    if (this.plan.id === 2) say = 'lift-it.same-friends';
    else if (this.plan.id === 3) say = 'lift-it.two-ropes';
    else if (this.plan.counter) say = ratio(rig) === 2 ? 'lift-it.half-twice' : 'lift-it.count-knots';
    await this.ctx.say(say, { knots: travel(rig, l) });
    if (this.destroyed) return;
    // The crate comes back down empty.
    this.haul = { rung: 0, knots: 0 };
    this.fall = { r: this.shown };
    await this.ctx.tw.to(this.fall, { r: 0 }, { duration: 0.8, ease: ease.inOutSine });
    this.fall = null;
    if (this.destroyed) return;
    this.line++;
    if (this.line >= this.lines.length) {
      void this.finale();
      return;
    }
    for (const f of this.friends) void this.ctx.tw.to(f.c, { alpha: 0 }, { duration: 0.3 });
    await this.ctx.tw.wait(0.35);
    if (this.destroyed) return;
    this.buildLine();
    if (this.plan.request) void this.sayAsk();
  }

  /* Layout ---------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    this.layout = liftLayout(v);
    this.backdrop.resize(v);
    for (const w of this.wheels) {
      w.drag.home = w.on ? this.hookPos(w.on) : { ...this.layout.tray[w.slot] };
      if (!w.drag.dragging) w.node.position.copyFrom(w.drag.home);
    }
    if (this.question) this.placeCards();
    this.layoutAll();
  }

  private hookPos(h: HookId): Pt {
    return h === 'branch' ? { ...this.layout.branchHook } : crateHook(this.layout, this.shown);
  }

  private layoutAll() {
    this.drawTree();
    const L = this.layout;
    const l = this.cur;
    const ledge = ledgeSpots(L, this.view, l.h);
    for (const f of this.friends) {
      const p = f.at === 'waiting' ? ledge.waiting : f.at === 'ledge' ? ledge.pullers[f.i] : L.ground[f.i];
      f.c.position.set(p.x, p.y);
    }
    this.counter.position.set(Math.max(150, L.cx - 220), BRANCH_Y + 200);
    this.fixedWheel.position.copyFrom(L.branchHook);
  }

  private drawTree() {
    const L = this.layout;
    const l = this.cur;
    const g = this.tree.clear();
    const y = ledgeY(L, l.h);
    const ledge = ledgeSpots(L, this.view, l.h);
    g.roundRect(L.trunkX - 40, BRANCH_Y - 30, 80, L.groundY - BRANCH_Y + 50, 30).fill(wood.fill).stroke({ width: 5, color: wood.line });
    // The branch over the crate, with the ring the rope's standing end ties to.
    g.roundRect(L.ring.x - 70, BRANCH_Y - 14, L.trunkX - L.ring.x + 70, 28, 14).fill(wood.fill).stroke({ width: 5, color: wood.line });
    g.circle(L.ring.x, L.ring.y + 8, 9).stroke({ width: 5, color: 0x8c8c9c });
    // The ledge: a plank on the bough at her height.
    g.roundRect(ledge.from, y, L.trunkX - ledge.from, 24, 10).fill(wood.light).stroke({ width: 5, color: wood.line });
    g.moveTo(ledge.from + 30, y + 24).lineTo(L.trunkX - 30, y + 110).stroke({ width: 10, color: wood.line });
    // Leaves along the top.
    for (let x = L.ring.x - 120; x <= this.view.w + 60; x += 95) g.circle(x, BRANCH_Y - 40 + Math.sin(x * 0.05) * 14, 70).fill(LEAF[Math.abs(Math.round(x / 95)) % 3]);
    g.circle(L.trunkX, BRANCH_Y + 10, 95).fill(LEAF[1]);
  }

  /* Wheels ---------------------------------------------------------------------------------------- */

  private canHang(): boolean {
    return !this.busy && !this.finished && this.haul.rung === 0 && !this.grab && !this.question;
  }

  private hookNear(x: number, y: number, w: WheelNode): HookId | null {
    let best: HookId | null = null;
    let d = 95;
    for (const h of this.plan.hooks) {
      const p = this.hookPos(h);
      const dist = Math.hypot(p.x - x, p.y - y);
      const taken = this.wheels.some((o) => o !== w && o.on === h);
      if (dist < d && !taken) {
        d = dist;
        best = h;
      }
    }
    return best;
  }

  private dropWheel(w: WheelNode, x: number, y: number): boolean {
    this.hoverHook = null;
    // Mid-haul nothing moves: it floats back where it was.
    if (!this.canHang()) return false;
    const before = this.rig;
    const hook = this.hookNear(x, y, w);
    if (w.on) this.hooks = { ...this.hooks, [w.on]: false };
    w.on = hook;
    if (hook) {
      this.hooks = { ...this.hooks, [hook]: true };
      w.drag.home = this.hookPos(hook);
      w.node.position.copyFrom(w.drag.home);
      sfx.clunk();
    } else w.drag.home = { ...this.layout.tray[w.slot] };
    if (this.rig !== before) this.rigChanged();
    return !!hook;
  }

  private rigChanged() {
    this.answeredFor = null;
    if (this.glowRig && this.rig === this.glowRig) this.glowRig = null;
    if (this.rig !== 'direct' || !this.plan.request) {
      this.handle.scale.set(1.2);
      void this.ctx.tw.to(this.handle.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    }
  }

  /* Pulling --------------------------------------------------------------------------------------- */

  private readonly onDown = (e: FederatedPointerEvent) => {
    if (this.busy || this.finished || this.grab || this.question || palmOnGlass() || !this.hasHandle) return;
    const rig = this.rig;
    const l = this.cur;
    const can = works(rig, l) && endsRight(rig, l);
    if (pullers(rig, l) === 0) {
      this.tug(rig);
      return;
    }
    if (can && this.plan.ask !== 'none' && this.answeredFor !== rig) {
      this.ask(rig);
      return;
    }
    this.grab = { id: e.pointerId, from: this.ctx.stage.toLocal(e.global), best: 0, haul: can };
    this.knotArt.scale.set(1.15);
    sfx.squeak(4);
    if (!can) this.tug(rig);
  };

  private readonly onMove = (e: FederatedPointerEvent) => {
    const grab = this.grab;
    if (!grab || e.pointerId !== grab.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    const rig = this.rig;
    const along = pullDirection(rig) === 'down' ? p.y - grab.from.y : grab.from.y - p.y;
    if (!grab.haul) {
      // Too heavy: the rope stretches a little and the crate rocks.
      this.offset.d = Math.max(0, Math.min(30, along));
      return;
    }
    if (along > grab.best) {
      this.haul = applyPull(this.haul, rig, this.cur, along - grab.best);
      grab.best = along;
      if (this.t - this.creakAt > 0.25) {
        this.creakAt = this.t;
        sfx.ratchet(3);
      }
    }
    this.offset.d = rig === 'direct' ? 0 : Math.max(-20, Math.min(200, along));
  };

  private readonly release = (e: { pointerId: number }) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    this.knotArt.scale.set(1);
    void this.ctx.tw.to(this.offset, { d: 0 }, { duration: 0.3, ease: ease.outBack });
  };

  /** A tug on a rig that cannot lift the crate or ends at the wrong friends: it rocks and the pet says why. */
  private tug(rig: Rig) {
    const l = this.cur;
    this.ctx.tw.kill(this.rock);
    this.rock.a = 1;
    void this.ctx.tw.to(this.rock, { a: 0 }, { duration: 0.8 });
    const reason: LineId = !endsRight(rig, l) ? 'lift-it.wrong-pullers' : pullers(rig, l) === 0 ? 'lift-it.nobody-up' : 'lift-it.too-heavy';
    const vars = { paws: paws(rig, l), friends: pullers(rig, l), who: NAMES[l.puller] };
    if (countsMisses(this.plan)) {
      if (this.tried.has(rig)) {
        this.speak('lift-it.tried');
        return;
      }
      this.tried.add(rig);
      this.misses++;
      this.parcelMisses++;
      sfx.boing();
      this.speak(reason, vars, true);
      if (this.parcelMisses >= 2) this.showGlow();
      return;
    }
    this.tried.add(rig);
    sfx.boing();
    this.speak(reason, vars);
  }

  private speak(id: LineId, vars?: Record<string, string | number>, always = false) {
    if (!always && this.t - this.lastSaid < 1.6) return;
    this.lastSaid = this.t;
    void this.ctx.say(id, vars);
  }

  /* Questions (levels 4 and 6) -------------------------------------------------------------------- */

  private ask(rig: Rig) {
    const l = this.cur;
    if (this.plan.ask === 'knots') this.showQuestion({ kind: 'guess', values: guessCards(l), answer: travel(rig, l), rig });
    else this.showQuestion({ kind: 'paws', values: pawsCards(rig, l), answer: paws(rig, l), rig });
  }

  private showQuestion(q: Question) {
    this.question = q;
    this.clearCards();
    const bg = new Graphics();
    bg.eventMode = 'none';
    this.panel.addChild(bg);
    for (const v of q.values) {
      const node = card(v);
      const cbg = node.children[0] as Graphics;
      onTap(node, () => void this.pick(v), { cooldown: 300 });
      this.panel.addChild(node);
      this.cards.push({ node, value: v, bg: cbg });
    }
    this.placeCards();
    this.drawCards();
    if (q.kind !== 'guess' && this.parcelMisses >= 2) this.countGlow();
    void this.ctx.say(q.kind === 'paws' ? 'lift-it.ask-paws' : 'lift-it.ask-knots');
  }

  private placeCards() {
    const spots = cardSpots(this.view, this.cards.length);
    this.cards.forEach((c, i) => c.node.position.copyFrom(spots[i]));
    const bg = this.panel.children[0] as Graphics | undefined;
    if (bg && spots.length) {
      const x0 = spots[0].x - CARD / 2 - 24, x1 = spots[spots.length - 1].x + CARD / 2 + 24;
      bg.clear().roundRect(x0, spots[0].y - CARD / 2 - 24, x1 - x0, CARD + 48, 30).fill({ color: 0xffffff, alpha: 0.75 });
    }
  }

  private cardGlow: number | null = null;

  private drawCards(lit: number | null = null) {
    for (const c of this.cards) {
      const glowing = this.cardGlow === c.value || lit === c.value;
      c.bg.clear().roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 20).fill(glowing ? swatch.yellow.light : 0xffffff).stroke({ width: glowing ? 9 : 5, color: glowing ? swatch.yellow.fill : wood.line });
    }
  }

  private countGlow() {
    if (!this.question) return;
    this.cardGlow = this.question.answer;
    if (!this.glowCounted) {
      this.glowCounted = true;
      this.hints++;
    }
    this.drawCards();
  }

  private clearCards() {
    for (const c of this.panel.removeChildren()) c.destroy({ children: true });
    this.cards = [];
    this.cardGlow = null;
  }

  async pick(v: number) {
    const q = this.question;
    if (!q || this.busy || this.finished) return;
    this.busy = true;
    const node = this.cards.find((c) => c.value === v)?.node;
    if (node) {
      node.scale.set(1.15);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25 });
    }
    sfx.pop(6);
    const l = this.cur;
    if (q.kind === 'guess') {
      this.guess = v;
      await this.ctx.say('lift-it.guess-heard', { n: v });
    } else if (v === q.answer) {
      sfx.bell(7, 0.3);
      this.drawCards(v);
      await this.ctx.tw.wait(0.4);
    } else {
      this.misses++;
      this.parcelMisses++;
      sfx.boing();
      this.drawCards(q.answer);
      await this.ctx.say(q.kind === 'paws' ? 'lift-it.count-paws' : 'lift-it.count-knots', { paws: q.answer, knots: q.answer, w: l.w, ropes: ratio(q.rig) });
    }
    if (this.destroyed) return;
    this.clearCards();
    if (q.kind === 'paws') {
      this.question = null;
      this.showQuestion({ kind: 'knots', values: knotsCards(l), answer: travel(q.rig, l), rig: q.rig });
    } else {
      this.question = null;
      this.answeredFor = q.rig;
      void this.ctx.say('lift-it.now-pull');
    }
    this.busy = false;
  }

  /* Help ------------------------------------------------------------------------------------------ */

  private showGlow() {
    const best = bestRig(this.cur, rigsFor(this.plan));
    if (!best || best === this.rig) return;
    this.glowRig = best;
    if (!this.glowCounted) {
      this.glowCounted = true;
      this.hints++;
    }
    void this.ctx.say('lift-it.hint');
  }

  askForHint() {
    if (this.finished) return;
    if (this.busy) {
      void this.ctx.say('lift-it.hint');
      return;
    }
    if (this.plan.id <= 2) {
      // The pet's paw pulls the next stroke with her.
      if (!works(this.rig, this.cur)) {
        this.showGlow();
        return;
      }
      this.hints++;
      this.helperLeft = 1;
      void this.ctx.say('lift-it.hint-pull');
      return;
    }
    if (this.question && this.question.kind !== 'guess') {
      if (this.cardGlow === null) this.countGlow();
      void this.ctx.say('lift-it.hint');
      return;
    }
    const best = bestRig(this.cur, rigsFor(this.plan));
    if (best && best !== this.rig && this.glowRig === null) this.showGlow();
    else void this.ctx.say(best === this.rig ? 'lift-it.hint-pull' : 'lift-it.hint');
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    const L = this.layout;
    const l = this.cur;
    const rig = this.rig;
    // The pet's helping stroke (levels 1–2).
    if (this.helperLeft > 0 && !this.busy) {
      const step = Math.min(this.helperLeft, dt * 1.6);
      this.helperLeft -= step;
      this.haul = applyPull(this.haul, rig, l, step * 120);
    }
    if (this.fall) this.shown = this.fall.r;
    else if (!this.busy) this.shown += (this.haul.rung - this.shown) * (1 - Math.exp(-dt * 10));
    // One tick per knot going by, and the counter at levels 4–6.
    const k = Math.floor(this.haul.knots + 1e-6);
    if (k > this.lastTick) {
      this.lastTick = k;
      sfx.tick();
      this.counterText.text = String(k);
      if (this.plan.counter) {
        this.counter.scale.set(1.15);
        void this.ctx.tw.to(this.counter.scale, { x: 1, y: 1 }, { duration: 0.2 });
      }
    }
    if (!this.busy && this.haul.rung >= l.h && Math.abs(this.shown - l.h) < 0.02) {
      this.shown = l.h;
      void this.landed();
    }
    // The crate and what hangs on it.
    const bottom = crateBottom(L, this.shown);
    this.crate.position.set(L.cx, bottom);
    this.crate.rotation = 0.06 * this.rock.a * Math.sin(this.t * 30);
    for (const w of this.wheels) {
      if (w.drag.dragging) continue;
      if (w.on === 'crate') w.node.position.copyFrom(crateHook(L, this.shown));
      else if (w.on === 'branch') w.node.position.copyFrom(L.branchHook);
      w.drag.enabled = this.canHang();
    }
    this.fixedWheel.visible = this.plan.prebuilt === 'fixed';
    this.drawRope();
    this.drawHandle();
    this.drawHooks();
    for (const f of this.friends) {
      if (f.at === 'waiting' || this.busy) continue;
      // The pullers lean in while the rope moves.
      const pulling = this.grab?.haul && ((f.at === 'ledge') === (rig === 'movable'));
      f.c.rotation = pulling ? 0.08 * Math.sin(this.t * 8) : 0;
    }
  }

  private freeEnd(): Pt {
    const p = handleAt(this.layout, this.view, this.rig, this.cur, this.shown);
    const d = pullDirection(this.rig) === 'down' ? this.offset.d : -this.offset.d;
    return { x: p.x, y: p.y + (this.rig === 'direct' ? 0 : d) };
  }

  private drawRope() {
    const L = this.layout;
    const g = this.rope.clear();
    const rig = this.rig;
    const top = crateBottom(L, this.shown) - CRATE_H;
    const C = crateHook(L, this.shown);
    const B = L.branchHook;
    const H = this.freeEnd();
    const r = WHEEL_R;
    const stroke = { width: 7, color: ROPE, cap: 'round' as const, join: 'round' as const };
    let free: [Pt, Pt] | null = null;
    if (rig === 'fixed') {
      g.moveTo(L.cx + r, top).lineTo(B.x - r, B.y).arc(B.x, B.y, r, Math.PI, 2 * Math.PI).lineTo(H.x, H.y).stroke(stroke);
      g.circle(L.cx + r, top - 4, 7).fill(ROPE);
      free = [{ x: B.x + r, y: B.y }, H];
    } else if (rig === 'movable' || rig === 'both') {
      g.moveTo(L.ring.x, L.ring.y + 14).lineTo(C.x - r, C.y).arc(C.x, C.y, r, Math.PI, 0, true);
      if (rig === 'movable') {
        g.lineTo(H.x, H.y);
        free = [{ x: C.x + r, y: C.y }, H];
      } else {
        g.lineTo(B.x - r, B.y).arc(B.x, B.y, r, Math.PI, 2 * Math.PI).lineTo(H.x, H.y);
        free = [{ x: B.x + r, y: B.y }, H];
      }
      g.stroke(stroke);
      g.circle(L.ring.x, L.ring.y + 14, 8).fill(ROPE);
    }
    // Pale knots along the free end, moving as the rope comes.
    if (free) {
      const [a, b] = free;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const phase = ((this.haul.knots * KNOT_GAP) % KNOT_GAP + KNOT_GAP) % KNOT_GAP;
      for (let s = phase + 20; s < len - 30; s += KNOT_GAP) {
        const k = s / len;
        g.circle(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 6).fill(KNOT_COLOR);
      }
    }
  }

  private drawHandle() {
    const rig = this.rig;
    const l = this.cur;
    const show = this.hasHandle && !this.finished;
    this.handle.visible = show;
    this.paws.visible = show;
    if (!show) return;
    const H = this.freeEnd();
    this.handle.position.set(H.x, H.y);
    const nobody = pullers(rig, l) === 0;
    const k = this.knotArt.clear();
    if (rig === 'direct') {
      k.circle(0, 0, 44).fill({ color: 0xffffff, alpha: 0.35 }).stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
    } else {
      k.circle(0, 0, 40).fill(nobody ? 0xc8c8c8 : ROPE).stroke({ width: 6, color: nobody ? 0x9a9a9a : wood.line });
      k.circle(-10, -10, 9).fill({ color: KNOT_COLOR, alpha: 0.7 });
    }
    // An arrow the way to pull.
    const up = pullDirection(rig) === 'up';
    const ay = up ? -62 : 62;
    k.moveTo(-18, ay + (up ? 14 : -14)).lineTo(0, ay).lineTo(18, ay + (up ? 14 : -14)).stroke({ width: 7, color: nobody ? 0x9a9a9a : 0xffffff, cap: 'round', join: 'round' });
    // Paw prints: how many friends' pulls the rope needs (hidden at level 6 until the cards are answered).
    const need = paws(rig, l);
    const hide = this.plan.ask === 'numbers' && this.answeredFor !== rig;
    if (this.paws.children.length !== (hide ? 0 : need)) {
      for (const c of this.paws.removeChildren()) c.destroy();
      if (!hide) for (let i = 0; i < need; i++) this.paws.addChild(pawArt());
    }
    const n = this.paws.children.length;
    const side = H.x + 70 + 30 > this.view.w - 20 ? -1 : 1;
    this.paws.children.forEach((p, i) => {
      const row = Math.floor(i / 3), col = i % 3;
      p.position.set(H.x + side * (70 + col * 26), H.y - 16 + row * 26);
    });
    this.paws.alpha = n && this.rock.a > 0 && Math.sin(this.t * 20) < 0 ? 0.35 : 1;
  }

  private drawHooks() {
    const g = this.hookRings.clear();
    const gl = this.glow.clear();
    for (const h of this.plan.hooks) {
      const p = this.hookPos(h);
      const filled = this.hooks[h];
      if (!filled) {
        const hover = this.hoverHook === h;
        g.circle(p.x, p.y, HOOK_HIT - 6).fill({ color: 0xffffff, alpha: hover ? 0.4 : 0.18 }).stroke({ width: hover ? 8 : 5, color: hover ? swatch.yellow.fill : 0xffffff, alpha: 0.9 });
        g.moveTo(p.x, p.y - WHEEL_R - 10).lineTo(p.x, p.y - 14).stroke({ width: 5, color: 0x8c8c9c });
        g.circle(p.x, p.y - 6, 9).stroke({ width: 5, color: 0x8c8c9c });
      }
      if (this.glowRig) {
        const want = hooksOf(this.glowRig)[h];
        if (want !== filled) {
          const pulse = 6 * Math.sin(this.t * 5);
          gl.circle(p.x, p.y, HOOK_HIT + 10 + pulse).stroke({ width: want ? 9 : 4, color: swatch.yellow.fill, alpha: want ? 0.9 : 0.5 });
          if (!want) {
            const w = this.wheels.find((o) => o.on === h);
            if (w) {
              const slot = this.layout.tray[w.slot];
              gl.circle(slot.x, slot.y, TRAY_HIT + 4 + pulse).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.5 });
            }
          }
        }
      }
    }
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.grab) return null;
    const q = this.question;
    if (q) {
      const c = this.cards.find((c) => c.value === q.answer) ?? this.cards[0];
      return c ? { tap: { on: c.node }, pause: 0.8 } : null;
    }
    const best = bestRig(this.cur, rigsFor(this.plan));
    if (!best) return null;
    if (!this.plan.prebuilt && this.rig !== best) {
      const want = hooksOf(best);
      const stage = this.ctx.stage;
      for (const h of this.plan.hooks) {
        if (this.hooks[h] && !want[h]) {
          const w = this.wheels.find((o) => o.on === h);
          if (w) return { drag: { on: w.node }, to: { on: stage, ...this.layout.tray[w.slot] } };
        }
      }
      for (const h of this.plan.hooks) {
        if (want[h] && !this.hooks[h]) {
          const w = this.wheels.find((o) => o.on === null) ?? this.wheels.find((o) => o.on && !want[o.on]);
          if (w) return { drag: { on: w.node }, to: { on: stage, ...this.hookPos(h) }, pause: 0.7 };
        }
      }
      return null;
    }
    if (this.plan.ask !== 'none' && this.answeredFor !== this.rig) return { tap: { on: this.handle } };
    const H = this.freeEnd();
    const dy = pullDirection(this.rig) === 'down' ? STROKE : -Math.min(STROKE, H.y - 20);
    return { trace: { on: this.ctx.stage, x: H.x, y: H.y }, via: [{ on: this.ctx.stage, x: H.x, y: H.y + dy }], receiver: this.handle, pause: 0.35 };
  }

  /* Finish ---------------------------------------------------------------------------------------- */

  private async finale() {
    this.finished = true;
    this.busy = true;
    for (const f of this.friends) {
      f.c.alpha = 1;
      f.c.hop(0.9);
      f.c.setMood('happy', 2);
    }
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('lift-it.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.release, true);
    this.handle.removeAllListeners();
    for (const w of this.wheels) w.drag.destroy();
    for (const f of this.friends) this.ctx.untrack(f.c);
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

function liftPicture(friend: Friend | null, rise: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-120, -250, 240, 24, 12).fill(wood.fill).stroke({ width: 4, color: wood.line }));
  const wheel = wheelArt(36);
  wheel.position.set(-10, -200);
  const crate = new Container();
  crate.addChild(crateArt(2));
  crate.scale.set(0.7);
  crate.position.set(-10 - 36, -20 - rise);
  const rope = new Graphics()
    .moveTo(-46, -20 - rise - CRATE_H * 0.7).lineTo(-46, -200).arc(-10, -200, 36, Math.PI, 2 * Math.PI).lineTo(26, -40)
    .stroke({ width: 5, color: ROPE });
  c.addChild(rope, crate, wheel);
  if (friend) {
    const k = new Critter(SPECS[friend]);
    k.alive = false;
    k.scale.set(0.34);
    k.position.set(80, -150);
    const p = parcelArt();
    p.scale.set(0.8);
    p.position.set(80, -170);
    c.addChild(new Graphics().roundRect(30, -150, 110, 16, 6).fill(wood.light).stroke({ width: 3, color: wood.line }), k, p);
  }
  return c;
}

class LiftIcon extends WigglyIcon {
  private readonly art: Container;
  private t = 0;
  constructor() {
    const c = new Container();
    super(c);
    this.art = liftPicture(null, 0);
    c.addChild(this.art);
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    const crate = this.art.children[2] as Container;
    crate.y = -20 - 30 * (0.5 - 0.5 * Math.cos(this.t * 1.5));
  }
}

function sticker(seed: number): Container {
  const kinds: Friend[] = ['bunny', 'duck', 'mouse', 'bear', 'frog'];
  const c = liftPicture(kinds[Math.abs(seed) % kinds.length], 80);
  c.scale.set(0.85);
  c.y = 90;
  return c;
}

export const liftIt: GameModule = {
  id: 'lift-it',
  name: 'Lift It',
  titleLine: 'game.lift-it',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'simple-machines', 'force-and-distance', 'prediction', 'numbers'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you hangs the wheels, the other pulls. On the knot levels, both say the count aloud before the haul.',
  offScreen: 'Look for a pulley on a walk (a flagpole, a crane, window blinds, a well) and say which way the rope is pulled and which way the load goes.',
  touchDemo: true,
  hubIcon: () => new LiftIcon(),
  sticker,
  create: (ctx) => new LiftIt(ctx),
};
