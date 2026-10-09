import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beatMove, differences, empty, freeBeat, givenStep, hits, makeBeat, PLANS, same } from './logic';

describe('Beat Builder', () => {
  it('makes beats that start on the drum, give every row a hit, and are never all sounds at once', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const b = makeBeat(plan, new Rng(seed));
        expect(b).toHaveLength(plan.rows);
        for (const row of b) expect(row).toHaveLength(plan.steps), expect(row.some(Boolean)).toBe(true);
        expect(b[0][0]).toBe(true);
        if (plan.rows === 3) for (let s = 0; s < plan.steps; s++) expect(b.every((row) => row[s])).toBe(false);
        if (plan.mode === 'repeat') for (const row of b) expect(row.slice(4)).toEqual(row.slice(0, 4));
      }
    }
  });

  it('compares beats and finds the steps that differ', () => {
    const a = empty(2, 4);
    const b = empty(2, 4);
    a[0][0] = true;
    expect(same(a, b)).toBe(false);
    expect(differences(a, b)).toEqual([0]);
    b[0][0] = true;
    expect(same(a, b)).toBe(true);
  });

  describe("the ghost finger's bot", () => {
    it('builds the beat to copy with only right squares, leaving the given half alone, and checks only where a check is asked for', () => {
      for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
        for (let seed = 1; seed <= 100; seed++) {
          const target = makeBeat(plan, new Rng(seed));
          const beat = empty(plan.rows, plan.steps);
          target.forEach((row, r) => row.forEach((on, s) => (beat[r][s] = givenStep(plan, s) && on)));
          let taps = 0;
          let move = beatMove(plan, target, beat, true);
          while (move && move !== 'check') {
            expect(target[move.row][move.step], `${plan.name}: a right square`).toBe(true);
            expect(beat[move.row][move.step]).toBe(false);
            expect(givenStep(plan, move.step)).toBe(false);
            beat[move.row][move.step] = true;
            taps++;
            move = beatMove(plan, target, beat, true);
          }
          expect(same(target, beat), plan.name).toBe(true);
          expect(taps).toBeGreaterThan(0);
          // Levels that see their beat finish when it matches; the ear levels press the check.
          expect(move).toBe(plan.mode === 'hear' ? 'check' : null);
          if (plan.mode === 'hear') expect(beatMove(plan, target, beat, false)).toBeNull();
        }
      }
    });

    it('makes a free-play beat with enough sounds for the check to appear, then waits for it and presses it', () => {
      const plan = PLANS.find((p) => p.mode === 'free')!;
      const goal = freeBeat(plan);
      expect(hits(goal)).toBeGreaterThanOrEqual(3);
      expect(goal[0].some(Boolean) && goal[1].some(Boolean)).toBe(true);
      const beat = empty(plan.rows, plan.steps);
      for (let move = beatMove(plan, goal, beat, false); move && move !== 'check'; move = beatMove(plan, goal, beat, false)) beat[move.row][move.step] = true;
      expect(same(goal, beat)).toBe(true);
      expect(beatMove(plan, goal, beat, false)).toBeNull();
      expect(beatMove(plan, goal, beat, true)).toBe('check');
    });
  });
});
