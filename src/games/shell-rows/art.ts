import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { shell } from '../../art/shore';
import type { Board } from './logic';

export const SAND = 0xf3dca8;
export const WET = 0xd9b97a;
export const GROOVE_INK = 0xc49a5c;
const PEBBLE = { fill: 0x9a93b0, light: 0xc9c3dc, line: 0x6f6888 };

/** The wet-sand board: a rounded patch with a darker wet edge and four finger-drawn grooves. Centred on (0, 0). */
export function sandBoard(size: number, cell: number, groove: number, border: number): Graphics {
  const g = new Graphics();
  const h = size / 2;
  g.roundRect(-h - 6, -h - 6, size + 12, size + 12, 34).fill({ color: WET, alpha: 0.7 });
  g.roundRect(-h, -h, size, size, 28).fill(SAND);
  const first = -h + border;
  for (const k of [1, 2]) {
    const at = first + k * cell + (k - 0.5) * groove;
    g.moveTo(at, -h + 14)
      .lineTo(at, h - 14)
      .stroke({ width: groove, color: GROOVE_INK, cap: 'round', alpha: 0.75 });
    g.moveTo(-h + 14, at)
      .lineTo(h - 14, at)
      .stroke({ width: groove, color: GROOVE_INK, cap: 'round', alpha: 0.75 });
  }
  // A few sand grains so it reads as sand, not a table.
  for (let i = 0; i < 26; i++) {
    const x = -h + 18 + ((i * 97) % (size - 36)),
      y = -h + 18 + ((i * 61) % (size - 36));
    g.circle(x, y, 2.5).fill({ color: WET, alpha: 0.6 });
  }
  return g;
}

/** One of her shells, sized for a square of `cell`, centred on (0, 0). */
export function shellPiece(cell: number, color: ColorName): Container {
  const c = new Container();
  const g = new Graphics();
  const s = cell / 44;
  g.ellipse(0, cell * 0.27, cell * 0.32, cell * 0.07).fill({ color: ink, alpha: 0.12 });
  shell(g, 0, cell * 0.25, s, swatch[color]);
  c.addChild(g);
  return c;
}

/** One of the pet's pebbles, centred on (0, 0). */
export function pebblePiece(cell: number): Container {
  const c = new Container();
  const g = new Graphics();
  const w = cell * 0.62,
    h = cell * 0.44;
  g.ellipse(0, h * 0.42, w * 0.5, h * 0.18).fill({ color: ink, alpha: 0.12 });
  g.ellipse(0, 0, w / 2, h / 2)
    .fill(PEBBLE.fill)
    .stroke({ color: PEBBLE.line, width: 3 });
  g.ellipse(-w * 0.14, -h * 0.16, w * 0.18, h * 0.12).fill({ color: PEBBLE.light, alpha: 0.8 });
  c.addChild(g);
  return c;
}

/** A small decorative pile beside the board. */
export function pile(kind: 'shell' | 'pebble', color: ColorName = 'pink'): Container {
  const c = new Container();
  const spots = [
    [-16, 10],
    [16, 10],
    [0, -8],
  ];
  for (const [x, y] of spots) {
    const p = kind === 'shell' ? shellPiece(48, color) : pebblePiece(48);
    p.position.set(x, y);
    c.addChild(p);
  }
  c.eventMode = 'none';
  return c;
}

/** A small board drawing for the hub icon and the sticker. */
export function miniBoard(
  board: Board,
  cell: number,
  color: ColorName,
  shine: readonly number[] = [],
): Container {
  const c = new Container();
  const groove = Math.max(4, cell * 0.08),
    border = cell * 0.13;
  const size = 3 * cell + 2 * groove + 2 * border;
  c.addChild(sandBoard(size, cell, groove, border));
  const left = -size / 2 + border + cell / 2;
  board.forEach((v, i) => {
    const x = left + (i % 3) * (cell + groove),
      y = left + Math.floor(i / 3) * (cell + groove);
    if (shine.includes(i))
      c.addChild(new Graphics().circle(x, y, cell * 0.46).fill({ color: swatch.yellow.light, alpha: 0.9 }));
    if (!v) return;
    const p = v === 'shell' ? shellPiece(cell, color) : pebblePiece(cell);
    p.position.set(x, y);
    c.addChild(p);
  });
  return c;
}

/**
 * Level 5's "grown-up plays" toggle: a grown-up's head and shoulders over a pebble on a `size` tile, centred on (0, 0).
 * `set(on, open)` redraws it: lit when a grown-up plays the pebbles, faint once the first shell has closed the choice.
 */
export function seatToggle(size: number): Container & { set(on: boolean, open: boolean): void } {
  const c = new Container() as Container & { set(on: boolean, open: boolean): void };
  const g = new Graphics();
  const pebble = pebblePiece(size * 0.6);
  pebble.position.set(size * 0.2, size * 0.2);
  c.addChild(g, pebble);
  c.set = (on, open) => {
    const h = size / 2;
    g.clear()
      .roundRect(-h, -h, size, size, 22)
      .fill({ color: on ? swatch.yellow.light : 0xffffff, alpha: on ? 1 : 0.8 })
      .stroke({ color: on ? swatch.yellow.line : GROOVE_INK, width: on ? 6 : 4 });
    // Head and shoulders, top-left; the pebble sits bottom-right, so it reads "this person, those pieces".
    g.circle(-size * 0.14, -size * 0.2, size * 0.13).fill(ink);
    g.roundRect(-size * 0.36, -size * 0.04, size * 0.44, size * 0.3, size * 0.14).fill(ink);
    c.alpha = open || on ? 1 : 0.35;
  };
  c.set(false, true);
  return c;
}
