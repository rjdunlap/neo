import { describe, expect, it } from 'vitest';
import { midiToHz, stepFromUnit, stepToMidi } from './notes';

describe('pentatonic steps', () => {
  it('walks C D E G A up from middle C', () => {
    expect([0, 1, 2, 3, 4, 5].map(stepToMidi)).toEqual([60, 62, 64, 67, 69, 72]);
  });

  it('goes below middle C for negative steps', () => {
    expect(stepToMidi(-1)).toBe(57);
    expect(stepToMidi(-5)).toBe(48);
  });

  it('tunes A4 to 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(stepToMidi(4))).toBeCloseTo(440);
  });

  it('maps a unit range onto steps and clamps the ends', () => {
    expect(stepFromUnit(0, 3, 10)).toBe(3);
    expect(stepFromUnit(0.999, 3, 10)).toBe(12);
    expect(stepFromUnit(1.5, 3, 10)).toBe(12);
    expect(stepFromUnit(-1, 3, 10)).toBe(3);
  });
});
