/**
 * Cue Studio's rules (docs/definitions/cue-studio.md): a tiny executable show. She puts Wave and Turn cards in one or two
 * slots, presses Play and watches the companion act each card in order, left to right. Levels 1–2 are free creation: every
 * full show is a good show, nothing counts as a miss, and Finish waits for one complete run of the show as it stands.
 * Level 3 repairs a pictured request; only a deliberate failed Check counts a miss. Programs are transient.
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
}

export const PLANS: readonly CuePlan[] = [
  { level: 1, slots: 1, name: 'Make a move: choose one action, wave or turn, and play it' },
  { level: 2, slots: 2, name: 'My little show: make any two-action show and play it' },
  { level: 3, slots: 2, name: 'Fix the cue: repair the pictured order, then check the show', request: ['W', 'T'] },
];

export const planFor = (level: number): CuePlan => PLANS.find((p) => p.level === level) ?? PLANS[0];

export interface Studio {
  readonly slots: number;
  readonly request: readonly Cue[] | null;
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

export function newStudio(slots: number, request?: readonly Cue[]): Studio {
  return { slots, request: request ?? null, checked: false, misses: 0, program: request ? [...request].reverse() : Array<Slot>(slots).fill(null), selected: null, undo: null, played: false, stepAt: 0, helped: new Set(), hints: 0 };
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
export type HelpResult = { kind: 'insert'; at: number } | { kind: 'clue' | 'repair'; at: number; cue: Cue } | { kind: 'check' } | { kind: 'play' } | { kind: 'finish' };

const hasClue = (s: Studio) => [...s.helped].some(id => id.startsWith('clue:'));

export const mismatch = (s: Studio) => s.request ? s.program.findIndex((cue, i) => cue !== s.request![i]) : -1;

/** Only a completed deliberate Check counts a miss; ordinary playback never does. */
export function checkRun(s: Studio): number | null {
  if (!s.request || !isProgram(s.program, s.slots) || !isComplete(s.program)) return null;
  const at = mismatch(s);
  s.checked = at < 0;
  if (at >= 0) {
    s.misses++;
    if (s.misses >= 2 && !hasClue(s)) charge(s, `clue:${at}`);
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
      charge(s, `clue:${at}`);
      return { kind: 'clue', at, cue };
    }
    const next = s.program.slice();
    next[at] = cue;
    edit(s, next);
    charge(s, `repair:${at}`);
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
  s.program = s.request ? [...s.request].reverse() : Array<Slot>(s.slots).fill(null);
  s.selected = null;
  s.undo = null;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
}

/**
 * The ghost finger's next press for the how-to card, from the state alone. Level 1: Wave, Play, Finish. Level 2: Wave,
 * Turn, Play, then select the first slot, change it to Turn, Play the new show and Finish (a show that repeats an action is
 * a good show too). `changed` says whether the demonstration has made its change yet.
 */
export type DemoPress = { action: Cue } | { slot: number } | 'play' | 'check' | 'finish';
export function demoNext(s: Studio, changed: boolean): DemoPress {
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
