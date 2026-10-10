import type { Rng } from '../../engine/random';

/**
 * Penguin Slide, after the ice puzzles in Pokémon and Zelda: the penguin slides until something
 * stops it (a snowy rock, the edge of the pond, or a patch of soft snow it sinks into). Fish are
 * eaten on the way past. The puzzle is planning a few slides ahead.
 *
 * Puzzles are generated at random and kept only when the shortest solution has the planned
 * number of moves, found by searching every slide.
 *
 * Ice blocks (from level 6) are pushed: when a slide ends beside a block, the next slide in that
 * direction sends the block skating instead, until it meets a rock, the pond's edge, another block
 * or a fish (it never covers one), or sinks into soft snow. Only the block moves; the penguin
 * stays put. A block that cannot move yet behaves like a rock. Pushing counts as a slide.
 */
export interface SlidePlan {
  cols: number;
  rows: number;
  fish: 1 | 2;
  /** Soft snow patches: the penguin stops on them. */
  soft: number;
  rocks: number;
  /** Ice blocks to push; 0 on the levels before level 6. */
  blocks?: number;
  /** Shortest solution, in slides (a push is one). */
  moves: [number, number];
  puzzles: number;
  name: string;
}

export const PLANS: SlidePlan[] = [
  { cols: 5, rows: 4, fish: 1, soft: 0, rocks: 3, moves: [1, 2], puzzles: 3, name: 'Slide to the fish in one or two slides' },
  { cols: 6, rows: 4, fish: 1, soft: 0, rocks: 4, moves: [2, 3], puzzles: 3, name: 'Plan two or three slides; rocks are the only way to stop' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 5, moves: [3, 4], puzzles: 3, name: 'Three or four slides around the rocks' },
  { cols: 6, rows: 5, fish: 2, soft: 0, rocks: 5, moves: [3, 5], puzzles: 2, name: 'Two fish to collect, in any order' },
  { cols: 7, rows: 5, fish: 2, soft: 2, rocks: 5, moves: [4, 6], puzzles: 2, name: 'Soft snow stops the penguin: use it to plan a longer route' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 4, blocks: 1, moves: [3, 5], puzzles: 2, name: 'Push an ice block: it skates until it bumps into something, so park it to make a stop' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Cell {
  x: number;
  y: number;
}

export interface SlidePuzzle {
  cols: number;
  rows: number;
  rocks: Cell[];
  soft: Cell[];
  /** Ice blocks where they start; absent on the boards without any. */
  blocks?: Cell[];
  start: Cell;
  fish: Cell[];
  /** The fewest slides that eat every fish. */
  best: number;
}

/** 0 right, 1 down, 2 left, 3 up. */
export type Dir = 0 | 1 | 2 | 3;
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];
const key = (c: Cell) => `${c.x},${c.y}`;

/** Which way a tap on the ice sends the penguin: the side of it the tap is on, along the longer way. */
export const tapDirection = (dx: number, dy: number): Dir => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3);

/** The cell beside `from` in direction `dir`: where the how-to card's ghost finger taps to send the penguin that way. */
export const beside = (from: Cell, dir: Dir): Cell => ({ x: from.x + DX[dir], y: from.y + DY[dir] });

/** Where a slide stops, and every cell it passes over on the way (including where it stops). */
export function slide(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[] = p.blocks ?? []): { to: Cell; passed: Cell[] } {
  const rocks = new Set([...p.rocks, ...blocks].map(key));
  const soft = new Set(p.soft.map(key));
  let x = from.x;
  let y = from.y;
  const passed: Cell[] = [];
  for (;;) {
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    if (nx < 0 || ny < 0 || nx >= p.cols || ny >= p.rows || rocks.has(`${nx},${ny}`)) break;
    x = nx;
    y = ny;
    passed.push({ x, y });
    if (soft.has(`${x},${y}`)) break;
  }
  return { to: { x, y }, passed };
}

/** Which fish a slide eats, as a bit mask over `p.fish`. */
export function eaten(p: SlidePuzzle, passed: Cell[]): number {
  let mask = 0;
  p.fish.forEach((f, i) => {
    if (passed.some((c) => c.x === f.x && c.y === f.y)) mask |= 1 << i;
  });
  return mask;
}

/** Where an ice block that is pushed from `from` ends up, or null when it cannot move at all. */
function skate(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[]): Cell | null {
  const stops = new Set([...p.rocks, ...blocks, ...p.fish].map(key));
  const soft = new Set(p.soft.map(key));
  let { x, y } = from;
  for (;;) {
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    if (nx < 0 || ny < 0 || nx >= p.cols || ny >= p.rows || stops.has(`${nx},${ny}`)) break;
    x = nx;
    y = ny;
    if (soft.has(`${x},${y}`)) break;
  }
  return x === from.x && y === from.y ? null : { x, y };
}

/** One move of the penguin: a slide, or (standing beside a block that can move) a push. */
export interface Move {
  /** Where the penguin ends up (unchanged by a push). */
  to: Cell;
  /** Every cell the penguin passes, including where it stops; empty for a push. */
  passed: Cell[];
  /** Where every block is afterwards. */
  blocks: Cell[];
  /** The block that was pushed, if one was. */
  pushed: { index: number; to: Cell } | null;
}

/** What a tap in `dir` does: null when nothing moves (a bump), never a mistake. */
export function move(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[] = p.blocks ?? []): Move | null {
  const { to, passed } = slide(p, from, dir, blocks);
  if (passed.length) return { to, passed, blocks, pushed: null };
  const ahead = beside(from, dir);
  const index = blocks.findIndex((b) => b.x === ahead.x && b.y === ahead.y);
  if (index < 0) return null;
  const dest = skate(p, ahead, dir, blocks);
  if (!dest) return null;
  return { to: from, passed: [], blocks: blocks.map((b, i) => (i === index ? dest : b)), pushed: { index, to: dest } };
}

const blockKey = (blocks: Cell[]) => blocks.map(key).sort().join(';');

/**
 * The fewest slides from here (with `have` fish already eaten) to eat them all, and the first
 * slide of one such route; `moves` is -1 when the fish can't be reached any more.
 */
export function solve(p: SlidePuzzle, from: Cell, have = 0, blocks: Cell[] = p.blocks ?? []): { moves: number; first: Dir | -1 } {
  const all = (1 << p.fish.length) - 1;
  if (have === all) return { moves: 0, first: -1 };
  const seen = new Set<string>([`${key(from)},${have},${blockKey(blocks)}`]);
  let frontier: { at: Cell; have: number; blocks: Cell[]; first: Dir | -1 }[] = [{ at: from, have, blocks, first: -1 }];
  for (let depth = 1; frontier.length && depth <= 30; depth++) {
    const next: typeof frontier = [];
    for (const s of frontier) {
      for (const dir of [0, 1, 2, 3] as Dir[]) {
        const m = move(p, s.at, dir, s.blocks);
        if (!m) continue;
        const h = s.have | eaten(p, m.passed);
        const first = s.first === -1 ? dir : s.first;
        if (h === all) return { moves: depth, first };
        const k = `${key(m.to)},${h},${blockKey(m.blocks)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ at: m.to, have: h, blocks: m.blocks, first });
      }
    }
    frontier = next;
  }
  return { moves: -1, first: -1 };
}

export function makePuzzle(plan: SlidePlan, rng: Rng): SlidePuzzle {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const cells: Cell[] = [];
    for (let x = 0; x < plan.cols; x++) for (let y = 0; y < plan.rows; y++) cells.push({ x, y });
    const pool = rng.shuffle(cells);
    const start = pool.pop()!;
    const rocks = pool.splice(0, plan.rocks);
    const soft = pool.splice(0, plan.soft);
    const fish = pool.splice(0, plan.fish);
    const blocks = pool.splice(0, plan.blocks ?? 0);
    const p: SlidePuzzle = { cols: plan.cols, rows: plan.rows, rocks, soft, ...(blocks.length ? { blocks } : {}), start, fish, best: 0 };
    const { moves } = solve(p, start);
    if (moves < plan.moves[0] || moves > plan.moves[1]) continue;
    // Soft snow should matter: without it, the puzzle would play differently.
    if (plan.soft && solve({ ...p, soft: [] }, start).moves === moves) continue;
    // Blocks should matter: with them frozen like rocks, the fish must be out of reach or take longer.
    if (blocks.length) {
      const frozen = solve({ ...p, rocks: [...rocks, ...blocks], blocks: [] }, start).moves;
      if (frozen !== -1 && frozen <= moves) continue;
    }
    return { ...p, best: moves };
  }
  throw new Error('no slide puzzle');
}

/** Extra slides allowed before the hint arrow appears. */
export const HINT_AFTER = 3;
