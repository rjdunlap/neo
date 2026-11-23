import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CHOICE, LEVELS, ROW_H, TAB, guideLayout, planFor, usesContents, type Rect } from './logic';

/**
 * Look It Up held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone views,
 * the captioned one and a short one. What a level shows to touch: the tabs, the book's rows (one at the page level, three
 * otherwise) and the three basket choices (the talking-labels level has no choices); from level 4 the Contents button,
 * and the contents page's seven lines or the open page's three rows.
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

/** What a level shows to touch, as separate states: from level 4 the page state and the contents state never show together. */
function states(v: View, level: number): Target[][] {
  const mode = planFor(level).mode;
  const contents = usesContents(level);
  const l = guideLayout(v, mode === 'page' ? 1 : 3, 3, contents);
  const buttons = l.tabs.map((t, i) => box(contents ? 'Contents' : `tab ${i + 1}`, t));
  const choices = mode === 'labels' ? [] : l.choices.map((c, i) => box(`choice ${i + 1}`, c));
  const page = [...buttons, ...l.rows.map((r, i) => box(`row ${i + 1}`, r)), ...choices];
  if (!contents) return [page];
  return [page, [...buttons, ...l.lines.map((r, i) => box(`line ${i + 1}`, r)), ...choices]];
}

describe.each(Object.entries(views))('Look It Up upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      for (const [i, ts] of states(v, level).entries())
        expect(uprightProblems(v, ts), `level ${level} state ${i}`).toEqual([]);
    },
  );

  it.each(levels)('level %i: the book fits above the basket and the visitor stands between', (level) => {
    const mode = planFor(level).mode;
    const l = guideLayout(v, mode === 'page' ? 1 : 3, 3, usesContents(level));
    expect(l.book.y + l.book.h).toBeLessThan(v.h * 0.6);
    for (const t of l.tabs) expect(t.y + t.h).toBeLessThan(v.h);
    for (const line of l.lines) expect(line.y + line.h).toBeLessThanOrEqual(l.book.y + l.book.h);
    expect(TAB).toBeGreaterThanOrEqual(100);
    expect(ROW_H).toBeGreaterThanOrEqual(100);
    expect(CHOICE).toBeGreaterThanOrEqual(100);
  });
});
