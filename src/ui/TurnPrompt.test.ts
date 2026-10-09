import { describe, expect, it } from 'vitest';
import { phoneTurn } from './TurnPrompt';

describe('phoneTurn', () => {
  it('starts upright, turns sideways, holds, and comes back', () => {
    expect(phoneTurn(0)).toBe(0);
    expect(phoneTurn(1.3)).toBeCloseTo(1);
    expect(phoneTurn(2)).toBeCloseTo(1);
    expect(phoneTurn(3.1)).toBeCloseTo(0);
  });

  it('stays within a quarter turn and repeats', () => {
    for (let t = 0; t < 12; t += 0.05) {
      const v = phoneTurn(t);
      expect(v).toBeGreaterThanOrEqual(-1e-9);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    }
    expect(phoneTurn(1.7 + 3.2)).toBeCloseTo(phoneTurn(1.7));
  });
});
