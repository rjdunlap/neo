import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  applyPush, FRIEND_SCALE, HOOKS, land, makeRound, nextBackTime, nextToPush, period, planFor, ropeOf, seatAt,
  swingLayout, together, watchTime, WEIGHT, type Column, type Friend, type Hook, type Line, type Plan, type PushLine, type Round, type Swing,
  type SwingLayout,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 6 },
};

/** Each level's authored first line leads its first round of a session. */
const authoredShown = new Set<number>();

const SPECS: Record<Friend, CritterSpec> = {
  bunny: CRITTERS.bunny,
  duck: CRITTERS.duck,
  bear: CRITTERS.bear,
  mouse: { color: 'white', ears: 'round', earColor: 'pink', snout: 'nose', noseColor: 0xff8fa3, whiskers: true },
  frog: { color: 'green', ears: 'none', snout: 'none', belly: true },
};
/** Each friend's bell note (pentatonic steps), so a round plays a little tune. */
const NOTES: Record<Friend, number> = { bear: 3, bunny: 5, frog: 6, duck: 7, mouse: 9 };
const NAMES: Record<Friend, string> = { bunny: 'Bunny', duck: 'Duck', mouse: 'Mouse', bear: 'Bear', frog: 'Frog' };
const BRASS = { fill: 0xf2c14e, line: 0xb8862b };
const LEAF = [0x6cc070, 0x5bb062, 0x7fd07c];
const ROPE = 0xa8865a;

/* Art -------------------------------------------------------------------------------------------- */

function bellArt(): Graphics {
  return new Graphics()
    .moveTo(0, -80).lineTo(0, -26).stroke({ width: 3, color: wood.line })
    .moveTo(-22, 12).quadraticCurveTo(-22, -26, 0, -28).quadraticCurveTo(22, -26, 22, 12).lineTo(28, 18).lineTo(-28, 18).closePath()
    .fill(BRASS.fill).stroke({ width: 4, color: BRASS.line, join: 'round' })
    .circle(0, 22, 7).fill(BRASS.line)
    .ellipse(-9, -10, 5, 9).fill({ color: 0xffffff, alpha: 0.45 });
}

function mittenArt(): Graphics {
  return new Graphics()
    .roundRect(-34, -30, 56, 60, 26).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .ellipse(22, -6, 14, 11).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .roundRect(-44, -26, 18, 52, 8).fill(0xffffff).stroke({ width: 3, color: swatch.white.line });
}

/** One swing: a container at the pivot, turned by the swing's angle, with two ropes, a seat and the friend standing on it. */
class Rig {
  readonly arm = new Container();
  readonly rope = new Graphics();
  readonly seat = new Graphics().roundRect(-62, -6, 124, 20, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
  critter: Critter;
  /** Drawn rope length, eased when the rope moves hooks. */
  L = 0;
  /** Drawn height (degrees) and the height it eases toward. */
  A = 0;
  target = 0;
  t0: number | null = null;
  /** Set while the swing is held at a fixed angle (drawing back before a release). */
  held: number | null = null;
  private lastPhase = 0;

  constructor(public hook: Hook, public friend: Friend, readonly col: Column) {
    this.critter = this.makeCritter(friend);
    this.arm.eventMode = 'none';
    this.arm.addChild(this.rope, this.seat, this.critter);
  }

  makeCritter(f: Friend): Critter {
    const c = new Critter(SPECS[f]);
    c.scale.set(FRIEND_SCALE[WEIGHT[f]]);
    return c;
  }

  setFriend(f: Friend) {
    this.friend = f;
    this.critter.destroy({ children: true });
    this.critter = this.makeCritter(f);
    this.arm.addChild(this.critter);
  }

  angle(t: number): number {
    if (this.held !== null) return this.held;
    if (this.t0 === null) return 0;
    return -this.A * Math.cos((2 * Math.PI * (t - this.t0)) / period(this.hook));
  }

  /** Draws the swing at time t; returns true when the friend has just swooped forward through the middle. */
  draw(t: number, pivotX: number, pivotY: number): boolean {
    const a = this.angle(t);
    this.arm.position.set(pivotX, pivotY);
    this.arm.rotation = (-a * Math.PI) / 180;
    const heavy = WEIGHT[this.friend] === 'heavy' ? 6 : 0;
    this.rope.clear().moveTo(-52, 0).lineTo(-52, this.L + heavy).moveTo(52, 0).lineTo(52, this.L + heavy).stroke({ width: 5, color: ROPE, cap: 'round' });
    this.seat.y = this.L + heavy;
    this.critter.position.set(0, this.L + heavy - 4);
    const phase = this.A > 0.5 ? a / this.A : 0;
    const swoop = this.lastPhase < 0 && phase >= 0 && a > this.lastPhase * this.A && this.A > 4;
    this.lastPhase = phase;
    return swoop;
  }

  destroy() {
    this.arm.destroy({ children: true });
  }
}

/* The game --------------------------------------------------------------------------------------- */

interface HookTarget {
  node: Container;
  ring: Graphics;
  hook: Hook;
}

class SwingPals implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly hintLabel = 'Show a hint';
  line = 0;
  rigs: Rig[] = [];
  /** Push levels: the logic swing behind each rig, its waiting push, and when its bell rings. */
  swings: Swing[] = [];
  pending: (number | null)[] = [];
  ringAt: (number | null)[] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Together levels: hooks tried on this line, swings seen apart, and the glowing hook. */
  tried = new Set<Hook>();
  apart = 0;
  glowHook: Hook | null = null;
  glowCounted = false;
  /** The level 1–3 hint: pushes the pet still gives. */
  helperPushes = 0;
  t = 0;

  private layout: SwingLayout;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly tree = new Graphics();
  private readonly swingLayer = new Container();
  private readonly bells: Container[] = [];
  private readonly mittens: Container[] = [];
  private readonly waitRings: Graphics[] = [];
  private readonly nowRings: Graphics[] = [];
  private readonly ground = new Container();
  private readonly hookLayer = new Container();
  private readonly hookTargets: HookTarget[] = [];
  private readonly glow = new Graphics();
  private destroyed = false;
  private giggledAt = -10;
  private lookT = 0;
  /** Together: the watch running, and the pet's back points counted for claps. */
  private watchEnd = 0;
  private claps = 0;
  private match = false;
  /** How far both swings are drawn back before a release, 0 to 1. */
  private readonly hold = { k: 0 };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (authored) authoredShown.add(this.plan.id);
    this.round = makeRound(this.plan, ctx.rng, authored).round;
    this.layout = swingLayout(this.plan.two ? 2 : 1, ctx.view);
    this.backdrop = new Backdrop({ sky: [0xbfe6ff, 0xf3fbe8], hills: [0xbfe3a0, 0x9fd38a, 0x86c96e], horizon: 0.72, clouds: 2, sun: true, seed: 317 }, ctx.view);
    this.tree.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.swingLayer.eventMode = 'none';

    for (let i = 0; i < 2; i++) {
      const b = new Container();
      b.addChild(bellArt());
      b.eventMode = 'none';
      b.visible = false;
      const m = new Container();
      m.addChild(mittenArt());
      m.eventMode = 'none';
      m.scale.set(0);
      const w = new Graphics().circle(0, 0, 46).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
      w.eventMode = 'none';
      w.visible = false;
      const n = new Graphics().circle(0, 0, 40).stroke({ width: 8, color: swatch.yellow.fill });
      n.eventMode = 'none';
      n.alpha = 0;
      this.bells.push(b);
      this.mittens.push(m);
      this.waitRings.push(w);
      this.nowRings.push(n);
    }

    ctx.stage.addChild(this.backdrop, this.tree, ...this.bells, this.swingLayer, ...this.nowRings, ...this.waitRings, ...this.mittens, this.ground, this.glow, this.hookLayer);
    this.ground.eventMode = this.plan.mode === 'push' ? 'static' : 'none';
    this.ground.on('pointerdown', this.onGround);

    if (this.plan.mode === 'together') {
      for (const hook of HOOKS) {
        const node = new Container();
        const ring = new Graphics();
        node.addChild(ring);
        onTap(node, () => this.chooseHook(hook), { radius: 60 });
        this.hookLayer.addChild(node);
        this.hookTargets.push({ node, ring, hook });
      }
    }
    this.buildLine();
  }

  start() {
    const lines: Record<number, LineId> = {
      1: 'swing-pals.instruct-push', 2: 'swing-pals.instruct-back', 3: 'swing-pals.instruct-two',
      4: 'swing-pals.instruct-together', 5: 'swing-pals.instruct-heavy', 6: 'swing-pals.instruct-big',
    };
    void this.ctx.instruct(lines[this.plan.id], { friend: this.friendName() });
  }

  private friendName(): string {
    return NAMES[this.rigs[this.rigs.length - 1]?.friend ?? 'bunny'];
  }

  private get pushLine(): PushLine {
    return (this.round as Extract<Round, { kind: 'push' }>).lines[this.line];
  }

  private get pairLine(): Line {
    return (this.round as Extract<Round, { kind: 'together' }>).lines[this.line];
  }

  /* Lines ----------------------------------------------------------------------------------------- */

  private buildLine() {
    for (const r of this.rigs) {
      this.ctx.untrack(r.critter);
      r.destroy();
    }
    this.rigs = [];
    const cols = this.layout.columns;
    if (this.round.kind === 'push') {
      this.swings = this.pushLine.swings.map((s) => ({ ...s, t0: s.t0 === null ? null : this.t }));
      this.pending = this.swings.map(() => null);
      this.ringAt = this.swings.map(() => null);
      this.swings.forEach((s, i) => {
        const rig = new Rig(s.hook, s.friend, cols[i]);
        rig.L = ropeOf(this.layout, s.hook);
        rig.A = rig.target = (s.steps / 4) * this.layout.bell;
        rig.t0 = s.t0;
        this.rigs.push(rig);
      });
    } else {
      const l = this.pairLine;
      this.rigs = [new Rig(l.petHook, l.petFriend, cols[0]), new Rig(l.hook, l.friend, cols[1])];
      for (const r of this.rigs) r.L = ropeOf(this.layout, r.hook);
      this.tried.clear();
      this.apart = 0;
      this.glowHook = null;
      this.glowCounted = false;
      this.lookT = 0;
    }
    for (const r of this.rigs) {
      this.swingLayer.addChild(r.arm);
      this.ctx.track(r.critter);
      r.critter.alpha = 0;
      void this.ctx.tw.to(r.critter, { alpha: 1 }, { duration: 0.35 });
    }
    this.layoutAll();
    this.busy = false;
  }

  private async nextLine() {
    this.busy = true;
    await this.ctx.tw.wait(0.6);
    if (this.destroyed) return;
    for (const r of this.rigs) {
      r.critter.hop(1);
      void this.ctx.tw.to(r.critter, { alpha: 0 }, { duration: 0.5, delay: 0.25 });
    }
    await this.ctx.tw.wait(0.8);
    if (this.destroyed) return;
    this.line++;
    if (this.line >= this.round.lines.length) {
      void this.finale();
      return;
    }
    this.buildLine();
  }

  /* Layout ---------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    this.layout = swingLayout(this.plan.two ? 2 : 1, v);
    this.backdrop.resize(v);
    this.ground.hitArea = new Rectangle(0, 130, v.w, v.h - 130);
    for (const [i, r] of this.rigs.entries()) {
      (r as { col: Column }).col = this.layout.columns[i];
      r.L = ropeOf(this.layout, r.hook);
    }
    this.layoutAll();
  }

  private layoutAll() {
    this.drawTree();
    const L = this.layout;
    this.bells.forEach((b, i) => {
      const rig = this.rigs[i];
      b.visible = this.plan.mode === 'push' && !!rig;
      if (rig) b.position.copyFrom(L.columns[i].bell[rig.hook]);
    });
    if (this.plan.mode === 'together') {
      const col = L.columns[1];
      for (const h of this.hookTargets) h.node.position.copyFrom(col.pivot[h.hook]);
      this.drawHooks();
    }
  }

  private drawTree() {
    const L = this.layout;
    const g = this.tree.clear();
    const cols = L.columns;
    const top = Math.min(...cols.map((c) => c.pivot.long.y));
    const trunkX = cols.length === 1 ? Math.min(this.view.w - 60, cols[0].pivot.middle.x + 300) : (cols[0].pivot.middle.x + cols[1].pivot.middle.x) / 2 + 30;
    g.roundRect(trunkX - 34, top - 40, 68, L.seatY - top + 140, 26).fill(wood.fill).stroke({ width: 5, color: wood.line });
    for (const c of cols) {
      for (const h of HOOKS) {
        const p = c.pivot[h];
        const from = Math.min(p.x - 70, trunkX), to = Math.max(p.x + 70, trunkX);
        g.roundRect(from, p.y - 14, to - from, 22, 11).fill(wood.fill).stroke({ width: 4, color: wood.line });
        g.circle(p.x, p.y + 6, 7).stroke({ width: 4, color: 0x8c8c9c });
      }
    }
    // Leaves along the top, and over the trunk.
    for (let x = -40; x < this.view.w + 80; x += 90) {
      const y = top - 70 + Math.sin(x * 0.05) * 18;
      g.circle(x, y, 78).fill(LEAF[Math.abs(Math.round(x / 90)) % 3]);
    }
    g.circle(trunkX, top - 30, 90).fill(LEAF[1]);
  }

  private drawHooks() {
    for (const h of this.hookTargets) {
      const on = this.rigs[1]?.hook === h.hook;
      const glowing = this.glowHook === h.hook;
      h.ring.clear().circle(0, 0, 60).fill({ color: 0xffffff, alpha: on ? 0.55 : 0.3 }).stroke({ width: glowing ? 9 : 6, color: glowing ? swatch.yellow.fill : on ? swatch.blue.line : 0xffffff });
      h.ring.circle(0, 6, 12).stroke({ width: 6, color: 0x8c8c9c });
    }
  }

  /* Pushes (levels 1–3) --------------------------------------------------------------------------- */

  private onGround = (e: FederatedPointerEvent) => {
    if (palmOnGlass() || this.finished) return;
    const p = this.ground.toLocal(e.global);
    const i = this.layout.columns.findIndex((c) => p.x >= c.zone.x && p.x < c.zone.x + c.zone.w);
    if (i >= 0 && i < this.rigs.length) this.tap(i);
  };

  /** A tap on swing i: the mitten pops out at once; the push lands now or waits for the back point. Never a miss. */
  tap(i: number, helper = false) {
    const s = this.swings[i];
    if (!s || this.busy) return;
    this.popMitten(i, helper);
    const r = applyPush(s, this.t, this.plan.id);
    if (r.landsAt === null) return;
    this.swings[i] = r.swing;
    if (r.landsAt <= this.t) this.landPush(i, this.swings[i]);
    else {
      this.pending[i] = r.landsAt;
      this.waitRings[i].visible = true;
    }
  }

  private landPush(i: number, landed: Swing) {
    const rig = this.rigs[i];
    const wasStill = rig.t0 === null;
    this.swings[i] = landed;
    this.pending[i] = null;
    this.waitRings[i].visible = false;
    if (wasStill) {
      rig.t0 = landed.t0 ?? this.t;
      rig.A = 0;
    }
    rig.target = (landed.steps / 4) * this.layout.bell;
    sfx.whoosh();
    this.shoveMitten(i);
    if (landed.rung && this.ringAt[i] === null) this.ringAt[i] = this.t + period(rig.hook) / 2;
  }

  private popMitten(i: number, helper: boolean) {
    const m = this.mittens[i];
    const rig = this.rigs[i];
    const back = seatAt(this.layout, rig.col, rig.hook, -Math.max(rig.A, 8));
    m.position.set(back.x - 50, back.y - 40);
    m.tint = helper ? swatch.yellow.light : 0xffffff;
    this.ctx.tw.kill(m.scale);
    m.scale.set(0.4);
    void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.15, ease: ease.outBack });
  }

  private shoveMitten(i: number) {
    const m = this.mittens[i];
    this.ctx.tw.kill(m);
    void this.ctx.tw.to(m, { x: m.x + 36 }, { duration: 0.12 }).then(() => {
      if (this.destroyed) return;
      void this.ctx.tw.to(m.scale, { x: 0, y: 0 }, { duration: 0.3, delay: 0.25 });
    });
  }

  private ring(i: number) {
    const rig = this.rigs[i];
    const b = this.bells[i];
    sfx.bell(NOTES[rig.friend], 0.35);
    this.ctx.pet.cheer();
    rig.critter.setMood('happy', 1);
    this.ctx.particles.burst(b.x, b.y, { kind: 'star', colors: [BRASS.fill, 0xffffff, swatch.yellow.light], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.tw.kill(b);
    b.rotation = 0.5;
    void this.ctx.tw.to(b, { rotation: 0 }, { duration: 0.9, ease: ease.outElastic });
  }

  private pushLineDone(): boolean {
    return this.swings.length > 0 && this.swings.every((s, i) => s.rung && this.ringAt[i] === -1);
  }

  private async finishPushLine() {
    this.busy = true;
    if (this.plan.id === 3) await this.ctx.say('swing-pals.quick-slow');
    else await this.ctx.say('swing-pals.ring', { friend: NAMES[this.rigs[0].friend] });
    if (this.destroyed) return;
    await this.nextLine();
  }

  /** The level 1–3 hint: the pet gives the next two pushes with her, landing at the back points. */
  private helperStep() {
    if (this.helperPushes <= 0 || this.busy) return;
    const i = nextToPush(this.swings);
    if (i < 0) {
      this.helperPushes = 0;
      return;
    }
    const s = this.swings[i];
    if (s.waiting) return;
    if (s.t0 !== null && nextBackTime(s, this.t) - this.t > 0.3) return;
    this.helperPushes--;
    this.tap(i, true);
  }

  /* Together (levels 4–6) ------------------------------------------------------------------------- */

  async chooseHook(hook: Hook) {
    if (this.busy || this.finished || this.plan.mode !== 'together') return;
    this.busy = true;
    const her = this.rigs[1];
    const pet = this.rigs[0];
    const target = this.hookTargets.find((h) => h.hook === hook);
    if (target) {
      target.ring.scale.set(1.15);
      void this.ctx.tw.to(target.ring.scale, { x: 1, y: 1 }, { duration: 0.3 });
    }
    if (her.hook !== hook) {
      const from = { x: this.layout.columns[1].pivot[her.hook].x, y: this.layout.columns[1].pivot[her.hook].y, L: her.L };
      const to = { x: this.layout.columns[1].pivot[hook].x, y: this.layout.columns[1].pivot[hook].y, L: ropeOf(this.layout, hook) };
      const move = { k: 0 };
      this.moving = { from, to, move };
      her.hook = hook;
      this.drawHooks();
      await this.ctx.tw.to(move, { k: 1 }, { duration: 0.4, ease: ease.inOutSine });
      this.moving = null;
      her.L = to.L;
      if (this.destroyed) return;
    }
    const l = this.pairLine;
    const bell = this.layout.bell;
    // Both draw back to their release heights, then let go together.
    this.hold.k = 0;
    pet.held = 0;
    her.held = 0;
    void this.ctx.say('swing-pals.ready-go');
    await this.ctx.tw.to(this.hold, { k: 1 }, { duration: 0.9, ease: ease.inOutSine });
    if (this.destroyed) return;
    pet.A = l.petHeight * bell;
    her.A = l.height * bell;
    pet.held = her.held = null;
    pet.t0 = her.t0 = this.t;
    this.match = together(l, hook).match;
    this.claps = 0;
    this.watchEnd = this.t + watchTime(l);
    sfx.whoosh();
    await this.ctx.tw.wait(watchTime(l));
    if (this.destroyed) return;
    // Settle.
    await Promise.all([this.ctx.tw.to(pet, { A: 0 }, { duration: 1.1 }), this.ctx.tw.to(her, { A: 0 }, { duration: 1.1 })]);
    if (this.destroyed) return;
    pet.t0 = her.t0 = null;
    await this.judge(hook);
  }

  private moving: { from: { x: number; y: number; L: number }; to: { x: number; y: number; L: number }; move: { k: number } } | null = null;

  private async judge(hook: Hook) {
    const l = this.pairLine;
    const r = together(l, hook);
    if (r.match) {
      sfx.tada();
      this.ctx.pet.cheer();
      for (const rig of this.rigs) rig.critter.hop(0.8);
      this.glowHook = null;
      this.drawHooks();
      const extra: LineId = this.plan.id === 5 && WEIGHT[l.friend] !== WEIGHT[l.petFriend] ? 'swing-pals.heavy-same' : this.plan.id === 6 ? 'swing-pals.big-same' : 'swing-pals.together';
      await this.ctx.say(extra);
      if (this.destroyed) return;
      await this.nextLine();
      return;
    }
    const free = hook === l.hook && !this.tried.has(hook);
    if (this.tried.has(hook)) {
      await this.ctx.say('swing-pals.tried');
    } else {
      this.apart++;
      if (!free) {
        this.misses++;
        sfx.boing();
      }
      await this.ctx.say(r.side === 'quicker' ? 'swing-pals.quicker' : 'swing-pals.slower');
      if (!free && this.plan.id === 5 && WEIGHT[l.friend] !== WEIGHT[l.petFriend]) await this.ctx.say('swing-pals.heavy-same');
      if (!free && this.plan.id === 6) await this.ctx.say('swing-pals.big-same');
    }
    this.tried.add(hook);
    if (this.destroyed) return;
    if (this.apart >= 2 && this.glowHook === null) this.showGlow();
    this.busy = false;
  }

  private showGlow() {
    this.glowHook = this.pairLine.petHook;
    if (!this.glowCounted) {
      this.glowCounted = true;
      this.hints++;
    }
    this.drawHooks();
    void this.ctx.say('swing-pals.hint');
  }

  askForHint() {
    if (this.finished) return;
    if (this.plan.mode === 'push') {
      if (this.busy || nextToPush(this.swings) < 0) {
        void this.ctx.say('swing-pals.hint-push');
        return;
      }
      this.hints++;
      this.helperPushes = 2;
      void this.ctx.say('swing-pals.hint-push');
      return;
    }
    if (this.busy) return;
    if (this.glowHook === null) this.showGlow();
    else void this.ctx.say('swing-pals.hint');
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    const L = this.layout;
    if (this.round.kind === 'push') {
      for (const [i, s] of this.swings.entries()) {
        const at = this.pending[i];
        if (at !== null && this.t >= at) this.landPush(i, land(s, at));
        const ringAt = this.ringAt[i];
        if (ringAt !== null && ringAt >= 0 && this.t >= ringAt) {
          this.ringAt[i] = -1;
          this.ring(i);
        }
        const rig = this.rigs[i];
        if (this.swings[i].rung && this.ringAt[i] === -1) rig.target *= Math.pow(0.85, dt / period(rig.hook));
      }
      this.helperStep();
      if (!this.busy && this.pushLineDone()) void this.finishPushLine();
    }
    for (const [i, rig] of this.rigs.entries()) {
      if (this.round.kind === 'push') rig.A += (rig.target - rig.A) * (1 - Math.exp((-dt * 4) / period(rig.hook)));
      let px = rig.col.pivot[rig.hook].x, py = rig.col.pivot[rig.hook].y;
      if (i === 1 && this.moving) {
        const { from, to, move } = this.moving;
        px = from.x + (to.x - from.x) * move.k;
        py = from.y + (to.y - from.y) * move.k;
        rig.L = from.L + (to.L - from.L) * move.k;
      }
      if (rig.held !== null) rig.held = -(i === 0 ? this.pairLine.petHeight : this.pairLine.height) * L.bell * this.hold.k;
      if (rig.draw(this.t, px, py) && this.t - this.giggledAt > 1.4) {
        this.giggledAt = this.t;
        sfx.giggle();
      }
      // The "now" ring (level 2, first two friends): it glows each time the friend comes back to the mitten.
      if (this.plan.id === 2 && this.line < 2 && rig.t0 !== null && rig.A > 1) {
        const back = seatAt(L, rig.col, rig.hook, -rig.A);
        const n = this.nowRings[i];
        n.position.set(back.x - 50, back.y - 40);
        n.alpha = Math.pow(Math.max(0, -rig.angle(this.t) / rig.A), 8);
      } else this.nowRings[i].alpha = 0;
      const w = this.waitRings[i];
      if (w.visible) {
        const back = seatAt(L, rig.col, rig.hook, -Math.max(rig.A, 8));
        w.position.set(back.x - 50, back.y - 40);
        w.scale.set(1 + 0.08 * Math.sin(this.t * 10));
      }
    }
    // Claps while the two swings come back together.
    if (this.round.kind === 'together' && this.rigs[0].t0 !== null && this.t < this.watchEnd) {
      const k = Math.floor((this.t - this.rigs[0].t0) / period(this.rigs[0].hook));
      if (k > this.claps) {
        this.claps = k;
        if (this.match) {
          sfx.clap();
          const a = seatAt(L, L.columns[0], this.rigs[0].hook, -this.rigs[0].A), b = seatAt(L, L.columns[1], this.rigs[1].hook, -this.rigs[1].A);
          this.ctx.particles.burst((a.x + b.x) / 2, Math.min(a.y, b.y) - 120, { kind: 'star', colors: [0xffffff, swatch.yellow.light], count: 8, speed: [80, 180], gravity: 0, life: [0.4, 0.7] });
        }
      }
    }
    // The glow around the matching hook.
    this.glow.clear();
    if (this.glowHook) {
      const p = L.columns[1].pivot[this.glowHook];
      this.glow.circle(p.x, p.y, 72 + 6 * Math.sin(this.t * 5)).stroke({ width: 8, color: swatch.yellow.fill, alpha: 0.8 });
    }
    if (this.round.kind === 'together' && !this.busy) this.lookT += dt;
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.round.kind === 'push') {
      const i = nextToPush(this.swings);
      if (i < 0) return null;
      const s = this.swings[i];
      const z = this.layout.columns[i].zone;
      const spot = { on: this.ground, x: z.x + z.w / 2, y: z.y + z.h * 0.55 };
      if (this.plan.id === 1 || s.t0 === null) return { tap: spot, receiver: this.ground, pause: 0.7 };
      if (s.waiting) return null;
      return { tap: spot, receiver: this.ground, when: () => (this.busy ? 'cancel' : nextBackTime(this.swings[i], this.t) - this.t < 0.45), pause: 0.2 };
    }
    if (this.lookT < 1) return null;
    const right = this.hookTargets.find((h) => h.hook === this.pairLine.petHook);
    return right ? { tap: { on: right.node } } : null;
  }

  /* Finish ---------------------------------------------------------------------------------------- */

  private async finale() {
    this.finished = true;
    this.busy = true;
    const friends: Friend[] = [];
    if (this.round.kind === 'push') for (const l of this.round.lines) for (const s of l.swings) friends.push(s.friend);
    else for (const l of this.round.lines) friends.push(l.petFriend, l.friend);
    const row = new Container();
    row.eventMode = 'none';
    this.ctx.stage.addChild(row);
    const n = friends.length;
    const gap = Math.min(150, (this.view.w - 320) / Math.max(1, n - 1));
    const x0 = this.view.w / 2 - (gap * (n - 1)) / 2 + 60;
    const critters: Critter[] = [];
    friends.forEach((f, i) => {
      const c = new Critter(SPECS[f]);
      c.scale.set(FRIEND_SCALE[WEIGHT[f]] * 0.85);
      c.position.set(x0 + i * gap, this.view.h - 40);
      c.alpha = 0;
      row.addChild(c);
      critters.push(c);
      this.ctx.track(c);
    });
    for (const [i, c] of critters.entries()) {
      void this.ctx.tw.to(c, { alpha: 1 }, { duration: 0.25 });
      sfx.bell(NOTES[friends[i]], 0.25);
      c.hop(0.8);
      await this.ctx.tw.wait(0.22);
      if (this.destroyed) return;
    }
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('swing-pals.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.destroyed = true;
    this.ground.removeAllListeners();
    for (const r of this.rigs) this.ctx.untrack(r.critter);
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

function swingPicture(friend: Friend, angle: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-110, -230, 220, 24, 12).fill(wood.fill).stroke({ width: 4, color: wood.line }));
  const arm = new Container();
  arm.position.set(0, -215);
  arm.rotation = angle;
  const critter = new Critter(SPECS[friend]);
  critter.alive = false;
  critter.scale.set(0.42);
  critter.position.set(0, 160);
  arm.addChild(
    new Graphics().moveTo(-40, 0).lineTo(-40, 165).moveTo(40, 0).lineTo(40, 165).stroke({ width: 5, color: ROPE }),
    new Graphics().roundRect(-50, 160, 100, 16, 6).fill(wood.fill).stroke({ width: 3, color: wood.line }),
    critter,
  );
  c.addChild(arm);
  const bell = bellArt();
  bell.scale.set(0.7);
  bell.position.set(95, -110);
  c.addChild(bell);
  return c;
}

class SwingIcon extends WigglyIcon {
  private readonly art: Container;
  private t = 0;
  constructor() {
    const c = new Container();
    super(c);
    this.art = swingPicture('bunny', 0.4);
    c.addChild(this.art);
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    const arm = this.art.children[1] as Container;
    arm.rotation = 0.4 * Math.sin(this.t * Math.PI);
  }
}

function sticker(seed: number): Container {
  const kinds: Friend[] = ['bunny', 'duck', 'mouse', 'bear', 'frog'];
  const c = swingPicture(kinds[Math.abs(seed) % kinds.length], 0.35);
  c.scale.set(0.8);
  c.y = 80;
  return c;
}

export const swingPals: GameModule = {
  id: 'swing-pals',
  name: 'Swing Pals',
  titleLine: 'game.swing-pals',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'patterns-of-motion', 'prediction', 'variables'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you pushes; the other says "now!" when the friend comes back. On the rope levels, both guess the rope aloud before tapping.',
  offScreen: 'Tie a sock to a string and swing it short and long: count the swings together. At the playground, push in time and feel it go higher.',
  touchDemo: true,
  hubIcon: () => new SwingIcon(),
  sticker,
  create: (ctx) => new SwingPals(ctx),
};
