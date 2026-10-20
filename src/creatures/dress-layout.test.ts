import { describe, expect, it } from 'vitest';
import { computeView } from '../engine/view';
import { HOME_BUTTON } from './home-layout';
import { OFF_RADIUS, dressLayout } from './dress-layout';
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
];

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  what: string;
}
const square = (x: number, y: number, half: number, what: string): Box => ({ x0: x - half, y0: y - half, x1: x + half, y1: y + half, what });
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('the dressing layout', () => {
  it('fits the friend, every card and both buttons on screen and apart, in every view, for every species', () => {
    const counts = [...new Set([...SPECIES_IDS.map((s) => wearableBy(s).length), 1, 9])];
    for (const v of VIEWS) {
      for (const count of counts) {
        const l = dressLayout(v, count);
        expect(l.cards).toHaveLength(count);
        // The stage friend, wearing a sun hat or holding an umbrella, at up to 1.15 scale.
        const r = 150 * l.stage.scale;
        const stage: Box = { x0: l.stage.x - r, y0: l.stage.y - 280 * l.stage.scale, x1: l.stage.x + r, y1: l.stage.y + 10, what: 'stage' };
        const boxes: Box[] = [...l.cards.map((c, i) => square(c.x, c.y, CARD / 2, `card ${i}`)), square(l.off.x, l.off.y, OFF_RADIUS + 6, 'off'), square(BACK.x, BACK.y, BACK.r - 6, 'back'), square(HOME_BUTTON.x, HOME_BUTTON.y, 58, 'home at the root'), stage];
        const where = `${v.w}×${v.h}, ${count} items`;
        expect(OFF_RADIUS * 2).toBeGreaterThanOrEqual(100);
        for (const b of boxes) {
          expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
          expect(b.y0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
          expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
          expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j]), `${boxes[i].what} and ${boxes[j].what}, ${where}`).toBe(false);
        }
      }
    }
  });
});
