import { describe, expect, it } from 'vitest';
import { escapeAction, type EscapeState } from './pause';

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
