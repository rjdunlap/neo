import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 5 (docs/rework/ISLAND-REVAMP.md): Bubble Beach as a rocky shore with tide pools, drawn in code over the
 * land's backdrop (whose far hills are already sky, sea and sand). Waves run along the sea and a wet tide line edges the
 * sand; on the shore she plays on, barnacled rocks and rock pools hold sea stars, anemones and kelp, hermit crabs walk
 * the sand and gulls fly over the water. No coral or reef fish: a reef is warm open water, and it stays inside Bubble
 * Pop's own scene. Like the meadow, everything placed is seeded and kept off every touch area, the pet's corner, the
 * corner buttons and the heading, and it takes no touches itself.
 */
export type BeachThing = 'pool' | 'rock' | 'crab' | 'gull';
/** What lives in a rock pool. */
export type PoolLife = 'star' | 'anemone' | 'kelp';
/** One thing on the shore: where its feet are and the box it is drawn in. */
export interface BeachItem {
  kind: BeachThing;
  x: number;
  y: number;
  rect: Rect;
}

/** What the `i`th pool holds: always a sea star or an anemone, and the three kinds take turns across the pools. */
export const poolLife = (i: number): PoolLife[] => [['star', 'kelp'], ['anemone', 'star'], ['kelp', 'anemone']][i % 3] as PoolLife[];

/** The backdrop's sun, which the gulls fly clear of (`Backdrop.resize` puts it here). */
export const sunRect = (view: View): Rect => {
  const x = Math.max(230, view.w * 0.2);
  return { x: x - 80, y: 70, w: 160, h: 160 };
};

/** Where each shore thing goes for this layout: seeded, so the same view always draws the same beach. */
export function beachPlan(layout: LandLayout, view: View, ground: number): BeachItem[] {
  const { w, h } = view;
  const keepOut = [...meadowKeepOut(layout, view), sunRect(view)];
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(151);
  const items: BeachItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`. */
  const place = (kind: BeachThing, n: number, size: number, tall: number, top: number, bottom: number) => {
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
  // The rock pools first, then the rocks, then the crabs walk the sand between them.
  place('pool', 3, 124, 46, ground + 50, h - 8);
  place('rock', 3, 100, 54, ground + 30, h - 8);
  place('crab', 3, 50, 36, ground + 30, h - 8);
  // Smaller pools in the gaps.
  place('pool', 3, 90, 36, ground + 40, h - 8);
  // Gulls over the sea, under the heading and clear of the sun.
  place('gull', 3, 56, 24, ground - 150, ground - 30);
  return items;
}

export function drawBeach(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  // Waves rolling in along the backdrop's sea, then the wet sand of the tide line at its edge.
  const waves = new Rng(41);
  for (let y = ground - 46; y < ground - 6; y += 16) {
    for (let x = waves.range(-20, 60); x < view.w; x += waves.range(110, 170)) {
      g.moveTo(x, y).quadraticCurveTo(x + 14, y - 7, x + 28, y).quadraticCurveTo(x + 42, y - 7, x + 56, y);
    }
  }
  g.stroke({ color: 0xffffff, width: 3, cap: 'round', alpha: 0.8 });
  g.moveTo(-10, ground + 6);
  for (let x = -10; x <= view.w + 20; x += 40) g.quadraticCurveTo(x + 20, ground + 14, x + 40, ground + 6);
  g.stroke({ color: 0xe8c77a, width: 6, cap: 'round' });
  let pools = 0;
  for (const { kind, x, y, rect } of beachPlan(layout, view, ground)) {
    // A pool fills the box it was planned in (the rim is 124 across at full size).
    if (kind === 'pool') pool(g, x, y, poolLife(pools++), (rect.w - 4) / 124);
    else if (kind === 'rock') rock(g, x, y);
    else if (kind === 'crab') crab(g, x, y, x > view.w / 2 ? -1 : 1);
    else gull(g, x, y - 12);
  }
}

const ROCK = 0x9a93b0;
const ROCK_LINE = 0x6f6888;

function rock(g: Graphics, x: number, y: number) {
  g.moveTo(x - 48, y).quadraticCurveTo(x - 50, y - 30, x - 20, y - 46).quadraticCurveTo(x + 10, y - 56, x + 34, y - 38).quadraticCurveTo(x + 50, y - 22, x + 48, y).closePath().fill(ROCK).stroke({ color: ROCK_LINE, width: 2.5 });
  // Weed along the wet foot, and barnacles crowded on the face.
  g.moveTo(x - 46, y - 4).quadraticCurveTo(x, y - 12, x + 46, y - 4).stroke({ color: 0x5c8a4a, width: 5, cap: 'round' });
  for (const [dx, dy] of [[-22, -30], [-12, -36], [-28, -20], [8, -40], [18, -30], [-4, -26]]) barnacle(g, x + dx, y + dy);
}

function barnacle(g: Graphics, x: number, y: number) {
  g.moveTo(x - 4.5, y + 3).lineTo(x - 2, y - 3).lineTo(x + 2, y - 3).lineTo(x + 4.5, y + 3).closePath().fill(0xf4efe4).stroke({ color: ROCK_LINE, width: 1.2 });
  g.moveTo(x - 1.2, y - 2.5).lineTo(x + 1.2, y - 2.5).stroke({ color: ink, width: 1 });
}

/** A rock pool seen from the shore: a rim of rock round still water, with what lives in it. */
function pool(g: Graphics, x: number, y: number, life: PoolLife[], s: number) {
  const cy = y - 22 * s;
  g.ellipse(x, cy, 60 * s, 22 * s).fill(ROCK).stroke({ color: ROCK_LINE, width: 2.5 });
  g.ellipse(x, cy + 2 * s, 48 * s, 15 * s).fill(0x8fd3ec).stroke({ color: swatch.blue.line, width: 1.5, alpha: 0.6 });
  g.moveTo(x - 30 * s, cy - 4 * s).lineTo(x - 14 * s, cy - 4 * s).stroke({ color: 0xffffff, width: 2, cap: 'round', alpha: 0.8 });
  for (const [i, kind] of life.entries()) {
    const px = x + (i === 0 ? -18 : 20) * s;
    const py = cy + 4 * s;
    if (kind === 'star') star(g, px, py, s, i === 0 ? swatch.orange : swatch.purple);
    else if (kind === 'anemone') anemone(g, px, py, s);
    else kelp(g, px, py, s);
  }
  // Barnacles on the rim.
  barnacle(g, x + 46 * s, cy - 8 * s);
  barnacle(g, x - 50 * s, cy + 4 * s);
}

function star(g: Graphics, x: number, y: number, s: number, c: { fill: number; line: number }) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = (i % 2 ? 4.5 : 12) * s;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6);
  }
  g.poly(pts).fill(c.fill).stroke({ color: c.line, width: 1.5 });
  g.circle(x, y, 1.6 * s).fill(c.line);
}

function anemone(g: Graphics, x: number, y: number, s: number) {
  for (let i = -3; i <= 3; i++) {
    g.moveTo(x + i * 2.5 * s, y - 4 * s).quadraticCurveTo(x + i * 4.5 * s, y - 12 * s, x + i * 5 * s + (i % 2) * 2 * s, y - 16 * s);
  }
  g.stroke({ color: swatch.pink.fill, width: 3 * s, cap: 'round' });
  g.ellipse(x, y - 2 * s, 9 * s, 5 * s).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 1.5 });
}

function kelp(g: Graphics, x: number, y: number, s: number) {
  for (const d of [-4, 3]) {
    g.moveTo(x + d * s, y + 2 * s).quadraticCurveTo(x + (d - 8) * s, y - 10 * s, x + (d + 2) * s, y - 22 * s).stroke({ color: 0x8a6a2e, width: 4 * s, cap: 'round' });
  }
}

function crab(g: Graphics, x: number, y: number, face: 1 | -1) {
  // A hermit crab in a borrowed whelk shell: the shell behind, the claws and eyes poking out the front.
  const shell = swatch.yellow;
  g.moveTo(x - face * 18, y - 6).quadraticCurveTo(x - face * 22, y - 30, x - face * 2, y - 32).quadraticCurveTo(x + face * 10, y - 22, x + face * 4, y - 6).closePath().fill(shell.light).stroke({ color: shell.line, width: 2.5 });
  g.moveTo(x - face * 14, y - 18).quadraticCurveTo(x - face * 6, y - 26, x + face * 2, y - 20).stroke({ color: shell.line, width: 1.5 });
  const body = swatch.red;
  for (const d of [0, 6, 12]) g.moveTo(x + face * (2 + d * 0.5), y - 6).lineTo(x + face * (6 + d), y).stroke({ color: body.line, width: 2.5, cap: 'round' });
  g.ellipse(x + face * 14, y - 10, 7, 5).fill(body.fill).stroke({ color: body.line, width: 2 });
  for (const d of [-2, 4]) {
    g.moveTo(x + face * (8 + d), y - 12).lineTo(x + face * (10 + d), y - 22).stroke({ color: body.line, width: 1.5 });
    g.circle(x + face * (10 + d), y - 23, 2.4).fill(ink);
  }
}

function gull(g: Graphics, x: number, y: number) {
  g.moveTo(x - 26, y - 2).quadraticCurveTo(x - 14, y - 14, x, y).quadraticCurveTo(x + 14, y - 14, x + 26, y - 2).stroke({ color: swatch.white.line, width: 5, cap: 'round' });
  g.moveTo(x - 26, y - 2).quadraticCurveTo(x - 14, y - 14, x, y).quadraticCurveTo(x + 14, y - 14, x + 26, y - 2).stroke({ color: 0xffffff, width: 2.5, cap: 'round' });
}
