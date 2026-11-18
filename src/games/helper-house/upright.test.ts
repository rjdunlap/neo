import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  briefFor,
  caseCards,
  GAPS,
  handleRect,
  houseLayout,
  LEVELS,
  linePieces,
  TILE_PAD,
  WATCH_PAD,
  type Brief,
  type Rect,
} from './logic';

/**
 * Helper House held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, over a
 * spread of seeds (the bench's order, the day and its case card change with the seed), on the three upright phone views,
 * the captioned one and a short one. The boxes are `houseLayout`'s own rectangles, which the scene places every card,
 * tile, socket, handle and button from, grown by the scene's touch padding (`TILE_PAD`, `WATCH_PAD`). The three round
 * buttons (step, back and the offered check) are boxed at their drawn size: the shared `RoundButton` reaches 14 units
 * past its rim on every screen.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

/** A layout's corner-anchored box as a target, grown by its touch padding and trimmed by a hair so touching boxes do not count as overlapping. */
const rect = (what: string, r: Rect, pad = 0): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w + 2 * pad - 1e-7,
  h: r.h + 2 * pad - 1e-7,
});

/**
 * Each moment of a brief's round as its own set of targets: the board as it opens; the offered check button over the
 * house (after three failed days, at any level); level 6's two guess pictures; and from level 6 each gap the line
 * handles can rest at, and the gauge column they ride beside (a tap on it moves the nearer line, so the column and
 * the handles abut by design and are boxed in separate sets).
 */
function screens(brief: Brief, v: View): Target[][] {
  const l = houseLayout(brief, v);
  expect(l, `level ${brief.level} has no layout at ${Math.round(v.w)} x ${Math.round(v.h)}`).not.toBeNull();
  if (!l) return [];
  expect(l.sockets).toHaveLength(brief.sockets.length);
  expect(l.bench).toHaveLength(brief.sensors.length + brief.chips.length);
  expect(l.cases).toHaveLength(caseCards(brief.level));
  expect(l.guesses).toHaveLength(brief.level === 6 ? 2 : 0);
  const base = [
    // Only an open row's reading card is tapped, but every card is boxed: a chip may be dropped on any.
    ...l.rows.flatMap((r, i) => [
      rect(`row ${i + 1} reading`, r.reading, TILE_PAD),
      rect(`row ${i + 1} action`, r.action),
    ]),
    ...l.bench.map((r, i) => rect(`bench tile ${i + 1}`, r, TILE_PAD)),
    ...l.cases.map((r, i) => rect(`case card ${i + 1}`, r)),
    rect('Watch', l.watch, WATCH_PAD),
    rect('step', l.step),
    rect('back', l.undo),
  ];
  // A sensor dropped in a socket is a tile there, with the tile's padding.
  const sockets = l.sockets.map((r, i) => rect(`socket ${i + 1}`, r, TILE_PAD));
  const out = [
    [...base, ...sockets],
    [...base, ...sockets, rect('offer', l.offer)],
  ];
  const g = l.gauge;
  if (!g) return out;
  expect(g.left.x + g.left.w).toBeLessThanOrEqual(g.column.x);
  expect(g.column.x + g.column.w).toBeLessThanOrEqual(g.right.x);
  const jar = g.jar ? [rect('click jar', g.jar)] : [];
  const column = rect('gauge', g.column, TILE_PAD);
  const moments = [
    [column, ...jar],
    [column, ...jar, rect('offer', l.offer)],
  ];
  if (l.guesses.length)
    moments.push([column, ...l.guesses.map((r, i) => rect(`guess ${i + 1}`, r, TILE_PAD))]);
  for (let gap = 1; gap <= GAPS; gap++) {
    const handles = linePieces(brief.level).map((p) => rect(`${p} handle`, handleRect(g, p, gap), TILE_PAD));
    moments.push([...handles, ...jar, rect('offer', l.offer)]);
    if (l.guesses.length)
      moments.push([...handles, ...l.guesses.map((r, i) => rect(`guess ${i + 1}`, r, TILE_PAD))]);
  }
  return moments.map((m) => [...base, ...m]);
}

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});

describe.each(Object.entries(views))('Helper House upright on %s', (_, v) => {
  it('covers levels 1 to 9', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(cases)(
    '%s level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      for (const seed of SEEDS) {
        const brief = briefFor(level, new Rng(seed));
        const all = screens(brief, v);
        expect(all.length).toBeGreaterThan(0);
        for (const targets of all) {
          expect(
            uprightProblems(v, targets),
            `seed ${seed}, ${Math.round(v.w)} x ${Math.round(v.h)}`,
          ).toEqual([]);
          if (v === UPRIGHT_VIEWS.phone)
            expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
        }
        // The offer and the guesses sit on the house, and the house stays in view beside Home.
        const l = houseLayout(brief, v)!;
        for (const r of [l.offer, ...l.guesses, ...l.sockets]) {
          expect(r.x).toBeGreaterThanOrEqual(l.house.x);
          expect(r.x + r.w).toBeLessThanOrEqual(l.house.x + l.house.w);
          expect(r.y).toBeGreaterThanOrEqual(l.house.y);
          expect(r.y + r.h).toBeLessThanOrEqual(l.house.y + l.house.h);
        }
        expect(uprightProblems(v, [rect('house', l.house)])).toEqual([]);
      }
    },
  );
});

describe('Helper House upright and sideways', () => {
  it('ends the rule rows above the guide on a short upright view, where two rows once left no layout', () => {
    for (const v of [UPRIGHT_VIEWS.captioned, views.short])
      for (const level of [3, 4, 5]) {
        const l = houseLayout(briefFor(level, new Rng(1)), v)!;
        const last = l.rows[l.rows.length - 1].reading;
        expect(last.y + last.h + TILE_PAD).toBeLessThanOrEqual(v.h - 170);
        expect(l.house.h).toBeGreaterThanOrEqual(700);
      }
  });

  it('keeps the tall upright layout: the house at its full 820 units', () => {
    for (const level of [1, 3, 5])
      expect(houseLayout(briefFor(level, new Rng(1)), UPRIGHT_VIEWS.phone)!.house.h).toBe(820);
  });

  it('keeps the tablet layout sideways', () => {
    const big = { w: 1366, h: 1024 } as View;
    const l3 = houseLayout(briefFor(3, new Rng(1)), big)!;
    expect(l3.house).toEqual({ x: 180, y: 20, w: 574, h: 984 });
    expect(l3.rows.map((r) => [r.reading.x, r.reading.y, r.action.x])).toEqual([
      [774, 30, 940],
      [774, 156, 940],
    ]);
    expect(l3.bench.map((r) => [r.x, r.y])).toEqual([774, 900, 1026].map((x) => [x, 306]));
    expect([l3.watch, l3.step, l3.undo].map((r) => [r.x, r.y])).toEqual([
      [974, 900],
      [1130, 902],
      [1246, 902],
    ]);
    expect([l3.offer.x, l3.offer.w, l3.offer.h]).toEqual([407, 120, 120]);
    expect(l3.offer.y).toBeCloseTo(570.08);
    const small = { w: 1024, h: 768 } as View;
    const l6 = houseLayout(briefFor(6, new Rng(1)), small)!;
    expect(l6.guesses.map((r) => [r.x, r.w])).toEqual([
      [l6.house.x + l6.house.w / 2 - 142, 124],
      [l6.house.x + l6.house.w / 2 + 18, 124],
    ]);
    expect(l6.guesses[0].y).toBe(l6.house.y + l6.house.h * 0.42 - 62);
    expect(l6.gauge!.column.y).toBe(20);
  });
});
