/**
 * Helper House's rules: a house with a helper (the door at level 1, the lamp at levels 2–3 and 5, the nook's heater at
 * levels 4 and 6–7), a sensor that reads a picture, rule rows that turn a reading into an action (at levels 6–7, lines
 * on the warmth gauge), and a twelve-step day the
 * house runs by itself. The board space is tiny and fully enumerated; a day never counts a miss, and the same unmet
 * goal twice lights a fix. Everything here is pure; the scene draws it. Definition: docs/definitions/helper-house.md.
 */
import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

// ——— Readings, sensors, rules ———

export type SunLevel = 'dark' | 'dim' | 'bright';
export const SUN_LEVELS: readonly SunLevel[] = ['dark', 'dim', 'bright'];
export type EyeReading = 'near' | 'far';
/** The thermometer's three warmth zones (level 4). */
export type Zone = 'cool' | 'warm' | 'hot';
export const ZONES: readonly Zone[] = ['cool', 'warm', 'hot'];
export type Reading = SunLevel | EyeReading | Zone;
/** A reading chip on the bench: a sun level (level 3) or a warmth zone (level 4). */
export type Chip = SunLevel | Zone;
export type SensorKind = 'eye' | 'sun' | 'thermo';
/**
 * Where a sensor can sit: the door and the window (level 1), the lamp post's one slot (levels 2–3), the nook (level 4);
 * at level 5 under the lamp (inside its pool of light), up on the roof, or inside the garden shed.
 */
export type Socket = 'door' | 'window' | 'post' | 'nook' | 'lamp' | 'roof' | 'shed';
export type Action = 'open' | 'on' | 'off';
export type Helper = 'door' | 'lamp' | 'heater';
/** A piece the board can change: the sensor, an editable row by its index, or a line on the gauge (levels 6–7). */
export type Piece = 'sensor' | number | LinePiece;
/** Level 6's one line, or level 7's on line and off line. */
export type LinePiece = 'line' | 'on-line' | 'off-line';

export interface Row {
  reading: Reading | null;
  action: Action;
  /** Part of the level, never editable. */
  given: boolean;
}

export interface Board {
  level: number;
  /** The sensor on the board: its kind (level 2 chooses it) and its socket (level 1 chooses it); null is on the bench. */
  sensor: { kind: SensorKind | null; socket: Socket | null };
  /** In screen order; a later matching row wins. */
  rows: Row[];
  /**
   * Levels 6–7: the gauge's lines, as gaps 1–6 (gap k lies between warmth k−1 and k). Warmth below the on line turns
   * the heater on, warmth at or above the off line turns it off, and between them no row matches. Level 6 keeps them
   * together: one line.
   */
  lines?: { on: number; off: number };
}

export const STEPS = 12;

export interface Day {
  sun: SunLevel[];
  /** Level 1: the steps a friend arrives at the door. */
  arrivals: number[];
  /** Level 4: the nook's warmth before the first step (0–6); the outside is 0. */
  warmth: number;
}

/** The nook's warmth stays within 0–6; the thermometer reads cool at 0–2, warm at 3–4, hot at 5–6. */
export const WARMTH_MAX = 6;
export function zoneOf(warmth: number): Zone {
  return warmth <= 2 ? 'cool' : warmth <= 4 ? 'warm' : 'hot';
}
/** Level 4's comfy band, from step 2 on (levels 6–7 too). */
export const COMFY = { min: 2, max: 4, from: 2 };
/** The gauge's six gaps between its seven marks. */
export const GAPS = 6;
/** Level 7: the click jar's cups; one more switch rolls a pebble out. */
export const JAR = 8;

/** Levels whose rows are lines on the warmth gauge. */
export function onGauge(level: number): boolean {
  return level === 6 || level === 7;
}

/** The row a warmth matches on a gauge board: 0 (on) below the on line, 1 (off) at or above the off line, else none. */
export function lineMatch(lines: { on: number; off: number }, warmth: number): number | null {
  return warmth <= lines.on - 1 ? 0 : warmth >= lines.off ? 1 : null;
}

/** A switch is a step whose heater state after the rules differs from before them; the heater starts off. */
export function switches(trace: readonly Trace[]): number {
  let was = false;
  let n = 0;
  for (const t of trace) {
    if (t.helperOn !== was) n++;
    was = t.helperOn;
  }
  return n;
}

export interface Trace {
  step: number;
  sun: SunLevel;
  /** A friend arrived this step. */
  arrived: boolean;
  /** What the sensor read (its neutral `far` when it sees nothing). */
  reading: Reading;
  /** The row that set the helper this step, or null (the helper kept its state). */
  matched: number | null;
  /** The door is open / the lamp is lit after this step. */
  helperOn: boolean;
  /** Level 1: the door opened and let the waiting friends in this step (it shuts behind them). */
  opened: boolean;
  /** Friends still waiting at the door after this step. */
  waiting: number;
  /** Friends who came in by the end of this step. */
  inside: number;
  /** Level 4: the nook's warmth after the heater acted this step. */
  warmth: number;
}

export type Failure = 'friend-waiting' | 'sensor-blind' | 'lamp-flickers' | 'lamp-on-at-morning' | 'lamp-off-at-night' | 'never-warms' | 'too-warm' | 'heater-busy';

export interface Outcome {
  trace: Trace[];
  met: boolean;
  failure: Failure | null;
}

/** The helper a level's rules drive. */
export function helperFor(level: number): Helper {
  return level === 1 ? 'door' : level === 4 || onGauge(level) ? 'heater' : 'lamp';
}

/** Levels whose one choice is where the sensor goes (or which one): the rows are given. */
export function placesSensor(level: number): boolean {
  return level === 1 || level === 2 || level === 5;
}

/**
 * What a sensor at a socket reads at a step; a sensor that sees nothing reads `far`. `lit` is the lamp's state as the
 * step begins: under the lamp (level 5) the sensor reads the lamp's own light as `bright`.
 */
export function read(board: Board, day: Day, step: number, waiting: number, warmth = day.warmth, lit = false): Reading {
  const s = board.sensor;
  if (s.kind === 'eye') {
    if (s.socket === 'door') return waiting > 0 ? 'near' : 'far';
    return 'far';
  }
  if (s.kind === 'sun' && (s.socket === 'post' || s.socket === 'roof')) return day.sun[step];
  if (s.kind === 'sun' && s.socket === 'lamp') return lit ? 'bright' : day.sun[step];
  if (s.kind === 'sun' && s.socket === 'shed') return 'dark';
  if (s.kind === 'thermo' && s.socket === 'nook') return zoneOf(warmth);
  return 'far';
}

/** The twelve steps in order: the world changes, the sensor reads, the rows set the helper, the helper acts. */
export function runDay(board: Board, day: Day): Outcome {
  const trace: Trace[] = [];
  let helperOn = false;
  let waiting = 0;
  let inside = 0;
  // The warmth the heater phase left last step; the thermometer reads it before the heater acts.
  let warmth = day.warmth;
  for (let step = 0; step < STEPS; step++) {
    const arrived = day.arrivals.includes(step);
    if (arrived) waiting++;
    const reading = read(board, day, step, waiting, warmth, helperOn);
    let matched: number | null = null;
    if (board.lines) matched = lineMatch(board.lines, warmth);
    else board.rows.forEach((r, i) => {
      if (r.reading !== null && r.reading === reading) matched = i;
    });
    if (matched !== null) {
      const a = board.rows[matched].action;
      helperOn = a === 'open' || a === 'on';
    }
    let opened = false;
    if (helperFor(board.level) === 'door' && helperOn && waiting > 0) {
      inside += waiting;
      waiting = 0;
      opened = true;
      // The door shuts behind the friend: nothing is near any more, so the next step reads afresh.
      helperOn = false;
    }
    if (helperFor(board.level) === 'heater') warmth = Math.max(0, Math.min(WARMTH_MAX, warmth + (helperOn ? 1 : -1)));
    trace.push({ step, sun: day.sun[step], arrived, reading, matched, helperOn, opened, waiting, inside, warmth });
  }
  const failure = judge(board.level, trace, day);
  return { trace, met: failure === null, failure };
}

/** The unmet goal's one name, or null when the day met it. */
export function judge(level: number, trace: Trace[], day: Day): Failure | null {
  const last = trace[trace.length - 1];
  if (level === 1) return last.inside >= day.arrivals.length ? null : 'friend-waiting';
  if (level === 4 || onGauge(level)) {
    // The first step out of the comfy band names the failure; level 7 then counts the heater's switches.
    const off = trace.find((t) => t.step >= COMFY.from && (t.warmth < COMFY.min || t.warmth > COMFY.max));
    if (off) return off.warmth > COMFY.max ? 'too-warm' : 'never-warms';
    return level === 7 && switches(trace) > JAR ? 'heater-busy' : null;
  }
  const darkOff = trace.some((t) => t.sun === 'dark' && !t.helperOn);
  if (level === 2) return darkOff ? 'sensor-blind' : null;
  if (level === 5) {
    // On the bench the sun sensor reads nothing; under the lamp its own light can switch it off in the dark.
    if (trace.every((t) => t.reading === 'far')) return 'sensor-blind';
    if (trace.some((t) => t.sun === 'dark' && !t.helperOn && t.reading === 'bright')) return 'lamp-flickers';
  }
  if (darkOff) return 'lamp-off-at-night';
  return last.helperOn ? 'lamp-on-at-morning' : null;
}

export function meetsGoal(board: Board, day: Day): boolean {
  return runDay(board, day).met;
}

// ——— Days ———

/** Sun scripts: dim, at least four bright, a dim dusk, at least three dark, a dim dawn, bright at the end. */
export const SUN_SCRIPTS: readonly SunLevel[][] = [
  ['dim', 'bright', 'bright', 'bright', 'bright', 'bright', 'dim', 'dark', 'dark', 'dark', 'dim', 'bright'],
  ['dim', 'bright', 'bright', 'bright', 'bright', 'dim', 'dark', 'dark', 'dark', 'dark', 'dim', 'bright'],
  ['dim', 'bright', 'bright', 'bright', 'bright', 'dim', 'dark', 'dark', 'dark', 'dim', 'bright', 'bright'],
];
/** Level 1: three arrivals at distinct steps among 1–10, at least two steps apart. */
export const ARRIVALS: readonly number[][] = [[2, 5, 8], [1, 4, 9], [3, 6, 10]];

/** Level 4 starts the nook a little chilly. */
export const START_WARMTH = 1;

/** The day a seed picks for a level; the seed never changes a rule. Level 4 has one day: only the friend and colours vary; level 5 reuses level 3's scripts. */
export function dayFor(level: number, rng: Rng): Day {
  if (level === 1) return { sun: SUN_SCRIPTS[0].slice(), arrivals: rng.pick(ARRIVALS).slice(), warmth: 0 };
  if (level === 4 || onGauge(level)) return { sun: SUN_SCRIPTS[0].slice(), arrivals: [], warmth: START_WARMTH };
  return { sun: rng.pick(SUN_SCRIPTS).slice(), arrivals: [], warmth: 0 };
}

// ——— Levels and briefs ———

export interface Plan {
  level: number;
  name: string;
  /** What the bench holds: sensors to place (levels 1–2 and 5), reading chips for the empty rows (levels 3–4), or nothing: the lines sit on the gauge (levels 6–7). */
  bench: 'sensors' | 'chips' | 'lines';
}

const PLANS: readonly Plan[] = [
  { level: 1, name: 'Wake the door', bench: 'sensors' },
  { level: 2, name: 'Lamp at dusk', bench: 'sensors' },
  { level: 3, name: 'On and off', bench: 'chips' },
  { level: 4, name: 'Chilly nook', bench: 'chips' },
  { level: 5, name: 'Where does it look?', bench: 'sensors' },
  { level: 6, name: 'The comfy line', bench: 'lines' },
  { level: 7, name: 'Calm heater', bench: 'lines' },
];
export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
}

export const SPECIES: readonly CritterName[] = ['pip', 'bear', 'dog', 'pig', 'duck', 'cat', 'bunny'];
export const HOUSE_COLORS: readonly ColorName[] = ['yellow', 'pink', 'teal', 'blue', 'green', 'orange'];

export interface Brief {
  level: number;
  day: Day;
  /** The board as the round opens. */
  board: Board;
  /** The sensors on the bench (levels 1–2) in screen order. */
  sensors: SensorKind[];
  /** The chips on the bench (levels 3–4). */
  chips: Chip[];
  /** The sockets the house shows. */
  sockets: Socket[];
  friend: { species: CritterName; color: ColorName };
  house: ColorName;
}

export function startBoard(level: number): Board {
  if (level === 1) return { level: 1, sensor: { kind: 'eye', socket: null }, rows: [{ reading: 'near', action: 'open', given: true }] };
  if (level === 2) return { level: 2, sensor: { kind: null, socket: 'post' }, rows: [{ reading: 'dark', action: 'on', given: true }] };
  if (level === 4) return { level: 4, sensor: { kind: 'thermo', socket: 'nook' }, rows: [{ reading: null, action: 'on', given: false }, { reading: null, action: 'off', given: false }] };
  // Level 3's answer, fixed; only the sensor's place is open, and it starts under the lamp.
  if (level === 5) return { level: 5, sensor: { kind: 'sun', socket: 'lamp' }, rows: [{ reading: 'dark', action: 'on', given: true }, { reading: 'bright', action: 'off', given: true }] };
  // The gauge's given rows: below the line → on, above it → off. Level 6's line starts at the top; level 7's two lines start together at level 6's lower answer.
  if (onGauge(level)) {
    const gap = level === 6 ? GAPS : 3;
    return { level, sensor: { kind: 'thermo', socket: 'nook' }, rows: [{ reading: null, action: 'on', given: true }, { reading: null, action: 'off', given: true }], lines: { on: gap, off: gap } };
  }
  return { level: 3, sensor: { kind: 'sun', socket: 'post' }, rows: [{ reading: 'dark', action: 'on', given: true }, { reading: null, action: 'off', given: false }] };
}

/** The chips a level's open rows take, in the order a tap on a row cycles them. */
export function chipsFor(level: number): Chip[] {
  // Bright first at level 3, so help and the ghost finger turn the lamp off at the last moment before the morning.
  return level === 4 ? [...ZONES] : [...SUN_LEVELS].reverse();
}

/** The round's brief from the level and the seeded RNG: the same seed gives the same day, friend and colours. */
export function briefFor(level: number, rng: Rng): Brief {
  const plan = planFor(level);
  const day = dayFor(plan.level, rng);
  const species = rng.pick(SPECIES);
  const colors = ['teal', 'brown', 'orange', 'pink', 'yellow', 'green', 'blue', 'purple'] as const;
  const friend = { species, color: rng.pick(colors) as ColorName };
  const house = rng.pick(HOUSE_COLORS);
  return {
    level: plan.level,
    day,
    board: startBoard(plan.level),
    sensors: plan.level === 1 ? ['eye'] : plan.level === 2 ? rng.shuffle<SensorKind>(['eye', 'sun']) : plan.level === 5 ? ['sun'] : [],
    chips: plan.level === 3 ? rng.shuffle<Chip>([...SUN_LEVELS]) : plan.level === 4 ? [...ZONES] : [],
    sockets: plan.level === 1 ? ['door', 'window'] : plan.level === 4 ? ['nook'] : plan.level === 5 ? ['lamp', 'roof', 'shed'] : onGauge(plan.level) ? [] : ['post'],
    friend,
    house,
  };
}

// ——— Editing ———

/** The board with the sensor at a socket (null: back on the bench). Level 2's slot takes a kind instead. */
export function placeSensor(board: Board, kind: SensorKind | null, socket: Socket | null): Board {
  if (board.level === 1) return { ...board, sensor: { kind: 'eye', socket } };
  if (board.level === 5) return { ...board, sensor: { kind: 'sun', socket } };
  if (board.level === 2) return { ...board, sensor: { kind, socket: 'post' } };
  return board;
}

/** The board with row `index` reading `reading` (null empties it); a given row never changes. */
export function setRow(board: Board, index: number, reading: Reading | null): Board {
  const rows = board.rows.map((r, i) => (i === index && !r.given ? { ...r, reading } : r));
  return { ...board, rows };
}

/**
 * The board with a line moved to a gap (1–6). Level 6's one line moves both; at level 7 the two lines cannot cross: a
 * line stops at the other's gap.
 */
export function setLine(board: Board, piece: LinePiece, gap: number): Board {
  if (!board.lines) return board;
  const g = Math.max(1, Math.min(GAPS, Math.round(gap)));
  const { on, off } = board.lines;
  if (piece === 'line') return { ...board, lines: { on: g, off: g } };
  if (piece === 'on-line') return { ...board, lines: { on: Math.min(g, off), off } };
  return { ...board, lines: { on, off: Math.max(g, on) } };
}

/** The editable rows' indexes. */
export function openRows(board: Board): number[] {
  return board.rows.map((r, i) => (r.given ? -1 : i)).filter((i) => i >= 0);
}

export function sameBoard(a: Board, b: Board): boolean {
  return a.level === b.level && a.sensor.kind === b.sensor.kind && a.sensor.socket === b.sensor.socket
    && a.rows.length === b.rows.length && a.rows.every((r, i) => r.reading === b.rows[i].reading && r.action === b.rows[i].action)
    && a.lines?.on === b.lines?.on && a.lines?.off === b.lines?.off;
}

// ——— The board space ———

/** Every board the level can show, with its pieces placed or not. */
export function candidateBoards(brief: Brief): Board[] {
  const start = brief.board;
  if (brief.level === 1) return [null, ...brief.sockets].map((s) => placeSensor(start, 'eye', s));
  if (brief.level === 2) return [null, ...brief.sensors].map((k) => placeSensor(start, k, 'post'));
  if (brief.level === 5) return [null, ...brief.sockets].map((s) => placeSensor(start, 'sun', s));
  if (brief.level === 6) return Array.from({ length: GAPS }, (_, i) => ({ ...start, lines: { on: i + 1, off: i + 1 } }));
  if (brief.level === 7) {
    const out: Board[] = [];
    for (let on = 1; on <= GAPS; on++) for (let off = on; off <= GAPS; off++) out.push({ ...start, lines: { on, off } });
    return out;
  }
  let out: Board[] = [start];
  for (const row of openRows(start)) {
    out = out.flatMap((b) => [null, ...chipsFor(brief.level)].map((r) => setRow(b, row, r)));
  }
  return out;
}

/** Complete boards: every piece placed. */
export function complete(board: Board): boolean {
  if (board.lines) return true;
  if (placesSensor(board.level)) return board.sensor.kind !== null && board.sensor.socket !== null;
  return board.rows.every((r) => r.reading !== null);
}

/** The boards whose day meets the goal. */
export function solutions(brief: Brief): Board[] {
  return candidateBoards(brief).filter((b) => meetsGoal(b, brief.day));
}

/** Level 7's one accepted board: the on line at gap 3, the off line at gap 4. */
export const CALM = { on: 3, off: 4 } as const;

/** Level 4's one accepted board (its day never changes): cool → on, warm → off. */
function nookBoard(): Board {
  const day: Day = { sun: SUN_SCRIPTS[0].slice(), arrivals: [], warmth: START_WARMTH };
  let out: Board[] = [startBoard(4)];
  for (const row of openRows(out[0])) out = out.flatMap((b) => chipsFor(4).map((r) => setRow(b, row, r)));
  return out.find((b) => meetsGoal(b, day))!;
}

/** The open rows whose reading differs from the accepted board's. */
function wrongRows(board: Board, right: Board): number[] {
  return openRows(board).filter((i) => board.rows[i].reading !== right.rows[i].reading);
}

/**
 * The piece a named failure points at: the sensor (and its socket) or an open row. At level 4 a nook that never warms
 * points at the on row and a nook that gets too warm at the off row, unless that row is already right; then the other.
 */
export function glowFor(board: Board, failure: Failure): Piece {
  if (board.lines) {
    if (board.level === 6) return 'line';
    // Level 7: the line whose gap differs from the accepted board's (on 3, off 4); too cold points at the on line first.
    const right = CALM;
    const wrongOn = board.lines.on !== right.on;
    const wrongOff = board.lines.off !== right.off;
    const prefer: LinePiece = failure === 'never-warms' ? 'on-line' : 'off-line';
    const preferWrong = prefer === 'on-line' ? wrongOn : wrongOff;
    if (preferWrong || (!wrongOn && !wrongOff)) return prefer;
    return prefer === 'on-line' ? 'off-line' : 'on-line';
  }
  // Level 5 has no open rows: every failure points at where the sensor is.
  if (placesSensor(board.level) || failure === 'sensor-blind' || failure === 'friend-waiting') return 'sensor';
  const open = openRows(board);
  if (board.level === 4) {
    const prefer = failure === 'too-warm' ? 1 : 0;
    const wrong = wrongRows(board, nookBoard());
    return wrong.includes(prefer) || wrong.length === 0 ? prefer : wrong[0];
  }
  return open[0];
}

export interface Help {
  board: Board;
  /** What the pet placed this press: a piece, or null when the board already had everything. */
  placed: Piece | null;
}

/**
 * Show me: the first press places the next accepted piece the board needs; the second places the rest. At levels
 * 1–3 and 5 one piece completes the board, so a later press changes nothing and the pet says so; level 4 has two rows.
 */
export function helpFor(board: Board, brief: Brief, _presses: number): Help {
  if (board.lines) return lineHelp(board, brief);
  const right = solutions(brief)[0];
  if (!right) return { board, placed: null };
  if (placesSensor(board.level)) {
    if (board.sensor.kind === right.sensor.kind && board.sensor.socket === right.sensor.socket) return { board, placed: null };
    return { board: placeSensor(board, right.sensor.kind, right.sensor.socket), placed: 'sensor' };
  }
  if (meetsGoal(board, brief.day) && complete(board)) return { board, placed: null };
  const [row] = wrongRows(board, right);
  if (row === undefined) return { board, placed: null };
  return { board: setRow(board, row, right.rows[row].reading), placed: row };
}

/**
 * The gauge's Show me. Level 6: one press moves the line to the nearer accepted gap (4 from above, 3 from below).
 * Level 7: the first press sets the off line (or the one line that differs), the second the other.
 */
function lineHelp(board: Board, brief: Brief): Help {
  if (meetsGoal(board, brief.day)) return { board, placed: null };
  const { on, off } = board.lines!;
  if (board.level === 6) return { board: setLine(board, 'line', on >= 4 ? 4 : 3), placed: 'line' };
  if (off !== CALM.off) {
    // The off line first; if the on line sits above where the off line goes, it comes down with it, and the next press sets it.
    const next = { ...board, lines: { on: Math.min(on, CALM.off), off: CALM.off } };
    return { board: next, placed: 'off-line' };
  }
  return { board: setLine(board, 'on-line', CALM.on), placed: 'on-line' };
}

// ——— Accounting ———

/**
 * Hints for one round; misses are always 0. A day that does not meet the goal is an observation. The same failure on
 * two completed days lights the piece it points at and counts one hint, once, until that piece changes and the
 * failure returns twice. Show me counts one hint a press; the offered set-up counts one.
 */
export class Tally {
  readonly misses = 0;
  hints = 0;
  glowing: Piece | null = null;
  presses = 0;
  /** Completed days that did not meet the goal. */
  failedDays = 0;
  private last: Failure | null = null;
  private same = 0;

  /** A completed day that did not meet its goal. Returns whether the glow comes on now. */
  failed(board: Board, failure: Failure): boolean {
    this.failedDays++;
    if (this.glowing !== null) return false;
    this.same = failure === this.last ? this.same + 1 : 1;
    this.last = failure;
    if (this.same < 2) return false;
    this.glowing = glowFor(board, failure);
    this.hints++;
    return true;
  }

  /** A piece changed: a lit piece goes out and the count starts over. */
  changed(piece: Piece) {
    if (this.glowing === piece) this.glowing = null;
    this.same = 0;
    this.last = null;
  }

  help(): number {
    this.presses++;
    this.hints++;
    return this.presses;
  }

  /** The offered set-up after three failed days. */
  offered() {
    this.hints++;
  }
}

/** Whether the pet offers to set the house up: after three completed days that all failed. */
export function offersSetup(t: Tally): boolean {
  return t.failedDays >= 3;
}

// ——— The ghost finger ———

export type Move = { place: { kind: SensorKind; socket: Socket } } | { chip: Chip; row: number } | { line: LinePiece; gap: number } | { watch: true };

/**
 * What a capable child does next: place the piece the goal needs, then Watch. At level 3 the first Watch runs the day
 * as it is, so the lamp is seen staying on in the morning before the row is filled. At level 4 the on row, then the
 * off row, then Watch. At level 5 the first Watch shows the lamp flicker before the sensor goes up to the roof.
 */
export function nextMove(brief: Brief, board: Board, daysPlayed: number): Move {
  if (board.lines) {
    // Level 6: the line from the top down to gap 4 (Watch skips the guess). Level 7: Watch first (a pebble rolls out), then the off line up.
    if (brief.level === 6) return board.lines.on === 4 ? { watch: true } : { line: 'line', gap: 4 };
    if (daysPlayed === 0 && !meetsGoal(board, brief.day)) return { watch: true };
    if (board.lines.off !== CALM.off) return { line: 'off-line', gap: CALM.off };
    if (board.lines.on !== CALM.on) return { line: 'on-line', gap: CALM.on };
    return { watch: true };
  }
  const right = solutions(brief)[0];
  if (brief.level === 5 && daysPlayed === 0 && !meetsGoal(board, brief.day)) return { watch: true };
  if (placesSensor(brief.level)) {
    if (board.sensor.kind !== right.sensor.kind || board.sensor.socket !== right.sensor.socket) {
      return { place: { kind: right.sensor.kind!, socket: right.sensor.socket! } };
    }
    return { watch: true };
  }
  if (brief.level === 4) {
    const [row] = wrongRows(board, right);
    return row === undefined ? { watch: true } : { chip: right.rows[row].reading as Chip, row };
  }
  const [row] = openRows(board);
  if (daysPlayed === 0 && board.rows[row].reading === null) return { watch: true };
  if (!meetsGoal(board, brief.day)) return { chip: right.rows[row].reading as Chip, row };
  return { watch: true };
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const TILE = 110;
export const CARD = { w: 130, h: 110 };
export const WATCH = { w: 140, h: 104 };
export const BUTTON_R = 50;
const ARROW = 36;
const M = 20;
const GAP = 16;

export interface HouseLayout {
  house: Rect;
  /** One rect per socket of the brief, in its order. */
  sockets: Rect[];
  /** One rect per row: the reading card, then the action card. */
  rows: { reading: Rect; action: Rect }[];
  /** Bench tiles (sensors or chips), in the brief's order. */
  bench: Rect[];
  watch: Rect;
  step: Rect;
  undo: Rect;
  /** Levels 6–7: the warmth gauge, its handle lanes and the click jar. */
  gauge: GaugeLayout | null;
}

/** The gauge's tall column of seven warmth cells (0 at the bottom), a handle lane each side, and level 7's jar. */
export interface GaugeLayout {
  column: Rect;
  /** Height of one warmth cell; the gaps between cells are this far apart. */
  pitch: number;
  /** The on line's handles (level 6's one line) ride in the left lane, the off line's in the right. */
  left: Rect;
  right: Rect;
  jar: Rect | null;
}

/** One warmth cell's height on the gauge: gaps at least 60 apart, so the gauge is at least 420 tall. */
export const PITCH = 64;
export const JAR_BOX = { w: 200, h: 120 };

/** The y of gap k (1–6) on the gauge: the boundary between warmth k−1 and k. */
export function gapY(g: GaugeLayout, gap: number): number {
  return g.column.y + g.column.h - gap * g.pitch;
}

/** The y of a warmth cell's middle. */
export function warmthY(g: GaugeLayout, warmth: number): number {
  return g.column.y + g.column.h - (warmth + 0.5) * g.pitch;
}

/** The gap nearest a y on the gauge, 1–6. */
export function gapAt(g: GaugeLayout, y: number): number {
  return Math.max(1, Math.min(GAPS, Math.round((g.column.y + g.column.h - y) / g.pitch)));
}

/** A line's handle tab, centred on its gap in its lane. */
export function handleRect(g: GaugeLayout, piece: LinePiece, gap: number): Rect {
  const lane = piece === 'off-line' ? g.right : g.left;
  return { x: lane.x, y: gapY(g, gap) - TILE / 2, w: TILE, h: TILE };
}

/**
 * Level 5's sockets as fractions of the house rect, shared with the house art: under the lamp (inside the pool its
 * light draws), on the roof's peak above it, and in the shed's doorway at the left.
 */
export const SPOTS = {
  lamp: { x: 0.8, y: 0.58 },
  roof: { x: 0.49, y: 0.21 },
  shed: { x: 0.15, y: 0.78 },
} as const;

const button = (cx: number, cy: number, r = BUTTON_R): Rect => ({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r });

/**
 * The house left and the rule board, bench and buttons right in landscape; the house above them in portrait. Null when
 * the view cannot hold full-size targets (nothing shrinks).
 */
export function houseLayout(brief: Brief, v: View): HouseLayout | null {
  if (onGauge(brief.level)) return gaugeHouseLayout(brief, v);
  const wide = v.w >= v.h;
  const nRows = brief.board.rows.length;
  const nBench = planFor(brief.level).bench === 'chips' ? brief.chips.length : brief.sensors.length;
  const rowW = CARD.w + ARROW + CARD.w;
  let house: Rect;
  let rowX: number;
  let rowY: number;
  let benchX: number;
  let benchY: number;
  let by: number;
  let rightX: number;
  if (wide) {
    house = { x: PET_CORNER.w + M, y: M, w: Math.round(v.w * 0.42), h: v.h - 2 * M };
    rowX = house.x + house.w + M;
    rowY = M + 10;
    benchX = rowX;
    benchY = rowY + nRows * (CARD.h + GAP) + 24;
    by = v.h - M - WATCH.h / 2;
    rightX = v.w - M;
  } else {
    by = v.h - M - WATCH.h / 2;
    rightX = v.w - M;
    // The house takes what the rows, the bench and the buttons leave, up to a comfortable height.
    const boardH = Math.max(nRows * (CARD.h + GAP) - GAP, TILE);
    const houseH = Math.min(820, by - WATCH.h / 2 - M - boardH - M - M);
    house = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: houseH };
    rowX = M;
    rowY = house.y + house.h + M;
    benchX = rowX + rowW + 2 * M;
    benchY = rowY;
  }
  const rows = Array.from({ length: nRows }, (_, i) => {
    const y = rowY + i * (CARD.h + GAP);
    return { reading: { x: rowX, y, w: CARD.w, h: CARD.h }, action: { x: rowX + CARD.w + ARROW, y, w: CARD.w, h: CARD.h } };
  });
  const bench = Array.from({ length: nBench }, (_, i) => ({ x: benchX + i * (TILE + GAP), y: benchY, w: TILE, h: TILE }));
  const undo = button(rightX - BUTTON_R, by);
  const step = button(undo.x - GAP - BUTTON_R, by);
  const watch = { x: step.x - GAP - WATCH.w, y: by - WATCH.h / 2, w: WATCH.w, h: WATCH.h };
  // Sockets on the house: the door's eye socket above the door (left), the window's beside the window (right), the post's slot on the lamp post (right).
  const sockets = brief.sockets.map((s): Rect => {
    if (s === 'door') return { x: house.x + house.w * 0.3 - TILE / 2, y: house.y + house.h * 0.42 - TILE / 2, w: TILE, h: TILE };
    if (s === 'nook') return { x: house.x + house.w * 0.8 - TILE / 2, y: house.y + house.h * 0.6 - TILE / 2, w: TILE, h: TILE };
    if (s === 'lamp' || s === 'roof' || s === 'shed') {
      const at = SPOTS[s];
      return { x: house.x + house.w * at.x - TILE / 2, y: house.y + house.h * at.y - TILE / 2, w: TILE, h: TILE };
    }
    if (s === 'window') return { x: house.x + house.w * 0.72 - TILE / 2, y: house.y + house.h * 0.42 - TILE / 2, w: TILE, h: TILE };
    return { x: house.x + house.w * 0.8 - TILE / 2, y: house.y + house.h * 0.36 - TILE / 2, w: TILE, h: TILE };
  });
  const parts = [house, ...rows.flatMap((r) => [r.reading, r.action]), ...bench, watch, step, undo];
  if (house.h < 320 || house.w < 360) return null;
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  if (sockets.some((s) => !inside(s, v) || sockets.some((t) => t !== s && overlaps(s, t)))) return null;
  return { house, sockets, rows, bench, watch, step, undo, gauge: null };
}

/**
 * Levels 6–7. Landscape: the house left with the two rule rows under it, the gauge (handle lanes either side) and the
 * jar under it at the right. Portrait: the house above, then the gauge beside the rule rows with the jar under them.
 */
function gaugeHouseLayout(brief: Brief, v: View): HouseLayout | null {
  const wide = v.w >= v.h;
  const colH = (GAPS + 1) * PITCH;
  const blockW = 3 * TILE;
  const by = v.h - M - WATCH.h / 2;
  const rightX = v.w - M;
  const rowsH = 2 * CARD.h + GAP;
  const rowW = CARD.w + ARROW + CARD.w;
  let house: Rect;
  let gx: number;
  let gy: number;
  let rowX: number;
  let rowY: number;
  let jar: Rect;
  if (wide) {
    const houseX = PET_CORNER.w + M;
    const houseW = Math.round(v.w * 0.42);
    house = { x: houseX, y: M, w: houseW, h: v.h - 2 * M - rowsH - M };
    rowX = houseX;
    rowY = house.y + house.h + M;
    gx = Math.max(house.x + house.w + M, rightX - blockW - (v.w > 1100 ? JAR_BOX.w + M : 0));
    gy = M;
    // The jar under the gauge, or beside it when the view is wide enough.
    jar = v.w > 1100 ? { x: gx + blockW + M, y: gy + colH / 2 - JAR_BOX.h / 2, ...JAR_BOX } : { x: gx, y: gy + colH + M, ...JAR_BOX };
  } else {
    gx = M;
    gy = v.h - PET_CORNER.h - M - colH;
    house = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: Math.min(820, gy - 2 * M) };
    rowX = gx + blockW + 2 * M;
    rowY = gy;
    jar = { x: rowX, y: rowY + rowsH + M + 8, ...JAR_BOX };
  }
  const column = { x: gx + TILE, y: gy, w: TILE, h: colH };
  const gauge: GaugeLayout = {
    column,
    pitch: PITCH,
    left: { x: gx, y: gy, w: TILE, h: colH },
    right: { x: gx + 2 * TILE, y: gy, w: TILE, h: colH },
    jar: brief.level === 7 ? jar : null,
  };
  const rows = [0, 1].map((i) => {
    const y = rowY + i * (CARD.h + GAP);
    return { reading: { x: rowX, y, w: CARD.w, h: CARD.h }, action: { x: rowX + CARD.w + ARROW, y, w: CARD.w, h: CARD.h } };
  });
  const undo = button(rightX - BUTTON_R, by);
  const step = button(undo.x - GAP - BUTTON_R, by);
  const watch = { x: step.x - GAP - WATCH.w, y: by - WATCH.h / 2, w: WATCH.w, h: WATCH.h };
  const block = { x: gx, y: gy, w: blockW, h: colH };
  const rowBox = { x: rowX, y: rowY, w: rowW, h: rowsH };
  const parts = [house, block, rowBox, ...(gauge.jar ? [gauge.jar] : []), watch, step, undo];
  if (house.h < 320 || house.w < 360) return null;
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { house, sockets: [], rows, bench: [], watch, step, undo, gauge };
}
