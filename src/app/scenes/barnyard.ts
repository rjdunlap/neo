import { Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { spotRect, type LandLayout } from '../../content/lands';
import type { View } from '../../engine/view';

/** Scenery for this land only. The field and all its touch areas keep their existing layout. */
export function drawBarnyard(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  // Keep the whole fence above the first row's reserved drawing/touch rectangles.
  const top = Math.min(...[layout.host, ...layout.games, ...(layout.sign ? [layout.sign] : [])].map((s) => spotRect(s, layout.box).y));
  const edge = Math.min(ground + 20, top - 24);
  const base = edge - 20;
  const height = Math.min(100, base - 112);
  const x = layout.host.x;
  const w = height * 1.1;
  // A quieter red than playable objects: the map barn's gable, white trim, X door and round loft.
  g.poly([x - w / 2, base, x - w / 2, base - height * 0.58, x, base - height, x + w / 2, base - height * 0.58, x + w / 2, base])
    .fill(swatch.red.line);
  g.moveTo(x - w / 2 - 4, base - height * 0.58).lineTo(x, base - height).lineTo(x + w / 2 + 4, base - height * 0.58)
    .stroke({ color: swatch.white.light, width: 5, cap: 'round', join: 'round' });
  if (height >= 60) {
    const door = height * 0.34;
    g.rect(x - door / 2, base - door, door, door).stroke({ color: swatch.white.light, width: 3 });
    g.moveTo(x - door / 2, base - door).lineTo(x + door / 2, base).moveTo(x + door / 2, base - door).lineTo(x - door / 2, base)
      .stroke({ color: swatch.white.light, width: 3 });
    g.circle(x, base - height * 0.65, height * 0.075).fill(swatch.white.light);
  }
  // Split rails on short posts, with a straw edge at their feet.
  g.rect(0, edge + 12, view.w, 10).fill(swatch.yellow.light);
  for (let px = 18; px < view.w; px += 100) {
    g.roundRect(px - 5, edge - 22, 10, 38, 3).fill(wood.light).stroke({ color: wood.line, width: 2 });
  }
  for (const y of [edge - 14, edge + 1]) g.rect(0, y, view.w, 7).fill(wood.light).stroke({ color: wood.line, width: 2 });

  const s = layout.box.h * 0.95 / 250;
  const hx = layout.host.x;
  const hy = layout.host.y;
  g.ellipse(hx, hy + 2, 96 * s, 17 * s).fill(swatch.yellow.light);
  for (const dx of [-72, -40, 25, 60]) {
    g.moveTo(hx + dx * s, hy + 3 * s).lineTo(hx + (dx + 13) * s, hy - 2 * s).stroke({ color: wood.light, width: 2 });
  }
  // The milk pail stands beside the cow, clear of her body-centered hit circle.
  const px = hx + 170 * s;
  const py = hy - 2 * s;
  g.ellipse(px, py - 31 * s, 14 * s, 19 * s).stroke({ color: swatch.white.line, width: 3 * s });
  g.poly([px - 19 * s, py - 34 * s, px + 19 * s, py - 34 * s, px + 14 * s, py, px - 14 * s, py])
    .fill(swatch.white.light).stroke({ color: swatch.white.line, width: 3 * s });
  g.ellipse(px, py - 34 * s, 19 * s, 5 * s).fill(swatch.white.fill).stroke({ color: swatch.white.line, width: 3 * s });
}
