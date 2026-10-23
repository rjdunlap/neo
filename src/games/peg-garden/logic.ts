import { simulate, type BallWorld } from '../../engine/ball';
import type { Rng } from '../../engine/random';

/**
 * Peg Garden, after Peggle and pachinko: drop a pearl into a sea garden of flower buds.
 * Every bud it touches blooms and chimes. Nothing is ever lost; the ladder asks for
 * particular flowers, then for aiming at numbers.
 */
export type PegMode = 'drop' | 'bloom' | 'color' | 'number' | 'order' | 'big';

export interface PegPlan {
  mode: PegMode;
  /** Buds on the board. */
  pegs: number;
  /** drop: balls in a round. color: special buds. number/order: numbered buds. */
  count: number;
  name: string;
}

export const PLANS: PegPlan[] = [
  { mode: 'drop', pegs: 22, count: 6, name: 'Tap the top to drop a pearl through the flowers' },
  { mode: 'bloom', pegs: 9, count: 0, name: 'Make every flower bloom' },
  { mode: 'color', pegs: 16, count: 4, name: 'Bloom the four orange flowers (counted aloud)' },
  { mode: 'number', pegs: 14, count: 5, name: 'Aim the launcher to hit a numbered flower: "hit 3"' },
  { mode: 'order', pegs: 14, count: 3, name: 'Hit numbered flowers 1, 2, 3 in order' },
];

/** Level 8, the lap entry: four huge buds, and every touch blooms one. Plans are keyed by ID, so it sits outside the ladder's order. */
export const BIG_LEVEL = 8;
export const BIG_PLAN: PegPlan = { mode: 'big', pegs: 4, count: 0, name: 'Four huge flowers: any pearl that touches one makes it bloom' };

export const planFor = (level: number) => (level === BIG_LEVEL ? BIG_PLAN : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1]);

/** The huge buds' radius: nearly three plain buds across, so a pearl dropped anywhere near one touches it. */
export const BIG_PEG = 60;

/** The four huge buds, a diamond with a pearl's width and more between each pair and from the walls. */
export const BIG_SPOTS: { x: number; y: number }[] = [
  { x: 340, y: 200 },
  { x: 170, y: 340 },
  { x: 510, y: 340 },
  { x: 340, y: 480 },
];

/** The board, in its own units: pegs live inside it and the ball falls out the bottom. */
export const BOARD = { w: 680, h: 600, top: 120, peg: 22, ball: 15 };

export interface PegSpot {
  x: number;
  y: number;
  /** 'plain', a special color bud, or a number 1..n. */
  kind: 'plain' | 'special' | number;
  /** A bud's radius when it is not a plain bud's. */
  r?: number;
}

/**
 * The board shapes a round is grown on, picked from a seeded pool: staggered rows like a pachinko board, a diamond that
 * widens to the middle, an hourglass that narrows there, and rows that rise and fall like waves. Every shape keeps buds at
 * least 80 units apart, so a pearl always passes between two of them, and above the sand.
 */
export const SHAPES = ['rows', 'diamond', 'hourglass', 'waves'] as const;
export type BoardShape = (typeof SHAPES)[number];

const ROWS: Record<BoardShape, number[]> = {
  rows: [7, 6, 7, 6, 7, 6],
  diamond: [4, 5, 6, 7, 6, 5],
  hourglass: [7, 6, 5, 4, 5, 6],
  waves: [7, 6, 7, 6, 7, 6],
};

/** The least distance from a side wall to a bud's centre on the newer shapes: the bud, a pearl's width and a little. */
export const EDGE = BOARD.peg + 2 * BOARD.ball + 6;

/** Every place a bud can grow on a shape: rows centred on the board, each a half step from the next. */
export function grid(shape: BoardShape = 'rows'): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  ROWS[shape].forEach((cols, r) => {
    // The newer shapes leave a pearl's width and a little between the side walls and the outer buds, so none wedges there
    // (the first shape, which couch play keeps, has 27 units at its seven-bud rows; a pearl caught there ends after ten seconds).
    const gap = shape === 'rows' ? BOARD.w / 7 : Math.min(BOARD.w / 7, (BOARD.w - 2 * EDGE) / (cols - 1));
    const offset = (BOARD.w - (cols - 1) * gap) / 2;
    for (let c = 0; c < cols; c++) {
      const x = offset + c * gap;
      const wave = shape === 'waves' ? 18 * Math.sin((x / BOARD.w) * Math.PI * 2) : 0;
      out.push({ x, y: BOARD.top + (shape === 'waves' ? 18 : 30) + r * 78 + wave });
    }
  });
  return out;
}

export function makeBoard(plan: PegPlan, rng: Rng, shape: BoardShape = 'rows'): PegSpot[] {
  if (plan.mode === 'big') return BIG_SPOTS.map((p): PegSpot => ({ ...p, kind: 'plain', r: BIG_PEG }));
  const spots = rng.shuffle(grid(shape)).slice(0, plan.pegs).map((p): PegSpot => ({ ...p, kind: 'plain' }));
  // Specials and numbers sit in the middle rows, where an aimed shot can reach them.
  const reachable = rng.shuffle(spots.filter((s) => s.x > 80 && s.x < BOARD.w - 80));
  if (plan.mode === 'color') reachable.slice(0, plan.count).forEach((s) => (s.kind = 'special'));
  if (plan.mode === 'number' || plan.mode === 'order') reachable.slice(0, plan.count).forEach((s, i) => (s.kind = i + 1));
  return spots;
}

/** The sea a round is played in: daytime shallows, a pink coral reef, or a green kelp forest. */
export const BACKDROPS = ['shallows', 'reef', 'kelp'] as const;
export type Backdrop = (typeof BACKDROPS)[number];

/** A round's look, drawn first from the round's seed. Couch play keeps the first look, so its boards never change. */
export function pickTheme(rng: Rng | null): { shape: BoardShape; backdrop: Backdrop } {
  if (!rng) return { shape: 'rows', backdrop: 'shallows' };
  return { shape: rng.pick(SHAPES), backdrop: rng.pick(BACKDROPS) };
}

/**
 * Whether a touched bud blooms. On the aiming levels a numbered bud opens only when it is the one asked for (the others
 * chime and wiggle), so open flowers show what is done; every other bud blooms at a touch.
 */
export const blooms = (kind: PegSpot['kind'], mode: PegMode, target: number | undefined) =>
  typeof kind !== 'number' || (mode !== 'number' && mode !== 'order') || kind === target;

/** The shell tray along the sand, where finished pearls collect: this many show, side by side. */
export const TRAY = { slots: 12, gap: 26, y: BOARD.h - 15 };

/** Where the `i`th finished pearl sits in the tray (pearls past the last slot wait in it). */
export const traySlot = (i: number) => ({ x: BOARD.w / 2 + (Math.min(i, TRAY.slots - 1) - (TRAY.slots - 1) / 2) * TRAY.gap, y: TRAY.y });

/** The numbers to aim for, one per shot. Order levels count up from 1. */
export function targets(plan: PegPlan, rng: Rng): number[] {
  if (plan.mode === 'order') return Array.from({ length: plan.count }, (_, i) => i + 1);
  if (plan.mode !== 'number') return [];
  return rng.shuffle(Array.from({ length: plan.count }, (_, i) => i + 1)).slice(0, 3);
}

/** Aiming: the launcher swings between these angles (radians from straight down). */
export const AIM_LIMIT = 1.15;
export const SHOT_SPEED = 620;

/** The launch velocity for an aim angle (0 is straight down, positive is to the right). */
export function aimVelocity(angle: number) {
  const a = Math.max(-AIM_LIMIT, Math.min(AIM_LIMIT, angle));
  return { vx: Math.sin(a) * SHOT_SPEED, vy: Math.cos(a) * SHOT_SPEED };
}

/**
 * An angle near `near` whose shot touches bud `want`, preferring one whose neighbours a hair either side touch it too (the
 * couch bot and the ghost finger both aim with it), or null if no angle does. A shot is exact, so a lone angle still works.
 */
export function aimAt(world: BallWorld, want: number, near: number, margins: readonly number[] = [0.012, 0.005, 0]): number | null {
  const hits = (a: number) => simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, world, BOARD.h, 12, 1 / 30).hits.includes(want);
  const angles: number[] = [];
  for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.01) angles.push(a);
  for (const m of margins) {
    let best: number | null = null;
    for (const a of angles) {
      if (best !== null && Math.abs(a - near) >= Math.abs(best - near)) continue;
      if (hits(a) && (m === 0 || (hits(a - m) && hits(a + m)))) best = a;
    }
    if (best !== null) return best;
  }
  return null;
}

/** How far a dropped pearl drifts sideways as it is let go (the game picks a drift between plus and minus this). */
export const DRIFT = 20;

/**
 * Where to let a pearl go from the top so it touches the buds that `wanted` accepts, given the drift it will have (the bot
 * looks at the game's next random draw). Each place is tried a unit or two either side too, as a real frame rate is never
 * quite the simulation's. The best place is the one whose every try touches a wanted bud (`sure`), and then, when a shot
 * with none counts against her (`early`), the one that touches it soonest, since a pearl is least certain after many bounces,
 * and otherwise the one that touches most. Ties go to the middle.
 */
export function dropAt(world: BallWorld, wanted: (bud: number) => boolean, drift: number, early = false): { x: number; sure: boolean } {
  const xs: number[] = [];
  for (let x = BOARD.ball + 2; x <= BOARD.w - BOARD.ball - 2; x += 4) xs.push(x);
  xs.sort((a, b) => Math.abs(a - BOARD.w / 2) - Math.abs(b - BOARD.w / 2));
  // What each place is worth, best first when compared in turn.
  const worth = (x: number) => {
    const tries = [-2, 0, 2].map((off) => {
      const hits = simulate({ x: x + off, y: 40, vx: drift, vy: 60, r: BOARD.ball }, world, BOARD.h, 12, 1 / 30).hits;
      const first = hits.findIndex(wanted);
      return { count: hits.filter(wanted).length, first: first < 0 ? Infinity : first };
    });
    const floor = Math.min(...tries.map((t) => t.count));
    const sum = tries.reduce((a, t) => a + t.count, 0);
    return { floor, key: early ? [floor > 0 ? 1 : 0, -Math.max(...tries.map((t) => t.first)), sum] : [floor, sum] };
  };
  const beats = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
  };
  let best = { x: xs[0], ...worth(xs[0]) };
  for (const x of xs.slice(1)) {
    const w = worth(x);
    if (beats(w.key, best.key)) best = { x, ...w };
  }
  return { x: best.x, sure: best.floor > 0 };
}

/** On the bloom level, pearls in a row that wake no new flower before the next one is let go over a waiting flower. */
export const STALL_AT = 2;

/** How far a pearl may drift as it is let go on a level: none on the colour level, so a miss there is her choice of spot. */
export const driftOf = (mode: PegMode) => (mode === 'color' ? 0 : DRIFT);

/** Where a tap lets a pearl go: straight above it, or the nearest point on the ledge for a tap beside the board. */
export const ledgeX = (x: number) => Math.max(BOARD.ball, Math.min(BOARD.w - BOARD.ball, x));

/**
 * Whether the next pearl is let go over a waiting flower instead of the tapped spot: on the bloom and colour levels after
 * `STALL_AT` pearls in a row that woke nothing wanted, and on the colour level while its hint is on.
 */
export const guided = (mode: PegMode, stalled: number, hinting: boolean) =>
  (mode === 'bloom' || mode === 'big' || mode === 'color') && (stalled >= STALL_AT || (mode === 'color' && hinting));
