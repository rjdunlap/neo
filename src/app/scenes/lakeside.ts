import { Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 11 (docs/rework/ISLAND-REVAMP.md): Lantern Lake as a location keeps its identity, a still lake at dusk
 * lit with paper lanterns (the map's landmark, under the land's own lilac evening sky). A strip of still water runs
 * along the horizon, visual only, behind the field, like the village's lane; lanterns float on it and a little boat is
 * moored there where they stay clear of every touch area. On the bank, seeded and kept off every touch area, the pet's
 * corner, the corner buttons and the heading, stand lanterns on posts, reeds and fireflies. A full field leaves the water
 * and bank little room, so garlands of lanterns are also strung across the sky beside the heading, above every spot, in
 * every layout. It takes no touches itself.
 */
export type LakeThing = 'float' | 'boat' | 'post' | 'reeds' | 'firefly';
/** One thing at the lake: where its feet (or waterline) are and the box it is drawn in. */
export interface LakeItem {
  kind: LakeThing;
  x: number;
  y: number;
  rect: Rect;
}

/** The water runs from this far above the horizon to `WATER_BELOW` under it, where the bank begins. */
export const WATER_ABOVE = 40;
export const WATER_BELOW = 8;

const LANTERNS = ['orange', 'yellow', 'pink'] as const;

/** A garland strung across the top of the sky, sagging, with lanterns hung from it at `hang`. */
export interface Garland {
  left: number;
  right: number;
  y: number;
  sag: number;
  hang: number[];
}

/** Where a garland's string runs and how far its lanterns hang below it: everything stays above `GARLAND_LOW`. */
const STRING_Y = 26;
const SAG = 18;
/** The lowest a hung lantern reaches: above the field's highest spot, which starts at 150. */
export const GARLAND_LOW = 140;

/** The garlands either side of the heading, between it and the corner buttons, where there is room for a lantern. */
export function lakeGarlands(view: View): Garland[] {
  const spans = [
    [140, view.w / 2 - 200],
    [view.w / 2 + 200, view.w - 140],
  ];
  return spans
    .filter(([l, r]) => r - l >= 50)
    .map(([left, right]) => {
      const n = Math.min(4, Math.floor((right - left) / 56));
      const hang = Array.from({ length: n }, (_, i) => left + ((i + 0.5) * (right - left)) / n);
      return { left, right, y: STRING_Y, sag: SAG, hang };
    });
}

/** The string's height at `x`: a shallow curve, lowest in the middle. */
export const garlandY = (g: Garland, x: number) => {
  const t = (x - g.left) / (g.right - g.left);
  return g.y + g.sag * 4 * t * (1 - t);
};

/** A hung lantern's box: its cord from the string, its body and its glow. */
export const hungRect = (g: Garland, x: number): Rect => ({ x: x - 22, y: garlandY(g, x), w: 44, h: 26 + 44 });

/** Where each lakeside thing goes for this layout: seeded, so the same view always draws the same lake. */
export function lakePlan(layout: LandLayout, view: View, ground: number): LakeItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(181);
  const items: LakeItem[] = [];
  const add = (item: LakeItem) => {
    items.push(item);
    // Nothing stands on anything else.
    keepOut.push(item.rect);
  };
  // On the water: the boat where there is room for it, then floating lanterns along the strip.
  const waterline = ground - WATER_ABOVE / 2 + 4;
  for (const x of [w * 0.7, w * 0.3, w * 0.85, w * 0.15, w / 2]) {
    const rect = { x: x - 40, y: waterline - 34, w: 80, h: 42 };
    if (clear(rect)) {
      add({ kind: 'boat', x, y: waterline, rect });
      break;
    }
  }
  for (let i = 0, placed = 0; i < 40 && placed < 7; i++) {
    const x = rng.range(20, w - 20);
    const y = waterline + rng.range(-4, 6);
    const rect = { x: x - 18, y: y - 26, w: 36, h: 34 };
    if (!clear(rect)) continue;
    add({ kind: 'float', x, y, rect });
    placed++;
  }
  // On the bank, below the water.
  const bank = ground + WATER_BELOW;
  const place = (kind: LakeThing, n: number, size: number, tall: number, top: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top + tall, h - 8);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      if (rect.y <= bank || !clear(rect)) continue;
      add({ kind, x, y, rect });
      placed++;
    }
  };
  place('post', 3, 36, 84, bank, 200);
  place('reeds', 4, 40, 50, bank);
  place('firefly', 8, 16, 16, bank);
  return items;
}

const WATER = 0x8fb4e0;
const WATER_DEEP = 0x7a9fd6;
const BANK = 0xa8dc8f;
const BANK_LINE = swatch.green.line;

export function drawLake(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  // The still water, a little deeper towards the far shore, with the evening sky's light lying on it in streaks.
  g.rect(-10, ground - WATER_ABOVE, view.w + 20, WATER_ABOVE + WATER_BELOW).fill(WATER);
  g.rect(-10, ground - WATER_ABOVE, view.w + 20, 10).fill(WATER_DEEP);
  const rng = new Rng(179);
  for (let x = rng.range(0, 60); x < view.w; x += rng.range(70, 140)) {
    g.roundRect(x, ground - rng.range(10, 30), rng.range(30, 70), 3, 1.5).fill({ color: 0xffe9c4, alpha: 0.6 });
  }
  // The near bank, a soft grassy edge along the water.
  g.moveTo(-10, ground + WATER_BELOW + 6);
  for (let x = -10; x <= view.w + 10; x += 20) g.lineTo(x, ground + WATER_BELOW + 2 * Math.sin(x * 0.05));
  g.lineTo(view.w + 10, ground + WATER_BELOW + 6).closePath().fill(BANK);
  g.moveTo(-10, ground + WATER_BELOW);
  for (let x = -10; x <= view.w + 10; x += 20) g.lineTo(x, ground + WATER_BELOW + 2 * Math.sin(x * 0.05));
  g.stroke({ color: BANK_LINE, width: 2 });
  for (const [k, garland] of lakeGarlands(view).entries()) {
    g.moveTo(garland.left, garland.y);
    for (let x = garland.left; x <= garland.right; x += 8) g.lineTo(x, garlandY(garland, x));
    g.lineTo(garland.right, garland.y).stroke({ color: wood.line, width: 2 });
    for (const [i, x] of garland.hang.entries()) {
      const top = garlandY(garland, x);
      g.moveTo(x, top).lineTo(x, top + 26).stroke({ color: wood.line, width: 1.5 });
      lantern(g, x, top + 26 + 17 + 4, LANTERNS[(i + k) % LANTERNS.length]);
    }
  }
  for (const [i, { kind, x, y }] of lakePlan(layout, view, ground).entries()) {
    if (kind === 'boat') boat(g, x, y);
    else if (kind === 'float') floating(g, x, y, LANTERNS[i % LANTERNS.length]);
    else if (kind === 'post') post(g, x, y, LANTERNS[i % LANTERNS.length]);
    else if (kind === 'reeds') reeds(g, x, y);
    else firefly(g, x, y);
  }
}

/** A paper lantern 26 across, its glow round it. */
function lantern(g: Graphics, x: number, y: number, c: (typeof LANTERNS)[number]) {
  g.circle(x, y, 22).fill({ color: swatch[c].fill, alpha: 0.22 });
  g.roundRect(x - 11, y - 14, 22, 28, 10).fill(swatch[c].fill).stroke({ color: swatch[c].line, width: 3 });
  g.moveTo(x - 7, y).lineTo(x + 7, y).stroke({ color: swatch[c].line, width: 1.5 });
  g.roundRect(x - 5, y - 17, 10, 4, 1.5).fill(wood.line);
}

/** A lantern floating on the water, with its light reflected under it. */
function floating(g: Graphics, x: number, y: number, c: (typeof LANTERNS)[number]) {
  g.ellipse(x, y + 2, 14, 3.5).fill({ color: swatch[c].light, alpha: 0.8 });
  g.ellipse(x, y - 1, 13, 3).fill(wood.light).stroke({ color: wood.line, width: 1.5 });
  lantern(g, x, y - 13, c);
}

/** A little rowboat moored on the water, with its oar shipped. */
function boat(g: Graphics, x: number, y: number) {
  g.ellipse(x, y + 4, 40, 4).fill({ color: WATER_DEEP, alpha: 0.8 });
  g.moveTo(x - 38, y - 14).lineTo(x + 38, y - 14).lineTo(x + 26, y + 2).lineTo(x - 26, y + 2).closePath()
    .fill(wood.fill).stroke({ color: wood.line, width: 2.5, join: 'round' });
  g.moveTo(x - 34, y - 9).lineTo(x + 34, y - 9).stroke({ color: wood.light, width: 2 });
  g.moveTo(x - 20, y - 30).lineTo(x + 18, y - 4).stroke({ color: wood.line, width: 3, cap: 'round' });
  g.ellipse(x + 20, y - 3, 6, 3).fill(wood.light).stroke({ color: wood.line, width: 1.5 });
}

/** A lantern hung from a crooked post on the bank. */
function post(g: Graphics, x: number, y: number, c: (typeof LANTERNS)[number]) {
  g.moveTo(x - 6, y).lineTo(x - 6, y - 78).lineTo(x + 8, y - 78).stroke({ color: wood.line, width: 4, cap: 'round', join: 'round' });
  g.moveTo(x + 6, y - 78).lineTo(x + 6, y - 66).stroke({ color: wood.line, width: 1.5 });
  lantern(g, x + 6, y - 50, c);
}

/** A clump of reeds by the water: tall blades and two cattails. */
function reeds(g: Graphics, x: number, y: number) {
  for (const [dx, tall, lean] of [[-12, 40, -6], [-4, 48, -2], [4, 44, 3], [12, 36, 8]]) {
    g.moveTo(x + dx, y).quadraticCurveTo(x + dx, y - tall / 2, x + dx + lean, y - tall).stroke({ color: BANK_LINE, width: 2.5, cap: 'round' });
  }
  for (const [dx, top] of [[-4, 48], [12, 36]]) g.roundRect(x + dx - 2, y - top + 2, 5, 12, 2.5).fill(0x8a5a3a);
}

/** A firefly, a small warm glow over the bank. */
function firefly(g: Graphics, x: number, y: number) {
  g.circle(x, y - 8, 8).fill({ color: 0xfff2a8, alpha: 0.35 });
  g.circle(x, y - 8, 3).fill(0xfff2a8);
}
