/** Notice Board's board, posters, badges, places, memory bubbles, photo, label, awning, baskets and face-pins, code-drawn from the palette. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood, type Swatch } from '../../art/palette';
import { hatArt, prop } from '../../art/props';
import { shell, star } from '../../art/shore';
import type { Badge, Friend, Item, Memory, Place, Purpose, Thing } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export const BADGE_COLOR: Record<Badge, Swatch> = {
  star: swatch.yellow, leaf: swatch.green, wave: swatch.blue, heart: swatch.pink, moon: swatch.purple, sun: swatch.orange,
};

/** A round badge `d` across: a white disc with the badge's glyph; the glyph decides, its colour only helps. */
export function badgeArt(b: Badge, d: number): Graphics {
  const g = new Graphics();
  const r = d / 2, c = BADGE_COLOR[b], s = d / 56;
  g.circle(0, 0, r).fill(0xffffff).stroke(line(c.line, 3 * s));
  switch (b) {
    case 'star': star(g, 0, 0, 1.25 * s, c); break;
    case 'leaf':
      g.moveTo(-15 * s, 14 * s).bezierCurveTo(-18 * s, -10 * s, 4 * s, -20 * s, 17 * s, -17 * s).bezierCurveTo(18 * s, 2 * s, 4 * s, 18 * s, -15 * s, 14 * s).fill(c.fill).stroke(line(c.line, 2.5 * s));
      g.moveTo(-15 * s, 14 * s).lineTo(10 * s, -10 * s).stroke(line(c.line, 2 * s));
      break;
    case 'wave':
      g.moveTo(-20 * s, 6 * s).quadraticCurveTo(-12 * s, -16 * s, 0, -2 * s).quadraticCurveTo(8 * s, 10 * s, 18 * s, -12 * s).lineTo(18 * s, 14 * s).lineTo(-20 * s, 14 * s).closePath().fill(c.fill).stroke(line(c.line, 2.5 * s));
      break;
    case 'heart':
      g.moveTo(0, 16 * s).bezierCurveTo(-26 * s, 0, -16 * s, -22 * s, 0, -9 * s).bezierCurveTo(16 * s, -22 * s, 26 * s, 0, 0, 16 * s).fill(c.fill).stroke(line(c.line, 2.5 * s));
      break;
    case 'moon':
      // A crescent: the disc, with a white disc over its upper right.
      g.circle(0, 0, 19 * s).fill(c.fill).stroke(line(c.line, 2.5 * s));
      g.circle(10 * s, -7 * s, 16 * s).fill(0xffffff);
      break;
    case 'sun':
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        g.moveTo(Math.cos(a) * 13 * s, Math.sin(a) * 13 * s).lineTo(Math.cos(a) * 21 * s, Math.sin(a) * 21 * s).stroke(line(c.line, 3 * s));
      }
      g.circle(0, 0, 10 * s).fill(c.fill).stroke(line(c.line, 2.5 * s));
      break;
  }
  return g;
}

/** A place's backdrop filling `w` × `h` from the top-left: one landmark and one dominant colour. */
export function placeArt(place: Place, w: number, h: number): Graphics {
  const g = new Graphics();
  const sky = 0xd6eefc;
  g.rect(0, 0, w, h).fill(sky);
  const gy = h * 0.55;
  switch (place) {
    case 'garden':
      g.rect(0, gy, w, h - gy).fill(0xb98a5e);
      for (let r = 0; r < 3; r++) {
        const y = gy + (r + 0.6) * ((h - gy) / 3);
        g.moveTo(0, y).lineTo(w, y).stroke(line(0x8f6142, 3));
        for (let x = w * 0.12; x < w; x += w / 6) g.moveTo(x, y - 2).lineTo(x - 5, y - 12).moveTo(x, y - 2).lineTo(x + 5, y - 12).stroke(line(swatch.green.line, 3));
      }
      break;
    case 'pond':
      g.rect(0, gy, w, h - gy).fill(0xa8dc8f);
      g.ellipse(w / 2, gy + (h - gy) * 0.55, w * 0.42, (h - gy) * 0.42).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
      for (const x of [0.12, 0.18, 0.84]) g.moveTo(w * x, gy + 10).lineTo(w * x, gy - h * 0.18).stroke(line(swatch.green.line, 4));
      for (const x of [0.12, 0.18, 0.84]) g.ellipse(w * x, gy - h * 0.18, 4, 10).fill(0x8f6142);
      break;
    case 'beach':
      g.rect(0, gy - h * 0.12, w, h * 0.16).fill(swatch.blue.fill);
      g.moveTo(0, gy).quadraticCurveTo(w * 0.25, gy - 14, w * 0.5, gy).quadraticCurveTo(w * 0.75, gy + 14, w, gy).lineTo(w, h).lineTo(0, h).closePath().fill(0xf6e3b4);
      g.moveTo(0, gy).quadraticCurveTo(w * 0.25, gy - 14, w * 0.5, gy).quadraticCurveTo(w * 0.75, gy + 14, w, gy).stroke(line(0xffffff, 4));
      break;
    case 'orchard':
      g.rect(0, gy, w, h - gy).fill(0xa8dc8f);
      g.rect(w * 0.82 - 6, gy - h * 0.2, 12, h * 0.25).fill(wood.fill);
      g.circle(w * 0.82, gy - h * 0.26, h * 0.14).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      for (const [dx, dy] of [[-0.05, -0.02], [0.04, 0.03], [0.02, -0.08]]) g.circle(w * (0.82 + dx), gy - h * 0.26 + h * dy, 4).fill(swatch.red.fill);
      break;
    case 'meadow':
      g.rect(0, gy, w, h - gy).fill(swatch.green.light);
      for (let x = 6; x < w; x += 14) g.moveTo(x, h).lineTo(x + 4, gy - 8 - ((x * 7) % 12)).stroke(line(swatch.green.fill, 3));
      for (const [x, c] of [[0.1, swatch.pink], [0.3, swatch.yellow], [0.88, swatch.purple]] as const) g.circle(w * x, gy - 4, 6).fill(c.fill).circle(w * x, gy - 4, 2.5).fill(0xffffff);
      break;
    case 'square':
      g.rect(0, gy, w, h - gy).fill(0xe8dcc8);
      for (let x = 0; x < w; x += 24) g.moveTo(x, gy).lineTo(x - 10, h).stroke(line(0xd2c3a8, 2));
      g.rect(w * 0.06, gy - h * 0.22, w * 0.16, h * 0.22).fill(swatch.red.light).stroke(line(swatch.red.line, 3));
      g.poly([w * 0.04, gy - h * 0.22, w * 0.14, gy - h * 0.34, w * 0.24, gy - h * 0.22]).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      g.ellipse(w * 0.88, gy + 6, w * 0.06, 8).fill(0x9a9aa8).stroke(line(0x6c6c7a, 3));
      g.moveTo(w * 0.83, gy + 4).lineTo(w * 0.83, gy - h * 0.14).lineTo(w * 0.93, gy - h * 0.14).lineTo(w * 0.93, gy + 4).stroke(line(wood.line, 3));
      break;
  }
  return g;
}

/** The ear beside a whispering mouth: she only heard about it. */
function heardArt(w: number, h: number): Graphics {
  const g = new Graphics().rect(0, 0, w, h).fill(0xf5efe6);
  const s = h / 80;
  g.moveTo(w * 0.62, h * 0.2).bezierCurveTo(w * 0.62 + 34 * s, h * 0.15, w * 0.62 + 34 * s, h * 0.7, w * 0.62 + 6 * s, h * 0.82).fill(swatch.pink.light).stroke(line(swatch.pink.line, 3));
  g.moveTo(w * 0.62 + 8 * s, h * 0.38).quadraticCurveTo(w * 0.62 + 20 * s, h * 0.45, w * 0.62 + 8 * s, h * 0.6).stroke(line(swatch.pink.line, 2.5));
  g.ellipse(w * 0.24, h * 0.5, 14 * s, 8 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 2.5));
  for (const k of [0, 1, 2]) g.arc(w * 0.24, h * 0.5, (20 + k * 9) * s, -0.5, 0.5).stroke(line(ink, 2));
  return g;
}

/** A thought bubble `w` × `h` (centre-bottom on the origin) showing a remembered place or the ear-and-whisper. */
export function bubbleArt(m: Memory, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.circle(-8, -6, 6).fill(0xffffff).stroke(line(ink, 2));
  g.circle(4, -18, 9).fill(0xffffff).stroke(line(ink, 2));
  const bh = h - 28;
  g.roundRect(-w / 2, -h, w, bh, 24).fill(0xffffff).stroke(line(ink, 3));
  const iw = w - 20, ih = bh - 16;
  const pic = m === 'heard' ? heardArt(iw, ih) : placeArt(m, iw, ih);
  pic.position.set(-iw / 2, -h + 8);
  const mask = new Graphics().roundRect(-iw / 2, -h + 8, iw, ih, 16).fill(0xffffff);
  pic.mask = mask;
  c.addChild(g, pic, mask);
  return c;
}

/** Small ducklings, a row of yellow ovals with orange bills. */
function ducklings(g: Graphics, n: number, w: number, y: number) {
  const per = Math.min(5, n), rows = Math.ceil(n / per);
  for (let k = 0; k < n; k++) {
    const row = Math.floor(k / per), col = k % per;
    const x = (col - (per - 1) / 2) * (w / per), yy = y - row * 26 + (rows - 1) * 13;
    g.ellipse(x, yy, 11, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
    g.circle(x + 6, yy - 9, 6).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
    g.poly([x + 11, yy - 10, x + 17, yy - 8, x + 11, yy - 6]).fill(swatch.orange.fill);
  }
}

function crowd(g: Graphics, n: number, w: number, y: number) {
  const colors = [swatch.orange, swatch.brown, swatch.pink, swatch.white, swatch.yellow, swatch.blue, swatch.purple, swatch.green];
  const per = Math.min(6, n), rows = Math.ceil(n / per);
  for (let k = 0; k < n; k++) {
    const row = Math.floor(k / per), col = k % per;
    const x = (col - (per - 1) / 2) * (w / per) + (row % 2) * 8, yy = y - (rows - 1 - row) * 18;
    const c = colors[k % colors.length];
    g.roundRect(x - 11, yy - 6, 22, 22, 8).fill(c.fill).stroke(line(c.line, 2));
    g.circle(x, yy - 14, 10).fill(c.fill).stroke(line(c.line, 2));
    g.circle(x - 3, yy - 15, 1.6).fill(ink).circle(x + 3, yy - 15, 1.6).fill(ink);
  }
}

function tree(g: Graphics, apples: number, s: number) {
  g.rect(-8 * s, -30 * s, 16 * s, 34 * s).fill(wood.fill).stroke(line(wood.line, 3));
  g.circle(0, -62 * s, 42 * s).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  const spots: [number, number][] = [];
  for (let k = 0; k < apples; k++) {
    const a = k * 2.4, r = 34 * s * Math.sqrt((k + 0.5) / Math.max(apples, 1));
    spots.push([Math.cos(a) * r, -62 * s + Math.sin(a) * r]);
  }
  for (const [x, y] of spots) g.circle(x, y, (apples > 10 ? 4.5 : 7) * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 1.5));
}

function butterfly(g: Graphics, s: number) {
  for (const side of [-1, 1]) {
    g.ellipse(side * 18 * s, -10 * s, 18 * s, 14 * s).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 2.5));
    g.ellipse(side * 14 * s, 10 * s, 12 * s, 10 * s).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 2.5));
  }
  g.roundRect(-3 * s, -18 * s, 6 * s, 36 * s, 3 * s).fill(ink);
  g.moveTo(-1 * s, -18 * s).lineTo(-8 * s, -30 * s).moveTo(1 * s, -18 * s).lineTo(8 * s, -30 * s).stroke(line(ink, 2));
}

function frog(g: Graphics, c: Swatch, s: number) {
  g.ellipse(0, 0, 30 * s, 20 * s).fill(c.fill).stroke(line(c.line, 3));
  for (const side of [-1, 1]) g.circle(side * 14 * s, -18 * s, 9 * s).fill(c.fill).stroke(line(c.line, 3)).circle(side * 14 * s, -19 * s, 3.5 * s).fill(ink);
  g.moveTo(-12 * s, 4 * s).quadraticCurveTo(0, 12 * s, 12 * s, 4 * s).stroke(line(c.line, 2.5));
}

function flower(g: Graphics, c: Swatch, x: number, y: number, s: number) {
  g.moveTo(x, y).lineTo(x, y + 30 * s).stroke(line(swatch.green.line, 3 * s));
  for (let k = 0; k < 5; k++) { const a = (k * Math.PI * 2) / 5; g.circle(x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7 * s).fill(c.fill).stroke(line(c.line, 1.5)); }
  g.circle(x, y, 5 * s).fill(swatch.yellow.fill);
}

/**
 * A poster's (or photo's) picture, centred on the origin and about `size` across. `variant` is the photo of a level-2
 * topic: `'true'` shows what the poster says, `'stretched'` what really happened.
 */
export function thingArt(thing: Thing, size: number, variant: 'claim' | 'true' | 'stretched' = 'claim'): Container {
  const c = new Container();
  const g = new Graphics();
  const s = size / 120;
  const small = variant === 'stretched';
  c.addChild(g);
  switch (thing) {
    case 'garden': for (const [x, col] of [[-36, swatch.red], [0, swatch.yellow], [36, swatch.pink]] as const) flower(g, col, x * s, -16 * s, 1.3 * s); break;
    case 'kite':
      g.poly([0, -50 * s, 34 * s, -6 * s, 0, 34 * s, -34 * s, -6 * s]).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      g.moveTo(0, -50 * s).lineTo(0, 34 * s).moveTo(-34 * s, -6 * s).lineTo(34 * s, -6 * s).stroke(line(swatch.red.line, 2));
      g.moveTo(0, 34 * s).quadraticCurveTo(20 * s, 50 * s, 6 * s, 60 * s).stroke(line(ink, 2));
      break;
    case 'sandcastle':
      g.rect(-44 * s, -10 * s, 88 * s, 40 * s).fill(0xe8c98a).stroke(line(0xb8955a, 3));
      for (const x of [-44, -6, 32]) g.rect(x * s, -36 * s, 12 * s, 26 * s).fill(0xe8c98a).stroke(line(0xb8955a, 3));
      g.rect(-10 * s, -50 * s, 20 * s, 40 * s).fill(0xe8c98a).stroke(line(0xb8955a, 3));
      g.moveTo(0, -50 * s).lineTo(0, -66 * s).stroke(line(ink, 2)).poly([0, -66 * s, 14 * s, -61 * s, 0, -56 * s]).fill(swatch.red.fill);
      break;
    case 'painting':
      g.moveTo(-30 * s, 50 * s).lineTo(0, -50 * s).lineTo(30 * s, 50 * s).stroke(line(wood.line, 4));
      g.rect(-40 * s, -40 * s, 80 * s, 60 * s).fill(0xffffff).stroke(line(wood.line, 4));
      g.moveTo(-36 * s, 0).quadraticCurveTo(-18 * s, -14 * s, 0, 0).quadraticCurveTo(18 * s, 14 * s, 36 * s, 0).lineTo(36 * s, 16 * s).lineTo(-36 * s, 16 * s).closePath().fill(swatch.blue.fill);
      break;
    case 'tower':
      [swatch.red, swatch.yellow, swatch.blue, swatch.green, swatch.purple].forEach((col, k) => g.rect(-16 * s, (30 - (k + 1) * 18) * s, 32 * s, 18 * s).fill(col.fill).stroke(line(col.line, 2.5)));
      break;
    case 'song':
      for (const [x, y] of [[-30, -10], [10, -30], [34, 0]]) {
        g.ellipse(x * s, y * s, 10 * s, 8 * s).fill(ink);
        g.moveTo((x + 9) * s, y * s).lineTo((x + 9) * s, (y - 34) * s).lineTo((x + 20) * s, (y - 26) * s).stroke(line(ink, 3));
      }
      break;
    case 'pie':
      g.ellipse(0, 10 * s, 46 * s, 18 * s).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      g.ellipse(0, 4 * s, 40 * s, 14 * s).fill(0xf0c995).stroke(line(swatch.brown.line, 2.5));
      for (const x of [-14, 0, 14]) g.moveTo(x * s, -2 * s).lineTo((x + 4) * s, 8 * s).stroke(line(swatch.brown.line, 2));
      for (const x of [-12, 4, 18]) g.moveTo(x * s, -12 * s).quadraticCurveTo((x - 6) * s, -22 * s, x * s, -32 * s).stroke(line(0xbbbbcc, 2));
      break;
    case 'ball':
      g.circle(0, 0, 34 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      g.moveTo(-34 * s, 0).quadraticCurveTo(0, 18 * s, 34 * s, 0).stroke(line(0xffffff, 6 * s));
      break;
    case 'ribbon':
      g.moveTo(-10 * s, 10 * s).lineTo(-22 * s, 50 * s).lineTo(-10 * s, 44 * s).lineTo(-2 * s, 54 * s).lineTo(0, 12 * s).fill(swatch.blue.fill);
      g.moveTo(10 * s, 10 * s).lineTo(22 * s, 50 * s).lineTo(10 * s, 44 * s).lineTo(2 * s, 54 * s).lineTo(0, 12 * s).fill(swatch.blue.fill);
      g.circle(0, 0, 22 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      star(g, 0, 0, 0.8 * s, swatch.orange);
      break;
    case 'party': {
      const h = hatArt();
      h.scale.set(0.6 * s);
      h.position.set(0, 110 * 0.6 * s);
      c.addChild(h);
      for (const [x, y, col] of [[-40, -20, swatch.pink], [40, -30, swatch.blue], [-30, 30, swatch.yellow], [36, 24, swatch.green]] as const) g.rect(x * s, y * s, 6 * s, 10 * s).fill(col.fill);
      break;
    }
    case 'jump':
      for (const k of [0, 1, 2]) g.moveTo((-40 + k * 10) * s, (40 - k * 4) * s).quadraticCurveTo(0, -60 * s, (40 - k * 10) * s, (40 - k * 4) * s).stroke({ ...line(ink, 2), alpha: 0.4 });
      break;
    case 'carrot': {
      const k = variant === 'stretched' ? 0.45 : 1.15;
      g.poly([-14 * s * k, -40 * s * k, 14 * s * k, -40 * s * k, 0, 54 * s * k]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
      for (const d of [-8, 0, 8]) g.moveTo(0, -40 * s * k).lineTo(d * 2 * s * k, -64 * s * k).stroke(line(swatch.green.line, 5 * k));
      break;
    }
    case 'ducklings': ducklings(g, small ? 3 : 10, 120 * s, 20 * s); break;
    case 'frog':
      if (small) { flower(g, swatch.purple, 30 * s, -30 * s, 1.4 * s); frog(g, swatch.green, s); g.position.x = -14 * s; }
      else frog(g, swatch.purple, 1.3 * s);
      break;
    case 'whale':
      if (small) {
        g.ellipse(0, 0, 30 * s, 14 * s).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
        g.poly([26 * s, 0, 44 * s, -14 * s, 44 * s, 14 * s]).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
        g.circle(-16 * s, -3 * s, 3 * s).fill(ink);
        g.position.y = -20 * s;
      } else {
        g.moveTo(-60 * s, 20 * s).quadraticCurveTo(-50 * s, -30 * s, 10 * s, -24 * s).quadraticCurveTo(54 * s, -18 * s, 60 * s, 20 * s).closePath().fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
        for (const d of [-12, 0, 12]) g.moveTo(-10 * s, -26 * s).quadraticCurveTo(d * s, -50 * s, (d * 2) * s, -56 * s).stroke(line(swatch.blue.light, 4));
        g.circle(-36 * s, 0, 3 * s).fill(ink);
      }
      break;
    case 'appletree': tree(g, small ? 5 : 30, 1.05 * s); g.position.y = 50 * s; break;
    case 'apples': for (const [x, y] of [[-26, 10], [26, 10], [0, -18]]) { const a = prop('apple', 'red'); a.scale.set(0.42 * s); a.position.set(x * s, y * s); c.addChild(a); } break;
    case 'butterfly': butterfly(g, small ? 0.8 * s : 2.2 * s); if (small) flower(g, swatch.yellow, 0, 24 * s, 1.1 * s); break;
    case 'crowd': crowd(g, small ? 4 : 18, 120 * s, 30 * s); break;
    case 'lemonade':
      g.roundRect(-22 * s, -40 * s, 44 * s, 76 * s, 8 * s).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 3));
      g.rect(-18 * s, -16 * s, 36 * s, 48 * s).fill(swatch.yellow.fill);
      g.circle(22 * s, -40 * s, 12 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2.5));
      g.moveTo(-6 * s, -40 * s).lineTo(-14 * s, -62 * s).stroke(line(swatch.pink.fill, 4));
      break;
    case 'icecream':
      g.poly([-22 * s, -6 * s, 22 * s, -6 * s, 0, 54 * s]).fill(0xe8c98a).stroke(line(0xb8955a, 3));
      g.circle(0, -20 * s, 22 * s).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
      g.circle(0, -50 * s, 18 * s).fill(swatch.white.light).stroke(line(swatch.white.line, 3));
      break;
    case 'hats': for (const [x, k] of [[-32, 0.42], [30, 0.42]] as const) { const h = hatArt(); h.scale.set(k * s); h.position.set(x * s, 110 * k * s); c.addChild(h); } break;
    case 'flowers': for (const [x, col] of [[-30, swatch.pink], [0, swatch.purple], [30, swatch.red]] as const) flower(g, col, x * s, -20 * s, 1.2 * s); break;
    case 'rainbow':
      [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue, swatch.purple].forEach((col, k) => g.arc(0, 30 * s, (60 - k * 7) * s, Math.PI, 0).stroke(line(col.fill, 7 * s)));
      break;
  }
  return c;
}

/** A friend as a still drawing (for the poster, the pin and the sticker). */
export function stillCritter(name: Friend, scale: number): Critter {
  const k = new Critter(CRITTERS[name]);
  k.alive = false;
  k.scale.set(scale);
  return k;
}

/** The maker's round face-pin, `d` across: their head in a ring. */
export function pinArt(name: Friend, d: number): Container {
  const c = new Container();
  const ring = new Graphics().circle(0, 0, d / 2).fill(0xffffff).stroke(line(swatch.red.fill, 4));
  const k = stillCritter(name, d / 260);
  k.y = d * 0.62;
  const mask = new Graphics().circle(0, 0, d / 2 - 3).fill(0xffffff);
  k.mask = mask;
  c.addChild(ring, k, mask, new Graphics().circle(0, 0, d / 2).stroke(line(swatch.red.line, 3)));
  return c;
}

/** The striped stall awning on a sell poster, `w` across. */
function awning(w: number): Graphics {
  const g = new Graphics();
  const n = 6, sw = w / n;
  for (let k = 0; k < n; k++) {
    const col = k % 2 ? 0xffffff : swatch.red.fill;
    g.moveTo(k * sw, 0).lineTo((k + 1) * sw, 0).lineTo((k + 1) * sw, 26).quadraticCurveTo((k + 0.5) * sw, 40, k * sw, 26).closePath().fill(col).stroke(line(swatch.red.line, 2));
  }
  return g;
}

/** A poster `w` × `h`, centred on the origin: its place, its picture, the about-a-friend subject, a stall and shells on a sell poster, and the maker's stamp. */
export function posterArt(item: Item, w: number, h: number): Container {
  const c = new Container();
  const p = item.poster;
  const sheet = new Graphics().roundRect(-w / 2, -h / 2, w, h, 8).fill(cream).stroke(line(0xc9b48f, 3));
  const pad = 12;
  const pw = w - 2 * pad, ph = h - 2 * pad;
  const back = placeArt(p.place, pw, ph);
  back.position.set(-pw / 2, -ph / 2);
  c.addChild(sheet, back);
  const sell = p.purpose === 'sell';
  const picSize = Math.min(pw, ph) * 0.78;
  if (p.about && item.subject !== undefined) {
    // The friend the poster is about, with the poster's prop beside them.
    const k = stillCritter(item.bench[item.subject].name, ph / 420);
    k.position.set(-pw * 0.12, ph * 0.38);
    const t = thingArt(p.thing, picSize * 0.6);
    t.position.set(pw * 0.24, p.thing === 'party' ? -ph * 0.24 : -ph * 0.02);
    if (p.thing === 'party') t.position.set(-pw * 0.12, -ph * 0.3);
    if (p.thing === 'jump') { k.y = ph * 0.12; t.position.set(-pw * 0.12, ph * 0.2); }
    c.addChild(t, k);
  } else {
    const t = thingArt(p.thing, picSize);
    t.position.set(0, sell ? ph * 0.08 : ph * 0.02);
    c.addChild(t);
  }
  if (sell) {
    const a = awning(pw);
    a.position.set(-pw / 2, -ph / 2);
    const shells = new Graphics();
    for (let k = 0; k < (p.price ?? 0); k++) shell(shells, -pw / 2 + 28 + k * 36, ph / 2 - 10, 1.2);
    c.addChild(a, shells);
  }
  const stamp = new Container();
  const ring = new Graphics().circle(0, 0, 32).fill({ color: 0xffffff, alpha: 0.9 }).stroke(line(BADGE_COLOR[item.stamp].line, 3));
  stamp.addChild(ring, badgeArt(item.stamp, 56));
  stamp.position.set(w / 2 - 38, h / 2 - 38);
  stamp.rotation = -0.12;
  c.addChild(stamp);
  return c;
}

/** The witness's photo, `w` × `h`, centred on the origin: a white border round the place and what really happened. */
export function photoArt(item: Item, w: number, h: number): Container {
  const c = new Container();
  c.addChild(new Graphics().rect(-w / 2 + 4, -h / 2 + 6, w, h).fill({ color: ink, alpha: 0.2 }));
  c.addChild(new Graphics().rect(-w / 2, -h / 2, w, h).fill(0xffffff).stroke(line(0xcccccc, 2)));
  const iw = w - 20, ih = h - 34;
  const back = placeArt(item.poster.place, iw, ih);
  back.position.set(-iw / 2, -h / 2 + 10);
  const t = thingArt(item.poster.thing, Math.min(iw, ih) * 0.85, item.truth === 'stretched' ? 'stretched' : 'true');
  t.position.set(0, -h / 2 + 10 + ih * 0.55);
  const mask = new Graphics().rect(-iw / 2, -h / 2 + 10, iw, ih).fill(0xffffff);
  const pic = new Container();
  pic.addChild(back, t);
  pic.mask = mask;
  c.addChild(pic, mask);
  return c;
}

/** A stretched poster's correction label: a small paper tag with what really happened. */
export function labelArt(item: Item): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-56, -40, 112, 80, 8).fill(0xfffbe8).stroke(line(swatch.yellow.line, 3)));
  c.addChild(new Graphics().circle(-44, -28, 5).fill(swatch.red.fill));
  const t = thingArt(item.poster.thing, 70, 'stretched');
  t.y = 6;
  c.addChild(t);
  return c;
}

/** The wooden board with its cork face, `w` × `h` from the top-left. */
export function boardArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.rect(w * 0.18, h - 4, 14, 40).fill(wood.fill).stroke(line(wood.line, 3));
  g.rect(w * 0.82 - 14, h - 4, 14, 40).fill(wood.fill).stroke(line(wood.line, 3));
  g.roundRect(0, 0, w, h, 14).fill(wood.fill).stroke(line(wood.line, 4));
  g.roundRect(10, 10, w - 20, h - 20, 8).fill(0xd8b07a);
  for (let k = 0; k < 40; k++) g.circle(14 + ((k * 97) % (w - 28)), 14 + ((k * 61) % (h - 28)), 2).fill(0xc79c64);
  return g;
}

/** A woven basket `w` × `h` centred on the origin, marked with a big eye (what happened) or an open hand (come and get some). */
export function basketArt(purpose: Purpose, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  const top = -h / 2 + 30;
  g.moveTo(-w / 2, top).lineTo(w / 2, top).lineTo(w / 2 - 20, h / 2).lineTo(-w / 2 + 20, h / 2).closePath().fill(0xd9a066).stroke(line(wood.line, 4));
  for (let y = top + 18; y < h / 2; y += 18) g.moveTo(-w / 2 + 8, y).lineTo(w / 2 - 8, y).stroke(line(wood.line, 2));
  g.roundRect(-w / 2 - 6, top - 12, w + 12, 20, 10).fill(wood.light).stroke(line(wood.line, 4));
  c.addChild(g);
  const mark = new Graphics();
  const my = top + (h / 2 - top) / 2;
  mark.circle(0, my, 40).fill(0xffffff).stroke(line(ink, 3));
  if (purpose === 'tell') {
    mark.moveTo(-28, my).quadraticCurveTo(0, my - 26, 28, my).quadraticCurveTo(0, my + 26, -28, my).fill(0xffffff).stroke(line(ink, 3));
    mark.circle(0, my, 11).fill(swatch.blue.fill).circle(0, my, 5).fill(ink).circle(3, my - 3, 2).fill(0xffffff);
  } else {
    const sk = swatch.orange;
    mark.roundRect(-16, my - 4, 30, 30, 10).fill(sk.light).stroke(line(sk.line, 3));
    for (const [x, len] of [[-14, 20], [-5, 26], [4, 26], [13, 20]]) mark.roundRect(x - 4, my - len, 8, len + 4, 4).fill(sk.light).stroke(line(sk.line, 2.5));
    mark.roundRect(14, my, 16, 8, 4).fill(sk.light).stroke(line(sk.line, 2.5));
  }
  c.addChild(mark);
  return c;
}

/** The hub icon: a little cork board with one poster and a star stamp. */
export function iconArt(): Container {
  const c = new Container();
  const b = boardArt(150, 110);
  b.position.set(-75, -70);
  const sheet = new Graphics().roundRect(-44, -56, 88, 76, 4).fill(cream).stroke(line(0xc9b48f, 2));
  const t = thingArt('kite', 50);
  t.y = -22;
  const s = badgeArt('star', 26);
  s.position.set(28, 6);
  c.addChild(b, sheet, t, s);
  return c;
}
