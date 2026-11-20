import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  centre,
  loadPlan,
  passPlan,
  planPlan,
  reachPlan,
  roadLayout,
  swapPlan,
  wellsPlan,
  worthPlan,
  type Rect,
} from './logic';

/**
 * Caravan Days held upright (chunk 31, docs/definitions/phone-portrait.md): every level, plan and road at the upright phone
 * views. Targets are what she taps: the camel, bales, oases, offers, bubbles, boards, loads, day cards, well sites, the day
 * stick and Go. Level 3's map stands on end; every level hangs up from the bottom edge so a tall phone's spare height is sky.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const SEEDS = [1, 7, 99, 4242, 15841, 20260, ...Array.from({ length: 60 }, (_, i) => 1000 + i * 37)];
const box = (what: string, r: Rect): Target => ({ what, ...centre(r), w: r.w, h: r.h });

describe.each(Object.entries(views))('Caravan Days upright on %s', (_, v) => {
  it('every level lays out and every input fits and stands apart', () => {
    for (const seed of SEEDS) {
      const r = () => new Rng(seed);
      const cases: [number, Parameters<typeof roadLayout>[1], number[]][] = [
        [1, loadPlan('toddler', r()), [0]],
        [1, loadPlan('prek', r()), [0]],
        [1, loadPlan('school', r()), [0]],
        [2, reachPlan(r()), [0, 1]],
        [3, planPlan(r()), [0, 1]],
        [4, swapPlan(r()), [0, 1]],
        [5, worthPlan(r()), [0, 1]],
        [6, passPlan(r()), [0, 1]],
        [7, wellsPlan(r()), [0, 1]],
      ];
      for (const [level, plan, indexes] of cases)
        for (const index of indexes) {
          const l = roadLayout(level, plan, v, index);
          const note = `level ${level} seed ${seed} index ${index} at ${Math.round(v.h)}`;
          expect(l, note).not.toBeNull();
          if (!l) continue;
          const t: Target[] = [];
          if (level === 1) t.push(box('camel', l.camel));
          if (level <= 3 || level === 1) l.stops.forEach((s, i) => t.push(box(`stop ${i}`, s)));
          l.bales.forEach((b, i) => t.push(box(`bale ${i}`, b)));
          (l.offers ?? []).forEach((b, i) => t.push(box(`offer ${i}`, b)));
          (l.bubbles ?? []).forEach((b, i) => t.push(box(`bubble ${i}`, b)));
          (l.boards ?? []).forEach((b, i) => t.push(box(`board ${i}`, b)));
          (l.loads ?? []).forEach((b, i) => t.push(box(`load ${i}`, b)));
          (l.bands ?? []).forEach((b, i) => t.push(box(`band ${i}`, b)));
          (l.cards ?? []).forEach((b, i) => t.push(box(`card ${i}`, b)));
          (l.sites ?? []).forEach((b, i) => t.push(box(`site ${i}`, b)));
          if (l.stick) t.push(box('day stick', l.stick));
          if (l.go) t.push(box('go', l.go));
          expect(uprightProblems(v, t), note).toEqual([]);
        }
    }
  });

  it('hangs up from the bottom edge: nothing floats in the middle of a tall phone', () => {
    for (const seed of SEEDS) {
      const r = () => new Rng(seed);
      const plans: [number, Parameters<typeof roadLayout>[1]][] = [
        [1, loadPlan('school', r())],
        [2, reachPlan(r())],
        [3, planPlan(r())],
        [4, swapPlan(r())],
        [5, worthPlan(r())],
        [6, passPlan(r())],
        [7, wellsPlan(r())],
      ];
      for (const [level, plan] of plans) {
        const l = roadLayout(level, plan, v, 0)!;
        const rects = [
          ...l.stops,
          ...l.bales,
          ...(l.offers ?? []),
          ...(l.loads ?? []),
          ...(l.cards ?? []),
          ...(l.sites ?? []),
        ];
        const low = Math.max(...rects.map((q) => q.y + q.h));
        expect(low, `level ${level} bottom`).toBeGreaterThan(v.h - 330);
      }
    }
  });
});
