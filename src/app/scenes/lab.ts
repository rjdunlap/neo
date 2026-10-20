import { Graphics } from 'pixi.js';
import { ink } from '../../art/palette';
import type { BackdropStyle } from '../../art/scenery';
import { landButtons, overlaps, type LandLayout, type Rect } from '../../content/lands';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { meadowKeepOut } from './meadow';

/**
 * RW13 slice 10 (docs/rework/ISLAND-REVAMP.md): Tinker Lab as a workshop in a cave mouth, drawn in code. The location
 * swaps the land's day sky for the cave's own rock (`LAB_BACKDROP`: a dark ceiling over a sandy stone floor, no sun or
 * clouds to tap; `classic/` keeps its day), and over it stalactites and roosting bats hang from the ceiling, glow-worms
 * (real cave insects) light it with their dangling threads, and daylight shows through the cave's mouth at the back. On
 * the floor she plays on stand the workshop's benches and tools (human-made), a crate or two, lanterns, a cave pool and
 * stalagmites. Like the meadow, everything placed is seeded and kept off every touch area, the pet's corner, the corner
 * buttons and the heading, and it takes no touches itself.
 */
export type LabThing = 'pool' | 'bench' | 'crate' | 'lantern' | 'gears' | 'stalagmite';
/** One thing in the lab: where its feet are and the box it is drawn in. */
export interface LabItem {
  kind: LabThing;
  x: number;
  y: number;
  rect: Rect;
}

/** The cave the location draws instead of the land's day sky: rock overhead, a light floor that keeps the field readable. */
export const LAB_BACKDROP: BackdropStyle = {
  sky: [0x2b2630, 0x5b5058],
  hills: [0x463e4a, 0x5a5058, 0xcdb894],
  horizon: 0.4,
  clouds: 0,
  sun: false,
  seed: 151,
};

/** The heading's colour over the dark ceiling. */
export const LAB_HEADING = 0xfff6e0;

/** The backdrop's far hills (here the cave's back wall) reach up to this far above the ground line (`Backdrop.resize`). */
const FAR_HILLS = 168;
/** The heading's box, as `meadowKeepOut` keeps it clear. */
const headingBox = (view: View): Rect => ({ x: view.w / 2 - 190, y: 20, w: 380, h: 90 });

export interface LabCeiling {
  /** Stalactites: where each hangs from and how long it is, with its box. */
  stalactites: { x: number; len: number; rect: Rect }[];
  /** Roosting bats, hanging upside down, with the box each is drawn in. */
  bats: { x: number; y: number; rect: Rect }[];
  /** Glow-worm lights: each light's centre and the length of its thread above it. */
  glowworms: { x: number; y: number; thread: number }[];
}

/**
 * What hangs from the ceiling: stalactites, a few bats roosting among them, and glow-worms. Visual only, behind the
 * field; all of it stays off the corner buttons and the heading and above the cave's back wall.
 */
export function labCeiling(view: View, ground: number): LabCeiling {
  const keepOut = [...landButtons(view.w), headingBox(view)];
  const bottom = ground - FAR_HILLS - 4;
  const clear = (b: Rect) => b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= bottom && !keepOut.some((k) => overlaps(b, k));
  const rng = new Rng(191);
  const stalactites: LabCeiling['stalactites'] = [];
  for (let i = 0; i < 120 && stalactites.length < 9; i++) {
    const x = rng.range(20, view.w - 20);
    const len = rng.range(36, 96);
    const half = len * 0.16 + 4;
    const rect = { x: x - half, y: 0, w: 2 * half, h: len };
    if (!clear(rect)) continue;
    stalactites.push({ x, len, rect });
    keepOut.push(rect);
  }
  const bats: LabCeiling['bats'] = [];
  for (let i = 0; i < 80 && bats.length < 3; i++) {
    const x = rng.range(20, view.w - 20);
    const rect = { x: x - 11, y: 0, w: 22, h: 40 };
    if (!clear(rect)) continue;
    bats.push({ x, y: 0, rect });
    keepOut.push(rect);
  }
  const glowworms: LabCeiling['glowworms'] = [];
  for (let i = 0; i < 240 && glowworms.length < 30; i++) {
    const x = rng.range(8, view.w - 8);
    const thread = rng.range(10, 40);
    const y = rng.range(thread + 4, bottom - 6);
    if (!clear({ x: x - 5, y: y - thread, w: 10, h: thread + 5 })) continue;
    if (glowworms.some((p) => Math.hypot(p.x - x, p.y - y) < 22)) continue;
    glowworms.push({ x, y, thread });
  }
  return { stalactites, bats, glowworms };
}

/** The cave's mouth in its back wall: daylight under a rock arch, visual only, standing on the floor's far edge. */
export function labMouth(view: View, ground: number): Rect {
  const h = Math.min(150, ground + 6 - 144);
  const w = Math.round(h * 1.5);
  const x = Math.min(view.w - 160 - w, Math.max(view.w * 0.68 - w / 2, view.w / 2 + 40));
  return { x, y: ground + 6 - h, w, h };
}

/** Where each lab thing goes for this layout: seeded, so the same view always draws the same lab. */
export function labPlan(layout: LandLayout, view: View, ground: number): LabItem[] {
  const { w, h } = view;
  const keepOut = meadowKeepOut(layout, view);
  const clear = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h && !keepOut.some((k) => overlaps(r, k));
  const rng = new Rng(193);
  const items: LabItem[] = [];
  /** Up to `n` of a thing `size` wide and `tall` high whose feet are between `top` and `bottom`, in up to `tries` tries. */
  const place = (kind: LabThing, n: number, size: number, tall: number, top: number, bottom: number, tries = n * 14) => {
    for (let i = 0, placed = 0; i < tries && placed < n; i++) {
      const x = rng.range(size / 2, w - size / 2);
      const y = rng.range(top, bottom);
      const rect = { x: x - size / 2, y: y - tall, w: size, h: tall };
      // On the floor, in front of the back wall.
      if (rect.y <= ground + 4 || !clear(rect)) continue;
      items.push({ kind, x, y, rect });
      // Nothing stands on anything else.
      keepOut.push(rect);
      placed++;
    }
  };
  const field = ground + 40;
  // The widest things first, searched for longest: the pool (one is the cave's), then the benches, drawn smaller (75% or
  // 55%) where a full floor has no room for a big one; the rest fill the gaps.
  const count = (kind: LabThing) => items.filter((p) => p.kind === kind).length;
  for (const s of [1, 0.75, 0.55]) if (!count('pool')) place('pool', 1, 120 * s, 36 * s, field, h - 8, 400);
  for (const s of [1, 0.75, 0.55]) if (count('bench') < 2) place('bench', 2 - count('bench'), 100 * s, 66 * s, field, h - 8, 300);
  place('lantern', 2, 28, 58, field, h - 8);
  place('crate', 2, 46, 40, field, h - 8);
  place('gears', 2, 40, 30, field, h - 8);
  place('stalagmite', 3, 34, 52, field, h - 8);
  return items;
}

const ROCK = 0x6a5e66;
const ROCK_LINE = 0x352e38;
const WOOD = 0xb07a48;
const WOOD_LINE = 0x5a3a22;
const METAL = 0xa8b4bc;
const METAL_LINE = 0x4e5a62;
const GLOW = 0x9ff5e8;
const LAMP = 0xffe08a;

export function drawLab(g: Graphics, layout: LandLayout, view: View, ground: number) {
  g.clear();
  mouth(g, labMouth(view, ground));
  const ceiling = labCeiling(view, ground);
  for (const s of ceiling.stalactites) stalactite(g, s.x, s.len);
  for (const b of ceiling.bats) roostingBat(g, b.x);
  for (const w of ceiling.glowworms) glowworm(g, w.x, w.y, w.thread);
  // A worn line where the floor meets the back wall.
  g.rect(-10, ground + 4, view.w + 20, 8).fill(0xb8a27e);
  for (const { kind, x, y, rect } of labPlan(layout, view, ground)) {
    if (kind === 'pool') scaled(g, x, y, rect.w / 120, pool);
    else if (kind === 'bench') scaled(g, x, y, rect.w / 100, bench);
    else if (kind === 'lantern') lantern(g, x, y);
    else if (kind === 'crate') crate(g, x, y);
    else if (kind === 'gears') gears(g, x, y);
    else stalagmite(g, x, y);
  }
}

/** Draws `draw` (made at full size with its feet at the origin) at `x, y`, scaled by `s`. */
function scaled(g: Graphics, x: number, y: number, s: number, draw: (g: Graphics, x: number, y: number) => void) {
  g.save().translateTransform(x, y).scaleTransform(s, s);
  draw(g, 0, 0);
  g.restore();
}

/** The cave's mouth: a rock arch with daylight through it, a green hill and a tree outside. */
function mouth(g: Graphics, r: Rect) {
  const { x, y, w, h } = r;
  const base = y + h;
  const arch = (inset: number) => {
    g.moveTo(x + inset, base).lineTo(x + inset, y + h * 0.45).quadraticCurveTo(x + inset, y + inset, x + w / 2, y + inset)
      .quadraticCurveTo(x + w - inset, y + inset, x + w - inset, y + h * 0.45).lineTo(x + w - inset, base).closePath();
  };
  arch(-14);
  g.fill(ROCK).stroke({ color: ROCK_LINE, width: 3, join: 'round' });
  arch(0);
  g.fill(0xcdeef0);
  g.moveTo(x, base).quadraticCurveTo(x + w * 0.35, base - h * 0.42, x + w * 0.7, base - h * 0.2).quadraticCurveTo(x + w * 0.88, base - h * 0.12, x + w, base - h * 0.16)
    .lineTo(x + w, base).closePath().fill(0x9fd88a);
  const tx = x + w * 0.3;
  const ty = base - h * 0.32;
  g.rect(tx - 3, ty - 4, 6, 18).fill(0x8a6040);
  g.circle(tx, ty - 14, 16).fill(0x6cbf6a);
  // The light from outside falling in on the floor.
  g.moveTo(x + 6, base).lineTo(x + w - 6, base).lineTo(x + w + 30, base + 10).lineTo(x - 30, base + 10).closePath().fill({ color: 0xfff6d0, alpha: 0.35 });
  arch(0);
  g.stroke({ color: ROCK_LINE, width: 3, join: 'round' });
}

/** A stalactite: a long rock point hanging from the ceiling, with a drip at its tip. */
function stalactite(g: Graphics, x: number, len: number) {
  const half = len * 0.16 + 4;
  g.moveTo(x - half, -2).quadraticCurveTo(x - half * 0.5, len * 0.5, x, len).quadraticCurveTo(x + half * 0.4, len * 0.5, x + half, -2).closePath()
    .fill(0x8a7e86).stroke({ color: ROCK_LINE, width: 2, join: 'round' });
  g.moveTo(x - half * 0.4, 4).quadraticCurveTo(x - half * 0.2, len * 0.4, x - 1, len * 0.75).stroke({ color: 0xb0a6aa, width: 2, cap: 'round' });
  g.circle(x, len + 3, 2.5).fill(0xbfe8f0);
}

/** A bat roosting: hanging by its feet from the ceiling, wrapped in its wings, upside down. */
function roostingBat(g: Graphics, x: number) {
  const body = 0x3a3048;
  const line = 0xa898cc;
  for (const d of [-3, 3]) g.moveTo(x + d, 0).lineTo(x + d, 8).stroke({ color: line, width: 1.5 });
  g.moveTo(x, 8).quadraticCurveTo(x - 11, 12, x - 9, 26).quadraticCurveTo(x - 6, 34, x, 32).quadraticCurveTo(x + 6, 34, x + 9, 26).quadraticCurveTo(x + 11, 12, x, 8).closePath()
    .fill(body).stroke({ color: line, width: 1.5, join: 'round' });
  // Its little head at the bottom, ears pointing down.
  g.circle(x, 33, 5).fill(body).stroke({ color: line, width: 1.2 });
  for (const d of [-3, 3]) g.moveTo(x + d - 2, 36).lineTo(x + d * 1.3, 40).lineTo(x + d + 2, 36).closePath().fill(body);
  for (const d of [-2, 2]) g.circle(x + d, 32, 1).fill(0xfff3a0);
}

/** A glow-worm: a little blue-green light at the end of the silk thread it lets down from the ceiling. */
function glowworm(g: Graphics, x: number, y: number, thread: number) {
  g.moveTo(x, y - thread).lineTo(x, y).stroke({ color: 0xc8e0e8, width: 1, alpha: 0.5 });
  g.circle(x, y, 7).fill({ color: GLOW, alpha: 0.2 });
  g.circle(x, y, 3.5).fill({ color: GLOW, alpha: 0.5 });
  g.circle(x, y, 1.8).fill(0xe8fffb);
}

/** A still cave pool in the floor, 120 across, stones round its edge and the ceiling's lights in it. */
function pool(g: Graphics, x: number, y: number) {
  const cy = y - 18;
  g.ellipse(x, cy, 60, 18).fill(0x9a8a74);
  g.ellipse(x, cy, 54, 14).fill(0x3d7d8c).stroke({ color: 0x2a5664, width: 2 });
  g.ellipse(x - 12, cy - 3, 22, 4).fill({ color: 0x8fd0d8, alpha: 0.6 });
  for (const [dx, dy] of [[18, 2], [-28, 4], [30, -4]]) g.circle(x + dx, cy + dy, 1.8).fill({ color: GLOW, alpha: 0.8 });
  for (const [dx, dy, s] of [[-58, 2, 7], [56, 4, 8], [-36, 15, 6], [30, 15, 7], [0, 17, 5]]) g.ellipse(x + dx, cy + dy, s, s * 0.7).fill(0x8a7e86).stroke({ color: ROCK_LINE, width: 1.5 });
}

/** A workbench, 100 across: a wooden top on legs, a vise at one end, a hammer, a wrench and a jar of bolts on it, a saw below. */
function bench(g: Graphics, x: number, y: number) {
  const top = y - 44;
  for (const d of [-40, 40]) g.rect(x + d - 4, top, 8, 44).fill(0x8a5c34).stroke({ color: WOOD_LINE, width: 1.5 });
  g.rect(x - 42, y - 16, 84, 5).fill(0x8a5c34).stroke({ color: WOOD_LINE, width: 1.2 });
  g.roundRect(x - 50, top - 8, 100, 12, 3).fill(WOOD).stroke({ color: WOOD_LINE, width: 2 });
  // The vise.
  g.rect(x + 30, top - 22, 14, 14).fill(0x6a8a9a).stroke({ color: METAL_LINE, width: 1.5 });
  g.moveTo(x + 46, top - 15).lineTo(x + 56, top - 15).stroke({ color: METAL_LINE, width: 3, cap: 'round' });
  // A hammer lying on the bench.
  g.moveTo(x - 40, top - 12).lineTo(x - 12, top - 12).stroke({ color: 0xc89a60, width: 4, cap: 'round' });
  g.rect(x - 14, top - 20, 8, 14).fill(METAL).stroke({ color: METAL_LINE, width: 1.5 });
  // A wrench.
  g.moveTo(x - 2, top - 11).lineTo(x + 18, top - 11).stroke({ color: METAL, width: 4, cap: 'round' });
  g.circle(x + 20, top - 11, 5).fill(METAL).stroke({ color: METAL_LINE, width: 1.2 });
  g.circle(x + 22, top - 11, 2).fill(WOOD);
  // A jar of bolts.
  g.roundRect(x + 6, top - 30, 14, 18, 3).fill({ color: 0xdff2f4, alpha: 0.8 }).stroke({ color: METAL_LINE, width: 1.2 });
  for (const [dx, dy] of [[10, -16], [15, -18], [12, -22]]) g.circle(x + dx, top + dy, 2).fill(0x8a949a);
  // A saw on the shelf below.
  g.moveTo(x - 30, y - 20).lineTo(x + 6, y - 24).lineTo(x + 6, y - 19).closePath().fill(METAL).stroke({ color: METAL_LINE, width: 1 });
  g.roundRect(x + 4, y - 26, 12, 8, 2).fill(0xd06a4a).stroke({ color: WOOD_LINE, width: 1 });
}

/** A lantern on a post: a warm light glowing in the dark. */
function lantern(g: Graphics, x: number, y: number) {
  g.rect(x - 2.5, y - 30, 5, 30).fill(0x5a4a3e);
  g.ellipse(x, y, 10, 3).fill(0x5a4a3e);
  const cy = y - 42;
  g.circle(x, cy, 18).fill({ color: LAMP, alpha: 0.22 });
  g.roundRect(x - 9, cy - 12, 18, 24, 4).fill(0xfff2b8).stroke({ color: 0x3e3640, width: 2 });
  g.moveTo(x, cy - 12).lineTo(x, cy + 12).stroke({ color: 0x3e3640, width: 1.5 });
  g.rect(x - 11, cy - 16, 22, 4).fill(0x3e3640);
  g.moveTo(x - 5, cy - 16).quadraticCurveTo(x, cy - 24, x + 5, cy - 16).stroke({ color: 0x3e3640, width: 2 });
}

/** A wooden crate, nailed at the corners. */
function crate(g: Graphics, x: number, y: number) {
  g.rect(x - 22, y - 38, 44, 38).fill(0xc8955a).stroke({ color: WOOD_LINE, width: 2 });
  g.moveTo(x - 22, y - 38).lineTo(x + 22, y).stroke({ color: WOOD_LINE, width: 2 });
  g.moveTo(x - 22, y - 19).lineTo(x + 22, y - 19).stroke({ color: WOOD_LINE, width: 1.2 });
  for (const [dx, dy] of [[-18, -34], [18, -34], [-18, -4], [18, -4]]) g.circle(x + dx, y + dy, 1.5).fill(ink);
}

/** A pile of gears and a spring, the tinkerer's spare parts. */
function gears(g: Graphics, x: number, y: number) {
  gear(g, x - 6, y - 12, 11, 0xd0a848);
  gear(g, x + 10, y - 18, 8, METAL);
  g.moveTo(x + 4, y - 3);
  for (let k = 0; k < 4; k++) g.lineTo(x + 8 + k * 4, y - 9 + (k % 2) * 6);
  g.stroke({ color: METAL_LINE, width: 2, cap: 'round', join: 'round' });
}

function gear(g: Graphics, x: number, y: number, r: number, color: number) {
  const teeth = 8;
  g.moveTo(x + r + 3, y);
  for (let k = 0; k < teeth * 2; k++) {
    const a0 = (k / (teeth * 2)) * Math.PI * 2;
    const a1 = ((k + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : r + 3;
    g.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr).lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
  }
  g.closePath().fill(color).stroke({ color: METAL_LINE, width: 1.5, join: 'round' });
  g.circle(x, y, r * 0.35).fill(0x5a5058);
}

/** A stalagmite rising from the floor. */
function stalagmite(g: Graphics, x: number, y: number) {
  g.moveTo(x - 16, y).quadraticCurveTo(x - 8, y - 26, x - 2, y - 50).quadraticCurveTo(x + 4, y - 28, x + 16, y).closePath()
    .fill(0x9a8e92).stroke({ color: ROCK_LINE, width: 2, join: 'round' });
  g.moveTo(x - 6, y - 4).quadraticCurveTo(x - 4, y - 24, x - 2, y - 40).stroke({ color: 0xc0b6ba, width: 2, cap: 'round' });
}
