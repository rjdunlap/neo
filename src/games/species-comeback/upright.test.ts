import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { comebackLayout } from './index';
import { extend, hatch, makeRound } from './logic';

describe('Species Comeback’s upright family tree', () => {
  it.each([
    [390, 844],
    [390, 640],
    [768, 1024],
  ])('fits the board and its fixed controls at %i × %i', (w, h) => {
    const view = computeView(w, h, NO_INSETS, true);
    for (let level = 1; level <= 4; level++) {
      for (let seed = 0; seed < 20; seed++) {
        const round = makeRound(level, new Rng(seed));
        const layout = comebackLayout(view, round.tree, [], round.target);
        expect(layout.card).toBe(level === 1 ? 96 : 88);
        expect(layout.scroll > 0).toBe(level > 1);
        for (const { x, y } of layout.slots.values()) {
          expect(x - layout.card / 2).toBeGreaterThanOrEqual(20);
          expect(x + layout.card / 2).toBeLessThanOrEqual(view.w - 20 + layout.scroll);
          expect(y - layout.card / 2).toBeGreaterThanOrEqual(layout.wall.top);
          expect(y + layout.card / 2).toBeLessThan(layout.wall.bottom);
        }
        for (const { x, y } of layout.nests) {
          expect(x - 60).toBeGreaterThanOrEqual(20);
          expect(x + 60).toBeLessThanOrEqual(view.w - 20);
          expect(y - 50).toBeGreaterThan(layout.wall.bottom);
        }
        const plan = round.keeper
          ? round.keeper[round.keeper.fits]
          : extend(round.tree, [], round.plan.depth, round.target)!;
        const hatchlings = hatch(round.tree, plan, new Rng(seed));
        const after = comebackLayout(view, round.tree, hatchlings, round.target);
        for (const turtle of hatchlings) {
          const { x, y } = after.slots.get(turtle.id)!;
          expect(Math.abs(x - (view.w + after.scroll) / 2) + after.hatch / 2).toBeLessThan(view.w / 2 - 20);
          expect(y + after.hatch / 2).toBeLessThan(after.wall.bottom);
        }
        expect(layout.spring.y + 44).toBeLessThanOrEqual(view.h);
        if (level === 4) {
          const { note, zone } = layout.keeper;
          for (const { y } of layout.slots.values()) {
            expect(y + layout.card / 2).toBeLessThan(note.y);
          }
          expect(zone.y + zone.h).toBeLessThanOrEqual(view.h);
          expect((zone.w - 20) / 3).toBeGreaterThanOrEqual(88);
        }
      }
    }
  });
});
