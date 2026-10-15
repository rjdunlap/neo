import { describe, expect, it } from 'vitest';
import { escapeAction, PadSheet, PadStart, pauseLabels, type EscapeState } from './pause';

const idle: EscapeState = { panelOpen: false, paused: false, canPause: true, busy: false };

describe('escapeAction', () => {
  it('pauses a scene that can be paused', () => {
    expect(escapeAction(idle)).toBe('pause');
  });

  it('resumes when already paused', () => {
    expect(escapeAction({ ...idle, paused: true })).toBe('resume');
  });

  it('leaves the key to the grown-ups page while it is open, even from a paused scene', () => {
    expect(escapeAction({ ...idle, panelOpen: true })).toBe('ignore');
    expect(escapeAction({ ...idle, panelOpen: true, paused: true })).toBe('ignore');
  });

  it('ignores scenes that cannot pause (start, hatching, couch play) and scene changes', () => {
    expect(escapeAction({ ...idle, canPause: false })).toBe('ignore');
    expect(escapeAction({ ...idle, busy: true })).toBe('ignore');
  });

  it('still resumes during a scene change, so a pause is never stuck', () => {
    expect(escapeAction({ ...idle, paused: true, busy: true })).toBe('resume');
  });
});

describe('PadStart', () => {
  const pad = (start: boolean) => ({ connected: true, buttons: Array.from({ length: 10 }, (_, i) => ({ pressed: i === 9 && start })) });

  it('fires once per press, not while held', () => {
    const s = new PadStart();
    expect(s.poll([pad(false)])).toBe(false);
    expect(s.poll([pad(true)])).toBe(true);
    expect(s.poll([pad(true)])).toBe(false);
    expect(s.poll([pad(false)])).toBe(false);
    expect(s.poll([pad(true)])).toBe(true);
  });

  it('ignores no pad, a disconnected pad and other buttons', () => {
    const s = new PadStart();
    expect(s.poll([])).toBe(false);
    expect(s.poll([null, { ...pad(true), connected: false }])).toBe(false);
    expect(s.poll([{ connected: true, buttons: [{ pressed: true }] }])).toBe(false);
  });
});

describe('PadSheet', () => {
  const pad = (held: number[], y = 0) => ({ connected: true, axes: [0, y], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: held.includes(i) })) });

  it('moves on a d-pad or stick edge, once per push', () => {
    const s = new PadSheet();
    expect(s.poll([pad([])])).toBe(null);
    expect(s.poll([pad([13])])).toBe('down');
    expect(s.poll([pad([13])])).toBe(null);
    expect(s.poll([pad([])])).toBe(null);
    expect(s.poll([pad([12])])).toBe('up');
    expect(s.poll([pad([], -0.9)])).toBe(null);
    expect(s.poll([pad([])])).toBe(null);
    expect(s.poll([pad([], 0.9)])).toBe('down');
  });

  it('presses on the release of A, so the round never sees that A', () => {
    const s = new PadSheet();
    s.poll([pad([])]);
    expect(s.poll([pad([0])])).toBe(null);
    expect(s.poll([pad([0])])).toBe(null);
    expect(s.poll([pad([])])).toBe('press');
    expect(s.poll([pad([])])).toBe(null);
  });

  it('ignores whatever is already held when the sheet opens', () => {
    const s = new PadSheet();
    expect(s.poll([pad([0, 13])])).toBe(null);
    expect(s.poll([pad([0, 13])])).toBe(null);
    expect(s.poll([pad([])])).toBe(null);
  });

  it('ignores no pad and a disconnected one', () => {
    const s = new PadSheet();
    s.poll([]);
    expect(s.poll([null, { ...pad([13]), connected: false }])).toBe(null);
  });
});

describe('pauseLabels', () => {
  const both = { restart: true, hint: true };

  it('uses the couch pause menu\'s labels where the couch plays the game', () => {
    expect(pauseLabels(['school'], both, { restart: 'Clear this sea', hint: 'Show a hint' })).toEqual({ restart: 'Clear this sea', hint: 'Show a hint' });
    expect(pauseLabels(['school'], both, { restart: 'Start this pond again' })).toEqual({ restart: 'Start this pond again', hint: undefined });
  });

  it('gives a grown-ups-only game plain labels', () => {
    expect(pauseLabels(['grownup'], both)).toEqual({ restart: 'Start again', hint: 'Show a hint' });
  });

  it('offers a child\'s game nothing the couch has not labelled, so a hint is never a button that steps her down', () => {
    expect(pauseLabels(['school'], both)).toEqual({ restart: undefined, hint: undefined });
    expect(pauseLabels(['school', 'grownup'], both)).toEqual({ restart: undefined, hint: undefined });
  });

  it('needs the game to implement the method', () => {
    expect(pauseLabels(['grownup'], { restart: true, hint: false })).toEqual({ restart: 'Start again', hint: undefined });
    expect(pauseLabels(['school'], { restart: false, hint: false }, { restart: 'x', hint: 'y' })).toEqual({ restart: undefined, hint: undefined });
  });
});
