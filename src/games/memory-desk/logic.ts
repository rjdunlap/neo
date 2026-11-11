/**
 * Memory Desk's rules (docs/definitions/memory-desk.md): a toy desk with a tray (what is coming in), a drawer (what is
 * kept) and a window (what comes out). Keep copies the tray into the drawer and Show copies the drawer into the window;
 * a copy never empties its source. Level 1, *Keep one*, is a free round that ends once the window has shown a kept
 * token while the tray holds a different one. Levels 2–3 add a hatch per step: tokens arrive in a fixed queue, an open
 * hatch lets the new one into the drawer and a shut hatch keeps the old one, and the window reads the drawer after each
 * write. Level 2, *Open or shut*, sets two hatches for a sign; level 3, *Fix the desk*, repairs a wrong preset.
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

const NAMES: Record<number, string> = { 1: 'Keep one', 2: 'Open or shut', 3: 'Fix the desk' };
export const describeLevel = (level: number) => NAMES[level] ?? NAMES[1];

/** Six pictured things with distinct outlines, so a token is never told by colour alone. */
export const TOKENS = ['shell', 'leaf', 'star', 'acorn', 'feather', 'pebble'] as const;
export type Token = (typeof TOKENS)[number];
/** What a slot holds: a token, or nothing (drawn as a dotted outline). */
export type Slot = Token | null;

export interface State {
  /** The tray: what is coming in. */
  input: Slot;
  /** The drawer: what is kept. */
  stored: Slot;
  /** The window: what comes out. */
  output: Slot;
}

export const EMPTY: State = { input: null, stored: null, output: null };

export type Action = { kind: 'set'; token: Token } | { kind: 'keep' } | { kind: 'show' };

/** Put a token on the tray. Nothing else changes. */
export const setInput = (s: State, token: Token): State => ({ ...s, input: token });
/** Copy the tray into the drawer; the tray keeps its token. An empty tray leaves the drawer as it was. */
export const keep = (s: State): State => (s.input === null ? s : { ...s, stored: s.input });
/** Copy the drawer into the window; the drawer keeps its token. It never reads the tray. */
export const show = (s: State): State => ({ ...s, output: s.stored });

export function apply(s: State, a: Action): State {
  if (a.kind === 'set') return setInput(s, a.token);
  return a.kind === 'keep' ? keep(s) : show(s);
}

/** One press and the desk on each side of it. */
export interface Event {
  action: Action;
  before: State;
  after: State;
}

/** The desk after `actions`, from empty, with every step kept. */
export function replay(actions: readonly Action[], from: State = EMPTY): Event[] {
  const out: Event[] = [];
  let s = from;
  for (const action of actions) {
    const after = apply(s, action);
    out.push({ action, before: s, after });
    s = after;
  }
  return out;
}

export const stateAfter = (history: readonly Event[], from: State = EMPTY): State =>
  history.at(-1)?.after ?? from;

/**
 * The one contrast the round is for: the history holds, in order, a Keep with the tray on X, a change of the tray to a
 * different Y, and a Show while the drawer still has X and the tray has Y, so the window shows X beside a tray of Y.
 */
export function contrastSeen(history: readonly Event[]): boolean {
  let kept: Token | null = null;
  let changed = false;
  for (const e of history) {
    if (e.action.kind === 'keep') {
      if (e.before.input === null) continue;
      kept = e.before.input;
      changed = false;
    } else if (e.action.kind === 'set') {
      changed = kept !== null && e.action.token !== kept;
    } else if (kept !== null && changed) return true;
  }
  return false;
}

export interface Brief {
  level: number;
  /** The two token cards beside the tray. */
  tokens: [Token, Token];
}

export function briefFor(level: number, rng: Rng): Brief {
  const [a, b] = rng.shuffle([...TOKENS]);
  return { level, tokens: [a, b] };
}

/** The next control toward the contrast, for Help, a dim Done's nudge and the ghost finger. */
export type Move = { card: 0 | 1 } | 'keep' | 'show' | 'done';

export function nextMove(brief: Brief, history: readonly Event[]): Move {
  if (contrastSeen(history)) return 'done';
  const s = stateAfter(history);
  if (s.stored === null) return s.input === null ? { card: 0 } : 'keep';
  if (s.input === s.stored || s.input === null) return { card: brief.tokens[0] === s.stored ? 1 : 0 };
  return 'show';
}

export const actionFor = (brief: Brief, m: Exclude<Move, 'done'>): Action =>
  m === 'keep' || m === 'show' ? { kind: m } : { kind: 'set', token: brief.tokens[m.card] };

// ——— Levels 2–3: the hatch ———

/** One hatch per step: true is open (the arriving token is written), false is shut (the drawer holds). */
export type Hatches = readonly boolean[];

export interface HatchBrief {
  level: number;
  /** What the drawer holds before the first step: nothing at level 2, a stated token at level 3. */
  initialStored: Slot;
  /** The tokens that arrive on the tray, one per step, in this order. */
  queue: readonly Token[];
  /** What the sign asks the window to end on. */
  target: Token;
  /** How the hatches start: all shut at level 2, set and wrong at level 3. */
  preset: Hatches;
}

/** One step: the token arrives, then the write (only through an open hatch), then the read. Write before read, always. */
export function step(stored: Slot, input: Token, open: boolean): { stored: Slot; output: Slot } {
  const after = open ? input : stored;
  return { stored: after, output: after };
}

export interface StepTrace {
  input: Token;
  open: boolean;
  /** The drawer after this step's write. */
  stored: Slot;
  /** The window after this step's read. */
  output: Slot;
}

/** Every step of the queue under these hatches, and what the window ends on. */
export function run(brief: HatchBrief, hatches: Hatches): { trace: StepTrace[]; output: Slot } {
  const trace: StepTrace[] = [];
  let stored = brief.initialStored;
  let output: Slot = null;
  brief.queue.forEach((input, i) => {
    const open = hatches[i] === true;
    ({ stored, output } = step(stored, input, open));
    trace.push({ input, open, stored, output });
  });
  return { trace, output };
}

export const passes = (brief: HatchBrief, hatches: Hatches): boolean =>
  run(brief, hatches).output === brief.target;

/** Every setting of `n` hatches, all shut first, counting up with the first hatch as the lowest bit. */
export function allSettings(n: number): boolean[][] {
  return Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (_, i) => (m >> i) % 2 === 1));
}

/** Every hatch setting whose window ends on the sign's token. Check accepts all of them. */
export const solutions = (brief: HatchBrief): boolean[][] =>
  allSettings(brief.queue.length).filter((h) => passes(brief, h));

/** How many hatches differ. */
export const distance = (a: Hatches, b: Hatches): number => a.filter((v, i) => v !== b[i]).length;

/** The solution fewest changes away (the first such, in `allSettings` order). */
export function nearestSolution(hatches: Hatches, brief: HatchBrief): boolean[] {
  return solutions(brief).reduce((best, s) => (distance(hatches, s) < distance(hatches, best) ? s : best));
}

/** The lowest-numbered hatch that differs from the nearest solution, or null when the setting already passes. */
export function helpFor(hatches: Hatches, brief: HatchBrief): number | null {
  const near = nearestSolution(hatches, brief);
  const i = near.findIndex((v, j) => v !== hatches[j]);
  return i < 0 ? null : i;
}

/**
 * A step runs in three parts (arrive, write, read), so a run of n steps has 3n positions. The desk at `pos`: the tray
 * holds the latest token to arrive, the drawer has every write so far, and the window has the latest read.
 */
export function deskAt(brief: HatchBrief, hatches: Hatches, pos: number): State {
  let input: Slot = null;
  let stored = brief.initialStored;
  let output: Slot = null;
  brief.queue.forEach((token, i) => {
    if (pos >= 3 * i + 1) input = token;
    if (pos >= 3 * i + 2 && hatches[i]) stored = token;
    if (pos >= 3 * i + 3) output = stored;
  });
  return { input, stored, output };
}

/** How level 3's wrong desk is wrong: the sign wants the token that was there at the start, or the first or second to arrive. */
export const REPAIRS = ['held', 'first', 'second'] as const;
export type Repair = (typeof REPAIRS)[number];

function repairBrief(kind: Repair, kinds: readonly Token[], rng: Rng): HatchBrief {
  const [a, b, c] = kinds;
  // Held: the kept token never arrives again, so only an all-shut desk passes. Otherwise three different arrivals.
  const base =
    kind === 'held'
      ? { initialStored: c, queue: [a, b, a], target: c }
      : { initialStored: c, queue: [a, b, c], target: kind === 'first' ? a : b };
  const open: HatchBrief = { level: 3, ...base, preset: [] };
  const sols = solutions(open);
  const wrong = allSettings(3).filter((h) => !passes(open, h) && sols.some((s) => distance(s, h) === 1));
  return { ...open, preset: rng.pick(wrong) };
}

/** A round's briefs: at level 2 the same queue [X, Y] asked to end on Y and then on X; at level 3 two different repairs. */
export function hatchBriefs(level: number, rng: Rng): HatchBrief[] {
  const kinds = rng.shuffle([...TOKENS]);
  if (level <= 2) {
    const [x, y] = kinds;
    const brief = { level: 2, initialStored: null, queue: [x, y], preset: [false, false] };
    return [
      { ...brief, target: y },
      { ...brief, target: x },
    ];
  }
  const [first, second] = rng.shuffle([...REPAIRS]);
  return [repairBrief(first, kinds, rng), repairBrief(second, rng.shuffle(kinds.slice(0, 3)), rng)];
}

/** Which repair a level 3 brief is. */
export const repairOf = (brief: HatchBrief): Repair =>
  brief.target === brief.initialStored ? 'held' : brief.target === brief.queue[0] ? 'first' : 'second';

// ——— Layout ———

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const PANEL = 176;
export const CARD = 120;
export const ACTION = { w: 150, h: 108 };
export const BUTTON_R = 56;

export interface DeskLayout {
  /** Top to bottom in an upright view, left to right otherwise. */
  stacked: boolean;
  /** How much bigger than their drawn size the parts are (1 in landscape; up to 1.6 on a tall phone). */
  scale: number;
  cards: [Rect, Rect];
  tray: Rect;
  drawer: Rect;
  window: Rect;
  keep: Rect;
  show: Rect;
  done: Rect;
  undo: Rect;
}

const box = (cx: number, cy: number, w: number, h = w): Rect => ({ x: cx - w / 2, y: cy - h / 2, w, h });

/** Where everything sits. A tall view stacks the three panels rather than shrinking them. */
export function deskLayout(_level: number, v: Pick<View, 'w' | 'h'>): DeskLayout {
  const cx = v.w / 2;
  if (v.h > v.w) {
    // A tall phone has room to spare: the whole stack grows to fill it, up to 1.6 times.
    const k = Math.max(1, Math.min(1.6, (v.h - 48) / 930));
    const top = (v.h - 930 * k) / 2;
    const r = BUTTON_R * k;
    const side = Math.min(cx + 250 * k, v.w - r - 24);
    const y = (dy: number) => top + dy * k;
    return {
      stacked: true,
      scale: k,
      cards: [box(cx - 70 * k, y(60), CARD * k), box(cx + 70 * k, y(60), CARD * k)],
      tray: box(cx, y(228), PANEL * k),
      keep: box(cx, y(380), ACTION.w * k, ACTION.h * k),
      drawer: box(cx, y(532), PANEL * k),
      show: box(cx, y(684), ACTION.w * k, ACTION.h * k),
      window: box(cx, y(836), PANEL * k),
      undo: box(side, y(684), r * 2),
      done: box(side, y(836), r * 2),
    };
  }
  const cy = v.h / 2;
  return {
    stacked: false,
    scale: 1,
    cards: [box(cx - 437, cy - 94, CARD), box(cx - 437, cy + 36, CARD)],
    tray: box(cx - 232, cy - 94, PANEL),
    drawer: box(cx + 38, cy - 94, PANEL),
    window: box(cx + 308, cy - 94, PANEL),
    keep: box(cx - 97, cy + 96, ACTION.w, ACTION.h),
    show: box(cx + 173, cy + 96, ACTION.w, ACTION.h),
    undo: box(cx + 268, cy + 280, BUTTON_R * 2),
    done: box(cx + 408, cy + 280, BUTTON_R * 2),
  };
}

export const HATCH = 116;
export const STEP_CARD = 84;
export const TRACE = { w: 124, h: 48 };
export const HATCH_PANEL = 144;
export const HATCH_BUTTON_R = 54;
export const SIGN = 130;

export interface HatchLayout {
  /** Panels top to bottom beside the buttons in an upright view; left to right under the steps otherwise. */
  stacked: boolean;
  scale: number;
  /** The picture of the window with the wanted token in it. */
  sign: Rect;
  /** One per step, left to right: the arriving token, its hatch under it, and its two trace cells under that. */
  cards: Rect[];
  hatches: Rect[];
  /** The preset's trace (drawn at level 3 only), above hers. */
  presetTrace: Rect[];
  trace: Rect[];
  tray: Rect;
  drawer: Rect;
  window: Rect;
  step: Rect;
  slow: Rect;
  undo: Rect;
  check: Rect;
}

/** Where levels 2–3 sit: `steps` columns over the desk. A tall view stacks the panels and grows; nothing shrinks. */
export function hatchLayout(steps: number, v: Pick<View, 'w' | 'h'>): HatchLayout {
  const cx = v.w / 2;
  const col = (i: number, gap: number) => (i - (steps - 1) / 2) * gap;
  if (v.h > v.w) {
    const k = Math.max(1, Math.min(1.44, (v.h - 48) / 936));
    const top = Math.max(24, (v.h - 936 * k) / 2 - 40);
    const y = (dy: number) => top + dy * k;
    const row = (dy: number, w: number, h = w) =>
      Array.from({ length: steps }, (_, i) => box(cx + col(i, 140) * k, y(dy), w * k, h * k));
    const r = HATCH_BUTTON_R * 2 * k;
    const px = cx - 80 * k;
    const bx = cx + 140 * k;
    return {
      stacked: true,
      scale: k,
      sign: box(cx + 60 * k, y(75), SIGN * k),
      cards: row(190, STEP_CARD),
      hatches: row(302, HATCH),
      presetTrace: row(388, TRACE.w, TRACE.h),
      trace: row(440, TRACE.w, TRACE.h),
      tray: box(px, y(560), HATCH_PANEL * k),
      drawer: box(px, y(712), HATCH_PANEL * k),
      window: box(px, y(864), HATCH_PANEL * k),
      step: box(bx, y(544), r),
      slow: box(bx, y(656), r),
      undo: box(bx, y(768), r),
      check: box(bx, y(880), r),
    };
  }
  const cy = v.h / 2;
  const row = (dy: number, w: number, h = w) =>
    Array.from({ length: steps }, (_, i) => box(cx - 60 + col(i, 150), cy + dy, w, h));
  const r = HATCH_BUTTON_R * 2;
  return {
    stacked: false,
    scale: 1,
    sign: box(cx + 380, cy - 290, SIGN),
    cards: row(-300, STEP_CARD),
    hatches: row(-188, HATCH),
    presetTrace: row(-96, TRACE.w, TRACE.h),
    trace: row(-44, TRACE.w, TRACE.h),
    tray: box(cx - 220, cy + 120, HATCH_PANEL),
    drawer: box(cx - 60, cy + 120, HATCH_PANEL),
    window: box(cx + 100, cy + 120, HATCH_PANEL),
    step: box(cx + 380, cy - 150, r),
    slow: box(cx + 380, cy - 34, r),
    undo: box(cx + 380, cy + 82, r),
    check: box(cx + 380, cy + 198, r),
  };
}
