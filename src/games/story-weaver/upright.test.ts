import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CONTROL_R, layout, planFor, slotBoxes, TILE_H, TILE_W } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

describe('Story Weaver layout', () => {
  it('keeps the sideways plan: pages in a row under the header, tray beside the owl', () => {
    const L = layout(sideways, 3);
    expect(L.pages.map((b) => b.y)).toEqual([108, 108, 108]);
    expect(L.owl.x).toBe(1024 - 184);
    expect(L.controls[0]).toEqual({ x: 176 + CONTROL_R + 16, y: 768 - CONTROL_R - 8 });
  });
});

describe.each(Object.entries(views))('Story Weaver upright on %s', (_, v) => {
  it.each([1, 2, 3])(
    'level %i: slots, tiles, buttons and owl fit, apart, clear of Home and the guide',
    (level) => {
      const pages = planFor(level).pages;
      const L = layout(v, pages);
      const t: Target[] = [];
      L.pages.forEach((box, i) =>
        slotBoxes(box, i + 1).forEach((b, j) =>
          t.push({
            what: `page ${i + 1} slot ${j}`,
            x: box.x + b.x + b.w / 2,
            y: box.y + b.y + b.h / 2,
            w: b.w,
            h: b.h,
          }),
        ),
      );
      L.tiles(6).forEach((p, i) => t.push({ what: `tile ${i}`, x: p.x, y: p.y, w: TILE_W, h: TILE_H }));
      L.controls.forEach((p, i) =>
        t.push({ what: `button ${i}`, x: p.x, y: p.y, w: CONTROL_R * 2, h: CONTROL_R * 2 }),
      );
      const at = (what: string, b: { x: number; y: number; w: number; h: number }): Target => ({
        what,
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        w: b.w,
        h: b.h,
      });
      t.push(at('the owl', L.owl));
      expect(uprightProblems(v, t)).toEqual([]);
      // The words strip is read, not tapped: it only has to fit and stay clear of the rest.
      expect(uprightProblems(v, [...t, at('the words strip', L.strip)], 0)).toEqual([]);
      // Hung up from the bottom edge: the buttons sit on it.
      expect(v.h - (L.controls[0].y + CONTROL_R)).toBeLessThanOrEqual(10);
    },
  );
});
