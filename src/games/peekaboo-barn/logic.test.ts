import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { ANIMALS, deal, newcomer, pickTarget, PLANS, spotToTap, type Animal } from './logic';

describe('Peekaboo Barn', () => {
  it('fits every level in four hiding places, with a wrong place to try on question levels', () => {
    for (const plan of PLANS) {
      expect(plan.spots).toBeLessThanOrEqual(4);
      if (plan.mode !== 'free') expect(plan.spots).toBeGreaterThanOrEqual(2);
    }
  });

  it('hides a different animal in each place and asks for one that is there, never twice in a row', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let last: Animal | null = null;
        for (let q = 0; q < plan.goal; q++) {
          const present = deal(rng, plan.spots);
          expect(new Set(present).size).toBe(plan.spots);
          const target = pickTarget(rng, present, last);
          expect(present).toContain(target);
          expect(target).not.toBe(last);
          last = target;
        }
      }
    }
  });

  it('sends in a newcomer who is not already showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const taken = deal(rng, 4);
      const who = newcomer(rng, taken);
      expect(ANIMALS).toContain(who);
      expect(taken).not.toContain(who);
    }
  });

  it("gives the ghost finger's bot only right taps: the hiding place of who was asked for, and in free play a place nobody is out of, going round", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const animals = deal(rng, plan.spots);
        if (plan.mode !== 'free') {
          const target = pickTarget(rng, animals, null);
          expect(animals[spotToTap(plan, animals.map(() => 'hidden'), animals, target, -1)!]).toBe(target);
          expect(spotToTap(plan, animals.map(() => 'hidden'), animals, null, -1)).toBeNull();
          continue;
        }
        const poses = animals.map(() => 'hidden');
        const visited = new Set<number>();
        let last = -1;
        for (let n = 0; n < plan.goal; n++) {
          const i = spotToTap(plan, poses, animals, null, last)!;
          expect(poses[i]).not.toBe('out');
          if (plan.spots > 1) expect(i).not.toBe(last);
          visited.add(i);
          last = i;
        }
        expect(visited.size).toBe(plan.spots);
        // Everyone out: wait.
        expect(spotToTap(plan, poses.map(() => 'out'), animals, null, last)).toBeNull();
        // Only one place free: that one, even if it was the last.
        expect(spotToTap(plan, poses.map((_, k) => (k === last ? 'hidden' : 'out')), animals, null, last)).toBe(last);
      }
    }
  });
});
