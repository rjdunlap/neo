import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

export type SongMode = 'free' | 'ghost' | 'card' | 'pattern' | 'listen' | 'wake';

export interface SongPlan {
  mode: SongMode;
  cols: number;
  rows: number;
  /** ghost and card: how many notes the song has. Free play: taps before the round ends. Wake: lights before it ends. */
  notes: number;
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

export interface Song {
  /** Authored content identity (shape plus pool index), for the short repeat window. */
  motif?: string;
  /** The whole song. */
  notes: Note[];
  /** Notes already placed for her (the first bar of a pattern). */
  given: Note[];
  /** The pattern level's shape, named aloud before play. */
  pattern?: PatternId;
}

/** A song for one round. Every note has its own column, and a song never sits on a single pitch. */
export function makeSong(plan: SongPlan, rng: Rng, recent: readonly string[] = []): Song {
  if (plan.mode === 'free' || plan.mode === 'wake') return { notes: [], given: [] };
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
    if (new Set(notes.map((n) => n.row)).size > 1) return { notes, given: [] };
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
  const notes = plan.mode === 'free' ? freeSong(plan) : song.notes;
  return notes.find((n) => !placed.has(key(n))) ?? null;
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

/** Where the grid sits in a view: its cell size and top-left corner. */
export interface SongLayout {
  cell: number;
  x0: number;
  y0: number;
}

/**
 * The grid's place: clear of the pet on the left (and of the card at the card level), the replay button on the right at
 * the listening level, and the top corner buttons. Cells grow to at most 150; every cell is a whole touch target.
 */
export function songLayout(plan: SongPlan, v: { w: number; h: number }): SongLayout {
  const left = plan.mode === 'card' ? v.w * 0.36 : 175;
  const right = v.w - (plan.mode === 'listen' ? 130 : 40);
  const top = 130;
  const bottom = v.h - 40;
  const cell = Math.min((right - left) / plan.cols, (bottom - top) / plan.rows, 150);
  return {
    cell,
    x0: left + (right - left - cell * plan.cols) / 2,
    y0: top + (bottom - top - cell * plan.rows) / 2,
  };
}

export const LEVELS: BandLevels = {
  // Level 8 (one big jelly that answers anywhere) is the easiest, so lap plays it first, then 1 and 2.
  lap: { min: 1, max: 8, order: [8, 1, 2] },
  toddler: { min: 2, max: 4 },
  preschool: { min: 4, max: 6 },
  prek: { min: 5, max: 7 },
  school: { min: 6, max: 7 },
};
