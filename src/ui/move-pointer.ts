import { Container, Graphics } from 'pixi.js';
import { drawCursor, drawHand } from '../engine/ghost';
import type { PointerKind } from '../engine/input';
import { ease } from '../engine/tween';
import type { Spot, TouchIntent } from '../games/types';

type Pt = { x: number; y: number };

/** Seconds for each part of the pantomime, slow enough to follow. */
const T = {
  fadeIn: 0.25,
  travel: 0.7,
  press: 0.3,
  carryMin: 0.7,
  carrySpeed: 380,
  hold: 0.35,
  fadeOut: 0.35,
  gap: 0.35,
};
/** The hand is drawn a little larger than the how-to card's, to stand out on a full board. */
const SIZE = 1.15;
/** How many times one showing plays the move. */
const REPEATS = 2;
/** The hand starts this far below and right of the first spot, in units, and drifts in. */
const ENTER = { x: 70, y: 150 };

const spotGlobal = (s: Spot): Pt => s.on.toGlobal({ x: s.x ?? 0, y: s.y ?? 0 });

type Leg = {
  kind: 'travel' | 'press' | 'carry' | 'hold' | 'fade' | 'gap';
  len: number;
  from?: number;
  to?: number;
};

/**
 * Shows a move on the real board without making it (guided first play, `src/app/round-guide.ts`): a drawn hand (or mouse
 * pointer) drifts to the first spot of a `TouchIntent`, presses with a ripple, carries along a dotted path for a drag or a
 * trace, lifts and fades, twice over. Unlike the how-to card's `GhostFinger` it sends no events, so nothing in the round
 * changes; it follows its spots every frame, so a move onto something that moves still points at it. A touch stops it.
 */
export class MovePointer extends Container {
  private readonly art: Container;
  private readonly ring = new Graphics();
  private readonly trail = new Graphics();
  private readonly holder = new Container();
  private stops: Spot[] = [];
  private legs: Leg[] = [];
  private leg = 0;
  private t = 0;
  private ripple = 1;
  private pos: Pt = { x: 0, y: 0 };

  constructor(kind: PointerKind = 'touch') {
    super();
    this.art = kind === 'mouse' ? drawCursor() : drawHand();
    this.holder.addChild(this.ring, this.art);
    this.addChild(this.trail, this.holder);
    this.eventMode = 'none';
    this.visible = false;
  }

  /** Playing a move now. */
  get showing() {
    return this.visible;
  }

  /**
   * Show `intent`. A move that has to land at a moment (`when`) is not shown: pointing at it in the air would say nothing
   * about when. Returns whether it is showing.
   */
  show(intent: TouchIntent): boolean {
    if (intent.when) return false;
    const stops =
      'tap' in intent
        ? [intent.tap]
        : 'drag' in intent
          ? [intent.drag, intent.to]
          : [intent.trace, ...intent.via];
    if (stops.some((s) => s.on.destroyed || !s.on.parent)) return false;
    this.stops = stops;
    this.legs = [];
    for (let r = 0; r < REPEATS; r++) {
      this.legs.push(
        { kind: 'travel', len: r === 0 ? T.fadeIn + T.travel : T.travel },
        { kind: 'press', len: T.press },
      );
      for (let i = 1; i < stops.length; i++)
        this.legs.push({ kind: 'carry', len: T.carryMin, from: i - 1, to: i });
      this.legs.push({ kind: 'hold', len: T.hold }, { kind: 'fade', len: T.fadeOut });
      if (r < REPEATS - 1) this.legs.push({ kind: 'gap', len: T.gap });
    }
    // Carries take as long as their distance needs.
    for (const l of this.legs)
      if (l.kind === 'carry') {
        const d = this.dist(this.at(l.from!), this.at(l.to!)) / this.unit();
        l.len = Math.max(T.carryMin, d / T.carrySpeed);
      }
    this.leg = 0;
    this.t = 0;
    this.ripple = 1;
    this.pos = this.entry();
    this.trail.clear();
    this.visible = true;
    this.draw(0);
    return true;
  }

  /** Stop at once (a touch, the round ending). */
  stop() {
    this.visible = false;
    this.legs = [];
    this.trail.clear();
  }

  update(dt: number) {
    if (!this.visible) return;
    if (this.stops.some((s) => s.on.destroyed || !s.on.parent)) return this.stop();
    this.t += dt;
    let l = this.legs[this.leg];
    while (l && this.t >= l.len) {
      this.t -= l.len;
      this.finishLeg(l);
      l = this.legs[++this.leg];
    }
    if (!l) return this.stop();
    const k = Math.min(1, this.t / l.len);
    const first = this.at(0);
    this.holder.alpha = 1;
    this.art.scale.set(SIZE * 1);
    switch (l.kind) {
      case 'travel': {
        const start = this.entry();
        const kk = ease.inOutSine(Math.min(1, k * (l.len / T.travel)));
        this.pos = { x: start.x + (first.x - start.x) * kk, y: start.y + (first.y - start.y) * kk };
        // The first approach fades in on the way.
        this.holder.alpha = Math.min(1, (this.t / T.fadeIn) * 1.5);
        break;
      }
      case 'press':
        this.pos = first;
        this.art.scale.set(SIZE * (1 - 0.14 * Math.min(1, this.t / 0.12)));
        break;
      case 'carry': {
        const a = this.at(l.from!);
        const b = this.at(l.to!);
        const kk = ease.inOutSine(k);
        this.pos = { x: a.x + (b.x - a.x) * kk, y: a.y + (b.y - a.y) * kk };
        this.art.scale.set(SIZE * 0.86);
        this.drawTrail(l.to!, kk);
        break;
      }
      case 'hold':
        this.art.scale.set(SIZE * (this.stops.length > 1 ? 0.86 : 1));
        break;
      case 'fade':
        this.holder.alpha = 1 - k;
        this.trail.alpha = 1 - k;
        break;
      case 'gap':
        this.holder.alpha = 0;
        break;
    }
    this.draw(dt);
  }

  private finishLeg(l: Leg) {
    // A ripple where the finger lands, and again where a carried thing is put down.
    if (l.kind === 'press' || (l.kind === 'carry' && l.to === this.stops.length - 1)) this.ripple = 0;
    if (l.kind === 'gap') {
      this.pos = this.entry();
      this.trail.clear();
      this.trail.alpha = 1;
    }
    if (l.kind === 'fade') this.holder.alpha = 0;
  }

  /** Dots along the path carried so far, to the stop being carried to (`k` of the way along its last part). */
  private drawTrail(to: number, k: number) {
    const pts: Pt[] = [];
    for (let i = 0; i < to; i++) pts.push(this.local(this.at(i)));
    const a = this.at(to - 1);
    const b = this.at(to);
    pts.push(this.local({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }));
    this.trail.clear();
    const step = 26;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1];
      const q = pts[i];
      const n = Math.floor(Math.hypot(q.x - p.x, q.y - p.y) / step);
      for (let j = 0; j <= n; j++) {
        const u = n ? j / n : 0;
        this.trail.circle(p.x + (q.x - p.x) * u, p.y + (q.y - p.y) * u, 6);
      }
    }
    this.trail.fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 3, color: 0x3f8cff, alpha: 0.8 });
  }

  private draw(dt: number) {
    const local = this.local(this.pos);
    if (Number.isFinite(local.x) && Number.isFinite(local.y)) this.holder.position.set(local.x, local.y);
    if (this.ripple < 1) {
      this.ripple = Math.min(1, this.ripple + dt / 0.7);
      const r = 34 + 76 * ease.outCubic(this.ripple);
      const a = 1 - this.ripple;
      this.ring
        .clear()
        .circle(0, 0, r)
        .stroke({ width: 12, color: 0xffffff, alpha: 0.8 * a })
        .circle(0, 0, r)
        .stroke({ width: 6, color: 0x3f8cff, alpha: 0.9 * a });
    } else this.ring.clear();
  }

  /** Where the hand drifts in from: below and right of the first spot. */
  private entry(): Pt {
    const p = this.at(0);
    const u = this.unit();
    return { x: p.x + ENTER.x * u, y: p.y + ENTER.y * u };
  }

  private at(i: number): Pt {
    return spotGlobal(this.stops[i]);
  }

  private local(p: Pt): Pt {
    return this.toLocal(p);
  }

  private dist(a: Pt, b: Pt) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Global pixels per unit where the hand is drawn. */
  private unit() {
    const m = this.worldTransform;
    return Math.hypot(m.a, m.b) || 1;
  }
}
