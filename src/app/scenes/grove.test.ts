import { describe, expect, it } from 'vitest';
import { landButtons, landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { exploreIds } from './ExploreScene';
import { LOCATIONS } from './LocationScene';
import { meadowKeepOut } from './meadow';
import { GROVE_BACKDROP, groveEdge, grovePlan, grovePlanSky } from './grove';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const grove = landFor('story-grove');

/** Every layout Story Grove uses: each band, both sides of the signpost, every view. */
function* layouts() {
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * GROVE_BACKDROP.horizon;
    for (const band of BANDS.map((b) => b.id) as Band[]) {
      const mine = visibleIn(grove, band, GAMES).length;
      const older = olderIn(grove, band, GAMES).length;
      for (const n of older ? [mine, older] : [mine]) {
        const layout = landLayout(n, older > 0, view, ground)!;
        yield { view, ground, layout, where: `${band} ${name} n=${n}` };
      }
    }
  }
}

describe('Story Grove as a location', () => {
  it('keeps every grove drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const { view, ground, layout, where: where0 } of layouts()) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = grovePlan(layout, view, ground);
      // A night garden, not a dark lawn: evening primrose, and one of the night animals.
      expect(plan.filter((p) => p.kind === 'primrose').length, where0).toBeGreaterThanOrEqual(1);
      expect(plan.filter((p) => p.kind === 'owl' || p.kind === 'hedgehog').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        expect(r.y, where).toBeGreaterThan(ground);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(grovePlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('puts the moon, stars and bats in clear sky above the far hills, off the corner buttons and the heading', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * GROVE_BACKDROP.horizon;
      const { moon, stars, bats } = grovePlanSky(view, ground);
      const heading = { x: view.w / 2 - 190, y: 20, w: 380, h: 90 };
      const off = [...landButtons(view.w), heading];
      const moonBox = { x: moon.x - moon.r, y: moon.y - moon.r, w: 2 * moon.r, h: 2 * moon.r };
      expect(moonBox.y, name).toBeGreaterThanOrEqual(0);
      expect(moonBox.y + moonBox.h, name).toBeLessThanOrEqual(ground - 168);
      for (const k of off) expect(overlaps(moonBox, k), name).toBe(false);
      expect(stars.length, name).toBeGreaterThanOrEqual(8);
      const boxes = [...stars.map((s) => ({ x: s.x - s.r, y: s.y - s.r, w: 2 * s.r, h: 2 * s.r })), ...bats.map((b) => b.rect)];
      for (const b of boxes) {
        expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= ground - 168, name).toBe(true);
        for (const k of [...off, moonBox]) expect(overlaps(b, k), name).toBe(false);
      }
    }
  });

  it('edges the lawn with woodland across the view, under the corner buttons and the heading', () => {
    for (const view of Object.values(VIEWS)) {
      const ground = view.h * GROVE_BACKDROP.horizon;
      const edge = groveEdge(view, ground);
      expect(edge[0].x - edge[0].r).toBeLessThan(0);
      expect(edge[edge.length - 1].x + edge[edge.length - 1].r).toBeGreaterThan(view.w);
      for (let i = 0; i < edge.length; i++) {
        expect(edge[i].cy - edge[i].r).toBeGreaterThanOrEqual(130);
        expect(edge[i].cy).toBeLessThan(ground);
        if (i) expect(edge[i].x - edge[i - 1].x).toBeLessThan(edge[i].r + edge[i - 1].r);
      }
    }
  });

  it('is a night location whose land host greets her until Lumen, its resident, is prepared, and Explore lists it', () => {
    const place = LOCATIONS['story-grove'];
    expect(place).toBeDefined();
    expect(place?.resident).toBeUndefined();
    expect(place?.backdrop).toBe(GROVE_BACKDROP);
    expect(GROVE_BACKDROP.sun).toBeFalsy();
    expect(GROVE_BACKDROP.clouds ?? 0).toBe(0);
    // Its horizon is the land's, so the layout is the land's; and the classic island keeps its day.
    expect(GROVE_BACKDROP.horizon).toBe(grove.backdrop.horizon);
    expect(grove.backdrop.sun).toBe(true);
    expect(exploreIds()).toContain('story-grove');
  });
});
