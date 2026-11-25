import type { ClothCreation } from '../../content/creations';
import type { BandLevels } from '../../progress/difficulty';
export const COLS = 6,
  ROWS = 8;
export const PEDALS = [
  [true, false, true, false, true, false],
  [false, true, false, true, false, true],
] as const;
/** Level 5: each pedal lifts every third thread (threads 1+4, 2+5, 3+6). */
export const PEDALS5 = [
  [true, false, false, true, false, false],
  [false, true, false, false, true, false],
  [false, false, true, false, false, true],
] as const;
export type Pedal = number;
/** Levels 4–5 yarn ids: light (white) and dark (purple), at least 3:1 apart. */
export const LIGHT = 3,
  DARK = 0;
export const YARN4 = [LIGHT, DARK] as const;
export interface Sample {
  readonly id: string;
  readonly level: 4 | 5;
  readonly warp: readonly number[];
  /** Pedal index per row (into PEDALS at level 4, PEDALS5 at level 5). */
  readonly pedals: readonly number[];
  /** Weft yarn id per row. */
  readonly weft: readonly number[];
}
const ids = (s: string) => [...s].map((c) => (c === 'L' ? LIGHT : DARK));
const nums = (s: string) => [...s].map(Number);
export const SAMPLES: readonly Sample[] = [
  { id: '4a', level: 4, warp: ids('LLDDLL'), pedals: nums('01010101'), weft: ids('LLDDLLDD') },
  { id: '4b', level: 4, warp: ids('LDLDLD'), pedals: nums('01010101'), weft: ids('LLDDLLDD') },
  { id: '4c', level: 4, warp: ids('LLDDLL'), pedals: nums('10101010'), weft: ids('LLDDLLDD') },
  { id: '5a', level: 5, warp: ids('DDDDDD'), pedals: nums('01201201'), weft: ids('LLLLLLLL') },
  { id: '5b', level: 5, warp: ids('DDDDDD'), pedals: nums('21021021'), weft: ids('LLLLLLLL') },
  { id: '5c', level: 5, warp: ids('DDDDDD'), pedals: nums('01210121'), weft: ids('LLLLLLLL') },
];
// Level 5 pedals are numbered 0–2 for P1–P3: 5a climbs right (P1 P2 P3…), 5b left, 5c turns back.
export const samplesFor = (level: number) => SAMPLES.filter((s) => s.level === level);
export const pedalTable = (level: number): readonly Lift[] => (level === 5 ? PEDALS5 : PEDALS);
/** The sample's visible cells, row by row, from its authored plan. */
export function sampleRows(s: Sample): number[][] {
  const t = pedalTable(s.level);
  return s.pedals.map((p, i) => drawdown(s.warp, s.weft[i], t[p]));
}
export type Lift = readonly boolean[];
export type Rejection = 'malformed' | 'all-together' | 'repeat' | 'long-float';
export function rejection(history: readonly Lift[], row: unknown): Rejection | null {
  if (!Array.isArray(row) || row.length !== COLS || Array.from(row).some((v) => typeof v !== 'boolean'))
    return 'malformed';
  if (row.every(Boolean) || row.every((v) => !v)) return 'all-together';
  if (history.at(-1)?.every((v, i) => v === row[i])) return 'repeat';
  const run = (xs: readonly boolean[]) => {
    let n = 0,
      last: boolean | undefined;
    for (const v of xs) {
      n = v === last ? n + 1 : 1;
      last = v;
      if (n > 3) return true;
    }
    return false;
  };
  const all = [...history, row];
  if (all.some(run) || Array.from({ length: COLS }, (_, c) => all.map((r) => r[c])).some(run))
    return 'long-float';
  return null;
}
export const drawdown = (warp: readonly number[], weft: number, lift: Lift) =>
  lift.map((up, c) => (up ? warp[c] : weft));
/** Transactions snapshot selection. Only settle can change committed rows, yarn or direction. */
export class Round {
  readonly level: number;
  readonly sample: Sample | null;
  readonly target: number[][] | null;
  readonly lifts: boolean[][] = [];
  readonly yarns: number[] = [];
  readonly pedalIx: number[] = [];
  /** Misses per row index (levels 4–5), so two at one index earn that row's single hint. */
  readonly rowMisses: number[] = Array(ROWS).fill(0);
  private readonly hinted = new Set<number>();
  selected: Pedal | null = null;
  yarn = 0;
  misses = 0;
  hints = 0;
  failures = 0;
  helped = false;
  destroyed = false;
  pending: { pedal: Pedal; yarn: number; error: Rejection | null } | null = null;
  constructor(level: number, sampleIndex = 0) {
    this.level = Math.max(1, Math.min(5, Math.floor(level)));
    const pool = samplesFor(this.level);
    this.sample = pool.length ? pool[Math.abs(Math.floor(sampleIndex)) % pool.length] : null;
    this.target = this.sample ? sampleRows(this.sample) : null;
  }
  get warp(): readonly number[] {
    return this.sample?.warp ?? [3, 3, 3, 3, 3, 3];
  }
  get table() {
    return pedalTable(this.level);
  }
  /** The palette id of the yarn the shuttle carries now. */
  get yarnId() {
    return this.level === 4 ? YARN4[this.yarn] : this.level === 5 ? LIGHT : this.yarn;
  }
  get rows() {
    return this.lifts.length;
  }
  get full() {
    return this.rows === ROWS;
  }
  /** Earliest woven row that differs from the sample row at its index, or -1. */
  get firstDiff() {
    if (!this.target) return -1;
    return this.lifts.findIndex((_, i) => !this.rowMatches(i));
  }
  get finished() {
    return this.full && this.firstDiff < 0;
  }
  get busy() {
    return !!this.pending;
  }
  get next(): Pedal {
    return this.lifts.at(-1)?.[0] ? 1 : 0;
  }
  rowMatches(i: number) {
    const t = this.target?.[i];
    return !!t && drawdown(this.warp, this.yarns[i], this.lifts[i]).every((c, k) => c === t[k]);
  }
  /** Levels 4–5: what the sample asks for at the next row. */
  get plan() {
    const s = this.sample;
    if (!s || this.full) return null;
    return { pedal: s.pedals[this.rows], yarn: s.weft[this.rows] };
  }
  select(p: Pedal) {
    if (!this.busy && !this.full && !this.destroyed && Number.isInteger(p) && p >= 0 && p < this.table.length)
      this.selected = p;
  }
  choose(y: number) {
    const n = this.level === 2 ? 3 : this.level === 4 ? 2 : 0;
    if (n && !this.busy && !this.full && !this.destroyed && Number.isInteger(y) && y >= 0 && y < n)
      this.yarn = y;
  }
  begin() {
    if (this.busy || this.full || this.destroyed) return 'ignored';
    if (this.level >= 3 && this.selected === null) return 'choose';
    const pedal = this.level >= 3 ? this.selected! : this.next;
    this.pending = { pedal, yarn: this.yarnId, error: rejection(this.lifts, this.table[pedal]) };
    return this.pending.error ? 'slip' : 'throw';
  }
  /** What help glows: the undo button over a standing mismatch, else the control to change. */
  get glow(): 'undo' | 'pedal' | 'yarn' | null {
    if (this.level < 4 || !this.helped) return null;
    const p = this.plan;
    if (this.firstDiff >= 0) return 'undo';
    if (!p) return null;
    if (this.selected !== p.pedal) return 'pedal';
    return this.level === 4 && this.yarnId !== p.yarn ? 'yarn' : null;
  }
  help() {
    if (this.finished || this.destroyed) return false;
    if (this.level >= 4) {
      if (this.full && this.firstDiff < 0) return false;
      if (this.firstDiff >= 0) {
        this.helped = true; // pulses Undo, counts nothing
        return false;
      }
      this.helped = true;
      if (this.hinted.has(this.rows)) return false;
      this.hinted.add(this.rows);
      this.hints++;
      return true;
    }
    if (this.level !== 3 || this.helped) return false;
    this.helped = true;
    this.hints++;
    return true;
  }
  /** Removes the last woven row and restores its pedal, yarn and direction. Free at any depth. */
  undo() {
    if (this.level < 4 || this.busy || this.destroyed || !this.rows) return false;
    this.lifts.pop();
    const y = this.yarns.pop()!;
    this.selected = this.pedalIx.pop()!;
    if (this.level === 4) this.yarn = Math.max(0, YARN4.indexOf(y as 0 | 3));
    this.helped = false;
    if (this.rowMisses[this.rows] >= 2 && this.firstDiff < 0) this.help();
    return true;
  }
  settle() {
    const p = this.pending;
    if (!p || this.destroyed) return null;
    this.pending = null;
    this.selected = null;
    const idx = this.rows;
    if (p.error) {
      this.misses++;
      this.failures++;
      if (this.level >= 4) {
        this.rowMisses[idx]++;
        if (this.rowMisses[idx] >= 2 && this.firstDiff < 0) this.help();
      } else if (this.failures >= 2) this.help();
      return 'slip';
    }
    this.lifts.push([...this.table[p.pedal]]);
    this.yarns.push(p.yarn);
    this.pedalIx.push(p.pedal);
    this.failures = 0;
    this.helped = false;
    if (this.level >= 4 && !this.rowMatches(idx)) {
      this.misses++;
      this.rowMisses[idx]++;
      return 'differs';
    }
    return 'commit';
  }
  creation(): ClothCreation | null {
    return this.finished
      ? {
          kind: 'picture',
          medium: 'cloth',
          version: 1,
          cols: 6,
          rows: 8,
          cells: this.lifts.flatMap((r, i) => drawdown(this.warp, this.yarns[i], r)),
        }
      : null;
  }
  destroy() {
    this.destroyed = true;
    this.pending = null;
  }
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 5 },
};
