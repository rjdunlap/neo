/*
 * Generates Snowball Merge's frozen boards, src/games/snowball-merge/boards.ts, by seeded rejection sampling against the
 * rules in logic.ts. Run with `node scripts/snowball-merge-boards.ts` (Node 23+ strips the types). The output is
 * committed; logic.test.ts checks every board in it, so regenerating only changes which boards are frozen.
 *
 * Per level: the authored plan first, then three more boards summing to the target whose shortest route sits in the
 * level's depth band. Level 1 can never reach a dead end; levels 3 to 5 can; a level 4
 * board carries at least two 32s. A level 5 board has one ice rock away from the centre (a centre rock leaves most
 * boards unsolvable), and its shortest route rests a snowball against the rock at least three times. Every added
 * board is asymmetric (eight distinct turns), and no board is a turn of another. A level 6 board is solved to the
 * snowman goal (three 16s) from that goal's own snowballs halved, and along its shortest route at least two slides on
 * offer would join two 16s and overshoot it.
 */
import { writeFileSync } from 'node:fs';
import {
  DIRECTIONS,
  explore,
  goalOf,
  orbit,
  overshot,
  PLANS,
  ROCK,
  slide,
  solve,
  SIZE,
  type Board,
} from '../src/games/snowball-merge/logic.ts';

let seed = 20261110;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

/** Shortest-route band, ball count and dead-end rule per level (index 0 is level 1). */
export const BANDS = [
  { route: [3, 4], balls: [4, 5], deadEnds: 'none' },
  { route: [5, 7], balls: [6, 7], deadEnds: 'any' },
  { route: [7, 9], balls: [7, 8], deadEnds: 'some' },
  { route: [10, 14], balls: [7, 8], deadEnds: 'some', has: [32, 2] },
  { route: [8, 11], balls: [6, 7], deadEnds: 'some', rock: 3 },
  { route: [6, 9], balls: [6, 7], deadEnds: 'some', tempt: 2 },
] as const satisfies readonly {
  route: readonly [number, number];
  balls: readonly [number, number];
  deadEnds: 'none' | 'any' | 'some';
  /** A snowball size the board must carry, and at least how many. */
  has?: readonly [number, number];
  /** One ice rock on the board, and at least how many slides of the shortest route rest a snowball against it. */
  rock?: number;
  /** A goal of several snowballs: at least how many slides offered along the shortest route would overshoot it. */
  tempt?: number;
}[];

/** Halve a random snowball of the goal until there are `count`, then scatter them over the field. */
function randomBoard(goal: readonly number[], count: number, rock: boolean): number[] {
  const values = [...goal];
  while (values.length < count) {
    const splittable = values.map((v, i) => (v > 2 ? i : -1)).filter((i) => i >= 0);
    if (!splittable.length) break;
    const i = splittable[int(0, splittable.length - 1)];
    values.splice(i, 1, values[i] / 2, values[i] / 2);
  }
  const board = Array<number>(SIZE * SIZE).fill(0),
    cells = board.map((_, i) => i);
  if (rock) {
    const centre = (SIZE * SIZE - 1) / 2,
      at = int(0, cells.length - 2);
    board[cells.splice(at >= centre ? at + 1 : at, 1)[0]] = ROCK;
  }
  for (const v of values) board[cells.splice(int(0, cells.length - 1), 1)[0]] = v;
  return board;
}

const out: Board[][] = [];
PLANS.forEach((plan, index) => {
  const band = BANDS[index],
    goal = goalOf(plan),
    boards: Board[] = [plan.board.slice()],
    taken = new Set(orbit(plan.board));
  for (let tries = 0; boards.length < 4; tries++) {
    if (tries > 200000) throw new Error(`level ${index + 1}: not enough boards`);
    const board = randomBoard(
      typeof goal === 'number' ? [goal] : goal,
      int(band.balls[0], band.balls[1]),
      'rock' in band,
    );
    if ('has' in band && board.filter((v) => v === band.has[0]).length < band.has[1]) continue;
    const turns = orbit(board);
    if (turns.size < 8 || [...turns].some((k) => taken.has(k))) continue;
    const route = solve(board, goal);
    if (!route || route.length < band.route[0] || route.length > band.route[1]) continue;
    if ('rock' in band) {
      let at: Board = board,
        rocked = 0;
      for (const direction of route) {
        const step = slide(at, direction);
        if (step.rocked) rocked++;
        at = step.board;
      }
      if (rocked < band.rock) continue;
    }
    if ('tempt' in band) {
      let at: Board = board,
        tempt = 0;
      for (const direction of route) {
        for (const other of DIRECTIONS) {
          const step = slide(at, other);
          if (step.changed && overshot(step.board, goal)) tempt++;
        }
        at = slide(at, direction).board;
      }
      if (tempt < band.tempt) continue;
    }
    const { deadEnds } = explore(board, goal);
    if ((band.deadEnds === 'none' && deadEnds > 0) || (band.deadEnds === 'some' && deadEnds === 0)) continue;
    for (const k of turns) taken.add(k);
    boards.push(board);
    console.log(`level ${index + 1}: ${board.join(',')} route ${route.length}, ${deadEnds} dead ends`);
  }
  out.push(boards);
});

const lines = [
  '// Generated by scripts/snowball-merge-boards.ts; logic.test.ts checks every board. Regenerate rather than hand-edit.',
  "import { ROCK, type Board } from './logic';",
  '',
  '/** Four frozen boards per level (index 0 is level 1), each level opening with its authored plan. */',
  'export const BOARDS: readonly (readonly Board[])[] = [',
  ...out.map(
    (boards) =>
      `  [\n${boards.map((b) => `    [${b.map((v) => (v === ROCK ? 'ROCK' : v)).join(', ')}],`).join('\n')}\n  ],`,
  ),
  '];',
  '',
];
writeFileSync(new URL('../src/games/snowball-merge/boards.ts', import.meta.url), lines.join('\n'));
