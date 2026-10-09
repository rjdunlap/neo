import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { compare, finish, makeRounds, makeStand, middleFrom, nextReach, PLANS, REACH, reached, SLOTS, stackMove, standingTower, targetFor, topples, W } from './logic';

describe('Block Tower', () => {
  it('keeps a block up only while the middle of it and everything above is over the block below', () => {
    expect(topples([0, 0, 0], null)).toBe(-1);
    // The top block hangs half off: its middle is on the edge, so it falls.
    expect(topples([0, W / 2], null)).toBe(1);
    expect(topples([0, W / 2 - 1], null)).toBe(-1);
    // The top two together reach too far past the bottom block, though each sits on the one below.
    expect(topples([0, 3, 6], null)).toBe(1);
    expect(middleFrom([0, 3, 6], 1)).toBe(4.5);
    // On a table: the whole stack's middle must be on the table side of its edge.
    expect(topples([-1], 0)).toBe(-1);
    expect(topples([0], 0)).toBe(0);
    expect(topples([-3, 0], 0)).toBe(-1);
    expect(topples([-1, 2], 0)).toBe(0);
  });

  it('asks for heights that are fair to build and compare', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRounds(plan, new Rng(seed));
      expect(rounds).toHaveLength(plan.rounds);
      for (const r of rounds) {
        if (plan.mode === 'flag') expect(r.target >= 3 && r.target <= 6).toBe(true);
        if (plan.mode === 'friend') expect(r.friend).toBeDefined();
        if (plan.mode === 'match') {
          expect(r.target).toBe(targetFor(r.bear!, r.ask!));
          expect(r.target).toBeGreaterThanOrEqual(2);
          expect(r.target).toBeLessThanOrEqual(7);
        }
      }
      if (plan.mode === 'match') expect(new Set(rounds.map((r) => r.ask)).size).toBe(3);
      if (plan.mode === 'flag' || plan.mode === 'match') rounds.slice(1).forEach((r, i) => expect(r.bear ?? r.target).not.toBe(rounds[i].bear ?? rounds[i].target));
    }
    expect([compare(3, 4), compare(4, 4), compare(5, 4)]).toEqual(['short', 'right', 'tall']);
  });

  it('shows two leaning towers where exactly one stands', () => {
    for (const subtle of [false, true]) for (let seed = 1; seed <= 300; seed++) {
      const r = makeStand(new Rng(seed), subtle);
      expect(r.towers).toHaveLength(2);
      r.towers.forEach((t, i) => {
        expect(t).toHaveLength(3);
        expect(topples(t, null) === -1).toBe(i === r.stands);
        // Both lean the same way, so straightness doesn't give it away.
        expect(Math.sign(t[2])).toBe(Math.sign(r.towers[0][2]));
        expect(t[2]).not.toBe(0);
        if (subtle) expect(Math.abs(Math.abs(t[2]) - Math.abs(r.towers[1 - i][2]))).toBeLessThanOrEqual(1);
      });
    }
  });

  it('can always reach the star, but not with fewer blocks than the round needs', () => {
    for (const round of REACH) {
      const way = finish([], round);
      expect(way).not.toBeNull();
      expect(topples(way!, 0)).toBe(-1);
      expect(reached(way!, round.star)).toBe(true);
      expect(way!.length).toBeLessThanOrEqual(round.blocks);
      // One block alone never touches the star, and a straight stack at the edge doesn't either.
      for (const x of SLOTS) if (topples([x], 0) === -1) expect(reached([x], round.star)).toBe(false);
    }
    // A hint can finish from a good start, and says when the top block has to come off.
    expect(finish([-3], REACH[0])).not.toBeNull();
    expect(finish([3], REACH[0])).toBeNull();
  });

  it('the ghost finger stacks to the target and rings once, on the flag and compare levels, without ever being short or tall', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'flag' || p.mode === 'match')) {
      for (let seed = 1; seed <= 50; seed++) {
        for (const round of makeRounds(plan, new Rng(seed))) {
          let have = 0;
          let moves = 0;
          for (let move = stackMove(have, round.target); move !== 'ring'; move = stackMove(have, round.target)) {
            expect(move).toBe('add');
            have++;
            moves++;
          }
          expect(moves).toBe(round.target);
          expect(compare(have, round.target)).toBe('right');
          // A tower that is already tall gives a block back; it never rings.
          expect(stackMove(round.target + 1, round.target)).toBe('take');
        }
      }
    }
  });

  it('the ghost finger picks the one tower that stands, both in the plain and the subtle rounds', () => {
    for (const subtle of [false, true]) for (let seed = 1; seed <= 300; seed++) {
      const r = makeStand(new Rng(seed), subtle);
      expect(standingTower(r)).toBe(r.stands);
    }
  });

  it('the ghost finger reaches the star one block at a time, standing at every step', () => {
    for (const round of REACH) {
      const placed: number[] = [];
      for (let next = nextReach(placed, round); next !== undefined && !reached(placed, round.star); next = nextReach(placed, round)) {
        expect(SLOTS).toContain(next);
        placed.push(next);
        expect(topples(placed, 0)).toBe(-1);
        expect(placed.length).toBeLessThanOrEqual(round.blocks);
      }
      expect(reached(placed, round.star)).toBe(true);
    }
  });
});
