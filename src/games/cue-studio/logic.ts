import type { BandLevels } from '../../progress/difficulty';
/**
 * Cue Studio's rules (docs/definitions/cue-studio.md): a tiny executable show. She puts Wave and Turn cards in one or two
 * slots, presses Play and watches the companion act each card in order, left to right. Levels 1–2 are free creation: every
 * full show is a good show, nothing counts as a miss, and Finish waits for one complete run of the show as it stands.
 * Level 3 repairs a pictured request; only a deliberate failed Check counts a miss. Level 4 (docs/definitions/cue-studio-p4.md)
 * turns the two slots into two signal rows, a bell and a flower: each signal starts its own row's action, she fires either
 * one freely, and Check accepts each row by its own signal, never by the order they fire in. Level 5 adds one bounded
 * Repeat to the two-slot shelf: on, the body (both slots) plays exactly twice, and Check accepts the played trace against a
 * four-move request. Level 6 adds a second actor: the pet's show can Send one leaf to a bird, whose receiver rule (a leaf
 * or a shell) decides whether it opens its fan. Delivery is synchronous, the bird never sends, and Check accepts a tagged
 * trace that crosses both actors. Programs are transient.
 */

export type Cue = 'W' | 'T';
export const CUES: readonly Cue[] = ['W', 'T'];
/** A command a slot can hold: a move, or level 6's Send (one leaf to the bird). */
export type Move = Cue | 'S';
export const MOVES: readonly Move[] = ['W', 'T', 'S'];
/** One slot of the shelf; null is empty. Filled slots always come first: there are no holes. */
export type Slot = Move | null;
/** Level 6: what the bird listens for. Only a leaf is ever sent, so a shell means nobody is listening. */
export type Receiver = 'leaf' | 'shell';
export const RECEIVERS: readonly Receiver[] = ['leaf', 'shell'];
/** Level 6: an authored starting show, the pet's two commands and the bird's receiver. */
export interface PassStart {
  readonly program: readonly Move[];
  readonly receiver: Receiver;
}
/** Level 6's tagged trace: who acted and what they did (the pet waves, turns or sends; the bird opens its fan). */
export type Act = 'P:W' | 'P:T' | 'P:S' | 'B:F';
/** The trace level 6's picture asks for: the pet waves, the pet sends a leaf, the bird opens its fan. */
export const PASS_ACTS: readonly Act[] = ['P:W', 'P:S', 'B:F'];

export interface CuePlan {
  level: number;
  slots: number;
  name: string;
  request?: readonly Move[];
  /** Level 4: each slot is a signal's row, the shelf starts empty, and the seed picks one of these requests. */
  signals?: readonly (readonly Cue[])[];
  /** Level 5: the shelf has a Repeat cap and starts empty, and the seed picks one of these two-move phrases, asked for twice. */
  phrases?: readonly (readonly Cue[])[];
  /**
   * Level 6: the pet's request is the plan's `request`, the bird must listen for a leaf, and the seed picks one of these
   * starting shows to repair.
   */
  starts?: readonly PassStart[];
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
  {
    level: 5,
    slots: 2,
    name: 'A repeated phrase: play a two-move phrase twice with Repeat',
    phrases: [
      ['W', 'T'],
      ['T', 'W'],
    ],
  },
  {
    level: 6,
    slots: 2,
    name: "Pass the cue: the pet's show sends a leaf and the bird answers",
    request: ['W', 'S'],
    starts: [
      // A: the leaf is sent at the right time but the bird listens for a shell. One repair: the receiver.
      { program: ['W', 'S'], receiver: 'shell' },
      // B: the bird is listening, but the leaf goes first, so the fan opens before the wave. Two repairs: one per slot.
      { program: ['S', 'W'], receiver: 'leaf' },
    ],
  },
];

// The 2026-10-23 decision separates pre-K creation from school requested repair. The P4 definition's lean (standing rule
// S8) grows school one rung per build with the ordinary step rule; entry stays 3.
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 3, max: 6 },
};

export const planFor = (level: number): CuePlan => PLANS.find((p) => p.level === level) ?? PLANS[0];

/** What kind of show a plan is: a plain shelf, level 4's signal rows, level 5's Repeat shelf, or level 6's two actors. */
export type Shape = 'show' | 'rows' | 'repeat' | 'pass';
export const shapeOf = (plan: CuePlan): Shape =>
  plan.signals ? 'rows' : plan.phrases ? 'repeat' : plan.starts ? 'pass' : 'show';

/**
 * The round's request: level 3's authored order, level 4's seeded binding (bell's action, then the flower's), or level 5's
 * seeded phrase (the body; the picture asks for it twice), or level 6's pet commands.
 */
export function requestFor(
  plan: CuePlan,
  rng: { int(min: number, max: number): number },
): readonly Move[] | undefined {
  const cases = plan.signals ?? plan.phrases;
  return cases ? cases[rng.int(0, cases.length - 1)] : plan.request;
}

/** Level 6's seeded starting show; undefined at every other level (and the seed is left alone). */
export function startFor(
  plan: CuePlan,
  rng: { int(min: number, max: number): number },
): PassStart | undefined {
  return plan.starts?.[rng.int(0, plan.starts.length - 1)];
}

export interface Studio {
  readonly slots: number;
  readonly request: readonly Move[] | null;
  /** Level 4: slot i is signal i's row, and the shelf starts empty instead of swapped. */
  readonly rows: boolean;
  /** Level 5: the shelf has a Repeat cap, starts empty, and the request is the body played twice. */
  readonly repeats: boolean;
  /** Level 5: the Repeat cap is on, so the body (both slots) plays exactly twice. */
  repeat: boolean;
  /** Level 6: the seeded starting show; a slot may hold Send and the bird has a receiver. Null at every other level. */
  readonly pass: PassStart | null;
  /** Level 6: what the bird listens for. */
  receiver: Receiver;
  checked: boolean;
  misses: number;
  program: Slot[];
  /** The occupied slot she picked to change, or null. */
  selected: number | null;
  /** The program before the last edit; one step back only. */
  undo: Slot[] | null;
  /** Whether Repeat was on before the last edit; Undo puts it back with the program. */
  undoRepeat: boolean;
  /** The receiver before the last edit; Undo puts it back with the program. */
  undoReceiver: Receiver;
  /** A complete run of the current program has played (by Play or by stepping to the end). Every edit clears it. */
  played: boolean;
  /** The next command Step performs; 0 starts again at the neutral pose. */
  stepAt: number;
  /** Help already supplied this round, so showing it again costs nothing: `insert:<slot>` and `play`. */
  helped: Set<string>;
  hints: number;
}

/**
 * The authored start: a requested repair starts swapped; creation, the signal rows and the repeat shelf start empty; level
 * 6 starts on its seeded show.
 */
const startProgram = (
  slots: number,
  request: readonly Move[] | null,
  empty: boolean,
  pass: PassStart | null = null,
): Slot[] =>
  pass ? [...pass.program] : request && !empty ? [...request].reverse() : Array<Slot>(slots).fill(null);

export function newStudio(
  slots: number,
  request?: readonly Move[],
  shape: Shape = 'show',
  start?: PassStart,
): Studio {
  // Rows, Repeat and a passed cue need a request (and a passed cue its start); a creation studio never becomes one.
  const kind = request && (shape !== 'pass' || start) ? shape : 'show';
  const pass = kind === 'pass' ? start! : null;
  return {
    slots,
    request: request ?? null,
    rows: kind === 'rows',
    repeats: kind === 'repeat',
    repeat: false,
    pass,
    receiver: pass?.receiver ?? 'leaf',
    checked: false,
    misses: 0,
    program: startProgram(slots, request ?? null, kind !== 'show', pass),
    selected: null,
    undo: null,
    undoRepeat: false,
    undoReceiver: pass?.receiver ?? 'leaf',
    played: false,
    stepAt: 0,
    helped: new Set(),
    hints: 0,
  };
}

/** The commands in the order they run: the filled slots, left to right. */
export const trace = (program: readonly Slot[]): Move[] => program.filter((c): c is Move => c !== null);
export const isComplete = (program: readonly Slot[]) => program.every((c) => c !== null);
export const firstEmpty = (program: readonly Slot[]) => program.indexOf(null);
/**
 * A well-formed program: the right length, only known commands, and no empty slot before a filled one. Send is a known
 * command only in a level-6 studio (`sends`).
 */
export function isProgram(program: readonly unknown[], slots: number, sends = false): program is Slot[] {
  if (program.length !== slots) return false;
  let gap = false;
  for (const c of program) {
    if (c === null) gap = true;
    else if (!(sends ? MOVES : CUES).includes(c as Cue) || gap) return false;
  }
  return true;
}
/** Whether the whole show is well formed and can be run or checked: its program and, at level 6, its receiver. */
export const isShow = (s: Studio): boolean =>
  isProgram(s.program, s.slots, !!s.pass) && (!s.pass || RECEIVERS.includes(s.receiver));

/** Firing a signal: that row's action, or null when nothing is set for it. Reads only; a fire never edits or counts. */
export const fire = (s: Studio, row: number): Cue | null =>
  // A signal row never holds Send: only a level-6 studio accepts that card.
  s.rows ? ((s.program[row] as Cue | null) ?? null) : null;

/** Level 4's acceptance, row by row: each signal's bound action against that signal's request, whatever the firing order. */
export const checkRows = (s: Studio): boolean[] =>
  s.request ? s.request.map((cue, i) => s.program[i] === cue) : [];

/** Level 5's mismatch when both slots are right but Repeat is off: the place after the slots, where the cap stands. */
export const REPEAT = 2;
/** Level 6's mismatch when the pet's slots are right but the fan never opens: the bird's receiver. */
export const RECEIVER = 3;

/**
 * What a clue or repair is about: a signal's row at level 4, the Repeat cap, the bird's receiver, or a slot. Survives
 * Undo and Start again.
 */
export const targetOf = (s: Studio, at: number) =>
  s.rows
    ? `row:${SIGNALS[at]}`
    : s.repeats && at === REPEAT
      ? 'repeat'
      : s.pass && at === RECEIVER
        ? 'receiver'
        : `slot:${at}`;

/**
 * The executed commands: the filled slots left to right, and at level 5 with Repeat on the complete body exactly twice. A
 * body with an empty slot is incomplete, so it plays its filled part once. At level 6 these are the pet's commands; a
 * delivery belongs to its Send (see `acts`).
 */
export const run = (s: Studio): Move[] => {
  const body = trace(s.program);
  return s.repeat && isComplete(s.program) ? [...body, ...body] : body;
};

/** Level 6: whether a sent leaf reaches a listening bird. An unmatched Send is not a mistake; the bird just stays still. */
export const delivers = (s: Studio): boolean => !!s.pass && s.receiver === 'leaf';

/**
 * Level 6's tagged trace, from the commands alone: the pet's slots run left to right, and each Send that the bird is
 * listening for is followed at once by the bird opening its fan, before the pet's next command. The bird never sends, so
 * two slots make at most four actions.
 */
export function acts(s: Studio): Act[] {
  const out: Act[] = [];
  for (const move of trace(s.program)) {
    out.push(`P:${move}`);
    if (move === 'S' && delivers(s)) out.push('B:F');
  }
  return out;
}

/** The trace the picture asks for: the request, twice over at level 5 (level 6's is the tagged `PASS_ACTS`). */
export const wanted = (s: Studio): readonly Move[] =>
  s.request ? (s.repeats ? [...s.request, ...s.request] : s.request) : [];

/** What tapping an action card did. */
export type ActionResult = 'insert' | 'replace' | 'same' | 'full';

/** A real edit: keep the old program (with Repeat and the receiver) for Undo and forget any finished run. */
function edit(s: Studio, next: Slot[], repeat = s.repeat, receiver = s.receiver) {
  s.undo = s.program.slice();
  s.undoRepeat = s.repeat;
  s.undoReceiver = s.receiver;
  s.program = next;
  s.repeat = repeat;
  s.receiver = receiver;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
}

/**
 * An action card: with a slot selected it replaces that slot's command; otherwise it goes into the first empty slot. A
 * full shelf with nothing selected changes nothing ('full': the game asks her to choose a place). Never a miss.
 */
export function tapAction(s: Studio, cue: Move): ActionResult {
  // Send exists only where there is a bird to send to.
  if (cue === 'S' && !s.pass) return 'full';
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

/** The Repeat cap (level 5 only): turning it on or off is an edit like any other. Returns whether it is now on. */
export function toggleRepeat(s: Studio): boolean {
  if (!s.repeats) return false;
  s.selected = null;
  edit(s, s.program.slice(), !s.repeat);
  return s.repeat;
}

/**
 * The bird's receiver (level 6 only): switching what it listens for is an edit like any other. Returns what it listens
 * for now.
 */
export function toggleReceiver(s: Studio): Receiver {
  if (!s.pass) return s.receiver;
  s.selected = null;
  edit(s, s.program.slice(), s.repeat, s.receiver === 'leaf' ? 'shell' : 'leaf');
  return s.receiver;
}

/** Puts back the program before the last edit. Undo after Undo, or with nothing to undo, does nothing. */
export function undo(s: Studio): boolean {
  s.selected = null;
  if (!s.undo) return false;
  s.program = s.undo;
  s.repeat = s.undoRepeat;
  s.receiver = s.undoReceiver;
  s.undo = null;
  s.checked = false;
  s.played = false;
  s.stepAt = 0;
  return true;
}

/** Play runs the whole current program from neutral; a complete program counts as watched, a part-filled one does not. */
export function playRun(s: Studio): Move[] {
  s.stepAt = 0;
  return run(s);
}

export function finishRun(s: Studio) {
  if (isComplete(s.program)) s.played = true;
}

/**
 * Step: the next single executed move (from the start after an edit or a finished trace), or null on an empty shelf. `n`
 * counts executed moves and `at` is the slot acting, so a repeated show takes four presses over its two slots.
 */
export function step(s: Studio): { at: number; cue: Move; n: number } | null {
  const t = run(s);
  if (!t.length) return null;
  if (s.stepAt >= t.length) s.stepAt = 0;
  const n = s.stepAt++;
  if (s.stepAt >= t.length) {
    finishRun(s);
    s.stepAt = t.length;
  }
  return { at: n % trace(s.program).length, cue: t[n], n };
}

/** Creation needs a complete run; a requested show needs a successful Check of the current program. */
export const canFinish = (s: Studio) => isComplete(s.program) && (s.request ? s.checked : s.played);

/** Help offers a creative move, or a clue/repair for the requested trace. */
export type HelpResult =
  | { kind: 'insert'; at: number }
  /** `cue` is the command the slot or row should hold; null when the target is the Repeat cap or the bird's receiver. */
  | { kind: 'clue' | 'repair'; at: number; cue: Move | null }
  | { kind: 'check' }
  | { kind: 'play' }
  | { kind: 'finish' };

const hasClue = (s: Studio) => [...s.helped].some((id) => id.startsWith('clue:'));

/**
 * The earliest difference from the request: a slot (or row) index, `REPEAT` when level 5's body is right but would play
 * only once, `RECEIVER` when level 6's pet sends at the right time but the bird is not listening for a leaf, or -1 when the
 * show matches. At level 6 this is where the tagged trace first leaves `PASS_ACTS`: an action out of place is a pet slot,
 * and a fan missing after the Send is the receiver.
 */
export function mismatch(s: Studio): number {
  if (!s.request) return -1;
  const at = s.program.findIndex((cue, i) => cue !== s.request![i]);
  if (at >= 0) return at;
  if (s.repeats && !s.repeat) return REPEAT;
  return s.pass && !delivers(s) ? RECEIVER : -1;
}

/** Only a completed deliberate Check counts a miss; ordinary playback never does. */
export function checkRun(s: Studio): number | null {
  if (!s.request || !isShow(s) || !isComplete(s.program)) return null;
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
    const cue = s.request[at] ?? null;
    if (!hasClue(s)) {
      charge(s, `clue:${targetOf(s, at)}`);
      return { kind: 'clue', at, cue };
    }
    const next = s.program.slice();
    if (cue) next[at] = cue;
    // The Repeat target's repair turns the cap on; the receiver's sets the bird listening for a leaf.
    edit(s, next, cue || at !== REPEAT ? s.repeat : true, at === RECEIVER ? 'leaf' : s.receiver);
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
  s.program = startProgram(s.slots, s.request, s.rows || s.repeats, s.pass);
  s.repeat = false;
  if (s.pass) s.receiver = s.pass.receiver;
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
 * each row, fire the flower, fire the bell, Check, Finish; `fired` says which signals the demonstration has tried. Level 5:
 * the phrase's two moves, Repeat, Play, Check, Finish. Level 6: Play the starting show once (`watched` says it has been),
 * then the receiver (start A) or each wrong slot and its command (start B), Check, Finish.
 */
export type DemoPress =
  | { action: Move }
  | { slot: number }
  | { fire: number }
  | 'repeat'
  | 'receiver'
  | 'play'
  | 'check'
  | 'finish';
export function demoNext(
  s: Studio,
  changed: boolean,
  fired: readonly boolean[] = [],
  watched = s.played,
): DemoPress {
  if (s.request && s.pass) {
    if (!watched) return 'play';
    const at = mismatch(s);
    if (at === RECEIVER) return 'receiver';
    if (at >= 0) return s.selected === at ? { action: s.request[at] } : { slot: at };
    return s.checked ? 'finish' : 'check';
  }
  if (s.request && s.repeats) {
    const at = mismatch(s);
    if (at === REPEAT) return 'repeat';
    if (at >= 0)
      return s.program[at] === null || s.selected === at ? { action: s.request[at] } : { slot: at };
    if (s.checked) return 'finish';
    return s.played ? 'check' : 'play';
  }
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
