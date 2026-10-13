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

/** Start (the standard mapping's button 9) on any connected pad, as one press: true on the frame it goes down. */
export class PadStart {
  private down = false;

  /** `pads` defaults to the browser's; a test passes its own. */
  poll(pads?: readonly ({ connected: boolean; buttons: readonly { pressed: boolean }[] } | null)[]): boolean {
    let list = pads;
    if (!list) {
      try { list = [...(navigator.getGamepads?.() ?? [])]; } catch { list = []; }
    }
    const now = list.some((p) => !!p?.connected && !!p.buttons[9]?.pressed);
    const edge = now && !this.down;
    this.down = now;
    return edge;
  }
}

export const padStart = new PadStart();
