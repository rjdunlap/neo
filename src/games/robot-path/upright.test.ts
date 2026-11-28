import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { queueRows, robotLayout, routineLayout } from './layout';
import {
  boardFor,
  DIRECTIONS,
  DRIVE_PLANS,
  ONE_STEP_LEVEL,
  ONE_STEP_PLANS,
  FIX_PLANS,
  LEVELS,
  MEND_PLANS,
  PREDICT_PLANS,
  VIA_PLANS,
  type RobotPlan,
} from './logic';

/**
 * Robot Path held upright (chunk 31, docs/definitions/phone-portrait.md): every level's board on the upright phone views.
 * Targets are the grid cells, the arrows, the clear and play buttons, the loop button and the program slots.
 */
const plansFor = (level: number): { plan: RobotPlan; prediction: boolean }[] => {
  if (level === 11) return PREDICT_PLANS.map((plan) => ({ plan, prediction: true }));
  if (level === 12) return FIX_PLANS.map((plan) => ({ plan, prediction: false }));
  if (level === 14) return MEND_PLANS.map((plan) => ({ plan, prediction: false }));
  if (level === 13) return VIA_PLANS.map((plan) => ({ plan, prediction: false }));
  if (level === ONE_STEP_LEVEL) return ONE_STEP_PLANS.map((plan) => ({ plan, prediction: false }));
  return Array.from({ length: 12 }, (_, s) => ({ plan: boardFor(level, new Rng(s + 1)), prediction: false }));
};

describe.each(Object.entries(UPRIGHT_VIEWS))('Robot Path upright on %s', (_, v) => {
  it.each([...Array.from({ length: LEVELS.school!.max - 1 }, (_l, i) => i + 1), ONE_STEP_LEVEL])(
    'level %s',
    (level) => {
      for (const { plan, prediction } of plansFor(level)) {
        const mode = plan.mode ?? 'steps';
        const L = robotLayout(v, plan.size, plan.limit, mode);
        const t: Target[] = [];
        // Prediction levels tap the grid cells; the others tap the arrows.
        if (prediction)
          for (let y = 0; y < plan.size; y++)
            for (let x = 0; x < plan.size; x++)
              t.push(
                square(
                  `cell ${x},${y}`,
                  { x: L.origin[0] + (x + 0.5) * L.cell, y: L.origin[1] + (y + 0.5) * L.cell },
                  L.cell,
                ),
              );
        else {
          for (const d of DIRECTIONS) t.push(square(`arrow ${d}`, L.arrows[d], 100));
          t.push(square('clear', L.clear, 100));
          if (mode === 'loop') t.push(square('loop', L.loop, 108));
        }
        t.push(square('play', L.play, 100));
        for (let i = 0; i < plan.limit; i++)
          t.push(
            square(
              `slot ${i}`,
              { x: L.queue.x0 + (i % 4) * 110, y: L.queue.top + Math.floor(i / 4) * L.queue.rowStep },
              100,
            ),
          );
        expect(uprightProblems(v, t), `level ${level} ${plan.name}`).toEqual([]);
        // The whole grid sits inside the view and above the arrows, and the loop bracket clears the slots' edges.
        expect(L.origin[0]).toBeGreaterThanOrEqual(0);
        expect(L.origin[0] + plan.size * L.cell).toBeLessThanOrEqual(v.w);
        expect(L.origin[1] + plan.size * L.cell).toBeLessThan(L.arrows.up.y - 50);
        expect(L.arrows.up.y + 50).toBeLessThan(L.queue.top - 62);
        expect(queueRows(plan.limit)).toBeLessThanOrEqual(2);
      }
    },
  );
});

describe.each(Object.entries(UPRIGHT_VIEWS))('Robot Path level 15 upright on %s', (_, v) => {
  it('keeps every control apart, large and clear of Home and the guide, beside the board', () => {
    const L = routineLayout(v);
    const t: Target[] = [
      ...L.routineSlots.map((p, i) => square(`routine ${i}`, p, 100)),
      ...L.mainSlots.map((p, i) => square(`main ${i}`, p, 100)),
      square('call', L.call, 100),
      ...DIRECTIONS.map((d) => square(`arrow ${d}`, L.arrows[d], 100)),
      square('undo', L.undo, 100),
      square('play', L.play, 100),
      // The board is a display, but it must not sit under Home or the guide either.
      square('board', { x: L.origin[0] + 200, y: L.origin[1] + 200 }, 400),
    ];
    expect(uprightProblems(v, t)).toEqual([]);
    expect(L.origin[0]).toBeGreaterThanOrEqual(0);
    expect(L.origin[0] + 400).toBeLessThan(L.mainSlots[0].x - 50);
  });
});

describe('Robot Path level 15 sideways and on a tall tablet', () => {
  it.each([
    [1024, 768],
    [1060, 768],
    [1366, 768],
    [1024, 1365],
  ])('%s x %s fits the view with the board clear of Home', (w, h) => {
    const L = routineLayout({ w, h, scale: 1 });
    const t: Target[] = [
      ...L.routineSlots,
      ...L.mainSlots,
      L.call,
      ...DIRECTIONS.map((d) => L.arrows[d]),
      L.undo,
      L.play,
    ].map((p, i) => square(`target ${i}`, p, 100));
    for (const b of t) {
      expect(b.x - 50).toBeGreaterThanOrEqual(0);
      expect(b.x + 50).toBeLessThanOrEqual(w);
      expect(b.y - 50).toBeGreaterThanOrEqual(0);
      expect(b.y + 50).toBeLessThanOrEqual(h);
    }
    expect(L.origin[0]).toBeGreaterThanOrEqual(130);
    expect(L.origin[1] + 400).toBeLessThanOrEqual(h);
  });
});

describe.each(Object.entries(UPRIGHT_VIEWS))(
  'Robot Path level 16 (Drive the robot) upright on %s',
  (_, v) => {
    it('keeps the four arrows apart, large and clear of Home and the guide, below a board that fits', () => {
      for (const plan of DRIVE_PLANS) {
        const L = robotLayout(v, plan.size, 0, 'steps');
        const t: Target[] = DIRECTIONS.map((d) => square(`arrow ${d}`, L.arrows[d], 100));
        t.push(
          square(
            'board',
            { x: L.origin[0] + (plan.size * L.cell) / 2, y: L.origin[1] + (plan.size * L.cell) / 2 },
            plan.size * L.cell,
          ),
        );
        expect(uprightProblems(v, t), plan.name).toEqual([]);
        expect(L.origin[0]).toBeGreaterThanOrEqual(0);
        expect(L.origin[1] + plan.size * L.cell).toBeLessThan(L.arrows.up.y - 50);
      }
    });
  },
);
