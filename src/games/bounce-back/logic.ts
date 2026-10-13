/**
 * Bounce Back, after Pong and air hockey: a big paddle each side and a slow, giggly ball.
 * A grown-up plays one side and the child the other (the pet steps in when nobody is there).
 * There's no score: bounces are counted together toward a goal.
 */
export type BounceMode = 'solo' | 'rally' | 'together' | 'stars' | 'count' | 'color' | 'goal' | 'versus';

export interface BouncePlan {
  mode: BounceMode;
  /** Bounces in a row (or stars) to finish. */
  goal: number;
  /** Ball speed, logical units per second. */
  speed: number;
  /** Paddle length. */
  paddle: number;
  /** On the goal levels, how much of half the table the pet's paddle can cover while the ball crosses (so a good shot always beats it). */
  keeper?: number;
  name: string;
}

export const PLANS: BouncePlan[] = [
  { mode: 'solo', goal: 3, speed: 230, paddle: 300, name: 'Bounce a slow ball back to the pet with a huge paddle' },
  { mode: 'rally', goal: 5, speed: 280, paddle: 240, name: 'Keep a rally going with the pet: 5 bounces' },
  { mode: 'together', goal: 8, speed: 300, paddle: 220, name: 'Play together: a grown-up takes the other paddle (8 bounces)' },
  { mode: 'stars', goal: 5, speed: 320, paddle: 210, name: 'Aim: bounce the ball through 5 stars' },
  { mode: 'count', goal: 10, speed: 340, paddle: 200, name: 'Count a rally of 10 out loud together' },
  { mode: 'color', goal: 4, speed: 300, paddle: 200, name: 'Bounce the ball to the color the pet calls (4 times)' },
  { mode: 'goal', goal: 5, speed: 400, paddle: 210, keeper: 0.35, name: 'Score 5 goals past a sleepy keeper' },
  { mode: 'versus', goal: 7, speed: 480, paddle: 190, keeper: 0.5, name: 'First to 7 goals: the ball gets faster with every bounce' },
];

/** The three color zones down the pet's wall, top to bottom. */
export const ZONES = ['red', 'yellow', 'blue'] as const;
export type ZoneName = (typeof ZONES)[number];

/** Which zone a ball reaching the wall at `y` is in (the wall from `top` to `bottom`, in equal thirds). */
export const zoneOf = (y: number, top: number, bottom: number): number => Math.max(0, Math.min(ZONES.length - 1, Math.floor(((y - top) / (bottom - top)) * ZONES.length)));

export const isGoalMode = (m: BounceMode) => m === 'goal' || m === 'versus';

/** The ball's speed on the versus level: a little faster after each bounce of a volley, never more than 1.4 times. */
export const volleySpeed = (base: number, volley: number) => base * Math.min(1.4, 1 + 0.06 * volley);

/**
 * What a goal round tells the difficulty: a win counts one miss for every two goals against, a loss counts them all. A hard-fought win
 * stays smooth, a clear loss counts as struggling, and neither is a failure: the round finishes and gives its sticker either way.
 */
export const versusMisses = (won: boolean, against: number) => (won ? Math.floor(against / 2) : against);

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

/**
 * What a ball past her paddle does to the help: two misses in a row start a hint (the ball slows and a ring shows where it will
 * arrive). A bounce of hers ends it (`afterHit`), so a later run of misses can earn another. The rally is never reset by a miss.
 */
export function afterMiss(wrongs: number, hinting: boolean): { wrongs: number; hinting: boolean; newHint: boolean } {
  const n = wrongs + 1;
  if (n >= 2 && !hinting) return { wrongs: 0, hinting: true, newHint: true };
  return { wrongs: n, hinting, newHint: false };
}

export const afterHit = () => ({ wrongs: 0, hinting: false });

export type BallKind = 'smile' | 'beach' | 'duck';

/** A court is only a look: its colors, the ball it likes and what the hit sounds like. Nothing about the rules changes. */
export interface Court {
  id: 'pond' | 'beach' | 'snow';
  name: string;
  /** Ground, table and table edge colors. */
  ground: number;
  table: number;
  edge: number;
  ball: BallKind;
}

export const COURTS: readonly Court[] = [
  { id: 'pond', name: 'the pond', ground: 0xd6eefa, table: 0xbff0ec, edge: 0x3a9a9b, ball: 'smile' },
  { id: 'beach', name: 'the beach', ground: 0xfff0b3, table: 0xffe9b8, edge: 0xd9a520, ball: 'beach' },
  { id: 'snow', name: 'the snow', ground: 0xe8f1ff, table: 0xf6faff, edge: 0x8aa8d8, ball: 'duck' },
];

/** The court for a round; `pick` is a number in [0, 1) from the round's seeded generator. */
export const courtFor = (pick: number): Court => COURTS[Math.min(COURTS.length - 1, Math.floor(pick * COURTS.length))];

/** The table as the aiming rules read it: the right face, the left face the ball is sent to, and the walls. */
export interface AimGeometry extends PaddleGeometry {
  /** The x the ball's centre reaches at the left wall or the pet's paddle. */
  leftX: number;
}

/** Where a ball sent from the right paddle at `arrive`, struck at `offset` (-1 to 1) along the paddle, reaches the left side. */
export function landingY(arrive: number, offset: number, g: AimGeometry, speed = g.speed): number {
  const angle = offset * 0.85;
  const t = (g.faceX - g.leftX) / (Math.cos(angle) * speed);
  return fold(arrive + Math.sin(angle) * speed * t, g.top, g.bottom);
}

/**
 * Where to hold the paddle for a ball arriving at `arrive` so the bounce lands as near `want` as the paddle allows. The paddle always
 * meets the ball and stays on the table; a spot nearer the middle of the paddle wins a tie.
 */
export function paddleForLanding(arrive: number, want: number, g: AimGeometry, speed = g.speed): { y: number; landing: number } {
  const half = g.paddle / 2;
  const onTable = (y: number) => Math.max(g.low, Math.min(g.high, y));
  let best = { y: onTable(arrive), landing: landingY(arrive, 0, g, speed), off: 0 };
  let bestErr = Math.abs(best.landing - want);
  for (let k = -20; k <= 20; k++) {
    const y = onTable(arrive - (k / 20) * half);
    if (Math.abs(arrive - y) > half) continue;
    const off = Math.max(-1, Math.min(1, (arrive - y) / half));
    const landing = landingY(arrive, off, g, speed);
    const err = Math.abs(landing - want);
    if (err < bestErr - 1e-6 || (Math.abs(err - bestErr) <= 1e-6 && Math.abs(off) < Math.abs(best.off))) {
      best = { y, landing, off };
      bestErr = err;
    }
  }
  return { y: best.y, landing: best.landing };
}

/** The pet keeper's top speed: it can cover `plan.keeper` of half the table while a straight ball crosses. */
export function keeperSpeed(frac: number, g: AimGeometry): number {
  const crossing = (g.faceX - g.leftX) / g.speed;
  return (frac * (g.bottom - g.top) / 2) / crossing;
}

/** How far from where it stands the keeper can reach in one crossing, counting its paddle's half length and the ball's give. */
export const keeperReach = (frac: number, g: AimGeometry, ballR: number) => frac * (g.bottom - g.top) / 2 + g.paddle / 2 + ballR * 0.6;

/** The wall's end farthest from the keeper: where a shot is hardest for it to meet. */
export const farWall = (keeperY: number, g: AimGeometry) => (keeperY < (g.top + g.bottom) / 2 ? g.bottom : g.top);

/**
 * The color zones a ball arriving at `arrive` can be sent to by some spot on the paddle. The pet only calls one of these, so a call is
 * never a shot the paddle cannot make (on a tall, narrow table the far zone may be out of reach of a ball arriving at the other end).
 */
export function reachableZones(arrive: number, g: AimGeometry, speed = g.speed): number[] {
  const span = g.bottom - g.top;
  return ZONES.flatMap((_, z) => {
    const { landing } = paddleForLanding(arrive, g.top + ((z + 0.5) / ZONES.length) * span, g, speed);
    return zoneOf(landing, g.top, g.bottom) === z ? [z] : [];
  });
}

/** The most the pet's paddle is held off the ball, as a fraction of half its length: a gentle angle, never a trick shot. */
export const LOB = 0.3;

/**
 * How far off the ball's line the pet holds its paddle for its next return, as a fraction of half the paddle (-LOB to LOB), from a
 * number in [0, 1). Only the play-together and count rallies lob, so the ball does not always come back straight; every other level
 * returns it straight.
 */
export function petLob(pick: number, mode: BounceMode): number {
  return mode === 'together' || mode === 'count' ? (pick * 2 - 1) * LOB : 0;
}
