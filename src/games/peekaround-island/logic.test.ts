import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  canSee,
  fits,
  islandArrangement,
  lookalike,
  makeSkyScene,
  mapPoint,
  skyArrangement,
  skyFacing,
  type SkyKind,
  frontAfterHalfTurn,
  hasChoice,
  makeScene,
  makeSeeScene,
  makeViewScene,
  namedHintTarget,
  nextPair,
  nextRequest,
  pairPlacements,
  peekTouch,
  planFor,
  PLANS,
  seeFacings,
  spotFacing,
  turnToFront,
  viewFacings,
  viewFrom,
  whereIs,
  type PeekTouchFriend,
  type Where,
} from './logic';

describe('Peekaround Island', () => {
  it('demonstrates turning, choosing, and every requested placement without a wrong touch', () => {
    for (const mode of ['find', 'named', 'who'] as const)
      for (let seed = 1; seed <= 50; seed++) {
        const scene = makeScene(
          PLANS.find((p) => p.mode === mode)!,
          new Rng(seed),
        );
        const hider = scene.friends[scene.hider];
        const friends: PeekTouchFriend[] = scene.friends.map((name, i) => ({
          name,
          spot: spotFacing(scene.facing[i], 0),
        }));
        if (mode === 'who') expect(peekTouch(mode, 0, hider, friends)).toEqual({ kind: 'tile', name: hider });
        else {
          expect(peekTouch(mode, 0, hider, friends)).toEqual({ kind: 'turn', dir: 1 });
          expect(peekTouch(mode, 1, hider, friends)).toEqual({ kind: 'friend', name: hider });
        }
      }

    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let turns = 0;
      const friends: PeekTouchFriend[] = ['duck', 'pig', 'cat', 'bunny'].map((name) => ({
        name: name as PeekTouchFriend['name'],
        spot: -1,
      }));
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
        // Before the half turn she predicts who will be in front: the bot taps the picture of the friend behind.
        const predict = peekTouch('two', turns, null, friends, true);
        const behind = friends.find((f) => f.spot >= 0 && whereIs(f.spot, turns) === 'behind')!;
        expect(predict).toEqual({ kind: 'tile', name: behind.name });
        turns += 2;
        expect(whereIs(behind.spot, turns)).toBe('front');
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
    for (let turns = -5; turns <= 5; turns++)
      for (let f = 0; f < 4; f++)
        expect(whereIs(spotFacing(f, turns), turns)).toBe(f === 0 ? 'front' : f === 2 ? 'behind' : 'next');
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
      expect(
        hasChoice(free, 0, req.where),
        `${asked.join(',')} then ${req.where} from ${free.join(',')}`,
      ).toBe(true);
      for (const s of free.filter((x) => fits(req.where, x, 0)))
        walk(
          seed,
          free.filter((x) => x !== s),
          [...asked, req.where],
        );
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
        for (const [x, y] of [
          [a, b],
          [b, a],
        ])
          for (const s of free.filter((f) => fits(x.where, f, turns)))
            expect(free.some((f) => f !== s && fits(y.where, f, turns))).toBe(true);
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

  it('level 5 prediction: the friend in front after the half turn is the one behind before it', () => {
    for (let turns = -4; turns <= 4; turns++) {
      const friends = [0, 1, 2, 3].map((spot) => ({ spot }));
      const before = frontAfterHalfTurn(friends, turns)!;
      expect(whereIs(before.spot, turns)).toBe('behind');
      const after = friends.find((f) => whereIs(f.spot, turns + 2) === 'front')!;
      expect(after).toBe(before);
      // Only friends on the island count; a shore friend (spot -1) never answers.
      expect(frontAfterHalfTurn([{ spot: -1 }], turns)).toBeNull();
    }
    expect(planFor(5).name).toMatch(/who will be in front/);
  });

  it('level 2 hint: the arrows while the friend asked for is hidden, the friend once it is in view', () => {
    for (let turns = -4; turns <= 4; turns++)
      for (let spot = 0; spot < 4; spot++) {
        expect(namedHintTarget(spot, turns)).toBe(whereIs(spot, turns) === 'behind' ? 'arrows' : 'hider');
      }
    // The scene starts with the friend hidden, so a first hint points at the arrows; one turn brings it into view.
    const scene = makeScene(planFor(2), new Rng(7));
    const spot = spotFacing(scene.facing[scene.hider], 0);
    expect(namedHintTarget(spot, 0)).toBe('arrows');
    expect(namedHintTarget(spot, 1)).toBe('hider');
  });

  it('turns any spot to the front the short way', () => {
    for (let turns = -6; turns <= 6; turns++)
      for (let spot = 0; spot < 4; spot++) {
        const d = turnToFront(spot, turns);
        expect(whereIs(spot, turns + d)).toBe('front');
        expect(Math.abs(d)).toBeLessThanOrEqual(2);
        if (whereIs(spot, turns) === 'next') expect(Math.abs(d)).toBe(1);
      }
  });

  it("level 6: exactly one friend can't see the picture, she can always tap them, and turning shows why", () => {
    expect(planFor(6).mode).toBe('see');
    const pictureSpots = new Set<number>();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let turns = rng.int(0, 3);
      const facings = seeFacings(rng);
      expect([...facings].sort()).toEqual([1, 2, 3]);
      let last: PeekTouchFriend['name'] | undefined;
      for (const facing of facings) {
        const scene = makeSeeScene(facing, rng, last);
        const picture = spotFacing(scene.picture, turns);
        pictureSpots.add(picture);
        const friends: PeekTouchFriend[] = scene.friends.map((name, i) => ({
          name,
          spot: spotFacing(scene.facing[i], turns),
        }));
        const blocked = friends[scene.blocked];
        expect(blocked.name).not.toBe(last);
        expect(new Set(friends.map((f) => f.spot)).size).toBe(friends.length);
        expect(friends.some((f) => f.spot === picture)).toBe(false);
        // Only the friend across the tree is blocked; every wrong friend can be tapped and can see it.
        expect(friends.filter((f) => !canSee(picture, f.spot))).toEqual([blocked]);
        const wrong = friends.filter((f) => f !== blocked);
        expect(wrong.length).toBeGreaterThan(0);
        for (const f of friends) expect(whereIs(f.spot, turns)).not.toBe('behind');
        expect(peekTouch('see', turns, blocked.name, friends)).toEqual({
          kind: 'friend',
          name: blocked.name,
        });
        // A wrong friend turned to the front sees the picture plainly, and the blocked friend stays tappable.
        for (const f of wrong) {
          const after = turns + turnToFront(f.spot, turns);
          expect(whereIs(picture, after)).not.toBe('behind');
          expect(whereIs(blocked.spot, after)).not.toBe('behind');
          expect(peekTouch('see', after, blocked.name, friends)).toEqual({
            kind: 'friend',
            name: blocked.name,
          });
        }
        // From the blocked friend's side, the picture is behind the tree.
        turns += turnToFront(blocked.spot, turns);
        expect(whereIs(picture, turns)).toBe('behind');
        last = blocked.name;
      }
    }
    // The picture's island spot takes all four places over many rounds.
    expect([...pictureSpots].sort()).toEqual([0, 1, 2, 3]);
  });

  describe('level 7, what does the duck see', () => {
    it('names a friend at the side, with three friends round the tree and her own side empty', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const order = viewFacings(rng);
        expect(order).toHaveLength(planFor(7).rounds);
        expect(order).toContain(1);
        expect(order).toContain(3);
        let last: string | undefined;
        for (const facing of order) {
          const scene = makeViewScene(facing, rng, last as never);
          expect(new Set(scene.friends).size).toBe(3);
          expect([...scene.facing].sort()).toEqual([1, 2, 3]);
          expect([1, 3]).toContain(scene.facing[scene.viewer]);
          expect(scene.friends[scene.viewer]).not.toBe(last);
          last = scene.friends[scene.viewer];
        }
      }
    });

    it('shows three different pictures, one from each friend, with the named friend never in their own', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const turns = rng.int(0, 3);
        const scene = makeViewScene(rng.pick([1, 3]), rng);
        const friends = scene.friends.map((name, i) => ({ name, spot: spotFacing(scene.facing[i], turns) }));
        const views = friends.map((f) => viewFrom(f.spot, friends));
        expect(new Set(views.map((v) => JSON.stringify(v))).size).toBe(3);
        // The flowers nearest each side differ, whoever stands where.
        expect(new Set(views.map((v) => v.right)).size).toBe(3);
        friends.forEach((f, i) => {
          expect(views[i].friends.map((x) => x.name)).not.toContain(f.name);
          expect(views[i].friends).toHaveLength(2);
        });
        // From her own side the named friend stands next to the tree, so where it is can be seen.
        expect(whereIs(friends[scene.viewer].spot, turns)).toBe('next');
      }
    });

    it('matches the island: a picture from a side is what she sees once that side turns to the front', () => {
      const friends = [
        { name: 'duck' as const, spot: 1 },
        { name: 'cow' as const, spot: 2 },
        { name: 'pig' as const, spot: 3 },
      ];
      for (const f of friends) {
        const turns = turnToFront(f.spot, 0);
        expect(whereIs(f.spot, turns)).toBe('front');
        for (const other of viewFrom(f.spot, friends).friends) {
          const spot = friends.find((x) => x.name === other.name)!.spot;
          expect(other.facing === 2).toBe(whereIs(spot, turns) === 'behind');
        }
      }
      // The duck on spot 1 sees the cow on its right, and the pig across the tree is hidden.
      expect(viewFrom(1, friends)).toEqual({
        left: 0,
        right: 1,
        friends: [
          { name: 'cow', facing: 1 },
          { name: 'pig', facing: 2 },
        ],
      });
    });

    it("demonstrates by tapping the named friend's picture", () => {
      const scene = makeViewScene(1, new Rng(7));
      const friends: PeekTouchFriend[] = scene.friends.map((name, i) => ({
        name,
        spot: spotFacing(scene.facing[i], 0),
      }));
      expect(peekTouch('view', 0, scene.friends[scene.viewer], friends)).toEqual({
        kind: 'tile',
        name: scene.friends[scene.viewer],
      });
    });
  });

  describe('level 8, from the sky', () => {
    const KINDS: SkyKind[] = ['true', 'mirror', 'turned'];
    const rounds = function* () {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let last: ReturnType<typeof makeSkyScene>['friends'][number] | undefined;
        for (let index = 0; index < 3; index++) {
          const scene = makeSkyScene(index, rng, last);
          const prev = last;
          if (scene.hidden !== null) last = scene.friends[scene.hidden];
          yield { index, scene, prev };
        }
      }
    };
    const placed = (s: ReturnType<typeof makeSkyScene>) =>
      s.friends.map((name, i) => ({ name, facing: s.facing[i] }));

    it('shows three different maps and exactly one is the island itself, at any turns', () => {
      for (const { scene } of rounds()) {
        expect([...scene.maps].sort()).toEqual([...KINDS].sort());
        for (const turns of [0, 1, 3]) {
          const arr = Object.fromEntries(
            KINDS.map((k) => [k, skyArrangement(k, scene.k, placed(scene), turns)]),
          );
          expect(arr.true).not.toEqual(arr.mirror);
          expect(arr.true).not.toEqual(arr.turned);
          expect(arr.mirror).not.toEqual(arr.turned);
          const island = islandArrangement(
            scene.friends.map((name, i) => ({ name, spot: spotFacing(scene.facing[i], turns) })),
            turns,
          );
          expect(KINDS.filter((k) => JSON.stringify(arr[k]) === JSON.stringify(island))).toEqual(['true']);
        }
      }
    });

    it('puts front at the bottom, behind at the top, right and left on their sides', () => {
      for (const { scene } of rounds())
        for (const f of placed(scene)) {
          const p = mapPoint(skyFacing('true', f.facing, scene.k), 100);
          if (f.facing === 0) expect(p.y).toBeGreaterThan(0);
          if (f.facing === 2) expect(p.y).toBeLessThan(0);
          if (f.facing === 1) expect(p.x).toBeGreaterThan(0);
          if (f.facing === 3) expect(p.x).toBeLessThan(0);
        }
      const p = mapPoint(1.5, 10);
      expect(p.x).toBeCloseTo(Math.sin((1.5 * Math.PI) / 2) * 10);
      expect(p.y).toBeCloseTo(Math.cos((1.5 * Math.PI) / 2) * 10);
    });

    it('mirrors only left and right, and turns every facing by k', () => {
      for (const k of [1, 3])
        for (const f of [0, 1, 2, 3]) {
          expect(skyFacing('mirror', f, k)).toBe(f === 1 ? 3 : f === 3 ? 1 : f);
          expect(skyFacing('turned', f, k)).toBe((f + k) % 4);
          expect(skyFacing('turned', f + 0.5, k)).toBeCloseTo((f + 0.5 + k) % 4);
        }
      for (const { scene } of rounds()) {
        expect([1, 3]).toContain(scene.k);
        const t = skyArrangement('turned', scene.k, placed(scene));
        expect(t.flowers).toEqual([0, 1, 2, 3].map((i) => (i + 0.5 + scene.k) % 4));
      }
    });

    it('builds the three scenes the plan describes', () => {
      for (const { index, scene, prev } of rounds()) {
        expect(new Set(scene.friends).size).toBe(scene.friends.length);
        expect(scene.friends.length).toBe(scene.facing.length);
        if (index === 0) {
          expect(scene.hidden).toBeNull();
          expect([...scene.facing].sort()).toEqual([0, 1, 3]);
        } else {
          expect(scene.hidden).not.toBeNull();
          expect(scene.facing.filter((f) => f === 2)).toHaveLength(1);
          expect(scene.facing[scene.hidden!]).toBe(2);
          expect(scene.facing).toContain(0);
          if (index === 1) expect(scene.facing.filter((f) => f === 1 || f === 3)).toHaveLength(1);
          else expect([...scene.facing].sort()).toEqual([0, 1, 2, 3]);
          if (prev) expect(scene.friends[scene.hidden!]).not.toBe(prev);
        }
        if (index === 2) expect(scene.friends).toHaveLength(4);
        for (const a of scene.friends)
          for (const b of scene.friends) expect(a !== b && lookalike(a, b)).toBe(false);
        expect(scene.friends).not.toEqual(expect.arrayContaining(['cow', 'bunny']));
        expect(scene.friends).not.toEqual(expect.arrayContaining(['dog', 'bear']));
      }
    });

    it('is repeatable for a seed', () => {
      expect(makeSkyScene(2, new Rng(9), 'cat')).toEqual(makeSkyScene(2, new Rng(9), 'cat'));
    });

    it('turning the island k quarter turns gives the turned map', () => {
      for (const { scene } of rounds())
        for (const turns of [0, 2]) {
          const spots = scene.friends.map((name, i) => ({ name, spot: spotFacing(scene.facing[i], turns) }));
          expect(islandArrangement(spots, turns + scene.k)).toEqual(
            skyArrangement('turned', scene.k, placed(scene), turns),
          );
        }
    });

    it('leads to the true map and is level 8', () => {
      for (const { scene } of rounds())
        expect(peekTouch('sky', 0, null, [], false, scene.maps)).toEqual({
          kind: 'map',
          index: scene.maps.indexOf('true'),
        });
      expect(planFor(8).mode).toBe('sky');
    });
  });
});
