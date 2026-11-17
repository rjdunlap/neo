import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { driftLayout, PLANS as driftPlans, targetsOf, type Box } from './drift-cards/logic';
import { BIG, CARD, MADE, PLANS as glue, tableCentre, tableLayout } from './word-glue/logic';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

/**
 * Upright batch 6 (chunk 31, docs/definitions/phone-portrait.md): six early-school games from the sweep's fits-as-is list, each
 * checked at every level (a phone's Today's six plays a game at the player's own band), on the three upright phone views and
 * a short one.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
/** A layout's box as a target, trimmed by a hair so boxes that only touch (a beach against the sea) are not read as overlapping. */
const box = (what: string, b: Box): Target => ({
  what,
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
  w: b.w - 0.01,
  h: b.h - 0.01,
});

/** Targets of at least 100 units; about 51 px on a 390-wide phone, never under 44. */
function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone && targets.length)
    expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
}

describe.each(Object.entries(views))('School upright batch 6 on %s', (_, v) => {
  it.each(driftPlans.map((p) => p.level))(
    'Drift Cards level %i: the sea, boats, beaches and cards fit',
    (level) => {
      const l = driftLayout(v, level);
      // The game falls back to the sideways layout when this is null, so null is a failure here.
      expect(l).not.toBeNull();
      if (!l) return;
      check(
        v,
        targetsOf(l).map((b) => box('drift target', b)),
      );
    },
  );

  it.each(glue.map((p) => p.level))(
    'Word Glue level %i: the pictures fit, apart, with the made thing where it appears',
    (level) => {
      // Level 4 (the lap opening) is one big picture; the others are two, three or four cards (levels 1 to 3).
      const n = level === 1 ? 2 : level === 2 ? 3 : 4;
      const picture = (what: string, c: { x: number; y: number }, size: number): Target => ({
        what,
        x: c.x,
        y: c.y,
        w: size,
        h: size,
      });
      if (level === 4) check(v, [picture('big picture', tableCentre(v, 2), BIG)]);
      else {
        const pts = tableLayout(v, n);
        expect(pts).toHaveLength(n);
        check(
          v,
          pts.map((c) => picture('picture', c, CARD)),
        );
        // The made thing appears at the centre of the table, inside the view and clear of Home and the guide.
        expect(uprightProblems(v, [picture('made thing', tableCentre(v, n), MADE)])).toEqual([]);
      }
    },
  );
});
