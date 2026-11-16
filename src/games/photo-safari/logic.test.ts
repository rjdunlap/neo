import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { photoSafari } from './index';
import { firstLevel, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  BIG_LEVEL,
  BIG_PLAN,
  LEVELS,
  bigFriends,
  CHANGED_PLAN,
  TRUE_PLAN,
  WHO_DOING_PLAN,
  planFor,
  TELL_WHICH_PLAN,
  TELL_BOTH_PLAN,
  chipsFor,
  chipPhrase,
  fits,
  fewestChips,
  judgeTell,
  sameChip,
  tellHint,
  toggleChip,
  ACTIONS,
  animalToTap,
  describe,
  makeScene,
  matches,
  PLANS,
  request,
  nearestSighting,
  sightingPositions,
  MYSTERY_PLAN,
  BEST_PLAN,
  SPOTS,
  ANIMALS,
  answer,
  ask,
  bestQuestions,
  botMove,
  guess,
  mysteryChips,
  makeMysteryScene,
  split,
  startMystery,
  unhelpful,
  type MysteryPlay,
} from './logic';
import {
  TODDLER_ACTIONS,
  actionsAt,
  changeScene,
  claimTruths,
  stillLine,
  changeLine,
  sentence,
  SPOTS as SPOT_LIST,
  PLACE_WORDS,
  type Spot,
} from './logic';

group('Photo Safari', () => {
  it('level 13 opens lap with one big friend per photo, six different friends, and any touch is right', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG_PLAN);
    expect(BIG_PLAN).toMatchObject({ mode: 'snap', big: true, photos: 6, animals: 1 });
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 1, 2]);
    expect(firstLevel(LEVELS.lap!, [12, BIG_LEVEL])).toBe(BIG_LEVEL);
    expect(firstLevel(LEVELS.toddler!, [12, BIG_LEVEL])).toBe(1);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BIG_LEVEL);
    for (let seed = 1; seed <= 200; seed++) {
      const friends = bigFriends(new Rng(seed));
      expect(friends).toHaveLength(BIG_PLAN.photos);
      // Six photos, six different friends, each doing something seen at a glance (nobody needs the pond).
      expect(new Set(friends.map((f) => f.animal)).size).toBe(BIG_PLAN.photos);
      for (const f of friends) expect(TODDLER_ACTIONS).toContain(f.action);
      for (let round = 0; round < BIG_PLAN.photos; round++) {
        const scene = makeScene(BIG_PLAN, new Rng(seed), round);
        expect(scene.sightings).toHaveLength(1);
        expect(scene.target).toBe(-1);
        expect(animalToTap(scene, round)).toBe(0);
      }
    }
  });

  it('always has exactly one animal matching the request, with distinct spots in the original modes', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        expect(scene.sightings).toHaveLength(plan.animals);
        if (plan.mode !== 'clues' && plan.mode !== 'both')
          expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(plan.animals);
        if (plan.mode === 'snap') {
          expect(scene.target).toBe(-1);
          continue;
        }
        const t = scene.sightings[scene.target];
        expect(scene.sightings.filter((s) => matches(plan.mode, s, t))).toHaveLength(1);
      }
    }
  });

  it('makes the extra words matter: distractors share the animal', () => {
    let shared = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const plan = PLANS.find((p) => p.mode === 'where')!;
      const scene = makeScene(plan, new Rng(seed));
      const t = scene.sightings[scene.target];
      shared += scene.sightings.filter((s) => s !== t && s.animal === t.animal).length;
    }
    expect(shared).toBeGreaterThan(100);
  });

  it('level 5 needs action and place together even when the animal name is known', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scene = makeScene(PLANS[4], new Rng(seed));
      expect(makeScene(PLANS[4], new Rng(seed))).toEqual(scene);
      const t = scene.sightings[scene.target];
      expect(scene.sightings.every((s) => s.animal === t.animal)).toBe(true);
      expect(scene.sightings.filter((s) => matches('doing', s, t))).toHaveLength(2);
      expect(scene.sightings.filter((s) => matches('where', s, t))).toHaveLength(2);
      expect(scene.sightings.filter((s) => matches('both', s, t))).toEqual([t]);
      expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(2);
      expect(request('both', scene)).toBe(describe('both', t));
    }
  });

  it('requires both clues with exactly one action-only, place-only and neither distractor', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scene = makeScene(PLANS[6], new Rng(seed));
      expect(makeScene(PLANS[6], new Rng(seed))).toEqual(scene);
      const t = scene.sightings[scene.target];
      expect(scene.sightings.filter((s) => s.action === t.action)).toHaveLength(2);
      expect(scene.sightings.filter((s) => s.spot === t.spot)).toHaveLength(2);
      expect(scene.sightings.filter((s) => matches('clues', s, t))).toEqual([t]);
      expect(request('clues', scene)).toBe(describe('clues', t));
      expect(request('clues', scene)).toMatch(/^the animal /);
      expect(request('clues', scene)).not.toContain(t.animal);
    }
  });

  it('keeps shared actors 150 units apart and gives each a 100-unit nearest-target area after resizing', () => {
    for (const plan of [PLANS[4], PLANS[6]])
      for (let seed = 1; seed <= 100; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        for (const [w, h] of [
          [1024, 768],
          [1366, 768],
          [1024, 1366],
          [1180, 820],
        ]) {
          const positions = sightingPositions(scene.sightings, w, h);
          positions.forEach((p, i) => {
            expect(p.x).toBeGreaterThanOrEqual(150);
            expect(p.x).toBeLessThanOrEqual(w - 95);
            expect(p.y - 155).toBeGreaterThan(150);
            for (let j = i + 1; j < positions.length; j++)
              expect(Math.hypot(p.x - positions[j].x, p.y - positions[j].y)).toBeGreaterThanOrEqual(150);
            // Body centre and the entire boundary of a 100-unit target, even in the overlapping circles.
            for (const radius of [0, 50, 75])
              for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const point = { x: p.x + radius * Math.cos(angle), y: p.y - 60 + radius * Math.sin(angle) };
                expect(nearestSighting(positions, point)).toBe(i);
                const reverse = [...positions].reverse();
                expect(nearestSighting(reverse, point)).toBe(positions.length - 1 - i);
              }
          });
          expect(nearestSighting(positions, { x: 0, y: 0 })).toBe(-1);
        }
      }
  });

  it('keeps swimming in water across every mode while offering every action', () => {
    for (const plan of PLANS) {
      const seen = new Set<string>();
      const targets = new Set<string>();
      for (let seed = 1; seed <= 500; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        for (const s of scene.sightings) {
          if (s.action === 'swimming') expect(s.spot).toBe('pond');
          seen.add(s.action);
        }
        if (scene.target >= 0) targets.add(scene.sightings[scene.target].action);
      }
      // Two-place conjunctions cannot repeat pond-only swimming at a dry place.
      const expected = ACTIONS.filter((a) => a !== 'swimming' || !['both', 'clues'].includes(plan.mode));
      expect([...seen].sort()).toEqual([...expected].sort());
      if (plan.mode !== 'snap') expect([...targets].sort()).toEqual([...expected].sort());
    }
  });

  it('describes sightings in words', () => {
    const s = { animal: 'bunny' as const, action: 'jumping' as const, spot: 'bush' as const };
    expect(describe('who', s)).toBe('the bunny');
    expect(describe('doing', s)).toBe('the bunny jumping');
    expect(describe('where', s)).toBe('the bunny behind the bush');
    expect(describe('both', s)).toBe('the bunny jumping behind the bush');
    expect(describe('clues', s)).toBe('the animal jumping behind the bush');
  });

  it('not levels: everyone else does the same thing, and only the one asked for does something else', () => {
    const plan = PLANS.find((p) => p.mode === 'not')!;
    for (let seed = 1; seed <= 200; seed++) {
      const scene = makeScene(plan, new Rng(seed));
      const others = scene.sightings.filter((_, i) => i !== scene.target);
      expect(others.every((s) => s.action === scene.notAction)).toBe(true);
      expect(scene.sightings[scene.target].action).not.toBe(scene.notAction);
      expect(request('not', scene)).toBe(`the animal that is not ${scene.notAction}`);
    }
  });

  it("gives the ghost finger's bot the one animal asked for, or each animal in turn when any photo will do", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        const seen = new Set<number>();
        for (let photos = 0; photos < plan.photos; photos++) {
          const i = animalToTap(scene, photos);
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(scene.sightings.length);
          seen.add(i);
          if (plan.mode !== 'snap')
            expect(scene.sightings.filter((s) => matches(plan.mode, s, scene.sightings[i]))).toHaveLength(1);
        }
        expect(seen.size).toBe(plan.mode === 'snap' ? Math.min(plan.photos, plan.animals) : 1);
      }
    }
  });
});

group('telling a listener', () => {
  it('preserves IDs, reserved gaps and school difficulty order', () => {
    for (let i = 1; i <= 7; i++) expect(planFor(i)).toBe(PLANS[i - 1]);
    expect(planFor(8)).toBe(CHANGED_PLAN);
    expect(planFor(9)).toBe(TRUE_PLAN);
    expect(planFor(12)).toBe(WHO_DOING_PLAN);
    expect(planFor(10)).toBe(TELL_WHICH_PLAN);
    expect(planFor(11)).toBe(TELL_BOTH_PLAN);
    const range = photoSafari.levels('school');
    expect(range).toEqual({ min: 4, max: 15, order: [4, 5, 6, 7, 8, 9, 10, 11, 14, 15] });
    expect(stepLevel(7, 1, range)).toBe(8);
    expect(stepLevel(10, -1, range)).toBe(9);
    expect(stepLevel(11, 1, range)).toBe(14);
    expect(stepLevel(14, 1, range)).toBe(15);
    expect(stepLevel(14, -1, range)).toBe(11);
    expect(planFor(14)).toBe(MYSTERY_PLAN);
    expect(planFor(15)).toBe(BEST_PLAN);
    expect(photoSafari.levels('lap')).toEqual({ min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1, 2] });
    expect(photoSafari.levels('toddler')).toEqual({ min: 1, max: 12, order: [1, 2, 12] });
    expect(photoSafari.levels('preschool')).toEqual({ min: 2, max: 4 });
    expect(photoSafari.levels('prek')).toEqual({ min: 3, max: 5 });
    expect(photoSafari.describeLevel(14)).toBe(MYSTERY_PLAN.name);
    expect(photoSafari.describeLevel(15)).toBe(BEST_PLAN.name);
  });
  it('speaks doing words before place words regardless of selection order', () => {
    expect(
      chipPhrase([
        { kind: 'spot', value: 'pond' },
        { kind: 'action', value: 'jumping' },
      ]),
    ).toBe('jumping in the pond');
  });
  for (const level of [10, 11])
    it(`level ${level}: fair scenes, all descriptions, solver and supported revision over 250 seeds`, () => {
      const uniqueKinds = new Set<string>();
      const seenResults = new Set<string>();
      for (let seed = 1; seed <= 250; seed++) {
        const rng = new Rng(seed),
          scene = makeScene(planFor(level), rng),
          chips = chipsFor(scene, rng);
        expect(makeScene(planFor(level), new Rng(seed))).toEqual(scene);
        expect(scene.sightings).toHaveLength(level === 10 ? 3 : 4);
        expect(new Set(scene.sightings.map((s) => s.animal)).size).toBe(scene.sightings.length);
        expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(2);
        expect(new Set(scene.sightings.map((s) => s.action)).size).toBe(2);
        expect(scene.sightings.some((s) => s.action === 'swimming')).toBe(false);
        expect(chips).toHaveLength(4);
        expect(chips.every((c) => scene.sightings.some((s) => s[c.kind] === c.value))).toBe(true);
        const singles = chips.filter((c) => judgeTell([c], scene).result === 'right');
        expect(singles).toHaveLength(level === 10 ? 1 : 0);
        singles.forEach((c) => uniqueKinds.add(c.kind));
        if (level === 11) for (const c of chips) expect(fits([c], scene.sightings)).toHaveLength(2);
        expect(
          chips.some((c) => {
            const f = fits([c], scene.sightings);
            return f.length === 2 && f.includes(scene.target);
          }),
        ).toBe(true);
        const solver = fewestChips(scene);
        expect(solver).toHaveLength(level === 10 ? 1 : 2);
        expect(judgeTell(solver, scene).result).toBe('right');
        const pairs = chips
          .filter((c) => c.kind === 'action')
          .flatMap((a) => chips.filter((c) => c.kind === 'spot').map((b) => [a, b]));
        expect(pairs.filter((p) => judgeTell(p, scene).result === 'right')).toHaveLength(1);
        const sets = [[], ...chips.map((c) => [c]), ...pairs];
        expect(sets).toHaveLength(9);
        for (const chosen of sets) {
          // Independent truth table, including empty words and surplus truthful words.
          const found = scene.sightings.flatMap((s, i) =>
            chosen.every((c) => s[c.kind] === c.value) ? [i] : [],
          );
          const expected = !chosen.length
            ? 'empty'
            : !found.length
              ? 'nobody'
              : found.includes(scene.target)
                ? found.length === 1
                  ? 'right'
                  : 'too-little'
                : found.length === 1
                  ? 'other'
                  : 'other-many';
          const judged = judgeTell(chosen, scene);
          expect(judged).toEqual({ result: expected, fits: found });
          seenResults.add(expected);
          if (expected === 'too-little' || expected === 'other-many') expect(found).toHaveLength(2);
          const hint = tellHint(chosen, scene);
          expect(judgeTell([...hint.chosen, ...hint.glow], scene).result).toBe('right');
          expect(hint.glow.every((c) => !hint.chosen.some((k) => sameChip(c, k)))).toBe(true);
          for (const chip of chips) {
            const toggled = toggleChip(chosen, chip);
            expect(new Set(toggled.map((c) => c.kind)).size).toBe(toggled.length);
            expect(toggled.some((c) => sameChip(c, chip))).toBe(!chosen.some((c) => sameChip(c, chip)));
          }
        }
        for (const [w, h] of [
          [1024, 768],
          [1024, 1365],
        ]) {
          const ground = Math.min(h * 0.78, h - 200);
          const points = sightingPositions(scene.sightings, w, h, ground);
          points.forEach((p, i) => {
            expect(p.y).toBeLessThan(h - 138);
            for (const q of points.slice(i + 1))
              expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(150);
          });
        }
      }
      expect([...seenResults].sort()).toEqual(
        (level === 10
          ? ['empty', 'right', 'too-little', 'other', 'other-many', 'nobody']
          : ['empty', 'right', 'too-little', 'other', 'other-many']
        ).sort(),
      );
      if (level === 10) expect([...uniqueKinds].sort()).toEqual(['action', 'spot']);
    });
});

group('Photo Safari levels 8, 9 and 12 rules', () => {
  const SEEDS = 400;
  const diffKeys = (
    a: { animal: string; action: string; spot: string },
    b: { animal: string; action: string; spot: string },
  ) => (['animal', 'action', 'spot'] as const).filter((k) => a[k] !== b[k]);

  it('act: three friends, three places, three toddler actions, the doing word alone decides', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const scene = makeScene(WHO_DOING_PLAN, new Rng(seed));
      expect(makeScene(WHO_DOING_PLAN, new Rng(seed))).toEqual(scene);
      expect(scene.sightings).toHaveLength(3);
      expect(new Set(scene.sightings.map((s) => s.animal)).size).toBe(3);
      expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(3);
      const actions = scene.sightings.map((s) => s.action);
      expect(new Set(actions).size).toBe(3);
      expect(actions.every((a) => TODDLER_ACTIONS.includes(a))).toBe(true);
      const t = scene.sightings[scene.target];
      expect(scene.sightings.filter((s) => matches('act', s, t))).toHaveLength(1);
      expect(request('act', scene)).toBe(t.action);
    }
  });

  it('changed: exactly one friend changes exactly one thing, and every sighting stays sensible', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (let round = 0; round < 4; round++) {
        const scene = makeScene(CHANGED_PLAN, new Rng(seed), round);
        expect(makeScene(CHANGED_PLAN, new Rng(seed), round)).toEqual(scene);
        const before = scene.before!;
        expect(before).toHaveLength(3);
        expect(new Set(before.map((s) => s.animal)).size).toBe(3);
        expect(new Set(before.map((s) => s.spot)).size).toBe(3);
        before.forEach((s) => expect(actionsAt(s.spot)).toContain(s.action));
        expect(scene.sightings).toHaveLength(3);
        const changedIdx = scene.sightings.flatMap((s, i) => (diffKeys(s, before[i]).length ? [i] : []));
        expect(changedIdx).toEqual([scene.target]);
        const diff = diffKeys(scene.sightings[scene.target], before[scene.target]);
        expect(diff).toEqual([scene.change]);
        scene.sightings.forEach((s, i) => {
          expect(s.animal).toBe(before[i].animal);
          expect(actionsAt(s.spot)).toContain(s.action);
        });
        if (round < 2) expect(scene.change).toBe('action');
        else {
          const free = SPOTS_FREE(before);
          const canMove = before.some((b) => actionsAt(free).includes(b.action));
          expect(scene.change).toBe(canMove ? 'spot' : 'action');
          if (scene.change === 'spot') expect(scene.sightings[scene.target].spot).toBe(free);
        }
        kinds.add(`${round}:${scene.change}`);
        const was = before[scene.target],
          now = scene.sightings[scene.target];
        const line = changeLine(scene);
        expect(line).toContain(now.animal);
        if (scene.change === 'spot') {
          expect(line).toContain(PLACE_WORDS[was.spot]);
          expect(line).toContain(PLACE_WORDS[now.spot]);
        } else {
          expect(line).toContain(was.action);
          expect(line).toContain(now.action);
        }
        scene.sightings.forEach((_, i) => {
          const still = stillLine(scene, i);
          expect(still).toContain('still');
          expect(still).toContain(scene.sightings[i].animal);
        });
      }
    }
    expect(kinds.has('2:spot')).toBe(true);
    expect(kinds.has('0:action')).toBe(true);
  });

  it('changed: a swimmer is never moved off the pond, and changeScene falls back to an action change', () => {
    const before = [
      { animal: 'duck', action: 'swimming', spot: 'pond' },
      { animal: 'cat', action: 'sleeping', spot: 'tree' },
      { animal: 'dog', action: 'eating', spot: 'bush' },
    ] as const;
    for (let seed = 1; seed <= 200; seed++) {
      const s = changeScene([...before], 'spot', new Rng(seed));
      expect(s.change).toBe('spot');
      expect(s.sightings[s.target].spot).toBe('rock');
      expect(s.target).not.toBe(0);
    }
    const allSwim = [
      { animal: 'duck', action: 'swimming', spot: 'pond' },
      { animal: 'cat', action: 'swimming', spot: 'pond' },
    ] as const;
    expect(allSwim.length).toBe(2);
  });

  it('true: two true and two false claims per round, the named animal is unambiguous, falsehoods are off by one sensible thing', () => {
    const falseKinds = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const truths = claimTruths(new Rng(seed));
      expect(truths.filter(Boolean)).toHaveLength(2);
      expect(truths.filter((t) => !t)).toHaveLength(2);
      expect(claimTruths(new Rng(seed))).toEqual(truths);
      for (const truthy of truths) {
        const scene = makeScene(TRUE_PLAN, new Rng(seed), 0, truthy);
        expect(makeScene(TRUE_PLAN, new Rng(seed), 0, truthy)).toEqual(scene);
        expect(scene.truthy).toBe(truthy);
        const t = scene.sightings[scene.target],
          claim = scene.claim!;
        expect(scene.sightings).toHaveLength(3);
        expect(new Set(scene.sightings.map((s) => s.animal)).size).toBe(3);
        expect(claim.animal).toBe(t.animal);
        expect(scene.sightings.filter((s) => matches('true', s, claim))).toHaveLength(1);
        expect(actionsAt(claim.spot)).toContain(claim.action);
        expect(request('true', scene)).toBe(sentence(claim));
        const diff = diffKeys(claim, t);
        if (truthy) expect(claim).toEqual(t);
        else {
          expect(diff).toHaveLength(1);
          expect(['action', 'spot']).toContain(diff[0]);
          falseKinds.add(diff[0]);
        }
      }
    }
    expect([...falseKinds].sort()).toEqual(['action', 'spot']);
  });
});

const SPOTS_FREE = (before: { spot: Spot }[]): Spot =>
  SPOT_LIST.find((s) => !before.some((b) => b.spot === s))!;

group('mystery friend (14–15)', () => {
  const SEEDS = 300;
  const mk = (level: number, seed: number) => {
    const scene = makeMysteryScene(planFor(level), new Rng(seed));
    return { scene, play: startMystery(scene) };
  };
  const chipsOf = (scene: ReturnType<typeof makeMysteryScene>) => mysteryChips(scene);
  const sc = (level: number, seed: number) => makeScene(planFor(level), new Rng(seed));

  for (const level of [14, 15]) {
    const places = level === 15 ? 3 : 2;
    it(`level ${level}: makeScene is deterministic and every action x place pair appears once`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const scene = sc(level, seed);
        expect(sc(level, seed)).toEqual(scene);
        expect(scene.sightings).toHaveLength(places * 2);
        const pairs = scene.sightings.map((s) => `${s.action}/${s.spot}`);
        expect(new Set(pairs).size).toBe(pairs.length);
        expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(places);
        expect(new Set(scene.sightings.map((s) => s.action)).size).toBe(2);
        expect(new Set(scene.sightings.map((s) => s.animal)).size).toBe(scene.sightings.length);
        for (const s of scene.sightings) {
          expect(s.action).not.toBe('swimming');
          expect(SPOTS).toContain(s.spot);
        }
        expect(scene.target).toBeGreaterThanOrEqual(0);
        expect(scene.target).toBeLessThan(scene.sightings.length);
      }
    });

    it(`level ${level}: every friend can be singled out by doing and place questions, and answer matches the secret`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { scene } = mk(level, seed);
        const chips = chipsOf(scene);
        for (const c of chips) {
          const t = scene.sightings[scene.target];
          expect(answer(c, scene)).toBe(c.kind === 'action' ? t.action === c.value : t.spot === c.value);
        }
        for (let target = 0; target < scene.sightings.length; target++) {
          const t = { ...scene, target };
          let left = scene.sightings.map((_, i) => i);
          for (const c of chips) {
            const { yes, no } = split(c, left, t);
            left = answer(c, t) ? yes : no;
          }
          expect(left).toEqual([target]);
        }
      }
    });

    it(`level ${level}: best questions are never unhelpful, minimise imbalance, and always make progress`, () => {
      // Explore every reachable remaining set with the asked chips that led there.
      for (let seed = 1; seed <= 40; seed++) {
        const { scene } = mk(level, seed);
        const chips = chipsOf(scene);
        const visit = (remaining: number[], asked: typeof chips) => {
          if (remaining.length < 2) return;
          const open = chips.filter((c) => !asked.includes(c));
          const helpful = open.filter((c) => !unhelpful(c, remaining, scene));
          const gap = (c: (typeof chips)[number]) => {
            const s = split(c, remaining, scene);
            return Math.abs(s.yes.length - s.no.length);
          };
          const best = bestQuestions(chips, remaining, scene, asked);
          // 5: at least one best chip while 2+ remain, and it leaves fewer friends either way.
          expect(best.length).toBeGreaterThan(0);
          const least = Math.min(...helpful.map(gap));
          for (const b of best) {
            expect(unhelpful(b, remaining, scene)).toBe(false);
            expect(asked).not.toContain(b);
            expect(gap(b)).toBe(least);
            const s = split(b, remaining, scene);
            expect(s.yes.length).toBeLessThan(remaining.length);
            expect(s.no.length).toBeLessThan(remaining.length);
          }
          for (const c of helpful) {
            expect(gap(c)).toBeGreaterThanOrEqual(least);
          }
          for (const c of open) {
            const s = split(c, remaining, scene);
            // 6: unhelpful exactly when one side is empty.
            expect(unhelpful(c, remaining, scene)).toBe(!s.yes.length || !s.no.length);
            if (unhelpful(c, remaining, scene)) continue;
            visit(s.yes, [...asked, c]);
            visit(s.no, [...asked, c]);
          }
        };
        visit(
          scene.sightings.map((_, i) => i),
          [],
        );
      }
    });
  }

  it('level 15: on the full board the best questions are the two doing words (3/3) and each place splits 2/4', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { scene, play } = mk(15, seed);
      const best = bestQuestions(play.chips, play.remaining, scene);
      expect(best).toHaveLength(2);
      expect(best.every((c) => c.kind === 'action')).toBe(true);
      for (const c of play.chips) {
        const s = split(c, play.remaining, scene);
        if (c.kind === 'action') expect([s.yes.length, s.no.length]).toEqual([3, 3]);
        else expect([s.yes.length, s.no.length]).toEqual([2, 4]);
      }
    }
  });

  for (const level of [14, 15]) {
    it(`level ${level}: botMove finishes within 3 questions plus the snap`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { scene, play } = mk(level, seed);
        let questions = 0;
        for (let step = 0; step < 10 && play.remaining.length > 1; step++) {
          const move = botMove(play);
          if ('chip' in move) {
            questions++;
            expect(ask(play, move.chip).kind).toBe('narrowed');
          } else guess(play, move.friend);
        }
        expect(questions).toBeLessThanOrEqual(3);
        expect(play.remaining).toEqual([scene.target]);
        expect(botMove(play)).toEqual({ friend: scene.target });
        expect(guess(play, scene.target).kind).toBe('snap');
        expect(play.misses).toBe(0);
        expect(play.hints).toBe(0);
      }
    });

    it(`level ${level}: a random policy of chips and guesses always finishes and the secret stays standing`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { scene, play } = mk(level, seed);
        const rng = new Rng(seed * 7 + 1);
        for (let step = 0; step < 200 && play.remaining.length > 1; step++) {
          if (rng.int(0, 2) === 0) guess(play, rng.int(0, scene.sightings.length - 1));
          else ask(play, play.chips[rng.int(0, play.chips.length - 1)]);
          expect(play.remaining).toContain(scene.target);
        }
        expect(play.remaining).toEqual([scene.target]);
      }
    });

    it(`level ${level}: accounting for questions and guesses`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { scene, play } = mk(level, seed);
        const wrong = () => play.remaining.filter((i) => i !== scene.target);
        // Repeat counts nothing.
        const c0 = play.chips[0];
        const first = ask(play, c0);
        expect(first.kind).toBe('narrowed');
        const again = ask(play, c0);
        expect(again.kind).toBe('repeat');
        expect(play.asked).toHaveLength(1);
        expect(play.misses).toBe(0);
        expect(play.hints).toBe(0);
        // Unhelpful: repeat the same asked chip does not count; use fresh unhelpful chips.
        const fresh = play.chips.filter((c) => !play.asked.some((a) => a.chip === c));
        const unh = fresh.filter((c) => unhelpful(c, play.remaining, scene));
        if (unh.length >= 2) {
          const a = ask(play, unh[0]);
          expect(a).toMatchObject({ kind: 'unhelpful', glow: false });
          expect(play.hints).toBe(0);
          const b = ask(play, unh[1]);
          expect(b).toMatchObject({ kind: 'unhelpful', glow: true });
          expect(play.hints).toBe(1);
          expect(play.misses).toBe(0);
          if (unh.length > 2) {
            expect(ask(play, unh[2])).toMatchObject({ kind: 'unhelpful', glow: false });
            expect(play.hints).toBe(1);
          }
        }
        // Wrong guesses with 3+ standing.
        const m0 = play.misses;
        let guesses = 0;
        let wrongSeen = 0;
        while (play.remaining.length >= 3) {
          const out = guess(play, wrong()[0]);
          expect(out.kind).toBe('wrong-guess');
          wrongSeen++;
          guesses++;
          expect(play.misses).toBe(m0 + guesses);
          if (out.kind === 'wrong-guess') expect(out.glow).toBe(wrongSeen === 2);
          expect(play.remaining).toContain(scene.target);
        }
        expect(play.hints).toBe((unh.length >= 2 ? 1 : 0) + (wrongSeen >= 2 ? 1 : 0));
        // Two standing: a wrong guess is fair, no miss.
        expect(play.remaining).toHaveLength(2);
        const missesBefore = play.misses;
        const hintsBefore = play.hints;
        expect(guess(play, wrong()[0]).kind).toBe('not-it');
        expect(play.misses).toBe(missesBefore);
        expect(play.hints).toBe(hintsBefore);
        expect(play.remaining).toEqual([scene.target]);
      }
    });
  }

  it('the second wrong guess among 3+ adds exactly one hint, once', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { scene, play } = mk(15, seed);
      const wrong = () => play.remaining.filter((i) => i !== scene.target);
      expect(guess(play, wrong()[0]).kind).toBe('wrong-guess');
      expect(play.hints).toBe(0);
      expect(guess(play, wrong()[0])).toMatchObject({ kind: 'wrong-guess', glow: true });
      expect(play.hints).toBe(1);
      expect(guess(play, wrong()[0])).toMatchObject({ kind: 'wrong-guess', glow: false });
      expect(play.hints).toBe(1);
      expect(play.misses).toBe(3);
    }
  });

  it('a lucky guess of the secret is found and adds nothing; a gone friend is a repeat', () => {
    for (const level of [14, 15])
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { scene, play } = mk(level, seed);
        const other = play.remaining.find((i) => i !== scene.target)!;
        expect(guess(play, other).kind).toBe('wrong-guess');
        expect(guess(play, other).kind).toBe('repeat');
        expect(play.misses).toBe(1);
        const m = play.misses;
        expect(guess(play, scene.target).kind).toBe('found');
        expect(play.misses).toBe(m);
        expect(play.hints).toBe(0);
        expect(play.remaining).toEqual([scene.target]);
      }
  });

  it('a narrowing question never counts a miss or hint', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { scene, play } = mk(15, seed);
      for (const c of play.chips) {
        const p: MysteryPlay = startMystery(scene);
        const out = ask(p, c, true);
        expect(out.kind).toBe('narrowed');
        expect(p.misses).toBe(0);
        expect(p.hints).toBe(0);
        expect(p.remaining).toContain(scene.target);
      }
    }
  });

  it('level 15: the better-question note only follows a weaker question, at most once, and never counts', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { scene } = mk(15, seed);
      const p = startMystery(scene);
      const place = p.chips.find((c) => c.kind === 'spot')!;
      const out = ask(p, place, true);
      expect(out.kind).toBe('narrowed');
      // A place sends two home (a "no") or four (a "yes"); only two is fewer than a doing word's sure three.
      const weaker = out.kind === 'narrowed' && out.gone.length < 3;
      if (out.kind === 'narrowed') {
        if (weaker) expect(out.better).toEqual({ n: 2, m: 3, kind: 'action' });
        else expect(out.better).toBeUndefined();
      }
      expect(p.noted).toBe(weaker);
      if (!weaker) continue;
      const again = ask(
        p,
        p.chips.find((c) => c.kind === 'spot' && !p.asked.some((a) => a.chip === c)) ?? place,
        true,
      );
      if (again.kind === 'narrowed') expect(again.better).toBeUndefined();
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
      // A best question first gives no note.
      const q = startMystery(scene);
      const best = bestQuestions(q.chips, q.remaining, scene)[0];
      const o = ask(q, best, true);
      if (o.kind === 'narrowed') expect(o.better).toBeUndefined();
    }
  });

  group('layout', () => {
    // Built by hand from every place combination, so layout is checked apart from the scene generator.
    const boards = (count: number) => {
      const subsets = SPOTS.map((_, i) => i)
        .reduce<number[][]>((all, i) => [...all, ...all.map((x) => [...x, i])], [[]])
        .filter((x) => x.length === count);
      return subsets.map((idx) => ({
        sightings: idx.flatMap((i) =>
          (['jumping', 'sleeping'] as const).map((action, k) => ({
            animal: ANIMALS[(i * 2 + k) % ANIMALS.length],
            action,
            spot: SPOTS[i],
          })),
        ),
      }));
    };
    const sizes: [number, number][] = [
      [1024, 768],
      [1366, 768],
      [768, 1660],
    ];
    for (const [w, h] of sizes)
      it(`three-place positions at ${w}x${h} keep neighbouring friends at least 100 apart`, () => {
        const ground = w < 900 ? Math.min(h * 0.78, h - 200) - 140 : Math.min(h * 0.78, h - 200);
        for (const { sightings } of boards(3)) {
          const pts = sightingPositions(sightings, w, h, ground);
          expect(pts).toHaveLength(6);
          const xs = pts.map((p) => p.x).sort((a, b) => a - b);
          for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(100);
          for (const p of pts) {
            expect(p.x).toBeGreaterThan(0);
            expect(p.x).toBeLessThan(w);
          }
        }
      });
    it('two-place positions are unchanged: 0.30 and 0.76 stages with plus or minus 80', () => {
      for (const { sightings } of boards(2)) {
        const w = 1024;
        const pts = sightingPositions(sightings, w, 768);
        const occupied = SPOTS.filter((s) => sightings.some((a) => a.spot === s));
        sightings.forEach((s, i) => {
          const centre = w * (occupied.indexOf(s.spot) === 0 ? 0.3 : 0.76);
          expect(Math.abs(pts[i].x - centre)).toBe(80);
        });
        expect(sightings).toHaveLength(4);
      }
    });
  });
});
