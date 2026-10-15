/** What the Esc key should do right now. */
export type EscapeAction = 'pause' | 'resume' | 'ignore';

export interface EscapeState {
  /** The grown-ups' page is open; it closes itself on Esc. */
  panelOpen: boolean;
  /** The pause sheet is up (or the grown-ups' page was opened from it). */
  paused: boolean;
  /** The scene on screen can be paused. */
  canPause: boolean;
  /** A scene change is under way. */
  busy: boolean;
}

/**
 * One rule for Esc on the island, kept apart from the DOM so it can be tested. The grown-ups' page listens for Esc
 * itself, so the key that closes it must not also open the pause sheet.
 */
export function escapeAction({ panelOpen, paused, canPause, busy }: EscapeState): EscapeAction {
  if (panelOpen) return 'ignore';
  if (paused) return 'resume';
  return canPause && !busy ? 'pause' : 'ignore';
}

type Pads = readonly ({ connected: boolean; buttons: readonly { pressed: boolean }[]; axes?: readonly number[] } | null)[];

function readPads(pads?: Pads): Pads {
  if (pads) return pads;
  try { return [...(navigator.getGamepads?.() ?? [])]; } catch { return []; }
}

/** Start (the standard mapping's button 9) on any connected pad, as one press: true on the frame it goes down. */
export class PadStart {
  private down = false;

  /** `pads` defaults to the browser's; a test passes its own. */
  poll(pads?: Pads): boolean {
    const now = readPads(pads).some((p) => !!p?.connected && !!p.buttons[9]?.pressed);
    const edge = now && !this.down;
    this.down = now;
    return edge;
  }
}

export const padStart = new PadStart();

/** What a pad did to the pause sheet this frame: move the focus up or down its buttons, or press the focused one. */
export type SheetPadAction = 'up' | 'down' | 'press' | null;

/**
 * A pad on the pause sheet: the d-pad (or the left stick) moves between its buttons, and A presses the focused one on
 * release, so the A that pressed it is up before the round runs again and cannot reach the game as a fresh press. Made
 * fresh for each sheet; a button already held when the sheet opens does nothing until it is let go.
 */
export class PadSheet {
  private prev: { up: boolean; down: boolean; a: boolean } | null = null;
  private armed = false;

  /** `pads` defaults to the browser's; a test passes its own. */
  poll(pads?: Pads): SheetPadAction {
    const list = readPads(pads).filter((p) => !!p?.connected);
    const held = (i: number) => list.some((p) => !!p!.buttons[i]?.pressed);
    const stick = (sign: number) => list.some((p) => (p!.axes?.[1] ?? 0) * sign > 0.5);
    const now = { up: held(12) || stick(-1), down: held(13) || stick(1), a: held(0) };
    const prev = this.prev;
    this.prev = now;
    if (!prev) return null;
    if (now.a && !prev.a) this.armed = true;
    if (!now.a && prev.a && this.armed) {
      this.armed = false;
      return 'press';
    }
    if (now.up && !prev.up) return 'up';
    if (now.down && !prev.down) return 'down';
    return null;
  }
}

/** One of the round's own entries on the pause sheet, such as starting the puzzle again. */
export interface PauseAction {
  label: string;
  run(): void;
}

/**
 * The labels for a game's *start again* and *show a hint* on the island's pause sheet: the couch pause menu's labels
 * where the couch plays it (`couch`), else plain ones for a game made only for grown-ups. A child's game whose help
 * follows misses offers none, so a hint stays something that arrives, not a button that steps her level down. Each
 * label needs the game to implement the method too.
 */
export function pauseLabels(
  bands: readonly string[],
  has: { restart: boolean; hint: boolean },
  couch?: { restart?: string; hint?: string },
): { restart?: string; hint?: string } {
  const grownup = bands.length > 0 && bands.every((b) => b === 'grownup');
  const restart = couch?.restart ?? (grownup ? 'Start again' : undefined);
  const hint = couch?.hint ?? (grownup ? 'Show a hint' : undefined);
  return { restart: has.restart ? restart : undefined, hint: has.hint ? hint : undefined };
}
