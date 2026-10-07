import { describe, expect, it } from 'vitest';
import { COUCH_INFO } from './catalog';
import {
  cleanName, COUCH_IDS, completeRound, couchDefaults, decide, isNew, levelFor, markSeen, newParty, nextTier, offers, playerNow, repairCouch, reshuffle,
  roundToken, seedFor, STOPS, tally, tierOf, UNLOCK_TIERS, unlockedIds, type CouchId, type CouchSave,
} from './party';
import { gameById } from '../games/registry';

const reload = (save: CouchSave) => repairCouch(JSON.parse(JSON.stringify(save)));
const tripSave = (mode: 'together' | 'faceoff', seed = 239): CouchSave => { const s = couchDefaults(); s.party = newParty(mode, seed); return s; };
/** Six made-up games, to exercise choosing three out of many before the catalog is that large. */
const SIX = ['a', 'b', 'c', 'd', 'e', 'f'] as unknown as CouchId[];

describe('isolated couch trips', () => {
  it('preserves offers, puzzle seed and progress through JSON reload; awards once per stop', () => {
    let save = tripSave('together');
    for (let stop = 0; stop < 6; stop++) {
      const choices = offers(save.party!, save.trips);
      expect(new Set(choices)).toEqual(new Set(unlockedIds(save.trips)));
      save.party!.selected = choices[stop % 3];
      const seed = seedFor(save.party!), token = roundToken(save.party!);
      save = reload(save);
      expect(offers(save.party!, save.trips)).toEqual(choices);
      expect(seedFor(save.party!)).toBe(seed);
      expect(completeRound(save, token, { misses: 8, hints: 2 })).toBe('stop');
      expect(completeRound(save, token, { misses: 0, hints: 0 })).toBe(false);
      expect(save.party!.rounds).toHaveLength(stop + 1);
    }
    expect(save.trips).toBe(1);
    expect(Object.values(save.stickers).reduce((n, v) => n + v!.count, 0)).toBe(6);
    expect(reload(save)).toEqual(save);
  });

  it('cannot settle an abandoned selection and only schedules supported game levels', () => {
    const save = tripSave('together'); save.party!.selected = 'penguin-slide';
    const token = roundToken(save.party!); save.party!.selected = 'bounce-back';
    expect(completeRound(save, token, { misses: 0, hints: 0 })).toBe(false);
    for (const id of COUCH_IDS) for (let stop = 0; stop < 6; stop++) {
      const mod = gameById(id)!, level = levelFor(id, stop);
      expect(mod.bands.some(b => level >= mod.levels(b).min && level <= mod.levels(b).max)).toBe(true);
    }
  });

  it('repairs malformed data without importing a child save, and bounds history without losing sticker counts', () => {
    expect(repairCouch({ version: 99, stickers: [], profile: { name: 'child' } })).toEqual(couchDefaults());
    const out = repairCouch({ version: 1, trips: -5, party: { seed: 8, selected: 'other', rounds: Array(100).fill({ id: 'penguin-slide', misses: -4, hints: NaN, seed: 7, level: 999 }) }, stickers: { 'penguin-slide': { count: 500, seed: 3 }, other: { count: 5 } } });
    expect(out.party!.rounds).toHaveLength(6);
    expect(out.party!.selected).toBe(null);
    expect(out.party!.rounds.every(r => r.misses === 0 && r.hints === 0 && r.level <= 5)).toBe(true);
    expect(out.stickers).toEqual({ 'penguin-slide': { count: 500, seed: 3 } });
  });

  it('upgrades a version 1 save without losing trips, stickers or the trip in progress', () => {
    const v1 = { version: 1, trips: 2, stickers: { 'penguin-slide': { count: 4, seed: 99 } }, party: { seed: 5, selected: 'bounce-back', rounds: [{ id: 'penguin-slide', seed: 3, level: 4, misses: 1, hints: 0 }] } };
    const out = repairCouch(JSON.parse(JSON.stringify(v1)));
    expect(out.version).toBe(3);
    expect(out.trips).toBe(2);
    expect(out.keepsake).toEqual({ at: 0 });
    expect(out.stickers['penguin-slide']).toEqual({ count: 4, seed: 99 });
    expect(out.party?.rounds).toHaveLength(1);
    expect(out.party?.selected).toBe('bounce-back');
    expect(out.party?.mode).toBe('together');
    expect(out.party?.turn).toBe(null);
    expect(out.seen).toEqual([]);
    expect(reload(out)).toEqual(out);
  });

  it('keeps one Lantern Night keepsake from the first finished trip, and never adds another', () => {
    const finish = (save: CouchSave, now: number) => {
      save.party = newParty('together', save.trips + 11);
      for (let stop = 0; stop < STOPS; stop++) {
        save.party.selected = offers(save.party, save.trips)[0];
        expect(completeRound(save, roundToken(save.party), { misses: 0, hints: 0 }, now)).toBe('stop');
        if (save.trips === 0) expect(save.keepsake).toBe(null);
      }
    };
    let save = couchDefaults();
    expect(save.keepsake).toBe(null);
    save.party = newParty('faceoff', 3); save.party.selected = 'memory-match' as CouchId;
    finish(save, 1_000);
    expect(save.trips).toBe(1);
    expect(save.keepsake).toEqual({ at: 1_000 });
    save = reload(save);
    finish(save, 9_999);
    expect(save.trips).toBe(2);
    expect(save.keepsake).toEqual({ at: 1_000 });
    expect(reload(save)).toEqual(save);
  });

  it('does not award the keepsake before the sixth stop, and repairs a damaged one', () => {
    const save = tripSave('together');
    for (let stop = 0; stop < STOPS - 1; stop++) {
      save.party!.selected = offers(save.party!, save.trips)[0];
      completeRound(save, roundToken(save.party!), { misses: 0, hints: 0 }, 77);
      expect(save.keepsake).toBe(null);
    }
    expect(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, keepsake: { at: 'noon' } }).keepsake).toEqual({ at: 0 });
    expect(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, keepsake: { at: -5 } }).keepsake).toEqual({ at: 0 });
    expect(repairCouch({ version: 3, trips: 3, stickers: {}, party: null, keepsake: null }).keepsake).toEqual({ at: 0 });
    expect(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, keepsake: { at: 5.9 } }).keepsake).toEqual({ at: 5 });
  });

  it('keeps two optional names, cleaned and bounded, through a reload and an old save', () => {
    expect(couchDefaults().names).toEqual(['', '']);
    expect(cleanName('  Ro   w\u0007an  ')).toBe('Ro wan');
    expect(cleanName('A very long name indeed, longer than fourteen')).toHaveLength(14);
    expect(cleanName('Zoë 🌟')).toBe('Zoë 🌟');
    expect(cleanName(42)).toBe('');
    expect(cleanName(null)).toBe('');
    const save = couchDefaults();
    save.names = ['Rob', 'Sam'];
    expect(reload(save).names).toEqual(['Rob', 'Sam']);
    expect(JSON.stringify(reload(save))).toBe(JSON.stringify(save));
    expect(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, names: ['  Al ', { x: 1 }, 'third'] }).names).toEqual(['Al', '']);
    expect(repairCouch({ version: 2, trips: 0, stickers: {}, party: null }).names).toEqual(['', '']);
    expect(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, names: 'Rob' }).names).toEqual(['', '']);
  });

  it('remembers which games were explained, once each, and only real games', () => {
    const save = couchDefaults();
    markSeen(save, 'bounce-back'); markSeen(save, 'bounce-back'); markSeen(save, 'penguin-slide');
    expect(save.seen).toEqual(['bounce-back', 'penguin-slide']);
    const out = repairCouch({ ...JSON.parse(JSON.stringify(save)), seen: ['penguin-slide', 'penguin-slide', 'not-a-game', 7, 'bounce-back'] });
    expect(out.seen).toEqual(COUCH_IDS.filter(id => id === 'penguin-slide' || id === 'bounce-back'));
  });
});

describe('unlocking games by finishing trips', () => {
  const tiers = [['penguin-slide'], ['bouncy-launch'], ['bounce-back']] as const;

  it('lists every couch game in exactly one tier, starting with a playable set', () => {
    expect(UNLOCK_TIERS[0].length).toBeGreaterThanOrEqual(3);
    expect([...UNLOCK_TIERS.flat()].sort()).toEqual([...COUCH_IDS].sort());
    for (const id of COUCH_IDS) expect(UNLOCK_TIERS.filter(t => t.includes(id))).toHaveLength(1);
  });

  it('opens one more tier per completed trip, derived from the count and never taken back', () => {
    expect(unlockedIds(0, tiers)).toEqual(['penguin-slide']);
    expect(unlockedIds(1, tiers)).toEqual(['penguin-slide', 'bouncy-launch']);
    expect(unlockedIds(2, tiers)).toEqual(['penguin-slide', 'bouncy-launch', 'bounce-back']);
    expect(unlockedIds(50, tiers)).toEqual(['penguin-slide', 'bouncy-launch', 'bounce-back']);
    expect(unlockedIds(-3, tiers)).toEqual(['penguin-slide']);
    expect(unlockedIds(Number.NaN, tiers)).toEqual(['penguin-slide']);
    expect(nextTier(0, tiers)).toEqual(['bouncy-launch']);
    expect(nextTier(2, tiers)).toBeUndefined();
  });

  it('marks only games opened by trips as new, until they have been explained', () => {
    const save = couchDefaults();
    expect(tierOf('bouncy-launch', tiers)).toBe(1);
    expect(isNew(save, 'penguin-slide', tiers)).toBe(false);
    expect(isNew(save, 'bouncy-launch', tiers)).toBe(true);
    markSeen(save, 'bouncy-launch');
    expect(isNew(save, 'bouncy-launch', tiers)).toBe(false);
  });

  it('keeps a trip in progress only on a game the save has unlocked', () => {
    const save = tripSave('together'); save.party!.selected = 'bounce-back';
    expect(reload(save).party!.selected).toBe('bounce-back');
  });
});

describe('choosing the next game', () => {
  const party = (rounds: CouchId[] = []) => {
    const p = newParty('together', 77);
    p.rounds = rounds.map((id, i) => ({ id, seed: i + 1, level: 3, misses: 0, hints: 0 }));
    return p;
  };

  it('offers three different unlocked games, the same ones after a reload', () => {
    const p = party();
    const first = offers(p, 0, [SIX]);
    expect(first).toHaveLength(3);
    expect(new Set(first).size).toBe(3);
    first.forEach(id => expect(SIX).toContain(id));
    expect(offers(JSON.parse(JSON.stringify(p)), 0, [SIX])).toEqual(first);
  });

  it('offers what exists when fewer than three are unlocked', () => {
    expect(offers(party(), 0, [['penguin-slide', 'bouncy-launch']])).toHaveLength(2);
  });

  it('avoids the last two games, and prefers games not played this trip', () => {
    for (let seed = 1; seed < 40; seed++) {
      const p = party(['a', 'b'] as unknown as CouchId[]); p.seed = seed;
      const choices = offers(p, 0, [SIX]);
      expect(choices).not.toContain('a'); expect(choices).not.toContain('b');
    }
    const p = party(['a', 'b', 'c', 'd'] as unknown as CouchId[]);
    // Only two games are neither recent nor played, so a played one fills the third place before a recent one.
    const choices = offers(p, 0, [SIX]);
    expect(choices).toEqual(expect.arrayContaining(['e', 'f']));
    expect(choices).not.toContain('c'); expect(choices).not.toContain('d');
  });

  it('reshuffles for free, and a reload keeps the new choices', () => {
    const p = party();
    const seen = new Set([offers(p, 0, [SIX]).join()]);
    for (let i = 0; i < 6; i++) { reshuffle(p); seen.add(offers(p, 0, [SIX]).join()); }
    expect(seen.size).toBeGreaterThan(1);
    const now = offers(p, 0, [SIX]);
    expect(offers(reload({ ...couchDefaults(), party: p }).party!, 0, [SIX])).toEqual(now);
  });
});

describe('face-off trips', () => {
  const start = (id: CouchId, stops = 0) => {
    const save = tripSave('faceoff');
    save.party!.rounds = Array.from({ length: stops }, () => ({ id: 'bounce-back' as CouchId, seed: 1, level: 3, misses: 0, hints: 0, winner: 'team' as const }));
    save.party!.selected = id;
    return save;
  };

  it('gives each turn its own board, and the second player the other turn', () => {
    const save = start('penguin-slide');
    const p = save.party!;
    expect(seedFor(p, 0)).not.toBe(seedFor(p, 1));
    expect(playerNow(p)).toBe(0);
    p.turn = { score: 1, misses: 0, hints: 0 };
    expect(playerNow(p)).toBe(1);
    expect(seedFor(p)).toBe(seedFor(p, 0));
  });

  it('settles a stop in two turns, awarding one sticker and one lantern once', () => {
    const save = start('penguin-slide');
    const first = roundToken(save.party!);
    expect(completeRound(save, first, { misses: 0, hints: 0, score: 3 })).toBe('turn');
    expect(save.party!.rounds).toHaveLength(0);
    expect(save.stickers).toEqual({});
    expect(completeRound(save, first, { misses: 0, hints: 0, score: 3 })).toBe(false);
    const second = roundToken(save.party!);
    expect(second).not.toBe(first);
    const after = reload(save);
    expect(roundToken(after.party!)).toBe(second);
    expect(completeRound(after, second, { misses: 1, hints: 1, score: 5 })).toBe('stop');
    expect(completeRound(after, second, { misses: 0, hints: 0, score: 0 })).toBe(false);
    expect(after.party!.rounds).toEqual([{ id: 'penguin-slide', seed: seedFor(save.party!), level: 4, misses: 1, hints: 1, scores: [3, 5], winner: 0 }]);
    expect(after.stickers['penguin-slide']?.count).toBe(1);
    expect(after.party!.turn).toBe(null);
  });

  it('puts each score with the player who earned it, whoever chose first', () => {
    const save = start('penguin-slide', 1);        // stop 2: player 2 chooses and plays first
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 2 });
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 6 });
    expect(save.party!.rounds[1].scores).toEqual([6, 2]);
    expect(save.party!.rounds[1].winner).toBe(1);
  });

  it('ties when scores are equal, and counts a team stop for both players', () => {
    const save = start('penguin-slide');
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 4 });
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 4 });
    expect(save.party!.rounds[0].winner).toBe('tie');
    save.party!.selected = 'bounce-back';
    expect(completeRound(save, roundToken(save.party!), { misses: 0, hints: 0 })).toBe('stop');
    expect(save.party!.rounds[1]).toMatchObject({ id: 'bounce-back', winner: 'team' });
    expect(save.party!.rounds[1].scores).toBeUndefined();
    expect(tally(save.party!)).toEqual([2, 2]);
  });

  it('says which way is better per game', () => {
    expect(decide('penguin-slide', [2, 5])).toBe(0);
    expect(decide('penguin-slide', [5, 2])).toBe(1);
    const info = COUCH_INFO['bouncy-launch'].score!, was = info.better;
    try {
      info.better = 'higher';
      expect(decide('bouncy-launch', [2, 5])).toBe(1);
    } finally { info.better = was; }
  });

  it('adds up wins without inventing a loser: the trip finishes either way', () => {
    const save = start('penguin-slide');
    for (let stop = 0; stop < STOPS; stop++) {
      save.party!.selected = 'penguin-slide';
      completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: stop % 2 ? 1 : 3 });
      completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 2 });
    }
    expect(save.trips).toBe(1);
    expect(save.party!.rounds).toHaveLength(STOPS);
    const [a, b] = tally(save.party!);
    expect(a + b).toBe(STOPS);
  });

  it('keeps together trips free of scores, and saves a face-off byte-for-byte through a backup', () => {
    const together = tripSave('together'); together.party!.selected = 'penguin-slide';
    completeRound(together, roundToken(together.party!), { misses: 0, hints: 0, score: 9 });
    expect(together.party!.rounds[0].scores).toBeUndefined();
    expect(together.party!.rounds[0].winner).toBeUndefined();
    const save = start('penguin-slide');
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 3 });
    expect(JSON.stringify(reload(save))).toBe(JSON.stringify(save));
    completeRound(save, roundToken(save.party!), { misses: 0, hints: 0, score: 1 });
    expect(JSON.stringify(reload(save))).toBe(JSON.stringify(save));
  });

  it('repairs a face-off save: no turn without a pending twin stop, no made-up winners', () => {
    const save = start('bounce-back');
    save.party!.turn = { score: 1, misses: 0, hints: 0 };
    expect(reload(save).party!.turn).toBe(null);
    const odd = reload({ version: 2, trips: 0, stickers: {}, party: { seed: 3, mode: 'faceoff', selected: null, rounds: [{ id: 'penguin-slide', scores: [1, 'x'], winner: 'robot' }] } } as unknown as CouchSave);
    expect(odd.party!.rounds[0].winner).toBeUndefined();
    expect(odd.party!.rounds[0].scores).toEqual([1, 0]);
  });
});
