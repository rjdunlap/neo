import type { Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { JAR, tenLineAt, type Pebble } from './logic';

/** The pebbles' three colours: lake greys and browns from the palette. */
export const PEBBLE_TONES = [
  { fill: swatch.white.line, line: 0x6b6b78 },
  { fill: swatch.brown.fill, line: swatch.brown.line },
  { fill: swatch.teal.line, line: 0x2d7778 },
] as const;

/** The whole jar's size in its own units: the inside plus the glass, the neck and the lid. */
export const JAR_OUTER = { w: JAR.w + 24, h: JAR.h + 56 };

/**
 * The jar, its pile and (levels 1–2) the ten line, fitted in a box centred at (cx, cy) with scale `k`. The inside's
 * floor is at the bottom; the brim line (sixty) at the top of the inside, under the neck.
 */
export function drawJar(
  g: Graphics,
  cx: number,
  cy: number,
  k: number,
  pebbles: readonly Pebble[],
  tenLine: boolean,
  poured = false,
) {
  const w = JAR.w * k,
    h = JAR.h * k;
  const left = cx - w / 2;
  const floor = cy + (JAR_OUTER.h * k) / 2 - 12 * k;
  const brim = floor - h;
  // The back of the glass.
  g.roundRect(left - 10 * k, brim - 8 * k, w + 20 * k, h + 18 * k, 26 * k).fill({
    color: 0xe8f6fb,
    alpha: 0.85,
  });
  if (!poured)
    for (const p of pebbles) {
      const t = PEBBLE_TONES[p.tone];
      g.ellipse(left + p.x * k, floor - p.y * k, p.r * k * 1.12, p.r * k * 0.9)
        .fill(t.fill)
        .stroke({ width: Math.max(1, 1.4 * k), color: t.line });
    }
  // The glass: its outline, a shine and the neck with a wooden lid.
  g.roundRect(left - 10 * k, brim - 8 * k, w + 20 * k, h + 18 * k, 26 * k).stroke({
    width: Math.max(2, 5 * k),
    color: 0x7aa6b8,
  });
  g.roundRect(left - 2 * k, brim + 10 * k, 8 * k, h * 0.6, 4 * k).fill({ color: 0xffffff, alpha: 0.55 });
  g.roundRect(cx - w * 0.36, brim - 30 * k, w * 0.72, 22 * k, 8 * k)
    .fill(wood.light)
    .stroke({ width: Math.max(2, 4 * k), color: wood.line });
  if (tenLine) {
    // The ten line, etched on the glass where ten pebbles reach, with a small 10 beside it.
    const y = floor - tenLineAt() * k;
    g.moveTo(left - 10 * k, y)
      .lineTo(left + w + 10 * k, y)
      .stroke({ width: Math.max(2, 3.5 * k), color: swatch.red.line, cap: 'round', alpha: 0.8 });
    const l = tenLabelAt(cx, cy, k);
    g.roundRect(l.x - 18 * k, l.y - 14 * k, 36 * k, 28 * k, 10 * k)
      .fill(cream)
      .stroke({ width: Math.max(1.5, 2.5 * k), color: swatch.red.line });
  }
}

/** Where the ten line's label goes: on a small card at the line's right end, inside the glass. */
export function tenLabelAt(cx: number, cy: number, k: number) {
  const floor = cy + (JAR_OUTER.h * k) / 2 - 12 * k;
  return { x: cx + (JAR.w * k) / 2 - 20 * k, y: floor - tenLineAt() * k };
}

/** The player's first-guess flag on a cell: a pole and a pennant in the cell's top-right corner. */
export function drawFlag(g: Graphics, x: number, y: number, cell: number) {
  const s = cell / 64;
  const px = x + cell * 0.32,
    top = y - cell * 0.44,
    foot = y - cell * 0.02;
  g.moveTo(px, foot)
    .lineTo(px, top)
    .stroke({ width: 3 * s, color: ink, cap: 'round' });
  g.poly([px, top, px - 20 * s, top + 7 * s, px, top + 14 * s])
    .fill(swatch.orange.fill)
    .stroke({ width: 2 * s, color: swatch.orange.line, join: 'round' });
}

/** A drawn cross over a crossed-off number, so its state never leans on colour. */
export function drawCross(g: Graphics, x: number, y: number, cell: number) {
  const r = cell * 0.3;
  g.moveTo(x - r, y - r)
    .lineTo(x + r, y + r)
    .moveTo(x + r, y - r)
    .lineTo(x - r, y + r)
    .stroke({ width: Math.max(3, cell * 0.07), color: swatch.red.line, cap: 'round', alpha: 0.85 });
}

/** A number card: the last look's choice. */
export function drawCard(g: Graphics, x: number, y: number, w: number, h: number, chosen: boolean) {
  g.roundRect(x - w / 2, y - h / 2, w, h, 22)
    .fill(chosen ? swatch.yellow.light : cream)
    .stroke({ width: chosen ? 7 : 4, color: chosen ? swatch.yellow.line : wood.line });
}
