/**
 * Helper House's rules: a house with a helper (the door at level 1, the lamp at levels 2–3), a sensor that reads a
 * picture, rule rows that turn a reading into an action, and a twelve-step day the house runs by itself. The board
 * space is tiny and fully enumerated; a day never counts a miss, and the same unmet goal twice lights a fix.
 * Everything here is pure; the scene draws it. Definition: docs/definitions/helper-house.md (levels 1–3 built; the
 * heater, level 4, is RA3).
 */
import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

// ——— Readings, sensors, rules ———

export type SunLevel = 'dark' | 'dim' | 'bright';
export const SUN_LEVELS: readonly SunLevel[] = ['dark', 'dim', 'bright'];
export type EyeReading = 'near' | 'far';
export type Reading = SunLevel | EyeReading;
export type SensorKind = 'eye' | 'sun';
/** Where a sensor can sit: the door and the window (level 1), or the lamp post's one slot (levels 2–3). */
export type Socket = 'door' | 'window' | 'post';
export type Action = 'open' | 'on' | 'off';
export type Helper = 'door' | 'lamp';

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
}

export const STEPS = 12;

export interface Day {
  sun: SunLevel[];
  /** Level 1: the steps a friend arrives at the door. */
  arrivals: number[];
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
}

export type Failure = 'friend-waiting' | 'sensor-blind' | 'lamp-on-at-morning' | 'lamp-off-at-night';

export interface Outcome {
  trace: Trace[];
  met: boolean;
  failure: Failure | null;
}

/** The helper a level's rules drive. */
export function helperFor(level: number): Helper {
  return level === 1 ? 'door' : 'lamp';
}

/** What a sensor at a socket reads at a step; a sensor that sees nothing reads `far`. */
export function read(board: Board, day: Day, step: number, waiting: number): Reading {
  const s = board.sensor;
  if (s.kind === 'eye') {
    if (s.socket === 'door') return waiting > 0 ? 'near' : 'far';
    return 'far';
  }
  if (s.kind === 'sun' && s.socket === 'post') return day.sun[step];
  return 'far';
}

/** The twelve steps in order: the world changes, the sensor reads, the rows set the helper, the helper acts. */
export function runDay(board: Board, day: Day): Outcome {
  const trace: Trace[] = [];
  let helperOn = false;
  let waiting = 0;
  let inside = 0;
  for (let step = 0; step < STEPS; step++) {
    const arrived = day.arrivals.includes(step);
    if (arrived) waiting++;
    const reading = read(board, day, step, waiting);
    let matched: number | null = null;
    board.rows.forEach((r, i) => {
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
    trace.push({ step, sun: day.sun[step], arrived, reading, matched, helperOn, opened, waiting, inside });
  }
  const failure = judge(board.level, trace, day);
  return { trace, met: failure === null, failure };
}

/** The unmet goal's one name, or null when the day met it. */
export function judge(level: number, trace: Trace[], day: Day): Failure | null {
  const last = trace[trace.length - 1];
  if (level === 1) return last.inside >= day.arrivals.length ? null : 'friend-waiting';
  const darkOff = trace.some((t) => t.sun === 'dark' && !t.helperOn);
  if (level === 2) return darkOff ? 'sensor-blind' : null;
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

/** The day a seed picks for a level; the seed never changes a rule. */
export function dayFor(level: number, rng: Rng): Day {
  if (level === 1) return { sun: SUN_SCRIPTS[0].slice(), arrivals: rng.pick(ARRIVALS).slice() };
  return { sun: rng.pick(SUN_SCRIPTS).slice(), arrivals: [] };
}

// ——— Levels and briefs ———

export interface Plan {
  level: number;
  name: string;
  /** What the bench holds: sensors to place (levels 1–2) or reading chips for the empty row (level 3). */
  bench: 'sensors' | 'chips';
}

const PLANS: readonly Plan[] = [
  { level: 1, name: 'Wake the door', bench: 'sensors' },
  { level: 2, name: 'Lamp at dusk', bench: 'sensors' },
  { level: 3, name: 'On and off', bench: 'chips' },
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
  /** The chips on the bench (level 3). */
  chips: SunLevel[];
  /** The sockets the house shows. */
  sockets: Socket[];
  friend: { species: CritterName; color: ColorName };
  house: ColorName;
}

export function startBoard(level: number): Board {
  if (level === 1) return { level: 1, sensor: { kind: 'eye', socket: null }, rows: [{ reading: 'near', action: 'open', given: true }] };
  if (level === 2) return { level: 2, sensor: { kind: null, socket: 'post' }, rows: [{ reading: 'dark', action: 'on', given: true }] };
  return { level: 3, sensor: { kind: 'sun', socket: 'post' }, rows: [{ reading: 'dark', action: 'on', given: true }, { reading: null, action: 'off', given: false }] };
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
    sensors: plan.level === 1 ? ['eye'] : plan.level === 2 ? rng.shuffle<SensorKind>(['eye', 'sun']) : [],
    chips: plan.level === 3 ? rng.shuffle<SunLevel>([...SUN_LEVELS]) : [],
    sockets: plan.level === 1 ? ['door', 'window'] : ['post'],
    friend,
    house,
  };
}

// ——— Editing ———

/** The board with the sensor at a socket (null: back on the bench). Level 2's slot takes a kind instead. */
export function placeSensor(board: Board, kind: SensorKind | null, socket: Socket | null): Board {
  if (board.level === 1) return { ...board, sensor: { kind: 'eye', socket } };
  if (board.level === 2) return { ...board, sensor: { kind, socket: 'post' } };
  return board;
}

/** The board with row `index` reading `reading` (null empties it); a given row never changes. */
export function setRow(board: Board, index: number, reading: Reading | null): Board {
  const rows = board.rows.map((r, i) => (i === index && !r.given ? { ...r, reading } : r));
  return { ...board, rows };
}

/** The editable rows' indexes. */
export function openRows(board: Board): number[] {
  return board.rows.map((r, i) => (r.given ? -1 : i)).filter((i) => i >= 0);
}

export function sameBoard(a: Board, b: Board): boolean {
  return a.level === b.level && a.sensor.kind === b.sensor.kind && a.sensor.socket === b.sensor.socket
    && a.rows.length === b.rows.length && a.rows.every((r, i) => r.reading === b.rows[i].reading && r.action === b.rows[i].action);
}

// ——— The board space ———

/** Every board the level can show, with its pieces placed or not. */
export function candidateBoards(brief: Brief): Board[] {
  const start = brief.board;
  if (brief.level === 1) return [null, ...brief.sockets].map((s) => placeSensor(start, 'eye', s));
  if (brief.level === 2) return [null, ...brief.sensors].map((k) => placeSensor(start, k, 'post'));
  const out: Board[] = [];
  const [row] = openRows(start);
  // Bright first, so help and the ghost finger turn the lamp off at the last moment before the morning.
  for (const r of [null, ...[...SUN_LEVELS].reverse()]) out.push(setRow(start, row, r));
  return out;
}

/** Complete boards: every piece placed. */
export function complete(board: Board): boolean {
  if (board.level <= 2) return board.sensor.kind !== null && board.sensor.socket !== null;
  return board.rows.every((r) => r.reading !== null);
}

/** The boards whose day meets the goal. */
export function solutions(brief: Brief): Board[] {
  return candidateBoards(brief).filter((b) => meetsGoal(b, brief.day));
}

/** The piece a named failure points at: the sensor (and its socket) or the open row. */
export function glowFor(board: Board, failure: Failure): 'sensor' | 'row' {
  return board.level <= 2 || failure === 'sensor-blind' || failure === 'friend-waiting' ? 'sensor' : 'row';
}

export interface Help {
  board: Board;
  /** What the pet placed this press: a piece, or null when the board already had everything. */
  placed: 'sensor' | 'row' | null;
}

/**
 * Show me: the first press places the next accepted piece the board needs; the second places the rest. At levels
 * 1–3 one piece completes the board, so a later press changes nothing and the pet says so.
 */
export function helpFor(board: Board, brief: Brief, _presses: number): Help {
  const right = solutions(brief)[0];
  if (!right) return { board, placed: null };
  if (board.level <= 2) {
    if (board.sensor.kind === right.sensor.kind && board.sensor.socket === right.sensor.socket) return { board, placed: null };
    return { board: placeSensor(board, right.sensor.kind, right.sensor.socket), placed: 'sensor' };
  }
  const [row] = openRows(board);
  if (board.rows[row].reading !== null && meetsGoal(board, brief.day)) return { board, placed: null };
  return { board: setRow(board, row, right.rows[row].reading), placed: 'row' };
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
  glowing: 'sensor' | 'row' | null = null;
  presses = 0;
  /** Completed days that did not meet the goal. */
  failedDays = 0;
  private last: Failure | null = null;
  private same = 0;

  /** A completed day that did not meet its goal. Returns whether the glow comes on now. */
  failed(board: Board, failure: Failure): boolean {
    this.failedDays++;
    if (this.glowing) return false;
    this.same = failure === this.last ? this.same + 1 : 1;
    this.last = failure;
    if (this.same < 2) return false;
    this.glowing = glowFor(board, failure);
    this.hints++;
    return true;
  }

  /** A piece changed: a lit piece goes out and the count starts over. */
  changed(piece: 'sensor' | 'row') {
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

export type Move = { place: { kind: SensorKind; socket: Socket } } | { chip: SunLevel; row: number } | { watch: true };

/**
 * What a capable child does next: place the piece the goal needs, then Watch. At level 3 the first Watch runs the day
 * as it is, so the lamp is seen staying on in the morning before the row is filled.
 */
export function nextMove(brief: Brief, board: Board, daysPlayed: number): Move {
  const right = solutions(brief)[0];
  if (brief.level <= 2) {
    if (board.sensor.kind !== right.sensor.kind || board.sensor.socket !== right.sensor.socket) {
      return { place: { kind: right.sensor.kind!, socket: right.sensor.socket! } };
    }
    return { watch: true };
  }
  const [row] = openRows(board);
  if (daysPlayed === 0 && board.rows[row].reading === null) return { watch: true };
  if (!meetsGoal(board, brief.day)) return { chip: right.rows[row].reading as SunLevel, row };
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
}

const button = (cx: number, cy: number, r = BUTTON_R): Rect => ({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r });

/**
 * The house left and the rule board, bench and buttons right in landscape; the house above them in portrait. Null when
 * the view cannot hold full-size targets (nothing shrinks).
 */
export function houseLayout(brief: Brief, v: View): HouseLayout | null {
  const wide = v.w >= v.h;
  const nRows = brief.board.rows.length;
  const nBench = brief.level === 3 ? brief.chips.length : brief.sensors.length;
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
    if (s === 'window') return { x: house.x + house.w * 0.72 - TILE / 2, y: house.y + house.h * 0.42 - TILE / 2, w: TILE, h: TILE };
    return { x: house.x + house.w * 0.8 - TILE / 2, y: house.y + house.h * 0.36 - TILE / 2, w: TILE, h: TILE };
  });
  const parts = [house, ...rows.flatMap((r) => [r.reading, r.action]), ...bench, watch, step, undo];
  if (house.h < 320 || house.w < 360) return null;
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  if (sockets.some((s) => !inside(s, v) || sockets.some((t) => t !== s && overlaps(s, t)))) return null;
  return { house, sockets, rows, bench, watch, step, undo };
}
