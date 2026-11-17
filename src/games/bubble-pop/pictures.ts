import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { starPoints } from '../../art/shapes';
import type { PictureName } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const eye = (g: Graphics, x: number, y: number, r = 5) =>
  g
    .circle(x, y, r)
    .fill(0xffffff)
    .circle(x + 1, y, r * 0.55)
    .fill(ink);

/**
 * A picture that rides in a free-play bubble, about 100 units across and centered on (0, 0). The shore's two are the
 * shared props; the others are drawn here, each a plain shape a grown-up can name in one word.
 */
export function drawPicture(name: PictureName): Container {
  if (name === 'flower') return prop('flower', 'pink');
  if (name === 'shell') return prop('shell', 'orange');
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (name) {
    case 'star':
      g.poly(starPoints(50, 23)).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      break;
    case 'moon':
      // A crescent: the outer edge of a circle and a shallower curve back.
      g.moveTo(14, -46)
        .bezierCurveTo(-52, -40, -52, 40, 14, 46)
        .bezierCurveTo(-14, 22, -14, -22, 14, -46)
        .closePath()
        .fill(swatch.yellow.light)
        .stroke(line(swatch.yellow.line));
      break;
    case 'fish': {
      const sw = swatch.orange;
      g.poly([24, 0, 50, -26, 50, 26]).fill(sw.fill).stroke(line(sw.line));
      g.ellipse(-8, 0, 40, 26).fill(sw.fill).stroke(line(sw.line));
      g.moveTo(-6, -8).quadraticCurveTo(8, 2, -6, 12).stroke(line(sw.line, 4));
      eye(g, -28, -6);
      break;
    }
    case 'starfish': {
      const sw = swatch.pink;
      g.poly(starPoints(50, 26)).fill(sw.fill).stroke(line(sw.line, 9));
      for (const [x, y] of [
        [0, -22],
        [-20, -6],
        [20, -6],
        [-12, 18],
        [12, 18],
      ])
        g.circle(x, y, 3.5).fill(sw.light);
      eye(g, -8, -2, 4);
      eye(g, 8, -2, 4);
      break;
    }
    case 'rubber-duck': {
      const sw = swatch.yellow;
      g.ellipse(4, 18, 42, 26).fill(sw.fill).stroke(line(sw.line));
      g.poly([34, 2, 52, -6, 40, 22]).fill(sw.fill).stroke(line(sw.line));
      g.circle(-18, -18, 24).fill(sw.fill).stroke(line(sw.line));
      g.ellipse(-44, -14, 12, 7).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      eye(g, -24, -24);
      break;
    }
    case 'boat': {
      g.moveTo(0, -48).lineTo(0, 14).stroke(line(wood.line, 6));
      g.poly([6, -44, 40, 6, 6, 6]).fill(0xffffff).stroke(line(swatch.blue.line));
      g.poly([-6, -30, -6, 6, -32, 6]).fill(swatch.red.light).stroke(line(swatch.red.line));
      g.moveTo(-48, 14)
        .lineTo(48, 14)
        .quadraticCurveTo(38, 44, 18, 44)
        .lineTo(-18, 44)
        .quadraticCurveTo(-38, 44, -48, 14)
        .closePath()
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      break;
    }
  }
  return c;
}
