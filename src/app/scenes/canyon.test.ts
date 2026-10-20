import { describe, expect, it } from 'vitest';
import { landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { exploreIds } from './ExploreScene';
import { LOCATIONS } from './LocationScene';
import { canyonPlan, canyonRim } from './canyon';
import { meadowKeepOut } from './meadow';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const canyon = landFor('treehouse');

/** Every layout Painted Canyon uses: each band, both sides of the signpost, every view. */
function* layouts() {
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * canyon.backdrop.horizon;
    for (const band of BANDS.map((b) => b.id) as Band[]) {
      const mine = visibleIn(canyon, band, GAMES).length;
      const older = olderIn(canyon, band, GAMES).length;
      for (const n of older ? [mine, older] : [mine]) {
        const layout = landLayout(n, older > 0, view, ground)!;
        yield { view, ground, layout, where: `${band} ${name} n=${n}` };
      }
    }
  }
}

describe('Painted Canyon as a location', () => {
  it('keeps every canyon drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const { view, ground, layout, where: where0 } of layouts()) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = canyonPlan(layout, view, ground);
      // A desert with a spring, not bare sand: the spring, a cactus or yucca, and one of its animals.
      expect(plan.filter((p) => p.kind === 'spring').length, where0).toBe(1);
      expect(plan.filter((p) => p.kind === 'pear' || p.kind === 'yucca').length, where0).toBeGreaterThanOrEqual(2);
      expect(plan.filter((p) => p.kind === 'roadrunner' || p.kind === 'lizard' || p.kind === 'jackrabbit').length, where0).toBeGreaterThanOrEqual(1);
      for (const { kind, y, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        expect(y, where).toBeGreaterThan(ground);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(canyonPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('runs the rock rim edge to edge behind the field, under the corner buttons and the heading, and low across the sun', () => {
    for (const view of Object.values(VIEWS)) {
      const ground = view.h * canyon.backdrop.horizon;
      const { far, near } = canyonRim(view, ground);
      // The far wall leaves no gap, so the backdrop's far hills (up to 168 above the ground) never show between rocks.
      expect(far[0].left).toBeLessThanOrEqual(0);
      expect(far[far.length - 1].right).toBeGreaterThanOrEqual(view.w);
      for (let i = 1; i < far.length; i++) expect(far[i].left).toBe(far[i - 1].right);
      const sunX = Math.max(230, view.w * 0.2);
      for (const m of [...far, ...near]) {
        expect(m.top).toBeGreaterThanOrEqual(130);
        expect(m.top).toBeLessThan(ground);
        // Across the sun the rock stays below its middle, so she can still find it to poke.
        if (m.right + m.spread > sunX - 58 && m.left - m.spread < sunX + 58) expect(m.top).toBeGreaterThan(150);
      }
    }
  });

  it('is a location whose land host greets her until Dapple, its resident, is prepared, and Explore lists it', () => {
    expect(LOCATIONS.treehouse).toBeDefined();
    expect(LOCATIONS.treehouse?.resident).toBeUndefined();
    expect(exploreIds()).toContain('treehouse');
  });
});
