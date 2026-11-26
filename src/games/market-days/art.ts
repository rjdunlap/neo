import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';

/** The four market days: each a colour and a shape, and the shape is stamped on the town's post so colour never carries it alone. */
export const LOOKS = [
  { shape: 'circle', sw: swatch.orange },
  { shape: 'square', sw: swatch.blue },
  { shape: 'triangle', sw: swatch.green },
  { shape: 'star', sw: swatch.purple },
] as const;

/** A shape of the given look, centered on (0, 0), `r` from the middle to its farthest point. */
export function shapeArt(look: number, r: number, face = 0xffffff, line: number = ink): Graphics {
  const g = new Graphics();
  const s = LOOKS[look].shape;
  if (s === 'circle') g.circle(0, 0, r);
  else if (s === 'square') g.roundRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.18);
  else if (s === 'triangle') g.poly([0, -r, r * 0.95, r * 0.8, -r * 0.95, r * 0.8]);
  else {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? r * 0.45 : r;
      pts.push(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    g.poly(pts);
  }
  return g.fill(face).stroke({ width: 4, color: line });
}

/** A banner in the tray: a coloured card with its shape. */
export function bannerArt(look: number, size: number): Container {
  const c = new Container();
  const sw = LOOKS[look].sw;
  c.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, size * 0.2)
      .fill(sw.fill)
      .stroke({ width: 5, color: sw.line }),
    shapeArt(look, size * 0.28),
  );
  return c;
}

/** A town: a round green with a roof, empty or flying its day's banner, and a ring when it clashes or is glowing. */
export function townArt(size: number, look: number | null, locked: boolean): Container {
  const c = new Container();
  const r = size / 2;
  const sw = look === null ? swatch.white : LOOKS[look].sw;
  c.addChild(
    new Graphics()
      .circle(0, 0, r)
      .fill(look === null ? 0xfff8e6 : sw.light)
      .stroke({ width: 6, color: look === null ? 0xc9b98f : sw.line }),
  );
  if (look === null) {
    // A little house: the town waiting for its day.
    c.addChild(
      new Graphics()
        .rect(-r * 0.32, -r * 0.05, r * 0.64, r * 0.5)
        .fill(0xe8d6a8)
        .stroke({ width: 3, color: 0xa88f55 }),
      new Graphics()
        .poly([-r * 0.42, -r * 0.05, 0, -r * 0.45, r * 0.42, -r * 0.05])
        .fill(0xc8956a)
        .stroke({ width: 3, color: 0x8f6142 }),
    );
  } else {
    c.addChild(shapeArt(look, r * 0.52, sw.fill, sw.line));
  }
  if (locked) c.addChild(new Graphics().circle(0, 0, r + 8).stroke({ width: 4, color: ink, alpha: 0.35 }));
  return c;
}
