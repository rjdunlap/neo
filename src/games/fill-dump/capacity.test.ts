import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { fillDump } from './index';
import { CAPACITY_VESSELS, capacityEvidence, capacityHeight, capacityLayout, capacityMore, capacityPair,
  capacityPairs, capacityPour, capacityRepour, capacityTap, kindFor, startCapacity } from './logic';

describe('Which holds more', () => {
  it('seeds three distinct obvious pairs, starts with bowl/cup and tests both kinds of evidence', () => {
    for (let seed = 0; seed < 100; seed++) {
      const pairs = capacityPairs(new Rng(seed));
      expect(pairs).toEqual(capacityPairs(new Rng(seed)));
      expect(pairs[0]).toEqual({ left: 'bowl', right: 'cup' });
      expect(new Set(pairs.map(p => `${p.left}/${p.right}`)).size).toBe(3);
      expect(new Set(pairs.map(capacityMore)).size).toBe(2);
      for (const p of pairs) {
        const a = CAPACITY_VESSELS[p.left].capacity, b = CAPACITY_VESSELS[p.right].capacity;
        expect(p.left).not.toBe(p.right);
        expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(1.6);
      }
    }
  });
  it('leaves guesses, incomplete experiments, spills and any number of re-pours unscored; water is conserved', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = startCapacity(new Rng(seed));
      for (let round = 0; round < 3; round++) {
        const p = capacityPair(s), total = CAPACITY_VESSELS[p.left].capacity;
        const rightCap = CAPACITY_VESSELS[p.right].capacity;
        expect(capacityTap(s, capacityMore(p) === 0 ? 1 : 0)).toBe('guess');
        expect(capacityEvidence(s)).toBe(false);
        for (let trial = 0; trial < 4; trial++) {
          for (const amount of [NaN, -1, 0.07, 0.5, 0.13, 100]) {
            capacityPour(s, amount);
            expect(s.jug + s.cup + s.tray).toBeCloseTo(total, 10);
            expect(s.cup).toBeLessThanOrEqual(rightCap);
            expect(Math.min(s.jug, s.cup, s.tray)).toBeGreaterThanOrEqual(0);
          }
          expect(s.tray > 1e-9).toBe(total > rightCap);
          expect(s.cup).toBeCloseTo(Math.min(total, rightCap));
          expect(capacityEvidence(s)).toBe(true);
          capacityRepour(s);
          expect(s.jug).toBeCloseTo(total); expect(s.cup + s.tray).toBe(0);
        }
        capacityPour(s, total); capacityEvidence(s);
        expect([s.misses, s.hints]).toEqual([0, 0]);
        capacityTap(s, capacityMore(p));
      }
      expect(s.done).toBe(true);
      const frozen = JSON.stringify(s);
      capacityPour(s, 1); capacityRepour(s); capacityTap(s, 0); capacityEvidence(s);
      expect(JSON.stringify(s)).toBe(frozen);
    }
  });
  it('judges only post-evidence answers, gives one hint per pair after two misses, and permits supported completion', () => {
    const s = startCapacity(new Rng(3));
    for (let round = 0; round < 3; round++) {
      const more = capacityMore(capacityPair(s)), wrong = more === 0 ? 1 : 0;
      capacityTap(s, wrong);
      expect(capacityTap(s, wrong)).toBe('ignored');
      capacityPour(s, 10); capacityEvidence(s);
      for (let i = 0; i < 3; i++) expect(capacityTap(s, wrong)).toBe('wrong');
      expect(s.hints).toBe(round + 1);
      capacityRepour(s); capacityPour(s, 10); capacityEvidence(s);
      capacityTap(s, wrong); expect(s.hints).toBe(round + 1);
      capacityTap(s, more);
    }
    expect(s.done).toBe(true); expect(s.misses).toBe(12); expect(s.hints).toBe(3);
  });
  it('uses volume divided by width and keeps targets separate, in view and clear of the pet in four logical views', () => {
    for (const [w, h] of [[1024, 768], [1024, 1365], [1365, 768], [1663, 768]]) {
      const l = capacityLayout(w, h);
      const boxes = [
        { x: l.left.x - 140, y: l.left.y - 150, w: 280, h: 170 },
        { x: l.right.x - 140, y: l.right.y - 150, w: 280, h: 170 },
        { x: l.tray.x - 150, y: l.tray.y - 50, w: 300, h: 100 },
        { x: l.tick.x - 70, y: l.tick.y - 70, w: 140, h: 140 },
      ];
      for (const b of boxes) {
        expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
        expect(b.x).toBeGreaterThan(150); expect(b.y).toBeGreaterThan(150);
        expect(b.x + b.w).toBeLessThan(w); expect(b.y + b.h).toBeLessThan(h);
      }
      for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        const x = boxes[a], y = boxes[b];
        expect(x.x + x.w <= y.x || y.x + y.w <= x.x || x.y + x.h <= y.y || y.y + y.h <= x.y).toBe(true);
      }
      expect(l.left.x + 2 * 240 + 1).toBeLessThan(w);
    }
    for (const kind of Object.keys(CAPACITY_VESSELS) as (keyof typeof CAPACITY_VESSELS)[]) {
      expect(capacityHeight(kind) * CAPACITY_VESSELS[kind].width).toBeCloseTo(CAPACITY_VESSELS[kind].capacity * 12000);
    }
  });
  it('opens only at preschool top with replayable speech and explicit routing', () => {
    expect(kindFor(5)).toBe('pour'); expect(kindFor(6)).toBe('pair'); expect(kindFor(7)).toBe('capacity');
    expect(fillDump.levels('preschool')).toEqual({ min: 1, max: 7, order: [1, 2, 6, 3, 4, 5, 7] });
    expect(fillDump.levels('toddler').order).not.toContain(7);
    for (const line of ['guess', 'pour', 'answer', 'spill', 'room', 'repour', 'done']) expect(SCRIPT).toHaveProperty(`fill.capacity.${line}`);
  });
});
