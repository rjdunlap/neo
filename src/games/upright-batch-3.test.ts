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
    for (const level of [1, 2, 3, 4, 5, 6, 7]) {
      const plan = pyramidPlan(level),
        shelf = 'shelf' in plan ? plan.shelf : 0,
        l = pyramidLayout(v, plan.rows, shelf);
      // Level 6's shelf row stands under the pyramid, its five open cards counted with the rest.
      expect(l.cards).toHaveLength((plan.rows * (plan.rows + 1)) / 2 + shelf);
      if (level === 7) {
        // Seven rows may close up on a short phone (94 apart there), so each row is checked as the strip it shows: a
        // covered row its top `gap` units (at least 64), the open bottom row whole, card by card.
        const gap = l.cards[1].y - l.cards[0].y;
        expect(gap).toBeGreaterThanOrEqual(64);
        const strips = Array.from({ length: 6 }, (_, row) => {
          const first = l.cards[(row * (row + 1)) / 2],
            end = l.cards[(row * (row + 1)) / 2 + row];
          return box(`row ${row + 1}`, first.x - 50, first.y - 50, end.x - first.x + 100, gap);
        });
        check(v, [
          ...strips,
          ...l.cards.slice(21).map((p) => square('card', p, 100)),
          ...l.buttons.map((p) => ({ ...p, what: 'button', w: 164, h: 100 })),
        ]);
        continue;
      }
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

describe('Pyramid Solitaire sideways', () => {
  it('six rows fit the 1024 × 768 area: cards inside, a covered strip with its corner index, buttons below the cards', () => {
    for (const v of [computeView(1024, 768), computeView(844, 390), computeView(1366, 1024)]) {
      for (const level of [1, 2, 3, 4, 5, 6, 7]) {
        const plan = pyramidPlan(level),
          rows = plan.rows,
          shelf = 'shelf' in plan ? plan.shelf : 0,
          l = pyramidLayout(v, rows, shelf);
        // Level 6: the shelf's open cards stand whole, apart from the pyramid, the buttons and the round's chrome, and
        // right of every button so the centered status line runs clear of them.
        if (shelf) {
          const spare = l.cards.slice(-shelf);
          expect(spare).toHaveLength(5);
          // Sideways the pyramid's rows overlap (a covered strip shows), so it is one box here.
          const pyramid = l.cards.slice(0, -shelf),
            x0 = Math.min(...pyramid.map((c) => c.x)) - 50,
            y0 = Math.min(...pyramid.map((c) => c.y)) - 50;
          check(v, [
            box(
              'pyramid',
              x0,
              y0,
              Math.max(...pyramid.map((c) => c.x)) + 50 - x0,
              Math.max(...pyramid.map((c) => c.y)) + 50 - y0,
            ),
            ...spare.map((p) => square('shelf card', p, 100)),
            ...l.buttons.map((p) => ({ ...p, what: 'button', w: 164, h: 100 })),
          ]);
          for (const c of spare)
            expect(c.x - 50).toBeGreaterThanOrEqual(Math.max(...l.buttons.map((b) => b.x + 82)) + 12);
          expect(Math.min(...spare.map((c) => c.y - 50))).toBeGreaterThanOrEqual(60);
        }
        for (const c of l.cards) {
          expect(c.x - 50).toBeGreaterThanOrEqual(0);
          expect(c.x + 50).toBeLessThanOrEqual(v.w);
          expect(c.y - 50).toBeGreaterThanOrEqual(0);
        }
        // The next row leaves at least the top of each covered card showing: its corner index sits 34 units above center.
        const gap = rows > 1 ? l.cards[1].y - l.cards[0].y : 104;
        expect(gap).toBeGreaterThanOrEqual(55);
        // Level 5 makes a covered card a target (the cover lift): the strip above the next row is at least 64 units.
        if (level === 5) expect(gap).toBeGreaterThanOrEqual(64);
        const bottom = Math.max(...l.cards.map((c) => c.y + 50));
        expect(bottom).toBeLessThanOrEqual(l.status.y - 12);
        if (level === 7) {
          // Seven rows: the buttons stand in a column left of the pyramid (under Home, above the guide), so the rows
          // are at least 64 apart and every covered strip is a grown-up target.
          expect(gap).toBeGreaterThanOrEqual(64);
          const x0 = Math.min(...l.cards.map((c) => c.x)) - 50,
            y0 = l.cards[0].y - 50;
          check(v, [
            box('pyramid', x0, y0, Math.max(...l.cards.map((c) => c.x)) + 50 - x0, bottom - y0),
            ...l.buttons.map((p) => ({ ...p, what: 'button', w: 164, h: 100 })),
          ]);
          for (const b of l.buttons) expect(b.x + 82 + 12).toBeLessThanOrEqual(x0);
          // The bottom row is open at the start: its seven cards stand whole, side by side.
          const row = l.cards.slice(21);
          for (let k = 1; k < row.length; k++) expect(row[k].x - row[k - 1].x).toBeGreaterThanOrEqual(100);
          expect(l.status.y + 20).toBeLessThanOrEqual(v.h);
          continue;
        }
        for (const b of l.buttons) {
          expect(b.y - 50).toBeGreaterThan(l.status.y);
          expect(b.y + 50).toBeLessThanOrEqual(v.h);
          expect(b.x - 82).toBeGreaterThanOrEqual(150);
        }
      }
    }
  });
  it('seven rows upright on the 768 × 1024 area: inside it, cards side by side and covered strips at least 64', () => {
    const v = computeView(768, 1024, NO_INSETS, true),
      l = pyramidLayout(v, 7);
    const gap = l.cards[1].y - l.cards[0].y;
    expect(gap).toBeGreaterThanOrEqual(64);
    expect(l.cards[2].x - l.cards[1].x).toBeGreaterThanOrEqual(100);
    for (const c of l.cards) {
      expect(c.x - 50).toBeGreaterThanOrEqual(0);
      expect(c.x + 50).toBeLessThanOrEqual(v.w);
    }
    for (const b of l.buttons) expect(b.y + 50).toBeLessThanOrEqual(v.h);
  });
});
