/**
 * Water Road's layout, pure so every level is tested on every view (./logic.test.ts and ./water.test.ts sideways,
 * ./upright.test.ts for a phone held upright). Levels 1–3: the frame or frames with the pile, the tray and the slots;
 * levels 4–5: the road with its cards or arrows, the valley with its tray. Every input is at least 100 units, clear of
 * Home, the guide and each other; a layout is null rather than shrinking a target. Held upright, the scene sits lower
 * on the tall screen, so the handle, the pile and the buttons are in a thumb's reach. Rules: ./logic.ts.
 */
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { downhillKind, MAX_STEP, planFor, type End } from './logic';

export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export const MIN_TARGET = 100;
export const HANDLE = { w: 140, h: 110 };
export const BLOCK = 120;
export const SLOT = 140;
export const PAIR_FRAME = { w: 300, h: 260 };

/** The ring's shape on a frame: mid radius, stone thickness, and the height of the posts and walls under the springers. */
export interface Ring {
  r: number;
  t: number;
  post: number;
}

export const RINGS: Record<1 | 2 | 3, Ring> = {
  1: { r: 235, t: 90, post: 90 },
  2: { r: 100, t: 60, post: 60 },
  3: { r: 185, t: 80, post: 80 },
};

export interface Frame {
  /** The springing line's centre: the ring is drawn around this point. */
  centre: Pt;
  /** The frame's tap box. */
  box: Rect;
  /** The ground this frame stands on: its own step when the pair is stacked. */
  ground: number;
}

export interface WrLayout {
  ring: Ring;
  frames: Frame[];
  /** The ground line (the upper step when level 2's frames are stacked; each frame carries its own). */
  ground: number;
  handles: Rect[];
  /** Level 1's pile spots (not targets: the stage is). */
  pile: Pt[];
  tray: Rect | null;
  slots: { left: Rect; right: Rect } | null;
  /** Level 2's frames stacked one above the other at a narrow stage. */
  stacked: boolean;
}

export function corners(v: View): Rect[] {
  return [
    { x: 0, y: 0, ...HOME_CORNER },
    { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER },
  ];
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function centre(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function around(p: Pt, w: number, h = w): Rect {
  return { x: p.x - w / 2, y: p.y - h / 2, w, h };
}

/** Held upright, the room kept under the scene for the guide and a thumb's rest. */
export const UPRIGHT_FOOT = 200;

/**
 * Where a scene's anchor line sits: `sideways` of the height on the usual area; held upright it is lower, at `upright`
 * of the height, or higher where a short screen needs the `below` units under the line to stay clear of the guide.
 */
export function anchorLine(v: View, sideways: number, upright: number, below: number): number {
  return v.upright ? Math.min(v.h * upright, v.h - UPRIGHT_FOOT - below) : v.h * sideways;
}

export const outer = (ring: Ring) => ring.r + ring.t / 2;
export const inner = (ring: Ring) => ring.r - ring.t / 2;

/**
 * The frame or frames across the upper half, the pile or tray below; every input at least 100 units and clear of the
 * corners and each other. Null when the view cannot hold the level without shrinking a target.
 */
export function waterRoadLayout(level: number, v: View, stones = 7): WrLayout | null {
  const l = Math.min(3, planFor(level).level) as 1 | 2 | 3;
  const ring = RINGS[l];
  const cx = v.w / 2;
  const top = 40;
  // The springing line sits in the upper half: below the top margin, and lower on a tall view; held upright, lower
  // still, with what lies `below` it (the pile, the second frame, the tray) kept above the guide.
  const spring = (extra: number, below: number) =>
    Math.max(top + outer(ring) + extra, anchorLine(v, 0.4, 0.55, below));
  let out: WrLayout;
  if (l === 1) {
    const springY = spring(0, ring.post + 300);
    const ground = springY + ring.post;
    const w = 2 * outer(ring) + 60;
    const h = outer(ring) + ring.post + 20;
    const perRow = 4;
    const pile: Pt[] = [];
    for (let i = 0; i < stones; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, stones - row * perRow);
      const col = i % perRow;
      pile.push({ x: cx + 60 + (col - (inRow - 1) / 2) * 125, y: ground + 150 + row * 105 });
    }
    out = {
      ring,
      ground,
      stacked: false,
      frames: [
        {
          centre: { x: cx, y: springY },
          box: { x: cx - w / 2, y: springY - outer(ring) - 10, w, h },
          ground,
        },
      ],
      handles: [around({ x: cx, y: springY - 40 }, HANDLE.w, HANDLE.h)],
      pile,
      tray: null,
      slots: null,
    };
  } else if (l === 2) {
    const gapX = 80;
    const stacked = v.w < 2 * PAIR_FRAME.w + gapX + 2 * HOME_CORNER.w;
    const springY = spring(30, stacked ? PAIR_FRAME.h + 40 + ring.post + 40 : ring.post + 40);
    const frameAt = (c: Pt): Frame => ({
      centre: c,
      ground: c.y + ring.post,
      box: { x: c.x - PAIR_FRAME.w / 2, y: c.y - outer(ring) - 40, w: PAIR_FRAME.w, h: PAIR_FRAME.h },
    });
    const centres = stacked
      ? [
          { x: cx, y: springY },
          { x: cx, y: springY + PAIR_FRAME.h + 40 },
        ]
      : [
          { x: cx - PAIR_FRAME.w / 2 - gapX / 2, y: springY },
          { x: cx + PAIR_FRAME.w / 2 + gapX / 2, y: springY },
        ];
    out = {
      ring,
      ground: springY + ring.post,
      stacked,
      frames: centres.map(frameAt),
      handles: [],
      pile: [],
      tray: null,
      slots: null,
    };
  } else {
    const springY = spring(0, ring.post + 200 + BLOCK / 2);
    const ground = springY + ring.post;
    const w = 2 * outer(ring) + 40;
    const h = outer(ring) + ring.post + 40;
    out = {
      ring,
      ground,
      stacked: false,
      frames: [
        {
          centre: { x: cx, y: springY },
          box: { x: cx - w / 2, y: springY - outer(ring) - 20, w, h },
          ground,
        },
      ],
      handles: [around({ x: cx, y: springY - 30 }, HANDLE.w, HANDLE.h)],
      pile: [],
      tray: around({ x: cx, y: ground + 200 }, BLOCK, BLOCK),
      slots: {
        left: around({ x: cx - outer(ring) - 75, y: ground - 60 }, SLOT, SLOT),
        right: around({ x: cx + outer(ring) + 75, y: ground - 60 }, SLOT, SLOT),
      },
    };
  }
  const inputs = [
    ...out.handles,
    ...(l === 2 ? out.frames.map((f) => f.box) : []),
    ...(out.tray ? [out.tray] : []),
    ...(out.slots ? [out.slots.left, out.slots.right] : []),
  ];
  for (const r of inputs) {
    if (r.w < MIN_TARGET || r.h < MIN_TARGET) return null;
    if (r.x < 0 || r.y < 0 || r.x + r.w > v.w || r.y + r.h > v.h) return null;
    if (corners(v).some((c) => overlaps(r, c))) return null;
  }
  for (let i = 0; i < inputs.length; i++)
    for (let j = i + 1; j < inputs.length; j++) if (overlaps(inputs[i], inputs[j])) return null;
  for (const f of out.frames)
    if (f.box.x < 0 || f.box.y < 0 || f.box.x + f.box.w > v.w || f.box.y + f.box.h > v.h) return null;
  return out;
}

/** A stone's angles on the ring: the left springer starts at π and the ring runs over the top to 2π. */
export function stoneAngles(count: number, index: number): { a0: number; a1: number; mid: number } {
  const a0 = Math.PI + (index * Math.PI) / count;
  const a1 = Math.PI + ((index + 1) * Math.PI) / count;
  return { a0, a1, mid: (a0 + a1) / 2 };
}

/** Where a stone's centre sits on a ring around `c`. */
export function stoneCentre(c: Pt, ring: Ring, count: number, index: number): Pt {
  const { mid } = stoneAngles(count, index);
  return { x: c.x + ring.r * Math.cos(mid), y: c.y + ring.r * Math.sin(mid) };
}

export const STEP = 36;
export const OPEN = { w: 160, h: 110 };
export const CARD = { w: 300, h: 200 };
export const ARROW = { w: 110, h: 100 };
export const SPAN = { w: 130, h: 120 };
export const END_SLOT = { w: 100, h: 130 };
export const TRAY_ARCH = { w: 130, h: 110 };
export const TRAY_ABUT = { w: 100, h: 120 };

export interface WaterLayout {
  /** The town's ground (height 0) at level 4; the valley floor at level 5. */
  ground: number;
  /** Level 4: x of the spring, each pier and the fountain. */
  xs: number[];
  cards: Rect[];
  /** Pre-K cards stacked one above the other at a narrow stage. */
  stacked: boolean;
  arrows: { up: Rect; down: Rect }[];
  open: Rect;
  /** Level 5: the channel's line over the arches (their tops). */
  deck: number;
  spans: Rect[];
  ends: Record<End, Rect> | null;
  trayArches: Rect[];
  trayAbutments: Rect[];
}

/** The y of a height on the level-4 road. */
export const heightY = (l: WaterLayout, h: number) => l.ground - h * STEP;

/**
 * Level 4's hill, road and town across the upper half with the cards or the arrows below; level 5's valley across the
 * upper half with the tray below. Every input at least 100 units, clear of the corners and of each other; null rather
 * than shrinking a target.
 */
export function waterLayout(level: number, band: Band, v: View, spans = 4): WaterLayout | null {
  const cx = v.w / 2;
  const base: WaterLayout = {
    ground: 0,
    xs: [],
    cards: [],
    stacked: false,
    arrows: [],
    open: { x: 0, y: 0, ...OPEN },
    deck: 0,
    spans: [],
    ends: null,
    trayArches: [],
    trayAbutments: [],
  };
  let out: WaterLayout;
  if (planFor(level).level === 4) {
    if (v.w - 168 < 600) return null;
    const len = Math.max(600, Math.min(900, v.w - 300));
    const x0 = cx - len / 2;
    // Under the ground: the cards (or the two rows of arrows) and Open.
    const under = (downhillKind(band) === 'cards' ? 30 + CARD.h : 235) + 20 + OPEN.h;
    const ground = Math.max(60 + MAX_STEP * STEP + 40, anchorLine(v, 0.45, 0.55, under));
    const xs = [0, 1, 2, 3].map((i) => x0 + (i * len) / 3);
    let bottom = ground;
    out = { ...base, ground, xs };
    if (downhillKind(band) === 'cards') {
      const gap = 40;
      const stacked = v.w < 2 * CARD.w + gap + 80;
      out.stacked = stacked;
      out.cards = stacked
        ? [0, 1].map((i) => ({ x: cx - CARD.w / 2, y: ground + 30 + i * (CARD.h + 30), ...CARD }))
        : [0, 1].map((i) => ({ x: cx + (i === 0 ? -CARD.w - gap / 2 : gap / 2), y: ground + 30, ...CARD }));
      bottom = Math.max(...out.cards.map((c) => c.y + c.h));
    } else {
      out.arrows = xs.slice(1, 3).map((x) => ({
        up: around({ x, y: ground + 75 }, ARROW.w, ARROW.h),
        down: around({ x, y: ground + 185 }, ARROW.w, ARROW.h),
      }));
      bottom = ground + 235;
    }
    out.open = around(
      { x: Math.max(x0 + 40, PET_CORNER.w + OPEN.w / 2 + 20), y: bottom + 20 + OPEN.h / 2 },
      OPEN.w,
      OPEN.h,
    );
  } else {
    const width = 2 * END_SLOT.w + spans * SPAN.w;
    const x0 = cx - width / 2;
    // Under the deck: the arches' height, the valley floor, the tray's row of arches and its row of blocks.
    const under = SPAN.h + 80 + 30 + TRAY_ARCH.h + 20 + TRAY_ABUT.h;
    const deck = Math.max(HOME_CORNER.h + 10, anchorLine(v, 0.3, 0.45, under));
    const ground = deck + SPAN.h + 80;
    const spanRects = Array.from({ length: spans }, (_, i) => ({
      x: x0 + END_SLOT.w + i * SPAN.w,
      y: deck,
      ...SPAN,
    }));
    const ends = {
      near: { x: x0, y: deck - 5, ...END_SLOT },
      far: { x: x0 + END_SLOT.w + spans * SPAN.w, y: deck - 5, ...END_SLOT },
    };
    const trayW = spans * TRAY_ARCH.w + (spans - 1) * 20;
    const trayArches = Array.from({ length: spans }, (_, i) => ({
      x: cx - trayW / 2 + i * (TRAY_ARCH.w + 20),
      y: ground + 30,
      ...TRAY_ARCH,
    }));
    const row2 = ground + 30 + TRAY_ARCH.h + 20;
    const row2W = 2 * TRAY_ABUT.w + 20 + 40 + OPEN.w;
    const r0 = cx - row2W / 2;
    const trayAbutments = [0, 1].map((i) => ({ x: r0 + i * (TRAY_ABUT.w + 20), y: row2, ...TRAY_ABUT }));
    const open = { x: r0 + 2 * TRAY_ABUT.w + 20 + 40, y: row2 + 5, ...OPEN };
    out = { ...base, ground, deck, spans: spanRects, ends, trayArches, trayAbutments, open };
  }
  const inputs = [
    ...out.cards,
    ...out.arrows.flatMap((a) => [a.up, a.down]),
    out.open,
    ...out.spans,
    ...(out.ends ? [out.ends.near, out.ends.far] : []),
    ...out.trayArches,
    ...out.trayAbutments,
  ];
  for (const r of inputs) {
    if (r.w < MIN_TARGET || r.h < MIN_TARGET) return null;
    if (r.x < 0 || r.y < 0 || r.x + r.w > v.w || r.y + r.h > v.h) return null;
    if (corners(v).some((c) => overlaps(r, c))) return null;
  }
  for (let i = 0; i < inputs.length; i++)
    for (let j = i + 1; j < inputs.length; j++) if (overlaps(inputs[i], inputs[j])) return null;
  return out;
}
