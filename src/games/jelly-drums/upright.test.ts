import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  AGAIN_RADIUS,
  CHOICE_RADIUS,
  HALF_WIDTHS,
  jellyHit,
  jellyLayout,
  ORDER_SLOT_RADIUS,
  orderJellyHit,
} from './layout';
import { LEVELS, planFor } from './logic';

/**
 * Jelly Drums held upright (chunk 31, docs/definitions/phone-portrait.md): every level and the moments of a round that show
 * something to touch, on the three upright phone views, the captioned one and a short one. The wake level's touch is the
 * whole stage, so what is checked there is that every jelly stands whole in view.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const jellyTargets = (v: View): Target[] => {
  const l = jellyLayout(v);
  return HALF_WIDTHS.map((_, i) => ({ what: `jelly ${i + 1}`, ...jellyHit(l, i) }));
};

const orderTargets = (v: View): Target[] => {
  const l = jellyLayout(v);
  return [
    ...[0, 1, 2, 3].map((i) => ({ what: `order jelly ${i + 1}`, ...orderJellyHit(l, i) })),
    ...l.orderSlots.map((p, i) =>
      square(`slot ${i + 1}`, { x: p.x, y: p.y - 40 * l.scale }, ORDER_SLOT_RADIUS * 2 * l.scale),
    ),
  ];
};

it('covers levels 1 to 15: free play, tunes, the wake level, the pair level, Lowest to highest, Which jelly sang? and Follow the glow', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  expect(new Set(levels.map((l) => planFor(l).mode))).toEqual(
    new Set(['free', 'echo', 'wake', 'compare', 'order', 'which', 'follow']),
  );
});

describe.each(Object.entries(views))('Jelly Drums upright on %s', (_, v) => {
  const l = jellyLayout(v);

  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      const mode = planFor(level).mode;
      const targets: Target[] = mode === 'wake' ? [] : mode === 'order' ? orderTargets(v) : jellyTargets(v);
      if (mode === 'echo' || mode === 'compare' || mode === 'which')
        targets.push(square('listen again', l.again, AGAIN_RADIUS * 2));
      if (mode === 'compare') {
        targets.push(
          square('same', l.choices[0], CHOICE_RADIUS * 2),
          square('different', l.choices[1], CHOICE_RADIUS * 2),
        );
      }
      expect(uprightProblems(v, targets), `level ${level}`).toEqual([]);
    },
  );

  it('everything she touches is in the lower half, the jellies above the button', () => {
    const t = [
      ...jellyTargets(v),
      square('listen again', l.again, AGAIN_RADIUS * 2),
      square('same', l.choices[0], CHOICE_RADIUS * 2),
      square('different', l.choices[1], CHOICE_RADIUS * 2),
    ];
    for (const x of t) expect(x.y, x.what).toBeGreaterThan(v.h / 2);
    expect(v.h - l.again.y).toBeLessThanOrEqual(220);
    for (const x of jellyTargets(v)) expect(x.y + x.h / 2, x.what).toBeLessThan(l.again.y - AGAIN_RADIUS);
  });

  it("every jelly, and the wake level's lone big one, stands inside the view on the stage", () => {
    for (const [i, hw] of HALF_WIDTHS.entries()) {
      const p = l.jellies[i];
      expect(p.x - hw * l.scale).toBeGreaterThanOrEqual(0);
      expect(p.x + hw * l.scale).toBeLessThanOrEqual(v.w);
      expect(p.x).toBeGreaterThan(l.stage.x);
      expect(p.x).toBeLessThan(l.stage.x + l.stage.w);
    }
    const lone = HALF_WIDTHS[0] * 1.8 * l.scale;
    expect(v.w / 2 - lone).toBeGreaterThanOrEqual(0);
    // The lone jelly's top, 1.55 times its half-width up from the stage, is on screen with room for the garland above.
    expect(l.jellies[0].y - HALF_WIDTHS[0] * 1.55 * 1.8 * l.scale).toBeGreaterThan(
      l.garland.y + l.garland.sag * 1.2,
    );
  });

  it('the garland is on the screen and the stage reaches both sides', () => {
    expect(l.garland.x0).toBeGreaterThanOrEqual(115);
    expect(l.garland.x1).toBeLessThanOrEqual(v.w);
    expect(l.stage.x).toBeGreaterThanOrEqual(0);
    expect(l.stage.x + l.stage.w).toBeLessThanOrEqual(v.w);
    // The fans stand right of the guide.
    for (const f of l.fans) expect(f.x - 50).toBeGreaterThanOrEqual(150);
  });
});

describe('Jelly Drums on other views', () => {
  it('sideways keeps its stage: five jellies 178 apart at full size', () => {
    const l = jellyLayout(computeView(1024, 768, NO_INSETS));
    expect(l.upright).toBe(false);
    expect(l.scale).toBe(1);
    expect(l.jellies.map((p) => p.x)).toEqual([-2, -1, 0, 1, 2].map((k) => 512 + k * 178));
    expect(l.jellies[0].y).toBeCloseTo(768 * 0.74 + 10);
    expect(l.again).toEqual({ x: 512, y: 768 * 0.74 - 250 });
    expect(l.garland).toEqual({ x0: 112, x1: 912, y: 70, sag: 80 });
  });

  it('an upright tablet, which is not an upright phone, keeps the sideways stage', () => {
    const v = computeView(768, 1024, NO_INSETS);
    expect(v.upright).toBeUndefined();
    expect(jellyLayout(v).upright).toBe(false);
  });
});
