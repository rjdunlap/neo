import { simulate, type BallWorld, type Peg } from '../../engine/ball';
import type { Rng } from '../../engine/random';

/**
 * Bumper Garden, after Pokémon Pinball and Space Cadet: a ladybug ball bounces around flower bumpers
 * that bloom and chime. It never drains: past the flippers, a springy flower pot catches it and pops
 * it back up. The ladder goes from launching for fun, to flipping until every flower blooms, to
 * blooming one color, then numbered flowers in order.
 */
export type BumperMode = 'spring' | 'bloom' | 'color' | 'order';

export interface BumperPlan {
  mode: BumperMode;
  bumpers: number;
  /** spring: launches. bloom: every flower. color: flowers of the asked color. order: numbers 1..goal. */
  goal: number;
  name: string;
}

export const PLANS: BumperPlan[] = [
  { mode: 'spring', bumpers: 6, goal: 6, name: 'Tap to launch the ladybug; flowers bloom when it bumps them' },
  { mode: 'bloom', bumpers: 5, goal: 5, name: 'Flip the ladybug back up until every flower blooms' },
  { mode: 'color', bumpers: 7, goal: 3, name: 'Bloom the three flowers of one color' },
  { mode: 'order', bumpers: 6, goal: 3, name: 'Bump flowers 1, 2, 3 in order' },
  { mode: 'order', bumpers: 8, goal: 5, name: 'Bump flowers 1 to 5 in order, with others in the way' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The table in its own units; the ball falls out between the flippers into the pot. */
export const TABLE = { w: 600, h: 720, ball: 18, bumper: 36, gravity: 430, bounce: 0.72, kick: 380 };

/** Where flowers can grow, in the open upper part of the table. */
export const SPOTS: { x: number; y: number }[] = [
  { x: 140, y: 150 },
  { x: 300, y: 110 },
  { x: 460, y: 150 },
  { x: 215, y: 270 },
  { x: 385, y: 270 },
  { x: 120, y: 390 },
  { x: 300, y: 380 },
  { x: 480, y: 390 },
];

/** Flippers: pivot, length, and the angles at rest and flipped (left flipper; the right one mirrors). */
export const FLIPPER = { x: 170, y: 600, length: 106, rest: 0.5, up: -0.4 };
/** Below this the ball has passed the flippers: the pot catches it. */
export const CATCH_Y = TABLE.h - 34;
export const LAUNCH = { x: TABLE.w / 2, y: TABLE.h - 60, speed: 1000, spread: 0.42 };

export type FlipperSide = 'left' | 'right';

/** Points along a flipper at an angle (radians; positive tips it down toward the middle). */
export function flipperPoints(side: FlipperSide, angle: number, n = 6): { x: number; y: number }[] {
  const s = side === 'left' ? 1 : -1;
  const px = side === 'left' ? FLIPPER.x : TABLE.w - FLIPPER.x;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * FLIPPER.length;
    return { x: px + s * Math.cos(angle) * t, y: FLIPPER.y + Math.sin(angle) * t };
  });
}

/** Sloping hedges that steer the ball from the walls down onto the flippers. */
export function funnel(): Peg[] {
  const out: Peg[] = [];
  for (const side of ['left', 'right'] as FlipperSide[]) {
    const x0 = side === 'left' ? 0 : TABLE.w;
    const x1 = side === 'left' ? FLIPPER.x - 6 : TABLE.w - FLIPPER.x + 6;
    const y0 = FLIPPER.y - 150;
    for (let t = 0; t <= 1.0001; t += 1 / 12) out.push({ x: x0 + (x1 - x0) * t, y: y0 + (FLIPPER.y - y0) * t, r: 10 });
  }
  return out;
}

export interface Bumper {
  x: number;
  y: number;
  /** A color index, or a number to hit in order. */
  color: number;
  number: number | null;
}

/** Flowers for a round. Color levels have exactly `goal` flowers of the asked color (color 0). */
export function makeBumpers(plan: BumperPlan, rng: Rng): Bumper[] {
  const spots = rng.shuffle([...SPOTS]).slice(0, plan.bumpers);
  return spots.map((s, i) => {
    if (plan.mode === 'color') return { ...s, color: i < plan.goal ? 0 : 1 + (i % 2), number: null };
    if (plan.mode === 'order') return { ...s, color: i % 3, number: i < plan.goal ? i + 1 : null };
    return { ...s, color: i % 3, number: null };
  });
}

/** The world for physics: flowers first (so hit indexes match bumpers), then hedges, then flippers at rest. */
export function makeWorld(bumpers: readonly Bumper[], flippers: Record<FlipperSide, number> = { left: FLIPPER.rest, right: FLIPPER.rest }): BallWorld {
  const flipperPegs = (['left', 'right'] as FlipperSide[]).flatMap((side) => flipperPoints(side, flippers[side]).map((p) => ({ ...p, r: 12 })));
  return {
    pegs: [...bumpers.map((b) => ({ x: b.x, y: b.y, r: TABLE.bumper, kick: TABLE.kick })), ...funnel(), ...flipperPegs],
    left: 0,
    right: TABLE.w,
    top: 0,
    gravity: TABLE.gravity,
    bounce: TABLE.bounce,
  };
}

/** A launch from the pot: angle 0 is straight up, positive leans right. */
export function launchVelocity(angle: number) {
  const a = Math.max(-LAUNCH.spread, Math.min(LAUNCH.spread, angle));
  return { vx: Math.sin(a) * LAUNCH.speed, vy: -Math.cos(a) * LAUNCH.speed };
}

/** Follow a launch (flippers resting) until the pot catches it. */
export function flight(world: BallWorld, angle: number, seconds = 20) {
  return simulate({ x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(angle), r: TABLE.ball }, world, CATCH_Y, seconds, 1 / 60);
}

/** A launch angle whose flight bumps a flower that `wanted` accepts (by bumper index), or null. */
export function aimFor(world: BallWorld, count: number, wanted: (i: number) => boolean): number | null {
  for (let k = 0; k <= 84; k++) {
    // Search outward from straight up, alternating sides.
    const a = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.01;
    const hits = flight(world, a, 8).hits.filter((i) => i < count);
    if (hits.some(wanted)) return a;
  }
  return null;
}
