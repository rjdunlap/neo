import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  allHome,
  drawCard,
  drawCardFor,
  farthest,
  hop,
  hops,
  judgeStone,
  makePath,
  owlOf,
  owlToHop,
  LEVELS,
  NEST_REACH,
  nestPointIn,
  PLANS,
  planFor,
  STEPPING_LEVEL,
  STONE_COLORS,
  stepTo,
  stoneLayout,
  stoneReach,
  type Spot,
} from './logic';

describe('Owl Walk Home', () => {
  it('lays a path where every color keeps coming back and never repeats side by side', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
        const path = makePath(plan, new Rng(seed));
        expect(path).toHaveLength(plan.stones);
        path.slice(1).forEach((c, i) => expect(c).not.toBe(path[i]));
        // The stepping stones have no cards, so their colors are only decoration.
        if (plan.mode !== 'free')
          for (const c of STONE_COLORS.slice(0, plan.colors))
            expect(path.filter((p) => p === c).length).toBeGreaterThanOrEqual(2);
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
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
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

  it('hops the owl a card carries the farthest, every turn, until everyone is home, so the demonstration never bounces', () => {
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
    for (const plan of PLANS)
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const path = makePath(plan, rng);
        const spots: Spot[] = Array.from({ length: plan.owls }, () => rng.int(-1, path.length - 1));
        // No two owls on one stone.
        if (new Set(spots.filter((s) => s >= 0)).size !== spots.filter((s) => s >= 0).length) continue;
        for (const color of STONE_COLORS.slice(0, plan.colors))
          for (let i = 0; i < plan.owls; i++) {
            const to = hop(path, spots, i, color);
            const right: Array<number | 'nest'> = [];
            for (let t = 0; t < path.length; t++)
              if (judgeStone(path, spots, i, color, t) === 'next') right.push(t);
            if (judgeStone(path, spots, i, color, 'nest') === 'nest') right.push('nest');
            expect(right).toEqual([to >= path.length ? 'nest' : to]);
          }
      }
  });

  it('on the first levels a card always has a stone ahead for the owl whose turn it is, until the last stone', () => {
    for (const plan of PLANS.filter((p) => p.safeCards))
      for (let seed = 1; seed <= 200; seed++) {
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
          if (to >= path.length)
            expect(
              STONE_COLORS.slice(0, plan.colors).every((c) => hop(path, spots, i, c) >= path.length),
            ).toBe(true);
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

  describe('Stepping stones (level 5)', () => {
    const plan = planFor(STEPPING_LEVEL);

    it('is a free toy of five stones, first for the lap band and an easy entry for toddlers', () => {
      expect(plan.mode).toBe('free');
      expect(plan.stones).toBe(5);
      expect(plan.owls).toBe(1);
      expect(LEVELS.lap).toEqual({ min: 5, max: 5 });
      expect(LEVELS.toddler?.order?.[0]).toBe(STEPPING_LEVEL);
    });

    it('reaches the nest from every spot, hops to every stone ahead, and never judges a tap', () => {
      for (let spot: Spot = -1; spot < plan.stones; spot++) {
        expect(stepTo(plan.stones, spot, 'nest')).toBe('home');
        for (let t = 0; t < plan.stones; t++)
          expect(stepTo(plan.stones, spot, t)).toBe(t > spot ? 'hop' : 'stay');
      }
      expect(stepTo(plan.stones, plan.stones, 'nest')).toBe('stay');
      // From the woods, stone after stone, then the nest: home in at most six taps.
      let spot: Spot = -1;
      for (let taps = 0; spot < plan.stones; taps++) {
        expect(taps).toBeLessThan(plan.stones + 1);
        spot =
          stepTo(plan.stones, spot, spot + 1 < plan.stones ? spot + 1 : 'nest') === 'home'
            ? plan.stones
            : spot + 1;
      }
    });

    it('gives each stone and the nest a touch area of at least 100 units that never overlaps another, at every view', () => {
      const reach = stoneReach(plan);
      expect(reach * 2).toBeGreaterThanOrEqual(100);
      for (const [w, h] of [
        [1024, 768],
        [1180, 768],
        [1366, 768],
        [1024, 1024],
        [1024, 1366],
        [1700, 768],
      ]) {
        const pts = stoneLayout(plan.stones, w, h);
        for (let a = 0; a < pts.length; a++)
          for (let b = a + 1; b < pts.length; b++)
            expect(Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y)).toBeGreaterThanOrEqual(reach * 2);
        const nest = nestPointIn(w, h);
        for (const p of pts)
          expect(Math.hypot(p.x - nest.x, p.y - nest.y)).toBeGreaterThanOrEqual(reach + NEST_REACH);
        for (const p of pts) {
          expect(p.x - reach).toBeGreaterThanOrEqual(0);
          expect(p.x + reach).toBeLessThanOrEqual(w);
          expect(p.y + reach).toBeLessThanOrEqual(h);
        }
      }
    });
  });
});
