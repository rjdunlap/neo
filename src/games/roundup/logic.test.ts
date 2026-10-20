import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { animalsFor, enter, fleeSpeed, KINDS, makeHerd, PLACE, PLANS, PLURAL, ringBell, shooPoint, signDots, startSpots, throughGate, wanted } from './logic';

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

  it('uses every kind in one-pen rounds and every distinct pen pair in sorting rounds', () => {
    for (const plan of PLANS) {
      const pairs = new Set<string>();
      const kinds = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const herd = makeHerd(plan, new Rng(seed));
        expect(makeHerd(plan, new Rng(seed))).toEqual(herd);
        expect(new Set(herd.pens.map((p) => p.kind)).size).toBe(herd.pens.length);
        for (const kind of herd.animals) {
          expect(herd.pens.some((p) => p.kind === kind)).toBe(true);
          kinds.add(kind);
        }
        pairs.add(herd.pens.map((p) => p.kind).sort().join(','));
        for (const pen of herd.pens) {
          expect(PLURAL[pen.kind]).toBeTruthy();
          expect(PLACE[pen.kind]).toBeTruthy();
          for (const kind of KINDS) expect(enter(pen, kind)).toBe(kind === pen.kind ? 'in' : 'wrong-pen');
          const have = herd.animals.filter((k) => k === pen.kind).length;
          if (plan.mode === 'sortCount') {
            expect(have).toBe(pen.target! + 1);
            expect(pen.target).toBeLessThanOrEqual(plan.max!);
          }
        }
        expect(ringBell(herd, herd.pens.map((p) => wanted(herd, p))).every((r) => r.extra === 0 && r.short === 0)).toBe(true);
      }
      expect([...kinds].sort()).toEqual([...KINDS].sort());
      expect(pairs.size).toBe(plan.mode.startsWith('sort') ? 10 : 5);
    }
  });

  it('varies level 4 between four and five animals, with every nonempty split possible', () => {
    const casts = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const herd = makeHerd(PLANS[3], new Rng(seed));
      expect(herd.animals.length).toBeGreaterThanOrEqual(4);
      expect(herd.animals.length).toBeLessThanOrEqual(5);
      const counts = herd.pens.map((p) => herd.animals.filter((k) => k === p.kind).length);
      expect(counts.every((n) => n >= 1)).toBe(true);
      casts.add(counts.join('+'));
    }
    expect([...casts].sort()).toEqual(['1+3', '1+4', '2+2', '2+3', '3+1', '3+2', '4+1']);
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

  it('starts each round somewhere new, always on the open meadow left of the pens', () => {
    const field = { x0: 230, y0: 260, y1: 678 };
    const left = 600;
    const layouts = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const spots = startSpots(5, field, left, new Rng(seed));
      for (const p of spots) {
        expect(p.x).toBeGreaterThanOrEqual(field.x0 + 40);
        expect(p.x).toBeLessThanOrEqual(left);
        expect(p.y).toBeGreaterThan(field.y0);
        expect(p.y).toBeLessThan(field.y1);
      }
      layouts.add(spots.map((p) => Math.round(p.x)).join());
    }
    expect(layouts.size).toBeGreaterThan(40);
  });

  it('draws as many dots as the sign asks for, packed beside the numeral', () => {
    for (let n = 1; n <= 4; n++) {
      const dots = signDots(n);
      expect(dots).toHaveLength(n);
      expect(new Set(dots.map((d) => `${d.x},${d.y}`)).size).toBe(n);
      // Inside the board's right part: 64 ± 26 across, within its 80-unit height.
      for (const d of dots) {
        expect(Math.abs(d.x)).toBeLessThanOrEqual(26);
        expect(Math.abs(d.y)).toBeLessThanOrEqual(26);
      }
    }
    // Every counting target fits the four the sign can show.
    for (const plan of PLANS.filter((p) => p.max !== undefined)) expect(plan.max).toBeLessThanOrEqual(4);
  });

  it('says one pig, two pigs', () => {
    expect(animalsFor('pig', 1)).toBe('pig');
    expect(animalsFor('bunny', 3)).toBe('bunnies');
  });
});
