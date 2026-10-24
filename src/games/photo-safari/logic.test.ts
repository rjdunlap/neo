import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { photoSafari } from './index';
import { stepLevel } from '../../progress/difficulty';
import { CHANGED_PLAN, TRUE_PLAN, WHO_DOING_PLAN, planFor, TELL_WHICH_PLAN, TELL_BOTH_PLAN, chipsFor, chipPhrase, fits, fewestChips, judgeTell, sameChip, tellHint, toggleChip, ACTIONS, animalToTap, describe, makeScene, matches, PLANS, request, nearestSighting, sightingPositions } from './logic';
import { TODDLER_ACTIONS, actionsAt, changeScene, claimTruths, stillLine, changeLine, sentence, SPOTS as SPOT_LIST, PLACE_WORDS, type Spot } from './logic';

group('Photo Safari', () => {
  it('always has exactly one animal matching the request, with distinct spots in the original modes', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        expect(scene.sightings).toHaveLength(plan.animals);
        if (plan.mode !== 'clues' && plan.mode !== 'both') expect(new Set(scene.sightings.map((s) => s.spot)).size).toBe(plan.animals);
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
    for (const plan of [PLANS[4], PLANS[6]]) for (let seed = 1; seed <= 100; seed++) {
      const scene = makeScene(plan, new Rng(seed));
      for (const [w, h] of [[1024, 768], [1366, 768], [1024, 1366], [1180, 820]]) {
        const positions = sightingPositions(scene.sightings, w, h);
        positions.forEach((p, i) => {
          expect(p.x).toBeGreaterThanOrEqual(150);
          expect(p.x).toBeLessThanOrEqual(w - 95);
          expect(p.y - 155).toBeGreaterThan(150);
          for (let j = i + 1; j < positions.length; j++) expect(Math.hypot(p.x - positions[j].x, p.y - positions[j].y)).toBeGreaterThanOrEqual(150);
          // Body centre and the entire boundary of a 100-unit target, even in the overlapping circles.
          for (const radius of [0, 50, 75]) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
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
          if (plan.mode !== 'snap') expect(scene.sightings.filter((s) => matches(plan.mode, s, scene.sightings[i]))).toHaveLength(1);
        }
        expect(seen.size).toBe(plan.mode === 'snap' ? Math.min(plan.photos, plan.animals) : 1);
      }
    }
  });
});

group('telling a listener', () => {
  it('preserves IDs, reserved gaps and school difficulty order', () => {
    for (let i = 1; i <= 7; i++) expect(planFor(i)).toBe(PLANS[i - 1]);
    expect(planFor(8)).toBe(CHANGED_PLAN); expect(planFor(9)).toBe(TRUE_PLAN); expect(planFor(12)).toBe(WHO_DOING_PLAN);
    expect(planFor(10)).toBe(TELL_WHICH_PLAN); expect(planFor(11)).toBe(TELL_BOTH_PLAN);
    const range = photoSafari.levels('school');
    expect(range).toEqual({ min: 4, max: 11, order: [4, 5, 6, 7, 8, 9, 10, 11] });
    expect(stepLevel(7, 1, range)).toBe(8); expect(stepLevel(10, -1, range)).toBe(9);
  });
  it('speaks doing words before place words regardless of selection order', () => {
    expect(chipPhrase([{ kind: 'spot', value: 'pond' }, { kind: 'action', value: 'jumping' }])).toBe('jumping in the pond');
  });
  for (const level of [10, 11]) it(`level ${level}: fair scenes, all descriptions, solver and supported revision over 250 seeds`, () => {
    const uniqueKinds = new Set<string>();
    const seenResults = new Set<string>();
    for (let seed = 1; seed <= 250; seed++) {
      const rng = new Rng(seed), scene = makeScene(planFor(level), rng), chips = chipsFor(scene, rng);
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
      expect(chips.some((c) => { const f = fits([c], scene.sightings); return f.length === 2 && f.includes(scene.target); })).toBe(true);
      const solver = fewestChips(scene);
      expect(solver).toHaveLength(level === 10 ? 1 : 2);
      expect(judgeTell(solver, scene).result).toBe('right');
      const pairs = chips.filter((c) => c.kind === 'action').flatMap((a) => chips.filter((c) => c.kind === 'spot').map((b) => [a, b]));
      expect(pairs.filter((p) => judgeTell(p, scene).result === 'right')).toHaveLength(1);
      const sets = [[], ...chips.map((c) => [c]), ...pairs];
      expect(sets).toHaveLength(9);
      for (const chosen of sets) {
        // Independent truth table, including empty words and surplus truthful words.
        const found = scene.sightings.flatMap((s, i) => chosen.every((c) => s[c.kind] === c.value) ? [i] : []);
        const expected = !chosen.length ? 'empty' : !found.length ? 'nobody' : found.includes(scene.target)
          ? found.length === 1 ? 'right' : 'too-little' : found.length === 1 ? 'other' : 'other-many';
        const judged = judgeTell(chosen, scene);
        expect(judged).toEqual({ result: expected, fits: found }); seenResults.add(expected);
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
      for (const [w, h] of [[1024, 768], [1024, 1365]]) {
        const ground = Math.min(h * 0.78, h - 200);
        const points = sightingPositions(scene.sightings, w, h, ground);
        points.forEach((p, i) => {
          expect(p.y).toBeLessThan(h - 138);
          for (const q of points.slice(i + 1)) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(150);
        });
      }
    }
    expect([...seenResults].sort()).toEqual((level === 10 ? ['empty', 'right', 'too-little', 'other', 'other-many', 'nobody'] : ['empty', 'right', 'too-little', 'other', 'other-many']).sort());
    if (level === 10) expect([...uniqueKinds].sort()).toEqual(['action', 'spot']);
  });
});

group('Photo Safari levels 8, 9 and 12 rules', () => {
  const SEEDS = 400;
  const diffKeys = (a: { animal: string; action: string; spot: string }, b: { animal: string; action: string; spot: string }) =>
    (['animal', 'action', 'spot'] as const).filter((k) => a[k] !== b[k]);

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
        scene.sightings.forEach((s, i) => { expect(s.animal).toBe(before[i].animal); expect(actionsAt(s.spot)).toContain(s.action); });
        if (round < 2) expect(scene.change).toBe('action');
        else {
          const free = SPOTS_FREE(before);
          const canMove = before.some((b) => actionsAt(free).includes(b.action));
          expect(scene.change).toBe(canMove ? 'spot' : 'action');
          if (scene.change === 'spot') expect(scene.sightings[scene.target].spot).toBe(free);
        }
        kinds.add(`${round}:${scene.change}`);
        const was = before[scene.target], now = scene.sightings[scene.target];
        const line = changeLine(scene);
        expect(line).toContain(now.animal);
        if (scene.change === 'spot') { expect(line).toContain(PLACE_WORDS[was.spot]); expect(line).toContain(PLACE_WORDS[now.spot]); }
        else { expect(line).toContain(was.action); expect(line).toContain(now.action); }
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
        const t = scene.sightings[scene.target], claim = scene.claim!;
        expect(scene.sightings).toHaveLength(3);
        expect(new Set(scene.sightings.map((s) => s.animal)).size).toBe(3);
        expect(claim.animal).toBe(t.animal);
        expect(scene.sightings.filter((s) => matches('true', s, claim))).toHaveLength(1);
        expect(actionsAt(claim.spot)).toContain(claim.action);
        expect(request('true', scene)).toBe(sentence(claim));
        const diff = diffKeys(claim, t);
        if (truthy) expect(claim).toEqual(t);
        else { expect(diff).toHaveLength(1); expect(['action', 'spot']).toContain(diff[0]); falseKinds.add(diff[0]); }
      }
    }
    expect([...falseKinds].sort()).toEqual(['action', 'spot']);
  });
});

const SPOTS_FREE = (before: { spot: Spot }[]): Spot => SPOT_LIST.find((s) => !before.some((b) => b.spot === s))!;
