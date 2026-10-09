import { Container, FederatedPointerEvent, Graphics, type EventBoundary } from 'pixi.js';
import { ink } from '../art/palette';
import type { Spot, TouchIntent } from '../games/types';
import type { PointerKind } from './input';
import { ease } from './tween';

/** The ghost's pointer id. A real finger never has it, so the drag lock and the steering games can tell it apart. */
export const GHOST_POINTER = 71_000_001;

type Pt = { x: number; y: number };
type Phase = 'idle' | 'travel' | 'hover' | 'press' | 'carry' | 'release' | 'rest';

/** The seconds each part of a gesture takes, slow enough for a grown-up to see what was touched. */
const TRAVEL = { min: 0.45, max: 0.95, speed: 560 };
const CARRY = { min: 0.5, speed: 420 };
const PRESS = 0.22;
const RELEASE = 0.2;
/** The longest a hand waits over its spot for the moment to press (`when`) before it gives the touch up. */
const HOVER_MAX = 6;
/** A pause after each gesture, so what it did can be seen before the next one starts. */
const REST = 0.55;
/** The least time between two taps on one spot: the hand has to come back (the shortest travel), press and lift. A game that needs a rhythm adds a pause to this. */
export const MIN_TAP_GAP = TRAVEL.min + PRESS + RELEASE;
/** How much bigger than life the hand or cursor is drawn, to read in a window a third the size of the screen. */
const WINDOW_SCALE = 1.35;
/** A held thing rides this far above the finger unless the intent says otherwise (`draggable`'s own height). */
const RIDE = 40;

interface Plan {
  /** Where each touch point is: the first is where the finger lands, the rest where it is carried. */
  stops: Spot[];
  target: Container;
  /** The finger ends this many units below the last stop (a dragged thing rides above it). */
  lift: number;
  tap: boolean;
  /** Seconds of rest after the gesture. */
  rest: number;
  /** Press only when this is true: the hand waits over the first spot until then. */
  when?: () => boolean | 'cancel';
}

const spotGlobal = (s: Spot): Pt => s.on.toGlobal({ x: s.x ?? 0, y: s.y ?? 0 });

/**
 * A pretend finger for the how-to card's demonstration, or a pretend mouse pointer on a desktop (`kind`: it follows
 * what the person plays with, so a grown-up at a computer sees a click and not a fingertip). It does what a capable
 * child would do (the game says which object and where) with a drawn hand or cursor that travels, presses and lifts,
 * and it sends a real touch's (or click's) events to that
 * object's own listeners (`pointerdown`, `globalpointermove`, `pointerup`) with `emit`. Nothing is hit-tested and no
 * window listener hears it, so it can never reach the card's own buttons or a real round behind it.
 */
export class GhostFinger {
  /** Add this where the hand should be drawn; `space` is that container, so it can be placed in its coordinates. */
  readonly hand = new Container();
  private readonly dot = new Graphics();
  private readonly ring = new Graphics();
  private readonly art: Container;
  private phase: Phase = 'idle';
  private t = 0;
  private len = 0;
  private leg = 0;
  private from: Pt = { x: 0, y: 0 };
  private pos: Pt = { x: 0, y: 0 };
  private plan: Plan | null = null;
  private down = false;
  private shown = false;
  private ripple = 1;
  private press = 0;

  constructor(
    private readonly space: Container,
    private readonly boundary: EventBoundary,
    private readonly kind: PointerKind = 'touch',
  ) {
    this.art = kind === 'mouse' ? drawCursor() : drawHand();
    this.dot.circle(0, 0, 30).fill({ color: 0x3f8cff, alpha: 0.38 }).stroke({ width: 4, color: 0x3f8cff, alpha: 0.7 });
    this.hand.addChild(this.ring, this.dot, this.art);
    this.hand.visible = false;
    this.hand.eventMode = 'none';
    // The card's window is small, so the pointer is drawn larger than a real one would be.
    this.hand.scale.set(WINDOW_SCALE);
  }

  /** Ready for the next gesture: the last one has finished and rested. */
  get idle() {
    return this.phase === 'idle';
  }

  /** Begin a gesture. Ignored while one is in progress. */
  start(intent: TouchIntent) {
    if (this.phase !== 'idle') return;
    let plan: Plan;
    const rest = Math.max(0.05, intent.pause ?? REST);
    if ('tap' in intent) plan = { stops: [intent.tap], target: intent.receiver ?? intent.tap.on, lift: 0, tap: true, rest, when: intent.when };
    else if ('drag' in intent) plan = { stops: [intent.drag, intent.to], target: intent.receiver ?? intent.drag.on, lift: intent.lift ?? RIDE, tap: false, rest, when: intent.when };
    else plan = { stops: [intent.trace, ...intent.via], target: intent.receiver ?? intent.trace.on, lift: 0, tap: false, rest, when: intent.when };
    if (plan.target.destroyed) return;
    this.plan = plan;
    this.leg = 0;
    const first = this.point(0);
    if (!this.shown) {
      // The first time the hand drifts in from below the spot.
      const u = this.unit();
      this.pos = { x: first.x + 90 * u, y: first.y + 170 * u };
      this.shown = true;
    }
    this.begin('travel', this.pos, this.travelTime(this.pos, first));
    this.hand.visible = true;
  }

  /** Drop the gesture without sending anything more (the game is gone or about to be). */
  stop() {
    this.plan = null;
    this.down = false;
    this.phase = 'idle';
    this.press = 0;
    this.hand.visible = false;
    this.shown = false;
  }

  update(dt: number) {
    const plan = this.plan;
    if (this.phase === 'idle' || !plan) return;
    if (plan.target.destroyed || !plan.target.parent) {
      // The thing she touched is gone (a bubble pops the moment it is tapped). Before the finger lands that ends the
      // gesture; once it is down the finger just lifts where it is, and nothing more is sent.
      if (!this.down) return this.abort();
      if (this.phase === 'press' || this.phase === 'carry') {
        this.down = false;
        this.begin('release', this.pos, RELEASE);
      }
    }
    this.t += dt;
    const done = this.t >= this.len;
    const k = this.len > 0 ? Math.min(1, this.t / this.len) : 1;
    switch (this.phase) {
      case 'travel': {
        this.moveTo(this.from, this.point(0), ease.inOutSine(k));
        if (done) {
          this.pos = this.point(0);
          this.hoverOrLand(plan.when?.() ?? true);
        }
        break;
      }
      case 'hover': {
        // Over the spot, waiting for the moment (a ball reaching a flipper); a moment that never comes is let go.
        this.pos = this.point(0);
        this.hoverOrLand(plan.when!(), done);
        break;
      }
      case 'press': {
        this.pos = this.point(0);
        this.press = Math.min(1, this.t / 0.1);
        if (done) {
          if (plan.tap) this.lift();
          else this.nextLeg();
        }
        break;
      }
      case 'carry': {
        const here = this.moveTo(this.from, this.point(this.leg), ease.inOutSine(k));
        this.emit('globalpointermove', here);
        if (done) {
          this.pos = this.point(this.leg);
          if (this.leg >= plan.stops.length - 1) this.lift();
          else this.nextLeg();
        }
        break;
      }
      case 'release': {
        this.press = Math.max(0, 1 - this.t / 0.12);
        if (done) this.begin('rest', this.pos, plan.rest);
        break;
      }
      case 'rest': {
        if (done) {
          this.plan = null;
          this.phase = 'idle';
        }
        break;
      }
    }
    this.draw(dt);
  }

  /** Over the first spot: press if the moment is here, give the touch up if it has gone (or never came), else wait. */
  private hoverOrLand(ready: boolean | 'cancel', timedOut = false) {
    const plan = this.plan!;
    if (ready === true) this.land();
    else if (ready === 'cancel' || timedOut) this.begin('rest', this.pos, plan.rest);
    else if (this.phase !== 'hover') this.begin('hover', this.pos, HOVER_MAX);
  }

  /** Touch down on the first spot. */
  private land() {
    this.emit('pointerdown', this.pos);
    this.down = true;
    this.ripple = 0;
    this.begin('press', this.pos, PRESS);
  }

  private begin(phase: Phase, from: Pt, len: number) {
    this.phase = phase;
    this.t = 0;
    this.len = len;
    this.from = from;
  }

  private nextLeg() {
    this.leg += 1;
    const to = this.point(this.leg);
    const d = this.dist(this.pos, to) / this.unit();
    this.begin('carry', this.pos, Math.max(CARRY.min, d / CARRY.speed));
  }

  /** Lift the finger: one `pointerup` (and the tap that follows it), then the finger rests. */
  private lift() {
    const plan = this.plan!;
    this.emit('pointerup', this.pos);
    if (plan.tap) this.emit('pointertap', this.pos);
    this.down = false;
    this.begin('release', this.pos, RELEASE);
  }

  /** The target went before the finger landed: the hand stays where it is and the game is asked what to do next. */
  private abort() {
    this.plan = null;
    this.down = false;
    this.press = 0;
    this.phase = 'idle';
  }

  private moveTo(from: Pt, to: Pt, k: number): Pt {
    const here = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
    this.pos = here;
    return here;
  }

  /** Where the finger belongs at stop `i`, in global coordinates, following the object if it is moving. */
  private point(i: number): Pt {
    const plan = this.plan!;
    const g = spotGlobal(plan.stops[i]);
    if (plan.lift && i === plan.stops.length - 1 && i > 0) {
      const parent = plan.target.parent;
      const m = parent?.worldTransform;
      const scale = m ? Math.hypot(m.a, m.b) || 1 : 1;
      return { x: g.x, y: g.y + plan.lift * scale };
    }
    return g;
  }

  private travelTime(a: Pt, b: Pt) {
    return Math.min(TRAVEL.max, Math.max(TRAVEL.min, this.dist(a, b) / this.unit() / TRAVEL.speed));
  }

  private dist(a: Pt, b: Pt) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Global pixels per unit of the space the hand is drawn in. */
  private unit() {
    const m = this.space.worldTransform;
    return Math.hypot(m.a, m.b) || 1;
  }

  /** One touch event to the target, as a real finger's would arrive. */
  private emit(type: string, at: Pt) {
    const plan = this.plan;
    if (!plan || plan.target.destroyed) return;
    const e = new FederatedPointerEvent(this.boundary);
    e.pointerId = GHOST_POINTER;
    e.pointerType = this.kind;
    e.isPrimary = true;
    e.button = 0;
    e.buttons = type === 'pointerdown' || type === 'globalpointermove' ? 1 : 0;
    e.global.set(at.x, at.y);
    e.type = type;
    e.target = plan.target;
    e.currentTarget = plan.target;
    e.eventPhase = 2;
    plan.target.emit(type, e);
  }

  private draw(dt: number) {
    const local = this.space.toLocal(this.pos);
    if (Number.isFinite(local.x) && Number.isFinite(local.y)) this.hand.position.set(local.x, local.y);
    // The hand dips as it presses, and the blue dot shows where the touch is.
    this.art.scale.set(1 - 0.12 * this.press);
    this.dot.visible = this.down && this.kind === 'touch';
    this.dot.scale.set(0.85 + 0.15 * this.press);
    if (this.ripple < 1) {
      this.ripple = Math.min(1, this.ripple + dt / 0.45);
      const r = 30 + 60 * this.ripple;
      this.ring.clear().circle(0, 0, r).stroke({ width: 5, color: 0x3f8cff, alpha: 0.6 * (1 - this.ripple) });
    } else {
      this.ring.clear();
    }
  }
}

/** A cartoon pointing hand, fingertip at (0, 0), about a hundred units tall. */
function drawHand(): Container {
  const skin = 0xffd9b8;
  const shade = 0xf1b98f;
  const g = new Container();
  const finger = new Graphics().roundRect(-13, -2, 26, 74, 13).fill(skin).stroke({ width: 3, color: ink, alpha: 0.85 });
  const palm = new Graphics().roundRect(-36, 54, 78, 66, 26).fill(skin).stroke({ width: 3, color: ink, alpha: 0.85 });
  const knuckles = new Graphics();
  for (let i = 0; i < 3; i++) knuckles.roundRect(14 + i * 9, 44 + i * 4, 24, 34, 11).fill(shade).stroke({ width: 2.5, color: ink, alpha: 0.7 });
  const thumb = new Graphics().roundRect(-14, 0, 34, 24, 12).fill(skin).stroke({ width: 3, color: ink, alpha: 0.85 });
  thumb.position.set(-36, 76);
  thumb.rotation = 0.6;
  // The finger sits over the palm's top edge, and the palm's outline is hidden where they join.
  const join = new Graphics().rect(-9, 54, 18, 14).fill(skin);
  g.addChild(thumb, palm, knuckles, finger, join);
  g.rotation = -0.22;
  const wrap = new Container();
  wrap.addChild(g);
  return wrap;
}

/** A cartoon mouse pointer, its tip at (0, 0), big enough to read in a small window. */
function drawCursor(): Container {
  const arrow = new Graphics()
    .poly([0, 0, 0, 74, 18, 57, 32, 90, 47, 83, 33, 51, 58, 49])
    .fill(0xffffff)
    .stroke({ width: 4.5, color: ink, alpha: 0.9, join: 'round' });
  const wrap = new Container();
  wrap.addChild(arrow);
  return wrap;
}
