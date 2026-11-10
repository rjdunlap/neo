import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { prop, type PropKind } from '../../art/props';
import { THING_HIT, type ThingId } from './logic';

const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });

/** The duck, apple and star are this game's own; the rest are the sorting games' props in one fixed color each. */
const PROP_COLOR: Partial<Record<ThingId, [PropKind, ColorName]>> = {
  orange: ['orange', 'orange'],
  lemon: ['lemon', 'yellow'],
  pear: ['pear', 'green'],
  flower: ['flower', 'pink'],
  shell: ['shell', 'pink'],
};

/** Half the width or height a drawn thing may reach, so it sits inside its 120-unit tap circle's square with a little room. */
export const THING_REACH = THING_HIT - 2;

function drawShape(id: ThingId): Container {
  const own = PROP_COLOR[id];
  if (own) return prop(...own);
  const c = new Container(),
    g = new Graphics();
  c.addChild(g);
  if (id === 'duck') {
    g.ellipse(0, 12, 46, 32)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line))
      .circle(26, -22, 24)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line))
      .poly([46, -22, 68, -14, 46, -6])
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line, 4))
      .circle(32, -28, 4.5)
      .fill(ink)
      .moveTo(-30, 8)
      .quadraticCurveTo(-8, 34, 22, 14)
      .stroke(line(swatch.yellow.line, 5));
  } else if (id === 'apple') {
    g.moveTo(0, -24)
      .bezierCurveTo(-16, -44, -62, -32, -54, 8)
      .bezierCurveTo(-48, 48, -20, 62, 0, 52)
      .bezierCurveTo(20, 62, 48, 48, 54, 8)
      .bezierCurveTo(62, -32, 16, -44, 0, -24)
      .closePath()
      .fill(swatch.red.fill)
      .stroke(line(swatch.red.line))
      .moveTo(0, -26)
      .quadraticCurveTo(4, -48, 12, -56)
      .stroke(line(swatch.brown.line, 6))
      .ellipse(24, -44, 18, 8)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 4));
  } else {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 50 : 22,
        a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(Math.cos(a) * r, Math.sin(a) * r + 4);
    }
    g.poly(pts).fill(swatch.yellow.fill).stroke(line(swatch.orange.line));
    g.circle(-10, 4, 4).circle(10, 4, 4).fill(ink);
  }
  return c;
}

/**
 * One of the things she counts, centered on (0, 0): its drawing is measured, recentered and, if it reaches past
 * `THING_REACH` (the duck's beak, the pear's stem), scaled down to fit, so every kind sits in its tap circle.
 */
export function drawThing(id: ThingId): Container {
  const c = new Container(),
    shape = drawShape(id);
  const b = shape.getLocalBounds();
  const k = Math.min(1, THING_REACH / Math.max(b.width / 2, b.height / 2));
  shape.scale.set(k);
  shape.position.set(-((b.minX + b.maxX) / 2) * k, -((b.minY + b.maxY) / 2) * k);
  c.addChild(shape);
  return c;
}
