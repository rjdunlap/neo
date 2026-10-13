import { describe, expect, it, vi } from 'vitest';
import type { Routes } from './App';
import { goToOrigin } from './origin';

const routes = () => ({ land: vi.fn(), place: vi.fn(), journal: vi.fn() }) as unknown as Routes & Record<'land' | 'place' | 'journal', ReturnType<typeof vi.fn>>;

describe('goToOrigin', () => {
  it('returns to the land, the home spot or the journal a game was opened from', () => {
    const fallback = vi.fn();
    const a = routes(); goToOrigin(a, { land: 'lantern-lake' }, fallback);
    expect(a.land).toHaveBeenCalledWith('lantern-lake');
    const b = routes(); goToOrigin(b, { place: 'grownup' }, fallback);
    expect(b.place).toHaveBeenCalledWith('grownup');
    const c = routes(); goToOrigin(c, { journal: true }, fallback);
    expect(c.journal).toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  it('uses the fallback when there is no origin', () => {
    const fallback = vi.fn(), go = routes();
    goToOrigin(go, undefined, fallback);
    expect(fallback).toHaveBeenCalledOnce();
    expect(go.land).not.toHaveBeenCalled();
  });
});
