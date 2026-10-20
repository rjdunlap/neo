import { Graphics } from 'pixi.js';
import { ink } from '../../art/palette';
import type { BackdropStyle } from '../../art/scenery';
import { landButtons, overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';
import { hedgehog } from './village';

/**
 * RW13 slice 9 (docs/rework/ISLAND-REVAMP.md): Story Grove as a woodland garden at night, drawn in code. The location
 * swaps the land's day sky for a night one (`GROVE_BACKDROP`: no sun or clouds to tap; `classic/` keeps its day), and
 * over it a moon, stars and a bat or two in the sky, and a dark line of woodland along the horizon. On the moonlit lawn
 * she plays on, evening primrose opens (it really flowers at dusk), moths visit it, fireflies glow, an owl sits on a
 * stump and a hedgehog snuffles about. Like the meadow, everything placed is seeded and kept off every touch area, the
 * pet's corner, the corner buttons and the heading, and it takes no touches itself.
 */
export type GroveThing = 'owl' | 'hedgehog' | 'primrose' | 'moth' | 'firefly';
/** One thing in the grove: where its feet are and the box it is drawn in. */
export interface GroveItem {
  kind: GroveThing;
  x: number;
  y: number;
  rect: Rect;
}

/** The night sky the location draws instead of the land's day one; the lawn stays a readable moonlit green. */
export const GROVE_BACKDROP: BackdropStyle = {
  sky: [0x1d2b5c, 0x5a6aa8],
  hills: [0x34506a, 0x3d6658, 0x4f8a5e],
  horizon: 0.4,
  clouds: 0,
  sun: false,
  seed: 139,
};

/** The heading's colour over the night sky. */
export const GROVE_HEADING = 0xfff6e0;

/** The backdrop's far hills reach up to this far above the ground line (`Backdrop.resize`). */
const FAR_HILLS = 168;
/** The heading's box, as `meadowKeepOut` keeps it clear. */
const headingBox = (view: View): Rect => ({ x: view.w / 2 - 190, y: 20, w: 380, h: 90 });

export interface GroveSky {
  moon: { x: number; y: number; r: number };
  /** Star centres and sizes. */
  stars: { x: number; y: number; r: number }[];
  /** Bats in flight, with the box each is drawn in. */
  bats: { x: number; y: number; rect: Rect }[];
}

/**
 * The moon (where the land's sun stood, raised so it sits in clear sky above the far hills), the stars and the bats.
 * Visual only, behind the field; all of it stays off the corner buttons and the heading.
 */
export function grovePlanSky(view: View, ground: number): GroveSky {
  const r = 42;
  const moon = { x: Math.max(230, view.w * 0.2), y: Math.min(150, ground - FAR_HILLS - r - 6), r };
  const moonBox = { x: moon.x - r - 14, y: moon.y - r - 14, w: 2 * r + 28, h: 2 * r + 28 };
  const keepOut = [...landButtons(view.w), headingBox(view), moonBox];
  const top = 10;
  const bottom = ground - FAR_HILLS - 4;
  const clear = (b: Rect) => b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= bottom && !keepOut.some((k) => overlaps(b, k));
  const rng = new Rng(173);
  const bats: GroveSky['bats'] = [];
  for (let i = 0; i < 60 && bats.length < 2; i++) {
    const x = rng.range(30, view.w - 30);
    const y = rng.range(top + 14, bottom - 14);
    const rect = { x: x - 26, y: y - 14, w: 52, h: 28 };
    if (!clear(rect)) continue;
    bats.push({ x, y, rect });
    keepOut.push(rect);
  }
  const stars: GroveSky['stars'] = [];
  for (let i = 0; i < 160 && stars.length < 28; i++) {
    const x = rng.range(6, view.w - 6);
    const y = rng.range(top, bottom - 6);
    const s = rng.range(1.6, 4.2);
    if (!clear({ x: x - s, y: y - s, w: 2 * s, h: 2 * s })) continue;
    if (stars.some((p) => Math.hypot(p.x - x, p.y - y) < 34)) continue;
    stars.push({ x, y, r: s });
  }
  return { moon, stars, bats };
}

/** One tree at the woodland's edge: its trunk's foot and its crown's middle and radius. */
export interface EdgeTree {
  x: number;
  cy: number;
  r: number;
}

/**
 * The woodland along the horizon: round dark crowns edge to edge, visual only, behind the field. Their tops stay below
 * the corner buttons and the heading.
 */
export function groveEdge(view: View, ground: number): EdgeTree[] {
  const rng = new Rng(179);
  const trees: EdgeTree[] = [];
  // Each crown overlaps the next, so the edge reads as one wood rather than a row of lollipops.
  for (let x = rng.range(-20, 10); x < view.w + 40; ) {
    const r = rng.range(26, 40);
    const cy = Math.max(130 + r, ground - rng.range(42, 72));
    trees.push({ x, cy, r });
    x += r * rng.range(1.1, 1.6);
  }
  return trees;
}

/** Where each grove thing goes for this layout: seeded, so the same view always draws the same grove. */
export function grovePlan(layout: LandLayout, view: View, ground: number): GroveItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(181);
  const items: GroveItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`, in up to `tries` tries. */
  const place = (kind: GroveThing, n: number, size: number, tall: number, top: number, bottom: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      // On the lawn, in front of the woodland's edge.
      if (rect.y <= ground + 4 || !clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else.
      keepOut.push(rect);
      placed++;
    }
  };
  const field = ground + 40;
  // The owl on its stump first, searched for longest (it is the tallest), then the hedgehog, the primrose and the
  // moths and fireflies that fill the gaps.
  place('owl', 1, 60, 100, field + 50, h - 8, 400);
  place('hedgehog', 1, 56, 34, field, h - 8, 200);
  place('primrose', 3, 52, 58, field, h - 8);
  place('moth', 2, 30, 24, field, h - 8);
  place('firefly', 6, 22, 22, field, h - 8);
  return items;
}

const CROWN = 0x24423f;
const CROWN_LINE = 0x172c2c;
const TRUNK = 0x2a2a34;
const LAWN_LINE = 0x2f5a44;
const GLOW = 0xfff3a0;

export function drawGrove(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  const sky = grovePlanSky(view, ground);
  for (const s of sky.stars) star(g, s.x, s.y, s.r);
  moon(g, sky.moon.x, sky.moon.y, sky.moon.r);
  for (const b of sky.bats) bat(g, b.x, b.y, b.x > view.w / 2 ? -1 : 1);
  // The woodland's edge, trunks under round crowns, then a soft line where the lawn meets it.
  const edge = groveEdge(view, ground);
  for (const t of edge) g.rect(t.x - 5, t.cy, 10, ground + 8 - t.cy).fill(TRUNK);
  for (const t of edge) g.circle(t.x, t.cy, t.r).fill(CROWN).stroke({ color: CROWN_LINE, width: 2 });
  for (const t of edge) g.circle(t.x - t.r * 0.3, t.cy - t.r * 0.35, t.r * 0.4).fill({ color: 0x3a6a5c, alpha: 0.6 });
  g.rect(-10, ground + 4, view.w + 20, 8).fill(0x45785a);
  for (const { kind, x, y } of grovePlan(layout, view, ground)) {
    const face = x > view.w / 2 ? -1 : 1;
    if (kind === 'owl') owl(g, x, y);
    else if (kind === 'hedgehog') hedgehog(g, x, y, face);
    else if (kind === 'primrose') primrose(g, x, y);
    else if (kind === 'moth') moth(g, x, y);
    else firefly(g, x, y);
  }
}

/** A star: a dot, the bigger ones with a little four-point twinkle. */
function star(g: Graphics, x: number, y: number, r: number) {
  if (r > 3) {
    g.moveTo(x, y - r * 2.2).lineTo(x + r * 0.5, y - r * 0.5).lineTo(x + r * 2.2, y).lineTo(x + r * 0.5, y + r * 0.5)
      .lineTo(x, y + r * 2.2).lineTo(x - r * 0.5, y + r * 0.5).lineTo(x - r * 2.2, y).lineTo(x - r * 0.5, y - r * 0.5).closePath().fill(0xfff6c8);
  } else g.circle(x, y, r).fill({ color: 0xfff6e0, alpha: 0.9 });
}

/** A full moon with a soft glow and a few grey seas. */
function moon(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r + 12).fill({ color: 0xfff6d0, alpha: 0.15 });
  g.circle(x, y, r).fill(0xfff4cc).stroke({ color: 0xd9c98f, width: 4 });
  for (const [dx, dy, s] of [[-14, -10, 9], [12, 8, 12], [-8, 18, 6], [16, -16, 5]]) g.circle(x + dx, y + dy, s).fill({ color: 0xe4d6a2, alpha: 0.8 });
}

/** A bat in flight: a small dark body between two scalloped wings, lit at the edge so it shows on the night sky. */
function bat(g: Graphics, x: number, y: number, face: 1 | -1) {
  const body = 0x2a2240;
  const line = 0x9a8ac4;
  for (const side of [-1, 1]) {
    g.moveTo(x, y - 4).quadraticCurveTo(x + side * 12, y - 14, x + side * 26, y - 6)
      .quadraticCurveTo(x + side * 20, y - 2, x + side * 18, y + 4).quadraticCurveTo(x + side * 13, y, x + side * 9, y + 6)
      .quadraticCurveTo(x + side * 5, y + 2, x, y + 4).closePath().fill(body).stroke({ color: line, width: 1.5, join: 'round' });
  }
  g.ellipse(x, y, 5, 7).fill(body).stroke({ color: line, width: 1.5 });
  for (const d of [-3, 3]) g.moveTo(x + d, y - 5).lineTo(x + d * 1.4, y - 11).lineTo(x + d * 0.3, y - 7).closePath().fill(body);
  g.circle(x + face * 2, y - 2, 1.2).fill(0xfff3a0);
}

/** A tawny owl on a stump: a round brown body, a pale face disc, big dark eyes, little ear tufts. */
function owl(g: Graphics, x: number, y: number) {
  const line = 0x4a3426;
  // The stump, its top ring showing.
  g.rect(x - 24, y - 34, 48, 34).fill(0x7a5a40).stroke({ color: line, width: 2 });
  g.ellipse(x, y - 34, 24, 7).fill(0xc8a070).stroke({ color: line, width: 2 });
  g.ellipse(x, y - 34, 12, 3.5).stroke({ color: 0x9a7650, width: 1.5 });
  const by = y - 38;
  g.ellipse(x, by - 22, 19, 24).fill(0x9a7452).stroke({ color: line, width: 2 });
  for (const d of [-1, 1]) g.ellipse(x + d * 14, by - 18, 7, 16).fill(0x7e5c40).stroke({ color: line, width: 1.5 });
  for (const d of [-1, 1]) g.moveTo(x + d * 8, by - 48).lineTo(x + d * 15, by - 58).lineTo(x + d * 16, by - 44).closePath().fill(0x9a7452).stroke({ color: line, width: 1.5, join: 'round' });
  g.ellipse(x, by - 34, 16, 13).fill(0xd8bc92).stroke({ color: line, width: 1.5 });
  for (const d of [-7, 7]) {
    g.circle(x + d, by - 35, 6).fill(ink);
    g.circle(x + d + 1.5, by - 37, 1.8).fill(0xffffff);
  }
  g.moveTo(x - 3, by - 30).lineTo(x + 3, by - 30).lineTo(x, by - 25).closePath().fill(0xe0a840);
  for (const [dx, dy] of [[-6, -16], [6, -16], [0, -10], [-5, -6], [5, -6]]) g.moveTo(x + dx - 2, by + dy).lineTo(x + dx, by + dy + 3).lineTo(x + dx + 2, by + dy).stroke({ color: 0x6a4a34, width: 1.2 });
  for (const d of [-5, 5]) g.moveTo(x + d - 3, by - 1).lineTo(x + d + 3, by - 1).stroke({ color: 0xe0a840, width: 2.5, cap: 'round' });
}

/** Evening primrose: three pale yellow four-petalled flowers open on tall stems, with a closed bud. */
function primrose(g: Graphics, x: number, y: number) {
  const stems: [number, number][] = [[-14, -40], [2, -52], [16, -36]];
  for (const [dx, top] of stems) g.moveTo(x + dx * 0.4, y).quadraticCurveTo(x + dx * 0.6, y + top / 2, x + dx, y + top).stroke({ color: 0x3f7a4a, width: 2.5, cap: 'round' });
  for (const [dx, dy] of [[-8, -10], [8, -14], [-2, -24]]) g.ellipse(x + dx, y + dy, 7, 3).fill(0x4f8f52).stroke({ color: LAWN_LINE, width: 1 });
  for (const [dx, top] of stems) {
    const fx = x + dx;
    const fy = y + top;
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2) + Math.PI / 4;
      g.circle(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 5.5).fill(0xfff08a).stroke({ color: 0xd9c050, width: 1 });
    }
    g.circle(fx, fy, 2.2).fill(0xe0b030);
  }
  g.ellipse(x + 8, y - 44, 2.5, 5).fill(0xd9c050);
}

/** A pale moth, wings open. */
function moth(g: Graphics, x: number, y: number) {
  const cy = y - 12;
  for (const side of [-1, 1]) {
    g.ellipse(x + side * 7, cy - 3, 8, 6).fill(0xeee4d0).stroke({ color: 0xa89878, width: 1.2 });
    g.ellipse(x + side * 6, cy + 5, 5.5, 4).fill(0xe0d4bc).stroke({ color: 0xa89878, width: 1.2 });
  }
  g.ellipse(x, cy + 1, 2.2, 7).fill(0x8a7a62);
  for (const side of [-1, 1]) g.moveTo(x, cy - 5).lineTo(x + side * 5, cy - 11).stroke({ color: 0x8a7a62, width: 1 });
}

/** A firefly: a tiny glowing light with its halo. */
function firefly(g: Graphics, x: number, y: number) {
  const cy = y - 11;
  g.circle(x, cy, 10).fill({ color: GLOW, alpha: 0.22 });
  g.circle(x, cy, 5.5).fill({ color: GLOW, alpha: 0.45 });
  g.circle(x, cy, 2.8).fill(0xfffbe0);
}
