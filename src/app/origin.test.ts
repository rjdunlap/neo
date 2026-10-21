import { describe, expect, it, vi } from 'vitest';
import type { Routes } from './App';
import { goToOrigin, placeAtRoot } from './origin';

const routes = () => ({ land: vi.fn(), place: vi.fn(), journal: vi.fn(), library: vi.fn(), explore: vi.fn() }) as unknown as Routes & Record<'land' | 'place' | 'journal' | 'library' | 'explore', ReturnType<typeof vi.fn>>;

describe('goToOrigin', () => {
  it('returns to the land, the home spot or the journal a game was opened from', () => {
    const fallback = vi.fn();
    const a = routes(); goToOrigin(a, { land: 'lantern-lake' }, fallback);
    expect(a.land).toHaveBeenCalledWith('lantern-lake');
    const b = routes(); goToOrigin(b, { place: 'grownup' }, fallback);
    expect(b.place).toHaveBeenCalledWith('grownup');
    const c = routes(); goToOrigin(c, { journal: true }, fallback);
    expect(c.journal).toHaveBeenCalled();
    const d = routes(); goToOrigin(d, { library: true }, fallback);
    expect(d.library).toHaveBeenCalled();
    expect(d.journal).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  it('returns to the Explore page a game was opened from, the other ages still turned (RW08)', () => {
    const fallback = vi.fn();
    const a = routes(); goToOrigin(a, { explore: 'all', page: 2, others: true }, fallback);
    expect(a.explore).toHaveBeenCalledWith('all', 2, true);
    const b = routes(); goToOrigin(b, { explore: 'favorites', page: 0 }, fallback);
    expect(b.explore).toHaveBeenCalledWith('favorites', 0, undefined);
    const c = routes(); goToOrigin(c, { explore: 'family', page: 0 }, fallback);
    expect(c.explore).toHaveBeenCalledWith('family', 0, undefined);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('uses the fallback when there is no origin', () => {
    const fallback = vi.fn(), go = routes();
    goToOrigin(go, undefined, fallback);
    expect(fallback).toHaveBeenCalledOnce();
    expect(go.land).not.toHaveBeenCalled();
  });

  it('sends the root\'s home spot, where the mix lives, to All games\' first page of her own games (RW08 slice 2)', () => {
    const go = routes();
    placeAtRoot(go);
    expect(go.explore).toHaveBeenCalledWith('all', 0, false);
    expect(go.place).not.toHaveBeenCalled();
  });
});
