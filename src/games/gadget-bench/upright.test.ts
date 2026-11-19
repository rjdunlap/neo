import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { benchLayout, BUTTON_R, HAND, PART, TILE, type Rect } from './logic';

/**
 * Gadget Bench held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the three upright phone
 * views, the captioned one and a short one. What a level shows to touch: the tray parts, the sockets on the boards (a
 * part is dropped on a board), level 1's Give hands, levels 2–3's Try and Give buttons, and the path's tiles. The tile
 * and tray counts are each level's own (the levels' largest round, tray plus the shown cart's part).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const cases: [number, number, number][] = [
  [1, 2, 0],
  [2, 3, 3],
  [3, 3, 4],
  [4, 4, 4],
  [5, 4, 4],
  [6, 3, 4],
  [6, 4, 5],
];

const at = (what: string, r: Rect): Target => ({ what, x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h });

describe.each(Object.entries(views))('Gadget Bench upright on %s', (_, v) => {
  it.each(cases)(
    'level %i (%i tiles, %i in the tray): whole, apart, in view and clear of Home and the guide',
    (level, tiles, tray) => {
      const l = benchLayout(level, tiles, tray, v);
      expect(l, `level ${level} has a layout`).not.toBeNull();
      const t: Target[] = [];
      l!.tray.forEach((r, i) => t.push(at(`part ${i + 1}`, r)));
      l!.boards.forEach((r, i) => t.push(at(`board ${i + 1}`, r)));
      l!.hands.forEach((r, i) => t.push(at(`hand ${i + 1}`, r)));
      l!.tiles.forEach((r, i) => t.push(at(`tile ${i + 1}`, r)));
      if (l!.tryButton) t.push(at('Try', l!.tryButton));
      if (l!.giveButton) t.push(at('Give', l!.giveButton));
      t.push(at('the request card', l!.request));
      // Tiles and the strip are not touched: tiles only show the path.
      const touch = t.filter((x) => !x.what.startsWith('tile') && x.what !== 'the request card');
      expect(uprightProblems(v, touch), `level ${level}`).toEqual([]);
      // Everything drawn (tiles and the card too) stays whole, apart and clear of Home and the guide.
      expect(uprightProblems(v, t, 0), `level ${level} drawn`).toEqual([]);
      for (const r of l!.boards) expect(r.h).toBeGreaterThanOrEqual(180);
      expect(PART).toBeGreaterThanOrEqual(100);
      expect(HAND).toBeGreaterThanOrEqual(100);
      expect(TILE).toBeGreaterThan(0);
      expect(BUTTON_R * 2).toBeGreaterThanOrEqual(100);
    },
  );

  it.each(cases)(
    'level %i: the bottom row of controls stands up from the bottom edge',
    (level, tiles, tray) => {
      const l = benchLayout(level, tiles, tray, v)!;
      // The round-ending buttons sit in the bottom 40% of the view, not at the top of a tall phone.
      for (const b of [l.tryButton, l.giveButton, ...l.hands])
        if (b) expect(b.y + b.h).toBeGreaterThan(v.h * 0.6);
      for (const p of l.tray) expect(p.y + p.h).toBeGreaterThan(v.h * 0.6);
    },
  );
});
