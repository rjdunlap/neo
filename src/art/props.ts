import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from './palette';
import { darken, ellipsePoints } from './paper';

/** Things to sort, each drawn about 100 units across and centered on (0, 0). Each has one obvious color. */
export type PropKind =
  | 'apple'
  | 'orange'
  | 'lemon'
  | 'pear'
  | 'blueberries'
  | 'grapes'
  | 'strawberry'
  | 'banana'
  | 'plum'
  | 'balloon'
  | 'flower'
  | 'beachball'
  | 'shell';
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

/** A pointed leaf with a centre vein, its stalk end at (0, 0). */
function leaf(x: number, y: number, angle: number, len = 34) {
  const w = len * 0.36;
  const l = new Graphics()
    .moveTo(0, 0)
    .quadraticCurveTo(len * 0.45, -w, len, 0)
    .quadraticCurveTo(len * 0.45, w, 0, 0)
    .closePath()
    .fill(LEAF.fill)
    .stroke(line(LEAF.line, 3));
  l.moveTo(3, 0)
    .lineTo(len * 0.78, 0)
    .stroke({ width: 2, color: LEAF.line, alpha: 0.7, cap: 'round' });
  l.position.set(x, y);
  l.rotation = angle;
  return l;
}

/** A little five-point star: an orange's navel or a blueberry's crown. */
function star(g: Graphics, x: number, y: number, r: number, color: number) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const k = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  g.poly(pts).fill(color);
}

/** A strawberry, banana or plum about 64 units across, centered on (0, 0), in its own colors. */
export function smallFruit(kind: SmallFruit): Graphics {
  const g = new Graphics();
  const line = (color: number) => ({ width: 4, color, join: 'round' as const });
  if (kind === 'strawberry') {
    const c = swatch.red;
    g.moveTo(0, -18)
      .bezierCurveTo(-28, -28, -40, 0, -16, 22)
      .bezierCurveTo(-8, 30, -4, 34, 0, 36)
      .bezierCurveTo(4, 34, 8, 30, 16, 22)
      .bezierCurveTo(40, 0, 28, -28, 0, -18)
      .fill(c.fill)
      .stroke(line(c.line));
    // Seeds in staggered rows, each a little teardrop pointing down.
    for (const [x, y] of [
      [-16, -8],
      [0, -6],
      [16, -8],
      [-8, 6],
      [8, 6],
      [-14, 18],
      [14, 18],
      [0, 20],
      [0, 31],
    ])
      g.moveTo(x, y - 3)
        .quadraticCurveTo(x + 2.4, y, x, y + 3)
        .quadraticCurveTo(x - 2.4, y, x, y - 3)
        .fill(swatch.yellow.light);
    // Pointed green sepals fanned over the top, and a short stalk.
    for (const [tx, ty] of [
      [-26, -10],
      [-13, -2],
      [0, 0],
      [13, -2],
      [26, -10],
    ]) {
      const bx = tx * 0.3;
      g.poly([bx - 6, -23, tx, ty, bx + 6, -23]);
    }
    g.fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line, join: 'round' });
    g.moveTo(0, -22)
      .quadraticCurveTo(0, -30, 4, -34)
      .stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    return g;
  }
  if (kind === 'banana') {
    const c = swatch.yellow;
    g.moveTo(-26, -24)
      .bezierCurveTo(-34, 6, -10, 30, 26, 22)
      .bezierCurveTo(30, 21, 30, 16, 26, 14)
      .bezierCurveTo(0, 16, -16, 0, -16, -24)
      .closePath()
      .fill(c.fill)
      .stroke(line(c.line));
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
  return g;
}

export function prop(kind: PropKind, color: ColorName): Container {
  const sw = swatch[color];
  const c = new Container();
  const g = new Graphics();
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
      g.moveTo(-6, -32).quadraticCurveTo(0, -27, 6, -32).stroke({ width: 3, color: sw.line, cap: 'round' });
      g.moveTo(0, -30).quadraticCurveTo(2, -46, 8, -54).stroke(line(STEM, 5));
      c.addChild(g, leaf(6, -46, -0.5));
      break;
    case 'orange':
      g.ellipse(0, 2, 47, 44).fill(sw.fill).stroke(line(sw.line));
      for (const [x, y] of [
        [-16, -8],
        [12, 16],
        [22, -14],
        [-8, 24],
        [-28, 10],
        [30, 4],
        [4, -2],
      ])
        g.circle(x, y, 2).fill(darken(sw.fill, 0.18));
      star(g, 0, -38, 6, sw.line);
      c.addChild(g, leaf(2, -40, -0.6, 30));
      break;
    case 'lemon':
      // An oval drawn out to a little point at each end.
      g.poly(
        Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const cx = Math.cos(a);
          return [cx * 46 + Math.sign(cx) * 12 * Math.abs(cx) ** 14, Math.sin(a) * 36];
        }).flat(),
      )
        .fill(sw.fill)
        .stroke(line(sw.line));
      for (const [x, y] of [
        [-20, 10],
        [8, 18],
        [26, 4],
        [-4, -4],
        [-32, -4],
      ])
        g.circle(x, y, 1.8).fill(darken(sw.fill, 0.14));
      c.addChild(g);
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
      for (const [x, y] of [
        [12, 4],
        [22, 22],
        [-8, 30],
        [6, 38],
        [-20, 14],
      ])
        g.circle(x, y, 1.8).fill(darken(sw.fill, 0.2));
      g.moveTo(0, -46).quadraticCurveTo(2, -58, 8, -64).stroke(line(STEM, 5));
      c.addChild(g, leaf(5, -56, -0.25, 28));
      break;
    case 'blueberries': {
      // A loose pile, the ones behind a shade darker, each with its little crown.
      const spots: [number, number, number][] = [
        [10, -26, 1],
        [-26, -12, 1],
        [26, 10, 0],
        [-6, 20, 0],
        [-32, 26, 0],
        [-4, -8, 0],
      ];
      const r = 19;
      for (const [x, y, back] of spots) {
        const fill = back ? darken(sw.fill, 0.14) : sw.fill;
        g.circle(x, y, r).fill(fill).stroke(line(sw.line, 4));
        star(g, x + 3, y - r * 0.42, 5.5, darken(sw.fill, 0.42));
      }
      c.addChild(g);
      break;
    }
    case 'grapes': {
      // A tapering bunch: the back grapes a shade darker, a curly tendril by the stalk.
      const rows: [number, number[]][] = [
        [-26, [-33, -11, 11, 33]],
        [-4, [-22, 0, 22]],
        [18, [-11, 11]],
        [40, [0]],
      ];
      const r = 13.5;
      rows.forEach(([y, xs], ri) =>
        xs.forEach((x, i) => {
          const back = (ri + i) % 2 === 1;
          g.circle(x, y, r)
            .fill(back ? darken(sw.fill, 0.14) : sw.fill)
            .stroke(line(sw.line, 4));
        }),
      );
      g.moveTo(0, -38).quadraticCurveTo(2, -50, 8, -58).stroke(line(STEM, 5));
      g.moveTo(4, -46)
        .bezierCurveTo(-8, -50, -20, -44, -18, -36)
        .bezierCurveTo(-16, -30, -8, -34, -12, -40)
        .stroke({ width: 2.5, color: LEAF.line, cap: 'round' });
      c.addChild(g, leaf(6, -50, -0.35, 36));
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
        g.moveTo(0, 0)
          .arc(0, 0, 46, a, a + Math.PI / 3)
          .closePath()
          .fill(fill);
      });
      g.circle(0, 0, 46).stroke(line(swatch.white.line, 5));
      g.circle(0, 0, 10).fill(0xffffff).stroke(line(swatch.white.line, 3));
      c.addChild(g);
      break;
    }
    case 'shell': {
      // A scallop: a ribbed fan on a little hinge.
      g.moveTo(-14, 40)
        .lineTo(-50, -6)
        .quadraticCurveTo(0, -66, 50, -6)
        .lineTo(14, 40)
        .closePath()
        .fill(sw.fill)
        .stroke(line(sw.line));
      for (const x of [-30, -15, 0, 15, 30])
        g.moveTo(x * 0.3, 38)
          .lineTo(x * 1.25, -18 - (30 - Math.abs(x)) * 0.8)
          .stroke(line(sw.line, 3));
      g.roundRect(-22, 34, 44, 14, 5).fill(sw.fill).stroke(line(sw.line, 4));
      c.addChild(g);
      break;
    }
    case 'balloon':
      g.moveTo(0, 46).quadraticCurveTo(-6, 60, 4, 72).stroke(line(0x8c8c9c, 3));
      g.ellipse(0, -6, 40, 48).fill(sw.fill).stroke(line(sw.line));
      g.poly([-7, 46, 7, 46, 0, 38]).fill(sw.line);
      c.addChild(g);
      break;
    case 'flower': {
      // Five separate petals in two shades round a seedy middle (a darker one on a yellow flower).
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const pts = ellipsePoints(Math.cos(a) * 27, Math.sin(a) * 27, 26, 19, a).flat();
        g.poly(pts)
          .fill(i % 2 ? darken(sw.fill, 0.1) : sw.fill)
          .stroke(line(sw.line, 4));
      }
      const mid = color === 'yellow' ? swatch.orange : swatch.yellow;
      g.circle(0, 0, 19).fill(mid.fill).stroke(line(mid.line, 4));
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.circle(Math.cos(a) * 9, Math.sin(a) * 9, 2.2).fill(mid.line);
      }
      c.addChild(g);
      break;
    }
  }
  return c;
}

/** A black top hat with a red band, in a critter's body coordinates (it sits on the head); Critter Sort's, shared. */
/** A scarf wound round the neck with one end hanging down; it rides on the critter's body like the hat. */
export function scarfArt(): Graphics {
  return new Graphics()
    .ellipse(0, -84, 92, 22)
    .fill(swatch.blue.fill)
    .stroke({ width: 5, color: swatch.blue.line })
    .rect(-44, -90, 14, 14)
    .rect(-8, -92, 14, 14)
    .rect(28, -90, 14, 14)
    .fill(swatch.white.light)
    .roundRect(30, -78, 30, 78, 8)
    .fill(swatch.blue.fill)
    .stroke({ width: 5, color: swatch.blue.line })
    .rect(30, -26, 30, 10)
    .fill(swatch.white.light);
}

export function hatArt(): Graphics {
  return new Graphics()
    .ellipse(0, -254, 74, 16)
    .fill(ink)
    .roundRect(-44, -342, 88, 90, 10)
    .fill(ink)
    .rect(-44, -280, 88, 16)
    .fill(swatch.red.fill);
}
