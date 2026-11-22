import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { captionPlace } from '../../ui/caption-layout';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { beeLayout, CHECK_W, GATE_SIZE, PREVIEW_H, PREVIEW_W } from './bee-layout';
import {
  beeHint,
  beeHintValid,
  beePuzzle,
  checkBeeBed,
  clash,
  copyBed,
  gateLine,
  inspectGate,
  LEVELS,
  makeBeds,
  PACKET,
  PACKET_REACH,
  planFor,
  sightline,
  type Bed,
} from './logic';

const ROWS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];
const SQUARES = ROWS.flatMap((a) =>
  ROWS.flatMap((b) =>
    ROWS.filter((c) => a.every((v, i) => v !== b[i] && v !== c[i] && b[i] !== c[i])).map((c) => [a, b, c]),
  ),
);

describe('The bee counts tall flowers', () => {
  it('appends school 11 after 9, keeps the preschool opening, and seeds both boards', () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).toEqual([3, 4, 5, 6, 7, 8, 9, 11]);
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([10, 1]);
    const solutions = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        JSON.stringify(makeBeds(planFor(11), new Rng(seed))[0].solution),
      ),
    );
    expect(solutions).toEqual(new Set([0, 1].map((board) => JSON.stringify(beePuzzle(board).solution))));
  });

  it('takes opposite views of the same flowers and leaves an incomplete total blank', () => {
    expect(sightline([1, 0, 2])).toEqual({ count: 2, visible: [true, false, true] });
    expect(sightline([2, 0, 1])).toEqual({ count: 1, visible: [true, false, false] });
    expect(sightline([1, null, 2])).toEqual({ count: null, visible: [true, false, true] });
    const puzzle = beePuzzle(0);
    expect(gateLine(puzzle.gates[0])).toEqual([
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
    ]);
    expect(gateLine(puzzle.gates[3])).toEqual([...gateLine(puzzle.gates[0])].reverse());
    expect(gateLine(puzzle.gates[9])).toEqual([...gateLine(puzzle.gates[6])].reverse());
    expect(inspectGate(puzzle.solution, puzzle.gates[1]).flowers).toEqual([1, 2, 0]);
    expect(inspectGate(puzzle.solution, puzzle.gates[7]).flowers).toEqual([1, 2, 0]);
  });

  it.each([0, 1])('board %i has one solution and retains the rejected arrangement history', (board) => {
    const puzzle = beePuzzle(board);
    expect(SQUARES).toHaveLength(12);
    const fitsGiven = SQUARES.filter((bed) =>
      puzzle.start.every((row, r) => row.every((v, c) => v === null || v === bed[r][c])),
    );
    expect(fitsGiven.filter((bed) => checkBeeBed(bed, puzzle, new Set()).kind === 'solved')).toEqual([
      puzzle.solution,
    ]);
    const rejected = new Set<string>();
    const wrong = fitsGiven.find((bed) => checkBeeBed(bed, puzzle, new Set()).kind === 'revise')!;
    const firstGate = puzzle.gates.findIndex((gate) => inspectGate(wrong, gate).count !== gate.goal);
    expect(checkBeeBed(wrong, puzzle, rejected)).toMatchObject({
      kind: 'revise',
      gate: firstGate,
      fresh: true,
    });
    expect(checkBeeBed(puzzle.start, puzzle, rejected)).toEqual({ kind: 'incomplete' });
    expect(checkBeeBed(copyBed(wrong), puzzle, rejected)).toMatchObject({ kind: 'revise', fresh: false });
  });

  it('keeps a shown plant deduction and a shown lift while those actions still apply', () => {
    const puzzle = beePuzzle(0);
    const bed = copyBed(puzzle.start);
    bed[0] = [0, 1, 2];
    const plant = beeHint(bed, puzzle)!;
    expect(plant).toMatchObject({ kind: 'plant', reason: 'line', r: 1, c: 1 });
    bed[1][2] = 0;
    expect(beeHintValid(bed, puzzle, plant)).toBe(true);
    bed[1][1] = 2;
    expect(beeHintValid(bed, puzzle, plant)).toBe(false);
    const wrong = copyBed(beePuzzle(1).solution);
    const lift = beeHint(wrong, puzzle)!;
    wrong[2][2] = null;
    expect(beeHintValid(wrong, puzzle, lift)).toBe(true);
    wrong[lift.r][lift.c] = null;
    expect(beeHintValid(wrong, puzzle, lift)).toBe(false);
  });

  it.each([0, 1])('board %i hints preserve correct flowers from every legal partial bed', (board) => {
    const puzzle = beePuzzle(board);
    const spots = puzzle.start.flatMap((row, r) => row.flatMap((v, c) => (v === null ? [{ r, c }] : [])));
    const opening = beeHint(puzzle.start, puzzle);
    expect(opening).toMatchObject({ kind: 'plant', gate: puzzle.teachingGate, flower: 0, reason: 'three' });
    let seen = 0;
    function walk(bed: Bed, at: number) {
      if (at < spots.length) {
        const { r, c } = spots[at];
        walk(bed, at + 1);
        for (const flower of [0, 1, 2]) {
          if (clash(bed, 'both', r, c, flower)) continue;
          bed[r][c] = flower;
          walk(bed, at + 1);
          bed[r][c] = null;
        }
        return;
      }
      seen++;
      const current = copyBed(bed);
      for (let i = 0; i < 16; i++) {
        const hint = beeHint(current, puzzle);
        if (!hint) break;
        const { r, c } = hint;
        expect(puzzle.start[r][c]).toBeNull();
        if (hint.kind === 'fix') {
          expect(current[r][c]).not.toBe(puzzle.solution[r][c]);
          current[r][c] = null;
        } else {
          expect(clash(current, 'both', r, c, hint.flower)).toBeNull();
          current[r][c] = hint.flower;
        }
      }
      expect(current).toEqual(puzzle.solution);
    }
    walk(copyBed(puzzle.start), 0);
    expect(seen).toBe(2097);
  });
});

const short = computeView(390, 625, NO_INSETS, true);
const small = computeView(375, 601, NO_INSETS, true);
const sideways = computeView(625, 390, NO_INSETS);
const rail = captionPlace(computeView(844, 390, NO_INSETS), true).game;

describe.each(Object.entries({ ...UPRIGHT_VIEWS, short, small, sideways, rail }))(
  'bee layout on %s',
  (_, view) => {
    it('fits every gate, cell and control and reserves a separate side view', () => {
      const l = beeLayout(view);
      const plants = ROWS[0].flatMap((r) =>
        ROWS[0].map((c) =>
          square(`cell ${r},${c}`, { x: l.board.x + 50 + c * 100, y: l.board.y + 50 + r * 100 }, 100),
        ),
      );
      const controls = [
        ...plants,
        ...l.gates.map((p, i) => square(`gate ${i}`, p, GATE_SIZE)),
        ...l.packets.map((p, i) => square(`packet ${i}`, p, 2 * (PACKET + PACKET_REACH))),
        { what: 'Ask the bee', ...l.check, w: CHECK_W, h: 100 },
        { what: 'side view', ...l.preview, w: PREVIEW_W, h: PREVIEW_H },
      ];
      expect(uprightProblems(view, controls)).toEqual([]);
      const caption = captionPlace(view, true);
      if (view.upright && caption.mode === 'bubble' && caption.band)
        expect(l.preview.y + PREVIEW_H / 2).toBeLessThan(caption.band.y);
      if (!view.upright && caption.mode === 'bubble' && caption.band) {
        // The longest bee caption lays out in at most three lines. Lower gates sit to its right.
        const captionTop = view.h - 185 - 12 - 28 - 3 * 40;
        for (const p of controls.filter((p) => p.x + p.w / 2 < 640))
          expect(p.y + p.h / 2).toBeLessThan(captionTop);
      }
    });
  },
);
