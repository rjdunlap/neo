/**
 * Timeline Trail's code-drawn pictures: the three places at each stage, the picture cards, the two posts, the pegged
 * gaps, the clothesline, the flipbook frame, the hub icon and the sticker. Palette: src/art/palette.ts.
 */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { PLACES, type PlaceId } from './logic';

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
  else drawNest(g, stage, s, u, color);
  return c;
}

function drawShore(g: Graphics, stage: number, s: number, u: number) {
  g.rect(-s, 10 * u, s * 2, s - 10 * u).fill(SEA);
  g.moveTo(-s, 28 * u).quadraticCurveTo(-s * 0.3, 14 * u, s * 0.1, 30 * u).quadraticCurveTo(s * 0.5, 44 * u, s, 24 * u).lineTo(s, s).lineTo(-s, s).fill(SAND);
  // Stage 0: one rock on the sand.
  g.ellipse(-26 * u, 36 * u, 12 * u, 8 * u).fill(0xb5aa9a).stroke({ width: 2 * u, color: ink });
  if (stage >= 1) {
    // A little dock: posts and planks out over the water.
    for (const x of [-4, 12, 28]) g.rect(x * u - 2 * u, 4 * u, 4 * u, 22 * u).fill(TRUNK);
    g.roundRect(-14 * u, 2 * u, 50 * u, 7 * u, 2 * u).fill(wood.fill).stroke({ width: 2 * u, color: wood.line });
  }
  if (stage >= 2) {
    // A boat shed at the shore end of the dock.
    g.rect(-40 * u, -18 * u, 28 * u, 24 * u).fill(0xd98c5f).stroke({ width: 2 * u, color: ink });
    g.moveTo(-44 * u, -18 * u).lineTo(-26 * u, -34 * u).lineTo(-8 * u, -18 * u).fill(0xa85a3a).stroke({ width: 2 * u, color: ink });
    g.rect(-32 * u, -8 * u, 10 * u, 14 * u).fill(0x6b4a33);
  }
  if (stage >= 3) {
    // A boat moored at the dock and a lantern on a pole.
    g.moveTo(14 * u, 14 * u).lineTo(44 * u, 14 * u).lineTo(38 * u, 24 * u).lineTo(20 * u, 24 * u).fill(swatch.red.fill).stroke({ width: 2 * u, color: ink });
    g.rect(28 * u, 2 * u, 2 * u, 12 * u).fill(ink);
    g.moveTo(29 * u, 2 * u).lineTo(29 * u, 12 * u).lineTo(40 * u, 8 * u).fill(swatch.white.fill).stroke({ width: 1.5 * u, color: ink });
    g.rect(36 * u, -22 * u, 3 * u, 26 * u).fill(TRUNK);
    g.roundRect(32 * u, -30 * u, 11 * u, 10 * u, 2 * u).fill(swatch.yellow.fill).stroke({ width: 2 * u, color: ink });
    g.circle(37.5 * u, -25 * u, 6 * u).fill({ color: swatch.yellow.light, alpha: 0.6 });
  }
}

function drawTree(g: Graphics, stage: number, s: number, u: number) {
  g.rect(-s, 26 * u, s * 2, s - 26 * u).fill(GRASS);
  if (stage === 0) {
    // A sapling: a thin stem with two leaves.
    g.moveTo(0, 30 * u).lineTo(0, 8 * u).stroke({ width: 3 * u, color: LEAF, cap: 'round' });
    g.ellipse(-8 * u, 12 * u, 9 * u, 5 * u).fill(LEAF).stroke({ width: 1.5 * u, color: ink });
    g.ellipse(8 * u, 6 * u, 9 * u, 5 * u).fill(LEAF).stroke({ width: 1.5 * u, color: ink });
    return;
  }
  const big = stage >= 2;
  const trunkW = big ? 14 * u : 7 * u;
  const trunkTop = big ? -10 * u : 2 * u;
  g.roundRect(-trunkW / 2, trunkTop, trunkW, 30 * u - trunkTop, 3 * u).fill(TRUNK).stroke({ width: 2 * u, color: ink });
  const crownR = big ? 32 * u : 16 * u;
  const crownY = big ? -18 * u : -8 * u;
  g.circle(0, crownY, crownR).fill(LEAF).stroke({ width: 2 * u, color: ink });
  if (big) {
    g.circle(-20 * u, crownY + 10 * u, 16 * u).fill(LEAF).stroke({ width: 2 * u, color: ink });
    g.circle(22 * u, crownY + 8 * u, 15 * u).fill(LEAF).stroke({ width: 2 * u, color: ink });
    g.circle(-20 * u, crownY + 10 * u, 14 * u).fill(LEAF);
    g.circle(22 * u, crownY + 8 * u, 13 * u).fill(LEAF);
    g.circle(0, crownY, crownR - 2 * u).fill(LEAF);
  }
  if (stage >= 3) {
    // A swing hung from a branch: two ropes and a seat.
    const bx = 26 * u;
    g.moveTo(bx - 8 * u, crownY + 20 * u).lineTo(bx - 8 * u, 34 * u).stroke({ width: 2 * u, color: wood.line });
    g.moveTo(bx + 8 * u, crownY + 20 * u).lineTo(bx + 8 * u, 34 * u).stroke({ width: 2 * u, color: wood.line });
    g.roundRect(bx - 12 * u, 33 * u, 24 * u, 5 * u, 2 * u).fill(wood.fill).stroke({ width: 2 * u, color: ink });
  }
}

function drawNest(g: Graphics, stage: number, s: number, u: number, color: ColorName) {
  const body = swatch[color];
  if (stage === 3) {
    // The treehouse door: planks and an arch; the pet itself is the companion rig, added by the caller.
    g.rect(-s, -s, s * 2, s * 2).fill(wood.light);
    for (let x = -s; x < s; x += 18 * u) g.rect(x, -s, 2 * u, s * 2).fill({ color: wood.line, alpha: 0.35 });
    g.roundRect(-30 * u, -28 * u, 60 * u, 78 * u, 28 * u).fill(0x5a3b26).stroke({ width: 3 * u, color: ink });
    return;
  }
  g.rect(-s, 30 * u, s * 2, s - 30 * u).fill(GRASS);
  // A nest of twigs.
  g.ellipse(0, 26 * u, 34 * u, 14 * u).fill(0xc9a46a).stroke({ width: 2 * u, color: wood.line });
  for (let i = -3; i <= 3; i++) g.moveTo(i * 9 * u - 6 * u, 32 * u).lineTo(i * 9 * u + 6 * u, 22 * u).stroke({ width: 2 * u, color: wood.line });
  if (stage === 0) {
    g.ellipse(0, 12 * u, 16 * u, 20 * u).fill(cream).stroke({ width: 2 * u, color: ink });
    g.circle(-5 * u, 6 * u, 3 * u).fill(body.light);
    g.circle(6 * u, 16 * u, 3 * u).fill(body.light);
    return;
  }
  const r = stage === 1 ? 14 * u : 20 * u;
  const cy = stage === 1 ? 14 * u : 4 * u;
  g.circle(0, cy, r).fill(body.fill).stroke({ width: 2 * u, color: body.line });
  g.circle(-r * 0.35, cy - r * 0.2, 2.5 * u).fill(ink);
  g.circle(r * 0.35, cy - r * 0.2, 2.5 * u).fill(ink);
  g.moveTo(-3 * u, cy + r * 0.3).quadraticCurveTo(0, cy + r * 0.5, 3 * u, cy + r * 0.3).stroke({ width: 1.5 * u, color: ink });
  if (stage === 1) {
    // A hatchling still wearing a bit of shell.
    g.moveTo(-8 * u, cy - r).lineTo(-3 * u, cy - r - 6 * u).lineTo(2 * u, cy - r).lineTo(7 * u, cy - r - 5 * u).lineTo(10 * u, cy - r + 2 * u).fill(cream).stroke({ width: 1.5 * u, color: ink });
  } else {
    // A first scarf.
    g.roundRect(-r, cy + r * 0.55, r * 2, 7 * u, 3 * u).fill(swatch.red.fill).stroke({ width: 1.5 * u, color: ink });
    g.roundRect(r * 0.3, cy + r * 0.55, 7 * u, 18 * u, 3 * u).fill(swatch.red.fill).stroke({ width: 1.5 * u, color: ink });
  }
}

/** A picture in its white card frame; `sepia` fades it to long ago. The picture sits inside, masked to the frame. */
export function card(placeId: PlaceId, stage: number, size: number, color: ColorName, opts: { sepia?: boolean; rig?: Container } = {}): Container {
  const c = new Container();
  const rim = Math.max(6, size * 0.06);
  const frame = new Graphics().roundRect(-size / 2, -size / 2, size, size, size * 0.1).fill(swatch.white.fill).stroke({ width: 3, color: swatch.white.line });
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
  if (opts.sepia) {
    const veil = new Graphics().roundRect(-inner / 2, -inner / 2, inner, inner, size * 0.06).fill({ color: SEPIA, alpha: 0.55 });
    veil.eventMode = 'none';
    c.addChild(veil);
  }
  // A peg hole at the top.
  c.addChild(new Graphics().circle(0, -size / 2 + rim, rim * 0.45).fill(swatch.white.light).stroke({ width: 2, color: swatch.white.line }));
  c.eventMode = 'none';
  return c;
}

/** A wooden post with its small picture hung near the bottom: the long-ago post is faded, the now post bright. */
export function post(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-14, -h, 28, h, 8).fill(wood.fill).stroke({ width: 3, color: wood.line });
  g.roundRect(-22, -h - 10, 44, 18, 6).fill(wood.light).stroke({ width: 3, color: wood.line });
  g.rect(-w / 2, -8, w, 8).fill({ color: wood.line, alpha: 0.25 });
  g.eventMode = 'none';
  return g;
}

/** A pegged gap on the line: a soft space with a clothes peg; `near` while a card hovers; `glow` for the hint. */
export function gap(w: number, h: number, near: boolean, glow: boolean): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 18).fill({ color: near ? swatch.yellow.light : cream, alpha: near ? 0.9 : 0.55 }).stroke({ width: glow ? 8 : 4, color: glow ? swatch.yellow.fill : swatch.teal.line, alpha: glow ? 1 : 0.7 });
  // The peg.
  g.roundRect(-8, -h / 2 - 14, 16, 30, 5).fill(wood.light).stroke({ width: 2, color: wood.line });
  g.rect(-1.5, -h / 2 - 12, 3, 24).fill(wood.line);
  g.eventMode = 'none';
  return g;
}

/** The rope between two points, sagging a little. */
export function rope(g: Graphics, from: { x: number; y: number }, to: { x: number; y: number }, sag = 12): Graphics {
  const mx = (from.x + to.x) / 2;
  const my = Math.max(from.y, to.y) + sag;
  g.moveTo(from.x, from.y).quadraticCurveTo(mx, my, to.x, to.y).stroke({ width: 5, color: wood.line, cap: 'round' });
  return g;
}

/** The flipbook frame: a big wooden-rimmed window. */
export function frameArt(size: number): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2 - 16, -size / 2 - 16, size + 32, size + 32, 26).fill(wood.fill).stroke({ width: 5, color: wood.line });
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
