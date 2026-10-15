import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { GAMES } from '../registry';
import { DUCK_COLORS, PLANS, arrive, makeRound } from './logic';
import { Rng } from '../../engine/random';

describe('Duckling Parade support', () => {
  const game = GAMES.find((g) => g.id === 'duckling-parade')!;

  it('describes generated pattern colors without promising a fixed palette', () => {
    for (const level of [7, 8]) {
      const description = game.describeLevel(level).toLowerCase();
      for (const color of DUCK_COLORS) expect(description).not.toContain(color);
      expect(description).toContain('repeating');
      expect(description).toContain(level === 7 ? 'two' : 'three');
    }
  });

  it('offers taps throughout the ladder and describes the spare as exclusion', () => {
    for (let level = 1; level <= 10; level++) {
      const steps = howToFor(game, level)!.steps.join(' ');
      expect(steps).toContain('Tap the grass');
      if (level >= 2) expect(steps).toContain('lead with a finger');
      expect(steps).not.toMatch(/repair|revise/i);
      expect(steps.includes('spare')).toBe(level === 10);
    }
    expect(SCRIPT['parade.walk'][0]).toContain('Tap the grass or lead with a finger');
    expect(SCRIPT['parade.spare'][0]).toContain('Leave the spare duckling in the meadow');
    expect(howToFor(game, 10)!.steps.join(' ')).toContain('in order');
  });

  it('names the combined total after a partial delivery, rather than the arriving batch', () => {
    const round = makeRound(PLANS[5], new Rng(9));
    const target = round.target!;
    expect(arrive(round, 0, 1)).toEqual({ swimIn: 1, extra: 0 });
    const { swimIn, extra } = arrive(round, 1, target);
    expect(swimIn).toBe(target - 1);
    expect(extra).toBe(1);
    const total = target + extra;
    expect(total).toBe(1 + target);
    expect(total).not.toBe(target); // The second batch alone.
    for (const line of SCRIPT['parade.extra']) {
      expect(line).toContain('{count} ducklings altogether');
      expect(line).toContain('{n} in the pond');
    }
  });
});
