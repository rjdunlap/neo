/**
 * Performance marks for how fast a tap turns into a new screen (U7, docs/definitions/never-swallow-a-tap.md R1): a tap, the
 * screen change's start, the next scene built, its first frame and settled, and the chooser's cards shown. Each is a
 * standard `performance.mark` named `u7:<what>`, read by `scripts/tap-timing.mjs`; nothing in the app reads them.
 */
export type TimingMark = 'tap' | 'show' | 'init' | 'frame' | 'settled' | 'cards';

export function markTiming(what: TimingMark) {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') return;
  const name = `u7:${what}`;
  // Keep only the latest of each, so the buffer never grows over a long session.
  performance.clearMarks?.(name);
  performance.mark(name);
}
