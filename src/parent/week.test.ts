import { describe, expect, it } from 'vitest';
import { matchesSearch, weekRows, type WeekStats } from './week';

const NOW = 1_000_000_000;
const SINCE = NOW - 7 * 86_400_000;
const played = (n: number, seconds = 60): WeekStats['history'] =>
  Array.from({ length: n }, (_, i) => ({ at: NOW - i * 1000, seconds }));

describe('This week (U8a)', () => {
  const stats: Record<string, WeekStats> = {
    a: { pinned: null, history: [] },
    b: { pinned: null, history: played(2) },
    c: { pinned: 3, history: [] },
    d: { pinned: null, history: played(5) },
    old: { pinned: null, history: [{ at: SINCE - 1, seconds: 60 }] },
    bigPlayed: { pinned: null, history: played(1) },
    bigUnplayed: { pinned: null, history: [] },
  };
  const forAge = ['a', 'b', 'c', 'd', 'old'];
  const every = [...forAge, 'bigPlayed', 'bigUnplayed'];
  const { first, all } = weekRows(forAge, every, (g) => stats[g], SINCE);
  const ids = (rows: { game: string }[]) => rows.map((r) => r.game);

  it('opens on played and pinned games, most rounds first', () => {
    expect(ids(first)).toEqual(['d', 'b', 'bigPlayed', 'c']);
    expect(first.find((r) => r.game === 'c')?.pinned).toBe(3);
  });

  it('keeps every game for her age in the full list, in order, and a bigger game only once played', () => {
    expect(ids(all)).toEqual(['a', 'b', 'c', 'd', 'old', 'bigPlayed']);
    expect(all.find((r) => r.game === 'bigPlayed')?.older).toBe(true);
    expect(ids(first)).not.toContain('a');
    expect(ids(first)).not.toContain('old');
  });

  it('counts rounds and at least a minute this week only', () => {
    expect(all.find((r) => r.game === 'd')).toMatchObject({ rounds: 5, minutes: 5 });
    expect(all.find((r) => r.game === 'old')).toMatchObject({ rounds: 0, minutes: 0 });
    const short = weekRows(['s'], ['s'], () => ({ pinned: null, history: played(1, 5) }), SINCE);
    expect(short.first[0].minutes).toBe(1);
  });

  it('gives an empty first list for an empty week', () => {
    const empty = weekRows(['a'], ['a', 'z'], () => ({ pinned: null, history: [] }), SINCE);
    expect(empty.first).toEqual([]);
    expect(ids(empty.all)).toEqual(['a']);
  });

  it('searches names trimmed, in any case, anywhere in the name', () => {
    expect(matchesSearch('Lantern Lake Lights', ' lake ')).toBe(true);
    expect(matchesSearch('Lantern Lake Lights', 'LANTERN')).toBe(true);
    expect(matchesSearch('Bubble Pop', 'lake')).toBe(false);
    expect(matchesSearch('Bubble Pop', '   ')).toBe(true);
  });
});
