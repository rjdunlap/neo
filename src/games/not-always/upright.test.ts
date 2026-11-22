import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { LEVELS, notAlwaysLayout, type Rect } from './logic';

/**
 * Not Always held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the
 * three upright phone views, the captioned one and a short one. The boxes are `notAlwaysLayout`'s own rectangles, which
 * are exactly the scene's touch areas: the claim's sign and the friend under it (a tap on either says the claim again),
 * the four or five cards, level 2's stamp and level 3's three mended signs. The layout takes only the view and the
 * level, so every claim of a round, and every seed, has the same boxes.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

/** A layout's corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w - 1e-7,
  h: r.h - 1e-7,
});

const driven = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});
/** Levels 4 to 6 are named explicitly for the school band, so they stay covered whatever `LEVELS.school.max` is. */
const cases: (readonly [Band, number])[] = [...driven];
for (const level of [4, 5, 6])
  if (!cases.some(([b, l]) => b === 'school' && l === level)) cases.push(['school', level]);

describe.each(Object.entries(views))('Not Always upright on %s', (_, v) => {
  it('covers levels 1 to 6', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(cases)(
    '%s level %i: the sign, friend, cards, stamp and mended signs are big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      const l = notAlwaysLayout(v, level);
      expect(l.cards).toHaveLength(level === 2 ? 5 : level === 5 ? 0 : 4);
      expect(!!l.stamp).toBe([2, 4, 6].includes(level));
      expect(l.mends).toHaveLength(level === 3 ? 3 : 0);
      expect(l.responses).toHaveLength(level === 5 ? 3 : 0);
      expect(l.replies).toHaveLength(level === 6 ? 2 : 0);
      expect(l.signs).toHaveLength(level === 6 || level === 5 ? 2 : 1);
      expect(l.friend === null).toBe(level === 5);
      const targets = [
        ...l.signs.map((r, i) => rect(`sign ${i + 1}`, r)),
        ...(l.friend ? [rect('friend', l.friend)] : []),
        ...l.responses.map((r, i) => rect(`response ${i + 1}`, r)),
        ...l.cards.map((r, i) => rect(`card ${i + 1}`, r)),
        ...(l.stamp ? [rect('stamp', l.stamp)] : []),
        ...l.mends.map((r, i) => rect(`mended sign ${i + 1}`, r)),
      ];
      expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
      if (l.replies.length) {
        // The cards are hidden during the reply scene, so the bubbles are checked with the signs and friend instead.
        const scene = [
          ...l.signs.map((r, i) => rect(`sign ${i + 1}`, r)),
          ...(l.friend ? [rect('friend', l.friend)] : []),
          ...l.replies.map((r, i) => rect(`reply ${i + 1}`, r)),
        ];
        expect(uprightProblems(v, scene), `reply scene ${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
      }
      if (v === UPRIGHT_VIEWS.phone)
        expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
    },
  );
});
