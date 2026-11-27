import type { MotionId } from './logic';

/** How long the pet's performance lasts, in seconds. */
export const MOTION_SECONDS = 3;

export interface Pose {
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
  /** A small ground shake in units, for the stomp only. */
  shake: number;
}

const TAU = Math.PI * 2;

/**
 * Where the pet's plain shape is `t` seconds into a motion, relative to its resting place. Pure, so a test can check that
 * the six motions look different: hop arcs up and down, waddle rocks side to side, swish sways in a wave, flap beats twice
 * fast and lifts, slide crawls low with no bounce, and stomp thumps down with a small shake.
 */
export function pose(motion: MotionId, t: number): Pose {
  const p: Pose = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, shake: 0 };
  switch (motion) {
    case 'hop': {
      const k = Math.abs(Math.sin((Math.PI * t) / 1.1));
      p.y = -70 * k;
      p.sy = 1 + 0.12 * k - 0.1 * (1 - k);
      p.sx = 1 - 0.06 * k + 0.1 * (1 - k);
      break;
    }
    case 'waddle':
      p.rot = 0.28 * Math.sin((TAU * t) / 0.9);
      p.x = 34 * Math.sin((TAU * t) / 1.8);
      break;
    case 'swish':
      p.x = 46 * Math.sin((TAU * t) / 1.6);
      p.rot = 0.3 * Math.cos((TAU * t) / 1.6);
      p.y = 10 * Math.sin((TAU * t) / 0.8);
      break;
    case 'flap': {
      const beat = Math.max(0, Math.sin((TAU * t) / 1.0));
      p.sx = 1 + 0.35 * Math.sin((TAU * t) / 0.25) * beat;
      p.y = -34 * Math.sin((Math.PI * t) / MOTION_SECONDS);
      break;
    }
    case 'slide':
      p.x = -60 + (120 * t) / MOTION_SECONDS;
      p.sy = 0.9;
      p.sx = 1.08;
      break;
    case 'stomp': {
      const k = Math.max(0, Math.sin((TAU * t) / 1.0));
      p.y = -16 * k;
      p.sy = 1 - 0.1 * (1 - k);
      p.shake = k < 0.05 ? 5 * Math.sin(t * 90) : 0;
      break;
    }
  }
  return p;
}
