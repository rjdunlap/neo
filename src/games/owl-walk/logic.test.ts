import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { allHome, drawCard, farthest, hop, hops, makePath, PLANS, STONE_COLORS } from './logic';

describe('Owl Walk Home', () => {
  it('lays a path where every color keeps coming back and never repeats side by side', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
      const path = makePath(plan, new Rng(seed));
      expect(path).toHaveLength(plan.stones);
      path.slice(1).forEach((c, i) => expect(c).not.toBe(path[i]));
      for (const c of STONE_COLORS.slice(0, plan.colors)) expect(path.filter((p) => p === c).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('hops to the next free stone of the color, skipping owls, or flies home', () => {
    const path = ['red', 'blue', 'red', 'green', 'blue'] as const;
    expect(hop(path, [-1], 0, 'red')).toBe(0);
    expect(hop(path, [0], 0, 'red')).toBe(2);
    // The next red stone has an owl on it, and there's no red after that: home.
    expect(hop(path, [0, 2], 0, 'red')).toBe(5);
    expect(hop(path, [-1, 1], 0, 'blue')).toBe(4);
    expect(hops(path, [-1, 3, 5], 'blue')).toEqual([2, 1, 0]);
    expect(farthest(path, [-1, 3], 'blue')).toEqual([0]);
    expect(allHome(path, [5, 5])).toBe(true);
  });

  it('always finishes: any choice of owl keeps everyone moving toward home', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const path = makePath(plan, rng);
      const spots = Array(plan.owls).fill(-1);
      let turns = 0;
      while (!allHome(path, spots)) {
        const card = drawCard(plan, rng);
        const moving = spots.map((s, i) => (s < path.length ? i : -1)).filter((i) => i >= 0);
        const i = rng.pick(moving);
        const to = hop(path, spots, i, card);
        expect(to).toBeGreaterThan(spots[i]);
        spots[i] = to;
        turns++;
        expect(turns).toBeLessThan(plan.stones * plan.owls + 1);
      }
    }
  });
});
