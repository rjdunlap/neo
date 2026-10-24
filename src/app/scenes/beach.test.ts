import { describe, expect, it } from 'vitest';
import { overlaps } from '../../content/lands';
import { beachPlan, poolLife, sunRect } from './beach';
import { LOCATIONS } from './LocationScene';
import { residentProblems, landLayouts } from './resident-check';
import { meadowKeepOut } from './meadow';

describe('Bubble Beach as a location', () => {
  it('keeps every shore drawing on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('bubble-beach')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = beachPlan(layout, view, ground);
      // A shore with pools, crabs and gulls, not a bare strip of sand.
      expect(plan.filter((p) => p.kind === 'pool').length, where0).toBeGreaterThanOrEqual(2);
      expect(plan.filter((p) => p.kind === 'crab').length, where0).toBeGreaterThanOrEqual(1);
      expect(plan.filter((p) => p.kind === 'gull').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, y, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        // Gulls fly over the sea, clear of the sun; everything else is on the shore.
        if (kind === 'gull') {
          expect(y, where).toBeLessThan(ground);
          expect(overlaps(r, sunRect(view)), where).toBe(false);
        } else expect(y, where).toBeGreaterThan(ground + 20);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(beachPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('fills its rock pools with a real rocky shore: a sea star or an anemone in each, and kelp among them', () => {
    for (let i = 0; i < 6; i++) expect(poolLife(i).some((k) => k === 'star' || k === 'anemone')).toBe(true);
    expect(new Set([0, 1, 2].flatMap(poolLife))).toEqual(new Set(['star', 'anemone', 'kelp']));
  });

  it('is a location with Tote as its resident, whose touch circle and motion clear every other spot', () => {
    expect(LOCATIONS['bubble-beach']).toBeDefined();
    expect(LOCATIONS['bubble-beach']?.resident).toBe('tote');
    expect(residentProblems('tote')).toEqual([]);
  });
});
