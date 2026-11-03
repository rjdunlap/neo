import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { fits, hasChoice, makeScene, namedHintTarget, nextPair, nextRequest, pairPlacements, peekTouch, planFor, PLANS, spotFacing, whereIs, type PeekTouchFriend, type Where } from './logic';

describe('Peekaround Island', () => {
  it('demonstrates turning, choosing, and every requested placement without a wrong touch', () => {
    for (const mode of ['find', 'named', 'who'] as const) for (let seed = 1; seed <= 50; seed++) {
      const scene = makeScene(PLANS.find((p) => p.mode === mode)!, new Rng(seed));
      const hider = scene.friends[scene.hider];
      const friends: PeekTouchFriend[] = scene.friends.map((name, i) => ({ name, spot: spotFacing(scene.facing[i], 0) }));
      if (mode === 'who') expect(peekTouch(mode, 0, hider, friends)).toEqual({ kind: 'tile', name: hider });
      else {
        expect(peekTouch(mode, 0, hider, friends)).toEqual({ kind: 'turn', dir: 1 });
        expect(peekTouch(mode, 1, hider, friends)).toEqual({ kind: 'friend', name: hider });
      }
    }

    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let turns = 0;
      const friends: PeekTouchFriend[] = ['duck', 'pig', 'cat', 'bunny'].map((name) => ({ name: name as PeekTouchFriend['name'], spot: -1 }));
      for (let pair = 0; pair < 2; pair++) {
        const free = [0, 1, 2, 3].filter((spot) => !friends.some((f) => f.spot === spot));
        const [first, second] = nextPair(free, turns, rng);
        const waiting = friends.filter((f) => f.spot < 0).slice(0, 2);
        waiting[0].want = first.where;
        waiting[1].want = second.where;
        for (let n = 0; n < 2; n++) {
          const move = peekTouch('two', turns, null, friends);
          expect(move?.kind).toBe('place');
          if (move?.kind !== 'place') break;
          const friend = friends.find((f) => f.name === move.name)!;
          expect(fits(friend.want!, move.spot, turns)).toBe(true);
          friend.spot = move.spot;
          friend.want = undefined;
        }
        turns += 2;
      }
      expect(friends.every((f) => f.spot >= 0)).toBe(true);
    }
  });

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

  it('level 4: three friends, all three words, and every request leaves a spot that does not fit, whatever spot she picks', () => {
    expect(planFor(4)).toMatchObject({ mode: 'place', rounds: 3 });
    let paths = 0;
    // Walk every fitting spot she could take ("next to" fits either side), with the requests each seed makes.
    const walk = (seed: number, free: number[], asked: Where[]) => {
      if (asked.length === 3) {
        paths++;
        expect(new Set(asked)).toEqual(new Set(['front', 'behind', 'next']));
        expect(free).toHaveLength(1);
        return;
      }
      const req = nextRequest(free, 0, asked, new Rng(seed * 31 + asked.length));
      expect(fits(req.where, req.spot, 0)).toBe(true);
      expect(hasChoice(free, 0, req.where), `${asked.join(',')} then ${req.where} from ${free.join(',')}`).toBe(true);
      for (const s of free.filter((x) => fits(req.where, x, 0))) walk(seed, free.filter((x) => x !== s), [...asked, req.where]);
    };
    for (let seed = 1; seed <= 300; seed++) walk(seed, [0, 1, 2, 3], []);
    expect(paths).toBeGreaterThan(300);
  });

  it('level 5: each pair puts someone behind, leaves every friend a wrong spot, and the half turn always brings someone to the front', () => {
    expect(planFor(5)).toMatchObject({ mode: 'two', rounds: 2 });
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const walk = (free: number[], turns: number, pair: number) => {
        if (pair === 2) return expect(free).toHaveLength(0);
        const [a, b] = nextPair(free, turns, rng);
        expect(a.spot).not.toBe(b.spot);
        expect([a.where, b.where]).toContain('behind');
        expect(hasChoice(free, turns, a.where) && hasChoice(free, turns, b.where)).toBe(true);
        // Placing either friend first, at any fitting spot, still leaves a spot for the other.
        for (const [x, y] of [[a, b], [b, a]]) for (const s of free.filter((f) => fits(x.where, f, turns))) expect(free.some((f) => f !== s && fits(y.where, f, turns))).toBe(true);
        const ways = pairPlacements(free, turns, a.where, b.where);
        expect(ways.length).toBeGreaterThan(0);
        for (const way of ways) {
          const placed = [way.a, way.b];
          // The half turn: whoever went behind is in front now, so the pet always names someone.
          expect(placed.filter((s) => whereIs(s, turns + 2) === 'front')).toHaveLength(1);
          walk(way.left, turns + 2, pair + 1);
        }
      };
      walk([0, 1, 2, 3], 0, 0);
    }
  });

  it('level 2 hint: the arrows while the friend asked for is hidden, the friend once it is in view', () => {
    for (let turns = -4; turns <= 4; turns++) for (let spot = 0; spot < 4; spot++) {
      expect(namedHintTarget(spot, turns)).toBe(whereIs(spot, turns) === 'behind' ? 'arrows' : 'hider');
    }
    // The scene starts with the friend hidden, so a first hint points at the arrows; one turn brings it into view.
    const scene = makeScene(planFor(2), new Rng(7));
    const spot = spotFacing(scene.facing[scene.hider], 0);
    expect(namedHintTarget(spot, 0)).toBe('arrows');
    expect(namedHintTarget(spot, 1)).toBe('hider');
  });
});
