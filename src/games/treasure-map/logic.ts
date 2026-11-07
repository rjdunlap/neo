import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Treasure Map: a grid map where things are found by row and column. First rows and columns
 * are pictures (the red column, the apple row); then letters and numbers ("B3"); then the child
 * places something at a named square; then directions from a square ("3 right, 1 up"); then she writes
 * the directions card herself; then she hunts a hidden chest by how far away each dig says it is; then she
 * slides a raft by "2 right and 1 up", first its flag, then picking the whole raft's outline. Level 9, the
 * preschool opening, asks for one whole row or column on a 3 by 3 map: any square in it is right. Levels 10 and 11 cross a
 * river and a road over a 6 by 6 map, so every square is named in words ("2 squares right of the road and 1 below the
 * river"), then mirror a thing across one of them.
 */
export type MapMode = 'pictures' | 'letters' | 'place' | 'steps' | 'clues' | 'write' | 'far' | 'slide' | 'line' | 'river' | 'mirror';

export interface MapPlan {
  mode: MapMode;
  size: 3 | 4 | 5 | 6;
  finds: number;
  name: string;
}

export const PLANS: MapPlan[] = [
  { mode: 'pictures', size: 4, finds: 4, name: 'Dig where a picture row meets a color column: "the apple row, the red column"' },
  { mode: 'letters', size: 4, finds: 4, name: 'Grid names: column letter and row number, like "B3"' },
  { mode: 'place', size: 5, finds: 4, name: 'Put things on the map at named squares: "a tree at D2"' },
  { mode: 'steps', size: 5, finds: 4, name: 'Follow directions from the start: "3 right, then 1 up"' },
  { mode: 'clues', size: 5, finds: 4, name: 'Use two landmark clues to find the square where they meet' },
  { mode: 'write', size: 5, finds: 4, name: 'Write the card: set how far across and which way, then up or down, to walk the pet to the chest' },
  { mode: 'far', size: 4, finds: 3, name: 'How far? A hidden chest: each dig says how many steps away it is, across plus up, and she digs where every distance still fits' },
  { mode: 'slide', size: 5, finds: 3, name: 'Slide it: a three-square raft slides "2 right and 1 up"; tap where its flag lands, then pick the outline of the whole slid raft' },
  { mode: 'line', size: 3, finds: 4, name: 'One line: a 3 by 3 map; dig anywhere in "the red column" or "the fish row", rows and columns taking turns' },
  { mode: 'river', size: 6, finds: 4, name: 'Across the river: a river and a road cross the map; dig "2 squares right of the road and 1 below the river", one find in each quarter' },
  { mode: 'mirror', size: 6, finds: 4, name: "Mirror twin: tap where a thing's twin goes across the river or the road, just as far on the other side" },
];

/** Level 9, the preschool opening: appended after 8 (`planFor` reads by position) and played first through each band's `order`. */
export const ONE_LINE = 9;

export const LEVELS: BandLevels = {
  // Level 9 (One line) is the preschool opening, appended after 8 and played first.
  preschool: { min: 1, max: ONE_LINE, order: [ONE_LINE, 1] },
  prek: { min: 1, max: ONE_LINE, order: [ONE_LINE, 1, 2] },
  // Level 9 is younger than school's window; 10 and 11 follow 8.
  school: { min: 1, max: 11, order: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A square: column (0 = left / A) and row (0 = bottom / 1), as on maps and graphs. */
export interface Square {
  col: number;
  row: number;
}

export const COLUMN_COLORS = ['red', 'yellow', 'blue', 'green', 'purple'] as const;
export const ROW_PICTURES = ['apple', 'fish', 'star', 'flower', 'shell', 'heart', 'balloon'] as const;
export type ColumnColor = (typeof COLUMN_COLORS)[number];
export type RowPicture = (typeof ROW_PICTURES)[number];

/** What heads the map's columns and rows: index i names column i and row i (row 0 at the bottom). */
export interface Headers {
  cols: ColumnColor[];
  rows: RowPicture[];
}

/**
 * A round's headers. Picture maps draw their rows from the seven pictures and shuffle the five colours,
 * so a replay is a fresh map; the finds' squares index into these, and the sign and voice read them.
 * Other maps keep letters and numbers, so their headers stay in the plain order.
 */
export function headersFor(plan: MapPlan, rng: Rng): Headers {
  // The river maps have no headers: the river and the road name every square.
  if (plan.mode === 'river' || plan.mode === 'mirror') return { cols: [], rows: [] };
  if (plan.mode !== 'pictures' && plan.mode !== 'line') return { cols: COLUMN_COLORS.slice(0, plan.size), rows: ROW_PICTURES.slice(0, plan.size) };
  return { cols: rng.shuffle([...COLUMN_COLORS]).slice(0, plan.size), rows: rng.shuffle([...ROW_PICTURES]).slice(0, plan.size) };
}

export const TINTS = 3;
export const DOODLES = ['compass', 'sun', 'ship'] as const;
export type Doodle = (typeof DOODLES)[number];

/** A round's look: one of three parchment tints and a doodle in the free corner. Cosmetic only. */
export function dressingFor(rng: Rng): { tint: number; doodle: Doodle } {
  return { tint: rng.int(0, TINTS - 1), doodle: rng.pick(DOODLES) };
}

export const name = (s: Square) => `${String.fromCharCode(65 + s.col)}${s.row + 1}`;

export interface Find {
  square: Square;
  /** Steps levels: where to start, and the moves. */
  from?: Square;
  right?: number;
  up?: number;
  /** Place levels: what to put there. */
  thing?: 'tree' | 'house' | 'boat' | 'flag';
  /** Two landmark relations: one fixes the target column, one fixes its row. */
  clues?: [Clue, Clue];
  /** Slide levels: the raft's three squares before the slide (`from`, its flag's square, is one of them), and the outline cards. */
  raft?: Square[];
  outlines?: Outline[];
  /** Line levels: the whole column or row asked for; any square in it is right, and `square` is just one of them (where the finger digs). */
  line?: Line;
  /** Level 11: where the thing (`thing`) stands, and the line its twin (`square`) mirrors across. */
  stands?: Square;
  across?: Mirror;
}

/** One whole column (`at` = its column) or row (`at` = its row, 0 at the bottom). */
export interface Line {
  axis: 'col' | 'row';
  at: number;
}

/** A square lies in the line asked for. */
export const inLine = (s: Square, line: Line) => (line.axis === 'col' ? s.col : s.row) === line.at;

/** The squares of a line, for its glow and its shine. */
export const lineSquares = (line: Line, size: number): Square[] =>
  Array.from({ length: size }, (_, i) => (line.axis === 'col' ? { col: line.at, row: i } : { col: i, row: line.at }));

/**
 * Level 9's finds: rows and columns take turns from a seeded first axis, no line asked twice in a round, and the
 * finger's square drawn somewhere in each line.
 */
function makeLines(plan: MapPlan, rng: Rng): Find[] {
  const first = rng.pick<Line['axis']>(['col', 'row']);
  const pools = { col: rng.shuffle([...Array(plan.size).keys()]), row: rng.shuffle([...Array(plan.size).keys()]) };
  const out: Find[] = [];
  for (let i = 0; i < plan.finds; i++) {
    const axis: Line['axis'] = i % 2 === 0 ? first : first === 'col' ? 'row' : 'col';
    const line = { axis, at: pools[axis][Math.floor(i / 2) % plan.size] };
    // The finger's square: any in the line that no earlier find used, so each find has a square of its own.
    const free = lineSquares(line, plan.size).filter((s) => !out.some((f) => f.square.col === s.col && f.square.row === s.row));
    out.push({ line, square: rng.pick(free) });
  }
  return out;
}

/** One outline card on the slide level: the raft slid right, turned over, or slid the wrong amount. */
export interface Outline {
  kind: 'right' | 'flipped' | 'far';
  cells: Square[];
  /** How far this outline moved the raft; for 'flipped', the true slide, before it turned over. */
  right: number;
  up: number;
}

export const THINGS = ['tree', 'house', 'boat', 'flag'] as const;
export type Thing = (typeof THINGS)[number];

export interface Clue {
  landmark: Square;
  thing: Thing;
  /** The signed distance from landmark to target, on this clue's one axis. */
  delta: number;
  axis: 'horizontal' | 'vertical';
}

/** Finds on a level: all different squares; on step levels, moves of 1–3 that stay on the map, with a turn. */
export function makeFinds(plan: MapPlan, rng: Rng): Find[] {
  if (plan.mode === 'line') return makeLines(plan, rng);
  if (plan.mode === 'river') return makeRiver(plan, rng);
  if (plan.mode === 'mirror') return makeMirror(plan, rng);
  const out: Find[] = [];
  const things = rng.shuffle([...THINGS]);
  const landmarks: Square[] = [];
  while (out.length < plan.finds) {
    const square = { col: rng.int(0, plan.size - 1), row: rng.int(0, plan.size - 1) };
    if (out.some((f) => f.square.col === square.col && f.square.row === square.row) || landmarks.some((s) => s.col === square.col && s.row === square.row)) continue;
    if (plan.mode === 'clues') {
      const available = (axis: Clue['axis']) => {
        const before = axis === 'horizontal' ? square.col : square.row;
        const after = axis === 'horizontal' ? plan.size - 1 - square.col : plan.size - 1 - square.row;
        // delta is target minus landmark: its negative side is bounded by space after the target,
        // and its positive side by space before it.
        return Array.from({ length: Math.min(3, before) + Math.min(3, after) + 1 }, (_, i) => i - Math.min(3, after)).filter(Boolean);
      };
      const horizontal = available('horizontal');
      const vertical = available('vertical');
      if (!horizontal.length || !vertical.length) continue;
      const h = horizontal[rng.int(0, horizontal.length - 1)];
      const v = vertical[rng.int(0, vertical.length - 1)];
      const hLandmark = { col: square.col - h, row: square.row };
      const vLandmark = { col: square.col, row: square.row - v };
      const occupied = [...out.map((f) => f.square), ...landmarks];
      if ([hLandmark, vLandmark].some((s) => occupied.some((other) => other.col === s.col && other.row === s.row))) continue;
      const clueThings = rng.shuffle([...THINGS]);
      landmarks.push(hLandmark, vLandmark);
      out.push({ square, clues: [
        { landmark: hLandmark, thing: clueThings[0], delta: h, axis: 'horizontal' },
        { landmark: vLandmark, thing: clueThings[1], delta: v, axis: 'vertical' },
      ] });
      continue;
    }
    if (plan.mode === 'slide') {
      const f = makeSlide(square, plan.size, rng);
      if (!f) continue;
      out.push(f);
      continue;
    }
    if (plan.mode === 'steps' || plan.mode === 'write') {
      const right = rng.int(-3, 3);
      const up = rng.int(-3, 3);
      if (right === 0 || up === 0) continue;
      const from = { col: square.col - right, row: square.row - up };
      if (from.col < 0 || from.row < 0 || from.col >= plan.size || from.row >= plan.size) continue;
      out.push({ square, from, right, up });
      continue;
    }
    out.push({ square, thing: plan.mode === 'place' ? things[out.length % things.length] : undefined });
  }
  return out;
}

/** Spoken direction from a clue's landmark towards the target. */
export function clueDirection(clue: Clue): string {
  const direction = clue.axis === 'horizontal' ? (clue.delta > 0 ? 'right' : 'left') : (clue.delta > 0 ? 'up' : 'down');
  return `${Math.abs(clue.delta)} ${direction}`;
}

/** A clue's line ends at exactly the target, making its intersection unambiguous. */
export function clueEnd(clue: Clue): Square {
  return clue.axis === 'horizontal'
    ? { col: clue.landmark.col + clue.delta, row: clue.landmark.row }
    : { col: clue.landmark.col, row: clue.landmark.row + clue.delta };
}

/** "3 right, then 1 up" (or left / down) for the voice and the sign. */
export function directions(f: Find): string {
  const h = firstDirection(f);
  const v = `${Math.abs(f.up!)} ${f.up! > 0 ? 'up' : 'down'}`;
  return `${h}, then ${v}`;
}

/** "3 right" (or left): the first leg of a steps find, for the hint. */
export function firstDirection(f: Find): string {
  return `${Math.abs(f.right!)} ${f.right! > 0 ? 'right' : 'left'}`;
}

/**
 * The squares of a steps find's first leg, from the square after the pet's to the turning square
 * (the target's column, the pet's row). The hint lights these, so it shows the counting, not the answer.
 */
export function firstLeg(f: Find): Square[] {
  const step = Math.sign(f.right!);
  return Array.from({ length: Math.abs(f.right!) }, (_, i) => ({ col: f.from!.col + step * (i + 1), row: f.from!.row }));
}

/** A square's width on the map, in the grid's own units. */
export const CELL = 100;

/** A square's middle in the grid's own coordinates (row 0 at the bottom, as on maps and graphs). */
export const cellCenter = (s: Square, size: number) => ({ x: s.col * CELL + CELL / 2, y: (size - 1 - s.row) * CELL + CELL / 2 });

/** The square under a point in the grid's own coordinates, or null off the map. The inverse of `cellCenter`. */
export function squareAt(x: number, y: number, size: number): Square | null {
  const col = Math.floor(x / CELL);
  const row = size - 1 - Math.floor(y / CELL);
  return col < 0 || row < 0 || col >= size || row >= size ? null : { col, row };
}

/** Where a finger digs for a find: the middle of its square, which `squareAt` reads back as exactly that square. Always a right dig. */
export const digSpot = (f: Find, size: number) => cellCenter(f.square, size);

/** What a wrong dig got right: the column, the row, both or neither, so the hint can say which to fix. */
export function compare(guess: Square, want: Square): 'column' | 'row' | 'neither' | 'right' {
  const c = guess.col === want.col;
  const r = guess.row === want.row;
  return c && r ? 'right' : c ? 'column' : r ? 'row' : 'neither';
}

/**
 * Level 6's directions card: two lines, each a count (1–3, 0 while unset) and an arrow (+1 right or up,
 * -1 left or down, 0 while unset). The first line goes across, the second up or down, as level 4 reads them.
 */
export interface Card {
  across: number;
  acrossWay: -1 | 0 | 1;
  upDown: number;
  upDownWay: -1 | 0 | 1;
}

export const EMPTY_CARD: Card = { across: 0, acrossWay: 0, upDown: 0, upDownWay: 0 };

/** The most squares one line of the card can say. */
export const MOST_STEPS = 3;

/** A count tile's next number: blank, then 1, 2, 3 and round to 1 again. */
export const nextCount = (n: number) => (n % MOST_STEPS) + 1;

/** An arrow tile's next way: blank, then right (or up), then left (or down), and back. */
export const nextWay = (w: -1 | 0 | 1): -1 | 1 => (w === 1 ? -1 : 1);

export const cardDone = (c: Card) => c.across > 0 && c.acrossWay !== 0 && c.upDown > 0 && c.upDownWay !== 0;

/** The card a find needs: exactly one fits, the across line first. */
export const cardFor = (f: Find): Card => ({ across: Math.abs(f.right!), acrossWay: Math.sign(f.right!) as 1 | -1, upDown: Math.abs(f.up!), upDownWay: Math.sign(f.up!) as 1 | -1 });

export interface CardWalk {
  /** The squares stepped onto by each line, after the pet's square; a line still unset walks nothing, and the up line waits for the across line. */
  legs: [Square[], Square[]];
  end: Square;
  /** A line would have stepped off the map, so the walk stops at the edge. */
  edge: boolean;
}

/** Where the card walks the pet from `from`: square by square, stopping at the edge of the map. */
export function walkCard(from: Square, c: Card, size: number): CardWalk {
  let at = { ...from };
  let edge = false;
  const leg = (n: number, dc: number, dr: number) => {
    const out: Square[] = [];
    for (let i = 0; i < n; i++) {
      const next = { col: at.col + dc, row: at.row + dr };
      if (next.col < 0 || next.row < 0 || next.col >= size || next.row >= size) {
        edge = true;
        break;
      }
      out.push(next);
      at = next;
    }
    return out;
  };
  const across = c.across && c.acrossWay ? leg(c.across, c.acrossWay, 0) : [];
  const upDown = c.across && c.acrossWay && c.upDown && c.upDownWay ? leg(c.upDown, 0, c.upDownWay) : [];
  return { legs: [across, upDown], end: at, edge };
}

const AMOUNTS = ['', 'one', 'two', 'three', 'four', 'five'];

/** What one line of the card got wrong, said after "Across" or "Up": "is one too many", "goes the wrong way". */
function lineReason(got: number, want: number): string | null {
  if (got === want) return null;
  if (Math.sign(got) !== Math.sign(want)) return 'goes the wrong way';
  const off = Math.abs(got) - Math.abs(want);
  return `is ${AMOUNTS[Math.abs(off)]} too ${off > 0 ? 'many' : 'few'}`;
}

/**
 * Why a finished card misses the chest, naming the line that was off: the voice line and its slots.
 * The up-or-down line is called by the way the chest lies ("up" or "down"), so the reason points the right way.
 */
export function cardReason(c: Card, f: Find): { line: 'map.cardacross' | 'map.cardupdown' | 'map.cardboth'; slots: { across: string; leg: string; why: string } } | null {
  const across = lineReason(c.across * c.acrossWay, f.right!);
  const upDown = lineReason(c.upDown * c.upDownWay, f.up!);
  if (!across && !upDown) return null;
  const leg = f.up! > 0 ? 'up' : 'down';
  if (across && upDown) return { line: 'map.cardboth', slots: { across, leg, why: upDown } };
  return across ? { line: 'map.cardacross', slots: { across, leg, why: across } } : { line: 'map.cardupdown', slots: { across: '', leg, why: upDown! } };
}

/** Level 7: how many steps from one square to another, across plus up or down, as the pet would walk it. */
export const distance = (a: Square, b: Square) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row);

/** A dig at level 7 and the distance it told her. */
export interface FarDig {
  square: Square;
  said: number;
}

const same = (a: Square, b: Square) => a.col === b.col && a.row === b.row;

/** The squares that still fit every dig so far: the chest could be on any of them, and on no other. */
export function stillFits(digs: readonly FarDig[], size: number): Square[] {
  const out: Square[] = [];
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    const s = { col, row };
    if (digs.every((d) => distance(s, d.square) === d.said)) out.push(s);
  }
  return out;
}

/** The earliest dig a guess disagrees with, or null if the guess still fits. A square already dug is not asked here. */
export const ruledOutBy = (guess: Square, digs: readonly FarDig[]): FarDig | null => digs.find((d) => distance(guess, d.square) !== d.said) ?? null;

/** The dig already made on this square, if any: digging there again only repeats what it said. */
export const dugAt = (guess: Square, digs: readonly FarDig[]): FarDig | null => digs.find((d) => same(d.square, guess)) ?? null;

/** "1 step" or "3 steps", for the voice. */
export const stepsWord = (n: number) => `${n} ${n === 1 ? 'step' : 'steps'}`;

/**
 * The ghost finger's next dig: the bottom-left corner first, then the square that still fits and best splits what
 * still fits (the fewest left after the worst answer), so it never digs a square the evidence rules out.
 */
export function bestDig(digs: readonly FarDig[], size: number): Square {
  if (!digs.length) return { col: 0, row: 0 };
  const fits = stillFits(digs, size);
  let best = fits[0];
  let bestWorst = Infinity;
  for (const c of fits) {
    const groups = new Map<number, number>();
    for (const t of fits) if (!same(t, c)) groups.set(distance(c, t), (groups.get(distance(c, t)) ?? 0) + 1);
    const worst = Math.max(0, ...groups.values());
    if (worst < bestWorst) {
      best = c;
      bestWorst = worst;
    }
  }
  return best;
}

const onMap = (cells: readonly Square[], size: number) => cells.every((s) => s.col >= 0 && s.row >= 0 && s.col < size && s.row < size);
const shift = (cells: readonly Square[], right: number, up: number) => cells.map((s) => ({ col: s.col + right, row: s.row + up }));
/** Two outlines cover the same squares. */
export const sameCells = (a: readonly Square[], b: readonly Square[]) => a.length === b.length && a.every((s) => b.some((t) => same(s, t)));

/**
 * One slide find for the flag landing on `square`: an L of three squares (its corner, one beside it, one above or
 * below), the flag on one of them, a slide of 1–3 across and 1–3 up or down, every square on the map before and
 * after and none shared, and three outline cards in a seeded order. Null when this landing cannot fit the draw.
 */
function makeSlide(square: Square, size: number, rng: Rng): Find | null {
  const right = rng.pick([-3, -2, -1, 1, 2, 3]);
  const up = rng.pick([-3, -2, -1, 1, 2, 3]);
  const from = { col: square.col - right, row: square.row - up };
  const dx = rng.pick([-1, 1]);
  const dy = rng.pick([-1, 1]);
  const shape = [{ col: 0, row: 0 }, { col: dx, row: 0 }, { col: 0, row: dy }];
  const flagAt = shape[rng.int(0, 2)];
  const raft = shape.map((s) => ({ col: from.col + s.col - flagAt.col, row: from.row + s.row - flagAt.row }));
  const slid = shift(raft, right, up);
  if (!onMap(raft, size) || !onMap(slid, size) || raft.some((s) => slid.some((t) => same(s, t)))) return null;
  // Turned over: the slid raft mirrored across its flag's column, so the flag is still where she tapped it.
  const flipped = slid.map((s) => ({ col: 2 * square.col - s.col, row: s.row }));
  if (!onMap(flipped, size)) return null;
  // Slid the wrong amount: one way one square too far or too short, never to nothing and never the other way.
  const wrongs: Outline[] = [];
  for (const [r, u] of [[right + Math.sign(right), up], [right - Math.sign(right), up], [right, up + Math.sign(up)], [right, up - Math.sign(up)]]) {
    const cells = shift(raft, r, u);
    if (r && u && Math.abs(r) <= MOST_STEPS + 1 && Math.abs(u) <= MOST_STEPS + 1 && onMap(cells, size) && !sameCells(cells, flipped)) wrongs.push({ kind: 'far', cells, right: r, up: u });
  }
  if (!wrongs.length) return null;
  const outlines = rng.shuffle<Outline>([{ kind: 'right', cells: slid, right, up }, { kind: 'flipped', cells: flipped, right, up }, rng.pick(wrongs)]);
  return { square, from, right, up, raft, outlines };
}

/** "2 right and 1 up", for the voice and the sign. */
export const slideWords = (right: number, up: number) => `${Math.abs(right)} ${right > 0 ? 'right' : 'left'} and ${Math.abs(up)} ${up > 0 ? 'up' : 'down'}`;

/** The squares the flag passes on its slide, across then up or down, as the hint lights them. */
export const flagWalk = (f: Find, size: number) => walkCard(f.from!, cardFor(f), size).legs.flat();

/**
 * Levels 10 and 11: the river runs across the map on the grid line below row 3 (rows 0 to 2 below it, 3 to 5 above) and
 * the road runs up it on the line left of column 3, so no square sits on either; the square touching one is 1 from it.
 */
export const HALF = 3;

export type Mirror = 'river' | 'road';

export interface RiverWords {
  across: { n: number; side: 'right' | 'left' };
  upDown: { n: number; side: 'above' | 'below' };
}

/** How far a square is from the road and the river, and on which side of each. */
export function riverWords(s: Square): RiverWords {
  return {
    across: s.col >= HALF ? { n: s.col - HALF + 1, side: 'right' } : { n: HALF - s.col, side: 'left' },
    upDown: s.row >= HALF ? { n: s.row - HALF + 1, side: 'above' } : { n: HALF - s.row, side: 'below' },
  };
}

/** The square those words name: the inverse of `riverWords`. */
export function riverSquare(w: RiverWords): Square {
  return {
    col: w.across.side === 'right' ? HALF - 1 + w.across.n : HALF - w.across.n,
    row: w.upDown.side === 'above' ? HALF - 1 + w.upDown.n : HALF - w.upDown.n,
  };
}

/** "1 square" or "2 squares", for the voice. */
export const squaresWord = (n: number) => `${n} ${n === 1 ? 'square' : 'squares'}`;

/** "2 squares right" and "1 square below", said before "of the road" and "the river". */
export const acrossWords = (s: Square) => `${squaresWord(riverWords(s).across.n)} ${riverWords(s).across.side}`;
export const upDownWords = (s: Square) => `${squaresWord(riverWords(s).upDown.n)} ${riverWords(s).upDown.side}`;
/** "right of the road" or "below the river": the side alone. */
const sideWords = (s: Square, line: Mirror) => (line === 'road' ? `${riverWords(s).across.side} of the road` : `${riverWords(s).upDown.side} the river`);
/** "2 squares right of the road" or "1 square below the river". */
const countWords = (s: Square, line: Mirror) => (line === 'road' ? `${acrossWords(s)} of the road` : `${upDownWords(s)} the river`);

/** The square across a line, just as far on the other side. */
export const mirrorOf = (s: Square, line: Mirror): Square => (line === 'river' ? { col: s.col, row: 2 * HALF - 1 - s.row } : { col: 2 * HALF - 1 - s.col, row: s.row });

const QUADRANTS = [
  { right: true, above: true },
  { right: false, above: true },
  { right: false, above: false },
  { right: true, above: false },
];

/** Level 10's finds: one in each quarter of the map in a seeded order, each 1 to 3 from the road and from the river. */
function makeRiver(plan: MapPlan, rng: Rng): Find[] {
  return rng.shuffle([...QUADRANTS]).slice(0, plan.finds).map((q) => ({
    square: riverSquare({ across: { n: rng.int(1, HALF), side: q.right ? 'right' : 'left' }, upDown: { n: rng.int(1, HALF), side: q.above ? 'above' : 'below' } }),
  }));
}

/** Level 11's finds: four different things, two mirrored across the river and two across the road in a seeded order, no twin twice. */
function makeMirror(plan: MapPlan, rng: Rng): Find[] {
  const things = rng.shuffle([...THINGS]);
  const lines = rng.shuffle<Mirror>(['river', 'river', 'road', 'road']);
  const out: Find[] = [];
  for (let i = 0; i < plan.finds; i++) {
    for (;;) {
      const stands = { col: rng.int(0, plan.size - 1), row: rng.int(0, plan.size - 1) };
      const square = mirrorOf(stands, lines[i % lines.length]);
      if (out.some((f) => same(f.square, square))) continue;
      out.push({ square, stands, thing: things[i % things.length], across: lines[i % lines.length] });
      break;
    }
  }
  return out;
}

export type RiverLine = 'map.riverside' | 'map.rivercount';

/** Why a level 10 dig missed, naming the first wrong part: the side of the road, the count from it, then the same for the river. */
export function riverReason(guess: Square, want: Square): { line: RiverLine; slots: Record<string, string> } | null {
  const g = riverWords(guess);
  const w = riverWords(want);
  for (const line of ['road', 'river'] as const) {
    const [gs, ws] = line === 'road' ? [g.across, w.across] : [g.upDown, w.upDown];
    if (gs.side !== ws.side) return { line: 'map.riverside', slots: { got: sideWords(guess, line), want: sideWords(want, line) } };
    if (gs.n !== ws.n) return { line: 'map.rivercount', slots: { line, want: countWords(want, line) } };
  }
  return null;
}

export type MirrorLine = 'map.mirrorside' | 'map.mirrorslid' | 'map.mirrorcount';

/**
 * Why a level 11 tap missed, naming the first wrong part: still on the thing's side of the line (its own square too),
 * then moved along the line, then the wrong distance across it.
 */
export function mirrorReason(guess: Square, stands: Square, line: Mirror): { line: MirrorLine; slots: Record<string, string> } | null {
  const twin = mirrorOf(stands, line);
  if (same(guess, twin)) return null;
  const g = riverWords(guess);
  const t = riverWords(stands);
  const sameSide = line === 'river' ? g.upDown.side === t.upDown.side : g.across.side === t.across.side;
  if (sameSide) return { line: 'map.mirrorside', slots: { line } };
  const other: Mirror = line === 'river' ? 'road' : 'river';
  const slid = line === 'river' ? guess.col !== stands.col : guess.row !== stands.row;
  if (slid) return { line: 'map.mirrorslid', slots: { line, keep: countWords(stands, other) } };
  return { line: 'map.mirrorcount', slots: { line, n: squaresWord(line === 'river' ? t.upDown.n : t.across.n) } };
}

/** Level 11's hint path: from the thing to the line, then the same number of squares on the other side, ending on the twin. */
export function mirrorPath(stands: Square, line: Mirror): Square[] {
  const n = line === 'river' ? riverWords(stands).upDown.n : riverWords(stands).across.n;
  const out: Square[] = [];
  for (let k = n; k >= 1; k--) out.push(stepFrom(stands, line, k));
  for (let k = 1; k <= n; k++) out.push(mirrorOf(stepFrom(stands, line, k), line));
  return out;
}

/** The square k from the line on the thing's side, in the thing's own column (river) or row (road). */
function stepFrom(s: Square, line: Mirror, k: number): Square {
  const w = riverWords(s);
  return line === 'river'
    ? riverSquare({ across: w.across, upDown: { n: k, side: w.upDown.side } })
    : riverSquare({ across: { n: k, side: w.across.side }, upDown: w.upDown });
}
