import { describe, expect, it } from 'vitest';
import { landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { SPECIES } from '../../creatures/species';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { LOCATIONS } from './LocationScene';
import { meadowKeepOut, meadowPlan } from './meadow';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const meadow = landFor('rainbow-meadow');

describe('Rainbow Meadow as a location', () => {
  it('keeps every meadow drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * meadow.backdrop.horizon;
      for (const band of BANDS.map((b) => b.id) as Band[]) {
        const mine = visibleIn(meadow, band, GAMES).length;
        const older = olderIn(meadow, band, GAMES).length;
        for (const n of older ? [mine, older] : [mine]) {
          const layout = landLayout(n, older > 0, view, ground)!;
          const keepOut = meadowKeepOut(layout, view);
          const plan = meadowPlan(layout, view, ground);
          // A meadow, not a bare field: there is room for flowers at every size.
          expect(plan.filter((p) => ['clover', 'daisy', 'poppy'].includes(p.kind)).length, `${band} ${name}`).toBeGreaterThanOrEqual(6);
          for (const { kind, rect: r } of plan) {
            const where = `${kind} ${band} ${name} n=${n}`;
            expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
            for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
          }
          expect(meadowPlan(layout, view, ground)).toEqual(plan);
        }
      }
    }
  });

  it('is the home of its resident, an island species', () => {
    for (const [id, place] of Object.entries(LOCATIONS)) if (place!.resident) expect(SPECIES[place!.resident].land).toBe(id);
  });
});
