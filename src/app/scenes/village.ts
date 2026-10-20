import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 8 (docs/rework/ISLAND-REVAMP.md): Cozy Village as a village with hedgerows, drawn in code over the land's
 * backdrop. A row of cottages stands along a lane at the horizon (a town is a human-made place); on the green she plays
 * on, hedges of hawthorn in white blossom and bramble with blackberries are the habitat, and robins and a hedgehog live
 * in them. Like the meadow, everything placed is seeded and kept off every touch area, the pet's corner, the corner
 * buttons and the heading, and it takes no touches itself.
 */
export type VillageThing = 'hedge' | 'robin' | 'hedgehog' | 'bramble';
/** One thing in the village: where its feet are and the box it is drawn in. */
export interface VillageItem {
  kind: VillageThing;
  x: number;
  y: number;
  rect: Rect;
}

/** One cottage on the lane: its walls' ends, its roof's peak height and its colours. */
export interface Cottage {
  left: number;
  right: number;
  top: number;
  wall: number;
  roof: number;
}

/** The lane runs along the horizon from just above the ground line to this far below it. */
export const LANE_DEPTH = 22;

/**
 * The backdrop's sun (`Backdrop.resize` puts it here, radius 58, its smile about 15 below its middle): a roof across it
 * stays under its smile, so its face still shows.
 */
const sunSpan = (view: View) => {
  const x = Math.max(230, view.w * 0.2);
  return { left: x - 70, right: x + 70, low: 168 };
};

const WALLS = [0xfff1d6, 0xf6d9c0, 0xe8eef6, 0xf9e6b0];
const ROOFS = [0xc95f3c, 0x8c6a9a, 0x6f8fb8, 0xb5734a];

/**
 * The cottages along the lane, with gaps of hedge between some of them. Visual only, behind the field. Their roofs
 * stay below the corner buttons and the heading, and low across the sun.
 */
export function villageLane(view: View, ground: number): Cottage[] {
  const rng = new Rng(149);
  const sun = sunSpan(view);
  const cottages: Cottage[] = [];
  for (let x = rng.range(-30, 30); x < view.w + 20; ) {
    const w = rng.range(80, 130);
    let top = Math.max(130, ground - rng.range(95, 135));
    if (x + w + 10 > sun.left && x - 10 < sun.right) top = Math.max(sun.low, top);
    cottages.push({ left: x, right: x + w, top, wall: rng.pick(WALLS), roof: rng.pick(ROOFS) });
    x += w + rng.range(30, 110);
  }
  return cottages;
}

/** Where each village thing goes for this layout: seeded, so the same view always draws the same village. */
export function villagePlan(layout: LandLayout, view: View, ground: number): VillageItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(167);
  const items: VillageItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`, in up to `tries` tries. */
  const place = (kind: VillageThing, n: number, size: number, tall: number, top: number, bottom: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      // Off the lane, on the green.
      if (rect.y <= ground + LANE_DEPTH || !clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else.
      keepOut.push(rect);
      placed++;
    }
  };
  const field = ground + LANE_DEPTH + 30;
  // The hedges first, searched for longest (in a full landscape field one fits only between two spots), then the
  // brambles, then the hedgehog and the robins between them.
  // A long hedge where there is room, a shorter one drawn to its smaller box where there is not.
  for (const s of [1, 0.75, 0.55]) if (items.length < 2) place('hedge', 2 - items.length, 130 * s, 66 * s, field, h - 8, 400);
  place('bramble', 2, 64, 44, field, h - 8);
  place('hedgehog', 1, 56, 34, field, h - 8, 200);
  place('robin', 2, 34, 36, field, h - 8);
  return items;
}

const GRASS_LINE = swatch.green.line;
const LEAF = 0x7fb85c;
const LEAF_DARK = 0x5f9a48;
const LANE = 0xead9b4;
const LANE_LINE = 0xc7ae7e;

export function drawVillage(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  for (const c of villageLane(view, ground)) cottage(g, c, ground + 4);
  // A low hedge along the back of the lane, edge to edge, so the cottages sit in their gardens.
  const rng = new Rng(151);
  for (let x = -10; x < view.w + 20; x += rng.range(22, 32)) g.circle(x, ground + 2, rng.range(11, 15)).fill(LEAF_DARK).stroke({ color: GRASS_LINE, width: 1.5 });
  // The lane, a pale strip of packed earth in front of them.
  g.rect(-10, ground + 6, view.w + 20, LANE_DEPTH - 6).fill(LANE);
  g.moveTo(-10, ground + LANE_DEPTH).lineTo(view.w + 10, ground + LANE_DEPTH).stroke({ color: LANE_LINE, width: 2 });
  for (const { kind, x, y, rect } of villagePlan(layout, view, ground)) {
    if (kind === 'hedge') hedge(g, x, y, rect.w / 130);
    else if (kind === 'bramble') bramble(g, x, y);
    else if (kind === 'hedgehog') hedgehog(g, x, y, x > view.w / 2 ? -1 : 1);
    else robin(g, x, y, x > view.w / 2 ? -1 : 1);
  }
}

/** A cottage: cream walls, a pitched roof with a chimney, a door and two windows. */
function cottage(g: Graphics, c: Cottage, base: number) {
  const tall = base - c.top;
  const eave = c.top + tall * 0.42;
  const mid = (c.left + c.right) / 2;
  const w = c.right - c.left;
  const line = 0x6a4a3a;
  g.rect(c.right - w * 0.28, c.top + tall * 0.08, w * 0.12, tall * 0.3).fill(0xb06a4a).stroke({ color: line, width: 2 });
  g.rect(c.left + 6, eave, w - 12, base - eave).fill(c.wall).stroke({ color: line, width: 2 });
  g.moveTo(c.left - 6, eave).lineTo(mid, c.top).lineTo(c.right + 6, eave).closePath().fill(c.roof).stroke({ color: line, width: 2, join: 'round' });
  const doorW = Math.min(20, w * 0.18);
  const doorH = Math.min(34, (base - eave) * 0.6);
  g.roundRect(mid - doorW / 2, base - doorH, doorW, doorH, 6).fill(0x8a5a3a).stroke({ color: line, width: 1.5 });
  const win = Math.min(16, (base - eave) * 0.32);
  for (const dx of [-w * 0.3, w * 0.3]) {
    g.rect(mid + dx - win / 2, eave + (base - eave) * 0.22, win, win).fill(0xfff2a8).stroke({ color: line, width: 1.5 });
    g.moveTo(mid + dx, eave + (base - eave) * 0.22).lineTo(mid + dx, eave + (base - eave) * 0.22 + win).stroke({ color: line, width: 1 });
  }
}

/** A hedge, 130 across at `s` 1: a long mound of hawthorn in white blossom, threaded with bramble and its blackberries. */
function hedge(g: Graphics, x: number, y: number, s: number) {
  const at = (dx: number, dy: number, r: number): [number, number, number] => [x + dx * s, y + dy * s, r * s];
  const puffs: [number, number, number][] = [[-48, -20, 18], [-24, -32, 22], [2, -40, 24], [28, -32, 22], [50, -20, 17], [-34, -16, 18], [14, -18, 20], [38, -14, 16]];
  for (const p of puffs) g.circle(...at(...p)).fill(LEAF).stroke({ color: GRASS_LINE, width: 2 });
  for (const [dx, dy, r] of puffs) g.circle(...at(dx - r * 0.2, dy - r * 0.25, r * 0.55)).fill({ color: 0x9bd06e, alpha: 0.7 });
  // Hawthorn blossom: little five-dot flowers.
  for (const [dx, dy] of [[-40, -30], [-12, -50], [16, -46], [40, -32], [-4, -28], [26, -20], [-30, -12]]) {
    for (let k = 0; k < 5; k++) g.circle(...at(dx + Math.cos(k * 1.257) * 2.6, dy + Math.sin(k * 1.257) * 2.6, 1.9)).fill(0xffffff);
    g.circle(...at(dx, dy, 1.2)).fill(swatch.pink.fill);
  }
  // Blackberries on the bramble: clusters of dark drupelets, one still red.
  for (const [dx, dy, ripe] of [[-20, -10, true], [6, -6, true], [44, -6, false], [-50, -6, true]] as const) {
    for (const [ox, oy] of [[0, 0], [2.6, 1.2], [-2.6, 1.2], [0, 2.6]]) g.circle(...at(dx + ox, dy + oy, 2.3)).fill(ripe ? 0x3a2448 : 0xc0384a);
  }
}

/** A bramble arch on its own: a thorny cane bent over, with leaves and blackberries. */
function bramble(g: Graphics, x: number, y: number) {
  g.moveTo(x - 26, y).quadraticCurveTo(x - 10, y - 46, x + 26, y - 4).stroke({ color: 0x7a3a4a, width: 3, cap: 'round' });
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    const px = (1 - t) * (1 - t) * (x - 26) + 2 * t * (1 - t) * (x - 10) + t * t * (x + 26);
    const py = (1 - t) * (1 - t) * y + 2 * t * (1 - t) * (y - 46) + t * t * (y - 4);
    g.ellipse(px, py - 6, 7, 4.5).fill(LEAF_DARK).stroke({ color: GRASS_LINE, width: 1.2 });
    if (t === 0.4 || t === 0.8) for (const [ox, oy] of [[0, 0], [2.4, 1], [-2.4, 1], [0, 2.4]]) g.circle(px + ox, py + 4 + oy, 2.1).fill(0x3a2448);
  }
}

/** A hedgehog: a round brown body of spines, a pale pointed face and a black nose. Story Grove's night lawn has one too. */
export function hedgehog(g: Graphics, x: number, y: number, face: 1 | -1) {
  const spines = 0x8a6a4a;
  const line = 0x5a4030;
  for (let k = 0; k <= 8; k++) {
    const a = Math.PI + (k / 8) * Math.PI;
    const bx = x - face * 4 + Math.cos(a) * 20;
    const by = y - 12 + Math.sin(a) * 15;
    g.moveTo(bx, by).lineTo(bx + Math.cos(a) * 7, by + Math.sin(a) * 7).stroke({ color: line, width: 2.5, cap: 'round' });
  }
  g.ellipse(x - face * 4, y - 12, 21, 15).fill(spines).stroke({ color: line, width: 2 });
  g.moveTo(x + face * 10, y - 18).quadraticCurveTo(x + face * 28, y - 10, x + face * 26, y - 4).lineTo(x + face * 8, y - 2).closePath().fill(0xe8d2b0).stroke({ color: line, width: 1.5 });
  g.circle(x + face * 27, y - 6, 2.6).fill(ink);
  g.circle(x + face * 17, y - 12, 1.7).fill(ink);
  for (const d of [-8, 6]) g.ellipse(x + d, y - 1, 3.5, 2).fill(0xc9a888);
}

/** A robin: a round brown bird with a red-orange breast, hopping on the grass. */
function robin(g: Graphics, x: number, y: number, face: 1 | -1) {
  const back = 0x9a7a5a;
  const line = 0x5a4434;
  for (const d of [-3, 3]) g.moveTo(x + d, y - 8).lineTo(x + d, y).stroke({ color: 0x8a5a3a, width: 1.8, cap: 'round' });
  g.moveTo(x - face * 8, y - 16).lineTo(x - face * 18, y - 24).lineTo(x - face * 16, y - 14).closePath().fill(back).stroke({ color: line, width: 1.5 });
  g.ellipse(x, y - 16, 12, 10).fill(back).stroke({ color: line, width: 1.8 });
  g.ellipse(x + face * 4, y - 14, 8, 7).fill(0xe86a3a);
  g.circle(x + face * 9, y - 26, 6.5).fill(back).stroke({ color: line, width: 1.8 });
  g.ellipse(x + face * 10, y - 23, 4, 3).fill(0xe86a3a);
  g.circle(x + face * 11, y - 28, 1.4).fill(ink);
  g.moveTo(x + face * 15, y - 27).lineTo(x + face * 20, y - 26).lineTo(x + face * 15, y - 25).closePath().fill(0x4a3a2a);
}
