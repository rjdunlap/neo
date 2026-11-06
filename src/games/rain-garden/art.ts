import { Container, Graphics } from 'pixi.js';
import { frogArt, turtleArt } from '../../art/animals';
import { CRITTERS, Critter } from '../../art/critter';
import { ink, swatch } from '../../art/palette';
import type { Box, Friend, Surface, Trial } from './logic';

const WATER = swatch.blue;
const STONE = { fill: 0xa8a8b4, line: 0x55556a, light: 0xc8c8d2 };
const SOIL = { fill: 0xb98a5e, line: swatch.brown.line, light: 0xe2c49e };

/** A dashed ellipse: a pocket or a pond slot, so "a place a drop can be" reads without colour. */
export function dashedEllipse(g: Graphics, x: number, y: number, rx: number, ry: number, color: number, width = 3) {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.55) / n) * Math.PI * 2;
    g.moveTo(x + Math.cos(a0) * rx, y + Math.sin(a0) * ry);
    for (let k = 1; k <= 4; k++) { const a = a0 + ((a1 - a0) * k) / 4; g.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry); }
  }
  g.stroke({ width, color, cap: 'round' });
}

/** The cloud, drawn around its middle at `w` by `h`. */
export function cloudArt(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  const u = w / 260, v = h / 140;
  const puffs: [number, number, number][] = [[-80, 14, 42], [-30, -18, 56], [34, -24, 54], [86, 6, 40], [0, 20, 48]];
  for (const [dx, dy, r] of puffs) g.ellipse(dx * u, dy * v, r * Math.min(u * 1.1, 1.6), r * v).fill(0xe8eef6);
  g.roundRect(-w / 2 + 14, 4 * v, w - 28, 50 * v, 25 * v).fill(0xe8eef6);
  for (const [dx, dy, r] of puffs) g.ellipse(dx * u, dy * v - 6, r * Math.min(u * 1.1, 1.6) - 6, r * v - 6).fill(0xffffff);
  g.roundRect(-w / 2 + 20, 0, w - 40, 44 * v, 22 * v).fill(0xffffff);
  // A sleepy face so the cloud is a friend, not weather.
  g.moveTo(-26, 0).quadraticCurveTo(-18, 8, -10, 0).moveTo(10, 0).quadraticCurveTo(18, 8, 26, 0).stroke({ width: 4, color: ink, cap: 'round' });
  g.moveTo(-8, 18).quadraticCurveTo(0, 26, 8, 18).stroke({ width: 4, color: ink, cap: 'round' });
  c.addChild(g);
  return c;
}

/** The rewind badge shown on the cloud while a fresh garden slides in. */
export function rewindArt(): Graphics {
  const g = new Graphics().circle(0, 0, 30).fill(swatch.yellow.light).stroke({ width: 4, color: swatch.yellow.line });
  g.arc(0, 0, 16, -Math.PI * 0.2, Math.PI * 1.35).stroke({ width: 5, color: ink, cap: 'round' });
  g.poly([-14, -14, -2, -18, -10, -4]).fill(ink);
  return g;
}

/**
 * One patch, drawn around its middle: grass on top, then a soil cutaway with its two dashed pockets, or a hard grey stone
 * slab with no pockets, so stone's "holds none" shows before it rains. `pockets` are relative to the patch's middle.
 */
export function patchArt(surface: Surface, w: number, h: number, pockets: { x: number; y: number; w: number; h: number }[], dir: 1 | -1): Graphics {
  const g = new Graphics();
  const tilt = 22 * dir; // the low side is toward the arrow
  const l = -w / 2, r = w / 2, t = -h / 2, b = h / 2;
  const top = (x: number) => t + 16 + ((x - l) / w - 0.5) * tilt;
  const s = surface === 'soil' ? SOIL : STONE;
  g.poly([l, top(l), r, top(r), r, b, l, b]).fill(s.fill).stroke({ width: 5, color: s.line, join: 'round' });
  if (surface === 'soil') {
    for (const [fx, fy] of [[0.12, 0.8], [0.5, 0.88], [0.86, 0.78], [0.32, 0.55], [0.68, 0.5]]) g.circle(l + fx * w, t + fy * h, 5).fill(SOIL.light);
    for (const p of pockets) {
      g.ellipse(p.x, p.y, p.w / 2, p.h / 2).fill({ color: 0x8a6240, alpha: 0.45 });
      dashedEllipse(g, p.x, p.y, p.w / 2, p.h / 2, 0xfff4e3, 4);
    }
    // Grass and two little sprouts on top.
    g.poly([l, top(l) - 14, r, top(r) - 14, r, top(r) + 4, l, top(l) + 4]).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    for (const fx of [0.2, 0.78]) {
      const x = l + fx * w, y = top(x) - 14;
      g.moveTo(x, y).lineTo(x, y - 22).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
      g.ellipse(x - 9, y - 22, 9, 5).ellipse(x + 9, y - 24, 9, 5).fill(swatch.green.fill);
    }
  } else {
    // Slab seams.
    g.moveTo(l + w * 0.34, top(l + w * 0.34) + 2).lineTo(l + w * 0.3, b - 2).moveTo(l + w * 0.7, top(l + w * 0.7) + 2).lineTo(l + w * 0.74, b - 2)
      .moveTo(l + 4, t + h * 0.62).lineTo(r - 4, t + h * 0.6).stroke({ width: 3, color: STONE.line, alpha: 0.6 });
    g.poly([l, top(l), r, top(r), r, top(r) + 10, l, top(l) + 10]).fill(STONE.light);
  }
  return g;
}

/** The fixed downhill arrow. */
export function arrowArt(a: { x1: number; y1: number; x2: number; y2: number }): Graphics {
  const g = new Graphics();
  const dx = a.x2 - a.x1, dy = a.y2 - a.y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hx = a.x2 - ux * 30, hy = a.y2 - uy * 30;
  g.moveTo(a.x1, a.y1).lineTo(hx, hy).stroke({ width: 26, color: WATER.line, cap: 'round' });
  g.moveTo(a.x1, a.y1).lineTo(hx, hy).stroke({ width: 16, color: WATER.light, cap: 'round' });
  g.poly([a.x2, a.y2, hx - uy * 30, hy + ux * 30, hx + uy * 30, hy - ux * 30]).fill(WATER.light).stroke({ width: 4, color: WATER.line, join: 'round' });
  return g;
}

/** The pond tray with four dashed slots. */
export function pondArt(pond: Box, slots: Box[]): Graphics {
  const g = new Graphics();
  g.roundRect(pond.x - pond.w / 2, pond.y - pond.h / 2, pond.w, pond.h, pond.h / 2).fill(0xbfe3ff).stroke({ width: 5, color: WATER.line });
  for (const s of slots) dashedEllipse(g, s.x, s.y, s.w / 2 - 2, s.h / 2 - 6, WATER.line, 3);
  // Lily pad.
  g.circle(pond.x + pond.w / 2 - 22, pond.y + pond.h / 2 - 12, 16).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  return g;
}

/** A drop of rain: big, blue, dark outline. */
export function dropArt(size = 44): Graphics {
  const u = size / 44;
  const g = new Graphics();
  g.moveTo(0, -24 * u).bezierCurveTo(8 * u, -10 * u, 18 * u, 0, 18 * u, 8 * u).bezierCurveTo(18 * u, 20 * u, 10 * u, 26 * u, 0, 26 * u)
    .bezierCurveTo(-10 * u, 26 * u, -18 * u, 20 * u, -18 * u, 8 * u).bezierCurveTo(-18 * u, 0, -8 * u, -10 * u, 0, -24 * u)
    .fill(WATER.fill).stroke({ width: 4 * u, color: ink, alpha: 0.75 });
  g.ellipse(-6 * u, 8 * u, 4 * u, 7 * u).fill({ color: 0xffffff, alpha: 0.7 });
  return g;
}

/** Motion lines that ride behind a drop on the arrow. */
export function motionArt(): Graphics {
  return new Graphics().moveTo(-34, -10).lineTo(-20, -10).moveTo(-38, 2).lineTo(-22, 2).moveTo(-34, 14).lineTo(-20, 14).stroke({ width: 4, color: WATER.line, cap: 'round' });
}

/** A ripple ring where a drop settles in the pond. */
export function rippleArt(r: number): Graphics {
  return new Graphics().ellipse(0, 0, r, r * 0.45).stroke({ width: 3, color: WATER.line, alpha: 0.8 });
}

/** A ground tile: a big square with a little picture of the ground. */
export function tileArt(surface: Surface, size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 22).fill(0xffffff).stroke({ width: 5, color: surface === 'soil' ? SOIL.line : STONE.line }));
  const pic = patchArt(surface, size * 0.72, size * 0.5, surface === 'soil' ? [{ x: -size * 0.14, y: size * 0.06, w: 30, h: 22 }, { x: size * 0.14, y: size * 0.06, w: 30, h: 22 }] : [], 1);
  pic.y = 6;
  c.addChild(pic);
  return c;
}

/** Level 3's kept first trial: a little picture of that patch and pond, with its drops. */
export function bookmarkArt(t: Trial, w: number, h: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 16).fill(0xfffdf4).stroke({ width: 5, color: swatch.purple.line }));
  // A ribbon corner so it reads as "kept".
  c.addChild(new Graphics().poly([w / 2 - 44, -h / 2, w / 2 - 20, -h / 2, w / 2 - 20, -h / 2 + 40, w / 2 - 32, -h / 2 + 30, w / 2 - 44, -h / 2 + 40]).fill(swatch.purple.fill));
  const pw = w * 0.5, ph = h * 0.4;
  const pockets = t.surface === 'soil' ? [{ x: -pw * 0.22, y: 4, w: 30, h: 22 }, { x: pw * 0.22, y: 4, w: 30, h: 22 }] : [];
  const patch = patchArt(t.surface, pw, ph, pockets, 1);
  patch.position.set(-w * 0.2, -h * 0.16);
  c.addChild(patch);
  pockets.slice(0, t.stored).forEach((p) => { const d = dropArt(22); d.position.set(patch.x + p.x, patch.y + p.y); c.addChild(d); });
  const pond = new Graphics().roundRect(-w * 0.42, h * 0.16, w * 0.84, h * 0.26, h * 0.13).fill(0xbfe3ff).stroke({ width: 3, color: WATER.line });
  c.addChild(pond);
  for (let i = 0; i < t.pond; i++) { const d = dropArt(22); d.position.set(-w * 0.3 + i * w * 0.2, h * 0.29); c.addChild(d); }
  return c;
}

/** The pond friend, sitting at the pond's edge. */
export function friendArt(f: Friend): Container {
  if (f === 'frog') { const c = frogArt(); c.scale.set(0.9); return c; }
  if (f === 'turtle') { const c = new Container(); const t = turtleArt(70); t.rotation = -0.5; t.y = -18; c.addChild(t); return c; }
  const c = new Container();
  const d = new Critter(CRITTERS.duck);
  d.scale.set(0.26);
  c.addChild(d);
  return c;
}

/** Level 4's Check: a big tick on a wooden sign, drawn around its middle. */
export function checkArt(size: number): Container {
  const c = new Container();
  const s = size / 120;
  const g = new Graphics();
  g.roundRect(-6 * s, 20 * s, 12 * s, 40 * s, 4 * s).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
  g.roundRect(-size / 2, -size / 2, size, size * 0.78, 20 * s).fill(0xe8c48e).stroke({ width: 5, color: swatch.brown.line });
  for (const y of [-0.22, 0.02]) g.moveTo(-size / 2 + 10, y * size).lineTo(size / 2 - 10, y * size).stroke({ width: 2, color: swatch.brown.line, alpha: 0.35 });
  g.moveTo(-28 * s, -14 * s).lineTo(-8 * s, 8 * s).lineTo(32 * s, -36 * s).stroke({ width: 16 * s, color: swatch.green.line, cap: 'round', join: 'round' });
  g.moveTo(-28 * s, -14 * s).lineTo(-8 * s, 8 * s).lineTo(32 * s, -36 * s).stroke({ width: 9 * s, color: swatch.green.fill, cap: 'round', join: 'round' });
  c.addChild(g);
  return c;
}

/** A little leaf, the marked bed's marker. */
function leafMark(g: Graphics, x: number, y: number, r: number) {
  g.moveTo(x - r, y).quadraticCurveTo(x - r * 0.2, y - r, x + r, y - r * 0.3).quadraticCurveTo(x + r * 0.2, y + r * 0.8, x - r, y)
    .fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  g.moveTo(x - r * 0.8, y).lineTo(x + r * 0.5, y - r * 0.3).stroke({ width: 2, color: swatch.green.line });
}

/**
 * A need sign, drawn around its middle: dashed drop outlines for what is needed (the bed's two over a leaf, or the pond's
 * one with a plus), filled as drops settle, with a tick once met. A picture, not a target.
 */
export function needSignArt(kind: 'bed' | 'pond', filled: number, met: boolean, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-5, h / 2 - 12, 10, 26, 3).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
  g.roundRect(-w / 2, -h / 2, w, h - 8, 16).fill(0xfffdf4).stroke({ width: 5, color: met ? swatch.green.line : swatch.brown.line });
  c.addChild(g);
  const outlines = kind === 'bed' ? [-26, 26] : [-14];
  outlines.forEach((x, i) => {
    if (i < filled) { const d = dropArt(40); d.position.set(x, -10); c.addChild(d); return; }
    const o = new Graphics();
    o.moveTo(x, -34).bezierCurveTo(x + 7, -22, x + 16, -14, x + 16, -6).bezierCurveTo(x + 16, 6, x + 9, 12, x, 12)
      .bezierCurveTo(x - 9, 12, x - 16, 6, x - 16, -6).bezierCurveTo(x - 16, -14, x - 7, -22, x, -34);
    o.stroke({ width: 4, color: WATER.line, alpha: 0.9 });
    // A dashed look: white breaks over the outline.
    for (const t of [0.15, 0.4, 0.65, 0.9]) o.circle(x + Math.sin(t * Math.PI * 2) * 16, -10 + Math.cos(t * Math.PI * 2) * 18, 3).fill(0xfffdf4);
    c.addChild(o);
  });
  const extra = new Graphics();
  if (kind === 'bed') leafMark(extra, 0, h / 2 - 28, 14);
  else extra.moveTo(18, -10).lineTo(42, -10).moveTo(30, -22).lineTo(30, 2).stroke({ width: 6, color: ink, cap: 'round' });
  if (met) {
    extra.circle(w / 2 - 14, -h / 2 + 12, 18).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    extra.moveTo(w / 2 - 23, -h / 2 + 12).lineTo(w / 2 - 16, -h / 2 + 19).lineTo(w / 2 - 4, -h / 2 + 4).stroke({ width: 4, color: 0xffffff, cap: 'round', join: 'round' });
  }
  c.addChild(extra);
  return c;
}
