import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { exhibitLayout, type Rect } from './layout';
import { MAX_LEVEL, planFor } from './logic';

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('Sense Detective exhibit', () => {
  const views = {
    landscape: computeView(1024, 768),
    wide: computeView(844, 390),
    tablet: computeView(768, 1024),
    'minimum upright area': computeView(768, 1024, NO_INSETS, true),
    'upright phone': computeView(390, 844, NO_INSETS, true),
    'short phone with captions': captionPlace(computeView(375, 667, NO_INSETS, true), true).game,
    'upright phone with safe insets': captionPlace(
      computeView(390, 844, { left: 12, right: 12, top: 44, bottom: 34 }, true),
      true,
    ).game,
  };

  for (const [name, view] of Object.entries(views)) {
    it(`keeps the exhibit, targets and corner controls clear in ${name} at all levels`, () => {
      for (let level = 1; level <= MAX_LEVEL; level++) {
        const plan = planFor(level);
        const l = exhibitLayout(view, level);
        const tell = plan.mode === 'tell';
        const keepOut = [
          { x: 0, y: 0, w: 115, h: 210 },
          { x: 0, y: view.h - 170, w: 160, h: 170 },
        ];
        expect(l.shelf).toHaveLength(plan.shelf.length);
        expect(l.strip).toHaveLength(tell ? 2 : plan.channels.length);
        expect(!!l.listen).toBe(plan.channels.includes('sound'));
        expect(!!l.cantTell).toBe(tell);
        expect(l.choices).toHaveLength(tell ? 2 : 0);

        // Check later clues and the ear even when they start hidden. The sense choices replace the toys.
        const common = [l.look, l.check, ...l.strip, ...(l.listen ? [l.listen] : [])];
        const phases = [[...common, ...l.shelf, ...(l.cantTell ? [l.cantTell] : [])]];
        if (tell) phases.push([...common, ...l.choices], [...common, ...l.shelf]);
        for (const [phase, targets] of phases.entries()) {
          const hint = `level ${level}, phase ${phase + 1}`;
          for (const r of targets) {
            expect(r.w, hint).toBeGreaterThanOrEqual(100);
            expect(r.h, hint).toBeGreaterThanOrEqual(100);
          }
          const all = [l.parcel, ...targets];
          for (const [i, r] of all.entries()) {
            expect(r.x, hint).toBeGreaterThanOrEqual(0);
            expect(r.y, hint).toBeGreaterThanOrEqual(0);
            expect(r.x + r.w, hint).toBeLessThanOrEqual(view.w);
            expect(r.y + r.h, hint).toBeLessThanOrEqual(view.h);
            expect(
              keepOut.some((chrome) => overlaps(r, chrome)),
              hint,
            ).toBe(false);
            expect(
              all.slice(i + 1).some((other) => overlaps(r, other)),
              hint,
            ).toBe(false);
          }
        }
      }
    });
  }
});
