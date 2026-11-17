/**
 * Timeline Trail's code-drawn pictures: the five places at each stage, the picture cards, the two posts, the pegged
 * gaps, the clothesline, level 5's chips and ribbon, level 6's mist, the flipbook frame, the hub icon and the sticker. The later places
 * (green, oven) are built from element drawers, so a chip shows exactly the thing its picture shows.
 * Palette: src/art/palette.ts.
 */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { PLACES, type LaterPlace, type PlaceId } from './logic';

const SKY = 0xcfeaff;
const SEA = 0x6fb8e8;
const SAND = 0xf3dfae;
const GRASS = 0xa9dd8a;
const LEAF = 0x5fbf5a;
const TRUNK = 0x9c6b3c;
const SEPIA = 0xb89a6a;

/** The picture for a place's stage, drawn inside a `size` square centred on (0, 0); `color` is the pet's. */
export function picture(placeId: PlaceId, stage: number, size: number, color: ColorName = 'teal'): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const s = size / 2;
  const u = size / 100;
  // Sky and ground.
  g.rect(-s, -s, size, size).fill(SKY);
  if (placeId === 'shore') drawShore(g, stage, s, u);
  else if (placeId === 'tree') drawTree(g, stage, s, u);
  else if (placeId === 'green') drawGreen(g, stage, s, u);
  else if (placeId === 'oven') drawOven(g, stage, s, u);
  else drawNest(g, stage, s, u, color);
  return c;
}

function drawShore(g: Graphics, stage: number, s: number, u: number) {
  g.rect(-s, 10 * u, s * 2, s - 10 * u).fill(SEA);
  g.moveTo(-s, 28 * u)
    .quadraticCurveTo(-s * 0.3, 14 * u, s * 0.1, 30 * u)
    .quadraticCurveTo(s * 0.5, 44 * u, s, 24 * u)
    .lineTo(s, s)
    .lineTo(-s, s)
    .fill(SAND);
  // Stage 0: one rock on the sand.
  g.ellipse(-26 * u, 36 * u, 12 * u, 8 * u)
    .fill(0xb5aa9a)
    .stroke({ width: 2 * u, color: ink });
  if (stage >= 1) {
    // A little dock: posts and planks out over the water.
    for (const x of [-4, 12, 28]) g.rect(x * u - 2 * u, 4 * u, 4 * u, 22 * u).fill(TRUNK);
    g.roundRect(-14 * u, 2 * u, 50 * u, 7 * u, 2 * u)
      .fill(wood.fill)
      .stroke({ width: 2 * u, color: wood.line });
  }
  if (stage >= 2) {
    // A boat shed at the shore end of the dock.
    g.rect(-40 * u, -18 * u, 28 * u, 24 * u)
      .fill(0xd98c5f)
      .stroke({ width: 2 * u, color: ink });
    g.moveTo(-44 * u, -18 * u)
      .lineTo(-26 * u, -34 * u)
      .lineTo(-8 * u, -18 * u)
      .fill(0xa85a3a)
      .stroke({ width: 2 * u, color: ink });
    g.rect(-32 * u, -8 * u, 10 * u, 14 * u).fill(0x6b4a33);
  }
  if (stage >= 3) {
    // A boat moored at the dock and a lantern on a pole.
    g.moveTo(14 * u, 14 * u)
      .lineTo(44 * u, 14 * u)
      .lineTo(38 * u, 24 * u)
      .lineTo(20 * u, 24 * u)
      .fill(swatch.red.fill)
      .stroke({ width: 2 * u, color: ink });
    g.rect(28 * u, 2 * u, 2 * u, 12 * u).fill(ink);
    g.moveTo(29 * u, 2 * u)
      .lineTo(29 * u, 12 * u)
      .lineTo(40 * u, 8 * u)
      .fill(swatch.white.fill)
      .stroke({ width: 1.5 * u, color: ink });
    g.rect(36 * u, -22 * u, 3 * u, 26 * u).fill(TRUNK);
    g.roundRect(32 * u, -30 * u, 11 * u, 10 * u, 2 * u)
      .fill(swatch.yellow.fill)
      .stroke({ width: 2 * u, color: ink });
    g.circle(37.5 * u, -25 * u, 6 * u).fill({ color: swatch.yellow.light, alpha: 0.6 });
  }
}

function drawTree(g: Graphics, stage: number, s: number, u: number) {
  g.rect(-s, 26 * u, s * 2, s - 26 * u).fill(GRASS);
  if (stage === 0) {
    // A sapling: a thin stem with two leaves.
    g.moveTo(0, 30 * u)
      .lineTo(0, 8 * u)
      .stroke({ width: 3 * u, color: LEAF, cap: 'round' });
    g.ellipse(-8 * u, 12 * u, 9 * u, 5 * u)
      .fill(LEAF)
      .stroke({ width: 1.5 * u, color: ink });
    g.ellipse(8 * u, 6 * u, 9 * u, 5 * u)
      .fill(LEAF)
      .stroke({ width: 1.5 * u, color: ink });
    return;
  }
  const big = stage >= 2;
  const trunkW = big ? 14 * u : 7 * u;
  const trunkTop = big ? -10 * u : 2 * u;
  g.roundRect(-trunkW / 2, trunkTop, trunkW, 30 * u - trunkTop, 3 * u)
    .fill(TRUNK)
    .stroke({ width: 2 * u, color: ink });
  const crownR = big ? 32 * u : 16 * u;
  const crownY = big ? -18 * u : -8 * u;
  g.circle(0, crownY, crownR)
    .fill(LEAF)
    .stroke({ width: 2 * u, color: ink });
  if (big) {
    g.circle(-20 * u, crownY + 10 * u, 16 * u)
      .fill(LEAF)
      .stroke({ width: 2 * u, color: ink });
    g.circle(22 * u, crownY + 8 * u, 15 * u)
      .fill(LEAF)
      .stroke({ width: 2 * u, color: ink });
    g.circle(-20 * u, crownY + 10 * u, 14 * u).fill(LEAF);
    g.circle(22 * u, crownY + 8 * u, 13 * u).fill(LEAF);
    g.circle(0, crownY, crownR - 2 * u).fill(LEAF);
  }
  if (stage >= 3) {
    // A swing hung from a branch: two ropes and a seat.
    const bx = 26 * u;
    g.moveTo(bx - 8 * u, crownY + 20 * u)
      .lineTo(bx - 8 * u, 34 * u)
      .stroke({ width: 2 * u, color: wood.line });
    g.moveTo(bx + 8 * u, crownY + 20 * u)
      .lineTo(bx + 8 * u, 34 * u)
      .stroke({ width: 2 * u, color: wood.line });
    g.roundRect(bx - 12 * u, 33 * u, 24 * u, 5 * u, 2 * u)
      .fill(wood.fill)
      .stroke({ width: 2 * u, color: ink });
  }
}

function drawNest(g: Graphics, stage: number, s: number, u: number, color: ColorName) {
  const body = swatch[color];
  if (stage === 3) {
    // The treehouse door: planks and an arch; the pet itself is the companion rig, added by the caller.
    g.rect(-s, -s, s * 2, s * 2).fill(wood.light);
    for (let x = -s; x < s; x += 18 * u) g.rect(x, -s, 2 * u, s * 2).fill({ color: wood.line, alpha: 0.35 });
    g.roundRect(-30 * u, -28 * u, 60 * u, 78 * u, 28 * u)
      .fill(0x5a3b26)
      .stroke({ width: 3 * u, color: ink });
    return;
  }
  g.rect(-s, 30 * u, s * 2, s - 30 * u).fill(GRASS);
  // A nest of twigs.
  g.ellipse(0, 26 * u, 34 * u, 14 * u)
    .fill(0xc9a46a)
    .stroke({ width: 2 * u, color: wood.line });
  for (let i = -3; i <= 3; i++)
    g.moveTo(i * 9 * u - 6 * u, 32 * u)
      .lineTo(i * 9 * u + 6 * u, 22 * u)
      .stroke({ width: 2 * u, color: wood.line });
  if (stage === 0) {
    g.ellipse(0, 12 * u, 16 * u, 20 * u)
      .fill(cream)
      .stroke({ width: 2 * u, color: ink });
    g.circle(-5 * u, 6 * u, 3 * u).fill(body.light);
    g.circle(6 * u, 16 * u, 3 * u).fill(body.light);
    return;
  }
  const r = stage === 1 ? 14 * u : 20 * u;
  const cy = stage === 1 ? 14 * u : 4 * u;
  g.circle(0, cy, r)
    .fill(body.fill)
    .stroke({ width: 2 * u, color: body.line });
  g.circle(-r * 0.35, cy - r * 0.2, 2.5 * u).fill(ink);
  g.circle(r * 0.35, cy - r * 0.2, 2.5 * u).fill(ink);
  g.moveTo(-3 * u, cy + r * 0.3)
    .quadraticCurveTo(0, cy + r * 0.5, 3 * u, cy + r * 0.3)
    .stroke({ width: 1.5 * u, color: ink });
  if (stage === 1) {
    // A hatchling still wearing a bit of shell.
    g.moveTo(-8 * u, cy - r)
      .lineTo(-3 * u, cy - r - 6 * u)
      .lineTo(2 * u, cy - r)
      .lineTo(7 * u, cy - r - 5 * u)
      .lineTo(10 * u, cy - r + 2 * u)
      .fill(cream)
      .stroke({ width: 1.5 * u, color: ink });
  } else {
    // A first scarf.
    g.roundRect(-r, cy + r * 0.55, r * 2, 7 * u, 3 * u)
      .fill(swatch.red.fill)
      .stroke({ width: 1.5 * u, color: ink });
    g.roundRect(r * 0.3, cy + r * 0.55, 7 * u, 18 * u, 3 * u)
      .fill(swatch.red.fill)
      .stroke({ width: 1.5 * u, color: ink });
  }
}

// ——— The later places' elements: each draws one named thing about (x, y), in picture units `u` ———

const STONE = 0xb5aa9a;
type Draw = (g: Graphics, x: number, y: number, u: number) => void;

const ELEMENTS: Record<string, Draw> = {
  'big rock': (g, x, y, u) => {
    g.ellipse(x, y, 13 * u, 9 * u)
      .fill(STONE)
      .stroke({ width: 2 * u, color: ink });
    g.ellipse(x - 4 * u, y - 3 * u, 4 * u, 2 * u).fill({ color: 0xffffff, alpha: 0.35 });
  },
  'merry-go-round': (g, x, y, u) => {
    // Base, centre pole, three riders on poles, a striped cone roof with a scalloped rim.
    g.ellipse(x, y, 22 * u, 5 * u)
      .fill(swatch.purple.fill)
      .stroke({ width: 2 * u, color: ink });
    g.rect(x - 1.5 * u, y - 30 * u, 3 * u, 30 * u).fill(swatch.yellow.fill);
    const riders: ColorName[] = ['pink', 'teal', 'orange'];
    riders.forEach((name, i) => {
      const rx = x + (i - 1) * 13 * u;
      g.rect(rx - 0.75 * u, y - 28 * u, 1.5 * u, 26 * u).fill(ink);
      g.ellipse(rx, y - 10 * u, 5 * u, 4 * u)
        .fill(swatch[name].fill)
        .stroke({ width: 1.5 * u, color: ink });
    });
    const stripes: ColorName[] = ['red', 'yellow', 'red', 'yellow'];
    stripes.forEach((name, i) => {
      const a = x - 24 * u + i * 12 * u;
      g.moveTo(x, y - 46 * u)
        .lineTo(a, y - 28 * u)
        .lineTo(a + 12 * u, y - 28 * u)
        .fill(swatch[name].fill);
    });
    g.moveTo(x, y - 46 * u)
      .lineTo(x - 24 * u, y - 28 * u)
      .lineTo(x + 24 * u, y - 28 * u)
      .closePath()
      .stroke({ width: 2 * u, color: ink });
  },
  flags: (g, x, y, u) => {
    // Two little flags on the roof's tip.
    for (const [dx, name] of [
      [-1, 'teal'],
      [1, 'pink'],
    ] as const) {
      g.moveTo(x, y)
        .lineTo(x + dx * 4 * u, y - 8 * u)
        .stroke({ width: 1.5 * u, color: ink });
      g.moveTo(x + dx * 4 * u, y - 8 * u)
        .lineTo(x + dx * 11 * u, y - 6 * u)
        .lineTo(x + dx * 4 * u, y - 3 * u)
        .fill(swatch[name].fill)
        .stroke({ width: 1 * u, color: ink });
    }
  },
  bench: (g, x, y, u) => {
    for (const dx of [-12, 12]) g.rect(x + dx * u - 1.5 * u, y - 14 * u, 3 * u, 14 * u).fill(wood.line);
    g.roundRect(x - 17 * u, y - 16 * u, 34 * u, 5 * u, 2 * u)
      .fill(wood.fill)
      .stroke({ width: 1.5 * u, color: ink });
    g.roundRect(x - 18 * u, y - 7 * u, 36 * u, 5 * u, 2 * u)
      .fill(wood.fill)
      .stroke({ width: 1.5 * u, color: ink });
  },
  'flower bed': (g, x, y, u) => {
    g.ellipse(x, y, 17 * u, 5 * u)
      .fill(0x8a5a3a)
      .stroke({ width: 1.5 * u, color: ink });
    const heads: ColorName[] = ['pink', 'yellow', 'purple', 'red'];
    heads.forEach((name, i) => {
      const fx = x + (i - 1.5) * 8 * u;
      g.moveTo(fx, y)
        .lineTo(fx, y - 8 * u)
        .stroke({ width: 1.5 * u, color: LEAF });
      g.circle(fx, y - 9 * u, 3.5 * u)
        .fill(swatch[name].fill)
        .stroke({ width: 1 * u, color: ink });
    });
  },
  'stone oven': (g, x, y, u) => {
    // A stone dome on the ground at y, a dark mouth and a short chimney.
    g.rect(x + 8 * u, y - 40 * u, 7 * u, 12 * u)
      .fill(STONE)
      .stroke({ width: 2 * u, color: ink });
    g.moveTo(x - 20 * u, y)
      .lineTo(x - 20 * u, y - 14 * u)
      .quadraticCurveTo(x - 20 * u, y - 34 * u, x, y - 34 * u)
      .quadraticCurveTo(x + 20 * u, y - 34 * u, x + 20 * u, y - 14 * u)
      .lineTo(x + 20 * u, y)
      .closePath()
      .fill(STONE)
      .stroke({ width: 2 * u, color: ink });
    for (const [dx, dy] of [
      [-12, -8],
      [12, -10],
      [-8, -25],
      [9, -24],
    ])
      g.roundRect(x + dx * u - 3 * u, y + dy * u - 2 * u, 6 * u, 4 * u, 1.5 * u).fill({
        color: ink,
        alpha: 0.14,
      });
    g.moveTo(x - 8 * u, y)
      .lineTo(x - 8 * u, y - 9 * u)
      .quadraticCurveTo(x, y - 20 * u, x + 8 * u, y - 9 * u)
      .lineTo(x + 8 * u, y)
      .closePath()
      .fill(0x3a2a22)
      .stroke({ width: 1.5 * u, color: ink });
    g.ellipse(x, y - 3 * u, 4 * u, 2.5 * u).fill({ color: swatch.orange.fill, alpha: 0.85 });
  },
  'striped awning': (g, x, y, u) => {
    // Two poles from the ground at y and a striped cloth with a scalloped edge between their tops.
    for (const dx of [-27, 27]) g.rect(x + dx * u - 1.5 * u, y - 46 * u, 3 * u, 46 * u).fill(wood.line);
    for (let i = 0; i < 6; i++) {
      const ax = x - 30 * u + i * 10 * u;
      g.rect(ax, y - 52 * u, 10 * u, 11 * u).fill(i % 2 ? swatch.white.fill : swatch.red.fill);
      g.circle(ax + 5 * u, y - 41 * u, 5 * u).fill(i % 2 ? swatch.white.fill : swatch.red.fill);
    }
    g.rect(x - 30 * u, y - 52 * u, 60 * u, 11 * u).stroke({ width: 2 * u, color: ink });
  },
  sign: (g, x, y, u) => {
    // A painted board with a loaf on it.
    g.roundRect(x - 11 * u, y - 7 * u, 22 * u, 14 * u, 3 * u)
      .fill(swatch.teal.fill)
      .stroke({ width: 1.5 * u, color: ink });
    g.ellipse(x, y, 7 * u, 4 * u)
      .fill(0xe2a85a)
      .stroke({ width: 1 * u, color: ink });
  },
  bunting: (g, x, y, u) => {
    const names: ColorName[] = ['yellow', 'teal', 'pink', 'yellow', 'teal'];
    names.forEach((name, i) => {
      const bx = x + (i - 2) * 9 * u;
      g.moveTo(bx - 4 * u, y)
        .lineTo(bx + 4 * u, y)
        .lineTo(bx, y + 7 * u)
        .fill(swatch[name].fill)
        .stroke({ width: 1 * u, color: ink });
    });
  },
  table: (g, x, y, u) => {
    for (const dx of [-9, 9]) g.rect(x + dx * u - 1.5 * u, y - 15 * u, 3 * u, 15 * u).fill(wood.line);
    g.roundRect(x - 13 * u, y - 18 * u, 26 * u, 5 * u, 2 * u)
      .fill(wood.light)
      .stroke({ width: 1.5 * u, color: ink });
  },
  'sleeping cat': (g, x, y, u) => {
    // Curled up: a round body, a head with two ears, closed eyes and a tail tucked round.
    g.ellipse(x, y, 11 * u, 6 * u)
      .fill(swatch.orange.fill)
      .stroke({ width: 1.5 * u, color: ink });
    g.circle(x - 9 * u, y - 2 * u, 5 * u)
      .fill(swatch.orange.fill)
      .stroke({ width: 1.5 * u, color: ink });
    for (const dx of [-12, -6])
      g.moveTo(x + dx * u - 2 * u, y - 5 * u)
        .lineTo(x + dx * u, y - 10 * u)
        .lineTo(x + dx * u + 2 * u, y - 5 * u)
        .fill(swatch.orange.fill)
        .stroke({ width: 1 * u, color: ink });
    g.moveTo(x - 11 * u, y - 2 * u)
      .lineTo(x - 8.5 * u, y - 1.5 * u)
      .stroke({ width: 1 * u, color: ink });
    g.moveTo(x + 10 * u, y + 2 * u)
      .quadraticCurveTo(x + 15 * u, y - 6 * u, x + 6 * u, y - 5 * u)
      .stroke({ width: 2.5 * u, color: swatch.orange.line, cap: 'round' });
  },
};

/** Where the still-here element stands in every stage of its place, in picture units. */
const STILL_AT: Record<LaterPlace, { x: number; y: number }> = {
  green: { x: -34, y: 34 },
  oven: { x: -12, y: 8 },
};

/** Where the flipbook's sparkle sits on the still-here element (beside the rock's top, on the oven's shoulder). */
export const SPARKLE_AT: Record<LaterPlace, { x: number; y: number }> = {
  green: { x: -24, y: 25 },
  oven: { x: -24, y: 8 },
};

/** The green's tree at x: a sapling, then a young, taller and big tree. It only grows. */
function growingTree(g: Graphics, stage: number, x: number, ground: number, u: number) {
  if (stage === 0) {
    g.moveTo(x, ground)
      .lineTo(x, ground - 16 * u)
      .stroke({ width: 2.5 * u, color: LEAF, cap: 'round' });
    g.ellipse(x - 5 * u, ground - 12 * u, 6 * u, 3.5 * u)
      .fill(LEAF)
      .stroke({ width: 1.5 * u, color: ink });
    g.ellipse(x + 5 * u, ground - 17 * u, 6 * u, 3.5 * u)
      .fill(LEAF)
      .stroke({ width: 1.5 * u, color: ink });
    return;
  }
  const w = [0, 5, 8, 11][stage] * u;
  const top = [0, 26, 40, 50][stage] * u;
  const r = [0, 12, 16, 20][stage] * u;
  g.roundRect(x - w / 2, ground - top, w, top, 2 * u)
    .fill(TRUNK)
    .stroke({ width: 2 * u, color: ink });
  g.circle(x, ground - top - r * 0.4, r)
    .fill(LEAF)
    .stroke({ width: 2 * u, color: ink });
}

function drawGreen(g: Graphics, stage: number, s: number, u: number) {
  const ground = 24 * u;
  g.rect(-s, ground, s * 2, s - ground).fill(GRASS);
  growingTree(g, stage, 28 * u, 34 * u, u);
  ELEMENTS['big rock'](g, STILL_AT.green.x * u, STILL_AT.green.y * u, u);
  if (stage === 1) {
    ELEMENTS['merry-go-round'](g, 2 * u, 38 * u, u * 0.9);
    ELEMENTS.flags(g, 2 * u, 38 * u - 46 * u * 0.9, u);
  }
  if (stage >= 2) ELEMENTS.bench(g, 0, 40 * u, u);
  if (stage >= 3) ELEMENTS['flower bed'](g, -4 * u, 46 * u, u * 0.8);
}

/** The oven's vine from its right foot: a shoot, knee high, halfway up, then over the top. It only grows. */
function growingVine(g: Graphics, stage: number, x: number, ground: number, u: number) {
  const path: [number, number][] = [
    [0, 0],
    [1, -8],
    [0, -16],
    [-2, -24],
    [-6, -31],
    [-13, -35],
    [-21, -35],
  ];
  const upTo = [1, 2, 4, 6][stage];
  g.moveTo(x, ground);
  for (let i = 1; i <= upTo; i++) g.lineTo(x + path[i][0] * u, ground + path[i][1] * u);
  g.stroke({ width: 2 * u, color: 0x3f9a45, cap: 'round', join: 'round' });
  for (let i = 1; i <= upTo; i++) {
    const side = i % 2 ? 1 : -1;
    g.ellipse(x + path[i][0] * u + side * 3.5 * u, ground + path[i][1] * u - 1 * u, 4 * u, 2.5 * u)
      .fill(LEAF)
      .stroke({ width: 1 * u, color: ink });
  }
}

function drawOven(g: Graphics, stage: number, s: number, u: number) {
  const ground = 30 * u;
  g.rect(-s, 22 * u, s * 2, s - 22 * u).fill(SAND);
  const ox = STILL_AT.oven.x * u;
  if (stage === 1) ELEMENTS.sign(g, ox, -40 * u, u);
  ELEMENTS['stone oven'](g, ox, ground, u);
  if (stage >= 2) ELEMENTS.table(g, 32 * u, 36 * u, u);
  growingVine(g, stage, ox + 23 * u, ground, u);
  if (stage === 1) {
    ELEMENTS['striped awning'](g, ox, ground + 4 * u, u);
    ELEMENTS.bunting(g, ox, -30 * u, u);
  }
  if (stage >= 3) ELEMENTS['sleeping cat'](g, ox - 2 * u, ground - 39 * u, u * 0.85);
}

/** Where each chip's element sits on its tile (its drawer's anchor, in tile hundredths), so the thing looks centred. */
const CHIP_ANCHOR: Record<string, { x: number; y: number; k: number }> = {
  'big rock': { x: 0, y: 4, k: 2.4 },
  'merry-go-round': { x: 0, y: 32, k: 1.5 },
  bench: { x: 0, y: 18, k: 2 },
  'flower bed': { x: 0, y: 14, k: 2.2 },
  'stone oven': { x: -2, y: 30, k: 1.7 },
  'striped awning': { x: 0, y: 36, k: 1.3 },
  table: { x: 0, y: 20, k: 2.4 },
  'sleeping cat': { x: 3, y: 6, k: 2.6 },
};

/** A level-5 chip: one element of the pictures on a cream tile, centred on (0, 0). */
export function chip(element: string, size: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, size * 0.22)
    .fill(cream)
    .stroke({ width: 4, color: swatch.teal.line });
  const a = CHIP_ANCHOR[element];
  const t = size / 100;
  ELEMENTS[element]?.(g, a.x * t, a.y * t, a.k * t * 0.9);
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** The "still here" ribbon: a long cloth strip with notched ends and a row of small pins, `near` while a chip hovers. */
export function ribbon(w: number, h: number, near: boolean): Graphics {
  const g = new Graphics();
  const n = 22;
  g.moveTo(-w / 2, -h / 2)
    .lineTo(w / 2, -h / 2)
    .lineTo(w / 2 - n, 0)
    .lineTo(w / 2, h / 2)
    .lineTo(-w / 2, h / 2)
    .lineTo(-w / 2 + n, 0)
    .closePath()
    .fill({ color: near ? swatch.yellow.light : swatch.teal.light, alpha: 0.95 })
    .stroke({ width: 4, color: swatch.teal.line });
  // A stitched line along each edge.
  for (const y of [-h / 2 + 12, h / 2 - 12])
    for (let x = -w / 2 + n + 14; x < w / 2 - n - 14; x += 22)
      g.moveTo(x, y)
        .lineTo(x + 10, y)
        .stroke({ width: 3, color: swatch.teal.line, alpha: 0.45, cap: 'round' });
  g.eventMode = 'none';
  return g;
}

/** A soft four-point sparkle of radius `r`, for the still-here element in the flipbook. */
export function sparkle(r: number): Graphics {
  const g = new Graphics();
  const k = r * 0.28;
  g.moveTo(0, -r)
    .lineTo(k, -k)
    .lineTo(r, 0)
    .lineTo(k, k)
    .lineTo(0, r)
    .lineTo(-k, k)
    .lineTo(-r, 0)
    .lineTo(-k, -k)
    .closePath()
    .fill({ color: swatch.yellow.light, alpha: 0.95 })
    .stroke({ width: 2, color: swatch.yellow.fill });
  g.eventMode = 'none';
  return g;
}

/**
 * Level 6's veil over a picture of `stage`, covering the spot where the next stage's new thing would be: soft sea mist
 * on the shore (over the water for the dock, the shore end for the shed, the far end for the boat and lantern), a
 * hanging bough of leaves on the tree (over the branch where the swing would hang). Drawn for a `size` square picture.
 */
export function mist(placeId: PlaceId, stage: number, size: number): Graphics {
  const g = new Graphics();
  const u = size / 100;
  if (placeId === 'tree') {
    // A low bough: overlapping leaf clumps, outlined like the crown, down to the grass.
    const clumps: [number, number, number][] = [
      [20, 6, 13],
      [34, 10, 12],
      [24, 22, 13],
      [36, 26, 11],
      [28, 36, 10],
    ];
    for (const [x, y, r] of clumps)
      g.circle(x * u, y * u, r * u)
        .fill(LEAF)
        .stroke({ width: 2 * u, color: ink });
    for (const [x, y, r] of clumps) g.circle(x * u, y * u, (r - 1.5) * u).fill(LEAF);
    for (const [x, y] of clumps)
      g.ellipse((x - 3) * u, (y - 3) * u, 4 * u, 2.5 * u).fill({ color: 0x8fd67f, alpha: 0.8 });
  } else {
    const at = [
      { x: 11, y: 15, rx: 30, ry: 15 },
      { x: -26, y: -13, rx: 23, ry: 24 },
      { x: 31, y: -3, rx: 19, ry: 32 },
    ][Math.max(0, Math.min(2, stage))];
    // A bank of mist: a sea-blue shadow under white puffs, thick enough that nothing shows through its middle.
    const puffs: [number, number, number][] = [
      [0, 0, 0.8],
      [-0.55, 0.25, 0.55],
      [0.55, 0.2, 0.55],
      [-0.3, -0.5, 0.55],
      [0.35, -0.5, 0.5],
      [0, 0.55, 0.6],
    ];
    for (const [dx, dy, k] of puffs)
      g.ellipse((at.x + dx * at.rx) * u, (at.y + dy * at.ry + 2) * u, at.rx * k * u, at.ry * k * u).fill({
        color: 0xbfe0f5,
        alpha: 0.9,
      });
    for (const [dx, dy, k] of puffs)
      g.ellipse(
        (at.x + dx * at.rx) * u,
        (at.y + dy * at.ry) * u,
        at.rx * k * 0.92 * u,
        at.ry * k * 0.92 * u,
      ).fill({
        color: 0xffffff,
        alpha: 0.95,
      });
    // Wisps trailing off each side.
    for (const side of [-1, 1])
      g.ellipse((at.x + side * at.rx * 1.05) * u, (at.y + at.ry * 0.3) * u, at.rx * 0.35 * u, 3 * u).fill({
        color: 0xffffff,
        alpha: 0.7,
      });
  }
  g.eventMode = 'none';
  return g;
}

/** A picture in its white card frame; `sepia` fades it to long ago. The picture sits inside, masked to the frame. */
export function card(
  placeId: PlaceId,
  stage: number,
  size: number,
  color: ColorName,
  opts: { sepia?: boolean; rig?: Container; clue?: { place: PlaceId; stage: number }; mist?: boolean } = {},
): Container {
  const c = new Container();
  const rim = Math.max(6, size * 0.06);
  const frame = new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, size * 0.1)
    .fill(swatch.white.fill)
    .stroke({ width: 3, color: swatch.white.line });
  const inner = size - rim * 2;
  const pic = picture(placeId, stage, inner, color);
  const mask = new Graphics().roundRect(-inner / 2, -inner / 2, inner, inner, size * 0.06).fill(0xffffff);
  pic.mask = mask;
  c.addChild(frame, pic, mask);
  if (opts.rig) {
    const rig = opts.rig;
    const b = rig.getLocalBounds();
    const k = Math.min((inner * 0.78) / b.height, (inner * 0.7) / b.width);
    rig.scale.set(k);
    rig.position.set(-(b.x + b.width / 2) * k, inner * 0.42 - (b.y + b.height) * k);
    rig.mask = mask;
    c.addChild(rig);
  }
  if (opts.mist) {
    const veil = mist(placeId, stage, inner);
    veil.mask = mask;
    c.addChild(veil);
  }
  if (opts.clue) {
    // Level 4's clue: a little round picture of the other place at the same time, up in this picture's sky where
    // nothing of its own is drawn (between the shed and the lantern on the shore; above the left of the tree's crown).
    const u = inner / 100;
    const r = 19 * u;
    const at = placeId === 'shore' ? { x: 12 * u, y: -29 * u } : { x: -29 * u, y: -29 * u };
    const small = picture(opts.clue.place, opts.clue.stage, r * 2.3);
    const round = new Graphics().circle(0, 0, r).fill(0xffffff);
    small.mask = round;
    const inset = new Container();
    inset.position.set(at.x, at.y);
    inset.addChild(
      new Graphics()
        .circle(0, 0, r + 3 * u)
        .fill(swatch.white.fill)
        .stroke({ width: 2, color: ink }),
      small,
      round,
    );
    c.addChild(inset);
  }
  if (opts.sepia) {
    const veil = new Graphics()
      .roundRect(-inner / 2, -inner / 2, inner, inner, size * 0.06)
      .fill({ color: SEPIA, alpha: 0.55 });
    veil.eventMode = 'none';
    c.addChild(veil);
  }
  // A peg hole at the top.
  c.addChild(
    new Graphics()
      .circle(0, -size / 2 + rim, rim * 0.45)
      .fill(swatch.white.light)
      .stroke({ width: 2, color: swatch.white.line }),
  );
  c.eventMode = 'none';
  return c;
}

/** A wooden post with its small picture hung near the bottom: the long-ago post is faded, the now post bright. */
export function post(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-14, -h, 28, h, 8).fill(wood.fill).stroke({ width: 3, color: wood.line });
  g.roundRect(-22, -h - 10, 44, 18, 6)
    .fill(wood.light)
    .stroke({ width: 3, color: wood.line });
  g.rect(-w / 2, -8, w, 8).fill({ color: wood.line, alpha: 0.25 });
  g.eventMode = 'none';
  return g;
}

/** A pegged gap on the line: a soft space with a clothes peg; `near` while a card hovers; `glow` for the hint. */
export function gap(w: number, h: number, near: boolean, glow: boolean): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 18)
    .fill({ color: near ? swatch.yellow.light : cream, alpha: near ? 0.9 : 0.55 })
    .stroke({
      width: glow ? 8 : 4,
      color: glow ? swatch.yellow.fill : swatch.teal.line,
      alpha: glow ? 1 : 0.7,
    });
  // The peg.
  g.roundRect(-8, -h / 2 - 14, 16, 30, 5)
    .fill(wood.light)
    .stroke({ width: 2, color: wood.line });
  g.rect(-1.5, -h / 2 - 12, 3, 24).fill(wood.line);
  g.eventMode = 'none';
  return g;
}

/** The rope between two points, sagging a little. */
export function rope(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  sag = 12,
): Graphics {
  const mx = (from.x + to.x) / 2;
  const my = Math.max(from.y, to.y) + sag;
  g.moveTo(from.x, from.y)
    .quadraticCurveTo(mx, my, to.x, to.y)
    .stroke({ width: 5, color: wood.line, cap: 'round' });
  return g;
}

/** The flipbook frame: a big wooden-rimmed window. */
export function frameArt(size: number): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2 - 16, -size / 2 - 16, size + 32, size + 32, 26)
    .fill(wood.fill)
    .stroke({ width: 5, color: wood.line });
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(cream);
  g.eventMode = 'none';
  return g;
}

/** A little clothesline with two pegged pictures, for the hub (feet on (0, 0)). */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-52, -96, 10, 96, 4).fill(wood.fill).stroke({ width: 2, color: wood.line });
  g.roundRect(42, -96, 10, 96, 4).fill(wood.fill).stroke({ width: 2, color: wood.line });
  rope(g, { x: -47, y: -84 }, { x: 47, y: -84 }, 10);
  c.addChild(g);
  const a = card('tree', 0, 44, 'teal', { sepia: true });
  a.position.set(-22, -58);
  const b = card('tree', 3, 44, 'teal');
  b.position.set(24, -56);
  c.addChild(a, b);
  return c;
}

/** The sticker: one place's card pegged on a short line. */
export function stickerArt(placeId: PlaceId, stage: number, color: ColorName): Container {
  const c = new Container();
  const g = new Graphics();
  rope(g, { x: -60, y: -56 }, { x: 60, y: -56 }, 8);
  c.addChild(g);
  const k = card(placeId, Math.min(stage, PLACES[placeId].stages.length - 2), 92, color);
  k.position.set(0, -4);
  c.addChild(k);
  return c;
}
