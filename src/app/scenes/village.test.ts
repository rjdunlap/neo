import { describe, expect, it } from 'vitest';
import { landFor, overlaps } from '../../content/lands';
import { computeView } from '../../engine/view';
import { exploreIds } from './ExploreScene';
import { LOCATIONS } from './LocationScene';
import { residentProblems, landLayouts } from './resident-check';
import { meadowKeepOut } from './meadow';
import { LANE_DEPTH, villageLane, villagePlan } from './village';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const village = landFor('cozy-village');

describe('Cozy Village as a location', () => {
  it('keeps every village drawing on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('cozy-village')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = villagePlan(layout, view, ground);
      // A village with hedgerows, not a bare green: a hedge, and one of the animals that lives in it.
      expect(plan.filter((p) => p.kind === 'hedge').length, where0).toBeGreaterThanOrEqual(1);
      expect(plan.filter((p) => p.kind === 'robin' || p.kind === 'hedgehog').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        // Off the lane, on the green.
        expect(r.y, where).toBeGreaterThan(ground + LANE_DEPTH);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(villagePlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('lines the lane with cottages across the view, under the corner buttons and the heading, and low across the sun', () => {
    for (const view of Object.values(VIEWS)) {
      const ground = view.h * village.backdrop.horizon;
      const lane = villageLane(view, ground);
      expect(lane[0].left).toBeLessThan(view.w * 0.1);
      expect(lane[lane.length - 1].right).toBeGreaterThan(view.w * 0.85);
      const sunX = Math.max(230, view.w * 0.2);
      for (let i = 0; i < lane.length; i++) {
        const c = lane[i];
        expect(c.top).toBeGreaterThanOrEqual(130);
        expect(ground - c.top).toBeGreaterThanOrEqual(60);
        if (i) expect(c.left).toBeGreaterThan(lane[i - 1].right);
        // Across the sun the roof stays below its middle, so she can still find it to poke.
        if (c.right + 6 > sunX - 58 && c.left - 6 < sunX + 58) expect(c.top).toBeGreaterThan(150);
      }
    }
  });

  it('is a location with Bramble as its resident, whose touch circle and motion clear every other spot, and Explore lists it', () => {
    expect(LOCATIONS['cozy-village']).toBeDefined();
    expect(exploreIds()).toContain('cozy-village');
    expect(LOCATIONS['cozy-village']?.resident).toBe('bramble');
    expect(residentProblems('bramble')).toEqual([]);
  });
});
