import { describe, expect, it } from 'vitest';
import { landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { beachPlan, poolLife, sunRect } from './beach';
import { LOCATIONS } from './LocationScene';
import { meadowKeepOut } from './meadow';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const beach = landFor('bubble-beach');

/** Every layout Bubble Beach uses: each band, both sides of the signpost, every view. */
function* layouts() {
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * beach.backdrop.horizon;
    for (const band of BANDS.map((b) => b.id) as Band[]) {
      const mine = visibleIn(beach, band, GAMES).length;
      const older = olderIn(beach, band, GAMES).length;
      for (const n of older ? [mine, older] : [mine]) {
        const layout = landLayout(n, older > 0, view, ground)!;
        yield { view, ground, layout, where: `${band} ${name} n=${n}` };
      }
    }
  }
}

describe('Bubble Beach as a location', () => {
  it('keeps every shore drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const { view, ground, layout, where: where0 } of layouts()) {
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

  it('is a location whose land host greets her until Tote, its resident, is prepared', () => {
    expect(LOCATIONS['bubble-beach']).toBeDefined();
    expect(LOCATIONS['bubble-beach']?.resident).toBeUndefined();
  });
});
