import { Container, Graphics } from 'pixi.js';
import type { RoomItemId } from '../content/world';
import { cream, ink, swatch, wood } from './palette';

/** How big an item stands, in logical units: its feet are at (0, 0) and it rises into negative y. */
export const ITEM_SIZE: Record<RoomItemId, { w: number; h: number }> = {
  bed: { w: 230, h: 120 },
  lamp: { w: 90, h: 215 },
  rug: { w: 270, h: 70 },
  shelf: { w: 150, h: 235 },
  plant: { w: 120, h: 180 },
  musicbox: { w: 140, h: 110 },
};

/** One furnishing, drawn with its feet at the origin. Nothing is imported: it is all shapes. */
export function roomItem(id: RoomItemId): Container {
  const g = new Graphics();
  switch (id) {
    case 'bed':
      g.roundRect(-112, -62, 224, 62, 14).fill(wood.line)
        .roundRect(-112, -122, 26, 122, 10).fill(wood.fill).stroke({ width: 5, color: wood.line })
        .roundRect(-104, -88, 212, 54, 18).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line })
        .roundRect(-40, -92, 148, 50, 16).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line })
        .roundRect(-98, -104, 58, 32, 16).fill(0xffffff).stroke({ width: 4, color: swatch.white.line });
      for (let i = 0; i < 4; i++) g.circle(-12 + i * 36, -66, 7).fill(swatch.purple.light);
      g.roundRect(-104, -10, 18, 14, 4).roundRect(86, -10, 18, 14, 4).fill(wood.line);
      break;
    case 'lamp':
      g.ellipse(0, -8, 34, 10).fill(ink).rect(-4, -160, 8, 152).fill(ink)
        .poly([-40, -158, 40, -158, 24, -214, -24, -214]).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' })
        .ellipse(0, -158, 40, 8).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 'rug':
      g.ellipse(0, -30, 134, 34).fill(swatch.pink.fill).stroke({ width: 5, color: swatch.pink.line })
        .ellipse(0, -30, 98, 23).fill(swatch.pink.light)
        .ellipse(0, -30, 62, 13).fill(swatch.pink.fill);
      break;
    case 'shelf':
      g.roundRect(-72, -236, 144, 236, 10).fill(wood.fill).stroke({ width: 6, color: wood.line })
        .roundRect(-60, -224, 120, 212, 6).fill(wood.light);
      for (const y of [-160, -88]) g.rect(-62, y, 124, 10).fill(wood.fill).stroke({ width: 3, color: wood.line });
      // Books on the top two shelves, and a toy bear in the bottom one.
      [swatch.red, swatch.green, swatch.blue, swatch.orange, swatch.purple].forEach((sw, i) => g.roundRect(-54 + i * 21, -218 + (i % 2) * 6, 17, 58 - (i % 2) * 6, 3).fill(sw.fill).stroke({ width: 2, color: sw.line }));
      [swatch.teal, swatch.yellow, swatch.pink, swatch.red].forEach((sw, i) => g.roundRect(-54 + i * 26, -146, 21, 56, 3).fill(sw.fill).stroke({ width: 2, color: sw.line }));
      g.circle(0, -34, 26).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line }).circle(-18, -58, 10).circle(18, -58, 10).fill(swatch.brown.fill)
        .circle(-8, -38, 3).circle(8, -38, 3).fill(ink).ellipse(0, -28, 8, 5).fill(swatch.brown.light);
      break;
    case 'plant':
      for (const [x, y, rx, ry] of [[-30, -112, 18, 50], [30, -118, 18, 54], [0, -140, 20, 58], [-52, -84, 14, 38], [52, -84, 14, 38]]) {
        g.ellipse(x, y, rx, ry).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
      }
      g.poly([-44, -74, 44, -74, 34, 0, -34, 0]).fill(swatch.orange.fill).stroke({ width: 5, color: swatch.orange.line, join: 'round' })
        .rect(-48, -82, 96, 16).fill(swatch.orange.fill).stroke({ width: 5, color: swatch.orange.line });
      break;
    case 'musicbox':
      g.roundRect(-64, -64, 128, 64, 10).fill(wood.fill).stroke({ width: 5, color: wood.line })
        .roundRect(-68, -88, 136, 28, 10).fill(wood.light).stroke({ width: 5, color: wood.line })
        .circle(0, -32, 14).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line })
        .moveTo(64, -40).lineTo(86, -40).lineTo(86, -22).stroke({ width: 5, color: swatch.yellow.line, cap: 'round', join: 'round' })
        .circle(86, -22, 6).fill(swatch.yellow.fill);
      break;
  }
  const c = new Container();
  c.addChild(g);
  return c;
}

/** The sticker frame on the wall: a wooden frame around a cream mat, `size` units across. */
export function frameArt(size: number): Graphics {
  const h = size / 2;
  return new Graphics()
    .roundRect(-h + 4, -h + 8, size, size, 18).fill({ color: 0x000000, alpha: 0.12 })
    .roundRect(-h, -h, size, size, 18).fill(wood.fill).stroke({ width: 6, color: wood.line })
    .roundRect(-h + 14, -h + 14, size - 28, size - 28, 10).fill(cream).stroke({ width: 3, color: wood.line });
}

/** A round window onto a sunny sky, `r` units in radius. */
export function windowArt(r: number): Graphics {
  const g = new Graphics()
    .circle(0, 0, r + 10).fill(wood.fill).stroke({ width: 6, color: wood.line })
    .circle(0, 0, r).fill(swatch.blue.light)
    .circle(-r * 0.3, -r * 0.3, r * 0.26).fill(swatch.yellow.fill)
    .ellipse(r * 0.25, r * 0.2, r * 0.42, r * 0.18).fill(0xffffff)
    .ellipse(r * 0.45, r * 0.3, r * 0.3, r * 0.14).fill(0xffffff);
  g.moveTo(-r, 0).lineTo(r, 0).moveTo(0, -r).lineTo(0, r).stroke({ width: 6, color: wood.line });
  return g.circle(0, 0, r).stroke({ width: 4, color: wood.line });
}
