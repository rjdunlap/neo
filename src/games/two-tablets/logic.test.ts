import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import {
  CASES,
  LEVELS,
  SIGNS,
  SOUNDS,
  WORDS,
  WORD_IDS,
  cribMap,
  consistent,
  describeLevel,
  hintGroup,
  judge,
  keys,
  makeRound,
  readingHint,
  readings,
  type CaseDef,
} from './logic';

/** Every bijection of the eight signs onto the eight sounds, by brute force: 8! = 40,320. */
function allKeys(): number[][] {
  const out: number[][] = [];
  const rec = (key: number[], left: number[]) => {
    if (!left.length) return void out.push(key);
    left.forEach((s, i) =>
      rec(
        [...key, s],
        left.filter((_, j) => j !== i),
      ),
    );
  };
  rec(
    [],
    SOUNDS.map((_, i) => i),
  );
  return out;
}
const ALL = allKeys();

/** The keys that agree with the crib, by filtering the full set (independent of `keys()`). */
const agreeing = (def: CaseDef) => {
  const fixed = cribMap(def);
  return ALL.filter((k) => [...fixed].every(([s, snd]) => k[s] === snd));
};

describe('the exhaustive counts', () => {
  it('enumerates all 8! bijections', () => expect(ALL.length).toBe(40320));

  it('level 1: the crib leaves exactly one key; level 2: exactly two', () => {
    expect(agreeing(CASES[1])).toHaveLength(1);
    expect(agreeing(CASES[2])).toHaveLength(2);
    expect(keys(CASES[1])).toHaveLength(1);
    expect(keys(CASES[2])).toHaveLength(2);
    expect(
      keys(CASES[2])
        .map((k) => `${k[6]}/${k[7]}`)
        .sort(),
    ).toEqual(['6/7', '7/6']);
  });

  it('keys() matches the brute-force filter at both levels', () => {
    [1, 2].forEach((l) => expect(keys(CASES[l]).sort()).toEqual(agreeing(CASES[l]).sort()));
  });

  it('every group has exactly one readable candidate and it is the answer; the others read in no key at all', () => {
    [1, 2].forEach((l) => {
      const def = CASES[l];
      const some = agreeing(def);
      def.groups.forEach((g) => {
        expect(readings(def, g)).toEqual([g.answer]);
        g.candidates
          .filter((c) => c !== g.answer)
          .forEach((c) => {
            expect(some.some((k) => g.signs.every((s, i) => k[s] === WORDS[c][i]))).toBe(false);
            expect(consistent(def, g, c)).toBe(false);
          });
      });
    });
  });

  it('level 2: the readings agree and both are in the true key, not the swapped one', () => {
    const def = CASES[2];
    const [first, second] = def.groups;
    const ks = keys(def);
    const trueKey = ks.find((k) => k[6] === 6)!;
    const swapped = ks.find((k) => k[6] === 7)!;
    expect(first.signs.every((s, i) => trueKey[s] === WORDS[first.answer][i])).toBe(true);
    expect(second.signs.every((s, i) => trueKey[s] === WORDS[second.answer][i])).toBe(true);
    [first, second].forEach((g) =>
      WORD_IDS.forEach((w) => expect(g.signs.every((s, i) => swapped[s] === WORDS[w][i])).toBe(false)),
    );
  });
});

describe('the cases', () => {
  it('the crib is aligned: one sign per sound, no crib sign is one the line marks unknown', () => {
    [1, 2].forEach((l) => {
      const def = CASES[l];
      def.crib.forEach((e) => expect(e.signs).toHaveLength(WORDS[e.word].length));
      const fixed = cribMap(def);
      expect(new Set(fixed.values()).size).toBe(fixed.size);
      expect(fixed.size).toBe(l === 1 ? 7 : 6);
      const unknown = Array.from({ length: SIGNS }, (_, s) => s).filter((s) => !fixed.has(s));
      expect(unknown).toEqual(l === 1 ? [7] : [6, 7]);
    });
  });

  it('every group offers three candidates including its answer, of the right length', () => {
    [1, 2].forEach((l) =>
      CASES[l].groups.forEach((g) => {
        expect(new Set(g.candidates).size).toBe(3);
        expect(g.candidates).toContain(g.answer);
        g.candidates.forEach((c) => expect(WORDS[c]).toHaveLength(g.signs.length));
      }),
    );
  });

  it('the ladder is two levels for grown-ups with descriptions', () => {
    expect(rangeFor(LEVELS, 'grownup')).toEqual({ min: 1, max: 2 });
    expect(describeLevel(1)).not.toBe(describeLevel(2));
  });
});

describe('seeded rounds', () => {
  it('the shape permutation covers every shape once and the counts do not change', () => {
    for (let seed = 1; seed <= 40; seed++) {
      [1, 2].forEach((l) => {
        const r = makeRound(l, new Rng(seed));
        expect([...r.shapes].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(keys(r.def)).toHaveLength(l);
        r.def.groups.forEach((g) => expect(readings(r.def, g)).toEqual([g.answer]));
      });
    }
  });

  it('the same seed gives the same round, and seeds differ', () => {
    expect(makeRound(2, new Rng(7))).toEqual(makeRound(2, new Rng(7)));
    const orders = new Set(Array.from({ length: 30 }, (_, i) => makeRound(2, new Rng(i + 1)).shapes.join()));
    expect(orders.size).toBeGreaterThan(5);
  });
});

describe('judging a commit', () => {
  it('judges only the groups with a pick', () => {
    const r = makeRound(2, new Rng(3));
    const right = r.def.groups.map((g) => g.candidates.indexOf(g.answer));
    expect(judge(r.def, right)).toEqual([true, true]);
    expect(judge(r.def, [-1, right[1]])).toEqual([null, true]);
    const wrong = right.map((c) => (c + 1) % 3);
    expect(judge(r.def, wrong)).toEqual([false, false]);
  });
});

describe('hints', () => {
  it('a first hint dims an unreadable candidate, never the right one; a second names the crib sign', () => {
    for (let seed = 1; seed <= 20; seed++) {
      [1, 2].forEach((l) => {
        const r = makeRound(l, new Rng(seed));
        r.def.groups.forEach((g, gi) => {
          const h0 = readingHint(r.def, gi, 0, new Set());
          expect(h0.kind).toBe('dim');
          if (h0.kind === 'dim') expect(g.candidates[h0.candidate]).not.toBe(g.answer);
          const h1 = readingHint(r.def, gi, 1, new Set(), new Set(h0.kind === 'dim' ? [h0.candidate] : []));
          if (h1.kind === 'crib') {
            expect(g.candidates[h1.candidate]).toBe(g.answer);
            expect(r.def.crib[h1.entry].signs[h1.pos]).toBe(
              g.signs.find((s) => cribMap(r.def).has(s) && r.def.crib[h1.entry].signs.includes(s)),
            );
          } else expect(h1.kind).toBe('other');
        });
      });
    }
  });

  it('the first hint reduces three candidates to two, then the crib hints lead to the answer, finishing both levels', () => {
    [1, 2].forEach((l) => {
      const r = makeRound(l, new Rng(11));
      const right = new Set<number>();
      for (let guard = 0; guard < 6 && right.size < r.def.groups.length; guard++) {
        const g = hintGroup(r.def, right);
        const dimmed = new Set<number>();
        let steps = 0;
        let last = readingHint(r.def, g, steps, right, dimmed);
        while (last.kind === 'dim') {
          dimmed.add(last.candidate);
          steps++;
          last = readingHint(r.def, g, steps, right, dimmed);
        }
        expect(dimmed.size).toBe(1);
        expect(last.kind === 'crib' || last.kind === 'other').toBe(true);
        right.add(g);
      }
      expect(right.size).toBe(r.def.groups.length);
    });
  });

  it('a group with no known sign points to the group that teaches one', () => {
    const r = makeRound(2, new Rng(2));
    // Group 1 ([g6, g7]) has no crib sign; once its candidates are dimmed the hint sends her to group 0.
    const h = readingHint(r.def, 1, 1, new Set(), new Set([0, 1, 2]));
    expect(h).toEqual({ kind: 'other', group: 1, first: 0 });
    // After group 0 is read, g6 is known, so group 1 gets a key-strip pointer, not a crib entry.
    const after = readingHint(r.def, 1, 1, new Set([0]), new Set([0, 1, 2]));
    expect(after.kind).toBe('crib');
    if (after.kind === 'crib') expect(after.entry).toBe(-1);
  });
});
