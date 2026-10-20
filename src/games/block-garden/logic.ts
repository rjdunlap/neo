import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Block Garden's rules. The bed is `n × n` squares stored as one bitmask per row (bit `c` is column `c`). A square is empty or
 * filled; a filled square is a stone (part of the starting bed) or planted (by her), and a stone may hold a sleeping bud. A piece
 * is a fixed set of squares that never turns. A placement fills empty squares; then every full row and full column empties at
 * once, and a bud in an emptied square blooms. Goal: every bud has bloomed, or (level 8) the bed is empty.
 */

/* ---------------------------------------------------------------------------------------------- */
/* Shapes                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export type Cell = readonly [number, number];

export interface Shape {
  /** Stable name, e.g. `T4-1`: the family and which of its orientations. */
  id: string;
  family: Family;
  /** Squares as [row, column], top-left at (0, 0). */
  cells: readonly Cell[];
  w: number;
  h: number;
  /** One bitmask per row of the shape, before shifting by the anchor's column. */
  rows: readonly number[];
}

export type Family = 'mono' | 'domino' | 'I3' | 'corner3' | 'square2' | 'I4' | 'L4' | 'J4' | 'T4' | 'S4' | 'Z4' | 'I5' | 'corner5' | 'square3';

const BASES: Record<Family, string[]> = {
  mono: ['#'],
  domino: ['##'],
  I3: ['###'],
  corner3: ['##', '#.'],
  square2: ['##', '##'],
  I4: ['####'],
  L4: ['#.', '#.', '##'],
  J4: ['.#', '.#', '##'],
  T4: ['###', '.#.'],
  S4: ['.##', '##.'],
  Z4: ['##.', '.##'],
  I5: ['#####'],
  corner5: ['###', '#..', '#..'],
  square3: ['###', '###', '###'],
};

/** Families whose turns are all their own shapes (L and J stay apart: each is the other's mirror). */
const TURNS_ONLY = new Set<Family>(['L4', 'J4', 'S4', 'Z4']);

function normalize(cells: Cell[]): Cell[] {
  const r0 = Math.min(...cells.map((c) => c[0])), c0 = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - r0, c - c0] as Cell).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

const cellKey = (cells: readonly Cell[]) => cells.map((c) => c.join(',')).join(';');

function makeShape(id: string, family: Family, cells: Cell[]): Shape {
  const h = Math.max(...cells.map((c) => c[0])) + 1, w = Math.max(...cells.map((c) => c[1])) + 1;
  const rows = Array.from({ length: h }, () => 0);
  for (const [r, c] of cells) rows[r] |= 1 << c;
  return { id, family, cells, w, h, rows };
}

function orientations(family: Family): Cell[][] {
  const base: Cell[] = [];
  BASES[family].forEach((line, r) => [...line].forEach((ch, c) => ch === '#' && base.push([r, c])));
  const out: Cell[][] = [];
  const seen = new Set<string>();
  const turn = (cs: Cell[]) => cs.map(([r, c]) => [c, -r] as Cell);
  const flip = (cs: Cell[]) => cs.map(([r, c]) => [r, -c] as Cell);
  let cur = base;
  for (const mirrored of TURNS_ONLY.has(family) ? [false] : [false, true]) {
    cur = mirrored ? flip(base) : base;
    for (let i = 0; i < 4; i++) {
      const n = normalize(cur);
      const k = cellKey(n);
      if (!seen.has(k)) { seen.add(k); out.push(n); }
      cur = turn(cur);
    }
  }
  return out;
}

/** Every shape, each orientation its own entry. The library is closed under left–right mirroring. */
export const SHAPES: Record<string, Shape> = {};
export const FAMILY_SHAPES: Record<Family, string[]> = {} as Record<Family, string[]>;
for (const family of Object.keys(BASES) as Family[]) {
  FAMILY_SHAPES[family] = orientations(family).map((cells, i) => {
    const id = `${family}-${i}`;
    SHAPES[id] = makeShape(id, family, cells);
    return id;
  });
}

const BY_CELLS = new Map(Object.values(SHAPES).map((s) => [cellKey(s.cells), s.id]));

/** The shape seen in a left–right mirror. */
export function mirrorShape(id: string): string {
  const s = SHAPES[id];
  const m = BY_CELLS.get(cellKey(normalize(s.cells.map(([r, c]) => [r, s.w - 1 - c] as Cell))));
  if (!m) throw new Error(`no mirror for ${id}`);
  return m;
}

export const BIG_FAMILIES: readonly Family[] = ['I5', 'corner5', 'square3'];

/* ---------------------------------------------------------------------------------------------- */
/* The bed                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export interface Bed {
  n: number;
  /** Filled squares (stones and planted), one mask per row. */
  filled: number[];
  /** Stones still in the bed. A subset of `filled`; the rest of `filled` is planted. */
  stones: number[];
  /** Sleeping buds. A subset of `stones`. */
  buds: number[];
}

export interface Anchor {
  r: number;
  c: number;
}

export interface Placement extends Anchor {
  /** Index into the garden's piece list. */
  piece: number;
}

export type Goal = 'buds' | 'clear';

export const fullMask = (n: number) => (1 << n) - 1;

export function popcount(x: number): number {
  let k = 0;
  while (x) { x &= x - 1; k++; }
  return k;
}

export function emptyBed(n: number): Bed {
  return { n, filled: Array(n).fill(0), stones: Array(n).fill(0), buds: Array(n).fill(0) };
}

export function cloneBed(b: Bed): Bed {
  return { n: b.n, filled: b.filled.slice(), stones: b.stones.slice(), buds: b.buds.slice() };
}

export const has = (rows: readonly number[], r: number, c: number) => ((rows[r] >> c) & 1) === 1;

export function fits(bed: Bed, shapeId: string, a: Anchor): boolean {
  const s = SHAPES[shapeId];
  if (a.r < 0 || a.c < 0 || a.r + s.h > bed.n || a.c + s.w > bed.n) return false;
  for (let i = 0; i < s.h; i++) if (bed.filled[a.r + i] & (s.rows[i] << a.c)) return false;
  return true;
}

export interface Placed {
  bed: Bed;
  /** Rows and columns that filled up and emptied, top to bottom and left to right. */
  rows: number[];
  cols: number[];
  /** Buds that bloomed, as [row, column]. */
  bloomed: Cell[];
}

/** The bed after a placement that fits: the piece is planted, then every full row and column empties at once. The old bed is untouched. */
export function place(bed: Bed, shapeId: string, a: Anchor): Placed {
  const s = SHAPES[shapeId];
  const n = bed.n, full = fullMask(n);
  const filled = bed.filled.slice();
  for (let i = 0; i < s.h; i++) filled[a.r + i] |= s.rows[i] << a.c;
  const rows: number[] = [];
  let colAnd = full;
  for (let r = 0; r < n; r++) {
    if (filled[r] === full) rows.push(r);
    colAnd &= filled[r];
  }
  const cols: number[] = [];
  for (let c = 0; c < n; c++) if ((colAnd >> c) & 1) cols.push(c);
  const colMask = colAnd;
  const bloomed: Cell[] = [];
  const clear = (r: number) => (rows.includes(r) ? full : colMask);
  const next: Bed = { n, filled, stones: bed.stones.slice(), buds: bed.buds.slice() };
  if (rows.length || cols.length) {
    for (let r = 0; r < n; r++) {
      const m = clear(r);
      if (!m) continue;
      for (let c = 0; c < n; c++) if ((m >> c) & 1 && (next.buds[r] >> c) & 1) bloomed.push([r, c]);
      next.filled[r] &= ~m;
      next.stones[r] &= ~m;
      next.buds[r] &= ~m;
    }
  }
  return { bed: next, rows, cols, bloomed };
}

export function goalMet(bed: Bed, goal: Goal): boolean {
  return (goal === 'clear' ? bed.filled : bed.buds).every((m) => m === 0);
}

/** Lines that are completely filled (a well-formed bed has none). */
export function fullLines(bed: Bed): number {
  const full = fullMask(bed.n);
  let k = 0, colAnd = full;
  for (const m of bed.filled) {
    if (m === full) k++;
    colAnd &= m;
  }
  return k + popcount(colAnd);
}

/** Every anchor where the shape fits. */
export function anchors(bed: Bed, shapeId: string): Anchor[] {
  const s = SHAPES[shapeId];
  const out: Anchor[] = [];
  for (let r = 0; r + s.h <= bed.n; r++) for (let c = 0; c + s.w <= bed.n; c++) if (fits(bed, shapeId, { r, c })) out.push({ r, c });
  return out;
}

/* ---------------------------------------------------------------------------------------------- */
/* Trays                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

/**
 * The pieces of a garden in arrival order, three to a tray. At levels 1–5 the whole set is one tray; at 6–8 the next three arrive
 * when the tray is empty. A state's `used` is a bitmask over this list.
 */
export interface Garden {
  n: number;
  goal: Goal;
  bed: Bed;
  pieces: string[];
  /** Pieces per tray: all of them at levels 1–5, three at 6–8. */
  traySize: number;
  /** A shortest solution from the starting bed (the solver's), which the hint reads while she follows it. */
  solution: Placement[];
}

/** The pieces she can take now: the unused ones of the first tray that still has any. */
export function trayNow(g: Pick<Garden, 'pieces' | 'traySize'>, used: number): number[] {
  for (let start = 0; start < g.pieces.length; start += g.traySize) {
    const idx = [];
    for (let i = start; i < Math.min(g.pieces.length, start + g.traySize); i++) if (!((used >> i) & 1)) idx.push(i);
    if (idx.length) return idx;
  }
  return [];
}

/** Which tray (0, 1, 2) is in front of her. */
export function trayIndex(g: Pick<Garden, 'pieces' | 'traySize'>, used: number): number {
  const now = trayNow(g, used);
  return now.length ? Math.floor(now[0] / g.traySize) : Math.ceil(g.pieces.length / g.traySize);
}

/* ---------------------------------------------------------------------------------------------- */
/* Solving                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export interface State {
  bed: Bed;
  used: number;
}

/** States a search may generate (each placement tried counts), about a quarter of a second at worst on a laptop at level 8. */
export const SEARCH_CAP = 30_000;

/**
 * The fewest squares still to plant: every target square (a bud, or at level 8 every filled square) needs its row or its column
 * to fill up, and every empty square of a line has to be planted at least once before it can. Exact over which of each target's
 * two lines is chosen; a lower bound because clears can empty squares that then need planting again.
 */
export function squaresNeeded(bed: Bed, goal: Goal): number {
  const targets = goal === 'clear' ? bed.filled : bed.buds;
  const n = bed.n, full = fullMask(n);
  let rowsWith = 0, colsWith = 0;
  for (let r = 0; r < n; r++) if (targets[r]) { rowsWith |= 1 << r; colsWith |= targets[r]; }
  if (!rowsWith) return 0;
  // Enumerate which lines of the shorter side are chosen; every target off them needs its line on the other side.
  const byRows = popcount(rowsWith) <= popcount(colsWith);
  const lines: number[] = [];
  for (let i = 0; i < n; i++) if (((byRows ? rowsWith : colsWith) >> i) & 1) lines.push(i);
  const empty = bed.filled.map((m) => ~m & full);
  let best = Infinity;
  for (let s = 0; s < 1 << lines.length; s++) {
    let rowSel = 0, colSel = 0;
    if (byRows) {
      lines.forEach((r, i) => { if ((s >> i) & 1) rowSel |= 1 << r; else colSel |= targets[r]; });
    } else {
      lines.forEach((c, i) => { if ((s >> i) & 1) colSel |= 1 << c; });
      // A target in an unchosen column needs its row.
      for (let r = 0; r < n; r++) if (targets[r] & ~colSel) rowSel |= 1 << r;
    }
    let cells = 0;
    for (let r = 0; r < n && cells < best; r++) cells += popcount(empty[r] & ((rowSel >> r) & 1 ? full : colSel));
    if (cells < best) best = cells;
  }
  return best;
}

/**
 * At least this many more placements: the fewest pieces whose squares cover `squaresNeeded`, taking the largest first but never
 * reaching into a tray before the one in front of her is used up. Infinity when even all of them cannot.
 */
export function placementsNeeded(g: Pick<Garden, 'pieces' | 'goal' | 'traySize'>, s: State): number {
  const need = squaresNeeded(s.bed, g.goal);
  if (!need) return 0;
  let sum = 0, k = 0;
  for (let start = 0; start < g.pieces.length; start += g.traySize) {
    const sizes: number[] = [];
    for (let i = start; i < Math.min(g.pieces.length, start + g.traySize); i++) if (!((s.used >> i) & 1)) sizes.push(SHAPES[g.pieces[i]].cells.length);
    sizes.sort((a, b) => b - a);
    for (const size of sizes) {
      sum += size;
      k++;
      if (sum >= need) return k;
    }
  }
  return Infinity;
}

const stateKey = (s: State) => s.bed.filled.join(',') + '|' + s.bed.buds.join(',') + '|' + s.used;

/** Every placement she could make now, one per distinct shape in the tray. */
export function placements(g: Pick<Garden, 'pieces' | 'traySize'>, s: State): Placement[] {
  const out: Placement[] = [];
  const seen = new Set<string>();
  for (const i of trayNow(g, s.used)) {
    const id = g.pieces[i];
    if (seen.has(id)) continue;
    seen.add(id);
    for (const a of anchors(s.bed, id)) out.push({ piece: i, ...a });
  }
  return out;
}

export function apply(g: Pick<Garden, 'pieces'>, s: State, p: Placement): State {
  return { bed: place(s.bed, g.pieces[p.piece], p).bed, used: s.used | (1 << p.piece) };
}

export type SearchResult = Placement[] | 'none' | 'capped';

/**
 * A shortest list of placements from `s` to the goal (iterative deepening on `placementsNeeded`, with a table of states already
 * shown to need more than the current depth). 'none' when no list exists; 'capped' past `cap` states generated, which bounds its time.
 */
export function search(g: Garden, s: State, cap = SEARCH_CAP): SearchResult {
  if (goalMet(s.bed, g.goal)) return [];
  const total = g.pieces.length - popcount(s.used);
  let visits = 0;
  // A state's key → the most placements it is known not to finish within.
  const fails = new Map<string, number>();
  const path: Placement[] = [];
  const dfs = (st: State, left: number): boolean | 'capped' => {
    if (goalMet(st.bed, g.goal)) return true;
    if (left <= 0) return false;
    if (placementsNeeded(g, st) > left) return false;
    const key = stateKey(st);
    if ((fails.get(key) ?? -1) >= left) return false;
    const next = placements(g, st);
    visits += next.length;
    if (visits > cap) return 'capped';
    for (const p of next) {
      path.push(p);
      const r = dfs(apply(g, st, p), left - 1);
      if (r) return r;
      path.pop();
    }
    fails.set(key, left);
    return false;
  };
  const start = placementsNeeded(g, s);
  if (start === Infinity) return 'none';
  for (let depth = Math.max(1, start); depth <= total; depth++) {
    const r = dfs(s, depth);
    if (r === 'capped') return 'capped';
    if (r) return path.slice();
  }
  return 'none';
}

export function solve(g: Garden, s: State, cap = SEARCH_CAP): Placement[] | null {
  const r = search(g, s, cap);
  return Array.isArray(r) ? r : null;
}

/** Every shortest solution of length `par` from `s` (for the plan filters; capped). */
export function allShortest(g: Garden, s: State, par: number, limit = 2000): Placement[][] {
  const out: Placement[][] = [];
  const path: Placement[] = [];
  const dfs = (st: State, left: number) => {
    if (out.length >= limit) return;
    if (goalMet(st.bed, g.goal)) {
      if (left === 0) out.push(path.slice());
      return;
    }
    if (left <= 0 || placementsNeeded(g, st) > left) return;
    for (const p of placements(g, st)) {
      path.push(p);
      dfs(apply(g, st, p), left - 1);
      path.pop();
    }
  };
  dfs(s, par);
  return out;
}

export const startState = (g: Garden): State => ({ bed: cloneBed(g.bed), used: 0 });

/**
 * Help from where she is. `plan`: the placement that starts a shortest solution from here. 'stuck': no tray piece fits, the pieces
 * are used up, or the search proved there is no way left (take one back). 'back': the search ran out of room, so step back to her
 * most recent state with a known way (`history` is her states before this one, oldest first; the start at worst).
 */
export type Hint = { kind: 'plan'; placement: Placement } | { kind: 'stuck' } | { kind: 'back'; steps: number };

export function hintPlacement(g: Garden, s: State, history: State[], cap = SEARCH_CAP): Hint {
  if (!placements(g, s).length) return { kind: 'stuck' };
  // While she has followed the stored solution, it is still a shortest way.
  const onPlan = followed(g, history.length ? [...history.slice(1), s] : [], s);
  if (onPlan !== null && onPlan < g.solution.length) return { kind: 'plan', placement: g.solution[onPlan] };
  const r = search(g, s, cap);
  if (Array.isArray(r)) return r.length ? { kind: 'plan', placement: r[0] } : { kind: 'stuck' };
  if (r === 'none') return { kind: 'stuck' };
  // Her most recent state on the stored solution has a known way; the start at worst.
  for (let i = history.length - 1; i > 0; i--) if (followed(g, history.slice(1, i + 1), history[i]) !== null) return { kind: 'back', steps: history.length - i };
  return { kind: 'back', steps: history.length };
}

/** How many steps of the stored solution she has taken, if every state so far matches it; else null. */
function followed(g: Garden, after: State[], now: State): number | null {
  let st = startState(g);
  const k = after.length;
  if (k > g.solution.length) return null;
  for (let i = 0; i < k; i++) {
    st = apply(g, st, g.solution[i]);
    if (stateKey(st) !== stateKey(after[i])) return null;
  }
  return stateKey(st) === stateKey(now) ? k : null;
}

/** True when no tray piece fits anywhere and the goal is not met. */
export function noRoom(g: Garden, s: State): boolean {
  return !goalMet(s.bed, g.goal) && !placements(g, s).length;
}

/* ---------------------------------------------------------------------------------------------- */
/* Levels                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export interface GardenPlan {
  id: number;
  name: string;
  n: number;
  /** Square size in logical units. */
  cell: number;
  goal: Goal;
  /** Pieces in the garden; trays of `traySize`. */
  pieces: number;
  traySize: number;
  /** Buds per garden, inclusive (0 at level 8). */
  buds: [number, number];
  /** The solver's fewest placements, inclusive. Never shown to her. */
  par: [number, number];
  gardens: number;
  /** Rows and columns holding a sleeping bud are striped. */
  tinted: boolean;
  /** A refused drop counts as a miss. */
  refusalCounts: boolean;
  /** Shape families the generator draws from. */
  families: Family[];
  /** Starting stones, inclusive (level 8). */
  stones?: [number, number];
}

const SMALL: Family[] = ['domino', 'I3', 'corner3', 'square2'];
const MID: Family[] = ['domino', 'I3', 'corner3', 'square2', 'I4', 'L4', 'J4', 'T4'];
const BIG: Family[] = ['I3', 'corner3', 'square2', 'I4', 'L4', 'J4', 'T4', 'S4', 'Z4', 'I5', 'corner5', 'square3'];

export const PLANS: GardenPlan[] = [
  { id: 1, name: 'Finish one row', n: 5, cell: 100, goal: 'buds', pieces: 2, traySize: 2, buds: [1, 2], par: [1, 1], gardens: 2, tinted: true, refusalCounts: false, families: ['domino', 'I3'] },
  { id: 2, name: 'Rows and columns', n: 5, cell: 100, goal: 'buds', pieces: 3, traySize: 3, buds: [2, 2], par: [2, 2], gardens: 2, tinted: true, refusalCounts: false, families: ['domino', 'I3', 'square2'] },
  { id: 3, name: 'Two lines with one piece', n: 6, cell: 100, goal: 'buds', pieces: 3, traySize: 3, buds: [2, 3], par: [2, 3], gardens: 2, tinted: false, refusalCounts: true, families: ['corner3', 'domino', 'I3'] },
  { id: 4, name: 'Pick the right pieces', n: 6, cell: 100, goal: 'buds', pieces: 3, traySize: 3, buds: [2, 3], par: [2, 2], gardens: 2, tinted: false, refusalCounts: true, families: SMALL },
  { id: 5, name: 'Make room first', n: 6, cell: 100, goal: 'buds', pieces: 3, traySize: 3, buds: [3, 3], par: [3, 3], gardens: 2, tinted: false, refusalCounts: true, families: MID },
  { id: 6, name: 'Two trays', n: 6, cell: 100, goal: 'buds', pieces: 6, traySize: 3, buds: [3, 4], par: [4, 6], gardens: 1, tinted: false, refusalCounts: true, families: MID },
  { id: 7, name: 'The big garden', n: 8, cell: 72, goal: 'buds', pieces: 9, traySize: 3, buds: [4, 6], par: [7, 9], gardens: 1, tinted: false, refusalCounts: true, families: BIG },
  { id: 8, name: 'Clear the whole garden', n: 8, cell: 72, goal: 'clear', pieces: 9, traySize: 3, buds: [0, 0], par: [6, 9], gardens: 1, tinted: false, refusalCounts: true, families: BIG, stones: [8, 16] },
];

export function planFor(level: number): GardenPlan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
}

/* ---------------------------------------------------------------------------------------------- */
/* Writing gardens down                                                                            */
/* ---------------------------------------------------------------------------------------------- */

/**
 * A garden as text: the bed one row per `/` (`.` empty, `o` stone, `*` stone with a bud), then `:` and the pieces in arrival
 * order, then `:` and the stored solution as `piece@row,col` steps. `"..o../..*../...:domino-0,I3-0:0@1,2"`.
 */
export function encode(g: Garden): string {
  const rows = [];
  for (let r = 0; r < g.n; r++) {
    let s = '';
    for (let c = 0; c < g.n; c++) s += has(g.bed.buds, r, c) ? '*' : has(g.bed.filled, r, c) ? 'o' : '.';
    rows.push(s);
  }
  return `${rows.join('/')}:${g.pieces.join(',')}:${g.solution.map((p) => `${p.piece}@${p.r},${p.c}`).join(' ')}`;
}

export function decode(text: string, plan: Pick<GardenPlan, 'goal' | 'traySize'>): Garden {
  const [bedText, piecesText, solText] = text.split(':');
  const lines = bedText.split('/');
  const n = lines.length;
  const bed = emptyBed(n);
  lines.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch === '.') return;
    bed.filled[r] |= 1 << c;
    bed.stones[r] |= 1 << c;
    if (ch === '*') bed.buds[r] |= 1 << c;
  }));
  const pieces = piecesText.split(',');
  const solution = (solText ?? '').trim() ? solText.trim().split(' ').map((step) => {
    const [p, at] = step.split('@');
    const [r, c] = at.split(',').map(Number);
    return { piece: Number(p), r, c };
  }) : [];
  return { n, goal: plan.goal, bed, pieces, traySize: Math.min(plan.traySize, pieces.length), solution };
}

function pieceMask(n: number, shape: string, at: Anchor): number[] {
  const s = SHAPES[shape];
  const m = Array(n).fill(0);
  for (let i = 0; i < s.h; i++) m[at.r + i] |= s.rows[i] << at.c;
  return m;
}

/** The garden under one of the square's eight symmetries (bit 1 mirrors left–right, bit 2 top–bottom, bit 4 swaps rows and columns). */
export function transformGarden(g: Garden, t: number): Garden {
  const n = g.n;
  const map = ([r, c]: Cell): Cell => {
    let rr = r, cc = c;
    if (t & 4) [rr, cc] = [cc, rr];
    if (t & 1) cc = n - 1 - cc;
    if (t & 2) rr = n - 1 - rr;
    return [rr, cc];
  };
  const mapRows = (rows: number[]) => {
    const out = Array(n).fill(0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (has(rows, r, c)) { const [a, b] = map([r, c]); out[a] |= 1 << b; }
    return out;
  };
  const mapShape = (id: string) => {
    const m = BY_CELLS.get(cellKey(normalize(SHAPES[id].cells.map((x) => map(x)))));
    if (!m) throw new Error(`no transform of ${id}`);
    return m;
  };
  const pieces = g.pieces.map(mapShape);
  const solution = g.solution.map((p) => {
    const cells = SHAPES[g.pieces[p.piece]].cells.map(([r, c]) => map([r + p.r, c + p.c]));
    return { piece: p.piece, r: Math.min(...cells.map((x) => x[0])), c: Math.min(...cells.map((x) => x[1])) };
  });
  return { ...g, bed: { n, filled: mapRows(g.bed.filled), stones: mapRows(g.bed.stones), buds: mapRows(g.bed.buds) }, pieces, solution };
}

/** The same garden seen in a left–right mirror: each piece becomes its mirror shape. A mirror keeps par. */
export const mirrorGarden = (g: Garden) => transformGarden(g, 1);

/* ---------------------------------------------------------------------------------------------- */
/* Building gardens                                                                                */
/* ---------------------------------------------------------------------------------------------- */

/** A garden under construction: stones, buds and the pieces of its planned solution, in planting order. */
interface Draft {
  n: number;
  stones: number[];
  buds: number[];
  plan: { shape: string; r: number; c: number }[];
  extras: string[];
}

const draft = (n: number): Draft => ({ n, stones: Array(n).fill(0), buds: Array(n).fill(0), plan: [], extras: [] });

const setCell = (rows: number[], r: number, c: number) => { rows[r] |= 1 << c; };

/** Stones on every square of `rows` except the planned pieces' squares. */
function stoneRows(d: Draft, rows: number[]) {
  const holes = Array(d.n).fill(0);
  for (const p of d.plan) { const m = pieceMask(d.n, p.shape, p); for (let r = 0; r < d.n; r++) holes[r] |= m[r]; }
  for (const r of rows) d.stones[r] |= fullMask(d.n) & ~holes[r];
}

/** A random stone in row r (or column c) that is not a crossing of other lines, as a bud. */
function budIn(d: Draft, rng: Rng, line: { r?: number; c?: number }, avoid: Cell[] = []): boolean {
  const cells: Cell[] = [];
  for (let i = 0; i < d.n; i++) {
    const [r, c] = line.r !== undefined ? [line.r, i] : [i, line.c!];
    if (has(d.stones, r, c) && !has(d.buds, r, c) && !avoid.some((a) => a[0] === r && a[1] === c)) cells.push([r, c]);
  }
  if (!cells.length) return false;
  const [r, c] = rng.pick(cells);
  setCell(d.buds, r, c);
  return true;
}

/** Scattered stones in the given rows, never filling a row or column. */
function clutter(d: Draft, rng: Rng, rows: number[], density: number) {
  for (const r of rows) for (let c = 0; c < d.n; c++) if (rng.chance(density)) setCell(d.stones, r, c);
  const full = fullMask(d.n);
  for (let guard = 0; guard < 50; guard++) {
    const bed = { n: d.n, filled: d.stones, stones: d.stones, buds: d.buds };
    if (!fullLines(bed)) break;
    // Open a square of a clutter row in a full row or column.
    const r = rng.pick(rows);
    if (d.stones[r] === full || d.stones.reduce((a, m) => a & m, full)) d.stones[r] &= ~(1 << rng.int(0, d.n - 1));
    else d.stones[rng.pick(rows)] &= ~(1 << rng.int(0, d.n - 1));
  }
}

function toGarden(d: Draft, plan: GardenPlan, order: 'shuffle' | 'trays' | 'planned-first', rng: Rng, needLast = false): Garden {
  // The planned pieces and the extras, in tray order; one planned piece goes in the last tray when asked.
  const planned = d.plan.map((p, i) => ({ shape: p.shape, step: i }));
  const extras = d.extras.map((shape) => ({ shape, step: -1 }));
  let list = [...planned, ...extras];
  if (order === 'shuffle') list = rng.shuffle(list);
  else if (order === 'planned-first') list = [...rng.shuffle(planned), ...extras];
  else {
    const lastStart = Math.floor((plan.pieces - 1) / plan.traySize) * plan.traySize;
    list = rng.shuffle(list);
    if (needLast && !list.slice(lastStart).some((x) => x.step >= 0)) {
      const j = list.findIndex((x) => x.step >= 0);
      const k = rng.int(lastStart, list.length - 1);
      [list[j], list[k]] = [list[k], list[j]];
    }
  }
  const bed = emptyBed(d.n);
  bed.filled = d.stones.slice();
  bed.stones = d.stones.slice();
  bed.buds = d.buds.map((m, r) => m & d.stones[r]);
  return { n: d.n, goal: plan.goal, bed, pieces: list.map((x) => x.shape), traySize: Math.min(plan.traySize, list.length), solution: [] };
}

/** Level 1: one row nearly full of stones, its gap the shape of a straight piece; a second piece that may also fit. */
function lineGarden(plan: GardenPlan, rng: Rng): Draft {
  const d = draft(plan.n);
  const len = rng.int(2, 3);
  const r = rng.int(0, d.n - 1), c = rng.int(0, d.n - len);
  d.plan.push({ shape: len === 2 ? 'domino-0' : 'I3-0', r, c });
  stoneRows(d, [r]);
  const buds = rng.int(plan.buds[0], plan.buds[1]);
  for (let i = 0; i < buds; i++) budIn(d, rng, { r });
  d.extras.push(rng.pick(['square2-0', 'mono-0', len === 2 ? 'I3-0' : 'domino-0', 'corner3-' + rng.int(0, 3)]));
  clutter(d, rng, Array.from({ length: d.n }, (_, i) => i).filter((i) => i !== r), rng.chance(0.5) ? 0.1 : 0);
  return d;
}

/**
 * Level 2: a row and a column that cross, each one straight piece short; the crossing square is in both gaps, so whichever line
 * blooms first, the other needs its crossing square planted again. Two placements, a row and a column.
 */
function crossGarden(plan: GardenPlan, rng: Rng): Draft {
  const d = draft(plan.n);
  const n = d.n;
  const R = rng.int(1, n - 2), C = rng.int(1, n - 2);
  const dr = rng.chance(0.5) ? 1 : -1, dc = rng.chance(0.5) ? 1 : -1;
  // Row R misses the crossing and (R, C + dc); column C misses the crossing and (R + dr, C).
  const full = fullMask(n);
  d.stones[R] = full & ~(1 << C) & ~(1 << (C + dc));
  for (let r = 0; r < n; r++) if (r !== R && r !== R + dr) d.stones[r] |= 1 << C;
  d.plan.push({ shape: 'domino-0', r: R, c: Math.min(C, C + dc) }, { shape: 'domino-1', r: Math.min(R, R + dr), c: C });
  budIn(d, rng, { r: R }, [[R, C]]);
  budIn(d, rng, { c: C }, [[R, C]]);
  d.extras.push(rng.pick(['mono-0', 'I3-0', 'I3-1', 'square2-0']));
  clutter(d, rng, Array.from({ length: n }, (_, i) => i).filter((i) => i !== R), 0.12);
  return d;
}

/**
 * Level 3: a corner-shaped gap where a row and a column cross, so the corner tromino blooms both at once. Sometimes a third row
 * crosses the column on a stone and is one square short beside it: it can only bloom after the column empties that stone.
 */
function cornerGarden(plan: GardenPlan, rng: Rng): Draft {
  const d = draft(plan.n);
  const n = d.n;
  const R = rng.int(1, n - 2), C = rng.int(1, n - 2);
  const dr = rng.chance(0.5) ? 1 : -1, dc = rng.chance(0.5) ? 1 : -1;
  const cells: Cell[] = [[R, C], [R + dr, C], [R, C + dc]];
  const shape = BY_CELLS.get(cellKey(normalize(cells)))!;
  d.plan.push({ shape, r: Math.min(R, R + dr), c: Math.min(C, C + dc) });
  const full = fullMask(n);
  d.stones[R] = full & ~(1 << C) & ~(1 << (C + dc));
  for (let r = 0; r < n; r++) if (r !== R && r !== R + dr) d.stones[r] |= 1 << C;
  budIn(d, rng, { r: R }, [[R, C]]);
  budIn(d, rng, { c: C }, [[R, C]]);
  const third = rng.chance(0.6);
  let R2 = -1;
  if (third) {
    const options = Array.from({ length: n }, (_, i) => i).filter((r) => Math.abs(r - R) > 1 && r !== R + dr);
    R2 = rng.pick(options);
    const side = C - dc >= 0 && C - dc < n ? -dc : dc;
    // Row R2 is full but for the square beside the column; the column's stone at (R2, C) has to empty first.
    d.stones[R2] = full & ~(1 << (C + side));
    d.plan.push({ shape: 'domino-0', r: R2, c: Math.min(C, C + side) });
    budIn(d, rng, { r: R2 }, [[R2, C]]);
  }
  d.extras.push(rng.pick(third ? ['I3-0', 'I3-1', 'mono-0', 'square2-0'] : ['domino-0', 'domino-1', 'I3-0', 'I3-1']));
  if (!third) d.extras.push(rng.pick(['domino-0', 'domino-1', 'I3-0', 'I3-1', 'square2-0']));
  clutter(d, rng, Array.from({ length: n }, (_, i) => i).filter((i) => i !== R && i !== R2), 0.15);
  return d;
}

/** Plants pieces of the plan's families inside a block of rows without overlapping; every row of the block gets a square. */
function tileBlock(d: Draft, rng: Rng, top: number, m: number, shapes: string[]): boolean {
  const taken = Array(d.n).fill(0);
  // Largest first, each at a random spot among every spot where it still fits.
  for (const shape of [...shapes].sort((a, b) => SHAPES[b].cells.length - SHAPES[a].cells.length)) {
    const s = SHAPES[shape];
    if (s.h > m) return false;
    const spots: Anchor[] = [];
    for (let r = top; r <= top + m - s.h; r++) for (let c = 0; c <= d.n - s.w; c++) {
      if (!pieceMask(d.n, shape, { r, c }).some((x, i) => x & taken[i])) spots.push({ r, c });
    }
    if (!spots.length) return false;
    const at = rng.pick(spots);
    pieceMask(d.n, shape, at).forEach((x, i) => (taken[i] |= x));
    d.plan.push({ shape, ...at });
  }
  for (let r = top; r < top + m; r++) if (!taken[r]) return false;
  stoneRows(d, Array.from({ length: m }, (_, i) => top + i));
  return true;
}

function familyShapes(families: readonly Family[], maxH: number): string[] {
  return families.flatMap((f) => FAMILY_SHAPES[f]).filter((id) => SHAPES[id].h <= maxH);
}

/**
 * Levels 4 and 6–8: a block of rows full of stones but for the planned pieces' squares, buds in every row of the block, scattered
 * stones elsewhere and extra pieces (a decoy at 4; at 6–7 pieces that have to be planted somewhere harmless before the next tray).
 */
function blockGarden(plan: GardenPlan, rng: Rng): Draft | null {
  const d = draft(plan.n);
  const n = d.n;
  const spec =
    plan.id === 4 ? { m: 2, k: 2, density: 0.15 } :
    plan.id === 6 ? { m: rng.int(2, 3), k: rng.int(2, 3), density: 0.2 } :
    plan.id === 7 ? { m: rng.int(3, 4), k: rng.int(3, 5), density: 0.2 } :
    { m: 4, k: rng.int(6, 7), density: 0 };
  const top = rng.int(0, n - spec.m);
  // Level 8 plants pieces of three to five squares, so a third to a half of the block stays stone.
  const pool = familyShapes(plan.families, spec.m).filter((id) => plan.goal !== 'clear' || SHAPES[id].cells.length <= 5);
  let shapes = Array.from({ length: spec.k }, () => rng.pick(pool));
  if (plan.stones) {
    // Leave between plan.stones[0] and plan.stones[1] stones in the block.
    const room = spec.m * n;
    for (let t = 0; t < 40; t++) {
      const cells = shapes.reduce((a, id) => a + SHAPES[id].cells.length, 0);
      if (room - cells >= plan.stones[0] && room - cells <= plan.stones[1]) break;
      shapes = Array.from({ length: spec.k }, () => rng.pick(pool));
    }
  }
  if (plan.id === 7 && !shapes.some((id) => BIG_FAMILIES.includes(SHAPES[id].family))) {
    shapes[0] = rng.pick(familyShapes(BIG_FAMILIES, spec.m));
  }
  // Level 4's rows are straight gaps (one piece each); the decoy cannot finish them.
  if (plan.id === 4) for (let i = 0; i < shapes.length; i++) shapes[i] = rng.pick(['domino-0', 'I3-0']);
  if (!tileBlock(d, rng, top, spec.m, plan.id === 4 ? [] : shapes)) {
    if (plan.id !== 4) return null;
  }
  if (plan.id === 4) {
    // Two rows of the block, a straight gap in each.
    for (let i = 0; i < 2; i++) {
      const len = shapes[i] === 'domino-0' ? 2 : 3;
      d.plan.push({ shape: shapes[i], r: top + i, c: rng.int(0, n - len) });
    }
    stoneRows(d, [top, top + 1]);
  }
  const rows = Array.from({ length: spec.m }, (_, i) => top + i);
  if (plan.goal === 'buds') {
    for (const r of rows) budIn(d, rng, { r });
    const want = rng.int(plan.buds[0], plan.buds[1]);
    for (let guard = 0; d.buds.reduce((a, m) => a + popcount(m), 0) < want && guard < 20; guard++) budIn(d, rng, { r: rng.pick(rows) });
  }
  const others = Array.from({ length: n }, (_, i) => i).filter((r) => !rows.includes(r));
  if (spec.density) clutter(d, rng, others, spec.density);
  const extra = plan.pieces - d.plan.length;
  const extraPool = plan.id === 4 ? ['square2-0', 'corner3-0', 'corner3-1', 'corner3-2', 'corner3-3', 'I3-1', 'domino-1'] : familyShapes(plan.families, n);
  for (let i = 0; i < extra; i++) d.extras.push(rng.pick(extraPool));
  return d;
}

/**
 * Level 5: a row nearly full of stones sits on a row whose gap is the bottom of a two-row piece. That piece fits nowhere until
 * the upper row blooms and makes room; a third row has a straight gap. Scattered stones leave the big piece no other place.
 */
function roomGarden(plan: GardenPlan, rng: Rng): Draft | null {
  const d = draft(plan.n);
  const n = d.n;
  const pool = familyShapes(plan.families, 2).filter((id) => SHAPES[id].h === 2 && SHAPES[id].cells.length >= 3);
  const big = rng.pick(pool), s = SHAPES[big];
  const r0 = rng.int(0, n - 2), c = rng.int(0, n - s.w);
  // The upper row's gap: a straight piece away from the big piece's squares.
  const upper = s.rows[0] << c;
  const len = rng.int(2, 3);
  const starts = Array.from({ length: n - len + 1 }, (_, i) => i).filter((i) => !((((1 << len) - 1) << i) & upper));
  if (!starts.length) return null;
  const g = rng.pick(starts);
  d.plan.push({ shape: len === 2 ? 'domino-0' : 'I3-0', r: r0, c: g });
  const full = fullMask(n);
  d.stones[r0] = full & ~(((1 << len) - 1) << g);
  d.stones[r0 + 1] = full & ~(s.rows[1] << c);
  d.plan.push({ shape: big, r: r0, c });
  const rest = Array.from({ length: n }, (_, i) => i).filter((r) => r !== r0 && r !== r0 + 1);
  const r2 = rng.pick(rest);
  const len2 = rng.int(2, 3);
  const g2 = rng.int(0, n - len2);
  d.plan.push({ shape: len2 === 2 ? 'domino-0' : 'I3-0', r: r2, c: g2 });
  d.stones[r2] = full & ~(((1 << len2) - 1) << g2);
  budIn(d, rng, { r: r0 });
  budIn(d, rng, { r: r0 + 1 });
  budIn(d, rng, { r: r2 });
  clutter(d, rng, rest.filter((r) => r !== r2), 0.45);
  return d;
}

function pickShapes(plan: GardenPlan, rng: Rng, k: number): string[] {
  return Array.from({ length: k }, () => rng.pick(FAMILY_SHAPES[rng.pick(plan.families)]));
}

/** Rows and columns each placement of a solution empties, for the plan filters. */
function clearsOf(g: Garden, sol: Placement[]): { rows: number; cols: number; both: boolean }[] {
  let st = startState(g);
  return sol.map((p) => {
    const out = place(st.bed, g.pieces[p.piece], p);
    st = apply(g, st, p);
    return { rows: out.rows.length, cols: out.cols.length, both: out.rows.length > 0 && out.cols.length > 0 };
  });
}

/** Whether a garden passes its level's filter (from the definition's table). `par` is the solver's fewest placements. */
export function passesFilter(plan: GardenPlan, g: Garden, par: number): boolean {
  if (par < plan.par[0] || par > plan.par[1] || g.n !== plan.n || g.pieces.length !== plan.pieces) return false;
  const start = startState(g);
  if (goalMet(start.bed, g.goal) || fullLines(start.bed)) return false;
  const budCount = g.bed.buds.reduce((a, m) => a + popcount(m), 0);
  if (budCount < plan.buds[0] || budCount > plan.buds[1]) return false;
  switch (plan.id) {
    case 1: {
      // The buds share one line.
      const cells: Cell[] = [];
      for (let r = 0; r < g.n; r++) for (let c = 0; c < g.n; c++) if (has(g.bed.buds, r, c)) cells.push([r, c]);
      return cells.every((x) => x[0] === cells[0][0]) || cells.every((x) => x[1] === cells[0][1]);
    }
    case 2: {
      const all = allShortest(g, start, par);
      return all.length > 0 && all.every((sol) => { const cl = clearsOf(g, sol); return cl.some((x) => x.rows) && cl.some((x) => x.cols); });
    }
    case 3: {
      const all = allShortest(g, start, par);
      return all.length > 0 && all.every((sol) => clearsOf(g, sol).some((x) => x.both));
    }
    case 4: {
      const all = allShortest(g, start, par);
      return all.length > 0 && g.pieces.some((_, i) => all.every((sol) => sol.every((p) => p.piece !== i)));
    }
    case 5: {
      const all = allShortest(g, start, par);
      return all.length > 0 && g.pieces.some((id, i) => anchors(g.bed, id).length === 0 && all.every((sol) => sol.some((p) => p.piece === i)));
    }
    case 6:
      return par > g.traySize; // needs the second tray
    case 7:
      return par > 2 * g.traySize && g.solution.some((p) => BIG_FAMILIES.includes(SHAPES[g.pieces[p.piece]].family));
    case 8: {
      const stones = g.bed.filled.reduce((a, m) => a + popcount(m), 0);
      return budCount === 0 && stones >= plan.stones![0] && stones <= plan.stones![1];
    }
  }
  return true;
}

/** One candidate garden for a plan, under a random symmetry, with the solver's own shortest solution; null when it fails the plan's filter. */
export function candidate(plan: GardenPlan, rng: Rng, cap = SEARCH_CAP): Garden | null {
  const d =
    plan.id === 1 ? lineGarden(plan, rng) :
    plan.id === 2 ? crossGarden(plan, rng) :
    plan.id === 3 ? cornerGarden(plan, rng) :
    plan.id === 5 ? roomGarden(plan, rng) :
    blockGarden(plan, rng);
  if (!d) return null;
  while (d.plan.length + d.extras.length < plan.pieces) d.extras.push(pickShapes(plan, rng, 1)[0]);
  if (d.plan.length + d.extras.length > plan.pieces) return null;
  // At level 8 every planted piece has to empty again, so the planned pieces come first and the extras wait in the last tray.
  const order = plan.goal === 'clear' ? 'planned-first' : plan.traySize < plan.pieces ? 'trays' : 'shuffle';
  let g = toGarden(d, plan, order, rng, plan.id >= 6 && plan.id <= 7);
  g = transformGarden(g, rng.int(0, 7));
  const sol = solve(g, startState(g), cap);
  if (!sol) return null;
  g.solution = sol;
  return passesFilter(plan, g, sol.length) ? g : null;
}

/** Level 1's first garden, always first: the row with the bud needs a domino at its end; the square also fits there. */
export const FIRST_GARDEN = '...../...../o*o../...../.....:domino-0,square2-0:0@2,3';

/** Fallback gardens for levels 1–4, used only if 50 tries all fail (a test asserts they are never needed). */
const FALLBACK: Record<number, string> = {
  1: '..o../..o../..*../...../.....:I3-1,square2-0:0@3,2',
  2: '...../ooo*./....o/....*/.....:domino-0,mono-0,domino-1:0@1,3 2@3,4',
  3: 'oo..../oo..../o*..../....../..*.../..o...:corner3-1,domino-1,I3-0:0@0,2 1@3,2',
  4: '....../oo*.o./....../....../...o../...*..:domino-0,I3-1,corner3-0:0@1,2 1@0,3',
};

export interface Made {
  garden: Garden;
  /** True when the authored fallback had to stand in. */
  fallback: boolean;
}

/** A garden for levels 1–4, built backward from the seed and checked by the solver; tries 50 times, then the fallback. */
export function makeGarden(plan: GardenPlan, rng: Rng): Made {
  for (let t = 0; t < 50; t++) {
    const g = candidate(plan, rng);
    if (g) return { garden: g, fallback: false };
  }
  const g = decode(FALLBACK[plan.id] ?? FIRST_GARDEN, plan);
  return { garden: g, fallback: true };
}

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export const SLOT = 180;
/** Pieces in the tray are drawn at this many units per square. */
export const TRAY_CELL = 40;
export const UNDO_R = 54;
/** A carried piece's bottom edge rides this far above the finger. */
export const RIDE = 40;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GardenLayout {
  /** The bed's top-left corner and square size. */
  x: number;
  y: number;
  cell: number;
  n: number;
  slots: Rect[];
  undo: { x: number; y: number };
  portrait: boolean;
}

/** Bed, three tray slots and the round arrow, clear of the shell's top-left buttons and the pet's bottom-left corner. */
export function gardenLayout(plan: Pick<GardenPlan, 'n' | 'cell'>, v: View): GardenLayout {
  const size = plan.n * plan.cell;
  const portrait = v.h > v.w;
  if (!portrait) {
    // Bed beside the shell's buttons, the tray a column on the right.
    const spare = Math.max(0, v.w - 1024);
    const x = 170 + spare / 2;
    const y = Math.max(64, Math.min((v.h - size) / 2, v.h - 104 - size));
    const tx = x + size + 30 + Math.min(spare / 2, 40);
    const top = Math.max(190, (v.h - 3 * SLOT) / 2 + 20);
    const slots = [0, 1, 2].map((i) => ({ x: tx, y: Math.min(top, v.h - 3 * SLOT - 38) + i * SLOT, w: SLOT, h: SLOT }));
    return { x, y, cell: plan.cell, n: plan.n, slots, undo: { x: tx + SLOT / 2, y: Math.max(UNDO_R + 12, slots[0].y - UNDO_R - 16) }, portrait };
  }
  const x = (v.w - size) / 2;
  const block = size + 40 + SLOT;
  const y = Math.max(128, 128 + (v.h - 128 - 74 - block) / 2);
  const ty = y + size + 40;
  const left = Math.max(170, (v.w - 3 * SLOT) / 2 + 40);
  const slots = [0, 1, 2].map((i) => ({ x: left + i * SLOT, y: ty, w: SLOT, h: SLOT }));
  return { x, y, cell: plan.cell, n: plan.n, slots, undo: { x: v.w - 80, y: Math.max(UNDO_R + 12, y - UNDO_R - 14) }, portrait };
}

/**
 * The anchor a carried piece snaps to: the square under its top-left square, rounded, if the piece fits there; else the closest
 * fitting anchor within 0.6 of a square; else null. `px, py` is the piece's top-left corner on screen.
 */
export function nearestAnchor(bed: Bed, shapeId: string, px: number, py: number, lay: Pick<GardenLayout, 'x' | 'y' | 'cell'>): Anchor | null {
  const fr = (py - lay.y) / lay.cell, fc = (px - lay.x) / lay.cell;
  const r0 = Math.round(fr), c0 = Math.round(fc);
  if (fits(bed, shapeId, { r: r0, c: c0 })) return { r: r0, c: c0 };
  let best: Anchor | null = null, bestD = Infinity;
  for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
    const d = Math.hypot(r - fr, c - fc);
    if (d <= 0.6 && d < bestD && fits(bed, shapeId, { r, c })) { best = { r, c }; bestD = d; }
  }
  return best;
}
