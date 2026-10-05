import { Container, Graphics } from 'pixi.js';
import { swatch, type ColorName } from './palette';

/** Things to sort, each drawn about 100 units across and centered on (0, 0). Each has one obvious color. */
export type PropKind = 'apple' | 'orange' | 'lemon' | 'pear' | 'blueberries' | 'grapes' | 'balloon' | 'flower';

/** The fruit that is (unmistakably) each color. */
export const FRUIT_FOR: Partial<Record<ColorName, PropKind>> = {
  red: 'apple',
  orange: 'orange',
  yellow: 'lemon',
  green: 'pear',
  blue: 'blueberries',
  purple: 'grapes',
};

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const LEAF = swatch.green;
const STEM = 0x8f6142;

function leaf(x: number, y: number, angle: number) {
  const l = new Graphics().ellipse(14, 0, 16, 8).fill(LEAF.fill).stroke(line(LEAF.line, 3));
  l.position.set(x, y);
  l.rotation = angle;
  return l;
}

export function prop(kind: PropKind, color: ColorName): Container {
  const sw = swatch[color];
  const c = new Container();
  const g = new Graphics();
  const shine = new Graphics();
  switch (kind) {
    case 'apple':
      g.moveTo(0, -30)
        .bezierCurveTo(30, -52, 60, -20, 48, 14)
        .bezierCurveTo(38, 46, 14, 50, 0, 40)
        .bezierCurveTo(-14, 50, -38, 46, -48, 14)
        .bezierCurveTo(-60, -20, -30, -52, 0, -30)
        .closePath()
        .fill(sw.fill)
        .stroke(line(sw.line));
      g.moveTo(0, -30).quadraticCurveTo(2, -46, 8, -54).stroke(line(STEM, 5));
      c.addChild(g, leaf(6, -46, -0.5));
      shine.ellipse(-26, -12, 7, 12).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'orange':
      g.circle(0, 0, 46).fill(sw.fill).stroke(line(sw.line));
      for (const [x, y] of [[-16, -10], [12, 14], [18, -18], [-8, 22], [-24, 8]]) g.circle(x, y, 2.5).fill(sw.line);
      c.addChild(g, leaf(0, -44, -0.8));
      shine.ellipse(-22, -18, 7, 11).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'lemon':
      g.moveTo(-58, 0)
        .quadraticCurveTo(-46, -40, 0, -38)
        .quadraticCurveTo(46, -40, 58, 0)
        .quadraticCurveTo(46, 40, 0, 38)
        .quadraticCurveTo(-46, 40, -58, 0)
        .closePath()
        .fill(sw.fill)
        .stroke(line(sw.line));
      c.addChild(g);
      shine.ellipse(-20, -16, 14, 6).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'pear':
      g.moveTo(0, -46)
        .bezierCurveTo(18, -46, 20, -16, 30, 0)
        .bezierCurveTo(52, 28, 34, 50, 0, 50)
        .bezierCurveTo(-34, 50, -52, 28, -30, 0)
        .bezierCurveTo(-20, -16, -18, -46, 0, -46)
        .closePath()
        .fill(sw.fill)
        .stroke(line(sw.line));
      g.moveTo(0, -46).quadraticCurveTo(2, -58, 8, -64).stroke(line(STEM, 5));
      c.addChild(g);
      shine.ellipse(-18, 8, 6, 14).fill({ color: 0xffffff, alpha: 0.45 });
      break;
    case 'blueberries':
    case 'grapes': {
      // Grapes hang in an upside-down triangle; blueberries sit in a loose pile.
      const spots: [number, number][] =
        kind === 'grapes'
          ? [[-28, -22], [0, -22], [28, -22], [-14, 4], [14, 4], [0, 30]]
          : [[-24, -10], [10, -24], [24, 12], [-6, 20], [-30, 26]];
      const r = kind === 'grapes' ? 15 : 20;
      for (const [x, y] of spots) g.circle(x, y, r).fill(sw.fill).stroke(line(sw.line, 4));
      if (kind === 'blueberries') for (const [x, y] of spots) g.circle(x, y - r * 0.55, 3).fill(sw.line);
      if (kind === 'grapes') g.moveTo(0, -40).quadraticCurveTo(4, -52, 12, -58).stroke(line(STEM, 5));
      c.addChild(g);
      if (kind === 'grapes') c.addChild(leaf(6, -48, -0.3));
      for (const [x, y] of spots.slice(0, 3)) shine.circle(x - r * 0.35, y - r * 0.35, r * 0.22).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    }
    case 'balloon':
      g.moveTo(0, 46).quadraticCurveTo(-6, 60, 4, 72).stroke(line(0x8c8c9c, 3));
      g.ellipse(0, -6, 40, 48).fill(sw.fill).stroke(line(sw.line));
      g.poly([-7, 46, 7, 46, 0, 38]).fill(sw.line);
      c.addChild(g);
      shine.ellipse(-16, -24, 7, 13).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'flower':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.ellipse(Math.cos(a) * 26, Math.sin(a) * 26, 20, 20);
      }
      g.fill(sw.fill).stroke(line(sw.line, 5));
      g.circle(0, 0, 18).fill(0xffd54a).stroke(line(0xd9a520, 4));
      c.addChild(g);
      break;
  }
  c.addChild(shine);
  return c;
}
