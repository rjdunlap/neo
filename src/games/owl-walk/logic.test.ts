import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { allHome, drawCard, drawCardFor, farthest, hop, hops, judgeStone, makePath, owlOf, owlToHop, PLANS, STONE_COLORS, type Spot } from './logic';

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

  it("hops the owl a card carries the farthest, every turn, until everyone is home, so the demonstration never bounces", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const path = makePath(plan, rng);
        const spots = Array(plan.owls).fill(-1);
        let turns = 0;
        while (!allHome(path, spots)) {
          const card = drawCard(plan, rng);
          const i = owlToHop(path, spots, card)!;
          expect(i, `${plan.name} seed ${seed}`).not.toBeNull();
          expect(spots[i]).toBeLessThan(path.length);
          expect(farthest(path, spots, card)).toContain(i);
          expect(hops(path, spots, card)[i]).toBeGreaterThan(0);
          spots[i] = hop(path, spots, i, card);
          expect(++turns).toBeLessThanOrEqual(plan.owls * (plan.stones + 1));
        }
        expect(owlToHop(path, spots, 'red')).toBeNull();
      }
    }
  });

  it('judges a tap on a stone: the next free one of the color is right, and every other tap says why not', () => {
    const path = ['red', 'blue', 'red', 'green', 'red', 'blue'] as const;
    // The owl stands on stone 0; another owl sits on stone 2.
    const spots = [0, 2];
    expect(judgeStone(path, spots, 0, 'red', 4)).toBe('next');
    expect(judgeStone(path, spots, 0, 'red', 2)).toBe('occupied');
    expect(judgeStone(path, spots, 0, 'blue', 1)).toBe('next');
    expect(judgeStone(path, spots, 0, 'blue', 5)).toBe('far');
    expect(judgeStone(path, spots, 0, 'green', 1)).toBe('wrong-color');
    expect(judgeStone(path, [4, 0], 0, 'red', 0)).toBe('behind');
    expect(judgeStone(path, [4, 0], 0, 'red', 4)).toBe('behind');
    // The nest is right only when no free stone of the color is left ahead.
    expect(judgeStone(path, spots, 0, 'red', 'nest')).toBe('early-nest');
    expect(judgeStone(path, [4, 0], 0, 'red', 'nest')).toBe('nest');
    expect(judgeStone(path, [4, 2], 0, 'green', 'nest')).toBe('nest');
  });

  it('agrees with hop(): the tap that is right is exactly where the owl lands, whatever the board', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const path = makePath(plan, rng);
      const spots: Spot[] = Array.from({ length: plan.owls }, () => rng.int(-1, path.length - 1));
      // No two owls on one stone.
      if (new Set(spots.filter((s) => s >= 0)).size !== spots.filter((s) => s >= 0).length) continue;
      for (const color of STONE_COLORS.slice(0, plan.colors)) for (let i = 0; i < plan.owls; i++) {
        const to = hop(path, spots, i, color);
        const right: Array<number | 'nest'> = [];
        for (let t = 0; t < path.length; t++) if (judgeStone(path, spots, i, color, t) === 'next') right.push(t);
        if (judgeStone(path, spots, i, color, 'nest') === 'nest') right.push('nest');
        expect(right).toEqual([to >= path.length ? 'nest' : to]);
      }
    }
  });

  it('on the first levels a card always has a stone ahead for the owl whose turn it is, until the last stone', () => {
    for (const plan of PLANS.filter((p) => p.safeCards)) for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const path = makePath(plan, rng);
      const spots: Spot[] = Array(plan.owls).fill(-1);
      let player: 0 | 1 = 0;
      let turns = 0;
      while (!allHome(path, spots)) {
        const i = plan.mode === 'one' ? 0 : owlOf(path, spots, player);
        const card = drawCardFor(plan, rng, path, spots, [i]);
        const to = hop(path, spots, i, card);
        // Only an owl on a stone with no color left ahead may draw a card that flies it home.
        if (to >= path.length) expect(STONE_COLORS.slice(0, plan.colors).every((c) => hop(path, spots, i, c) >= path.length)).toBe(true);
        spots[i] = to;
        player = player === 0 ? 1 : 0;
        expect(++turns).toBeLessThan(plan.stones * plan.owls + 2);
      }
    }
  });

  it('gives each player their own owl in the one-each level, and never a turn to an owl that is home', () => {
    const plan = PLANS[1];
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const path = makePath(plan, rng);
      const spots: Spot[] = [-1, -1];
      let player: 0 | 1 = 0;
      let turns = 0;
      while (!allHome(path, spots)) {
        const i = owlOf(path, spots, player);
        expect(spots[i]).toBeLessThan(path.length);
        // While both owls are walking, each player moves their own.
        if (spots[0] < path.length && spots[1] < path.length) expect(i).toBe(player);
        spots[i] = hop(path, spots, i, drawCardFor(plan, rng, path, spots, [i]));
        player = player === 0 ? 1 : 0;
        expect(++turns).toBeLessThan(plan.stones * 2 + 2);
      }
    }
  });
});
