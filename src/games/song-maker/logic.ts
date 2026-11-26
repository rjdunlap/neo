import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

export type SongMode = 'free' | 'ghost' | 'card' | 'pattern' | 'listen' | 'wake' | 'compose' | 'answer';

export interface SongPlan {
  mode: SongMode;
  cols: number;
  rows: number;
  /** ghost and card: how many notes the song has. Free play: taps before the round ends. Wake: lights before it ends. Compose: jellies lit before the check can wake. */
  notes: number;
  /** listen: how many shadow choices each beat offers (default: none, all rows open). */
  choices?: number;
  name: string;
}

export const SONG_PLANS: SongPlan[] = [
  {
    mode: 'free',
    cols: 4,
    rows: 3,
    notes: 12,
    name: 'Tap jellies on a 4-beat loop and hear the song go round',
  },
  { mode: 'free', cols: 6, rows: 4, notes: 14, name: 'Make any song on a bigger 6-beat loop' },
  { mode: 'ghost', cols: 4, rows: 3, notes: 3, name: 'Copy a 3-note song by tapping its shadows' },
  { mode: 'ghost', cols: 6, rows: 4, notes: 5, name: 'Copy a 5-note song by tapping its shadows' },
  { mode: 'card', cols: 6, rows: 4, notes: 5, name: 'Copy a 5-note song from a little card' },
  {
    mode: 'pattern',
    cols: 8,
    rows: 5,
    notes: 4,
    name: 'Continue a named song pattern: stairs, hops, zigzags, arches and leaps',
  },
  { mode: 'listen', cols: 4, rows: 3, notes: 4, name: 'Listen, then find each note of a 4-note tune by ear' },
  // Level 8, lap's first (see `order`): one big jelly, a touch anywhere lights the nearest, and friends wake as she lights them.
  {
    mode: 'wake',
    cols: 4,
    rows: 3,
    notes: 12,
    name: 'One big jelly on a 4-beat loop; any touch lights the nearest, and more jellies wake',
  },
  // Level 9, My song: any song on a 6-beat loop; the check button wakes once enough jellies have played a full loop.
  {
    mode: 'compose',
    cols: 6,
    rows: 4,
    notes: 3,
    name: 'Make your own song on a 6-beat loop, then press the check to hear it once more',
  },
  // Level 10, Answer my song: the pet's 4-note question fills beats 1-4; she answers with one jelly on each of beats 5-8.
  {
    mode: 'answer',
    cols: 8,
    rows: 4,
    notes: 4,
    name: "Answer the pet's 4-note question with a note on each of the next four beats",
  },
  // Level 11, Finish my song: the pet's 2-note opening from the motif pool fills beats 1-2; she finishes with one jelly on each of beats 3-4.
  {
    mode: 'answer',
    cols: 4,
    rows: 3,
    notes: 2,
    name: "Finish the pet's 2-note song with a note on each of the last two beats",
  },
  // Level 12, Two to choose: level 7's heard tune on 4x3, with two shadow choices on each beat (pre-K entry before 7).
  {
    mode: 'listen',
    cols: 4,
    rows: 3,
    notes: 4,
    choices: 2,
    name: 'Listen, then pick each note of a 4-note tune from two shadows',
  },
];

/** Answer my song: the first beat (column) of her answer; beats before it are the pet's question. */
export const ANSWER_FROM = 4;

/** The first beat (column) she fills in an answer/finish level; beats before it are the pet's given opening. */
export const answerFrom = (plan: SongPlan) => plan.cols - plan.notes;

/**
 * The pet's questions: four beats, one row each (row 0 is the top, highest), eight authored. Each uses at least two
 * different rows, and they start and end in different places so no two questions sound alike.
 */
export const QUESTIONS: readonly (readonly number[])[] = [
  [3, 2, 1, 2],
  [3, 3, 2, 1],
  [2, 1, 0, 1],
  [3, 1, 2, 3],
  [0, 1, 2, 2],
  [2, 2, 1, 0],
  [3, 2, 3, 1],
  [1, 2, 3, 2],
];

export const songPlan = (level: number) =>
  SONG_PLANS[Math.max(0, Math.min(SONG_PLANS.length - 1, level - 1))];

/** Scale steps for each row, top row highest, so higher on screen always sounds higher. */
export const ROW_STEPS: Record<number, number[]> = {
  3: [5, 2, 0],
  4: [7, 5, 2, 0],
  5: [7, 5, 4, 2, 0],
};

/** A note in the grid: which beat (column) and which pitch (row, 0 = top). */
export interface Note {
  col: number;
  row: number;
}

export const key = (n: Note) => `${n.col}:${n.row}`;

/** Repeating shapes for the pattern level, one row per beat of a 4-beat bar (row 0 = top). Each is named aloud before play (`song.pattern.<id>`). */
export const PATTERNS = [
  { id: 'stairs-up', name: 'stairs up', rows: [4, 3, 2, 1] },
  { id: 'stairs-down', name: 'stairs down', rows: [0, 1, 2, 3] },
  { id: 'zigzag', name: 'zigzag', rows: [4, 2, 4, 2] },
  { id: 'hop', name: 'hop', rows: [3, 1, 3, 1] },
  { id: 'twins', name: 'twins', rows: [4, 4, 1, 1] },
  { id: 'arch', name: 'arch', rows: [4, 2, 0, 2] },
  { id: 'valley', name: 'valley', rows: [0, 2, 4, 2] },
  { id: 'climb-rest', name: 'climb and rest', rows: [4, 3, 2, 2] },
  { id: 'big-leap', name: 'big leap', rows: [4, 0, 4, 0] },
  { id: 'step-back', name: 'step back', rows: [4, 3, 4, 2] },
] as const;
export type PatternId = (typeof PATTERNS)[number]['id'];

/** Authored beats: null is a deliberate rest, never shuffled or filled in. Rows run high to low.
 * Adjacent notes repeat or step, with at most one larger jump; eight of each twelve return home.
 */
export const MOTIFS = {
  3: [
    [2, 1, 2, null],
    [2, null, 1, 2],
    [null, 0, 1, 2],
    [0, 1, null, 2],
    [1, 1, 2, null],
    [1, null, 2, 2],
    [null, 1, 0, 2],
    [2, 1, null, 2],
    [2, 1, 0, null],
    [2, null, 2, 1],
    [null, 0, 0, 1],
    [0, 1, null, 1],
  ],
  4: [
    [3, 2, 1, 2, 3, null],
    [3, 2, null, 2, 3, 3],
    [null, 1, 2, 2, 3, 3],
    [1, 2, 3, null, 2, 3],
    [3, 3, 2, 2, null, 3],
    [2, null, 1, 2, 3, 3],
    [null, 3, 1, 2, 2, 3],
    [3, 1, 1, null, 2, 3],
    [3, 2, 1, 0, 1, null],
    [3, null, 3, 2, 1, 1],
    [null, 0, 1, 1, 2, 2],
    [1, 2, null, 3, 2, 1],
  ],
} as const;

/** Previous three authored rounds are excluded; no save field or cross-profile history. */
export const MOTIF_WINDOW = 3;

/** Finish my song: unique two-note openings drawn from the 3-row motif pool (first two sung notes, on beats 1–2). */
export const OPENINGS: readonly (readonly [number, number])[] = Array.from(
  new Map(
    MOTIFS[3].map((beats) => {
      const pair = beats.filter((r) => r !== null).slice(0, 2) as [number, number];
      return [pair.join(','), pair] as const;
    }),
  ).values(),
);

export interface Song {
  /** Authored content identity (shape plus pool index), for the short repeat window. */
  motif?: string;
  /** The whole song. */
  notes: Note[];
  /** Notes already placed for her (the first bar of a pattern). */
  given: Note[];
  /** Candidate shadows for a listen level with choices (including each beat's right note). */
  candidates?: Note[];
  /** The pattern level's shape, named aloud before play. */
  pattern?: PatternId;
}

/** A song for one round. Every note has its own column, and a song never sits on a single pitch. */
export function makeSong(plan: SongPlan, rng: Rng, recent: readonly string[] = []): Song {
  if (plan.mode === 'free' || plan.mode === 'wake' || plan.mode === 'compose')
    return { notes: [], given: [] };
  if (plan.mode === 'answer') {
    if (plan.cols === 4) {
      const choices = OPENINGS.map((_, i) => `o:${i}`).filter(
        (id) => !recent.slice(-MOTIF_WINDOW).includes(id),
      );
      const id = rng.pick(choices);
      const given = OPENINGS[Number(id.slice(2))].map((row, col) => ({ col, row }));
      return { notes: [], given, motif: id };
    }
    const choices = QUESTIONS.map((_, i) => `q:${i}`).filter(
      (id) => !recent.slice(-MOTIF_WINDOW).includes(id),
    );
    const id = rng.pick(choices);
    const given = QUESTIONS[Number(id.slice(2))].map((row, col) => ({ col, row }));
    return { notes: [], given, motif: id };
  }
  if (plan.mode === 'pattern') {
    const p = rng.pick(PATTERNS);
    const notes = Array.from({ length: plan.cols }, (_, col) => ({ col, row: p.rows[col % p.rows.length] }));
    return { notes, given: notes.slice(0, 4), pattern: p.id };
  }
  if (plan.mode === 'ghost' || plan.mode === 'card') {
    const pool = MOTIFS[plan.rows as keyof typeof MOTIFS];
    const choices = pool
      .map((beats, index) => ({ beats, id: `${plan.rows}:${index}` }))
      .filter(({ id }) => !recent.slice(-MOTIF_WINDOW).includes(id));
    const motif = rng.pick(choices);
    return {
      notes: motif.beats.flatMap((row, col) => (row === null ? [] : [{ col, row }])),
      given: [],
      motif: motif.id,
    };
  }
  const count = plan.mode === 'listen' ? plan.cols : plan.notes;
  for (;;) {
    const cols = rng
      .shuffle(Array.from({ length: plan.cols }, (_, i) => i))
      .slice(0, count)
      .sort((a, b) => a - b);
    const notes = cols.map((col) => ({ col, row: rng.int(0, plan.rows - 1) }));
    if (new Set(notes.map((n) => n.row)).size > 1) {
      if (!plan.choices) return { notes, given: [] };
      const candidates = notes.flatMap((n) => {
        const others = rng.shuffle(
          Array.from({ length: plan.rows }, (_, row) => row).filter((row) => row !== n.row),
        );
        return [n, ...others.slice(0, plan.choices! - 1).map((row) => ({ col: n.col, row }))].sort(
          (a, b) => a.row - b.row,
        );
      });
      return { notes, given: [], candidates };
    }
  }
}

/** Which note belongs in a column, if any. */
export const noteAt = (song: Song, col: number) => song.notes.find((n) => n.col === col);

/**
 * The notes the ghost finger lights in free play, in the order it taps them: a tune climbing the rows beat by beat, then a
 * second voice over it, then a third, so the song grows left to right in layers. All different spots, `plan.notes` of them.
 */
export function freeSong(plan: SongPlan): Note[] {
  const out: Note[] = [];
  for (let layer = 0; layer < plan.rows; layer++)
    for (let col = 0; col < plan.cols; col++)
      out.push({ col, row: (plan.rows - 1 - (col % plan.rows) + layer) % plan.rows });
  return out.slice(0, plan.notes);
}

/**
 * The spot a capable child taps next, or null when there is nothing left to do: in free play the next note of her song
 * that is not lit yet, and when copying, the first note of the song that is not placed (the shadow, the card's next note,
 * the pattern's next beat, or the tune heard), always a right one.
 */
export function beadToTap(plan: SongPlan, song: Song, placed: ReadonlySet<string>): Note | null {
  // Wake: the next spot in the order it wakes; the ghost finger only ever lights, so each one is awake by its turn.
  if (plan.mode === 'wake') return awakeSpots(placed.size).find((n) => !placed.has(key(n))) ?? null;
  if (plan.mode === 'answer') return answerBot(song, plan).find((n) => !placed.has(key(n))) ?? null;
  const notes = plan.mode === 'free' || plan.mode === 'compose' ? freeSong(plan) : song.notes;
  return notes.find((n) => !placed.has(key(n))) ?? null;
}

/** Answer/Finish my song: the ghost finger's reply, one jelly a beat, a step off each given note (wrapping within `plan.rows`) so it is a reply, not an echo. */
export const answerBot = (song: Song, plan: SongPlan = songPlan(10)): Note[] =>
  song.given.map((n, i) => ({ col: answerFrom(plan) + i, row: (n.row + 1) % plan.rows }));

/** Answer my song: the check is awake once every answer beat holds a jelly and all eight beats have played since her last change. */
export const answerReady = (plan: SongPlan, answered: number, beatsSinceChange: number) =>
  answered >= plan.notes && beatsSinceChange >= plan.cols;

/** Answer my song: the jelly a tap at `note` leaves lit in its beat. A beat holds one, so a tap moves it, and a tap on the lit one puts it out. */
export function answerTap(lit: readonly Note[], note: Note): Note[] {
  const rest = lit.filter((n) => n.col !== note.col);
  return lit.some((n) => n.col === note.col && n.row === note.row) ? rest : [...rest, note];
}

/**
 * Wake level: the order the spots wake in, low row first (beat 1, then 3, then 2 and 4), then the middle row, then the top,
 * and how many lights each waits for. Spot k wakes by light k, so an unlit awake spot is always there until all are lit.
 */
export const WAKE_ORDER: readonly Note[] = [2, 1, 0].flatMap((row) =>
  [0, 2, 1, 3].map((col) => ({ col, row })),
);
export const WAKE_AT = [0, 1, 2, 2, 4, 4, 5, 5, 7, 7, 8, 8];

/** The spots awake after `lights` counted lights. Putting a jelly out never takes one back, so the count only grows. */
export const awakeSpots = (lights: number): Note[] => WAKE_ORDER.filter((_, k) => lights >= WAKE_AT[k]);

/**
 * What a touch at (x, y) does on the wake level, given where each awake spot sits and which are lit. A touch inside a lit
 * jelly's own cell (within `reach`) puts it out, as on the other levels; any other touch lights the unlit awake spot nearest
 * the finger. When every awake spot is lit, the nearest one just sings.
 */
export function wakeTouch(
  spots: readonly { note: Note; x: number; y: number; lit: boolean }[],
  x: number,
  y: number,
  reach: number,
): { note: Note; act: 'light' | 'out' | 'sing' } | null {
  const d = (s: { x: number; y: number }) => Math.hypot(s.x - x, s.y - y);
  const nearest = (list: typeof spots) =>
    list.reduce<(typeof spots)[number] | null>((best, s) => (!best || d(s) < d(best) ? s : best), null);
  const near = nearest(spots);
  if (!near) return null;
  if (near.lit && Math.abs(near.x - x) <= reach && Math.abs(near.y - y) <= reach)
    return { note: near.note, act: 'out' };
  const unlit = nearest(spots.filter((s) => !s.lit));
  return unlit ? { note: unlit.note, act: 'light' } : { note: near.note, act: 'sing' };
}

/**
 * My song: whether the check button is awake. At least `plan.notes` jellies are lit and the loop has played a whole round
 * (`plan.cols` beats) since her last change, so what she checks is what she has just heard. Any taps leave it either asleep
 * or awake, never a mistake.
 */
export const composeReady = (plan: SongPlan, lit: number, beatsSinceChange: number) =>
  lit >= plan.notes && beatsSinceChange >= plan.cols;

/** One block of the grid: beats `from`..`from + cols - 1` drawn at `cell` from (x0, y0). A block that is not `tappable` is a shown, given bar. */
export interface SongBar {
  from: number;
  cols: number;
  x0: number;
  y0: number;
  cell: number;
  tappable: boolean;
}

/** Where the grid sits in a view: the main (played) block's cell size and top-left corner, every block, and the card and replay button spots. */
export interface SongLayout {
  cell: number;
  x0: number;
  y0: number;
  bars: SongBar[];
  card: { x: number; y: number };
  replay: { x: number; y: number };
}

/** The block a beat's column sits in. */
export const barOf = (lay: SongLayout, col: number): SongBar =>
  lay.bars.find((b) => col >= b.from && col < b.from + b.cols) ?? lay.bars[0];

/** The upright pattern level's first bar (the four given beats) is drawn small above the board she plays: cell size. */
export const GIVEN_CELL = 50;

/**
 * The grid's place. Sideways: clear of the pet on the left (and of the card at the card level), the replay button on the
 * right at the listening level, and the top corner buttons; cells grow to at most 150. Upright (chunk 31): the board takes
 * the width under the card or replay button, cells up to 180, clear of Home above and the guide's corner below; the
 * 8-beat pattern level cannot fit 8 columns of 100 on 768, so its first bar (given, never tapped) sits small above the four
 * beats she fills in. Every tappable cell is a whole touch target.
 */
export function songLayout(plan: SongPlan, v: { w: number; h: number; upright?: boolean }): SongLayout {
  if (v.upright) {
    const card = { x: v.w / 2, y: 130 };
    const replay = { x: v.w - 80, y: 130 };
    if (plan.mode === 'pattern' || (plan.mode === 'answer' && plan.cols > 4)) {
      const half = plan.cols / 2;
      const top = 40 + GIVEN_CELL * plan.rows + 40;
      const cell = Math.min(180, (v.w - 48) / half, (v.h - 170 - 14 - top) / plan.rows);
      const x0 = (v.w - cell * half) / 2;
      const gx = (v.w - GIVEN_CELL * half) / 2;
      return {
        cell,
        x0,
        y0: top,
        bars: [
          { from: 0, cols: half, x0: gx, y0: 40, cell: GIVEN_CELL, tappable: false },
          { from: half, cols: half, x0, y0: top, cell, tappable: true },
        ],
        card,
        replay,
      };
    }
    const left = 24;
    const right = v.w - 24;
    const top = 240;
    const bottom = v.h - 170 - 14;
    const cell = Math.min((right - left) / plan.cols, (bottom - top) / plan.rows, 180);
    const x0 = left + (right - left - cell * plan.cols) / 2;
    const y0 = top + (bottom - top - cell * plan.rows) / 2;
    return {
      cell,
      x0,
      y0,
      bars: [{ from: 0, cols: plan.cols, x0, y0, cell, tappable: true }],
      card,
      replay,
    };
  }
  const bottomCheck = plan.mode === 'answer' && plan.cols > 6;
  const sideCheck =
    plan.mode === 'listen' || plan.mode === 'compose' || (plan.mode === 'answer' && !bottomCheck);
  const left = plan.mode === 'card' ? v.w * 0.36 : 175;
  const right = v.w - (sideCheck ? 130 : 40);
  const top = 130;
  // The 8-beat answer board keeps the narrow margin, so its check sits in the row under the board instead.
  const bottom = v.h - (bottomCheck ? 130 : 40);
  const cell = Math.min((right - left) / plan.cols, (bottom - top) / plan.rows, 150);
  const x0 = left + (right - left - cell * plan.cols) / 2;
  const y0 = top + (bottom - top - cell * plan.rows) / 2;
  return {
    cell,
    x0,
    y0,
    bars: [{ from: 0, cols: plan.cols, x0, y0, cell, tappable: true }],
    card: { x: v.w * 0.18, y: v.h * 0.4 },
    replay: { x: v.w - 70, y: bottomCheck ? v.h - 62 : v.h / 2 },
  };
}

export const LEVELS: BandLevels = {
  // Level 8 (one big jelly that answers anywhere) is the easiest, so lap plays it first, then 1 and 2.
  lap: { min: 1, max: 8, order: [8, 1, 2] },
  toddler: { min: 2, max: 4 },
  // Level 11 (Finish my song) opens guided composing after the first copy level in preschool and pre-K; level 9 (My song) comes last.
  preschool: { min: 4, max: 11, order: [4, 11, 5, 6, 9] },
  // Level 12 (Two to choose) gives pre-K an easier ear entry right before level 7.
  prek: { min: 5, max: 12, order: [5, 11, 6, 12, 7, 9] },
  // Level 10 (Answer my song) is school only until a person check says pre-K can hold the 8-beat board.
  school: { min: 6, max: 10, order: [6, 7, 9, 10] },
};
