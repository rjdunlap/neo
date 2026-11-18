import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BADGE,
  CARD,
  caseRecords,
  layout,
  LEVELS,
  makeRound,
  SHOW,
  STATION_DOWN,
  STATION_R,
  UNDO_R,
  type Pt,
} from './logic';

/**
 * Food Web Workshop held upright (chunk 31, docs/definitions/phone-portrait.md): every level of the band it lists, on the
 * three upright phone views, the captioned one and a short one. The boxes are the scene's own hit areas around the points
 * `layout` gives it: the picture cards, each station's picture (its hit box stops just above its badge), the badges she
 * drags, Show our web and Undo (the scene pads those two by 6 and 14 units, not counted here). A round has one screen: the
 * same targets from the first arrow to the finish.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

/** A box by its centre, trimmed by a hair so boxes that only touch are not read as overlapping. */
const box = (what: string, p: Pt, w: number, h: number): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: w - 1e-7,
  h: h - 1e-7,
});

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});

describe.each(Object.entries(views))('Food Web Workshop upright on %s', (_, v) => {
  it('covers levels 1 to 3', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3]);
  });

  it.each(cases)(
    '%s level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed));
        const cards = caseRecords(round.webCase).length;
        const L = layout(v, cards);
        expect(L.cards).toHaveLength(cards);
        // The layout draws a triangle of three stations: a round with another count would have nowhere to put one.
        expect(L.stations).toHaveLength(round.stations.length);
        expect(L.badges).toHaveLength(round.stations.length);
        const targets = [
          ...L.cards.map((p) => box('card', p, CARD.w, CARD.h)),
          ...L.stations.map((p) =>
            box(
              'station',
              { x: p.x, y: p.y + (STATION_DOWN - STATION_R) / 2 },
              STATION_R * 2,
              STATION_R + STATION_DOWN,
            ),
          ),
          ...L.badges.map((p) => box('badge', p, BADGE, BADGE)),
          box('Show our web', L.show, SHOW.w, SHOW.h),
          box('Undo', L.undo, UNDO_R * 2, UNDO_R * 2),
        ];
        expect(targets).toHaveLength(cards + 2 * round.stations.length + 2);
        expect(uprightProblems(v, targets), `seed ${seed}, ${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual(
          [],
        );
        if (v === UPRIGHT_VIEWS.phone)
          expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
      }
    },
  );
});

describe('Food Web Workshop sideways', () => {
  it('keeps the tablet layout: cards along the top, the triangle of stations, the buttons on the right', () => {
    const v = computeView(1024, 768);
    const L = layout(v, 2);
    expect(L.cards).toEqual([
      { x: 387, y: 100 },
      { x: 637, y: 100 },
    ]);
    expect(L.stations).toEqual([
      { x: 512, y: 768 * 0.4 },
      { x: 272, y: 768 * 0.62 },
      { x: 752, y: 768 * 0.62 },
    ]);
    expect(L.badges.map((b, i) => b.y - L.stations[i].y)).toEqual([68, 68, 68]);
    expect(L.show).toEqual({ x: 884, y: 668 });
    expect(L.undo).toEqual({ x: 944, y: 80 });
  });
});
