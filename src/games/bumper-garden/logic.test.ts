import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { aimFor, CATCH_Y, flight, makeBumpers, makeWorld, PLANS, SPOTS, TABLE } from './logic';

describe('Bumper Garden', () => {
  it('can bump every flower spot with some launch', () => {
    const bumpers = SPOTS.map((s) => ({ ...s, color: 0, number: null }));
    const world = makeWorld(bumpers);
    for (let i = 0; i < SPOTS.length; i++) expect(aimFor(world, bumpers.length, (k) => k === i), `spot ${i}`).not.toBeNull();
  });

  it('never traps the ladybug: every launch comes back down to the pot', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const plan = PLANS[seed % PLANS.length];
      const world = makeWorld(makeBumpers(plan, new Rng(seed)));
      for (let a = -0.42; a <= 0.42; a += 0.06) {
        const { landed } = flight(world, a, 40);
        expect(landed.y + TABLE.ball, `seed ${seed} angle ${a.toFixed(2)}`).toBeGreaterThanOrEqual(CATCH_Y);
        expect(landed.x).toBeGreaterThan(0);
        expect(landed.x).toBeLessThan(TABLE.w);
      }
    }
  });

  it('sets out the right flowers: one color to bloom, or numbers to bump in order', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const bumpers = makeBumpers(plan, new Rng(seed));
        expect(bumpers).toHaveLength(plan.bumpers);
        // Flowers never overlap.
        for (const a of bumpers) for (const b of bumpers) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(TABLE.bumper * 2 + TABLE.ball * 2);
        if (plan.mode === 'color') expect(bumpers.filter((b) => b.color === 0)).toHaveLength(plan.goal);
        if (plan.mode === 'order') {
          const numbers = bumpers.map((b) => b.number).filter((n) => n !== null).sort();
          expect(numbers).toEqual(Array.from({ length: plan.goal }, (_, i) => i + 1));
        }
      }
    }
  });
});
