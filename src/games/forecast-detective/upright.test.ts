import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { answersFor, CLUES, forecastLayout, UPRIGHT_FLOOR, type Box } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const box = (what: string, b: Box): Target => ({ what, ...b });

describe.each(Object.entries(views))('Forecast Detective upright on %s', (_, v) => {
  it.each([1, 2])(
    'level %i: lays out, targets fit, apart, clear of Home and the guide, hung from the bottom',
    (level) => {
      const l = forecastLayout(v, level);
      expect(l).not.toBeNull();
      if (!l) return;
      expect(l.cards.length).toBe(answersFor(level).length);
      const t: Target[] = [
        box('rule', l.rule),
        ...CLUES.map((k) => box(k, l.flaps[k])),
        ...l.cards.map((c, i) => box(`card ${i}`, c)),
        box('check', l.checkBtn),
      ];
      expect(uprightProblems(v, t)).toEqual([]);
      const lowest = Math.max(...t.map((b) => b.y + b.h / 2));
      expect(v.h - lowest).toBeLessThanOrEqual(UPRIGHT_FLOOR + 1);
      expect(l.scene.h).toBeGreaterThanOrEqual(160);
    },
  );
});
