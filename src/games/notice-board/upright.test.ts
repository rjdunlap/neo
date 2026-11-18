import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { LEVELS, noticeBoardLayout, type Rect } from './logic';

/**
 * Notice Board held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the
 * three upright phone views, the captioned one and a short one. The boxes are `noticeBoardLayout`'s own rectangles, which
 * are exactly the scene's touch areas: the poster (a tap reads it again), the three bench friends and, at level 3, the
 * two baskets. The layout takes only the view and the level, so every poster of a round, and every seed, has the same
 * boxes; the one other moment is level 2's photo, which slides out beside the poster while the friends stay on screen.
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

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});

describe.each(Object.entries(views))('Notice Board upright on %s', (_, v) => {
  it('covers levels 1 to 3', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3]);
  });

  it.each(cases)(
    '%s level %i: the poster, friends and baskets are big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      const l = noticeBoardLayout(v, level);
      expect(l.friends).toHaveLength(3);
      expect(l.baskets).toHaveLength(level === 3 ? 2 : 0);
      const targets = [
        rect('poster', l.poster),
        ...l.friends.map((r, i) => rect(`friend ${i + 1}`, r)),
        ...l.baskets.map((r, i) => rect(`basket ${i + 1}`, r)),
      ];
      expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
      // The photo is a picture, not a target, but it must not land on one, leave the view or hide a corner.
      expect(!!l.photo).toBe(level === 2);
      if (l.photo) expect(uprightProblems(v, [...targets, rect('photo', l.photo)])).toEqual([]);
      // The board behind the poster stays in view and clear of Home.
      expect(uprightProblems(v, [rect('board', l.board)])).toEqual([]);
      if (v === UPRIGHT_VIEWS.phone)
        expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
    },
  );
});

describe('Notice Board sideways', () => {
  it('keeps the tablet layout', () => {
    const big = noticeBoardLayout({ w: 1366, h: 1024 }, 3);
    expect(big.poster).toEqual({ x: 503, y: 40, w: 360, h: 280 });
    expect(big.friends.map((r) => [r.x, r.y])).toEqual([366, 588, 810].map((x) => [x, 400]));
    expect(big.baskets.map((r) => [r.x, r.y])).toEqual([423, 723].map((x) => [x, 660]));
    const small = noticeBoardLayout({ w: 1024, h: 768 }, 2);
    expect(small.poster).toEqual({ x: 332, y: 40, w: 360, h: 280 });
    expect(small.photo).toEqual({ x: 716, y: 95, w: 200, h: 170 });
    expect(small.friends.map((r) => [r.x, r.y])).toEqual([195, 417, 639].map((x) => [x, 400]));
  });
});
