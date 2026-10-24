import { Container, Graphics } from 'pixi.js';
import { grass, ink, swatch, wood } from '../../art/palette';
import { label } from '../../ui/text';
import type { Edge, Rect } from './logic';

/** Meadow Pens' code-drawn pieces: turf, flowers, fence pieces, the heap and stack, gate, bell, bubble pictures and cards. */

export const TURF = { fill: 0x7fcf5f, line: 0x4f9a3a, tuft: 0x5fb346 };
const MEADOW = { fill: grass, line: 0xbfe0a8 };
const POND = { fill: 0x8fd3f7, line: 0x4aa3d8 };

/** An unpainted meadow square. */
export function meadowCell(g: Graphics, r: Rect) {
  g.roundRect(r.x, r.y, r.w, r.h, 14).fill(MEADOW.fill).stroke({ width: 3, color: MEADOW.line });
}

/** A square of grass, with a few tufts. */
export function turfCell(g: Graphics, r: Rect, seed: number) {
  g.roundRect(r.x, r.y, r.w, r.h, 12).fill(TURF.fill).stroke({ width: 3, color: TURF.line });
  for (let i = 0; i < 3; i++) {
    const x = r.x + 22 + ((seed * 37 + i * 29) % 56);
    const y = r.y + 28 + ((seed * 53 + i * 31) % 50);
    g.moveTo(x - 7, y + 6).lineTo(x - 3, y - 6).lineTo(x, y + 6).lineTo(x + 4, y - 8).lineTo(x + 7, y + 6).stroke({ width: 3, color: TURF.tuft, join: 'round', cap: 'round' });
  }
}

/** A square that touches no grass: a little flower asking to join. */
export function flowerCell(g: Graphics, r: Rect, seed: number) {
  meadowCell(g, r);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2 - 6;
  const petal = [swatch.pink, swatch.purple, swatch.yellow, swatch.orange][seed % 4];
  g.moveTo(cx, cy + 10).lineTo(cx, cy + 34).stroke({ width: 5, color: TURF.line, cap: 'round' });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.circle(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 10).fill(petal.fill).stroke({ width: 2, color: petal.line });
  }
  g.circle(cx, cy, 8).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
}

/** A pond inside a pen that rings an unpainted square. */
export function pondCell(g: Graphics, r: Rect) {
  meadowCell(g, r);
  g.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 12, r.h / 2 - 20).fill(POND.fill).stroke({ width: 3, color: POND.line });
}

/** The two ends of an edge of a cell rectangle, pushed out by half the gap so neighbouring pieces meet. */
export function edgeLine(r: Rect, side: Edge['side'], gap: number): [number, number, number, number] {
  const p = gap / 2;
  const l = r.x - p, t = r.y - p, rt = r.x + r.w + p, b = r.y + r.h + p;
  if (side === 'right') return [rt, t, rt, b];
  if (side === 'left') return [l, t, l, b];
  if (side === 'down') return [l, b, rt, b];
  return [l, t, rt, t];
}

/** One fence piece along an edge: a rail with a post at each end; a missing piece is a dashed gap. */
export function fencePiece(g: Graphics, [x1, y1, x2, y2]: [number, number, number, number], missing = false) {
  if (missing) {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = i / n + 0.05;
      const b = (i + 0.55) / n;
      g.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a).lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
    }
    g.stroke({ width: 5, color: ink, alpha: 0.45, cap: 'round' });
    return;
  }
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 10, color: wood.line, cap: 'round' });
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 5, color: wood.light, cap: 'round' });
  for (const [x, y] of [[x1, y1], [x2, y2]]) g.roundRect(x - 7, y - 7, 14, 14, 4).fill(wood.fill).stroke({ width: 3, color: wood.line });
}

/** A loose fence piece lying on the heap or stack, centred on (x, y). */
export function loosePiece(g: Graphics, x: number, y: number, len = 44, angle = 0) {
  const dx = (Math.cos(angle) * len) / 2;
  const dy = (Math.sin(angle) * len) / 2;
  g.moveTo(x - dx, y - dy).lineTo(x + dx, y + dy).stroke({ width: 10, color: wood.line, cap: 'round' });
  g.moveTo(x - dx, y - dy).lineTo(x + dx, y + dy).stroke({ width: 5, color: wood.light, cap: 'round' });
}

/** The gate on the grid's edge: two posts and a swinging bar (`open` from 0 to 1). */
export function drawGate(g: Graphics, r: Rect, open: number) {
  g.clear();
  const wide = r.h > r.w;
  const a = { x: wide ? r.x + r.w / 2 : r.x, y: wide ? r.y : r.y + r.h / 2 };
  const b = { x: wide ? r.x + r.w / 2 : r.x + r.w, y: wide ? r.y + r.h : r.y + r.h / 2 };
  for (const p of [a, b]) g.roundRect(p.x - 10, p.y - 10, 20, 20, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
  const len = Math.hypot(b.x - a.x, b.y - a.y) - 20;
  const base = Math.atan2(b.y - a.y, b.x - a.x) - open * 1.2;
  const ex = a.x + Math.cos(base) * len;
  const ey = a.y + Math.sin(base) * len;
  g.moveTo(a.x, a.y).lineTo(ex, ey).stroke({ width: 12, color: swatch.red.line, cap: 'round' });
  g.moveTo(a.x, a.y).lineTo(ex, ey).stroke({ width: 6, color: swatch.red.fill, cap: 'round' });
}

/** The gate bell, about 120 units across, centred on (0, 0). */
export function bellArt(): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(0, 0, 58).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 4, color: swatch.yellow.line })
    .moveTo(-30, 22).quadraticCurveTo(-32, -34, 0, -36).quadraticCurveTo(32, -34, 30, 22).lineTo(38, 30).lineTo(-38, 30).closePath()
    .fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' })
    .circle(0, 36, 9).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line })
    .roundRect(-6, -48, 12, 14, 5).fill(swatch.yellow.line);
  c.addChild(g);
  return c;
}

/** A speech bubble's frame, filling a rectangle centred on (0, 0). */
export function bubbleFrame(w: number, h: number): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2, w, h, 26).fill(0xffffff).stroke({ width: 5, color: ink });
}

/** The request picture: `squares` grass squares with a dot each, and (level 3) `fence` pieces with a dot each. */
export function requestPicture(squares: number, fence?: number): Container {
  const c = new Container();
  const g = new Graphics();
  const top = fence === undefined ? 0 : -24;
  const s = 28;
  const x0 = -((squares * (s + 6) - 6) / 2);
  for (let i = 0; i < squares; i++) {
    const x = x0 + i * (s + 6);
    g.roundRect(x, top - s / 2, s, s, 6).fill(TURF.fill).stroke({ width: 2, color: TURF.line });
    g.circle(x + s / 2, top, 4).fill(ink);
  }
  if (fence !== undefined) {
    const step = Math.min(18, 240 / fence);
    const fx0 = -((fence - 1) * step) / 2;
    for (let i = 0; i < fence; i++) {
      const x = fx0 + i * step;
      g.moveTo(x, 18).lineTo(x, 44).stroke({ width: 6, color: wood.line, cap: 'round' });
      g.circle(x, 52, 3).fill(ink);
    }
  }
  c.addChild(g);
  return c;
}

/** Level 2's bubble: a grass square and a question mark. */
export function fieldPicture(): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-70, -26, 52, 52, 8).fill(TURF.fill).stroke({ width: 3, color: TURF.line }));
  const q = label('?', 64, swatch.purple.line);
  q.x = 30;
  c.addChild(q);
  return c;
}

/** A number card, 130 units square, centred on (0, 0), with a glow ring the scene switches on. */
export class Card extends Container {
  readonly ring = new Graphics();
  constructor(readonly value: number) {
    super();
    const n = label(String(value), 64, 0xffffff);
    n.style.stroke = { color: swatch.blue.line, width: 8, join: 'round' };
    this.addChild(this.ring, new Graphics().roundRect(-65, -65, 130, 130, 22).fill(swatch.blue.fill).stroke({ width: 6, color: swatch.blue.line }), n);
  }
  glow(on: boolean, t: number) {
    this.ring.clear();
    if (on) this.ring.roundRect(-80, -80, 160, 160, 30).fill({ color: 0xfff3a0, alpha: 0.6 + 0.3 * Math.sin(t * 6) });
  }
}

/** The hub icon and stickers: a pen of grass squares inside its fence, with a flower. */
export function penArt(cells: readonly [number, number][], size = 46): Container {
  const c = new Container();
  const g = new Graphics();
  const on = new Set(cells.map(([x, y]) => `${x},${y}`));
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const ox = -((Math.max(...xs) + Math.min(...xs) + 1) * size) / 2;
  const oy = -((Math.max(...ys) + Math.min(...ys) + 1) * size) / 2;
  const rect = (x: number, y: number): Rect => ({ x: ox + x * size, y: oy + y * size, w: size, h: size });
  cells.forEach(([x, y], i) => turfCell(g, rect(x, y), i));
  for (const [x, y] of cells) {
    for (const [dx, dy, side] of [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']] as const) {
      if (!on.has(`${x + dx},${y + dy}`)) fencePiece(g, edgeLine(rect(x, y), side, 0));
    }
  }
  c.addChild(g);
  const f = new Graphics();
  flowerCell(f, { x: -size / 2, y: 0, w: size, h: size }, cells.length);
  f.scale.set(0.8);
  f.position.set(Math.max(...xs) * size + ox + size * 0.9, oy + size * 0.2);
  c.addChild(f);
  return c;
}
