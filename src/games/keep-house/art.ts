/**
 * Keep House's code-drawn pieces: the castle front and its doors, the well, the household with their tools, the yard rooms,
 * the plan's cells and room tiles, the need cards, the bell, Keep it, the ruin's cells, clues and picture labels, the timber and
 * stone halls with their rows, bags and year bar, the icon and the sticker. Stone, thatch, straw and fire from
 * the palette; no sepia, no "olde" lettering.
 */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { finish } from '../../ui/buttons';
import type { Build, Clue, Figure, Hall, PlanRoom, Room } from './logic';

const at = <T extends Container>(node: T, x: number, y: number): T => { node.position.set(x, y); return node; };
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
export const STONE = { fill: 0xc9c3b8, line: 0x8a837a, dark: 0xaaa397, light: 0xe6e1d8 };
const THATCH = { fill: 0xd9b36a, line: 0x9c7a35 };
const STRAW = 0xf0d78a;
const FIRE = { fill: 0xff9a3c, line: 0xd9731a, light: 0xffd54a };
const SKIN = 0xf6cfa8;
const SOUP = 0xd98a3c;
const HAY = 0xe8c860;

function stoneWall(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(STONE.fill).stroke(line(STONE.line, 4));
  // A few mortar lines; cosmetic.
  for (let r = 0; r * 34 + 18 < h; r++) {
    const yy = y + 18 + r * 34;
    g.moveTo(x + 4, yy).lineTo(x + w - 4, yy).stroke(line(STONE.dark, 2));
    for (let c = (r % 2) * 30 + 30; c < w - 6; c += 60) g.moveTo(x + c, yy).lineTo(x + c, Math.min(y + h - 4, yy + 34)).stroke(line(STONE.dark, 2));
  }
}

function crenels(g: Graphics, x: number, y: number, w: number) {
  for (let c = 0; c + 24 <= w + 1; c += 48) g.rect(x + c, y - 22, 24, 24).fill(STONE.fill).stroke(line(STONE.line, 4));
}

// ——— Level 1: the castle front ———

/** The front wall behind the doors: `w` wide, `h` tall, with towers at both ends. Drawn from its top-left. */
export function frontArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  stoneWall(g, 0, 60, w, h - 60);
  crenels(g, 0, 60, w);
  for (const x of [0, w - 90]) {
    stoneWall(g, x, 0, 90, h);
    crenels(g, x, 0, 90);
    g.rect(x + 35, 30, 20, 34).fill(ink);
  }
  return g;
}

/** A door in the wall, `w` × `h`, drawn from its top-left; open shows the dark doorway and the leaf swung aside. */
export function doorArt(w: number, h: number, open: boolean, glow = false): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  const r = w / 2;
  if (glow) {
    g.roundRect(-10, -10, w + 20, h + 20, 30).stroke({ width: 10, color: swatch.yellow.fill });
  }
  // The arch.
  g.moveTo(0, h).lineTo(0, r).arc(r, r, r, Math.PI, 0).lineTo(w, h).closePath().fill(open ? 0x3a2f2a : wood.fill).stroke(line(STONE.line, 5));
  if (open) {
    // The leaf swung to the left.
    g.moveTo(0, r).lineTo(-w * 0.35, r * 0.7).lineTo(-w * 0.35, h + 10).lineTo(0, h).closePath().fill(wood.fill).stroke(line(wood.line, 4));
  } else {
    for (const x of [w * 0.33, w * 0.66]) g.moveTo(x, r * 0.3 + (x === w * 0.33 ? 8 : 8)).lineTo(x, h - 8).stroke(line(wood.line, 3));
    g.circle(w * 0.78, h * 0.55, 7).fill(ink);
  }
  return g;
}

/** The well: a stone ring with a roof and a bucket on a rope; the bucket is up or down. Drawn with its base at (0, 0). */
export function wellArt(w: number, h: number, up: boolean): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  g.ellipse(0, -h * 0.28, w * 0.42, h * 0.1).fill(STONE.dark).stroke(line(STONE.line, 4));
  g.rect(-w * 0.42, -h * 0.28, w * 0.84, h * 0.28).fill(STONE.fill).stroke(line(STONE.line, 4));
  g.ellipse(0, -h * 0.28, w * 0.3, h * 0.07).fill(0x4f8fb3);
  for (const s of [-1, 1]) g.rect(s * w * 0.36 - 5, -h, 10, h * 0.75).fill(wood.fill).stroke(line(wood.line, 3));
  g.moveTo(-w * 0.5, -h * 0.75).lineTo(0, -h - 10).lineTo(w * 0.5, -h * 0.75).closePath().fill(THATCH.fill).stroke(line(THATCH.line, 4));
  const by = up ? -h * 0.6 : -h * 0.3;
  g.moveTo(0, -h * 0.8).lineTo(0, by - 16).stroke(line(wood.line, 3));
  g.roundRect(-16, by - 16, 32, 26, 6).fill(wood.fill).stroke(line(wood.line, 3));
  if (up) g.ellipse(0, by - 12, 12, 4).fill(0x4f8fb3);
  return g;
}

// ——— The household ———

function person(g: Graphics, color: number) {
  // Feet on (0, 0), about 120 tall.
  g.roundRect(-26, -78, 52, 70, 16).fill(color).stroke(line(ink, 4));
  g.circle(0, -98, 24).fill(SKIN).stroke(line(ink, 4));
  g.circle(-8, -100, 3).fill(ink);
  g.circle(8, -100, 3).fill(ink);
  g.moveTo(-8, -90).quadraticCurveTo(0, -84, 8, -90).stroke(line(ink, 3));
  for (const s of [-1, 1]) g.roundRect(s * 14 - 8, -10, 16, 12, 4).fill(ink);
}

function pot(g: Graphics, x: number, y: number, size = 36) {
  g.ellipse(x, y, size / 2, size / 2.6).fill(SOUP);
  g.roundRect(x - size / 2, y, size, size * 0.6, 8).fill(0x5a5a66).stroke(line(ink, 3));
  g.ellipse(x, y, size / 2, size / 3).fill(0x5a5a66).stroke(line(ink, 3));
  g.ellipse(x, y, size / 2.6, size / 4.2).fill(SOUP);
}

function fork(g: Graphics, x: number, y: number) {
  g.moveTo(x, y).lineTo(x, y - 90).stroke(line(wood.line, 5));
  for (const d of [-12, 0, 12]) g.moveTo(x, y - 86).lineTo(x + d, y - 110).stroke(line(0x8c8c9c, 4));
  g.ellipse(x, y - 60, 22, 10).fill(HAY).stroke(line(THATCH.line, 2));
}

function handBell(g: Graphics, x: number, y: number) {
  g.moveTo(x, y - 40).lineTo(x, y - 60).stroke(line(wood.line, 6));
  g.moveTo(x - 18, y).quadraticCurveTo(x - 20, y - 36, x, y - 40).quadraticCurveTo(x + 20, y - 36, x + 18, y).closePath().fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
  g.circle(x, y + 2, 5).fill(ink);
}

function keys(g: Graphics, x: number, y: number) {
  g.circle(x, y, 12).stroke(line(0x8c8c9c, 5));
  for (const a of [0.6, 1.4, 2.2]) {
    const kx = x + Math.cos(a) * 14, ky = y + Math.sin(a) * 14;
    g.moveTo(kx, ky).lineTo(kx + Math.cos(a) * 26, ky + Math.sin(a) * 26).stroke(line(swatch.yellow.line, 5));
  }
}

function horse(g: Graphics) {
  // Feet on (0, 0), about 110 tall and 120 wide.
  g.roundRect(-48, -70, 96, 48, 20).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
  for (const x of [-34, -12, 12, 34]) g.roundRect(x - 7, -28, 14, 28, 5).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
  g.roundRect(26, -118, 30, 62, 12).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
  g.roundRect(32, -110, 44, 30, 12).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
  g.circle(60, -102, 3).fill(ink);
  for (let i = 0; i < 5; i++) g.circle(30 + i * 5, -120 + i * 2, 5).fill(ink);
  g.moveTo(-46, -60).quadraticCurveTo(-70, -50, -62, -20).stroke(line(ink, 6));
  g.moveTo(44, -124).lineTo(50, -134).lineTo(54, -122).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
}

function hen(g: Graphics, x: number, y: number, color: number, flip = 1) {
  g.ellipse(x, y - 18, 22, 16).fill(color).stroke(line(ink, 3));
  g.circle(x + flip * 16, y - 34, 11).fill(color).stroke(line(ink, 3));
  g.moveTo(x + flip * 26, y - 34).lineTo(x + flip * 36, y - 30).lineTo(x + flip * 26, y - 28).fill(swatch.orange.fill);
  g.circle(x + flip * 19, y - 37, 2).fill(ink);
  for (const d of [-1, 1]) g.circle(x + flip * 16 + d * 3, y - 46, 4).fill(swatch.red.fill);
  for (const d of [-6, 6]) g.moveTo(x + d, y - 4).lineTo(x + d, y).stroke(line(swatch.orange.fill, 3));
}

/** A figure standing on (0, 0) with its tool; `working` shows the job (steam, eating, the bell swung, a barrel open, scratching). */
export function figureArt(figure: Figure, working = false): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  switch (figure) {
    case 'cook':
      person(g, swatch.red.fill);
      pot(g, 34, -40);
      if (working) for (const d of [-8, 8]) g.moveTo(34 + d, -62).quadraticCurveTo(34 + d + 6, -74, 34 + d, -86).stroke(line(0xffffff, 4));
      break;
    case 'groom':
      person(g, swatch.green.fill);
      fork(g, 36, -10);
      break;
    case 'ringer':
      person(g, swatch.purple.fill);
      handBell(g, working ? 44 : 36, working ? -70 : -40);
      break;
    case 'steward':
      person(g, swatch.blue.fill);
      keys(g, 38, -46);
      break;
    case 'horse':
      horse(g);
      if (working) g.ellipse(70, -6, 20, 8).fill(HAY).stroke(line(THATCH.line, 2));
      break;
    case 'hens':
      hen(g, -30, 0, 0xffffff);
      hen(g, 20, -6, swatch.brown.light, -1);
      hen(g, 40, 2, swatch.orange.light);
      if (working) for (const x of [-46, 52]) g.moveTo(x, -6).lineTo(x - 6, -16).moveTo(x, -6).lineTo(x + 6, -16).stroke(line(STRAW, 3));
      break;
  }
  c.addChild(g);
  return c;
}

// ——— Rooms ———

function hearth(g: Graphics, x: number, y: number, lit: boolean) {
  g.roundRect(x - 40, y - 60, 80, 60, 6).fill(STONE.dark).stroke(line(STONE.line, 4));
  g.roundRect(x - 26, y - 44, 52, 44, 4).fill(0x3a2f2a);
  if (lit) {
    g.moveTo(x - 18, y - 2).quadraticCurveTo(x - 20, y - 30, x, y - 40).quadraticCurveTo(x + 20, y - 30, x + 18, y - 2).closePath().fill(FIRE.fill).stroke(line(FIRE.line, 3));
    g.moveTo(x - 8, y - 2).quadraticCurveTo(x - 6, y - 20, x, y - 26).quadraticCurveTo(x + 6, y - 20, x + 8, y - 2).closePath().fill(FIRE.light);
  }
}

function manger(g: Graphics, x: number, y: number) {
  g.moveTo(x - 40, y - 30).lineTo(x + 40, y - 30).lineTo(x + 30, y).lineTo(x - 30, y).closePath().fill(wood.fill).stroke(line(wood.line, 4));
  g.ellipse(x, y - 30, 34, 10).fill(HAY).stroke(line(THATCH.line, 3));
}

function loftBell(g: Graphics, x: number, y: number, swung: boolean) {
  g.rect(x - 34, y - 70, 68, 8).fill(wood.fill).stroke(line(wood.line, 3));
  const a = swung ? 0.5 : 0;
  g.moveTo(x - 22 + a * 20, y).quadraticCurveTo(x - 26 + a * 10, y - 46, x + a * 14, y - 60).quadraticCurveTo(x + 26 + a * 14, y - 46, x + 22 + a * 24, y).closePath().fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.circle(x + a * 18, y + 2, 6).fill(ink);
}

function barrels(g: Graphics, x: number, y: number, open: boolean) {
  for (const [bx, by] of [[-30, 0], [30, 0], [0, -46]] as const) {
    g.roundRect(x + bx - 24, y + by - 46, 48, 46, 10).fill(wood.fill).stroke(line(wood.line, 4));
    g.rect(x + bx - 24, y + by - 34, 48, 5).fill(0x8c8c9c);
    g.rect(x + bx - 24, y + by - 18, 48, 5).fill(0x8c8c9c);
  }
  if (open) g.ellipse(x, y - 92, 24, 8).fill(wood.line);
}

function scratchGround(g: Graphics, x: number, y: number, w: number) {
  g.ellipse(x, y, w / 2, 16).fill(STRAW).stroke(line(THATCH.line, 3));
  for (let i = -2; i <= 2; i++) g.circle(x + i * 18, y - 4 + ((i + 2) % 2) * 6, 3).fill(THATCH.line);
}

function longTable(g: Graphics, x: number, y: number) {
  // A long table with a bench and a feast on it: the hall reads as the eating place, not a second kitchen.
  g.rect(x - 60, y - 34, 120, 12).fill(wood.fill).stroke(line(wood.line, 3));
  for (const d of [-50, 50]) g.rect(x + d - 4, y - 22, 8, 22).fill(wood.line);
  g.rect(x - 50, y - 10, 100, 6).fill(wood.fill).stroke(line(wood.line, 2));
  g.ellipse(x - 24, y - 40, 14, 7).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 2));
  g.circle(x + 6, y - 42, 8).fill(swatch.red.fill).stroke(line(swatch.red.line, 2));
  g.roundRect(x + 22, y - 54, 12, 20, 4).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  g.moveTo(x + 28, y - 54).lineTo(x + 28, y - 62).stroke(line(ink, 2));
  g.circle(x + 28, y - 66, 4).fill(FIRE.fill);
}

function windowSeat(g: Graphics, x: number, y: number) {
  g.roundRect(x - 24, y - 70, 48, 50, 20).fill(0xbfe6ff).stroke(line(STONE.line, 4));
  g.moveTo(x, y - 70).lineTo(x, y - 20).moveTo(x - 24, y - 45).lineTo(x + 24, y - 45).stroke(line(STONE.line, 3));
  g.rect(x - 34, y - 18, 68, 18).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
  g.circle(x + 44, y - 30, 10).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 2));
}

/** What a room shows inside, drawn with its floor at (0, 0). */
function furnish(g: Graphics, room: Room | PlanRoom, working: boolean, scale = 1) {
  g.scale.set(scale);
  switch (room) {
    case 'kitchen': hearth(g, 0, 0, working); break;
    case 'stable': manger(g, 0, 0); break;
    case 'loft': loftBell(g, 0, 0, working); break;
    case 'storeroom': barrels(g, 0, 0, working); break;
    case 'henyard': scratchGround(g, 0, -6, 120); break;
    case 'hall': longTable(g, 0, 0); break;
    case 'solar': windowSeat(g, 0, 0); break;
  }
}

/** A yard room: a stone building with a thatched roof open to the yard, `w` × `h` from its top-left, with its furnishing; `glow` rims it. */
export function roomArt(room: Room, w: number, h: number, working = false, glow = false): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  if (glow) g.roundRect(-10, -10, w + 20, h + 20, 30).stroke({ width: 10, color: swatch.yellow.fill });
  const roofH = 50;
  if (room === 'henyard') {
    g.roundRect(0, roofH, w, h - roofH, 12).fill(STRAW).stroke(line(THATCH.line, 4));
    for (let x = 10; x < w; x += 30) g.rect(x, roofH - 10, 8, 36).fill(wood.fill).stroke(line(wood.line, 2));
    g.rect(0, roofH + 10, w, 6).fill(wood.fill);
  } else {
    stoneWall(g, 0, roofH, w, h - roofH);
    g.moveTo(-8, roofH).lineTo(w / 2, 0).lineTo(w + 8, roofH).closePath().fill(THATCH.fill).stroke(line(THATCH.line, 4));
    g.rect(16, roofH + 14, w - 32, h - roofH - 14).fill(0x6b5a4e);
  }
  c.addChild(g);
  const inside = new Graphics();
  inside.position.set(w / 2, h - 12);
  furnish(inside, room, working);
  c.addChild(inside);
  return c;
}

/** A room tile (levels 3–4): a square card with the room's picture; `size` square, centred on (0, 0). */
export function tileArt(room: PlanRoom, size: number, glow = false): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  if (glow) g.roundRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 24).stroke({ width: 8, color: swatch.yellow.fill });
  g.roundRect(-size / 2, -size / 2 + 5, size, size, 16).fill(STONE.line);
  g.roundRect(-size / 2, -size / 2, size, size, 16).fill(STONE.light).stroke(line(STONE.line, 4));
  c.addChild(g);
  const inside = new Graphics();
  inside.position.set(0, size * 0.36);
  furnish(inside, room, true, size / 150);
  c.addChild(inside);
  return c;
}

/** The hall or the gate that stays put at level 3, `w` × `h` from its top-left. */
export function fixedArt(kind: 'hall' | 'gate', w: number, h: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  if (kind === 'hall') {
    stoneWall(g, 0, 50, w, h - 50);
    g.moveTo(-8, 50).lineTo(w / 2, 0).lineTo(w + 8, 50).closePath().fill(THATCH.fill).stroke(line(THATCH.line, 4));
    g.rect(16, 64, w - 32, h - 64).fill(0x6b5a4e);
    c.addChild(g);
    const inside = new Graphics();
    inside.position.set(w / 2, h - 12);
    furnish(inside, 'hall', true, 0.9);
    c.addChild(inside);
  } else {
    stoneWall(g, 0, 30, w, h - 30);
    crenels(g, 0, 30, w);
    const r = w * 0.3;
    g.moveTo(w / 2 - r, h).lineTo(w / 2 - r, h - 90).arc(w / 2, h - 90, r, Math.PI, 0).lineTo(w / 2 + r, h).closePath().fill(0x3a2f2a).stroke(line(STONE.line, 5));
    for (let y = h - 90 - r + 10; y < h; y += 24) g.moveTo(w / 2 - r + 6, y).lineTo(w / 2 + r - 6, y).stroke(line(wood.line, 4));
    c.addChild(g);
  }
  return c;
}

/** A spot where a room can go: a dotted outline on the ground, `size` square centred on (0, 0); `lit` while a tile is held, `glow` for the hint. */
export function spotArt(size: number, lit: boolean, glow = false): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  if (glow) g.roundRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 26).stroke({ width: 8, color: swatch.yellow.fill });
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill({ color: lit ? swatch.yellow.light : cream, alpha: lit ? 0.9 : 0.6 }).stroke({ width: 5, color: STONE.line, alpha: 0.9 });
  for (let i = 0; i < 4; i++) g.circle(-size / 2 + 16 + (i % 2) * (size - 32), -size / 2 + 16 + Math.floor(i / 2) * (size - 32), 5).fill(STONE.line);
  return g;
}

/** A plan cell, `size` square from its top-left: the ground, or a fixed feature (well, gate), the shaded corner or a sunny cell. */
export function cellArt(size: number, kind: 'ground' | 'well' | 'gate' | 'cool' | 'sunny' | 'cool-sunny', lit = false, glow = false): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  if (glow) g.roundRect(-8, -8, size + 16, size + 16, 22).stroke({ width: 8, color: swatch.yellow.fill });
  const sunny = kind === 'sunny' || kind === 'cool-sunny';
  const cool = kind === 'cool' || kind === 'cool-sunny';
  const base = kind === 'well' || kind === 'gate' ? STONE.fill : lit ? swatch.yellow.light : sunny ? 0xfff0b3 : cool ? 0xb9c3cc : 0xd6f5c8;
  g.roundRect(0, 0, size, size, 14).fill(base).stroke(line(STONE.line, 4));
  if (cool) for (let i = 0; i < 4; i++) g.moveTo(6 + i * 14, 6).lineTo(6, 6 + i * 14).stroke(line(0x7f8c99, 3));
  if (sunny) g.circle(size - 18, 18, 10).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  if (kind === 'well') {
    g.ellipse(size / 2, size * 0.62, size * 0.26, size * 0.1).fill(STONE.dark).stroke(line(STONE.line, 3));
    g.rect(size / 2 - size * 0.26, size * 0.42, size * 0.52, size * 0.2).fill(STONE.fill).stroke(line(STONE.line, 3));
    g.ellipse(size / 2, size * 0.42, size * 0.26, size * 0.1).fill(0x4f8fb3).stroke(line(STONE.line, 3));
    g.moveTo(size * 0.26, size * 0.42).lineTo(size / 2, size * 0.18).lineTo(size * 0.74, size * 0.42).stroke(line(wood.line, 4));
  }
  if (kind === 'gate') {
    const r = size * 0.26;
    g.moveTo(size / 2 - r, size - 8).lineTo(size / 2 - r, size * 0.5).arc(size / 2, size * 0.5, r, Math.PI, 0).lineTo(size / 2 + r, size - 8).closePath().fill(0x3a2f2a).stroke(line(STONE.line, 4));
    for (let y = size * 0.3; y < size - 8; y += 16) g.moveTo(size / 2 - r + 5, y).lineTo(size / 2 + r - 5, y).stroke(line(wood.line, 3));
  }
  return g;
}

/** A need card, `w` × `h` centred on (0, 0): two pictures with a link between them. `met` ticks it. */
export function needArt(index: number, w: number, h: number, met: boolean | null): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 4, w, h, 18).fill(STONE.line);
  g.roundRect(-w / 2, -h / 2, w, h, 18).fill(met === true ? swatch.green.light : met === false ? swatch.orange.light : cream).stroke(line(STONE.line, 4));
  c.addChild(g);
  const left = new Graphics();
  left.position.set(-w * 0.28, h * 0.32);
  const right = new Graphics();
  right.position.set(w * 0.22, h * 0.32);
  const linkG = new Graphics();
  const k = 0.42;
  switch (index) {
    case 1: furnish(left, 'kitchen', true, k); furnish(right, 'hall', true, k); break;
    case 2: furnish(left, 'kitchen', true, k); right.addChild(at(cellArt(54, 'well'), -27, -58)); break;
    case 3: furnish(left, 'stable', true, k); right.addChild(at(cellArt(54, 'gate'), -27, -58)); break;
    case 4: furnish(left, 'storeroom', false, k); right.addChild(at(cellArt(54, 'cool'), -27, -58)); break;
    case 5: furnish(left, 'solar', true, k); right.addChild(at(cellArt(54, 'sunny'), -27, -58)); break;
  }
  // The link: touching (1, 3), near (2) or "in" (4, 5).
  const lx = -w * 0.03, ly = 0;
  if (index === 1 || index === 3) linkG.rect(lx - 10, ly - 12, 20, 24).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  else if (index === 2) linkG.moveTo(lx - 16, ly).lineTo(lx + 16, ly).stroke(line(swatch.green.line, 5));
  else linkG.moveTo(lx - 6, ly - 14).lineTo(lx + 10, ly).lineTo(lx - 6, ly + 14).stroke(line(swatch.green.line, 5));
  c.addChild(left, right, linkG);
  if (met === true) {
    const t = new Graphics();
    t.moveTo(w / 2 - 34, -h / 2 + 24).lineTo(w / 2 - 24, -h / 2 + 34).lineTo(w / 2 - 8, -h / 2 + 12).stroke(line(swatch.green.line, 6));
    c.addChild(t);
  }
  return c;
}

/** The Finish bell, `w` × `h` centred on (0, 0), on a button face; `on` once every room is placed. */
export function bellArt(w: number, h: number, on: boolean): Container {
  const c = new Container();
  c.addChild(finish({ w, h, corner: 28 }, on ? swatch.yellow : swatch.white, on ? swatch.yellow.fill : STONE.light));
  const g = new Graphics();
  g.eventMode = 'none';
  g.moveTo(0, -40).lineTo(0, -28).stroke(line(wood.line, 6));
  g.moveTo(-26, 22).quadraticCurveTo(-28, -22, 0, -30).quadraticCurveTo(28, -22, 26, 22).closePath().fill(on ? swatch.orange.fill : STONE.fill).stroke(line(on ? swatch.orange.line : STONE.line, 4));
  g.rect(-30, 20, 60, 8).fill(on ? swatch.orange.line : STONE.line);
  g.circle(0, 30, 7).fill(ink);
  c.addChild(g);
  return c;
}

/** The Keep it control: a tile held in place, with a small padlock. */
export function keepArt(w: number, h: number): Container {
  const c = new Container();
  c.addChild(finish({ w, h, corner: 28 }, swatch.blue));
  const g = new Graphics();
  g.eventMode = 'none';
  g.roundRect(-50, -24, 48, 48, 10).fill(STONE.light).stroke(line(STONE.line, 4));
  g.roundRect(-40, -14, 28, 28, 6).fill(swatch.green.fill);
  g.roundRect(10, -6, 40, 32, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.moveTo(18, -6).lineTo(18, -16).arc(30, -16, 12, Math.PI, 0).lineTo(42, -6).stroke(line(swatch.yellow.line, 5));
  g.circle(30, 10, 5).fill(ink);
  c.addChild(g);
  return c;
}

/** Steam over a carried pot (hot) or a wisp fading (cold). */
export function steamArt(hot: boolean): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  for (const d of hot ? [-10, 0, 10] : [0]) g.moveTo(d, 0).quadraticCurveTo(d + 8, -14, d, -28).stroke({ width: 5, color: 0xffffff, alpha: hot ? 0.95 : 0.4, cap: 'round' });
  return g;
}

/** The hub icon: a small castle front with one open door and a pot, feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  stoneWall(g, -70, -90, 140, 90);
  crenels(g, -70, -90, 140);
  for (const x of [-80, 50]) { stoneWall(g, x, -120, 30, 120); crenels(g, x, -120, 30); }
  c.addChild(g);
  const d = doorArt(44, 60, true);
  d.position.set(-22, -60);
  c.addChild(d);
  const p = new Graphics();
  pot(p, 32, -34, 30);
  c.addChild(p);
  return c;
}

/** A seeded sticker: a small plan with the five rooms placed and the cook at the hearth. */
export function stickerArt(cells: number[], cook: number): Container {
  const c = new Container();
  const size = 30, gap = 4;
  const g = new Graphics();
  g.roundRect(-58, -58, 116, 116, 14).fill(STONE.fill).stroke(line(STONE.line, 4));
  c.addChild(g);
  const rooms: PlanRoom[] = ['hall', 'kitchen', 'stable', 'storeroom', 'solar'];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3), col = i % 3;
    const at = rooms[cells.indexOf(i)];
    const cell = new Graphics();
    cell.roundRect(0, 0, size, size, 6).fill(at ? 0xd6f5c8 : cream).stroke(line(STONE.line, 2));
    cell.position.set(-51 + col * (size + gap), -51 + r * (size + gap));
    c.addChild(cell);
    if (at) {
      const inside = new Graphics();
      inside.position.set(cell.x + size / 2, cell.y + size - 4);
      furnish(inside, at, true, 0.22);
      c.addChild(inside);
    }
  }
  const cookArt = figureArt('cook', true);
  cookArt.scale.set(0.3);
  const r = Math.floor(cook / 3), col = cook % 3;
  cookArt.position.set(-51 + col * (size + gap) + size / 2 + 6, -51 + r * (size + gap) + size - 2);
  c.addChild(cookArt);
  const s = new Graphics();
  s.ellipse(0, 64, 56, 8).fill({ color: shadow, alpha: 0.15 });
  c.addChildAt(s, 0);
  return c;
}

// ——— Level 5: the ruin ———

/** One clue, drawn small (about 44 units) with its floor at (x, y). Mangers carry no hay, so they never match the stable's label. */
function clue(g: Graphics, c: Clue, x: number, y: number) {
  switch (c) {
    case 'hearth':
      g.roundRect(x - 24, y - 34, 48, 34, 4).fill(STONE.dark).stroke(line(STONE.line, 3));
      g.roundRect(x - 15, y - 24, 30, 24, 3).fill(0x3a2f2a);
      g.circle(x - 5, y - 4, 3).fill(0x8a837a).circle(x + 6, y - 5, 3).fill(0x8a837a);
      break;
    case 'oven':
      g.moveTo(x - 22, y).arc(x, y, 22, Math.PI, 0).closePath().fill(STONE.dark).stroke(line(STONE.line, 3));
      g.moveTo(x - 9, y).arc(x, y, 9, Math.PI, 0).closePath().fill(0x3a2f2a);
      break;
    case 'dais':
      g.rect(x - 26, y - 12, 52, 12).fill(STONE.light).stroke(line(STONE.line, 3));
      g.rect(x - 18, y - 22, 36, 10).fill(STONE.light).stroke(line(STONE.line, 3));
      break;
    case 'drain':
      g.rect(x - 24, y - 10, 48, 10).fill(STONE.dark).stroke(line(STONE.line, 3));
      g.rect(x - 20, y - 7, 40, 4).fill(0x4f8fb3);
      g.moveTo(x + 24, y - 5).lineTo(x + 30, y - 5).stroke(line(0x4f8fb3, 4));
      break;
    case 'mangers':
      for (const d of [-14, 14]) g.moveTo(x + d - 13, y - 20).lineTo(x + d + 13, y - 20).lineTo(x + d + 9, y).lineTo(x + d - 9, y).closePath().fill(STONE.fill).stroke(line(STONE.line, 3));
      break;
    case 'wide-door':
      g.rect(x - 24, y - 40, 48, 40).fill(STONE.fill).stroke(line(STONE.line, 3));
      g.moveTo(x - 18, y).lineTo(x - 18, y - 22).arc(x, y - 22, 18, Math.PI, 0).lineTo(x + 18, y).closePath().fill(0x3a2f2a);
      break;
    case 'window-seat':
      g.roundRect(x - 14, y - 40, 28, 24, 10).fill(0xbfe6ff).stroke(line(STONE.line, 3));
      for (const d of [-20, 20]) g.rect(x + d - 7, y - 14, 14, 14).fill(STONE.light).stroke(line(STONE.line, 3));
      break;
    case 'cellar-steps':
      g.rect(x - 22, y - 30, 44, 30).fill(0x3a2f2a).stroke(line(STONE.line, 3));
      for (let i = 0; i < 3; i++) g.rect(x - 22 + i * 7, y - 30 + i * 10, 44 - i * 7, 10).fill(STONE.fill).stroke(line(STONE.line, 2));
      break;
  }
}

/** A roofless ruin cell, `size` square from its top-left: broken low walls and the remains inside. `lit` while a label hovers, `glow` on the deciding clue named. */
export function ruinCellArt(size: number, shown: readonly Clue[], lit = false, glow: Clue | null = null): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  g.roundRect(0, 0, size, size, 14).fill(lit ? swatch.yellow.light : 0xcdbfa6).stroke(line(STONE.line, 4));
  // Broken low walls: a ragged top edge on three sides.
  g.moveTo(6, 22).lineTo(30, 22).lineTo(36, 12).lineTo(58, 12).lineTo(64, 20).lineTo(size - 22, 20).lineTo(size - 14, 8).lineTo(size - 6, 8).stroke(line(STONE.dark, 6));
  g.moveTo(8, 26).lineTo(8, size - 30).moveTo(size - 8, 14).lineTo(size - 8, size - 40).stroke(line(STONE.dark, 6));
  c.addChild(g);
  const n = shown.length;
  const slots = n === 1 ? [[size / 2, size * 0.78]] : n === 2 ? [[size * 0.3, size * 0.78], [size * 0.7, size * 0.78]] : [[size * 0.28, size * 0.52], [size * 0.72, size * 0.52], [size / 2, size * 0.9]];
  shown.forEach((k, i) => {
    const d = new Graphics();
    const [x, y] = slots[i];
    if (glow === k) d.circle(x, y - 18, 32).fill({ color: swatch.yellow.fill, alpha: 0.5 }).stroke({ width: 6, color: swatch.yellow.fill });
    clue(d, k, x, y);
    c.addChild(d);
  });
  return c;
}

/** A label's picture, never one of the clues: the hall a table with cups, the kitchen a pot, the stable hay, the storeroom a chest, the solar a bed. Floor at (0, 0), about 90 wide. */
function labelPicture(g: Graphics, room: PlanRoom) {
  switch (room) {
    case 'hall':
      g.rect(-40, -30, 80, 10).fill(wood.fill).stroke(line(wood.line, 3));
      for (const d of [-32, 32]) g.rect(d - 4, -20, 8, 20).fill(wood.line);
      for (const d of [-20, 0, 20]) g.roundRect(d - 6, -46, 12, 16, 3).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
      break;
    case 'kitchen': pot(g, 0, -34, 52); break;
    case 'stable':
      g.moveTo(-40, 0).quadraticCurveTo(-30, -44, 0, -50).quadraticCurveTo(30, -44, 40, 0).closePath().fill(HAY).stroke(line(THATCH.line, 3));
      for (const d of [-18, 0, 18]) g.moveTo(d, -6).lineTo(d + 6, -34).stroke(line(THATCH.line, 2));
      break;
    case 'storeroom':
      g.roundRect(-34, -40, 68, 40, 6).fill(wood.fill).stroke(line(wood.line, 3));
      g.moveTo(-34, -26).lineTo(34, -26).stroke(line(wood.line, 3));
      g.rect(-6, -32, 12, 12).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
      break;
    case 'solar':
      g.rect(-40, -24, 80, 16).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
      g.rect(-44, -44, 10, 44).fill(wood.fill).stroke(line(wood.line, 2));
      g.rect(34, -32, 10, 32).fill(wood.fill).stroke(line(wood.line, 2));
      g.ellipse(-22, -30, 12, 7).fill(0xffffff).stroke(line(STONE.line, 2));
      break;
  }
}

/** A picture label card, `size` square centred on (0, 0). */
export function labelArt(room: PlanRoom, size: number, glow = false): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  if (glow) g.roundRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 24).stroke({ width: 8, color: swatch.yellow.fill });
  g.roundRect(-size / 2, -size / 2 + 5, size, size, 16).fill(wood.line);
  g.roundRect(-size / 2, -size / 2, size, size, 16).fill(cream).stroke(line(wood.line, 4));
  c.addChild(g);
  const p = new Graphics();
  p.position.set(0, size * 0.3);
  p.scale.set(size / 110);
  labelPicture(p, room);
  c.addChild(p);
  return c;
}

// ——— Level 6: timber or stone ———

/** A hall at the site, `w` wide with its floor at (0, 0) centred: timber, greying timber, a rotted heap, scaffolding (with the shelter), stone, or stone half up. */
export function hallArt(hall: Hall, w: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const h = w * 0.55;
  const TIMBER = { fill: 0xc8935a, line: 0x7a5530 };
  const grey = { fill: 0xa89c8c, line: 0x6e655a };
  if (hall === 'timber' || hall === 'old-timber') {
    const t = hall === 'timber' ? TIMBER : grey;
    const sag = hall === 'old-timber' ? 10 : 0;
    g.rect(-w / 2, -h, w, h).fill(t.fill).stroke(line(t.line, 4));
    for (let x = -w / 2 + 20; x < w / 2; x += 26) g.moveTo(x, -h).lineTo(x, 0).stroke(line(t.line, 2));
    g.moveTo(-w / 2 - 14, -h).lineTo(0, -h - w * 0.32 + sag).lineTo(w / 2 + 14, -h + sag).closePath().fill(THATCH.fill).stroke(line(THATCH.line, 4));
    g.roundRect(-24, -60, 48, 60, 6).fill(0x3a2f2a);
  } else if (hall === 'rotted') {
    g.moveTo(-w / 2, 0).lineTo(-w / 3, -30).lineTo(-w / 8, -18).lineTo(w / 6, -40).lineTo(w / 2, 0).closePath().fill(grey.fill).stroke(line(grey.line, 4));
    for (const d of [-0.3, 0, 0.25]) g.moveTo(w * d, -6).lineTo(w * d + 30, -46).stroke(line(grey.line, 6));
  } else if (hall === 'scaffold' || hall === 'half-up') {
    const wh = hall === 'scaffold' ? h * 0.6 : h * 0.35;
    stoneWall(g, -w / 2, -wh, w, wh);
    if (hall === 'scaffold') {
      for (let x = -w / 2; x <= w / 2; x += w / 4) g.moveTo(x, 0).lineTo(x, -h - 10).stroke(line(wood.line, 4));
      for (const y of [-h * 0.5, -h]) g.moveTo(-w / 2, y).lineTo(w / 2, y).stroke(line(wood.line, 4));
    }
    // The household's small shelter beside the works.
    g.rect(w / 2 + 14, -46, 50, 46).fill(TIMBER.fill).stroke(line(TIMBER.line, 3));
    g.moveTo(w / 2 + 6, -46).lineTo(w / 2 + 39, -72).lineTo(w / 2 + 72, -46).closePath().fill(THATCH.fill).stroke(line(THATCH.line, 3));
  } else {
    stoneWall(g, -w / 2, -h, w, h);
    crenels(g, -w / 2, -h, w);
    g.moveTo(-26, 0).lineTo(-26, -40).arc(0, -40, 26, Math.PI, 0).lineTo(26, 0).closePath().fill(0x3a2f2a);
  }
  c.addChild(g);
  return c;
}

/** A bag of the purse, `size` tall with its floor at (0, 0) centred; `spent` greys it. */
export function bagArt(size: number, spent = false): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  const k = size / 60;
  const f = spent ? { fill: 0xe8e2d6, line: 0xc9c3b8 } : { fill: 0xd9a35a, line: 0x8a5a24 };
  g.moveTo(-22 * k, 0).quadraticCurveTo(-28 * k, -36 * k, -10 * k, -46 * k).lineTo(10 * k, -46 * k).quadraticCurveTo(28 * k, -36 * k, 22 * k, 0).closePath().fill(f.fill).stroke(line(f.line, 3));
  g.moveTo(-12 * k, -46 * k).lineTo(0, -58 * k).lineTo(12 * k, -46 * k).stroke(line(f.line, 3));
  return g;
}

/** The year bar: one mark per 5 years of the stay, filled up to `now`; `w` wide from (0, 0). */
export function yearBarArt(years: number, now: number, w: number): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  const n = years / 5;
  const step = w / n;
  for (let i = 0; i < n; i++) {
    g.roundRect(i * step + 2, 0, step - 4, 24, 6).fill(i * 5 < now ? swatch.green.fill : cream).stroke(line(STONE.line, 2));
    if ((i + 1) % 3 === 0) g.moveTo((i + 1) * step - 1, -6).lineTo((i + 1) * step - 1, 30).stroke(line(swatch.orange.line, 3));
  }
  return g;
}

/** A choice row on the build card, `w` × `h` centred on (0, 0): the hall, its bags, and its life in 5-year marks (timber 3 then rot; stone 8 years of scaffold then standing). */
export function rowArt(build: Build, w: number, h: number, lifted: boolean, glow: boolean): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  if (glow) g.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 26).stroke({ width: 8, color: swatch.yellow.fill });
  g.roundRect(-w / 2, -h / 2 + 5, w, h, 18).fill(STONE.line);
  g.roundRect(-w / 2, -h / 2, w, h, 18).fill(lifted ? swatch.yellow.light : cream).stroke(line(STONE.line, 4));
  c.addChild(g);
  const hall = hallArt(build === 'timber' ? 'timber' : 'stone', 70);
  hall.position.set(-w / 2 + 52, h / 2 - 16);
  c.addChild(hall);
  const n = build === 'timber' ? 2 : 5;
  for (let i = 0; i < n; i++) {
    const b = bagArt(30);
    b.position.set(-w / 2 + 110 + i * 26, -2);
    c.addChild(b);
  }
  const life = new Graphics();
  const x0 = -w / 2 + 104, y0 = 14, cell = 22;
  if (build === 'timber') {
    for (let i = 0; i < 3; i++) life.roundRect(x0 + i * cell, y0, cell - 4, 18, 4).fill(0xc8935a).stroke(line(0x7a5530, 2));
    life.moveTo(x0 + 3 * cell + 4, y0 + 18).lineTo(x0 + 3 * cell + 16, y0 + 4).lineTo(x0 + 3 * cell + 28, y0 + 18).stroke(line(0x6e655a, 4));
  } else {
    for (let i = 0; i < 2; i++) life.roundRect(x0 + i * cell, y0, cell - 4, 18, 4).fill(wood.fill).stroke(line(wood.line, 2));
    for (let i = 2; i < 8; i++) life.roundRect(x0 + i * cell, y0, cell - 4, 18, 4).fill(STONE.fill).stroke(line(STONE.line, 2));
  }
  c.addChild(life);
  return c;
}

/** The Build button: a mallet on a button face; `again` adds a turn-around arrow. */
export function buildButtonArt(w: number, h: number, on: boolean, again: boolean): Container {
  const c = new Container();
  c.addChild(finish({ w, h, corner: 28 }, on ? swatch.green : swatch.white, on ? swatch.green.fill : STONE.light));
  const g = new Graphics();
  g.eventMode = 'none';
  g.moveTo(-10, 30).lineTo(16, -14).stroke(line(wood.line, 8));
  g.roundRect(-4, -36, 46, 26, 6).fill(STONE.fill).stroke(line(STONE.line, 4));
  if (again) g.arc(-30, 0, 18, -0.5, Math.PI * 1.3).stroke(line(ink, 5)).moveTo(-48, -10).lineTo(-48, 6).lineTo(-34, 0).stroke(line(ink, 5));
  c.addChild(g);
  return c;
}
