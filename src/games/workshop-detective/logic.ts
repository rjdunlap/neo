import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Level 1 only, for the grown-up band (docs/definitions/workshop-detective.md). */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 1 } };
export const describeLevel = (_level: number) =>
  'Two notes, one bench lamp: find the test that tells them apart';

/** The two carved lever pairs. A lamp's P lever is the pair's first, its Q lever the second. */
export const PAIRS = {
  shell: ['shell', 'feather'],
  star: ['star', 'moon'],
} as const;
export type PairId = keyof typeof PAIRS;
export const PAIR_IDS = Object.keys(PAIRS) as PairId[];
export type Lever = (typeof PAIRS)[PairId][number];

/** The four shade colours, palette swatch names. */
export const SHADES = ['blue', 'pink', 'green', 'orange'] as const;
export type Shade = (typeof SHADES)[number];

/** A note is named by the lever it says sets the light: P (the pair's first) or Q (its second). */
export type Note = 'P' | 'Q';
export const NOTES: readonly Note[] = ['P', 'Q'];
export const other = (note: Note): Note => (note === 'P' ? 'Q' : 'P');

/** What the round draws: the lever pair, whether P sits on the left, and the shade. The look fixes the rule. */
export interface Look {
  pair: PairId;
  pLeft: boolean;
  shade: Shade;
}

/**
 * The shades that make the left lever's note true, for each pair and side; the other two make the right lever's note
 * true. Each note is then true in eight of the sixteen looks, and a lamp that looks the same always follows the same rule.
 */
const LEFT_TRUE: Record<PairId, Record<'pLeft' | 'pRight', readonly Shade[]>> = {
  shell: { pLeft: ['blue', 'green'], pRight: ['pink', 'orange'] },
  star: { pLeft: ['blue', 'orange'], pRight: ['pink', 'green'] },
};

/** The note that is right for a look: a fixed function of the look, never a separate draw. */
export function trueNote(look: Look): Note {
  const leftWins = LEFT_TRUE[look.pair][look.pLeft ? 'pLeft' : 'pRight'].includes(look.shade);
  const left: Note = look.pLeft ? 'P' : 'Q';
  return leftWins ? left : other(left);
}

/** Every look, in a fixed order. */
export const LOOKS: Look[] = PAIR_IDS.flatMap((pair) =>
  [true, false].flatMap((pLeft) => SHADES.map((shade) => ({ pair, pLeft, shade }))),
);

/** A seeded draw of one look. */
export function drawLook(rng: Rng): Look {
  return rng.pick(LOOKS);
}

/** A lever setting: P then Q, each 0 (down) or 1 (up). */
export type Setup = readonly [p: 0 | 1, q: 0 | 1];
export const SETUPS: readonly Setup[] = [
  [0, 0],
  [1, 1],
  [1, 0],
  [0, 1],
];
export const OPENING: readonly Setup[] = [SETUPS[0], SETUPS[1]];
export const setupKey = ([p, q]: Setup) => `${p}${q}`;
export const sameSetup = (a: Setup, b: Setup) => a[0] === b[0] && a[1] === b[1];
/** A setup where the two notes disagree: one lever up, the other down. */
export const separates = ([p, q]: Setup) => p !== q;

/** What a note says the lamp does for a setup: true for bright. */
export const predicts = (note: Note, [p, q]: Setup): boolean => (note === 'P' ? p : q) === 1;

/** What the lamp does: the true note's prediction. Nothing is random after the draw. */
export const lampFor = (look: Look, setup: Setup): boolean => predicts(trueNote(look), setup);

/** Whether a note fits every record (setups tried, with the lamp's results). */
export const fitsAll = (look: Look, records: readonly Setup[], note: Note) =>
  records.every((s) => predicts(note, s) === lampFor(look, s));

export type RecordState = 'undecided' | 'decided';
export const recordState = (records: readonly Setup[]): RecordState =>
  records.some(separates) ? 'decided' : 'undecided';

/** The index of the first record that separates the notes, or -1. */
export const firstSeparating = (records: readonly Setup[]) => records.findIndex(separates);

/** Trying a setup: a new record, or the index of the card it repeats. */
export function tryOn(
  records: readonly Setup[],
  setup: Setup,
): { records: Setup[]; repeat: number | null; added: boolean } {
  const at = records.findIndex((r) => sameSetup(r, setup));
  if (at >= 0) return { records: [...records], repeat: at, added: false };
  return { records: [...records, setup], repeat: null, added: true };
}

export type Mark = 'fits' | 'out' | null;
export type Marks = Record<Note, Mark>;
export const NO_MARKS: Marks = { P: null, Q: null };

/** Tapping a toggle sets it and clears the other; tapping the set one clears it. */
export const toggle = (marks: Marks, note: Note, mark: 'fits' | 'out'): Marks => ({
  ...marks,
  [note]: marks[note] === mark ? null : mark,
});

export const marksKey = (m: Marks) => `${m.P ?? '-'}.${m.Q ?? '-'}`;

/**
 * Every answer to Check (the definition's table). `incomplete` is free; `open` passes the opening Check; `close` ends
 * the case; a miss carries what the explanation shows.
 */
export type Verdict =
  | { kind: 'incomplete'; unmarked: Note[] }
  | { kind: 'open' }
  | { kind: 'close'; truth: Note; record: number }
  | { kind: 'miss-sofar'; note: Note } // undecided, one fits and the other (note's partner) ruled out
  | { kind: 'miss-both-sofar' } // undecided, neither fits
  | { kind: 'miss-ruled'; truth: Note; record: number; alsoTrue: boolean } // decided, the other note marked fits
  | { kind: 'miss-true'; truth: Note }; // decided, neither fits

export function check(look: Look, records: readonly Setup[], marks: Marks): Verdict {
  const unmarked = NOTES.filter((n) => marks[n] === null);
  if (unmarked.length) return { kind: 'incomplete', unmarked };
  const truth = trueNote(look);
  if (recordState(records) === 'undecided') {
    if (marks.P === 'fits' && marks.Q === 'fits') return { kind: 'open' };
    if (marks.P === 'out' && marks.Q === 'out') return { kind: 'miss-both-sofar' };
    // One is ruled out: the line names that note as fitting every record so far.
    return { kind: 'miss-sofar', note: marks.P === 'out' ? 'P' : 'Q' };
  }
  const record = firstSeparating(records);
  const wrong = other(truth);
  if (marks[truth] === 'fits' && marks[wrong] === 'out') return { kind: 'close', truth, record };
  if (marks[wrong] === 'fits') return { kind: 'miss-ruled', truth, record, alsoTrue: marks[truth] === 'out' };
  return { kind: 'miss-true', truth };
}

export const isMiss = (v: Verdict) => v.kind.startsWith('miss');

/** The key a miss is counted on: one per distinct wrong mark set within a record state. */
export const missKey = (records: readonly Setup[], marks: Marks) =>
  `${recordState(records)}:${marksKey(marks)}`;

/**
 * The hint for the first unmet step. 1: before the opening Check, both notes' predictions beside the opening records.
 * 2: after it, the P-up Q-down test with both predictions. 3: once decided with marks not right, the separating record
 * and the note it rules out. Null when the decided marks are already right.
 */
export type Hint =
  { step: 1 } | { step: 2; setup: Setup } | { step: 3; record: number; out: Note; truth: Note };
export const HINT_SETUP: Setup = [1, 0];

export function hintFor(look: Look, records: readonly Setup[], marks: Marks, opened: boolean): Hint | null {
  if (recordState(records) === 'undecided') return opened ? { step: 2, setup: HINT_SETUP } : { step: 1 };
  const truth = trueNote(look);
  if (marks[truth] === 'fits' && marks[other(truth)] === 'out') return null;
  return { step: 3, record: firstSeparating(records), out: other(truth), truth };
}

/** The marks a hint leads to: both fit before a decision, the true note alone after. */
export function rightMarks(look: Look, records: readonly Setup[]): Marks {
  if (recordState(records) === 'undecided') return { P: 'fits', Q: 'fits' };
  const truth = trueNote(look);
  return { [truth]: 'fits', [other(truth)]: 'out' } as Marks;
}

/* ---------- Words: captions and the voice line ids (all whole lines, written per pair). ---------- */

export const leverName = (pair: PairId, note: Note) => PAIRS[pair][note === 'P' ? 0 : 1];
export const noteName = (pair: PairId, note: Note) => `the ${leverName(pair, note)} note`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
export const setupWords = (pair: PairId, [p, q]: Setup) =>
  `${cap(PAIRS[pair][0])} ${p ? 'up' : 'down'}, ${PAIRS[pair][1]} ${q ? 'up' : 'down'}`;
export const lightWord = (bright: boolean) => (bright ? 'bright' : 'dim');

/** Line ids: per pair `lamp.<pair>.…`, shared `lamp.…`. */
export const LINE = {
  note: (pair: PairId, n: Note) => `lamp.${pair}.note.${leverName(pair, n)}`,
  setup: (pair: PairId, s: Setup) => `lamp.${pair}.setup.${setupKey(s)}`,
  says: (pair: PairId, n: Note, bright: boolean) =>
    `lamp.${pair}.says.${leverName(pair, n)}.${lightWord(bright)}`,
  sofar: (pair: PairId, n: Note) => `lamp.${pair}.sofar.${leverName(pair, n)}`,
  fits: (pair: PairId, n: Note) => `lamp.${pair}.fits.${leverName(pair, n)}`,
  out: (pair: PairId, n: Note) => `lamp.${pair}.out.${leverName(pair, n)}`,
  hint2: (pair: PairId) => `lamp.${pair}.hint2`,
  light: (bright: boolean) => `lamp.${lightWord(bright)}`,
} as const;

/** The text of every per-pair line. */
export function pairLines(pair: PairId): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of NOTES) {
    const lever = leverName(pair, n);
    out[LINE.note(pair, n)] = `The ${lever} note: when the ${lever} lever is up, the lamp is bright.`;
    for (const bright of [true, false])
      out[LINE.says(pair, n, bright)] = `The ${lever} note says ${lightWord(bright)}.`;
    out[LINE.sofar(pair, n)] = `The ${lever} note fits every record so far.`;
    out[LINE.fits(pair, n)] = `The ${lever} note fits every record.`;
    out[LINE.out(pair, n)] = `This record rules out the ${lever} note.`;
  }
  for (const s of SETUPS) out[LINE.setup(pair, s)] = `${setupWords(pair, s)}.`;
  const [p, q] = PAIRS[pair];
  out[LINE.hint2(pair)] =
    `${cap(p)} up, ${q} down: the ${p} note says bright, the ${q} note says dim. Try it.`;
  return out;
}

export const SHARED_LINES = {
  'lamp.bright': 'Bright.',
  'lamp.dim': 'Dim.',
  'lamp.new': 'A new lamp from the bench.',
  'lamp.tag': 'A made-up lamp. It follows its own rule.',
  'lamp.mark-both': 'Mark both notes first.',
  'lamp.latched': 'Check the notes first.',
  'lamp.both-sofar': 'Both notes fit every record so far.',
  'lamp.open': 'Right: both notes fit both records. Set the levers to find a test that tells them apart.',
  'lamp.repeat': 'Same setup, same light. A repeat adds nothing new.',
  'lamp.marks-fit': 'These marks fit the records. Check them.',
  'lamp.hint1': 'Both down: both notes say dim. Both up: both notes say bright. Both notes fit.',
} as const;

/** What a record says aloud: its setup, then its light. */
export const recordLines = (look: Look, s: Setup) => [LINE.setup(look.pair, s), LINE.light(lampFor(look, s))];

/** The spoken sequence and the fuller caption for a Check's verdict. */
export function verdictWords(
  look: Look,
  records: readonly Setup[],
  v: Verdict,
): { lines: string[]; caption: string } {
  const { pair } = look;
  const ruled = (truth: Note, record: number) => {
    const s = records[record];
    const wrong = other(truth);
    return {
      lines: [LINE.out(pair, wrong), ...recordLines(look, s), LINE.says(pair, wrong, predicts(wrong, s))],
      caption: `Record ${record + 1} rules out ${noteName(pair, wrong)}: ${setupWords(pair, s).toLowerCase()}, ${lightWord(lampFor(look, s))}. ${cap(noteName(pair, wrong))} says ${lightWord(predicts(wrong, s))}.`,
    };
  };
  switch (v.kind) {
    case 'incomplete':
      return { lines: ['lamp.mark-both'], caption: 'Mark both notes first.' };
    case 'open':
      return { lines: ['lamp.open'], caption: SHARED_LINES['lamp.open'] };
    case 'miss-sofar':
      return {
        lines: [LINE.sofar(pair, v.note)],
        caption: `${cap(noteName(pair, v.note))} fits every record so far: both down, dim; both up, bright.`,
      };
    case 'miss-both-sofar':
      return { lines: ['lamp.both-sofar'], caption: SHARED_LINES['lamp.both-sofar'] };
    case 'miss-ruled': {
      const r = ruled(v.truth, v.record);
      if (!v.alsoTrue) return r;
      return {
        lines: [...r.lines, LINE.fits(pair, v.truth)],
        caption: `${r.caption} ${cap(noteName(pair, v.truth))} fits every record.`,
      };
    }
    case 'miss-true':
      return {
        lines: [LINE.fits(pair, v.truth)],
        caption: `${cap(noteName(pair, v.truth))} fits every record.`,
      };
    case 'close':
      return {
        lines: [LINE.fits(pair, v.truth), LINE.out(pair, other(v.truth))],
        caption: `${cap(noteName(pair, v.truth))} fits every record. Record ${v.record + 1} rules out ${noteName(pair, other(v.truth))}.`,
      };
  }
}

/** The spoken sequence and caption for a hint. */
export function hintWords(
  look: Look,
  records: readonly Setup[],
  h: Hint,
): { lines: string[]; caption: string } {
  if (h.step === 1) return { lines: ['lamp.hint1'], caption: SHARED_LINES['lamp.hint1'] };
  if (h.step === 2)
    return { lines: [LINE.hint2(look.pair)], caption: pairLines(look.pair)[LINE.hint2(look.pair)] };
  const r = verdictWords(look, records, {
    kind: 'miss-ruled',
    truth: h.truth,
    record: h.record,
    alsoTrue: true,
  });
  return r;
}
