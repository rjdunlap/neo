import type { BandLevels } from '../../progress/difficulty';
/**
 * Cue Studio's rules (docs/definitions/cue-studio.md): a tiny executable show. She puts Wave and Turn cards in one or two
 * slots, presses Play and watches the companion act each card in order, left to right. Levels 1–2 are free creation: every
 * full show is a good show, nothing counts as a miss, and Finish waits for one complete run of the show as it stands.
 * Level 3 repairs a pictured request; only a deliberate failed Check counts a miss. Level 4 (docs/definitions/cue-studio-p4.md)
 * turns the two slots into two signal rows, a bell and a flower: each signal starts its own row's action, she fires either
 * one freely, and Check accepts each row by its own signal, never by the order they fire in. Programs are transient.
 */

export type Cue = 'W' | 'T';
export const CUES: readonly Cue[] = ['W', 'T'];
/** One slot of the shelf; null is empty. Filled slots always come first: there are no holes. */
export type Slot = Cue | null;

export interface CuePlan {
  level: number;
  slots: number;
  name: string;
  request?: readonly Cue[];
  /** Level 4: each slot is a signal's row, the shelf starts empty, and the seed picks one of these requests. */
  signals?: readonly (readonly Cue[])[];
}

/** The level-4 signals, in row order. */
export const SIGNALS = ['bell', 'flower'] as const;
export type Signal = (typeof SIGNALS)[number];

export const PLANS: readonly CuePlan[] = [
  { level: 1, slots: 1, name: 'Make a move: choose one action, wave or turn, and play it' },
  { level: 2, slots: 2, name: 'My little show: make any two-action show and play it' },
  {
    level: 3,
    slots: 2,
    name: 'Fix the cue: repair the pictured order, then check the show',
    request: ['W', 'T'],
  },
  {
    level: 4,
    slots: 2,
    name: 'Which signal: give the bell and the flower each a move, then check them',
    signals: [
      ['W', 'T'],
      ['T', 'W'],
    ],
  },
];

// The 2026-10-23 decision separates pre-K creation from school requested repair. The P4 definition's lean (standing rule
// S8) grows school one rung per build with the ordinary step rule; entry stays 3.
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 3, max: 4 },
};

export const planFor = (level: number): CuePlan => PLANS.find((p) => p.level === level) ?? PLANS[0];

/** The round's request: level 3's authored order, or level 4's seeded binding (bell's action, then the flower's). */
export function requestFor(
  plan: CuePlan,
  rng: { int(min: number, max: number): number },
): readonly Cue[] | undefined {
  return plan.signals ? plan.signals[rng.int(0, plan.signals.length - 1)] : plan.request;
}

export interface Studio {
  readonly slots: number;
  readonly request: readonly Cue[] | null;
  /** Level 4: slot i is signal i's row, and the shelf starts empty instead of swapped. */
  readonly rows: boolean;
  checked: boolean;
  misses: number;
  program: Slot[];
  /** The occupied slot she picked to change, or null. */
  selected: number | null;
  /** The program before the last edit; one step back only. */
  undo: Slot[] | null;
  /** A complete run of the current program has played (by Play or by stepping to the end). Every edit clears it. */
  played: boolean;
  /** The next command Step performs; 0 starts again at the neutral pose. */
  stepAt: number;
  /** Help already supplied this round, so showing it again costs nothing: `insert:<slot>` and `play`. */
  helped: Set<string>;
  hints: number;
}

/** The authored start: a requested repair starts swapped; creation and the signal rows start empty. */
const startProgram = (slots: number, request: readonly Cue[] | null, rows: boolean): Slot[] =>
  request && !rows ? [...request].reverse() : Array<Slot>(slots).fill(null);

export function newStudio(slots: number, request?: readonly Cue[], rows = false): Studio {
  return {
    slots,
    request: request ?? null,
    rows: rows && !!request,
    checked: false,
    misses: 0,
    program: startProgram(slots, request ?? null, rows && !!request),
    selected: null,
    undo: null,
    played: false,
    stepAt: 0,
    helped: new Set(),
    hints: 0,
  };
}

/** The commands in the order they run: the filled slots, left to right. */
export const trace = (program: readonly Slot[]): Cue[] => program.filter((c): c is Cue => c !== null);
export const isComplete = (program: readonly Slot[]) => program.every((c) => c !== null);
export const firstEmpty = (program: readonly Slot[]) => program.indexOf(null);
/** A well-formed program: the right length, only known commands, and no empty slot before a filled one. */
export function isProgram(program: readonly unknown[], slots: number): program is Slot[] {
  if (program.length !== slots) return false;
  let gap = false;
  for (const c of program) {
    if (c === null) gap = true;
    else if (!CUES.includes(c as Cue) || gap) return false;
  }
  return true;
}

/** Firing a signal: that row's action, or null when nothing is set for it. Reads only; a fire never edits or counts. */
export const fire = (s: Studio, row: number): Cue | null => (s.rows ? (s.program[row] ?? null) : null);

/** Level 4's acceptance, row by row: each signal's bound action against that signal's request, whatever the firing order. */
export const checkRows = (s: Studio): boolean[] =>
  s.request ? s.request.map((cue, i) => s.program[i] === cue) : [];

/** What a clue or repair is about: a signal's row at level 4, a slot otherwise. Survives Undo and Start again. */
export const targetOf = (s: Studio, at: number) => (s.rows ? `row:${SIGNALS[at]}` : `slot:${at}`);

/** What tapping an action card did. */
export type ActionResult = 'insert' | 'replace' | 'same' | 'full';

/** A real edit: keep the old program for Undo and forget any finished run. */
function edit(s: Studio, next: Slot[]) {
  s.undo = s.program.slice();
  s.program = next;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
}

/**
 * An action card: with a slot selected it replaces that slot's command; otherwise it goes into the first empty slot. A
 * full shelf with nothing selected changes nothing ('full': the game asks her to choose a place). Never a miss.
 */
export function tapAction(s: Studio, cue: Cue): ActionResult {
  if (s.selected !== null && s.program[s.selected] !== null) {
    const at = s.selected;
    s.selected = null;
    if (s.program[at] === cue) return 'same';
    const next = s.program.slice();
    next[at] = cue;
    edit(s, next);
    return 'replace';
  }
  s.selected = null;
  const at = firstEmpty(s.program);
  if (at < 0) return 'full';
  const next = s.program.slice();
  next[at] = cue;
  edit(s, next);
  return 'insert';
}

/** A slot: an occupied one is selected (or let go if already selected); an empty one lets go of any selection. */
export function tapSlot(s: Studio, at: number): 'selected' | 'released' {
  if (s.program[at] === null || s.selected === at) {
    s.selected = null;
    return 'released';
  }
  s.selected = at;
  return 'selected';
}

/** Puts back the program before the last edit. Undo after Undo, or with nothing to undo, does nothing. */
export function undo(s: Studio): boolean {
  s.selected = null;
  if (!s.undo) return false;
  s.program = s.undo;
  s.undo = null;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
  return true;
}

/** Play runs the whole current program from neutral; a complete program counts as watched, a part-filled one does not. */
export function playRun(s: Studio): Cue[] {
  s.stepAt = 0;
  return trace(s.program);
}

export function finishRun(s: Studio) {
  if (isComplete(s.program)) s.played = true;
}

/** Step: the next single command (from the start after an edit or a finished trace), or null on an empty shelf. */
export function step(s: Studio): { at: number; cue: Cue } | null {
  const t = trace(s.program);
  if (!t.length) return null;
  if (s.stepAt >= t.length) s.stepAt = 0;
  const at = s.stepAt++;
  if (s.stepAt >= t.length) {
    finishRun(s);
    s.stepAt = t.length;
  }
  return { at, cue: t[at] };
}

/** Creation needs a complete run; a requested show needs a successful Check of the current program. */
export const canFinish = (s: Studio) => isComplete(s.program) && (s.request ? s.checked : s.played);

/** Help offers a creative move, or a clue/repair for the requested trace. */
export type HelpResult =
  | { kind: 'insert'; at: number }
  | { kind: 'clue' | 'repair'; at: number; cue: Cue }
  | { kind: 'check' }
  | { kind: 'play' }
  | { kind: 'finish' };

const hasClue = (s: Studio) => [...s.helped].some((id) => id.startsWith('clue:'));

export const mismatch = (s: Studio) =>
  s.request ? s.program.findIndex((cue, i) => cue !== s.request![i]) : -1;

/** Only a completed deliberate Check counts a miss; ordinary playback never does. */
export function checkRun(s: Studio): number | null {
  if (!s.request || !isProgram(s.program, s.slots) || !isComplete(s.program)) return null;
  const at = mismatch(s);
  s.checked = at < 0;
  if (at >= 0) {
    s.misses++;
    if (s.misses >= 2 && !hasClue(s)) charge(s, `clue:${targetOf(s, at)}`);
  }
  return at;
}

/**
 * Help offers, never corrects: an empty slot gets a Wave (each slot's supplied insertion counts one hint, once, even after
 * Undo); a full unwatched show is played for her (counted once per round); a watched one only points at Finish, free.
 */
export function help(s: Studio): HelpResult {
  s.selected = null;
  if (s.request) {
    const at = mismatch(s);
    if (at < 0) return { kind: s.checked ? 'finish' : 'check' };
    const cue = s.request[at];
    if (!hasClue(s)) {
      charge(s, `clue:${targetOf(s, at)}`);
      return { kind: 'clue', at, cue };
    }
    const next = s.program.slice();
    next[at] = cue;
    edit(s, next);
    charge(s, `repair:${targetOf(s, at)}`);
    return { kind: 'repair', at, cue };
  }
  const at = firstEmpty(s.program);
  if (at >= 0) {
    const next = s.program.slice();
    next[at] = 'W';
    edit(s, next);
    charge(s, `insert:${at}`);
    return { kind: 'insert', at };
  }
  if (!s.played) {
    charge(s, 'play');
    return { kind: 'play' };
  }
  return { kind: 'finish' };
}

function charge(s: Studio, id: string) {
  if (s.helped.has(id)) return;
  s.helped.add(id);
  s.hints++;
}

/** Restore the authored start, keeping misses and the help already supplied. */
export function restart(s: Studio) {
  s.program = startProgram(s.slots, s.request, s.rows);
  s.selected = null;
  s.undo = null;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
}

/**
 * The ghost finger's next press for the how-to card, from the state alone. Level 1: Wave, Play, Finish. Level 2: Wave,
 * Turn, Play, then select the first slot, change it to Turn, Play the new show and Finish (a show that repeats an action is
 * a good show too). `changed` says whether the demonstration has made its change yet. Level 4: the requested move into
 * each row, fire the flower, fire the bell, Check, Finish; `fired` says which signals the demonstration has tried.
 */
export type DemoPress = { action: Cue } | { slot: number } | { fire: number } | 'play' | 'check' | 'finish';
export function demoNext(s: Studio, changed: boolean, fired: readonly boolean[] = []): DemoPress {
  if (s.request && s.rows) {
    const at = mismatch(s);
    if (at >= 0)
      return s.program[at] === null || s.selected === at ? { action: s.request[at] } : { slot: at };
    if (s.checked) return 'finish';
    for (const row of [1, 0]) if (!fired[row]) return { fire: row };
    return 'check';
  }
  if (s.request) {
    if (!s.played) return 'play';
    const at = mismatch(s);
    if (at >= 0) return s.selected === at ? { action: s.request[at] } : { slot: at };
    return s.checked ? 'finish' : 'check';
  }
  const at = firstEmpty(s.program);
  if (at >= 0) return { action: at === 0 ? 'W' : 'T' };
  if (s.slots === 1 || changed) return s.played ? 'finish' : 'play';
  if (!s.played) return 'play';
  return s.selected === 0 ? { action: 'T' } : { slot: 0 };
}

/** The sticker: which card and which colour, from the seed. */
export function stickerRecipe(rng: { int(min: number, max: number): number }): { cue: Cue; color: number } {
  return { cue: CUES[rng.int(0, 1)], color: rng.int(0, 5) };
}
