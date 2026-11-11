/**
 * Memory Desk's rules (docs/definitions/memory-desk.md): a toy desk with a tray (what is coming in), a drawer (what is
 * kept) and a window (what comes out). Keep copies the tray into the drawer and Show copies the drawer into the window;
 * a copy never empties its source. Level 1, *Keep one*, is a free round that ends once the window has shown a kept
 * token while the tray holds a different one.
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { school: { min: 1, max: 1 } };

const NAMES: Record<number, string> = { 1: 'Keep one' };
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

export const stateAfter = (history: readonly Event[], from: State = EMPTY): State => history.at(-1)?.after ?? from;

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
