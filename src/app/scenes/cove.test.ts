import { describe, expect, it } from 'vitest';
import { landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { LOCATIONS } from './LocationScene';
import { covePlan, freshEdge, mouthEdge } from './cove';
import { meadowKeepOut } from './meadow';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const cove = landFor('counting-cove');

describe('Counting Cove as a location', () => {
  it('keeps every marsh drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * cove.backdrop.horizon;
      for (const band of BANDS.map((b) => b.id) as Band[]) {
        const mine = visibleIn(cove, band, GAMES).length;
        const older = olderIn(cove, band, GAMES).length;
        for (const n of older ? [mine, older] : [mine]) {
          const layout = landLayout(n, older > 0, view, ground)!;
          const keepOut = meadowKeepOut(layout, view);
          const plan = covePlan(layout, view, ground);
          const where0 = `${band} ${name} n=${n}`;
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
      }
    }
  });

  it('is a location with River as its resident', () => {
    expect(LOCATIONS['counting-cove']?.resident).toBe('river');
  });
});
