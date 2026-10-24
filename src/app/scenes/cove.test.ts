import { describe, expect, it } from 'vitest';
import { overlaps } from '../../content/lands';
import { LOCATIONS } from './LocationScene';
import { covePlan, freshEdge, mouthEdge } from './cove';
import { landLayouts } from './resident-check';
import { meadowKeepOut } from './meadow';

describe('Counting Cove as a location', () => {
  it('keeps every marsh drawing on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('counting-cove')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = covePlan(layout, view, ground);
      // A marsh, not a bare field: reeds or cattails at every size.
      expect(plan.filter((p) => p.kind === 'reeds' || p.kind === 'cattail').length, where0).toBeGreaterThanOrEqual(4);
      for (const { kind, x, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        // Frogs and lily pads keep to the fresh water upstream; the mudflat is at the river's mouth.
        if (kind === 'frog' || kind === 'lilypad') expect(x, where).toBeLessThanOrEqual(freshEdge(view));
        if (kind === 'mudflat') expect(x, where).toBeGreaterThanOrEqual(mouthEdge(view));
      }
      // Nothing stands on anything else.
      const big = plan;
      for (const p of plan) for (const b of big) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(covePlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('is a location with River as its resident', () => {
    expect(LOCATIONS['counting-cove']?.resident).toBe('river');
  });
});
