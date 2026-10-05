import type { Graphics } from 'pixi.js';

/**
 * The soft-toy body every critter shares: a rounded dome standing on (0, 0).
 * Authored at half-width 130 and height 250, then scaled.
 */
export function bodyPath(g: Graphics, hw = 130, h = 250): Graphics {
  const x = (v: number) => (v / 130) * hw;
  const y = (v: number) => (v / 250) * h;
  return g
    .moveTo(0, y(-250))
    .bezierCurveTo(x(100), y(-250), x(130), y(-160), x(130), y(-100))
    .bezierCurveTo(x(130), y(-30), x(80), 0, 0, 0)
    .bezierCurveTo(x(-80), 0, x(-130), y(-30), x(-130), y(-100))
    .bezierCurveTo(x(-130), y(-160), x(-100), y(-250), 0, y(-250))
    .closePath();
}

/** A jelly: a flat-bottomed dome standing on (0, 0). */
export function domePath(g: Graphics, hw: number, h: number): Graphics {
  return g
    .moveTo(-hw, 0)
    .bezierCurveTo(-hw, -h * 0.78, -hw * 0.58, -h, 0, -h)
    .bezierCurveTo(hw * 0.58, -h, hw, -h * 0.78, hw, 0)
    .quadraticCurveTo(0, h * 0.1, -hw, 0)
    .closePath();
}

export function starPoints(outer: number, inner: number, points = 5): number[] {
  const out: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return out;
}

/** A five-petal flower centered on (0, 0). */
export function flower(g: Graphics, r: number, petal: number, petalLine: number, middle = 0xffd54a): Graphics {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    g.circle(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.48);
  }
  g.fill(petal).stroke({ width: r * 0.12, color: petalLine, join: 'round' });
  return g.circle(0, 0, r * 0.36).fill(middle).stroke({ width: r * 0.1, color: 0xd9a520 });
}

/** A beamed-eighth-note glyph, centered roughly on (0, 0). */
export function musicNote(g: Graphics, size: number, color: number): Graphics {
  const s = size / 40;
  g.ellipse(-8 * s, 12 * s, 9 * s, 7 * s).fill(color);
  g.rect(-1 * s, -20 * s, 4 * s, 33 * s).fill(color);
  return g.poly([-1 * s, -20 * s, 14 * s, -14 * s, 14 * s, -8 * s, -1 * s, -13 * s]).fill(color);
}
