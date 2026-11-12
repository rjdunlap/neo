import { overlaps, spotRect, type LandLayout, type Rect } from '../content/lands';
import type { Rng } from '../engine/random';
import type { View } from '../engine/view';

/**
 * P5 pilot (docs/POK-POK.md#p5-residents-that-carry-on-a-note-for-rw13-and-rw14-m): a resident that carries on. It
 * rests at home, walks to one or two marked stops of free ground, uses the thing at the first (the chime), walks back,
 * and turns toward her last touch. Pure logic, no drawing: `LocationScene` moves the resident with it, and its test
 * checks every stop and every step of every leg against what the land's screen already holds.
 *
 * Nothing here is saved, owed or hungry: it is a function of the seconds the screen has been open, so being away
 * changes nothing, and it never asks her for anything.
 */

/** A resident's footprint round its feet, in host units: how far it and its touch circle reach to each side, above and below. */
export interface Footprint {
  side: number;
  up: number;
  down: number;
}

export interface Stop {
  x: number;
  y: number;
}

/** The farthest a stop is from home, in view units: close enough to read as the same neighbourhood. */
export const MAX_RANGE = 420;
/** The step along a leg at which clearance is checked, in view units. */
const STEP = 12;
/** The grid of feet positions tried for a stop, in view units. */
const GRID = 16;

/** The rectangle `foot` and its footprint cover in a layout whose host stands at scale `s`. */
export const footprintAt = (foot: Stop, fp: Footprint, s: number): Rect => ({
  x: foot.x - fp.side * s,
  y: foot.y - fp.up * s,
  w: fp.side * 2 * s,
  h: (fp.up + fp.down) * s,
});

/** What a resident must stay off: every other spot, the guide corner, the corner buttons and the heading (its own spot is its home). */
export function wanderKeepOut(layout: LandLayout, keepOut: readonly Rect[]): Rect[] {
  const own = spotRect(layout.host, layout.box);
  return keepOut.filter((k) => k.x !== own.x || k.y !== own.y || k.w !== own.w || k.h !== own.h);
}

/**
 * Home, then up to two stops of free ground near it: `[home]` alone where a full land screen leaves no gap. Every
 * footprint along every leg of home → first → second → home clears `others` and stays on screen, and the two stops are
 * a footprint apart, so a stop is somewhere else rather than a shuffle. Deterministic: the nearest clear gap, then the
 * next nearest that is far enough from the first.
 */
export function wanderRoute(
  layout: LandLayout,
  view: View,
  others: readonly Rect[],
  fp: Footprint,
  s: number,
): Stop[] {
  const home = layout.host;
  const clear = (p: Stop) => {
    const r = footprintAt(p, fp, s);
    return (
      r.x >= 0 &&
      r.y >= 0 &&
      r.x + r.w <= view.w &&
      r.y + r.h <= view.h &&
      !others.some((k) => overlaps(r, k))
    );
  };
  const legClear = (a: Stop, b: Stop) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / STEP));
    for (let i = 0; i <= n; i++)
      if (!clear({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n })) return false;
    return true;
  };
  const apart = fp.side * s * 1.2;
  const found: Stop[] = [];
  for (let y = GRID; y < view.h; y += GRID)
    for (let x = GRID; x < view.w; x += GRID) {
      const d = Math.hypot(x - home.x, y - home.y);
      if (d >= apart && d <= MAX_RANGE && clear({ x, y })) found.push({ x, y });
    }
  const byHome = (a: Stop, b: Stop) =>
    Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y) || a.y - b.y || a.x - b.x;
  found.sort(byHome);
  const dist = (a: Stop, b: Stop) => Math.hypot(a.x - b.x, a.y - b.y);
  // The first stop is the nearest one whose leg home is clear, which is where it uses the chime.
  const first = found.find((p) => legClear(home, p));
  if (!first) return [{ ...home }];
  const second = found.find((p) => dist(p, first) >= apart * 1.5 && legClear(first, p) && legClear(p, home));
  return [{ ...home }, first, ...(second ? [second] : [])];
}

/** How a Wanderer is doing: resting at a stop, walking to the next, or using what is there. */
export type WanderMode = 'rest' | 'walk' | 'use';

/** Its speed along a leg, in view units a second: an amble, not a dash. */
export const WALK_SPEED = 80;
/** How long it uses what it finds at the first stop, in seconds. */
export const USE_TIME = 2.4;
/** How long it rests at home before setting out, in seconds: between these, drawn from the seeded generator. */
export const REST_RANGE: readonly [number, number] = [5, 9];
/** How long it rests at its second stop before heading home, in seconds. */
const PAUSE = 2.5;

export class Wanderer {
  x = 0;
  y = 0;
  mode: WanderMode = 'rest';
  /** +1 faces right (the art's own way), -1 left. */
  facing: 1 | -1 = 1;
  /** Where she last touched, in view units, or null before she has; it faces her way whenever it is not walking. */
  private lookX: number | null = null;
  private route: Stop[] = [{ x: 0, y: 0 }];
  /** The stop it is at, or walking to. */
  private at = 0;
  private wait = 0;
  /** `arrive(i)` fires when it reaches stop `i` (i ≥ 1) and starts using what is there, for the scene's chime. */
  constructor(
    private readonly rng: Rng,
    private readonly arrive: (stop: number) => void = () => {},
  ) {}

  /** Stand at home, `route[0]`, with these stops to visit (a resize resets it: nothing remembers where it was). */
  setRoute(route: readonly Stop[]) {
    this.route = route.map((p) => ({ ...p }));
    this.at = 0;
    this.mode = 'rest';
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.wait = this.restTime();
  }

  get stops(): readonly Stop[] {
    return this.route;
  }

  /** She touched at `x`: it turns toward it as soon as it is standing still (a walker keeps its way until it stops). */
  look(x: number) {
    this.lookX = x;
    if (this.mode !== 'walk') this.turn();
  }

  private restTime() {
    return this.rng.range(REST_RANGE[0], REST_RANGE[1]);
  }

  private turn() {
    if (this.lookX === null) return;
    if (Math.abs(this.lookX - this.x) > 8) this.facing = this.lookX > this.x ? 1 : -1;
  }

  update(dt: number) {
    if (this.route.length < 2) return;
    if (this.mode === 'walk') {
      const to = this.route[(this.at + 1) % this.route.length];
      const dx = to.x - this.x;
      const dy = to.y - this.y;
      const d = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      // Only a leg that goes mostly sideways turns it: a climb straight up keeps the way it faced.
      if (Math.abs(dx) > Math.abs(dy) * 0.5 && Math.abs(dx) > 1) this.facing = dx > 0 ? 1 : -1;
      if (d <= step) {
        this.x = to.x;
        this.y = to.y;
        this.at = (this.at + 1) % this.route.length;
        this.turn();
        if (this.at === 1) {
          this.mode = 'use';
          this.wait = USE_TIME;
          this.arrive(1);
        } else {
          this.mode = 'rest';
          this.wait = this.at === 0 ? this.restTime() : PAUSE;
        }
      } else {
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
      }
      return;
    }
    this.wait -= dt;
    if (this.wait <= 0) this.mode = 'walk';
  }
}
