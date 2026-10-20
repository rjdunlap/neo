import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 7 (docs/rework/ISLAND-REVAMP.md): Painted Canyon as a desert canyon with a spring, in the American
 * Southwest, drawn in code over the land's backdrop. A rim of mesas and buttes in layered red, orange and cream rock (the
 * layers are the canyon's "paint") stands along the horizon, hiding the backdrop's far hills; on the sand she plays on, a
 * spring pools under a cottonwood, prickly pear and yucca grow between rocks, and a roadrunner, a lizard on its rock and
 * a jackrabbit keep her company. No camels or date palms: one real desert. Like the meadow, everything placed is seeded
 * and kept off every touch area, the pet's corner, the corner buttons and the heading, and it takes no touches itself.
 */
export type CanyonThing = 'spring' | 'pear' | 'yucca' | 'roadrunner' | 'lizard' | 'jackrabbit';
/** One thing in the canyon: where its feet are and the box it is drawn in. */
export interface CanyonItem {
  kind: CanyonThing;
  x: number;
  y: number;
  rect: Rect;
}

/**
 * The backdrop's sun (`Backdrop.resize` puts it here, radius 58, its smile about 15 below its middle): the rock stays
 * under its smile, so its face still shows; the backdrop's own hills already hide less of it than that.
 */
const sunSpan = (view: View) => {
  const x = Math.max(230, view.w * 0.2);
  return { left: x - 70, right: x + 70, low: 168 };
};

/** One mesa or butte on the rim: its flat top's ends and height, and how far its sides spread by the ground. */
export interface Mesa {
  left: number;
  right: number;
  top: number;
  spread: number;
}

/**
 * The rim along the horizon: a far wall, then nearer mesas and buttes. Visual only, behind the field. Their tops stay
 * below the corner buttons and the heading, and low across the sun.
 */
export function canyonRim(view: View, ground: number): { far: Mesa[]; near: Mesa[] } {
  const rng = new Rng(127);
  const sun = sunSpan(view);
  const top = (x0: number, x1: number, t: number) => {
    const clamped = Math.max(130, t);
    return x1 > sun.left && x0 < sun.right ? Math.max(sun.low, clamped) : clamped;
  };
  // The far wall runs edge to edge in flat steps, high enough to hide the backdrop's far hills (up to 168 above ground).
  const far: Mesa[] = [];
  for (let x = -40; x < view.w + 40; ) {
    const w = rng.range(120, 220);
    far.push({ left: x, right: x + w, top: top(x, x + w, ground - rng.range(172, 190)), spread: 0 });
    x += w;
  }
  // Nearer mesas (wide) and buttes (narrow), lower than the wall, so the rock reads as layers going back.
  const near: Mesa[] = [];
  for (let x = rng.range(-60, 40); x < view.w + 40; x += rng.range(200, 320)) {
    const w = rng.chance(0.4) ? rng.range(36, 60) : rng.range(90, 170);
    near.push({ left: x, right: x + w, top: top(x - 30, x + w + 30, ground - rng.range(90, 140)), spread: rng.range(18, 30) });
  }
  return { far, near };
}

/** Where each canyon thing goes for this layout: seeded, so the same view always draws the same canyon. */
export function canyonPlan(layout: LandLayout, view: View, ground: number): CanyonItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(163);
  const items: CanyonItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`, in up to `tries` tries. */
  const place = (kind: CanyonThing, n: number, size: number, tall: number, top: number, bottom: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
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
  // The spring and its cottonwood first, searched for longest (in a full landscape field it fits only between two spots),
  // then the desert plants, then the animals between them.
  place('spring', 1, 140, 150, ground + 40, h - 8, 600);
  place('pear', 3, 60, 72, ground + 30, h - 8);
  place('yucca', 3, 50, 76, ground + 40, h - 8);
  place('lizard', 2, 64, 36, ground + 30, h - 8);
  place('roadrunner', 1, 70, 52, ground + 30, h - 8);
  place('jackrabbit', 1, 50, 68, ground + 30, h - 8);
  return items;
}

/** The rock's layers, top down: the canyon's paint. */
const STRATA = [0xd9764a, 0xf0a868, 0xf6d9a8, 0xc95f3c, 0xe8925a];
const ROCK_LINE = 0x9a4a2e;
const FAR_STRATA = [0xe6a383, 0xf0c2a0, 0xe9b08e, 0xf3cfae];
const FAR_LINE = 0xc0806a;

export function drawCanyon(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  const { far, near } = canyonRim(view, ground);
  // The far wall, hazy with distance, down to the sand.
  for (const m of far) mesa(g, m, ground + 12, FAR_STRATA);
  // One skyline along the wall's steps, so it reads as one cliff rather than tiles.
  g.moveTo(far[0].left, far[0].top);
  for (let i = 0; i < far.length; i++) {
    g.lineTo(far[i].right, far[i].top);
    if (far[i + 1]) g.lineTo(far[i].right, far[i + 1].top);
  }
  g.stroke({ color: FAR_LINE, width: 2, join: 'round' });
  for (const m of near) mesa(g, m, ground + 12, STRATA, ROCK_LINE, 2.5);
  for (const { kind, x, y } of canyonPlan(layout, view, ground)) {
    if (kind === 'spring') spring(g, x, y);
    else if (kind === 'pear') pear(g, x, y);
    else if (kind === 'yucca') yucca(g, x, y);
    else if (kind === 'lizard') lizard(g, x, y, x > view.w / 2 ? -1 : 1);
    else if (kind === 'roadrunner') roadrunner(g, x, y, x > view.w / 2 ? -1 : 1);
    else jackrabbit(g, x, y, x > view.w / 2 ? -1 : 1);
  }
}

/** A flat-topped rock whose sides spread to the ground, banded in its layers. */
function mesa(g: Graphics, m: Mesa, base: number, strata: number[], line?: number, width = 2) {
  const tall = base - m.top;
  const at = (y: number) => (y - m.top) / tall;
  const edge = (y: number): [number, number] => [m.left - m.spread * at(y), m.right + m.spread * at(y)];
  const bands = strata.length;
  for (let i = 0; i < bands; i++) {
    const y0 = m.top + (tall * i) / bands;
    const y1 = m.top + (tall * (i + 1)) / bands;
    const [a0, b0] = edge(y0);
    const [a1, b1] = edge(y1);
    g.moveTo(a0, y0).lineTo(b0, y0).lineTo(b1, y1).lineTo(a1, y1).closePath().fill(strata[i]);
  }
  if (line === undefined) return;
  const [l, r] = edge(base);
  g.moveTo(l, base).lineTo(m.left, m.top).lineTo(m.right, m.top).lineTo(r, base).stroke({ color: line, width, join: 'round' });
}

/** A spring: a blue pool edged with stones and reeds, under a cottonwood. */
function spring(g: Graphics, x: number, y: number) {
  // The cottonwood behind the pool: a pale trunk and a broad, bright crown.
  const tx = x - 22;
  g.moveTo(tx - 9, y - 22).lineTo(tx - 6, y - 92).lineTo(tx + 6, y - 92).lineTo(tx + 9, y - 22).closePath().fill(0xb9a58c).stroke({ color: 0x7d6a54, width: 2 });
  g.moveTo(tx + 3, y - 80).lineTo(tx + 22, y - 98).stroke({ color: 0x7d6a54, width: 4, cap: 'round' });
  for (const [dx, dy, r] of [[-24, -104, 20], [20, -110, 20], [-2, -124, 22], [-4, -100, 20]]) g.circle(tx + dx, y + dy, r).fill(0x9ad15a).stroke({ color: swatch.green.line, width: 2 });
  // The pool, with the sky in it.
  g.ellipse(x, y - 12, 56, 13).fill(swatch.blue.light).stroke({ color: swatch.blue.line, width: 2.5 });
  g.ellipse(x + 10, y - 14, 24, 4).fill({ color: 0xffffff, alpha: 0.7 });
  for (const dx of [-54, -34, 38, 56]) g.ellipse(x + dx, y - 6, 9, 6).fill(0xc9b79c).stroke({ color: 0x8c7a62, width: 1.5 });
  for (const dx of [42, 48, 54]) g.moveTo(x + dx, y - 10).lineTo(x + dx + (dx - 48) * 0.4, y - 34).stroke({ color: swatch.green.line, width: 2.5, cap: 'round' });
}

const CACTUS = 0x6fb36a;
const CACTUS_LINE = 0x3f7f45;

/** A prickly pear: round pads on pads, with spines and a pink fruit. */
function pear(g: Graphics, x: number, y: number) {
  const pads: [number, number, number, number][] = [[0, -16, 15, 18], [-14, -40, 12, 14], [12, -42, 12, 14], [2, -58, 10, 11]];
  for (const [dx, dy, rx, ry] of pads) g.ellipse(x + dx, y + dy, rx, ry).fill(CACTUS).stroke({ color: CACTUS_LINE, width: 2 });
  for (const [dx, dy] of [[-4, -18], [5, -12], [-14, -42], [12, -44], [2, -58]]) g.circle(x + dx, y + dy, 1.2).fill(0xf6efd8);
  g.ellipse(x + 10, y - 66, 4, 5).fill(swatch.pink.fill).stroke({ color: swatch.pink.line, width: 1.2 });
  g.ellipse(x - 20, y - 52, 4, 5).fill(swatch.pink.fill).stroke({ color: swatch.pink.line, width: 1.2 });
}

/** A yucca: a fan of stiff, pointed leaves and a tall stalk of cream bells. */
function yucca(g: Graphics, x: number, y: number) {
  g.moveTo(x, y - 18).lineTo(x + 2, y - 70).stroke({ color: 0x8c7a4e, width: 3, cap: 'round' });
  for (let k = 0; k < 6; k++) g.circle(x + 2 + (k % 2 ? 4 : -4), y - 46 - k * 4.5, 3.6).fill(0xfff6dc).stroke({ color: 0xc9b78c, width: 1 });
  for (const a of [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2]) g.moveTo(x, y - 2).lineTo(x + Math.sin(a) * 24, y - 2 - Math.cos(a) * 28).stroke({ color: 0x5f9a62, width: 4, cap: 'round' });
}

/** A lizard sunning itself on a flat red rock, its long tail curled. */
function lizard(g: Graphics, x: number, y: number, face: 1 | -1) {
  g.moveTo(x - 30, y).quadraticCurveTo(x - 26, y - 18, x, y - 18).quadraticCurveTo(x + 26, y - 18, x + 30, y).closePath().fill(STRATA[3]).stroke({ color: ROCK_LINE, width: 2 });
  const body = 0x8fcf6a;
  const line = swatch.green.line;
  g.moveTo(x - face * 8, y - 20).quadraticCurveTo(x - face * 22, y - 18, x - face * 26, y - 26).stroke({ color: line, width: 5, cap: 'round' });
  g.moveTo(x - face * 8, y - 20).quadraticCurveTo(x - face * 22, y - 18, x - face * 26, y - 26).stroke({ color: body, width: 3, cap: 'round' });
  for (const d of [-6, 6]) g.moveTo(x + d, y - 20).lineTo(x + d + 3 * Math.sign(d), y - 16).stroke({ color: line, width: 2.5, cap: 'round' });
  g.ellipse(x, y - 22, 12, 5).fill(body).stroke({ color: line, width: 1.5 });
  g.ellipse(x + face * 14, y - 24, 6, 4.5).fill(body).stroke({ color: line, width: 1.5 });
  g.circle(x + face * 16, y - 25.5, 1.5).fill(ink);
}

/** A roadrunner: a speckled body, a long tail held up, a crest and long legs. */
function roadrunner(g: Graphics, x: number, y: number, face: 1 | -1) {
  const body = 0xb8a68a;
  const line = 0x6a5a44;
  for (const d of [-4, 4]) g.moveTo(x + d, y - 18).lineTo(x + d + face * 2, y).stroke({ color: 0x8a7a5e, width: 2.5, cap: 'round' });
  g.moveTo(x - face * 10, y - 26).lineTo(x - face * 34, y - 44).stroke({ color: line, width: 6, cap: 'round' });
  g.moveTo(x - face * 10, y - 26).lineTo(x - face * 33, y - 43).stroke({ color: body, width: 3.5, cap: 'round' });
  g.ellipse(x, y - 24, 16, 9).fill(body).stroke({ color: line, width: 2 });
  for (const [dx, dy] of [[-6, -26], [2, -22], [7, -27], [-2, -29]]) g.circle(x + face * dx, y + dy, 1.4).fill(line);
  g.circle(x + face * 16, y - 36, 7).fill(body).stroke({ color: line, width: 2 });
  for (const k of [0, 1, 2]) g.moveTo(x + face * (13 + k * 2), y - 41).lineTo(x + face * (10 + k * 3), y - 50).stroke({ color: line, width: 2, cap: 'round' });
  g.moveTo(x + face * 22, y - 37).lineTo(x + face * 33, y - 35).stroke({ color: ink, width: 2.5, cap: 'round' });
  g.circle(x + face * 18, y - 38, 1.6).fill(ink);
  g.moveTo(x + face * 20, y - 36).lineTo(x + face * 24, y - 35).stroke({ color: swatch.orange.fill, width: 1.5 });
}

/** A jackrabbit sitting up: very long ears, long feet and a soft tan coat. */
function jackrabbit(g: Graphics, x: number, y: number, face: 1 | -1) {
  const coat = 0xd2b48c;
  const line = 0x8f6f4a;
  g.ellipse(x, y - 14, 15, 13).fill(coat).stroke({ color: line, width: 2 });
  g.ellipse(x + face * 8, y - 2, 11, 3.5).fill(coat).stroke({ color: line, width: 1.5 });
  g.circle(x - face * 14, y - 12, 4).fill(0xfaf4ea);
  g.circle(x + face * 8, y - 32, 9).fill(coat).stroke({ color: line, width: 2 });
  for (const d of [-3, 4]) {
    g.ellipse(x + face * (6 + d), y - 52, 3.6, 13).fill(coat).stroke({ color: line, width: 1.5 });
    g.ellipse(x + face * (6 + d), y - 52, 1.6, 9).fill(swatch.pink.light);
  }
  g.circle(x + face * 12, y - 33, 1.6).fill(ink);
  g.circle(x + face * 16.5, y - 30, 1.3).fill(swatch.pink.line);
}
