import {
  Circle,
  Container,
  Ellipse,
  Graphics,
  GraphicsContext,
  Polygon,
  Rectangle,
  RoundedRectangle,
  Texture,
  Triangle,
  type FillInstruction,
  type GraphicsInstructions,
  type Matrix,
  type ShapePrimitive,
  type StrokeInstruction,
} from 'pixi.js';
import { crayon, ellipsePoints, fibrePattern, papered, roundRectPoints, U, wobble } from './paper';

/**
 * The paper pass (docs/ART-STYLE.md): turns the flat shapes every game already draws into paper cut-outs, so 200-odd
 * games take the new look through one piece of shared code instead of each being redrawn by hand.
 *
 * Once per frame, before drawing, it walks the scene for `Graphics` it has not seen and rewrites each one's
 * instructions: every solid, opaque-enough filled shape gets a torn edge, a warm shadow, the paper fibre and the double
 * crayon outline in a darker shade of its own colour (a stroke that outlined the same path is replaced by it). It leaves
 * alone what should stay flat: see-through glows and shadows, tiny details (eyes, pips, dots), textured or gradient
 * fills, shapes with holes, open strokes, and full-screen rectangles (those get only the fibre).
 *
 * A drawing that is redrawn every frame (a glow, a trail, a meter) is noticed after a few redraws and left flat from
 * then on, so the pass never costs per-frame work. A game can keep any drawing flat with `keepFlat(g)`, or a whole
 * subtree with `keepFlat(container)`.
 */

/** Shapes smaller than this across (logical units) are details and stay flat. */
const DETAIL = 13;
/** Below this fill alpha a shape is a glow, shadow or highlight and stays flat. */
const SOLID = 0.65;
/** A rectangle at least this big is a backdrop: fibre only, no edge or outline. */
const BACKDROP_W = 700;
const BACKDROP_H = 560;
/** A drawing redrawn this many times within `WINDOW` passes is animating, and waits flat until it settles. */
const ANIMATED = 3;
const WINDOW = 30;

const flat = new WeakSet<Container>();
interface Seen {
  /** The passes in which the game redrew this context (the last few). */
  hits: number[];
  /** Set while the pass itself is writing, so its own update is not counted as a redraw. */
  writing: boolean;
  /** The context has flat drawing the pass has not turned into paper yet. */
  stale: boolean;
}
const seen = new WeakMap<GraphicsContext, Seen>();

/** Keeps a drawing (or every drawing under a container) flat, as the game drew it. */
export function keepFlat<T extends Container>(node: T): T {
  flat.add(node);
  return node;
}

type Pt = [number, number];

function apply(m: Matrix | undefined, pts: Pt[]): Pt[] {
  if (!m || m.isIdentity()) return pts;
  return pts.map(([x, y]) => [m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty]);
}

function dedupe(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last[0] - p[0]) > 0.01 || Math.abs(last[1] - p[1]) > 0.01) out.push(p);
  }
  if (out.length > 2) {
    const [a, z] = [out[0], out[out.length - 1]];
    if (Math.abs(a[0] - z[0]) < 0.01 && Math.abs(a[1] - z[1]) < 0.01) out.pop();
  }
  return out;
}

/** Re-spaces an outline so no two points are more than `step` apart, and none are crowded much closer than half that. */
function resample(pts: Pt[], step = 12 * U): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i],
      b = pts[(i + 1) % n];
    out.push(a);
    const k = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let j = 1; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}

/** The outline of a primitive as points, or null for one the pass does not know. */
function outline(shape: ShapePrimitive): { pts: Pt[]; backdrop: boolean; corner: boolean } | null {
  if (shape instanceof Circle)
    return {
      pts: ellipsePoints(shape.x, shape.y, shape.radius, shape.radius),
      backdrop: false,
      corner: false,
    };
  if (shape instanceof Ellipse)
    return {
      pts: ellipsePoints(shape.x, shape.y, shape.halfWidth, shape.halfHeight),
      backdrop: false,
      corner: false,
    };
  if (shape instanceof RoundedRectangle) {
    const backdrop = shape.width >= BACKDROP_W || shape.height >= BACKDROP_H;
    return {
      pts: roundRectPoints(shape.x, shape.y, shape.width, shape.height, shape.radius),
      backdrop,
      corner: shape.radius < 2,
    };
  }
  if (shape instanceof Rectangle) {
    const backdrop = shape.width >= BACKDROP_W || shape.height >= BACKDROP_H;
    return { pts: roundRectPoints(shape.x, shape.y, shape.width, shape.height, 0), backdrop, corner: true };
  }
  if (shape instanceof Triangle)
    return {
      pts: resample([
        [shape.x, shape.y],
        [shape.x2, shape.y2],
        [shape.x3, shape.y3],
      ]),
      backdrop: false,
      corner: true,
    };
  if (shape instanceof Polygon) {
    const raw: Pt[] = [];
    for (let i = 0; i + 1 < shape.points.length; i += 2) raw.push([shape.points[i], shape.points[i + 1]]);
    const pts = dedupe(raw);
    if (pts.length < 3) return null;
    return { pts: resample(pts), backdrop: false, corner: true };
  }
  return null;
}

function bounds(list: Pt[][]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const pts of list)
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function overlap(a: ReturnType<typeof bounds>, b: ReturnType<typeof bounds>) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

function hash(pts: Pt[]): number {
  let h = 2166136261;
  for (let i = 0; i < pts.length; i += Math.max(1, pts.length >> 3)) {
    h ^= Math.round(pts[i][0] * 10) * 31 + Math.round(pts[i][1] * 10);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Traces a closed soft outline (quadratic curves through the midpoints) into a context. */
function trace(c: GraphicsContext, pts: Pt[], dx = 0, dy = 0): GraphicsContext {
  const n = pts.length;
  const mx = (i: number) => (pts[i][0] + pts[(i + 1) % n][0]) / 2 + dx;
  const my = (i: number) => (pts[i][1] + pts[(i + 1) % n][1]) / 2 + dy;
  c.moveTo(mx(n - 1), my(n - 1));
  for (let i = 0; i < n; i++) c.quadraticCurveTo(pts[i][0] + dx, pts[i][1] + dy, mx(i), my(i));
  return c.closePath();
}

const SHADOW = 0x2d1e14;

function solidColor(style: FillInstruction['data']['style']): number | null {
  if (style.fill) return null; // a gradient or pattern
  if (style.texture && style.texture !== Texture.WHITE) return null;
  if (style.alpha < SOLID) return null;
  return style.color;
}

/**
 * Rewrites one context's instructions into paper. Returns true if anything changed. Exported for tests and for a
 * drawing made outside a scene (a texture baked at boot).
 */
export function paperizeContext(ctx: GraphicsContext): boolean {
  const old = ctx.instructions;
  if (!old.some((i) => i.action === 'fill' && !papered.has(i))) return false;
  const out: GraphicsInstructions[] = [];
  const scratch = new GraphicsContext();
  let changed = false;
  const tex = fibrePattern();
  const take = () => {
    for (const i of scratch.instructions) papered.add(i);
    out.push(...scratch.instructions);
    scratch.instructions.length = 0;
  };

  for (let k = 0; k < old.length; k++) {
    const ins = old[k];
    if (ins.action !== 'fill' || papered.has(ins)) {
      out.push(ins);
      continue;
    }
    const style = ins.data.style;
    const color = solidColor(style);
    const prims = color === null || ins.data.hole ? [] : ins.data.path.shapePath.shapePrimitives;
    const shapes = prims.map((p) => (p.holes?.length ? null : outline(p.shape)));
    if (!prims.length || shapes.some((s) => !s)) {
      out.push(ins);
      continue;
    }
    const pieces = shapes.map((s, i) => ({ ...s!, pts: apply(prims[i].transform, s!.pts) }));
    const all = bounds(pieces.map((p) => p.pts));
    // A stroke straight after the fill on the same path was its outline: the crayon line replaces it.
    const next = old[k + 1] as StrokeInstruction | undefined;
    const outlined = next?.action === 'stroke' && next.data.path === ins.data.path;
    if (Math.max(all.w, all.h) < DETAIL) {
      out.push(ins);
      continue;
    }
    changed = true;
    if (outlined) k++;
    const alpha = style.alpha;
    if (pieces.every((p) => p.backdrop)) {
      papered.add(ins);
      out.push(ins);
      if (tex) {
        for (const p of pieces) scratch.poly(p.pts.flat());
        scratch.fill({ fill: tex, alpha: 0.35 * alpha });
        take();
      }
      continue;
    }
    const big = Math.max(all.w, all.h);
    const small = big < 40;
    // A thin piece (a bar, a strip to measure) barely wobbles, so its length still reads true.
    const thin = Math.min(...pieces.map((p) => Math.min(bounds([p.pts]).w, bounds([p.pts]).h)));
    const amp = Math.min(2.2 * U, Math.max(0.4 * U, big * 0.028)) * Math.min(1, thin / 60);
    const wob = pieces.map((p) => wobble(p.pts, p.backdrop ? 0 : amp, hash(p.pts)));
    const line = crayon(color!);
    const lineW = (small ? 1.5 : 2.6) * U;
    // Pieces in one fill that overlap read as one lumpy shape (bushes, clouds): outline them from underneath, so no
    // inner lines show.
    const union =
      pieces.length > 1 &&
      pieces.some((p, i) => pieces.some((q, j) => j > i && overlap(bounds([p.pts]), bounds([q.pts]))));

    const [ox, oy] = small ? [0.5 * U, 1.2 * U] : [1 * U, 3 * U];
    // One shadow sheet, not two stacked: a whole layer less for a phone to paint under every piece.
    for (const pts of wob) trace(scratch, pts, ox, oy);
    scratch.fill({ color: SHADOW, alpha: 0.21 * alpha });
    if (union) {
      for (const pts of wob) trace(scratch, pts);
      scratch.stroke({ width: lineW * 2, color: line, alpha: 0.9 * alpha, join: 'round' });
    }
    for (const pts of wob) trace(scratch, pts);
    scratch.fill({ color: color!, alpha });
    if (tex) {
      for (const pts of wob) trace(scratch, pts);
      scratch.fill({ fill: tex, alpha: 0.28 * alpha });
    }
    if (!union) {
      for (const pts of wob) trace(scratch, pts);
      scratch.stroke({ width: lineW, color: line, alpha: 0.9 * alpha, join: 'round' });
      for (const pts of wob) trace(scratch, pts, 0.9 * U, -0.7 * U);
      scratch.stroke({ width: 1.2 * U, color: line, alpha: 0.45 * alpha, join: 'round' });
    }
    take();
  }
  scratch.destroy();
  if (!changed) return false;
  ctx.instructions = out;
  (ctx as unknown as { onUpdate(): void }).onUpdate();
  return true;
}

/** `?nopaper` in the address leaves every drawing flat and live, to compare the frame rate on a phone. */
export const PAPER_ON =
  typeof location === 'undefined' || !new URLSearchParams(location.search).has('nopaper');

/**
 * Turns a still drawing (and everything under it) into paper now and keeps it as one cached picture at the screen's
 * sharpness, so a phone paints a single layer for it each frame instead of every piece's shadow, fill, fibre and
 * outline. Call it again after redrawing (a resize); a node that changes every frame must not be baked.
 */
export function bakePaper(node: Container, view: { scale: number }) {
  if (!PAPER_ON || typeof window === 'undefined') return;
  const walk = (n: Container) => {
    if (flat.has(n)) return;
    if (n instanceof Graphics) paperizeContext(n.context);
    for (const k of n.children) walk(k as Container);
  };
  walk(node);
  const resolution = Math.min(window.devicePixelRatio || 1, 2) * view.scale;
  node.cacheAsTexture(false);
  node.cacheAsTexture({ resolution: Math.min(2, Math.max(0.5, resolution)), antialias: true });
}

/**
 * Still paper pieces are kept as one ready-made picture each (`cacheAsTexture`), so a phone paints a single layer for a
 * piece instead of its shadow, fill, fibre and two crayon lines (and a few thousand fewer triangles). A piece is baked
 * once it has held still for `STILL` passes, at the sharpness it is shown at; it goes back to live drawing while it is
 * redrawn often or grows or shrinks a lot (a pop, a zoom), and is baked again once it settles.
 */
const STILL_MS = 400;
const STILL_PASSES = 3;
/** At most this many pieces are baked (or re-baked) in one pass, so a new scene does not stall a phone's first frame. */
const BAKES_PER_PASS = 12;
/** A picture bigger than this many pixels is left live (a full-screen backdrop is one cheap layer anyway). */
const MAX_PIXELS = 1024 * 1024;
interface Baked {
  /** The pass in which the drawing last changed or moved in size, and the time then. */
  since: number;
  sinceMs: number;
  /** The world scale it was last seen at. */
  scale: number;
  /** The world scale it is baked at, or 0 while it is drawn live. */
  baked: number;
  /** The drawing and its version it was baked from. */
  ctx: GraphicsContext;
  version: number;
}
const bakes = new WeakMap<Graphics, Baked>();
const versions = new WeakMap<GraphicsContext, number>();
const hasPaper = (ctx: GraphicsContext) => ctx.instructions.some((i) => papered.has(i));

/** `?nobake` leaves every paper piece drawn live, to compare. */
const AUTO_BAKE = typeof location === 'undefined' || !new URLSearchParams(location.search).has('nobake');

function unbake(g: Graphics, b: Baked) {
  if (b.baked) g.cacheAsTexture(false);
  b.baked = 0;
}

/** Walks a subtree and turns every flat drawing it has not seen (or that was redrawn) into paper. */
export function paperPass(root: Container, resolution = 1) {
  pass++;
  const t0 = import.meta.env.DEV ? performance.now() : 0;
  let budget = BAKES_PER_PASS;
  const now = performance.now();
  const walk = (node: Container, inBaked: boolean) => {
    if (flat.has(node) || !node.visible) return;
    if (node instanceof Graphics) {
      const ctx = node.context;
      const s = track(ctx);
      const busy = s.hits.length >= ANIMATED && pass - s.hits[0] < WINDOW;
      if (s.stale && !busy) {
        s.stale = false;
        s.writing = true;
        try {
          if (paperizeContext(ctx) && import.meta.env.DEV) stats.rewrites++;
        } finally {
          s.writing = false;
        }
      }
      if (AUTO_BAKE) budget = bakeStill(node, s, busy, inBaked, resolution, budget, now);
    }
    const baked = inBaked || node.isCachedAsTexture;
    for (const child of node.children) walk(child as Container, baked);
  };
  walk(root, false);
  if (import.meta.env.DEV) {
    stats.passes++;
    stats.passMs += performance.now() - t0;
  }
}

function bakeStill(
  g: Graphics,
  s: Seen,
  busy: boolean,
  inBaked: boolean,
  resolution: number,
  budget: number,
  now: number,
) {
  const ctx = g.context;
  const version = versions.get(ctx) ?? 0;
  const m = g.worldTransform;
  const scale = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
  let b = bakes.get(g);
  if (!b) {
    // A drawing this pass did not bake (bakePaper's scenery, a game's own cache) is left as it is.
    if (g.isRenderGroup) return budget;
    b = { since: pass, sinceMs: now, scale, baked: 0, ctx, version };
    bakes.set(g, b);
  }
  const changed = b.ctx !== ctx || b.version !== version;
  b.ctx = ctx;
  b.version = version;
  // Measured from the size it had when it last settled, so a slow zoom counts as moving too.
  const resized = Math.abs(scale - b.scale) > b.scale * 0.03;
  if (changed || resized || busy || s.stale) {
    b.since = pass;
    b.sinceMs = now;
    b.scale = scale;
  }
  const still = pass - b.since >= STILL_PASSES && now - b.sinceMs >= STILL_MS;
  // Pieces with children, masks or filters, or under a baked parent, stay live: their picture could go stale unseen.
  const unfit =
    inBaked ||
    busy ||
    g.children.length > 0 ||
    !g.includeInBuild ||
    !g.measurable ||
    !g.renderable ||
    !!g.mask ||
    !!g.filters?.length ||
    scale < 0.01;
  if (b.baked) {
    const off = scale / b.baked;
    if (unfit || off > 1.15 || off < 0.6) {
      unbake(g, b);
      return budget;
    }
    if (changed) g.updateCacheTexture();
    // Settled at a size a little off the picture's: bake it again at the new sharpness.
    if (Math.abs(off - 1) <= 0.05 || !still || budget <= 0) return budget;
  } else if (unfit || !still || budget <= 0 || !hasPaper(ctx)) return budget;
  const box = g.getLocalBounds();
  const res = Math.min(4, Math.max(0.25, resolution * scale));
  if (box.width <= 0 || box.width * box.height * res * res > MAX_PIXELS) {
    unbake(g, b);
    return budget;
  }
  b.baked = scale;
  g.cacheAsTexture({ resolution: res, antialias: true });
  return budget - 1;
}

let pass = 0;

/** Dev only: how often and how long the pass rewrote drawings (`window.__paperStats`), to tune it for phones. */
const stats = { rewrites: 0, ms: 0, passMs: 0, passes: 0 };
if (import.meta.env.DEV && typeof window !== 'undefined')
  (window as unknown as { __paperStats: typeof stats }).__paperStats = stats;

function track(ctx: GraphicsContext): Seen {
  const known = seen.get(ctx);
  if (known) return known;
  const state: Seen = { hits: [], writing: false, stale: true };
  ctx.on('update', () => {
    versions.set(ctx, (versions.get(ctx) ?? 0) + 1);
    if (state.writing) return;
    // Every fill and stroke of one redraw fires an update; only the first of a pass counts.
    if (state.hits[state.hits.length - 1] !== pass) {
      state.hits.push(pass);
      if (state.hits.length > ANIMATED) state.hits.shift();
    }
    state.stale = true;
  });
  seen.set(ctx, state);
  return state;
}
