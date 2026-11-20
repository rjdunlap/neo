import { spread, type View } from '../../engine/view';

/**
 * Where Habitat Helpers puts things (chunk 31, docs/definitions/phone-portrait.md). Sideways everything sits where it always
 * has. Upright (the 768-wide area) the scene hangs up from the bottom edge: the loose cards rest in up to two rows above the
 * guide and the gate button, the garden's spaces stand above them, the visitors arrive over the garden and the goal sign
 * hangs above that, so a tall phone's spare height is sky. The rocky shore (levels 8–9) does the same: friends on the sand
 * in two rows, the places above, three places a little narrower so they fit 768.
 */
export interface Pt {
  x: number;
  y: number;
}

type V = Pick<View, 'w' | 'h' | 'upright'>;

/** Where the bottom-row controls (the gate and tide buttons) sit: bottom-right, both ways. */
export const gatePoint = (v: V): Pt => ({ x: v.w - 86, y: v.h - 92 });

/** The middle of the strip between the guide's corner and the gate button, which the bottom-row cards centre on upright. */
const stripX = (v: V) => (150 + (v.w - 144)) / 2;

export interface GardenFrame {
  gardenX: number;
  gardenY: number;
  goal: Pt;
  /** Where the visitors stand once they arrive, and where the stars burst. */
  visitorY: number;
  burstY: number;
  /** The little path from the garden to the gate: drawn sideways only. */
  path: boolean;
}

export function gardenFrame(v: V): GardenFrame {
  if (!v.upright)
    return {
      gardenX: v.w / 2 + 50,
      gardenY: v.h * 0.49,
      goal: { x: v.w / 2 + 50, y: 125 },
      visitorY: v.h * 0.61,
      burstY: v.h * 0.42,
      path: true,
    };
  const gardenY = v.h - 400;
  return {
    gardenX: v.w / 2,
    gardenY,
    goal: { x: v.w / 2, y: gardenY - 360 },
    visitorY: gardenY - 170,
    burstY: gardenY - 230,
    path: false,
  };
}

/** The garden's spaces across the garden's middle: every count sits 130 apart so the 124-unit touch areas never overlap (three were 120 apart before). */
export function plotXs(v: V, count: number): number[] {
  const { gardenX } = gardenFrame(v);
  const half = count > 3 ? 260 : 210;
  return spread(count, gardenX - half, gardenX + half, 130);
}

/**
 * The loose cards (112 units, 124-unit touch areas). Sideways one row between the pet and the gate; upright up to three in
 * the bottom row (beside the guide, short of the gate) and the rest in a row above, so six cards fit 768.
 */
export function trayPoints(v: V, n: number): Pt[] {
  if (!v.upright) return spread(n, 150, v.w - 165, 124).map((x) => ({ x, y: v.h - 90 }));
  return twoRows(v, n, v.h - 90, v.h - 235);
}

/** Up to three cards in the lower row and the rest above it, each row centred. */
function twoRows(v: V, n: number, lowY: number, highY: number): Pt[] {
  const lower = n <= 3 ? n : Math.min(3, Math.ceil(n / 2));
  const lowerXs = spread(lower, stripX(v) - 195, stripX(v) + 195, 130);
  const upperXs = spread(n - lower, v.w / 2 - 325, v.w / 2 + 325, 130);
  return [...lowerXs.map((x) => ({ x, y: lowY })), ...upperXs.map((x) => ({ x, y: highY }))];
}

/** The two visitor choices in a prediction round. */
export function choicePoints(v: V, n: number): Pt[] {
  const cx = v.upright ? stripX(v) : gardenFrame(v).gardenX;
  return spread(n, cx - 90 * n, cx + 90 * n, 180).map((x) => ({ x, y: v.h - 95 }));
}

/** Level 7's three need buttons (132-unit touch areas). */
export function needPoints(v: V, n: number): Pt[] {
  if (!v.upright) return spread(n, 170, v.w - 170, 170).map((x) => ({ x, y: v.h - 95 }));
  return spread(n, stripX(v) - 225, stripX(v) + 225, 150).map((x) => ({ x, y: v.h - 95 }));
}

/** A selected piece's place in the garden: neighbours alternate a little above and below the line. */
export const plotY = (gardenY: number, i: number) => gardenY + (i % 2 ? 12 : -14);

// ---- The rocky shore (levels 8–9) ----

export interface ShoreFrame {
  placeY: number;
  /** The top of the sea at its highest, and the half width of a place's touch area. */
  seaTop: number;
  placeHalf: number;
  /** The sand under the loose friends: x, y, w, h of the tap area that takes a held friend back. */
  sand: { x: number; y: number; w: number; h: number };
}

export function shoreFrame(v: V, places: number): ShoreFrame {
  if (!v.upright)
    return {
      placeY: v.h * 0.5,
      seaTop: v.h * 0.3,
      placeHalf: 130,
      sand: { x: 150, y: v.h - 170, w: v.w - 330, h: 160 },
    };
  const placeY = v.h - 520;
  return {
    placeY,
    seaTop: placeY - 200,
    placeHalf: places > 2 ? 125 : 130,
    sand: { x: 150, y: v.h - 310, w: v.w - 300, h: 300 },
  };
}

export function placeXs(v: V, n: number): number[] {
  if (!v.upright) return spread(n, 40, v.w - 40, 300);
  return spread(n, n > 2 ? 4 : 40, n > 2 ? v.w - 4 : v.w - 40, n > 2 ? 250 : 300);
}

/** The shore friends on the sand (112-unit touch areas, up to four). */
export function friendPoints(v: V, n: number): Pt[] {
  if (!v.upright) return spread(n, 200, v.w - 190, 130).map((x) => ({ x, y: v.h - 95 }));
  return twoRows(v, n, v.h - 95, v.h - 240);
}
