// Writes src/games/log-roll/floors.ts: Log Roll's frozen floors, four a level. The first floor of levels 1–3 is the
// hand-made original and keeps its place (level 4 has none); the rest are seeded random floors of the level's size and gap count with the
// hollow on an edge stone, kept only when the reverse breadth-first search finds at least three upright starts at the
// level's exact depth. Floors equal under mirroring count once. Reproducible:
//   node scripts/log-roll-floors.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import { FLOORS } from '../src/games/log-roll/floors.ts';
import { mirror, PLANS, startsAt } from '../src/games/log-roll/logic.ts';

const PER_LEVEL = 4,
  SIZES = [
    [5, 5, 1],
    [6, 5, 2],
    [7, 5, 3],
    [8, 6, 7],
  ],
  MIN_STARTS = 3;

const rng = new Rng(2026_11_07);
const out = PLANS.map(({ depth }, level) => {
  const [w, h, gaps] = SIZES[level],
    original = FLOORS[level]?.[0],
    kept = original ? [original] : [];
  const seen = new Set(original ? [original.join('/'), mirror(original).join('/')] : []);
  for (let tries = 0; kept.length < PER_LEVEL; tries++) {
    if (tries > 200_000) throw new Error(`Level ${level + 1}: only ${kept.length} floors`);
    const cells = Array.from({ length: h }, () => Array(w).fill('.'));
    for (let g = 0; g < gaps; g++) cells[rng.int(1, h - 2)][rng.int(1, w - 2)] = ' ';
    if (cells.flat().filter((v) => v === ' ').length !== gaps) continue;
    const edge = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && cells[y][x] === '.') edge.push([x, y]);
    const [gx, gy] = rng.pick(edge);
    cells[gy][gx] = 'G';
    const floor = cells.map((row) => row.join('')),
      shape = floor.join('/');
    if (seen.has(shape) || startsAt(floor, depth).length < MIN_STARTS) continue;
    seen.add(shape);
    seen.add(mirror(floor).join('/'));
    kept.push(floor);
  }
  return kept;
});
const body = out
  .map((pool) => `  [\n${pool.map((f) => `    [${f.map((r) => `'${r}'`).join(', ')}],`).join('\n')}\n  ],`)
  .join('\n');
writeFileSync(
  new URL('../src/games/log-roll/floors.ts', import.meta.url),
  `// Frozen floors, written by \`node scripts/log-roll-floors.mjs\`: the first floor of levels 1–3 is the hand-made original.
// '.' is a stone, 'G' the hollow (a stone the log must finish standing on) and ' ' open water.
export const FLOORS: readonly (readonly (readonly string[])[])[] = [
${body}
];
`,
);
console.log(
  out
    .map(
      (pool, i) => `level ${i + 1}: ${pool.map((f) => startsAt(f, PLANS[i].depth).length).join(', ')} starts`,
    )
    .join('\n'),
);
