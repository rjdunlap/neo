import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { animalToTap, describe, makeScene, matches, PLANS, request, nearestSighting, sightingPositions } from './logic';

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
