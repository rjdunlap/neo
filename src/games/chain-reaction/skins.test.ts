import { describe, expect, it } from 'vitest';
import { VOICE } from './voice';
import { planFor } from './logic';
import { rampStep, SKINS, skinFor, skinnable } from './skins';

describe('chain reaction skins', () => {
  it('cycles through all three skins from any offset, so neighbouring machines differ', () => {
    for (let offset = 0; offset < 6; offset++) {
      const seen = [0, 1, 2].map((m) => skinFor(offset, m).id);
      expect(new Set(seen).size).toBe(SKINS.length);
      expect(skinFor(offset, 0).id).not.toBe(skinFor(offset, 1).id);
    }
  });

  it('reskins the plain machines and leaves the bells, two marbles, chime and gate alone', () => {
    const plain = [1, 2, 3, 4, 5, 6, 7, 10].filter((l) => skinnable(planFor(l)));
    expect(plain.length).toBeGreaterThan(0);
    for (const level of [8, 9, 11]) expect(skinnable(planFor(level))).toBe(false);
    for (const level of [1, 2, 3, 4, 5, 6, 7, 10]) {
      const plan = planFor(level);
      expect(skinnable(plan)).toBe(!plan.chime);
    }
  });

  it('plays a rising run of pentatonic steps, lower for left ramps than right ones', () => {
    expect(rampStep('left', 0)).toBeLessThan(rampStep('right', 0));
    expect(rampStep('left', 1)).toBeGreaterThan(rampStep('left', 0));
    expect(rampStep('right', 9)).toBe(rampStep('right', 2));
  });

  it('slots the cargo and goal words into every line that a skin can reach', () => {
    const slotted = [
      'chain.start',
      'chain.left',
      'chain.right',
      'chain.turn-start',
      'chain.turn-hint',
      'chain.spring-start',
      'chain.spring-hint',
      'chain.spring-hint-bell',
    ] as const;
    for (const id of slotted) expect(VOICE[id].join(' ')).toMatch(/\{cargo\}/);
    for (const id of ['chain.start', 'chain.left', 'chain.right'] as const)
      expect(VOICE[id].join(' ')).toMatch(/\{goal\}/);
    for (const id of slotted) expect(VOICE[id].join(' ')).not.toMatch(/\bmarbles?\b/i);
  });
});
