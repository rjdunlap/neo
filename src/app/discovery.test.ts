import { describe, expect, it, vi } from 'vitest';
import { DiscoveryMemory, launchDiscovery } from './discovery';
import { goToOrigin } from './origin';
import type { Origin } from './App';

describe('direct next visit and launch', () => {
  it('records only displayed choices, retains them on replay/home and resets on replacement or epoch change', () => {
    const memory = new DiscoveryMemory(); const a = {}; const b = {};
    const first = memory.token(a);
    expect(memory.last).toBeUndefined();
    memory.displayed(first, a, 'sing-along-barn');
    expect(memory.token(a)).toEqual(first);
    expect(memory.last).toBe('sing-along-barn');
    const second = memory.token(b);
    expect(memory.last).toBeUndefined();
    memory.displayed(first, b, 'fill-dump');
    expect(memory.last).toBeUndefined();
    memory.token(a);
    expect(memory.current(first, a)).toBe(false);
    expect(memory.current(second, a)).toBe(false);
    const fresh = memory.token(a); memory.clear();
    expect(memory.current(fresh, a)).toBe(false);
  });
  it('rejects a replaced save immediately even before a fresh scene observes it', () => {
    const memory = new DiscoveryMemory(); const save = {}; const token = memory.token(save);
    for (const replaced of [{ reset: true }, { restore: true }, { undo: true }, { reload: true }]) expect(memory.current(token, replaced)).toBe(false);
  });
  it.each<Origin | undefined>([{ land: 'bubble-beach' }, { place: 'lap' }, { journal: true }, undefined])('keeps origin %j and lets the normal route resolve live level/pin', origin => {
    const game = vi.fn();
    launchDiscovery({ game }, 'bubble-pop', 'lap', origin);
    expect(game).toHaveBeenLastCalledWith('bubble-pop', 'lap', undefined, false, origin);
    launchDiscovery({ game }, 'bubble-pop', 'toddler', origin);
    expect(game).toHaveBeenLastCalledWith('bubble-pop', 'toddler', undefined, false, origin);
    const land = vi.fn(), place = vi.fn(), journal = vi.fn(), fallback = vi.fn();
    goToOrigin({ land, place, journal } as never, origin, fallback);
    expect(land.mock.calls.length + place.mock.calls.length + journal.mock.calls.length + fallback.mock.calls.length).toBe(1);
    if (origin && 'land' in origin) expect(land).toHaveBeenCalledWith(origin.land);
    else if (origin && 'place' in origin) expect(place).toHaveBeenCalledWith(origin.place);
    else if (origin) expect(journal).toHaveBeenCalled();
    else expect(fallback).toHaveBeenCalled();
  });
});
