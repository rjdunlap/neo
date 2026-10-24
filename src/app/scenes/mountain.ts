import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut, scanPlace } from './meadow';

/**
 * RW13 slice 6 (docs/rework/ISLAND-REVAMP.md): Music Mountain as a tropical cloud forest, drawn in code over the land's
 * backdrop. Green, rounded mountains stand on the horizon with bands of mist along their flanks (a cloud forest is a
 * rainforest on a mountain, in the cloud); on the slope she plays on, mossy trunks carry bromeliads and orchids, tree
 * ferns spread their crowns, orchids bloom low, tree frogs sit on leaves and hummingbirds hover. Like the meadow,
 * everything placed is seeded and kept off every touch area, the pet's corner, the corner buttons and the heading, and it
 * takes no touches itself.
 */
export type ForestThing = 'trunk' | 'fern' | 'orchid' | 'frog' | 'hummingbird';
/** One thing in the forest: where its feet are (a hummingbird's, where it hovers) and the box it is drawn in. */
export interface ForestItem {
  kind: ForestThing;
  x: number;
  y: number;
  rect: Rect;
  /** Drawn at this size (a thing shrinks where a full land leaves only small gaps for it). */
  k?: number;
}

/** The far mountains along the horizon: each a top and a half-width. Visual only, behind the field. */
export function cloudRidge(view: View, ground: number): { x: number; top: number; half: number }[] {
  const rng = new Rng(109);
  // Tops stay below the corner buttons and the heading.
  const highest = Math.max(140, ground - 150);
  const out: { x: number; top: number; half: number }[] = [];
  for (let x = -60; x < view.w + 100; x += rng.range(170, 250)) out.push({ x, top: Math.min(ground - 50, rng.range(highest, highest + 60)), half: rng.range(140, 200) });
  return out;
}

/** The bands of mist drifting along the mountains' flanks, each a centre line and a length. Visual only. */
export function mistBands(view: View, ground: number): { x: number; y: number; w: number }[] {
  const rng = new Rng(113);
  const out: { x: number; y: number; w: number }[] = [];
  for (const y of [ground - 70, ground - 30]) {
    for (let x = rng.range(-80, 40); x < view.w; x += rng.range(260, 380)) out.push({ x, y: y + rng.range(-8, 8), w: rng.range(180, 280) });
  }
  return out;
}

/** Where each forest thing goes for this layout: seeded, so the same view always draws the same forest. */
export function mountainPlan(layout: LandLayout, view: View, ground: number): ForestItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(157);
  const items: ForestItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`. */
  const place = (kind: ForestThing, n: number, size: number, tall: number, top: number, bottom: number) => {
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
  /** Makes sure of `need` more of a thing, scanning for room (smaller where it must) when random tries found none. */
  const ensure = (kind: ForestThing, need: number, size: number, tall: number, top: number, bottom: number) => {
    for (let i = 0; i < need; i++) {
      const spot = scanPlace(clear, rng, w, size, tall, top, bottom);
      if (!spot) return;
      items.push({ kind, x: spot.x, y: spot.y, rect: spot.rect, ...(spot.k < 1 ? { k: spot.k } : {}) });
      keepOut.push(spot.rect);
    }
  };
  const count = (...kinds: ForestThing[]) => items.filter((p) => kinds.includes(p.kind)).length;
  // The big trees first, then tree ferns round them, then what grows and sits low between them.
  place('trunk', 3, 96, 166, ground + 60, h - 8);
  place('fern', 4, 90, 110, ground + 40, h - 8);
  place('orchid', 4, 40, 40, ground + 30, h - 8);
  place('frog', 2, 46, 34, ground + 40, h - 8);
  // Hummingbirds hover in the air over the field.
  place('hummingbird', 3, 50, 36, ground + 10, h - 60);
  // Smaller tree ferns in the gaps (a fern is drawn to fill the box it was planned in, 90 across at full size).
  place('fern', 3, 62, 76, ground + 30, h - 8);
  // A full land screen leaves only gaps at the row ends: there the forest still keeps two tree ferns, an orchid and a hummingbird.
  ensure('fern', 2 - count('trunk', 'fern'), 62, 76, ground + 30, h - 8);
  ensure('orchid', 1 - count('orchid'), 40, 40, ground + 30, h - 8);
  ensure('hummingbird', 1 - count('hummingbird'), 50, 36, ground + 10, h - 60);
  return items;
}

export function drawMountain(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  // The far mountains, green with forest to their tops, and the mist that gives the forest its name.
  const far = 0x8fc79a;
  const farLine = 0x6aa77a;
  for (const p of cloudRidge(view, ground)) {
    g.moveTo(p.x - p.half, ground).quadraticCurveTo(p.x - p.half * 0.45, p.top - 6, p.x, p.top).quadraticCurveTo(p.x + p.half * 0.45, p.top - 6, p.x + p.half, ground).closePath().fill(far).stroke({ color: farLine, width: 2.5 });
    // Treetops along the crest, so the mountain reads as forest.
    for (let k = -2; k <= 2; k++) g.circle(p.x + k * p.half * 0.18, p.top + Math.abs(k) * 7 + 4, 9).fill(farLine);
  }
  for (const m of mistBands(view, ground)) mist(g, m.x, m.y, m.w);
  for (const { kind, x, y, rect, k } of mountainPlan(layout, view, ground)) {
    // A fern fills the box it was planned in; anything else planned smaller (a full land's gap) is drawn at that size round its feet.
    if (kind === 'fern') {
      fern(g, x, y, rect.w / 90);
      continue;
    }
    const s = k ?? 1;
    g.save().translateTransform(x, y).scaleTransform(s, s);
    if (kind === 'trunk') trunk(g, 0, 0);
    else if (kind === 'orchid') orchid(g, 0, 0);
    else if (kind === 'frog') frog(g, 0, 0, x > view.w / 2 ? -1 : 1);
    else hummingbird(g, 0, -14, x > view.w / 2 ? -1 : 1);
    g.restore();
  }
}

function mist(g: Graphics, x: number, y: number, w: number) {
  g.roundRect(x, y - 11, w, 22, 11).fill({ color: 0xffffff, alpha: 0.55 });
  g.roundRect(x + w * 0.2, y - 18, w * 0.45, 16, 8).fill({ color: 0xffffff, alpha: 0.45 });
}

const BARK = 0x8a6a4e;
const BARK_LINE = 0x5f4634;
const MOSS = 0x7cbf5a;
const MOSS_LINE = 0x4f8a3a;

/** A mossy trunk under a leafy crown, with a bromeliad perched on a branch and an orchid on the bark. */
function trunk(g: Graphics, x: number, y: number) {
  const top = y - 128;
  g.moveTo(x - 20, y).lineTo(x - 15, top).lineTo(x + 15, top).lineTo(x + 20, y).closePath().fill(BARK).stroke({ color: BARK_LINE, width: 2.5 });
  // Moss in cushions up the trunk, and draping from the branch.
  for (const [dx, dy, r] of [[-14, -20, 10], [12, -46, 9], [-10, -78, 9], [13, -108, 8]]) g.circle(x + dx, y + dy, r).fill(MOSS).stroke({ color: MOSS_LINE, width: 1.5 });
  g.moveTo(x + 14, y - 96).lineTo(x + 32, y - 108).stroke({ color: BARK_LINE, width: 6, cap: 'round' });
  // The bromeliad: a rosette of stiff leaves round a red heart, sitting on the branch.
  for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) g.moveTo(x + 28, y - 110).lineTo(x + 28 + Math.sin(a) * 16, y - 110 - Math.cos(a) * 16).stroke({ color: swatch.green.line, width: 4, cap: 'round' });
  g.circle(x + 28, y - 112, 4.5).fill(swatch.red.fill).stroke({ color: swatch.red.line, width: 1.5 });
  orchidBloom(g, x - 16, y - 62, swatch.purple);
  // The crown, in the cloud.
  for (const [dx, dy, r] of [[-22, -132, 20], [20, -134, 20], [0, -144, 22]]) g.circle(x + dx, y + dy, r).fill(0x5fae5a).stroke({ color: MOSS_LINE, width: 2 });
}

/** A tree fern: a thin, shaggy trunk and a crown of arching fronds. */
function fern(g: Graphics, x: number, y: number, s: number) {
  const top = y - 76 * s;
  g.moveTo(x, y).lineTo(x, top).stroke({ color: BARK_LINE, width: 7 * s, cap: 'round' });
  for (const a of [-2.3, -1.6, -0.9, -0.3, 0.3, 0.9, 1.6, 2.3]) {
    const ex = x + Math.sin(a) * 44 * s;
    const ey = top + (1 - Math.cos(a)) * 14 * s - 6 * s;
    g.moveTo(x, top).quadraticCurveTo(x + Math.sin(a) * 26 * s, top - 24 * s, ex, ey).stroke({ color: swatch.green.line, width: 4.5 * s, cap: 'round' });
    g.moveTo(x, top).quadraticCurveTo(x + Math.sin(a) * 26 * s, top - 24 * s, ex, ey).stroke({ color: swatch.green.fill, width: 2.5 * s, cap: 'round' });
  }
}

function orchidBloom(g: Graphics, x: number, y: number, c: { fill: number; line: number }) {
  for (const a of [0, 1.26, 2.51, 3.77, 5.03]) g.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.5, 4.5).fill(c.fill).stroke({ color: c.line, width: 1.2 });
  g.circle(x, y, 2.6).fill(swatch.yellow.fill);
}

/** A low orchid: an arching stem with three blooms over a pair of broad leaves. */
function orchid(g: Graphics, x: number, y: number) {
  g.ellipse(x - 8, y - 4, 10, 4).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 1.5 });
  g.ellipse(x + 8, y - 4, 10, 4).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 1.5 });
  g.moveTo(x, y - 4).quadraticCurveTo(x - 2, y - 32, x + 14, y - 34).stroke({ color: swatch.green.line, width: 2, cap: 'round' });
  const c = Math.round(x) % 2 ? swatch.pink : swatch.purple;
  orchidBloom(g, x - 2, y - 22, c);
  orchidBloom(g, x + 6, y - 32, c);
  orchidBloom(g, x + 15, y - 30, c);
}

/** A tree frog on a broad leaf: green with big red eyes and round toe pads. */
function frog(g: Graphics, x: number, y: number, face: 1 | -1) {
  g.moveTo(x - 22, y).quadraticCurveTo(x, y - 14, x + 22, y).quadraticCurveTo(x, y + 6, x - 22, y).closePath().fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 2 });
  const body = 0x6fd16a;
  g.ellipse(x, y - 12, 12, 9).fill(body).stroke({ color: swatch.green.line, width: 2 });
  for (const d of [-6, 6]) {
    g.circle(x + face * 4 + d, y - 22, 4.5).fill(swatch.red.fill).stroke({ color: swatch.green.line, width: 1.5 });
    g.circle(x + face * 4 + d, y - 22, 1.6).fill(ink);
  }
  for (const d of [-12, 12]) g.circle(x + d, y - 4, 2.6).fill(swatch.orange.fill);
}

/** A hummingbird hovering: a long bill, a green back and a blur of wings. */
function hummingbird(g: Graphics, x: number, y: number, face: 1 | -1) {
  g.ellipse(x - face * 4, y - 9, 6, 12).fill({ color: 0xffffff, alpha: 0.6 });
  g.ellipse(x, y, 10, 6).fill(0x3fae7a).stroke({ color: 0x2a7a55, width: 1.5 });
  g.moveTo(x - face * 9, y + 1).lineTo(x - face * 16, y + 6).stroke({ color: 0x2a7a55, width: 3, cap: 'round' });
  g.circle(x + face * 8, y - 3, 5).fill(0x3fae7a).stroke({ color: 0x2a7a55, width: 1.5 });
  g.circle(x + face * 7, y - 6 + 1, 2).fill(swatch.red.fill);
  g.circle(x + face * 9.5, y - 4, 1.2).fill(ink);
  g.moveTo(x + face * 12, y - 3).lineTo(x + face * 24, y - 1).stroke({ color: ink, width: 1.5, cap: 'round' });
}
