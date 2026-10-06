import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { describe, makeScene, matches, PLANS } from './logic';

group('Photo Safari', () => {
  it('always has exactly one animal matching the request, each in its own spot', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const scene = makeScene(plan, new Rng(seed));
        expect(scene.sightings).toHaveLength(plan.animals);
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

  it('describes sightings in words', () => {
    const s = { animal: 'bunny' as const, action: 'jumping' as const, spot: 'bush' as const };
    expect(describe('who', s)).toBe('the bunny');
    expect(describe('doing', s)).toBe('the bunny jumping');
    expect(describe('where', s)).toBe('the bunny behind the bush');
    expect(describe('both', s)).toBe('the bunny jumping behind the bush');
  });
});
