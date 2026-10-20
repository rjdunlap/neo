import { describe, expect, it } from 'vitest';
import { computeView } from '../engine/view';
import { ARROW_RADIUS, BACK, CARD, COME_RADIUS, DRESS_RADIUS, friendsLayout, pageCount, PER_PAGE } from './friends-layout';

/** The four views the land layouts are tested in (an iPad sideways and upright, a phone sideways, one with a notch), and a wide laptop. */
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

describe('the Friends layout', () => {
  it('fits every target on screen, apart and full size, in all four views and on every page', () => {
    for (const v of VIEWS) {
      for (let count = 1; count <= 13; count++) {
        for (let page = 0; page < pageCount(count); page++) {
          const l = friendsLayout(v, count, page);
          expect(l.cards).toHaveLength(Math.min(PER_PAGE, count - page * PER_PAGE));
          // The stage friend: its body-centred touch circle (about 120 units across the feet's top) stays on screen.
          const stage: Box = { x0: l.stage.x - 130, y0: l.stage.y - 230, x1: l.stage.x + 130, y1: l.stage.y + 10, what: 'stage' };
          const boxes: Box[] = [
            ...l.cards.map((c, i) => square(c.x, c.y, CARD / 2, `card ${i}`)),
            square(l.come.x, l.come.y, COME_RADIUS + 6, 'come'),
            square(l.dress.x, l.dress.y, DRESS_RADIUS + 6, 'dress'),
            square(BACK.x, BACK.y, BACK.r - 6, 'back'),
            stage,
          ];
          if (l.arrows) boxes.push(square(l.arrows.previous.x, l.arrows.previous.y, ARROW_RADIUS, 'previous'), square(l.arrows.next.x, l.arrows.next.y, ARROW_RADIUS, 'next'));
          const where = `${v.w}×${v.h}, ${count} friends, page ${page}`;
          for (const b of boxes) {
            expect(b.x0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
            expect(b.y0, `${b.what} ${where}`).toBeGreaterThanOrEqual(0);
            expect(b.x1, `${b.what} ${where}`).toBeLessThanOrEqual(v.w);
            expect(b.y1, `${b.what} ${where}`).toBeLessThanOrEqual(v.h);
          }
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              expect(overlap(boxes[i], boxes[j]), `${boxes[i].what} and ${boxes[j].what}, ${where}`).toBe(false);
            }
          }
          expect(!!l.arrows).toBe(count > PER_PAGE);
        }
      }
    }
  });

  it('pages six at a time', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(6)).toBe(1);
    expect(pageCount(7)).toBe(2);
    expect(friendsLayout(VIEWS[0], 7, 1).cards).toHaveLength(1);
    expect(friendsLayout(VIEWS[0], 7, 9).cards).toHaveLength(1);
  });
});
