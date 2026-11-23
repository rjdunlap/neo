import { describe, expect, it } from 'vitest';
import { computeView } from '../engine/view';
import { UPRIGHT_SCREENS } from '../games/upright-check';
import { HOME_BUTTON } from './home-layout';
import { OFF_RADIUS, SWATCH_RADIUS, dressLayout, swatchRow } from './dress-layout';
import { ALL_PET_COLORS, PET_COLORS } from '../content/world';
import { BACK, CARD } from './friends-layout';
import { SPECIES_IDS } from './species';
import { wearableBy } from './companion';

/** The Friends views: an iPad sideways and upright, a phone sideways, one with a notch, and a wide laptop. */
const VIEWS = [
  computeView(1024, 768),
  computeView(768, 1024),
  computeView(844, 390),
  computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  computeView(1366, 768),
  // A phone held upright on the 768 × 1024 upright area (chunk 31, shell slice 2).
  ...Object.values(UPRIGHT_SCREENS),
];

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  what: string;
}
const square = (x: number, y: number, half: number, what: string): Box => ({
  x0: x - half,
  y0: y - half,
  x1: x + half,
  y1: y + half,
  what,
});
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('the dressing layout', () => {
  it('leaves the colour row out when there are no colours, as before the row existed', () => {
    const v = computeView(1024, 768);
    expect(swatchRow(v, 0).spots).toEqual([]);
    expect(dressLayout(v, 7).cards[0].y).toBeLessThan(dressLayout(v, 7, 0).cards[6].y);
    expect(dressLayout(v, 7, 8).stage.y).toBeLessThan(dressLayout(v, 7).stage.y);
  });

  it('fits the friend, every card and both buttons on screen and apart, in every view, for every species', () => {
    const counts = [...new Set([...SPECIES_IDS.map((s) => wearableBy(s).length), 1, 9])];
    for (const v of VIEWS) {
      // The colour row: her first eight colours, or all fourteen once she has mixed the paint shelf.
      for (const [count, colours] of counts.flatMap((c) => [
        [c, PET_COLORS.length],
        [c, ALL_PET_COLORS.length],
      ])) {
        const l = dressLayout(v, count, colours);
        expect(l.cards).toHaveLength(count);
        // The stage friend, wearing a sun hat or holding an umbrella, at up to 1.15 scale.
        const r = 150 * l.stage.scale;
        const stage: Box = {
          x0: l.stage.x - r,
          y0: l.stage.y - 280 * l.stage.scale,
          x1: l.stage.x + r,
          y1: l.stage.y + 10,
          what: 'stage',
        };
        const boxes: Box[] = [
          ...l.cards.map((c, i) => square(c.x, c.y, CARD / 2, `card ${i}`)),
          square(l.off.x, l.off.y, OFF_RADIUS + 6, 'off'),
          square(BACK.x, BACK.y, BACK.r - 6, 'back'),
          square(HOME_BUTTON.x, HOME_BUTTON.y, 58, 'home at the root'),
          stage,
          ...l.row.spots.map((s, i) => square(s.x, s.y, SWATCH_RADIUS, `swatch ${i}`)),
          ...[l.row.previous, l.row.next].flatMap((a, i) =>
            a ? [square(a.x, a.y, SWATCH_RADIUS + 6, `row arrow ${i}`)] : [],
          ),
        ];
        const where = `${v.w}×${v.h}, ${count} items, ${colours} colours`;
        expect(SWATCH_RADIUS * 2).toBeGreaterThanOrEqual(100);
        // Every colour is reachable: all on one page, or paged between two arrows with at least two a page.
        expect(!!l.row.previous).toBe(l.row.perPage < colours);
        expect(!!l.row.next).toBe(l.row.perPage < colours);
        expect(l.row.perPage, where).toBeGreaterThanOrEqual(Math.min(2, colours));
        expect(l.row.spots).toHaveLength(l.row.perPage);
        expect(OFF_RADIUS * 2).toBeGreaterThanOrEqual(100);
        for (const b of boxes) {
          expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
          expect(b.y0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
          expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
          expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++)
            expect(overlap(boxes[i], boxes[j]), `${boxes[i].what} and ${boxes[j].what}, ${where}`).toBe(
              false,
            );
        }
      }
    }
  });
});
