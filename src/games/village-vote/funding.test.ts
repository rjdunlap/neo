import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { villageVote } from './index';
import { Election, fixture, fundingLayout, fundingRound, NAMES, roundFor, validate } from './logic';

function allocations(purses: number[], remaining: number): number[][] {
  if (purses.length === 0) return remaining === 0 ? [[]] : [];
  const [first, ...rest] = purses;
  return Array.from({ length: Math.min(first, remaining) + 1 }, (_, n) => n).flatMap((n) =>
    allocations(rest, remaining - n).map((tail) => [n, ...tail]),
  );
}

describe('Village Vote 6, Chip in', () => {
  it.each([0, 1, 2])(
    'accepts every valid allocation and names equal shares correctly in family %i',
    (family) => {
      const plan = fixture(6, family);
      const { cost, purses } = plan.funding!;
      const fills = allocations(purses, cost);
      expect(fills).toHaveLength([1, 19, 20][family]);
      expect(fills.filter((fill) => new Set(fill).size === 1)).toHaveLength(family === 0 ? 1 : 0);
      for (const fill of fills) {
        const election = new Election(plan);
        expect(election.complete()).toBe(false);
        for (const [i, count] of fill.entries()) {
          for (let n = 0; n < count; n++) {
            const total = election.jar + 1;
            expect(election.give(i)).toBe(total === cost ? 'full' : 'given');
            expect(election.jar).toBe(total);
          }
        }
        expect(election.give(0)).toBe('ignored');
        expect(election.equalShares).toBe(family === 0);
        expect(election.buildFundedToy()).toBe(true);
        expect(election.complete()).toBe(true);
        expect(election.complete()).toBe(false);
        expect(election.misses).toBe(0);
      }
    },
  );

  it('preserves the jar on an empty-purse tap and shows one hint with a usable purse', () => {
    const e = new Election(fixture(6));
    expect(e.give(-1)).toBe('ignored');
    e.give(0);
    e.give(0);
    expect(e.give(0)).toBe('empty');
    expect(e.jar).toBe(2);
    expect(e.misses).toBe(0);
    e.help();
    e.help();
    expect(e.hints).toBe(1);
    expect(e.glowing).toBe(true);
    expect(e.purse(e.nextPurse)).toBeGreaterThan(0);
  });

  it('opens with equal shares and moves to a board with choices on the second round', () => {
    for (let seed = 1; seed <= 35; seed++) {
      expect(fundingRound(new Rng(seed), 0)).toEqual(fixture(6));
      const { cost, purses } = fundingRound(new Rng(seed), 1).funding!;
      expect(allocations(purses, cost).length).toBeGreaterThan(1);
    }
  });

  it('uses all three purse families deterministically and starts from a counted vote in either winner slot', () => {
    const families = new Set<string>();
    const winnerSlots = new Set<number>();
    for (let seed = 1; seed <= 90; seed++) {
      const p = roundFor(6, new Rng(seed));
      const e = new Election(p);
      expect(p).toEqual(roundFor(6, new Rng(seed)));
      expect(e.counted.size).toBe(6);
      expect(e.phase).toBe('funding');
      expect(e.jar).toBe(0);
      winnerSlots.add(p.options.indexOf(e.winner));
      families.add([...p.funding!.purses].sort().join());
    }
    expect(families.size).toBe(3);
    expect(winnerSlots.size).toBe(2);
    expect(() => validate({ ...fixture(6), funding: { cost: 12, purses: [1, 1, 1, 1, 1, 1] } })).toThrow();
    expect(villageVote.levels('school')).toEqual({ min: 3, max: 6 });
    expect(villageVote.describeLevel(6)).toBe(NAMES[5]);
  });

  it.each(
    Object.entries({
      ...UPRIGHT_VIEWS,
      minimum: computeView(768, 1024, NO_INSETS, true),
      sideways: computeView(1024, 768),
    }),
  )('keeps all six purses, the jar, the winner and Help apart on %s', (_, view) => {
    const scene = fundingLayout(view);
    expect(
      uprightProblems(view, [
        ...scene.purses.map((p, i) => square(`purse ${i}`, p, 110)),
        square('help', scene.help, 110),
        { what: 'winning toy and cost', ...scene.toy, y: scene.toy.y + 15, w: 240, h: 126 },
        { what: 'jar', ...scene.jar, w: 234, h: 134 },
      ]),
    ).toEqual([]);
  });
});
