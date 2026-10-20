import { Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { barnyardFence, drawBarnyard } from './barnyard';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 11 (docs/rework/ISLAND-REVAMP.md): the Barnyard as a location keeps its identity (the land's barn, fence,
 * straw and pail, drawn by `drawBarnyard` as on the classic island) and gains the orchard Orchard Rows needs: apple
 * trees in fruit on the grass in front of the fence, with hens scratching and a hay bale between them. Everything
 * placed is seeded and kept off every touch area, the pet's corner, the corner buttons and the heading, below the
 * fence's straw edge, and it takes no touches itself.
 */
export type FarmThing = 'tree' | 'hay' | 'hen';
/** One thing on the farm: where its feet are and the box it is drawn in. */
export interface FarmItem {
  kind: FarmThing;
  x: number;
  y: number;
  rect: Rect;
}

/** An apple tree's box at full size; a field with no room for one draws it smaller, to its box. */
export const TREE = { w: 110, h: 130 };

/** Where each farm thing goes for this layout: seeded, so the same view always draws the same farm. */
export function farmPlan(layout: LandLayout, view: View, ground: number): FarmItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  // In front of the fence: its straw edge ends 22 below the rails.
  const field = barnyardFence(layout, ground) + 22;
  const clear = (r: Rect) => r.x >= 0 && r.y > field && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(173);
  const items: FarmItem[] = [];
  const place = (kind: FarmThing, n: number, size: number, tall: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(field + tall, h - 8);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      if (!clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else.
      keepOut.push(rect);
      placed++;
    }
  };
  // The orchard first, searched for longest: full-size trees where there is room, smaller ones where there is not.
  for (const s of [1, 0.75, 0.55]) {
    const trees = items.length;
    if (trees < 3) place('tree', 3 - trees, TREE.w * s, TREE.h * s, 400);
  }
  place('hay', 1, 60, 40, 200);
  place('hen', 3, 40, 38);
  return items;
}

export function drawFarm(g: Graphics, layout: LandLayout, view: View, ground: number) {
  drawBarnyard(g, layout, view, ground);
  for (const { kind, x, y, rect } of farmPlan(layout, view, ground)) {
    if (kind === 'tree') appleTree(g, x, y, rect.w / TREE.w);
    else if (kind === 'hay') hay(g, x, y);
    else hen(g, x, y, x > view.w / 2 ? -1 : 1);
  }
}

const LEAF = 0x7fb85c;
const LEAF_LINE = swatch.green.line;
const BARK = 0x8a6040;

/** An apple tree, 110 across and 130 tall at `s` 1: a short trunk under a round crown hung with red apples. */
function appleTree(g: Graphics, x: number, y: number, s: number) {
  const at = (dx: number, dy: number, r: number): [number, number, number] => [x + dx * s, y + dy * s, r * s];
  g.ellipse(x, y - 2 * s, 34 * s, 6 * s).fill({ color: 0x5f9a48, alpha: 0.35 });
  g.poly([x - 8 * s, y, x - 6 * s, y - 56 * s, x + 6 * s, y - 56 * s, x + 8 * s, y]).fill(BARK).stroke({ color: 0x5a4030, width: 2 });
  const crown: [number, number, number][] = [[-30, -76, 24], [0, -96, 30], [30, -76, 24], [-16, -64, 22], [18, -62, 22], [0, -74, 26]];
  for (const c of crown) g.circle(...at(...c)).fill(LEAF).stroke({ color: LEAF_LINE, width: 2 });
  for (const [dx, dy, r] of crown) g.circle(...at(dx - r * 0.2, dy - r * 0.25, r * 0.5)).fill({ color: 0x9bd06e, alpha: 0.7 });
  for (const [dx, dy] of [[-30, -70], [-8, -100], [16, -84], [34, -66], [-18, -56], [8, -60], [-36, -88]]) {
    g.circle(...at(dx, dy, 5.5)).fill(swatch.red.fill).stroke({ color: swatch.red.line, width: 1.5 * s });
    g.circle(...at(dx - 1.8, dy - 1.8, 1.6)).fill({ color: 0xffffff, alpha: 0.7 });
  }
  // A windfall in the grass.
  g.circle(...at(24, -5, 5)).fill(swatch.red.fill).stroke({ color: swatch.red.line, width: 1.5 * s });
}

/** A round hay bale, 60 across: straw in rings, with twine. */
function hay(g: Graphics, x: number, y: number) {
  const line = 0xb8902e;
  g.roundRect(x - 30, y - 38, 52, 38, 10).fill(0xf2d277).stroke({ color: line, width: 2 });
  for (const dy of [-26, -13]) g.moveTo(x - 26, y + dy).lineTo(x + 18, y + dy).stroke({ color: line, width: 1.2 });
  g.ellipse(x + 20, y - 19, 10, 19).fill(0xf6dd8e).stroke({ color: line, width: 2 });
  g.ellipse(x + 20, y - 19, 5, 10).stroke({ color: line, width: 1.2 });
  g.moveTo(x - 6, y - 38).lineTo(x - 6, y).stroke({ color: 0xc0504a, width: 2 });
}

/** A hen pecking about: a round white body, a red comb and wattle, and a yellow beak and feet. */
function hen(g: Graphics, x: number, y: number, face: 1 | -1) {
  const line = 0x8a8478;
  for (const d of [-4, 4]) g.moveTo(x + d, y - 9).lineTo(x + d, y).stroke({ color: swatch.yellow.line, width: 2, cap: 'round' });
  g.moveTo(x - face * 12, y - 18).lineTo(x - face * 20, y - 30).lineTo(x - face * 14, y - 26).lineTo(x - face * 18, y - 20).closePath()
    .fill(0xffffff).stroke({ color: line, width: 1.5 });
  g.ellipse(x, y - 17, 15, 11).fill(0xffffff).stroke({ color: line, width: 1.8 });
  g.ellipse(x - face * 2, y - 17, 7, 5).stroke({ color: line, width: 1.2 });
  g.circle(x + face * 11, y - 28, 7).fill(0xffffff).stroke({ color: line, width: 1.8 });
  for (const d of [8, 12]) g.circle(x + face * d, y - 36, 2.8).fill(swatch.red.fill);
  g.ellipse(x + face * 15, y - 23, 2, 3).fill(swatch.red.fill);
  g.circle(x + face * 13, y - 30, 1.5).fill(ink);
  g.moveTo(x + face * 17, y - 30).lineTo(x + face * 23, y - 28).lineTo(x + face * 17, y - 26).closePath().fill(swatch.yellow.fill).stroke({ color: wood.line, width: 1 });
}
