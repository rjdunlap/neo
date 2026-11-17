import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../engine/view';
import {
  ANSWER_SIZE,
  clampGlass,
  corners,
  lensLayout,
  MIN_LENS,
  MIN_LENS_1,
  PLANS,
  ringBox,
  ringHits,
  STOP_SIZE,
  THING_SIZE,
  type Rect,
} from './puddle-lens/logic';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

/**
 * Grown-up games that gained the grown-up band after upright batch 4 (chunk 31, docs/definitions/phone-portrait.md),
 * checked at every level, since a phone's Today's six plays a game at the player's own band.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const target = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w,
  h: r.h,
});

describe.each(Object.entries(views))('Grown-up upright catch-up on %s', (_, v) => {
  it.each(PLANS.map((p) => p.level))('Puddle Lens level %i: the lens and every button fit', (level) => {
    const l = lensLayout(v, level);
    expect(l).not.toBeNull();
    if (!l) return;
    const targets = [
      ...l.stops.map((r) => target('stop', r)),
      ...(l.answer ? [target('answer', l.answer)] : []),
      ...l.choices.map((r) => target('choice', r)),
      ...l.things.map((t) => target('thing', ringBox(t))),
    ];
    expect(uprightProblems(v, targets)).toEqual([]);
    // Full-size buttons upright, the same units as sideways: no level falls back to the smaller grown-up cards.
    for (const r of l.stops) expect(Math.min(r.w, r.h)).toBe(STOP_SIZE);
    for (const r of [...l.choices, ...(l.answer ? [l.answer] : [])])
      expect(Math.min(r.w, r.h)).toBe(ANSWER_SIZE);
    for (const t of l.things) expect(t.r * 2).toBe(THING_SIZE);
    expect(l.stops.length).toBe(level >= 3 ? 4 : 0);
    expect(l.choices.length).toBe(level === 9 || level === 11 ? 4 : level >= 5 ? 3 : 0);
    if (level !== 2) {
      // The lens: inside the view, clear of Home, "?" and the guide, and never under a button.
      expect(l.lens.r * 2).toBeGreaterThanOrEqual(level === 1 ? MIN_LENS_1 : MIN_LENS);
      const b = ringBox(l.lens);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(v.w);
      expect(b.y + b.h).toBeLessThanOrEqual(v.h);
      for (const k of corners(v)) expect(ringHits(l.lens, k)).toBe(false);
      for (const t of targets)
        expect(ringHits(l.lens, { x: t.x - t.w / 2, y: t.y - t.h / 2, w: t.w, h: t.h })).toBe(false);
    } else {
      // The hand lens rests on the table above the row, the table keeps the whole glass inside the view and off Home,
      // "?" and the guide, and a glass let go on any thing stays centred on it (clampGlass does not pull it away).
      const t = l.table!;
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w).toBeLessThanOrEqual(v.w);
      for (const k of corners(v))
        expect(t.x < k.x + k.w && k.x < t.x + t.w && t.y < k.y + k.h && k.y < t.y + t.h).toBe(false);
      for (const p of [l.rest!, ...l.things]) expect(clampGlass(p, t)).toEqual({ x: p.x, y: p.y });
    }
    // A thumb on a 390-wide phone: the smallest button is at least 44 px.
    if (v === UPRIGHT_VIEWS.phone && targets.length)
      expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
  });
});
