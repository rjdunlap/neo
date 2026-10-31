import type { Graphics } from 'pixi.js';
import { ink, swatch } from './palette';

/**
 * The rocky shore's creatures and props ("Tide Pool Friends"), shared by Bubble Beach's location scene and Tide Line. Each
 * draws into a Graphics at its feet; nothing here takes touches.
 */
/** What lives in a rock pool. */
export type PoolLife = 'star' | 'anemone' | 'kelp';

export const ROCK = 0x9a93b0;
export const ROCK_LINE = 0x6f6888;

export function rock(g: Graphics, x: number, y: number) {
  g.moveTo(x - 48, y).quadraticCurveTo(x - 50, y - 30, x - 20, y - 46).quadraticCurveTo(x + 10, y - 56, x + 34, y - 38).quadraticCurveTo(x + 50, y - 22, x + 48, y).closePath().fill(ROCK).stroke({ color: ROCK_LINE, width: 2.5 });
  // Weed along the wet foot, and barnacles crowded on the face.
  g.moveTo(x - 46, y - 4).quadraticCurveTo(x, y - 12, x + 46, y - 4).stroke({ color: 0x5c8a4a, width: 5, cap: 'round' });
  for (const [dx, dy] of [[-22, -30], [-12, -36], [-28, -20], [8, -40], [18, -30], [-4, -26]]) barnacle(g, x + dx, y + dy);
}

export function barnacle(g: Graphics, x: number, y: number) {
  g.moveTo(x - 4.5, y + 3).lineTo(x - 2, y - 3).lineTo(x + 2, y - 3).lineTo(x + 4.5, y + 3).closePath().fill(0xf4efe4).stroke({ color: ROCK_LINE, width: 1.2 });
  g.moveTo(x - 1.2, y - 2.5).lineTo(x + 1.2, y - 2.5).stroke({ color: ink, width: 1 });
}

/** A rock pool seen from the shore: a rim of rock round still water, with what lives in it. */
export function pool(g: Graphics, x: number, y: number, life: readonly PoolLife[], s: number) {
  const cy = y - 22 * s;
  g.ellipse(x, cy, 60 * s, 22 * s).fill(ROCK).stroke({ color: ROCK_LINE, width: 2.5 });
  g.ellipse(x, cy + 2 * s, 48 * s, 15 * s).fill(0x8fd3ec).stroke({ color: swatch.blue.line, width: 1.5, alpha: 0.6 });
  g.moveTo(x - 30 * s, cy - 4 * s).lineTo(x - 14 * s, cy - 4 * s).stroke({ color: 0xffffff, width: 2, cap: 'round', alpha: 0.8 });
  for (const [i, kind] of life.entries()) {
    const px = x + (i === 0 ? -18 : 20) * s;
    const py = cy + 4 * s;
    if (kind === 'star') star(g, px, py, s, i === 0 ? swatch.orange : swatch.purple);
    else if (kind === 'anemone') anemone(g, px, py, s);
    else kelp(g, px, py, s);
  }
  // Barnacles on the rim.
  barnacle(g, x + 46 * s, cy - 8 * s);
  barnacle(g, x - 50 * s, cy + 4 * s);
}

export function star(g: Graphics, x: number, y: number, s: number, c: { fill: number; line: number }) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = (i % 2 ? 4.5 : 12) * s;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6);
  }
  g.poly(pts).fill(c.fill).stroke({ color: c.line, width: 1.5 });
  g.circle(x, y, 1.6 * s).fill(c.line);
}

/** `open` 1 is the anemone feeding in water; 0 is pulled in tight, as one is when poked or left out of the water. */
export function anemone(g: Graphics, x: number, y: number, s: number, open = 1) {
  if (open > 0.05) {
    const o = open;
    for (let i = -3; i <= 3; i++) {
      g.moveTo(x + i * 2.5 * s, y - 4 * s).quadraticCurveTo(x + i * (2.5 + 2 * o) * s, y - (4 + 8 * o) * s, x + (i * (2.5 + 2.5 * o) + (i % 2) * 2 * o) * s, y - (4 + 12 * o) * s);
    }
    g.stroke({ color: swatch.pink.fill, width: 3 * s, cap: 'round' });
  }
  g.ellipse(x, y - 2 * s, 9 * s, 5 * s).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 1.5 });
}

export function kelp(g: Graphics, x: number, y: number, s: number) {
  for (const d of [-4, 3]) {
    g.moveTo(x + d * s, y + 2 * s).quadraticCurveTo(x + (d - 8) * s, y - 10 * s, x + (d + 2) * s, y - 22 * s).stroke({ color: 0x8a6a2e, width: 4 * s, cap: 'round' });
  }
}

export function crab(g: Graphics, x: number, y: number, face: 1 | -1) {
  // A hermit crab in a borrowed whelk shell: the shell behind, the claws and eyes poking out the front.
  const shell = swatch.yellow;
  g.moveTo(x - face * 18, y - 6).quadraticCurveTo(x - face * 22, y - 30, x - face * 2, y - 32).quadraticCurveTo(x + face * 10, y - 22, x + face * 4, y - 6).closePath().fill(shell.light).stroke({ color: shell.line, width: 2.5 });
  g.moveTo(x - face * 14, y - 18).quadraticCurveTo(x - face * 6, y - 26, x + face * 2, y - 20).stroke({ color: shell.line, width: 1.5 });
  const body = swatch.red;
  for (const d of [0, 6, 12]) g.moveTo(x + face * (2 + d * 0.5), y - 6).lineTo(x + face * (6 + d), y).stroke({ color: body.line, width: 2.5, cap: 'round' });
  g.ellipse(x + face * 14, y - 10, 7, 5).fill(body.fill).stroke({ color: body.line, width: 2 });
  for (const d of [-2, 4]) {
    g.moveTo(x + face * (8 + d), y - 12).lineTo(x + face * (10 + d), y - 22).stroke({ color: body.line, width: 1.5 });
    g.circle(x + face * (10 + d), y - 23, 2.4).fill(ink);
  }
}

export function gull(g: Graphics, x: number, y: number) {
  g.moveTo(x - 26, y - 2).quadraticCurveTo(x - 14, y - 14, x, y).quadraticCurveTo(x + 14, y - 14, x + 26, y - 2).stroke({ color: swatch.white.line, width: 5, cap: 'round' });
  g.moveTo(x - 26, y - 2).quadraticCurveTo(x - 14, y - 14, x, y).quadraticCurveTo(x + 14, y - 14, x + 26, y - 2).stroke({ color: 0xffffff, width: 2.5, cap: 'round' });
}

/** A cockle shell lying on the sand, ridges fanning from its hinge; `s` scales it round its feet. */
export function shell(g: Graphics, x: number, y: number, s = 1, c: { fill: number; light: number; line: number } = swatch.pink) {
  g.moveTo(x - 14 * s, y).quadraticCurveTo(x - 16 * s, y - 20 * s, x, y - 22 * s).quadraticCurveTo(x + 16 * s, y - 20 * s, x + 14 * s, y).closePath().fill(c.light).stroke({ color: c.line, width: 2 * s });
  for (const d of [-8, -3, 3, 8]) g.moveTo(x, y - 1 * s).lineTo(x + d * s, y - 18 * s).stroke({ color: c.line, width: 1.2 * s, alpha: 0.7 });
  g.roundRect(x - 5 * s, y - 2 * s, 10 * s, 4 * s, 2 * s).fill(c.fill).stroke({ color: c.line, width: 1.2 * s });
}

/** A seaside pail, 120 across and 120 tall with its handle, its feet on (x, y). */
export function pail(g: Graphics, x: number, y: number, c: { fill: number; light: number; line: number } = swatch.red) {
  g.moveTo(x - 38, y - 86).quadraticCurveTo(x, y - 128, x + 38, y - 86).stroke({ color: ink, width: 5, cap: 'round' });
  g.moveTo(x - 46, y - 86).lineTo(x + 46, y - 86).lineTo(x + 36, y).lineTo(x - 36, y).closePath().fill(c.fill).stroke({ color: c.line, width: 4 });
  g.roundRect(x - 50, y - 94, 100, 14, 7).fill(c.light).stroke({ color: c.line, width: 3 });
  g.moveTo(x - 40, y - 40).lineTo(x + 40, y - 40).stroke({ color: 0xffffff, width: 7, alpha: 0.75 });
  star(g, x + 4, y - 60, 1.2, swatch.yellow);
}

/**
 * The wrack line where the last high tide reached: a ragged band of kelp strands and shells across the sand from `x0` to
 * `x1`, centred on `y`, `band` tall. Seaweed and shells only, never litter. Seeded by the caller's numbers, so it never jitters.
 */
export function wrack(g: Graphics, x0: number, x1: number, y: number, band: number, seed = 7) {
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  g.rect(x0, y - band / 2, x1 - x0, band).fill({ color: 0xc9a75e, alpha: 0.35 });
  for (let x = x0 + rand() * 20; x < x1; x += 22 + rand() * 26) {
    const dy = (rand() - 0.5) * band * 0.6;
    const len = 18 + rand() * 22;
    g.moveTo(x, y + dy).quadraticCurveTo(x + len / 2, y + dy - 8 - rand() * 6, x + len, y + dy + (rand() - 0.5) * 6).stroke({ color: rand() < 0.5 ? 0x5c7a32 : 0x7a6a2a, width: 4 + rand() * 2, cap: 'round' });
  }
  for (let x = x0 + 30 + rand() * 40; x < x1 - 10; x += 70 + rand() * 90) shell(g, x, y + (rand() - 0.3) * band * 0.5, 0.55 + rand() * 0.2, rand() < 0.5 ? swatch.pink : swatch.yellow);
}
