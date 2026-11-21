import { describe, expect, it } from 'vitest';
import { dailySix, dayKey } from '../content/daily';
import { GAMES } from '../games/registry';
import { FIRST_VISIT_PLACES } from './chooser';
import { firstDemoPick } from './daily-six';

/** The first-visit screen (play-first slice 2): its age places, and the round a guest plays first. */
describe('the first-visit screen', () => {
  it('offers three age places: toddler, school and grownup, each with a word and a spoken name', () => {
    expect(FIRST_VISIT_PLACES.map((p) => p.band)).toEqual(['toddler', 'school', 'grownup']);
    for (const p of FIRST_VISIT_PLACES) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.spoken.length).toBeGreaterThan(0);
    }
    // Small to large, so the pictures say the ages without reading.
    expect(FIRST_VISIT_PLACES.map((p) => p.size)).toEqual(['small', 'medium', 'large']);
  });

  it("finds a ghost-finger game in the guest's six for every place, every day of a year, upright, sideways and on a phone", () => {
    const start = new Date(2026, 0, 1);
    for (const { band } of FIRST_VISIT_PLACES)
      for (let d = 0; d < 365; d++) {
        const day = dayKey(new Date(start.getFullYear(), 0, 1 + d));
        for (const [upright, phone] of [
          [false, false],
          [true, false],
          [false, true],
          [true, true],
        ] as const) {
          // A guest has played nothing, so every game is new today.
          const picks = dailySix(
            day,
            band,
            GAMES,
            () => null,
            upright,
            () => true,
            phone,
          );
          const first = firstDemoPick(picks);
          expect(first, `${band} ${day} upright=${upright} phone=${phone}`).not.toBeNull();
          expect(first!.mod.touchDemo).toBe(true);
          expect(picks).toContain(first);
          expect(first!.mod.bands).toContain(first!.band);
          expect(first!.mod.levels(first!.band).min).toBeLessThanOrEqual(first!.level);
        }
      }
  });
});
