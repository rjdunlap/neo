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
