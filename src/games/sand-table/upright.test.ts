import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { LEVELS, planFor, sandLayout, type Rect } from './logic';

/**
 * Sand Table held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the three
 * upright phone views, the captioned one and a short one. The boxes come from `sandLayout`, which the scene places the
 * bays (a tap pours or scoops), the paddles, the pail and the flag with.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) =>
  levelsInOrder(rangeFor(LEVELS, band)).map((level) => [band, level] as const),
);

const box = (what: string, r: Rect): Target => ({ what, x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h });

describe.each(Object.entries(views))('Sand Table upright on %s', (_, v) => {
  it.each(cases)('%s level %i: bays, paddles, pail and flag fit and are clear', (_band, level) => {
    const l = sandLayout(v, planFor(level).bays.length);
    // Bays share edges by design, so only the buttons are checked against each other; each bay is checked alone.
    const buttons = [
      ...l.paddles.map((p, i) => box(`paddle ${i + 1}`, p)),
      box('pail', l.pail),
      box('flag', l.flag),
    ];
    expect(uprightProblems(v, buttons), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
    l.bays.forEach((b, i) => {
      expect(uprightProblems(v, [box(`bay ${i + 1}`, b)])).toEqual([]);
      for (const t of buttons) {
        const o = (a: Rect, c: Target) =>
          a.x < c.x + c.w / 2 &&
          c.x - c.w / 2 < a.x + a.w &&
          a.y < c.y + c.h / 2 &&
          c.y - c.h / 2 < a.y + a.h;
        expect(o(b, t), `bay ${i + 1} overlaps ${t.what}`).toBe(false);
      }
    });
  });
});
