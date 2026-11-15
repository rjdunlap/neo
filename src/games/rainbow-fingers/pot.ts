import { Container, Graphics } from 'pixi.js';
import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { POT_MARKS, type PotMark } from './logic';

const LINE = 0x5a4a3c;

export function paintPot(color: ColorName | 'rainbow'): Container {
  const c = new Container();
  const jar = new Graphics()
    .roundRect(-30, -22, 60, 50, 12)
    .fill(0xffffff)
    .stroke({ width: 5, color: 0xb9b2a6 });
  const top = new Graphics().ellipse(0, -22, 30, 12);
  if (color === 'rainbow') {
    top.fill(0xffffff);
    RAINBOW.forEach((c2, i) => top.rect(-27 + i * 9, -32, 9, 20).fill(swatch[c2].fill));
    top.ellipse(0, -22, 30, 12).stroke({ width: 4, color: 0xb9b2a6 });
  } else {
    top.fill(swatch[color].fill).stroke({ width: 4, color: swatch[color].line });
  }
  const drip = new Graphics()
    .roundRect(10, -22, 8, 22, 4)
    .fill(color === 'rainbow' ? swatch.purple.fill : swatch[color].fill);
  // White paint on a white jar needs its edge drawn.
  if (color === 'white') drip.stroke({ width: 2, color: swatch.white.line });
  c.addChild(jar, drip, top);
  if (color !== 'rainbow') c.addChild(potMark(POT_MARKS[color]));
  return c;
}

/** The pot's own mark on the front of the jar, in ink, so two pots never differ by color alone. */
function potMark(mark: PotMark): Graphics {
  const g = new Graphics();
  const ink = { width: 4, color: LINE, cap: 'round' as const, join: 'round' as const };
  const [x, y] = [-6, 6];
  switch (mark) {
    case 'dot':
      return g.circle(x, y, 7).fill(LINE);
    case 'stripe':
      return g
        .moveTo(x - 12, y)
        .lineTo(x + 12, y)
        .stroke({ ...ink, width: 6 });
    case 'star':
      return g.poly(starPoints(10, 4.5, 5).map((v, i) => v + (i % 2 ? y : x))).fill(LINE);
    case 'heart':
      return g
        .moveTo(x, y + 9)
        .bezierCurveTo(x - 14, y - 1, x - 8, y - 12, x, y - 4)
        .bezierCurveTo(x + 8, y - 12, x + 14, y - 1, x, y + 9)
        .fill(LINE);
    case 'swirl':
      g.moveTo(x, y);
      for (let k = 1; k <= 24; k++)
        g.lineTo(x + Math.cos(k * 0.5) * k * 0.45, y + Math.sin(k * 0.5) * k * 0.45);
      return g.stroke({ ...ink, width: 3 });
    case 'ring':
      return g.circle(x, y, 8).stroke(ink);
    case 'cloud':
      return g
        .circle(x - 9, y + 3, 6)
        .circle(x, y - 3, 8)
        .circle(x + 9, y + 3, 6)
        .fill(LINE);
  }
}
