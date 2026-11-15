import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  friendsAfter,
  planFor,
  LEVELS,
  BARN_ASPECT,
  BITE,
  BITE_SIZES,
  ANIMALS,
  busyTouch,
  countedFood,
  eaterOf,
  farBarnAt,
  FAVORITE,
  FIRST_ANIMALS,
  poolFor,
  FRIEND_HIT,
  FRIEND_SCALE,
  friendFeet,
  friendXs,
  FOOD_WORDS,
  nearestFriend,
  shouldNudge,
  makeRounds,
  PLANS,
  SCENE_SPECS,
  SCENES,
  sceneFor,
  SOUND_WORDS,
  EATS,
  EATS_FOODS,
  NOT_EATS,
  eats,
  eatsTap,
  SOUNDERS,
  VOICE,
  snackTouch,
  soundDrop,
  soundHelp,
  type Food,
  type SnackTable,
} from './logic';

describe('Animal Snack', () => {
  it('gives every scene a backdrop and its own feeding spot, and only the dusk yard loses the sun', () => {
    expect(SCENES).toHaveLength(4);
    expect(new Set(SCENES.map((s) => SCENE_SPECS[s].spot)).size).toBe(SCENES.length);
    for (const s of SCENES) {
      const { backdrop, name } = SCENE_SPECS[s];
      expect(name).toBeTruthy();
      expect(backdrop.sky).toHaveLength(2);
      expect(backdrop.hills.length).toBeGreaterThanOrEqual(2);
      expect(backdrop.horizon).toBe(0.5);
      expect(backdrop.sun).toBe(s !== 'dusk');
    }
  });

  it('picks every scene across seeds, the same one for the same seed, without changing the rounds a seed deals', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const a = new Rng(seed);
      const b = new Rng(seed);
      const rounds = makeRounds(PLANS[2], a);
      expect(makeRounds(PLANS[2], b)).toEqual(rounds);
      const scene = sceneFor(a);
      seen.add(scene);
      expect(sceneFor(b)).toBe(scene);
    }
    expect(seen.size).toBe(SCENES.length);
  });

  it('gives every food a bite sound and three shrinking bites that end at nothing', () => {
    for (const a of ANIMALS) expect(BITE[FAVORITE[a]!]).toBeTruthy();
    expect(new Set(Object.values(BITE)).size).toBe(6);
    expect(BITE_SIZES).toHaveLength(3);
    expect(BITE_SIZES[BITE_SIZES.length - 1]).toBe(0);
    BITE_SIZES.forEach((s, i) => {
      if (i) expect(s).toBeLessThan(BITE_SIZES[i - 1]);
    });
  });

  it('names every drawn snack with a grammatical countable unit from one to six', () => {
    const expected: Record<Food, string[]> = {
      hay: ['bale of hay', 'bales of hay'],
      grass: ['tuft of grass', 'tufts of grass'],
      bone: ['bone', 'bones'],
      fish: ['fish', 'fish'],
      seeds: ['handful of seeds', 'handfuls of seeds'],
      apple: ['apple', 'apples'],
      honey: ['pot of honey', 'pots of honey'],
      oats: ['bucket of oats', 'buckets of oats'],
      corn: ['cob of corn', 'cobs of corn'],
      grain: ['ear of grain', 'ears of grain'],
    };
    for (const a of ANIMALS) {
      const food = FAVORITE[a]!;
      expect(FOOD_WORDS[food]).toBeTruthy();
      for (let n = 1; n <= 6; n++) expect(countedFood(food, n)).toBe(expected[food][n === 1 ? 0 : 1]);
    }
  });

  it('selects the closest body in overlapping hit areas and ignores distant touches', () => {
    const friends = [
      { x: 400, y: 400 },
      { x: 520, y: 400 },
      { x: 800, y: 400 },
    ];
    expect(nearestFriend(friends, 440, 400)).toBe(0);
    expect(nearestFriend(friends, 490, 400)).toBe(1);
    expect(nearestFriend(friends, 400, 500)).toBe(0);
    expect(nearestFriend(friends, 400, 515)).toBe(-1);
    expect(nearestFriend([], 400, 400)).toBe(-1);
  });

  it('nudges only idle free play, never eating, finished rounds or questions', () => {
    for (const plan of PLANS) {
      expect(shouldNudge(plan.mode, 5.9, false, false)).toBe(false);
      expect(shouldNudge(plan.mode, 6, false, false)).toBe(['munch', 'float'].includes(plan.mode));
      expect(shouldNudge(plan.mode, 60, true, false)).toBe(false);
      expect(shouldNudge(plan.mode, 60, false, true)).toBe(false);
    }
  });

  it('gives every animal a food, and only the sheep and the bunny share one (grass)', () => {
    expect(ANIMALS).toHaveLength(11);
    const byFood = new Map<string, string[]>();
    for (const a of ANIMALS) byFood.set(FAVORITE[a]!, [...(byFood.get(FAVORITE[a]!) ?? []), a]);
    const shared = [...byFood].filter(([, eaters]) => eaters.length > 1);
    expect(shared).toEqual([['grass', ['bunny', 'sheep']]]);
    for (const a of ANIMALS) {
      expect(VOICE[a], a).toBeTruthy();
      expect(BITE[FAVORITE[a]!], a).toBeTruthy();
    }
    expect(new Set(ANIMALS.map((a) => VOICE[a])).size).toBe(ANIMALS.length);
    expect(new Set(Object.values(SOUND_WORDS)).size).toBe(Object.keys(SOUND_WORDS).length);
  });

  it('never deals two animals with one favorite, so every snack has one eater present', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 400; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          expect(new Set(r.animals.map((a) => FAVORITE[a])).size, `${plan.mode} seed ${seed}`).toBe(
            r.animals.length,
          );
          expect(r.animals).toHaveLength(plan.animals);
          for (const a of r.animals) expect(eaterOf(FAVORITE[a]!, r.animals)).toBe(a);
        }
      }
    }
  });

  it('keeps levels 1 and 2 to the seven first animals, and brings all eleven from level 3 up', () => {
    const seen = new Map<number, Set<string>>();
    PLANS.forEach((plan, i) => {
      const s = new Set<string>();
      for (let seed = 1; seed <= 400; seed++)
        for (const r of makeRounds(plan, new Rng(seed))) r.animals.forEach((a) => s.add(a));
      seen.set(i + 1, s);
      expect(poolFor(plan).length, `level ${i + 1}'s pool is larger than its places`).toBeGreaterThan(
        plan.animals,
      );
    });
    for (const level of [1, 2]) expect([...seen.get(level)!].sort()).toEqual([...FIRST_ANIMALS].sort());
    for (const level of [3, 4, 5, 6]) expect(seen.get(level)!.size, `level ${level}`).toBe(11);
    // Level 7 deals only animals the EATS table speaks for: every one but the dog.
    expect(seen.get(7)!.size).toBe(10);
  });

  it('asks about an animal that is there, never the same one twice running, with 2 to 4 snacks to count', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        rounds.forEach((r, i) => {
          expect(r.animals).toHaveLength(plan.animals);
          expect(new Set(r.animals).size).toBe(plan.animals);
          if (plan.mode === 'who' || plan.mode === 'count') {
            expect(r.animals).toContain(r.ask);
            if (i > 0) expect(r.ask).not.toBe(rounds[i - 1].ask);
          }
          if (plan.mode === 'count')
            (expect(r.n).toBeGreaterThanOrEqual(2), expect(r.n).toBeLessThanOrEqual(4));
        });
      }
    }
  });
  it('the ghost finger plays every level through with no wrong animal, a count that is exactly right, and the bell only then', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        const free = plan.mode === 'munch' || plan.mode === 'float' || plan.mode === 'match';
        let index = 0;
        let eatenCount = 0;
        let touches = 0;
        // The table as the game builds it: free play and matching use one set of animals; questions deal new ones.
        const deal = (): SnackTable => {
          const r = rounds[Math.min(index, rounds.length - 1)];
          const friends = r.animals;
          const snacks: SnackTable['snacks'] =
            plan.mode === 'count'
              ? Array.from({ length: 5 }, () => ({ food: FAVORITE[r.ask!]!, eaten: false }))
              : plan.mode === 'float' || plan.mode === 'match' || plan.mode === 'sound'
                ? friends.map((a) => ({ food: FAVORITE[a]! as Food, eaten: false }))
                : [];
          return { friends, snacks, ask: r.ask, n: r.n, eatenCount, food: r.food, found: [] };
        };
        let table = deal();
        let done = false;
        while (!done) {
          expect(++touches, `${plan.mode} seed ${seed}: finishes`).toBeLessThan(60);
          table.eatenCount = eatenCount;
          const move = snackTouch(plan, table);
          expect(move, `${plan.mode} seed ${seed}: a touch to make`).not.toBeNull();
          if (move === 'bell') {
            expect(plan.mode).toBe('count');
            expect(
              table.snacks.filter((s) => s.eaten).length,
              'the bell rings on exactly the number asked for',
            ).toBe(table.n);
            index++;
            if (index >= rounds.length) done = true;
            else table = deal();
          } else if ('friend' in move!) {
            const name = table.friends[move.friend];
            if (plan.mode === 'eats') {
              expect(eatsTap(table.food!, name, table.found!), 'a new eater, never a miss').toBe('found');
              table.found!.push(name);
              if (table.found!.length === 2) {
                index++;
                if (index >= rounds.length) done = true;
                else table = deal();
              }
            } else if (plan.mode === 'who') {
              expect(name, 'the animal asked about').toBe(table.ask);
              index++;
              if (index >= rounds.length) done = true;
              else table = deal();
            } else {
              expect(plan.mode).toBe('munch');
              eatenCount++;
              if (eatenCount >= plan.rounds) done = true;
            }
          } else if ('snack' in move!) {
            const snack = table.snacks[move.snack];
            expect(snack.eaten).toBe(false);
            snack.eaten = true;
            if (plan.mode === 'float') {
              eatenCount++;
              if (eatenCount >= plan.rounds) done = true;
              else if (table.snacks.every((s) => s.eaten)) table = deal();
            } else expect(plan.mode).toBe('count');
          } else {
            const snack = table.snacks[move!.give];
            expect(['match', 'sound']).toContain(plan.mode);
            expect(table.friends[move!.to], 'the snack goes to the animal that eats it').toBe(
              eaterOf(snack.food, table.friends),
            );
            snack.eaten = true;
            if (plan.mode === 'sound') {
              expect(soundDrop(table.ask!, snack.food, table.friends[move!.to]), 'a yum, never a miss').toBe(
                'yum',
              );
              index++;
              if (index >= rounds.length) done = true;
              else table = deal();
            } else if (table.snacks.every((s) => s.eaten)) done = true;
          }
        }
        if (free && plan.mode !== 'match') expect(eatenCount).toBe(plan.rounds);
      }
    }
  });

  it('alternates food and sound questions in level 3, each clue naming exactly one animal present', () => {
    const plan = PLANS[2];
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRounds(plan, new Rng(seed));
      rounds.forEach((r, i) => {
        expect(r.by).toBe(i % 2 === 1 ? 'sound' : 'food');
        expect(r.animals).toContain(r.ask);
        expect(new Set(r.animals).size).toBe(plan.animals);
        if (i > 0) expect(r.ask).not.toBe(rounds[i - 1].ask);
        if (r.by === 'sound') {
          expect(SOUND_WORDS[r.ask!]).toBeTruthy();
          const same = r.animals.filter((a) => VOICE[a] === VOICE[r.ask!]);
          expect(same).toEqual([r.ask]);
        }
      });
    }
    expect(SOUNDERS.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps other modes free of sound questions and gives the bot the sound-asked animal', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'who' && p.mode !== 'sound'))
      expect(makeRounds(plan, new Rng(3)).every((r) => !r.by)).toBe(true);
    const r = makeRounds(PLANS[2], new Rng(9))[1];
    const table: SnackTable = { friends: r.animals, snacks: [], ask: r.ask, eatenCount: 0 };
    expect(snackTouch(PLANS[2], table)).toEqual({ friend: r.animals.indexOf(r.ask!) });
  });

  it('answers a busy touch with a poke or a wiggle that never feeds or counts', () => {
    const friend = Object.freeze({ friend: true as const });
    const snack = Object.freeze({ snack: Object.freeze({ eaten: false, visible: true }) });
    expect(busyTouch(false, false, friend)).toBeNull();
    expect(busyTouch(false, false, snack)).toBeNull();
    expect(busyTouch(true, false, friend)).toBe('poke');
    expect(busyTouch(true, false, snack)).toBe('wiggle');
    expect(busyTouch(true, true, friend)).toBeNull();
    expect(busyTouch(true, true, snack)).toBeNull();
    expect(busyTouch(true, false, { snack: { eaten: true, visible: true } })).toBeNull();
    expect(busyTouch(true, false, { snack: { eaten: false, visible: false } })).toBeNull();
    expect(snack.snack).toEqual({ eaten: false, visible: true });
  });

  // Logical views: iPad landscape, an iPad Air, a wide phone, iPad portrait and the tallest view before the turn prompt.
  const VIEWS = [
    [1024, 768],
    [1105, 768],
    [1365, 768],
    [1024, 1365],
    [1024, 1638],
  ] as const;
  const circleHitsRect = (
    cx: number,
    cy: number,
    r: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    const dx = cx - Math.max(x0, Math.min(cx, x1));
    const dy = cy - Math.max(y0, Math.min(cy, y1));
    return dx * dx + dy * dy < r * r;
  };

  it('stands a far barn, 60 to 80 tall, on the horizon of every scene but the orchard, at every view', () => {
    for (const scene of SCENES) {
      for (const [w, h] of VIEWS) {
        const barn = farBarnAt(scene, w, h, 3);
        if (scene === 'orchard') continue;
        expect(barn, `${scene} ${w}x${h}`).not.toBeNull();
        expect(barn!.height).toBeGreaterThanOrEqual(60);
        expect(barn!.height).toBeLessThanOrEqual(80);
        expect(barn!.base).toBe(h * SCENE_SPECS[scene].backdrop.horizon);
      }
    }
  });

  it('never puts the barn behind a friend, the orchard tree, the question bubble or the bell, or off the screen', () => {
    for (const scene of SCENES) {
      for (const [w, h] of VIEWS) {
        for (const n of [1, 2, 3]) {
          const barn = farBarnAt(scene, w, h, n);
          if (!barn) continue;
          const half = (barn.height * BARN_ASPECT) / 2 + 4; // the trim overhangs the walls by 4
          const [x0, x1, y0, y1] = [barn.x - half, barn.x + half, barn.base - barn.height - 3, barn.base];
          expect(x0).toBeGreaterThanOrEqual(0);
          expect(x1).toBeLessThanOrEqual(w);
          for (const fx of friendXs(n, w)) {
            const hit = circleHitsRect(
              fx,
              friendFeet(h) + FRIEND_HIT.y * FRIEND_SCALE,
              FRIEND_HIT.r * FRIEND_SCALE,
              x0,
              y0,
              x1,
              y1,
            );
            expect(hit, `${scene} ${w}x${h} n=${n}`).toBe(false);
          }
          if (scene === 'orchard') expect(x0 > 220 || x1 < 10).toBe(true);
          expect(y0).toBeGreaterThan(180); // the bubble (to y 180) and the bell (to y 166)
        }
      }
    }
  });

  it('shows the orchard its barn only when the tree leaves room beside the friends', () => {
    expect(farBarnAt('orchard', 1024, 768, 3)).toBeNull();
    const wide = farBarnAt('orchard', 1365, 768, 3);
    expect(wide).not.toBeNull();
    expect(wide!.x).toBeGreaterThan(1365 / 2);
  });

  it("opens lap's level 1 with one big animal, and its friends walk in after the second and fourth snacks", () => {
    const plan = planFor(1);
    expect(plan.oneBig).toBe(true);
    expect(plan.mode).toBe('munch');
    expect(LEVELS.toddler!.min, 'level 1 is lap-only, so it changes in place').toBeGreaterThan(1);
    expect([0, 1, 2, 3, 4, 5, 6].map((n) => friendsAfter(n))).toEqual([1, 1, 2, 2, 3, 3, 3]);
    expect(friendsAfter(plan.rounds - 2, plan.animals), 'all three are there before the last snacks').toBe(
      plan.animals,
    );
    for (let level = 2; level <= 5; level++) expect(planFor(level).oneBig).toBeFalsy();
  });

  it('feeds the nearest animal from a touch anywhere, however far away', () => {
    const bodies = [
      { x: 300, y: 400 },
      { x: 600, y: 400 },
    ];
    expect(nearestFriend(bodies, 20, 40), 'out of reach of a tap').toBe(-1);
    expect(nearestFriend(bodies, 20, 40, Infinity)).toBe(0);
    expect(nearestFriend(bodies, 1000, 900, Infinity)).toBe(1);
    expect(
      nearestFriend([{ x: 300, y: 400 }], 1000, 0, Infinity),
      'the big animal alone takes every touch',
    ).toBe(0);
  });

  it('asks Who says moo? at level 6: every question a sound that names exactly one animal present, never twice running', () => {
    const plan = planFor(6);
    expect(plan.mode).toBe('sound');
    expect(LEVELS.prek?.min).toBe(5);
    // Every voice is its own, so a sound picks out one animal whichever three are dealt.
    expect(new Set(ANIMALS.map((a) => VOICE[a])).size).toBe(ANIMALS.length);
    const asked = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = makeRounds(plan, new Rng(seed));
      expect(rounds).toHaveLength(plan.rounds);
      rounds.forEach((r, i) => {
        expect(r.by).toBe('sound');
        expect(new Set(r.animals).size).toBe(plan.animals);
        expect(r.animals).toContain(r.ask);
        expect(SOUND_WORDS[r.ask!], 'the bunny hop is never the clue').toBeTruthy();
        expect(r.animals.filter((a) => VOICE[a] === VOICE[r.ask!])).toEqual([r.ask]);
        // One snack per animal on the blanket, so the asked animal's own snack is there exactly once.
        const foods = r.animals.map((a) => FAVORITE[a]);
        expect(new Set(foods).size).toBe(plan.animals);
        expect(foods.filter((f) => f === FAVORITE[r.ask!])).toHaveLength(1);
        if (i > 0) expect(r.ask).not.toBe(rounds[i - 1].ask);
        asked.add(r.ask!);
      });
    }
    expect([...asked].sort()).toEqual([...SOUNDERS].sort());
  });

  it('judges a level 6 drop by the animal first, then the food', () => {
    expect(soundDrop('cow', 'hay', 'cow')).toBe('yum');
    expect(soundDrop('cow', 'apple', 'cow')).toBe('wrongFood');
    // The pig's own apple on the pig is still the wrong animal when the cow was asked for.
    expect(soundDrop('cow', 'apple', 'pig')).toBe('wrongAnimal');
    expect(soundDrop('cow', 'hay', 'pig')).toBe('wrongAnimal');
    for (const ask of SOUNDERS)
      for (const to of ANIMALS)
        for (const food of Object.values(FAVORITE) as Food[]) {
          const got = soundDrop(ask, food, to);
          expect(got === 'yum').toBe(to === ask && FAVORITE[ask] === food);
        }
  });

  it('glows the animal at the second miss of a level 6 question and its snack at the fourth', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(soundHelp)).toEqual([null, null, 'animal', null, 'snack', null, null]);
  });

  it('asks Who eats it too? at level 7: two eaters and one definite non-eater, never the same food twice running', () => {
    const plan = planFor(7);
    expect(plan.mode).toBe('eats');
    expect(LEVELS.prek).toEqual({ min: 5, max: 7 });
    const asked = new Set<Food>();
    for (let seed = 1; seed <= 400; seed++) {
      const rounds = makeRounds(plan, new Rng(seed));
      expect(rounds).toHaveLength(plan.rounds);
      rounds.forEach((r, i) => {
        const food = r.food!;
        expect(EATS_FOODS).toContain(food);
        expect(new Set(r.animals).size).toBe(3);
        expect(
          r.animals.filter((a) => eats(a, food)),
          'two answers',
        ).toHaveLength(2);
        const not = r.animals.find((a) => !eats(a, food))!;
        expect(NOT_EATS[food], 'the third is a definite non-eater').toContain(not);
        // The animal whose favorite it is, is always there and always an answer.
        expect(r.animals.some((a) => FAVORITE[a] === food)).toBe(true);
        if (i > 0) expect(food).not.toBe(rounds[i - 1].food);
        asked.add(food);
      });
    }
    expect([...asked].sort()).toEqual([...EATS_FOODS].sort());
  });

  it('keeps the EATS table honest: two or more eaters, a non-eater, no animal on both sides, favorites included', () => {
    for (const food of EATS_FOODS) {
      const yes = EATS[food]!;
      const no = NOT_EATS[food]!;
      expect(yes.length, food).toBeGreaterThanOrEqual(2);
      expect(no.length, food).toBeGreaterThanOrEqual(1);
      expect(
        yes.filter((a) => no.includes(a)),
        food,
      ).toEqual([]);
      for (const a of ANIMALS)
        if (FAVORITE[a] === food) expect(yes, `${a} eats its favorite ${food}`).toContain(a);
      expect(
        yes.some((a) => FAVORITE[a] === food),
        `${food} is somebody's favorite`,
      ).toBe(true);
    }
    // The cat is an obligate carnivore: fish is the only food it eats here.
    expect(EATS_FOODS.filter((f) => eats('cat', f))).toEqual(['fish']);
  });

  it('judges a level 7 tap: a new eater is found, a found one is no miss, a non-eater is a miss', () => {
    expect(eatsTap('hay', 'cow', [])).toBe('found');
    expect(eatsTap('hay', 'cow', ['cow'])).toBe('again');
    expect(eatsTap('hay', 'cat', ['cow'])).toBe('wrong');
    expect(eatsTap('fish', 'bear', ['cat'])).toBe('found');
    expect(eatsTap('fish', 'horse', [])).toBe('wrong');
  });
});
