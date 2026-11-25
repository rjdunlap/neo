import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { dealScenePair, SCENES } from './scenes';
import { levelsInOrder } from '../../progress/difficulty';
import {
  boardCount,
  dealPlan,
  dealTurns,
  dropSlot,
  flipTurn,
  LEVELS,
  ONE_AT_A_TIME_PIECES,
  puzzlePlan,
  hintPiece,
  judgeDrop,
  judgeTwinDrop,
  lidLayout,
  type BoardPiece,
  twinLayout,
  oneAtATimeLayout,
  puzzleLayout,
  UPRIGHT_TOP,
  nextToPlace,
  outerSides,
  PICTURE_H,
  PICTURE_W,
  piecesFor,
  PUZZLE_PLANS,
  slotCenter,
  TAP_HOP,
  tapHops,
  trayRows,
  whereWords,
} from './logic';

describe('Puzzle Pals', () => {
  it('hinted corners lead to adjacent edges, then an interior beside a placed piece', () => {
    const plan = { ...PUZZLE_PLANS[6], cols: 5, rows: 5 };
    const corners = [
      { col: 0, row: 0 },
      { col: 4, row: 0 },
      { col: 0, row: 4 },
      { col: 4, row: 4 },
    ];
    expect(corners).toContainEqual(hintPiece(plan, []));
    expect(hintPiece(plan, corners)).toEqual({ col: 1, row: 0 });
    // All corners plus a central placed piece: an adjacent edge still takes priority.
    expect(hintPiece(plan, [...corners, { col: 2, row: 2 }])).toEqual({ col: 1, row: 0 });
    const border = piecesFor(plan).filter((p) => Object.values(outerSides(plan, p)).some(Boolean));
    expect(hintPiece(plan, border)).toEqual({ col: 1, row: 1 });
  });

  it('hints finish every partial board without choosing a placed piece, including all 4096 top-level states', () => {
    for (const plan of PUZZLE_PLANS) {
      const all = piecesFor(plan);
      for (let mask = 0; mask < 2 ** all.length; mask++) {
        const placed = all.filter((_, i) => mask & (1 << i));
        const next = hintPiece(plan, placed);
        if (placed.length === all.length) {
          expect(next).toBeUndefined();
          continue;
        }
        expect(all).toContainEqual(next);
        expect(placed).not.toContainEqual(next);
        const corners = all.filter((p) => {
          const s = outerSides(plan, p);
          return (
            (s.top || s.bottom) &&
            (s.left || s.right) &&
            !placed.some((q) => q.col === p.col && q.row === p.row)
          );
        });
        if (corners.length) expect(corners).toContainEqual(next);
        // Every suggestion can be placed through the real drop rule.
        const c = slotCenter(plan, next!);
        expect(
          dropSlot(
            plan,
            c.x,
            c.y,
            all.filter((p) => !placed.includes(p)),
          ),
        ).toEqual(next);
      }
    }
  });

  it('names all nine grid positions and uses left, middle, right for strips', () => {
    const plan = PUZZLE_PLANS[5];
    expect(piecesFor(plan).map((p) => whereWords(plan, p))).toEqual([
      'top-left',
      'top',
      'top-right',
      'left',
      'middle',
      'right',
      'bottom-left',
      'bottom',
      'bottom-right',
    ]);
    expect(piecesFor(PUZZLE_PLANS[2]).map((p) => whereWords(PUZZLE_PLANS[2], p))).toEqual([
      'left',
      'middle',
      'right',
    ]);
    for (const plan of PUZZLE_PLANS)
      for (const p of piecesFor(plan)) {
        expect(SCRIPT[`puzzle.hint.${whereWords(plan, p)}`].length).toBeGreaterThan(0);
        const s = outerSides(plan, p);
        expect(s.top).toBe(p.row === 0);
        expect(s.bottom).toBe(p.row === plan.rows - 1);
        expect(s.left).toBe(p.col === 0);
        expect(s.right).toBe(p.col === plan.cols - 1);
      }
  });

  it('cuts every picture into its grid, leaving at least one piece to place', () => {
    for (const plan of PUZZLE_PLANS) {
      const pieces = piecesFor(plan);
      expect(pieces).toHaveLength(plan.cols * plan.rows);
      expect(plan.preplaced).toBeLessThan(pieces.length);
      expect(pieces.length).toBeLessThanOrEqual(12);
      expect(trayRows(pieces.length - plan.preplaced)).toBeLessThanOrEqual(2);
    }
  });

  it('finds the place a piece is dropped on, and ignores drops off the frame', () => {
    for (const plan of PUZZLE_PLANS) {
      const pieces = piecesFor(plan);
      for (const p of pieces) {
        const c = slotCenter(plan, p);
        expect(dropSlot(plan, c.x, c.y, pieces)).toEqual(p);
        // A little off-center still lands in the same place.
        expect(
          dropSlot(plan, c.x + PICTURE_W / plan.cols / 5, c.y - PICTURE_H / plan.rows / 5, pieces),
        ).toEqual(p);
      }
      expect(dropSlot(plan, PICTURE_W * 2.5, PICTURE_H * 2.5, pieces)).toBeNull();
    }
  });

  it('the ghost finger places every piece of every level in its own place, whatever order the tray holds them in', () => {
    for (const plan of PUZZLE_PLANS) {
      for (let seed = 1; seed <= 50; seed++) {
        // The game's tray: the pre-placed pieces first (already in place), then the rest shuffled.
        const all = piecesFor(plan);
        const tray = [
          ...all.slice(0, plan.preplaced),
          ...new Rng(seed).shuffle(all.slice(plan.preplaced)),
        ].map((piece, i) => ({ piece, placed: i < plan.preplaced }));
        let moved = 0;
        for (let next = nextToPlace(tray); next; next = nextToPlace(tray)) {
          // Let go on the middle of its place: the nearest empty place is that piece's own, so it is never a miss.
          const c = slotCenter(plan, next.piece);
          expect(
            dropSlot(
              plan,
              c.x,
              c.y,
              tray.filter((p) => !p.placed).map((p) => p.piece),
            ),
          ).toEqual(next.piece);
          next.placed = true;
          moved++;
        }
        expect(moved).toBe(all.length - plan.preplaced);
      }
    }
  });

  it('is forgiving on the smallest puzzles: anywhere over the frame finds the last empty place', () => {
    const plan = PUZZLE_PLANS[0];
    const [, right] = piecesFor(plan);
    expect(dropSlot(plan, 20, 20, [right])).toEqual(right);
  });

  it('lets a tapped piece hop into place on the one- and two-piece pictures only', () => {
    expect(PUZZLE_PLANS.slice(0, 2).every(tapHops)).toBe(true);
    expect(PUZZLE_PLANS.slice(2).some(tapHops)).toBe(false);
    // A tap is judged where the piece was let go: it must still be within a finger's wobble of its tray spot.
    expect(TAP_HOP).toBeGreaterThan(10);
    expect(TAP_HOP).toBeLessThan(60);
  });

  it('level 8 is lap first: one big piece at a time, a two- or three-strip picture, and nowhere else on the ladder', () => {
    expect(levelsInOrder(LEVELS.lap!)).toEqual([8, 1, 2]);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(8);
    // Only level 8 is one at a time, and only it draws from the RNG to pick its cut.
    PUZZLE_PLANS.forEach((plan, i) => expect(!!plan.oneAtATime).toBe(i === 7));
    for (let level = 1; level <= 7; level++) {
      const a = new Rng(5);
      expect(dealPlan(level, a)).toBe(puzzlePlan(level));
      expect(a.next()).toBe(new Rng(5).next());
    }
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const plan = dealPlan(8, new Rng(seed));
      expect(plan.rows).toBe(1);
      expect(ONE_AT_A_TIME_PIECES).toContain(plan.cols);
      expect(plan.preplaced).toBe(0);
      expect(plan.ghost).toBe(true);
      seen.add(plan.cols);
      // Every strip has its own place in the frame for the hop to land in.
      const pieces = piecesFor(plan);
      expect(new Set(pieces.map((p) => slotCenter(plan, p).x)).size).toBe(plan.cols);
    }
    expect([...seen].sort()).toEqual([2, 3]);
    // The opening lines a lap player hears say touch or tap, not drag.
    expect(SCRIPT['puzzle.lap'][0]).not.toMatch(/drag/i);
    expect(SCRIPT['puzzle.tap'][0]).not.toMatch(/drag/i);
    expect(tapHops(puzzlePlan(1)) && tapHops(puzzlePlan(2))).toBe(true);
  });

  it('shows the box lid at every empty-frame level (5-7 and 9)', () => {
    PUZZLE_PLANS.forEach((plan) => expect(!!plan.lid).toBe(!plan.ghost));
    for (const plan of PUZZLE_PLANS.filter((p) => p.lid)) expect(plan.ghost).toBe(false);
  });

  it('level 9 (Turn it round) sits at the top of pre-K and school, turns half the pieces, and never counts a wrong turn in the right place as a miss', () => {
    expect(levelsInOrder(LEVELS.prek!)).toEqual([5, 6, 7, 9, 10]);
    expect(levelsInOrder(LEVELS.school!)).toEqual([6, 7, 9, 10]);
    const plan = puzzlePlan(9);
    expect(plan.cols).toBe(3);
    expect(plan.rows).toBe(2);
    expect(plan.lid).toBe(true);
    expect(plan.ghost).toBe(false);
    expect(plan.turns).toBe(3);
    expect(SCRIPT['puzzle.turn'][0].length).toBeGreaterThan(10);
    expect(SCRIPT['puzzle.turnItRound'][0]).toBe('Turn it round!');

    // Two turns restore a piece.
    expect(flipTurn(0)).toBe(2);
    expect(flipTurn(2)).toBe(0);
    expect(flipTurn(flipTurn(0))).toBe(0);
    expect(flipTurn(flipTurn(2))).toBe(2);

    // Turned set is never empty and never all pieces, and edge clamps preserve that invariant.
    for (let seed = 1; seed <= 50; seed++) {
      const turns = dealTurns(6, plan.turns!, new Rng(seed));
      const upsideDown = turns.filter((t) => t === 2).length;
      expect(upsideDown).toBe(3);
      expect(upsideDown).toBeGreaterThan(0);
      expect(upsideDown).toBeLessThan(6);
      expect(turns.every((t) => t === 0 || t === 2)).toBe(true);
    }
    expect(dealTurns(6, 0, new Rng(1)).every((t) => t === 0)).toBe(true);
    expect(dealTurns(6, 99, new Rng(1)).filter((t) => t === 2)).toHaveLength(5);

    // Right place + wrong turn is 'turn' (not 'wrong', so not a miss); wrong place is 'wrong'; off frame is 'off'.
    const all = piecesFor(plan);
    const [first, second] = all;
    const c0 = slotCenter(plan, first);
    const c1 = slotCenter(plan, second);
    expect(judgeDrop(plan, c0.x, c0.y, first, 2, all)).toBe('turn');
    expect(judgeDrop(plan, c0.x, c0.y, first, 0, all)).toBe('place');
    expect(judgeDrop(plan, c1.x, c1.y, first, 2, all)).toBe('wrong');
    expect(judgeDrop(plan, c1.x, c1.y, first, 0, all)).toBe('wrong');
    expect(judgeDrop(plan, PICTURE_W * 2, PICTURE_H * 2, first, 2, all)).toBe('off');

    // Ghost finger at level 9 taps any upside-down piece first, then drags it into its place.
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new Rng(seed);
      const shuffled = rng.shuffle(all);
      const turns = dealTurns(shuffled.length, plan.turns!, rng);
      const tray = shuffled.map((piece, i) => ({ piece, turn: turns[i], placed: false }));
      let taps = 0;
      let drags = 0;
      for (let next = nextToPlace(tray); next; next = nextToPlace(tray)) {
        if (next.turn !== 0) {
          next.turn = flipTurn(next.turn);
          taps++;
          continue;
        }
        const c = slotCenter(plan, next.piece);
        expect(
          judgeDrop(
            plan,
            c.x,
            c.y,
            next.piece,
            next.turn,
            tray.filter((p) => !p.placed).map((p) => p.piece),
          ),
        ).toBe('place');
        next.placed = true;
        drags++;
      }
      expect(taps).toBe(3);
      expect(drags).toBe(6);
    }
  });

  it('keeps the lid in view, off the frame and the tray, at sideways and upright sizes', () => {
    const views = [
      { w: 1024, h: 768 },
      { w: 1366, h: 768 },
      { w: 1024, h: 1000 },
      { w: 768, h: 1024 },
      { w: 768, h: 1200 },
      { w: 768, h: 1663 },
    ];
    for (const v of views)
      for (const plan of PUZZLE_PLANS.filter((p) => p.lid)) {
        const lid = lidLayout(v);
        const L = puzzleLayout(v, plan, plan.cols * plan.rows, plan.cols * plan.rows);
        const frame = { x: L.board.x - 18, w: L.board.w + 36 };
        expect(lid.x).toBeGreaterThanOrEqual(0);
        expect(lid.x + lid.w + 8).toBeLessThanOrEqual(v.w);
        // Sideways it is left of the frame; upright it is above it.
        if (v.h > v.w) expect(lid.y + lid.h + 8).toBeLessThanOrEqual(UPRIGHT_TOP - 18);
        else {
          expect(lid.x + lid.w + 8).toBeLessThanOrEqual(frame.x);
          expect(lid.y + lid.h + 8).toBeLessThanOrEqual(L.panel.y);
        }
        expect(lid.w / lid.h).toBeCloseTo(PICTURE_W / PICTURE_H, 5);
      }
    // The one-at-a-time level has no lid, so its layout is untouched.
    expect(oneAtATimeLayout({ w: 1024, h: 768 }, 3).scale).toBeGreaterThan(0);
  });

  it('level 10 sorts eight pieces onto two pictures that differ in friend, sky and ground', () => {
    const plan = puzzlePlan(10);
    expect(plan.twin).toBe(true);
    expect(boardCount(plan)).toBe(2);
    expect(boardCount(puzzlePlan(9))).toBe(1);
    expect(levelsInOrder(LEVELS.prek)).toEqual([5, 6, 7, 9, 10]);
    expect(levelsInOrder(LEVELS.school)).toEqual([6, 7, 9, 10]);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([8, 1, 2]);
    for (let seed = 1; seed <= 200; seed++) {
      const [a, b] = dealScenePair(new Rng(seed));
      expect(SCENES).toContain(a);
      expect(SCENES).toContain(b);
      expect(b.animal).not.toBe(a.animal);
      expect(b.sky).not.toBe(a.sky);
      expect(b.ground).not.toBe(a.ground);
    }
  });

  it('level 10 judges a drop against both boards: own place, own wrong place, other picture, off', () => {
    const plan = puzzlePlan(10);
    const cells = piecesFor(plan);
    const empty: BoardPiece[] = [0, 1].flatMap((board) => cells.map((c) => ({ ...c, board })));
    // Each board's own picture units: a drop over board 0's place is far off board 1's frame, and the reverse.
    const over = (board: number, c: { col: number; row: number }) => {
      const at = slotCenter(plan, c);
      return [0, 1].map((b) => (b === board ? at : { x: at.x - 1000 * (b - board), y: at.y }));
    };
    for (const board of [0, 1])
      for (const piece of cells) {
        const mine: BoardPiece = { ...piece, board };
        for (const target of cells) {
          const want = target.col === piece.col && target.row === piece.row ? 'place' : 'wrong';
          expect(judgeTwinDrop(plan, over(board, target), mine, empty)).toBe(want);
          expect(judgeTwinDrop(plan, over(1 - board, target), mine, empty)).toBe('otherPicture');
        }
      }
    const far = [
      { x: -900, y: -900 },
      { x: 2000, y: 2000 },
    ];
    expect(judgeTwinDrop(plan, far, { ...cells[0], board: 0 }, empty)).toBe('off');
    // A finished board takes no more drops: only the other board's places remain to land on.
    const left = empty.filter((e) => e.board === 1);
    expect(judgeTwinDrop(plan, over(0, cells[0]), { ...cells[0], board: 1 }, left)).toBe('off');
  });

  it('level 10 ghost finger places all eight pieces without a miss, and the tray is the union of both boards', () => {
    const plan = puzzlePlan(10);
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new Rng(seed);
      const all: BoardPiece[] = [0, 1].flatMap((board) => piecesFor(plan).map((c) => ({ ...c, board })));
      const tray = rng.shuffle(all).map((piece) => ({ piece, placed: false }));
      expect(tray).toHaveLength(8);
      expect(new Set(tray.map((t) => `${t.piece.board}/${t.piece.col}/${t.piece.row}`)).size).toBe(8);
      for (let next = nextToPlace(tray); next; next = nextToPlace(tray)) {
        const at = slotCenter(plan, next.piece);
        const locals = [0, 1].map((b) => (b === next.piece.board ? at : { x: at.x - 1000, y: at.y }));
        expect(
          judgeTwinDrop(
            plan,
            locals,
            next.piece,
            tray.filter((t) => !t.placed).map((t) => t.piece),
          ),
        ).toBe('place');
        next.placed = true;
      }
    }
  });

  it('level 10 lays out two frames and eight pieces without overlap at sideways and upright sizes', () => {
    const plan = puzzlePlan(10);
    const views = [
      { w: 1024, h: 768 },
      { w: 1366, h: 768 },
      { w: 768, h: 1024 },
      { w: 768, h: 1663 },
      { w: 600, h: 1300 },
    ];
    for (const v of views) {
      const L = twinLayout(v, plan, 8, 8);
      const [a, b] = L.boards!;
      expect(a.w).toBeGreaterThan(0);
      expect(a.x + a.w + 18).toBeLessThan(b.x - 18);
      expect(b.x + b.w + 18).toBeLessThanOrEqual(v.w);
      expect(a.x - 18).toBeGreaterThanOrEqual(v.w > v.h ? 160 : 0);
      const boardBottom = a.y + (a.w * PICTURE_H) / PICTURE_W + 18;
      expect(boardBottom).toBeLessThan(L.panel.y);
      expect(L.homes).toHaveLength(8);
      // Pieces stay on the panel and keep the 100-unit touch rule (hit area pads 10 on every side).
      const ph = (PICTURE_H / plan.rows) * L.trayScale;
      expect(ph + 20).toBeGreaterThanOrEqual(100);
      for (const h of L.homes) {
        expect(h.y - ph / 2).toBeGreaterThanOrEqual(L.panel.y);
        expect(h.y + ph / 2).toBeLessThanOrEqual(L.panel.y + L.panel.h);
      }
    }
  });
});
