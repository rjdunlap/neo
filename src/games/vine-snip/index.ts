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
import { rangeFor } from '../../progress/difficulty';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  alongVine,
  ANCHOR_Y,
  arcAt,
  BAND,
  beat,
  BOARD_H,
  BOARD_W,
  boardOrigin,
  cutBy,
  distToSegment,
  FRIEND_MAX,
  FRIEND_MIN,
  FRIENDS,
  GROW,
  growAt,
  landing,
  LEAF_Y,
  linesFor,
  MOUTH_Y,
  nearestVine,
  pairsOf,
  planFor,
  posAt,
  solvePair,
  startSwing,
  swingFrom,
  TAP_TRAVEL,
  vineSeg,
  windows,
  type FriendKind,
  type Kind,
  type Landing,
  type Line,
  type Pair,
  type Plan,
  type Pt,
  type Swing,
} from './logic';

const COLOR: Record<Kind, ColorName> = { apple: 'red', orange: 'orange', lemon: 'yellow', pear: 'green' };
const NAME: Record<FriendKind, string> = {
  bunny: 'Bunny',
  bear: 'Bear',
  duck: 'Duck',
  pig: 'Pig',
  dog: 'Dog',
  cat: 'Cat',
};
/** Each friend rings its own pentatonic step when it munches. */
const NOTE: Record<FriendKind, number> = { bunny: 5, bear: 6, duck: 7, pig: 8, dog: 9, cat: 10 };
const FRIEND_SCALE = 0.76;
/** A friend's mouth is this far above its feet at `FRIEND_SCALE`. */
const MOUTH_UP = 88 * FRIEND_SCALE;
const FLOAT = 1.2;

type Phase = 'rest' | 'swing' | 'fall' | 'eat' | 'miss' | 'done';
type HangPhase = Exclude<Phase, 'done'> | 'fed';

interface Stroke {
  id: number;
  last: Pt;
  travel: number;
  cutAny: boolean;
}

function fruitArt(kind: Kind): Container {
  return prop(kind, COLOR[kind]);
}

/** One fruit on its vines and the friend it is for (two at level 5). */
interface Hang {
  pair: Pair;
  alive: boolean[];
  swing: Swing | null;
  phase: HangPhase;
  at: Pt;
  fall: { landing: Landing; s: number; friendFrom: number; friendTo: number } | null;
  float: { from: Pt; t0: number; bubble: Graphics | null } | null;
  art: Container;
  friend: Critter;
  stump: Graphics;
  friendX: number;
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
  hangs: Hang[] = [];
  clock = 0;
  glowOn = false;
  private lineMisses = 0;
  private glowCounted = false;
  private stubs: { ax: number; t: number }[] = [];
  private stroke: Stroke | null = null;
  private trail: { x: number; y: number; t: number }[] = [];
  private toldSwing = false;

  private readonly back: Backdrop;
  readonly board = new Container();
  private readonly ground = new Graphics();
  private readonly branch = new Graphics();
  private readonly vinesG = new Graphics();
  private readonly glowG = new Graphics();
  private readonly trailG = new Graphics();
  readonly layer = new Container();
  readonly growBtn = new Container();
  private readonly onCancel = (e: PointerEvent) => {
    if (this.stroke?.id === e.pointerId) {
      this.stroke = null;
      this.trail = [];
    }
  };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.lines = linesFor(this.plan, ctx.rng);
    if (ctx.demo) this.lines.splice(1);
    this.back = ctx.track(
      new Backdrop(
        {
          sky: [0x9fd8f5, 0xe9f7e0],
          hills: [0xb8e3a8, 0x8fcf7f, 0x7cc06c],
          horizon: 0.86,
          clouds: 3,
          sun: true,
          seed: 211,
        },
        ctx.view,
      ),
    );
    for (const o of [this.back, this.board, this.ground, this.branch, this.vinesG, this.glowG, this.trailG])
      o.eventMode = 'none';
    this.board.addChild(this.ground, this.branch, this.vinesG, this.glowG);
    this.layer.eventMode = 'static';
    this.layer.on('pointerdown', (e) => this.down(e));
    this.layer.on('globalpointermove', (e) => this.move(e));
    this.layer.on('pointerup', (e) => this.up(e));
    this.layer.on('pointerupoutside', (e) => this.up(e));
    this.ctx.listen(window, 'pointercancel', this.onCancel, { capture: true });
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
    for (const h of this.hangs) {
      if (h.phase === 'swing' && h.swing) h.at = posAt(h.swing, this.clock);
      if (h.phase === 'fall' && h.fall) this.falling(h, dt);
      if (h.phase === 'miss' && h.float) this.floating(h);
      h.art.position.set(h.at.x, h.at.y);
      if (h.phase === 'swing' || h.phase === 'rest')
        h.art.rotation = h.swing ? (-0.6 * (h.at.x - h.swing.ax)) / h.swing.len : 0;
      h.friend.x = h.friendX;
      h.stump.x = h.friendX;
    }
    this.stubs = this.stubs.filter((s) => this.clock - s.t < 0.8);
    this.drawVines();
    this.drawTrail();
    this.drawGlow();
  }

  destroy() {
    this.stroke = null;
    for (const h of this.hangs) h.fall = null;
  }

  /** The fruit to report and to help with: one in the air first, then a swinging one, then the first still waiting. */
  private get focus(): Hang | undefined {
    const rank: Record<HangPhase, number> = { fall: 0, eat: 0, miss: 0, swing: 1, rest: 2, fed: 3 };
    return [...this.hangs].sort((a, b) => rank[a.phase] - rank[b.phase])[0];
  }

  get phase(): Phase {
    if (this.finished) return 'done';
    const f = this.focus;
    return !f || f.phase === 'fed' ? 'eat' : f.phase;
  }

  get alive(): boolean[] {
    return this.focus?.alive ?? [];
  }

  get swing(): Swing | null {
    return this.focus?.swing ?? null;
  }

  askForHint() {
    if (this.finished || this.busy) return;
    if (!this.canSnip) return void this.say(this.instructLine(), this.vars());
    this.hints++;
    // A fruit swinging or hanging on a vine that cannot feed its friend grows its vines back first.
    if (this.keeps)
      for (const h of this.hangs)
        if (h.phase !== 'fed' && !h.alive[solvePair(h.pair, this.line).keep]) this.regrow(h);
    this.glowOn = true;
    void this.say(
      this.plan.mode === 'snip' || this.plan.mode === 'two'
        ? 'vine-snip.hint-vine'
        : this.keepHint()
          ? 'vine-snip.hint-keep'
          : 'vine-snip.hint',
    );
  }

  /**
   * The ghost finger: at levels 1–2 a swipe across the next vine near its anchor; at 3 a tap near the anchor in the window's
   * middle; at 4–5 a tap on each vine that goes, then the timed tap on the one that stays, one fruit at a time.
   */
  autotouch(): TouchIntent | null {
    if (!this.canSnip || this.stroke) return null;
    const h = this.hangs.find((x) => x.phase === 'rest' || x.phase === 'swing');
    if (!h) return null;
    const plan = solvePair(h.pair, this.line);
    if (this.keeps && !h.alive[plan.keep]) return null;
    const i = plan.order.find((k) => h.alive[k]);
    if (i === undefined) return null;
    const vine = h.pair.fruit.vines[i];
    const p = this.toStage(alongVine(vine, h.at, 0.15));
    if (plan.at !== null && h.swing && i === plan.keep) {
      const at = plan.at;
      const T = beat(h.swing.len);
      const s = h.swing;
      const when = () => {
        if (h.phase !== 'swing' || h.swing !== s) return 'cancel' as const;
        const off = (((this.clock - s.t0 - at) % T) + T) % T;
        return Math.min(off, T - off) < 0.04;
      };
      return { tap: { on: this.ctx.stage, x: p.x, y: p.y }, receiver: this.layer, when };
    }
    if (h.swing || this.keeps) return { tap: { on: this.ctx.stage, x: p.x, y: p.y }, receiver: this.layer };
    return {
      trace: { on: this.ctx.stage, x: p.x - 60, y: p.y + 10 },
      via: [{ on: this.ctx.stage, x: p.x + 60, y: p.y - 10 }],
      receiver: this.layer,
      pause: 0.8,
    };
  }

  /** For scripted checks: the focus fruit (the first fields, as at levels 1–3), then every fruit. */
  get state() {
    const line = this.line;
    const h = this.focus;
    const s = h?.swing ?? null;
    const T = s ? beat(s.len) : 0;
    const one = (x: Hang) => {
      const plan = solvePair(x.pair, line);
      return {
        phase: x.phase,
        alive: [...x.alive],
        keep: plan.keep,
        at: plan.at,
        friend: x.pair.friend,
        fruit: this.toStage(x.at),
        vines: x.pair.fruit.vines.map((v) => this.toStage(alongVine(v, x.at, 0.15))),
        offset: x.swing
          ? (((this.clock - x.swing.t0) % beat(x.swing.len)) + beat(x.swing.len)) % beat(x.swing.len)
          : null,
        beat: x.swing ? beat(x.swing.len) : 0,
      };
    };
    const vine = h?.pair.fruit.vines.find((_, i) => h.alive[i]);
    return {
      level: this.plan.level,
      index: this.index,
      phase: this.phase,
      misses: this.misses,
      hints: this.hints,
      glow: this.glowOn,
      alive: h ? [...h.alive] : [],
      beat: T,
      offset: s ? (((this.clock - s.t0) % T) + T) % T : null,
      at: h ? solvePair(h.pair, line).at : null,
      windows: s && h ? windows(s, h.pair.friend.x) : [],
      vineAt: vine && h ? this.toStage(alongVine(vine, h.at, 0.15)) : null,
      friend: h?.pair.friend,
      fruit: h ? this.toStage(h.at) : null,
      hangs: this.hangs.map(one),
    };
  }

  /* -------------------------------------------------------------------------------------------- */

  /** The current line (the last one once every friend has eaten). */
  private get line(): Line {
    return this.lines[Math.min(this.index, this.lines.length - 1)];
  }

  /** Levels 4–5: the glow shows which vine stays while a fruit still has vines to snip; after that, the golden arc. */
  private keepHint() {
    return this.keeps && this.hangs.some((h) => h.phase !== 'fed' && h.alive.filter(Boolean).length > 1);
  }

  /** Levels 4–5: she chooses the vine that stays. */
  private get keeps() {
    return this.plan.mode === 'keep' || this.plan.mode === 'pair';
  }

  private say(id: string, vars?: LineVars) {
    return this.ctx.say(id as LineId, vars);
  }

  private vars(h = this.focus): LineVars {
    return { friend: h ? NAME[h.pair.friend.kind] : '' };
  }

  private instructLine(): string {
    if (this.plan.mode === 'snip') return 'vine-snip.instruct-snip';
    if (this.plan.mode === 'two')
      return this.alive.filter(Boolean).length === 1 ? 'vine-snip.other' : 'vine-snip.instruct-two';
    if (this.plan.mode === 'keep') return 'vine-snip.instruct-keep';
    if (this.plan.mode === 'pair') return 'vine-snip.instruct-both';
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
    const line = this.line;
    this.lineMisses = 0;
    this.glowCounted = false;
    this.glowOn = false;
    for (const h of this.hangs) {
      h.art.destroy({ children: true });
      this.ctx.untrack(h.friend);
      h.friend.destroy({ children: true });
      h.stump.destroy();
    }
    this.hangs = pairsOf(line).map((pair) => {
      const art = fruitArt(pair.fruit.kind);
      art.eventMode = 'none';
      const friend = this.ctx.track(new Critter(CRITTERS[pair.friend.kind]));
      friend.eventMode = 'none';
      friend.scale.set(FRIEND_SCALE);
      friend.y = MOUTH_Y + MOUTH_UP;
      const stump = new Graphics();
      stump.eventMode = 'none';
      const top = MOUTH_Y + MOUTH_UP;
      stump
        .roundRect(-60, top - 6, 120, BOARD_H - top + 6, 14)
        .fill(wood.fill)
        .stroke({ width: 5, color: wood.line });
      stump
        .ellipse(0, top - 4, 60, 12)
        .fill(wood.light)
        .stroke({ width: 4, color: wood.line });
      const h: Hang = {
        pair,
        alive: [],
        swing: null,
        phase: 'rest',
        at: { ...pair.fruit.rest },
        fall: null,
        float: null,
        art,
        friend,
        stump,
        friendX: pair.friend.x,
      };
      this.rest(h);
      return h;
    });
    this.board.addChild(
      ...this.hangs.map((h) => h.stump),
      ...this.hangs.map((h) => h.friend),
      ...this.hangs.map((h) => h.art),
    );
    this.board.setChildIndex(this.glowG, this.board.children.length - 1);
    this.drawBoard(line);
  }

  /** A fruit back where it hangs, every vine on (a breeze line starts swinging again). */
  private rest(h: Hang) {
    h.alive = h.pair.fruit.vines.map(() => true);
    h.at = { ...h.pair.fruit.rest };
    h.swing = startSwing(this.line);
    if (h.swing) h.swing.t0 = this.clock;
    h.phase = h.swing ? 'swing' : 'rest';
    h.art.rotation = 0;
  }

  private regrow(h: Hang) {
    this.rest(h);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Snipping                                                                                       */
  /* -------------------------------------------------------------------------------------------- */

  private local(e: FederatedPointerEvent): Pt {
    const p = this.board.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  /** Snipping waits while any fruit is in the air, being eaten or floating back. */
  private get canSnip() {
    return (
      !this.busy &&
      !this.finished &&
      this.hangs.every((h) => h.phase === 'rest' || h.phase === 'swing' || h.phase === 'fed')
    );
  }

  /** The vines she can snip now: [fruit, vine] for each live vine of an uneaten fruit. */
  private live(): { h: Hang; i: number }[] {
    return this.hangs.flatMap((h) =>
      h.phase === 'fed' ? [] : h.pair.fruit.vines.flatMap((_, i) => (h.alive[i] ? [{ h, i }] : [])),
    );
  }

  private down(e: FederatedPointerEvent) {
    if (!this.canSnip || this.stroke || palmOnGlass()) return;
    const p = this.local(e);
    this.stroke = { id: e.pointerId, last: p, travel: 0, cutAny: false };
    this.trail = [{ ...this.toStage(p), t: this.clock }];
    // Level 1: a touch anywhere snips the one vine. Otherwise a touch on a vine snips it at once.
    if (this.plan.mode === 'snip') return void this.snip(this.hangs[0], 0, e);
    let best: { h: Hang; i: number } | null = null,
      bd = Infinity;
    for (const c of this.live()) {
      const k = nearestVine(p, [c.h.pair.fruit.vines[c.i]], c.h.at);
      if (k < 0) continue;
      const [a, b] = vineSeg(c.h.pair.fruit.vines[c.i], c.h.at);
      const d = distToSegment(p, a, b);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    if (best) this.snip(best.h, best.i, e);
  }

  private move(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id) return;
    const p = this.local(e);
    const d = Math.hypot(p.x - s.last.x, p.y - s.last.y);
    if (d < 2) return;
    s.travel += d;
    this.trail.push({ ...this.toStage(p), t: this.clock });
    if (this.canSnip) {
      const hit = this.live().filter((c) => cutBy(s.last, p, [c.h.pair.fruit.vines[c.i]], c.h.at).length > 0);
      for (const c of hit) this.snip(c.h, c.i, e);
    }
    s.last = p;
  }

  private up(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id) return;
    this.stroke = null;
    if (!s.cutAny && s.travel < TAP_TRAVEL && this.canSnip) void this.say(this.instructLine(), this.vars());
  }

  snip(h: Hang, i: number, e?: FederatedPointerEvent) {
    if (!this.canSnip || h.phase === 'fed' || !h.alive[i]) return;
    if (this.stroke && e && this.stroke.id === e.pointerId) this.stroke.cutAny = true;
    h.alive[i] = false;
    this.stubs.push({ ax: h.pair.fruit.vines[i].ax, t: this.clock });
    sfx.snip();
    const left = h.pair.fruit.vines.filter((_, k) => h.alive[k]);
    if (this.plan.mode === 'two' || this.plan.mode === 'snip') this.glowOn = false;
    if (left.length >= 2) return;
    if (left.length === 1) {
      if (h.swing) return;
      h.swing = swingFrom(h.at, left[0], this.clock);
      if (h.swing.amp === 0) {
        h.swing = null;
        void this.say('vine-snip.still');
        return;
      }
      h.phase = 'swing';
      sfx.squeak(10);
      if (!this.toldSwing) {
        this.toldSwing = true;
        void this.say('vine-snip.swings').then(() => {
          if (!this.finished && this.plan.mode === 'two' && h.phase === 'swing')
            void this.ctx.instruct('vine-snip.other' as LineId, this.vars(h));
        });
      }
      return;
    }
    this.drop(h);
  }

  private drop(h: Hang) {
    const s = h.swing;
    let l = landing(s, this.clock, h.at, h.pair.friend.x);
    let friendTo = h.pair.friend.x;
    if (this.line.scoot) {
      friendTo = Math.min(FRIEND_MAX, Math.max(FRIEND_MIN, l.x));
      l = landing(s, this.clock, h.at, friendTo);
    }
    h.fall = { landing: l, s: 0, friendFrom: h.friendX, friendTo };
    h.phase = 'fall';
    // At level 5 the glow stays for the other fruit until it is fed too.
    this.glowOn = this.glowOn && this.keeps && this.hangs.some((x) => x !== h && x.phase !== 'fed');
    h.friend.setMood('surprised', l.time + 0.3);
  }

  private falling(h: Hang, dt: number) {
    const f = h.fall!;
    f.s += dt;
    const p = arcAt(f.landing.from, f.landing.v, f.s);
    h.at = p;
    h.art.rotation += dt * 3 * Math.sign(f.landing.v.x || 1);
    const k = Math.min(1, f.s / Math.max(0.2, f.landing.time * 0.85));
    h.friendX = f.friendFrom + (f.friendTo - f.friendFrom) * (1 - (1 - k) * (1 - k));
    if (f.landing.caught && p.y >= MOUTH_Y) void this.munch(h);
    else if (!f.landing.caught && p.y >= LEAF_Y) this.missed(h);
  }

  private async munch(h: Hang) {
    h.phase = 'eat';
    h.fall = null;
    h.art.visible = false;
    sfx.munch();
    sfx.bell(NOTE[h.pair.friend.kind]);
    h.friend.cheer();
    const m = this.toStage({ x: h.friendX, y: MOUTH_Y });
    this.ctx.particles.burst(m.x, m.y, {
      kind: 'star',
      colors: [swatch[COLOR[h.pair.fruit.kind]].light, 0xffffff],
      count: 10,
      speed: [80, 200],
      gravity: 0,
      life: [0.4, 0.8],
    });
    this.busy = true;
    await this.say('vine-snip.munch', this.vars(h));
    if (this.finished) return;
    h.phase = 'fed';
    if (this.hangs.some((x) => x.phase !== 'fed')) {
      this.busy = false;
      return;
    }
    this.index++;
    if (this.index >= this.lines.length) return void this.finale();
    await this.begin();
  }

  private missed(h: Hang) {
    h.phase = 'miss';
    const f = h.fall!;
    h.fall = null;
    sfx.boing();
    this.busy = true;
    if (this.plan.counts) {
      this.misses++;
      this.lineMisses++;
    }
    h.float = { from: { ...h.at }, t0: this.clock, bubble: null };
    // At levels 4–5, a vine that could never reach the friend gets its own reason.
    const straight = this.keeps && !h.swing;
    const wrong = this.keeps && !!h.swing && !windows(h.swing, h.pair.friend.x).length;
    const id = straight
      ? 'vine-snip.straight'
      : wrong
        ? 'vine-snip.wrong-side'
        : f.landing.side === 'late'
          ? 'vine-snip.late'
          : 'vine-snip.early';
    void this.say(id, this.vars(h));
  }

  /** A missed fruit bounces once on the leaf, then floats back up on a bubble and its vines grow back. */
  private floating(h: Hang) {
    const fl = h.float!;
    const t = this.clock - fl.t0;
    const bounce = 0.35;
    if (t < bounce) {
      h.at = { x: fl.from.x, y: fl.from.y - 40 * Math.sin((Math.PI * t) / bounce) };
      return;
    }
    if (!fl.bubble) {
      fl.bubble = new Graphics()
        .circle(0, 0, 62)
        .fill({ color: 0xffffff, alpha: 0.25 })
        .stroke({ width: 4, color: 0xffffff, alpha: 0.8 });
      h.art.addChild(fl.bubble);
      h.art.rotation = 0;
    }
    const k = Math.min(1, (t - bounce) / FLOAT);
    const e = k * k * (3 - 2 * k);
    const rest = h.pair.fruit.rest;
    h.at = { x: fl.from.x + (rest.x - fl.from.x) * e, y: fl.from.y + (rest.y - fl.from.y) * e };
    if (k < 1) return;
    fl.bubble.destroy();
    h.float = null;
    this.rest(h);
    this.busy = false;
    if (this.plan.counts && this.lineMisses >= 2 && !this.glowCounted) {
      this.glowCounted = true;
      this.glowOn = true;
      this.hints++;
      void this.say(this.keepHint() ? 'vine-snip.hint-keep' : 'vine-snip.hint');
    }
  }

  private growBack() {
    if (!this.canSnip || this.plan.level < 3) return;
    for (const h of this.hangs) if (h.phase !== 'fed') this.regrow(h);
    sfx.sparkle();
    void this.say('vine-snip.grow');
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
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
    b.roundRect(-30, ANCHOR_Y - 22, BOARD_W + 60, 34, 17)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    for (let x = 10; x < BOARD_W; x += 70)
      b.ellipse(x, ANCHOR_Y - 26, 30, 15)
        .fill(swatch.green.fill)
        .stroke({ width: 3, color: swatch.green.line });
    for (const p of pairsOf(line))
      for (const v of p.fruit.vines)
        b.circle(v.ax, ANCHOR_Y, 12).fill(wood.light).stroke({ width: 4, color: wood.line });
  }

  private drawVines() {
    const g = this.vinesG.clear();
    for (const h of this.hangs) {
      if (h.phase !== 'rest' && h.phase !== 'swing') continue;
      h.pair.fruit.vines.forEach((v, i) => {
        if (!h.alive[i]) return;
        const a = { x: v.ax, y: ANCHOR_Y };
        const f = h.at;
        // A slight cosmetic sag; the rules treat the vine as straight.
        const mx = (a.x + f.x) / 2 + 6,
          my = (a.y + f.y) / 2 + 8;
        g.moveTo(a.x, a.y)
          .quadraticCurveTo(mx, my, f.x, f.y - 30)
          .stroke({ width: 9, color: swatch.green.line, cap: 'round' });
        g.moveTo(a.x, a.y)
          .quadraticCurveTo(mx, my, f.x, f.y - 30)
          .stroke({ width: 4, color: swatch.green.fill, cap: 'round' });
        for (const k of [0.3, 0.62]) {
          const p = alongVine(v, f, k);
          g.ellipse(p.x + 10, p.y, 12, 6).fill(swatch.green.fill);
        }
      });
    }
    for (const s of this.stubs) {
      const k = (this.clock - s.t) / 0.8;
      g.moveTo(s.ax, ANCHOR_Y)
        .lineTo(s.ax + 8 * Math.sin(k * 12), ANCHOR_Y + 40)
        .stroke({ width: 7, color: swatch.green.line, alpha: 1 - k, cap: 'round' });
    }
  }

  private drawGlow() {
    const g = this.glowG.clear();
    if (!this.glowOn) return;
    const pulse = 0.55 + 0.35 * Math.sin(this.clock * 6);
    for (const h of this.hangs) {
      if (h.phase !== 'rest' && h.phase !== 'swing') continue;
      const vineGlow = (i: number, color: number, alpha = pulse * 0.6) => {
        const v = h.pair.fruit.vines[i];
        g.moveTo(v.ax, ANCHOR_Y).lineTo(h.at.x, h.at.y).stroke({ width: 26, color, alpha, cap: 'round' });
      };
      if (this.plan.mode === 'snip' || this.plan.mode === 'two') {
        const i = h.alive.findIndex((a) => a);
        if (i >= 0) vineGlow(i, swatch.yellow.fill);
        return;
      }
      const keep = solvePair(h.pair, this.line).keep;
      if (this.keeps && !h.alive[keep]) continue;
      // Levels 4–5: the vine to keep glows yellow and the ones to snip orange, until only it is left.
      if (this.keeps && h.alive.some((a, i) => a && i !== keep)) {
        h.alive.forEach(
          (a, i) => a && vineGlow(i, i === keep ? swatch.yellow.fill : swatch.orange.line, pulse * 0.85),
        );
        continue;
      }
      const s = h.swing;
      if (!s) continue;
      // The swing's dotted arc, with a golden stretch where a snip lands in the friend's mouth.
      const T = beat(s.len);
      for (let t = 0; t <= T / 2; t += T / 60) {
        const p = posAt(s, s.t0 + t);
        g.circle(p.x, p.y, 6).fill({ color: 0xffffff, alpha: 0.8 });
      }
      for (const [a, b] of windows(s, h.pair.friend.x)) {
        for (let t = a; t <= b; t += 0.02) {
          const p = posAt(s, s.t0 + t);
          g.circle(p.x, p.y, 13).fill({ color: swatch.yellow.fill, alpha: pulse });
        }
      }
      g.roundRect(h.pair.friend.x - BAND / 2, MOUTH_Y - 8, BAND, 16, 8).fill({
        color: swatch.yellow.light,
        alpha: pulse * 0.6,
      });
    }
  }

  private drawTrail() {
    const g = this.trailG.clear();
    this.trail = this.trail.filter((p) => this.clock - p.t < 0.3);
    if (this.trail.length === 1)
      g.circle(this.trail[0].x, this.trail[0].y, 12).fill({ color: 0xffffff, alpha: 0.9 });
    for (let i = 1; i < this.trail.length; i++) {
      const p = this.trail[i - 1],
        q = this.trail[i];
      const a = 1 - (this.clock - q.t) / 0.3;
      g.moveTo(p.x, p.y)
        .lineTo(q.x, q.y)
        .stroke({ width: 4 + 12 * a, color: 0xffffff, alpha: 0.85 * a, cap: 'round' });
    }
  }

  private drawGrow() {
    const g = new Graphics();
    g.circle(0, 0, GROW / 2)
      .fill(swatch.green.light)
      .stroke({ width: 6, color: swatch.green.line });
    // A curling vine with a leaf: grow back.
    g.arc(0, 4, 26, Math.PI * 0.9, Math.PI * 2.3).stroke({
      width: 8,
      color: swatch.green.line,
      cap: 'round',
    });
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
    const mouth = new Graphics()
      .ellipse(-10, -10, 34, 20)
      .fill(0x7a2e3e)
      .stroke({ width: 5, color: 0x2b2b3a });
    c.addChild(mouth);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kind = rng.pick(['apple', 'orange', 'lemon', 'pear'] as Kind[]);
  const fk = rng.pick(FRIENDS);
  const c = new Container();
  c.addChild(
    new Graphics().circle(0, 0, 80).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line }),
  );
  const vine = new Graphics()
    .moveTo(rng.range(-30, 30), -78)
    .lineTo(0, -46)
    .stroke({ width: 6, color: swatch.green.line, cap: 'round' });
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
    toddler:
      'Hold a soft toy by its arm over a laundry basket and let her say "snip!" for you to let go. Then swing it first and let go again.',
  },
  hubIcon: () => new VineIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new VineSnip(ctx),
};
