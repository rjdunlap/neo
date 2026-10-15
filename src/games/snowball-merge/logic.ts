import type { Rng } from '../../engine/random';

export type Direction = 'left' | 'up' | 'right' | 'down';
export const DIRECTIONS: readonly Direction[] = ['left', 'up', 'right', 'down'];
export type Board = readonly number[];
export const SIZE = 3;
export const PLANS = [
  { target: 16, name: 'Make 16 · open snowfield', board: [2, 0, 2, 0, 4, 0, 4, 0, 4] },
  { target: 32, name: 'Make 32 · choose your pairs', board: [2, 4, 2, 4, 0, 4, 8, 0, 8] },
  { target: 64, name: 'Make 64 · make room first', board: [2, 4, 2, 8, 4, 8, 16, 4, 16] },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];

/** Read a row/column from its leading edge. Equal neighbours merge once per slide. */
export function slide(board: Board, direction: Direction) {
  const out = Array<number>(SIZE * SIZE).fill(0);
  const motions: { from: number; to: number }[] = [];
  let merges = 0;
  for (let line = 0; line < SIZE; line++) {
    const indices = Array.from({ length: SIZE }, (_, k) => {
      if (direction === 'left') return line * SIZE + k;
      if (direction === 'right') return line * SIZE + SIZE - 1 - k;
      if (direction === 'up') return k * SIZE + line;
      return (SIZE - 1 - k) * SIZE + line;
    });
    const occupied = indices.filter(i => board[i] > 0), packed: number[] = [];
    for (let k = 0; k < occupied.length; k++) {
      const from = occupied[k], to = indices[packed.length];
      motions.push({ from, to });
      if (board[from] === board[occupied[k + 1]]) {
        motions.push({ from: occupied[k + 1], to });
        packed.push(board[from] * 2); k++; merges++;
      } else packed.push(board[from]);
    }
    indices.forEach((i, k) => { out[i] = packed[k] ?? 0; });
  }
  return { board: out, changed: out.some((v, i) => v !== board[i]), merges, motions };
}

export const complete = (board: Board, target: number) => board.filter(v => v > 0).length === 1 && board.includes(target);

/** Finite boards, no arrivals: breadth-first search gives a shortest route, or an honest dead end. */
export function solve(board: Board, target: number): Direction[] | null {
  const nodes: { board: Board; parent: number; direction: Direction | null }[] = [{ board, parent: -1, direction: null }];
  const seen = new Set([board.join(',')]);
  for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head];
    if (complete(node.board, target)) {
      const route: Direction[] = [];
      for (let at = head; nodes[at].parent >= 0; at = nodes[at].parent) route.push(nodes[at].direction!);
      return route.reverse();
    }
    for (const direction of DIRECTIONS) {
      const next = slide(node.board, direction), key = next.board.join(',');
      if (next.changed && !seen.has(key)) {
        seen.add(key); nodes.push({ board: next.board, parent: head, direction });
      }
    }
  }
  return null;
}

/** Reflections and rotations preserve the puzzle rules and make seeded, reproducible rounds. */
export function makePuzzle(level: number, rng: Rng) {
  const plan = planFor(level), turns = rng.int(0, 3), reflect = rng.chance(0.5);
  const board = Array<number>(9).fill(0);
  plan.board.forEach((v, i) => {
    let x = i % SIZE, y = Math.floor(i / SIZE);
    if (reflect) x = SIZE - 1 - x;
    for (let t = 0; t < turns; t++) [x, y] = [SIZE - 1 - y, x];
    board[y * SIZE + x] = v;
  });
  return { board, target: plan.target };
}
