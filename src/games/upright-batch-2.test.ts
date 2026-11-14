import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { phoneCrosswordLayout } from './crossword/grownup';
import { gemLayout } from './gem-swap';
import { PLANS as gemPlans } from './gem-swap/logic';
import { songLayout } from './hat-band/logic';
import { pondLayout } from './lantern-lights';
import { planFor as pondPlan } from './lantern-lights/logic';
import { controllerFrame } from './picture-logic';
import { clueDepths, ORDER, poolFor, touchFrame } from './picture-logic/logic';
import { tilePairsLayout } from './tile-pairs';
import { fullMask, LEVELS as tileLevels, makeBoard, reshuffle } from './tile-pairs/logic';
import { levelsInOrder } from '../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const box = (what: string, x: number, y: number, w: number, h: number): Target => ({
  what,
  x: x + w / 2,
  y: y + h / 2,
  w,
  h,
});
const grid = (x: number, y: number, w: number, h: number, cell: number) =>
  Array.from({ length: w * h }, (_, i) =>
    box('board cell', x + (i % w) * cell, y + Math.floor(i / w) * cell, cell, cell),
  );
const buttons = (points: { x: number; y: number }[], w: number, h: number): Target[] =>
  points.map((p) => ({ ...p, what: 'button', w, h }));

function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets, 64)).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone) {
    const smallest = Math.min(...targets.map((t) => Math.min(t.w, t.h)));
    expect(smallest * v.scale).toBeGreaterThanOrEqual(44);
  }
}

describe.each(Object.entries(views))('Grown-up upright batch 2 on %s', (_, v) => {
  it('Hat Band: the level 4 brief, performers, song parts and playback fit', () => {
    const l = songLayout(v);
    check(v, [
      ...[...l.brief, ...l.spots, ...l.parts].map((r) => box('song card', r.x, r.y, r.w, r.h)),
      ...[l.undo, l.play, l.check].map((d) => square('song control', d, 2 * d.r)),
    ]);
  });

  it('Crossword: the largest written-clue grid and the mini fit with the keyboard and clue speaker', () => {
    for (const n of [8, 5]) {
      const l = phoneCrosswordLayout(v, n, n);
      check(v, [
        ...grid(l.board.x, l.board.y, n, n, l.tile),
        ...l.keys.map((p) => square('key', p, l.tile)),
        square('speaker', { x: l.clue.x + l.clue.w - l.clue.h / 2, y: l.clue.y + l.clue.h / 2 }, 88),
      ]);
    }
  });

  it('Picture Logic: every clue window and tool row fit with full-size cells available by sliding', () => {
    for (const level of ORDER) {
      for (const p of poolFor(level)) {
        const { rowDepth, colDepth } = clueDepths(p);
        const f = touchFrame(v.w, v.h, p.size, rowDepth, colDepth, !!p.colors, v.upright);
        check(v, [
          box('paper', f.paper.x, f.paper.y, f.paper.w, f.paper.h),
          ...f.slots.map((r) => box(r.kind, r.x, r.y, r.w, r.h)),
        ]);
        expect(f.cell * UPRIGHT_VIEWS.phone.scale).toBeGreaterThanOrEqual(44);
        expect(Math.min(f.grid.w, f.grid.h)).toBeGreaterThanOrEqual(4 * f.cell);

        const controller = controllerFrame(v, p.size, rowDepth, colDepth);
        const edge = p.size * controller.cell;
        expect(controller.board.x - controller.gutter).toBeGreaterThanOrEqual(24);
        expect(controller.board.x + edge).toBeLessThanOrEqual(v.w - 24);
        expect(controller.board.y - colDepth * controller.gap).toBeGreaterThanOrEqual(210);
        expect(controller.board.y + edge).toBeLessThan(controller.tally.y);
        expect(controller.tally.y + 80).toBeLessThan(v.h - 100);
      }
    }
  });

  it('Tile Pairs: every tile and button fit, including the six-column stacks', () => {
    for (const level of levelsInOrder(tileLevels.grownup!)) {
      const tiles = makeBoard(level, new Rng(1));
      const l = tilePairsLayout(v, tiles);
      const controls = buttons(l.buttons, 160, 100);
      // Stacked tiles cover one another by design. Check each tile against the controls and chrome.
      l.tiles.forEach(({ x, y }) =>
        check(v, [...controls, square('tile', { x: l.board.x + x, y: l.board.y + y }, 108)]),
      );
    }
  });

  it('Gem Swap: each tray size and its buttons fit', () => {
    for (const { size } of gemPlans) {
      const l = gemLayout(v, size);
      check(v, [
        ...grid(l.tray.x - l.pitch / 2, l.tray.y - l.pitch / 2, size, size, l.pitch),
        ...buttons(l.buttons, 150, 88),
      ]);
    }
  });

  it('Lantern Lights: all pond sizes fit with both the play and post-pond controls', () => {
    for (const level of [1, 3, 5, 8, 9]) {
      const n = pondPlan(level).size;
      const l = pondLayout(v, n);
      const cells = grid(l.board.x, l.board.y, n, n, l.cell);
      check(v, [...cells, ...buttons(l.buttons, 160, 100)]);
      check(v, [...cells, ...buttons([l.after[0]], 320, 100), ...buttons([l.after[1]], 220, 100)]);
    }
  });
});

describe('Tile Pairs held sideways', () => {
  it('keeps every board, and the biggest shuffle, between the rule line and the buttons at full size', () => {
    // An iPad's 4:3 is the shortest landscape (768 units high); a phone held sideways is wider, never shorter.
    for (const v of [computeView(1024, 768, NO_INSETS, false), computeView(844, 390, NO_INSETS, false)]) {
      expect(v.h).toBeGreaterThanOrEqual(768);
      const boards = levelsInOrder(tileLevels.grownup!).map((level) => makeBoard(level, new Rng(1)));
      const great = boards.find((b) => b.length === 40)!;
      boards.push(reshuffle(great, fullMask(great), new Rng(2)));
      for (const tiles of boards) {
        const l = tilePairsLayout(v, tiles),
          buttonTop = Math.min(...l.buttons.map((b) => b.y)) - 50;
        for (const { x, y } of l.tiles) {
          const cx = l.board.x + x,
            cy = l.board.y + y;
          // The tally sits at 66 and the rule line under it at 104.
          expect(cy - 54).toBeGreaterThanOrEqual(118);
          expect(cy + 54).toBeLessThanOrEqual(buttonTop);
          expect(cx - 54).toBeGreaterThanOrEqual(0);
          expect(cx + 54).toBeLessThanOrEqual(v.w);
        }
      }
    }
  });
});
