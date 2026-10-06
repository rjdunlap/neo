import { Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { flower, shapePath } from '../../art/shapes';
import type { StampKind } from './logic';
export function stampArt(kind: StampKind, color: ColorName, radius = 48) {
  const g = new Graphics(), s = swatch[color];
  if (kind === 'star') shapePath(g, 'star', radius).fill(s.fill).stroke({ width: 4, color: s.line });
  if (kind === 'flower') flower(g, radius, s.fill, s.line);
  if (kind === 'fish') {
    g.poly([-radius * 0.5, 0, -radius, -radius * 0.6, -radius, radius * 0.6]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius * 0.85, radius * 0.55).fill(s.fill).stroke({ width: 4, color: s.line }).circle(radius * 0.4, -radius * 0.1, 5).fill(ink);
  }
  if (kind === 'cat') {
    g.poly([-radius * 0.8, -radius * 0.2, -radius * 0.8, -radius, -radius * 0.1, -radius * 0.45]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.poly([radius * 0.8, -radius * 0.2, radius * 0.8, -radius, radius * 0.1, -radius * 0.45]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius, radius * 0.75).fill(s.fill).stroke({ width: 4, color: s.line });
    for (const x of [-0.4, 0.4]) g.circle(radius * x, -6, 5).fill(ink);
    g.poly([-5, 5, 5, 5, 0, 11]).fill(swatch.pink.line);
  }
  return g;
}
