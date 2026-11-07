import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from './palette';

/** Things to sort, each drawn about 100 units across and centered on (0, 0). Each has one obvious color. */
export type PropKind =
  | 'apple' | 'orange' | 'lemon' | 'pear' | 'blueberries' | 'grapes' | 'strawberry' | 'banana' | 'plum'
  | 'balloon' | 'flower' | 'beachball' | 'shell';
/** Fruit drawn small (about 64 across) in fixed colors; Bolt Boards' own, shared so Fruit Slice draws the same ones. */
export type SmallFruit = 'strawberry' | 'banana' | 'plum';

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

/** A strawberry, banana or plum about 64 units across, centered on (0, 0), in its own colors. */
export function smallFruit(kind: SmallFruit): Graphics {
  const g = new Graphics();
  const line = (color: number) => ({ width: 4, color, join: 'round' as const });
  if (kind === 'strawberry') {
    const c = swatch.red;
    g.moveTo(0, -18).bezierCurveTo(-26, -26, -38, 0, -16, 22).bezierCurveTo(-8, 30, -4, 34, 0, 36)
      .bezierCurveTo(4, 34, 8, 30, 16, 22).bezierCurveTo(38, 0, 26, -26, 0, -18).fill(c.fill).stroke(line(c.line));
    for (const [x, y] of [[-14, -6], [0, -4], [14, -6], [-8, 8], [8, 8], [-2, 20], [0, 30]]) g.ellipse(x, y, 2, 3).fill(swatch.yellow.light);
    // A leafy cap instead of a stalk.
    for (const a of [-1, 0, 1]) g.ellipse(a * 10, -20 + Math.abs(a) * 2, 8, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.moveTo(0, -22).lineTo(1, -32).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    return g;
  }
  if (kind === 'banana') {
    const c = swatch.yellow;
    g.moveTo(-26, -24).bezierCurveTo(-34, 6, -10, 30, 26, 22).bezierCurveTo(30, 21, 30, 16, 26, 14)
      .bezierCurveTo(0, 16, -16, 0, -16, -24).closePath().fill(c.fill).stroke(line(c.line));
    g.moveTo(-23, -22).bezierCurveTo(-26, 2, -6, 22, 22, 18).stroke({ width: 3, color: c.line, alpha: 0.45 });
    // Brown tips at both ends instead of a stalk and leaf.
    g.roundRect(-26, -32, 9, 10, 3).fill(swatch.brown.line);
    g.circle(28, 18, 3.5).fill(swatch.brown.line);
    return g;
  }
  const c = swatch.purple;
  g.ellipse(0, 4, 26, 28).fill(c.fill).stroke(line(c.line));
  g.moveTo(0, -20).bezierCurveTo(8, -4, 8, 14, 0, 28).stroke({ width: 3, color: c.line, alpha: 0.5 });
  g.moveTo(0, -18).lineTo(3, -32).stroke({ width: 5, color: swatch.brown.line, cap: 'round' });
  g.ellipse(13, -30, 10, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  g.ellipse(-10, -4, 5, 8).fill({ color: 0xffffff, alpha: 0.4 });
  return g;
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
    case 'strawberry':
    case 'banana':
    case 'plum': {
      // The small fruit scaled up to the others' size.
      const f = smallFruit(kind);
      f.scale.set(1.6);
      c.addChild(f);
      break;
    }
    case 'beachball': {
      // Six panels, white between colored ones, round a white cap.
      const panels = [sw.fill, 0xffffff, swatch.yellow.fill, 0xffffff, swatch.blue.fill, 0xffffff];
      panels.forEach((fill, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        g.moveTo(0, 0).arc(0, 0, 46, a, a + Math.PI / 3).closePath().fill(fill);
      });
      g.circle(0, 0, 46).stroke(line(swatch.white.line, 5));
      g.circle(0, 0, 10).fill(0xffffff).stroke(line(swatch.white.line, 3));
      c.addChild(g);
      shine.ellipse(-20, -22, 7, 12).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    }
    case 'shell': {
      // A scallop: a ribbed fan on a little hinge.
      g.moveTo(-14, 40).lineTo(-50, -6).quadraticCurveTo(0, -66, 50, -6).lineTo(14, 40).closePath().fill(sw.fill).stroke(line(sw.line));
      for (const x of [-30, -15, 0, 15, 30]) g.moveTo(x * 0.3, 38).lineTo(x * 1.25, -18 - (30 - Math.abs(x)) * 0.8).stroke(line(sw.line, 3));
      g.roundRect(-22, 34, 44, 14, 5).fill(sw.fill).stroke(line(sw.line, 4));
      c.addChild(g);
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

/** A black top hat with a red band, in a critter's body coordinates (it sits on the head); Critter Sort's, shared. */
export function hatArt(): Graphics {
  return new Graphics().ellipse(0, -232, 74, 16).fill(ink).roundRect(-44, -320, 88, 90, 10).fill(ink).rect(-44, -258, 88, 16).fill(swatch.red.fill);
}
