import { describe, expect, it } from 'vitest';
import { PickMemory } from './discovery';

describe('PickMemory', () => {
  it('holds the scope and last game for one save object only, and forgets them with it', () => {
    const m = new PickMemory();
    const a = {};
    const b = {};
    expect(m.scope(a)).toBeUndefined();
    m.choose(a, { kind: 'hearts' });
    m.played(a, 'bubble-pop');
    expect(m.scope(a)).toEqual({ kind: 'hearts' });
    expect(m.last(a)).toBe('bubble-pop');
    // A different save object (profile switch, reset, restore, undo) sees nothing, and taking it over drops the old one.
    expect(m.scope(b)).toBeUndefined();
    expect(m.last(b)).toBeUndefined();
    m.choose(b, { kind: 'lately' });
    expect(m.scope(a)).toBeUndefined();
    m.forget();
    expect(m.scope(b)).toBeUndefined();
  });
});
