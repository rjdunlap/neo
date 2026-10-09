import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { helpingPieces, makeRounds, missingNeeds, PIECES, PIECE_IDS, PLANS, solutions, visitorsFor, welcomes } from './logic';

describe('Habitat Helpers', () => {
  it('gives every pictured piece a spoken name and at least one explicit use', () => {
    for (const id of PIECE_IDS) {
      expect(PIECES[id].name.length).toBeGreaterThan(3);
      expect(Object.values(PIECES[id].for).flat().length).toBeGreaterThan(0);
    }
  });

  it('builds the promised number of valid, solvable gardens at every level', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(level, new Rng(seed));
        expect(rounds, `level ${level}, seed ${seed}`).toHaveLength(PLANS[level - 1].rounds);
        for (const round of rounds) {
          expect(new Set(round.offered).size).toBe(round.offered.length);
          round.offered.forEach((id) => expect(PIECE_IDS).toContain(id));
          expect(round.capacity).toBeGreaterThanOrEqual(2);
          if (PLANS[level - 1].mode === 'build') {
            expect(round.prepared).toBeUndefined();
            expect(solutions(round).length, `level ${level}, seed ${seed}`).toBeGreaterThan(0);
          } else {
            expect(round.offered).toEqual([]);
            expect(round.prepared).toHaveLength(round.capacity);
          }
        }
      }
    }
  });

  it('teaches both visitors and all three needs before asking for compact habitats', () => {
    const level2 = makeRounds(2, new Rng(4));
    expect(level2.flatMap((r) => r.visitors).sort()).toEqual(['bunny', 'duck']);
    for (const round of level2) {
      expect(round.offered).toHaveLength(3);
      expect(welcomes(round.offered, round.visitors)).toBe(true);
    }

    const bunny = level2.find((r) => r.visitors[0] === 'bunny')!;
    expect(missingNeeds(['clover'], bunny.visitors).map((m) => m.need).sort()).toEqual(['shelter', 'water']);
    expect(welcomes(['clover', 'shallow-pool', 'brush-pile'], ['bunny'])).toBe(true);
    expect(welcomes(['seed-grass', 'shallow-pool', 'tall-reeds'], ['duck'])).toBe(true);
  });

  it('makes every prediction garden invite exactly the visitor it says it does', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const round of makeRounds(4, new Rng(seed))) {
        const actual = visitorsFor(round.prepared!);
        expect(actual).toEqual(round.visitors);
        seen.add(actual[0]);
      }
    }
    expect([...seen].sort()).toEqual(['bunny', 'duck']);
  });

  it('requires the multipurpose pieces in the compact and shared gardens', () => {
    const level5 = makeRounds(5, new Rng(8));
    const bunny = level5.find((r) => r.visitors[0] === 'bunny')!;
    const duck = level5.find((r) => r.visitors[0] === 'duck')!;
    expect(solutions(bunny).every((s) => s.includes('berry-hedge'))).toBe(true);
    expect(solutions(duck).every((s) => s.includes('pond-reeds'))).toBe(true);

    const together = makeRounds(6, new Rng(9))[0];
    expect(solutions(together).map((s) => [...s].sort())).toEqual([['berry-hedge', 'pond-reeds', 'seed-grass'].sort()]);
  });

  it('offers help that always supplies something still missing', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (const round of makeRounds(level, new Rng(level * 17))) {
        if (!round.offered.length) continue;
        const selected = round.offered.slice(0, Math.min(2, round.capacity));
        if (welcomes(selected, round.visitors)) continue;
        const helpers = helpingPieces(round, selected);
        expect(helpers.length).toBeGreaterThan(0);
        const before = missingNeeds(selected, round.visitors).length;
        helpers.forEach((piece) => expect(missingNeeds([...selected, piece], round.visitors).length).toBeLessThan(before));
      }
    }
  });
});
