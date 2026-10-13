import { blockTower } from './index';
import type { Container, Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeReachRounds, reachX, reachDrop, STAND_PAIRS, standVariant, makeStandRounds, StandObservation, compare, finish, makeRounds, makeStand, middleFrom, nextReach, PLANS, REACH, reached, reachSlot, SLOTS, stackMove, standingTower, targetFor, topples, W } from './logic';

describe('Block Tower', () => {
  it('preserves saved sticker drawings for seeds 0–99 before puzzle RNG changes', () => {
    const fingerprint = (node: Container): unknown => ({
      x: node.x, y: node.y, scale: [node.scale.x, node.scale.y],
      drawing: 'context' in node ? (node as Graphics).context.instructions.map(i => {
        if (i.action === 'texture') throw new Error('Tower stickers stay code-drawn');
        return { action: i.action, path: i.data.path.instructions,
        style: { color: i.data.style.color, width: 'width' in i.data.style ? i.data.style.width : undefined },
      }; }) : [],
      children: node.children.map(fingerprint),
    });
    expect(Array.from({ length: 100 }, (_, seed) => {
      const art = blockTower.sticker(seed);
      const result = JSON.stringify(fingerprint(art));
      art.destroy({ children: true });
      return [...result].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
    })).toMatchSnapshot();
  });

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

  it('uses a bounded height deck even when random draws always pick the same card', () => {
    const rng = new Rng(1);
    let draws = 0;
    rng.next = () => { draws++; return 0; };
    for (const mode of ['flag', 'match'] as const) {
      draws = 0;
      const rounds = makeRounds({ mode, name: '', rounds: 12 }, rng);
      const heights = rounds.map(r => r.bear ?? r.target);
      for (let i = 0; i < heights.length; i += 4) expect(new Set(heights.slice(i, i + 4)).size).toBe(4);
      heights.slice(1).forEach((h, i) => expect(h).not.toBe(heights[i]));
      expect(draws).toBe(14); // friends (3), relations (2), three four-card decks (9)
    }
  });

  it('covers every reference height with distinct three-task decks and all comparison relations', () => {
    for (const level of [3, 4]) {
      const seen = new Set<number>();
      for (let seed = 0; seed < 200; seed++) {
        const rounds = makeRounds(PLANS[level - 1], new Rng(seed));
        expect(rounds).toEqual(makeRounds(PLANS[level - 1], new Rng(seed)));
        const heights = rounds.map(r => r.bear ?? r.target);
        expect(new Set(heights).size).toBe(3);
        heights.forEach(h => { expect([3, 4, 5, 6]).toContain(h); seen.add(h); });
        if (level === 4) expect(rounds.map(r => r.ask).sort()).toEqual(['same', 'shorter', 'taller']);
      }
      expect([...seen].sort()).toEqual([3, 4, 5, 6]);
    }
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

  it('proves every authored variant and its unsupported group witness', () => {
    let sides = 0, left = 0;
    for (const pair of STAND_PAIRS) for (const direction of [-1, 1]) for (const side of [0, 1]) {
      const r = standVariant(pair, direction, side);
      sides += side; left += direction === -1 ? 1 : 0;
      expect(standingTower(r)).toBe(side);
      const down = r.towers[1 - side];
      expect(topples(down, null)).toBe(pair.fall);
      expect(Math.abs(middleFrom(down, pair.fall) - down[pair.fall - 1])).toBeGreaterThanOrEqual(W / 2);
      expect(r.towers.every(t => Math.sign(t[2]) === direction)).toBe(true);
      if (pair.id.startsWith('M')) expect(r.towers[0][2]).toBe(r.towers[1][2]);
    }
    expect([sides, left]).toEqual([14, 14]);
    expect(topples(STAND_PAIRS[5].down, null)).toBe(2);
    expect(middleFrom(STAND_PAIRS[6].down, 1)).toBe(W / 2);
  });

  it('deals bounded, reproducible band-appropriate pairs and independent balanced presentation', () => {
    for (const school of [false, true]) for (let seed = 0; seed < 300; seed++) {
      const rounds = makeStandRounds(new Rng(seed), school);
      expect(rounds).toEqual(makeStandRounds(new Rng(seed), school));
      expect(new Set(rounds.map(r => r.id)).size).toBe(3);
      expect(rounds.slice(0, 2).every(r => r.id.startsWith('C'))).toBe(true);
      expect(rounds[2].id.startsWith(school ? 'M' : 'C')).toBe(true);
      for (const values of [rounds.map(r => r.stands), rounds.map(r => r.direction)]) expect(new Set(values).size).toBe(2);
      expect(rounds.every(r => r.color >= 0 && r.color <= 6)).toBe(true);
    }
    const rng = new Rng(1); let draws = 0;
    rng.next = () => { draws++; return 0; };
    expect(makeStandRounds(rng, true)).toHaveLength(3);
    expect(draws).toBe(12);
  });

  it('keeps replay frozen, records only completed observations and completes once', () => {
    const rng = new Rng(81), rounds = makeStandRounds(rng, true), after = rng.clone();
    const state = new StandObservation();
    expect(state.continue()).toBe(false);
    for (const pair of rounds) {
      const frozen = JSON.stringify(pair);
      expect(state.release(1 - pair.stands)).toBe(true);
      expect(state.release(pair.stands)).toBe(false);
      expect(state.continue()).toBe(false);
      state.settle();
      for (let repeat = 0; repeat < 5; repeat++) {
        const guess = state.guess;
        expect(state.replay()).toBe(true);
        expect(state.replay()).toBe(false);
        expect(state.continue()).toBe(false);
        state.settle();
        expect(state.guess).toBe(guess);
        expect(JSON.stringify(pair)).toBe(frozen);
      }
      expect(state.continue()).toBe(true);
      expect(state.continue()).toBe(false);
    }
    expect(state.observed).toBe(3);
    expect(state.phase).toBe('complete');
    expect(state.replay()).toBe(false);
    expect(state.release(0)).toBe(false);
    expect(rng.next()).toBe(after.next());
  });

  it('deals both frozen side orders with unchanged task budgets and targets', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const rounds = makeReachRounds(new Rng(seed));
      expect(rounds).toEqual(makeReachRounds(new Rng(seed)));
      expect(rounds.map(({ blocks, star }) => ({ blocks, star }))).toEqual(REACH);
      expect(rounds.map(r => r.direction).sort()).toEqual([-1, 1]);
      expect(Object.isFrozen(rounds) && rounds.every(Object.isFrozen)).toBe(true);
      seen.add(rounds.map(r => r.direction).join(','));
    }
    expect(seen.size).toBe(2);
  });

  it('reflects the entire offered drop domain before half-slot rounding and clamping', () => {
    for (const direction of [1, -1] as const) {
      for (let u = -16; u <= 12.875; u += 0.125) {
        const screen = reachX(u, 500, 104, direction);
        expect(reachDrop(screen, 500, 104, direction)).toBe(u > 12.8 ? null : reachSlot(u));
      }
      expect(reachDrop(reachX(-16.125, 500, 104, direction), 500, 104, direction)).toBeNull();
      expect(reachDrop(reachX(-2.5, 500, 104, direction), 500, 104, direction)).toBe(-2);
      expect(topples([0], 0, direction)).toBe(0);
      expect(topples([-direction], 0, direction)).toBe(-1);
      expect(topples([0, 4 * direction], null, direction)).toBe(1);
      expect(topples([-2, 0, 1].map(x => x * direction), 0, direction)).toBe(-1);
    }
  });

  it('preserves mirror failure indices, reach, solver and reachable help for every offered prefix', () => {
    for (const round of REACH) {
      const visit = (xs: number[]) => {
        const fall = topples(xs, 0);
        expect(topples(xs.map(x => -x), 0, -1)).toBe(fall);
        const way = finish(xs, round);
        // The game stores canonical middles on either side, bottom first.
        const leftPhysical = xs.map(x => -x);
        const leftCanonical = leftPhysical.map(x => -x);
        expect(finish(leftCanonical, round)).toEqual(way);
        expect(nextReach(leftCanonical, round)).toBe(way?.[0]);
        if (fall !== -1) expect(way).toBeNull();
        else if (reached(xs, round.star)) expect(way).toEqual([]);
        if (way) {
          const prefix = [...xs];
          for (const x of way) {
            expect(SLOTS).toContain(x);
            prefix.push(x);
            expect(topples(prefix, 0)).toBe(-1);
            expect(topples(prefix.map(x => -x), 0, -1)).toBe(-1);
            for (const direction of [1, -1] as const) {
              expect(reachDrop(reachX(x, 500, 104, direction), 500, 104, direction)).toBe(x);
            }
          }
          expect(reached(prefix, round.star)).toBe(true);
          expect(prefix.some(x => -x - W / 2 <= -round.star)).toBe(true);
        } else if (fall === -1) {
          const recovery = [...xs];
          while (!finish(recovery, round) && recovery.length) recovery.pop();
          expect(finish(recovery, round)).not.toBeNull();
        }
        if (xs.length < round.blocks) for (const x of SLOTS) visit([...xs, x]);
      };
      visit([]);
    }
    expect(finish([-2, 1], REACH[1])).toEqual([]); // Early success remains accepted.
  });

  it('snaps every offered drop to the solver domain, including the formerly extra right slots', () => {
    expect(SLOTS).toEqual(Array.from({ length: 21 }, (_, i) => i - 12));
    for (const slot of SLOTS) expect(reachSlot(slot)).toBe(slot);
    for (let x = -16; x <= 12.8; x += 0.125) expect(SLOTS).toContain(reachSlot(x));
    expect(reachSlot(9)).toBe(8);
    expect(reachSlot(10)).toBe(8);
    expect(reachSlot(-16)).toBe(-12);
    expect(reachSlot(-2.2)).toBe(-2);
    for (const round of REACH) for (const x of SLOTS) {
      const way = finish([x], round);
      if (!way) continue;
      const prefix = [x];
      for (const next of way) {
        expect(reachSlot(next)).toBe(next);
        prefix.push(next);
        expect(topples(prefix, 0)).toBe(-1);
      }
      expect(reached(prefix, round.star)).toBe(true);
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
