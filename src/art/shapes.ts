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

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'hexagon';
export const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'star', 'heart', 'hexagon'];

function regular(sides: number, r: number, turn = -Math.PI / 2): number[] {
  return Array.from({ length: sides * 2 }, (_, i) => {
    const a = turn + (Math.floor(i / 2) * 2 * Math.PI) / sides;
    return i % 2 === 0 ? Math.cos(a) * r : Math.sin(a) * r;
  });
}

/** A shape about 2r across, centered on (0, 0). Call fill/stroke after. */
export function shapePath(g: Graphics, kind: ShapeKind, r: number): Graphics {
  switch (kind) {
    case 'circle':
      return g.circle(0, 0, r);
    case 'square':
      return g.roundRect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72, r * 0.18);
    case 'triangle':
      return g.poly(regular(3, r * 1.12, -Math.PI / 2).map((v, i) => (i % 2 ? v + r * 0.2 : v)));
    case 'star':
      return g.poly(starPoints(r * 1.12, r * 0.5));
    case 'hexagon':
      return g.poly(regular(6, r, 0));
    case 'heart':
      return g
        .moveTo(0, r * 0.95)
        .bezierCurveTo(-r * 1.3, r * 0.05, -r * 0.95, -r * 1.05, 0, -r * 0.42)
        .bezierCurveTo(r * 0.95, -r * 1.05, r * 1.3, r * 0.05, 0, r * 0.95)
        .closePath();
  }
}

/**
 * Overlapping circles drawn as one lumpy shape (bushes, tree tops) with a single outer outline:
 * every circle in the outline color first, then every circle in the fill color a little smaller.
 */
export function puffs(g: Graphics, circles: [number, number, number][], fill: number, line: number, width = 6): Graphics {
  for (const [x, y, r] of circles) g.circle(x, y, r + width / 2);
  g.fill(line);
  for (const [x, y, r] of circles) g.circle(x, y, r - width / 2);
  return g.fill(fill);
}
