import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { downSide, FRIEND_FOR, makeRounds, MAX_TILT, numberChoices, PLANS, tilt, total, ways, weigh } from './logic';

describe('Seesaw Balance', () => {
  it('leans toward the heavier side, more for a bigger difference, and is level only when equal', () => {
    expect(tilt(3, 3)).toBe(0);
    expect(downSide(3, 3)).toBeNull();
    expect(tilt(1, 2)).toBeGreaterThan(0);
    expect(downSide(1, 2)).toBe('right');
    expect(tilt(2, 1)).toBeLessThan(0);
    expect(downSide(2, 1)).toBe('left');
    // A difference of one is plainly visible; bigger differences lean further, up to a limit.
    expect(Math.abs(tilt(4, 5))).toBeGreaterThanOrEqual(0.1);
    for (let d = 1; d < 8; d++) {
      expect(tilt(0, d + 1)).toBeGreaterThanOrEqual(tilt(0, d));
      expect(Math.abs(tilt(0, d))).toBeLessThanOrEqual(MAX_TILT);
    }
    expect(weigh(4, 3)).toBe('under');
    expect(weigh(4, 4)).toBe('level');
    expect(weigh(4, 5)).toBe('over');
  });

  it('makes every round winnable, with a real choice to make', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.rounds);
        for (const r of rounds) {
          const fixed = total(r.fixed);
          const offered = r.offered.map((t) => t.weight);
          switch (plan.mode) {
            case 'up':
              // Any offered friend lifts the rider: it only has to go on the other side.
              for (const w of offered) expect(w).toBeGreaterThan(fixed);
              expect(new Set(offered).size).toBe(offered.length);
              break;
            case 'heavy':
              // One friend lifts the rider and one does not.
              expect(offered.filter((w) => w > fixed)).toHaveLength(1);
              expect(offered.filter((w) => w < fixed)).toHaveLength(1);
              break;
            case 'level':
            case 'mystery':
              // Enough blocks to balance, with spares so stopping at level is a choice.
              expect(offered.every((w) => w === 1)).toBe(true);
              expect(offered.length).toBeGreaterThan(fixed);
              expect(r.answer).toBe(fixed / (plan.boxes ?? 1));
              break;
            case 'heaviest':
              expect(r.fixed).toHaveLength(0);
              expect(new Set(offered).size).toBe(3);
              expect(r.answer).toBe(Math.max(...offered));
              break;
            case 'parts':
              // At least two different ways to make the same weight.
              expect(fixed).toBe(r.answer);
              expect(ways(fixed, offered).length).toBeGreaterThanOrEqual(2);
              break;
          }
          for (const t of [...r.fixed, ...r.offered]) if (t.kind === 'friend') expect(FRIEND_FOR[t.weight as keyof typeof FRIEND_FOR]).toBeDefined();
        }
        // Counting levels never ask the same number twice in a row.
        if (plan.mode === 'level' || plan.mode === 'mystery' || plan.mode === 'parts') {
          for (let i = 1; i < rounds.length; i++) expect(rounds[i].answer).not.toBe(rounds[i - 1].answer);
        }
      }
    }
  });

  it('two identical boxes have a unique per-box weight and enough unit blocks', () => {
    for (let seed = 1; seed <= 100; seed++) for (const r of makeRounds(PLANS[6], new Rng(seed))) {
      expect(r.fixed).toHaveLength(2); expect(r.fixed[0].weight).toBe(r.fixed[1].weight);
      expect(total(r.fixed)).toBe(2 * r.answer); expect(total(r.offered)).toBeGreaterThan(total(r.fixed));
    }
  });

  it('finds every way to make a weight, and offers three nearby numbers', () => {
    expect(ways(5, [1, 2, 3, 4]).map((w) => w.join('+')).sort()).toEqual(['1+4', '2+3']);
    expect(ways(6, [1, 2, 3, 4]).map((w) => w.join('+')).sort()).toEqual(['1+2+3', '2+4']);
    for (let answer = 2; answer <= 5; answer++) {
      for (let seed = 1; seed <= 50; seed++) {
        const choices = numberChoices(new Rng(seed), answer);
        expect(choices).toContain(answer);
        expect(new Set(choices).size).toBe(3);
        for (const c of choices) expect(c).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
