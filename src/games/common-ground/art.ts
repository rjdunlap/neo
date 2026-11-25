import { Container, Graphics } from 'pixi.js';
import { cream, grass, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  CELLS,
  COLS,
  TINTS,
  pickVisit,
  place,
  emptyRoom,
  type Fixture,
  type Friend,
  type Piece,
  type Room,
  type Side,
} from './logic';

/** The cushion colours a seed picks from. */
const TINT_NAMES: readonly ColorName[] = ['pink', 'purple', 'orange', 'blue'].slice(0, TINTS) as ColorName[];

/** A soft square cushion with a button, `size` units wide and centred on (0, 0). */
export function cushionArt(size: number, tint = 0): Container {
  const c = swatch[TINT_NAMES[tint % TINT_NAMES.length]];
  const g = new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, size * 0.26)
    .fill(c.fill)
    .stroke({ width: 4, color: c.line })
    .roundRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72, size * 0.18)
    .stroke({ width: 3, color: c.light })
    .circle(0, 0, size * 0.07)
    .fill(c.line);
  return new Container().addChild(g);
}

/** A book basket: a woven tub with a few spines showing. */
export function basketArt(size: number): Container {
  const w = size * 0.86,
    h = size * 0.5;
  const g = new Graphics();
  const books = [swatch.red, swatch.blue, swatch.green];
  books.forEach((b, i) => {
    const x = -w * 0.3 + i * w * 0.3;
    g.roundRect(x - size * 0.07, -size * 0.38, size * 0.14, size * 0.4, 4)
      .fill(b.fill)
      .stroke({ width: 3, color: b.line });
  });
  g.roundRect(-w / 2, -size * 0.08, w, h, size * 0.12)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
  for (let i = 1; i < 4; i++)
    g.moveTo(-w / 2 + (w * i) / 4, -size * 0.04)
      .lineTo(-w / 2 + (w * i) / 4, size * 0.38)
      .stroke({ width: 3, color: wood.line });
  return new Container().addChild(g);
}

/** A potted plant. */
export function plantArt(size: number): Container {
  const g = new Graphics();
  for (const [dx, dy, r] of [
    [-0.18, -0.2, 0.2],
    [0.18, -0.2, 0.2],
    [0, -0.34, 0.22],
  ] as const)
    g.ellipse(dx * size, dy * size, r * size * 0.8, r * size * 1.1)
      .fill(swatch.green.fill)
      .stroke({ width: 3, color: swatch.green.line });
  g.roundRect(-size * 0.22, -size * 0.02, size * 0.44, size * 0.34, size * 0.06)
    .fill(swatch.orange.fill)
    .stroke({ width: 4, color: swatch.orange.line });
  return new Container().addChild(g);
}

export function pieceArt(piece: Piece, size: number, tint = 0): Container {
  return piece === 'cushion' ? cushionArt(size, tint) : piece === 'basket' ? basketArt(size) : plantArt(size);
}

/** The window on the top wall, `w` wide and `h` tall, centred on (0, 0). */
export function windowArt(w: number, h: number): Container {
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 8)
    .fill(swatch.blue.light)
    .stroke({ width: 6, color: wood.line })
    .moveTo(0, -h / 2)
    .lineTo(0, h / 2)
    .stroke({ width: 4, color: wood.line })
    .circle(-w * 0.22, 0, h * 0.14)
    .fill(swatch.yellow.fill);
  return new Container().addChild(g);
}

/** The door on the bottom wall. */
export function doorArt(w: number, h: number): Container {
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 10)
    .fill(wood.fill)
    .stroke({ width: 6, color: wood.line })
    .circle(w * 0.28, 0, h * 0.09)
    .fill(swatch.yellow.fill);
  return new Container().addChild(g);
}

export const fixtureArt = (f: Fixture, w: number, h: number) =>
  f === 'window' ? windowArt(w, h) : doorArt(w, h);

/** A visiting friend, about `size` tall, feet on (0, 0). */
export function friendArt(friend: Friend, size: number): Container {
  const body: ColorName = { bunny: 'white', cat: 'orange', owl: 'brown', mouse: 'lavender' as ColorName }[
    friend
  ] as ColorName;
  const c = swatch[body];
  const r = size * 0.22;
  const g = new Graphics();
  g.ellipse(0, -size * 0.28, size * 0.26, size * 0.3)
    .fill(c.fill)
    .stroke({ width: 4, color: c.line });
  const hy = -size * 0.72;
  const ear = (dx: number) => {
    if (friend === 'bunny')
      g.ellipse(dx * r, hy - r * 1.35, r * 0.34, r * 0.95)
        .fill(c.fill)
        .stroke({ width: 3, color: c.line });
    else if (friend === 'mouse')
      g.circle(dx * r * 1.05, hy - r * 0.7, r * 0.5)
        .fill(swatch.pink.fill)
        .stroke({ width: 3, color: c.line });
    else
      g.poly([dx * r * 1.15, hy - r * 1.3, dx * r * 0.45, hy - r * 0.7, dx * r * 1.15, hy - r * 0.3])
        .fill(c.fill)
        .stroke({ width: 3, color: c.line });
  };
  ear(-1);
  ear(1);
  g.circle(0, hy, r).fill(c.fill).stroke({ width: 4, color: c.line });
  if (friend === 'owl') {
    g.circle(-r * 0.4, hy, r * 0.32)
      .fill(0xffffff)
      .circle(r * 0.4, hy, r * 0.32)
      .fill(0xffffff);
    g.circle(-r * 0.4, hy, r * 0.14)
      .fill(ink)
      .circle(r * 0.4, hy, r * 0.14)
      .fill(ink);
    g.poly([-r * 0.12, hy + r * 0.2, r * 0.12, hy + r * 0.2, 0, hy + r * 0.5]).fill(swatch.yellow.fill);
  } else {
    g.circle(-r * 0.36, hy - r * 0.1, r * 0.11)
      .fill(ink)
      .circle(r * 0.36, hy - r * 0.1, r * 0.11)
      .fill(ink);
    g.ellipse(0, hy + r * 0.28, r * 0.14, r * 0.1).fill(swatch.pink.line);
  }
  return new Container().addChild(g);
}

/** A tick badge on a request bubble, 48 units across. */
export function tickArt(): Container {
  const g = new Graphics()
    .circle(0, 0, 24)
    .fill(swatch.green.fill)
    .stroke({ width: 4, color: swatch.green.line })
    .moveTo(-10, 1)
    .lineTo(-3, 9)
    .lineTo(11, -8)
    .stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
  return new Container().addChild(g);
}

/** An arrow pointing right, `size` wide. */
function arrow(size: number): Graphics {
  return new Graphics()
    .moveTo(-size / 2, 0)
    .lineTo(size / 2 - 6, 0)
    .stroke({ width: 8, color: swatch.teal.line, cap: 'round' })
    .moveTo(size / 2 - 22, -16)
    .lineTo(size / 2, 0)
    .lineTo(size / 2 - 22, 16)
    .stroke({ width: 8, color: swatch.teal.line, cap: 'round', join: 'round' });
}

/** A request bubble `w` × `h` centred on (0, 0): the cushion with its fixture, or the basket with an arrow to the cushion. */
export function requestArt(
  kind: 'cushion' | 'basket',
  fixture: Fixture,
  w: number,
  h: number,
  tint: number,
): Container {
  const root = new Container();
  root.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 30)
      .fill(cream)
      .stroke({ width: 5, color: swatch.teal.line }),
  );
  const s = h * 0.62;
  if (kind === 'cushion') {
    const c = cushionArt(s, tint);
    c.x = -w * 0.2;
    const f = fixtureArt(
      fixture,
      fixture === 'window' ? s * 1.1 : s * 0.8,
      fixture === 'window' ? s * 0.8 : s * 1.1,
    );
    f.x = w * 0.2;
    const a = arrow(w * 0.16);
    root.addChild(c, a, f);
  } else {
    const b = basketArt(s);
    b.x = -w * 0.26;
    const a = arrow(w * 0.18);
    a.x = 0;
    const c = cushionArt(s * 0.8, tint);
    c.x = w * 0.26;
    root.addChild(b, a, c);
  }
  return root;
}

/** The offset of the previewed side from the cushion, in units of `d`. */
const SIDE_OFFSET: Record<Side, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  above: [0, -1],
  below: [0, 1],
};

/**
 * The changed request's bubble, `w` × `h` centred on (0, 0): the cushion with the basket's old side crossed out in a soft
 * colour, then an arrow to the basket, which may go on any other side.
 */
export function changedRequestArt(previewed: Side, w: number, h: number, tint: number): Container {
  const root = new Container();
  root.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 30)
      .fill(cream)
      .stroke({ width: 5, color: swatch.teal.line }),
  );
  const s = h * 0.5;
  const cushion = cushionArt(s, tint);
  cushion.x = -w * 0.2;
  const [dx, dy] = SIDE_OFFSET[previewed];
  const old = basketArt(s * 0.7);
  old.alpha = 0.45;
  old.position.set(cushion.x + dx * s * 0.95, dy * s * 0.72);
  const cross = new Graphics();
  const r = s * 0.3;
  cross
    .moveTo(-r, -r)
    .lineTo(r, r)
    .moveTo(r, -r)
    .lineTo(-r, r)
    .stroke({ width: 8, color: swatch.red.line, cap: 'round' });
  cross.position.set(old.x, old.y);
  const a = arrow(w * 0.16);
  a.x = w * 0.08;
  const b = basketArt(s * 1.1);
  b.x = w * 0.3;
  root.addChild(cushion, old, cross, a, b);
  return root;
}

/** A dashed rounded outline `size` units square, centred on (0, 0): the ghost of the basket's old place. Drawing only. */
export function ghostArt(size: number): Graphics {
  const g = new Graphics();
  const h = size / 2,
    dash = 14,
    gap = 10;
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < len; t += dash + gap) {
      const t1 = Math.min(len, t + dash);
      g.moveTo(x0 + ((x1 - x0) * t) / len, y0 + ((y1 - y0) * t) / len).lineTo(
        x0 + ((x1 - x0) * t1) / len,
        y0 + ((y1 - y0) * t1) / len,
      );
    }
  };
  edge(-h, -h, h, -h);
  edge(h, -h, h, h);
  edge(h, h, -h, h);
  edge(-h, h, -h, -h);
  g.stroke({ width: 5, color: swatch.red.line, cap: 'round' });
  return g;
}

/** A curved back arrow for the Undo button, about 56 units across. */
export function undoArt(): Container {
  const g = new Graphics()
    .arc(4, 4, 20, Math.PI * 1.1, Math.PI * 2.3)
    .stroke({ width: 8, color: 0xffffff, cap: 'round' })
    .poly([-26, -8, -6, -26, -2, 0])
    .fill(0xffffff);
  return new Container().addChild(g);
}

/** The cell grid, `cell` units each, centred on (0, 0), with the fixture on its wall and a doormat at the bottom. */
export function floorArt(cell: number): Graphics {
  const w = cell * COLS,
    h = cell * 2;
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 16)
    .fill(wood.light)
    .stroke({ width: 6, color: wood.line });
  for (let i = 0; i < CELLS; i++) {
    const x = -w / 2 + (i % COLS) * cell,
      y = -h / 2 + Math.floor(i / COLS) * cell;
    g.roundRect(x + 6, y + 6, cell - 12, cell - 12, 12).fill((i + Math.floor(i / COLS)) % 2 ? grass : cream);
  }
  return g;
}

/** The sticker: a finished room, drawn from its seed so a kept sticker keeps its picture. */
export function roomSticker(seed: number): Container {
  const rng = new Rng(seed);
  const v = pickVisit(rng);
  const cell = 34;
  const root = new Container();
  root.addChild(floorArt(cell));
  const row = v.fixture === 'window' ? 0 : 1;
  let room: Room = emptyRoom();
  room = place(room, 'cushion', row * COLS + 1);
  room = place(room, 'basket', row * COLS + (rng.chance(0.5) ? 0 : 2));
  if (rng.chance(0.6)) room = place(room, 'plant', (1 - row) * COLS + rng.int(0, 2));
  const f = fixtureArt(v.fixture, 46, v.fixture === 'window' ? 22 : 30);
  f.y = row === 0 ? -cell - 18 : cell + 22;
  root.addChild(f);
  room.forEach((p, i) => {
    if (!p) return;
    const a = pieceArt(p, cell * 0.8, v.tint);
    a.position.set(
      -cell * 1.5 + (i % COLS) * cell + cell / 2,
      -cell + Math.floor(i / COLS) * cell + cell / 2,
    );
    root.addChild(a);
  });
  const friend = friendArt(v.friend, 44);
  const fc = room.indexOf('cushion');
  friend.position.set(
    -cell * 1.5 + (fc % COLS) * cell + cell / 2,
    -cell + Math.floor(fc / COLS) * cell + cell * 0.9,
  );
  root.addChild(friend);
  return root;
}
