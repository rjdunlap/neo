import { Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';

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
