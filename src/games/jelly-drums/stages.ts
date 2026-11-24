import type { Graphics } from 'pixi.js';
import { Rng } from '../../engine/random';
import type { Layout } from './layout';
import type { StageName } from './logic';

/** How one stage looks: its sky, what stands behind the plank, and the garland's colours against that sky. */
export interface StageLook {
  /** Sky gradient, top to bottom. */
  sky: [number, number];
  /** The two side peaks, then the middle one. */
  peaks: [number, number];
  /** Snow on the peaks (Music Mountain, the moon stage); the beach's dunes have none. */
  caps: number | null;
  /** Peaks or low dunes. */
  shape: 'peaks' | 'dunes';
  /** The garland's string and its unlit bulbs (fill, rim). */
  string: number;
  bulbOff: [number, number];
  /** What hangs in the sky. */
  extra: 'none' | 'moon' | 'sun';
}

export const STAGES: Record<StageName, StageLook> = {
  // Music Mountain by day, as it has always looked.
  mountain: {
    sky: [0xa9c1ff, 0xffe3f1],
    peaks: [0xb7a6f0, 0x9f8be6],
    caps: 0xffffff,
    shape: 'peaks',
    string: 0x6b5aa8,
    bulbOff: [0xf4f0ff, 0xcfc6ee],
    extra: 'none',
  },
  // The bells' night stage: dark peaks, a moon and stars; the garland's string goes pale so it still shows.
  moon: {
    sky: [0x141a4a, 0x4a4f9a],
    peaks: [0x343a80, 0x262c66],
    caps: 0xcfd8ff,
    shape: 'peaks',
    string: 0xcfc6ee,
    bulbOff: [0x5a5fa8, 0x9da2e0],
    extra: 'moon',
  },
  // The hum's beach bandstand: a sea behind low dunes, and the sun.
  beach: {
    sky: [0x8fd3f7, 0xfff1c9],
    peaks: [0xf6dfb0, 0xeccb8a],
    caps: null,
    shape: 'dunes',
    string: 0x6b5aa8,
    bulbOff: [0xfffaf0, 0xe2cfa6],
    extra: 'sun',
  },
};

/** The sea's colour on the beach stage, and its foam. */
const SEA = 0x6cc3ea;
const FOAM = 0xeafaff;

/** Draws a stage's sky things (`sky`) and what stands behind the plank (`back`) for a layout. Neither takes touches. */
export function drawBackdrop(
  sky: Graphics,
  back: Graphics,
  look: StageLook,
  l: Layout,
  v: { w: number; h: number },
) {
  const top = l.mountainBase;
  sky.clear();
  // The moon or sun hangs in open sky clear of the garland: between the middle and right peaks sideways, lower on an
  // upright phone, whose sky is tall.
  const cx = v.w / 2;
  const below = l.garland.y + l.garland.sag * 2;
  const [hx, hy] = l.upright ? [cx + 170, below + (l.mountainBase - 330 - below) * 0.3] : [cx + 190, 255];
  if (look.extra === 'moon') {
    // A few fixed stars (the same every round), then a crescent: a pale disc with a bite cut out of it.
    const rng = new Rng(7);
    for (let k = 0; k < 26; k++) {
      sky.circle(rng.range(20, v.w - 20), rng.range(20, top - 160), rng.range(2, 4.5)).fill({
        color: 0xffffff,
        alpha: rng.range(0.5, 0.95),
      });
    }
    crescent(sky, hx, hy, 54, 26, -14, 48, 0xfff3c4);
  } else if (look.extra === 'sun') {
    sky.circle(hx, hy, 78).fill({ color: 0xfff6b0, alpha: 0.45 });
    sky.circle(hx, hy, 56).fill(0xffe066);
  }

  back.clear();
  if (look.shape === 'dunes') {
    // The sea runs behind the dunes from edge to edge, with a line of foam where it meets them.
    const seaTop = top - 190;
    back.rect(0, seaTop, v.w, top - seaTop).fill(SEA);
    for (let x = 0; x < v.w; x += 90)
      back.ellipse(x + 45, seaTop + 8, 34, 5).fill({ color: FOAM, alpha: 0.8 });
  }
  for (const [k, [x, y, half]] of l.peaks.entries()) {
    const color = k === 2 ? look.peaks[1] : look.peaks[0];
    if (look.shape === 'dunes') {
      // A low, round dune about a third of the peak's height.
      const dy = top - (top - y) * 0.32;
      back
        .moveTo(x - half, top)
        .bezierCurveTo(x - half * 0.5, dy, x + half * 0.5, dy, x + half, top)
        .closePath()
        .fill(color);
      continue;
    }
    back
      .moveTo(x - half, top)
      .quadraticCurveTo(x - 30, y - 30, x, y)
      .quadraticCurveTo(x + 30, y - 30, x + half, top)
      .closePath()
      .fill(color);
    if (look.caps === null) continue;
    back
      .moveTo(x - 58, y + 52)
      .quadraticCurveTo(x - 20, y - 22, x, y - 4)
      .quadraticCurveTo(x + 20, y - 22, x + 58, y + 52)
      .quadraticCurveTo(x + 30, y + 36, x + 12, y + 50)
      .quadraticCurveTo(x - 10, y + 34, x - 30, y + 50)
      .closePath()
      .fill(look.caps);
  }
}

/**
 * A crescent: the part of a disc (centre `x, y`, radius `r`) outside a second disc offset by `dx, dy` with radius `r2`,
 * drawn as one path from the two arcs between the circles' crossing points.
 */
export function crescent(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  dx: number,
  dy: number,
  r2: number,
  color: number,
) {
  const d = Math.hypot(dx, dy);
  const a = (r * r - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r * r - a * a);
  const [ux, uy] = [dx / d, dy / d];
  // The two crossing points, relative to the first centre.
  const p = [
    [a * ux - h * uy, a * uy + h * ux],
    [a * ux + h * uy, a * uy - h * ux],
  ];
  const on1 = p.map(([px, py]) => Math.atan2(py, px));
  const on2 = p.map(([px, py]) => Math.atan2(py - dy, px - dx));
  // Round the far side of the first disc from one crossing to the other, then back along the second disc's near side.
  g.moveTo(x + p[0][0], y + p[0][1])
    .arc(x, y, r, on1[0], on1[1], false)
    .arc(x + dx, y + dy, r2, on2[1], on2[0], true)
    .closePath()
    .fill(color);
}
