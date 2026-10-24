import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { ART_R, type LeafKind, type Looks, type SampleId, type Stop, type SwimmerShape } from './logic';

/**
 * Everything in Puddle Lens is drawn here, in art units where the lens view's radius is `ART_R` (200). Each stop of each sample is
 * one pre-drawn layer; the game cross-fades between them and never zooms continuously.
 */
const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });
const SLIDE = 0xf1f8fb;
const WATER = 0xcde9f4;
const LEAF = { fill: 0x7cc96b, line: 0x3f8f3a, light: 0xa9e08f, vein: 0x5aa94c };
const SPECK = 0xa89a86;

interface Pt {
  x: number;
  y: number;
}

/** A leaf's outline, `d` tall, tip up. */
function leafOutline(kind: LeafKind, d: number): Pt[] {
  const pts: Pt[] = [];
  const n = 60;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    if (kind === 'maple') {
      // Five rounded lobes.
      const r = (d / 2) * (0.72 + 0.28 * Math.cos(5 * t));
      pts.push({ x: Math.sin(t) * r, y: -Math.cos(t) * r });
    } else {
      const w = kind === 'round' ? 0.42 : 0.24;
      // A teardrop: wider below the middle, pointed at the tip.
      const x = Math.sin(t) * d * w * (0.8 + 0.2 * Math.cos(t));
      const y = -Math.cos(t) * d * 0.5;
      pts.push({ x, y });
    }
  }
  return pts;
}

function poly(g: Graphics, pts: Pt[]) {
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.closePath();
}

/** The whole leaf at diameter `d`; `hairs` adds the soft spikes along its rim. */
export function leafArt(kind: LeafKind, d: number, hairs: boolean): Graphics {
  const g = new Graphics();
  const pts = leafOutline(kind, d);
  g.moveTo(0, d * 0.45).lineTo(0, d * 0.62).stroke(line(LEAF.line, Math.max(4, d * 0.04)));
  if (hairs) {
    pts.forEach((p, i) => {
      if (i % 2) return;
      const q = pts[(i + 1) % pts.length];
      const nx = q.y - p.y;
      const ny = -(q.x - p.x);
      const k = Math.hypot(nx, ny) || 1;
      g.moveTo(p.x, p.y).lineTo(p.x + (nx / k) * d * 0.05, p.y + (ny / k) * d * 0.05);
    });
    g.stroke(line(LEAF.light, Math.max(2, d * 0.012)));
  }
  poly(g, pts);
  g.fill(LEAF.fill).stroke(line(LEAF.line, Math.max(3, d * 0.025)));
  g.moveTo(0, d * 0.45).lineTo(0, -d * 0.4).stroke(line(LEAF.vein, Math.max(3, d * 0.02)));
  for (const y of [-0.2, 0, 0.2]) for (const s of [-1, 1]) g.moveTo(0, d * y).lineTo(s * d * 0.2, d * (y - 0.12)).stroke(line(LEAF.vein, Math.max(2, d * 0.014)));
  return g;
}

/** A dome of water on the slide, `d` across; `specks` scatters grains inside it. */
export function dropArt(d: number, specks: boolean): Graphics {
  const g = new Graphics();
  g.ellipse(0, d * 0.06, d / 2, d * 0.45).fill({ color: 0x9fd0e6, alpha: 0.6 });
  g.circle(0, 0, d / 2).fill({ color: WATER, alpha: 0.9 }).stroke(line(0x7bb8d4, Math.max(3, d * 0.02)));
  if (specks) {
    const rng = new Rng(41);
    for (let i = 0; i < 14; i++) {
      const a = rng.range(0, Math.PI * 2);
      const r = Math.sqrt(rng.next()) * d * 0.38;
      g.circle(Math.cos(a) * r, Math.sin(a) * r, d * rng.range(0.012, 0.02)).fill(SPECK);
    }
  }
  g.ellipse(-d * 0.18, -d * 0.2, d * 0.12, d * 0.06).fill({ color: 0xffffff, alpha: 0.75 });
  return g;
}

/** A pinch of sand (`separate`: the grains spread apart), `d` across. */
export function sandArt(colors: ColorName[], d: number, separate: boolean): Graphics {
  const g = new Graphics();
  const rng = new Rng(77);
  if (!separate) {
    for (let i = 0; i < 70; i++) {
      const x = rng.range(-1, 1) * d * 0.45;
      const top = d * 0.3 * (1 - (x / (d * 0.48)) ** 2);
      const y = d * 0.2 - rng.next() * (top + d * 0.15);
      g.circle(x, y, d * 0.03).fill(swatch[rng.pick(colors)].fill);
    }
    return g;
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const r = i === 0 ? 0 : d * rng.range(0.22, 0.4);
    const c = swatch[colors[i % colors.length]];
    const s = d * rng.range(0.06, 0.09);
    g.roundRect(Math.cos(a) * r - s, Math.sin(a) * r - s * 0.8, s * 2, s * 1.6, s * 0.7).fill(c.fill).stroke(line(c.line, 3));
  }
  return g;
}

/** One sand grain, `r` in radius, with bumps and cracks; `close` draws the surface larger, past the edge of the view. */
export function grainArt(color: ColorName, r: number, close: boolean): Graphics {
  const g = new Graphics();
  const c = swatch[color];
  const rng = new Rng(close ? 9 : 8);
  const pts: Pt[] = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const k = r * (0.88 + 0.12 * rng.next());
    return { x: Math.cos(a) * k, y: Math.sin(a) * k * 0.85 };
  });
  poly(g, pts);
  g.fill(c.fill).stroke(line(c.line, 6));
  for (let i = 0; i < (close ? 7 : 12); i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = Math.sqrt(rng.next()) * r * 0.7;
    g.circle(Math.cos(a) * d, Math.sin(a) * d * 0.85, r * rng.range(0.05, 0.1)).fill(c.light).stroke(line(c.line, 2));
  }
  for (let i = 0; i < (close ? 3 : 4); i++) {
    let x = rng.range(-0.5, 0.5) * r;
    let y = rng.range(-0.5, 0.5) * r;
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += rng.range(-0.2, 0.2) * r;
      y += rng.range(0.05, 0.15) * r;
      g.lineTo(x, y);
    }
    g.stroke(line(c.line, close ? 5 : 3));
  }
  return g;
}

/** The leaf's little boxes (cell walls), `box` wide, filling the view; `beads` adds the green beads inside each. */
function boxesArt(box: number, beads: boolean): Graphics {
  const g = new Graphics();
  const h = box * 0.62;
  const span = ART_R * 1.3;
  g.rect(-span, -span, span * 2, span * 2).fill(LEAF.light);
  const rng = new Rng(beads ? 5 : 4);
  for (let row = -Math.ceil(span / h); row <= Math.ceil(span / h); row++) {
    const off = (row % 2) * box * 0.5;
    for (let col = -Math.ceil(span / box) - 1; col <= Math.ceil(span / box); col++) {
      const x = col * box + off;
      const y = row * h;
      g.roundRect(x + 3, y + 3, box - 6, h - 6, box * 0.08).fill(0xc9eeb0).stroke(line(LEAF.line, Math.max(3, box * 0.04)));
      if (beads) for (let k = 0; k < 4; k++) g.ellipse(x + box * rng.range(0.22, 0.78), y + h * rng.range(0.28, 0.72), box * 0.09, box * 0.06).fill(0x3fae3a).stroke(line(0x2a7a2a, 2));
    }
  }
  return g;
}

/** A faceless swimmer `len` long, heading right, with a darker centre spot and (`hairs`) a fringe. */
export function swimmerArt(shape: SwimmerShape, len: number, hairs: boolean): Graphics {
  const g = new Graphics();
  const w = shape === 'round' ? 0.62 : shape === 'long' ? 0.34 : 0.48;
  const body = { fill: 0xe7f3c8, line: 0x7f9b4c };
  const outline: Pt[] = Array.from({ length: 36 }, (_, i) => {
    const t = (i / 36) * Math.PI * 2;
    // A bean is pinched on one side.
    const pinch = shape === 'bean' ? 1 - 0.35 * Math.max(0, Math.sin(t)) ** 3 : 1;
    return { x: Math.cos(t) * len * 0.5, y: Math.sin(t) * len * 0.5 * w * pinch };
  });
  if (hairs) {
    for (const p of outline) {
      const k = Math.hypot(p.x / (len * 0.5), p.y / (len * 0.5 * w)) || 1;
      const nx = p.x / (len * 0.5) / k;
      const ny = p.y / (len * 0.5 * w) / k;
      g.moveTo(p.x, p.y).lineTo(p.x + nx * len * 0.07, p.y + ny * len * 0.07);
    }
    g.stroke(line(body.line, Math.max(2, len * 0.012)));
  }
  poly(g, outline);
  g.fill({ color: body.fill, alpha: 0.95 }).stroke(line(body.line, Math.max(3, len * 0.025)));
  g.ellipse(len * 0.05, 0, len * 0.12, len * 0.1 * Math.min(1, w * 1.6)).fill(0x9db86a);
  return g;
}

/** Big specks inside the drop, seen close (`n` of them, about `r` in radius). */
function specksArt(n: number, r: number, seed: number): Graphics {
  const g = new Graphics();
  const rng = new Rng(seed);
  for (let i = 0; i < n; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(0.3, 1.05) * ART_R;
    const s = r * rng.range(0.7, 1.2);
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, s, s * 0.8).fill(SPECK).stroke(line(0x7d705f, Math.max(2, s * 0.15)));
  }
  return g;
}

/** One stop's view of a sample, centred on (0, 0) and reaching past the view's radius where a feature no longer fits. */
export function viewLayer(sample: SampleId, stop: Stop, looks: Looks): Container {
  const c = new Container();
  const bg = new Graphics().circle(0, 0, ART_R + 4).fill(sample === 'leaf' && stop >= 3 ? LEAF.light : (sample === 'drop' || sample === 'drop-empty') && stop >= 3 ? WATER : SLIDE);
  c.addChild(bg);
  const drop = sample === 'drop' || sample === 'drop-empty';
  if (sample === 'leaf') {
    if (stop === 1) c.addChild(leafArt(looks.leaf, 130, false));
    else if (stop === 2) c.addChild(leafArt(looks.leaf, 360, true));
    else if (stop === 3) {
      // The little boxes fill the view; the leaf's edge, with its tiny hairs, crosses the bottom.
      c.addChild(boxesArt(70, false));
      const edge = new Graphics();
      edge.moveTo(-ART_R * 1.2, ART_R * 0.55).quadraticCurveTo(0, ART_R * 0.85, ART_R * 1.2, ART_R * 0.5).lineTo(ART_R * 1.2, ART_R * 1.3).lineTo(-ART_R * 1.2, ART_R * 1.3).closePath().fill(SLIDE);
      for (let x = -ART_R; x <= ART_R; x += 34) {
        const t = (x + ART_R * 1.2) / (ART_R * 2.4);
        const y = (1 - t) ** 2 * ART_R * 0.55 + 2 * (1 - t) * t * ART_R * 0.85 + t * t * ART_R * 0.5;
        edge.moveTo(x, y - 4).lineTo(x + 6, y + 34);
      }
      edge.stroke(line(LEAF.line, 5));
      c.addChild(edge);
    } else c.addChild(boxesArt(150, true));
  } else if (drop) {
    if (stop === 1) c.addChild(dropArt(120, false));
    else if (stop === 2) c.addChild(dropArt(370, true));
    else if (stop === 3) c.addChild(specksArt(12, 16, 13));
    else {
      c.addChild(specksArt(4, 44, 17));
      if (sample === 'drop-empty') {
        const g = grainArt('brown', 95, false);
        g.alpha = 0.9;
        c.addChild(g);
      }
    }
  } else {
    const colors = looks.sand;
    if (stop === 1) c.addChild(sandArt(colors, 130, false));
    else if (stop === 2) c.addChild(sandArt(colors, 380, true));
    else c.addChild(grainArt(colors[0], stop === 3 ? 175 : 330, stop === 4));
  }
  return c;
}

/** A thing as it lies on the level-2 table (`d` across), or as it looks under the glass (`close`). */
export function thingArt(sample: 'leaf' | 'drop' | 'sand', looks: Looks, d: number, close: boolean): Graphics {
  if (sample === 'leaf') return leafArt(looks.leaf, d * 0.95, close);
  if (sample === 'drop') return dropArt(d * 0.8, close);
  return close ? sandArt(looks.sand, d, true) : sandArt(looks.sand, d, false);
}

/** The companion's paw: a soft pad and three toes, in its colour. */
export function pawArt(color: ColorName, r: number): Graphics {
  const s = swatch[color] ?? swatch.orange;
  const g = new Graphics();
  g.ellipse(0, r * 0.25, r * 0.75, r * 0.6).fill(s.fill).stroke(line(s.line, 5));
  for (const k of [-1, 0, 1]) g.circle(k * r * 0.5, -r * 0.42 - (k === 0 ? r * 0.12 : 0), r * 0.27).fill(s.fill).stroke(line(s.line, 4));
  g.ellipse(0, r * 0.3, r * 0.35, r * 0.25).fill(s.light);
  return g;
}

/** The lens's frame: a hand-lens glass with a handle (levels 1–2) or the microscope's brass eyepiece with stop marks (3–4). */
export function lensFrame(r: number, microscope: boolean): Graphics {
  const g = new Graphics();
  if (!microscope) {
    g.moveTo(r * 0.68, r * 0.68).lineTo(r * 1.25, r * 1.25).stroke(line(wood.line, 34)).moveTo(r * 0.68, r * 0.68).lineTo(r * 1.25, r * 1.25).stroke(line(wood.fill, 24));
    g.circle(0, 0, r + 8).stroke({ width: 18, color: 0x5c6f82 });
    g.circle(0, 0, r + 8).stroke({ width: 8, color: 0x8ea3b6 });
    return g;
  }
  g.circle(0, 0, r + 14).stroke({ width: 28, color: 0xb98a2e });
  g.circle(0, 0, r + 14).stroke({ width: 12, color: 0xe2b64c });
  return g;
}

/** A soft shine across the glass, drawn over the view. */
export function lensShine(r: number): Graphics {
  return new Graphics().ellipse(-r * 0.42, -r * 0.5, r * 0.28, r * 0.12).fill({ color: 0xffffff, alpha: 0.35 });
}

/** The draggable hand lens of level 2: glass ring and handle, `r` the glass's radius. */
export function handLensArt(r: number): Graphics {
  return lensFrame(r, false);
}

/** A stop's picture, about 80 across: an eye, a hand lens, a microscope, a microscope with a bigger lens; and one to four dots. */
export function stopPicture(stop: Stop): Container {
  const c = new Container();
  const g = new Graphics();
  if (stop === 1) {
    g.moveTo(-34, -6).quadraticCurveTo(0, -38, 34, -6).quadraticCurveTo(0, 26, -34, -6).fill(0xffffff).stroke(line(ink, 5));
    g.circle(0, -6, 12).fill(swatch.blue.fill).circle(0, -6, 6).fill(ink);
  } else if (stop === 2) {
    g.moveTo(10, 4).lineTo(30, 24).stroke(line(wood.line, 12));
    g.circle(-6, -12, 20).fill(0xd6eefa).stroke(line(0x5c6f82, 7));
  } else {
    const big = stop === 4;
    g.roundRect(-30, 18, 60, 10, 4).fill(0x5c6f82);
    g.moveTo(14, 18).quadraticCurveTo(26, 0, 8, -14).stroke(line(0x5c6f82, 8));
    g.roundRect(-14, -34, 16, 34, 5).fill(0x8ea3b6).stroke(line(0x5c6f82, 4));
    g.circle(-6, 4, big ? 11 : 7).fill(0xe2b64c).stroke(line(0xb98a2e, 3));
    g.rect(-20, 8, 30, 5).fill(0x5c6f82);
  }
  c.addChild(g);
  const dots = new Graphics();
  for (let i = 0; i < stop; i++) dots.circle((i - (stop - 1) / 2) * 14, 40, 5).fill(swatch.purple.fill);
  c.addChild(dots);
  return c;
}

/** Level 3's No swimmers: a drop with a small empty circle. */
export function noneIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(0, -36).bezierCurveTo(26, -6, 30, 30, 0, 32).bezierCurveTo(-30, 30, -26, -6, 0, -36).fill(WATER).stroke(line(0x7bb8d4, 5));
  g.circle(0, 8, 12).stroke(line(0x5c6f82, 4));
  return g;
}

/** Level 4's Show: a big eye with a sparkle. */
export function showIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(-36, 0).quadraticCurveTo(0, -36, 36, 0).quadraticCurveTo(0, 36, -36, 0).fill(0xffffff).stroke(line(ink, 5));
  g.circle(0, 0, 14).fill(swatch.green.fill).circle(0, 0, 7).fill(ink).circle(-4, -4, 3).fill(0xffffff);
  g.moveTo(30, -34).lineTo(30, -18).moveTo(22, -26).lineTo(38, -26).stroke(line(0xffc93c, 5));
  return g;
}

/** A button face: a white rounded square that brightens on touch-down. */
export function buttonFace(size: number, lit: boolean): Graphics {
  return new Graphics().roundRect(-size / 2, -size / 2, size, size, 24).fill(lit ? 0xfff6c8 : 0xffffff).stroke({ width: lit ? 8 : 5, color: lit ? swatch.purple.line : 0xb9c6d1 });
}

export { LEAF };
