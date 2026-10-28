import { Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import type { FitProp } from './logic';

/**
 * The four props of *Who fits?*, drawn in code at `size` (the bed's length, the chair's and door's height, the bowl's width),
 * with the origin at the bottom centre, so a prop sized for the friend who fits it is proportioned like a bed or door for one child.
 */
export function fitProp(kind: FitProp, size: number, color: keyof typeof swatch = 'teal'): Graphics {
  const g = new Graphics(), c = swatch[color], wood = swatch.brown;
  const s = size;
  switch (kind) {
    case 'bed': {
      // Legs, a frame, a mattress, a headboard on the left with a pillow and a blanket in this round's colour.
      g.rect(-s * 0.46, -s * 0.12, s * 0.05, s * 0.12).rect(s * 0.41, -s * 0.12, s * 0.05, s * 0.12).fill(wood.line);
      g.roundRect(-s / 2, -s * 0.3, s, s * 0.18, s * 0.04).fill(wood.fill).stroke({ width: 4, color: wood.line });
      g.roundRect(-s * 0.47, -s * 0.36, s * 0.94, s * 0.1, s * 0.03).fill(cream).stroke({ width: 3, color: wood.line });
      g.roundRect(-s * 0.5, -s * 0.62, s * 0.08, s * 0.5, s * 0.03).fill(wood.fill).stroke({ width: 4, color: wood.line });
      g.roundRect(-s * 0.4, -s * 0.46, s * 0.2, s * 0.12, s * 0.04).fill(swatch.white.fill).stroke({ width: 3, color: swatch.white.line });
      g.roundRect(-s * 0.15, -s * 0.38, s * 0.62, s * 0.12, s * 0.03).fill(c.fill).stroke({ width: 3, color: c.line });
      break;
    }
    case 'chair': {
      // A seat with four legs and a tall back on the right, in this round's colour.
      g.rect(-s * 0.38, -s * 0.44, s * 0.06, s * 0.44).rect(s * 0.32, -s * 0.44, s * 0.06, s * 0.44).fill(wood.line);
      g.roundRect(-s * 0.42, -s * 0.52, s * 0.84, s * 0.12, s * 0.04).fill(c.fill).stroke({ width: 4, color: c.line });
      g.roundRect(s * 0.3, -s, s * 0.12, s * 0.5, s * 0.04).fill(c.fill).stroke({ width: 4, color: c.line });
      break;
    }
    case 'bowl': {
      // A round-bottomed bowl with a rim, in this round's colour, and a stripe.
      g.moveTo(-s / 2, -s * 0.46).quadraticCurveTo(-s * 0.5, 0, 0, 0).quadraticCurveTo(s * 0.5, 0, s / 2, -s * 0.46).closePath().fill(c.fill).stroke({ width: 4, color: c.line, join: 'round' });
      g.moveTo(-s * 0.44, -s * 0.24).quadraticCurveTo(0, -s * 0.1, s * 0.44, -s * 0.24).stroke({ width: s * 0.05, color: c.line, alpha: 0.35 });
      g.ellipse(0, -s * 0.46, s / 2, s * 0.11).fill(c.light).stroke({ width: 4, color: c.line });
      break;
    }
    case 'door': {
      // A doorway: a frame, an open door of this round's colour with a window and a knob, and a step.
      g.roundRect(-s * 0.42, -s * 1.04, s * 0.84, s * 1.04, s * 0.06).fill(wood.fill).stroke({ width: 4, color: wood.line });
      g.roundRect(-s * 0.36, -s, s * 0.72, s, s * 0.05).fill(ink).stroke({ width: 3, color: wood.line });
      g.roundRect(s * 0.3, -s * 1.02, s * 0.3, s * 1.02, s * 0.04).fill(c.fill).stroke({ width: 4, color: c.line });
      g.roundRect(s * 0.36, -s * 0.9, s * 0.18, s * 0.22, s * 0.03).fill(swatch.blue.light).stroke({ width: 3, color: c.line });
      g.circle(s * 0.36, -s * 0.5, s * 0.035).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
      g.roundRect(-s * 0.46, -s * 0.04, s * 0.92, s * 0.08, s * 0.03).fill(swatch.white.light).stroke({ width: 3, color: swatch.white.line });
      break;
    }
  }
  return g;
}

/** Where a friend `height` tall goes to try a prop of `size`, relative to the prop's origin, and how it holds itself there. */
export function fitPose(kind: FitProp, size: number, height: number): { x: number; y: number; rotation: number; sx: number; sy: number } {
  switch (kind) {
    // Lying down, head on the pillow: a friend longer than the bed hangs its feet off the end.
    case 'bed': return { x: -size * 0.4 + height, y: -size * 0.36 - height * 0.52, rotation: -Math.PI / 2, sx: 1, sy: 1 };
    // Sitting on the seat, squashed a little.
    case 'chair': return { x: -size * 0.04, y: -size * 0.46, rotation: 0, sx: 1.08, sy: 0.8 };
    // Sitting in the bowl.
    case 'bowl': return { x: 0, y: -size * 0.3, rotation: 0, sx: 1.06, sy: 0.86 };
    // Standing in the doorway.
    case 'door': return { x: 0, y: 0, rotation: 0, sx: 1, sy: 1 };
  }
}
