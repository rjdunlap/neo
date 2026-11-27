import { describe, expect, it } from 'vitest';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { waveLayout } from './layout';
import { PLANS } from './logic';

/**
 * Wave Ribbon held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The targets
 * are Send, Replay, Step, Help and Done, and at level 2 also Check, the Small and Tall buttons and the three trace cards; the
 * ribbon bench stays whole in the view and clear of Home and the help button.
 */
describe.each(Object.entries(UPRIGHT_VIEWS))('Wave Ribbon upright on %s', (_, v) => {
  it.each(PLANS.map((p) => [p.level, p] as const))(
    'level %s: targets are whole, apart and clear',
    (_l, plan) => {
      const L = waveLayout(v, plan.check);
      expect(L.landscape).toBe(false);
      const t: Target[] = [
        square('send', L.send, 100),
        square('replay', L.replay, 100),
        square('step', L.step, 100),
        square('help', L.help, 100),
        square('done', L.done, 100),
      ];
      if (plan.check) {
        t.push(square('check', L.check, 100), square('small', L.small, 100), square('tall', L.tall, 100));
        L.cards.forEach((c, i) => t.push({ what: `card ${i}`, ...c, w: L.card.w, h: L.card.h }));
      }
      expect(uprightProblems(v, t), `level ${plan.level}`).toEqual([]);
      // The bench is whole in the view, below Home and the help button, and above the controls.
      expect(L.bench.x).toBeGreaterThan(0);
      expect(L.bench.x + L.bench.w).toBeLessThan(v.w);
      expect(L.bench.y).toBeGreaterThan(210);
      expect(L.bench.y + L.bench.h).toBeLessThan(plan.check ? L.small.y - 50 : L.send.y - 50);
    },
  );
});

describe('Wave Ribbon sideways', () => {
  it.each(PLANS.map((p) => [p.level, p] as const))(
    'level %s: targets are whole, apart and clear at 1,024 × 768',
    (_l, plan) => {
      const v = { w: 1024, h: 768, scale: 1 };
      const L = waveLayout(v, plan.check);
      const t: Target[] = [L.send, L.replay, L.step, L.help, L.done].map((p, i) =>
        square(`button ${i}`, p, 100),
      );
      if (plan.check) {
        t.push(square('check', L.check, 100), square('small', L.small, 100), square('tall', L.tall, 100));
        L.cards.forEach((c, i) => t.push({ what: `card ${i}`, ...c, w: L.card.w, h: L.card.h }));
      }
      expect(uprightProblems(v, t)).toEqual([]);
    },
  );
});
