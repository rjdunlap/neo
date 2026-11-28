import { describe, expect, it, vi } from 'vitest';
import { GAMES } from '../games/registry';
import { defaults, migrate } from '../progress/save';
import { MixMemory } from '../app/discovery';
import { hydrateSession, MIX_IDS, savedSession, startMix, step } from './mix';
import { cleanMix, emptyMix, type SavedSession } from './saved-mix';

const IDS = ['bubble-pop', 'sing-along-barn', 'fill-dump'];
const session = (
  items: SavedSession['items'],
  ids = IDS,
  place: SavedSession['place'] = 'lap',
): SavedSession => ({
  place,
  ids,
  items,
});

describe('the saved mix field (D5b)', () => {
  it('defaults to no lineup and no session; an older save without it reads as the default', () => {
    expect(defaults().mix).toEqual(emptyMix());
    const old = defaults() as unknown as Record<string, unknown>;
    delete old.mix;
    expect(migrate(old).mix).toEqual({ lineups: {}, session: null });
    expect(migrate(old).version).toBe(3);
  });
  it('repairs garbage to the default', () => {
    for (const raw of [null, 3, 'x', [], { lineups: 5, session: 'yes' }])
      expect(cleanMix(raw)).toEqual({ lineups: {}, session: null });
    expect(
      cleanMix({ lineups: { lap: ['Bubble Pop'], school: ['bubble-pop'], toddler: [] } }).lineups,
    ).toEqual({});
    expect(cleanMix({ lineups: { lap: ['a'.repeat(41)] } }).lineups).toEqual({});
  });
  it('trims a lineup to five and keeps only lap and toddler', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(cleanMix({ lineups: { lap: six, toddler: ['fill-dump'], grownup: ['a'] } }).lineups).toEqual({
      lap: six.slice(0, 5),
      toddler: ['fill-dump'],
    });
  });
  it('pads short items with upcoming, trims long ones, and keeps a seed only on a played item', () => {
    const raw = {
      place: 'toddler',
      ids: IDS,
      items: [
        { s: 'p', seed: 4 },
        { s: 's', seed: 9 },
      ],
    };
    expect(cleanMix({ session: raw }).session).toEqual({
      place: 'toddler',
      ids: IDS,
      items: [{ s: 'p', seed: 4 }, { s: 's' }, { s: 'u' }],
    });
    const long = { ...raw, items: [{ s: 'u' }, { s: 'x' }, { s: 'p', seed: 1 }, { s: 'u' }] };
    expect(cleanMix({ session: long }).session!.items).toHaveLength(3);
    // A played item with no usable receipt is only to play again.
    const bad = { ...raw, items: [{ s: 'p', seed: 1.5 }, { s: 'p' }, { s: 's' }] };
    expect(cleanMix({ session: bad }).session!.items).toEqual([{ s: 'u' }, { s: 'u' }, { s: 's' }]);
  });
  it('drops a session with a bad place, no IDs, too many IDs, an unknown state or nothing upcoming', () => {
    const ok = { place: 'lap', ids: IDS, items: [] };
    for (const s of [
      { ...ok, place: 'school' },
      { ...ok, ids: [] },
      { ...ok, ids: ['a', 'b', 'c', 'd', 'e', 'f'] },
      { ...ok, ids: ['Bubble'] },
      { ...ok, items: [{ s: 'q' }] },
      { ...ok, items: 'u' },
      { ...ok, items: [{ s: 's' }, { s: 'x' }, { s: 'p', seed: 1 }] },
    ])
      expect(cleanMix({ session: s }).session).toBeNull();
    expect(cleanMix({ session: ok }).session!.items).toEqual([{ s: 'u' }, { s: 'u' }, { s: 'u' }]);
  });
});

describe('hydrating a saved session (D5b)', () => {
  const stickers = [{ game: 'bubble-pop', seed: 7 }];
  const hydrate = (
    s: SavedSession | null,
    profile = 'lap' as const,
    place = 'lap' as const,
    catalog = GAMES,
  ) => hydrateSession(s, catalog, stickers, profile, place);

  it('carries on from the next stop with no stop at play, keeping played and skipped stops', () => {
    const h = hydrate(session([{ s: 'p', seed: 7 }, { s: 's' }, { s: 'u' }]))!;
    expect(h.ids).toEqual(IDS);
    expect(h.state).toEqual({
      items: [{ state: 'played', seed: 7 }, { state: 'skipped' }, { state: 'upcoming' }],
      at: null,
      round: 0,
    });
  });
  it('is not offered at another home spot, another band, or outside lap and toddler', () => {
    const s = session([{ s: 'u' }, { s: 'u' }, { s: 'u' }]);
    expect(hydrate(s, 'lap', 'toddler' as never)).toBeNull();
    expect(hydrate(s, 'toddler' as never, 'lap')).toBeNull();
    expect(hydrateSession(s, GAMES, stickers, 'preschool', 'preschool')).toBeNull();
    expect(hydrate(null)).toBeNull();
  });
  it('makes a stop whose game is gone or no longer at her band unavailable, never another game', () => {
    const older = GAMES.filter((m) => m.id !== 'sing-along-barn').map((m) =>
      m.id === 'fill-dump' ? { ...m, bands: m.bands.filter((b) => b !== 'lap') } : m,
    );
    const h = hydrate(session([{ s: 'u' }, { s: 'u' }, { s: 'u' }]), 'lap', 'lap', older as typeof GAMES)!;
    expect(h.state.items.map((i) => i.state)).toEqual(['upcoming', 'unavailable', 'unavailable']);
    expect(h.ids).toEqual(IDS);
  });
  it('plays a stop again when its sticker receipt is missing, and awards nothing', () => {
    const h = hydrate(
      session(
        [{ s: 'p', seed: 8 }, { s: 'p', seed: 7 }, { s: 'u' }],
        ['bubble-pop', 'bubble-pop', 'fill-dump'],
      ),
    )!;
    expect(h.state.items.map((i) => i.state)).toEqual(['upcoming', 'played', 'upcoming']);
  });
  it('is nothing when no stop is left to play after the checks', () => {
    const gone = GAMES.filter((m) => m.id !== 'fill-dump');
    expect(hydrate(session([{ s: 'p', seed: 7 }, { s: 's' }, { s: 'u' }]), 'lap', 'lap', gone)).toBeNull();
  });
  it('a live session saves as its letters, and as nothing once only the ending is left', () => {
    let s = startMix(IDS);
    s = step(step(s, { type: 'launch', p: 0 }), { type: 'finish', round: 1, seed: 3 });
    s = step(s, { type: 'skip', p: 1 });
    expect(savedSession('lap', IDS, s)).toEqual(session([{ s: 'p', seed: 3 }, { s: 's' }, { s: 'u' }]));
    expect(savedSession('lap', IDS, step(s, { type: 'unavailable', p: 2 }))).toBeNull();
  });
});

describe('the mix memory mirrors into the save (D5b)', () => {
  const make = () => {
    const save = vi.fn();
    const data = defaults();
    return { mem: new MixMemory(save), data, save };
  };
  it('saves a start, each settle and the end; the last settle clears the session', () => {
    const { mem, data, save } = make();
    mem.start(data, 'lap', IDS);
    expect(data.mix.session!.items.map((i) => i.s)).toEqual(['u', 'u', 'u']);
    mem.finish(mem.launch(data, 0)!, data, 5);
    mem.apply(data, { type: 'unavailable', p: 1 });
    expect(data.mix.session!.items).toEqual([{ s: 'p', seed: 5 }, { s: 'x' }, { s: 'u' }]);
    mem.apply(data, { type: 'skip', p: 2 });
    expect(data.mix.session).toBeNull();
    expect(mem.live(data)).toBeDefined(); // the ending is still live, in memory
    expect(save).toHaveBeenCalledTimes(4);
    mem.start(data, 'lap', IDS);
    mem.end();
    expect(data.mix.session).toBeNull();
  });
  it('a reload (a new memory) keeps the saved session; forget keeps it; only Explore-style end clears it', () => {
    const { mem, data } = make();
    mem.start(data, 'toddler', IDS);
    mem.forget();
    expect(data.mix.session).not.toBeNull();
    const after = new MixMemory(() => {});
    after.end(); // no live session: a boot's first screen clears nothing
    expect(data.mix.session).not.toBeNull();
    data.profile.band = 'toddler';
    expect(after.hydrate(data, 'toddler', GAMES, 'toddler')).toBe(true);
    expect(after.hydrate(data, 'toddler', GAMES, 'toddler')).toBe(false); // already live
    after.end();
    expect(data.mix.session).toBeNull();
  });
  it('clears a saved session it cannot offer, and one left at another band after a birthday', () => {
    const { mem, data } = make();
    mem.start(data, 'lap', IDS);
    mem.forget();
    expect(mem.hydrate(data, 'lap', [], 'lap')).toBe(false); // every game gone
    expect(data.mix.session).toBeNull();
    mem.start(data, 'lap', IDS);
    mem.forget();
    mem.discardStale(data, 'lap');
    expect(data.mix.session).not.toBeNull();
    mem.discardStale(data, 'toddler');
    expect(data.mix.session).toBeNull();
  });
  it("never saves a Today's six session, and its end leaves a saved place session alone", () => {
    const { mem, data } = make();
    mem.start(data, 'lap', IDS);
    mem.forget();
    const saved = structuredClone(data.mix);
    const stops = IDS.map((id) => ({ id, band: 'lap' as const, level: 1 }));
    mem.startDaily(data, stops, startMix(IDS), 'lap', '2026-11-28');
    mem.apply(data, { type: 'skip', p: 0 });
    mem.end();
    expect(data.mix).toEqual(saved);
  });
  it('saves each lineup edit; the default lineup saves as none, so Reset brings Little surprises back', () => {
    const { mem, data, save } = make();
    mem.hold(data, 'lap', ['fill-dump']);
    expect(data.mix.lineups).toEqual({ lap: ['fill-dump'] });
    mem.hold(data, 'lap', ['fill-dump']);
    expect(save).toHaveBeenCalledTimes(1);
    expect(new MixMemory(() => {}).lineup(data, 'lap')).toEqual(['fill-dump']);
    mem.start(data, 'lap', ['fill-dump']);
    mem.hold(data, 'lap', MIX_IDS);
    expect(data.mix.lineups).toEqual({});
    expect(data.mix.session!.ids).toEqual(['fill-dump']); // an edit never changes a saved session
  });
});
