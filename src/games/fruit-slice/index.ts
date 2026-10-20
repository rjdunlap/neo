import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  arcAt, basketAt, boardOrigin, boardsFor, bowlAt, BOWL_R, distToSegment, GAP, HANG, hanging, hintLineFor, HIT_R, inBowl, insideLength, judgeStroke,
  left, LINE_CANCEL, lineHits, makeToss, met, MIN_TRAVEL, nextKind, pairBoard, pairHint, planFor, RISE, signAt, SIGN_W, signsFor,
  type Board, type Kind, type Line, type Plan, type Pt, type Refusal, type Sign, type Toss,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 8 },
};

const COLOR: Record<Kind, ColorName> = {
  apple: 'red', orange: 'orange', lemon: 'yellow', pear: 'green', blueberries: 'blue', grapes: 'purple', balloon: 'pink', flower: 'pink',
};
/** The fruit art is drawn about 100 across; this makes it about 110. */
const ART = 1.1;
/** Seconds between the columns' first tosses, so fruit arrive one after another. */
const STAGGER = 1.3;
const TRAIL_LIFE = 0.3;

/** A fruit drawn on (0, 0), about 110 units across. */
function fruitArt(kind: Kind): Container {
  const c = prop(kind, COLOR[kind]);
  c.scale.set(ART);
  return c;
}

/** One half of a fruit, cut along `angle`: the art behind a half-plane mask. */
function halfArt(kind: Kind, angle: number, side: 1 | -1): Container {
  const c = new Container();
  const art = fruitArt(kind);
  const mask = new Graphics().rect(-90, side > 0 ? 0 : -90, 180, 90).fill(0xffffff);
  mask.rotation = angle;
  art.mask = mask;
  c.addChild(art, mask);
  return c;
}

interface Flyer {
  toss: Toss;
  t: number;
  node: Container;
  /** Pushed aside by a refused cut. */
  dx: number;
  gone: boolean;
  wobble: number;
}

interface Still {
  at: Pt;
  kind: Kind;
  node: Container;
  cut: boolean;
  wobble: number;
  phase: number;
}

interface Stroke {
  id: number;
  start: Pt;
  last: Pt;
  /** Total movement, for the still-tap rule. */
  travel: number;
  /** Travel inside each fruit's circle this stroke. */
  inside: Map<object, number>;
  /** Fruit this stroke has already cut or bounced. */
  done: Set<object>;
  missed: boolean;
  cutAny: boolean;
  /** A fruit the touch went down on (for the still tap). */
  downOn: Flyer | null;
}

class FruitSlice implements Game {
  readonly plan: Plan;
  readonly hintLabel = 'Show a hint';
  misses = 0;
  hints = 0;
  finished = false;
  busy = true;

  private signs: Sign[];
  private boards: Board[] = [];
  private index = 0;
  private flyers: Flyer[] = [];
  private stills: Still[] = [];
  private board: Board | null = null;
  /** Each column's seconds until its next toss (−1 while one is aloft). */
  private wait: number[] = [];
  private tossed = 0;
  private slices = 0;
  private signMisses = 0;
  private glow: { kind: 'fruit' | 'bowl' | 'line'; line?: Line } | null = null;
  private stroke: Stroke | null = null;
  private trail: { x: number; y: number; t: number }[] = [];
  private clock = 0;
  private shownSwipe = false;
  private arrowFor: { at: Pt; t: number } | null = null;

  private readonly back: Backdrop;
  private readonly fruitLayer = new Container();
  private readonly layer = new Container();
  private readonly trailG = new Graphics();
  private readonly glowG = new Graphics();
  private readonly basket = new Container();
  private readonly bowl = new Container();
  private readonly bowlFill = new Container();
  private readonly lid = new Graphics();
  private readonly sign = new Container();
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.back = ctx.track(new Backdrop({ sky: [0x9fd8f5, 0xfff6e0], hills: [0x9fd8f5, 0x7cc7ec, 0xffe7a3], horizon: 0.78, clouds: 3, sun: true, seed: 131 }, ctx.view));
    this.plan = planFor(ctx.level);
    this.signs = signsFor(this.plan, ctx.rng);
    if (this.plan.mode === 'line') this.boards = boardsFor(ctx.rng);
    // The how-to card's demonstration plays a short round.
    if (ctx.demo) {
      if (this.signs.length > 1) this.signs = this.signs.slice(0, 1);
      if (this.signs.length && this.signs[0].rows.length === 1 && !this.signs[0].board && this.plan.mode !== 'enough' && this.plan.mode !== 'pieces') this.signs[0].rows[0].n = 3;
      this.boards = this.boards.slice(0, 1);
    }
    this.wait = Array.from({ length: this.plan.aloft }, (_, c) => 0.4 + c * STAGGER);

    this.drawBasket();
    this.drawBowl();
    this.trailG.eventMode = 'none';
    this.glowG.eventMode = 'none';
    this.fruitLayer.eventMode = 'none';
    this.back.eventMode = 'none';
    this.layer.eventMode = 'static';
    this.layer.on('pointerdown', (e) => this.down(e));
    this.layer.on('globalpointermove', (e) => this.move(e));
    this.layer.on('pointerup', (e) => this.up(e));
    this.layer.on('pointerupoutside', (e) => this.up(e));
    this.layer.on('pointercancel', (e) => this.cancel(e));
    onTap(this.sign, () => void this.say(this.instructLine()), { cooldown: 600 });
    onTap(this.bowl, () => this.tapBowl(), { cooldown: 500 });
    // The slice layer catches touches over the play area; the sign and the bowl sit above it.
    ctx.stage.addChild(this.back, this.basket, this.fruitLayer, this.glowG, this.layer, this.trailG, this.bowl, this.sign);
    this.resize(ctx.view);
  }

  start() {
    void this.begin();
  }

  resize(v: View) {
    this.view = v;
    this.back.resize(v);
    this.layer.hitArea = new Rectangle(0, 0, v.w, v.h);
    const b = basketAt(v);
    this.basket.position.set(b.x, b.y);
    const bw = bowlAt(v);
    this.bowl.position.set(bw.x, bw.y);
    const s = signAt(v);
    this.sign.position.set(s.x, s.y);
    this.layoutBoard();
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.finished) this.fly(dt);
    for (const s of this.stills) {
      if (s.cut) continue;
      s.wobble = Math.max(0, s.wobble - dt);
      s.node.rotation = s.wobble > 0 ? 0.25 * Math.sin(s.wobble * 30) : 0;
      s.node.y = this.boardPoint(s.at).y + 6 * Math.sin(this.clock * 1.4 + s.phase);
    }
    this.drawTrail();
    this.drawGlow(dt);
    const pulse = met(this.current ?? { rows: [], per: 1, board: false }) && this.sends && !this.busy;
    this.bowl.scale.set(pulse ? 1 + 0.06 * Math.sin(this.clock * 6) : 1);
  }

  destroy() {
    this.stroke = null;
    this.flyers = [];
    this.stills = [];
  }

  /** Show a hint, from the pause sheet. Levels 1–2 have nothing to get wrong, so there it only repeats the instruction. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (this.plan.mode === 'touch' || this.plan.mode === 'swipe') return void this.say(this.instructLine());
    this.showGlow();
  }

  /** The ghost finger: a right fruit as it hangs (a tap at 1, a swipe through it after), the bowl when it is full, the hint's line on a still board. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.stroke) return null;
    const sign = this.current;
    if (this.sends && sign && met(sign)) return { tap: { on: this.bowl } };
    if (this.lineMode) {
      const l = this.solution();
      if (!l) return null;
      const a = this.boardPoint(l.a), b = this.boardPoint(l.b);
      return { trace: { on: this.ctx.stage, x: a.x, y: a.y }, via: [{ on: this.ctx.stage, x: b.x, y: b.y }], receiver: this.layer, pause: 0.3 };
    }
    const f = this.flyers.find((q) => !q.gone && q.t < RISE + 0.5 && sign && this.rightNow(q.toss.kind));
    if (!f) return null;
    const ax = f.toss.ax * this.view.w, ay = f.toss.ay * this.view.h;
    const dir = ax < this.view.w / 2 ? 1 : -1;
    const A = { x: ax - 90 * dir, y: ay + 6 }, B = { x: ax + 90 * dir, y: ay + 6 };
    // It presses once the fruit hangs and nothing else is near its path (a capable child does not slice two by accident).
    const clear = () => this.flyers.every((q) => q === f || q.gone
      || (hanging(q.t) ? distToSegment(q.node.position, A, B) > HIT_R + 30 : Math.hypot(q.node.x - ax, q.node.y - ay) > 360));
    const when = () => (f.gone || f.t > RISE + HANG - 0.9 ? 'cancel' as const : hanging(f.t) && f.t > RISE + 0.1 && clear());
    if (this.plan.mode === 'touch') return { tap: { on: this.ctx.stage, x: ax, y: ay + 6 }, receiver: this.layer, when };
    return {
      trace: { on: this.ctx.stage, ...A },
      via: [{ on: this.ctx.stage, ...B }],
      receiver: this.layer,
      when,
      pause: 0.2,
    };
  }

  /* -------------------------------------------------------------------------------------------- */

  private get current(): Sign | undefined {
    return this.signs[this.index];
  }

  private get lineMode() {
    return this.plan.mode === 'line' || !!this.current?.board;
  }

  /** Levels where the bowl is sent by a tap. */
  private get sends() {
    return this.plan.mode === 'enough' || this.plan.mode === 'two' || this.plan.mode === 'pieces';
  }

  private rightNow(kind: Kind) {
    const s = this.current;
    if (!s) return false;
    const copy: Sign = { rows: s.rows.map((r) => ({ ...r })), per: s.per, board: s.board };
    return judgeStroke(this.plan, copy, [kind]).cut[0];
  }

  private say(id: string, vars?: LineVars) {
    return this.ctx.say(id as LineId, vars);
  }

  private instructLine(): string {
    const s = this.current;
    switch (this.plan.mode) {
      case 'touch': return 'slice.instruct.touch';
      case 'swipe': return 'slice.instruct.swipe';
      case 'kind': return `slice.instruct.only.${s!.rows[0].kind}`;
      case 'fruit': return 'slice.instruct.fruit';
      case 'enough': return 'slice.instruct.enough';
      case 'two': return 'slice.instruct.two';
      case 'line': return 'slice.instruct.line';
      case 'pieces': return s?.board ? 'slice.instruct.pairs' : 'slice.instruct.pieces';
    }
  }

  private instructVars(): Record<string, number> {
    const s = this.current;
    if (this.plan.mode === 'line') return { n: this.board?.n ?? 0 };
    return { n: s ? s.rows[0].n : 0 };
  }

  private async begin() {
    this.busy = true;
    this.signMisses = 0;
    this.glow = null;
    if (this.plan.mode === 'line') {
      this.board = this.boards[this.index];
      this.buildBoard();
    } else if (this.current?.board) {
      this.clearFlyers();
      this.board = pairBoard(this.ctx.rng);
      this.buildBoard();
    }
    this.drawSign();
    this.busy = false;
    await this.ctx.instruct(this.instructLine() as LineId, this.instructVars());
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Tossing                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  private fly(dt: number) {
    if (this.lineMode) return;
    for (const f of this.flyers) {
      if (f.gone) continue;
      f.t += dt;
      const p = arcAt(f.toss, f.t, this.view);
      if (!p) {
        // Back in the basket, with a soft plop; it is tossed again later.
        f.gone = true;
        f.node.destroy({ children: true });
        sfx.squish();
        this.wait[f.toss.column] = GAP;
        continue;
      }
      f.wobble = Math.max(0, f.wobble - dt);
      f.node.position.set(p.x + f.dx, p.y);
      f.node.rotation = f.wobble > 0 ? 0.25 * Math.sin(f.wobble * 30) : 0.15 * Math.sin(f.t * 2 + f.toss.column);
    }
    this.flyers = this.flyers.filter((f) => !f.gone);
    if (this.busy || !this.current || (met(this.current) && !this.sends)) return;
    for (let c = 0; c < this.wait.length; c++) {
      if (this.wait[c] < 0) continue;
      this.wait[c] -= dt;
      if (this.wait[c] <= 0) this.launch(c);
    }
  }

  private launch(column: number) {
    const aloft = this.flyers.filter((f) => !f.gone).map((f) => f.toss.kind);
    const kind = nextKind(this.plan, this.current!, aloft, this.ctx.rng, this.tossed++);
    const toss = makeToss(kind, column, this.plan.aloft, this.ctx.rng);
    const node = fruitArt(kind);
    const b = basketAt(this.view);
    node.position.set(b.x, b.y);
    node.eventMode = 'none';
    this.fruitLayer.addChild(node);
    this.flyers.push({ toss, t: 0, node, dx: 0, gone: false, wobble: 0 });
    this.wait[column] = -1;
    sfx.whoosh();
  }

  private clearFlyers() {
    for (const f of this.flyers) f.node.destroy({ children: true });
    this.flyers = [];
    this.wait = this.wait.map(() => -1);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Still boards                                                                                   */
  /* -------------------------------------------------------------------------------------------- */

  private boardPoint(p: Pt): Pt {
    const o = boardOrigin(this.view);
    return { x: o.x + p.x, y: o.y + p.y };
  }

  private buildBoard() {
    for (const s of this.stills) s.node.destroy({ children: true });
    this.stills = [];
    const b = this.board!;
    b.fruit.forEach((at, i) => {
      const node = fruitArt(b.kinds[i]);
      node.eventMode = 'none';
      this.fruitLayer.addChild(node);
      this.stills.push({ at, kind: b.kinds[i], node, cut: false, wobble: 0, phase: i * 1.7 });
    });
    this.layoutBoard();
  }

  private layoutBoard() {
    for (const s of this.stills) {
      const p = this.boardPoint(s.at);
      s.node.position.set(p.x, p.y);
    }
  }

  private solution(): Line | null {
    const b = this.board;
    if (!b) return null;
    const cut = this.stills.map((s) => s.cut);
    if (this.plan.mode === 'line') return hintLineFor(b.fruit, b.n, cut) ?? b.hint;
    const s = this.current!;
    return pairHint(b, cut, left(s));
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private local(e: FederatedPointerEvent): Pt {
    const p = this.ctx.stage.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.stroke || palmOnGlass()) return;
    const p = this.local(e);
    const on = this.lineMode ? null : this.flyers.find((f) => !f.gone && Math.hypot(f.node.x - p.x, f.node.y - p.y) < HIT_R) ?? null;
    this.stroke = { id: e.pointerId, start: p, last: p, travel: 0, inside: new Map(), done: new Set(), missed: false, cutAny: false, downOn: on };
    this.trail = [{ ...p, t: this.clock }];
    // Level 1: a touch on the fruit slices it.
    if (this.plan.mode === 'touch' && on) this.hitFlyers([on], p, { x: p.x + 1, y: p.y });
  }

  private move(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id || this.finished || this.busy) return;
    const p = this.local(e);
    const d = Math.hypot(p.x - s.last.x, p.y - s.last.y);
    if (d < 2) return;
    s.travel += d;
    this.trail.push({ ...p, t: this.clock });
    if (!this.lineMode) this.sweep(s.last, p);
    s.last = p;
  }

  private cancel(e: FederatedPointerEvent) {
    if (this.stroke?.id !== e.pointerId) return;
    this.stroke = null;
    this.trail = [];
  }

  private up(e: FederatedPointerEvent) {
    const s = this.stroke;
    if (!s || e.pointerId !== s.id) return;
    this.stroke = null;
    if (this.busy || this.finished) return;
    if (this.lineMode) return void this.cutLine(s.start, s.last);
    // A still touch on a fruit, from level 2: it wobbles and giggles, never a miss.
    const f = s.downOn;
    if (this.plan.mode !== 'touch' && f && !f.gone && !s.cutAny && !s.done.has(f) && s.travel < MIN_TRAVEL) {
      f.wobble = 0.5;
      sfx.giggle();
      void this.say('slice.swipe-across');
      if (!this.shownSwipe) {
        this.shownSwipe = true;
        this.arrowFor = { at: { x: f.node.x, y: f.node.y }, t: 1.4 };
      }
    }
  }

  /** One segment of a free stroke: each fruit it crosses far enough is cut or bounced, in the order the segment reached them. */
  private sweep(a: Pt, b: Pt) {
    const s = this.stroke!;
    const need = this.plan.mode === 'touch' ? 0.001 : MIN_TRAVEL;
    const hit: { f: Flyer; along: number }[] = [];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    for (const f of this.flyers) {
      if (f.gone || s.done.has(f)) continue;
      const c = { x: f.node.x, y: f.node.y };
      const inside = (s.inside.get(f) ?? 0) + insideLength(a, b, c);
      if (inside <= 0) continue;
      s.inside.set(f, inside);
      if (inside >= need) hit.push({ f, along: ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / len });
    }
    if (hit.length) this.hitFlyers(hit.sort((p, q) => p.along - q.along).map((h) => h.f), a, b);
  }

  private hitFlyers(fs: Flyer[], a: Pt, b: Pt) {
    const s = this.stroke;
    const sign = this.current;
    if (!sign) return;
    const r = judgeStroke(this.plan, sign, fs.map((f) => f.toss.kind), s?.missed ?? false);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    fs.forEach((f, i) => {
      s?.done.add(f);
      if (r.cut[i]) {
        if (s) s.cutAny = true;
        this.cutFruit(f.node, f.toss.kind, angle);
        f.gone = true;
        f.node.destroy({ children: true });
        this.wait[f.toss.column] = GAP + 0.3;
      } else this.bounce(f, r.reasons[i]!);
    });
    this.afterCut(r.cut.some(Boolean), r.miss, r.reasons.find((x) => x) ?? null);
    if (s && r.miss) s.missed = true;
  }

  /** The straight line (level 7, and level 8's last sign): cuts on lift. */
  private cutLine(a: Pt, b: Pt) {
    this.trail = [];
    if (Math.hypot(b.x - a.x, b.y - a.y) < LINE_CANCEL) return;
    const live = this.stills.filter((s) => !s.cut);
    const centers = live.map((s) => this.boardPoint(s.at));
    const ids = lineHits(a, b, centers);
    this.flashLine(a, b);
    if (!ids.length) return;
    const hit = ids.map((i) => live[i]);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (this.plan.mode === 'line') {
      const want = this.board!.n;
      if (hit.length !== want) {
        for (const s of hit) s.wobble = 0.6;
        sfx.boing();
        this.misses++;
        this.signMisses++;
        void this.say('slice.line-count', { n: hit.length, want });
        if (this.signMisses % 2 === 0) this.showGlow();
        return;
      }
      for (const s of hit) {
        s.cut = true;
        this.cutFruit(s.node, s.kind, angle);
      }
      this.glow = null;
      void this.boardDone();
      return;
    }
    const sign = this.current!;
    const r = judgeStroke(this.plan, sign, hit.map((s) => s.kind));
    hit.forEach((s, i) => {
      if (r.cut[i]) {
        s.cut = true;
        this.cutFruit(s.node, s.kind, angle);
      } else s.wobble = 0.6;
    });
    this.afterCut(r.cut.some(Boolean), r.miss, r.reasons.find((x) => x) ?? null);
  }

  /** After a stroke's cuts: count aloud, tell the reason for a bounce, the glow on every second miss, and the next sign. */
  private afterCut(anyCut: boolean, miss: boolean, why: Refusal | null) {
    const sign = this.current!;
    if (anyCut) {
      this.glow = null;
      if (this.sends) void this.say('count', { n: inBowl(sign) });
    }
    if (miss) {
      this.misses++;
      this.signMisses++;
      sfx.boing();
      if (why) void this.say(this.refusalLine(why, sign));
      if (this.signMisses % 2 === 0) this.showGlow();
    }
    if (!met(sign)) return;
    if (this.sends) {
      if (anyCut) void this.say('slice.send', { n: inBowl(sign) });
      this.drawLid(true);
      return;
    }
    if (anyCut) void this.roundDone();
  }

  private refusalLine(why: Refusal, sign: Sign): string {
    switch (why) {
      case 'not-fruit': return this.plan.mode === 'fruit' ? 'slice.not-fruit' : 'slice.not-sign';
      case 'not-kind': return this.plan.mode === 'kind' ? `slice.not-kind.${sign.rows[0].kind}` : 'slice.not-sign';
      case 'row-done': return 'slice.row-done';
      case 'full': return met(sign) ? 'slice.full' : 'slice.too-many';
    }
  }

  private bounce(f: Flyer, _why: Refusal) {
    f.wobble = 0.5;
    const side = f.node.x < this.view.w / 2 ? -1 : 1;
    void this.ctx.tw.to(f, { dx: f.dx + side * 70 }, { duration: 0.35, ease: ease.outBack });
    // A refused fruit drops back into the basket whole.
    if (f.t < RISE + HANG) f.t = Math.max(f.t, RISE + HANG - 0.2);
  }

  /** Split a fruit along the stroke: two halves part and tumble into the bowl, with juice and a rising note. */
  private cutFruit(node: Container, kind: Kind, angle: number) {
    const at = { x: node.x, y: node.y };
    node.visible = false;
    this.slices++;
    sfx.marimba(this.slices % 10, 0.45);
    sfx.pop(5 + (this.slices % 5));
    this.ctx.particles.burst(at.x, at.y, { kind: 'dot', colors: [swatch[COLOR[kind]].fill, 0xffffff], count: 12, speed: [80, 220], gravity: 400, life: [0.3, 0.7] });
    const nx = -Math.sin(angle), ny = Math.cos(angle);
    const bowl = this.bowl.position;
    for (const side of [1, -1] as const) {
      const h = halfArt(kind, angle, side);
      h.position.set(at.x, at.y);
      h.eventMode = 'none';
      this.fruitLayer.addChild(h);
      void (async () => {
        await this.ctx.tw.to(h, { x: at.x + nx * side * 40, y: at.y + ny * side * 40, rotation: side * 0.5 }, { duration: 0.25, ease: ease.outQuad });
        await this.ctx.tw.to(h, { x: bowl.x + side * 20, y: bowl.y - 20, rotation: side * 1.4 }, { duration: 0.45, ease: ease.inQuad });
        h.destroy({ children: true });
        this.addToBowl(kind);
      })();
    }
  }

  /** A half lands in the bowl: one little piece shows, up to two rows. */
  private addToBowl(kind: Kind) {
    if (this.bowlFill.destroyed || this.bowlFill.children.length >= 14) return;
    const chip = new Graphics().circle(0, 0, 13).fill(swatch[COLOR[kind]].fill).stroke({ width: 3, color: swatch[COLOR[kind]].line });
    const n = this.bowlFill.children.length;
    chip.position.set(-48 + (n % 7) * 16, -28 - Math.floor(n / 7) * 14);
    this.bowlFill.addChild(chip);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Hints                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private showGlow() {
    if (this.glow || this.finished) return;
    const sign = this.current;
    if (this.sends && sign && met(sign)) this.glow = { kind: 'bowl' };
    else if (this.lineMode) {
      const l = this.solution();
      if (!l) return;
      this.glow = { kind: 'line', line: l };
    } else this.glow = { kind: 'fruit' };
    this.hints++;
    void this.say(this.glow.kind === 'line' ? 'slice.hint-line' : this.glow.kind === 'bowl' ? 'slice.hint-bowl' : 'slice.hint');
  }

  private drawGlow(dt: number) {
    const g = this.glowG.clear();
    const pulse = 6 + 3 * Math.sin(this.clock * 6);
    if (this.arrowFor) {
      this.arrowFor.t -= dt;
      const { at } = this.arrowFor;
      const k = 1 - Math.max(0, this.arrowFor.t) / 1.4;
      const x0 = at.x - 110, x1 = at.x - 110 + 220 * Math.min(1, k * 1.3);
      g.moveTo(x0, at.y).lineTo(x1, at.y).stroke({ width: 10, color: 0xffffff, alpha: 0.85, cap: 'round' });
      g.poly([x1, at.y - 18, x1 + 24, at.y, x1, at.y + 18]).fill({ color: 0xffffff, alpha: 0.85 });
      if (this.arrowFor.t <= 0) this.arrowFor = null;
    }
    const gl = this.glow;
    if (!gl) return;
    if (gl.kind === 'bowl') {
      g.circle(this.bowl.x, this.bowl.y - 20, BOWL_R + 8).stroke({ width: pulse, color: swatch.yellow.fill });
    } else if (gl.kind === 'line' && gl.line) {
      const a = this.boardPoint(gl.line.a), b = this.boardPoint(gl.line.b);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      for (let d = 0; d < len; d += 36) {
        const e = Math.min(len, d + 20);
        g.moveTo(a.x + ux * d, a.y + uy * d).lineTo(a.x + ux * e, a.y + uy * e);
      }
      g.stroke({ width: 8, color: swatch.yellow.fill, alpha: 0.6 + 0.3 * Math.sin(this.clock * 5), cap: 'round' });
    } else {
      const f = this.flyers.find((q) => !q.gone && this.rightNow(q.toss.kind));
      if (f) g.circle(f.node.x, f.node.y, HIT_R + 4).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Trail, sign, bowl, basket                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  private drawTrail() {
    const g = this.trailG.clear();
    if (this.lineMode) {
      const s = this.stroke;
      if (!s) return;
      g.moveTo(s.start.x, s.start.y).lineTo(s.last.x, s.last.y).stroke({ width: 16, color: swatch.yellow.fill, alpha: 0.35, cap: 'round' });
      g.moveTo(s.start.x, s.start.y).lineTo(s.last.x, s.last.y).stroke({ width: 6, color: 0xffffff, alpha: 0.95, cap: 'round' });
      g.circle(s.start.x, s.start.y, 10).fill(0xffffff);
      return;
    }
    this.trail = this.trail.filter((p) => this.clock - p.t < TRAIL_LIFE);
    for (let i = 1; i < this.trail.length; i++) {
      const p = this.trail[i - 1], q = this.trail[i];
      const a = 1 - (this.clock - q.t) / TRAIL_LIFE;
      g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: 4 + 12 * a, color: 0xffffff, alpha: 0.8 * a, cap: 'round' });
    }
    // Sparkles along the ribbon.
    for (let i = 0; i < this.trail.length; i += 3) {
      const p = this.trail[i];
      const a = 1 - (this.clock - p.t) / TRAIL_LIFE;
      g.circle(p.x, p.y, 4 * a + 1).fill({ color: swatch.yellow.fill, alpha: a });
    }
  }

  private flashLine(a: Pt, b: Pt) {
    const g = new Graphics().moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 8, color: 0xffffff, cap: 'round' });
    g.eventMode = 'none';
    this.ctx.stage.addChild(g);
    void this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.4 }).then(() => g.destroy());
  }

  private drawBasket() {
    const g = new Graphics()
      .moveTo(-110, -40).lineTo(110, -40).lineTo(90, 40).lineTo(-90, 40).closePath()
      .fill(wood.fill).stroke({ width: 5, color: wood.line, join: 'round' });
    for (let x = -80; x <= 80; x += 32) g.moveTo(x, -36).lineTo(x * 0.85, 36);
    g.moveTo(-100, 0).lineTo(100, 0).stroke({ width: 3, color: wood.line, alpha: 0.6 });
    g.roundRect(-118, -50, 236, 16, 8).fill(wood.light).stroke({ width: 4, color: wood.line });
    this.basket.addChild(g);
    this.basket.eventMode = 'none';
  }

  private drawBowl() {
    const g = new Graphics()
      .moveTo(-80, -40).bezierCurveTo(-78, 30, 78, 30, 80, -40).closePath()
      .fill(swatch.teal.fill).stroke({ width: 5, color: swatch.teal.line, join: 'round' })
      .ellipse(0, -40, 80, 12).fill(swatch.teal.light).stroke({ width: 4, color: swatch.teal.line })
      .roundRect(-26, 22, 52, 12, 6).fill(swatch.teal.line);
    this.bowl.addChild(g, this.bowlFill, this.lid);
    this.bowl.hitArea = new Rectangle(-BOWL_R, -BOWL_R - 20, 2 * BOWL_R, 2 * BOWL_R);
    this.lid.eventMode = 'none';
    this.bowlFill.eventMode = 'none';
  }

  private drawLid(on: boolean) {
    const g = this.lid.clear();
    if (!on) return;
    g.ellipse(0, -48, 86, 26).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line })
      .circle(0, -74, 12).fill(swatch.yellow.light).stroke({ width: 4, color: swatch.yellow.line });
  }

  private tapBowl() {
    if (this.busy || this.finished || !this.sends) return;
    const sign = this.current;
    if (!sign) return;
    if (!met(sign)) {
      sfx.tick();
      return void this.say('slice.more', { n: left(sign) });
    }
    void this.sendBowl();
  }

  private async sendBowl() {
    this.busy = true;
    this.glow = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    void this.say('slice.sent');
    const home = { x: this.bowl.x, y: this.bowl.y };
    await this.ctx.tw.to(this.bowl, { y: -120 }, { duration: 0.6, ease: ease.inQuad });
    this.bowlFill.removeChildren().forEach((c) => c.destroy());
    this.drawLid(false);
    this.bowl.position.set(home.x, this.view.h + 120);
    await this.ctx.tw.to(this.bowl, { y: bowlAt(this.view).y }, { duration: 0.5, ease: ease.outBack });
    this.index++;
    if (this.index >= this.signs.length) return void this.finale();
    this.drawSign();
    if (this.current?.board) return void this.begin();
    this.signMisses = 0;
    this.busy = false;
    await this.ctx.instruct(this.instructLine() as LineId, this.instructVars());
  }

  /** Level 7: the line cut exactly N; the next board comes in. */
  private async boardDone() {
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.say('slice.line-yes', { n: this.board!.n });
    this.index++;
    if (this.index >= this.boards.length) return void this.finale();
    await this.begin();
  }

  /** Levels 1–4: the bowl is full. */
  private async roundDone() {
    this.busy = true;
    await this.ctx.tw.wait(0.8);
    await this.finale();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.glow = null;
    this.clearFlyers();
    sfx.tada();
    this.ctx.pet.cheer();
    await this.say('slice.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private drawSign() {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const s = this.current;
    const mode = this.plan.mode;
    if (mode === 'touch' || mode === 'swipe') {
      this.sign.visible = false;
      return;
    }
    this.sign.visible = true;
    const card = new Graphics().roundRect(-SIGN_W / 2, -SIGN_W / 2, SIGN_W, SIGN_W, 22).fill(0xffffff).stroke({ width: 6, color: wood.line });
    this.sign.addChild(card);
    this.sign.hitArea = new Rectangle(-SIGN_W / 2, -SIGN_W / 2, SIGN_W, SIGN_W);
    const add = (c: Container, x: number, y: number, scale = 1) => {
      c.position.set(x, y);
      c.scale.set(c.scale.x * scale);
      this.sign.addChild(c);
    };
    if (mode === 'kind') add(fruitArt(s!.rows[0].kind!), 0, 4, 0.9);
    else if (mode === 'fruit') {
      add(fruitArt('apple'), -36, -24, 0.5);
      add(fruitArt('pear'), 36, -24, 0.5);
      add(fruitArt('grapes'), 0, 30, 0.5);
    } else if (mode === 'two') {
      s!.rows.forEach((r, i) => {
        const y = i === 0 ? -36 : 36;
        add(fruitArt(r.kind!), -40, y, 0.5);
        add(label(r.cut >= r.n ? '✓' : String(r.n - r.cut), 52, ink), 30, y);
      });
    } else if (mode === 'line') {
      add(label(String(this.board?.n ?? this.boards[this.index]?.n ?? 0), 64, ink), 0, -26);
      const g = new Graphics().moveTo(-60, 40).lineTo(60, 20).stroke({ width: 6, color: swatch.yellow.line, cap: 'round' });
      for (const x of [-30, 10]) g.circle(x, 35 - (x + 60) / 6, 9).fill(swatch.red.fill);
      add(g, 0, 0);
    } else if (s) {
      // A count: the numeral and its dots (in twos at level 8).
      const n = s.rows[0].n;
      add(label(String(n), 64, ink), 0, -28);
      const dots = new Graphics();
      const per = s.per;
      const cols = Math.min(6, Math.ceil(n / (per > 1 ? 2 : 1)));
      for (let i = 0; i < n; i++) {
        const k = per > 1 ? Math.floor(i / 2) : i;
        const col = k % cols, row = Math.floor(k / cols);
        const dx = per > 1 ? (i % 2 ? 5 : -5) : 0;
        dots.circle(-((cols - 1) * 22) / 2 + col * 22 + dx, 28 + row * 22, per > 1 ? 6 : 8).fill(ink);
      }
      add(dots, 0, 0);
    }
  }
}

class SliceIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    for (const side of [1, -1] as const) {
      const h = halfArt('apple', 0.9, side);
      h.position.set(side * 14, -60 + side * 8);
      h.rotation = side * 0.25;
      c.addChild(h);
    }
    const drops = new Graphics();
    for (const [x, y] of [[-46, -90], [44, -30], [-30, -20], [50, -104]]) drops.circle(x, y, 6).fill(swatch.red.light);
    c.addChild(drops);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kind = rng.pick(['apple', 'orange', 'lemon', 'pear'] as Kind[]);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.yellow.line }));
  const angle = rng.range(-0.6, 0.6);
  for (const side of [1, -1] as const) {
    const h = halfArt(kind, angle, side);
    h.scale.set(0.8);
    h.position.set(-Math.sin(angle) * side * 16, Math.cos(angle) * side * 16);
    c.addChild(h);
  }
  const drops = new Graphics();
  for (let i = 0; i < 5; i++) drops.circle(rng.range(-60, 60), rng.range(-60, 60), rng.range(4, 7)).fill(swatch[COLOR[kind]].light);
  c.addChild(drops);
  return c;
}

export const fruitSlice: GameModule = {
  id: 'fruit-slice',
  name: 'Fruit Slice',
  titleLine: 'game.fruit-slice',
  region: 'bubble-beach',
  skills: ['fine-motor', 'sorting', 'counting', 'spatial-reasoning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you names the fruit to slice; the other slices it.',
  offScreen: 'At snack time, cut a banana or another soft fruit with a child-safe knife together and count the pieces.',
  hubIcon: () => new SliceIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new FruitSlice(ctx),
};

