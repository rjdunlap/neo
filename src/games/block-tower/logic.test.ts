import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { compare, finish, makeRounds, makeStand, middleFrom, PLANS, REACH, reached, SLOTS, targetFor, topples, towerTouch, W } from './logic';

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

  it('the demonstration uses the right control in every mode and follows a stable route to each star', () => {
    expect(towerTouch('tumble', { stack: 0, target: 6, full: false })).toEqual({ kind: 'stack' });
    expect(towerTouch('friend', { stack: 3, target: 3, full: true })).toEqual({ kind: 'knock' });
    expect(towerTouch('flag', { stack: 2, target: 4, full: false })).toEqual({ kind: 'stack' });
    expect(towerTouch('flag', { stack: 4, target: 4, full: false })).toEqual({ kind: 'check' });
    expect(towerTouch('match', { stack: 5, target: 4, full: false })).toEqual({ kind: 'take' });
    expect(towerTouch('stand', { stack: 0, target: 0, full: false, stands: 1, guess: null })).toEqual({ kind: 'stand', tower: 1 });
    expect(towerTouch('stand', { stack: 0, target: 0, full: false, stands: 1, guess: 1 })).toBeNull();

    for (const round of REACH) {
      const placed: number[] = [];
      for (let step = 0; step < round.blocks; step++) {
        const move = towerTouch('reach', { stack: 0, target: 0, full: false, placed, reach: round });
        if (!move) break;
        expect(move.kind).toBe('place');
        if (move.kind === 'place') placed.push(move.x);
        expect(topples(placed, 0), `${round.blocks} blocks, ${placed}`).toBe(-1);
      }
      expect(reached(placed, round.star)).toBe(true);
      expect(towerTouch('reach', { stack: 0, target: 0, full: false, placed, reach: round })).toBeNull();
    }
    expect(towerTouch('reach', { stack: 0, target: 0, full: false, placed: [3], reach: REACH[0] })).toEqual({ kind: 'take' });
  });
});
