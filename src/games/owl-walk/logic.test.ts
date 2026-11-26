import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  allHome,
  cardName,
  cardsFor,
  drawCard,
  drawCardFor,
  EITHER_LEVEL,
  EITHER_SHAPES,
  farthest,
  fits,
  hop,
  hops,
  isShapeCard,
  judgeCheck,
  judgeStone,
  LEVELS,
  makePath,
  MARK,
  mismatchWords,
  nextProposalBest,
  proposalFor,
  CHECK_LEVEL,
  NEST_REACH,
  nestPointIn,
  owlOf,
  owlToHop,
  PLANS,
  planFor,
  STEPPING_LEVEL,
  STONE_COLORS,
  stepTo,
  stoneLayout,
  stoneReach,
  assignTotal,
  bestPairs,
  pairAssignments,
  pairCards,
  PAIRS_LEVEL,
  previewFor,
  walkers,
  worstPair,
  type Card,
  type Spot,
  type Stone,
  seatStep,
} from './logic';

const colorPath = (colors: readonly ColorName[]): Stone[] =>
  colors.map((color) => ({ color, shape: MARK[color]! }));

describe('Owl Walk Home', () => {
  it('lays a path where every color keeps coming back and never repeats side by side', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
        const path = makePath(plan, new Rng(seed));
        expect(path).toHaveLength(plan.stones);
        path.slice(1).forEach((s, i) => expect(s.color).not.toBe(path[i].color));
        // The stepping stones have no cards, so their colors are only decoration.
        if (plan.mode !== 'free')
          for (const c of STONE_COLORS.slice(0, plan.colors))
            expect(path.filter((p) => p.color === c).length).toBeGreaterThanOrEqual(2);
      }
  });

  it('hops to the next free stone of the color, skipping owls, or flies home', () => {
    const path = colorPath(['red', 'blue', 'red', 'green', 'blue']);
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
    const path = colorPath(['red', 'blue', 'red', 'green', 'red', 'blue']);
    // The owl stands on stone 0; another owl sits on stone 2.
    const spots = [0, 2];
    expect(judgeStone(path, spots, 0, 'red', 4)).toBe('next');
    expect(judgeStone(path, spots, 0, 'red', 2)).toBe('occupied');
    expect(judgeStone(path, spots, 0, 'blue', 1)).toBe('next');
    expect(judgeStone(path, spots, 0, 'blue', 5)).toBe('far');
    expect(judgeStone(path, spots, 0, 'green', 1)).toBe('mismatch');
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
        for (const card of cardsFor(plan))
          for (let i = 0; i < plan.owls; i++) {
            const to = hop(path, spots, i, card);
            const right: Array<number | 'nest'> = [];
            for (let t = 0; t < path.length; t++)
              if (judgeStone(path, spots, i, card, t) === 'next') right.push(t);
            if (judgeStone(path, spots, i, card, 'nest') === 'nest') right.push('nest');
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
        const dealt: Card[] = [];
        let player: 0 | 1 = 0;
        let turns = 0;
        while (!allHome(path, spots)) {
          const i = plan.owls === 1 ? 0 : owlOf(path, spots, player);
          const card = drawCardFor(plan, rng, path, spots, [i], dealt);
          dealt.push(card);
          const to = hop(path, spots, i, card);
          // Only an owl on a stone with no card left ahead may draw a card that flies it home.
          if (to >= path.length)
            expect(cardsFor(plan).every((c) => hop(path, spots, i, c) >= path.length)).toBe(true);
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

  describe('Color or shape (level 6)', () => {
    const plan = planFor(EITHER_LEVEL);

    it('sits in the preschool and pre-K ladders with three colors and three independent shapes', () => {
      expect(plan.mode).toBe('either');
      expect(plan.owls).toBe(1);
      expect(plan.colors).toBe(3);
      expect(plan.twinkle).toBe(false);
      expect(plan.safeCards).toBe(true);
      expect(LEVELS.preschool?.order).toEqual([1, 2, 6, 3]);
      expect(LEVELS.prek?.order).toEqual([2, 3, 6, 4, 7]);
    });

    it('shows all nine color-by-shape kinds, each color and shape at least twice, with no shared neighbor attribute', () => {
      const colors = STONE_COLORS.slice(0, plan.colors);
      const shapes = EITHER_SHAPES.slice(0, plan.colors);
      for (let seed = 1; seed <= 200; seed++) {
        const path = makePath(plan, new Rng(seed));
        expect(path).toHaveLength(plan.stones);
        // Every color and every shape appears at least twice.
        for (const c of colors) expect(path.filter((s) => s.color === c).length).toBeGreaterThanOrEqual(2);
        for (const sh of shapes) expect(path.filter((s) => s.shape === sh).length).toBeGreaterThanOrEqual(2);
        // Shape is independent of color: all nine combinations appear.
        const kinds = new Set(path.map((s) => `${s.color}:${s.shape}`));
        expect(kinds.size).toBe(9);
        // Neighbors share neither color nor shape.
        for (let i = 1; i < path.length; i++) {
          expect(path[i].color).not.toBe(path[i - 1].color);
          expect(path[i].shape).not.toBe(path[i - 1].shape);
        }
      }
    });

    it('matches by color on color cards and by shape on shape cards, and never deals three of one kind in a row', () => {
      expect(fits({ color: 'red', shape: 'star' }, 'red')).toBe(true);
      expect(fits({ color: 'red', shape: 'star' }, 'star')).toBe(true);
      expect(fits({ color: 'red', shape: 'star' }, 'blue')).toBe(false);
      expect(fits({ color: 'red', shape: 'star' }, 'heart')).toBe(false);
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const path = makePath(plan, rng);
        const spots: Spot[] = [-1];
        const dealt: Card[] = [];
        while (!allHome(path, spots)) {
          const card = drawCardFor(plan, rng, path, spots, [0], dealt);
          if (dealt.length >= 2) {
            const options = cardsFor(plan).filter((c) => hop(path, spots, 0, c) < path.length);
            const hasBoth = options.some(isShapeCard) && options.some((c) => !isShapeCard(c));
            const lastTwoSame = isShapeCard(dealt[dealt.length - 1]) === isShapeCard(dealt[dealt.length - 2]);
            if (hasBoth && lastTwoSame)
              expect(isShapeCard(card)).not.toBe(isShapeCard(dealt[dealt.length - 1]));
          }
          dealt.push(card);
          spots[0] = hop(path, spots, 0, card);
        }
      }
    });

    it('names the attribute that failed on a mismatch, never the other attribute', () => {
      const stone: Stone = { color: 'blue', shape: 'star' };
      expect(mismatchWords(plan, stone, 'heart')).toEqual({
        line: 'owl.not-shape',
        have: 'star',
        need: 'heart',
      });
      expect(mismatchWords(plan, stone, 'red')).toEqual({ line: 'owl.not-color', have: 'blue', need: 'red' });
      expect(cardName(plan, 'heart')).toBe('heart');
      expect(cardName(plan, 'red')).toBe('red stone');
      // On earlier color levels, the whole stone is still named.
      expect(mismatchWords(planFor(1), stone, 'red')).toEqual({
        line: 'owl.wrong-color',
        have: 'a blue star',
        need: 'red heart',
      });
    });
  });
});

describe("a grown-up in the pet's seat", () => {
  it('takes the hop on the right stone or the nest', () => {
    expect(seatStep('next', 1)).toBe('hop');
    expect(seatStep('nest', 1)).toBe('hop');
  });

  it('answers a wrong tap gently: a reason, then a glow, then the hop made together', () => {
    const wrong = ['mismatch', 'far', 'behind', 'occupied', 'early-nest'] as const;
    for (const v of wrong) {
      expect(seatStep(v, 1)).toBe('say');
      expect(seatStep(v, 2)).toBe('hint');
      expect(seatStep(v, 3)).toBe('together');
      expect(seatStep(v, 9)).toBe('together');
    }
  });
});

describe('Our two cards (level 7)', () => {
  const plan = planFor(7);
  /** A few boards: a start with every owl in the woods, then some walked-on spots, one owl home. */
  const boards = (seed: number) => {
    const rng = new Rng(seed);
    const path = makePath(plan, rng);
    const spots: Spot[] = [-1, rng.int(-1, 9), rng.chance(0.2) ? path.length : rng.int(-1, 12)];
    return { path, spots, rng };
  };

  it('tops pre-K and joins school after level 4, with level 4 unchanged', () => {
    expect(plan.mode).toBe('pairs');
    expect(plan.owls).toBe(3);
    expect(LEVELS.prek).toEqual({ min: 2, max: PAIRS_LEVEL, order: [2, 3, EITHER_LEVEL, 4, PAIRS_LEVEL] });
    expect(LEVELS.school).toEqual({ min: 4, max: CHECK_LEVEL, order: [4, PAIRS_LEVEL, CHECK_LEVEL] });
    expect(LEVELS.preschool?.max).toBe(EITHER_LEVEL);
  });

  it('bestPairs equals a brute-force search over every ordered assignment, and no other assignment ties it', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { path, spots, rng } = boards(seed);
      const cards = pairCards(plan, rng, path, spots);
      if (!cards) continue;
      const all = pairAssignments(path, spots);
      const totals = all.map((p) => assignTotal(path, spots, cards, p));
      const max = Math.max(...totals);
      const best = bestPairs(path, spots, cards);
      expect(best.length).toBeGreaterThan(0);
      for (const b of best) expect(assignTotal(path, spots, cards, b)).toBe(max);
      all.forEach((p, k) => {
        if (totals[k] < max) expect(best.some((b) => b[0] === p[0] && b[1] === p[1])).toBe(false);
      });
    }
  });

  it('draws two distinct cards with a real choice, deterministically, and none when fewer than two owls walk', () => {
    let spread = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { path, spots, rng } = boards(seed);
      const again = boards(seed);
      const cards = pairCards(plan, rng, path, spots);
      expect(pairCards(plan, again.rng, again.path, again.spots)).toEqual(cards);
      if (!cards) {
        expect(walkers(path, spots).length).toBeLessThan(2);
        continue;
      }
      expect(cards[0]).not.toBe(cards[1]);
      const gap =
        assignTotal(path, spots, cards, bestPairs(path, spots, cards)[0]) - worstPair(path, spots, cards);
      if (gap >= 2) spread++;
    }
    expect(spread).toBeGreaterThan(150);
    const { path } = boards(3);
    expect(pairCards(plan, new Rng(3), path, [path.length, path.length, 4])).toBeNull();
  });

  it('previews exactly where hop() lands, and one card alone sums to its own hops() entry', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { path, spots, rng } = boards(seed);
      const card = drawCard(plan, rng);
      hops(path, spots, card).forEach((n, i) => {
        if (spots[i] >= path.length) return;
        const p = previewFor(path, spots, card, i);
        expect(p.to).toBe(hop(path, spots, i, card));
        expect(p.count).toBe(n);
      });
    }
  });

  it('lets the second hop see where the first owl landed, so a shared stone is skipped', () => {
    const path = colorPath(['red', 'blue', 'red', 'blue', 'red', 'blue']);
    // Owls 0 and 1 are both in the woods; red then red sends them to stones 0 and 2.
    expect(assignTotal(path, [-1, -1, 5], ['red', 'red'], [0, 1])).toBe(1 + 3);
    // Card 0 first: owl 1 goes to red stone 0 first, then owl 0 takes the next red stone, 2.
    expect(assignTotal(path, [-1, -1, 5], ['red', 'red'], [1, 0])).toBe(1 + 3);
  });
});

describe('Check the helper (level 8)', () => {
  const plan = planFor(8);
  const boards = (seed: number) => {
    const rng = new Rng(seed);
    const path = makePath(plan, rng);
    const spots: Spot[] = [-1, rng.int(-1, 9), rng.chance(0.2) ? path.length : rng.int(-1, 12)];
    return { path, spots, rng };
  };

  it('is school only, the top of its window, on level 4’s board', () => {
    expect(plan.mode).toBe('check');
    expect(CHECK_LEVEL).toBe(8);
    expect([plan.owls, plan.colors, plan.stones]).toEqual([3, 4, 16]);
    expect(LEVELS.school?.max).toBe(8);
    expect(LEVELS.prek?.max).toBe(PAIRS_LEVEL);
  });

  it('proposes a farthest owl when asked for the best, and a shorter one otherwise, and says so when none is shorter', () => {
    let worseSeen = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { path, spots, rng } = boards(seed);
      const card = drawCard(plan, rng);
      const best = farthest(path, spots, card);
      if (!best.length) {
        expect(proposalFor(rng, path, spots, card, true)).toBeNull();
        continue;
      }
      expect(best).toContain(proposalFor(rng, path, spots, card, true));
      const worse = proposalFor(rng, path, spots, card, false)!;
      const walking = walkers(path, spots);
      if (walking.every((i) => best.includes(i))) expect(best).toContain(worse);
      else {
        worseSeen++;
        expect(best).not.toContain(worse);
        expect(walking).toContain(worse);
      }
    }
    expect(worseSeen).toBeGreaterThan(50);
  });

  it('is deterministic for a seed', () => {
    const a = boards(7);
    const b = boards(7);
    expect(proposalFor(a.rng, a.path, a.spots, 'red', false)).toBe(
      proposalFor(b.rng, b.path, b.spots, 'red', false),
    );
  });

  it('never makes three of one kind in a row, so a round holds both', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const kinds: boolean[] = [];
      for (let k = 0; k < 12; k++) kinds.push(nextProposalBest(rng, kinds));
      for (let k = 2; k < kinds.length; k++)
        expect(kinds[k] === kinds[k - 1] && kinds[k] === kinds[k - 2]).toBe(false);
      expect(kinds).toContain(true);
      expect(kinds).toContain(false);
    }
  });

  it('judges the final owl by how far it hops: any best owl is right, and the words say what she did', () => {
    const path = colorPath(['red', 'blue', 'red', 'green', 'red', 'blue']);
    // Owl 0 at -1 hops 1 to the red stone 0; owl 1 at 1 hops 1 to... red at 2; owl 2 at 3 hops 1 to red 4. All tie, so use blue.
    const spots = [-1, 0, 3];
    const best = farthest(path, spots, 'blue');
    const h = hops(path, spots, 'blue');
    const worse = [0, 1, 2].filter((i) => !best.includes(i) && h[i] > 0)[0];
    expect(worse).toBeDefined();
    const good = best[0];
    expect(judgeCheck(path, spots, 'blue', good, good)).toEqual({ right: true, result: 'agreed' });
    expect(judgeCheck(path, spots, 'blue', worse, good)).toEqual({ right: true, result: 'corrected' });
    expect(judgeCheck(path, spots, 'blue', worse, worse)).toEqual({ right: false, result: 'trusted-wrong' });
    expect(judgeCheck(path, spots, 'blue', good, worse)).toEqual({ right: false, result: 'spoiled' });
    const other = [0, 1, 2].find((i) => i !== worse && !best.includes(i) && h[i] > 0);
    if (other !== undefined)
      expect(judgeCheck(path, spots, 'blue', worse, other)).toEqual({ right: false, result: 'other-wrong' });
  });

  it('an owl is a miss exactly when it is outside farthest, over many boards', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { path, spots, rng } = boards(seed);
      const card = drawCard(plan, rng);
      const best = farthest(path, spots, card);
      for (const proposed of walkers(path, spots))
        for (const chosen of walkers(path, spots))
          expect(judgeCheck(path, spots, card, proposed, chosen).right).toBe(best.includes(chosen));
    }
  });
});
