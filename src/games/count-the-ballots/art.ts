import type { Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';

/** Each ride has its own colour and its own badge shape, so a ballot never reads by colour alone. */
const COLORS: ColorName[] = ['red', 'orange', 'blue', 'yellow', 'green', 'purple'];
export const rideColor = (ride: number) => swatch[COLORS[ride]];

/** A badge: circle, square, triangle, diamond, pentagon, hexagon. */
export function badge(g: Graphics, ride: number, x: number, y: number, r: number) {
  const c = rideColor(ride);
  const sides = [0, 4, 3, 4, 5, 6][ride];
  if (ride === 0) g.circle(x, y, r);
  else if (ride === 1) g.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.2);
  else {
    const turn = ride === 3 ? Math.PI / 4 : -Math.PI / 2;
    const pts: number[] = [];
    for (let i = 0; i < sides; i++)
      pts.push(
        x + r * Math.cos(turn + (i * 2 * Math.PI) / sides),
        y + r * Math.sin(turn + (i * 2 * Math.PI) / sides),
      );
    g.poly(pts);
  }
  g.fill(c.fill).stroke({ width: Math.max(2, r * 0.18), color: c.line });
}

/** A ride's little picture, centred on (x, y) and about 2r across. */
export function ride(g: Graphics, which: number, x: number, y: number, r: number) {
  const c = rideColor(which);
  const w = Math.max(2, r * 0.16);
  g.circle(x, y, r * 1.02).fill({ color: cream, alpha: 0.9 });
  if (which === 0) {
    g.circle(x, y, r * 0.7).stroke({ width: w * 1.4, color: c.fill });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(x - r * 0.7 * Math.cos(a), y - r * 0.7 * Math.sin(a))
        .lineTo(x + r * 0.7 * Math.cos(a), y + r * 0.7 * Math.sin(a))
        .stroke({ width: w, color: c.line });
    }
    g.circle(x, y, r * 0.14).fill(c.line);
  } else if (which === 1) {
    g.poly([x - r * 0.75, y - r * 0.15, x, y - r * 0.8, x + r * 0.75, y - r * 0.15])
      .fill(c.fill)
      .stroke({ width: w, color: c.line });
    g.rect(x - r * 0.7, y - r * 0.15, r * 1.4, r * 0.18).fill(c.line);
    for (const dx of [-0.45, 0, 0.45])
      g.moveTo(x + r * dx, y + r * 0.03)
        .lineTo(x + r * dx, y + r * 0.6)
        .stroke({ width: w, color: c.line });
    g.rect(x - r * 0.75, y + r * 0.6, r * 1.5, r * 0.16).fill(c.line);
  } else if (which === 2) {
    g.moveTo(x - r * 0.6, y - r * 0.8)
      .lineTo(x - r * 0.45, y)
      .moveTo(x + r * 0.6, y - r * 0.8)
      .lineTo(x + r * 0.45, y)
      .stroke({ width: w, color: wood.line });
    g.poly([x - r * 0.8, y, x + r * 0.8, y, x + r * 0.5, y + r * 0.55, x - r * 0.5, y + r * 0.55])
      .fill(c.fill)
      .stroke({ width: w, color: c.line });
  } else if (which === 3) {
    g.roundRect(x - r * 0.75, y - r * 0.1, r * 1.5, r * 0.6, r * 0.2)
      .fill(c.fill)
      .stroke({ width: w, color: c.line });
    g.roundRect(x - r * 0.35, y - r * 0.5, r * 0.7, r * 0.45, r * 0.12)
      .fill(swatch.white.fill)
      .stroke({ width: w * 0.7, color: c.line });
    for (const dx of [-0.45, 0.45]) g.circle(x + r * dx, y + r * 0.55, r * 0.17).fill(ink);
  } else if (which === 4) {
    g.rect(x - r * 0.7, y - r * 0.8, r * 0.35, r * 1.5)
      .fill(c.fill)
      .stroke({ width: w, color: c.line });
    g.poly([
      x - r * 0.35,
      y - r * 0.55,
      x + r * 0.75,
      y + r * 0.7,
      x + r * 0.45,
      y + r * 0.7,
      x - r * 0.35,
      y - r * 0.1,
    ])
      .fill(c.light)
      .stroke({ width: w, color: c.line });
  } else {
    g.circle(x, y - r * 0.2, r * 0.55)
      .fill(c.fill)
      .stroke({ width: w, color: c.line });
    g.moveTo(x - r * 0.3, y + r * 0.25)
      .lineTo(x - r * 0.15, y + r * 0.5)
      .moveTo(x + r * 0.3, y + r * 0.25)
      .lineTo(x + r * 0.15, y + r * 0.5)
      .stroke({ width: w * 0.6, color: wood.line });
    g.rect(x - r * 0.2, y + r * 0.5, r * 0.4, r * 0.28)
      .fill(wood.fill)
      .stroke({ width: w * 0.6, color: wood.line });
  }
  badge(g, which, x + r * 0.72, y - r * 0.72, r * 0.3);
}

/** A paper slip: a white strip with a pencil mark. */
export function slip(g: Graphics, x: number, y: number, w: number, h: number, tint = swatch.white.fill) {
  g.roundRect(x - w / 2, y - h / 2, w, h, 3)
    .fill(tint)
    .stroke({ width: 2, color: swatch.white.line });
  g.moveTo(x - w * 0.28, y - h * 0.15)
    .lineTo(x + w * 0.28, y - h * 0.15)
    .moveTo(x - w * 0.28, y + h * 0.15)
    .lineTo(x + w * 0.1, y + h * 0.15)
    .stroke({ width: 2, color: swatch.white.line });
}

/** A ballot box with a slip going in: the hub icon and, with a tick, the sticker. */
export function ballotBox(g: Graphics, k: number, tick = false) {
  g.roundRect(-70 * k, -10 * k, 140 * k, 90 * k, 12 * k)
    .fill(wood.fill)
    .stroke({ width: 5 * k, color: wood.line });
  g.roundRect(-40 * k, -2 * k, 80 * k, 12 * k, 5 * k).fill(wood.line);
  slip(g, 0, -50 * k, 70 * k, 90 * k);
  if (tick)
    g.moveTo(-18 * k, -48 * k)
      .lineTo(-4 * k, -34 * k)
      .lineTo(22 * k, -68 * k)
      .stroke({ width: 8 * k, color: swatch.green.fill, cap: 'round', join: 'round' });
}
