import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  ARROW_R,
  arrowSpots,
  cardSpots,
  FRIEND_BOX,
  islandCenter,
  ISLAND,
  MAP_CARD,
  RING,
  shoreSpots,
  TILE,
  VIEW_CARD,
} from './layout';
import { PLANS } from './logic';

/**
 * Peekaround Island held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views.
 * The targets are the turning arrows, the picture tiles, view cards and sky maps, and the shore friends' bodies; the
 * island and its ring of friends must stay inside the 768-wide view and clear of the cards above and the shore below.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
};

/** How many cards a level shows: 3 friends (who), up to 4 (two, see), 3 views, 3 maps. */
const CARDS: Record<string, number[]> = { who: [3], two: [2, 3, 4], view: [3], sky: [3] };

describe.each(Object.entries(views))('Peekaround Island upright on %s', (_, v) => {
  it.each(PLANS.map((p) => [p.mode, p] as const))('level %s: targets are whole, apart and clear', (mode) => {
    for (const n of CARDS[mode] ?? [0]) {
      const c = islandCenter(v, mode, n);
      const t: Target[] = [];
      if (mode === 'find' || mode === 'named') {
        const a = arrowSpots(v, c);
        t.push(square('left arrow', a.left, ARROW_R * 2), square('right arrow', a.right, ARROW_R * 2));
        for (const p of [a.left, a.right]) expect(p.y + ARROW_R).toBeLessThan(v.h);
        // The arrows sit beneath the island's shadow, not on it.
        expect(a.left.y - ARROW_R).toBeGreaterThan(c.y + ISLAND.y + 36 + 40);
      }
      if (mode === 'view')
        cardSpots(v, mode, n).forEach((p, i) =>
          t.push({ what: `view ${i}`, x: p.x, y: p.y, w: VIEW_CARD.w, h: VIEW_CARD.h }),
        );
      else if (mode === 'sky')
        cardSpots(v, mode, n).forEach((p, i) => t.push(square(`map ${i}`, p, MAP_CARD.size)));
      else if (n > 0)
        cardSpots(v, mode, n).forEach((p, i) =>
          t.push({ what: `tile ${i}`, x: p.x, y: p.y, w: TILE.w, h: TILE.h }),
        );
      expect(uprightProblems(v, t), `${mode} ${n}`).toEqual([]);

      // The island, its shadow and its ring of friends stay inside the view and below the cards above.
      expect(c.x - ISLAND.x - 60).toBeGreaterThanOrEqual(0);
      expect(c.x + ISLAND.x + 60).toBeLessThanOrEqual(v.w);
      expect(c.x - RING.x - FRIEND_BOX / 2).toBeGreaterThan(0);
      const cardsBottom = Math.max(
        0,
        ...t.filter((x) => !x.what.includes('arrow')).map((x) => x.y + x.h / 2),
      );
      // The tree's crown reaches about 300 above the island's centre; the island's top is its ellipse.
      expect(c.y - 300, `${mode} crown`).toBeGreaterThan(cardsBottom);
      expect(c.y + ISLAND.y + 76).toBeLessThan(v.h);
    }
    // Friends waiting on the shore (levels 4 and 5): whole, apart, clear of the guide, and below the island.
    if (mode === 'place' || mode === 'two') {
      for (const n of mode === 'place' ? [1, 2, 3] : [1, 2, 3, 4]) {
        const spots = shoreSpots(v, n);
        const boxes = spots.map((p, i) => ({
          what: `friend ${i}`,
          x: p.x,
          y: p.y - FRIEND_BOX / 2,
          w: FRIEND_BOX,
          h: FRIEND_BOX,
        }));
        expect(uprightProblems(v, boxes), `shore ${n}`).toEqual([]);
        const c = islandCenter(v, mode);
        for (const b of boxes)
          expect(b.y - b.h / 2, `shore ${n} clears the island`).toBeGreaterThan(c.y + ISLAND.y + 76);
      }
    }
  });
});
