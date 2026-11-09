import type { Cell } from './logic';

/**
 * One layer of a heap from rows of `#`. Even layers sit on the 120-unit grid; odd layers are offset
 * half a pitch, so an upper piece rests on the corners of up to four below it.
 */
function layer(z: number, rows: string): Cell[] {
  const off = z % 2 ? 0.5 : 0;
  const out: Cell[] = [];
  rows.split('/').forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '#') out.push({ x: x + off, y: y + off, z });
    }),
  );
  return out;
}
const heap = (...layers: string[]): Cell[] => layers.flatMap((rows, z) => layer(z, rows));

/** Six flat pieces, two kinds: level 1. */
const FLAT6 = [
  heap('###/###'),
  heap('##/##/##'),
  heap('####/.##.'),
  heap('.##./####'),
  heap('#.#.#/.#.#./..#..'),
  heap('##.##/..#../..#..'),
  heap('#####/..#..'),
  heap('#####/#'),
  heap('##/.##/..##'),
  heap('#..#/####'),
];

/** Six flat pieces in other shapes: level 3, so free play does not repeat level 1's heaps. */
const FLAT6B = [
  heap('#.#.#/#.#.#'),
  heap('.#.#./####'),
  heap('###/..###'),
  heap('#...#/.#.#./#...#'),
  heap('..#../.###./..#.#'),
  heap('####/#..#'),
  heap('.#.#./#.#.#/..#..'),
  heap('#/##/.###'),
  heap('...##/..##/.##'),
  heap('.##./#..#/.##.'),
];

/** Four on the grass and two on top: level 11, the little pile between 3 and 4. */
const PILE6 = [
  heap('####', '#.#'),
  heap('####', '##'),
  heap('###/#', '##'),
  heap('#.#/#.#', '##'),
  heap('##/##', '#/#'),
  heap('###/..#', '.##'),
  heap('.##/##.', '##'),
  heap('#../.##/..#', '#/.#'),
  heap('#.#./.#.#', '#.#'),
  heap('.#./###', '##'),
];

/** Six on the grass and three on top: level 2. */
const PILE9 = [
  heap('####/.##.', '###'),
  heap('.##./####', '###'),
  heap('#.#.#/#.#.#', '#.##'),
  heap('#####/..#..', '#.##'),
  heap('..#../#####', '##.#'),
  heap('###/.../###', '##/.#'),
  heap('#####/..#..', '.##/..#'),
  heap('#####/#', '###'),
  heap('###/###', '##/#'),
  heap('#..#/####', '#.##'),
];

/** Six on the grass and three on top, in other shapes: level 4. */
const PILE9B = [
  heap('#.#.#/#.#.#', '##/.#'),
  heap('.#.#./####', '###'),
  heap('###/..###', '.###'),
  heap('#...#/.#.#./#...#', '#..#/#'),
  heap('..#../.###./..#.#', '.##/.#'),
  heap('####/#..#', '#.#/..#'),
  heap('.#.#./#.#.#/..#..', '.##/..#'),
  heap('#/##/.###', '#/.##'),
  heap('...##/..##/.##', '..##/.#'),
  heap('.##./#..#/.##.', '#.#/.#'),
];

/** Twelve in two layers: level 5. */
const PILE12 = [
  heap('###/###/###', '##/#.'),
  heap('#####/#####', '#..#'),
  heap('####/#..#/####', '#.#'),
  heap('#####/.###./..#..', '#.#./.#..'),
  heap('..#../.###./#####', '..#./.#.#'),
  heap('####/####/.##.', '#.#'),
  heap('###/###/###', '#.#/.#.'),
  heap('#####/#####', '.##.'),
  heap('#.#.#/#####', '#..#/.##.'),
  heap('###../.###./..###', '.##/..#'),
];

/** Fifteen in three layers: level 6. */
const PILE15 = [
  heap('####/####/####', '.#./.#.', '/..#'),
  heap('###./####/###.', '##/##', '/.#'),
  heap('#####/#####', '####', '/..#'),
  heap('.###./#####/.###.', '.##/.#.', '/..#'),
  heap('#####/..#../#####', '#..#/.#..', '#'),
  heap('####/####/####', '#.#', '#'),
  heap('###/###/###', '##/##', '.#/.#'),
  heap('#####/#...#/#####', '#..#', '#'),
  heap('#####/.###./.###.', '.##/..#', '..#'),
  heap('####/####/###', '##/.#', '.#'),
];

/** Eighteen in three layers: level 7. */
const PILE18 = [
  heap('#####/#####/#####', '.#./.#.', '/.#'),
  heap('####/####/####', '###/#.#', '/.#'),
  heap('#####/.###./#####', '#..#/.##.', '/..#'),
  heap('.###./#####/#####', '.##./#..#', '/..#'),
  heap('#####/####./####.', '#.#/#.#', '/.#'),
  heap('#####/#####/#####', '#..#', '#'),
  heap('#####/#####/#####', '##', '.#'),
  heap('####/####/####', '###/##', '/.#'),
  heap('.###./#####/.###.', '####/.##.', '/.#'),
  heap('#####/#.#.#/#####', '#..#/#..#', '#'),
];

/** The big heap, twenty-four in three layers: level 8. */
const PILE24 = [
  heap('#####/#####/#####', '####/####', '/.#'),
  heap('#####/#####/#####', '####/####', '/..#'),
  heap('#####/#####/#####', '####/####', '/...#'),
  heap('#####/#####/#####', '####/####', '..#'),
  heap('#####/#####/#####', '####/####', '/./..#'),
  heap('#####/#####/#####', '####/####', '.#'),
  heap('#####/#####/#####', '####/###.', '/.#/..#'),
  heap('#####/#####/#####', '####/.##.', '.#.#/..#'),
  heap('#####/#####/#####', '###./####', '/.#.#'),
  heap('#####/#####/####.', '####/####', '/.#.#'),
];

/** Frozen shapes for each level, by level ID: ten a level. Level 9 is level 7's heap with a smaller tray; no other two share a pool. */
export const SHAPES: Record<number, Cell[][]> = {
  1: FLAT6,
  2: PILE9,
  3: FLAT6B,
  4: PILE9B,
  5: PILE12,
  6: PILE15,
  7: PILE18,
  8: PILE24,
  9: PILE18,
  11: PILE6,
};
