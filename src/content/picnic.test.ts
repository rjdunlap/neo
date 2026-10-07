import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { gameById } from '../games/registry';
import { BANDS } from '../progress/bands';
import { SCRIPT } from './voice-script';
import { bandForGame, blanketPuzzle, GAME_STEPS, HANGS, stepLine, whyNot } from './picnic';
import { PICNIC_STEPS } from './world';

describe('The Windy Picnic', () => {
  it('plays each game step at a real level of a band the game supports, for every child band', () => {
    for (const step of GAME_STEPS) {
      const mod = gameById(step.game)!;
      expect(mod, step.game).toBeDefined();
      for (const { id } of BANDS) {
        const band = bandForGame(mod.bands, id);
        expect(mod.bands).toContain(band);
        const level = step.level[id];
        expect(level).toBeGreaterThanOrEqual(1);
        // A level the game describes, and in its full ladder (the step's band range may differ).
        const top = Math.max(...mod.bands.map((b) => mod.levels(b).max));
        expect(level, `${step.id} ${id}`).toBeLessThanOrEqual(top);
        expect(mod.describeLevel(level).length).toBeGreaterThan(3);
      }
    }
    // Pet Kitchen starts at toddler, so lap plays the toddler version; older bands play their own.
    expect(bandForGame(gameById('pet-kitchen')!.bands, 'lap')).toBe('toddler');
    expect(bandForGame(gameById('jelly-drums')!.bands, 'school')).toBe('school');
  });

  it('speaks every request, its change in the scene, and its recap', () => {
    for (const id of PICNIC_STEPS) for (const line of Object.values(stepLine[id])) expect(SCRIPT[line], line).toBeDefined();
    expect(new Set([...GAME_STEPS.map((s) => s.id), 'blanket'])).toEqual(new Set(PICNIC_STEPS));
  });

  it('always has exactly one blanket that fits the clue, with room on every branch and bush', () => {
    for (const { id: band } of BANDS) {
      for (let seed = 1; seed <= 300; seed++) {
        const p = blanketPuzzle(band, new Rng(seed));
        expect(p.blankets.length).toBe(band === 'lap' || band === 'toddler' ? 2 : 3);
        const target = p.blankets[p.target];
        expect(target.pattern).toBe('stripes');
        const fits = p.blankets.filter((b) => b.pattern === 'stripes' && (!p.withPlace || b.hang === target.hang));
        expect(fits).toEqual([target]);
        // No two blankets share a hanging spot.
        expect(new Set(p.blankets.map((b) => `${b.hang}${b.slot}`)).size).toBe(p.blankets.length);
        for (const b of p.blankets) expect(HANGS).toContain(b.hang);
        p.blankets.forEach((_, i) => expect(whyNot(p, i) === null).toBe(i === p.target));
        if (p.withPlace) {
          // Early school needs both clues: stripes alone or the place alone leaves two blankets.
          expect(p.blankets.filter((b) => b.pattern === 'stripes')).toHaveLength(2);
          expect(p.blankets.filter((b) => b.hang === target.hang)).toHaveLength(2);
          expect(p.blankets.map((_, i) => whyNot(p, i)).filter(Boolean).sort()).toEqual(['pattern', 'place']);
        } else {
          expect(new Set(p.blankets.map((b) => b.pattern)).size).toBe(p.blankets.length);
          expect(new Set(p.blankets.map((b) => b.hang)).size).toBe(p.blankets.length);
        }
      }
    }
  });
});
