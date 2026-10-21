import { beforeEach, describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS } from '../progress/bands';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { MixMemory } from '../app/discovery';
import { endingLine, MIX_IDS, mixGames, mixReturn, nextUp, startMix, step, type MixState } from './mix';

const finishAt = (s: MixState, p: number, seed = 7) => {
  const launched = step(s, { type: 'launch', p });
  return step(launched, { type: 'finish', round: launched.round, seed });
};

describe('Little surprises eligibility', () => {
  it('is the frozen three-game pool in order at lap and toddler on her own home spot', () => {
    for (const band of ['lap', 'toddler'] as const) expect(mixGames(band, band, GAMES)?.map(m => m.id)).toEqual([...MIX_IDS]);
  });
  it('offers nothing at older bands or on another band\'s home spot', () => {
    for (const band of BANDS.map(b => b.id).filter(b => b !== 'lap' && b !== 'toddler')) expect(mixGames(band, band, GAMES)).toBeNull();
    expect(mixGames('lap', 'toddler', GAMES)).toBeNull();
    expect(mixGames('toddler', 'lap', GAMES)).toBeNull();
  });
  it('never makes a partial mix: a missing, controller-only or unsupported game removes the whole entry', () => {
    expect(mixGames('lap', 'lap', GAMES.filter(m => m.id !== 'sing-along-barn'))).toBeNull();
    const controller = GAMES.map(m => m.id === 'fill-dump' ? { ...m, inputs: ['controller' as const] } : m);
    expect(mixGames('lap', 'lap', controller)).toBeNull();
    const older = GAMES.map(m => m.id === 'bubble-pop' ? { ...m, bands: m.bands.filter(b => b !== 'toddler') } : m);
    expect(mixGames('toddler', 'toddler', older)).toBeNull();
  });
});

describe('Little surprises planner', () => {
  it('runs 0 → 1 → 2 → ending, each stop settled once with its first sticker', () => {
    let s = startMix();
    expect(nextUp(s)).toBe(0);
    s = finishAt(s, 0, 11); expect(nextUp(s)).toBe(1);
    s = finishAt(s, 1, 22); expect(nextUp(s)).toBe(2);
    s = finishAt(s, 2, 33); expect(nextUp(s)).toBeNull();
    expect(s.items).toEqual([{ state: 'played', seed: 11 }, { state: 'played', seed: 22 }, { state: 'played', seed: 33 }]);
    expect(endingLine(s)).toBe('mix.end');
  });
  it('ignores a stale round and a second finish for the same round', () => {
    let s = step(startMix(), { type: 'launch', p: 0 });
    const stale = s.round;
    s = step(s, { type: 'launch', p: 0 }); // Again before the first finished
    expect(step(s, { type: 'finish', round: stale, seed: 1 })).toBe(s);
    s = step(s, { type: 'finish', round: s.round, seed: 2 });
    expect(step(s, { type: 'finish', round: s.round, seed: 3 }).items[0]).toEqual({ state: 'played', seed: 2 });
  });
  it('keeps a played stop played: Again, Next level and a later skip of the replay change nothing', () => {
    let s = finishAt(startMix(), 0, 5);
    s = finishAt(s, 0, 6);
    s = step(s, { type: 'launch', p: 0 });
    s = step(s, { type: 'skip', p: 0 });
    expect(s.items[0]).toEqual({ state: 'played', seed: 5 });
    expect(nextUp(s)).toBe(1);
  });
  it('skips from the preview or result, treats unavailable like skipped, and ends quietly when all are hopped over', () => {
    let s = step(startMix(), { type: 'skip', p: 0 });
    s = step(s, { type: 'unavailable', p: 1 });
    expect(nextUp(s)).toBe(2);
    s = step(s, { type: 'skip', p: 2 });
    expect(nextUp(s)).toBeNull();
    expect(s.items.map(i => i.state)).toEqual(['skipped', 'unavailable', 'skipped']);
    expect(endingLine(s)).toBe('mix.end.quiet');
    // A skipped stop cannot be played later by a late finish.
    expect(step(s, { type: 'finish', round: s.round, seed: 1 })).toBe(s);
  });
});

describe('Little surprises session', () => {
  let mix: MixMemory;
  beforeEach(() => { mix = new MixMemory(); store.data = defaults(); });

  it('belongs to one save: a replaced save (switch, reset, restore, undo) ignores late taps and finishes', () => {
    const owner = store.data;
    mix.start(owner, 'lap');
    const r = mix.launch(owner, 0)!;
    expect(mix.claim(owner)).toEqual(r);
    const other = defaults();
    mix.finish(r, other, 9);
    expect(mix.at(owner, 'lap')!.items[0].state).toBe('upcoming');
    expect(mix.live(other)).toBeUndefined();
    expect(mix.launch(other, 1)).toBeUndefined();
    mix.finish(r, owner, 9);
    expect(mix.at(owner, 'lap')!.items[0]).toEqual({ state: 'played', seed: 9 });
  });
  it('a round claimed once; an ended or restarted session rejects old rounds', () => {
    const owner = store.data;
    mix.start(owner, 'toddler');
    const r = mix.launch(owner, 0)!;
    expect(mix.claim(owner)).toEqual(r);
    expect(mix.claim(owner)).toBeUndefined();
    mix.start(owner, 'toddler'); // Again mix
    mix.finish(r, owner, 4);
    expect(mix.at(owner, 'toddler')!.items[0].state).toBe('upcoming');
    const r2 = mix.launch(owner, 0)!;
    mix.end();
    mix.finish(r2, owner, 4);
    expect(mix.live(owner)).toBeUndefined();
  });
  it('is held only at the home spot it started from', () => {
    mix.start(store.data, 'lap');
    expect(mix.at(store.data, 'lap')).toBeDefined();
    expect(mix.at(store.data, 'toddler')).toBeUndefined();
  });
  it('changes no saved progress', () => {
    const before = JSON.stringify(store.data);
    const owner = store.data;
    mix.start(owner, 'lap');
    mix.apply(owner, { type: 'skip', p: 0 });
    mix.finish(mix.launch(owner, 1)!, owner, 3);
    mix.end();
    expect(JSON.stringify(store.data)).toBe(before);
  });
});

describe('Little surprises returns (D3)', () => {
  const skip = (s: MixState, p: number) => step(s, { type: 'skip', p });
  const gone = (s: MixState, p: number) => step(s, { type: 'unavailable', p });
  it('with cards off is the sheet while a stop is upcoming, and the ending after', () => {
    expect(mixReturn(startMix(), false)).toEqual({ kind: 'sheet' });
    expect(mixReturn(finishAt(skip(startMix(), 0), 1), false)).toEqual({ kind: 'sheet' });
    expect(mixReturn(finishAt(skip(gone(startMix(), 1), 0), 2), false)).toEqual({ kind: 'ending' });
  });
  it('with cards on is the next upcoming stop\'s card, past played, skipped and unavailable stops, then the ending', () => {
    expect(mixReturn(startMix(), true)).toEqual({ kind: 'stop', p: 0 });
    expect(mixReturn(finishAt(startMix(), 0), true)).toEqual({ kind: 'stop', p: 1 });
    expect(mixReturn(skip(finishAt(startMix(), 0), 1), true)).toEqual({ kind: 'stop', p: 2 });
    expect(mixReturn(gone(skip(startMix(), 0), 1), true)).toEqual({ kind: 'stop', p: 2 });
    expect(mixReturn(finishAt(skip(finishAt(startMix(), 0), 1), 2), true)).toEqual({ kind: 'ending' });
  });
  it('never returns a played or skipped stop, and a second or stale skip from a card changes nothing', () => {
    for (let mask = 0; mask < 27; mask++) {
      let s = startMix();
      [0, 1, 2].forEach((p) => { const k = Math.floor(mask / 3 ** p) % 3; if (k === 1) s = finishAt(s, p); if (k === 2) s = skip(s, p); });
      const r = mixReturn(s, true);
      if (r.kind === 'stop') expect(s.items[r.p].state).toBe('upcoming');
      else expect(nextUp(s)).toBeNull();
    }
    const once = skip(startMix(), 1);
    expect(skip(once, 1)).toBe(once);
    const played = finishAt(startMix(), 1);
    expect(skip(played, 1)).toBe(played);
  });
});
