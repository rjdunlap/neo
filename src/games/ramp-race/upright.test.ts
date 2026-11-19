import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  CARD_H,
  GO_R,
  HEIGHT_PX,
  RAMP_W,
  floorLength,
  floorPad,
  goSpot,
  laneOf,
  lanesOf,
  rampPad,
  shelfLayout,
  signSpot,
  tellLayout,
  type Box,
} from './layout';
import { CLAIMS, FLOORS, HEIGHTS, LEVELS, MAX_DISTANCE, distance, planFor } from './logic';

/**
 * Ramp Race held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band, every moment of a
 * round, on the three upright phone views, the captioned one and a short one. The targets are each lane's ramp and floor
 * pads, go, the two record cards (levels 5 to 7), the guess zone either side of every flag a first roll can leave
 * (level 5) and the three claim tiles (level 7).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const target = (what: string, b: Box): Target => ({
  what,
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
  w: b.w,
  h: b.h,
});
const overlap = (p: Box, q: Box) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;

/** The moments of a round at a level: each a name and the targets that take a touch then. */
function moments(v: { w: number; h: number }, level: number): { name: string; targets: Target[] }[] {
  const mode = planFor(level).mode;
  const g = goSpot(v);
  const go = target('go', { x: g.x - GO_R, y: g.y - GO_R, w: 2 * GO_R, h: 2 * GO_R });
  const two = mode === 'fair' || mode === 'change' || mode === 'tell';
  const pads = lanesOf(v, two ? 2 : 1).flatMap((l, i) => [
    target(`ramp ${i + 1}`, rampPad(l)),
    target(`floor ${i + 1}`, floorPad(l)),
  ]);
  if (mode === 'shelf') {
    const out = [];
    for (const first of HEIGHTS) {
      const L = shelfLayout(v, distance(first, 'wood'), 1);
      const cards = L.cards.map((c, k) => target(`card ${k + 1}`, c));
      out.push({ name: `rolling, first ramp ${first}`, targets: [...pads, go, ...cards] });
      out.push({
        name: `guessing, first ramp ${first}`,
        targets: [
          pads[0],
          target('before the flag', L.guess.before),
          target('past the flag', L.guess.past),
          go,
          ...cards,
        ],
      });
    }
    return out;
  }
  if (mode === 'change') {
    const cards = shelfLayout(v, 0, 2).cards.map((c, k) => target(`card ${k + 1}`, c));
    return [{ name: 'fixing and reading', targets: [...pads, go, ...cards] }];
  }
  if (mode === 'tell') {
    const L = tellLayout(v);
    const cards = L.cards.map((c, k) => target(`card ${k + 1}`, c));
    return [
      { name: 'claim', targets: [...cards, ...L.tiles.map((t, k) => target(`tile ${CLAIMS[k]}`, t)), go] },
      { name: 'repair', targets: [...pads, go, ...cards] },
    ];
  }
  return [{ name: 'rolling', targets: [...pads, go] }];
}

it('covers levels 1 to 7', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

describe.each(Object.entries(views))('Ramp Race upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      for (const m of moments(v, level))
        expect(uprightProblems(v, m.targets), `level ${level}, ${m.name}`).toEqual([]);
    },
  );

  it('every stop and star is on the floor, and a floor mark is long enough to read', () => {
    for (const count of [1, 2])
      for (const l of lanesOf(v, count)) {
        expect(l.unit).toBeGreaterThan(45);
        for (const h of HEIGHTS)
          for (const f of FLOORS) {
            // The car is about 80 long; where it stops, it is still on the floor and in view.
            expect(l.rampEnd + distance(h, f) * l.unit + 40).toBeLessThanOrEqual(
              l.rampEnd + floorLength(l) + 20,
            );
            expect(l.rampEnd + distance(h, f) * l.unit + 40).toBeLessThanOrEqual(v.w);
          }
        expect(distance(4, 'ice')).toBe(MAX_DISTANCE);
        // The tallest ramp and the car on top of it stay under Home's row, or beside the column.
        expect(l.floorY - 4 * HEIGHT_PX - 30).toBeGreaterThan(210);
        expect(l.x0 + RAMP_W).toBe(l.rampEnd);
      }
  });

  it('the fair-test sign sits above the top lane, off its pads, the cards and Home', () => {
    const s = signSpot(v);
    const sign: Box = { x: s.x - 170, y: s.y - 50, w: 340, h: 100 };
    expect(sign.x).toBeGreaterThan(115);
    expect(sign.x + sign.w).toBeLessThan(v.w);
    expect(sign.y).toBeGreaterThan(0);
    for (const l of lanesOf(v, 2)) {
      expect(overlap(sign, rampPad(l))).toBe(false);
      expect(overlap(sign, floorPad(l))).toBe(false);
    }
    // Near the lanes it is about, not at the top of a tall screen.
    expect(lanesOf(v, 2)[0].floorY - (sign.y + sign.h)).toBeLessThan(260);
  });

  it('the cards hang just above the top lane, where a thumb reaches, and the badge stays off them', () => {
    for (const count of [1, 2]) {
      const L = shelfLayout(v, 4.5, count);
      const top = lanesOf(v, count)[0];
      expect(L.cards[1].y + CARD_H).toBeLessThanOrEqual(top.floorY - 4 * HEIGHT_PX - 30);
      expect(top.floorY - L.cards[0].y).toBeLessThanOrEqual(Math.max(474, top.floorY - 36));
      for (const c of L.cards) {
        expect(overlap(L.badge, c)).toBe(false);
        // A card slid in from the right never crosses a ramp or its car.
        expect(c.x).toBeGreaterThan(top.rampEnd + 10);
      }
      expect(L.badge.x).toBeGreaterThan(115);
    }
    // Level 5's guess zone ends where the floor does, and never reaches go.
    const L = shelfLayout(v, 3, 1);
    const lane = laneOf(v);
    expect(L.guess.past.x + L.guess.past.w).toBeCloseTo(lane.rampEnd + floorLength(lane));
    expect(L.guess.past.y + L.guess.past.h).toBeLessThan(goSpot(v).y - GO_R);
  });
});

describe('Ramp Race sideways', () => {
  const v = computeView(1024, 768, NO_INSETS);
  it('keeps the lanes, go, the sign, the cards and the tiles where they were', () => {
    const unit = (1024 - 150 - 320) / (MAX_DISTANCE + 0.6);
    expect(lanesOf(v, 1)).toEqual([{ x0: 150, rampEnd: 320, unit, floorY: 768 * 0.66 }]);
    expect(lanesOf(v, 2).map((l) => l.floorY)).toEqual([768 * 0.42, 768 * 0.78]);
    expect(goSpot(v)).toEqual({ x: 944, y: 688 });
    expect(signSpot(v)).toEqual({ x: 572, y: 80 });
    for (const count of [1, 2]) {
      const L = shelfLayout(v, 3, count);
      expect(L.cards.map((c) => [c.x, c.y])).toEqual([
        [524, 36],
        [524, 152],
      ]);
      expect(L.badge).toEqual({ x: 394, y: 96, w: 100, h: 100 });
    }
    expect(shelfLayout(v, 3).guess.past.x + shelfLayout(v, 3).guess.past.w).toBeCloseTo(1024 - 150);
    expect(tellLayout(v).tiles.map((t) => [t.x, t.y])).toEqual([
      [182, 300],
      [412, 300],
      [642, 300],
    ]);
  });

  it('every pad is at least 100 units, and the floor pads sit beside the ramp pads, never under them', () => {
    for (const view of [v, computeView(1366, 1024, NO_INSETS), computeView(2000, 768, NO_INSETS)])
      for (const count of [1, 2]) {
        const lanes = lanesOf(view, count);
        const pads = lanes.flatMap((l) => [rampPad(l), floorPad(l)]);
        const g = goSpot(view);
        const go: Box = { x: g.x - GO_R, y: g.y - GO_R, w: 2 * GO_R, h: 2 * GO_R };
        pads.forEach((p, i) => {
          expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(100);
          expect(overlap(p, go)).toBe(false);
          for (const q of pads.slice(i + 1)) expect(overlap(p, q)).toBe(false);
        });
      }
  });
});
