import { describe, expect, it } from 'vitest';
import { landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { exploreIds } from './ExploreScene';
import { LOCATIONS } from './LocationScene';
import { residentProblems } from './resident-check';
import { meadowKeepOut } from './meadow';
import { cloudRidge, mistBands, mountainPlan } from './mountain';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const mountain = landFor('music-mountain');

/** Every layout Music Mountain uses: each band, both sides of the signpost, every view. */
function* layouts() {
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * mountain.backdrop.horizon;
    for (const band of BANDS.map((b) => b.id) as Band[]) {
      const mine = visibleIn(mountain, band, GAMES).length;
      const older = olderIn(mountain, band, GAMES).length;
      for (const n of older ? [mine, older] : [mine]) {
        const layout = landLayout(n, older > 0, view, ground)!;
        yield { view, ground, layout, where: `${band} ${name} n=${n}` };
      }
    }
  }
}

describe('Music Mountain as a location', () => {
  it('keeps every forest drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const { view, ground, layout, where: where0 } of layouts()) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = mountainPlan(layout, view, ground);
      // A cloud forest, not a bare slope: big trees or tree ferns, orchids, and a hummingbird.
      expect(plan.filter((p) => p.kind === 'trunk' || p.kind === 'fern').length, where0).toBeGreaterThanOrEqual(2);
      expect(plan.filter((p) => p.kind === 'orchid').length, where0).toBeGreaterThanOrEqual(1);
      expect(plan.filter((p) => p.kind === 'hummingbird').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, y, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        expect(y, where).toBeGreaterThan(ground);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(mountainPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('keeps the far mountains and their mist behind the field, under the corner buttons and the heading', () => {
    for (const view of Object.values(VIEWS)) {
      const ground = view.h * mountain.backdrop.horizon;
      for (const p of cloudRidge(view, ground)) {
        expect(p.top).toBeGreaterThanOrEqual(130);
        expect(p.top).toBeLessThan(ground);
      }
      for (const m of mistBands(view, ground)) {
        expect(m.y - 18).toBeGreaterThanOrEqual(110);
        expect(m.y + 11).toBeLessThanOrEqual(ground);
      }
    }
  });

  it('is a location with Trill as its resident, whose touch circle and motion clear every other spot, and Explore lists it', () => {
    expect(LOCATIONS['music-mountain']).toBeDefined();
    expect(exploreIds()).toContain('music-mountain');
    expect(LOCATIONS['music-mountain']?.resident).toBe('trill');
    expect(residentProblems('trill')).toEqual([]);
  });
});
