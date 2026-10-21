import type { Cell } from './logic';

/**
 * One layer of a heap from rows of `#`. Even layers sit on the 120-unit grid; odd layers are offset
 * half a pitch, so an upper piece rests on the corners of up to four below it.
 */
function layer(z: number, rows: string): Cell[] {
  const off = z % 2 ? 0.5 : 0;
  const out: Cell[] = [];
  rows.split('/').forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') out.push({ x: x + off, y: y + off, z }); }));
  return out;
}
const heap = (...layers: string[]): Cell[] => layers.flatMap((rows, z) => layer(z, rows));

/** Six flat pieces: two kinds at levels 1 and 3. */
const FLAT6 = [
  heap('###/###'),
  heap('##/##/##'),
  heap('####/.##.'),
  heap('.##./####'),
  heap('#.#.#/.#.#./..#..'),
  heap('##.##/..#../..#..'),
];

/** Six on the grass and three on top: levels 2 and 4. */
const PILE9 = [
  heap('####/.##.', '###'),
  heap('.##./####', '###'),
  heap('#.#.#/#.#.#', '#.##'),
  heap('#####/..#..', '#.##'),
  heap('..#../#####', '##.#'),
  heap('###/.../###', '##/.#'),
];

/** Twelve in two layers: level 5. */
const PILE12 = [
  heap('###/###/###', '##/#.'),
  heap('#####/#####', '#..#'),
  heap('####/#..#/####', '#.#'),
  heap('#####/.###./..#..', '#.#./.#..'),
  heap('..#../.###./#####', '..#./.#.#'),
  heap('####/####/.##.', '#.#'),
];

/** Fifteen in three layers: level 6. */
const PILE15 = [
  heap('####/####/####', '.#./.#.', '/..#'),
  heap('###./####/###.', '##/##', '/.#'),
  heap('#####/#####', '####', '/..#'),
  heap('.###./#####/.###.', '.##/.#.', '/..#'),
  heap('#####/..#../#####', '#..#/.#..', '#'),
  heap('####/####/####', '#.#', '#'),
];

/** Eighteen in three layers: level 7. */
const PILE18 = [
  heap('#####/#####/#####', '.#./.#.', '/.#'),
  heap('####/####/####', '###/#.#', '/.#'),
  heap('#####/.###./#####', '#..#/.##.', '/..#'),
  heap('.###./#####/#####', '.##./#..#', '/..#'),
  heap('#####/####./####.', '#.#/#.#', '/.#'),
  heap('#####/#####/#####', '#..#', '#'),
];

/** The big heap, fifteen, eight and one: level 8. */
const PILE24 = [
  heap('#####/#####/#####', '####/####', '/.#'),
  heap('#####/#####/#####', '####/####', '/..#'),
  heap('#####/#####/#####', '####/####', '/...#'),
  heap('#####/#####/#####', '####/####', '..#'),
  heap('#####/#####/#####', '####/####', '/./..#'),
  heap('#####/#####/#####', '####/####', '.#'),
];

/** Frozen shapes for each level, by level ID. */
export const SHAPES: Record<number, Cell[][]> = {
  1: FLAT6, 2: PILE9, 3: FLAT6, 4: PILE9, 5: PILE12, 6: PILE15, 7: PILE18, 8: PILE24,
};
