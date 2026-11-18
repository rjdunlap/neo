import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { pail, pool, rock, star, wrack } from '../../art/shore';
import { Rng } from '../../engine/random';

export const SAND = 0xf3dc9c;
export const WET_SAND = 0xe2c27a;
export const SEA = 0x58b8e0;
export const SEA_DEEP = 0x3d97c7;
export const GRASS_GREEN = 0x9ccc6a;
export const DUNE = 0xdcbd72;

/**
 * A small shore in a 112-unit square round (0, 0): sand sloping up from the sea, a seaweed line and a pail above it, with a
 * sea star on the sand. The hub icon at seed 0; a sticker shifts the line, the pail's colour and the star from its seed.
 */
export function iconArt(seed = 0): Container {
  const rng = new Rng(seed + 31);
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-56, -56, 112, 112, 22).fill(SAND).stroke({ color: swatch.yellow.line, width: 3 });
  g.roundRect(-56, -56, 112, 22, 22).fill(GRASS_GREEN);
  const lineY = seed ? rng.range(-6, 8) : 2;
  wrack(g, -50, 50, lineY, 10, seed + 3);
  // The sea at the bottom, with a foam crest.
  g.moveTo(-56, 30)
    .quadraticCurveTo(-28, 22, 0, 30)
    .quadraticCurveTo(28, 38, 56, 30)
    .lineTo(56, 44)
    .quadraticCurveTo(56, 56, 44, 56)
    .lineTo(-44, 56)
    .quadraticCurveTo(-56, 56, -56, 44)
    .closePath()
    .fill(SEA);
  g.moveTo(-56, 30)
    .quadraticCurveTo(-28, 22, 0, 30)
    .quadraticCurveTo(28, 38, 56, 30)
    .stroke({ color: 0xffffff, width: 4, cap: 'round' });
  const p = new Graphics();
  pail(p, 0, 0, seed ? rng.pick([swatch.red, swatch.blue, swatch.green, swatch.purple]) : swatch.red);
  p.scale.set(0.34);
  p.position.set(seed ? rng.range(-22, 22) : 12, lineY - 12);
  star(
    g,
    seed ? rng.range(-34, -20) : -30,
    20,
    0.9,
    seed ? rng.pick([swatch.orange, swatch.purple, swatch.pink]) : swatch.orange,
  );
  c.addChild(g, p);
  return c;
}

/** Level 3's flag on a pole, feet at (x, y): 100 wide, 160 tall. */
export function flag(
  g: Graphics,
  x: number,
  y: number,
  c: { fill: number; light: number; line: number } = swatch.green,
) {
  g.ellipse(x, y - 2, 22, 7)
    .fill(DUNE)
    .stroke({ color: swatch.yellow.line, width: 2 });
  g.roundRect(x - 5, y - 158, 10, 158, 5)
    .fill(0x9a6a3a)
    .stroke({ color: 0x6e4a26, width: 2 });
  g.moveTo(x + 4, y - 152)
    .quadraticCurveTo(x + 30, y - 140, x + 50, y - 128)
    .quadraticCurveTo(x + 28, y - 116, x + 4, y - 100)
    .closePath()
    .fill(c.fill)
    .stroke({ color: c.line, width: 3 });
  g.circle(x, y - 158, 7)
    .fill(swatch.yellow.fill)
    .stroke({ color: swatch.yellow.line, width: 2 });
}

/** Level 3's beach towel hung on a little drying stand, feet at (x, y): 160 wide, 100 tall. */
export function towel(
  g: Graphics,
  x: number,
  y: number,
  c: { fill: number; light: number; line: number } = swatch.purple,
) {
  g.moveTo(x - 64, y)
    .lineTo(x - 52, y - 92)
    .moveTo(x + 64, y)
    .lineTo(x + 52, y - 92)
    .stroke({ color: 0x9a6a3a, width: 6, cap: 'round' });
  g.moveTo(x - 60, y - 92)
    .lineTo(x + 60, y - 92)
    .stroke({ color: 0x9a6a3a, width: 6, cap: 'round' });
  g.roundRect(x - 74, y - 96, 148, 62, 8)
    .fill(c.fill)
    .stroke({ color: c.line, width: 3 });
  for (const dy of [-80, -60]) g.rect(x - 72, y + dy, 144, 8).fill({ color: 0xffffff, alpha: 0.8 });
  for (let fx = x - 66; fx <= x + 66; fx += 12)
    g.moveTo(fx, y - 34)
      .lineTo(fx, y - 26)
      .stroke({ color: c.line, width: 2 });
}

/** The wave button: a curling wave 130 by 120 in a rounded frame, top-left at (0, 0). */
export function waveButton(g: Graphics) {
  g.roundRect(0, 0, 130, 120, 26).fill(SEA).stroke({ color: swatch.blue.line, width: 4 });
  g.moveTo(14, 92)
    .quadraticCurveTo(30, 40, 72, 34)
    .quadraticCurveTo(108, 32, 112, 62)
    .quadraticCurveTo(96, 50, 84, 62)
    .quadraticCurveTo(78, 82, 98, 92)
    .closePath()
    .fill(0xffffff)
    .stroke({ color: swatch.blue.line, width: 3 });
  g.moveTo(10, 104)
    .quadraticCurveTo(40, 96, 65, 104)
    .quadraticCurveTo(90, 112, 120, 104)
    .stroke({ color: 0xffffff, width: 5, cap: 'round' });
}

/**
 * Level 4's picture of the island's shore at one moment of the day, `w` by `h` from (0, 0): a rock and the seaweed line,
 * with the sea in to the line over the rock (`high`), out past a rock pool and its sea star (`low`), or halfway up the rock
 * (`mid`). They differ by where the water reaches, never by colour alone. `sun` (0–3) puts the sun along the sky's arc.
 */
export function shorePicture(
  g: Graphics,
  kind: 'high' | 'low' | 'mid',
  w: number,
  h: number,
  sun: number | null,
) {
  g.roundRect(0, 0, w, h, 16).fill(SAND).stroke({ color: swatch.yellow.line, width: 4 });
  g.roundRect(2, 2, w - 4, 40, 14).fill(0xbfe6f7);
  if (sun !== null) {
    const t = (sun + 0.5) / 4;
    g.circle(20 + t * (w - 40), 30 - Math.sin(Math.PI * t) * 16, 11)
      .fill(swatch.yellow.fill)
      .stroke({ color: swatch.yellow.line, width: 2 });
  }
  const lineY = 62;
  wrack(g, 6, w - 6, lineY, 12, 5);
  const rockX = w * 0.62;
  const rockY = h - 18;
  if (kind === 'low') pool(g, w * 0.26, h - 14, ['star'], 0.75);
  rock(g, rockX, rockY);
  // The water's edge: at the line (in), halfway up the rock (halfway), or below the pool (out).
  const edge = kind === 'high' ? lineY + 4 : kind === 'mid' ? rockY - 26 : h - 8;
  g.moveTo(4, edge);
  for (let x = 4; x <= w - 4; x += 16) g.lineTo(x, edge + Math.sin(x / 14) * 3);
  g.lineTo(w - 4, h - 4)
    .lineTo(4, h - 4)
    .closePath()
    .fill({ color: SEA, alpha: kind === 'low' ? 0.9 : 0.72 });
  g.moveTo(4, edge);
  for (let x = 4; x <= w - 4; x += 16) g.lineTo(x, edge + Math.sin(x / 14) * 3);
  g.stroke({ color: 0xffffff, width: 4, cap: 'round' });
}

/**
 * Level 5's shore at one moment of the island day, `w` by `h` from (0, 0), drawn from the water's height itself: the
 * rock pool's near rim sits at height `rim` and its far rim at `top`, so the pool and its sea star show while the water is
 * below the near rim and the sea lies over them once it is past the far one. `t` (0 to 1) is the time of day: the sun
 * crosses the sky and the last quarter is a starry evening.
 */
export function dayShore(
  g: Graphics,
  w: number,
  h: number,
  water: number,
  t: number,
  rim: number,
  top: number,
) {
  const sky = Math.min(64, h * 0.2);
  const night = Math.max(0, Math.min(1, (t - 0.7) / 0.12));
  g.roundRect(0, 0, w, h, 20).fill(SAND);
  g.roundRect(0, 0, w, sky + 14, 20).fill(night > 0.5 ? 0x5b6aa8 : t < 0.2 || t > 0.6 ? 0xd9e8f4 : 0xbfe6f7);
  g.rect(0, sky, w, 16).fill(DUNE);
  g.rect(0, sky - 6, w, 10).fill(GRASS_GREEN);
  if (night < 0.5) {
    const u = Math.min(1, t / 0.7);
    g.circle(30 + u * (w - 60), sky - 14 - Math.sin(Math.PI * u) * (sky - 30), 13)
      .fill(swatch.yellow.fill)
      .stroke({ color: swatch.yellow.line, width: 2 });
  } else
    for (let i = 0; i < 7; i++)
      g.star(w * (0.12 + i * 0.13), 14 + ((i * 17) % (sky - 26)), 4, 5, 2.2).fill(0xfff6c8);
  // Heights 0 to 0.75 run from just above the bottom to the foot of the dunes.
  const yOf = (hh: number) => h - 16 - (hh / 0.75) * (h - 16 - (sky + 22));
  const near = yOf(rim);
  const far = yOf(top);
  const s = (near - far) / 44;
  const px = w * 0.5;
  wrack(g, 10, w - 10, yOf(0.66), 10, 5);
  // The pool is seen from low down: twice as wide as it is deep, so the star in it reads from across the room.
  // (Pixi applies the scale to the translation too, so the x is halved.)
  g.save()
    .translateTransform(px / 2, near)
    .scaleTransform(2, 1);
  g.ellipse(0, 4, 74 * s, 12 * s).fill({ color: WET_SAND, alpha: 0.7 });
  pool(g, 0, 0, ['star'], s);
  g.restore();
  rock(g, w * 0.82, yOf(0.36));
  const edge = yOf(water);
  const wave = (x: number) => edge + Math.sin(x / 26 + t * 40) * 3;
  g.moveTo(0, wave(0));
  for (let x = 20; x <= w; x += 20) g.lineTo(x, wave(x));
  g.lineTo(w, h - 20)
    .quadraticCurveTo(w, h, w - 20, h)
    .lineTo(20, h)
    .quadraticCurveTo(0, h, 0, h - 20)
    .closePath()
    .fill({ color: SEA, alpha: 0.86 });
  g.moveTo(0, wave(0));
  for (let x = 20; x <= w; x += 20) g.lineTo(x, wave(x));
  g.stroke({ color: 0xffffff, width: 5, cap: 'round' });
  g.roundRect(0, 0, w, h, 20).stroke({ color: swatch.yellow.line, width: 4 });
}

/** One of the four times of day, morning to night, centred on (x, y): sunrise, the high sun, sunset, stars. */
export function skyIcon(g: Graphics, i: number, x: number, y: number) {
  const sun = swatch.yellow;
  const rays = (cy: number, from: number, to: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const a = from + ((to - from) * k) / (n - 1);
      g.moveTo(x + Math.cos(a) * 26, cy + Math.sin(a) * 26)
        .lineTo(x + Math.cos(a) * 36, cy + Math.sin(a) * 36)
        .stroke({ color: sun.line, width: 4, cap: 'round' });
    }
  };
  if (i === 1) {
    rays(y, 0, Math.PI * 1.75, 8);
    g.circle(x, y, 20).fill(sun.fill).stroke({ color: sun.line, width: 3 });
    return;
  }
  if (i === 3) {
    g.roundRect(x - 40, y - 30, 80, 60, 14).fill(0x5b6aa8);
    for (const [dx, dy, r] of [
      [-20, -8, 7],
      [14, -12, 9],
      [2, 12, 6],
      [26, 10, 5],
    ])
      g.star(x + dx, y + dy, 4, r, r / 2.2).fill(0xfff6c8);
    return;
  }
  // A half sun on the horizon: rising on the left of the day (yellow), setting on its right (orange), with an arrow.
  const c = i === 0 ? sun : swatch.orange;
  const base = y + 14;
  rays(base, Math.PI, Math.PI * 2, 5);
  g.moveTo(x - 20, base)
    .arc(x, base, 20, Math.PI, 0)
    .closePath()
    .fill(c.fill)
    .stroke({ color: c.line, width: 3 });
  g.moveTo(x - 42, base)
    .lineTo(x + 42, base)
    .stroke({ color: swatch.blue.line, width: 4, cap: 'round' });
  const up = i === 0 ? -1 : 1;
  const ay = base + 16;
  g.moveTo(x, ay - 7 * up)
    .lineTo(x, ay + 7 * up)
    .moveTo(x - 6, ay + 1 * up)
    .lineTo(x, ay + 7 * up)
    .lineTo(x + 6, ay + 1 * up)
    .stroke({ color: c.line, width: 3, cap: 'round', join: 'round' });
}

/** The flag button, 130 square from (0, 0): a flag on a pole in a rounded frame. */
export function flagButton(g: Graphics) {
  g.roundRect(0, 0, 130, 130, 28).fill(0xffffff).stroke({ color: swatch.green.line, width: 5 });
  dayFlag(g, 56, 112, 1);
}

/** A small marking flag, its foot at (x, y); `s` scales it (1 is 92 tall). */
export function dayFlag(g: Graphics, x: number, y: number, s: number, c = swatch.green) {
  g.roundRect(x - 4 * s, y - 92 * s, 8 * s, 92 * s, 4 * s)
    .fill(0x9a6a3a)
    .stroke({ color: 0x6e4a26, width: 2 });
  g.moveTo(x + 3 * s, y - 90 * s)
    .lineTo(x + 46 * s, y - 72 * s)
    .lineTo(x + 3 * s, y - 52 * s)
    .closePath()
    .fill(c.fill)
    .stroke({ color: c.line, width: 3, join: 'round' });
}
