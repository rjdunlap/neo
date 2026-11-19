import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { journeyLayout, LAND_TALL, stripRoom, type Box } from './layout';
import { LEVELS, maxCards, offer, PLACES } from './logic';

/**
 * Drop's Journey held upright (chunk 31, docs/definitions/phone-portrait.md): every level, every number of cards a stop
 * can deal, on the three upright phone views, the captioned one and a short one. The targets are the cards, the book and
 * the leaf (level 2's postcard sits where the leaf will). As in the scene, the land, the strip, the book and the leaf are
 * laid out once for the most cards the level deals, and each stop's cards for the number it has.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

/** Every number of cards a level deals at a stop, over every place and many seeds. */
function deals(level: number): number[] {
  const seen = new Set<number>();
  for (const from of PLACES)
    for (let seed = 1; seed <= 60; seed++) {
      seen.add(offer(level, from, new Rng(seed)).length);
      seen.add(offer(level, from, new Rng(seed), true).length);
    }
  return [...seen].sort((a, b) => a - b);
}

const target = (what: string, b: Box): Target => ({ what, ...b });
const overlap = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;

it('covers levels 1 to 3, and every deal from two cards to five', () => {
  expect(levels).toEqual([1, 2, 3]);
  expect(deals(1)).toEqual([2, 3]);
  expect(deals(2)).toEqual([2, 3, 5]);
  expect(deals(3)).toEqual([3]);
  for (const level of levels) expect(Math.max(...deals(level))).toBeLessThanOrEqual(maxCards(level));
});

describe.each(Object.entries(views))("Drop's Journey upright on %s", (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      const l = journeyLayout(v, maxCards(level))!;
      expect(l).not.toBeNull();
      for (const n of deals(level)) {
        const at = `level ${level}, ${n} cards`;
        const cards = journeyLayout(v, n)!.cards;
        expect(cards.length, at).toBe(n);
        const targets = [
          ...cards.map((c, i) => target(`card ${i + 1}`, c)),
          target('the book', l.book),
          target('the leaf', l.leaf),
        ];
        expect(uprightProblems(v, targets), at).toEqual([]);
        for (const c of cards) {
          expect(c.w, at).toBeGreaterThanOrEqual(150);
          expect(c.h, at).toBeGreaterThanOrEqual(130);
          // No card lies on the land or on the journey strip.
          expect(overlap(c, l.land), at).toBe(false);
          expect(overlap(c, l.strip), at).toBe(false);
        }
      }
      expect(l.postcard).toEqual(l.leaf);
    },
  );

  it.each(levels)(
    'level %i: the strip, the book and the leaf sit just above the cards, in reach',
    (level) => {
      const l = journeyLayout(v, maxCards(level))!;
      const cardsTop = Math.min(...l.cards.map((c) => c.y - c.h / 2));
      for (const b of [l.book, l.leaf, l.strip]) {
        expect(b.y + b.h / 2).toBeLessThanOrEqual(cardsTop - 20 + 1e-6);
        expect(cardsTop - (b.y + b.h / 2)).toBeLessThanOrEqual(50);
        expect(overlap(b, l.land)).toBe(false);
      }
      // Every touch is in the bottom of the screen: 450 units is 229 px of a 390 × 844 phone's 844.
      expect(v.h - (l.leaf.y - l.leaf.h / 2)).toBeLessThanOrEqual(450);
      // The strip is in view, off the guide, apart from the book, and shows at least five stops.
      expect(l.strip.x - l.strip.w / 2).toBeGreaterThanOrEqual(20);
      expect(l.strip.y + l.strip.h / 2).toBeLessThanOrEqual(v.h - 170);
      expect(overlap(l.strip, l.book)).toBe(false);
      expect(stripRoom(l.strip)).toBeGreaterThanOrEqual(5);
    },
  );

  it.each(levels)(
    'level %i: the land sits on that row and keeps its shape, the places apart inside it',
    (level) => {
      const l = journeyLayout(v, maxCards(level))!;
      const top = l.land.y - l.land.h / 2,
        bottom = l.land.y + l.land.h / 2;
      expect(l.land.w).toBe(v.w);
      expect(l.land.h).toBeLessThanOrEqual(LAND_TALL * v.w + 1e-6);
      expect(l.land.h).toBeGreaterThanOrEqual(600);
      expect(top).toBeGreaterThanOrEqual(128 - 1e-6);
      expect(l.leaf.y - l.leaf.h / 2 - bottom).toBeCloseTo(14);
      // The sea ends at the land's floor, so the row below it lies on the meadow, and still holds its ring and waves.
      expect(l.seaFloor).toBe(bottom);
      expect(l.seaFloor - (l.places.sea.y + l.places.sea.h / 2)).toBeGreaterThanOrEqual(20);
      for (const p of PLACES) {
        const ring = l.places[p];
        expect(ring.w).toBeGreaterThanOrEqual(100);
        expect(ring.x - ring.w / 2).toBeGreaterThanOrEqual(0);
        expect(ring.x + ring.w / 2).toBeLessThanOrEqual(v.w);
        expect(ring.y - ring.h / 2).toBeGreaterThanOrEqual(top);
        expect(ring.y + ring.h / 2).toBeLessThanOrEqual(bottom);
        for (const q of PLACES) if (q !== p) expect(overlap(ring, l.places[q]), `${p}/${q}`).toBe(false);
        // The top-left ring (the snow) stays out from under Home and help.
        expect(
          uprightProblems(v, [target(p, ring)]).filter((x) => x.includes('Home')),
          p,
        ).toEqual([]);
      }
      // The sun is in the land's top-right corner, clear of the cloud.
      expect(Math.hypot(l.sun.x - l.places.cloud.x, l.sun.y - l.places.cloud.y)).toBeGreaterThanOrEqual(200);
    },
  );
});

describe("Drop's Journey sideways", () => {
  it('keeps the strip, the book and the leaf along the top and the land between them and the cards', () => {
    const l = journeyLayout(computeView(1024, 768, NO_INSETS), 3)!;
    expect(l.leaf).toEqual({ x: 944, y: 78, w: 120, h: 120 });
    expect(l.book).toEqual({ x: 809, y: 73, w: 110, h: 110 });
    expect(l.strip).toEqual({ x: 436.5, y: 68, w: 603, h: 92 });
    expect(l.land).toEqual({ x: 512, y: 368, w: 1024, h: 480 });
    expect(l.cards.map((c) => c.y)).toEqual([683, 683, 683]);
    // The sea runs on under the cards, as it always has.
    expect(l.seaFloor).toBe(652);
  });

  it('an upright tablet, which is not an upright phone, keeps the top row too', () => {
    const v = computeView(768, 1024, NO_INSETS);
    expect(v.upright).toBeUndefined();
    const l = journeyLayout(v, 5)!;
    expect(l.leaf.y).toBe(78);
    expect(l.land.y - l.land.h / 2).toBe(128);
  });
});
