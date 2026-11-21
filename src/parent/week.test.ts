import { describe, expect, it } from 'vitest';
import {
  KIND_WORDS,
  matchesSearch,
  weekKinds,
  weekRows,
  type KindInfo,
  type WeekRow,
  type WeekStats,
} from './week';

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

describe('This week says what the games asked (U8a R6)', () => {
  const row = (game: string, rounds: number, older = false): WeekRow<string> => ({
    game,
    rounds,
    minutes: rounds,
    pinned: null,
    older,
  });
  const games: Record<string, Partial<KindInfo>> = {
    count1: { kind: 'numbers' },
    count2: { kind: 'numbers' },
    count3: { kind: 'numbers' },
    word1: { kind: 'words' },
    word2: { kind: 'words' },
    tune: { kind: 'music' },
    couch: { kind: undefined, touch: false },
    puzzleA: { kind: 'logic' },
    puzzleB: { kind: 'logic', everPlayed: true },
    puzzleOld: { kind: 'logic', forBand: false },
    shapes: { kind: 'space' },
    spot: { kind: 'noticing' },
    aim: { kind: 'hands' },
    aimByPad: { kind: 'hands', touch: false },
  };
  const info = (g: string): KindInfo => ({
    name: g,
    forBand: true,
    touch: true,
    everPlayed: false,
    ...games[g],
  });

  it('counts games by kind, most first, ties in kind order, with number words', () => {
    const rows = [
      row('tune', 1),
      row('word1', 1),
      row('count1', 2),
      row('word2', 1),
      row('count2', 1),
      row('count3', 4),
      row('couch', 3),
    ];
    expect(weekKinds(rows, info, 0).sentence).toBe(
      'This week: three games with numbers, two with words and letters, and one with music.',
    );
  });

  it('says one game in the singular and joins two kinds with "and"', () => {
    expect(weekKinds([row('tune', 2), row('word1', 1)], info, 0).sentence).toBe(
      'This week: one game with words and letters and one with music.',
    );
    expect(weekKinds([row('count1', 3)], info, 0).sentence).toBe('This week: one game with numbers.');
  });

  it('says nothing in a week with fewer than three rounds, and leaves out unplayed and kindless games', () => {
    expect(weekKinds([row('tune', 1), row('word1', 1)], info, 0).sentence).toBeNull();
    expect(weekKinds([row('tune', 0), row('count1', 0)], info, 0).sentence).toBeNull();
    expect(weekKinds([row('couch', 5)], info, 0).sentence).toBeNull();
    // A pinned game she did not play is not counted.
    const pinned = { ...row('word1', 0), pinned: 2 };
    expect(weekKinds([row('count1', 3), pinned], info, 0).sentence).toBe('This week: one game with numbers.');
  });

  it('names a game of a kind she played nothing of, with its reason', () => {
    const rows = Object.keys(games).map((g) => row(g, g.startsWith('count') ? 1 : 0));
    const picked = weekKinds(rows, info, 0).untried!;
    // Week 0 starts at numbers, which was played, so words comes next.
    expect(picked.kind).toBe('words');
    expect(picked.line).toBe('Not played yet: word1. Nothing with words and letters this week.');
  });

  it('never picks a played game, a game of a played kind, a game above her band or one not by touch', () => {
    for (let week = 0; week < 30; week++) {
      const rows = Object.keys(games).map((g) => row(g, ['count1', 'word1', 'tune'].includes(g) ? 1 : 0));
      const picked = weekKinds(rows, info, week).untried!;
      expect(['numbers', 'words', 'music']).not.toContain(picked.kind);
      expect(['puzzleOld', 'aimByPad', 'couch', 'count2', 'count3', 'word2']).not.toContain(picked.game);
    }
  });

  it('prefers a game never played and says when one was played before', () => {
    const logicOnly = (g: string) => (info(g).kind === 'logic' ? info(g) : { ...info(g), kind: undefined });
    const rows = ['puzzleA', 'puzzleB'].map((g) => row(g, 0));
    for (let week = 0; week < 7; week++)
      expect(weekKinds(rows, logicOnly, week).untried!.game).toBe('puzzleA');
    const before = weekKinds([row('puzzleB', 0)], logicOnly, 3).untried!;
    expect(before.line).toBe('Not played this week: puzzleB. Nothing with patterns and rules this week.');
  });

  it('turns the pick with the week and holds it within one', () => {
    const rows = Object.keys(games).map((g) => row(g, 0));
    const kinds = new Set(Array.from({ length: 7 }, (_, w) => weekKinds(rows, info, w).untried!.kind));
    expect(kinds.size).toBe(7);
    expect(weekKinds(rows, info, 5)).toEqual(weekKinds(rows, info, 5));
  });

  it('shows the line in a quiet week and leaves it out when every kind was played', () => {
    const quiet = weekKinds([row('count1', 1), row('word1', 0)], info, 0);
    expect(quiet.sentence).toBeNull();
    expect(quiet.untried?.game).toBe('word1');
    const all = ['count1', 'word1', 'tune', 'puzzleA', 'shapes', 'spot', 'aim'].map((g) => row(g, 1));
    expect(weekKinds([...all, row('word2', 0)], info, 0).untried).toBeNull();
  });

  it('names and counts without grading or recommending', () => {
    const rows = Object.keys(games).map((g) => row(g, g.startsWith('count') ? 2 : 0));
    const { sentence, untried } = weekKinds(rows, info, 2);
    for (const words of [sentence, untried?.line, ...Object.values(KIND_WORDS)])
      expect(words).not.toMatch(/recommend|master|best|score|level|map|island|%/i);
  });
});
