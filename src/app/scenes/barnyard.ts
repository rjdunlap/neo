import { Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { drawFarBarn } from '../../art/scenery';
import { layoutSpots, spotRect, type LandLayout } from '../../content/lands';
import type { View } from '../../engine/view';

/** Where the fence's rails run: above the first row's reserved drawing/touch rectangles. Its straw edge ends 22 below. */
export function barnyardFence(layout: LandLayout, ground: number) {
  const top = Math.min(...layoutSpots(layout).map((s) => spotRect(s, layout.box).y));
  return Math.min(ground + 20, top - 24);
}

/** Scenery for this land only. The field and all its touch areas keep their existing layout. */
export function drawBarnyard(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  const edge = barnyardFence(layout, ground);
  const base = edge - 20;
  const height = Math.min(100, base - 112);
  drawFarBarn(g, layout.host.x, base, height);
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
