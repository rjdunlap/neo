import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, SCREEN_RATIO, type Box } from './layout';
import { LEVELS, planFor } from './logic';

/**
 * Movie Night held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone views,
 * the captioned one and a short one. What a level shows to touch: the strip's squares (3 pond shots, or the 4 door shots
 * of level 3), the four sound pads and the four round buttons; the request and the little screen are looked at, not tapped.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const target = (what: string, b: Box): Target => ({ what, ...b });

function targets(v: View, level: number): Target[] {
  const l = layout(v, planFor(level).shots.length);
  return [
    ...l.slots.map((b, i) => target(`shot ${i + 1}`, b)),
    ...l.tray.map((b, i) => target(`pad ${i + 1}`, b)),
    ...l.controls.map((b, i) => target(`button ${i + 1}`, b)),
  ];
}
const rect = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
const hit = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

it('covers levels 1 to 3: any sound, the splash, the knock and the hello', () => {
  expect(levels).toEqual([1, 2, 3]);
  expect(levels.map((n) => planFor(n).shots.length)).toEqual([3, 3, 4]);
});

describe.each(Object.entries(views))('Movie Night upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(v, level)), `level ${level}`).toEqual([]);
    },
  );

  it.each(levels)(
    'level %i: the pads and buttons stand up from the bottom edge, the strip above',
    (level) => {
      const l = layout(v, planFor(level).shots.length);
      for (const b of l.controls) expect(v.h - b.y).toBeLessThanOrEqual(100);
      for (const b of l.tray) expect(b.y).toBeGreaterThan(v.h * 0.6);
      const lowestShot = Math.max(...l.slots.map((b) => b.y + b.h / 2));
      expect(lowestShot).toBeLessThan(l.screen.y - l.screen.h / 2);
    },
  );

  it('the request, the little screen and its frame sit whole in the view and clear of the strip and the pads', () => {
    const l = layout(v, 4);
    const screen = { ...rect(l.screen) };
    const frame = { x0: screen.x0 - 12, y0: screen.y0 - 12, x1: screen.x1 + 12, y1: screen.y1 + 12 };
    expect(frame.x0).toBeGreaterThanOrEqual(0);
    expect(frame.x1).toBeLessThanOrEqual(v.w);
    expect(l.screen.w * SCREEN_RATIO).toBeCloseTo(l.screen.h, 5);
    expect(l.screen.h).toBeGreaterThanOrEqual(220);
    for (const b of [...l.slots, ...l.tray, ...l.controls]) expect(hit(frame, rect(b))).toBe(false);
    // The request: audience from 310 left of its center to the tick 215 right, 45 above to 75 below.
    const req = { x0: l.request.x - 335, y0: l.request.y - 45, x1: l.request.x + 235, y1: l.request.y + 75 };
    expect(req.x0).toBeGreaterThanOrEqual(0);
    expect(req.x1).toBeLessThanOrEqual(v.w);
    expect(req.y0).toBeGreaterThanOrEqual(210);
    for (const b of l.slots) expect(hit(req, rect(b))).toBe(false);
  });
});

describe('Movie Night keeps its sideways layout', () => {
  it('lays the strip in one row of 160 by 120 squares on the 1024 area', () => {
    const l = layout(computeView(1024, 768), 4);
    expect(l.tall).toBe(false);
    expect(new Set(l.slots.map((b) => b.y))).toEqual(new Set([300]));
    expect(l.slots[0]).toMatchObject({ w: 160, h: 120 });
  });
});
