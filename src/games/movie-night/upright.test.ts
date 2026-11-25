import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, SCREEN_RATIO, type Box } from './layout';
import { LEVELS, planFor } from './logic';
import { cutLayout } from './layout';
import { cutPlan, isCutLevel } from './cut';

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

const slotCount = (level: number) => (isCutLevel(level) ? cutPlan(level).slots : planFor(level).shots.length);
const lay = (v: View, level: number) =>
  isCutLevel(level)
    ? cutLayout(v, cutPlan(level).slots, cutPlan(level).cards.length)
    : layout(v, planFor(level).shots.length);

function targets(v: View, level: number): Target[] {
  const l = lay(v, level);
  return [
    ...l.slots.map((b, i) => target(`shot ${i + 1}`, b)),
    ...l.tray.map((b, i) => target(`pad ${i + 1}`, b)),
    ...l.controls.map((b, i) => target(`button ${i + 1}`, b)),
  ];
}
const rect = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
const hit = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

it('covers levels 1 to 5: the sounds, then picking the shots and keeping the surprise', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5]);
  expect(levels.map(slotCount)).toEqual([3, 3, 4, 3, 4]);
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
      const l = lay(v, level);
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

describe.each(Object.entries(views))('Movie Night picture cards upright on %s', (_, v) => {
  it.each([4, 5])('level %i: the preview, the request and the strip stay clear of each other', (level) => {
    const l = lay(v, level) as ReturnType<typeof cutLayout>;
    const preview = rect(l.preview);
    const frame = { x0: preview.x0 - 8, y0: preview.y0 - 8, x1: preview.x1 + 8, y1: preview.y1 + 8 };
    expect(frame.x0).toBeGreaterThanOrEqual(0);
    expect(frame.x1).toBeLessThanOrEqual(v.w);
    expect(l.preview.h).toBeGreaterThanOrEqual(220);
    for (const b of [...l.slots, ...l.tray, ...l.controls]) expect(hit(frame, rect(b))).toBe(false);
    expect(l.tray).toHaveLength(level === 5 ? 5 : 4);
    // Every tray card keeps 16 units from the next and stays in the view.
    l.tray
      .slice(1)
      .forEach((b, i) => expect(b.x - b.w / 2 - (l.tray[i].x + l.tray[i].w / 2)).toBeGreaterThanOrEqual(16));
  });
});

describe('Movie Night picture cards at other shapes', () => {
  it.each([4, 5])('level %i fits sideways and on an upright tablet with the preview clear', (level) => {
    for (const v of [
      computeView(1024, 768),
      computeView(768, 1024),
      computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    ]) {
      const p = cutPlan(level);
      const l = cutLayout(v, p.slots, p.cards.length);
      const preview = rect(l.preview);
      for (const b of [...l.slots, ...l.tray, ...l.controls]) {
        expect(hit(preview, rect(b)), `${v.w}x${v.h} ${b.x},${b.y}`).toBe(false);
        expect(rect(b).x0).toBeGreaterThanOrEqual(-1e-6);
        expect(rect(b).x1).toBeLessThanOrEqual(v.w + 1e-6);
        expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      }
      const all = [...l.slots, ...l.tray, ...l.controls].map(rect);
      all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(hit(a, b)).toBe(false)));
    }
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
