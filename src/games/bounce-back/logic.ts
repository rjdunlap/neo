/**
 * Bounce Back, after Pong and air hockey: a big paddle each side and a slow, giggly ball.
 * A grown-up plays one side and the child the other (the pet steps in when nobody is there).
 * There's no score: bounces are counted together toward a goal.
 */
export type BounceMode = 'solo' | 'rally' | 'together' | 'stars' | 'count';

export interface BouncePlan {
  mode: BounceMode;
  /** Bounces in a row (or stars) to finish. */
  goal: number;
  /** Ball speed, logical units per second. */
  speed: number;
  /** Paddle length. */
  paddle: number;
  name: string;
}

export const PLANS: BouncePlan[] = [
  { mode: 'solo', goal: 3, speed: 230, paddle: 300, name: 'Bounce a slow ball back to the pet with a huge paddle' },
  { mode: 'rally', goal: 5, speed: 280, paddle: 240, name: 'Keep a rally going with the pet: 5 bounces' },
  { mode: 'together', goal: 8, speed: 300, paddle: 220, name: 'Play together: a grown-up takes the other paddle (8 bounces)' },
  { mode: 'stars', goal: 5, speed: 320, paddle: 210, name: 'Aim: bounce the ball through 5 stars' },
  { mode: 'count', goal: 10, speed: 340, paddle: 200, name: 'Count a rally of 10 out loud together' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * Where a ball at (x, y) moving (vx, vy) crosses `targetX`, folding in bounces off the top and
 * bottom walls. Used by the pet's paddle and the hint marker.
 */
export function predictY(x: number, y: number, vx: number, vy: number, targetX: number, top: number, bottom: number): number {
  if (vx === 0 || Math.sign(targetX - x) !== Math.sign(vx)) return y;
  const t = (targetX - x) / vx;
  const span = bottom - top;
  let p = y - top + vy * t;
  // Reflect into [0, span] like a mirror corridor.
  p = ((p % (2 * span)) + 2 * span) % (2 * span);
  if (p > span) p = 2 * span - p;
  return top + p;
}

/**
 * A paddle hit: the ball goes back the other way, angled by where it struck the paddle
 * (the middle sends it straight, the ends send it steeply), at the same speed.
 */
export function paddleBounce(ballY: number, paddleY: number, paddleLength: number, speed: number, towardRight: boolean) {
  const offset = Math.max(-1, Math.min(1, (ballY - paddleY) / (paddleLength / 2)));
  const angle = offset * 0.85;
  return { vx: Math.cos(angle) * speed * (towardRight ? 1 : -1), vy: Math.sin(angle) * speed };
}
