import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BLOCK,
  centre,
  heightY,
  outer,
  SPAN,
  UPRIGHT_FOOT,
  waterLayout,
  waterRoadLayout,
  type Rect,
} from './layout';
import { downhillKind, keystonePlan, LEVELS, MAX_STEP, valleyPlan } from './logic';

/**
 * Water Road held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band, with every ring
 * size and valley length a round can deal, on the three upright phone views, the captioned one and a short one. The
 * targets are the frame's handle (levels 1 and 3), the two frames (level 2), the block and its two slots (level 3), the
 * channel cards or the pier arrows with Open (level 4), and the arches, the blocks, their places and Open (level 5).
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const bands = Object.keys(LEVELS) as Band[];
const cases = bands.flatMap((band) =>
  levelsInOrder(rangeFor(LEVELS, band)).map((level) => [band, level] as [Band, number]),
);
const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

const box = (what: string, r: Rect): Target => ({ what, ...centre(r), w: r.w, h: r.h });

/** The ring sizes level 1 deals a band, and the valley lengths level 5 deals. */
const stonesFor = (band: Band) => [...new Set(seeds.map((s) => keystonePlan(band, new Rng(s)).stones))];
const spansDealt = [...new Set(seeds.flatMap((s) => valleyPlan(new Rng(s)).valleys.map((v) => v.spans)))];

/** A level's targets in a view, each named, with the lowest edge of what is drawn under the scene's line. */
function laidOut(band: Band, level: number, v: View) {
  const out: { at: string; targets: Target[]; foot: number; top: number }[] = [];
  if (level <= 3) {
    for (const stones of level === 1 ? stonesFor(band) : [7]) {
      const l = waterRoadLayout(level, v, stones)!;
      expect(l, `${band} level ${level}`).not.toBeNull();
      const targets = [
        ...l.handles.map((h) => box('the handle', h)),
        ...(level === 2 ? l.frames.map((f, i) => box(`frame ${i + 1}`, f.box)) : []),
        // The block is a square of its own size where the tray holds it.
        ...(l.tray ? [square('the block', centre(l.tray), BLOCK)] : []),
        ...(l.slots ? [box('the left slot', l.slots.left), box('the right slot', l.slots.right)] : []),
      ];
      const foot = Math.max(
        ...l.pile.map((p) => p.y + 45),
        ...l.frames.map((f) => f.box.y + f.box.h),
        ...(l.tray ? [l.tray.y + l.tray.h] : []),
      );
      const top = Math.min(...l.frames.map((f) => f.centre.y - outer(l.ring)));
      out.push({ at: `${band} level ${level}, ${stones} stones`, targets, foot, top });
    }
    return out;
  }
  for (const spans of level === 4 ? [4] : spansDealt) {
    const l = waterLayout(level, band, v, spans)!;
    expect(l, `${band} level ${level}`).not.toBeNull();
    const targets = [
      ...l.cards.map((r, i) => box(`card ${i + 1}`, r)),
      ...l.arrows.flatMap((a, i) => [box(`up ${i + 1}`, a.up), box(`down ${i + 1}`, a.down)]),
      box('Open', l.open),
      ...l.spans.map((r, i) => box(`span ${i + 1}`, r)),
      ...(l.ends ? [box('the near end', l.ends.near), box('the far end', l.ends.far)] : []),
      // An arch in the tray is touched over its own size, a little taller than its tray spot.
      ...l.trayArches.map((r, i) => ({ what: `tray arch ${i + 1}`, ...centre(r), ...SPAN })),
      ...l.trayAbutments.map((r, i) => box(`tray block ${i + 1}`, r)),
    ];
    const foot = Math.max(...targets.map((t) => t.y + t.h / 2));
    const top = level === 4 ? heightY(l, MAX_STEP) - 30 : l.deck - 60;
    out.push({ at: `${band} level ${level}, ${spans} spans`, targets, foot, top });
  }
  return out;
}

it('covers levels 1 to 5 at every band, every ring of 3, 5 or 7 stones and valleys of 3 and 4 spans', () => {
  expect([...new Set(cases.map((c) => c[1]))].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(stonesFor('toddler')).toEqual([3]);
  expect(stonesFor('preschool').sort()).toEqual([5, 7]);
  expect([...spansDealt].sort()).toEqual([3, 4]);
  expect(downhillKind('prek')).toBe('cards');
  expect(downhillKind('school')).toBe('piers');
});

describe.each(Object.entries(views))('Water Road upright on %s', (_, v) => {
  it.each(cases)(
    '%s level %i: every target is whole, apart, in view and clear of Home and the guide',
    (band, level) => {
      for (const { at, targets } of laidOut(band, level, v))
        expect(uprightProblems(v, targets), at).toEqual([]);
    },
  );

  it.each(cases)(
    '%s level %i: the scene sits low on the tall screen, above the guide and below Home',
    (band, level) => {
      for (const { at, foot, top } of laidOut(band, level, v)) {
        // What is touched last (the pile, the lower frame, the tray, Open) is in a thumb's reach and above the guide.
        expect(foot, at).toBeGreaterThanOrEqual(v.h * 0.7);
        expect(foot, at).toBeLessThanOrEqual(v.h - UPRIGHT_FOOT + 1e-6);
        // The top of the ring, the hill or the town is under Home and "?".
        expect(top, at).toBeGreaterThanOrEqual(210);
      }
    },
  );

  it('level 1: the pile lies under the ground line, in view and off the guide', () => {
    for (const stones of [3, 5, 7]) {
      const l = waterRoadLayout(1, v, stones)!;
      expect(l.pile).toHaveLength(stones);
      for (const p of l.pile) {
        expect(p.y - 45).toBeGreaterThan(l.ground);
        expect(p.x - 60).toBeGreaterThanOrEqual(150);
        expect(p.x + 60).toBeLessThanOrEqual(v.w);
      }
      // The whole ring is in view, either side.
      expect(l.frames[0].centre.x - outer(l.ring)).toBeGreaterThanOrEqual(0);
      expect(l.frames[0].centre.x + outer(l.ring)).toBeLessThanOrEqual(v.w);
    }
  });

  it('level 2: the frames are stacked, each on its own step of ground', () => {
    const l = waterRoadLayout(2, v)!;
    expect(l.stacked).toBe(true);
    const [upper, lower] = l.frames;
    for (const f of l.frames) expect(f.ground).toBe(f.centre.y + l.ring.post);
    expect(upper.ground).toBe(l.ground);
    // The lower ring stands on its own step, wholly under the upper frame's ground line.
    expect(lower.ground).toBeGreaterThan(upper.ground);
    expect(lower.centre.y - outer(l.ring)).toBeGreaterThan(upper.ground);
    expect(lower.ground).toBeLessThanOrEqual(lower.box.y + lower.box.h);
  });
});

describe('Water Road sideways', () => {
  const v = computeView(1024, 768, NO_INSETS);

  it('keeps every scene where it was', () => {
    expect(waterRoadLayout(1, v, 7)!.frames[0].centre).toEqual({ x: 512, y: 320 });
    expect(waterRoadLayout(3, v)!.frames[0].centre).toEqual({ x: 512, y: 768 * 0.4 });
    expect(waterLayout(4, 'school', v)!.ground).toBe(768 * 0.45);
    expect(waterLayout(5, 'school', v, 4)!.deck).toBe(768 * 0.3);
  });

  it('level 2 side by side shares one ground', () => {
    const l = waterRoadLayout(2, v)!;
    expect(l.stacked).toBe(false);
    expect(new Set(l.frames.map((f) => f.ground))).toEqual(new Set([l.ground]));
  });
});
