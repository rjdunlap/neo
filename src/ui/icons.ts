import { Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';
import { shapePath, starPoints } from '../art/shapes';

export function islandIcon(): Graphics {
  return new Graphics().ellipse(0, 18, 30, 12).fill(swatch.blue.fill).ellipse(0, 12, 24, 10).fill(swatch.yellow.light)
    .moveTo(0, 10).quadraticCurveTo(9, -8, 0, -22).stroke({ width: 6, color: wood.line })
    .poly([0, -22, -28, -12, -14, -30, 0, -22, 27, -18, 12, -34]).fill(swatch.green.fill);
}

/** Simple pictograms for pre-readers, drawn about 60 units across, centered on (0, 0). */
const line = (width = 7, color = ink) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export function houseIcon(color = ink): Graphics {
  return new Graphics()
    .poly([-28, -2, 0, -26, 28, -2])
    .stroke(line(7, color))
    .roundRect(-19, -6, 38, 32, 4)
    .stroke(line(7, color))
    .roundRect(-6, 8, 12, 18, 3)
    .fill(color);
}

export function againIcon(color = ink): Graphics {
  const r = 21;
  const [a0, a1] = [-Math.PI / 2 + 0.55, Math.PI * 1.5 - 0.35];
  const g = new Graphics()
    .moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
    .arc(0, 0, r, a0, a1)
    .stroke(line(8, color));
  // Arrowhead at the end of the arc, pointing along it.
  const [px, py] = [Math.cos(a1) * r, Math.sin(a1) * r];
  const [tx, ty] = [-Math.sin(a1), Math.cos(a1)];
  const [nx, ny] = [Math.cos(a1), Math.sin(a1)];
  return g.poly([px + tx * 14, py + ty * 14, px + nx * 12, py + ny * 12, px - nx * 12, py - ny * 12]).fill(color).stroke(line(3, color));
}

export function frameIcon(): Graphics {
  return new Graphics()
    .roundRect(-28, -24, 56, 48, 6)
    .fill(0xffffff)
    .stroke(line(7, 0x9c6b3c))
    .poly([-20, 16, -6, -2, 4, 8, 12, 0, 20, 16])
    .fill(0x8bd86a)
    .circle(10, -10, 6)
    .fill(0xffd54a);
}

export function bookIcon(): Graphics {
  return new Graphics()
    .roundRect(-26, -30, 52, 60, 6)
    .fill(0xff9ac1)
    .stroke(line(5, 0xd96a96))
    .rect(-26, -30, 10, 60)
    .fill(0xd96a96)
    .poly([4, -14, 8, -4, 18, -3, 10, 4, 13, 14, 4, 8, -5, 14, -2, 4, -10, -3, 0, -4])
    .fill(0xffd54a)
    .stroke(line(3, 0xd9a520));
}

export function lockIcon(color = ink): Graphics {
  return new Graphics()
    .arc(0, -6, 10, Math.PI, 0)
    .stroke(line(5, color))
    .roundRect(-15, -6, 30, 24, 5)
    .fill(color);
}

export function arrowIcon(dir: 1 | -1, color = ink): Graphics {
  return new Graphics().poly([-12 * dir, -22, 16 * dir, 0, -12 * dir, 22]).fill(color).stroke(line(6, color));
}

export function playIcon(color = 0xffffff): Graphics {
  return new Graphics().poly([-16, -26, 28, 0, -16, 26]).fill(color).stroke(line(8, color));
}

/** A picnic basket: the way back to the Windy Picnic. */
export function basketIcon(): Graphics {
  return new Graphics()
    .moveTo(-20, -4).bezierCurveTo(-20, -34, 20, -34, 20, -4).stroke(line(6, wood.line))
    .poly([-30, -6, 30, -6, 23, 26, -23, 26]).fill(wood.fill).stroke(line(5, wood.line))
    .moveTo(-27, 8).lineTo(27, 8).stroke(line(4, wood.line))
    .rect(-31, -10, 62, 9).fill(swatch.red.fill)
    .rect(-19, -10, 9, 9).rect(1, -10, 9, 9).fill(0xffffff)
    .rect(-31, -10, 62, 9).stroke(line(3, swatch.red.line));
}

/** A little notebook with a leaf: the picnic journal. */
export function journalIcon(): Graphics {
  return new Graphics()
    .roundRect(-26, -30, 52, 60, 6).fill(swatch.green.light).stroke(line(5, swatch.green.line))
    .rect(-26, -30, 10, 60).fill(swatch.green.line)
    .ellipse(6, 0, 13, 7).fill(swatch.green.fill).stroke(line(3, swatch.green.line))
    .moveTo(-6, 6).lineTo(18, -6).stroke(line(3, swatch.green.line));
}

/** A tree with a little cabin in its branches: the way to the pet's treehouse. */
export function treehouseIcon(): Graphics {
  return new Graphics()
    .rect(-6, 4, 12, 26).fill(wood.line)
    .circle(0, -8, 26).fill(swatch.green.fill).stroke(line(4, swatch.green.line))
    .roundRect(-15, -10, 30, 22, 3).fill(wood.fill).stroke(line(3, wood.line))
    .poly([-19, -10, 0, -26, 19, -10]).fill(swatch.red.fill).stroke(line(3, swatch.red.line))
    .roundRect(-4, -2, 8, 14, 2).fill(wood.line);
}

/** Two arrows facing each other: turn a thing round. */
export function flipIcon(color = ink): Graphics {
  return new Graphics()
    .moveTo(-6, 0).lineTo(-26, 0).moveTo(-14, -12).lineTo(-26, 0).lineTo(-14, 12)
    .moveTo(6, 0).lineTo(26, 0).moveTo(14, -12).lineTo(26, 0).lineTo(14, 12)
    .stroke(line(6, color))
    .moveTo(0, -24).lineTo(0, 24).stroke({ width: 4, color, cap: 'round' });
}

/** A tick for "done" and "yes". */
export function checkIcon(color = 0xffffff): Graphics {
  return new Graphics().moveTo(-20, 2).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 10, color, cap: 'round', join: 'round' });
}

/** A cross for "none" and "take away". */
export function crossIcon(color = ink): Graphics {
  return new Graphics().moveTo(-16, -16).lineTo(16, 16).moveTo(16, -16).lineTo(-16, 16).stroke({ width: 9, color, cap: 'round' });
}

/** A heart about 56 across: solid when it is kept, just an outline when it is not. */
export function heartIcon(color = 0xffffff, filled = true): Graphics {
  const g = shapePath(new Graphics(), 'heart', 26);
  return filled ? g.fill(color).stroke(line(4, color)) : g.stroke(line(6, color));
}

/** A magnifying glass with a star in its lens: the discovery journal. */
export function magnifierIcon(color = ink): Graphics {
  const g = new Graphics()
    .moveTo(10, 10).lineTo(26, 26).stroke(line(10, wood.line))
    .circle(-6, -6, 22).fill(swatch.blue.light).stroke(line(7, color))
    .poly(starPoints(10, 4.4, 5).map((v, i) => (i % 2 === 0 ? v - 6 : v - 5))).fill(swatch.yellow.fill);
  return g;
}
