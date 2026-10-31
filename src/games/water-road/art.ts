/** Water Road's code-drawn pieces: wedge stones, the timber frame and its rope handle, low walls, the buttress block, slots, push arrows, icon and sticker. */
import { Container, Graphics } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { inner, outer, stoneAngles, type Ring } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
/** Pale stone in three tints, so a ring is never one flat colour. */
export const STONE = [
  { fill: 0xe8dcc8, line: 0xa89a82 },
  { fill: 0xdfd3bd, line: 0xa89a82 },
  { fill: 0xeee4d3, line: 0xa89a82 },
];
export const KEYSTONE = { fill: 0xfff0b3, line: 0xd9a520 };
export const GROUND = { fill: 0xd98f63, line: 0xb76b43, dark: 0xc47a52 };
export const SKY = { top: 0xbfe3f7, bottom: 0xfff1d6 };
const ROPE = { fill: 0xc9a56b, line: 0x8f6b3a };

/**
 * One wedge stone of a `count`-stone ring around the origin at `ring`'s radius, drawn around its own centre so it can fly
 * and tumble as one piece. The keystone is lit.
 */
export function stoneArt(ring: Ring, count: number, index: number, tint: number, keystone = false): Graphics {
  const { a0, a1, mid } = stoneAngles(count, index);
  const cx = -ring.r * Math.cos(mid);
  const cy = -ring.r * Math.sin(mid);
  const g = new Graphics();
  const pad = 0.012;
  const o = outer(ring);
  const i = inner(ring);
  g.moveTo(cx + o * Math.cos(a0 + pad), cy + o * Math.sin(a0 + pad))
    .arc(cx, cy, o, a0 + pad, a1 - pad)
    .lineTo(cx + i * Math.cos(a1 - pad), cy + i * Math.sin(a1 - pad))
    .arc(cx, cy, i, a1 - pad, a0 + pad, true)
    .closePath();
  const c = keystone ? KEYSTONE : STONE[tint % STONE.length];
  g.fill(c.fill).stroke(line(c.line, 4));
  g.eventMode = 'none';
  return g;
}

/** The wooden centering: a timber half-ring under the arch on two posts, with its rope handle hanging inside. */
export function frameArt(ring: Ring, handle: boolean, handleY = -40): Container {
  const c = new Container();
  const g = new Graphics();
  const r = inner(ring) - 6;
  g.moveTo(-r, 0).arc(0, 0, r, Math.PI, 2 * Math.PI).stroke(line(wood.line, 22));
  g.moveTo(-r, 0).arc(0, 0, r, Math.PI, 2 * Math.PI).stroke(line(wood.fill, 14));
  // Spokes.
  for (const a of [1.25 * Math.PI, 1.5 * Math.PI, 1.75 * Math.PI]) {
    g.moveTo(0, 0).lineTo(r * Math.cos(a), r * Math.sin(a)).stroke(line(wood.line, 8));
  }
  // Posts down to the ground.
  for (const s of [-1, 1]) {
    g.rect(s * (r - 10) - 12, 0, 24, ring.post + 4).fill(wood.fill).stroke(line(wood.line, 4));
  }
  g.eventMode = 'none';
  c.addChild(g);
  if (handle) {
    // The rope hangs from the crown to a bar at `handleY` (the layout's handle box), where a tap pulls.
    const h = new Graphics();
    const w = Math.min(120, r * 1.2);
    h.moveTo(0, -r + 12).lineTo(0, handleY - 20).stroke(line(ROPE.line, 6));
    h.roundRect(-w / 2, handleY - 22, w, 44, 14).fill(ROPE.fill).stroke(line(ROPE.line, 4));
    for (let i = 1; i < 4; i++) h.moveTo(-w / 2 + (w * i) / 4, handleY - 18).lineTo(-w / 2 + (w * i) / 4, handleY + 18).stroke(line(ROPE.line, 3));
    h.eventMode = 'none';
    c.addChild(h);
  }
  return c;
}

/** A low wall of stone courses, `w` wide and `h` tall, its top-centre at the origin. */
export function wallArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, 0, w, h, 8).fill(STONE[1].fill).stroke(line(STONE[1].line, 4));
  const rows = Math.max(1, Math.round(h / 28));
  for (let r = 1; r < rows; r++) g.moveTo(-w / 2 + 4, (h * r) / rows).lineTo(w / 2 - 4, (h * r) / rows).stroke(line(STONE[1].line, 3));
  const cols = Math.max(2, Math.round(w / 40));
  for (let r = 0; r < rows; r++) for (let cI = 1; cI < cols; cI++) {
    const x = -w / 2 + (w * cI) / cols + (r % 2 ? 12 : 0);
    if (x < w / 2 - 6) g.moveTo(x, (h * r) / rows + 2).lineTo(x, (h * (r + 1)) / rows - 2).stroke(line(STONE[1].line, 3));
  }
  g.eventMode = 'none';
  return g;
}

/** The buttress block: one big squared stone. */
export function blockArt(size = 120): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2 + 6, size, size, 14).fill(STONE[1].line);
  g.roundRect(-size / 2, -size / 2, size, size, 14).fill(STONE[2].fill).stroke(line(STONE[2].line, 5));
  g.moveTo(-size / 2 + 10, 0).lineTo(size / 2 - 10, 0).stroke(line(STONE[2].line, 3));
  g.moveTo(0, -size / 2 + 8).lineTo(0, -4).stroke(line(STONE[2].line, 3));
  g.moveTo(-size / 4, 4).lineTo(-size / 4, size / 2 - 8).stroke(line(STONE[2].line, 3));
  g.moveTo(size / 4, 4).lineTo(size / 4, size / 2 - 8).stroke(line(STONE[2].line, 3));
  return g;
}

/** A slot at the arch's foot: a dotted square that brightens under a held block and glows when it is the hint. */
export function slotArt(size: number, state: 'idle' | 'bright' | 'glow'): Graphics {
  const g = new Graphics();
  const color = state === 'glow' ? swatch.yellow.fill : state === 'bright' ? swatch.teal.fill : GROUND.line;
  g.roundRect(-size / 2, -size / 2, size, size, 16).fill({ color: state === 'idle' ? 0xffffff : color, alpha: state === 'idle' ? 0.18 : 0.3 });
  const step = size / 6;
  for (let i = 0; i < 6; i++) {
    g.moveTo(-size / 2 + i * step + 6, -size / 2).lineTo(-size / 2 + i * step + step - 6, -size / 2).stroke(line(color, 5));
    g.moveTo(-size / 2 + i * step + 6, size / 2).lineTo(-size / 2 + i * step + step - 6, size / 2).stroke(line(color, 5));
    g.moveTo(-size / 2, -size / 2 + i * step + 6).lineTo(-size / 2, -size / 2 + i * step + step - 6).stroke(line(color, 5));
    g.moveTo(size / 2, -size / 2 + i * step + 6).lineTo(size / 2, -size / 2 + i * step + step - 6).stroke(line(color, 5));
  }
  g.eventMode = 'none';
  return g;
}

/** A push arrow pointing outward on `side`, for the moment the arch is touched or spreads. */
export function arrowArt(side: 'left' | 'right'): Graphics {
  const g = new Graphics();
  const d = side === 'left' ? -1 : 1;
  g.moveTo(0, 0).lineTo(d * 70, 0).stroke(line(swatch.red.fill, 12));
  g.moveTo(d * 70, 0).lineTo(d * 40, -26).stroke(line(swatch.red.fill, 12));
  g.moveTo(d * 70, 0).lineTo(d * 40, 26).stroke(line(swatch.red.fill, 12));
  g.eventMode = 'none';
  return g;
}

/** The ground: a terracotta band from the ground line down. */
export function groundArt(w: number, from: number, to: number): Graphics {
  const g = new Graphics();
  g.rect(0, from, w, to - from).fill(0xe9b48f);
  g.rect(0, from, w, 70).fill(GROUND.fill);
  g.moveTo(0, from).lineTo(w, from).stroke(line(GROUND.line, 6));
  for (let x = 40; x < w; x += 160) g.ellipse(x, from + 110 + ((x / 160) % 3) * 40, 36, 8).fill(GROUND.dark);
  g.eventMode = 'none';
  return g;
}

/** A small standing ring with its keystone lit, for the sticker and the icon. */
export function archArt(ring: Ring, count: number, tints: number[], keystoneLit = true): Container {
  const c = new Container();
  for (let i = 0; i < count; i++) {
    const { mid } = stoneAngles(count, i);
    const s = stoneArt(ring, count, i, tints[i] ?? i, keystoneLit && i === (count - 1) / 2);
    s.position.set(ring.r * Math.cos(mid), ring.r * Math.sin(mid));
    c.addChild(s);
  }
  for (const d of [-1, 1]) {
    const w = wallArt(ring.t + 10, ring.post);
    w.position.set(d * ring.r, 0);
    c.addChild(w);
  }
  return c;
}

export function iconArt(): Container {
  const c = new Container();
  const arch = archArt({ r: 60, t: 30, post: 24 }, 5, [0, 1, 2, 1, 0]);
  arch.position.set(0, -24);
  c.addChild(arch);
  return c;
}

/** A seeded sticker: a standing arch with the frame leaning beside it. */
export function stickerArt(count: number, tints: number[]): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, -110, 220, 220, 26).fill(cream);
  g.roundRect(-96, -96, 192, 192, 22).fill(SKY.top).stroke(line(GROUND.line, 6));
  g.rect(-96, 40, 192, 56).fill(GROUND.fill);
  c.addChild(g);
  const ring = { r: 56, t: 28, post: 26 };
  const arch = archArt(ring, count, tints);
  arch.position.set(-14, 14);
  c.addChild(arch);
  const frame = frameArt(ring, false);
  frame.scale.set(0.55);
  frame.rotation = 0.5;
  frame.position.set(66, 44);
  c.addChild(frame);
  return c;
}

// ——— Levels 4–5: the water road ———

export const WATER = { fill: 0x7cc8ee, deep: 0x3d9fd6, light: 0xd8f1ff };
const GRASS = { fill: 0xa8d58a, line: 0x6fa557 };
const ROOF = { fill: 0xd9774f, line: 0xa9532f };
const ROCK = { fill: 0xb9b4ad, line: 0x837d75 };
const EARTH = { fill: 0xc99b70, line: 0x9a6f48 };

/** A stone pier from the ground up to `top`, centred on x = 0. */
export function pierArt(ground: number, top: number, w = 46): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, top, w, Math.max(8, ground - top), 6).fill(STONE[0].fill).stroke(line(STONE[0].line, 4));
  for (let y = top + 30; y < ground - 8; y += 30) g.moveTo(-w / 2 + 4, y).lineTo(w / 2 - 4, y).stroke(line(STONE[0].line, 2));
  g.eventMode = 'none';
  return g;
}

/** An empty pier place: a dotted outline on the ground (pre-K before a channel is chosen). */
export function pierPlaceArt(ground: number, w = 46): Graphics {
  const g = new Graphics();
  for (let x = -w / 2; x < w / 2; x += 14) g.moveTo(x, ground - 4).lineTo(Math.min(w / 2, x + 8), ground - 4).stroke(line(STONE[0].line, 5));
  g.eventMode = 'none';
  return g;
}

/** The channel along points, an open stone trough; `wet` stretches are drawn by the scene's water layer. */
export function channelArt(points: { x: number; y: number }[]): Graphics {
  const g = new Graphics();
  const path = () => { g.moveTo(points[0].x, points[0].y); for (const p of points.slice(1)) g.lineTo(p.x, p.y); };
  path(); g.stroke(line(STONE[0].line, 30));
  path(); g.stroke(line(STONE[2].fill, 22));
  path(); g.stroke(line(0xcfc4b0, 8));
  g.eventMode = 'none';
  return g;
}

/** The green hill at the left with the spring's stone basin on its top at (x, y). */
export function hillArt(x: number, y: number, ground: number): Graphics {
  const g = new Graphics();
  g.moveTo(-40, ground).lineTo(-40, y + 10).bezierCurveTo(x - 140, y - 30, x - 20, y - 10, x + 10, y + 20).bezierCurveTo(x + 50, y + 70, x + 70, ground - 30, x + 120, ground).closePath();
  g.fill(GRASS.fill).stroke(line(GRASS.line, 5));
  g.roundRect(x - 34, y - 16, 52, 30, 10).fill(STONE[1].fill).stroke(line(STONE[1].line, 4));
  g.ellipse(x - 8, y - 8, 18, 6).fill(WATER.fill);
  g.eventMode = 'none';
  return g;
}

/** The little town at the right with its fountain basin at (x, y). */
export function townArt(x: number, y: number, ground: number): Container {
  const c = new Container();
  const g = new Graphics();
  if (ground - y > 4) g.roundRect(x - 50, y + 10, 100, ground - y - 6, 10).fill(STONE[1].fill).stroke(line(STONE[1].line, 4));
  for (const [dx, w, h] of [[70, 70, 90], [140, 60, 120], [200, 80, 80]] as const) {
    g.rect(x + dx - w / 2, ground - h, w, h).fill(0xf6e6cc).stroke(line(ROOF.line, 4));
    g.moveTo(x + dx - w / 2 - 8, ground - h).lineTo(x + dx, ground - h - 34).lineTo(x + dx + w / 2 + 8, ground - h).closePath().fill(ROOF.fill).stroke(line(ROOF.line, 4));
    g.roundRect(x + dx - 10, ground - 34, 20, 34, 8).fill(ROOF.line);
  }
  g.roundRect(x - 40, y - 6, 80, 26, 10).fill(STONE[2].fill).stroke(line(STONE[2].line, 4));
  g.rect(x - 6, y - 40, 12, 36).fill(STONE[2].fill).stroke(line(STONE[2].line, 3));
  g.eventMode = 'none';
  c.addChild(g);
  return c;
}

/** A small whole road on a card (pre-K): the channel on its two piers between the spring and the fountain. */
export function cardArt(w: number, h: number, hs: number[], state: 'idle' | 'chosen'): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 22).fill(state === 'chosen' ? 0xfff3c4 : cream).stroke(line(state === 'chosen' ? swatch.yellow.fill : GROUND.line, state === 'chosen' ? 8 : 5));
  const ground = h / 2 - 26;
  const step = (h - 70) / 6;
  const xs = [0, 1, 2, 3].map((i) => -w / 2 + 40 + (i * (w - 80)) / 3);
  const pts = hs.map((v, i) => ({ x: xs[i], y: ground - v * step }));
  g.rect(-w / 2 + 8, ground, w - 16, 14).fill(GROUND.fill);
  for (let i = 1; i <= 2; i++) g.roundRect(xs[i] - 10, pts[i].y, 20, ground - pts[i].y, 4).fill(STONE[0].fill).stroke(line(STONE[0].line, 3));
  g.moveTo(pts[0].x - 18, ground).lineTo(pts[0].x - 18, pts[0].y).lineTo(pts[0].x + 4, pts[0].y).lineTo(pts[0].x + 4, ground).closePath().fill(GRASS.fill);
  g.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.stroke(line(STONE[0].line, 14));
  g.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.stroke(line(WATER.fill, 6));
  g.circle(pts[3].x, pts[3].y - 4, 9).fill(STONE[2].fill).stroke(line(STONE[2].line, 3));
  g.eventMode = 'none';
  c.addChild(g);
  return c;
}

/** A big arrow button under a pier: up raises the pier's top one step, down lowers it. */
export function arrowButtonArt(w: number, h: number, dir: 1 | -1): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 5, w, h, 22).fill(STONE[1].line);
  g.roundRect(-w / 2, -h / 2, w, h, 22).fill(cream).stroke(line(GROUND.line, 5));
  const d = -dir;
  g.moveTo(0, d * 30).lineTo(-34, -d * 6).lineTo(-14, -d * 6).lineTo(-14, -d * 30).lineTo(14, -d * 30).lineTo(14, -d * 6).lineTo(34, -d * 6).closePath();
  g.fill(dir === 1 ? swatch.teal.fill : swatch.orange.fill).stroke(line(dir === 1 ? swatch.teal.line : swatch.orange.line, 4));
  return g;
}

/** Open the spring: a round valve wheel with a drop beside it. */
export function openButtonArt(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 6, w, h, 28).fill(0x2f7fb0);
  g.roundRect(-w / 2, -h / 2, w, h, 28).fill(WATER.deep).stroke(line(0x2f7fb0, 5));
  g.circle(-26, 0, 30).stroke(line(0xffffff, 8));
  for (let a = 0; a < 4; a++) g.moveTo(-26, 0).lineTo(-26 + 30 * Math.cos((a * Math.PI) / 2 + 0.4), 30 * Math.sin((a * Math.PI) / 2 + 0.4)).stroke(line(0xffffff, 6));
  g.moveTo(40, -30).bezierCurveTo(60, -4, 62, 10, 40, 24).bezierCurveTo(18, 10, 20, -4, 40, -30).closePath().fill(WATER.light);
  c.addChild(g);
  return c;
}

/** One stone arch for a span place, `w` wide and `h` tall, centred; its piers' tops at the bottom corners. */
export function archPieceArt(w: number, h: number): Graphics {
  const g = new Graphics();
  const r = w / 2 - 22;
  g.moveTo(-w / 2, -h / 2).lineTo(w / 2, -h / 2).lineTo(w / 2, h / 2).lineTo(r, h / 2).lineTo(r, 0).arc(0, 0, r, 0, Math.PI, true).lineTo(-r, h / 2).lineTo(-w / 2, h / 2).closePath();
  g.fill(STONE[0].fill).stroke(line(STONE[0].line, 4));
  for (let k = 1; k < 6; k++) {
    const a = Math.PI + (k * Math.PI) / 6;
    g.moveTo(r * Math.cos(a), r * Math.sin(a)).lineTo((r + 22) * Math.cos(a), (r + 22) * Math.sin(a)).stroke(line(STONE[0].line, 3));
  }
  g.roundRect(-11, -r - 22, 22, 22, 4).fill(KEYSTONE.fill).stroke(line(KEYSTONE.line, 3));
  return g;
}

/** The abutment: a heavy squared block. */
export function abutmentArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 6, w, h, 12).fill(STONE[1].line);
  g.roundRect(-w / 2, -h / 2, w, h, 12).fill(STONE[2].fill).stroke(line(STONE[2].line, 5));
  for (const y of [-h / 6, h / 6]) g.moveTo(-w / 2 + 8, y).lineTo(w / 2 - 8, y).stroke(line(STONE[2].line, 3));
  g.moveTo(0, -h / 2 + 6).lineTo(0, -h / 6).stroke(line(STONE[2].line, 3));
  g.moveTo(0, h / 6).lineTo(0, h / 2 - 6).stroke(line(STONE[2].line, 3));
  return g;
}

/** The valley's banks and floor: land at the deck on both sides, a rock face or crumbly earth at each end. */
export function valleyArt(v: { w: number; h: number }, deck: number, floor: number, near: { x: number; w: number }, far: { x: number; w: number }, ends: { near: 'rock' | 'earth'; far: 'rock' | 'earth' }, spanH: number): Graphics {
  const g = new Graphics();
  const bank = deck + spanH + 4;
  g.rect(0, floor, v.w, v.h - floor).fill(0xe9b48f);
  g.rect(0, floor, v.w, 50).fill(GROUND.fill);
  g.moveTo(0, floor).lineTo(v.w, floor).stroke(line(GROUND.line, 5));
  g.rect(-10, bank, near.x + 10, floor - bank + 2).fill(GRASS.fill).stroke(line(GRASS.line, 5));
  g.rect(far.x + far.w, bank, v.w - far.x - far.w + 10, floor - bank + 2).fill(GRASS.fill).stroke(line(GRASS.line, 5));
  for (const [e, r] of [['near', near], ['far', far]] as const) {
    const c = ends[e] === 'rock' ? ROCK : EARTH;
    g.rect(r.x, deck - 6, r.w, floor - deck + 8).fill(c.fill).stroke(line(c.line, 4));
    if (ends[e] === 'rock') {
      for (let y = deck + 20; y < floor - 10; y += 40) g.moveTo(r.x + 10, y).lineTo(r.x + r.w - 20, y + 14).stroke(line(ROCK.line, 3));
    } else {
      for (let k = 0; k < 9; k++) g.circle(r.x + 14 + ((k * 37) % (r.w - 24)), deck + 18 + ((k * 53) % (floor - deck - 30)), 5).fill(EARTH.line);
    }
  }
  g.eventMode = 'none';
  return g;
}

/** A dotted place for a piece (a span or an end slot), bright under a held piece and glowing as the hint. */
export function placeArt(w: number, h: number, state: 'idle' | 'bright' | 'glow' | 'problem'): Graphics {
  const g = new Graphics();
  const color = state === 'glow' ? swatch.yellow.fill : state === 'bright' ? swatch.teal.fill : state === 'problem' ? swatch.red.fill : 0xffffff;
  g.roundRect(-w / 2, -h / 2, w, h, 14).fill({ color, alpha: state === 'idle' ? 0.22 : 0.35 });
  const dash = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < len; t += 22) {
      const a = t / len;
      const b = Math.min(1, (t + 12) / len);
      g.moveTo(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a).lineTo(x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
    }
  };
  dash(-w / 2, -h / 2, w / 2, -h / 2); dash(w / 2, -h / 2, w / 2, h / 2); dash(w / 2, h / 2, -w / 2, h / 2); dash(-w / 2, h / 2, -w / 2, -h / 2);
  g.stroke(line(state === 'idle' ? GROUND.line : color, 5));
  g.eventMode = 'none';
  return g;
}
