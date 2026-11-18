import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BUG_PLANS,
  CHECK_HIT,
  FOLD_CARD,
  LEVELS,
  PLACE_TAP,
  SLOT_REACH,
  STAMP_HIT,
  bugLayout,
  bugPlaces,
  bugPuzzle,
  bugSpan,
  countBoard,
  foldLayout,
  kindBoard,
  mendBoard,
  signSize,
  type Point,
} from './logic';

/**
 * Bug Builder held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the three
 * upright phone views, the captioned one and a short one. The boxes come from `bugLayout` and `foldLayout`, which the
 * scenes place from: each spot by the circle a stamp can be let go in (or the circle she taps), each tray stamp and the
 * check button by its touch circle, each choice card by its drawn card. A count level's sign and a copy level's model card
 * are pictures, boxed too so nothing she touches sits under them.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

const box = (what: string, p: Point, w: number, h = w): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: w - 1e-7,
  h: h - 1e-7,
});

/** A level's targets in a view, and the bug's own box (null on the fold level, whose bug is a picture above the cards). */
function targets(level: number, v: { w: number; h: number }, seed: number) {
  const plan = BUG_PLANS[level - 1],
    rng = new Rng(seed);
  if (plan.mode === 'fold') {
    const l = foldLayout(v);
    return {
      bug: null,
      list: l.cards.map((c) => box('card', c, FOLD_CARD.w * l.cardScale, FOLD_CARD.h * l.cardScale)),
    };
  }
  let stamps: number,
    spots: Point[],
    want = 0;
  if (plan.mode === 'count' || plan.mode === 'kind') {
    const b = (plan.mode === 'kind' ? kindBoard : countBoard)(plan, rng);
    [stamps, spots, want] = [b.tokens.length, b.state.places, b.state.want];
  } else if (plan.mode === 'mend') {
    // Both wings' places are tapped; the right wing's also take a stamp, in a circle a unit wider.
    const m = mendBoard(plan, rng);
    [stamps, spots] = [m.tokens.length, bugPlaces(plan)];
    expect(m.places.every((p) => spots.some((s) => s.x === p.x && s.y === p.y))).toBe(true);
    expect(SLOT_REACH).toBeGreaterThanOrEqual(PLACE_TAP);
  } else {
    const p = bugPuzzle(plan, rng);
    [stamps, spots] = [p.tokens.length, p.targets];
  }
  const l = bugLayout(v, plan, stamps, want ? signSize(want).halfW : undefined);
  const k = l.board.scale;
  const list = [
    ...spots.map((s) => box('spot', { x: l.board.x + s.x * k, y: l.board.y + s.y * k }, SLOT_REACH * 2 * k)),
    ...l.tray.map((t) => box('stamp', t, STAMP_HIT * 2)),
  ];
  expect(l.tray).toHaveLength(stamps);
  if (l.check && l.sign) {
    const s = signSize(want);
    list.push(box('check', l.check, CHECK_HIT * 2), box('sign', l.sign, s.halfW * 2, s.halfH * 2));
  }
  if (l.card)
    list.push(
      box('model card', { x: l.card.x + l.card.w / 2, y: l.card.y + l.card.h / 2 }, l.card.w, l.card.h),
    );
  const span = bugSpan(plan);
  return {
    list,
    layout: l,
    bug: {
      x0: l.board.x - span.halfW * k,
      x1: l.board.x + span.halfW * k,
      y0: l.board.y - span.top * k,
      y1: l.board.y + span.bottom * k,
    },
  };
}

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});

describe.each(Object.entries(views))('Bug Builder upright on %s', (_, v) => {
  it('covers levels 1 to 11', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort((a, b) => a - b)).toEqual(
      BUG_PLANS.map((_, i) => i + 1),
    );
  });

  it.each(cases)(
    '%s level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      for (const seed of SEEDS) {
        const t = targets(level, v, seed);
        expect(uprightProblems(v, t.list), `seed ${seed}, ${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual(
          [],
        );
        if (v === UPRIGHT_VIEWS.phone)
          expect(Math.min(...t.list.map((b) => Math.min(b.w, b.h))) * v.scale).toBeGreaterThanOrEqual(44);
        if (!t.bug || !t.layout) continue;
        // The whole bug is in view, above the tray, and a copy level's model card ends above it.
        expect(t.bug.x0).toBeGreaterThanOrEqual(0);
        expect(t.bug.x1).toBeLessThanOrEqual(v.w);
        expect(t.bug.y0).toBeGreaterThanOrEqual(t.layout.card ? t.layout.card.y + t.layout.card.h : 0);
        expect(t.bug.y1).toBeLessThanOrEqual(t.layout.trayBox.y);
        // The tray panel holds every stamp's tile and starts right of the guide.
        for (const s of t.layout.tray) {
          expect(s.y - 51).toBeGreaterThanOrEqual(t.layout.trayBox.y);
          expect(s.x - 51).toBeGreaterThanOrEqual(t.layout.trayBox.x);
        }
      }
    },
  );

  it('draws the bug at least as large as sideways, and level 11 larger', () => {
    BUG_PLANS.forEach((plan, i) => {
      if (plan.mode !== 'fold')
        expect(bugLayout(v, plan, 4).board.scale, `level ${i + 1}`).toBeGreaterThanOrEqual(1);
    });
    const k = bugLayout(v, BUG_PLANS[10], 4).board.scale;
    expect(k).toBeGreaterThan(1.15);
    expect(PLACE_TAP * 2 * k).toBeGreaterThan(128);
  });
});

describe('Bug Builder sideways', () => {
  const tablet = { w: 1366, h: 1024 },
    small = { w: 1024, h: 768 };

  it('keeps the bug, the model, the sign and the check where they were', () => {
    const mirror = bugLayout(small, BUG_PLANS[6], 6);
    expect(mirror.board).toEqual({ x: 512, y: 365, scale: 1 });
    expect(mirror.tray.map((t) => t.x)).toEqual([252, 382, 512, 642, 772, 902]);
    expect(mirror.tray.every((t) => t.y === 681)).toBe(true);
    expect(mirror.trayBox).toEqual({ x: 165, y: 613, w: 824, h: 135 });
    const copy = bugLayout(small, BUG_PLANS[3], 4);
    expect(copy.board).toEqual({ x: 1024 * 0.68, y: 365, scale: 1 });
    expect(copy.model).toEqual({ x: 1024 * 0.24, y: 365, scale: 0.62 });
    expect(copy.card).toEqual({ x: 1024 * 0.24 - 155, y: 165, w: 310, h: 395 });
    expect(copy.arrow).toEqual({ x: 1024 * 0.43, y: 365, down: false });
    const count = bugLayout(small, BUG_PLANS[7], 3, 84);
    expect(count.board).toEqual({ x: 1024 * 0.6, y: 365, scale: 1 });
    expect(count.sign).toEqual({ x: 1024 * 0.2, y: 295 });
    expect(count.check).toEqual({ x: 1024 * 0.2, y: 515 });
    const mend = bugLayout(tablet, BUG_PLANS[10], 4);
    expect(mend.board).toEqual({ x: 683, y: 432, scale: 1 });
    expect(mend.tray).toEqual([553, 683, 813, 943].map((x) => ({ x, y: 937 })));
    const big = bugLayout(tablet, BUG_PLANS[8], 4, 70);
    expect(big.sign).toEqual({ x: 1366 * 0.2, y: 362 });
    expect(big.check).toEqual({ x: 1366 * 0.2, y: 582 });
  });

  it('keeps Fold a friend: three cards in a row along the bottom under the bug', () => {
    const l = foldLayout(small);
    expect(l.cardScale).toBe(1);
    expect(l.cards).toEqual([309, 577, 845].map((x) => ({ x, y: 620 })));
    expect(l.board).toEqual({ x: 512, y: 20 + 285 * 0.85, scale: 0.85 });
    const t = foldLayout(tablet);
    expect(t.cardScale).toBe(1);
    expect(t.cards).toEqual([474, 748, 1022].map((x) => ({ x, y: 876 })));
    expect(t.board.scale).toBe(0.85);
  });

  it('has every touch target clear at both sideways sizes too (the model card is a picture beside Home there)', () => {
    for (const v of [tablet, small])
      for (let level = 1; level <= BUG_PLANS.length; level++)
        for (const seed of SEEDS.slice(0, 5))
          expect(
            uprightProblems(
              v,
              targets(level, v, seed).list.filter((t) => t.what !== 'model card'),
            ),
            `level ${level}`,
          ).toEqual([]);
  });
});
