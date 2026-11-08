// Writes src/games/gem-swap/boards.ts: Gem Swap's frozen trays, 20 a level. The first three of each level are the
// hand-made originals and keep their place; the rest are built backwards from an empty tray (drop in a line of three,
// then undo a swap that would make it) and kept only when an exact breadth-first search finds the level's par, the tray
// is settled with no starting line, and (levels 2–4) one accepted first swap is a dead end and some shortest route has a
// falling line. Trays equal under mirroring or recolouring count once. Reproducible:
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
        const out = swap(b, size, pair).board, key = out.join(',');
        if (!seen.has(key)) { seen.add(key); next.push(out); }
      }
    }
    frontier = next;
  }
  return null;
}
/** Planning matters above level 1 (whose six gems allow only a few dozen trays): a dead-end first swap and a falling line. */
function interesting(board, size, best, level) {
  const dist = new Map();
  const d = b => {
    const key = b.join(',');
    if (!dist.has(key)) dist.set(key, par(b, size));
    return dist.get(key);
  };
  const cascades = (b, left) => left > 0 && moves(b, size).some(pair => {
    const step = swap(b, size, pair);
    if (d(step.board) !== left - 1) return false;
    return step.waves.length > 1 || cascades(step.board, left - 1);
  });
  const deadEnd = moves(board, size).some(pair => d(swap(board, size, pair).board) === null);
  return level === 1 || (deadEnd && cascades(board, best));
}
/** One name for a tray and its mirror image under any recolouring. */
function canonical(board, size) {
  return [false, true].map(mirror => {
    const names = new Map();
    return board.map((_, i) => {
      const k = board[Math.floor(i / size) * size + (mirror ? size - 1 - i % size : i % size)];
      if (k < 0) return '.';
      if (!names.has(k)) names.set(k, names.size);
      return names.get(k);
    }).join('');
  }).sort()[0];
}
const columnsOf = (board, size) => Array.from({ length: size }, (_, x) =>
  Array.from({ length: size }, (_, y) => board[(size - 1 - y) * size + x]).filter(k => k >= 0)); // bottom first
const boardOf = (columns, size) => {
  const out = Array(size * size).fill(-1);
  columns.forEach((col, x) => col.forEach((k, h) => { out[(size - 1 - h) * size + x] = k; }));
  return out;
};
/** Drop a line of three into a settled tray, pushing the gems above it up. */
function insertLine(board, size, rng) {
  const columns = columnsOf(board, size), kind = rng.int(0, 5);
  const options = [];
  for (let x = 0; x < size; x++) {
    for (let h = 0; h <= columns[x].length && columns[x].length + 3 <= size; h++) options.push({ vertical: true, x, h });
    if (x <= size - 3) {
      const low = Math.min(columns[x].length, columns[x + 1].length, columns[x + 2].length);
      for (let h = 0; h <= low; h++) if ([0, 1, 2].every(o => columns[x + o].length < size)) options.push({ vertical: false, x, h });
    }
  }
  if (!options.length) return null;
  const o = rng.pick(options);
  if (o.vertical) columns[o.x].splice(o.h, 0, kind, kind, kind);
  else for (let i = 0; i < 3; i++) columns[o.x + i].splice(o.h, 0, kind);
  return boardOf(columns, size);
}
/** Undo a swap: exchange two different occupied neighbours so that no line shows; swapping them back makes one. */
function unswap(board, size, rng) {
  const pairs = [];
  for (let a = 0; a < board.length; a++) for (const b of [a % size < size - 1 ? a + 1 : -1, a + size]) {
    if (b < 0 || b >= board.length || board[a] < 0 || board[b] < 0 || board[a] === board[b]) continue;
    const next = [...board];
    [next[a], next[b]] = [next[b], next[a]];
    if (!matches(next, size).length) pairs.push(next);
  }
  return pairs.length ? rng.pick(pairs) : null;
}
function candidate(plan, swaps, rng) {
  const lines = plan.gems / 3;
  const groups = Array(swaps).fill(1);
  for (let extra = lines - swaps; extra > 0; extra--) groups[rng.int(0, swaps - 1)]++;
  let board = Array(plan.size * plan.size).fill(-1);
  for (const count of groups) {
    for (let i = 0; i < count; i++) { board = insertLine(board, plan.size, rng); if (!board) return null; }
    board = unswap(board, plan.size, rng); if (!board) return null;
  }
  return board;
}

const pools = PLANS.map((plan, index) => {
  const level = index + 1, target = POOLS[index][0].par;
  const kept = POOLS[index].slice(0, 3).map(t => ({ par: t.par, board: [...t.board] }));
  const seen = new Set(kept.map(t => canonical(t.board, plan.size)));
  const rng = new Rng(20261107 + level * 1009);
  for (let tries = 0; kept.length < PER_LEVEL && tries < 200000; tries++) {
    const board = candidate(plan, target, rng);
    if (!board) continue;
    const name = canonical(board, plan.size);
    if (seen.has(name) || matches(board, plan.size).length || fall(board, plan.size).join() !== board.join()) continue;
    if (par(board, plan.size) !== target || !interesting(board, plan.size, target, level)) continue;
    seen.add(name); kept.push({ par: target, board });
  }
  console.log(`level ${level}: ${kept.length}`);
  return kept;
});

const tray = (t, size) => `    { par: ${t.par}, board: [\n${Array.from({ length: size }, (_, y) =>
  `      ${t.board.slice(y * size, y * size + size).join(', ')},`).join('\n')}\n    ] },`;
writeFileSync(new URL('../src/games/gem-swap/boards.ts', import.meta.url), `// Frozen puzzle pool, written by \`node scripts/gem-swap-trays.mjs\`: the first three trays of each level are the hand-made
// originals; the rest were built backwards and kept only when an exact breadth-first par matched the level's. Exact pars are
// checked again independently in logic.test.ts. -1 is an empty cell.
export const POOLS: readonly (readonly { board: readonly number[]; par: number }[])[] = [
${pools.map((pool, i) => `  [\n${pool.map(t => tray(t, PLANS[i].size)).join('\n')}\n  ],`).join('\n')}
];
`);
