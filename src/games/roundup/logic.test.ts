import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { enter, fleeSpeed, makeHerd, PLANS, ringBell, shooPoint, throughGate, wanted } from './logic';

describe('Roundup', () => {
  it('always has enough animals for every pen, with a spare when counting', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const herd = makeHerd(plan, new Rng(seed));
        for (const pen of herd.pens) {
          const have = herd.animals.filter((k) => k === pen.kind).length;
          expect(have, plan.name).toBeGreaterThanOrEqual(wanted(herd, pen));
          if (pen.target !== undefined) {
            expect(have).toBeGreaterThan(pen.target);
            expect(pen.target).toBeGreaterThanOrEqual(plan.min!);
          }
        }
        expect(herd.pens.length).toBe(plan.mode.startsWith('sort') ? 2 : 1);
      }
    }
  });

  it('lets animals into their own pen, and the bell finds too many or too few', () => {
    expect(enter({ kind: 'pig' }, 'bunny')).toBe('wrong-pen');
    expect(enter({ kind: 'pig', target: 2 }, 'pig')).toBe('in');
    const herd = { animals: ['pig', 'pig', 'pig', 'bunny', 'bunny'] as const, pens: [{ kind: 'pig' as const, target: 2 }, { kind: 'bunny' as const, target: 1 }] };
    const h = { ...herd, animals: [...herd.animals] };
    expect(ringBell(h, [3, 0])).toEqual([{ extra: 1, short: 0 }, { extra: 0, short: 1 }]);
    expect(ringBell(h, [2, 1])).toEqual([{ extra: 0, short: 0 }, { extra: 0, short: 0 }]);
  });

  it('only lets animals in through the gate, and shooing is stronger up close', () => {
    const pen = { x: 500, y: 100, w: 200, h: 200 };
    expect(throughGate(pen, { x: 490, y: 200 }, { x: 510, y: 200 })).toBe(true);
    expect(throughGate(pen, { x: 490, y: 110 }, { x: 510, y: 110 })).toBe(false);
    expect(throughGate(pen, { x: 510, y: 200 }, { x: 490, y: 200 })).toBe(false);
    expect(fleeSpeed(300, 190, 330)).toBe(0);
    expect(fleeSpeed(20, 190, 330)).toBeGreaterThan(fleeSpeed(150, 190, 330));
  });

  it('puts the demonstration finger behind the animal, aimed away from the gate', () => {
    for (const [animal, gate] of [
      [{ x: 200, y: 300 }, { x: 700, y: 300 }],
      [{ x: 300, y: 500 }, { x: 700, y: 200 }],
      [{ x: 650, y: 120 }, { x: 700, y: 400 }],
    ]) {
      const finger = shooPoint(animal, gate);
      expect(Math.hypot(finger.x - animal.x, finger.y - animal.y)).toBeCloseTo(105);
      expect((gate.x - animal.x) * (finger.x - animal.x) + (gate.y - animal.y) * (finger.y - animal.y)).toBeLessThan(0);
    }
  });
});
