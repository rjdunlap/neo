import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { fits, makeScene, nextRequest, PLANS, spotFacing, whereIs, type Where } from './logic';

describe('Peekaround Island', () => {
  it('turning the island changes what is in front and behind', () => {
    expect(whereIs(0, 0)).toBe('front');
    expect(whereIs(0, 1)).toBe('next');
    expect(whereIs(0, 2)).toBe('behind');
    expect(whereIs(0, -1)).toBe('next');
    // Half a turn swaps front and behind; sides stay sides.
    for (let s = 0; s < 4; s++) {
      const before = whereIs(s, 0);
      const after = whereIs(s, 2);
      expect(after).toBe(before === 'front' ? 'behind' : before === 'behind' ? 'front' : 'next');
    }
    for (let turns = -5; turns <= 5; turns++) for (let f = 0; f < 4; f++) expect(whereIs(spotFacing(f, turns), turns)).toBe(f === 0 ? 'front' : f === 2 ? 'behind' : 'next');
  });

  it('hides exactly one friend, the one asked about, and never the same one twice in a row', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'find' || p.mode === 'named' || p.mode === 'who')) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let last: string | undefined;
        for (let r = 0; r < plan.rounds; r++) {
          const s = makeScene(plan, rng, last as never);
          expect(s.friends).toHaveLength(plan.mode === 'find' ? 1 : plan.mode === 'named' ? 3 : 4);
          expect(new Set(s.friends).size).toBe(s.friends.length);
          expect(new Set(s.facing).size).toBe(s.facing.length);
          expect(s.facing.filter((f) => f === 2)).toHaveLength(1);
          expect(s.facing[s.hider]).toBe(2);
          expect(s.friends[s.hider]).not.toBe(last);
          last = s.friends[s.hider];
        }
      }
    }
  });

  it('every placement request can be answered, and all three words come up', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      for (const turns of [0, 1, 2, 3]) {
        const free = [0, 1, 2, 3];
        const asked: Where[] = [];
        while (free.length) {
          const req = nextRequest(free, turns, asked, rng);
          expect(fits(req.where, req.spot, turns)).toBe(true);
          // A child may answer with any fitting spot (either side for "next to"); none leaves a later request stuck.
          const choices = free.filter((s) => fits(req.where, s, turns));
          const take = choices[rng.int(0, choices.length - 1)];
          free.splice(free.indexOf(take), 1);
          asked.push(req.where);
        }
        expect(new Set(asked)).toEqual(new Set(['front', 'behind', 'next']));
      }
    }
  });

  it('two-direction pairs stay answerable across the half turn', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      let turns = 0;
      const free = [0, 1, 2, 3];
      for (let pair = 0; pair < 2; pair++) {
        const a = nextRequest(free, turns, [], rng);
        const b = nextRequest(free.filter((s) => s !== a.spot), turns, [a.where], rng);
        expect(a.spot).not.toBe(b.spot);
        // Placing either friend first, at any fitting spot, still leaves a spot for the other.
        const forA = free.filter((s) => fits(a.where, s, turns));
        for (const s of forA) expect(free.filter((x) => x !== s).some((x) => fits(b.where, x, turns))).toBe(true);
        free.splice(free.indexOf(a.spot), 1);
        free.splice(free.indexOf(b.spot), 1);
        turns += 2;
      }
      expect(free).toHaveLength(0);
    }
  });
});
