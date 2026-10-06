/**
 * A tiny 2D ball simulation for bouncing games (pegs, bumpers, walls). Units are logical,
 * time in seconds. Deterministic, so a game can preview a shot by simulating it ahead.
 */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export interface Peg {
  x: number;
  y: number;
  r: number;
  /** A springy bumper: after a bounce the ball leaves at least this fast. */
  kick?: number;
}

export interface BallWorld {
  pegs: Peg[];
  /** Side walls; the ball bounces off them. */
  left: number;
  right: number;
  /** An optional ceiling. */
  top?: number;
  gravity: number;
  /** Fraction of speed kept along the normal after a bounce. */
  bounce: number;
}

const SUBSTEP = 1 / 240;

/** Advance the ball by `dt`. Returns the indexes of pegs it touched (each once). */
export function stepBall(b: Ball, w: BallWorld, dt: number): number[] {
  const hits: number[] = [];
  let left = dt;
  while (left > 1e-6) {
    const h = Math.min(SUBSTEP, left);
    left -= h;
    b.vy += w.gravity * h;
    b.x += b.vx * h;
    b.y += b.vy * h;
    if (b.x - b.r < w.left) {
      b.x = w.left + b.r;
      b.vx = Math.abs(b.vx) * w.bounce;
    } else if (b.x + b.r > w.right) {
      b.x = w.right - b.r;
      b.vx = -Math.abs(b.vx) * w.bounce;
    }
    if (w.top !== undefined && b.y - b.r < w.top) {
      b.y = w.top + b.r;
      b.vy = Math.abs(b.vy) * w.bounce;
    }
    for (let i = 0; i < w.pegs.length; i++) {
      const p = w.pegs[i];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const min = b.r + p.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 0.001;
      const nx = d2 === 0 ? 0 : dx / d;
      const ny = d2 === 0 ? -1 : dy / d;
      // Push out, then reflect the part of the velocity heading into the peg.
      b.x = p.x + nx * min;
      b.y = p.y + ny * min;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= (1 + w.bounce) * vn * nx;
        b.vy -= (1 + w.bounce) * vn * ny;
        // A tiny sideways nudge so a ball never balances forever on top of a peg.
        if (Math.abs(nx) < 0.05) b.vx += nx >= 0 ? 12 : -12;
        if (p.kick) {
          const speed = Math.hypot(b.vx, b.vy);
          if (speed < p.kick) {
            b.vx = (b.vx / (speed || 1)) * p.kick;
            b.vy = (b.vy / (speed || 1)) * p.kick;
          }
        }
      }
      if (!hits.includes(i)) hits.push(i);
    }
  }
  return hits;
}

/** Simulate a shot until the ball passes `floor`. Returns its path and every peg it touches. */
export function simulate(start: Ball, w: BallWorld, floor: number, maxSeconds = 12, sample = 1 / 30) {
  const b = { ...start };
  const path: { x: number; y: number }[] = [{ x: b.x, y: b.y }];
  const hits: number[] = [];
  for (let t = 0; t < maxSeconds && b.y - b.r < floor; t += sample) {
    for (const i of stepBall(b, w, sample)) if (!hits.includes(i)) hits.push(i);
    path.push({ x: b.x, y: b.y });
  }
  return { path, hits, landed: { x: b.x, y: b.y } };
}
