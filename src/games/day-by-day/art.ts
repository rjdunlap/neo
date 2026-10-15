import { Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { puffs } from '../../art/shapes';

export function weatherArt(kind: number): Graphics {
  const g = new Graphics();
  if (kind === 0) {
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30).lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
    }
    g.stroke({ width: 5, color: swatch.yellow.line, cap: 'round' });
    g.circle(0, 0, 23).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  } else {
    puffs(g, [[-20, 0, 18], [-14, -14, 23], [15, -10, 20], [22, 2, 16], [0, 6, 17]],
      kind === 1 ? swatch.white.fill : swatch.blue.light, swatch.blue.line, 3);
    if (kind === 2) for (const x of [-22, 0, 22]) g.moveTo(x, 26).lineTo(x - 5, 39).stroke({ width: 5, color: swatch.blue.fill, cap: 'round' });
  }
  g.eventMode = 'none';
  return g;
}
