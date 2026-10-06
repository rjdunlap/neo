import type { Rng } from '../../engine/random';

/**
 * Peg Garden, after Peggle and pachinko: drop a pearl into a sea garden of flower buds.
 * Every bud it touches blooms and chimes. Nothing is ever lost; the ladder asks for
 * particular flowers, then for aiming at numbers.
 */
export type PegMode = 'drop' | 'bloom' | 'color' | 'number' | 'order';

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

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The board, in its own units: pegs live inside it and the ball falls out the bottom. */
export const BOARD = { w: 680, h: 600, top: 120, peg: 22, ball: 15 };

export interface PegSpot {
  x: number;
  y: number;
  /** 'plain', a special color bud, or a number 1..n. */
  kind: 'plain' | 'special' | number;
}

/** Every place a bud can grow: staggered rows, like a pachinko board. */
export function grid(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const cols = r % 2 ? 6 : 7;
    const gap = BOARD.w / 7;
    const offset = r % 2 ? gap : gap / 2;
    for (let c = 0; c < cols; c++) out.push({ x: offset + c * gap, y: BOARD.top + 30 + r * 78 });
  }
  return out;
}

export function makeBoard(plan: PegPlan, rng: Rng): PegSpot[] {
  const spots = rng.shuffle(grid()).slice(0, plan.pegs).map((p): PegSpot => ({ ...p, kind: 'plain' }));
  // Specials and numbers sit in the middle rows, where an aimed shot can reach them.
  const reachable = rng.shuffle(spots.filter((s) => s.x > 80 && s.x < BOARD.w - 80));
  if (plan.mode === 'color') reachable.slice(0, plan.count).forEach((s) => (s.kind = 'special'));
  if (plan.mode === 'number' || plan.mode === 'order') reachable.slice(0, plan.count).forEach((s, i) => (s.kind = i + 1));
  return spots;
}

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
