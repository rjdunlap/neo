import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CHOICE, LEVELS, ROW_H, TAB, guideLayout, planFor, type Rect } from './logic';

/**
 * Look It Up held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone views,
 * the captioned one and a short one. What a level shows to touch: the tabs, the book's rows (one at the page level, three
 * otherwise) and the three basket choices (the talking-labels level has no choices).
 */
const views: Record<string, View> = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const box = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w,
  h: r.h,
});

function targets(v: View, level: number): Target[] {
  const mode = planFor(level).mode;
  const l = guideLayout(v, mode === 'page' ? 1 : 3, 3);
  const out = [
    ...l.tabs.map((t, i) => box(`tab ${i + 1}`, t)),
    ...l.rows.map((r, i) => box(`row ${i + 1}`, r)),
  ];
  if (mode !== 'labels') out.push(...l.choices.map((c, i) => box(`choice ${i + 1}`, c)));
  return out;
}

describe.each(Object.entries(views))('Look It Up upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(v, level)), `level ${level}`).toEqual([]);
    },
  );

  it.each(levels)('level %i: the book fits above the basket and the visitor stands between', (level) => {
    const mode = planFor(level).mode;
    const l = guideLayout(v, mode === 'page' ? 1 : 3, 3);
    expect(l.book.y + l.book.h).toBeLessThan(v.h * 0.6);
    expect(l.tabs[2].y + l.tabs[2].h).toBeLessThan(v.h);
    expect(TAB).toBeGreaterThanOrEqual(100);
    expect(ROW_H).toBeGreaterThanOrEqual(100);
    expect(CHOICE).toBeGreaterThanOrEqual(100);
  });
});
