import { describe, expect, it } from 'vitest';
import { sfx } from '../audio/sfx';
import { LAND_IDS } from './lands';
import { GROUND_TAPS, tapSound } from './location-taps';

describe("A location's ground", () => {
  it('does something in every land, with a sound sfx has', () => {
    for (const id of LAND_IDS) {
      const tap = GROUND_TAPS[id];
      expect(tap.count, id).toBeGreaterThan(0);
      expect(tap.colors.length, id).toBeGreaterThan(0);
      for (let n = 0; n < 6; n++) {
        const { call } = tapSound(tap.sound, n);
        expect(typeof (sfx as unknown as Record<string, unknown>)[call], `${id} ${call}`).toBe('function');
      }
    }
  });

  it('walks a pitched sound through its steps and a farm through its animals', () => {
    const steps = { call: 'bell', steps: [1, 2, 3] } as const;
    expect([0, 1, 2, 3].map((n) => tapSound(steps, n).arg)).toEqual([1, 2, 3, 1]);
    expect(tapSound(GROUND_TAPS.barnyard.sound, 1)).toEqual({ call: 'animal', arg: 'moo' });
    expect(tapSound({ call: 'splash' }, 4)).toEqual({ call: 'splash' });
  });
});
