import { Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import type { Kind } from './logic';

/** Dry sand, which also shows through the floaty ring's hole. */
export const SAND = 0xf3dfa8;

/** A beach thing about `d` across, centered on (0, 0). */
export function thingArt(kind: Kind, d: number): Graphics {
  const g = new Graphics();
  const r = d / 2;
  switch (kind) {
    case 'shell': {
      g.moveTo(0, r * 0.75);
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        g.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.85 + r * 0.15);
      }
      g.closePath().fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line, join: 'round' });
      for (let i = 1; i < 5; i++) {
        const a = Math.PI + (i / 5) * Math.PI;
        g.moveTo(0, r * 0.7).lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.75 + r * 0.15).stroke({ width: 2, color: swatch.pink.line });
      }
      break;
    }
    case 'pebble':
      g.ellipse(0, 0, r * 0.9, r * 0.65).fill(0xb8b8c4).stroke({ width: 3, color: 0x7d7d8c }).ellipse(-r * 0.3, -r * 0.2, r * 0.25, r * 0.12).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'leaf':
      g.moveTo(-r * 0.9, 0).quadraticCurveTo(0, -r * 0.9, r * 0.9, 0).quadraticCurveTo(0, r * 0.9, -r * 0.9, 0).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line })
        .moveTo(-r * 0.9, 0).lineTo(r * 0.8, 0).stroke({ width: 2, color: swatch.green.line });
      break;
    case 'feather':
      g.moveTo(-r, r * 0.3).quadraticCurveTo(-r * 0.2, -r * 0.7, r * 0.9, -r * 0.4).quadraticCurveTo(r * 0.1, r * 0.5, -r, r * 0.3).fill(0xffffff).stroke({ width: 3, color: 0x8c8c9c })
        .moveTo(-r, r * 0.3).lineTo(r * 0.8, -r * 0.35).stroke({ width: 2, color: 0x8c8c9c });
      break;
    case 'pinecone':
      g.ellipse(0, 0, r * 0.6, r * 0.9).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
      for (let y = -0.6; y <= 0.6; y += 0.3) g.moveTo(-r * 0.5, r * y).quadraticCurveTo(0, r * (y + 0.2), r * 0.5, r * y).stroke({ width: 2, color: swatch.brown.line });
      break;
    case 'boat':
      g.moveTo(-r * 0.9, r * 0.2).lineTo(r * 0.9, r * 0.2).lineTo(r * 0.6, r * 0.6).lineTo(-r * 0.6, r * 0.6).closePath().fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line, join: 'round' })
        .moveTo(0, r * 0.2).lineTo(0, -r * 0.8).stroke({ width: 3, color: wood.line })
        .moveTo(r * 0.05, -r * 0.75).lineTo(r * 0.65, r * 0.1).lineTo(r * 0.05, r * 0.1).closePath().fill(0xffffff).stroke({ width: 2, color: 0x8c8c9c });
      break;
    case 'seaweed':
      for (const dx of [-0.4, 0, 0.4]) g.moveTo(r * dx, r * 0.8).bezierCurveTo(r * (dx - 0.4), r * 0.2, r * (dx + 0.4), -r * 0.2, r * dx, -r * 0.8).stroke({ width: Math.max(5, r * 0.2), color: swatch.teal.line, cap: 'round' });
      break;
    case 'starfish': {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const k = i % 2 ? r * 0.42 : r * 0.95;
        if (i === 0) g.moveTo(Math.cos(a) * k, Math.sin(a) * k);
        else g.lineTo(Math.cos(a) * k, Math.sin(a) * k);
      }
      g.closePath().fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      break;
    }
    case 'ball':
      g.circle(0, 0, r * 0.9).fill(0xffffff).stroke({ width: 3, color: 0x8c8c9c })
        .moveTo(0, -r * 0.9).quadraticCurveTo(-r * 0.6, 0, 0, r * 0.9).quadraticCurveTo(-r * 1.1, 0, 0, -r * 0.9).fill(swatch.red.fill)
        .moveTo(0, -r * 0.9).quadraticCurveTo(r * 0.6, 0, 0, r * 0.9).quadraticCurveTo(r * 1.1, 0, 0, -r * 0.9).fill(swatch.blue.fill)
        .circle(0, 0, r * 0.9).stroke({ width: 3, color: 0x8c8c9c });
      break;
    case 'driftwood':
      g.roundRect(-r * 0.95, -r * 0.22, r * 1.9, r * 0.44, r * 0.22).fill(wood.fill).stroke({ width: 3, color: wood.line })
        .moveTo(-r * 0.6, 0).lineTo(r * 0.5, 0).stroke({ width: 2, color: wood.line }).circle(r * 0.3, -r * 0.06, r * 0.06).fill(wood.line);
      break;
    case 'bucket':
      g.moveTo(-r * 0.6, -r * 0.5).lineTo(r * 0.6, -r * 0.5).lineTo(r * 0.45, r * 0.8).lineTo(-r * 0.45, r * 0.8).closePath().fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line, join: 'round' })
        .moveTo(-r * 0.6, -r * 0.5).quadraticCurveTo(0, -r * 1.2, r * 0.6, -r * 0.5).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 'ring':
      g.circle(0, 0, r * 0.92).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      for (let i = 0; i < 4; i++) g.arc(0, 0, r * 0.7, (i * Math.PI) / 2, (i * Math.PI) / 2 + 0.6).lineTo(0, 0).closePath().fill(0xffffff);
      g.circle(0, 0, r * 0.4).fill(SAND).stroke({ width: 3, color: swatch.red.line });
      break;
    case 'kite':
      g.moveTo(0, -r * 0.9).lineTo(r * 0.6, -r * 0.1).lineTo(0, r * 0.6).lineTo(-r * 0.6, -r * 0.1).closePath().fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line, join: 'round' })
        .moveTo(0, -r * 0.9).lineTo(0, r * 0.6).moveTo(-r * 0.6, -r * 0.1).lineTo(r * 0.6, -r * 0.1).stroke({ width: 2, color: swatch.purple.line })
        .moveTo(0, r * 0.6).quadraticCurveTo(r * 0.3, r * 0.8, 0, r * 0.95).stroke({ width: 2, color: ink });
      break;
    case 'hat':
      g.ellipse(0, r * 0.25, r * 0.95, r * 0.32).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line })
        .moveTo(-r * 0.5, r * 0.2).quadraticCurveTo(-r * 0.45, -r * 0.65, 0, -r * 0.65).quadraticCurveTo(r * 0.45, -r * 0.65, r * 0.5, r * 0.2).closePath()
        .fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line, join: 'round' })
        .moveTo(-r * 0.5, r * 0.05).quadraticCurveTo(0, r * 0.2, r * 0.5, r * 0.05).stroke({ width: Math.max(4, r * 0.12), color: swatch.pink.fill });
      break;
    case 'spade':
      g.roundRect(-r * 0.08, -r * 0.95, r * 0.16, r * 1.0, r * 0.06).fill(wood.fill).stroke({ width: 3, color: wood.line })
        .roundRect(-r * 0.25, -r * 0.98, r * 0.5, r * 0.16, r * 0.08).fill(wood.fill).stroke({ width: 3, color: wood.line })
        .moveTo(-r * 0.42, 0).lineTo(r * 0.42, 0).quadraticCurveTo(r * 0.45, r * 0.65, 0, r * 0.92).quadraticCurveTo(-r * 0.45, r * 0.65, -r * 0.42, 0).closePath()
        .fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line, join: 'round' });
      break;
    case 'umbrella':
      // Closed and lying on the sand: a furled canopy along a pole.
      g.moveTo(-r * 0.95, r * 0.1).lineTo(r * 0.95, r * 0.1).stroke({ width: 4, color: wood.line, cap: 'round' })
        .moveTo(-r * 0.55, r * 0.1).quadraticCurveTo(-r * 0.1, -r * 0.32, r * 0.75, r * 0.1).quadraticCurveTo(-r * 0.1, r * 0.48, -r * 0.55, r * 0.1).closePath()
        .fill(swatch.teal.fill).stroke({ width: 3, color: swatch.teal.line, join: 'round' })
        .moveTo(-r * 0.3, r * 0.1).quadraticCurveTo(r * 0.1, -r * 0.1, r * 0.5, r * 0.1).stroke({ width: 2, color: swatch.teal.line })
        .moveTo(-r * 0.95, r * 0.1).quadraticCurveTo(-r * 1.0, r * 0.4, -r * 0.8, r * 0.4).stroke({ width: 4, color: wood.line, cap: 'round' })
        .circle(r * 0.95, r * 0.1, r * 0.07).fill(swatch.teal.line);
      break;
    case 'towel':
      // Rolled: a striped roll seen from the side, its spiral end on the right.
      g.roundRect(-r * 0.9, -r * 0.4, r * 1.6, r * 0.8, r * 0.2).fill(swatch.pink.light).stroke({ width: 3, color: swatch.pink.line });
      for (const dx of [-0.55, -0.15, 0.25]) g.rect(r * dx, -r * 0.4, r * 0.16, r * 0.8).fill(swatch.pink.fill);
      g.roundRect(-r * 0.9, -r * 0.4, r * 1.6, r * 0.8, r * 0.2).stroke({ width: 3, color: swatch.pink.line })
        .ellipse(r * 0.7, 0, r * 0.25, r * 0.4).fill(swatch.pink.light).stroke({ width: 3, color: swatch.pink.line })
        .arc(r * 0.7, 0, r * 0.14, 0, Math.PI * 1.6).stroke({ width: 2, color: swatch.pink.line });
      break;
    case 'seaglass':
      g.moveTo(-r * 0.75, -r * 0.2).lineTo(-r * 0.2, -r * 0.7).lineTo(r * 0.7, -r * 0.45).lineTo(r * 0.8, r * 0.3).lineTo(r * 0.1, r * 0.65).lineTo(-r * 0.7, r * 0.4).closePath()
        .fill({ color: swatch.green.light, alpha: 0.95 }).stroke({ width: 3, color: swatch.teal.line, join: 'round' })
        .ellipse(-r * 0.25, -r * 0.3, r * 0.22, r * 0.09).fill({ color: 0xffffff, alpha: 0.6 });
      break;
    case 'button':
      g.circle(0, 0, r * 0.85).fill(swatch.purple.light).stroke({ width: 3, color: swatch.purple.line })
        .circle(0, 0, r * 0.62).stroke({ width: 2, color: swatch.purple.line });
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.circle(dx * r * 0.2, dy * r * 0.2, Math.max(3, r * 0.09)).fill(swatch.purple.line);
      break;
  }
  return g;
}
