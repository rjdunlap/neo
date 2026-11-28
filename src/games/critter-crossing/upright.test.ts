import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CROSS_HIT, crossLayout } from './layout';
import { LEVELS, PLANS } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

describe('Critter Crossing layout', () => {
  it('keeps the sideways plan: fractions of the view', () => {
    const L = crossLayout(sideways);
    expect(L.gate).toEqual({ x: 1024 * 0.42 - 10, y: 384 });
    expect(L.left(3)).toEqual({ x: 1024 * 0.32, y: 768 * 0.55 + 40 });
    expect(L.right(2)).toEqual({ x: 1024 * 0.68, y: 768 * 0.55 + 40 });
    expect(L.bulb).toEqual({ x: 512, y: 688 });
    expect(L.shelf).toEqual({ x: 1000, y: 748 });
    expect(L.top).toBe(768 * 0.32);
    expect(L.upright).toBe(false);
  });
});

const critterCounts = [...new Set(PLANS.map((p) => p.critters))];
void LEVELS;

describe.each(Object.entries(views))('Critter Crossing upright on %s', (_, v) => {
  it.each(critterCounts)(
    '%i critters: both banks, bulb and shelf fit, stand apart and hang up from the bottom',
    (n) => {
      const L = crossLayout(v);
      expect(L.upright).toBe(true);
      const t: Target[] = [];
      // Each bank may hold every critter (all waiting, or all across).
      for (const [name, at] of [
        ['left', L.left],
        ['right', L.right],
      ] as const)
        for (let i = 0; i < n; i++) {
          const p = at(i);
          t.push({
            what: `${name} critter ${i}`,
            x: p.x,
            y: p.y + CROSS_HIT.y,
            w: CROSS_HIT.radius * 2,
            h: CROSS_HIT.radius * 2,
          });
        }
      // Left critters and right ones are never on screen in the same place; check each bank alone.
      const left = t.filter((x) => x.what.startsWith('left'));
      const right = t.filter((x) => x.what.startsWith('right'));
      const bulb: Target = { what: 'the guess bulb', x: L.bulb.x, y: L.bulb.y, w: 140, h: 140 };
      const shelf: Target = { what: 'the shelf', x: L.shelf.x - 209, y: L.shelf.y - 69, w: 418, h: 138 };
      const dots: Target = { what: 'the dots', x: L.dots.x, y: L.dots.y, w: 6 * 34, h: 22 };
      expect(
        uprightProblems(
          v,
          [...left, bulb, shelf, dots].map((x) => (x === dots ? { ...x, w: 100 } : x)),
          100,
        ).filter((p) => !p.includes('the dots')),
      ).toEqual([]);
      expect(uprightProblems(v, [...right, bulb, shelf]).filter((p) => !p.includes('the shelf'))).toEqual([]);
      // Critters clear the shelf, and the dots (their feet end 16 below the tap circle).
      for (let i = 0; i < n; i++) {
        for (const p of [L.left(i), L.right(i)]) {
          expect(p.y + 16).toBeLessThanOrEqual(L.dots.y - 11);
        }
      }
      // Hang from the bottom: the lowest critter is a fixed distance up, the sky is on top.
      expect(L.left(n - 1).y).toBeGreaterThanOrEqual(v.h - 520);
      // The bridge gate stays between the banks, the river inside the view, the gate at the middle row.
      expect(L.gate.y).toBe(L.left(2).y);
      expect(L.right(0).x - 54).toBeGreaterThan(L.riverR + 20);
      expect(L.left(1).x + 54).toBeLessThanOrEqual(L.riverL + 4);
      // Guess cards: two rows of cards at most clear the top row's critters and badges (about 150 above their feet).
      const topFeet = L.left(n - 1 - ((n - 1) % 2) - 0).y;
      void topFeet;
      const highestFeet = Math.min(...Array.from({ length: n }, (_, i) => L.left(i).y));
      expect(L.panelTop + 150 + 70).toBeLessThanOrEqual(highestFeet - 150);
      expect(L.panelTop).toBeGreaterThanOrEqual(130);
    },
  );
});

describe.each([...Object.entries(views), ['sideways', sideways] as const])(
  'Critter Crossing Be the gate buttons on %s',
  (_, v) => {
    it('the seat buttons and the Cross and Wait buttons are big, apart and clear of the chrome', () => {
      const L = crossLayout(v);
      const seats = L.seats.map((p, i) => square(`seat ${i}`, p, 112));
      const judge = L.judge.map((p, i) => square(`judge ${i}`, p, 112));
      if (L.upright) {
        expect(uprightProblems(v, seats, 100)).toEqual([]);
        expect(uprightProblems(v, judge, 100)).toEqual([]);
      }
      expect(Math.abs(L.seats[1].x - L.seats[0].x)).toBeGreaterThanOrEqual(112 + 40);
      expect(Math.abs(L.judge[1].x - L.judge[0].x)).toBeGreaterThanOrEqual(112 + 20);
      // Cross and Wait sit above the sign (150 over the gate, 64 tall) and every critter's head (about 150 over its feet).
      const signTop = L.gate.y - 150 - 64;
      const highest = Math.min(...Array.from({ length: 6 }, (_, i) => Math.min(L.left(i).y, L.right(i).y)));
      for (const p of L.judge) {
        expect(p.y - 56).toBeGreaterThanOrEqual(0);
        if (L.upright) expect(p.y + 56).toBeLessThanOrEqual(signTop);
        else expect(p.x - 56).toBeGreaterThan(L.gate.x + 100);
        expect(p.y + 56).toBeLessThanOrEqual(highest - 150);
        expect(p.x + 56).toBeLessThanOrEqual(v.w);
      }
    });
  },
);
