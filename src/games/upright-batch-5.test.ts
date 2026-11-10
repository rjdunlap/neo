import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { FRIEND_HIT, friendFeet, friendXs, PLANS as snackPlans, snackXs } from './animal-snack/logic';
import { PLANS as bubblePlans, spawnBox, TAP_REACH } from './bubble-pop/logic';
import { insertLayout, paradeLayout, ribbonLayout, RIBBON_LANE, TARGET } from './size-parade/logic';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

/** The lap and toddler six keep the 100-unit minimum, about 51 px on a 390-wide phone. */
function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets, 100)).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone) {
    const smallest = Math.min(...targets.map((t) => Math.min(t.w, t.h)));
    expect(smallest * v.scale).toBeGreaterThanOrEqual(50);
  }
}

describe.each(Object.entries(views))('Lap and toddler upright batch 5 on %s', (_, v) => {
  it('Bubble Pop: every level’s bubbles start inside the view, clear of Home, "?" and the guide', () => {
    for (const p of bubblePlans) {
      const still = p.mode === 'count' || p.mode === 'bonds';
      for (const r of p.radius) {
        const at = spawnBox(v.w, v.h, r, still);
        expect(at.x[0]).toBeLessThanOrEqual(at.x[1]);
        // The tap reach (1.2 × the radius) is the target; a still bubble is checked at the four corners of where it may start.
        const size = 2 * r * TAP_REACH;
        if (still) {
          expect(at.y[0]).toBeLessThanOrEqual(at.y[1]);
          for (const x of at.x) for (const y of at.y) check(v, [square('still bubble', { x, y }, 2 * r)]);
          expect(size).toBeGreaterThanOrEqual(100);
        } else {
          // A rising bubble starts below the view, right of Home's column, and rises straight up.
          expect(at.x[0] - r).toBeGreaterThanOrEqual(115);
          expect(at.x[1] + r).toBeLessThanOrEqual(v.w);
          expect(2 * r).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  it('Animal Snack: the three friends and up to five snacks fit, the snacks apart', () => {
    for (const plan of snackPlans) {
      const xs = friendXs(plan.animals, v.w);
      // A friend's drop circle reaches past its neighbours by design (the nearest friend wins); its body is the target.
      for (const x of xs) {
        expect(x - FRIEND_HIT.r / 2).toBeGreaterThanOrEqual(150);
        expect(x + FRIEND_HIT.r / 2).toBeLessThanOrEqual(v.w);
        expect(friendFeet(v.h) + FRIEND_HIT.y).toBeGreaterThan(210 + FRIEND_HIT.r / 2);
      }
    }
    for (let n = 1; n <= 5; n++)
      check(
        v,
        snackXs(n, v.w).map((x) => square('snack', { x, y: v.h - 85 }, 110)),
      );
    check(v, [{ what: 'Bell', x: v.w - 80, y: 110, w: 110, h: 110 }]);
  });

  it('Size Parade: the line, the five-place insert and the ribbon lanes fit', () => {
    for (let n = 2; n <= 5; n++) {
      const l = paradeLayout(n, n, v.w);
      expect(l.targetW).toBeGreaterThanOrEqual(100);
      check(
        v,
        l.friends.map((x) => ({ what: 'friend', x, y: v.h - 90 - TARGET.h / 2, w: l.targetW, h: TARGET.h })),
      );
      for (const [a, b] of l.spots.slice(1).map((s, i) => [l.spots[i], s])) expect(b - a).toBeGreaterThanOrEqual(100);
    }
    const ins = insertLayout(v.w, 2);
    expect(ins.openW).toBeGreaterThanOrEqual(100);
    check(
      v,
      ins.five.map((x) => ({ what: 'place', x, y: v.h - 90 - TARGET.h / 2, w: ins.openW, h: TARGET.h })),
    );
    // The ribbon pair: both friends right of the guide, their lanes inside the view and farther apart than a lane's reach.
    const r = ribbonLayout(v.w);
    expect(r.xs[0] - TARGET.w / 2).toBeGreaterThanOrEqual(150);
    expect(r.lanes[1] + RIBBON_LANE / 2).toBeLessThanOrEqual(v.w);
    expect(r.lanes[1] - r.lanes[0]).toBeGreaterThanOrEqual(260);
  });
});
