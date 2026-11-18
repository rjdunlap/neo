import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  FIREFLY_R,
  GUESS_HIT,
  JAR_H,
  JAR_TAG,
  JAR_W,
  PAD_HIT,
  PLANS,
  gridFor,
  lassoLayout,
  makeRound,
  tallField,
  type LassoLayout,
  type Point,
} from './logic';

/**
 * Lasso Loops upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone views, the
 * captioned one and a short one, from `lassoLayout`, the function the scene places everything with.
 *
 * What is tapped must be a 100-unit target: the three answer pads (levels 3–6) and level 6's estimate signs, both the
 * first guess and the keep-or-change guess. The fireflies are circled with a drawn loop, never tapped, and the jars and
 * the leaf are pictures the fireflies fly to by themselves, so for those the honest checks are different: the field the
 * fireflies scatter in (grown by a firefly's glow) and every jar and the leaf lie inside the view, apart from each other,
 * clear of Home/help and the guide corner; the field is big enough, and its grid cells roomy enough, to draw a loop around
 * a group; and the whole field is inside the area a loop may be drawn in.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const at = (what: string, p: Point, w: number, h = w): Target => ({ what, x: p.x, y: p.y, w, h });
/** A jar with its number badge, from its foot. */
const jar = (p: Point): Target =>
  at('jar', { x: p.x, y: p.y - (JAR_H + JAR_TAG) / 2 }, JAR_W, JAR_H + JAR_TAG);
/** The field the firefly middles scatter in, grown by a firefly's glow. */
const field = (L: LassoLayout): Target =>
  at(
    'firefly field',
    { x: L.field.x + L.field.w / 2, y: L.field.y + L.field.h / 2 },
    L.field.w + 2 * FIREFLY_R,
    L.field.h + 2 * FIREFLY_R,
  );
const leaf = (L: LassoLayout): Target => at('leaf', { x: L.leaf.x, y: L.leaf.y - 8 }, 180, 104);

function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
}

describe.each(Object.entries(views))('Lasso Loops upright on %s', (_, v) => {
  it.each(PLANS.map((p, i) => [i + 1, p] as const))('level %i fits', (_level, plan) => {
    for (let seed = 0; seed < 120; seed++) {
      const round = makeRound(plan, new Rng(seed));
      const L = lassoLayout(v, round.jars.length, round.ones > 0, !!plan.guess);
      expect(L.upright).toBe(true);
      const pictures = [...L.jars.map(jar), ...(round.ones ? [leaf(L)] : [])];
      // Looping: the field, the jars and the leaf stand apart, in view, clear of the corners.
      check(v, [field(L), ...pictures]);
      // Room for a loop: a field of at least 450 units each way, a lane of 50 to its right and 60 above, cells of 60.
      const grid = gridFor(round.fireflies, tallField(L));
      expect(Math.min(L.field.w, L.field.h)).toBeGreaterThanOrEqual(450);
      expect(L.field.w / grid.cols).toBeGreaterThanOrEqual(60);
      expect(L.field.h / grid.rows).toBeGreaterThanOrEqual(60);
      expect(L.field.x + L.field.w).toBeLessThanOrEqual(v.w - 50);
      expect(L.field.y).toBeGreaterThanOrEqual(60);
      // A loop can be drawn around the lowest firefly.
      expect(L.sky.y + L.sky.h).toBeGreaterThanOrEqual(L.field.y + L.field.h + FIREFLY_R + 40);
      expect(L.sky.w).toBe(v.w);
      // The answer pads come up over the emptied field, above the jars and the leaf.
      if (round.answer !== null) check(v, [...L.pads.map((p) => at('answer pad', p, PAD_HIT)), ...pictures]);
      if (plan.guess) {
        // The first guess: only the three signs (the jars are hidden).
        check(v, [field(L), ...L.guessFirst.map((p) => at('estimate', p, GUESS_HIT.w, GUESS_HIT.h))]);
        // Keep or change: the signs with the fireflies still out and the jars back.
        check(v, [
          field(L),
          ...pictures,
          ...L.guessRevise.map((p) => at('estimate', p, GUESS_HIT.w, GUESS_HIT.h)),
        ]);
      }
    }
  });
});

describe('Lasso Loops sideways and on a tablet', () => {
  // The long-standing numbers, unchanged by the upright branch.
  it.each([
    [1366, 1024],
    [1024, 768],
    [768, 1024],
  ])('%i x %i keeps its layout', (w, h) => {
    const L = lassoLayout({ w, h }, 3, true, true);
    expect(L.upright).toBe(false);
    expect(L.field).toEqual({ x: 160, y: 96, w: w - 210, h: h - 366 });
    const step = Math.min(140, (w - 400) / 3);
    L.jars.forEach((j, i) => {
      expect(j.x).toBeCloseTo((w - 20) / 2 + (i - 1) * step);
      expect(j.y).toBe(h - 30);
    });
    const left = L.jars[0].x + 150;
    const g = Math.min(160, (w - 40 - left) / 3);
    L.guessRevise.forEach((p, i) => {
      expect(p.x).toBeCloseTo((left + w - 40) / 2 + (i - 1) * g);
      expect(p.y).toBe(h - 100);
    });
    expect(L.pads.map((p) => p.x)).toEqual([w / 2 - 180, w / 2, w / 2 + 180]);
    expect(L.pads[0].y).toBeCloseTo(96 + (h - 366) * 0.45);
    expect(lassoLayout({ w, h }, 6, false).jars.every((j) => j.y === h - 30)).toBe(true);
    expect(tallField(L)).toBe(false);
  });
});
