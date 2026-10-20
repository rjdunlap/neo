import { Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { landButtons, overlaps, petCorner, spotRect, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * RW13 slice 2 (docs/rework/ISLAND-REVAMP.md): Rainbow Meadow as a wildflower meadow, drawn in code over the land's
 * backdrop. Real meadow things only: clover, daisies, poppies and tall grass, bees and butterflies, a rabbit at the
 * edge. Everything is placed by a seeded generator and kept off the field's touch areas, the pet's corner, the corner
 * buttons and the heading, so the drawing never sits under something she taps (and it takes no touches itself).
 */
export type MeadowThing = 'grass' | 'clover' | 'daisy' | 'poppy' | 'butterfly' | 'bee' | 'rabbit';
/** One thing in the meadow: where its feet are and the square it is drawn in. */
export interface MeadowItem {
  kind: MeadowThing;
  x: number;
  y: number;
  rect: Rect;
}

/** What the meadow keeps clear: the field's touch areas, the pet's corner, the corner buttons and the heading. */
export function meadowKeepOut(layout: LandLayout, view: View): Rect[] {
  return [
    ...[layout.host, ...layout.games, ...(layout.sign ? [layout.sign] : [])].map((s) => spotRect(s, layout.box)),
    petCorner(view.h),
    ...landButtons(view.w),
    { x: view.w / 2 - 190, y: 20, w: 380, h: 90 },
  ];
}

/** Where each meadow thing goes for this layout: seeded, so the same view always draws the same meadow. */
export function meadowPlan(layout: LandLayout, view: View, ground: number): MeadowItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(131);
  const items: MeadowItem[] = [];
  /** Up to `n` of a thing `size` across whose feet are at the spot, between `top` and `bottom`. */
  const place = (kind: MeadowThing, n: number, size: number, top: number, bottom: number) => {
    const mine: MeadowItem[] = [];
    for (let i = 0; i < n * 12 && mine.length < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - size, w: size, h: size };
      if (clear(rect) && mine.every((p) => Math.hypot(p.x - x, p.y - y) > size)) mine.push({ kind, x, y, rect });
    }
    items.push(...mine);
  };
  // The rabbit sits at one edge of the meadow, where there is room for it.
  const rabbit = [ground + 70, ground + 150, h - 20]
    .flatMap((y) => [w - 70, 230, w - 160, w / 2].map((x) => ({ kind: 'rabbit' as const, x, y, rect: { x: x - 50, y: y - 95, w: 100, h: 100 } })))
    .find((p) => clear(p.rect));
  // Placed first, so the flowers grow round it.
  if (rabbit) {
    items.push(rabbit);
    keepOut.push(rabbit.rect);
  }
  // Then tall grass, along the meadow's back edge and between the flowers.
  place('grass', 14, 46, ground + 10, h - 6);
  place('clover', 10, 40, ground + 30, h - 10);
  place('daisy', 9, 48, ground + 20, h - 10);
  place('poppy', 7, 50, ground + 20, h - 10);
  // Butterflies and bees over the flowers, in the low sky and the meadow.
  place('butterfly', 3, 56, ground - 100, ground + 140);
  place('bee', 2, 44, ground - 60, h - 20);
  return items;
}

export function drawMeadow(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  const rng = new Rng(17);
  let wing = 0;
  for (const { kind, x, y } of meadowPlan(layout, view, ground)) {
    if (kind === 'grass') grassTuft(g, x, y, rng);
    else if (kind === 'clover') clover(g, x, y);
    else if (kind === 'daisy') daisy(g, x, y);
    else if (kind === 'poppy') poppy(g, x, y);
    else if (kind === 'butterfly') butterfly(g, x, y - 26, wing++);
    else if (kind === 'bee') bee(g, x, y - 20);
    else rabbit(g, x, y, x > view.w / 2 ? -1 : 1);
  }
}

const stem = (g: Graphics, x: number, y: number, height: number) =>
  g.moveTo(x, y).quadraticCurveTo(x - 3, y - height / 2, x, y - height).stroke({ color: swatch.green.line, width: 3, cap: 'round' });

function grassTuft(g: Graphics, x: number, y: number, rng: Rng) {
  for (const lean of [-0.5, -0.15, 0.2, 0.55]) {
    const tall = rng.range(28, 44);
    g.moveTo(x + lean * 10, y).quadraticCurveTo(x + lean * 16, y - tall * 0.6, x + lean * 26, y - tall).stroke({ color: swatch.green.line, width: 3, cap: 'round' });
  }
}

function clover(g: Graphics, x: number, y: number) {
  stem(g, x, y, 20);
  for (const a of [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) g.circle(x + Math.cos(a) * 6, y - 22 + Math.sin(a) * 6, 6).fill(swatch.green.fill);
  g.circle(x + 9, y - 30, 6).fill(swatch.pink.light).stroke({ color: swatch.pink.line, width: 2 });
}

function daisy(g: Graphics, x: number, y: number) {
  stem(g, x, y, 30);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.ellipse(x + Math.cos(a) * 8, y - 32 + Math.sin(a) * 8, 6, 6).fill(0xffffff).stroke({ color: swatch.white.line, width: 1.5 });
  }
  g.circle(x, y - 32, 5).fill(swatch.yellow.fill);
}

function poppy(g: Graphics, x: number, y: number) {
  stem(g, x, y, 34);
  g.circle(x - 7, y - 38, 9).circle(x + 7, y - 38, 9).circle(x, y - 44, 9).fill(swatch.red.fill);
  g.circle(x, y - 39, 4).fill(ink);
}

function butterfly(g: Graphics, x: number, y: number, i: number) {
  const wing = [swatch.orange, swatch.blue, swatch.yellow][i % 3];
  for (const d of [-1, 1]) {
    g.ellipse(x + d * 10, y - 6, 10, 12).fill(wing.fill).stroke({ color: wing.line, width: 2 });
    g.ellipse(x + d * 8, y + 8, 7, 8).fill(wing.light).stroke({ color: wing.line, width: 2 });
  }
  g.roundRect(x - 2.5, y - 14, 5, 28, 2.5).fill(ink);
  g.moveTo(x, y - 14).lineTo(x - 6, y - 22).moveTo(x, y - 14).lineTo(x + 6, y - 22).stroke({ color: ink, width: 1.5 });
}

function bee(g: Graphics, x: number, y: number) {
  g.ellipse(x - 4, y - 12, 7, 9).ellipse(x + 5, y - 12, 7, 9).fill({ color: 0xffffff, alpha: 0.85 });
  g.ellipse(x, y, 13, 9).fill(swatch.yellow.fill).stroke({ color: ink, width: 2 });
  g.rect(x - 3, y - 8, 4, 16).rect(x + 5, y - 7, 3, 14).fill(ink);
}

function rabbit(g: Graphics, x: number, y: number, face: 1 | -1) {
  const fur = swatch.brown;
  g.ellipse(x, y, 34, 7).fill({ color: swatch.green.line, alpha: 0.2 });
  g.ellipse(x - face * 10, y - 24, 30, 24).fill(fur.fill).stroke({ color: fur.line, width: 3 });
  g.circle(x - face * 38, y - 22, 9).fill(0xffffff).stroke({ color: swatch.white.line, width: 2 });
  g.ellipse(x + face * 10, y - 72, 7, 22).ellipse(x + face * 24, y - 70, 7, 22).fill(fur.fill).stroke({ color: fur.line, width: 3 });
  g.ellipse(x + face * 10, y - 72, 3, 14).ellipse(x + face * 24, y - 70, 3, 14).fill(swatch.pink.light);
  g.circle(x + face * 18, y - 46, 17).fill(fur.fill).stroke({ color: fur.line, width: 3 });
  g.circle(x + face * 24, y - 50, 3).fill(ink);
  g.circle(x + face * 33, y - 44, 3).fill(swatch.pink.fill);
}
