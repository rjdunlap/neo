import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { missEvery, newTally } from '../../progress/coach';
import {
  KINDS,
  NAMES,
  PLANKS,
  POOL_IDS,
  boardFor,
  boardKey,
  check,
  countsAsMiss,
  cycle,
  fits,
  flat,
  hintFor,
  isSo,
  patterns,
  pool,
  propagates,
  roundPools,
  solutions,
  suppositionCount,
  words,
  code,
  type Board,
  type Domain,
  type Kind,
  type Plank,
  type PoolId,
} from './logic';

const S: Kind = 'straight';
const T: Kind = 'topsy';

/** Every mark state of a board: blank, Straight or Topsy for each islander. */
const markStates = (seats: number): Domain[][] =>
  [...Array(seats)].reduce<Domain[][]>(
    (all) => all.flatMap((m) => [null, ...KINDS].map((d) => [...m, d])),
    [[]],
  );

const boardOf = (id: PoolId, i: number): Board => {
  const pattern = pool(id)[i];
  return { seats: NAMES.slice(0, pattern.length), pattern, solution: solutions(pattern)[0] };
};

describe('Truth Bridge pools', () => {
  it('has the definition’s counts: 28 valid two-islander boards, 26 without a supposition, 16 flat and 10 chained', () => {
    const valid = patterns(2).filter((p) => solutions(p).length === 1);
    expect(patterns(2)).toHaveLength(49);
    expect(valid).toHaveLength(28);
    expect(valid.filter(propagates)).toHaveLength(26);
    expect(pool('gate-flat')).toHaveLength(16);
    expect(pool('gate-chained')).toHaveLength(10);
  });

  it('has 1,191 chained three-islander boards and leaves out the 40 flat ones', () => {
    const zero = patterns(3).filter((p) => solutions(p).length === 1 && propagates(p));
    expect(zero.filter(flat)).toHaveLength(40);
    expect(pool('bridge')).toHaveLength(1191);
  });

  it('gives every board exactly one marking where every sentence fits', () => {
    for (const id of POOL_IDS)
      for (const pattern of pool(id)) {
        const found = solutions(pattern);
        expect(found).toHaveLength(1);
        expect(pattern.every((s, seat) => fits(s, seat, found[0].kinds, found[0].plank))).toBe(true);
      }
  });

  it('matches the 404 supposition boards and the plank split of 198 direct and 174 supposition boards', () => {
    expect(pool('suppose')).toHaveLength(404);
    expect(pool('suppose').every((p) => suppositionCount(p) === 1)).toBe(true);
    expect(pool('planks')).toHaveLength(372);
    expect(pool('planks').filter((p) => suppositionCount(p) === 0)).toHaveLength(198);
    expect(pool('planks').filter((p) => suppositionCount(p) === 1)).toHaveLength(174);
  });

  it('plays a flat board and then a chained one at level 1, and one board at each later level', () => {
    expect(roundPools(1)).toEqual(['gate-flat', 'gate-chained']);
    expect(roundPools(2)).toEqual(['bridge']);
    expect(roundPools(3)).toEqual(['suppose']);
    expect(roundPools(4)).toEqual(['planks']);
  });
});

describe('Truth Bridge fit rule', () => {
  it('reads each sentence kind as the table says', () => {
    expect(isSo({ k: 'is', x: 1, kind: T }, 0, [S, T])).toBe(true);
    expect(isSo({ k: 'is', x: 1, kind: S }, 0, [S, T])).toBe(false);
    expect(isSo({ k: 'mine', x: 1, same: true }, 0, [T, T])).toBe(true);
    expect(isSo({ k: 'mine', x: 1, same: false }, 0, [T, T])).toBe(false);
    expect(isSo({ k: 'pair', same: true }, 1, [S, T, S])).toBe(true);
    expect(isSo({ k: 'pair', same: false }, 0, [S, T, T])).toBe(false);
    expect(isSo({ k: 'all', kind: T }, 0, [T, T, T])).toBe(true);
    expect(isSo({ k: 'all', kind: S }, 0, [S, T])).toBe(false);
    expect(isSo({ k: 'some' }, 0, [S, S, S])).toBe(false);
    expect(isSo({ k: 'some' }, 0, [S, S, T])).toBe(true);
    expect(isSo({ k: 'count', n: 1 }, 0, [T, S, T])).toBe(true);
    expect(isSo({ k: 'count', n: 2 }, 0, [T, S, T])).toBe(false);
    for (const plank of PLANKS)
      for (const chosen of PLANKS)
        for (const sound of [true, false])
          expect(isSo({ k: 'plank', plank, sound }, 0, [T, S, T], chosen)).toBe((plank === chosen) === sound);
  });

  it('fits a true sentence to a straight speaker and a false one to a Topsy speaker', () => {
    const both = { k: 'all', kind: T } as const;
    // "Both of us are Topsy": the speaker cannot be straight, so the speaker is Topsy and the other speaks straight.
    expect(fits(both, 0, [S, S])).toBe(false);
    expect(fits(both, 0, [S, T])).toBe(false);
    expect(fits(both, 0, [T, T])).toBe(false);
    expect(fits(both, 0, [T, S])).toBe(true);
  });

  it('lets "X is my kind" from a Topsy speaker mean X differs from them', () => {
    const mine = { k: 'mine', x: 1, same: true } as const;
    expect(fits(mine, 0, [T, S])).toBe(true);
    expect(fits(mine, 0, [T, T])).toBe(false);
  });

  it('writes the sentences with two names in the fixed order', () => {
    expect(words(code({ k: 'pair', same: false }, 1, ['duck', 'cat', 'bear']))).toBe(
      'Bear and Duck are different kinds.',
    );
    expect(words(code({ k: 'all', kind: T }, 0, ['cat', 'bear']))).toBe('Both of us are Topsy.');
    expect(words(code({ k: 'all', kind: T }, 0, ['cat', 'bear', 'duck']))).toBe('All of us are Topsy.');
  });
});

describe('Truth Bridge Cross and hints', () => {
  const planksFor = (board: Board): (Plank | null)[] => (board.solution.plank ? [null, ...PLANKS] : [null]);

  it('names the first blank islander or missing plank, then the first sentence that breaks', () => {
    for (const id of POOL_IDS)
      for (let i = 0; i < pool(id).length; i++) {
        const board = boardOf(id, i);
        for (const marks of markStates(board.seats.length))
          for (const plank of planksFor(board)) {
            const verdict = check(board, marks, plank);
            const blank = marks.indexOf(null);
            if (blank >= 0) expect(verdict).toEqual({ kind: 'blank', seat: blank });
            else if (board.solution.plank && !plank) expect(verdict.kind).toBe('choose-plank');
            else {
              const speaker = board.pattern.findIndex((s, seat) => !fits(s, seat, marks as Kind[], plank));
              expect(verdict).toEqual(speaker < 0 ? { kind: 'cross' } : { kind: 'wrong', speaker });
              if (speaker < 0) expect({ kinds: marks, plank }).toEqual(board.solution);
              if (
                plank !== board.solution.plank &&
                marks.every((m, seat) => m === board.solution.kinds[seat])
              )
                expect(board.pattern[speaker].k).toBe('plank');
            }
          }
      }
  });

  it.each(POOL_IDS)('walks hints from every partial marking and plank choice in %s', (id) => {
    for (let i = 0; i < pool(id).length; i++) {
      const board = boardOf(id, i);
      const seats = board.seats.length;
      for (const start of markStates(seats))
        for (const initialPlank of planksFor(board)) {
          const marks = [...start];
          let plank = initialPlank;
          let steps = 0;
          for (let hint = hintFor(board, marks, plank); hint; hint = hintFor(board, marks, plank)) {
            if ('seat' in hint) {
              expect(marks[hint.seat]).not.toBe(board.solution.kinds[hint.seat]);
              expect(hint.kind).toBe(board.solution.kinds[hint.seat]);
              expect(hint.kind).not.toBe(hint.suppose);
              marks[hint.seat] = hint.kind;
            } else {
              expect(plank).not.toBe(board.solution.plank);
              expect(hint.plank).toBe(board.solution.plank);
              expect(hint.plank).not.toBe(hint.suppose);
              plank = hint.plank;
            }
            expect(++steps).toBeLessThanOrEqual(seats + Number(id === 'planks'));
          }
          expect({ kinds: marks, plank }).toEqual(board.solution);
          expect(check(board, marks, plank).kind).toBe('cross');
        }
    }
  });

  it('teaches a supposition on every level 3 board before finishing from blank marks', () => {
    for (let i = 0; i < pool('suppose').length; i++) {
      const board = boardOf('suppose', i);
      const marks: Domain[] = [null, null, null];
      let suppositions = 0;
      for (let hint = hintFor(board, marks); hint && 'seat' in hint; hint = hintFor(board, marks)) {
        if (hint.suppose) {
          expect(hint.suppose).toBe(hint.kind === S ? T : S);
          expect(board.pattern[hint.speaker]).toBeDefined();
          suppositions++;
        }
        marks[hint.seat] = hint.kind;
      }
      expect(suppositions).toBe(1);
    }
  });

  it('counts one miss per distinct wrong complete answer, and the second counted miss brings a hint', () => {
    const seen = new Set<string>();
    const counts = newTally();
    const cross = (at: number, marks: Domain[]) => countsAsMiss(seen, at, marks) && missEvery(counts);
    expect(cross(0, [S, S])).toBe(false);
    expect(cross(0, [S, S])).toBe(false);
    expect(counts.misses).toBe(1);
    expect(cross(0, [T, T])).toBe(true);
    expect(cross(0, [T, T])).toBe(false);
    expect(counts.misses).toBe(2);
    // The same marks on the round's second board are a different answer.
    expect(countsAsMiss(seen, 1, [S, S])).toBe(true);
    expect(countsAsMiss(seen, 1, [S, S], 'left')).toBe(true);
    expect(countsAsMiss(seen, 1, [S, S], 'middle')).toBe(true);
    expect(countsAsMiss(seen, 1, [S, S], 'left')).toBe(false);
  });

  it('cycles a mark blank, Straight, Topsy, blank', () => {
    expect([cycle(null), cycle(S), cycle(T)]).toEqual([S, T, null]);
  });
});

describe('Truth Bridge boards', () => {
  it('seats distinct islanders from the cast, is the same for the same seed, and never repeats the board to avoid', () => {
    for (const id of POOL_IDS)
      for (let seed = 1; seed <= 40; seed++) {
        const board = boardFor(id, new Rng(seed));
        expect(board).toEqual(boardFor(id, new Rng(seed)));
        expect(board.seats).toHaveLength(id.startsWith('gate') ? 2 : 3);
        expect(new Set(board.seats).size).toBe(board.seats.length);
        expect(pool(id)).toContain(board.pattern);
        expect(board.solution).toEqual(solutions(board.pattern)[0]);
        const key = boardKey(board.seats, board.pattern);
        expect(
          boardKey(...(({ seats, pattern }) => [seats, pattern] as const)(boardFor(id, new Rng(seed), key))),
        ).not.toBe(key);
      }
  });
});
