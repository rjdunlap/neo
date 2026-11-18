import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  LEVELS,
  MAP_WALKER,
  SHAPE_IDS,
  STOPS,
  TRAILS,
  mapLayout,
  mapSpot,
  mapWalkerScale,
  planFor,
  standArea,
  stopLayout,
  walkerArea,
  type Pt,
  type Rect,
} from './logic';

/**
 * Adventure Walk held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band on the three
 * upright phone views, the captioned one and a short one. The boxes are the scene's own touch targets, from the layout
 * functions it places them with (`stopLayout`, `mapLayout`, `mapSpot`).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
/** A corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w - 1e-7,
  h: r.h - 1e-7,
});
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function check(v: View, targets: Target[], note = '') {
  expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)} ${note}`).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone)
    expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
}

const levels = [...new Set(Object.values(LEVELS).flatMap((r) => [r!.min, r!.max]))];
const all = Array.from(
  { length: Math.max(...levels) - Math.min(...levels) + 1 },
  (_, i) => Math.min(...levels) + i,
);

describe.each(Object.entries(views))('Adventure Walk upright on %s', (_, v) => {
  it('covers levels 1 to 5', () => expect(all).toEqual([1, 2, 3, 4, 5]));

  it.each(all.filter((l) => !planFor(l).trails))(
    'level %i, a stop: the two ways, the friend’s picture and the companion stand apart',
    (level) => {
      const l = stopLayout(v, level);
      expect(l.badge !== null).toBe(planFor(level).calls);
      check(v, [
        rect('way 1', l.zones[0]),
        rect('way 2', l.zones[1]),
        ...(l.badge ? [rect('friend', l.badge)] : []),
        rect('companion', standArea(l.stand)),
      ]);
    },
  );

  it.each(SHAPE_IDS)(
    'level 4, the %s map: the three landmarks and the companion wherever it stands',
    (shape) => {
      const l = mapLayout(v, 4, shape);
      expect(l.tiles).toHaveLength(STOPS);
      expect(l.flags).toHaveLength(0);
      // It stands at the picnic, then at each landmark it has passed (over that one's tile, which is then behind it),
      // and after a wrong tap one step along the path towards the next.
      for (let at = STOPS; at >= -1; at--)
        for (const nudged of at >= 1 ? [false, true] : [false]) {
          const here = mapSpot(l, at);
          const feet = nudged ? lerp(here, mapSpot(l, at - 1), 0.2) : here;
          check(
            v,
            [
              ...l.tiles.flatMap((t, i) => (i === at ? [] : [rect(`landmark ${i + 1}`, t)])),
              rect('companion', walkerArea(feet)),
            ],
            `at ${at}${nudged ? ' nudged' : ''}`,
          );
        }
    },
  );

  it('level 5: the three flags, the friend’s picture and the companion at its door and at the picnic', () => {
    const l = mapLayout(v, 5, 'sweep');
    expect(l.flags).toHaveLength(TRAILS);
    for (const at of [-1, STOPS])
      check(
        v,
        [
          ...l.flags.map((f, i) => rect(`flag ${i + 1}`, f)),
          rect('friend', l.badge!),
          rect('companion', walkerArea(mapSpot(l, at))),
        ],
        `at ${at}`,
      );
  });

  it('the companion on the map is drawn at least 100 units across', () => {
    // Its body is about 283 by 274 units at scale 1 (99 by 96 at 0.35, measured on a phone).
    expect(274 * mapWalkerScale(v)).toBeGreaterThanOrEqual(100);
    expect(MAP_WALKER).toBeGreaterThanOrEqual(120);
  });
});
