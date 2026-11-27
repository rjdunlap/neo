import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { label } from '../../ui/text';
import type { WordId } from './logic';

/** Eight clay stamps: each a shape and its own clay colour, so a sign never rests on colour alone. */
const CLAY = [
  swatch.orange,
  swatch.blue,
  swatch.green,
  swatch.purple,
  swatch.red,
  swatch.teal,
  swatch.yellow,
  swatch.pink,
];

/** A stamped sign of the given shape (0..7), centered on (0, 0), `r` to its farthest point. */
export function signShape(shape: number, r: number, face?: number, line?: number): Graphics {
  const g = new Graphics();
  const k = ((shape % 8) + 8) % 8;
  const sw = CLAY[k];
  switch (k) {
    case 0:
      g.circle(0, 0, r);
      break;
    case 1:
      g.roundRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.15);
      break;
    case 2:
      g.poly([0, -r, r * 0.95, r * 0.8, -r * 0.95, r * 0.8]);
      break;
    case 3:
      g.poly([0, -r, r * 0.8, 0, 0, r, -r * 0.8, 0]);
      break;
    case 4: {
      const pts: number[] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 ? r * 0.45 : r;
        pts.push(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      g.poly(pts);
      break;
    }
    case 5:
      g.poly([
        -r * 0.3,
        -r,
        r * 0.3,
        -r,
        r * 0.3,
        -r * 0.3,
        r,
        -r * 0.3,
        r,
        r * 0.3,
        r * 0.3,
        r * 0.3,
        r * 0.3,
        r,
        -r * 0.3,
        r,
        -r * 0.3,
        r * 0.3,
        -r,
        r * 0.3,
        -r,
        -r * 0.3,
        -r * 0.3,
        -r * 0.3,
      ]);
      break;
    case 6: {
      const pts: number[] = [];
      for (let i = 0; i < 6; i++) pts.push(Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r);
      g.poly(pts);
      break;
    }
    default:
      g.poly([-r, r * 0.7, -r, -r * 0.1, 0, -r, r, -r * 0.1, r, r * 0.7, 0, r * 0.2]);
  }
  return g.fill(face ?? sw.fill).stroke({ width: 4, color: line ?? sw.line });
}

/** A clay cell holding a sign, `size` across; `known` shows it stamped, otherwise a pale blank. */
export function signCell(shape: number, size: number, known = true): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, size * 0.18)
      .fill(known ? 0xf3e2bd : 0xe9dcc0)
      .stroke({ width: 4, color: 0xb59b66 }),
    signShape(shape, size * 0.3),
  );
  return c;
}

/** A picture of one of the five words, about `size` across, centered on (0, 0). */
export function wordPicture(word: WordId, size: number): Container {
  const c = new Container();
  const u = size / 100;
  const g = new Graphics();
  if (word === 'ladder') {
    g.rect(-24 * u, -40 * u, 8 * u, 80 * u)
      .fill(0xa97b50)
      .rect(16 * u, -40 * u, 8 * u, 80 * u)
      .fill(0xa97b50);
    for (const y of [-26, -8, 10, 28]) g.rect(-20 * u, y * u, 40 * u, 7 * u).fill(0xc79a6a);
  } else if (word === 'table') {
    g.roundRect(-40 * u, -18 * u, 80 * u, 14 * u, 4 * u)
      .fill(0xc79a6a)
      .stroke({ width: 3, color: 0x8f6142 });
    g.rect(-34 * u, -4 * u, 9 * u, 40 * u)
      .fill(0xa97b50)
      .rect(25 * u, -4 * u, 9 * u, 40 * u)
      .fill(0xa97b50);
    g.circle(0, -30 * u, 10 * u).fill(swatch.red.fill);
  } else if (word === 'baby') {
    g.circle(0, 0, 32 * u)
      .fill(0xffd9b8)
      .stroke({ width: 3, color: 0xd9a77f });
    g.circle(-11 * u, -4 * u, 4 * u)
      .fill(ink)
      .circle(11 * u, -4 * u, 4 * u)
      .fill(ink);
    g.arc(0, 8 * u, 9 * u, 0.2, Math.PI - 0.2).stroke({ width: 3, color: ink });
    g.circle(0, -34 * u, 6 * u).fill(0xffd9b8);
  } else if (word === 'rider') {
    g.ellipse(0, 14 * u, 36 * u, 18 * u)
      .fill(0xb8845a)
      .rect(26 * u, -18 * u, 10 * u, 28 * u)
      .fill(0xb8845a);
    g.circle(34 * u, -22 * u, 10 * u).fill(0xb8845a);
    g.circle(-6 * u, -18 * u, 11 * u)
      .fill(0xffd9b8)
      .rect(-12 * u, -8 * u, 12 * u, 20 * u)
      .fill(swatch.blue.fill);
  } else {
    g.rect(-44 * u, -34 * u, 88 * u, 68 * u).fill(0xdff1f7);
    for (const y of [-14, 8, 28])
      g.moveTo(-44 * u, y * u)
        .bezierCurveTo(-20 * u, (y - 14) * u, 10 * u, (y + 14) * u, 44 * u, y * u)
        .stroke({ width: 5, color: swatch.blue.fill });
  }
  c.addChild(g);
  return c;
}

/** A crib picture card or a candidate card: the picture with its name under it. */
export function pictureCard(word: WordId, size: number, tint = 0xfff8e6): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, size * 0.14)
      .fill(tint)
      .stroke({ width: 4, color: 0xb59b66 }),
  );
  const p = wordPicture(word, size * 0.6);
  p.position.set(0, -size * 0.1);
  const name = label(word, 22, ink);
  name.anchor.set(0.5);
  name.position.set(0, size * 0.36);
  c.addChild(p, name);
  return c;
}

/** One key-table cell: the sign and, once it is known, its sound written beneath. */
export function keyCellArt(shape: number, size: number, sound: string | null): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, 12)
      .fill(sound ? 0xf3e2bd : 0xe9dcc0)
      .stroke({ width: 3, color: sound ? 0x8f7a46 : 0xc9b98f }),
  );
  const sg = signShape(shape, size * 0.2);
  sg.position.set(0, -size * 0.16);
  c.addChild(sg);
  const t = label(sound ?? '?', 22, sound ? ink : 0x9a8b66);
  t.anchor.set(0.5);
  t.position.set(0, size * 0.27);
  c.addChild(t);
  return c;
}

/** The hub icon and sticker: two clay tablets side by side. */
export function tabletsPicture(): Container {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-52, -30, 48, 62, 8).fill(0xe3c98f).stroke({ width: 4, color: 0x8f7a46 }),
    new Graphics().roundRect(2, -38, 48, 62, 8).fill(0xf0dca8).stroke({ width: 4, color: 0x8f7a46 }),
  );
  const a = signShape(0, 10);
  a.position.set(-28, -8);
  const b = signShape(4, 11);
  b.position.set(26, -10);
  c.addChild(a, b);
  return c;
}
