import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BARN_ASPECT, BITE, BITE_SIZES, ANIMALS, busyTouch, countedFood, eaterOf, farBarnAt, FAVORITE, FRIEND_HIT, FRIEND_SCALE, friendFeet, friendXs, FOOD_WORDS, nearestFriend, shouldNudge, makeRounds, PLANS, SCENE_SPECS, SCENES, sceneFor, SOUND_WORDS, SOUNDERS, VOICE, snackTouch, type Food, type SnackTable } from './logic';

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
    BITE_SIZES.forEach((s, i) => { if (i) expect(s).toBeLessThan(BITE_SIZES[i - 1]); });
  });

  it('names every drawn snack with a grammatical countable unit from one to six', () => {
    const expected: Record<Food, string[]> = {
      hay: ['bale of hay', 'bales of hay'], carrot: ['carrot', 'carrots'], bone: ['bone', 'bones'],
      fish: ['fish', 'fish'], seeds: ['handful of seeds', 'handfuls of seeds'],
      apple: ['apple', 'apples'], honey: ['pot of honey', 'pots of honey'],
    };
    for (const a of ANIMALS) {
      const food = FAVORITE[a]!;
      expect(FOOD_WORDS[food]).toBeTruthy();
      for (let n = 1; n <= 6; n++) expect(countedFood(food, n)).toBe(expected[food][n === 1 ? 0 : 1]);
    }
  });

  it('selects the closest body in overlapping hit areas and ignores distant touches', () => {
    const friends = [{ x: 400, y: 400 }, { x: 520, y: 400 }, { x: 800, y: 400 }];
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

  it('gives every animal its own food, so each snack has one eater', () => {
    const foods = ANIMALS.map((a) => FAVORITE[a]!);
    expect(new Set(foods).size).toBe(foods.length);
    for (const a of ANIMALS) expect(eaterOf(FAVORITE[a]!)).toBe(a);
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
          if (plan.mode === 'count') expect(r.n).toBeGreaterThanOrEqual(2), expect(r.n).toBeLessThanOrEqual(4);
        });
      }
    }
  });
  it("the ghost finger plays every level through with no wrong animal, a count that is exactly right, and the bell only then", () => {
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
          const snacks: SnackTable['snacks'] = plan.mode === 'count' ? Array.from({ length: 5 }, () => ({ food: FAVORITE[r.ask!]!, eaten: false })) : plan.mode === 'float' || plan.mode === 'match' ? friends.map((a) => ({ food: FAVORITE[a]! as Food, eaten: false })) : [];
          return { friends, snacks, ask: r.ask, n: r.n, eatenCount };
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
            expect(table.snacks.filter((s) => s.eaten).length, 'the bell rings on exactly the number asked for').toBe(table.n);
            index++;
            if (index >= rounds.length) done = true; else table = deal();
          } else if ('friend' in move!) {
            const name = table.friends[move.friend];
            if (plan.mode === 'who') {
              expect(name, 'the animal asked about').toBe(table.ask);
              index++;
              if (index >= rounds.length) done = true; else table = deal();
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
            expect(plan.mode).toBe('match');
            expect(table.friends[move!.to], 'the snack goes to the animal that eats it').toBe(eaterOf(snack.food));
            snack.eaten = true;
            if (table.snacks.every((s) => s.eaten)) done = true;
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
    for (const plan of PLANS.filter((p) => p.mode !== 'who')) expect(makeRounds(plan, new Rng(3)).every((r) => !r.by)).toBe(true);
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
  const VIEWS = [[1024, 768], [1105, 768], [1365, 768], [1024, 1365], [1024, 1638]] as const;
  const circleHitsRect = (cx: number, cy: number, r: number, x0: number, y0: number, x1: number, y1: number) => {
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
            const hit = circleHitsRect(fx, friendFeet(h) + FRIEND_HIT.y * FRIEND_SCALE, FRIEND_HIT.r * FRIEND_SCALE, x0, y0, x1, y1);
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
});

