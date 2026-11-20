import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import {
  absentLetters,
  bestMarks,
  candidateTries,
  consistent,
  goodSet,
  hintFor,
  ignoredMarks,
  LEVELS,
  planFor,
  PLANS,
  schoolSet,
  score,
  solverTries,
  SOLVER_BOUND,
  trayOf,
  visibleTries,
  type Mark,
  type Try,
} from './logic';
import { ANSWERS, BLOCKED5, GUESSES, POOL3, POOL4 } from './words';

const G: Mark = 'green';
const Y: Mark = 'yellow';
const X: Mark = 'gray';
const tried = (hidden: string, ...words: string[]): Try[] =>
  words.map((word) => ({ word, marks: score(hidden, word) }));

describe('the ladder', () => {
  it('school plays the picture levels and grown-up the five-letter level', () => {
    expect(rangeFor(LEVELS, 'school')).toEqual({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'grownup')).toEqual({ min: 3, max: 3 });
    expect(planFor(3).letters).toBe(5);
    expect(PLANS[1].letters).toBe(3);
  });
});

describe('score', () => {
  it('marks all checks, all crosses and a mix', () => {
    expect(score('CRANE', 'CRANE')).toEqual([G, G, G, G, G]);
    expect(score('CRANE', 'FOGGY')).toEqual([X, X, X, X, X]);
    expect(score('CRANE', 'SLATE')).toEqual([X, X, G, X, G]);
  });
  it('a letter tried twice where the word has one copy marks one match and one cross', () => {
    expect(score('ABOUT', 'LLAMA')).toEqual([X, X, Y, X, X]);
    expect(score('ROBIN', 'ERROR')).toEqual([X, Y, X, Y, X]);
    expect(score('HEN', 'EEE')).toEqual([X, G, X]);
  });
  it('a repeated letter in the word with one in the try marks the one copy', () => {
    expect(score('APPLE', 'PANIC')).toEqual([Y, Y, X, X, X]);
    expect(score('SPEED', 'ABIDE')).toEqual([X, X, X, Y, Y]);
  });
  it('a check takes precedence over a dot for the same letter', () => {
    expect(score('GRASS', 'SASSY')).toEqual([Y, Y, X, G, X]);
    expect(score('MOON', 'NOON')).toEqual([X, G, G, G]);
    expect(score('ALLOY', 'LLAMA')).toEqual([Y, G, Y, X, X]);
  });
});

describe('the evidence', () => {
  it('knows which letters the marks rule out and the best mark of each', () => {
    const h = tried('CRANE', 'SLATE', 'OTTER');
    expect([...absentLetters(h)].sort()).toEqual(['L', 'O', 'S', 'T']);
    const best = bestMarks(h);
    expect(best.get('A')).toBe(G);
    expect(best.get('T')).toBe(X);
    expect(best.get('R')).toBe(Y);
  });
  it('a cross on a second copy only rules out the extra copy', () => {
    const h = tried('ABOUT', 'LLAMA');
    expect(absentLetters(h).has('A')).toBe(false);
    expect(absentLetters(h).has('L')).toBe(true);
  });
});

describe('the one miss: ignoring a mark she can still see', () => {
  const hidden = 'CRANE';
  it('a fresh try on fresh letters ignores nothing, whatever it marks', () => {
    expect(ignoredMarks([], 'SLATE')).toEqual([]);
    expect(ignoredMarks(tried(hidden, 'SLATE'), 'FRAME')).toEqual([]);
  });
  it('a letter the marks rule out, used again, is ignored', () => {
    const h = tried(hidden, 'SLATE');
    expect(ignoredMarks(h, 'SPOUT').map((i) => i.letter)).toContain('S');
  });
  it('a dot spot used again for the same letter is ignored', () => {
    const h = tried(hidden, 'FRONT'); // R is a check; O,F,T,N: N dot at 3 (CRANE has N at 3? no, index 3)
    const h2 = tried('ROBIN', 'BRING'); // B dot at 0 (B is at 2 in ROBIN), R is not a check
    expect(ignoredMarks(h2, 'BEGIN').some((i) => i.letter === 'B' && i.kind === 'spot')).toBe(true);
    expect(h.length).toBe(1);
  });
  it('dropping a visible check is ignored', () => {
    const h = tried(hidden, 'SLATE');
    expect(ignoredMarks(h, 'CRAKY').some((i) => i.kind === 'check')).toBe(true);
    expect(ignoredMarks(h, 'DRAPE')).toEqual([]);
  });
  it('a cross on a second copy does not rule out the first', () => {
    const h = tried('ABOUT', 'LLAMA');
    // A is a dot at 2 and a cross at 4: only those spots are ruled out; A elsewhere is fine.
    expect(ignoredMarks(h, 'ABOUT')).toEqual([]);
  });
  it('tries that have scrolled off cost nothing', () => {
    const h = tried(hidden, 'SLATE', 'FRONT');
    expect(visibleTries(h, 1)).toHaveLength(1);
    expect(ignoredMarks(visibleTries(h, 1), 'SPOUT').some((i) => i.letter === 'S')).toBe(false);
  });
});

describe('the hint', () => {
  it('names the first spot no try has checked, and the round can always be finished by hints', () => {
    const hidden = 'CRANE';
    let h: Try[] = [];
    for (let n = 0; n < 5; n++) {
      const hint = hintFor(hidden, h);
      expect(hint.letter).toBe(hidden[hint.index]);
      const word = hidden
        .split('')
        .map((c, i) => (i <= hint.index ? c : 'Z'))
        .join('');
      h = [...h, { word, marks: score(hidden, word) }];
    }
    expect(consistent(hidden, h)).toBe(true);
    expect(hintFor(hidden, tried(hidden, 'SLATE')).index).toBe(0);
    expect(hintFor(hidden, tried(hidden, 'CRAZY')).index).toBe(3);
  });
});

describe('school sets', () => {
  const combos = (pool: readonly string[]): string[][] => {
    const out: string[][] = [];
    for (let a = 0; a < pool.length; a++)
      for (let b = a + 1; b < pool.length; b++)
        for (let c = b + 1; c < pool.length; c++)
          for (let d = c + 1; d < pool.length; d++) out.push([pool[a], pool[b], pool[c], pool[d]]);
    return out;
  };
  it.each([
    [1, POOL3],
    [2, POOL4],
  ])(
    'level %i: every seed draws four distinct pool words, one hidden, inside the tray and tries bounds',
    (level, pool) => {
      const plan = planFor(level);
      for (let seed = 1; seed <= 300; seed++) {
        const s = schoolSet(plan, new Rng(seed));
        expect(new Set(s.words).size).toBe(4);
        s.words.forEach((w) => expect(pool).toContain(w));
        expect(s.words).toContain(s.hidden);
        expect(s.tray).toEqual(trayOf(s.words));
        expect(s.tray.length).toBeLessThanOrEqual(12);
        expect(candidateTries(s.words, s.hidden)).toBeLessThanOrEqual(3);
      }
    },
  );
  it.each([
    [1, POOL3],
    [2, POOL4],
  ])('level %i: every hidden word can be reached in a good set', (_level, pool) => {
    for (const hidden of pool) {
      const sets = combos(pool).filter((w) => w.includes(hidden) && goodSet(w, hidden));
      expect(sets.length, hidden).toBeGreaterThan(0);
    }
  });
  it('a candidate-only solver always finishes in at most four tries', () => {
    for (const pool of [POOL3, POOL4])
      for (const w of combos(pool)) for (const h of w) expect(candidateTries(w, h)).toBeLessThanOrEqual(4);
  });
});

describe('the lists', () => {
  it('the reference solver reaches every answer within six tries', () => {
    const slow = ANSWERS.filter((a) => solverTries(a) > SOLVER_BOUND);
    expect(slow).toEqual([]);
  });
  it('every answer is a five-letter capital word on the guess list, and none is blocked', () => {
    expect(ANSWERS.length).toBeGreaterThanOrEqual(380);
    for (const a of ANSWERS) {
      expect(a).toMatch(/^[A-Z]{5}$/);
      expect(GUESSES.has(a), a).toBe(true);
      expect(BLOCKED5.has(a), a).toBe(false);
    }
  });
  it('no blocked word is a guess', () => {
    for (const w of BLOCKED5) expect(GUESSES.has(w), w).toBe(false);
    expect(GUESSES.size).toBeGreaterThan(2000);
  });
  it('answers are everyday words, not plurals made only by adding S', () => {
    for (const a of ANSWERS)
      if (a.endsWith('S'))
        expect(ANSWERS.includes(a.slice(0, 4)) || !GUESSES.has(a.slice(0, 4)), a).toBe(true);
  });
  it('school pools are the built picture words', () => {
    expect(POOL3.every((w) => w.length === 3)).toBe(true);
    expect(POOL4.every((w) => w.length === 4)).toBe(true);
  });
});
