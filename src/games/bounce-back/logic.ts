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

/** The table the bot reads: where the right paddle's face is, the ball's reach, and the paddle's length and the walls its centre stays between. */
export interface PaddleGeometry {
  /** The x the ball's centre reaches when it meets the paddle. */
  faceX: number;
  /** The top and bottom the ball's centre bounces between. */
  top: number;
  bottom: number;
  /** The least and most the paddle's centre can be. */
  low: number;
  high: number;
  paddle: number;
  speed: number;
  /** How near the ball's centre must come to a star for it to count. */
  starReach: number;
}

/** Fold a straight-line y into [top, bottom], as a ball that bounces off both walls travels. */
function fold(y: number, top: number, bottom: number) {
  const span = bottom - top;
  let p = (((y - top) % (2 * span)) + 2 * span) % (2 * span);
  if (p > span) p = 2 * span - p;
  return top + p;
}

/** How near a ball sent leftward from (faceX, y) with the paddle's bounce comes to a star, along its way to the star's side of the table. */
function closestToStar(y: number, offsetAngle: number, star: { x: number; y: number }, g: PaddleGeometry): number {
  const vx = -Math.cos(offsetAngle) * g.speed;
  const vy = Math.sin(offsetAngle) * g.speed;
  let best = Infinity;
  for (let x = g.faceX; x >= star.x - 80; x -= 6) {
    const t = (g.faceX - x) / -vx;
    best = Math.min(best, Math.hypot(x - star.x, fold(y + vy * t, g.top, g.bottom) - star.y));
  }
  return best;
}

/**
 * Where a capable child holds the paddle for a ball arriving at height `arrive`: right where it comes, or, on the stars
 * level, slid along the paddle so the bounce sends the ball through the star (the paddle's end sends it steeply, its middle
 * straight). The paddle always meets the ball; with no star, or none the paddle can send the ball through, it is centred on the ball.
 */
export function paddleTarget(arrive: number, star: { x: number; y: number } | null, g: PaddleGeometry): number {
  const half = g.paddle / 2;
  const onTable = (y: number) => Math.max(g.low, Math.min(g.high, y));
  if (!star) return onTable(arrive);
  let best: { y: number; off: number } | null = null;
  for (let k = -20; k <= 20; k++) {
    const y = onTable(arrive - (k / 20) * half);
    const off = Math.max(-1, Math.min(1, (arrive - y) / half));
    if (Math.abs(arrive - y) > half) continue;
    if (closestToStar(arrive, off * 0.85, star, g) > g.starReach - 14) continue;
    if (!best || Math.abs(off) < Math.abs(best.off)) best = { y, off };
  }
  return best ? best.y : onTable(arrive);
}
