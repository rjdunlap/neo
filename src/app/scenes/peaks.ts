import { Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 4 (docs/rework/ISLAND-REVAMP.md): Puzzle Peaks as a mountain, from bamboo forest to snow, drawn in code
 * over the land's backdrop. A ridge of rocky peaks stands on the horizon with snow above its snowline and high cloud
 * round its tops; on the slopes she plays on, bamboo grows on the lower slope (the front, where pandas would live)
 * and conifers higher up (the back, toward the peaks), with boulders between. No penguin: they do not live on
 * mountains, and Penguin Slide keeps its own sea ice. Like the meadow, everything placed is seeded and kept off every
 * touch area, the pet's corner, the corner buttons and the heading, and it takes no touches itself.
 */
export type PeakThing = 'bamboo' | 'conifer' | 'boulder' | 'cloud';
/** One thing on the mountain: where its feet are and the box it is drawn in. */
export interface PeakItem {
  kind: PeakThing;
  x: number;
  y: number;
  rect: Rect;
}

/** Where the lower slope begins: bamboo stands in front of this line, conifers behind it, up toward the peaks. */
export const bambooLine = (view: View, ground: number) => ground + (view.h - ground) * 0.45;

/** The far peaks along the horizon: each a top point and a half-width. Visual only, behind the field. */
export function ridge(view: View, ground: number): { x: number; top: number; half: number; snow: boolean }[] {
  const rng = new Rng(97);
  // Tops stay below the corner buttons and the heading, and below the sun's middle.
  const highest = Math.max(140, ground - 170);
  const peaks: { x: number; top: number; half: number; snow: boolean }[] = [];
  for (let x = -40; x < view.w + 80; x += rng.range(150, 230)) {
    const top = Math.min(ground - 50, rng.range(highest, highest + 70));
    peaks.push({ x, top, half: rng.range(110, 170), snow: ground - top > 85 });
  }
  return peaks;
}

/** How high the ridge stands above the ground at `x`: 0 where no peak reaches. */
export function ridgeHeight(peaks: ReturnType<typeof ridge>, ground: number, x: number): number {
  return Math.max(0, ...peaks.map((p) => (ground - p.top) * (1 - Math.abs(x - p.x) / p.half)));
}

/**
 * The far forest at the mountain's foot, small and visual only like the ridge, so the slopes read as bamboo below
 * and conifers above even when a crowded land leaves the field no room: bamboo along the foot, conifers partway up.
 */
export function foothills(view: View, ground: number): { kind: 'bamboo' | 'conifer'; x: number; y: number }[] {
  const peaks = ridge(view, ground);
  const out: { kind: 'bamboo' | 'conifer'; x: number; y: number }[] = [];
  for (let x = 20; x < view.w; x += 34) {
    const high = ridgeHeight(peaks, ground, x);
    if (Math.floor(x / 34) % 3 === 0) out.push({ kind: 'bamboo', x, y: ground + 2 });
    else if (high >= 24) out.push({ kind: 'conifer', x, y: ground - Math.min(34, high * 0.4) });
  }
  return out;
}

/** Where each mountain thing goes for this layout: seeded, so the same view always draws the same mountain. */
export function peaksPlan(layout: LandLayout, view: View, ground: number): PeakItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(149);
  const items: PeakItem[] = [];
  const split = bambooLine(view, ground);
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `left`–`right` and `top`–`bottom`. */
  const place = (kind: PeakThing, n: number, size: number, tall: number, top: number, bottom: number) => {
    for (let i = 0, placed = 0; i < n * 14 && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      if (!clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else.
      keepOut.push(rect);
      placed++;
    }
  };
  // Boulders first, then the trees grow round them: conifers up the back slope, bamboo on the lower slope.
  place('boulder', 3, 64, 40, ground + 30, h - 10);
  place('conifer', 7, 44, 84, ground + 14, split);
  place('bamboo', 7, 40, 90, split, h - 6);
  // Small conifers and bamboo in the gaps, each on its own slope.
  place('conifer', 6, 30, 56, ground + 10, split);
  place('bamboo', 6, 30, 64, split, h - 6);
  // High cloud drifting low over the field's back edge.
  place('cloud', 2, 120, 40, ground - 40, ground + 30);
  return items;
}

export function drawPeaks(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  const rock = 0x9a93b0;
  const shade = 0x7d7696;
  const snow = 0xf8fbff;
  for (const p of ridge(view, ground)) {
    const l = p.x - p.half;
    const r = p.x + p.half;
    g.moveTo(l, ground).lineTo(p.x, p.top).lineTo(r, ground).closePath().fill(rock).stroke({ color: shade, width: 2.5 });
    // The shaded face, so each peak reads as rock with a ridge line.
    g.moveTo(p.x, p.top).lineTo(r, ground).lineTo(p.x + p.half * 0.15, ground).closePath().fill(shade);
    if (!p.snow) continue;
    // Snow above the snowline: everything higher than a fixed height on the mountain, with a ragged lower edge.
    const line = Math.min(ground - 60, p.top + (ground - p.top) * 0.4);
    const k = (line - p.top) / (ground - p.top);
    const sl = p.x - p.half * k;
    const sr = p.x + p.half * k;
    g.moveTo(p.x, p.top).lineTo(sr, line).lineTo(sr - (sr - sl) * 0.25, line - 10).lineTo(p.x, line + 4).lineTo(sl + (sr - sl) * 0.25, line - 10).lineTo(sl, line).closePath().fill(snow).stroke({ color: swatch.white.line, width: 1.5, alpha: 0.6 });
  }
  // The far forest: conifers up the flanks, then bamboo along the foot in front of them.
  const far = foothills(view, ground);
  const small = new Rng(31);
  for (const t of far) if (t.kind === 'conifer') conifer(g, t.x, t.y, small, 0.4);
  for (const t of far) if (t.kind === 'bamboo') bamboo(g, t.x, t.y, small, 0.4);
  // High cloud catching on a few tops.
  const tops = ridge(view, ground).filter((p) => p.snow);
  for (const p of tops.filter((_, i) => i % 2 === 0)) cloud(g, p.x + 30, p.top + 18, 0.7);
  const rng = new Rng(29);
  for (const { kind, x, y } of peaksPlan(layout, view, ground)) {
    if (kind === 'bamboo') bamboo(g, x, y, rng);
    else if (kind === 'conifer') conifer(g, x, y, rng);
    else if (kind === 'boulder') boulder(g, x, y);
    else cloud(g, x, y - 20, 1);
  }
}

function bamboo(g: Graphics, x: number, y: number, rng: Rng, s = 1) {
  const stem = swatch.green;
  for (const d of [-10, 0, 9]) {
    const dx = d * s;
    const tall = rng.range(52, 88) * s;
    g.moveTo(x + dx, y).lineTo(x + dx * 1.2, y - tall).stroke({ color: stem.line, width: 6 * s, cap: 'round' });
    g.moveTo(x + dx, y).lineTo(x + dx * 1.2, y - tall).stroke({ color: 0x9ed67a, width: 3.5 * s, cap: 'round' });
    // Nodes up the cane, and a few narrow leaves.
    if (s === 1) {
      for (let n = 14; n < tall - 6; n += 18) g.moveTo(x + dx - 3.5, y - n).lineTo(x + dx + 3.5, y - n);
      g.stroke({ color: stem.line, width: 2 });
    }
    const side = d >= 0 ? 1 : -1;
    const top = y - tall;
    g.moveTo(x + dx * 1.2, top + 8 * s).quadraticCurveTo(x + dx + side * 12 * s, top - 2 * s, x + dx + side * 20 * s, top + 6 * s).quadraticCurveTo(x + dx + side * 10 * s, top + 10 * s, x + dx * 1.2, top + 8 * s).fill(stem.fill).stroke({ color: stem.line, width: 1.5 });
  }
}

function conifer(g: Graphics, x: number, y: number, rng: Rng, s = 1) {
  const tall = rng.range(0.8, 1) * 84 * s;
  g.rect(x - 4 * s, y - 12 * s, 8 * s, 12 * s).fill(swatch.brown.line);
  const dark = 0x3f8a5a;
  const line = 0x2e6644;
  for (let i = 0; i < 3; i++) {
    const base = y - 10 * s - i * tall * 0.26;
    const half = (22 - i * 5) * s;
    g.moveTo(x - half, base).lineTo(x, base - tall * 0.42).lineTo(x + half, base).closePath().fill(dark).stroke({ color: line, width: 2 * Math.max(s, 0.6) });
  }
}

function boulder(g: Graphics, x: number, y: number) {
  g.moveTo(x - 30, y).lineTo(x - 26, y - 24).lineTo(x - 8, y - 38).lineTo(x + 16, y - 34).lineTo(x + 30, y - 14).lineTo(x + 28, y).closePath().fill(0xb7b1c9).stroke({ color: 0x7d7696, width: 2.5 });
  g.moveTo(x - 8, y - 38).lineTo(x - 2, y - 16).lineTo(x + 28, y - 4).stroke({ color: 0x7d7696, width: 1.5, alpha: 0.7 });
}

function cloud(g: Graphics, x: number, y: number, s: number) {
  g.ellipse(x, y, 50 * s, 13 * s).ellipse(x - 26 * s, y - 6 * s, 24 * s, 12 * s).ellipse(x + 18 * s, y - 9 * s, 28 * s, 14 * s).fill({ color: 0xffffff, alpha: 0.85 });
}
