import type { BandLevels } from '../../progress/difficulty';

/**
 * Shadow Play's light model and rules (docs/definitions/shadow-play.md). A point lamp, three flat cut-outs on rails and
 * a screen 12 marks away: a cut-out at mark d casts a shadow 12 ÷ d times its size. Everything here is exact and
 * Pixi-free; the pools are never stored, a board is sampled by rejection and the tests re-derive the pool counts.
 */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };

export const describeLevel = (level: number) =>
  level === 1
    ? 'Near and far: the lamp is lit; slide three cut-outs along their rails until the shadow fills the outline'
    : 'Lamp out: work out each cut-out’s mark from the grid, then light the lamp to check';

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

/** Every arrangement open to the player at a level, for a board's cut-outs: at levels 1–2, each rail's mark (64). */
export function openArrangements(cutouts: readonly Cutout[]): Arrangement[] {
  let out: Placed[][] = [[]];
  for (const cutout of cutouts)
    out = out.flatMap((sofar) => MARKS.map((mark) => [...sofar, { cutout, mark, turned: false }]));
  return out;
}

const sameSetting = (a: Arrangement, b: Arrangement) =>
  a.every((p, i) => p.mark === b[i].mark && p.turned === b[i].turned && p.cutout === b[i].cutout);

/** Filter: no other arrangement open to the player casts the same shadow. */
export const oneAnswer = (solution: Arrangement) =>
  openArrangements(solution.map((p) => p.cutout)).every(
    (other) => sameSetting(other, solution) || !sameShadow(solution, other),
  );

/** Whether an arrangement is a board of the level's pool. Level 1: face-on and apart. Level 2: face-on, joined, one answer. */
export function inPool(level: number, solution: Arrangement): boolean {
  if (solution.some((p) => p.turned) || !wholeSquares(solution)) return false;
  return level === 1 ? apart(solution) && oneAnswer(solution) : joined(solution) && oneAnswer(solution);
}

/** Every face-on arrangement of three cut-outs, in order: 12³ × 4³. The tests count the pools over these. */
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

/** A stable name for a board's outline and cut-outs, to tell a repeat. */
export const boardKey = (solution: Arrangement) =>
  solution.map(({ cutout, mark }) => `${cutout.shape}${cutout.w}${cutout.h}@${mark}`).join(' ');

/** The start arrangement: each cut-out on its rail, face-on, at a seeded mark that is not its solution mark. */
export function startFor(solution: Arrangement, rng: Picker): Arrangement {
  return solution.map((p) => {
    const others = MARKS.filter((mark) => mark !== p.mark);
    return { ...p, turned: false, mark: others[rng.int(0, others.length - 1)] };
  });
}

/** A board sampled evenly from the level's pool (by rejection), never the one named by `avoid`. */
export function boardFor(level: number, rng: Picker, avoid?: string): Board {
  for (;;) {
    const solution: Placed[] = RAILS.map(() => ({
      cutout: CUTOUTS[rng.int(0, CUTOUTS.length - 1)],
      mark: MARKS[rng.int(0, MARKS.length - 1)],
      turned: false,
    }));
    if (boardKey(solution) === avoid || !inPool(level, solution)) continue;
    return { level, solution, start: startFor(solution, rng) };
  }
}

const cut = (shape: Shape, w: number, h: number) =>
  CUTOUTS.find((c) => c.shape === shape && c.w === w && c.h === h) as Cutout;
const board = (level: number, rows: [Cutout, Mark, Mark][]): Board => ({
  level,
  solution: rows.map(([cutout, mark]) => ({ cutout, mark, turned: false })),
  start: rows.map(([cutout, , mark]) => ({ cutout, mark, turned: false })),
});

/**
 * The how-to card's boards. Level 1: only the tent is out of place, and sliding it from mark 6 to mark 3 doubles its
 * shadow. Level 2: a dome 2 wide and 1 tall, a tent and a block 2 by 2, whose outline parts are 4, 6 and 6 tall.
 */
export const demoBoard = (level: number): Board =>
  level === 1
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

/** Boards a round: level 1 plays two, the dark levels one. */
export const boardsPerRound = (level: number) => (level === 1 ? 2 : 1);

/** An arrangement is accepted when its shadow is the outline, whichever arrangement made it. */
export const accepted = (b: Board, arr: Arrangement) => sameShadow(b.solution, arr);

/** The arrangement with one rail's cut-out moved to a mark. Always allowed; nothing is refused. */
export const slide = (arr: Arrangement, rail: number, mark: Mark): Arrangement =>
  arr.map((p, i) => (i === rail ? { ...p, mark } : p));

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

/** The hint's next step: the first rail from the left whose mark is not the solution's. Null once every value is right. */
export interface Step {
  rail: number;
  kind: 'mark';
  mark: Mark;
}

export function hintFor(b: Board, arr: Arrangement): Step | null {
  for (let rail = 0; rail < arr.length; rail++)
    if (arr[rail].mark !== b.solution[rail].mark)
      return { rail, kind: 'mark', mark: b.solution[rail].mark as Mark };
  return null;
}

/** The arrangement after following a hint: one more value is the solution's, and none is unset. */
export const follow = (arr: Arrangement, step: Step): Arrangement => slide(arr, step.rail, step.mark);

/** The most hints a level can need: one per value the player sets. */
export const valuesAt = (_level: number) => 3;

const settingKey = (arr: Arrangement) => arr.map((p) => `${p.mark}${p.turned ? 't' : ''}`).join(',');

/** One miss per distinct wrong arrangement lit in a round: true the first time this one is lit. */
export function countsAsMiss(seen: Set<string>, boardAt: number, arr: Arrangement): boolean {
  const key = `${boardAt}:${settingKey(arr)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

const sizeCode = ({ shape, w, h }: Cutout) => `${shape}${w}${h}`;
/** A cut-out's size line: `shadow.size.tent22`. */
export const sizeLine = (cutout: Cutout) => `shadow.size.${sizeCode(cutout)}`;
/** A miss line: the rail, the fault, the cut-out's shape and height, its mark and the outline's height there. */
export const missLine = ({ rail, fault, placed, want }: Wrong) =>
  `shadow.miss.${RAILS[rail]}.${fault}.${placed.cutout.shape}${placed.cutout.h}.${placed.mark}.${want.h}`;
/** A hint line: the rail, the step, the cut-out's shape and height, and the mark to slide to. */
export const hintLine = (b: Board, step: Step) => {
  const { cutout } = b.solution[step.rail];
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
