import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { gardenLayout, NEXT_H, PLANS as gardenPlans, SLOT, UNDO_R } from './block-garden/logic';
import { caseLayout, slidingLayout } from './logic-grid';
import { makeRound as makeCases, planFor as casePlan } from './logic-grid/logic';
import { pyramidLayout } from './pyramid-solitaire';
import { planFor as pyramidPlan } from './pyramid-solitaire/logic';
import { comebackLayout } from './species-comeback';
import { extend, hatch, makeRound as makeComeback, PLANS as comebackPlans } from './species-comeback/logic';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const box = (what: string, x: number, y: number, w: number, h: number): Target => ({
  what,
  x: x + w / 2,
  y: y + h / 2,
  w,
  h,
});

function check(v: View, targets: Target[], min = 64, px = 44) {
  expect(uprightProblems(v, targets, min)).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone) {
    const smallest = Math.min(...targets.map((t) => Math.min(t.w, t.h)));
    expect(smallest * v.scale).toBeGreaterThanOrEqual(px);
  }
}

describe.each(Object.entries(views))('Grown-up upright batch 3 on %s', (_, v) => {
  it('Block Garden: the bed, tray, next tray and Undo fit at every level (child levels at 100 units)', () => {
    for (const plan of gardenPlans) {
      const l = gardenLayout(plan, v);
      expect(l.x + l.n * l.cell).toBeLessThanOrEqual(v.w);
      check(
        v,
        [
          box('bed', l.x, l.y, l.n * l.cell, l.n * l.cell),
          ...l.slots.map((r) => box('tray slot', r.x, r.y, r.w, r.h)),
          ...l.next.map((r) => box('next tray', r.x, r.y, r.w, Math.min(r.h, NEXT_H))),
          square('undo', l.undo, 2 * UNDO_R),
        ],
        100,
      );
      expect(l.slots[0].w).toBe(SLOT);
    }
  });

  it('Logic Grid: the case file (7) and the sliding L (8) fit with their clues and Help', () => {
    for (const level of [7, 8]) {
      const seeds = [1, 2, 3, 4, 5];
      const n = Math.max(
        ...seeds.flatMap((seed) => makeCases(casePlan(level), new Rng(seed)).map((b) => b.clues.length)),
      );
      const l = level === 7 ? caseLayout(v, n, true) : slidingLayout(v, n, true);
      // The squares slide (8) or sit (7) in a window right of the friends' column and under the headers.
      const win = box('squares', l.board.x + 100, l.board.y + 80, l.win.w, l.win.h);
      expect(Math.floor(l.win.w / l.cell)).toBeGreaterThanOrEqual(8);
      expect(Math.floor(l.win.h / l.cell)).toBeGreaterThanOrEqual(level === 7 ? 8 : 7);
      expect(l.board.y).toBeGreaterThanOrEqual(210);
      const clues = l.clues.map((p) => box('clue', p.x, p.y, l.clueSize.w, l.clueSize.h));
      const help = square('help', l.help, 100);
      // The squares are 64 units (the grown-up minimum): 32.5 px on a 390-wide phone, as when it is held sideways.
      check(v, [win, ...clues, ...(level === 8 ? [help] : [])], 64, 32);
      // Level 7's Help sits in the L's empty quarter, inside the window's box.
      if (level === 7) check(v, [...clues, help], 64, 32);
    }
  });

  it('Pyramid Solitaire: every card and button fit at each level', () => {
    for (const level of [1, 2, 3]) {
      const l = pyramidLayout(v, pyramidPlan(level).rows);
      check(v, [
        ...l.cards.map((p) => square('card', p, 100)),
        ...l.buttons.map((p) => ({ ...p, what: 'button', w: 164, h: 100 })),
      ]);
    }
  });

  it('Species Comeback: the tree, the nests and Spring fit before and after spring', () => {
    for (const { level } of comebackPlans) {
      for (const seed of [1, 2, 3]) {
        const round = makeComeback(level, new Rng(seed));
        const t = round.tree;
        const plan = extend(t, [], round.plan.depth, round.target)!;
        // Before Spring, then with this spring's hatchlings in the tree (hatch adds them to it).
        for (const spring of [false, true]) {
          const young = spring ? hatch(t, plan, new Rng(seed)) : [];
          const l = comebackLayout(v, t, young, round.target);
          const ids = t.turtles.map((x) => x.id);
          check(
            v,
            [
              ...ids.map((id) =>
                square('turtle', l.slots.get(id)!, young.some((y) => y.id === id) ? l.hatch : l.card),
              ),
              ...l.nests.map((p) => ({ ...p, what: 'nest', w: 120, h: 100 })),
              { ...l.spring, what: 'Spring', w: 150, h: 80 },
            ],
            64,
            // The widest trees (level 3) shrink their cards to the 64-unit minimum on the 768-wide area: 32.5 px.
            32,
          );
        }
      }
    }
  });
});
