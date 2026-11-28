import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { plannerLayout } from './layout';
import { puzzleFor } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

function targets(level: number, v: Parameters<typeof plannerLayout>[0]): Target[] {
  const p = puzzleFor(level);
  const L = plannerLayout(v, p.maxSteps, p.jobs.length);
  const t: Target[] = [];
  L.bench.forEach((s, i) => t.push(square(`bench slot ${i}`, s, L.slot)));
  L.cart.forEach((s, i) => t.push(square(`cart slot ${i}`, s, L.slot)));
  L.buttons.forEach((s, i) => t.push(square(`button ${i}`, s, L.button)));
  return t;
}

/** The tray tiles sit on their own row, apart from each other and from the buttons and clear of the corners. */
function trayTargets(level: number, v: Parameters<typeof plannerLayout>[0]): Target[] {
  const p = puzzleFor(level);
  const L = plannerLayout(v, p.maxSteps, p.jobs.length);
  return [
    ...L.tray.map((s, i) => square(`tile ${i}`, s, L.tile)),
    ...L.buttons.map((s, i) => square(`button ${i}`, s, L.button)),
  ];
}

describe.each(Object.entries(views))('Village Planner upright on %s', (_, v) => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level}: slots, tiles and buttons fit, stand apart and clear the corners`, () => {
      expect(uprightProblems(v, targets(level, v), 100)).toEqual([]);
      expect(uprightProblems(v, trayTargets(level, v), 100)).toEqual([]);
    });
  });
  it('the Trace Card buttons fit above the buttons row', () => {
    const p = puzzleFor(3);
    const L = plannerLayout(v, p.maxSteps, p.jobs.length);
    const card = L.cardButtons.map((s, i) => ({
      what: `card button ${i}`,
      x: s.x,
      y: s.y,
      w: L.cardButton.w,
      h: L.cardButton.h,
    }));
    expect(
      uprightProblems(v, [...card, ...L.buttons.map((s, i) => square(`button ${i}`, s, L.button))], 100),
    ).toEqual([]);
  });
});

describe('Village Planner thumb size', () => {
  it('the smallest target, a 100-unit button, is about 51 CSS pixels at 390 × 844 (above the 44 px comfort line)', () => {
    const L = plannerLayout(UPRIGHT_VIEWS.phone, 5, 6);
    expect(Math.min(L.tile, L.slot, L.button)).toBeGreaterThanOrEqual(100);
    expect(thumbPx(L.button)).toBeGreaterThanOrEqual(44);
  });
});

describe('Village Planner sideways (1024 × 768)', () => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level} fits and stands apart`, () => {
      expect(uprightProblems(sideways, targets(level, sideways), 100)).toEqual([]);
      expect(uprightProblems(sideways, trayTargets(level, sideways), 100)).toEqual([]);
    });
  });
});
