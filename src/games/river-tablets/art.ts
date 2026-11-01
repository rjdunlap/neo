/** River Tablets' code-drawn pieces: sheep, tokens, the jar, the clay ball and its cells, Crack, the tablet rows and signs, cart, storehouse, pen, icon and sticker; for levels 4–5 the yard, baskets, crates of ten, the ten-mark, the tablet and strips, the stamps, Hand in, the verdicts and numbers; for level 6 the pair of tablets, "this one", neither and can't tell. */
import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { finish } from '../../ui/buttons';
import { CELL, type Kind } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
export const CLAY = { fill: 0xd9a36e, line: 0x9c6b3c, dark: 0xb9834f, light: 0xf0cfa4 };
const RIVER = { fill: 0x8fd0ea, line: 0x4fa3c7 };
const REED = 0x6fae5a;

// ——— Small pictures ———

/** A clay token: a flat disc with a dimple. */
export function tokenArt(r = 26): Graphics {
  const g = new Graphics();
  g.ellipse(0, r * 0.15, r, r * 0.8).fill(CLAY.dark);
  g.ellipse(0, 0, r, r * 0.8).fill(CLAY.fill).stroke(line(CLAY.line, Math.max(3, r * 0.14)));
  g.ellipse(-r * 0.2, -r * 0.2, r * 0.3, r * 0.2).fill({ color: CLAY.light, alpha: 0.8 });
  g.eventMode = 'none';
  return g;
}

/** A wedge mark pressed into clay, pointing down. */
export function wedgeArt(size = 54, color = CLAY.line): Graphics {
  const g = new Graphics();
  const h = size / 2;
  g.moveTo(-h * 0.55, -h).lineTo(h * 0.55, -h).lineTo(0, h).closePath().fill(color);
  g.moveTo(-h * 0.55, -h).lineTo(0, h).stroke(line(CLAY.dark, Math.max(2, size * 0.06)));
  g.eventMode = 'none';
  return g;
}

/** A sheep standing on (0, 0), about `size` tall: a fleece puff with a dark face and legs. */
export function sheepArt(color: ColorName = 'white', size = 110): Container {
  const c = new Container();
  const g = new Graphics();
  const sw = swatch[color];
  const w = size * 0.95;
  const h = size * 0.6;
  // Legs.
  for (const x of [-w * 0.3, -w * 0.12, w * 0.12, w * 0.3]) g.roundRect(x - size * 0.045, -h * 0.5, size * 0.09, h * 0.55, 6).fill(0x4a4454);
  // Fleece: a cloud of circles.
  const puffs: [number, number, number][] = [[-w * 0.3, -h * 0.75, h * 0.42], [0, -h * 0.9, h * 0.5], [w * 0.3, -h * 0.75, h * 0.42], [-w * 0.15, -h * 0.5, h * 0.4], [w * 0.15, -h * 0.5, h * 0.4]];
  for (const [x, y, r] of puffs) g.circle(x, y, r + 3).fill(sw.line);
  for (const [x, y, r] of puffs) g.circle(x, y, r).fill(sw.fill);
  // Head.
  const hx = w * 0.46;
  const hy = -h * 0.95;
  g.ellipse(hx, hy, size * 0.17, size * 0.2).fill(0x4a4454);
  g.ellipse(hx - size * 0.14, hy - size * 0.1, size * 0.08, size * 0.045).fill(0x4a4454);
  g.ellipse(hx + size * 0.12, hy - size * 0.12, size * 0.08, size * 0.045).fill(0x4a4454);
  g.circle(hx + size * 0.06, hy - size * 0.03, size * 0.035).fill(0xffffff);
  g.circle(hx + size * 0.07, hy - size * 0.03, size * 0.018).fill(ink);
  g.circle(hx + size * 0.06, hy + size * 0.1, size * 0.02).fill(0xff8fa3);
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** A wide clay jar, `w` × `h`, standing on (0, 0) with its mouth at the top; `glow` rings it. */
export function jarArt(w: number, h: number, glow = false): Graphics {
  const g = new Graphics();
  if (glow) g.ellipse(0, -h / 2, w * 0.62, h * 0.6).fill({ color: swatch.yellow.fill, alpha: 0.35 });
  g.moveTo(-w * 0.32, -h * 0.92).lineTo(w * 0.32, -h * 0.92).lineTo(w * 0.42, -h * 0.75).quadraticCurveTo(w * 0.55, -h * 0.4, w * 0.4, 0).lineTo(-w * 0.4, 0).quadraticCurveTo(-w * 0.55, -h * 0.4, -w * 0.42, -h * 0.75).closePath().fill(CLAY.fill).stroke(line(CLAY.line, 6));
  g.ellipse(0, -h * 0.92, w * 0.32, h * 0.07).fill(CLAY.dark).stroke(line(CLAY.line, 5));
  g.moveTo(-w * 0.3, -h * 0.55).quadraticCurveTo(0, -h * 0.47, w * 0.3, -h * 0.55).stroke(line(CLAY.dark, 4));
  g.ellipse(-w * 0.22, -h * 0.3, w * 0.08, h * 0.16).fill({ color: CLAY.light, alpha: 0.6 });
  return g;
}

/** The clay ball (envelope): a lumpy ellipse `w` × `h` centred on (0, 0); `open` shows the inside; `glow` rings it. */
export function ballArt(w: number, h: number, open = false, glow = false): Graphics {
  const g = new Graphics();
  if (glow) g.ellipse(0, 0, w / 2 + 14, h / 2 + 14).fill({ color: swatch.yellow.fill, alpha: 0.35 });
  g.ellipse(0, 6, w / 2, h / 2).fill(CLAY.dark);
  g.ellipse(0, 0, w / 2, h / 2).fill(open ? CLAY.light : CLAY.fill).stroke(line(CLAY.line, 6));
  g.ellipse(-w * 0.3, -h * 0.3, w * 0.1, h * 0.08).fill({ color: CLAY.light, alpha: 0.7 });
  return g;
}

/** A cell of the envelope's face: an empty dent, or one with a mark; `glow` lights it. */
export function cellArt(size: number, marked: boolean, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  if (glow) g.roundRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 22).fill({ color: swatch.yellow.fill, alpha: 0.55 });
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(CLAY.dark).stroke(line(CLAY.line, 4));
  g.roundRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12, 14).fill(marked ? CLAY.fill : CLAY.light);
  c.addChild(g);
  if (marked) c.addChild(wedgeArt(size * 0.5));
  return c;
}

/** The Crack control: two hands around a small ball. */
export function crackArt(w: number, h: number): Container {
  const c = new Container();
  c.addChild(finish({ w, h, corner: 28 }, swatch.orange));
  const g = new Graphics();
  g.ellipse(0, 0, 24, 20).fill(CLAY.fill).stroke(line(CLAY.line, 4));
  g.moveTo(-6, -16).lineTo(2, 0).lineTo(-6, 16).stroke(line(CLAY.line, 3));
  for (const s of [-1, 1]) {
    g.roundRect(s * 30 - 14, -20, 28, 40, 12).fill(swatch.yellow.light).stroke(line(ink, 4));
    g.moveTo(s * 30 - 6, -20).lineTo(s * 30 - 6, 2).stroke(line(ink, 3));
    g.moveTo(s * 30 + 6, -20).lineTo(s * 30 + 6, 2).stroke(line(ink, 3));
  }
  c.addChild(g);
  g.eventMode = 'none';
  return c;
}

/** A jar as a good: a smaller jar on (0, 0), `size` tall. */
export function jarGoodArt(size = 90): Graphics {
  const g = jarArt(size * 0.9, size);
  g.eventMode = 'none';
  return g;
}

/** The picture that heads a row or waits at the tablet: a sheep or a jar. */
export function goodArt(kind: Kind, size = 90): Container {
  const c = new Container();
  const art = kind === 'sheep' ? sheepArt('white', size) : jarGoodArt(size);
  art.position.set(0, size / 2);
  c.addChild(art);
  c.eventMode = 'none';
  return c;
}

/** The sign at the head of a row: a small clay plaque with the good's picture. */
export function signArt(kind: Kind, size: number, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  if (glow) g.roundRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 22).fill({ color: swatch.yellow.fill, alpha: 0.6 });
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(CLAY.light).stroke(line(CLAY.line, 4));
  c.addChild(g, goodArt(kind, size * 0.62));
  c.eventMode = 'none';
  return c;
}

/** A row of the tablet: a clay strip `w` × `h` with four cells to the right of the sign, each holding a mark or empty; `lift` raises it on touch-down. */
export function rowArt(w: number, h: number, sign: number, marks: number, cells: number, cellSize: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 5, w, h, 20).fill(CLAY.dark);
  g.roundRect(-w / 2, -h / 2, w, h, 20).fill(CLAY.fill).stroke(line(CLAY.line, 5));
  c.addChild(g);
  const x0 = -w / 2 + sign + 6;
  const step = (w - sign - 12) / cells;
  for (let i = 0; i < cells; i++) {
    const cx = x0 + step * (i + 0.5);
    const cell = cellArt(Math.min(cellSize, step - 8, h - 16), i < marks);
    cell.position.set(cx, 0);
    c.addChild(cell);
  }
  c.eventMode = 'none';
  return c;
}

/** A small wooden cart on (0, 0), carrying nothing: the good rides on its bed. */
export function cartArt(w = 150): Graphics {
  const g = new Graphics();
  const h = w * 0.3;
  g.roundRect(-w / 2, -h, w, h * 0.8, 10).fill(wood.fill).stroke(line(wood.line, 5));
  g.moveTo(w / 2, -h * 0.6).lineTo(w * 0.7, -h * 0.9).stroke(line(wood.line, 7));
  for (const x of [-w * 0.3, w * 0.3]) {
    g.circle(x, 0, h * 0.42).fill(wood.line);
    g.circle(x, 0, h * 0.22).fill(wood.light);
  }
  g.eventMode = 'none';
  return g;
}

/** The storehouse: a mud-brick house `w` × `h` at (0, 0) top-left, its door open or shut. */
export function storeArt(w: number, h: number, open = false): Graphics {
  const g = new Graphics();
  g.rect(0, h * 0.2, w, h * 0.8).fill(CLAY.fill).stroke(line(CLAY.line, 5));
  g.moveTo(-6, h * 0.22).lineTo(w / 2, 0).lineTo(w + 6, h * 0.22).closePath().fill(CLAY.dark).stroke(line(CLAY.line, 5));
  for (let i = 0; i < 3; i++) g.moveTo(10, h * (0.4 + i * 0.18)).lineTo(w - 10, h * (0.4 + i * 0.18)).stroke(line(CLAY.dark, 3));
  const dw = Math.min(w * 0.4, 110);
  const dh = h * 0.5;
  g.roundRect(w / 2 - dw / 2, h - dh, dw, dh, 12).fill(open ? 0x4a3a2c : wood.fill).stroke(line(wood.line, 5));
  if (!open) g.moveTo(w / 2, h - dh + 10).lineTo(w / 2, h - 10).stroke(line(wood.line, 4));
  g.eventMode = 'none';
  return g;
}

/** The pen along the lane: a fence with a gate at one end, `w` × `h` at (0, 0) top-left. */
export function penArt(w: number, h: number, gate: 'left' | 'right'): Graphics {
  const g = new Graphics();
  g.roundRect(0, h * 0.25, w, h * 0.75, 24).fill(0xcfe9b3);
  const posts = Math.max(4, Math.floor(w / 90));
  for (let i = 0; i <= posts; i++) {
    const x = (w * i) / posts;
    const gateSide = gate === 'left' ? i <= 1 : i >= posts - 1;
    g.roundRect(x - 7, h * 0.3, 14, h * 0.5, 6).fill(gateSide ? wood.light : wood.fill).stroke(line(wood.line, 4));
  }
  for (const y of [h * 0.42, h * 0.62]) g.moveTo(0, y).lineTo(w, y).stroke(line(wood.line, 6));
  g.eventMode = 'none';
  return g;
}

/** The river and reeds behind the lane: a band `w` × `h` at (0, 0) top-left. */
export function riverArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, 30).fill(RIVER.fill).stroke(line(RIVER.line, 4));
  for (let i = 0; i < 4; i++) {
    const y = h * (0.25 + i * 0.18);
    g.moveTo(w * 0.1 + i * 40, y).quadraticCurveTo(w * 0.3 + i * 40, y - 8, w * 0.5 + i * 40, y).stroke(line(0xffffff, 3));
  }
  for (let i = 0; i < 6; i++) {
    const x = w * (0.08 + i * 0.17);
    g.moveTo(x, h).quadraticCurveTo(x + 6, h * 0.5, x - 4, h * 0.15).stroke(line(REED, 5));
    g.ellipse(x - 5, h * 0.18, 6, 16).fill(CLAY.line);
  }
  g.eventMode = 'none';
  return g;
}

/** The hub icon: a small clay tablet with three wedge marks and a sheep. Feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-70, -120, 140, 100, 18).fill(CLAY.fill).stroke(line(CLAY.line, 5));
  c.addChild(g);
  for (let i = 0; i < 3; i++) {
    const m = wedgeArt(36);
    m.position.set(-40 + i * 40, -70);
    c.addChild(m);
  }
  const s = sheepArt('white', 70);
  s.position.set(20, 0);
  c.addChild(s);
  return c;
}

/** A seeded sticker: a tablet with a sheep row and a jar row filled. */
export function stickerArt(sheep: number, jars: number, color: ColorName): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, -110, 220, 220, 26).fill(cream);
  g.roundRect(-96, -96, 192, 192, 22).fill(CLAY.fill).stroke(line(CLAY.line, 6));
  g.moveTo(-84, 0).lineTo(84, 0).stroke(line(CLAY.dark, 4));
  c.addChild(g);
  const s = sheepArt(color, 50);
  s.position.set(-62, -24);
  const j = jarGoodArt(44);
  j.position.set(-62, 76);
  c.addChild(s, j);
  for (let i = 0; i < sheep; i++) {
    const m = wedgeArt(30);
    m.position.set(-22 + i * 30, -48);
    c.addChild(m);
  }
  for (let i = 0; i < jars; i++) {
    const m = wedgeArt(30);
    m.position.set(-22 + i * 30, 48);
    c.addChild(m);
  }
  return c;
}

export { CELL };

// ——— Levels 4–5: tens and ones ———

/** The ten-mark: a corner wedge, twice the size of the small mark, pointing left. */
export function tenWedgeArt(size = 54, color = CLAY.line): Graphics {
  const g = new Graphics();
  const h = size / 2;
  g.moveTo(h, -h * 0.75).lineTo(h, h * 0.75).lineTo(-h, 0).closePath().fill(color);
  g.moveTo(h, -h * 0.75).lineTo(-h, 0).lineTo(h, h * 0.75).stroke(line(CLAY.dark, Math.max(2, size * 0.05)));
  g.moveTo(h * 0.2, -h * 0.35).lineTo(-h * 0.6, 0).stroke(line(CLAY.dark, Math.max(2, size * 0.04)));
  g.eventMode = 'none';
  return g;
}

/** A basket of grain standing on (0, 0), about `size` wide. */
export function basketArt(size = 40): Graphics {
  const g = new Graphics();
  const w = size;
  const h = size * 0.7;
  g.ellipse(0, -h, w * 0.42, h * 0.22).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
  g.moveTo(-w / 2, -h).lineTo(w / 2, -h).lineTo(w * 0.36, 0).lineTo(-w * 0.36, 0).closePath().fill(wood.light).stroke(line(wood.line, 3));
  g.moveTo(-w * 0.44, -h * 0.55).lineTo(w * 0.44, -h * 0.55).stroke(line(wood.line, 2));
  g.eventMode = 'none';
  return g;
}

/** A crate of ten baskets, `w` × `h` standing on (0, 0); `open` shows its ten baskets in a 5 × 2 block above it. */
export function crateArt(w: number, h: number, open = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h, w, h, 8).fill(wood.fill).stroke(line(wood.line, 5));
  // Ten basket rims show through the slats.
  for (let i = 0; i < 10; i++) {
    const x = -w / 2 + w * (0.14 + (i % 5) * 0.18);
    const y = -h + h * (i < 5 ? 0.3 : 0.62);
    g.ellipse(x, y, w * 0.07, h * 0.08).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  }
  for (const y of [0.15, 0.47, 0.8]) g.moveTo(-w / 2 + 4, -h + h * y).lineTo(w / 2 - 4, -h + h * y).stroke(line(wood.line, 3));
  c.addChild(g);
  if (open) {
    for (let i = 0; i < 10; i++) {
      const b = basketArt(w * 0.2);
      b.position.set(-w * 0.4 + (i % 5) * w * 0.2, -h - 6 - Math.floor(i / 5) * w * 0.17);
      c.addChild(b);
    }
  }
  c.eventMode = 'none';
  return c;
}

/** The yard: packed earth `w` × `h` at (0, 0) top-left, with the cart under the crates. */
export function yardArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, 24).fill(0xe8d3a3).stroke(line(0xc9ad74, 5));
  g.ellipse(w * 0.2, h * 0.3, w * 0.06, h * 0.05).fill({ color: 0xc9ad74, alpha: 0.5 });
  g.ellipse(w * 0.75, h * 0.8, w * 0.08, h * 0.05).fill({ color: 0xc9ad74, alpha: 0.5 });
  return g;
}

/** The clay tablet `w` × `h` at (0, 0) top-left; its read band (`readH` tall) carries a small mouth-and-waves sign: tap to hear it. */
export function tabletArt(w: number, h: number, readH: number): Graphics {
  const g = new Graphics();
  g.roundRect(0, 8, w, h, 30).fill(CLAY.dark);
  g.roundRect(0, 0, w, h, 30).fill(CLAY.fill).stroke(line(CLAY.line, 6));
  g.roundRect(14, 12, w * 0.3, 16, 8).fill({ color: CLAY.light, alpha: 0.6 });
  const cx = w / 2;
  const cy = readH / 2 + 8;
  g.circle(cx - 30, cy, 22).fill(CLAY.light).stroke(line(CLAY.line, 4));
  g.moveTo(cx - 40, cy + 4).quadraticCurveTo(cx - 30, cy + 14, cx - 20, cy + 4).stroke(line(ink, 4));
  for (const r of [14, 28]) g.arc(cx + 2, cy, r, -0.7, 0.7).stroke(line(CLAY.line, 4));
  return g;
}

/** A strip of the tablet `w` × `h` at (0, 0) top-left: `tens` big marks in one line, or `ones` small marks in two lines of ten. */
export function stripArt(w: number, h: number, mark: 'ten' | 'one', count: number, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  if (glow) g.roundRect(-8, -8, w + 16, h + 16, 24).fill({ color: swatch.yellow.fill, alpha: 0.5 });
  g.roundRect(0, 0, w, h, 18).fill(CLAY.light).stroke(line(CLAY.line, 4));
  c.addChild(g);
  // A faint guide mark at the left says which strip this is.
  const guide = mark === 'ten' ? tenWedgeArt(56, CLAY.dark) : wedgeArt(36, CLAY.dark);
  guide.alpha = 0.35;
  guide.position.set(36, h / 2);
  c.addChild(guide);
  g.moveTo(70, 10).lineTo(70, h - 10).stroke(line(CLAY.dark, 3));
  for (let i = 0; i < count; i++) {
    const m = mark === 'ten' ? tenWedgeArt(80) : wedgeArt(36);
    if (mark === 'ten') m.position.set(130 + i * 110, h / 2);
    else m.position.set(96 + (i % 10) * ((w - 110) / 10), i < 10 ? h * 0.3 : h * 0.72);
    c.addChild(m);
  }
  c.eventMode = 'none';
  return c;
}

/** A stamp `w` × `h` centred on (0, 0): a wooden handle over the big or small mark it presses. */
export function stampArt(w: number, h: number, mark: 'ten' | 'one', glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w, h, corner: 28 }, mark === 'ten' ? swatch.orange : swatch.yellow));
  const g = new Graphics();
  g.roundRect(-14, -h * 0.4, 28, h * 0.32, 10).fill(wood.fill).stroke(line(wood.line, 4));
  c.addChild(g);
  const m = mark === 'ten' ? tenWedgeArt(62) : wedgeArt(36);
  m.position.set(0, h * 0.14);
  c.addChild(m);
  c.eventMode = 'none';
  return c;
}

/** Hand in: the pet's two hands holding a little tablet up. */
export function handInArt(w: number, h: number, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 34).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w, h, corner: 28 }, swatch.green));
  const g = new Graphics();
  g.roundRect(-26, -30, 52, 40, 8).fill(CLAY.fill).stroke(line(CLAY.line, 4));
  g.moveTo(-10, -18).lineTo(10, -18).lineTo(0, -4).closePath().fill(CLAY.line);
  for (const s of [-1, 1]) g.roundRect(s * 34 - 12, -4, 24, 34, 10).fill(swatch.yellow.light).stroke(line(ink, 4));
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** A verdict button `size` square centred on (0, 0), pictured, never worded: short (a gap in the cart), right (tablet and cart joined), extra (a basket over the edge). */
export function verdictArt(kind: 'short' | 'right' | 'extra', size: number, chosen = false, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w: size, h: size, corner: 28 }, chosen ? swatch.blue : swatch.purple));
  const g = new Graphics();
  // A small tablet above a small cart bed.
  g.roundRect(-30, -42, 60, 30, 6).fill(CLAY.fill).stroke(line(CLAY.line, 3));
  g.roundRect(-34, 8, 68, 18, 5).fill(wood.fill).stroke(line(wood.line, 3));
  for (const x of [-20, 20]) g.circle(x, 30, 7).fill(wood.line);
  const slots = kind === 'short' ? 2 : 3;
  for (let i = 0; i < 3; i++) {
    const x = -20 + i * 20;
    if (i < slots) g.circle(x, 2, 7).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
    else g.circle(x, 2, 7).stroke(line(ink, 2));
  }
  if (kind === 'right') g.roundRect(-4, -12, 8, 14, 3).fill(swatch.green.fill).stroke(line(swatch.green.line, 2));
  if (kind === 'extra') g.circle(40, -4, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** A number button `size` square centred on (0, 0): `n` dots over the numeral. */
export function numberArt(n: number, size: number, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w: size, h: size, corner: 26 }, swatch.blue));
  const g = new Graphics();
  for (let i = 0; i < n; i++) g.circle((i - (n - 1) / 2) * 22, -26, 8).fill(cream);
  c.addChild(g);
  const t = new Text({ text: String(n), style: { fontFamily: 'Nunito, sans-serif', fontSize: 44, fontWeight: '800', fill: cream, align: 'center' } });
  t.anchor.set(0.5);
  t.position.set(0, 14);
  c.addChild(t);
  c.eventMode = 'none';
  return c;
}

// ——— Level 6: two tablets disagree ———

/** A small field of sprouts, `w` wide, standing on (0, 0): the farm's sign. */
function fieldSign(w: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -w * 0.32, w, w * 0.32, 10).fill(0x9ccf6a).stroke(line(0x5f9a3a, 3));
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.36 + i * w * 0.24;
    g.moveTo(x, -w * 0.08).lineTo(x, -w * 0.3).stroke(line(REED, 3));
    g.ellipse(x - 5, -w * 0.28, 6, 3).fill(REED);
    g.ellipse(x + 5, -w * 0.24, 6, 3).fill(REED);
  }
  return g;
}

/**
 * Level 6: one of the two tablets, `w` × `h` at (0, 0) top-left, in shortest form: its place's picture (the farm's field or
 * the storehouse) and a speaker sign in the top band, then its big marks in a row and its small marks in rows of five.
 */
export function pairTabletArt(w: number, h: number, side: 'farm' | 'store', tens: number, ones: number, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  if (glow) g.roundRect(-12, -12, w + 24, h + 24, 38).fill({ color: swatch.yellow.fill, alpha: 0.55 });
  g.roundRect(0, 8, w, h, 30).fill(CLAY.dark);
  g.roundRect(0, 0, w, h, 30).fill(CLAY.fill).stroke(line(CLAY.line, 6));
  g.moveTo(16, 70).lineTo(w - 16, 70).stroke(line(CLAY.dark, 3));
  // The speaker sign: tap to hear it.
  for (const r of [10, 20]) g.moveTo(w - 46 + r * Math.cos(-0.7), 36 + r * Math.sin(-0.7)).arc(w - 46, 36, r, -0.7, 0.7).stroke(line(CLAY.line, 4));
  g.circle(w - 52, 36, 6).fill(CLAY.line);
  c.addChild(g);
  if (side === 'farm') {
    const f = fieldSign(110);
    f.position.set(80, 60);
    c.addChild(f);
  } else {
    const s = storeArt(80, 54);
    s.position.set(40, 8);
    c.addChild(s);
  }
  for (let i = 0; i < tens; i++) {
    const m = tenWedgeArt(66);
    m.position.set(w / 2 + (i - (tens - 1) / 2) * 90, 112);
    c.addChild(m);
  }
  for (let i = 0; i < ones; i++) {
    const m = wedgeArt(34);
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, ones - row * 5);
    m.position.set(w / 2 + ((i % 5) - (inRow - 1) / 2) * 46, 172 + row * 50);
    c.addChild(m);
  }
  c.eventMode = 'none';
  return c;
}

/** "This one": a hand pointing up at the tablet above, `size` square centred on (0, 0). */
export function pickArt(size: number, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w: size, h: size, corner: 28 }, swatch.green));
  const g = new Graphics();
  g.roundRect(-20, -4, 40, 36, 14).fill(swatch.yellow.light).stroke(line(ink, 4));
  g.roundRect(-8, -38, 16, 42, 8).fill(swatch.yellow.light).stroke(line(ink, 4));
  g.moveTo(-6, 10).lineTo(6, 10).stroke(line(ink, 3));
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** Neither: both little tablets with a wedge cross over them, `size` square centred on (0, 0). */
export function neitherArt(size: number, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w: size, h: size, corner: 28 }, swatch.purple));
  const g = new Graphics();
  for (const x of [-22, 22]) g.roundRect(x - 18, -24, 36, 48, 6).fill(CLAY.fill).stroke(line(CLAY.line, 3));
  g.moveTo(-34, -30).lineTo(34, 30).stroke(line(swatch.red.line, 9));
  g.moveTo(34, -30).lineTo(-34, 30).stroke(line(swatch.red.line, 9));
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** Can't tell: the pet's two hands up in a shrug over an empty cart, `size` square centred on (0, 0). */
export function cantTellArt(size: number, glow = false): Container {
  const c = new Container();
  if (glow) c.addChild(new Graphics().roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 30).fill({ color: swatch.yellow.fill, alpha: 0.55 }));
  c.addChild(finish({ w: size, h: size, corner: 28 }, swatch.blue));
  const cart = cartArt(70);
  cart.position.set(0, 34);
  c.addChild(cart);
  const g = new Graphics();
  for (const s of [-1, 1]) {
    g.moveTo(s * 14, -2).lineTo(s * 30, -22).stroke(line(ink, 4));
    g.ellipse(s * 33, -28, 11, 8).fill(swatch.yellow.light).stroke(line(ink, 4));
  }
  g.circle(0, -18, 12).fill(swatch.yellow.light).stroke(line(ink, 4));
  g.moveTo(-5, -14).quadraticCurveTo(0, -18, 5, -14).stroke(line(ink, 3));
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}
