import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { BUNDLE, makerLaneLayout } from './maker-lane/logic';
import { boardLayout, PLANS as memoryPlans } from './memory-match/logic';
import { BUTTON_H, BUTTON_W, layout as paintLayout, POT_H, POT_W } from './paint-mixer/logic';
import {
  oneAtATimeLayout,
  ONE_AT_A_TIME_PIECES,
  PICTURE_H,
  PICTURE_W,
  PUZZLE_PLANS,
  puzzleLayout,
} from './puzzle-pals/logic';
import {
  BASKET_HIT,
  BASKETS,
  BUTTON_HIT,
  CARD_HIT,
  CHIP_HIT,
  PLANS as rhymePlans,
  rhymeLayout,
} from './rhyme-time/logic';
import { askLayout, galleryLayout, PLANS as whoPlans, riddleLayout, type Rect } from './who-am-i/logic';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

/**
 * Upright batch 7 (chunk 31, docs/definitions/phone-portrait.md): six more early-school games, each checked at every level
 * of every band (a phone's Today's six plays a game at the player's own band), on the three upright phone views and a
 * short one. The boxes are each game's own touch targets, from the layout function its scene places them with.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
/** A layout's corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w - 1e-7,
  h: r.h - 1e-7,
});
/** A centre-anchored box. */
const at = (what: string, p: { x: number; y: number }, w: number, h = w): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: w - 1e-7,
  h: h - 1e-7,
});

/** Targets of at least 100 units; about 51 px on a 390-wide phone, never under 44. */
function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone && targets.length)
    expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
}

describe.each(Object.entries(views))('School upright batch 7 on %s', (_, v) => {
  it.each([...rhymePlans.map((p, i) => [i + 1, p] as const), [10, BASKETS] as const])(
    'Rhyme Time level %i: the pictures, chips, baskets and Hear again stand apart',
    (_level, plan) => {
      // Level 7 (make the riddle): two sound chips, two meaning chips and the pet's mouth.
      const row = plan.mode === 'make' ? 5 : 0;
      const L = rhymeLayout(v, plan.mode, plan.choices, row, plan.mode === 'baskets' ? 3 : 0);
      expect(L.cards).toHaveLength(plan.choices);
      check(v, [
        ...L.cards.map((c) => at('picture', c, CARD_HIT)),
        ...L.row.map((c, i) => at(i < 4 ? 'chip' : 'mouth', c, i < 4 ? CHIP_HIT : BUTTON_HIT)),
        ...L.baskets.map((b) =>
          at('basket', { x: b.x, y: b.y - BASKET_HIT.up + BASKET_HIT.h / 2 }, BASKET_HIT.w, BASKET_HIT.h),
        ),
        at('Hear again', L.replay, BUTTON_HIT),
      ]);
    },
  );

  it.each([
    [2, 2],
    [3, 2],
    [3, 3],
  ])('Paint Mixer with %i pots and a %i-row table: the pots and the three buttons fit', (pots, table) => {
    const L = paintLayout(v, pots, table);
    expect(L.portrait).toBe(true);
    check(v, [
      ...L.pots.map((p) => at('pot', p, POT_W, POT_H)),
      at('undo', L.undo, BUTTON_W, BUTTON_H),
      at('tip', L.tip, BUTTON_W, BUTTON_H),
      at('check', L.check, BUTTON_W, BUTTON_H),
    ]);
    // The jar, the table and the bucket are pictures: inside the view, the bucket clear of the buttons under it.
    expect(L.bucket.y + L.bucket.h / 2).toBeLessThanOrEqual(L.tip.y - BUTTON_H / 2);
    expect(L.jar.y - L.jar.h / 2).toBeGreaterThanOrEqual(0);
  });

  it.each(whoPlans.map((p) => [p.level, p] as const))(
    'Who Am I level %i: the sign, the friends, the clue strip and the tray fit',
    (_level, plan) => {
      const L =
        plan.mode === 'riddle'
          ? riddleLayout(v)
          : plan.mode === 'ask'
            ? askLayout(v)
            : galleryLayout(v, plan.friends);
      expect(L.cards).toHaveLength(plan.friends);
      check(v, [
        rect('sign', L.sign),
        ...L.cards.map((c) => rect('friend', c)),
        ...L.strip.map((s) => rect('clue so far', s)),
        ...('tray' in L ? (L as { tray: Rect[] }).tray.map((t) => rect('tray card', t)) : []),
      ]);
    },
  );

  it.each(PUZZLE_PLANS.map((p, i) => [i + 1, p] as const).filter(([, p]) => !p.oneAtATime))(
    'Puzzle Pals level %i: every waiting piece is big enough, apart and right of the pet; the frame is clear',
    (_level, plan) => {
      const total = plan.cols * plan.rows;
      // The tray as it empties: the pieces left never shrink, overlap or leave the view.
      for (let waiting = total - plan.preplaced; waiting >= 1; waiting--) {
        const L = puzzleLayout(v, plan, total, waiting);
        const pw = (PICTURE_W / plan.cols) * L.trayScale;
        const ph = (PICTURE_H / plan.rows) * L.trayScale;
        expect(L.homes).toHaveLength(waiting);
        check(
          v,
          L.homes.map((h) => at('piece', h, pw, ph)),
        );
        // The frame (with its 18-unit wooden rim) sits under the corner buttons, above the tray and inside the view.
        const s = L.scale;
        const frame = at(
          'frame',
          { x: L.board.x + L.board.w / 2, y: L.board.y + (PICTURE_H * s) / 2 },
          L.board.w + 36 * s,
          PICTURE_H * s + 36 * s,
        );
        expect(uprightProblems(v, [frame, ...L.homes.map((h) => at('piece', h, pw, ph))])).toEqual([]);
      }
    },
  );

  it.each(ONE_AT_A_TIME_PIECES)(
    'Puzzle Pals level 8 in %i strips: the frame and the one waiting piece fit',
    (cols) => {
      const L = oneAtATimeLayout(v, cols);
      const bh = PICTURE_H * L.scale;
      check(v, [
        at(
          'frame',
          { x: L.board.x + L.board.w / 2, y: L.board.y + bh / 2 },
          L.board.w + 36 * L.scale,
          bh + 36 * L.scale,
        ),
        at('piece', L.home, L.board.w / cols, bh),
      ]);
    },
  );

  it.each(memoryPlans.map((p, i) => [i + 1, p] as const))(
    'Memory Match level %i: every card fits, apart',
    (_level, plan) => {
      const L = boardLayout(v, plan.pairs * 2, plan.pairs);
      expect(L.cards).toHaveLength(plan.pairs * 2);
      check(
        v,
        L.cards.map((c) => square('card', c, L.size - 1e-7)),
      );
    },
  );

  it.each([1, 2, 3])('Maker Lane level %i: the stalls, the bundle and the cards fit', (level) => {
    const L = makerLaneLayout(v, level);
    expect(L.portrait).toBe(true);
    if (level === 3)
      return check(
        v,
        L.cards.map((c) => rect('card', c)),
      );
    // Level 1 taps a stall; level 2 carries the bundle from wherever it waits to a stall.
    for (const spot of level === 2 ? L.spots : [null])
      check(v, [...L.stalls.map((s) => rect('stall', s)), ...(spot ? [square('bundle', spot, BUNDLE)] : [])]);
  });
});
