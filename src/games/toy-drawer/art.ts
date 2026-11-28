import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { sizeAt, TOY_SIZE, type ToyKind } from './logic';

const COLOR: Record<ToyKind, ColorName> = {
  train: 'red',
  bear: 'brown',
  ball: 'blue',
  car: 'yellow',
  book: 'green',
  blocks: 'purple',
  ladder: 'orange',
};

/** The toy upright and unturned, from (0, 0) to (w·s, h·s). Chunky and flat, so its cells read without a grid on it. */
function draw(kind: ToyKind, s: number): Graphics {
  const { w, h } = TOY_SIZE[kind];
  const W = w * s;
  const H = h * s;
  const sw = swatch[COLOR[kind]];
  const pad = s * 0.06;
  const g = new Graphics();
  if (kind === 'ball') {
    g.circle(W / 2, H / 2, s * 0.44)
      .fill(sw.fill)
      .stroke({ width: 5, color: sw.line });
    g.arc(W / 2, H / 2, s * 0.3, -0.6, 1.6).stroke({ width: 7, color: 0xffffff, alpha: 0.85 });
    return g;
  }
  g.roundRect(pad, pad, W - 2 * pad, H - 2 * pad, s * 0.18)
    .fill(sw.fill)
    .stroke({ width: 5, color: sw.line });
  if (kind === 'train') {
    for (let i = 0; i < w; i++) {
      const x = i * s + s / 2;
      g.roundRect(x - s * 0.22, s * 0.2, s * 0.44, s * 0.32, 8).fill(swatch.blue.light);
      g.circle(x - s * 0.22, H - s * 0.14, s * 0.1).fill(ink);
      g.circle(x + s * 0.22, H - s * 0.14, s * 0.1).fill(ink);
      if (i > 0) g.rect(i * s - 6, H / 2 - 5, 12, 10).fill(sw.line);
    }
  } else if (kind === 'bear') {
    g.circle(s * 0.55, s * 0.5, s * 0.2)
      .fill(sw.fill)
      .stroke({ width: 4, color: sw.line });
    g.circle(W - s * 0.55, s * 0.5, s * 0.2)
      .fill(sw.fill)
      .stroke({ width: 4, color: sw.line });
    g.circle(W / 2, H / 2, s * 0.52)
      .fill(sw.light)
      .stroke({ width: 4, color: sw.line });
    g.circle(W / 2 - s * 0.2, H / 2 - s * 0.1, s * 0.07).fill(ink);
    g.circle(W / 2 + s * 0.2, H / 2 - s * 0.1, s * 0.07).fill(ink);
    g.ellipse(W / 2, H / 2 + s * 0.12, s * 0.15, s * 0.1).fill(ink);
  } else if (kind === 'car') {
    g.roundRect(s * 0.4, s * 0.18, W - s * 0.8, s * 0.3, 10).fill(swatch.blue.light);
    g.circle(s * 0.5, H - s * 0.13, s * 0.14).fill(ink);
    g.circle(W - s * 0.5, H - s * 0.13, s * 0.14).fill(ink);
  } else if (kind === 'book') {
    g.rect(W / 2 - 4, pad + 6, 8, H - 2 * pad - 12).fill(sw.line);
    g.roundRect(s * 0.3, s * 0.3, s * 0.45, s * 0.12, 5).fill(0xffffff);
    g.roundRect(W / 2 + s * 0.22, s * 0.3, s * 0.45, s * 0.12, 5).fill(0xffffff);
  } else if (kind === 'blocks') {
    const half = W / 2;
    g.rect(half - 3, pad + 4, 6, H - 2 * pad - 8).fill(sw.line);
    g.rect(pad + 4, H / 2 - 3, W - 2 * pad - 8, 6).fill(sw.line);
    g.circle(half / 2, half / 2, s * 0.16).fill(swatch.yellow.fill);
    g.rect(half + half / 2 - s * 0.15, half / 2 - s * 0.15, s * 0.3, s * 0.3).fill(swatch.pink.fill);
    g.poly([
      half / 2,
      half + half / 2 - s * 0.2,
      half / 2 + s * 0.2,
      half + half / 2 + s * 0.16,
      half / 2 - s * 0.2,
      half + half / 2 + s * 0.16,
    ]).fill(swatch.teal.fill);
  } else if (kind === 'ladder') {
    g.rect(s * 0.18, 0, 7, H).fill(wood.line);
    g.rect(W - s * 0.18 - 7, 0, 7, H).fill(wood.line);
    for (let i = 0; i < h * 2; i++)
      g.rect(s * 0.18, s * 0.25 + i * s * 0.5, W - s * 0.36, 7)
        .fill(wood.fill)
        .stroke({ width: 2, color: wood.line });
  }
  return g;
}

/**
 * A toy at `turns` quarter-turns, as a container whose top-left is (0, 0) and whose size is the turned footprint at cell
 * size `s`. The art is drawn upright and turned about its own center, so a turn never re-draws it.
 */
export function toyBody(kind: ToyKind, turns: number, s: number): Container {
  const { w, h } = TOY_SIZE[kind];
  const t = sizeAt(kind, turns);
  const outer = new Container();
  const inner = draw(kind, s);
  inner.pivot.set((w * s) / 2, (h * s) / 2);
  inner.position.set((t.w * s) / 2, (t.h * s) / 2);
  inner.rotation = (turns * Math.PI) / 2;
  outer.addChild(inner);
  return outer;
}

/** The drawer: a wooden box with a lit floor of cells. Origin at its top-left. */
export function drawerArt(rows: number, cols: number, cell: number): Container {
  const c = new Container();
  const W = cols * cell;
  const H = rows * cell;
  const g = new Graphics();
  g.roundRect(-22, -22, W + 44, H + 44, 26)
    .fill(wood.fill)
    .stroke({ width: 6, color: wood.line });
  g.roundRect(0, 0, W, H, 10).fill(wood.light);
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      g.roundRect(k * cell + 4, r * cell + 4, cell - 8, cell - 8, 10).fill({ color: 0xffffff, alpha: 0.35 });
    }
  c.addChild(g);
  return c;
}

/** A hub and sticker picture: a little drawer with a bear peeking out. */
export function drawerIcon(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-50, -34, 100, 68, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
  g.roundRect(-40, -24, 80, 22, 8).fill(wood.light);
  g.roundRect(-14, 8, 28, 10, 5).fill(wood.line);
  g.circle(0, -34, 20).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.circle(-7, -36, 3).fill(ink);
  g.circle(7, -36, 3).fill(ink);
  c.addChild(g);
  return c;
}
