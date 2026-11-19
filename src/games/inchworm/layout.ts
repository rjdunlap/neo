import type { View } from '../../engine/view';
import { isRuler, isWide, RULER, type Measure, type MeasureMode } from './logic';

/**
 * Where Inchworm Measure puts its rows, worms, ruler pads and bucket, as pure functions of the view so a test can check
 * every level on the upright phone views (chunk 31, docs/definitions/phone-portrait.md). Sideways (1024 × 768) the
 * things sit mid-screen with the answer pads in a column at the right; upright that column and a 10-mark ruler at the
 * sideways unit (740 units) do not fit 768 units, so the unit shrinks, the answer pads rest in one row up from the
 * bottom edge, the bucket of worms stands above them, and the rows hang from those (not from the top of a tall phone).
 */
type V = Pick<View, 'w' | 'h' | 'upright'>;

export interface Point {
  x: number;
  y: number;
}

/** A worm's length in units: one little worm, and the unit the lay, say, compare and big-and-little levels measure in. */
export const U = 88;
/** The ruler levels', one worm's hops' and the long ruler's unit, sideways; upright they are smaller still. */
const WIDE_UNIT = 74;
const WIDE_UNIT_UPRIGHT = 68;
/** The long ruler lays a thing up to 12 long and the ruler twice (up to 12 across), so it needs the smallest unit. */
const SLIDE_UNIT_UPRIGHT = 56;
/** An answer pad's tap area. */
export const PAD_HIT = { w: 124, h: 112 } as const;
/** Pads' pitch along the bottom (up to three). */
export const PAD_PITCH = 150;
/** Upright: the pads' centres, and the bucket's first worm, this far above the bottom edge. */
const PADS_UP = 110;
const BUCKET_UP = 360;
/** The bucket's worms rest this far apart, one under another (a pile). */
export const BUCKET_STEP = 46;
/** A worm's tap area: 100 tall, and 20 wider than the worm (a big worm is two little ones long). */
export const WORM_HIT = { w: U + 20, h: 100 } as const;
export const BIG_WORM_HIT = { w: 2 * U + 20, h: 100 } as const;

/** The size of a measuring unit: worms keep theirs, the wide levels use a smaller one so the whole ruler fits. */
export function unit(v: V, mode: MeasureMode): number {
  if (!isWide(mode)) return U;
  if (!v.upright) return WIDE_UNIT;
  return mode === 'slide' ? SLIDE_UNIT_UPRIGHT : WIDE_UNIT_UPRIGHT;
}

/** The left end of mark 0 (or of the first worm's slot) on the levels that do not centre their measuring. */
export function defaultX0(v: V, mode: MeasureMode): number {
  if (v.upright) return (v.w - (isRuler(mode) ? RULER * unit(v, mode) : 6 * U)) / 2;
  return isRuler(mode) ? 140 : 200;
}

/**
 * Where mark 0 (the first worm's slot) lies for this measure. The broken ruler centres its piece from the break to 10, so the
 * missing part leaves no gap; one worm's hops centre the thing and the worm waiting one length before it; the long ruler
 * centres the thing and the ruler's second lay together; the rest sit at their default.
 */
export function x0For(v: V, mode: MeasureMode, m?: Pick<Measure, 'length' | 'brk' | 'ruler'>): number {
  const u = unit(v, mode);
  if (mode === 'broken' && m?.brk !== undefined)
    return Math.max(40, (v.w - (RULER - m.brk) * u) / 2) - m.brk * u;
  if (mode === 'hop' && m) return Math.max(40, (v.w - (m.length + 1) * u) / 2) + u;
  if (mode === 'slide' && m?.ruler) return Math.max(40, (v.w - 2 * m.ruler * u) / 2);
  return defaultX0(v, mode);
}

/** Where row `i` (0 top) lies: by height sideways, up from the controls upright. */
export function rowY(v: V, mode: MeasureMode, i: number): number {
  if (v.upright) {
    // Upright: the lowest row hangs above the controls, and a pair is a little closer than sideways.
    if (mode === 'units' || mode === 'compare') return v.h - 510 - (1 - i) * 200;
    if (mode === 'rulerdiff') return v.h - 306 - (1 - i) * 96;
    if (isRuler(mode)) return v.h - 306;
    if (mode === 'hop') return v.h - 310;
    if (mode === 'slide') return v.h - 480;
    return v.h - 510;
  }
  if (mode === 'units' || mode === 'compare') return v.h * (i === 0 ? 0.3 : 0.52);
  if (mode === 'rulerdiff') return v.h * 0.26 + i * 96;
  return v.h * 0.4;
}

/** Where answer pad `i` rests: a column at the right sideways (a row along the bottom on the wide levels), a row along the bottom upright. */
export function padHome(v: V, mode: MeasureMode, i: number): Point {
  if (v.upright || isWide(mode)) return { x: v.w / 2 - 150 + i * PAD_PITCH, y: v.h - PADS_UP };
  return { x: v.w - 110, y: v.h * 0.3 + i * 125 };
}

/** Where the bucket's worm `i` waits: the bottom right sideways; upright above the pads, at the right of the thumb. */
export function bucketHome(v: V, i: number): Point {
  if (v.upright) return { x: v.w - 200, y: v.h - BUCKET_UP + i * BUCKET_STEP };
  return { x: v.w - 170, y: v.h - 150 + i * BUCKET_STEP };
}

/**
 * One worm hopping: its tap area's half sides in the worm's own units (it is drawn scaled to the unit). Sideways 76 × 64; upright
 * the smaller unit would shrink that under 100 units a side, so it grows to keep 124.
 */
export function hopHit(v: V, mode: MeasureMode): { hw: number; hh: number } {
  if (!v.upright) return { hw: 76, hh: 64 };
  const k = U / unit(v, mode);
  return { hw: Math.max(76, 62 * k), hh: Math.max(64, 62 * k) };
}
