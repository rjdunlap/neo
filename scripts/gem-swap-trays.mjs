// Writes src/games/gem-swap/boards.ts: Gem Swap's frozen trays, 20 a level. The first three of levels 1–4 are the
// hand-made originals and keep their place; the rest are built backwards from an empty tray (drop in a line of three,
// then undo a swap that would make it) and kept only when an exact breadth-first search finds the level's par, the tray
// is settled with no starting line, and (levels 2–6) one accepted first swap is a dead end and some shortest route has a
// falling line; at level 5 every column starts with a gem. Level 6 (ten trays at par 3, ten at par 4) drops in a long piece
// (a line of five, an L/T/cross of five, or two lines of four) and keeps a tray only when every shortest route (enumerated)
// has a swap whose first wave makes a run of four or more or two crossing runs. Trays equal under mirroring or recolouring count once. Reproducible:
//   node scripts/gem-swap-trays.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import { POOLS } from '../src/games/gem-swap/boards.ts';
import { clear, fall, matches, moves, PLANS, swap } from '../src/games/gem-swap/logic.ts';

const PER_LEVEL = 20;

/** Exact par by breadth-first search (null when the tray cannot be cleared). */
function par(board, size) {
  let frontier = [board];
  const seen = new Set([board.join(',')]);
  for (let depth = 0; frontier.length; depth++) {
    const next = [];
    for (const b of frontier) {
      if (clear(b)) return depth;
      for (const pair of moves(b, size)) {
        const out = swap(b, size, pair).board,
          key = out.join(',');
        if (!seen.has(key)) {
          seen.add(key);
          next.push(out);
        }
      }
    }
    frontier = next;
  }
  return null;
}
/** Planning matters above level 1 (whose six gems allow only a few dozen trays): a dead-end first swap and a falling line. */
function interesting(board, size, best, level) {
  const dist = new Map();
  const d = (b) => {
    const key = b.join(',');
    if (!dist.has(key)) dist.set(key, par(b, size));
    return dist.get(key);
  };
  const cascades = (b, left) =>
    left > 0 &&
    moves(b, size).some((pair) => {
      const step = swap(b, size, pair);
      if (d(step.board) !== left - 1) return false;
      return step.waves.length > 1 || cascades(step.board, left - 1);
    });
  const deadEnd = moves(board, size).some((pair) => d(swap(board, size, pair).board) === null);
  return level === 1 || (deadEnd && cascades(board, best));
}
/** Level 6: what makes the other levels interesting, and no shortest route that skips the long swap. */
const longOnly = (board, size, best) =>
  interesting(board, size, best, 6) && everyRouteLong(board, size, best, distances(size));
/** One name for a tray and its mirror image under any recolouring. */
function canonical(board, size) {
  return [false, true]
    .map((mirror) => {
      const names = new Map();
      return board
        .map((_, i) => {
          const k = board[Math.floor(i / size) * size + (mirror ? size - 1 - (i % size) : i % size)];
          if (k < 0) return '.';
          if (!names.has(k)) names.set(k, names.size);
          return names.get(k);
        })
        .join('');
    })
    .sort()[0];
}
const columnsOf = (board, size) =>
  Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) => board[(size - 1 - y) * size + x]).filter((k) => k >= 0),
  ); // bottom first
const boardOf = (columns, size) => {
  const out = Array(size * size).fill(-1);
  columns.forEach((col, x) =>
    col.forEach((k, h) => {
      out[(size - 1 - h) * size + x] = k;
    }),
  );
  return out;
};
/** Drop a line of three into a settled tray, pushing the gems above it up. */
function insertLine(board, size, rng) {
  const columns = columnsOf(board, size),
    kind = rng.int(0, 5);
  const options = [];
  for (let x = 0; x < size; x++) {
    for (let h = 0; h <= columns[x].length && columns[x].length + 3 <= size; h++)
      options.push({ vertical: true, x, h });
    if (x <= size - 3) {
      const low = Math.min(columns[x].length, columns[x + 1].length, columns[x + 2].length);
      for (let h = 0; h <= low; h++)
        if ([0, 1, 2].every((o) => columns[x + o].length < size)) options.push({ vertical: false, x, h });
    }
  }
  if (!options.length) return null;
  const o = rng.pick(options);
  if (o.vertical) columns[o.x].splice(o.h, 0, kind, kind, kind);
  else for (let i = 0; i < 3; i++) columns[o.x + i].splice(o.h, 0, kind);
  return boardOf(columns, size);
}
/**
 * Drop in a long piece of one kind: a line of four or five, or (length 5, cross) a horizontal three and a vertical three
 * sharing one cell, which covers every L, T and plus shape.
 */
function insertLong(board, size, rng, length, cross) {
  const columns = columnsOf(board, size),
    kind = rng.int(0, 5);
  const options = [];
  for (let x = 0; x < size; x++) {
    if (!cross) {
      for (let h = 0; h <= columns[x].length && columns[x].length + length <= size; h++)
        options.push({ x, h, at: x, v: 0, up: length, wide: 1 });
      if (x <= size - length) {
        const low = Math.min(...columns.slice(x, x + length).map((c) => c.length));
        for (let h = 0; h <= low; h++)
          if (columns.slice(x, x + length).every((c) => c.length < size))
            options.push({ x, h, at: -1, v: 0, up: 1, wide: length });
      }
    } else if (x <= size - 3)
      for (let o = 0; o < 3; o++)
        for (let v = 0; v < 3; v++) {
          const stem = columns[x + o];
          for (let h = v; h <= size; h++) {
            const ok = [0, 1, 2].every((i) =>
              i === o
                ? h - v <= stem.length && stem.length + 3 <= size
                : h <= columns[x + i].length && columns[x + i].length < size,
            );
            if (ok) options.push({ x, h, at: x + o, v, up: 3, wide: 3 });
          }
        }
  }
  if (!options.length) return null;
  const o = rng.pick(options);
  for (let i = 0; i < o.wide; i++) {
    const c = o.x + i;
    if (c === o.at) columns[c].splice(o.h - o.v, 0, ...Array(o.up).fill(kind));
    else columns[c].splice(o.h, 0, kind);
  }
  return boardOf(columns, size);
}
/** Undo a swap: exchange two different occupied neighbours so that no line shows; swapping them back makes one. */
function unswap(board, size, rng) {
  const pairs = [];
  for (let a = 0; a < board.length; a++)
    for (const b of [a % size < size - 1 ? a + 1 : -1, a + size]) {
      if (b < 0 || b >= board.length || board[a] < 0 || board[b] < 0 || board[a] === board[b]) continue;
      const next = [...board];
      [next[a], next[b]] = [next[b], next[a]];
      if (!matches(next, size).length) pairs.push(next);
    }
  return pairs.length ? rng.pick(pairs) : null;
}
/** The six-by-six level is about planning across a wider tray, so every column starts with a gem in it. */
const spansWidth = (board, size) => columnsOf(board, size).every((col) => col.length > 0);
function candidate(plan, swaps, rng) {
  const lines = plan.gems / 3;
  const groups = Array(swaps).fill(1);
  for (let extra = lines - swaps; extra > 0; extra--) groups[rng.int(0, swaps - 1)]++;
  let board = Array(plan.size * plan.size).fill(-1);
  for (const count of groups) {
    for (let i = 0; i < count; i++) {
      board = insertLine(board, plan.size, rng);
      if (!board) return null;
    }
    board = unswap(board, plan.size, rng);
    if (!board) return null;
  }
  return board;
}

/** Level 6: one long piece (a line of four or five, a cross of five, or two lines of four) among lines of three. */
function candidateLong(plan, swaps, rng) {
  const long = rng.pick([[5], [5], [4, 4]]),
    cross = long.length === 1 && rng.chance(0.5);
  const threes = (plan.gems - long.reduce((a, b) => a + b, 0)) / 3;
  const groups = Array.from({ length: swaps }, () => ({ threes: 0, long: [] }));
  long.forEach((length) => groups[rng.int(0, swaps - 1)].long.push(length));
  groups.forEach((g) => {
    if (!g.long.length) g.threes = 1;
  });
  for (let extra = threes - groups.reduce((a, g) => a + g.threes, 0); extra > 0; extra--)
    groups[rng.int(0, swaps - 1)].threes++;
  if (groups.reduce((a, g) => a + g.threes, 0) !== threes) return null;
  let board = Array(plan.size * plan.size).fill(-1);
  for (const g of groups) {
    for (let i = 0; i < g.threes; i++) {
      board = insertLine(board, plan.size, rng);
      if (!board) return null;
    }
    for (const length of g.long) {
      board = insertLong(board, plan.size, rng, length, cross);
      if (!board) return null;
    }
    board = unswap(board, plan.size, rng);
    if (!board) return null;
  }
  return board;
}
/**
 * A swap does two lines' work when its first wave holds a run of four or more, or a horizontal and a vertical run crossing
 * at one gem (an L, T or plus). Two separate lines of three made at once do not count: the level is about the long line.
 */
function longSwap(board, size, pair) {
  const b = swap(board, size, pair).waves[0].board;
  const across = new Set(),
    down = new Set();
  for (const [d, into] of [
    [1, across],
    [size, down],
  ])
    for (let i = 0; i < b.length; i++) {
      if (b[i] < 0 || (d === 1 ? i % size > 0 && b[i - 1] === b[i] : i >= size && b[i - size] === b[i]))
        continue;
      const run = [i];
      while (true) {
        const n = run[run.length - 1] + d;
        if (n >= b.length || (d === 1 && n % size === 0) || b[n] !== b[i]) break;
        run.push(n);
      }
      if (run.length >= 4) return true;
      if (run.length === 3) run.forEach((c) => into.add(c));
    }
  return [...across].some((c) => down.has(c));
}
/** Every shortest route from `board` (with `left` swaps to go) uses a long swap somewhere. */
function everyRouteLong(board, size, left, d) {
  if (left === 0) return false;
  return moves(board, size).every((pair) => {
    const after = swap(board, size, pair).board;
    return d(after) !== left - 1 || longSwap(board, size, pair) || everyRouteLong(after, size, left - 1, d);
  });
}
function distances(size) {
  const dist = new Map();
  return (b) => {
    const key = b.join(',');
    if (!dist.has(key)) dist.set(key, par(b, size));
    return dist.get(key);
  };
}

const pools = PLANS.map((plan, index) => {
  // Levels 1–4 open with their hand-made originals; levels 5–6 are all generated. Levels 1–5's par is their number; level 6
  // alternates par 3 and par 4, ten of each.
  const level = index + 1;
  const kept = (level <= 4 ? POOLS[index] : []).slice(0, 3).map((t) => ({ par: t.par, board: [...t.board] }));
  const seen = new Set(kept.map((t) => canonical(t.board, plan.size)));
  const rng = new Rng(20261107 + level * 1009);
  for (let tries = 0; kept.length < PER_LEVEL && tries < 200000; tries++) {
    const target = level === 6 ? 3 + (kept.length % 2) : level;
    const board = level === 6 ? candidateLong(plan, target, rng) : candidate(plan, target, rng);
    if (!board) continue;
    const name = canonical(board, plan.size);
    if (seen.has(name) || matches(board, plan.size).length || fall(board, plan.size).join() !== board.join())
      continue;
    if (level === 5 && !spansWidth(board, plan.size)) continue;
    if (par(board, plan.size) !== target) continue;
    if (level === 6 ? !longOnly(board, plan.size, target) : !interesting(board, plan.size, target, level))
      continue;
    seen.add(name);
    kept.push({ par: target, board });
  }
  console.log(`level ${level}: ${kept.length}`);
  return kept;
});

const tray = (t, size) =>
  `    { par: ${t.par}, board: [\n${Array.from(
    { length: size },
    (_, y) => `      ${t.board.slice(y * size, y * size + size).join(', ')},`,
  ).join('\n')}\n    ] },`;
writeFileSync(
  new URL('../src/games/gem-swap/boards.ts', import.meta.url),
  `// Frozen puzzle pool, written by \`node scripts/gem-swap-trays.mjs\`: the first three trays of each level are the hand-made
// originals; the rest were built backwards and kept only when an exact breadth-first par matched the level's. Exact pars are
// checked again independently in logic.test.ts. -1 is an empty cell.
export const POOLS: readonly (readonly { board: readonly number[]; par: number }[])[] = [
${pools.map((pool, i) => `  [\n${pool.map((t) => tray(t, PLANS[i].size)).join('\n')}\n  ],`).join('\n')}
];
`,
);
