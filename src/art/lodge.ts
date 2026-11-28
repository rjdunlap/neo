import { Graphics } from 'pixi.js';
import { swatch } from './palette';
import type { LodgePiece } from '../content/lodge';

/**
 * Lantern Lodge drawn in code (the progression loop, slice 7), on a 1200 × 800 picture: sky, hills, a meadow and the lake
 * always; each piece in its own place once built, or faint as a ghost while it is still to build. Plain fills and strokes,
 * which the paper pass (src/art/paperize.ts) turns into paper cut-outs with crayon outlines.
 */
export const LODGE_W = 1200;
export const LODGE_H = 800;

const LOG = { fill: 0xb07a4f, line: 0x7d5230 };
const STONE = { fill: 0xb9b2a6, line: 0x857d70 };
const ROOF = { fill: 0x9c4a3c, line: 0x6b2e24 };
const WOOD = { fill: 0xc8956a, line: 0x8f6142 };
const GLOW = 0xffe9a3;

/** Sky, far hills, the meadow and the lake: always there. */
export function lodgeBackdrop(g: Graphics) {
  g.rect(0, 0, LODGE_W, LODGE_H).fill(0xcfe8f2);
  g.poly([0, 420, 180, 300, 360, 400, 560, 280, 760, 390, 960, 300, 1200, 380, 1200, 560, 0, 560]).fill(
    0xa9c7d6,
  );
  g.poly([0, 520, 300, 470, 640, 500, 900, 470, 1200, 500, 1200, 800, 0, 800]).fill(0x9fd07e);
  g.ellipse(975, 700, 222, 96).fill(swatch.blue.light).stroke({ color: swatch.blue.line, width: 4 });
}

/** Where a piece sits, for its ghost's price tag and the tap that offers it. */
export const PIECE_AT: Record<LodgePiece, { x: number; y: number; w: number; h: number }> = {
  foundation: { x: 460, y: 560, w: 340, h: 50 },
  walls: { x: 460, y: 460, w: 290, h: 160 },
  door: { x: 460, y: 495, w: 70, h: 100 },
  windows: { x: 460, y: 445, w: 240, h: 60 },
  roof: { x: 460, y: 320, w: 360, h: 130 },
  chimney: { x: 560, y: 270, w: 50, h: 90 },
  'porch-lanterns': { x: 460, y: 405, w: 330, h: 60 },
  path: { x: 470, y: 680, w: 120, h: 190 },
  flowers: { x: 170, y: 690, w: 200, h: 80 },
  bench: { x: 220, y: 560, w: 150, h: 80 },
  fence: { x: 140, y: 610, w: 260, h: 60 },
  'lantern-tree': { x: 100, y: 400, w: 190, h: 330 },
  dock: { x: 830, y: 630, w: 280, h: 60 },
  'dock-lantern': { x: 955, y: 540, w: 50, h: 140 },
  boat: { x: 1060, y: 720, w: 190, h: 70 },
};

/** One hanging paper lantern, its centre on (x, y). */
function lantern(g: Graphics, x: number, y: number, s = 1) {
  g.circle(x, y, 20 * s).fill({ color: GLOW, alpha: 0.5 });
  g.ellipse(x, y, 12 * s, 15 * s)
    .fill(swatch.yellow.fill)
    .stroke({ color: swatch.yellow.line, width: 3 });
  g.rect(x - 5 * s, y - 19 * s, 10 * s, 5 * s).fill(0x3b3440);
}

/** Draws one piece into `g`. */
export function drawPiece(g: Graphics, id: LodgePiece) {
  switch (id) {
    case 'foundation':
      g.roundRect(290, 538, 340, 46, 10).fill(STONE.fill).stroke({ color: STONE.line, width: 4 });
      break;
    case 'walls':
      g.rect(315, 380, 290, 162).fill(LOG.fill).stroke({ color: LOG.line, width: 4 });
      for (let y = 410; y < 540; y += 30)
        g.moveTo(320, y).lineTo(600, y).stroke({ color: LOG.line, width: 2.5 });
      break;
    case 'door':
      g.roundRect(425, 445, 70, 97, 14).fill(0x7d5230).stroke({ color: 0x55351c, width: 4 });
      g.circle(482, 497, 5).fill(swatch.yellow.fill);
      break;
    case 'windows':
      for (const x of [340, 520]) {
        g.rect(x, 420, 60, 52).fill(GLOW).stroke({ color: LOG.line, width: 5 });
        g.moveTo(x + 30, 420)
          .lineTo(x + 30, 472)
          .moveTo(x, 446)
          .lineTo(x + 60, 446)
          .stroke({ color: LOG.line, width: 3 });
      }
      break;
    case 'roof':
      g.poly([280, 392, 460, 255, 640, 392]).fill(ROOF.fill).stroke({ color: ROOF.line, width: 5 });
      break;
    case 'chimney':
      g.rect(540, 228, 44, 90).fill(STONE.fill).stroke({ color: STONE.line, width: 4 });
      g.circle(572, 205, 14).fill({ color: 0xffffff, alpha: 0.6 });
      g.circle(588, 180, 18).fill({ color: 0xffffff, alpha: 0.5 });
      break;
    case 'porch-lanterns':
      for (const x of [305, 615]) {
        g.moveTo(x, 386).lineTo(x, 400).stroke({ color: 0x3b3440, width: 3 });
        lantern(g, x, 420);
      }
      break;
    case 'path':
      for (const [x, y, r] of [
        [462, 600, 26],
        [482, 645, 24],
        [458, 692, 27],
        [486, 740, 25],
        [462, 785, 28],
      ])
        g.ellipse(x, y, r * 1.4, r * 0.7)
          .fill(STONE.fill)
          .stroke({ color: STONE.line, width: 3 });
      break;
    case 'flowers':
      g.ellipse(170, 700, 100, 34).fill(0x8a5a3c).stroke({ color: 0x5e3b25, width: 4 });
      for (const [x, c] of [
        [100, swatch.pink],
        [140, swatch.yellow],
        [180, swatch.purple],
        [220, swatch.red],
        [250, swatch.orange],
      ] as const) {
        g.moveTo(x, 698).lineTo(x, 672).stroke({ color: swatch.green.line, width: 3 });
        g.circle(x, 666, 13).fill(c.fill).stroke({ color: c.line, width: 3 });
      }
      break;
    case 'bench':
      g.roundRect(150, 540, 140, 18, 6).fill(WOOD.fill).stroke({ color: WOOD.line, width: 4 });
      g.roundRect(150, 512, 140, 16, 6).fill(WOOD.fill).stroke({ color: WOOD.line, width: 4 });
      g.rect(160, 558, 12, 40).fill(WOOD.line);
      g.rect(268, 558, 12, 40).fill(WOOD.line);
      break;
    case 'fence':
      for (let x = 20; x <= 260; x += 40)
        g.roundRect(x, 584, 18, 64, 6).fill(0xf3ead8).stroke({ color: 0xb3a68c, width: 3 });
      g.rect(14, 600, 268, 12).fill(0xf3ead8).stroke({ color: 0xb3a68c, width: 3 });
      break;
    case 'lantern-tree':
      g.poly([86, 560, 96, 380, 114, 380, 124, 560]).fill(LOG.fill).stroke({ color: LOG.line, width: 4 });
      g.circle(105, 320, 95).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 5 });
      for (const [x, y] of [
        [60, 340],
        [140, 300],
        [100, 390],
        [160, 370],
        [70, 270],
      ])
        lantern(g, x, y, 0.8);
      break;
    case 'dock':
      for (const x of [710, 800, 890, 950]) g.rect(x, 620, 14, 60).fill(LOG.line);
      g.roundRect(690, 606, 280, 26, 6).fill(WOOD.fill).stroke({ color: WOOD.line, width: 4 });
      break;
    case 'dock-lantern':
      g.rect(948, 470, 12, 140).fill(LOG.line);
      g.moveTo(954, 476).lineTo(980, 476).stroke({ color: LOG.line, width: 6 });
      lantern(g, 980, 510);
      break;
    case 'boat':
      g.poly([970, 700, 1150, 700, 1120, 745, 1000, 745])
        .fill(swatch.red.fill)
        .stroke({ color: swatch.red.line, width: 4 });
      g.moveTo(1010, 712).lineTo(1110, 712).stroke({ color: 0xffffff, width: 4 });
      break;
  }
}
