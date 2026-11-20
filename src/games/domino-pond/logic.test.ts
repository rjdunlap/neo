import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  directions,
  ends,
  fits,
  hintFor,
  isSolved,
  LEVELS,
  makeBoard,
  sampleBoard,
  tilings,
  unmetClues,
  type Board,
  type Level,
  type Placement,
} from './logic';

const LADDER = [
  { band: 'prek', level: 1, cells: [0, 1, 3, 4], patches: [[0], [1], [3], [4]] },
  {
    band: 'school',
    level: 2,
    cells: [0, 1, 2, 3],
    patches: [
      [0, 1],
      [2, 3],
    ],
  },
  {
    band: 'grownup',
    level: 3,
    cells: [0, 1, 2, 3, 4, 5],
    patches: [
      [0, 3],
      [1, 4],
      [2, 5],
    ],
  },
] as const;

const moveKey = ({ stone, anchor, direction }: Placement) => [stone, anchor, direction].join(':');

function dotsOn(board: Board, placements: readonly Placement[]) {
  const dots = new Map<number, number>();
  for (const move of placements) {
    const stone = board.stones.find((stone) => stone.id === move.stone)!;
    const [anchor, tail] = ends(board, move);
    dots.set(anchor, stone.dots[0]);
    dots.set(tail, stone.dots[1]);
  }
  return dots;
}

function expectedUnmet(board: Board, placements: readonly Placement[]) {
  const dots = dotsOn(board, placements);
  return board.clues.filter(({ cells, relation, target }) => {
    const count = cells.reduce((total, cell) => total + (dots.get(cell) ?? 0), 0);
    if (relation === 'match') return cells.every((cell) => dots.has(cell)) && count !== target;
    if (relation === 'less') return count >= target;
    if (relation === 'more') return count <= target;
    return count !== target;
  });
}

function allFits(board: Board) {
  return board.stones.flatMap((stone) =>
    board.cells.flatMap((anchor) =>
      directions(board, stone)
        .map((direction): Placement => ({ stone: stone.id, anchor, direction }))
        .filter((move) => fits(board, [], move)),
    ),
  );
}

describe('the Domino Pond ladder', () => {
  it.each(LADDER)(
    'generates reproducible and varied playable boards for $band',
    ({ band, level, cells, patches }) => {
      expect(LEVELS[band]).toMatchObject({ min: level, max: level });
      const arrangements = new Set<string>();
      for (let seed = 1; seed <= 48; seed++) {
        const board = makeBoard(level, new Rng(seed));
        const context = `level ${level}, seed ${seed}`;
        expect(makeBoard(level, new Rng(seed)), context).toEqual(board);
        expect(board.cells, context).toEqual(cells);
        expect(
          board.clues.map(({ cells }) => cells),
          context,
        ).toEqual(patches);
        expect(board.stones, context).toHaveLength(cells.length / 2);
        const pairs = board.stones.map(({ dots }) => [...dots].sort().join(''));
        expect(new Set(pairs).size, context).toBe(board.stones.length);
        expect(new Set(board.stones.map(({ id }) => id)).size, context).toBe(board.stones.length);
        expect(
          board.stones.every(({ dots }) => dots.every((count) => count >= 1 && count <= 4)),
          context,
        ).toBe(true);
        arrangements.add(JSON.stringify([pairs.sort(), board.clues]));

        const geometric = tilings(board);
        const accepted = geometric.filter((moves) => isSolved(board, moves));
        expect(accepted.length, context).toBeGreaterThan(0);
        expect(accepted.length, context).toBeLessThan(geometric.length);
        expect(
          geometric.every((moves) => isSolved(board, moves) === !expectedUnmet(board, moves).length),
          context,
        ).toBe(true);

        if (level === 2) {
          expect(
            board.clues.map(({ relation }) => relation),
            context,
          ).toEqual(['equal', 'equal']);
          expect(board.clues[0].target, context).not.toBe(board.clues[1].target);
          const winningMoves = new Set(accepted.flat().map(moveKey));
          expect(
            allFits(board).some((move) => !winningMoves.has(moveKey(move))),
            context,
          ).toBe(true);
        }
        if (level === 3) {
          expect(board.clues.map(({ relation }) => relation).sort(), context).toEqual([
            'equal',
            'less',
            'more',
          ]);
          for (const clue of board.clues) {
            expect(
              geometric.some((moves) => !expectedUnmet(board, moves).includes(clue)),
              context,
            ).toBe(true);
            expect(
              geometric.some((moves) => expectedUnmet(board, moves).includes(clue)),
              context,
            ).toBe(true);
            if (clue.relation === 'equal') continue;
            expect(clue.target, context).toBeGreaterThanOrEqual(2);
            expect(clue.target, context).toBeLessThanOrEqual(7);
          }
        }
      }
      expect(arrangements.size).toBeGreaterThan(8);
    },
  );

  it.each([
    { level: 1, geometric: 8, accepted: 1 },
    { level: 2, geometric: 16, accepted: 6 },
    { level: 3, geometric: 144, accepted: 16 },
  ] as const)(
    'falls back to the audited level $level board after no attempts',
    ({ level, geometric, accepted }) => {
      const board = sampleBoard(level);
      const moves = tilings(board);
      const fallback = makeBoard(level, new Rng(9), 0);
      expect({ ...fallback, stones: [...fallback.stones].sort((a, b) => a.id - b.id) }).toEqual(board);
      expect(makeBoard(level, new Rng(9), 0)).toEqual(fallback);
      expect(moves).toHaveLength(geometric);
      expect(moves.filter((placed) => isSolved(board, placed))).toHaveLength(accepted);
      expect(new Set(moves.map((placed) => placed.map(moveKey).sort().join('/'))).size).toBe(geometric);
    },
  );
});

describe('placements and checks', () => {
  it('tests each filled half at level 1 and keeps the two patches separate', () => {
    const board = sampleBoard(1);
    const [stone] = board.stones;
    const east: Placement = { stone: stone.id, anchor: 0, direction: 0 };
    const west: Placement = { stone: stone.id, anchor: 1, direction: 2 };
    expect(directions(board, stone)).toEqual([0, 2]);
    expect(fits(board, [], east)).toBe(true);
    expect(fits(board, [], west)).toBe(true);
    expect(fits(board, [], { ...east, anchor: 1 })).toBe(false);
    expect(fits(board, [], { ...east, direction: 1 })).toBe(false);
    const unmatched = [east, west].find((move) => expectedUnmet(board, [move]).length)!;
    expect(unmetClues(board, [unmatched])).toEqual(
      board.clues.filter((clue) => clue.cells[0] === 0 || clue.cells[0] === 1),
    );
    const matching = [east, west].find((move) => !expectedUnmet(board, [move]).length)!;
    expect(unmetClues(board, [matching])).toEqual([]);
    expect(isSolved(board, [matching])).toBe(false);
  });

  it('accepts both horizontal and vertical solutions for the sample totals', () => {
    const board = sampleBoard(2);
    const oneTwo = board.stones.find(({ dots }) => dots[0] === 1 && dots[1] === 2)!;
    const twoThree = board.stones.find(({ dots }) => dots[0] === 2 && dots[1] === 3)!;
    const horizontal: Placement[] = [
      { stone: oneTwo.id, anchor: 0, direction: 0 },
      { stone: twoThree.id, anchor: 2, direction: 0 },
    ];
    const vertical: Placement[] = [
      { stone: oneTwo.id, anchor: 0, direction: 1 },
      { stone: twoThree.id, anchor: 1, direction: 1 },
    ];
    expect(isSolved(board, horizontal)).toBe(true);
    expect(isSolved(board, vertical)).toBe(true);
    const [first, second] = horizontal;
    expect(fits(board, [], { ...first, anchor: 1 })).toBe(false); // The east end would wrap to the next row.
    expect(fits(board, [], { ...first, anchor: -1 })).toBe(false);
    expect(fits(board, [], { ...first, stone: -1 })).toBe(false);
    expect(fits(board, [first], { ...second, anchor: 0 })).toBe(false);
    expect(fits(board, [first], { ...second, stone: first.stone })).toBe(false);
    expect(isSolved(board, [first])).toBe(false);
    expect(isSolved(board, [first, { ...second, anchor: 0 }])).toBe(false);
    expect(isSolved(board, [first, { ...second, stone: first.stone }])).toBe(false);
  });

  it('only turns doubles east or south and never enumerates a reversed copy', () => {
    const original = sampleBoard(2);
    const stone = { ...original.stones[0], dots: [2, 2] } as const;
    const board: Board = { ...original, stones: [stone, original.stones[1]] };
    expect(directions(board, stone)).toEqual([0, 1]);
    expect(directions(board, board.stones[1])).toEqual([0, 1, 2, 3]);
    expect(fits(board, [], { stone: stone.id, anchor: 1, direction: 2 })).toBe(false);
    expect(fits(board, [], { stone: stone.id, anchor: 2, direction: 3 })).toBe(false);
    expect(tilings(board)).toHaveLength(8);
  });

  it('rejects equality at both strict signs and keeps the exact sign satisfied', () => {
    const board = sampleBoard(3);
    const winning = tilings(board).find((moves) => isSolved(board, moves))!;
    const dots = dotsOn(board, winning);
    const atBoundary: Board = {
      ...board,
      clues: board.clues.map((clue) => ({
        ...clue,
        target: clue.cells.reduce((sum, cell) => sum + dots.get(cell)!, 0),
      })),
    };
    expect(unmetClues(atBoundary, winning)).toEqual(
      atBoundary.clues.filter(({ relation }) => relation !== 'equal'),
    );
    expect(isSolved(atBoundary, winning)).toBe(false);
  });
});

describe('hints', () => {
  function followHints(board: Board, starting: Placement[]) {
    let placed = [...starting];
    const solutions = tilings(board)
      .filter((moves) => isSolved(board, moves))
      .map((moves) => new Set(moves.map(moveKey)));
    for (let step = 0; step <= board.stones.length * 2; step++) {
      const current = new Set(placed.map(moveKey));
      const keeps = (solution: Set<string>, keys: Set<string>) =>
        [...keys].filter((key) => solution.has(key)).length;
      const maxKept = Math.max(...solutions.map((solution) => keeps(solution, current)));
      const hint = hintFor(board, placed);
      if (isSolved(board, placed)) {
        expect(hint).toBeNull();
        return;
      }
      if (!hint) throw new Error('An unfinished board needs a clue.');
      if (hint.kind === 'place') {
        expect(maxKept).toBe(placed.length);
        expect(fits(board, placed, hint.move)).toBe(true);
        placed.push(hint.move);
        const extended = new Set(placed.map(moveKey));
        expect(solutions.some((solution) => keeps(solution, extended) === extended.size)).toBe(true);
      } else {
        expect(maxKept).toBeLessThan(placed.length);
        expect(current.has(moveKey(hint.move))).toBe(true);
        placed = placed.filter((move) => moveKey(move) !== moveKey(hint.move));
        const reduced = new Set(placed.map(moveKey));
        expect(Math.max(...solutions.map((solution) => keeps(solution, reduced)))).toBe(maxKept);
      }
    }
    throw new Error('The hint sequence did not reach a complete board.');
  }

  it('extends a valid vertical choice even when the sample also has a horizontal solution', () => {
    const board = sampleBoard(2);
    const stone = board.stones.find(({ dots }) => dots[0] === 1 && dots[1] === 2)!;
    followHints(board, [{ stone: stone.id, anchor: 0, direction: 1 }]);
  });

  it.each([1, 2, 3] as const)(
    'revises failed level %i tilings while retaining as many stones as possible',
    (level: Level) => {
      const board = sampleBoard(level);
      followHints(board, []);
      for (const moves of tilings(board).filter((moves) => !isSolved(board, moves))) {
        followHints(board, moves);
      }
    },
  );
});
