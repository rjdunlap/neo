import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 3 (docs/rework/ISLAND-REVAMP.md): Counting Cove as a marsh where a river meets the sea, drawn in code over
 * the land's backdrop. The fresh side (left, upstream) has the pond's lily pads and the frogs, since frogs keep to
 * fresh water; the mouth (right) has the sea on the horizon and a mudflat; reeds, cattails, ducks, a heron and
 * dragonflies stand across the marsh. Like the meadow, everything is seeded and kept off every touch area, the pet's
 * corner, the corner buttons and the heading, and it takes no touches itself.
 */
export type CoveThing = 'reeds' | 'cattail' | 'lilypad' | 'frog' | 'mudflat' | 'duck' | 'heron' | 'dragonfly';
/** One thing in the marsh: where its feet are and the box it is drawn in. */
export interface CoveItem {
  kind: CoveThing;
  x: number;
  y: number;
  rect: Rect;
}

/** Where the fresh side ends: frogs and lily pads stay left of it, the mudflat right of the mouth. */
export const freshEdge = (view: View) => view.w * 0.5;
export const mouthEdge = (view: View) => view.w * 0.58;

/** Where each marsh thing goes for this layout: seeded, so the same view always draws the same marsh. */
export function covePlan(layout: LandLayout, view: View, ground: number): CoveItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(139);
  const items: CoveItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `left`–`right` and `top`–`bottom`. */
  const place = (kind: CoveThing, n: number, size: number, tall: number, left: number, right: number, top: number, bottom: number) => {
    for (let i = 0, placed = 0; i < n * 14 && placed < n; i++) {
      const x = rng.range(left + size / 2, right - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      if (!clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else: what is placed first (the big things) the rest grow round.
      keepOut.push(rect);
      placed++;
    }
  };
  // The mudflat at the river's mouth and the heron wading at the marsh's edge come first.
  place('mudflat', 2, 150, 40, mouthEdge(view), w, ground + 30, h - 10);
  place('heron', 1, 80, 124, 0, w, ground + 80, h - 10);
  place('frog', 2, 40, 34, 0, freshEdge(view), ground + 40, h - 10);
  place('duck', 2, 60, 40, 0, w, ground + 30, h - 10);
  place('lilypad', 5, 54, 24, 0, freshEdge(view), ground + 30, h - 10);
  place('cattail', 7, 30, 76, 0, w, ground + 20, h - 6);
  place('reeds', 10, 40, 58, 0, w, ground + 10, h - 6);
  place('dragonfly', 3, 56, 30, 0, w, ground - 90, ground + 150);
  return items;
}

export function drawCove(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  // The sea on the horizon past the river's mouth, under the low hills' edge.
  const sea = mouthEdge(view);
  g.moveTo(sea, ground).quadraticCurveTo(sea + 60, ground - 26, view.w, ground - 30).lineTo(view.w, ground).closePath().fill(swatch.blue.light);
  g.moveTo(sea + 40, ground - 10).lineTo(sea + 90, ground - 10).moveTo(view.w - 110, ground - 18).lineTo(view.w - 50, ground - 18).stroke({ color: 0xffffff, width: 3, cap: 'round' });
  const rng = new Rng(23);
  for (const { kind, x, y } of covePlan(layout, view, ground)) {
    if (kind === 'reeds') reeds(g, x, y, rng);
    else if (kind === 'cattail') cattail(g, x, y);
    else if (kind === 'lilypad') lilypad(g, x, y, rng);
    else if (kind === 'frog') frog(g, x, y);
    else if (kind === 'mudflat') mudflat(g, x, y);
    else if (kind === 'duck') duck(g, x, y, x > view.w / 2 ? -1 : 1);
    else if (kind === 'heron') heron(g, x, y, x > view.w / 2 ? -1 : 1);
    else dragonfly(g, x, y - 15);
  }
}

function reeds(g: Graphics, x: number, y: number, rng: Rng) {
  for (const lean of [-0.6, -0.2, 0.15, 0.5]) {
    const tall = rng.range(40, 58);
    g.moveTo(x + lean * 12, y).quadraticCurveTo(x + lean * 14, y - tall * 0.6, x + lean * 22, y - tall).stroke({ color: swatch.green.line, width: 3, cap: 'round' });
  }
}

function cattail(g: Graphics, x: number, y: number) {
  g.moveTo(x, y).quadraticCurveTo(x - 4, y - 40, x, y - 74).stroke({ color: swatch.green.line, width: 3, cap: 'round' });
  g.moveTo(x, y).quadraticCurveTo(x + 10, y - 26, x + 14, y - 44).stroke({ color: swatch.green.line, width: 3, cap: 'round' });
  g.roundRect(x - 6, y - 64, 12, 26, 6).fill(swatch.brown.fill).stroke({ color: swatch.brown.line, width: 2 });
}

function lilypad(g: Graphics, x: number, y: number, rng: Rng) {
  // A round pad seen from the bank: an ellipse with a notch cut to its middle, on a little ring of pond water.
  g.ellipse(x, y - 12, 27, 11).fill(swatch.blue.light);
  const notch = rng.range(-0.5, 0.5) - Math.PI / 2;
  g.moveTo(x, y - 12);
  for (let i = 0; i <= 24; i++) {
    const a = notch + 0.3 + (i / 24) * (Math.PI * 2 - 0.6);
    g.lineTo(x + Math.cos(a) * 21, y - 12 + Math.sin(a) * 8);
  }
  g.closePath().fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 2 });
  if (rng.next() < 0.4) g.circle(x + 8, y - 15, 5).fill(swatch.pink.light).stroke({ color: swatch.pink.line, width: 1.5 });
}

function frog(g: Graphics, x: number, y: number) {
  const skin = swatch.green;
  g.ellipse(x, y - 12, 18, 12).fill(skin.fill).stroke({ color: skin.line, width: 2.5 });
  for (const d of [-1, 1]) {
    g.circle(x + d * 8, y - 26, 6).fill(skin.fill).stroke({ color: skin.line, width: 2 });
    g.circle(x + d * 8, y - 27, 2.5).fill(ink);
    g.ellipse(x + d * 16, y - 2, 7, 3).fill(skin.line);
  }
  g.moveTo(x - 6, y - 14).quadraticCurveTo(x, y - 10, x + 6, y - 14).stroke({ color: skin.line, width: 2, cap: 'round' });
}

function mudflat(g: Graphics, x: number, y: number) {
  g.ellipse(x, y - 18, 72, 18).fill(swatch.brown.light).stroke({ color: swatch.brown.line, width: 2, alpha: 0.5 });
  // Little bird tracks and shell bits on the mud.
  for (const [dx, dy] of [[-30, -18], [-14, -22], [4, -16], [22, -20]]) {
    g.moveTo(x + dx, y + dy).lineTo(x + dx - 4, y + dy - 5).moveTo(x + dx, y + dy).lineTo(x + dx, y + dy - 6).moveTo(x + dx, y + dy).lineTo(x + dx + 4, y + dy - 5);
  }
  g.stroke({ color: swatch.brown.line, width: 1.5, cap: 'round' });
  g.circle(x + 44, y - 14, 4).circle(x - 50, y - 20, 3).fill(0xffffff);
}

function duck(g: Graphics, x: number, y: number, face: 1 | -1) {
  g.ellipse(x, y - 4, 30, 6).fill({ color: swatch.blue.light, alpha: 0.9 });
  g.ellipse(x - face * 4, y - 14, 22, 12).fill(swatch.brown.light).stroke({ color: swatch.brown.line, width: 2.5 });
  g.circle(x + face * 14, y - 30, 10).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 2.5 });
  g.circle(x + face * 17, y - 32, 2.2).fill(ink);
  g.ellipse(x + face * 26, y - 28, 7, 3.5).fill(swatch.yellow.fill).stroke({ color: swatch.orange.line, width: 1.5 });
}

function heron(g: Graphics, x: number, y: number, face: 1 | -1) {
  const legs = swatch.yellow.line;
  g.moveTo(x - 4, y).lineTo(x - 2, y - 52).moveTo(x + 6, y).lineTo(x + 4, y - 52).stroke({ color: legs, width: 3, cap: 'round' });
  g.ellipse(x, y - 66, 26, 16).fill(swatch.white.fill).stroke({ color: swatch.white.line, width: 2.5 });
  g.ellipse(x - face * 14, y - 70, 16, 9).fill(0xcfd8e4);
  g.moveTo(x + face * 16, y - 74).quadraticCurveTo(x + face * 34, y - 92, x + face * 22, y - 110).stroke({ color: swatch.white.line, width: 8, cap: 'round' });
  g.moveTo(x + face * 16, y - 74).quadraticCurveTo(x + face * 34, y - 92, x + face * 22, y - 110).stroke({ color: swatch.white.fill, width: 5, cap: 'round' });
  g.circle(x + face * 22, y - 112, 8).fill(swatch.white.fill).stroke({ color: swatch.white.line, width: 2 });
  g.circle(x + face * 24, y - 114, 2).fill(ink);
  g.moveTo(x + face * 28, y - 113).lineTo(x + face * 44, y - 110).lineTo(x + face * 28, y - 108).closePath().fill(swatch.yellow.fill);
}

function dragonfly(g: Graphics, x: number, y: number) {
  for (const d of [-1, 1]) {
    g.ellipse(x + d * 12, y - 4, 13, 4).ellipse(x + d * 10, y + 4, 11, 3.5).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ color: swatch.blue.line, width: 1.2 });
  }
  g.roundRect(x - 2, y - 6, 4, 26, 2).fill(swatch.blue.fill);
  g.circle(x, y - 8, 4).fill(swatch.blue.line);
}
