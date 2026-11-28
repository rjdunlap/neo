import { describe, expect, it } from 'vitest';
import type { Band } from '../progress/bands';
import { defaults, migrate } from '../progress/save';
import { emptyShells } from './shells';
import {
  cleanSeasons,
  countRound,
  emptySeasons,
  GOAL_BONUS,
  GOAL_TARGET,
  goalWords,
  progress,
  SEASON_GOALS,
  seasonDays,
  seasonOf,
  settle,
  type SeasonsSave,
} from './seasons';

const DAY = '2026-11-28';

describe('seasons', () => {
  it('are four weeks long and start on a Monday', () => {
    const s = seasonOf(DAY);
    const { first, last } = seasonDays(s);
    expect(new Date(`${first}T12:00:00`).getDay()).toBe(1);
    expect(seasonOf(first)).toBe(s);
    expect(seasonOf(last)).toBe(s);
    expect(seasonOf(seasonDays(s + 1).first)).toBe(s + 1);
    expect(first <= DAY && DAY <= last).toBe(true);
    for (const g of SEASON_GOALS) expect(goalWords(g)).toContain(String(GOAL_TARGET[g]));
  });

  it('count rounds and games for a grown-up only', () => {
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as Band[]) {
      const r = countRound(emptySeasons(), emptyShells(), 'tile-pairs', band, DAY, [], [], 1);
      expect(r.seasons).toEqual(emptySeasons());
    }
    let s = emptySeasons();
    for (const g of ['tile-pairs', 'tile-pairs', 'word-search'])
      s = countRound(s, emptyShells(), g, 'grownup', DAY, [], [], 1).seasons;
    expect(s.rounds).toBe(3);
    expect(s.games).toEqual(['tile-pairs', 'word-search']);
    expect(s.season).toBe(seasonOf(DAY));
  });

  it('pay each goal once a season, then add the keepsake', () => {
    const season = seasonOf(DAY);
    const full: SeasonsSave = {
      ...emptySeasons(),
      season,
      rounds: 49,
      games: Array.from({ length: 12 }, (_, i) => `g${i}`),
    };
    const stampDays = Array(6).fill(DAY);
    const r = countRound(full, emptyShells(), 'g0', 'grownup', DAY, Array(10).fill(DAY), stampDays, 99);
    expect(r.goals).toEqual(['sixes', 'games', 'rounds', 'stamps']);
    expect(r.bonus).toBe(SEASON_GOALS.reduce((n, g) => n + GOAL_BONUS[g], 0));
    expect(r.keepsake).toBe(true);
    expect(r.seasons.keepsakes).toEqual([{ season, at: 99 }]);
    const again = countRound(r.seasons, r.shells, 'g1', 'grownup', DAY, Array(10).fill(DAY), stampDays, 100);
    expect(again.goals).toEqual([]);
    expect(again.bonus).toBe(0);
    expect(again.seasons.keepsakes).toHaveLength(1);
  });

  it('start again at nothing in a new season, keeping keepsakes', () => {
    const season = seasonOf(DAY);
    const old: SeasonsSave = {
      season,
      rounds: 30,
      games: ['a'],
      paid: ['games'],
      keepsakes: [{ season: 1, at: 5 }],
    };
    const next = seasonDays(season + 1).first;
    const r = countRound(old, emptyShells(), 'tile-pairs', 'grownup', next, [], [], 1);
    expect(r.seasons).toEqual({
      season: season + 1,
      rounds: 1,
      games: ['tile-pairs'],
      paid: [],
      keepsakes: [{ season: 1, at: 5 }],
    });
    // Sixes and stamps dated in the old season do not count in the new one.
    expect(progress(r.seasons, season + 1, [DAY], [DAY])).toEqual({
      sixes: 0,
      games: 1,
      rounds: 1,
      stamps: 0,
    });
  });

  it('settle pays a goal met outside a round (an all-six day)', () => {
    const season = seasonOf(DAY);
    const r = settle({ ...emptySeasons(), season }, emptyShells(), season, Array(10).fill(DAY), [], 1);
    expect(r.goals).toEqual(['sixes']);
    expect(r.shells.balance).toBe(GOAL_BONUS.sixes);
    expect(r.keepsake).toBe(false);
  });

  it('repair a damaged save', () => {
    expect(cleanSeasons(undefined)).toEqual(emptySeasons());
    expect(
      cleanSeasons({
        season: 3,
        rounds: -4,
        games: ['a', 'a', 7, 'B!'],
        paid: ['games', 'nope'],
        keepsakes: [{ season: 2, at: 1 }, { season: 2, at: 9 }, { season: 'x' }],
      }),
    ).toEqual({ season: 3, rounds: 0, games: ['a'], paid: ['games'], keepsakes: [{ season: 2, at: 1 }] });
    expect(defaults().seasons).toEqual(emptySeasons());
    expect(migrate({ ...defaults(), seasons: { season: 2.5 } }).seasons).toEqual(emptySeasons());
  });
});
