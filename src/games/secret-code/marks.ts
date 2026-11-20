import { Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import type { Mark } from './logic';

/** A mark's badge: a green check, a yellow dot or a gray cross, so a mark never depends on hue alone. Shared with Word Code. */
export function markArt(mark: Mark, r: number): Graphics {
  const g = new Graphics()
    .circle(0, 0, r)
    .fill(mark === 'green' ? swatch.green.fill : mark === 'yellow' ? swatch.yellow.fill : 0xc9ccd6)
    .stroke({ width: 3, color: 0xffffff });
  if (mark === 'green')
    g.moveTo(-r * 0.45, 0)
      .lineTo(-r * 0.1, r * 0.4)
      .lineTo(r * 0.5, -r * 0.4)
      .stroke({ width: r * 0.28, color: 0xffffff, cap: 'round', join: 'round' });
  else if (mark === 'gray')
    g.moveTo(-r * 0.35, -r * 0.35)
      .lineTo(r * 0.35, r * 0.35)
      .moveTo(r * 0.35, -r * 0.35)
      .lineTo(-r * 0.35, r * 0.35)
      .stroke({ width: r * 0.22, color: 0xffffff, cap: 'round' });
  else g.circle(0, 0, r * 0.3).fill(0xffffff);
  return g;
}
