// Writes src/games/log-roll/floors.ts: Log Roll's frozen floors, four a level. The first floor of levels 1–3 is the
// hand-made original and keeps its place (level 4 has none); the rest are seeded random floors of the level's size and gap count with the
// hollow on an edge stone, kept only when the reverse breadth-first search finds at least three upright starts at the
// level's exact depth. A cradle level (5) places two neighbouring cradle stones `C` on an edge instead, side by side on
// even floors and one above the other on odd ones. Floors equal under mirroring count once. Reproducible:
//   node scripts/log-roll-floors.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import { FLOORS } from '../src/games/log-roll/floors.ts';
import { mirror, PLANS, startsAt, solutionStep, roll, footprint } from '../src/games/log-roll/logic.ts';

const PER_LEVEL = 4,
  SIZES = [
    [5, 5, 1],
    [6, 5, 2],
    [7, 5, 3],
    [8, 6, 7],
    [6, 5, 2],
  ],
  MIN_STARTS = 3;

const rng = new Rng(2026_11_07);
const out = PLANS.map((plan, level) => {
  if (level >= 5) {
    const special = new Rng(2026_11_08 + level),
      kept = [],
      seen = new Set();
    for (let tries = 0; kept.length < PER_LEVEL; tries++) {
      if (tries > 2000) throw new Error(`No special floors for ${level + 1}`);
      const cells =
        level === 5
          ? Array.from({ length: 5 }, () => Array(6).fill('.'))
          : ['... ...', '...B...', '...B...', '... ...', '... ...'].map((row) => [...row]);
      const gy = special.int(0, 4);
      cells[gy][cells[0].length - 1] = 'G';
      if (level === 5) {
        for (let m = 0; m < 3;) {
          const x = special.int(1, 4),
            y = special.int(0, 4);
          if (cells[y][x] === '.') {
            cells[y][x] = 'M';
            m++;
          }
        }
        for (let g = 0; g < 2;) {
          const x = special.int(1, 4),
            y = special.int(1, 3);
          if (cells[y][x] === '.') {
            cells[y][x] = ' ';
            g++;
          }
        }
      } else cells[special.int(0, 4)][special.int(0, 2)] = 'S';
      const floor = cells.map((row) => row.join('')),
        shape = floor.join('/');
      if (seen.has(shape)) continue;
      const starts = startsAt(floor, plan.depth);
      if (starts.length < MIN_STARTS) continue;
      if (
        level === 5 &&
        !starts.every((start) => {
          let state = start,
            crossed = false;
          while (true) {
            const hint = solutionStep(state, floor);
            if (!hint?.next) return crossed;
            state = roll(state, hint.next, floor);
            crossed ||= footprint(state).some(([x, y]) => floor[y][x] === 'M');
          }
        })
      )
        continue;
      seen.add(shape);
      seen.add(mirror(floor).join('/'));
      kept.push(floor);
    }
    return kept;
  }
  const { depth } = plan,
    cradle = 'cradle' in plan && plan.cradle;
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
    if (cradle) {
      const [dx, dy] = kept.length % 2 === 0 ? [1, 0] : [0, 1],
        pairs = edge.filter(([x, y]) => cells[y + dy]?.[x + dx] === '.');
      if (!pairs.length) continue;
      const [cx, cy] = rng.pick(pairs);
      cells[cy][cx] = cells[cy + dy][cx + dx] = 'C';
    } else {
      const [gx, gy] = rng.pick(edge);
      cells[gy][gx] = 'G';
    }
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
// '.' is a stone, 'G' the hollow (a stone the log must finish standing on), 'C' a cradle stone (the log finishes lying
// across both), 'M' soft moss, 'S' a standing switch, 'B' a bridge stone (only raised after a press), and ' ' water.
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
