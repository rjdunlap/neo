import { Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { cutCloud, drop, sunRays } from '../../art/scenery';

export function weatherArt(kind: number): Graphics {
  const g = new Graphics();
  if (kind === 0) {
    sunRays(g, 0, 0, 23 / 54);
    g.circle(0, 0, 23).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  } else {
    cutCloud(
      g,
      0,
      4,
      0.42,
      kind === 1 ? swatch.white.fill : swatch.blue.light,
      kind === 1 ? 0xc9dcea : 0x95a2b8,
    );
    if (kind === 2) for (const x of [-22, 0, 22]) drop(g, x, 32, 15, swatch.blue.fill);
  }
  g.eventMode = 'none';
  return g;
}
