import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  alongVine, ANCHOR_Y, arcAt, BAND, beat, BOARD_H, BOARD_W, boardOrigin, cutBy, FRIEND_MAX, FRIEND_MIN, FRIENDS, GROW, growAt, landing, LEAF_Y, linesFor,
  MOUTH_Y, nearestVine, planFor, posAt, solve, startSwing, swingFrom, TAP_TRAVEL, windows,
  type FriendKind, type Kind, type Landing, type Line, type Plan, type Pt, type Swing,
} from './logic';

/** Slice 1 builds levels 1–3; slice 2 widens pre-K and school to 4–5. */
const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 3 },
};

const COLOR: Record<Kind, ColorName> = { apple: 'red', orange: 'orange', lemon: 'yellow', pear: 'green' };
const NAME: Record<FriendKind, string> = { bunny: 'Bunny', bear: 'Bear', duck: 'Duck', pig: 'Pig', dog: 'Dog', cat: 'Cat' };
/** Each friend rings its own pentatonic step when it munches. */
const NOTE: Record<FriendKind, number> = { bunny: 5, bear: 6, duck: 7, pig: 8, dog: 9, cat: 10 };
const FRIEND_SCALE = 0.76;
/** A friend's mouth is this far above its feet at `FRIEND_SCALE`. */
const MOUTH_UP = 88 * FRIEND_SCALE;
const FLOAT = 1.2;

type Phase = 'rest' | 'swing' | 'fall' | 'eat' | 'miss' | 'done';

interface Stroke { id: number; last: Pt; travel: number; cutAny: boolean }

function fruitArt(kind: Kind): Container {
  return prop(kind, COLOR[kind]);
}

class VineSnip implements Game {
  readonly plan: Plan;
  readonly hintLabel = 'Show a hint';
  misses = 0;
  hints = 0;
  finished = false;
  busy = true;

  readonly lines: Line[];
  index = 0;
  phase: Phase = 'rest';
  /** Which of the current fruit's vines are still on. */
  alive: boolean[] = [];
  swing: Swing | null = null;
  clock = 0;
  glowOn = false;
  private lineMisses = 0;
  private glowCounted = false;
  private fall: { landing: Landing; s: number; friendFrom: number; friendTo: number } | null = null;
  private fruitAt: Pt = { x: 0, y: 0 };
  private friendX = 0;
  private stubs: { ax: number; t: number }[] = [];
  private stroke: Stroke | null = null;
  private trail: { x: number; y: number; t: number }[] = [];
  private toldSwing = false;
  private float: { from: Pt; t0: number; bubble: Graphics | null } | null = null;

  private readonly back: Backdrop;
  readonly board = new Container();
  private readonly ground = new Graphics();
  private readonly branch = new Graphics();
  private readonly vinesG = new Graphics();
  private readonly glowG = new Graphics();
  private readonly trailG = new Graphics();
  readonly layer = new Container();
  readonly growBtn = new Container();
  private fruit: Container = new Container();
  private friend: Critter | null = null;
  private readonly stump = new Graphics();
  private readonly onCancel = (e: PointerEvent) => {
    if (this.stroke?.id === e.pointerId) { this.stroke = null; this.trail = []; }
  };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.lines = linesFor(this.plan, ctx.rng);
    if (ctx.demo) this.lines.splice(1);
    this.back = ctx.track(new Backdrop({ sky: [0x9fd8f5, 0xe9f7e0], hills: [0xb8e3a8, 0x8fcf7f, 0x7cc06c], horizon: 0.86, clouds: 3, sun: true, seed: 211 }, ctx.view));
    for (const o of [this.back, this.board, this.ground, this.branch, this.vinesG, this.glowG, this.trailG, this.stump]) o.eventMode = 'none';
    this.board.addChild(this.ground, this.stump, this.branch, this.vinesG, this.glowG);
    this.layer.eventMode = 'static';
    this.layer.on('pointerdown', (e) => this.down(e));
    this.layer.on('globalpointermove', (e) => this.move(e));
    this.layer.on('pointerup', (e) => this.up(e));
    this.layer.on('pointerupoutside', (e) => this.up(e));
    window.addEventListener('pointercancel', this.onCancel, { capture: true });
    this.drawGrow();
    onTap(this.growBtn, () => this.growBack(), { cooldown: 500 });
    this.growBtn.visible = this.plan.level >= 3;
    ctx.stage.addChild(this.back, this.board, this.layer, this.trailG, this.growBtn);
    this.resize(ctx.view);
  }

  start() {
    void this.begin();
  }

  resize(v: View) {
    this.back.resize(v);
    const o = boardOrigin(v);
    this.board.position.set(o.x, o.y);
    this.layer.hitArea = new Rectangle(0, 0, v.w, v.h);
    const g = growAt(v);
    this.growBtn.position.set(g.x, g.y);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.phase === 'swing' && this.swing) this.fruitAt = posAt(this.swing, this.clock);
    if (this.phase === 'fall' && this.fall) this.falling(dt);
    if (this.phase === 'miss' && this.float) this.floating();
    this.fruit.position.set(this.fruitAt.x, this.fruitAt.y);
    if (this.phase === 'swing' || this.phase === 'rest') this.fruit.rotation = this.swing ? -0.6 * (this.fruitAt.x - this.swing.ax) / this.swing.len : 0;
    if (this.friend) this.friend.x = this.friendX;
    this.stump.x = this.friendX;
    this.stubs = this.stubs.filter((s) => this.clock - s.t < 0.8);
    this.drawVines();
    this.drawTrail();
    this.drawGlow();
  }

  destroy() {
    window.removeEventListener('pointercancel', this.onCancel, { capture: true });
    this.stroke = null;
    this.fall = null;
  }

  askForHint() {
    if (this.finished || this.busy) return;
    if (this.phase !== 'rest' && this.phase !== 'swing') return void this.say(this.instructLine(), this.vars());
    this.hints++;
    this.glowOn = true;
    void this.say(this.plan.mode === 'wait' ? 'vine-snip.hint' : 'vine-snip.hint-vine');
  }

  /** The ghost finger: at levels 1–2 a swipe across the next vine near its anchor; at 3 a tap near the anchor in the window's middle. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.stroke || (this.phase !== 'rest' && this.phase !== 'swing')) return null;
    const i = this.alive.findIndex((a) => a);
    if (i < 0) return null;
    const line = this.lines[this.index];
    const vine = line.fruit.vines[i];
    const p = this.toStage(alongVine(vine, this.fruitAt, 0.15));
    if (this.plan.mode === 'wait' && this.swing) {
      const at = solve(line).at!;
      const T = beat(this.swing.len);
      const s = this.swing;
      const when = () => {
        if (this.phase !== 'swing' || this.swing !== s) return 'cancel' as const;
        const off = (((this.clock - s.t0 - at) % T) + T) % T;
        return Math.min(off, T - off) < 0.04;
      };
      return { tap: { on: this.ctx.stage, x: p.x, y: p.y }, receiver: this.layer, when };
    }
    if (this.swing) return { tap: { on: this.ctx.stage, x: p.x, y: p.y }, receiver: this.layer };
    return { trace: { on: this.ctx.stage, x: p.x - 60, y: p.y + 10 }, via: [{ on: this.ctx.stage, x: p.x + 60, y: p.y - 10 }], receiver: this.layer, pause: 0.8 };
  }

  /** For scripted checks. */
  get state() {
    const line = this.lines[this.index];
    const s = this.swing;
    const T = s ? beat(s.len) : 0;
    const vine = line?.fruit.vines.find((_, i) => this.alive[i]);
    return {
      level: this.plan.level, index: this.index, phase: this.phase, misses: this.misses, hints: this.hints, glow: this.glowOn,
      alive: [...this.alive], beat: T, offset: s ? (((this.clock - s.t0) % T) + T) % T : null, at: line ? solve(line).at : null,
      windows: s ? windows(s, line.friend.x) : [], vineAt: vine ? this.toStage(alongVine(vine, this.fruitAt, 0.15)) : null,
      friend: line?.friend, fruit: this.toStage(this.fruitAt),
    };
  }

  /* -------------------------------------------------------------------------------------------- */

  private say(id: string, vars?: LineVars) {
    return this.ctx.say(id as LineId, vars);
  }

  private vars(): LineVars {
    const l = this.lines[this.index];
    return { friend: l ? NAME[l.friend.kind] : '' };
  }

  private instructLine(): string {
    if (this.plan.mode === 'snip') return 'vine-snip.instruct-snip';
    if (this.plan.mode === 'two') return this.alive.filter(Boolean).length === 1 ? 'vine-snip.other' : 'vine-snip.instruct-two';
    return 'vine-snip.instruct-wait';
  }

  private toStage(p: Pt): Pt {
    return { x: this.board.x + p.x, y: this.board.y + p.y };
  }

  private async begin() {
    this.busy = true;
    this.setUpLine();
    this.busy = false;
    await this.ctx.instruct(this.instructLine() as LineId, this.vars());
  }

  private setUpLine() {
    const line = this.lines[this.index];
    this.alive = line.fruit.vines.map(() => true);
    this.lineMisses = 0;
    this.glowCounted = false;
    this.glowOn = false;
    this.fall = null;
    this.fruitAt = { ...line.fruit.rest };
    this.friendX = line.friend.x;
    this.swing = startSwing(line);
    if (this.swing) this.swing.t0 = this.clock;
    this.phase = this.swing ? 'swing' : 'rest';
    this.fruit.destroy({ children: true });
    this.fruit = fruitArt(line.fruit.kind);
    this.fruit.eventMode = 'none';
    if (this.friend) {
      this.ctx.untrack(this.friend);
      this.friend.destroy({ children: true });
    }
    this.friend = this.ctx.track(new Critter(CRITTERS[line.friend.kind]));
    this.friend.eventMode = 'none';
    this.friend.scale.set(FRIEND_SCALE);
    this.friend.y = MOUTH_Y + MOUTH_UP;
    this.board.addChild(this.friend, this.fruit);
    this.board.setChildIndex(this.glowG, this.board.children.length - 1);
    this.drawBoard(line);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Snipping                                                                                       */
  /* -------------------------------------------------------------------------------------------- */

  private local(e: FederatedPointerEvent): Pt {
    const p = this.board.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  private get canSnip() {
    return !this.busy && !this.finished && (this.phase === 'rest' || this.phase === 'swing');
  }

  private down(e: FederatedPointerEvent) {
    if (!this.canSnip || this.stroke || palmOnGlass()) return;
    const p = this.local(e);
    this.stroke = { id: e.pointerId, last: p, travel: 0, cutAny: false };
    this.trail = [{ ...this.toStage(p), t: this.clock }];
    // Level 1: a touch anywhere snips the one vine. Otherwise a touch on a vine snips it at once.
    if (this.plan.mode === 'snip') return void this.snip(0, e);
    const i = nearestVine(p, this.liveOnly(), this.fruitAt);
    if (i >= 0) this.snip(this.liveIndex(i), e);
  }

  private liveOnly() {
    return this.lines[this.index].fruit.vines.filter((_, i) => this.alive[i]);
  }

  private liveIndex(k: number) {
    let n = -1;
    for (let i = 0; i < this.alive.length; i++) if (this.alive[i] && ++n === k) return i;
    return -1;
  }

  private move(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id) return;
    const p = this.local(e);
    const d = Math.hypot(p.x - s.last.x, p.y - s.last.y);
    if (d < 2) return;
    s.travel += d;
    this.trail.push({ ...this.toStage(p), t: this.clock });
    if (this.canSnip) for (const k of cutBy(s.last, p, this.liveOnly(), this.fruitAt).map((k) => this.liveIndex(k)).filter((i) => i >= 0)) this.snip(k, e);
    s.last = p;
  }

  private up(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id) return;
    this.stroke = null;
    if (!s.cutAny && s.travel < TAP_TRAVEL && this.canSnip) void this.say(this.instructLine(), this.vars());
  }

  snip(i: number, e?: FederatedPointerEvent) {
    if (!this.canSnip || !this.alive[i]) return;
    if (this.stroke && e && this.stroke.id === e.pointerId) this.stroke.cutAny = true;
    const line = this.lines[this.index];
    this.alive[i] = false;
    this.stubs.push({ ax: line.fruit.vines[i].ax, t: this.clock });
    sfx.snip();
    const left = line.fruit.vines.filter((_, k) => this.alive[k]);
    if (this.plan.mode === 'two' || this.plan.mode === 'snip') this.glowOn = false;
    if (left.length >= 2) return;
    if (left.length === 1) {
      if (this.swing) return;
      this.swing = swingFrom(this.fruitAt, left[0], this.clock);
      if (this.swing.amp === 0) {
        this.swing = null;
        void this.say('vine-snip.still');
        return;
      }
      this.phase = 'swing';
      sfx.squeak(10);
      if (!this.toldSwing) {
        this.toldSwing = true;
        void this.say('vine-snip.swings').then(() => {
          if (!this.finished && this.phase === 'swing') void this.ctx.instruct('vine-snip.other' as LineId, this.vars());
        });
      }
      return;
    }
    this.drop();
  }

  private drop() {
    const line = this.lines[this.index];
    const s = this.swing;
    let l = landing(s, this.clock, this.fruitAt, line.friend.x);
    let friendTo = line.friend.x;
    if (line.scoot) {
      friendTo = Math.min(FRIEND_MAX, Math.max(FRIEND_MIN, l.x));
      l = landing(s, this.clock, this.fruitAt, friendTo);
    }
    this.fall = { landing: l, s: 0, friendFrom: this.friendX, friendTo };
    this.phase = 'fall';
    this.glowOn = false;
    this.friend?.setMood('surprised', l.time + 0.3);
  }

  private falling(dt: number) {
    const f = this.fall!;
    f.s += dt;
    const p = arcAt(f.landing.from, f.landing.v, f.s);
    this.fruitAt = p;
    this.fruit.rotation += dt * 3 * Math.sign(f.landing.v.x || 1);
    const k = Math.min(1, f.s / Math.max(0.2, f.landing.time * 0.85));
    this.friendX = f.friendFrom + (f.friendTo - f.friendFrom) * (1 - (1 - k) * (1 - k));
    if (f.landing.caught && p.y >= MOUTH_Y) void this.munch();
    else if (!f.landing.caught && p.y >= LEAF_Y) this.missed();
  }

  private async munch() {
    this.phase = 'eat';
    this.fall = null;
    const line = this.lines[this.index];
    this.fruit.visible = false;
    sfx.munch();
    sfx.bell(NOTE[line.friend.kind]);
    this.friend?.cheer();
    const m = this.toStage({ x: this.friendX, y: MOUTH_Y });
    this.ctx.particles.burst(m.x, m.y, { kind: 'star', colors: [swatch[COLOR[line.fruit.kind]].light, 0xffffff], count: 10, speed: [80, 200], gravity: 0, life: [0.4, 0.8] });
    this.busy = true;
    await this.say('vine-snip.munch', this.vars());
    if (this.finished) return;
    this.index++;
    if (this.index >= this.lines.length) return void this.finale();
    this.fruit.visible = true;
    await this.begin();
  }

  private missed() {
    this.phase = 'miss';
    const f = this.fall!;
    this.fall = null;
    sfx.boing();
    this.busy = true;
    if (this.plan.counts) {
      this.misses++;
      this.lineMisses++;
    }
    this.float = { from: { ...this.fruitAt }, t0: this.clock, bubble: null };
    void this.say(f.landing.side === 'late' ? 'vine-snip.late' : 'vine-snip.early', this.vars());
  }

  /** A missed fruit bounces once on the leaf, then floats back up on a bubble and its vines grow back. */
  private floating() {
    const fl = this.float!;
    const line = this.lines[this.index];
    const t = this.clock - fl.t0;
    const bounce = 0.35;
    if (t < bounce) {
      this.fruitAt = { x: fl.from.x, y: fl.from.y - 40 * Math.sin((Math.PI * t) / bounce) };
      return;
    }
    if (!fl.bubble) {
      fl.bubble = new Graphics().circle(0, 0, 62).fill({ color: 0xffffff, alpha: 0.25 }).stroke({ width: 4, color: 0xffffff, alpha: 0.8 });
      this.fruit.addChild(fl.bubble);
      this.fruit.rotation = 0;
    }
    const k = Math.min(1, (t - bounce) / FLOAT);
    const e = k * k * (3 - 2 * k);
    const rest = line.fruit.rest;
    this.fruitAt = { x: fl.from.x + (rest.x - fl.from.x) * e, y: fl.from.y + (rest.y - fl.from.y) * e };
    if (k < 1) return;
    fl.bubble.destroy();
    this.float = null;
    this.alive = line.fruit.vines.map(() => true);
    this.swing = startSwing(line);
    if (this.swing) this.swing.t0 = this.clock;
    this.phase = this.swing ? 'swing' : 'rest';
    this.busy = false;
    if (this.plan.counts && this.lineMisses >= 2 && !this.glowCounted) {
      this.glowCounted = true;
      this.glowOn = true;
      this.hints++;
      void this.say('vine-snip.hint');
    }
  }

  private growBack() {
    if (!this.canSnip || this.plan.level < 3) return;
    const line = this.lines[this.index];
    this.alive = line.fruit.vines.map(() => true);
    this.fruitAt = { ...line.fruit.rest };
    this.swing = startSwing(line);
    if (this.swing) this.swing.t0 = this.clock;
    this.phase = this.swing ? 'swing' : 'rest';
    sfx.sparkle();
    void this.say('vine-snip.grow');
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.phase = 'done';
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.say('vine-snip.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Drawing                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  private drawBoard(line: Line) {
    const g = this.ground.clear();
    // The big leaf ground and the grass.
    g.roundRect(-10, LEAF_Y - 20, BOARD_W + 20, BOARD_H - LEAF_Y + 20, 40).fill(0x8fcf7f);
    g.ellipse(BOARD_W / 2, LEAF_Y + 4, BOARD_W / 2 - 10, 26).fill(swatch.green.light);
    const b = this.branch.clear();
    b.roundRect(-30, ANCHOR_Y - 22, BOARD_W + 60, 34, 17).fill(wood.fill).stroke({ width: 6, color: wood.line });
    for (let x = 10; x < BOARD_W; x += 70) b.ellipse(x, ANCHOR_Y - 26, 30, 15).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    for (const v of line.fruit.vines) b.circle(v.ax, ANCHOR_Y, 12).fill(wood.light).stroke({ width: 4, color: wood.line });
    const st = this.stump.clear();
    const top = MOUTH_Y + MOUTH_UP;
    st.roundRect(-60, top - 6, 120, BOARD_H - top + 6, 14).fill(wood.fill).stroke({ width: 5, color: wood.line });
    st.ellipse(0, top - 4, 60, 12).fill(wood.light).stroke({ width: 4, color: wood.line });
  }

  private drawVines() {
    const g = this.vinesG.clear();
    const line = this.lines[this.index];
    if (!line) return;
    if (this.phase === 'rest' || this.phase === 'swing') {
      line.fruit.vines.forEach((v, i) => {
        if (!this.alive[i]) return;
        const a = { x: v.ax, y: ANCHOR_Y };
        const f = this.fruitAt;
        // A slight cosmetic sag; the rules treat the vine as straight.
        const mx = (a.x + f.x) / 2 + 6, my = (a.y + f.y) / 2 + 8;
        g.moveTo(a.x, a.y).quadraticCurveTo(mx, my, f.x, f.y - 30).stroke({ width: 9, color: swatch.green.line, cap: 'round' });
        g.moveTo(a.x, a.y).quadraticCurveTo(mx, my, f.x, f.y - 30).stroke({ width: 4, color: swatch.green.fill, cap: 'round' });
        for (const k of [0.3, 0.62]) {
          const p = alongVine(v, f, k);
          g.ellipse(p.x + 10, p.y, 12, 6).fill(swatch.green.fill);
        }
      });
    }
    for (const s of this.stubs) {
      const k = (this.clock - s.t) / 0.8;
      g.moveTo(s.ax, ANCHOR_Y).lineTo(s.ax + 8 * Math.sin(k * 12), ANCHOR_Y + 40).stroke({ width: 7, color: swatch.green.line, alpha: 1 - k, cap: 'round' });
    }
  }

  private drawGlow() {
    const g = this.glowG.clear();
    if (!this.glowOn || (this.phase !== 'rest' && this.phase !== 'swing')) return;
    const line = this.lines[this.index];
    const pulse = 0.55 + 0.35 * Math.sin(this.clock * 6);
    if (this.plan.mode !== 'wait' || !this.swing) {
      const i = this.alive.findIndex((a) => a);
      if (i < 0) return;
      const v = line.fruit.vines[i];
      g.moveTo(v.ax, ANCHOR_Y).lineTo(this.fruitAt.x, this.fruitAt.y).stroke({ width: 26, color: swatch.yellow.fill, alpha: pulse * 0.6, cap: 'round' });
      return;
    }
    // The swing's dotted arc, with a golden stretch where a snip lands in the friend's mouth.
    const s = this.swing;
    const T = beat(s.len);
    for (let t = 0; t <= T / 2; t += T / 60) {
      const p = posAt(s, s.t0 + t);
      g.circle(p.x, p.y, 6).fill({ color: 0xffffff, alpha: 0.8 });
    }
    for (const [a, b] of windows(s, line.friend.x)) {
      for (let t = a; t <= b; t += 0.02) {
        const p = posAt(s, s.t0 + t);
        g.circle(p.x, p.y, 13).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
    }
    g.roundRect(line.friend.x - BAND / 2, MOUTH_Y - 8, BAND, 16, 8).fill({ color: swatch.yellow.light, alpha: pulse * 0.6 });
  }

  private drawTrail() {
    const g = this.trailG.clear();
    this.trail = this.trail.filter((p) => this.clock - p.t < 0.3);
    if (this.trail.length === 1) g.circle(this.trail[0].x, this.trail[0].y, 12).fill({ color: 0xffffff, alpha: 0.9 });
    for (let i = 1; i < this.trail.length; i++) {
      const p = this.trail[i - 1], q = this.trail[i];
      const a = 1 - (this.clock - q.t) / 0.3;
      g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: 4 + 12 * a, color: 0xffffff, alpha: 0.85 * a, cap: 'round' });
    }
  }

  private drawGrow() {
    const g = new Graphics();
    g.circle(0, 0, GROW / 2).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line });
    // A curling vine with a leaf: grow back.
    g.arc(0, 4, 26, Math.PI * 0.9, Math.PI * 2.3).stroke({ width: 8, color: swatch.green.line, cap: 'round' });
    g.ellipse(18, -24, 16, 9).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.poly([-30, -2, -18, 14, -40, 14]).fill(swatch.green.line);
    this.growBtn.addChild(g);
    this.growBtn.hitArea = new Rectangle(-GROW / 2, -GROW / 2, GROW, GROW);
  }
}

class VineIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.roundRect(-80, -210, 160, 22, 11).fill(wood.fill).stroke({ width: 5, color: wood.line });
    g.moveTo(-10, -196).lineTo(-10, -150).stroke({ width: 7, color: swatch.green.line, cap: 'round' });
    g.moveTo(-10, -132).lineTo(-10, -120).stroke({ width: 7, color: swatch.green.line, cap: 'round' });
    g.moveTo(-26, -150).lineTo(8, -132).stroke({ width: 4, color: 0xffffff, cap: 'round' });
    c.addChild(g);
    const apple = fruitArt('apple');
    apple.scale.set(0.55);
    apple.position.set(-10, -88);
    c.addChild(apple);
    const mouth = new Graphics().ellipse(-10, -10, 34, 20).fill(0x7a2e3e).stroke({ width: 5, color: 0x2b2b3a });
    c.addChild(mouth);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kind = rng.pick(['apple', 'orange', 'lemon', 'pear'] as Kind[]);
  const fk = rng.pick(FRIENDS);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line }));
  const vine = new Graphics().moveTo(rng.range(-30, 30), -78).lineTo(0, -46).stroke({ width: 6, color: swatch.green.line, cap: 'round' });
  c.addChild(vine);
  const friend = new Critter(CRITTERS[fk]);
  friend.alive = false;
  friend.scale.set(0.42);
  friend.position.set(0, 74);
  c.addChild(friend);
  const fruit = fruitArt(kind);
  fruit.scale.set(0.4);
  fruit.position.set(0, -26);
  c.addChild(fruit);
  return c;
}

export const vineSnip: GameModule = {
  id: 'vine-snip',
  name: 'Vine Snip',
  titleLine: 'game.vine-snip',
  region: 'tinker-lab',
  challenge: 'hands',
  skills: ['cause-and-effect', 'patterns-of-motion', 'prediction', 'planning'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you says "now!" when the fruit swings toward the friend; the other snips.',
  offScreen: {
    all: 'Hang a sock from a string, swing it, and let go at different moments over a laundry basket. Then hold it by two strings and let one go.',
    lap: 'Hold a soft toy up high, say "snip!" and let it drop into her lap or onto a cushion.',
    toddler: 'Hold a soft toy by its arm over a laundry basket and let her say "snip!" for you to let go. Then swing it first and let go again.',
  },
  hubIcon: () => new VineIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new VineSnip(ctx),
};
