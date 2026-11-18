import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { buttonsAt, cellAt, cellHit, CELL, gridLayout } from './layout';
import { planFor } from './logic';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const sideways = computeView(1024, 768);

/** Every square (trimmed by a hair, so neighbours that only touch are not read as overlapping), the row pictures and the buttons a level shows under the grid. */
function targets(v: typeof sideways, level: number): Target[] {
  const plan = planFor(level),
    l = gridLayout(v, plan);
  const out: Target[] = [];
  for (let r = 0; r < plan.rows; r++)
    for (let s = 0; s < plan.steps; s++) {
      const c = cellAt(l, r, s);
      out.push(square(`square ${r},${s}`, { x: l.x + c.x + CELL / 2, y: l.y + c.y + CELL / 2 }, CELL - 0.01));
    }
  const b = buttonsAt(v, l, plan.mode);
  // The check appears in free play too, once the beat has gone round.
  if (plan.mode !== 'see' && plan.mode !== 'repeat' && plan.mode !== 'sections' && plan.mode !== 'return') {
    out.push(square('check', b.check, b.r * 2));
    if (plan.mode !== 'free') out.push(square('listen', b.listen, b.r * 2));
    if (plan.mode === 'revise') out.push(square('claps only', b.solo, b.r * 2));
  }
  return out;
}

describe('Beat Builder layout', () => {
  it('has squares of at least 100 units', () => expect(CELL).toBeGreaterThanOrEqual(100));

  it('keeps the sideways grid as one bar where it always was', () => {
    for (const level of LEVELS) {
      const plan = planFor(level),
        l = gridLayout(sideways, plan);
      expect(l).toMatchObject({ bars: 1, cols: plan.steps, y: Math.max(130, sideways.h * 0.26) });
      expect(l.x).toBe(Math.max(200, (sideways.w - plan.steps * CELL) / 2 + 40));
      expect(l.controlsY).toBe(l.y + plan.rows * CELL + 95);
      expect(l.x + l.w).toBeLessThanOrEqual(sideways.w);
    }
  });

  it.each(Object.entries(views))('fits every level upright on %s', (_, v) => {
    for (const level of LEVELS)
      expect(uprightProblems(v, targets(v, level), 99.99), `level ${level}`).toEqual([]);
  });

  it('wraps only the eight-step levels upright, the second half under the first', () => {
    const v = UPRIGHT_VIEWS.phone;
    for (const level of LEVELS) {
      const plan = planFor(level),
        l = gridLayout(v, plan);
      expect(l.bars, `level ${level}`).toBe(plan.steps === 8 ? 2 : 1);
      if (l.bars === 2) {
        // Step s + 4 sits straight under step s, a full bar and the gap lower.
        for (let s = 0; s < 4; s++) {
          const top = cellAt(l, 0, s),
            under = cellAt(l, 0, s + 4);
          expect(under.x).toBe(top.x);
          expect(under.y).toBeGreaterThanOrEqual(top.y + plan.rows * CELL);
        }
        // The row pictures (60 left of the grid, 30 units to each side) stay clear of the Home column.
        expect(l.x - 90).toBeGreaterThanOrEqual(115);
        // The friends' deck above the grid stays below the top edge.
        expect(l.y).toBeGreaterThanOrEqual(190);
      }
    }
  });

  it('finds the square a touch lands in, and none in the gap between bars', () => {
    for (const v of [sideways, ...Object.values(views)])
      for (const level of LEVELS) {
        const plan = planFor(level),
          l = gridLayout(v, plan);
        for (let r = 0; r < plan.rows; r++)
          for (let s = 0; s < plan.steps; s++) {
            const c = cellAt(l, r, s);
            expect(cellHit(l, plan, c.x + CELL / 2, c.y + CELL / 2)).toEqual({ row: r, step: s });
            expect(cellHit(l, plan, c.x + 1, c.y + CELL - 1)).toEqual({ row: r, step: s });
          }
        expect(cellHit(l, plan, -1, 10)).toBeNull();
        expect(cellHit(l, plan, l.w + 1, 10)).toBeNull();
        expect(cellHit(l, plan, 10, l.h + 1)).toBeNull();
        if (l.bars === 2) expect(cellHit(l, plan, 10, l.barH + 10)).toBeNull();
      }
  });
});
