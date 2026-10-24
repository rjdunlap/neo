import { describe, expect, it } from 'vitest';
import { LAND_IDS, landButtons, landFor, overlaps } from '../../content/lands';
import { computeView } from '../../engine/view';
import { barnyardFence } from './barnyard';
import { exploreIds } from './ExploreScene';
import { farmPlan } from './farm';
import { GARLAND_LOW, hungRect, lakeGarlands, lakePlan, WATER_ABOVE, WATER_BELOW } from './lakeside';
import { LOCATIONS } from './LocationScene';
import { landLayouts } from './resident-check';
import { meadowKeepOut } from './meadow';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('Barnyard as a location', () => {
  it('plants an orchard in front of the fence, on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('barnyard')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = farmPlan(layout, view, ground);
      const fence = barnyardFence(layout, ground) + 22;
      // Orchard Rows lives here: at least one apple tree.
      expect(plan.filter((p) => p.kind === 'tree').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        expect(r.y, where).toBeGreaterThan(fence);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(farmPlan(layout, view, ground)).toEqual(plan);
    }
  });
});

describe('Lantern Lake as a location', () => {
  it('floats lanterns on the water and lights the bank, on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('lantern-lake')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = lakePlan(layout, view, ground);
      // Lanterns in every layout: on the water and the bank where there is room, and strung across the sky.
      const lit = plan.filter((p) => p.kind === 'float' || p.kind === 'post').length + lakeGarlands(view).flatMap((g) => g.hang).length;
      expect(lit, where0).toBeGreaterThanOrEqual(3);
      expect(plan.filter((p) => p.kind === 'boat').length, where0).toBeLessThanOrEqual(1);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        // On the water or on the bank below it.
        if (kind === 'float' || kind === 'boat') expect(r.y + r.h, where).toBeLessThanOrEqual(ground + WATER_BELOW);
        else expect(r.y, where).toBeGreaterThan(ground + WATER_BELOW);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(lakePlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('strings garlands of lanterns beside the heading, off the corner buttons and above every spot', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const off = [...landButtons(view.w), { x: view.w / 2 - 190, y: 20, w: 380, h: 90 }];
      const hung = lakeGarlands(view).flatMap((g) => g.hang.map((x) => hungRect(g, x)));
      expect(hung.length, name).toBeGreaterThanOrEqual(2);
      for (const r of hung) {
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= GARLAND_LOW, name).toBe(true);
        for (const k of off) expect(overlaps(r, k), name).toBe(false);
      }
      for (const a of hung) for (const b of hung) if (a !== b) expect(overlaps(a, b), name).toBe(false);
    }
  });

  it('keeps the water strip below the corner buttons and the heading', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * landFor('lantern-lake').backdrop.horizon;
      const water = { x: 0, y: ground - WATER_ABOVE, w: view.w, h: WATER_ABOVE + WATER_BELOW };
      expect(water.y, name).toBeGreaterThanOrEqual(130);
      for (const k of [...landButtons(view.w), { x: view.w / 2 - 190, y: 20, w: 380, h: 90 }]) expect(overlaps(water, k), name).toBe(false);
    }
  });
});

describe('the last two locations', () => {
  it('keep their lands\' hosts and skies, and Explore lists every land', () => {
    for (const id of ['barnyard', 'lantern-lake'] as const) {
      const place = LOCATIONS[id];
      expect(place, id).toBeDefined();
      expect(place?.resident, id).toBeUndefined();
      expect(place?.backdrop, id).toBeUndefined();
    }
    expect([...exploreIds()].sort()).toEqual([...LAND_IDS].sort());
  });
});
