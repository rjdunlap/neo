import { describe, expect, it } from 'vitest';
import { FORMS, formSpecies } from './forms';
import { blossomScale, lampAnswer } from './lamp';
import { SPECIES_IDS } from './species';

describe('the lamp in creature play', () => {
  it('gives the moon blossom a glow and the sun blossom a fold', () => {
    expect(lampAnswer('sprout', 'sprout:moon')).toBe('glow');
    expect(lampAnswer('sprout', 'sprout:sun')).toBe('fold');
  });

  it('lets every friend answer, with or without a form', () => {
    for (const s of SPECIES_IDS) expect(lampAnswer(s, null)).toBe('rest');
    expect(lampAnswer('river', null)).toBe('rest');
    expect(lampAnswer('glider', null)).toBe('rest');
  });

  it('never lets a form answer on a species it does not belong to', () => {
    for (const f of FORMS)
      for (const s of SPECIES_IDS) if (s !== formSpecies(f)) expect(lampAnswer(s, f)).toBe('rest');
  });

  it('opens the moon bud and folds the sun by evening, and both return by day', () => {
    expect(blossomScale('glow', true)).toBeGreaterThan(1);
    expect(blossomScale('fold', true)).toBeLessThan(1);
    for (const a of ['glow', 'fold', 'rest'] as const) {
      expect(blossomScale(a, false)).toBe(1);
    }
    expect(blossomScale('rest', true)).toBe(1);
  });
});
