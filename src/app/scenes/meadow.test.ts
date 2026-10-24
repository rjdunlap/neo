import { describe, expect, it } from 'vitest';
import { overlaps } from '../../content/lands';
import { homeOf, LOCATIONS } from './LocationScene';
import { landLayouts } from './resident-check';
import { meadowKeepOut, meadowPlan } from './meadow';

describe('Rainbow Meadow as a location', () => {
  it('keeps every meadow drawing on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('rainbow-meadow')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = meadowPlan(layout, view, ground);
      // A meadow, not a bare field: there is room for flowers at every size.
      expect(plan.filter((p) => ['clover', 'daisy', 'poppy'].includes(p.kind)).length, where0).toBeGreaterThanOrEqual(6);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
      }
      expect(meadowPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('is the home of its resident, an island species', () => {
    for (const [id, place] of Object.entries(LOCATIONS)) if (place!.resident) expect(homeOf(place!.resident)).toBe(id);
  });
});
