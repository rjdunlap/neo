import { describe, expect, it, vi } from 'vitest';
import { neutral, type CouchControls } from '../engine/controller';
import { ENTRY_GUARD, SpotFocus, type FocusSpot } from './screen-keys';

const frame = (patch: Partial<ReturnType<typeof neutral>> = {}): CouchControls => ({
  players: [{ ...neutral(), ...patch }, neutral()],
  disconnected: false,
  status: '',
  controllers: 0,
});

const spot = (id: string, x: number, y: number, press = () => undefined): FocusSpot => ({ id, x, y, r: 50, press });

describe('SpotFocus', () => {
  const press = vi.fn();
  const spots = [spot('a', 100, 100), spot('b', 300, 100, press), spot('c', 100, 300)];
  const aged = () => {
    const f = new SpotFocus();
    f.update(spots, frame(), ENTRY_GUARD + 0.01, true);
    return f;
  };

  it('ignores everything for a moment after a screen appears', () => {
    const f = new SpotFocus();
    expect(f.update(spots, frame({ direction: 0 }), 0.1, true)).toBeNull();
    expect(f.update(spots, frame({ action: true }), 0.1, true)).toBeNull();
    expect(f.id).toBeNull();
  });

  it('starts on the first spot and moves to the nearest one that way', () => {
    const f = aged();
    expect(f.id).toBe('a');
    expect(f.update(spots, frame({ direction: 0 }), 0.016, true)).toBe('move');
    expect(f.id).toBe('b');
    f.id = 'a';
    f.update(spots, frame({ direction: 1 }), 0.016, true);
    expect(f.id).toBe('c');
  });

  it('stays put when nothing lies that way', () => {
    const f = aged();
    f.update(spots, frame({ direction: 3 }), 0.016, true);
    expect(f.id).toBe('a');
  });

  it('presses only a spot the ring was already showing on', () => {
    press.mockClear();
    const f = aged();
    f.focusOn('b');
    expect(f.update(spots, frame({ action: true }), 0.016, false)).toBeNull();
    expect(f.update(spots, frame({ direction: 0 }), 0.016, false)).toBeNull();
    expect(press).not.toHaveBeenCalled();
    expect(f.update(spots, frame({ action: true }), 0.016, true)).toBe('press');
    expect(press).toHaveBeenCalledTimes(1);
  });

  it('backs out on Backspace or B even before the ring shows, but not during the entry guard', () => {
    const f = aged();
    expect(f.update(spots, frame({ back: true }), 0.016, false)).toBe('back');
    expect(f.update(spots, frame({ undo: true }), 0.016, false)).toBe('back');
    expect(new SpotFocus().update(spots, frame({ back: true }), 0.1, false)).toBeNull();
  });

  it('falls back to the first spot when the one it was on goes away', () => {
    const f = aged();
    f.focusOn('b');
    const fewer = [spot('a', 100, 100), spot('c', 100, 300)];
    expect(f.indexIn(fewer)).toBe(0);
    f.update(fewer, frame(), 0.016, true);
    expect(f.id).toBe('a');
  });

  it('does nothing with no spots', () => {
    expect(new SpotFocus().update([], frame({ action: true }), 1, true)).toBeNull();
  });
});
