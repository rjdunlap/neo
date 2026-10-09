import { simulate, stepBall, type Ball, type BallWorld, type Peg } from '../../engine/ball';
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

/** A flipper's swing as the game keeps it: its angle, and how much longer it is held up. */
export interface FlipperState {
  angle: number;
  upFor: number;
}
export type Flippers = Record<FlipperSide, FlipperState>;
export const restingFlippers = (): Flippers => ({ left: { angle: FLIPPER.rest, upFor: 0 }, right: { angle: FLIPPER.rest, upFor: 0 } });
/** The pegs that stand for the two flippers are the last twelve of a world. */
const FLIPPER_PEGS = 12;

/** Swing both flippers one frame (up fast while held, then settling back) and move their pegs to match. The game and the bot's look ahead both use this. */
export function swingFlippers(flippers: Flippers, world: BallWorld, dt: number) {
  let k = world.pegs.length - FLIPPER_PEGS;
  for (const side of ['left', 'right'] as FlipperSide[]) {
    const f = flippers[side];
    f.upFor = Math.max(0, f.upFor - dt);
    const target = f.upFor > 0 ? FLIPPER.up : FLIPPER.rest;
    f.angle += Math.sign(target - f.angle) * Math.min(Math.abs(target - f.angle), dt * (f.upFor > 0 ? 22 : 9));
    for (const p of flipperPoints(side, f.angle)) Object.assign(world.pegs[k++], p);
  }
}

/** How near the ball must be to a flipper for a flip to bat it. Young players get a wider reach. */
export const kickReach = (ballRadius: number, wide: boolean) => ballRadius + 12 + (wide ? 46 : 30);

/**
 * What a flip does to the ball: it flies back up, leaning one way or the other by where along the flipper it was struck (0 at
 * the pivot, 1 at the tip), with a little chance in it (`noise` is asked for only when the flip connects). Null if the
 * ball is out of reach, or already rising fast.
 */
export function kickBall(ball: Ball, side: FlipperSide, wide: boolean, noise: () => number): { vx: number; vy: number } | null {
  const pts = flipperPoints(side, FLIPPER.rest, 12);
  let best = Infinity;
  let at = 0;
  pts.forEach((p, i) => {
    const d = Math.hypot(p.x - ball.x, p.y - ball.y);
    if (d < best) [best, at] = [d, i / (pts.length - 1)];
  });
  if (best > kickReach(ball.r, wide) || ball.vy < -250) return null;
  const s = side === 'left' ? 1 : -1;
  return { vx: s * (320 - 420 * at) + noise(), vy: -880 - 80 * at };
}

/** The game moves the ladybug and the flippers in steps of this length however fast the screen draws, so a look ahead and the game agree. */
export const STEP = 1 / 120;
/** How far ahead the free flight is followed, and how far after a flip (in steps). */
const FREE_FRAMES = 120 * 7;
const AFTER_FRAMES = 120 * 4;
/** A flip that works at the planned step and the next few is a flip that works when the hand lands a step late. */
const LATE = 2;
/** A flip that cannot reach a flower is only worth it if it keeps the ladybug up this many steps longer. */
const KEEP_GAIN = 60;

interface Moment {
  ball: Ball;
  /** How many flowers had been touched by now. */
  touched: number;
}

/**
 * Play the ball forward a frame at a time, the way the game does (flippers swing, then the ball moves), from `start` with
 * the flippers at rest, pressing `press` on the first frame if asked. Returns the flowers it touches (after those already
 * in `before`), where it was before each frame, and how many frames it stayed up.
 */
function playOut(world: BallWorld, flowers: number, start: Ball, before: readonly number[], wide: boolean, noise: number, press: FlipperSide | null, limit: number) {
  const w: BallWorld = { ...world, pegs: world.pegs.map((p) => ({ ...p })) };
  const flippers = restingFlippers();
  const b = { ...start };
  const hits = [...before];
  const moments: Moment[] = [];
  let frames = 0;
  for (; frames < limit; frames++) {
    moments.push({ ball: { ...b }, touched: hits.length });
    if (press && frames === 0) {
      flippers[press].upFor = 0.2;
      const v = kickBall(b, press, wide, () => noise);
      if (v) Object.assign(b, v);
    }
    swingFlippers(flippers, w, STEP);
    for (const i of stepBall(b, w, STEP)) if (i < flowers && !hits.includes(i)) hits.push(i);
    if (b.y + b.r >= CATCH_Y) break;
  }
  return { hits, moments, frames };
}

/** When and where to press a flipper: after `frame` more steps of play, when the ball is at (x, y). */
export interface FlipPlan {
  side: FlipperSide;
  frame: number;
  x: number;
  y: number;
}

/**
 * A look ahead for a bot. From the ball as it is now, with the flippers at rest and the chance in the next flip (`noise`, the
 * game's next random draw) known, find the moment to press that gets a wanted flower touched. If the ball will touch one
 * anyway there is nothing to do (null). Otherwise the earliest press whose flight touches one; failing that the press that
 * keeps the ball up longest, for another pass.
 */
export function planFlip(world: BallWorld, flowers: number, ball: Ball, wide: boolean, noise: number, wanted: (flower: number) => boolean): FlipPlan | null {
  const free = playOut(world, flowers, ball, [], wide, noise, null, FREE_FRAMES);
  if (free.hits.some(wanted)) return null;
  const sides = ['left', 'right'] as FlipperSide[];
  // What a flip at a step is worth, worked out when it is first asked for.
  const cache = new Map<string, { value: number; frames: number } | null>();
  const worth = (side: FlipperSide, frame: number) => {
    const key = `${side}${frame}`;
    if (!cache.has(key)) {
      const at = free.moments[frame];
      if (!at || !kickBall(at.ball, side, wide, () => noise)) cache.set(key, null);
      else {
        const out = playOut(world, flowers, at.ball, free.hits.slice(0, at.touched), wide, noise, side, AFTER_FRAMES);
        cache.set(key, { value: out.hits.filter(wanted).length, frames: out.frames });
      }
    }
    return cache.get(key)!;
  };
  // The longest-lasting flip, for a ball that cannot be sent to a flower this time: another pass may.
  let keep: { plan: FlipPlan; frames: number } | null = null;
  // Every few steps, earliest first: the ball moves only a few units in between.
  for (let frame = 0; frame < free.moments.length; frame += LATE + 1) {
    for (const side of sides) {
      const w = worth(side, frame);
      if (!w) continue;
      const at = free.moments[frame].ball;
      const plan = { side, frame, x: at.x, y: at.y };
      // The hand may press a step late: a flip that works here and the next steps on is a flip that works.
      if (w.value > 0 && Array.from({ length: LATE }, (_, k) => worth(side, frame + 1 + k)).every((o) => o && o.value > 0)) return plan;
      // Only a flip that keeps the ladybug up clearly longer than it would stay on its own is worth pressing.
      if (w.value === 0 && frame + w.frames > free.moments.length + KEEP_GAIN && (!keep || frame + w.frames > keep.frames)) keep = { plan, frames: frame + w.frames };
    }
  }
  // A ladybug still bouncing about at the end of the look ahead will be looked at again soon enough: no need to save it yet.
  return free.moments.length < FREE_FRAMES ? (keep?.plan ?? null) : null;
}
