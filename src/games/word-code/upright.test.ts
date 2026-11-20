import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, thumbPx, type Target } from '../upright-check';
import { wordLayout } from './layout';
import { PLANS } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);
const box = (what: string, x: number, y: number, w: number, h = w): Target => ({ what, x, y, w, h });

/** Every target of a level's layout: the grown-up band's smallest allowed target is 64 units, school's 100. */
function targets(level: number, v: Parameters<typeof wordLayout>[0]): Target[] {
  const plan = PLANS[level];
  const L = wordLayout(v, plan);
  const t: Target[] = [];
  if (plan.picture) {
    L.pics.forEach((p, i) => t.push(box(`picture ${i}`, p.x, p.y, L.card.w, L.card.h)));
    L.tray.forEach((p, i) => t.push(box(`letter ${i}`, p.x, p.y, L.trayTile)));
    t.push(
      box('back', L.back.x, L.back.y, 112),
      box('check', L.check.x, L.check.y, 112),
      box('hint', L.hint.x, L.hint.y, 112),
    );
    for (let i = 0; i < plan.letters; i++)
      t.push(box(`tile ${i}`, L.cx + (i - (plan.letters - 1) / 2) * L.pitch, L.entryY, L.tile));
  } else {
    L.keys.forEach((k) => t.push(box(`key ${k.ch}`, k.x, k.y, L.keyBox.w, L.keyBox.h)));
    t.push(box('hint', L.hint.x, L.hint.y, 112));
    for (let i = 0; i < plan.letters; i++)
      t.push(box(`tile ${i}`, L.cx + (i - (plan.letters - 1) / 2) * L.pitch, L.entryY, L.tile));
  }
  return t;
}

describe.each(Object.entries(views))('Word Code upright on %s', (_, v) => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level}: tries, picture cards, tray or keyboard and buttons fit and stand apart`, () => {
      const plan = PLANS[level];
      const L = wordLayout(v, plan);
      expect(L.upright).toBe(true);
      expect(uprightProblems(v, targets(level, v), plan.picture ? 100 : 64)).toEqual([]);
      expect(L.rows).toBeGreaterThanOrEqual(1);
      if (!plan.picture) expect(thumbPx(L.keyBox.w)).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('Word Code sideways (1024 × 768)', () => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level} fits and stands apart`, () => {
      const plan = PLANS[level];
      expect(uprightProblems(sideways, targets(level, sideways), plan.picture ? 100 : 64)).toEqual([]);
      const L = wordLayout(sideways, plan);
      expect(L.rows).toBeGreaterThanOrEqual(plan.picture ? 3 : 2);
    });
  });
});
