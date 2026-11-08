import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import { CROSSED, EMPTY, FILLED } from '../picture-logic/logic';
import type { BandLevels } from '../../progress/difficulty';

export { CROSSED, EMPTY, FILLED };

/**
 * Mystery Grid rules (docs/definitions/logic-grid.md). A little mystery on a grid of friends (rows) by places (columns): spoken
 * clues say where friends are or are not, she marks each square yes or no until every friend has one place, then taps who is
 * by the missing pie (levels 3–4: the ball, 5–6: the kite). Levels 1–6 are built here; each level's build writes only its own
 * cast and clue kinds. From level 3 there are as many places as friends, so every place has someone and a column can be closed
 * too. Level 5 adds a second block beside the first, sharing its friend rows: what each friend has (apple, balloon, flower).
 * Level 6 is one 4 by 4 block with this-or-that clues: either-or ("Pig is at the pond or the bush") and neither-nor.
 * Level 7 (grown-up, *Case file*) is the L of three 4 by 4 blocks: friend × place, friend × snack, and under the places a
 * snack × place block whose rows are the snacks. Its clues are written, and a yes in one block decides squares in another.
 * Level 8 (grown-up, *Who came first?*) is the same L at five by five, with a time row in place of the snacks: dawn to evening,
 * in order and never shuffled, so "two after" is two columns along. It adds ordering clues ("Bear came before Duck"; "Pig came
 * two after Cat") and the unaligned pair ("Of Cat and the friend at the pond, one came in the morning and one at noon").
 *
 * A grid's marks are a flat array, block by block and row by row (`block * rows * cols + friend * cols + col`), of Picture
 * Logic's `EMPTY`, `FILLED` (a yes) and `CROSSED` (a no). Only her own marks are stored; the lighter crosses a yes puts across
 * its row and column within its block are derived (`shown`), so they lift again when the yes is taken away.
 */

export type Place = 'pond' | 'tree' | 'bush' | 'blanket' | 'barn';
export const PLACES: readonly Place[] = ['pond', 'tree', 'bush', 'blanket'];
/** Level 8's five places: the four and the barn. */
export const PLACES5: readonly Place[] = [...PLACES, 'barn'];

/** The missing thing: the pie at levels 1–2, the ball at 3–4, the kite at 5–6, the picnic basket at 7. */
export type Thing = 'pie' | 'ball' | 'kite' | 'basket';

/** Level 5's second block: what each friend has; level 7's snacks. */
export type Item = 'apple' | 'balloon' | 'flower' | 'orange' | 'lemon' | 'pear' | Time;
/** Level 8's time row, in order: the sun climbing and setting. */
export type Time = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening';
export const TIMES: readonly Time[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening'];
export const isTime = (i: Item): i is Time => (TIMES as readonly string[]).includes(i);
export const ITEMS: readonly Item[] = ['apple', 'balloon', 'flower'];
export const SNACKS: readonly Item[] = ['apple', 'orange', 'lemon', 'pear'];

/** Level 4's hats: each colour has its own pattern too, so colour never has to work alone. Level 6's fourth friend wears green. */
export const HATS = [
  { color: 'red', pattern: 'stripes' },
  { color: 'blue', pattern: 'spots' },
  { color: 'yellow', pattern: 'stars' },
  { color: 'green', pattern: 'zigzag' },
  { color: 'purple', pattern: 'checks' },
] as const;

export type Mark = typeof EMPTY | typeof FILLED | typeof CROSSED;
export type Marks = readonly Mark[];

/**
 * A clue on one square. `hat`: the clue names the friend by the hat on their card ("The friend in the red hat…"), not by name.
 * `block: 1` puts it in level 5's item block (level 7's snacks), where `place` is the item's index. `block: 2` (level 7) puts it
 * in the snack × place block, where `friend` is the snack's index: "The friend at the pond had the pear".
 */
export type GridClue = { kind: 'direct' | 'not'; friend: number; place: number; hat?: true; block?: 1 | 2 };
/** Level 5's different-person clue: "The friend at the pond is not the one with the balloon". Alone it decides no square. */
export type ApartClue = { kind: 'apart'; place: number; item: number };
/** Level 6: "Pig is at the pond or the bush" (one of the two is true). Alone it crosses the friend's other places. */
export type EitherClue = { kind: 'either'; friend: number; place: number; or: number; hat?: true; block?: 1 };
/** Level 6: "Neither Cat nor Dog is at the tree". Alone it crosses both squares. Level 7's `block: 1` is about snacks. */
export type NeitherClue = { kind: 'neither'; friend: number; nor: number; place: number; block?: 1 };
/** Level 8: `friend` came before `later` (with `by`, exactly that many times along: "Pig came two after Cat"). */
export type OrderClue = { kind: 'order'; friend: number; later: number; by?: 1 | 2 };
/**
 * Level 8's unaligned pair: "Of Cat and the friend at the pond, one came in the morning and one at noon". So Cat was not at
 * the pond, Cat came at one of the two times, and whoever was at the pond came at the other.
 */
export type PairClue = { kind: 'pair'; friend: number; place: number; time: number; or: number };
export type Clue = GridClue | ApartClue | EitherClue | NeitherClue | OrderClue | PairClue;
export type Kind = Clue['kind'];
/** A clue on one square (direct or not). */
export const onGrid = (c: Clue): c is GridClue => c.kind === 'direct' || c.kind === 'not';
/** Names its friend by hat. */
export const hatted = (c: Clue) => (onGrid(c) || c.kind === 'either') && !!c.hat;

export interface Board {
  friends: CritterName[];
  places: Place[];
  /** Each friend's place (an index into `places`); one place stays empty. */
  solution: number[];
  clues: Clue[];
  /** The place the missing thing is by: always one a friend is at, so it names exactly one friend. */
  event: number;
  thing: Thing;
  /** Levels 4–5: each friend's hat (an index into `HATS`). */
  hats?: number[];
  /** Level 5: the items of the second block, each friend's item (an index into `items`), and whether the event names an item. */
  items?: Item[];
  having?: number[];
  eventItem?: true;
  /** Level 7: the third block, snack × place (`items` are the snacks). */
  case?: true;
  /** Level 8: the items are the time row, in order. */
  times?: true;
}

export interface Plan {
  level: number;
  name: string;
  /** The friends a board draws from. */
  cast: readonly CritterName[];
  friends: number;
  /** The places a board draws from, and how many it uses. */
  placePool: readonly Place[];
  places: number;
  kinds: readonly Kind[];
  /** Clues on a board (at least `clues`, at most `maxClues`), and how many of each kind it must have (level 2: one of each). */
  clues: number;
  maxClues?: number;
  each?: Partial<Record<Kind, number>>;
  /** At most this many direct clues (levels 3–4: one). */
  maxDirect?: number;
  /** Every clue names its friend by hat (level 4: true), or some do, at least one (levels 5–6: 'some'). */
  hats?: boolean | 'some';
  /** Level 5: the second block's items (level 7: the snacks). */
  items?: readonly Item[];
  /** Level 7: the L of three blocks, with a snack × place block under the places. */
  case?: true;
  /** Level 8: the items are times, kept in order. */
  times?: true;
  /** At least this many of a kind (level 5: one different-person clue; level 6: one either-or and one neither-nor). */
  atLeast?: Partial<Record<Kind, number>>;
  thing: Thing;
  boards: number;
}

const OPENING: readonly Place[] = ['pond', 'tree', 'bush'];

export const PLANS: readonly Plan[] = [
  {
    level: 1,
    name: 'Who is where? (2 friends, 3 places, clues that say where)',
    cast: ['cat', 'duck', 'bear'],
    friends: 2,
    placePool: OPENING,
    places: 3,
    kinds: ['direct'],
    clues: 2,
    thing: 'pie',
    boards: 2,
  },
  {
    level: 2,
    name: 'Not there (a clue that says where, and one that says not)',
    cast: ['dog', 'bunny', 'pig'],
    friends: 2,
    placePool: OPENING,
    places: 3,
    kinds: ['direct', 'not'],
    clues: 2,
    each: { direct: 1, not: 1 },
    thing: 'pie',
    boards: 2,
  },
  {
    level: 3,
    name: 'Three friends (3 friends, 3 places, mostly "not" clues)',
    cast: ['cat', 'duck', 'bear', 'dog'],
    friends: 3,
    placePool: PLACES,
    places: 3,
    kinds: ['direct', 'not'],
    clues: 3,
    maxClues: 4,
    maxDirect: 1,
    thing: 'ball',
    boards: 1,
  },
  {
    level: 4,
    name: 'The friend in the red hat (clues name a friend by the hat they wear)',
    cast: ['cat', 'duck', 'bear', 'dog'],
    friends: 3,
    placePool: PLACES,
    places: 3,
    kinds: ['not'],
    clues: 3,
    maxClues: 4,
    maxDirect: 0,
    hats: true,
    thing: 'ball',
    boards: 1,
  },
  {
    level: 5,
    name: 'Who, where and what (two grids side by side: where each friend is and what each has; "not the one with" clues)',
    cast: ['cat', 'duck', 'bear', 'dog', 'bunny'],
    friends: 3,
    placePool: PLACES,
    places: 3,
    items: ITEMS,
    kinds: ['direct', 'not', 'apart'],
    clues: 4,
    maxClues: 5,
    maxDirect: 1,
    hats: 'some',
    atLeast: { apart: 1 },
    thing: 'kite',
    boards: 1,
  },
  {
    level: 6,
    name: 'This one or that one (4 friends, 4 places; "or" and "neither…nor" clues)',
    cast: ['cat', 'duck', 'bear', 'dog', 'bunny', 'pig'],
    friends: 4,
    placePool: PLACES,
    places: 4,
    kinds: ['not', 'either', 'neither'],
    clues: 4,
    maxClues: 6,
    maxDirect: 0,
    hats: 'some',
    atLeast: { either: 1, neither: 1 },
    thing: 'kite',
    boards: 1,
  },
  {
    level: 7,
    name: 'Case file (grown-up: 4 friends, 4 places, 4 snacks in three linked grids; written clues)',
    cast: ['cat', 'duck', 'bear', 'dog', 'bunny', 'pig'],
    friends: 4,
    placePool: PLACES,
    places: 4,
    items: SNACKS,
    case: true,
    kinds: ['direct', 'not', 'either', 'neither'],
    clues: 5,
    maxClues: 8,
    hats: 'some',
    thing: 'basket',
    boards: 1,
  },
  {
    level: 8,
    name: 'Who came first? (grown-up: 5 friends, 5 places, 5 times of day; "before", "two after" and "one of the two" clues)',
    cast: ['cat', 'duck', 'bear', 'dog', 'bunny', 'pig'],
    friends: 5,
    placePool: PLACES5,
    places: 5,
    items: TIMES,
    case: true,
    times: true,
    kinds: ['direct', 'not', 'either', 'neither', 'order', 'pair'],
    clues: 7,
    maxClues: 9,
    hats: 'some',
    atLeast: { order: 1, pair: 1 },
    thing: 'basket',
    boards: 1,
  },
];

/** Preschool's, pre-K's and school's whole ranges, and grown-up's levels 7–8. */
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 6 },
  grownup: { min: 7, max: 8 },
};

export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/**
 * A grid of `blocks` blocks (level 5: two, places then items), each `rows` friends by `cols`, sharing the friend rows. Level 7's
 * third block is snacks (rows) by places.
 */
export interface Shape {
  rows: number;
  cols: number;
  blocks?: number;
}

export const blocksOf = (s: Shape) => s.blocks ?? 1;
export const sizeOf = (s: Shape) => blocksOf(s) * s.rows * s.cols;
export const sq = (s: Shape, friend: number, place: number, block = 0) =>
  block * s.rows * s.cols + friend * s.cols + place;
export const rowOf = (s: Shape, i: number) => Math.floor((i % (s.rows * s.cols)) / s.cols);
export const colOf = (s: Shape, i: number) => i % s.cols;
export const blockOf = (s: Shape, i: number) => Math.floor(i / (s.rows * s.cols));
export const shapeOf = (b: Board): Shape => ({
  rows: b.friends.length,
  cols: b.places.length,
  ...(b.items ? { blocks: b.case ? 3 : 2 } : {}),
});
export const emptyMarks = (s: Shape): Mark[] => new Array<Mark>(sizeOf(s)).fill(EMPTY);
/** A square-grid clue's square. */
export const clueSquare = (s: Shape, c: GridClue) => sq(s, c.friend, c.place, c.block ?? 0);
const sameLine = (s: Shape, i: number, j: number) =>
  blockOf(s, i) === blockOf(s, j) && (rowOf(s, i) === rowOf(s, j) || colOf(s, i) === colOf(s, j));

/** Block `k`'s answer, row by row: each friend's place (0) or item (1), or (level 7's block 2) each snack's place. */
export const truthOf = (k: number, a: readonly number[], h: readonly number[]): number[] =>
  k === 2 ? h.map((_, t) => a[h.indexOf(t)]) : [...(k ? h : a)];

/** True of an assignment (friend → place, and at levels 5 and 7 friend → item)? */
export function holds(c: Clue, a: readonly number[], h: readonly number[] = []): boolean {
  if (c.kind === 'apart') return a.indexOf(c.place) !== h.indexOf(c.item);
  if (c.kind === 'order') return c.by ? h[c.later] - h[c.friend] === c.by : h[c.later] > h[c.friend];
  if (c.kind === 'pair') {
    const g = a.indexOf(c.place);
    return (
      g !== c.friend &&
      ((h[c.friend] === c.time && h[g] === c.or) || (h[c.friend] === c.or && h[g] === c.time))
    );
  }
  const at = truthOf(c.block ?? 0, a, h);
  if (c.kind === 'either') return at[c.friend] === c.place || at[c.friend] === c.or;
  if (c.kind === 'neither') return at[c.friend] !== c.place && at[c.nor] !== c.place;
  return c.kind === 'direct' ? at[c.friend] === c.place : at[c.friend] !== c.place;
}

const permutations = (n: number, of: number): number[][] => {
  const out: number[][] = [];
  const walk = (a: number[]) => {
    if (a.length === n) return void out.push([...a]);
    for (let p = 0; p < of; p++) if (!a.includes(p)) walk([...a, p]);
  };
  walk([]);
  return out;
};

/**
 * Every one-place-each assignment the clues allow (the exact solver). With two blocks, each solution lists the friends'
 * places and then their items.
 */
export function solutions(s: Shape, clues: readonly Clue[]): number[][] {
  const out: number[][] = [];
  const as = permutations(s.rows, s.cols);
  if (blocksOf(s) === 1) return as.filter((a) => clues.every((c) => holds(c, a)));
  for (const a of as) for (const h of as) if (clues.every((c) => holds(c, a, h))) out.push([...a, ...h]);
  return out;
}

const PERMS = new Map<string, number[][]>();
const perms = (n: number, of: number) => {
  const k = `${n}:${of}`;
  if (!PERMS.has(k)) PERMS.set(k, permutations(n, of));
  return PERMS.get(k)!;
};
/** Which half of an answer a clue reads: the places alone (0), the items alone (1), or both (2). */
const reads = (c: Clue) =>
  c.kind === 'apart' || c.kind === 'pair' ? 2 : c.kind === 'order' ? 1 : c.block === 2 ? 2 : (c.block ?? 0);

/**
 * How many answers the clues allow, stopping at `limit`: the exact solver's count, fast enough for level 8's 120 × 120
 * assignments, since place-only and item-only clues thin each half before the two are paired.
 */
export function countSolutions(s: Shape, clues: readonly Clue[], limit = 2): number {
  const all = perms(s.rows, s.cols);
  const by = [0, 1, 2].map((k) => clues.filter((c) => reads(c) === k));
  const as = all.filter((a) => by[0].every((c) => holds(c, a)));
  if (blocksOf(s) === 1) return Math.min(limit, as.length);
  const hs = all.filter((h) => by[1].every((c) => holds(c, [], h)));
  let n = 0;
  for (const a of as) for (const h of hs) if (by[2].every((c) => holds(c, a, h)) && ++n >= limit) return n;
  return n;
}

/**
 * The marks a clue puts on the grid as told: a direct clue's yes, a negative clue's no, an either-or clue's noes on the friend's
 * other places, a neither-nor clue's two noes; a different-person clue names no friend, so none.
 */
export function told(s: Shape, c: Clue): { square: number; mark: Mark }[] {
  if (c.kind === 'apart') return [];
  const x = (square: number) => ({ square, mark: CROSSED as Mark });
  const times = [...Array(s.cols).keys()];
  if (c.kind === 'order') {
    // The earlier friend is not in the last `by` times (the last one for plain "before"); the later one not in the first.
    const gap = c.by ?? 1;
    return [
      ...times.filter((t) => t >= s.cols - gap).map((t) => x(sq(s, c.friend, t, 1))),
      ...times.filter((t) => t < gap).map((t) => x(sq(s, c.later, t, 1))),
    ];
  }
  if (c.kind === 'pair') {
    const two = (t: number) => t === c.time || t === c.or;
    return [
      x(sq(s, c.friend, c.place, 0)),
      ...times.filter((t) => !two(t)).map((t) => x(sq(s, c.friend, t, 1))),
      ...times.filter((t) => !two(t)).map((t) => x(sq(s, t, c.place, 2))),
    ];
  }
  if (c.kind === 'either')
    return [...Array(s.cols).keys()]
      .filter((p) => p !== c.place && p !== c.or)
      .map((p) => ({ square: sq(s, c.friend, p, c.block ?? 0), mark: CROSSED }));
  if (c.kind === 'neither')
    return [c.friend, c.nor].map((f) => ({ square: sq(s, f, c.place, c.block ?? 0), mark: CROSSED }));
  return [{ square: clueSquare(s, c), mark: c.kind === 'direct' ? FILLED : CROSSED }];
}

/**
 * The squares one clue decides by itself on an empty grid, with the matching rule: what it tells, and for a direct clue the
 * no on the rest of its row and its column in its block. The miss rule and the tests both use this.
 */
export function decides(s: Shape, c: Clue): { square: number; mark: Mark }[] {
  if (c.kind !== 'direct') return told(s, c);
  const k = c.block ?? 0;
  const out = [{ square: clueSquare(s, c), mark: FILLED as Mark }];
  for (let p = 0; p < s.cols; p++)
    if (p !== c.place) out.push({ square: sq(s, c.friend, p, k), mark: CROSSED });
  for (let f = 0; f < s.rows; f++)
    if (f !== c.friend) out.push({ square: sq(s, f, c.place, k), mark: CROSSED });
  return out;
}

/** What each square shows: her own mark, or a lighter automatic cross where a yes of hers shares its row or column in a block. */
export function shown(s: Shape, marks: Marks): { mark: Mark; auto: boolean }[] {
  return marks.map((m, i) => {
    if (m !== EMPTY) return { mark: m, auto: false };
    for (let j = 0; j < marks.length; j++)
      if (j !== i && marks[j] === FILLED && sameLine(s, i, j)) return { mark: CROSSED, auto: true };
    return { mark: EMPTY, auto: false };
  });
}

/** The tap cycle: empty → yes → no → empty. An automatic cross counts as empty, so a tap there makes a yes. */
export function cycle(m: Mark): Mark {
  return m === EMPTY ? FILLED : m === FILLED ? CROSSED : EMPTY;
}

export interface Step {
  square: number;
  mark: Mark;
  /** The clue or clues the square follows from (for a last-place step, every clue behind its row's crosses). */
  clues: number[];
  /**
   * `last`: a friend's one place (or item) left; `col`: a place's (or item's) one friend left (only when every place has
   * someone); `apart`: a different-person clue crosses the item of the friend at its place, or the place of the friend with
   * its item; `link` (level 7): two squares of one friend, place and snack decide the third (two yeses make a yes, a yes and a
   * no make a no); `order` (level 8): an ordering clue leaves no time for the other friend; `pair`: one of an unaligned pair
   * came at one of its two times, so the other came at the other.
   */
  why: 'clue' | 'cross' | 'last' | 'col' | 'apart' | 'link' | 'order' | 'pair';
}

/**
 * The rule solver: only what a person does on paper, never trial and error. It puts each clue on the grid, crosses a yes's
 * row and column in its block (the matching rule), and makes a row's one remaining square a yes. A column is closed the same
 * way only when there are as many places as friends; with a place to spare (levels 1–2) one stays empty. A different-person
 * clue (level 5) crosses the item of a friend known to be at its place, and the place of a friend known to have its item.
 * Returns its steps in order and whether every friend found a place (and an item).
 */
export function solveSteps(s: Shape, clues: readonly Clue[]): { steps: Step[]; done: boolean } {
  const known = new Map<number, { mark: Mark; from: Set<number> }>();
  const steps: Step[] = [];
  const n = sizeOf(s),
    B = blocksOf(s);
  const put = (square: number, mark: Mark, from: Set<number>, why: Step['why']) => {
    known.set(square, { mark, from });
    steps.push({ square, mark, clues: [...from].sort((a, b) => a - b), why });
  };
  const keys = (k: number) => [...Array(k).keys()];
  const rowDone = (f: number, k: number) =>
    keys(s.cols).some((p) => known.get(sq(s, f, p, k))?.mark === FILLED);
  for (let guard = 0; guard < Math.max(200, 4 * n); guard++) {
    // The matching rule first: every yes crosses the rest of its row and column in its block.
    for (const [i, k] of [...known]) {
      if (k.mark !== FILLED) continue;
      for (let j = 0; j < n; j++) {
        if (j === i || known.has(j) || !sameLine(s, i, j)) continue;
        put(j, CROSSED, new Set(k.from), 'cross');
      }
    }
    if (keys(B).every((k) => keys(s.rows).every((f) => rowDone(f, k)))) return { steps, done: true };
    // Then the next clue not yet on the grid, a square at a time.
    const i = clues.findIndex((c) => told(s, c).some((t) => !known.has(t.square)));
    if (i >= 0) {
      const t = told(s, clues[i]).find((t) => !known.has(t.square))!;
      put(t.square, t.mark, new Set([i]), 'clue');
      continue;
    }
    let found = false;
    // Then a different-person clue across the two blocks.
    for (let ci = 0; ci < clues.length && !found; ci++) {
      const c = clues[ci];
      if (c.kind !== 'apart') continue;
      for (let f = 0; f < s.rows && !found; f++) {
        for (const [from, to] of [
          [sq(s, f, c.place, 0), sq(s, f, c.item, 1)],
          [sq(s, f, c.item, 1), sq(s, f, c.place, 0)],
        ]) {
          const k = known.get(from);
          if (found || k?.mark !== FILLED || known.has(to)) continue;
          put(to, CROSSED, new Set([...k.from, ci]), 'apart');
          found = true;
        }
      }
    }
    // Then (level 7) a friend, a place and a snack across the three blocks: two yeses make a yes, a yes and a no make a no.
    for (let f = 0; f < s.rows && B === 3 && !found; f++) {
      for (let p = 0; p < s.cols && !found; p++) {
        for (let t = 0; t < s.cols && !found; t++) {
          const tri = [sq(s, f, p, 0), sq(s, f, t, 1), sq(s, t, p, 2)];
          for (let x = 0; x < 3 && !found; x++) {
            const to = tri[x];
            const [u, w] = tri.filter((_, y) => y !== x).map((i) => known.get(i));
            if (known.has(to) || !u || !w || (u.mark !== FILLED && w.mark !== FILLED)) continue;
            put(
              to,
              u.mark === FILLED && w.mark === FILLED ? FILLED : CROSSED,
              new Set([...u.from, ...w.from]),
              'link',
            );
            found = true;
          }
        }
      }
    }
    // Then (level 8) an ordering clue: a time is crossed when the other friend has no time left that fits it.
    for (let ci = 0; ci < clues.length && !found; ci++) {
      const c = clues[ci];
      if (c.kind !== 'order') continue;
      const gap = c.by;
      const fits = (t: number, u: number) => (gap ? u - t === gap : u > t);
      for (const [me, other, early] of [
        [c.friend, c.later, true],
        [c.later, c.friend, false],
      ] as const) {
        for (let t = 0; t < s.cols && !found; t++) {
          const at = sq(s, me, t, 1);
          if (known.has(at)) continue;
          const open = keys(s.cols).filter(
            (u) => (early ? fits(t, u) : fits(u, t)) && known.get(sq(s, other, u, 1))?.mark !== CROSSED,
          );
          if (open.length) continue;
          const from = new Set([ci]);
          for (let u = 0; u < s.cols; u++)
            for (const y of known.get(sq(s, other, u, 1))?.from ?? []) from.add(y);
          put(at, CROSSED, from, 'order');
          found = true;
        }
        if (found) break;
      }
    }
    // Then an unaligned pair: the named friend at one of its times puts the place at the other, and the other way round.
    for (let ci = 0; ci < clues.length && !found; ci++) {
      const c = clues[ci];
      if (c.kind !== 'pair') continue;
      for (const [t, u] of [
        [c.time, c.or],
        [c.or, c.time],
      ]) {
        for (const [from, to] of [
          [sq(s, c.friend, t, 1), sq(s, u, c.place, 2)],
          [sq(s, t, c.place, 2), sq(s, c.friend, u, 1)],
        ]) {
          const k = known.get(from);
          if (found || k?.mark !== FILLED || known.has(to)) continue;
          put(to, FILLED, new Set([...k.from, ci]), 'pair');
          found = true;
        }
      }
    }
    // Then a row with one square left.
    for (let k = 0; k < B && !found; k++) {
      for (let f = 0; f < s.rows && !found; f++) {
        if (rowDone(f, k)) continue;
        const open = keys(s.cols).filter((p) => !known.has(sq(s, f, p, k)));
        if (open.length !== 1) continue;
        const from = new Set<number>();
        for (let p = 0; p < s.cols; p++) for (const x of known.get(sq(s, f, p, k))?.from ?? []) from.add(x);
        put(sq(s, f, open[0], k), FILLED, from, 'last');
        found = true;
      }
    }
    for (let k = 0; k < B && !found && s.cols === s.rows; k++) {
      for (let p = 0; p < s.cols && !found; p++) {
        if (keys(s.rows).some((f) => known.get(sq(s, f, p, k))?.mark === FILLED)) continue;
        const open = keys(s.rows).filter((f) => !known.has(sq(s, f, p, k)));
        if (open.length !== 1) continue;
        const from = new Set<number>();
        for (let f = 0; f < s.rows; f++) for (const x of known.get(sq(s, f, p, k))?.from ?? []) from.add(x);
        put(sq(s, open[0], p, k), FILLED, from, 'col');
        found = true;
      }
    }
    if (!found) return { steps, done: false };
  }
  return { steps, done: false };
}

/** The friend who has the missing thing: the one at its place, or (level 5) the one with its item. */
export const answerOf = (b: Board) => (b.eventItem ? b.having! : b.solution).indexOf(b.event);

/** The mark each square ends with: yes on each friend's place (and item), no everywhere else. */
export function solutionMarks(b: Board): Mark[] {
  const s = shapeOf(b);
  const at = [0, 1, 2].map((k) => truthOf(k, b.solution, b.having ?? []));
  return emptyMarks(s).map((_, i) => (at[blockOf(s, i)][rowOf(s, i)] === colOf(s, i) ? FILLED : CROSSED));
}

/** Rejects a board whose clues miss the plan's count or mix, have more than one answer, or that the rule solver cannot finish. */
export function fits(plan: Plan, b: Board): boolean {
  const s = shapeOf(b);
  if (b.clues.length < plan.clues || b.clues.length > (plan.maxClues ?? plan.clues)) return false;
  for (const [k, n] of Object.entries(plan.each ?? {}))
    if (b.clues.filter((c) => c.kind === k).length !== n) return false;
  if (b.clues.filter((c) => c.kind === 'direct').length > (plan.maxDirect ?? Infinity)) return false;
  for (const [k, n] of Object.entries(plan.atLeast ?? {}))
    if (b.clues.filter((c) => c.kind === k).length < n) return false;
  const hats = b.clues.filter(hatted).length;
  if (plan.hats === 'some' ? hats < 1 : b.clues.some((c) => onGrid(c) && !!c.hat !== !!plan.hats))
    return false;
  if (
    !!b.hats !== !!plan.hats ||
    !!b.items !== !!plan.items ||
    !!b.case !== !!plan.case ||
    !!b.times !== !!plan.times
  )
    return false;
  if (b.clues.some((c) => !plan.kinds.includes(c.kind) || !holds(c, b.solution, b.having))) return false;
  if (countSolutions(s, b.clues) !== 1) return false;
  if (!solveSteps(s, b.clues).done) return false;
  // No clue is spare to the rule solver.
  if (
    b.clues.some(
      (_, i) =>
        solveSteps(
          s,
          b.clues.filter((__, j) => j !== i),
        ).done,
    )
  )
    return false;
  return (b.eventItem ? b.having! : b.solution).includes(b.event);
}

/**
 * Draws a board: friends from the cast, a place for each, every true clue of the level's kinds, then clues taken away at random
 * while the exact solver still finds one answer. A board that misses the plan (`fits`) is redrawn. Direct clues are told first.
 */
export function makeBoard(plan: Plan, rng: Rng): Board {
  for (let n = 0; n < 500; n++) {
    const friends = rng.shuffle([...plan.cast]).slice(0, plan.friends);
    const places =
      plan.placePool.length > plan.places
        ? rng.shuffle([...plan.placePool]).slice(0, plan.places)
        : [...plan.placePool];
    const solution = rng.shuffle([...places.keys()]).slice(0, friends.length);
    // Level 8's times keep their order; level 5's items and level 7's snacks are shuffled.
    const items = plan.items && (plan.times ? [...plan.items] : rng.shuffle([...plan.items]));
    const having = items && rng.shuffle([...items.keys()]);
    const s: Shape = items
      ? { rows: friends.length, cols: places.length, blocks: plan.case ? 3 : 2 }
      : { rows: friends.length, cols: places.length };
    let clues: Clue[] = [];
    for (let k = 0; k < blocksOf(s); k++) {
      const at = truthOf(k, solution, having ?? []);
      const block = k ? { block: k as 1 | 2 } : {};
      for (let f = 0; f < s.rows; f++) {
        for (let p = 0; p < s.cols; p++) {
          // Block 2's rows are snacks, so its clues name no friend and wear no hat.
          const hat =
            k < 2 && (plan.hats === true || (plan.hats === 'some' && rng.chance(0.5)))
              ? { hat: true as const }
              : {};
          if (p === at[f] && plan.kinds.includes('direct'))
            clues.push({ kind: 'direct', friend: f, place: p, ...hat, ...block });
          if (p !== at[f] && plan.kinds.includes('not'))
            clues.push({ kind: 'not', friend: f, place: p, ...hat, ...block });
        }
      }
    }
    const hat = () =>
      plan.hats === true || (plan.hats === 'some' && rng.chance(0.5)) ? { hat: true as const } : {};
    // This-or-that clues are about friends: their places, and (level 7) their snacks too.
    for (let k = 0; k < (plan.case ? 2 : 1); k++) {
      const at = k ? having! : solution;
      const block = k ? { block: 1 as const } : {};
      if (plan.kinds.includes('either')) {
        for (let f = 0; f < s.rows; f++)
          for (let p = 0; p < s.cols; p++)
            if (p !== at[f])
              clues.push({
                kind: 'either',
                friend: f,
                ...(rng.chance(0.5) ? { place: p, or: at[f] } : { place: at[f], or: p }),
                ...hat(),
                ...block,
              });
      }
      if (plan.kinds.includes('neither')) {
        for (let p = 0; p < s.cols; p++)
          for (let f = 0; f < s.rows; f++)
            for (let g = f + 1; g < s.rows; g++)
              if (at[f] !== p && at[g] !== p)
                clues.push({
                  kind: 'neither',
                  ...(rng.chance(0.5) ? { friend: f, nor: g } : { friend: g, nor: f }),
                  place: p,
                  ...block,
                });
      }
    }
    if (having && plan.kinds.includes('apart')) {
      for (let p = 0; p < s.cols; p++)
        for (let t = 0; t < s.cols; t++)
          if (solution.indexOf(p) !== having.indexOf(t)) clues.push({ kind: 'apart', place: p, item: t });
    }
    if (plan.kinds.includes('order')) {
      // Level 8: every true "before", and "right after" or "two after" where the gap is one or two.
      for (let f = 0; f < s.rows; f++) {
        for (let g = 0; g < s.rows; g++) {
          const gap = having![g] - having![f];
          if (gap <= 0) continue;
          clues.push({ kind: 'order', friend: f, later: g });
          if (gap <= 2) clues.push({ kind: 'order', friend: f, later: g, by: gap as 1 | 2 });
        }
      }
    }
    if (plan.kinds.includes('pair')) {
      // Of a friend and the friend at another place, one came at each of their two times (said in either order).
      for (let f = 0; f < s.rows; f++) {
        for (let p = 0; p < s.cols; p++) {
          const g = solution.indexOf(p);
          if (g === f || g < 0) continue;
          clues.push({
            kind: 'pair',
            friend: f,
            place: p,
            time: Math.min(having![f], having![g]),
            or: Math.max(having![f], having![g]),
          });
        }
      }
    }
    if (plan.times) {
      // Level 8, after ZebraLogic: clues in random order (the new kinds first, so the level shows them) until one answer is
      // left, then each one dropped that the answer no longer needs.
      const fresh = (c: Clue) => c.kind === 'order' || c.kind === 'pair';
      const pool = rng.shuffle([...clues]);
      const first: Clue[] = pool.filter(fresh).slice(0, 3);
      const kept: Clue[] = [];
      let left = countSolutions(s, kept, Infinity);
      for (const c of [...first, ...pool.filter((c) => !first.includes(c))]) {
        if (left === 1) break;
        const n = countSolutions(s, [...kept, c], Infinity);
        if (n < left) [left] = [n, kept.push(c)];
      }
      clues = kept;
      for (const c of rng.shuffle([...clues])) {
        const rest = clues.filter((x) => x !== c);
        if (countSolutions(s, rest) === 1) clues = rest;
      }
    } else {
      for (const c of rng.shuffle([...clues])) {
        const rest = clues.filter((x) => x !== c);
        if (solutions(s, rest).length === 1) clues = rest;
      }
    }
    const order: Record<Kind, number> = {
      direct: 0,
      not: 1,
      apart: 2,
      either: 3,
      neither: 4,
      order: 5,
      pair: 6,
    };
    clues.sort((a, b) => order[a.kind] - order[b.kind]);
    const eventItem = !!having && rng.chance(0.5);
    const board: Board = {
      friends,
      places,
      solution,
      clues,
      event: rng.pick(eventItem ? having! : solution),
      thing: plan.thing,
    };
    if (items)
      Object.assign(
        board,
        { items, having },
        eventItem ? { eventItem: true } : {},
        plan.case ? { case: true } : {},
        plan.times ? { times: true } : {},
      );
    if (plan.hats) board.hats = rng.shuffle([...HATS.keys()].slice(0, friends.length));
    if (fits(plan, board)) return board;
  }
  throw new Error(`logic-grid: no board for level ${plan.level}`);
}

export const makeRound = (plan: Plan, rng: Rng): Board[] =>
  Array.from({ length: plan.boards }, () => makeBoard(plan, rng));

/** The clues (by index) a mark goes against all by itself: a yes where one says no, or a no where one says yes. */
export function contradicts(b: Board, square: number, mark: Mark): number[] {
  if (mark === EMPTY) return [];
  const s = shapeOf(b);
  return b.clues.flatMap((c, i) =>
    decides(s, c).some((d) => d.square === square && d.mark !== mark) ? [i] : [],
  );
}

/** Her own yes squares. */
export const yeses = (marks: Marks) => marks.flatMap((m, i) => (m === FILLED ? [i] : []));

/** Solved: her yes squares are exactly each friend's place (and item). */
export function solved(b: Board, marks: Marks): boolean {
  const s = shapeOf(b);
  const want = solutionMarks(b);
  const y = yeses(marks);
  return y.length === b.friends.length * blocksOf(s) && y.every((i) => want[i] === FILLED);
}

/** Full but wrong: every friend has exactly one yes in each block, and they are not the answer. */
export function fullWrong(b: Board, marks: Marks): boolean {
  const s = shapeOf(b);
  const y = yeses(marks);
  const full = [...Array(blocksOf(s)).keys()].every((k) =>
    [...Array(s.rows).keys()].every(
      (f) => y.filter((i) => blockOf(s, i) === k && rowOf(s, i) === f).length === 1,
    ),
  );
  return full && !solved(b, marks);
}

/** For a full grid, the first clue it breaks, or -1 when it breaks none (two friends in one place). */
export function brokenClue(b: Board, marks: Marks): number {
  const s = shapeOf(b);
  const y = yeses(marks);
  const pick = (k: number) =>
    [...Array(s.rows).keys()].map((f) =>
      colOf(
        s,
        y.find((i) => blockOf(s, i) === k && rowOf(s, i) === f)!,
      ),
    );
  const a = pick(0),
    h = blocksOf(s) > 1 ? pick(1) : [];
  const broken = b.clues.findIndex((c) => !holds(c, a, h));
  if (broken >= 0 || blocksOf(s) < 3) return broken;
  // Level 7: the snack × place block can disagree with the other two; the first clue its own answer breaks.
  const z = pick(2);
  return b.clues.findIndex((c) => {
    // Level 8's pair: the place's time in this block must be one of the two.
    if (c.kind === 'pair') return z.indexOf(c.place) !== c.time && z.indexOf(c.place) !== c.or;
    return 'block' in c && c.block === 2 && !holds(c, z, [...z.keys()]);
  });
}

/** Her marks that disagree with the answer (a wrong yes, or a no on a friend's place). */
export function wrongSquares(b: Board, marks: Marks): number[] {
  const want = solutionMarks(b);
  return marks.flatMap((m, i) => (m !== EMPTY && m !== want[i] ? [i] : []));
}

/**
 * Help's next square: the rule solver's first clue or last-place step that the grid does not already show, reading only her
 * right marks (and the crosses they make), so a wrong mark never sends it astray. Null once solved.
 */
export function nextStep(b: Board, marks: Marks): Step | null {
  if (solved(b, marks)) return null;
  const s = shapeOf(b);
  const wrong = new Set(wrongSquares(b, marks));
  const right = shown(
    s,
    marks.map((m, i) => (wrong.has(i) ? EMPTY : m)),
  );
  const steps = solveSteps(s, b.clues).steps;
  const next = steps.find((st) => st.why !== 'cross' && right[st.square].mark !== st.mark);
  if (next) return next;
  // Every friend's yes is down but a wrong yes is left: the solver's own step for that square (a no) clears it.
  return steps.find((st) => wrong.has(st.square) && marks[st.square] === FILLED) ?? null;
}

/** Help's mark: clears her wrong marks and puts the step's mark down. */
export function applyStep(b: Board, marks: Marks, st: Step): Mark[] {
  const wrong = new Set(wrongSquares(b, marks));
  const out = marks.map((m, i) => (wrong.has(i) ? EMPTY : m));
  out[st.square] = st.mark;
  return out;
}
