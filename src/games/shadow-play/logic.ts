import type { BandLevels } from '../../progress/difficulty';

/**
 * Shadow Play's light model and rules (docs/definitions/shadow-play.md). A point lamp, three flat cut-outs on rails and
 * a screen 12 marks away: a cut-out at mark d casts a shadow 12 ÷ d times its size. Everything here is exact and
 * Pixi-free; the pools are never stored, a board is sampled by rejection and the tests re-derive the pool counts.
 */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };

const descriptions = [
  'Near and far: the lamp is lit; slide three cut-outs along their rails until the shadow fills the outline',
  'Lamp out: work out each cut-out’s mark from the grid, then light the lamp to check',
  'Turn it: use the height to find the mark and turn a cut-out to make its shadow half as wide',
  'Which goes where?: swap cut-outs between rails, then set their marks and turns to fill the outline',
];

export const describeLevel = (level: number) => descriptions[level - 1] ?? descriptions[0];

export const SHAPES = ['block', 'tent', 'dome'] as const;
export type Shape = (typeof SHAPES)[number];

export interface Cutout {
  shape: Shape;
  /** Squares wide and tall: 1 or 2. */
  w: number;
  h: number;
}

/** The twelve cut-outs: each shape 1 or 2 squares wide and 1 or 2 tall. */
export const CUTOUTS: readonly Cutout[] = SHAPES.flatMap((shape) =>
  [1, 2].flatMap((w) => [1, 2].map((h) => ({ shape, w, h }))),
);

/** Where a cut-out can stand on its rail, in marks from the lamp. */
export const MARKS = [2, 3, 4, 6] as const;
export type Mark = (typeof MARKS)[number];
/** The screen's distance from the lamp, in marks. */
export const SCREEN_AT = 12;
/** The screen's grid, in squares, and each rail's spot on its bottom line. */
export const GRID_W = 24;
export const GRID_H = 12;
export const SPOTS = [6, 12, 18] as const;
export const RAILS = ['left', 'middle', 'right'] as const;
export type RailName = (typeof RAILS)[number];

/** How many times its size a cut-out's shadow is at a distance from the lamp (any distance, so a slide can show it). */
export const scaleAt = (distance: number) => SCREEN_AT / distance;

/** One rail's cut-out, where it stands and whether it is turned on its stick (60° to the screen: half as wide). */
export interface Placed {
  cutout: Cutout;
  mark: number;
  turned: boolean;
}
/** One `Placed` per rail, left to right. */
export type Arrangement = readonly Placed[];

/** A shadow part's size in squares. */
export function part({ cutout, mark, turned }: Placed) {
  const k = scaleAt(mark);
  return { shape: cutout.shape, w: (cutout.w * k) / (turned ? 2 : 1), h: cutout.h * k };
}

/** A part's height at `x` squares from the screen's left edge, the part centred on its rail's spot. */
export function partHeight(placed: Placed, rail: number, x: number): number {
  const { shape, w, h } = part(placed);
  const t = Math.abs(x - SPOTS[rail]) / (w / 2);
  if (t >= 1) return 0;
  return shape === 'block' ? h : shape === 'tent' ? h * (1 - t) : h * Math.sqrt(1 - t * t);
}

/** The whole shadow's height at `x`: the tallest part there. */
export const shadowHeight = (arr: Arrangement, x: number) =>
  Math.max(...arr.map((placed, rail) => partHeight(placed, rail, x)));

/** The columns two shadows are compared at: the middle of each quarter-square along the bottom line. */
export const COLUMNS = GRID_W * 4;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

const partCache = new Map<string, Float64Array>();
function partProfile(placed: Placed, rail: number): Float64Array {
  const { cutout, mark, turned } = placed;
  const key = `${rail}${cutout.shape}${cutout.w}${cutout.h}@${mark}${turned ? 't' : ''}`;
  let out = partCache.get(key);
  if (!out) {
    out = new Float64Array(COLUMNS);
    for (let i = 0; i < COLUMNS; i++) out[i] = round4(partHeight(placed, rail, (i + 0.5) / 4));
    partCache.set(key, out);
  }
  return out;
}

/** The shadow as the rules compare it: its height at each column, to four decimal places. */
export function profile(arr: Arrangement): Float64Array {
  const parts = arr.map(partProfile);
  const out = new Float64Array(COLUMNS);
  for (let i = 0; i < COLUMNS; i++) for (const p of parts) if (p[i] > out[i]) out[i] = p[i];
  return out;
}

/** Two shadows are the same when they cover the same region of the screen. */
export function sameShadow(a: Arrangement, b: Arrangement): boolean {
  const pa = profile(a);
  const parts = b.map(partProfile);
  for (let i = 0; i < COLUMNS; i++) {
    let h = 0;
    for (const p of parts) if (p[i] > h) h = p[i];
    if (h !== pa[i]) return false;
  }
  return true;
}

/** Filter: every part's width and height is a whole number of squares, so every edge sits on a grid line. */
export const wholeSquares = (arr: Arrangement) =>
  arr.every((placed) => {
    const { w, h } = part(placed);
    return Number.isInteger(w) && Number.isInteger(h);
  });

const pairWidths = (arr: Arrangement) => [0, 1].map((i) => part(arr[i]).w + part(arr[i + 1]).w);
/** Neither neighbouring pair of parts touches. */
export const apart = (arr: Arrangement) => pairWidths(arr).every((sum) => sum < SCREEN_AT);
/** Both neighbouring pairs touch or overlap. */
export const joined = (arr: Arrangement) => pairWidths(arr).every((sum) => sum >= SCREEN_AT);

const turns = (level: number) => (level >= 3 ? [false, true] : [false]);

function settingsFor(level: number, cutout: Cutout): Placed[] {
  return MARKS.flatMap((mark) => turns(level).map((turned) => ({ cutout, mark, turned })));
}

const railOrders = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function cutoutOrders(level: number, cutouts: readonly Cutout[]) {
  return level === 4 ? railOrders.map((order) => order.map((i) => cutouts[i])) : [cutouts];
}

/** Every setting of the board's cut-outs available at this level, including all six orders at level 4. */
export function* openArrangements(cutouts: readonly Cutout[], level = 2): Generator<Arrangement> {
  for (const [a, b, c] of cutoutOrders(level, cutouts))
    for (const left of settingsFor(level, a))
      for (const middle of settingsFor(level, b))
        for (const right of settingsFor(level, c)) yield [left, middle, right];
}

/** A part can only contribute to this outline if it stays inside it. Record where it fills the outline to the edge. */
function coverage(target: Float64Array, part: Float64Array): Uint32Array | null {
  const mask = new Uint32Array(COLUMNS / 32);
  for (let i = 0; i < COLUMNS; i++) {
    if (part[i] > target[i]) return null;
    if (part[i] === target[i]) mask[i >>> 5] |= 1 << (i & 31);
  }
  return mask;
}

/** Only one combination of legal settings can both stay inside and fill the entire outline. */
export function oneAnswer(solution: Arrangement, level = 2): boolean {
  const target = profile(solution);
  const cutouts = solution.map((p) => p.cutout);
  const masks = SPOTS.map(
    (_, rail) =>
      new Map(
        [...new Set(cutouts)].map((cutout) => [
          cutout,
          settingsFor(level, cutout)
            .map((p) => coverage(target, partProfile(p, rail)))
            .filter((mask) => mask !== null),
        ]),
      ),
  );
  let answers = 0;
  for (const [a, b, c] of cutoutOrders(level, cutouts))
    for (const left of masks[0].get(a)!)
      for (const middle of masks[1].get(b)!)
        for (const right of masks[2].get(c)!)
          if (left.every((bits, i) => (bits | middle[i] | right[i]) === -1) && ++answers > 1) return false;
  return answers === 1;
}

function differentCutoutsWithSharedShape(cutouts: readonly Cutout[]) {
  return new Set(cutouts).size === 3 && new Set(cutouts.map((c) => c.shape)).size < 3;
}

/** Pool geometry and allowed cut-outs, before checking the uniqueness of the shadow. */
export function poolCandidate(level: number, solution: Arrangement): boolean {
  const turned = solution.some((p) => p.turned);
  if ((level < 3 && turned) || (level === 3 && !turned) || !wholeSquares(solution)) return false;
  if (level === 1) return apart(solution);
  if (level === 4 && !differentCutoutsWithSharedShape(solution.map((p) => p.cutout))) return false;
  return joined(solution);
}

export const inPool = (level: number, solution: Arrangement) =>
  poolCandidate(level, solution) && oneAnswer(solution, level);

/** Every arrangement the filters consider, ordered by cut-out and rail. */
export function* candidateArrangements(level: number): Generator<Arrangement> {
  const settings = CUTOUTS.flatMap((cutout) => settingsFor(level, cutout));
  for (const a of settings)
    for (const b of settings)
      for (const c of settings) {
        const arr = [a, b, c];
        if (poolCandidate(level, arr)) yield arr;
      }
}

export function* faceOnArrangements(): Generator<Arrangement> {
  for (const a of CUTOUTS)
    for (const b of CUTOUTS) for (const c of CUTOUTS) yield* openArrangements([a, b, c]);
}

export interface Board {
  level: number;
  /** The arrangement whose shadow is the outline. */
  solution: Arrangement;
  /** Where the cut-outs stand when the board opens: each at a mark that is not its solution's. */
  start: Arrangement;
}

interface Picker {
  int(min: number, max: number): number;
}

const sizeCode = ({ shape, w, h }: Cutout) => `${shape}${w}${h}`;

/** The cut-outs, marks and turns identify a board or a submitted arrangement. */
export const boardKey = (arr: Arrangement) =>
  arr.map(({ cutout, mark, turned }) => `${sizeCode(cutout)}@${mark}${turned ? 't' : ''}`).join(' ');

/** Each cut-out starts face-on and away from its own solution mark; level 4 also changes the order. */
export function startFor(solution: Arrangement, rng: Picker, level = 2): Arrangement {
  const start = solution.map((p) => {
    const others = MARKS.filter((mark) => mark !== p.mark);
    return { ...p, turned: false, mark: others[rng.int(0, others.length - 1)] };
  });
  if (level < 4) return start;
  return railOrders[rng.int(1, railOrders.length - 1)].map((i) => start[i]);
}

/** A board sampled evenly from the level's pool (by rejection), never the one named by `avoid`. */
export function boardFor(level: number, rng: Picker, avoid?: string): Board {
  for (;;) {
    const solution: Placed[] = RAILS.map(() => ({
      cutout: CUTOUTS[rng.int(0, CUTOUTS.length - 1)],
      mark: MARKS[rng.int(0, MARKS.length - 1)],
      turned: level >= 3 && rng.int(0, 1) === 1,
    }));
    if (boardKey(solution) === avoid || !inPool(level, solution)) continue;
    return { level, solution, start: startFor(solution, rng, level) };
  }
}

const cut = (shape: Shape, w: number, h: number) =>
  CUTOUTS.find((c) => c.shape === shape && c.w === w && c.h === h) as Cutout;
const board = (level: number, rows: [Cutout, Mark, Mark, boolean?][], swapStart = false): Board => ({
  level,
  solution: rows.map(([cutout, mark, , turned = false]) => ({ cutout, mark, turned })),
  start: (swapStart ? [rows[1], rows[0], rows[2]] : rows).map(([cutout, , mark]) => ({
    cutout,
    mark,
    turned: false,
  })),
});

/**
 * The how-to card's boards. Level 1: only the tent is out of place, and sliding it from mark 6 to mark 3 doubles its
 * shadow. Level 2: a dome 2 wide and 1 tall, a tent and a block 2 by 2, whose outline parts are 4, 6 and 6 tall.
 */
export function demoBoard(level: number): Board {
  if (level === 3) {
    return board(3, [
      [cut('block', 2, 1), 3, 3, true],
      [cut('tent', 2, 2), 2, 2],
      [cut('dome', 2, 2), 4, 4],
    ]);
  }
  if (level === 4) {
    return board(
      4,
      [
        [cut('dome', 2, 1), 3, 3, true],
        [cut('dome', 2, 2), 2, 2],
        [cut('block', 2, 2), 4, 4],
      ],
      true,
    );
  }
  return level === 1
    ? board(1, [
        [cut('block', 1, 1), 4, 4],
        [cut('tent', 1, 2), 3, 6],
        [cut('dome', 1, 1), 6, 6],
      ])
    : board(2, [
        [cut('dome', 2, 1), 3, 6],
        [cut('tent', 2, 2), 4, 2],
        [cut('block', 2, 2), 4, 6],
      ]);
}

/** Boards a round: level 1 plays two, the dark levels one. */
export const boardsPerRound = (level: number) => (level === 1 ? 2 : 1);

/** An arrangement is accepted when its shadow is the outline, whichever arrangement made it. */
export const accepted = (b: Board, arr: Arrangement) => sameShadow(b.solution, arr);

/** The arrangement with one rail's cut-out moved to a mark. Always allowed; nothing is refused. */
export const slide = (arr: Arrangement, rail: number, mark: Mark): Arrangement =>
  arr.map((p, i) => (i === rail ? { ...p, mark } : p));

/** Turn changes the width but leaves the cut-out and its mark in place. */
export const turnCutout = (arr: Arrangement, rail: number): Arrangement =>
  arr.map((p, i) => (i === rail ? { ...p, turned: !p.turned } : p));

/** Swap whole pieces, including their current marks and turns. */
export const swap = (arr: Arrangement, a: number, b: number): Arrangement =>
  arr.map((p, i) => (i === a ? arr[b] : i === b ? arr[a] : p));

/** The mark nearest a distance from the lamp. */
export const nearestMark = (distance: number): Mark =>
  MARKS.reduce((best, mark) => (Math.abs(mark - distance) < Math.abs(best - distance) ? mark : best));

export type Fault = 'shape' | 'tall' | 'short' | 'wide' | 'narrow';

export interface Wrong {
  rail: number;
  fault: Fault;
  /** What stands on the rail, and the outline's part there. */
  placed: Placed;
  want: ReturnType<typeof part>;
}

/** The first rail from the left whose part differs from the outline's, and how. Null when every part is the outline's. */
export function firstWrong(b: Board, arr: Arrangement): Wrong | null {
  for (let rail = 0; rail < arr.length; rail++) {
    const got = part(arr[rail]);
    const want = part(b.solution[rail]);
    const fault: Fault | null =
      got.shape !== want.shape
        ? 'shape'
        : got.h !== want.h
          ? got.h > want.h
            ? 'tall'
            : 'short'
          : got.w !== want.w
            ? got.w > want.w
              ? 'wide'
              : 'narrow'
            : null;
    if (fault) return { rail, fault, placed: arr[rail], want };
  }
  return null;
}

/** Hints settle the rails from left to right, placing a cut-out before setting its mark and turn. */
export type Step =
  | { rail: number; kind: 'mark'; mark: Mark }
  | { rail: number; kind: 'turn' }
  | { rail: number; kind: 'swap'; from: number };

export function hintFor(b: Board, arr: Arrangement): Step | null {
  for (let rail = 0; rail < arr.length; rail++) {
    const got = arr[rail];
    const want = b.solution[rail];
    if (got.cutout !== want.cutout)
      return { rail, kind: 'swap', from: arr.findIndex((p) => p.cutout === want.cutout) };
    if (got.mark !== want.mark) return { rail, kind: 'mark', mark: want.mark as Mark };
    if (got.turned !== want.turned) return { rail, kind: 'turn' };
  }
  return null;
}

/** A hint extends the solved prefix. A swap carries the settings of both pieces to their new rails. */
export function follow(arr: Arrangement, step: Step): Arrangement {
  switch (step.kind) {
    case 'mark':
      return slide(arr, step.rail, step.mark);
    case 'turn':
      return turnCutout(arr, step.rail);
    case 'swap':
      return swap(arr, step.rail, step.from);
  }
}

export const valuesAt = (level: number) => 3 * (level === 4 ? 3 : level === 3 ? 2 : 1);

/** One miss per distinct wrong arrangement lit in a round: true the first time this one is lit. */
export function countsAsMiss(seen: Set<string>, boardAt: number, arr: Arrangement): boolean {
  const key = `${boardAt}:${boardKey(arr)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

/** A cut-out's size line: `shadow.size.tent22`. */
export const sizeLine = (cutout: Cutout) => `shadow.size.${sizeCode(cutout)}`;
/** A miss line: the rail, the fault, the cut-out's shape and height, its mark and the outline's height there. */
export const missLine = ({ rail, fault, placed, want }: Wrong, level: number) =>
  level >= 3
    ? `shadow.check.${RAILS[rail]}.${fault}`
    : `shadow.miss.${RAILS[rail]}.${fault}.${placed.cutout.shape}${placed.cutout.h}.${placed.mark}.${want.h}`;
/** A hint line: the rail, the step, the cut-out's shape and height, and the mark to slide to. */
export const hintLine = (b: Board, step: Step) => {
  const { cutout, mark, turned } = b.solution[step.rail];
  if (step.kind === 'swap') return `shadow.hint.swap.${RAILS[step.rail]}.${sizeCode(cutout)}`;
  if (step.kind === 'turn')
    return `shadow.hint.turn.${RAILS[step.rail]}.${cutout.w * scaleAt(mark)}.${turned ? 'in' : 'out'}`;
  return `shadow.hint.${RAILS[step.rail]}.mark.${cutout.shape}${cutout.h}.${step.mark}`;
};

/** The words of a size, a miss and a hint; `voice.ts` lists every one the pools can produce. */
export const sizeWords = ({ shape, w, h }: Cutout) => `A ${shape}, ${w} wide and ${h} tall.`;
export const missWords = (
  rail: RailName,
  fault: 'tall' | 'short',
  shape: Shape,
  h: number,
  mark: number,
  wantH: number,
) =>
  `The ${rail} shadow is too ${fault}. This ${shape} is ${h} tall at mark ${mark}, so its shadow is ${h * scaleAt(mark)} tall. The outline there is ${wantH} tall.`;
export const hintWords = (rail: RailName, shape: Shape, h: number, mark: Mark) => {
  const k = scaleAt(mark);
  return `The ${rail} outline is ${h * k} tall. This ${shape} is ${h} tall. ${h * k} is ${k} times ${h}, and 12 divided by ${k} is ${mark}. Slide it to mark ${mark}.`;
};
