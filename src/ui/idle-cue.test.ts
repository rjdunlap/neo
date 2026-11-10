import { describe, expect, it } from 'vitest';
import { bounce, IdleCue, wobble } from './idle-cue';

const run = (cue: IdleCue, seconds: number) => {
  for (let t = 0; t < seconds - 1e-9; t += 0.05) cue.update(0.05);
};

describe('IdleCue', () => {
  it('waits through the first quiet seconds', () => {
    const cue = new IdleCue(4, 5, 0.8);
    run(cue, 3.9);
    expect(cue.progress).toBeNull();
    run(cue, 0.2);
    expect(cue.progress).not.toBeNull();
  });

  it('plays for its length, then waits, then repeats', () => {
    const cue = new IdleCue(4, 5, 0.8);
    run(cue, 4.4);
    expect(cue.progress).toBeCloseTo(0.5, 1);
    run(cue, 1);
    expect(cue.progress).toBeNull();
    // The next cue starts 4 + 0.8 + 5 = 9.8 seconds in.
    run(cue, 4.6);
    expect(cue.progress).not.toBeNull();
  });

  it('starts over on a touch', () => {
    const cue = new IdleCue(4, 5, 0.8);
    run(cue, 4.2);
    cue.reset();
    expect(cue.progress).toBeNull();
    run(cue, 3.5);
    expect(cue.progress).toBeNull();
  });
});

describe('cue motion', () => {
  it('is still between cues and settles at either end', () => {
    expect(wobble(null)).toBe(0);
    expect(bounce(null)).toBe(0);
    expect(wobble(0)).toBeCloseTo(0);
    expect(bounce(0)).toBeCloseTo(0);
    expect(wobble(1)).toBeCloseTo(0);
    expect(bounce(1)).toBeCloseTo(0);
  });

  it('stays small: a tilt, a short hop that only goes up', () => {
    for (let k = 0; k <= 1; k += 0.01) {
      expect(Math.abs(wobble(k))).toBeLessThanOrEqual(0.12);
      expect(bounce(k)).toBeLessThanOrEqual(0);
      expect(bounce(k)).toBeGreaterThanOrEqual(-18);
    }
  });
});
