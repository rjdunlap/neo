/** The two 3×3 goals have disjoint reachable permutations. One byte per permutation holds both goals' distances. */
type Step = { distance: number; next: number };
const factorial = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
const values = new Uint8Array(factorial[9]);
const tables = new Map<string, RankedTable>();

function rank(board: readonly number[]): number {
  let result = 0;
  for (let i = 0; i < board.length; i++) {
    let smaller = 0;
    for (let j = i + 1; j < board.length; j++) if (board[j] < board[i]) smaller++;
    result += smaller * factorial[board.length - i - 1];
  }
  return result;
}
function unrank(value: number): number[] {
  const unused = Array.from({ length: 9 }, (_, i) => i),
    board: number[] = [];
  for (let i = 8; i >= 0; i--) {
    const digit = Math.floor(value / factorial[i]);
    board.push(unused.splice(digit, 1)[0]);
    value %= factorial[i];
  }
  return board;
}
type Neighbours = (board: readonly number[], cols: number) => number[];
type Slide = (board: readonly number[], cols: number, at: number) => number[] | null;

function parity(board: readonly number[]): number {
  let inversions = 0;
  for (let i = 0; i < board.length; i++)
    for (let j = i + 1; j < board.length; j++) if (board[i] && board[j] && board[i] > board[j]) inversions++;
  return inversions % 2;
}
class RankedTable {
  // Ranks in discovery order preserve the existing seeded pool selection, without retaining a string map or board arrays.
  readonly order: Uint32Array;
  readonly size: number;
  private readonly parity: number;
  constructor(
    target: readonly number[],
    private readonly cols: number,
    private readonly neighbours: Neighbours,
    private readonly slide: Slide,
  ) {
    const queue = [target.slice()],
      ranks: number[] = [];
    this.parity = parity(target);
    const start = rank(target);
    values[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const board = queue[head],
        r = rank(board),
        depth = values[r];
      ranks.push(r);
      for (const at of neighbours(board, cols)) {
        const next = slide(board, cols, at)!,
          nr = rank(next);
        if (values[nr]) continue;
        values[nr] = depth + 1;
        queue.push(next);
      }
    }
    this.order = Uint32Array.from(ranks);
    this.size = ranks.length;
  }
  get(key: string): Step | undefined {
    if (!/^[0-8]{9}$/.test(key) || new Set(key).size !== 9) return undefined;
    const board = [...key].map(Number),
      r = rank(board);
    if (parity(board) !== this.parity || !values[r]) return undefined;
    const distance = values[r] - 1;
    if (!distance) return { distance, next: -1 };
    const next = this.neighbours(board, this.cols).find(
      (at) => values[rank(this.slide(board, this.cols, at)!)] === distance,
    );
    return next === undefined ? undefined : { distance, next };
  }
  *[Symbol.iterator](): Generator<[string, Step]> {
    for (const r of this.order) {
      const key = unrank(r).join('');
      yield [key, this.get(key)!];
    }
  }
}

export function rankedDistances(
  target: readonly number[],
  cols: number,
  neighbours: Neighbours,
  slide: Slide,
) {
  const key = target.join('');
  let table = tables.get(key);
  if (!table) {
    table = new RankedTable(target, cols, neighbours, slide);
    tables.set(key, table);
  }
  return table;
}
