import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  briefFor,
  fixedRect,
  keepLayout,
  LEVELS,
  roomInCell,
  spotRects,
  type Brief,
  type Rect,
} from './logic';

/**
 * Keep House held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the three
 * upright phone views, the captioned one and a short one. The boxes are `keepLayout`'s own rectangles, which the scene
 * places every door, figure, tile, cell, card and button from (its hit areas pad each by 4 to 10 units, not counted here).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

/** A layout's corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w - 1e-7,
  h: r.h - 1e-7,
});

/** Each moment of a brief's round as its own set of targets (level 3's two placements never share the screen). */
function screens(brief: Brief, v: View): Target[][] {
  const l = keepLayout(brief, v);
  expect(l, `level ${brief.level} has no layout at ${Math.round(v.w)} x ${Math.round(v.h)}`).not.toBeNull();
  if (!l) return [];
  switch (brief.id) {
    case 'doors':
      return [[...l.doors!.map((r) => rect('door', r)), rect('well', l.well!)]];
    case 'workplaces':
      return [[...l.slots!.map((r) => rect('figure', r)), ...l.rooms!.map((r) => rect('room', r))]];
    case 'walk':
      return brief.placements.map((p) => {
        const s = spotRects(p, l.yard!);
        // The fixed room is a picture, but a spot under it could not be dropped on: it counts as a box to stay clear of.
        return [
          rect('tile', l.tile!),
          rect('Keep it', l.keep!),
          rect('near spot', s.near),
          rect('far spot', s.far),
          rect('fixed room', fixedRect(p, l.yard!)),
        ];
      });
    case 'plan':
      return [
        [
          ...l.tray!.map((r) => rect('tile', r)),
          ...l.cells!.map((r) => rect('cell', r)),
          ...l.cards!.map((r) => rect('need card', r)),
          rect('bell', l.bell!),
        ],
      ];
    case 'ruin':
      return brief.ruins.map((ruin) => {
        // Only a cell with a room in it is tapped, but every cell is checked: a label may be dropped on any.
        expect(l.cells!.some((_, c) => roomInCell(ruin, c))).toBe(true);
        return [...l.tray!.map((r) => rect('label', r)), ...l.cells!.map((r) => rect('cell', r))];
      });
    case 'build':
      return [[...l.rows!.map((r) => rect('row', r)), rect('Build', l.build!), rect('Keep it', l.keep!)]];
  }
}

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  const { min, max } = rangeFor(LEVELS, band);
  return Array.from({ length: max - min + 1 }, (_, i) => [band, min + i] as const);
});

describe.each(Object.entries(views))('Keep House upright on %s', (_, v) => {
  it('covers levels 1 to 6', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(cases)(
    '%s level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (band, level) => {
      for (const seed of SEEDS) {
        const all = screens(briefFor(level, band, new Rng(seed)), v);
        expect(all.length).toBeGreaterThan(0);
        for (const targets of all) {
          expect(
            uprightProblems(v, targets),
            `seed ${seed}, ${Math.round(v.w)} x ${Math.round(v.h)}`,
          ).toEqual([]);
          if (v === UPRIGHT_VIEWS.phone)
            expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
        }
      }
    },
  );

  it('level 6 keeps the lord strip and the hall site in view and off the controls', () => {
    const l = keepLayout(briefFor(6, 'school', new Rng(3)), v)!;
    for (const r of [l.lord!, l.site!])
      expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h).toBe(true);
    expect(l.site!.y + l.site!.h).toBeLessThanOrEqual(l.rows![0].y);
  });
});
