import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  centre,
  PLAN_MAX,
  PLANS,
  picnicDayFor,
  picnicLayout,
  planLayout,
  roundFor,
  shedLayout,
  SORT_MAX,
  type Rect,
} from './logic';

/**
 * Second Chance Shed held upright (chunk 31, docs/definitions/phone-portrait.md): every level at the upright phone views.
 * Levels 1–4 sort one thing at a time (`shedLayout`), 5–6 plan a cart (`planLayout`), 7–8 plan cups across picnics
 * (`picnicLayout`). The arriving thing, the cart row's things, the places, friends, bell, shelf, seats and tub slots are
 * targets (the drop areas are bigger than the art, so the art's own size is what is measured).
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const SEEDS = [3, 7922, 15841];
const t = (what: string, r: Rect): Target => ({ what, x: centre(r).x, y: centre(r).y, w: r.w, h: r.h });

describe.each(Object.entries(views))('Second Chance Shed upright on %s', (_, v) => {
  PLANS.filter((p) => p.level <= SORT_MAX).forEach((plan) => {
    it(`level ${plan.level}: the thing and the places fit and stand apart`, () => {
      const l = shedLayout(v, plan.open);
      const targets = [t('thing', l.item), ...plan.open.map((p) => t(p, l.places[p]!))];
      expect(uprightProblems(v, targets, 100)).toEqual([]);
    });
  });
  PLANS.filter((p) => p.level > SORT_MAX && p.level <= PLAN_MAX).forEach((plan) => {
    it(`level ${plan.level}: the cart row, bell, friends and places fit and stand apart`, () => {
      for (const seed of SEEDS) {
        const round = roundFor(plan.level, new Rng(seed));
        const l = planLayout(v, round);
        const targets = [
          ...l.slots.map((r, i) => t(`slot ${i}`, r)),
          t('bell', l.bell),
          ...l.friends.map((r, i) => t(`friend ${i}`, r)),
          ...round.open.map((p) => t(p, l.places[p]!)),
        ];
        expect(uprightProblems(v, targets, 100), `seed ${seed}`).toEqual([]);
      }
    });
  });
  PLANS.filter((p) => p.level > PLAN_MAX).forEach((plan) => {
    it(`level ${plan.level}: the shelf, stack, bell, seats, tub slots, painter and heap fit and stand apart`, () => {
      for (const seed of SEEDS) {
        const day = picnicDayFor(plan.level, new Rng(seed));
        const l = picnicLayout(v, day);
        const targets: Target[] = [
          ...Object.entries(l.shelf).map(([k, r]) => t(k, r)),
          t('stack', l.stack),
          t('bell', l.bell),
          ...l.seats.flatMap((c, p) => c.map((r, k) => t(`seat ${p}.${k}`, r))),
          ...l.slots.flatMap((c, p) => c.map((r, k) => t(`slot ${p}.${k}`, r))),
          t('heap', l.heap),
        ];
        if (l.painter) targets.push(t('painter', l.painter));
        expect(uprightProblems(v, targets, 100), `seed ${seed}`).toEqual([]);
        // Hung up from the bottom edge: the lowest thing rests within 30 of it.
        expect(v.h - Math.max(...targets.map((x) => x.y + x.h / 2))).toBeLessThanOrEqual(30);
        // The heap is a drawn place, not a drop area: it stays clear of the tub columns too.
        for (const r of l.tubs) expect(r.y + r.h).toBeLessThan(l.heap.y + 1);
        void square;
      }
    });
  });
});
