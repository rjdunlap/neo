import { describe, expect, it } from 'vitest';
import { CLOUDS, cloudMinimum } from './course';
import { judge, padAt, padHit, PADS, planFor, pullFor, reach } from './logic';

describe('the Cloud Hopper course', () => {
  it('freezes a fixed run of twelve clouds, one launch each at the very best', () => {
    expect(CLOUDS.version).toBe(1);
    expect(CLOUDS.targets).toHaveLength(12);
    expect(cloudMinimum()).toBe(12);
  });

  it('never repeats a cloud twice running, and asks for every cloud at least twice', () => {
    CLOUDS.targets.slice(1).forEach((t, i) => expect(t).not.toBe(CLOUDS.targets[i]));
    for (let pad = 0; pad < PADS; pad++) expect(CLOUDS.targets.filter(t => t === pad).length).toBeGreaterThanOrEqual(2);
    expect(CLOUDS.targets.every(t => Number.isInteger(t) && t >= 0 && t < PADS)).toBe(true);
  });

  it('keeps the clouds small but fair: the exact pull lands, and so does a little error either way', () => {
    const half = CLOUDS.padWidth / PADS / 2;
    // A window of at least four hundredths of the strip in power: ~0.16 s of holding at the controller's speed.
    expect(half).toBeGreaterThanOrEqual(0.04);
    expect(CLOUDS.padWidth).toBeLessThan(0.85);
    const star = planFor(3);
    for (let pad = 0; pad < PADS; pad++) {
      expect(padHit(reach(pullFor(padAt(pad))), CLOUDS.padWidth)).toBe(pad);
      expect(judge(star, padAt(pad) + half * 0.9, pad, undefined, undefined, CLOUDS.padWidth)).toBe('yes');
      expect(judge(star, padAt(pad) - half * 0.9, pad, undefined, undefined, CLOUDS.padWidth)).toBe('yes');
      // Just outside the cloud is a miss, and says which way.
      expect(judge(star, padAt(pad) + half * 1.2, pad, undefined, undefined, CLOUDS.padWidth)).toBe('long');
      expect(judge(star, padAt(pad) - half * 1.2, pad, undefined, undefined, CLOUDS.padWidth)).toBe('short');
    }
  });

  it('keeps the learning levels as forgiving as they were', () => {
    const star = planFor(3);
    for (let pad = 0; pad < PADS; pad++) expect(judge(star, padAt(pad) + 0.07, pad)).toBe('yes');
  });
});
