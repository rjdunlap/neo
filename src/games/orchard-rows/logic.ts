import type { Rng } from '../../engine/random';

export interface Orchard { rows: number; columns: number }
export type Mode = 'plant' | 'turn' | 'missing';
export const PLANS: readonly { name: string; mode: Mode; shapes: readonly Orchard[] }[] = [
  { name: 'Plant equal rows and count by rows', mode: 'plant', shapes: [{ rows: 2, columns: 3 }, { rows: 3, columns: 2 }, { rows: 3, columns: 3 }] },
  { name: 'Count by rows, then turn and count by columns', mode: 'turn', shapes: [{ rows: 2, columns: 4 }, { rows: 3, columns: 4 }, { rows: 2, columns: 5 }] },
  { name: 'Find the missing row, then count two ways', mode: 'missing', shapes: [{ rows: 3, columns: 5 }, { rows: 4, columns: 5 }, { rows: 5, columns: 4 }, { rows: 5, columns: 5 }] },
];
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const total = (o: Orchard) => o.rows * o.columns;
export const turn = (o: Orchard): Orchard => ({ rows: o.columns, columns: o.rows });
export const subtotals = (o: Orchard) => Array.from({ length: o.rows }, (_, i) => (i + 1) * o.columns);
export const missingTrees = (o: Orchard) => total(o) - (o.rows - 1) * o.columns;
export function makeOrchards(level: number, rng: Rng): Orchard[] {
  return rng.shuffle([...planFor(level).shapes]).slice(0, 2).map(o => ({ ...o }));
}
/** Adjacent totals make a one-off answer possible; missing-row decoys include the number of rows when distinct. */
export function choicesFor(answer: number, rng: Rng, rows?: number): number[] {
  const decoys = [rows, answer - 1, answer + 1].filter((n): n is number => n !== undefined && n > 0 && n !== answer);
  return rng.shuffle([answer, ...new Set(decoys)].slice(0, 3));
}
/** One group is counted once; replaying it never grows the total. */
export function countGroup(counted: readonly number[], row: number, orchard: Orchard): number[] {
  return row >= 0 && row < orchard.rows && !counted.includes(row) ? [...counted, row] : [...counted];
}
/** Fixed, unscaled 100-unit row controls, even for a five-by-five orchard. */
export function orchardLayout(w: number, h: number, o: Orchard) {
  const width = Math.min(560, w - 440);
  return { x: 170 + width / 2, y: Math.max(220, (h - o.rows * 100) / 2), width, rowHeight: 100 };
}
