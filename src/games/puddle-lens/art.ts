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
  g.moveTo(0, d * 0.45)
    .lineTo(0, d * 0.62)
    .stroke(line(LEAF.line, Math.max(4, d * 0.04)));
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
  g.moveTo(0, d * 0.45)
    .lineTo(0, -d * 0.4)
    .stroke(line(LEAF.vein, Math.max(3, d * 0.02)));
  for (const y of [-0.2, 0, 0.2])
    for (const s of [-1, 1])
      g.moveTo(0, d * y)
        .lineTo(s * d * 0.2, d * (y - 0.12))
        .stroke(line(LEAF.vein, Math.max(2, d * 0.014)));
  return g;
}

/** A dome of water on the slide, `d` across; `specks` scatters grains inside it. */
export function dropArt(d: number, specks: boolean): Graphics {
  const g = new Graphics();
  g.ellipse(0, d * 0.06, d / 2, d * 0.45).fill({ color: 0x9fd0e6, alpha: 0.6 });
  g.circle(0, 0, d / 2)
    .fill({ color: WATER, alpha: 0.9 })
    .stroke(line(0x7bb8d4, Math.max(3, d * 0.02)));
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
    g.roundRect(Math.cos(a) * r - s, Math.sin(a) * r - s * 0.8, s * 2, s * 1.6, s * 0.7)
      .fill(c.fill)
      .stroke(line(c.line, 3));
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
    g.circle(Math.cos(a) * d, Math.sin(a) * d * 0.85, r * rng.range(0.05, 0.1))
      .fill(c.light)
      .stroke(line(c.line, 2));
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
      g.roundRect(x + 3, y + 3, box - 6, h - 6, box * 0.08)
        .fill(0xc9eeb0)
        .stroke(line(LEAF.line, Math.max(3, box * 0.04)));
      if (beads)
        for (let k = 0; k < 4; k++)
          g.ellipse(x + box * rng.range(0.22, 0.78), y + h * rng.range(0.28, 0.72), box * 0.09, box * 0.06)
            .fill(0x3fae3a)
            .stroke(line(0x2a7a2a, 2));
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
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, s, s * 0.8)
      .fill(SPECK)
      .stroke(line(0x7d705f, Math.max(2, s * 0.15)));
  }
  return g;
}

/** One stop's view of a sample, centred on (0, 0) and reaching past the view's radius where a feature no longer fits. */
export function viewLayer(sample: SampleId, stop: Stop, looks: Looks): Container {
  const c = new Container();
  const bg = new Graphics()
    .circle(0, 0, ART_R + 4)
    .fill(
      sample === 'leaf' && stop >= 3
        ? LEAF.light
        : (sample === 'drop' || sample === 'drop-empty') && stop >= 3
          ? WATER
          : SLIDE,
    );
  c.addChild(bg);
  const drop = sample === 'drop' || sample === 'drop-empty';
  if (sample === 'leaf') {
    if (stop === 1) c.addChild(leafArt(looks.leaf, 130, false));
    else if (stop === 2) c.addChild(leafArt(looks.leaf, 360, true));
    else if (stop === 3) {
      // The little boxes fill the view; the leaf's edge, with its tiny hairs, crosses the bottom.
      c.addChild(boxesArt(70, false));
      const edge = new Graphics();
      edge
        .moveTo(-ART_R * 1.2, ART_R * 0.55)
        .quadraticCurveTo(0, ART_R * 0.85, ART_R * 1.2, ART_R * 0.5)
        .lineTo(ART_R * 1.2, ART_R * 1.3)
        .lineTo(-ART_R * 1.2, ART_R * 1.3)
        .closePath()
        .fill(SLIDE);
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
export function thingArt(
  sample: 'leaf' | 'drop' | 'sand',
  looks: Looks,
  d: number,
  close: boolean,
): Graphics {
  if (sample === 'leaf') return leafArt(looks.leaf, d * 0.95, close);
  if (sample === 'drop') return dropArt(d * 0.8, close);
  return close ? sandArt(looks.sand, d, true) : sandArt(looks.sand, d, false);
}

/** The companion's paw: a soft pad and three toes, in its colour. */
export function pawArt(color: ColorName, r: number): Graphics {
  const s = swatch[color] ?? swatch.orange;
  const g = new Graphics();
  g.ellipse(0, r * 0.25, r * 0.75, r * 0.6)
    .fill(s.fill)
    .stroke(line(s.line, 5));
  for (const k of [-1, 0, 1])
    g.circle(k * r * 0.5, -r * 0.42 - (k === 0 ? r * 0.12 : 0), r * 0.27)
      .fill(s.fill)
      .stroke(line(s.line, 4));
  g.ellipse(0, r * 0.3, r * 0.35, r * 0.25).fill(s.light);
  return g;
}

/** The lens's frame: a hand-lens glass with a handle (levels 1–2) or the microscope's brass eyepiece with stop marks (3–4). */
export function lensFrame(r: number, microscope: boolean): Graphics {
  const g = new Graphics();
  if (!microscope) {
    g.moveTo(r * 0.68, r * 0.68)
      .lineTo(r * 1.25, r * 1.25)
      .stroke(line(wood.line, 34))
      .moveTo(r * 0.68, r * 0.68)
      .lineTo(r * 1.25, r * 1.25)
      .stroke(line(wood.fill, 24));
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
  return new Graphics()
    .ellipse(-r * 0.42, -r * 0.5, r * 0.28, r * 0.12)
    .fill({ color: 0xffffff, alpha: 0.35 });
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
    g.moveTo(-34, -6)
      .quadraticCurveTo(0, -38, 34, -6)
      .quadraticCurveTo(0, 26, -34, -6)
      .fill(0xffffff)
      .stroke(line(ink, 5));
    g.circle(0, -6, 12).fill(swatch.blue.fill).circle(0, -6, 6).fill(ink);
  } else if (stop === 2) {
    g.moveTo(10, 4).lineTo(30, 24).stroke(line(wood.line, 12));
    g.circle(-6, -12, 20).fill(0xd6eefa).stroke(line(0x5c6f82, 7));
  } else {
    const big = stop === 4;
    g.roundRect(-30, 18, 60, 10, 4).fill(0x5c6f82);
    g.moveTo(14, 18).quadraticCurveTo(26, 0, 8, -14).stroke(line(0x5c6f82, 8));
    g.roundRect(-14, -34, 16, 34, 5).fill(0x8ea3b6).stroke(line(0x5c6f82, 4));
    g.circle(-6, 4, big ? 11 : 7)
      .fill(0xe2b64c)
      .stroke(line(0xb98a2e, 3));
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
  g.moveTo(0, -36)
    .bezierCurveTo(26, -6, 30, 30, 0, 32)
    .bezierCurveTo(-30, 30, -26, -6, 0, -36)
    .fill(WATER)
    .stroke(line(0x7bb8d4, 5));
  g.circle(0, 8, 12).stroke(line(0x5c6f82, 4));
  return g;
}

/** Level 4's Show: a big eye with a sparkle. */
export function showIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(-36, 0)
    .quadraticCurveTo(0, -36, 36, 0)
    .quadraticCurveTo(0, 36, -36, 0)
    .fill(0xffffff)
    .stroke(line(ink, 5));
  g.circle(0, 0, 14).fill(swatch.green.fill).circle(0, 0, 7).fill(ink).circle(-4, -4, 3).fill(0xffffff);
  g.moveTo(30, -34).lineTo(30, -18).moveTo(22, -26).lineTo(38, -26).stroke(line(0xffc93c, 5));
  return g;
}

/** A button face: a white rounded square that brightens on touch-down. */
export function buttonFace(size: number, lit: boolean): Graphics {
  return new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, 24)
    .fill(lit ? 0xfff6c8 : 0xffffff)
    .stroke({ width: lit ? 8 : 5, color: lit ? swatch.purple.line : 0xb9c6d1 });
}

export { LEAF };

// ----- levels 5–6 -----

const MUD = { fill: 0x9a7b55, line: 0x6b5236 };
const SILT = { fill: 0x8f9a6a, line: 0x626b45 };
const BALL = { fill: 0xd8f0c0, line: 0x4f8f3a, cup: 0x3fae3a };

/** A rough lump with nothing inside, `r` in radius. */
function raggedArt(r: number, c: { fill: number; line: number }, seed: number): Graphics {
  const g = new Graphics();
  const rng = new Rng(seed);
  const pts: Pt[] = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const k = r * rng.range(0.7, 1.05);
    return { x: Math.cos(a) * k, y: Math.sin(a) * k * 0.85 };
  });
  poly(g, pts);
  return g.fill(c.fill).stroke(line(c.line, Math.max(2, r * 0.1)));
}

/** A bubble: a thick dark edge, and nothing but light in the middle. */
function bubbleArt(r: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r)
    .fill({ color: 0xf6fcff, alpha: 0.9 })
    .stroke({ width: Math.max(4, r * 0.22), color: 0x3d5566 });
  g.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.12).fill({ color: 0xffffff, alpha: 0.9 });
  return g;
}

/** A small round green ball: an edge all round and a green cup inside it. */
function greenBallArt(r: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r)
    .fill(BALL.fill)
    .stroke(line(BALL.line, Math.max(3, r * 0.08)));
  g.moveTo(-r * 0.7, -r * 0.1)
    .arc(0, -r * 0.1, r * 0.7, Math.PI, 0, true)
    .lineTo(r * 0.45, -r * 0.1)
    .arc(0, -r * 0.1, r * 0.45, 0, Math.PI)
    .closePath()
    .fill(BALL.cup);
  g.circle(-r * 0.15, -r * 0.35, r * 0.12).fill(0x9db86a);
  return g;
}

/** A speck too small to tell anything from: a dot of its colour. */
function dotArt(r: number, color: number): Graphics {
  return new Graphics().circle(0, 0, r).fill(color);
}

const SPECK_COLOR: Record<string, number> = {
  swimmer: 0xc9d9a0,
  'green-ball': BALL.cup,
  'mud-speck': MUD.fill,
  silt: SILT.fill,
  bubble: 0x9fb3c0,
};

/** A level-5 or level-6 candidate as it looks at a stop, in art units, centred. Nothing separate shows at stop 1. */
export function candidateArt(
  id: 'swimmer' | 'green-ball' | 'mud-speck' | 'silt' | 'bubble',
  stop: Stop,
  shape: SwimmerShape,
  k = 1,
): Container {
  const z = stop === 4 ? 1.7 : 1;
  if (stop <= 2) return dotArt(stop === 1 ? 2 : 5, SPECK_COLOR[id]);
  if (id === 'swimmer') return swimmerArt(shape, 130 * z * k, stop === 4);
  if (id === 'green-ball') return stop === 3 ? dotArt(6, BALL.cup) : greenBallArt(44 * k);
  if (id === 'silt') return stop === 3 ? dotArt(6, SILT.fill) : raggedArt(30 * k, SILT, 23);
  if (id === 'mud-speck') return raggedArt(24 * z * k, MUD, 19);
  return bubbleArt(26 * z * k);
}

/** About how far a candidate reaches from its centre at a stop, in art units (for the ring round it). */
export function candidateReach(
  id: 'swimmer' | 'green-ball' | 'mud-speck' | 'silt' | 'bubble',
  stop: Stop,
): number {
  const z = stop === 4 ? 1.7 : 1;
  if (stop <= 2) return 6;
  if (id === 'swimmer') return 65 * z * (stop === 4 ? 1.07 : 1);
  if (id === 'green-ball') return stop === 3 ? 6 : 44;
  if (id === 'silt') return stop === 3 ? 6 : 30;
  return (id === 'mud-speck' ? 24 : 26) * z;
}

/** The water behind levels 5–6's drops: the whole drop (1), the drop with faint specks (2), clear water (3–4). */
export function waterLayer(stop: Stop): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(stop >= 3 ? WATER : SLIDE));
  if (stop === 1) c.addChild(dropArt(120, false));
  else if (stop === 2) c.addChild(dropArt(370, false));
  else {
    const g = new Graphics();
    const rng = new Rng(stop * 31);
    for (let i = 0; i < 10; i++)
      g.circle(rng.range(-1, 1) * ART_R, rng.range(-1, 1) * ART_R, rng.range(2, 4)).fill({
        color: 0xa8c8d6,
        alpha: 0.6,
      });
    c.addChild(g);
  }
  return c;
}

/** Long clear boxes side by side (onion skin), `box` long; `dots` adds a faint dot in each. */
function onionArt(box: number, dots: boolean): Graphics {
  const g = new Graphics();
  const h = box * 0.32;
  const span = ART_R * 1.3;
  g.rect(-span, -span, span * 2, span * 2).fill(0xf7f1e4);
  for (let row = -Math.ceil(span / h); row <= Math.ceil(span / h); row++) {
    const off = (((row % 3) + 3) % 3) * box * 0.33;
    for (let col = -Math.ceil(span / box) - 1; col <= Math.ceil(span / box); col++) {
      const x = col * box + off;
      const y = row * h;
      g.roundRect(x + 2, y + 2, box - 4, h - 4, h * 0.2)
        .fill(0xfffbf2)
        .stroke(line(0xb9a27a, Math.max(2, box * 0.025)));
      if (dots) g.circle(x + box * 0.5, y + h * 0.5, h * 0.12).fill({ color: 0xc9b48c, alpha: 0.8 });
    }
  }
  return g;
}

/** A green thread of boxes end to end, each with a green spiral, `box` long, across the view. */
function threadArt(box: number, rows: number[]): Graphics {
  const g = new Graphics();
  const h = box * 0.45;
  for (const y0 of rows) {
    for (let x = -ART_R * 1.4; x < ART_R * 1.4; x += box) {
      g.roundRect(x, y0 - h / 2, box, h, h * 0.2)
        .fill(0xe3f5d2)
        .stroke(line(LEAF.line, Math.max(3, box * 0.04)));
      g.moveTo(x + box * 0.08, y0);
      for (let t = 0; t <= 1.0001; t += 0.05)
        g.lineTo(x + box * (0.08 + 0.84 * t), y0 + Math.sin(t * Math.PI * 4) * h * 0.32);
      g.stroke(line(0x3fae3a, Math.max(3, box * 0.06)));
    }
  }
  return g;
}

/** A green wisp (stop 1) or a green thread (stop 2), seen whole. */
function wispArt(len: number, width: number): Graphics {
  const g = new Graphics();
  g.moveTo(-len / 2, 0);
  for (let t = 0; t <= 1.0001; t += 0.1) g.lineTo(-len / 2 + len * t, Math.sin(t * Math.PI * 2) * len * 0.06);
  return g.stroke(line(0x4fa63f, width));
}

/** A thin clear piece of onion skin, seen whole. */
function skinPieceArt(d: number): Graphics {
  const g = new Graphics();
  const pts = leafOutline('round', d).map((p) => ({ x: p.y * 0.9, y: p.x * 0.7 }));
  poly(g, pts);
  return g.fill({ color: 0xfffbf2, alpha: 0.9 }).stroke(line(0xd8c8a6, Math.max(2, d * 0.02)));
}

/** One stop's view of a level-6 slide. */
export function sortLayer(
  id: 'leaf' | 'onion-skin' | 'green-thread' | 'swimmer' | 'green-ball' | 'sand' | 'bubble' | 'mud-speck',
  stop: Stop,
  looks: Looks,
  shape: SwimmerShape,
): Container {
  if (id === 'leaf' || id === 'sand') return viewLayer(id, stop, looks);
  const c = new Container();
  if (id === 'onion-skin') {
    c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(SLIDE));
    if (stop <= 2) c.addChild(skinPieceArt(stop === 1 ? 140 : 370));
    else c.addChild(onionArt(stop === 3 ? 120 : 230, stop === 4));
    return c;
  }
  if (id === 'green-thread') {
    c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(stop >= 3 ? WATER : SLIDE));
    if (stop === 1) c.addChild(wispArt(130, 3));
    else if (stop === 2) c.addChild(wispArt(380, 8));
    else c.addChild(threadArt(stop === 3 ? 90 : 170, stop === 3 ? [-60, 70] : [0]));
    return c;
  }
  c.addChild(waterLayer(stop));
  if (stop >= 2) {
    const a = candidateArt(id, stop, shape, stop >= 3 ? 1.6 : 1);
    a.rotation = id === 'swimmer' ? -0.3 : 0;
    c.addChild(a);
  }
  return c;
}

/** Level 5's answers: a sprouting seed (alive), a pebble (not alive), a lens with a curl (can't tell yet). */
export function answerIcon(kind: 'alive' | 'not-alive' | 'cant-tell'): Graphics {
  if (kind === 'not-alive') return pebbleArt();
  const g = new Graphics();
  if (kind === 'alive') {
    g.ellipse(0, 18, 22, 15).fill(0xb98a5a).stroke(line(0x7a5a38, 4));
    g.moveTo(0, 8).quadraticCurveTo(-4, -10, 2, -24).stroke(line(swatch.green.line, 6));
    g.ellipse(-14, -22, 14, 7).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
    g.ellipse(16, -28, 14, 7).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  } else {
    g.moveTo(14, 14).lineTo(32, 32).stroke(line(wood.line, 11));
    g.circle(-4, -4, 24).fill(0xd6eefa).stroke(line(0x5c6f82, 7));
    // A question curl, drawn and not lettered.
    g.moveTo(-12, -12)
      .quadraticCurveTo(-10, -22, -2, -22)
      .quadraticCurveTo(8, -20, 6, -10)
      .quadraticCurveTo(2, -4, -4, 0)
      .lineTo(-4, 4)
      .stroke(line(swatch.purple.line, 5));
    g.circle(-4, 12, 3.5).fill(swatch.purple.line);
  }
  return g;
}

function pebbleArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-32, 10)
    .quadraticCurveTo(-30, -20, 0, -22)
    .quadraticCurveTo(30, -22, 34, 6)
    .quadraticCurveTo(30, 26, 0, 26)
    .quadraticCurveTo(-30, 26, -32, 10)
    .fill(0xb7b2a8)
    .stroke(line(0x7d776d, 5));
  g.ellipse(-10, -8, 8, 4).fill({ color: 0xffffff, alpha: 0.5 });
  return g;
}

/** Level 6's trays: one round outline with a dot (one cell), a block of boxes (many cells), a pebble (not cells). */
export function trayIcon(kind: 'one' | 'many' | 'not'): Graphics {
  if (kind === 'not') return pebbleArt();
  const g = new Graphics();
  if (kind === 'one') {
    g.circle(0, 0, 30).fill(0xe7f3c8).stroke(line(0x7f9b4c, 5));
    g.circle(4, 2, 9).fill(0x9db86a);
  } else if (kind === 'many') {
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 3; k++)
        g.rect(-33 + k * 22, -27 + r * 18, 22, 18)
          .fill(0xc9eeb0)
          .stroke(line(LEAF.line, 3));
  }
  return g;
}

/** A small slide resting in a tray: a glass rectangle with a dab of the sample's colour. */
export function miniSlide(id: string): Graphics {
  const col: Record<string, number> = {
    leaf: LEAF.fill,
    'onion-skin': 0xe8dcc2,
    'green-thread': 0x4fa63f,
    swimmer: 0xc9d9a0,
    'green-ball': BALL.cup,
    sand: 0xe0b95a,
    bubble: 0x9fb3c0,
    'mud-speck': MUD.fill,
  };
  return new Graphics()
    .roundRect(-16, -6, 32, 12, 3)
    .fill(0xeaf6fb)
    .stroke(line(0x9ab3c2, 2))
    .circle(0, 0, 4)
    .fill(col[id] ?? 0x999999);
}

/** The companion's ring round the speck it asks about: a soft dashed circle, `r` in screen units. */
export function ringArt(r: number): Graphics {
  return drawRing(new Graphics(), r);
}

/** Redraws a ring at a new size. */
export function drawRing(g: Graphics, r: number): Graphics {
  g.clear();
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r).arc(0, 0, r, a, a + (Math.PI * 2) / n / 1.8);
  }
  return g.stroke({ width: 7, color: 0xffd23f, cap: 'round' });
}

// ----- levels 7–8 -----

const CHEEK = { fill: 0xf4ddd3, line: 0xa08878, dot: 0xa9877a };
const GREEN_DROP = 0x7fcf6a;
const PALE_GREEN = 0xc6e9b2;

/** Rotates a layer's drawn walls (its second child) by the seeded angle, so the bricks are not always level. */
function tilt(c: Container, angle: number): Container {
  const walls = c.children[1];
  if (walls) walls.rotation = angle;
  return c;
}

/** A flat, rounded, uneven cell with a thin soft edge and a dot inside, `r` across its middle. */
function softCellArt(g: Graphics, x: number, y: number, r: number, rng: Rng) {
  const n = 18;
  const a0 = rng.range(0, Math.PI * 2);
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (0.8 + 0.2 * Math.sin(a * 2 + a0) + rng.range(-0.06, 0.06));
    return { x: x + Math.cos(a) * k, y: y + Math.sin(a) * k * 0.85 };
  });
  poly(g, pts);
  g.fill({ color: CHEEK.fill, alpha: 0.85 }).stroke(line(CHEEK.line, Math.max(3, r * 0.05)));
  g.circle(x + rng.range(-0.15, 0.15) * r, y + rng.range(-0.15, 0.15) * r, r * 0.13).fill(CHEEK.dot);
}

/** The cheek-cell slide at stops 3–4: soft cells, each lying on its own or overlapping a little, `r` across. */
function cheekCellsArt(r: number, seed: number): Graphics {
  const g = new Graphics();
  const rng = new Rng(seed);
  const n = r < 60 ? 9 : 4;
  const spots: Pt[] = [];
  for (let tries = 0; spots.length < n && tries < 400; tries++) {
    const p = { x: rng.range(-1.05, 1.05) * ART_R, y: rng.range(-1.05, 1.05) * ART_R };
    // Mostly apart, an overlap now and then.
    if (spots.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > r * 1.5)) spots.push(p);
  }
  for (const p of spots) softCellArt(g, p.x, p.y, r, rng);
  return g;
}

/** A faint pale smear on the slide (stops 1–2), `d` across; `specks` adds a few. */
function smearArt(d: number, specks: boolean, seed: number): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, d / 2, d * 0.32)
    .fill({ color: CHEEK.fill, alpha: 0.9 })
    .stroke(line(0xc9b3a6, Math.max(3, d * 0.01)));
  if (specks) {
    const rng = new Rng(seed);
    for (let i = 0; i < 6; i++)
      g.circle(rng.range(-0.35, 0.35) * d, rng.range(-0.2, 0.2) * d, d * 0.012).fill(CHEEK.dot);
  }
  return g;
}

/** One stop's view of a level-7 slide. Nothing at stops 1–2 shows the walls. */
export function wallLayer(
  id: 'onion-skin' | 'leaf' | 'cheek-cells',
  stop: Stop,
  looks: Looks,
  angle: number,
  seed: number,
): Container {
  if (id === 'onion-skin')
    return stop >= 3
      ? tilt(sortLayer('onion-skin', stop, looks, 'round'), angle)
      : sortLayer('onion-skin', stop, looks, 'round');
  if (id === 'leaf')
    return stop >= 3 ? tilt(viewLayer('leaf', stop, looks), angle) : viewLayer('leaf', stop, looks);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(SLIDE));
  if (stop <= 2) c.addChild(smearArt(stop === 1 ? 120 : 360, stop === 2, seed));
  else c.addChild(cheekCellsArt(stop === 3 ? 42 : 80, seed));
  return c;
}

/** An even green drop, `d` across (all three level-8 drops at stops 1–2, except the threads' wisps at 2). */
function greenDropArt(d: number, pale: boolean): Graphics {
  const g = new Graphics();
  g.circle(0, 0, d / 2)
    .fill({ color: pale ? PALE_GREEN : GREEN_DROP, alpha: 0.95 })
    .stroke(line(0x5aa94c, Math.max(3, d * 0.02)));
  g.ellipse(-d * 0.18, -d * 0.2, d * 0.12, d * 0.06).fill({ color: 0xffffff, alpha: 0.6 });
  return g;
}

/**
 * One stop's view of a level-8 drop, and the part that drifts with the water (the threads or the balls), or null. Positions are
 * seeded; the coloured water has nothing in it at any stop.
 */
export function greenLayer(
  id: 'green-threads' | 'green-balls' | 'green-water',
  stop: Stop,
  seed: number,
): { layer: Container; drift: Container | null } {
  const c = new Container();
  const rng = new Rng(seed + stop * 101);
  if (stop === 1) {
    c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(SLIDE), greenDropArt(120, false));
    return { layer: c, drift: null };
  }
  if (stop === 2) {
    c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(SLIDE), greenDropArt(370, id === 'green-threads'));
    if (id === 'green-threads') {
      for (let i = 0; i < 4; i++) {
        const w = wispArt(rng.range(150, 230), 4);
        w.position.set(rng.range(-80, 80), -105 + i * 70);
        w.rotation = rng.range(-0.4, 0.4);
        c.addChild(w);
      }
    }
    return { layer: c, drift: null };
  }
  if (id === 'green-water') {
    // An even pale green right across the view, with no edges anywhere.
    c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(PALE_GREEN));
    return { layer: c, drift: null };
  }
  c.addChild(new Graphics().circle(0, 0, ART_R + 4).fill(WATER));
  const drift = new Container();
  if (id === 'green-threads') {
    const t = threadArt(
      stop === 3 ? 90 : 170,
      stop === 3 ? [rng.range(-90, -40), rng.range(50, 100)] : [rng.range(-30, 30)],
    );
    t.rotation = rng.range(-0.35, 0.35);
    drift.addChild(t);
  } else {
    const g = new Graphics();
    const n = stop === 3 ? 22 : 5;
    const spots: Pt[] = [];
    for (let tries = 0; spots.length < n && tries < 400; tries++) {
      const p = { x: rng.range(-1.1, 1.1) * ART_R, y: rng.range(-1.1, 1.1) * ART_R };
      if (spots.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > (stop === 3 ? 30 : 110))) spots.push(p);
    }
    drift.addChild(g);
    for (const p of spots) {
      if (stop === 3) g.circle(p.x, p.y, 5).fill(BALL.cup);
      else {
        const b = greenBallArt(40);
        b.position.set(p.x, p.y);
        drift.addChild(b);
      }
    }
  }
  c.addChild(drift);
  return { layer: c, drift };
}

/** Level 7's plant cells: a leaf over a small brick grid. */
export function plantIcon(): Graphics {
  const g = new Graphics();
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 3; k++)
      g.rect(-36 + k * 24 + (r % 2) * 6, -4 + r * 14, 22, 14)
        .fill(0xc9eeb0)
        .stroke(line(LEAF.line, 3));
  g.moveTo(0, -40)
    .quadraticCurveTo(26, -26, 0, 2)
    .quadraticCurveTo(-26, -26, 0, -40)
    .fill(LEAF.fill)
    .stroke(line(LEAF.line, 4));
  g.moveTo(0, -34).lineTo(0, -2).stroke(line(LEAF.vein, 3));
  return g;
}

/** Level 8's tiny green living things: three small green balls, a dot in each. */
export function livingIcon(): Graphics {
  const g = new Graphics();
  for (const [x, y] of [
    [-20, 12],
    [20, 12],
    [0, -20],
  ]) {
    g.circle(x, y, 17).fill(BALL.fill).stroke(line(BALL.line, 4));
    g.circle(x + 3, y + 2, 6).fill(BALL.cup);
  }
  return g;
}

/** Level 8's green all through the water: a cup filled evenly green. */
export function throughIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(-30, -26)
    .lineTo(-22, 32)
    .lineTo(22, 32)
    .lineTo(30, -26)
    .closePath()
    .fill(0xeaf6fb)
    .stroke(line(0x7d97a8, 4));
  g.moveTo(-28, -14).lineTo(-22, 28).lineTo(22, 28).lineTo(28, -14).closePath().fill(GREEN_DROP);
  g.moveTo(-30, -26).lineTo(-22, 32).lineTo(22, 32).lineTo(30, -26).stroke(line(0x7d97a8, 4));
  return g;
}
