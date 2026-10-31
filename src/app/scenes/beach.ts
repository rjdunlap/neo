import { Graphics } from 'pixi.js';
import { crab, gull, pool, rock, type PoolLife } from '../../art/shore';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut, scanPlace } from './meadow';

/**
 * RW13 slice 5 (docs/rework/ISLAND-REVAMP.md): Bubble Beach as a rocky shore with tide pools, drawn in code over the
 * land's backdrop (whose far hills are already sky, sea and sand). Waves run along the sea and a wet tide line edges the
 * sand; on the shore she plays on, barnacled rocks and rock pools hold sea stars, anemones and kelp, hermit crabs walk
 * the sand and gulls fly over the water. No coral or reef fish: a reef is warm open water, and it stays inside Bubble
 * Pop's own scene. Like the meadow, everything placed is seeded and kept off every touch area, the pet's corner, the
 * corner buttons and the heading, and it takes no touches itself.
 */
export type BeachThing = 'pool' | 'rock' | 'crab' | 'gull';
export type { PoolLife };
/** One thing on the shore: where its feet are and the box it is drawn in. */
export interface BeachItem {
  kind: BeachThing;
  x: number;
  y: number;
  rect: Rect;
  /** Drawn at this size (a thing shrinks where a full land leaves only small gaps for it; a pool fills its box instead). */
  k?: number;
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
  // A crowded shore (ten games at one band) gives up rocks before its pools; a roomier shore keeps all three.
  for (const rocks of [3, 1, 0]) {
    const plan = shorePlan(layout, view, ground, rocks);
    if (rocks === 0 || plan.filter((i) => i.kind === 'pool').length >= 2) return plan;
  }
  return [];
}

function shorePlan(layout: LandLayout, view: View, ground: number, rocks: number): BeachItem[] {
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
  /** Makes sure of `need` more of a thing, scanning for room (smaller where it must) when random tries found none. */
  const ensure = (kind: BeachThing, need: number, size: number, tall: number, top: number, bottom: number) => {
    for (let i = 0; i < need; i++) {
      const spot = scanPlace(clear, rng, w, size, tall, top, bottom);
      if (!spot) return;
      items.push({ kind, x: spot.x, y: spot.y, rect: spot.rect, ...(spot.k < 1 ? { k: spot.k } : {}) });
      keepOut.push(spot.rect);
    }
  };
  const count = (kind: BeachThing) => items.filter((p) => p.kind === kind).length;
  // The rock pools first, then the rocks, then the crabs walk the sand between them.
  place('pool', 3, 124, 46, ground + 50, h - 8);
  place('rock', rocks, 100, 54, ground + 30, h - 8);
  place('crab', 3, 50, 36, ground + 30, h - 8);
  // Smaller pools in the gaps.
  place('pool', 3, 90, 36, ground + 40, h - 8);
  // Gulls over the sea, under the heading and clear of the sun.
  place('gull', 3, 56, 24, ground - 150, ground - 30);
  // A full land screen leaves only gaps at the row ends: there the shore still keeps two pools, a crab and a gull.
  ensure('pool', 2 - count('pool'), 90, 36, ground + 40, h - 8);
  ensure('crab', 1 - count('crab'), 50, 36, ground + 30, h - 8);
  ensure('gull', 1 - count('gull'), 56, 24, ground - 150, ground - 30);
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
  for (const { kind, x, y, rect, k } of beachPlan(layout, view, ground)) {
    // A pool fills the box it was planned in (the rim is 124 across at full size).
    if (kind === 'pool') {
      pool(g, x, y, poolLife(pools++), (rect.w - 4) / 124);
      continue;
    }
    // Anything else planned smaller (a full land's gap) is drawn at that size round its feet.
    const s = k ?? 1;
    g.save().translateTransform(x, y).scaleTransform(s, s);
    if (kind === 'rock') rock(g, 0, 0);
    else if (kind === 'crab') crab(g, 0, 0, x > view.w / 2 ? -1 : 1);
    else gull(g, 0, -12);
    g.restore();
  }
}
