import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { LETTERS, advanceTrace, sampleStroke } from '../../learning/tracing/strokes';
import { WORDS } from '../../learning/words/letter-words';
import {
  GUIDES,
  guideShown,
  HINT_AFTER,
  LOOKS,
  SHOW_SPAN,
  hintDue,
  offTrail,
  pickLook,
  showTheWay,
  startArrow,
  tuneStep,
} from '../../learning/tracing/feedback';
import {
  fullName,
  guidesFor,
  hintCounts,
  LEVELS,
  NAME_CAP,
  PLANS,
  roundTally,
  severalLetters,
  SHORT_WORDS,
  stickerLetter,
  trailLevel,
  trailTolerance,
  trailWord,
  THREE_LEVEL,
  LITTLE_LEVEL,
  MAGIC_LEVEL,
  HOOKS_LEVEL,
  OVER_LEVEL,
  BIG_LEVEL,
  LAST_LEVEL,
  LITTLE_TOLERANCE,
  inFrame,
} from './logic';
import { PICTURE_WORDS } from '../word-monsters/logic';
import { FRAME, FRAME_X, LOWER, isLower, strokesOf } from '../../learning/tracing/lowercase';
import { traceWaypoints } from '../../learning/tracing/strokes';

describe('Letter Trails plans', () => {
  it('keeps each band inside the authored ladder and every pool traceable', () => {
    for (const range of Object.values(LEVELS)) {
      expect(range!.min).toBeGreaterThanOrEqual(1);
      expect(range!.max).toBeLessThanOrEqual(PLANS.length);
    }
    for (let level = 1; level <= PLANS.length; level++)
      for (let seed = 0; seed < 100; seed++) {
        const word = trailWord(level, 'Zoë-Rose', new Rng(seed));
        expect(word.length).toBeGreaterThan(0);
        for (const letter of word) {
          expect(strokesOf(letter)).toBeTruthy();
          expect(WORDS[letter.toUpperCase()]).toBeTruthy();
        }
        if (level <= 6) expect(PLANS[level - 1].letters).toContain(word);
        if (level === 7) expect(SHORT_WORDS).toContain(word.toLowerCase());
        if (level === 8) expect(word).toBe('ZOEROSE');
        expect(word).toBe(trailWord(level, 'Zoë-Rose', new Rng(seed)));
      }
  });
  it('uses the plan cap and preserves the easier early-level corridor', () => {
    expect(trailLevel(0)).toBe(1);
    expect(trailLevel(100)).toBe(PLANS.length);
    expect(trailWord(8, 'Mia', new Rng(2))).toBe('MIA');
    expect(trailWord(100, 'Mia', new Rng(2))).toHaveLength(1);
    for (let level = 1; level <= PLANS.length; level++)
      expect(trailTolerance(level)).toBe(inFrame(level) ? LITTLE_TOLERANCE : level <= 2 ? 0.095 : 0.075);
  });
  it('accepts a retraced upright at the exact corridor boundary after transform round-off', () => {
    expect(offTrail([0.15000000000000008, 1], [0.15, 0.85], 0.075)).toBe(false);
    expect(offTrail([0.15, 1], [0.15, 0.84], 0.075)).toBe(true);
  });
  it('pins historical sticker pictures independently of future letter pools', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(stickerLetter(seed)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[seed % 26]);
      expect(stickerLetter(-seed - 0.8)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[seed % 26]);
    }
  });
});

describe('words, names and counting per letter', () => {
  it('draws level 7 from about twenty short pictured words, each fully traceable', () => {
    expect(SHORT_WORDS.length).toBeGreaterThanOrEqual(18);
    expect(new Set(SHORT_WORDS).size).toBe(SHORT_WORDS.length);
    for (const w of SHORT_WORDS) {
      expect((PICTURE_WORDS as readonly string[]).includes(w)).toBe(true);
      expect(w.length).toBeLessThanOrEqual(5);
      for (const letter of w.toUpperCase()) expect(LETTERS[letter]).toBeTruthy();
    }
    const seen = new Set<string>();
    for (let seed = 0; seed < 400; seed++) seen.add(trailWord(7, 'Mia', new Rng(seed)));
    expect(seen.size).toBe(SHORT_WORDS.length);
  });
  it('never traces more than eight letters of a name, or more strokes than eight letters can hold', () => {
    const maxStrokes = NAME_CAP * Math.max(...Object.values(LETTERS).map((s) => s.length));
    for (const name of ['Mia', 'Maximiliana', 'Anne-Marie Josephine', 'Zoë', '', 'W'.repeat(60)]) {
      const traced = trailWord(8, name, new Rng(1));
      expect(traced.length).toBeLessThanOrEqual(NAME_CAP);
      expect(fullName(name).startsWith(traced)).toBe(true);
      const strokes = traced.split('').reduce((n, l) => n + LETTERS[l].length, 0);
      expect(strokes).toBeLessThanOrEqual(maxStrokes);
    }
    expect(trailWord(8, 'Maximiliana', new Rng(1))).toBe('MAXIMILI');
    expect(fullName('Maximiliana')).toBe('MAXIMILIANA');
    expect(trailWord(8, 'Mia', new Rng(1))).toBe('MIA');
  });
  it('counts one miss and one hint per letter in a word or a name, and raw counts for one letter', () => {
    const rough = [
      { misses: 5, hints: 2 },
      { misses: 0, hints: 0 },
      { misses: 1, hints: 0 },
    ];
    expect(roundTally(7, rough)).toEqual({ misses: 2, hints: 1 });
    expect(roundTally(8, rough)).toEqual({ misses: 2, hints: 1 });
    // A single letter can still step her down: four misses stay four.
    for (let level = 1; level <= 6; level++)
      expect(roundTally(level, [{ misses: 4, hints: 2 }])).toEqual({ misses: 4, hints: 2 });
    // An eight-letter name with one slip per letter reports no more than eight.
    const name = Array.from({ length: NAME_CAP }, () => ({ misses: 3, hints: 1 }));
    expect(roundTally(8, name)).toEqual({ misses: NAME_CAP, hints: NAME_CAP });
  });
});

describe('a hint that shows the way', () => {
  it('flies through exactly the next checkpoints, from where she is, and never past the end', () => {
    for (const letter of Object.keys(LETTERS))
      for (const stroke of LETTERS[letter]) {
        const points = sampleStroke(stroke);
        for (const progress of [0, Math.floor(points.length / 2), points.length - 1]) {
          const path = showTheWay(points, progress);
          expect(path[0]).toBe(points[progress]);
          expect(path).toEqual(points.slice(progress, progress + path.length));
          expect(path.length).toBe(Math.min(SHOW_SPAN + 1, points.length - progress));
          // Following the shown path takes her at least to its end: it leads somewhere useful.
          let at = progress;
          path.slice(1).forEach((p, i) => (at = advanceTrace(points, at, path[i], p, trailTolerance(3))));
          expect(at).toBeGreaterThanOrEqual(progress + path.length - 1);
        }
      }
  });

  it('is due once per stroke: on the second wander, not the first or any later one', () => {
    const due = [1, 2, 3, 4, 5, 6].filter(hintDue);
    expect(due).toEqual([HINT_AFTER]);
  });
});

describe('start arrows and the rising tune', () => {
  it('puts each arrow at the stroke start, pointing along its first stretch', () => {
    for (const letter of Object.keys(LETTERS))
      for (const stroke of LETTERS[letter]) {
        const points = sampleStroke(stroke);
        const { at, angle } = startArrow(points);
        expect(at).toBe(points[0]);
        const first = [stroke[1][0] - stroke[0][0], stroke[1][1] - stroke[0][1]];
        // Same direction as the first authored segment (a positive dot product).
        expect(Math.cos(angle) * first[0] + Math.sin(angle) * first[1]).toBeGreaterThan(0);
      }
  });

  it('climbs one step for each fifth of a stroke, from 0 at the start to 4 at the end, never falling', () => {
    const length = sampleStroke(LETTERS.O[0]).length;
    const steps = Array.from({ length }, (_, i) => tuneStep(i, length));
    expect(steps[0]).toBe(0);
    expect(steps[length - 1]).toBe(4);
    expect(new Set(steps)).toEqual(new Set([0, 1, 2, 3, 4]));
    steps.forEach((s, i) => {
      if (i) expect(s).toBeGreaterThanOrEqual(steps[i - 1]);
    });
  });
});

describe('trail looks', () => {
  it('turns every look up across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) seen.add(pickLook(new Rng(seed)));
    expect([...seen].sort()).toEqual([...LOOKS].sort());
  });

  it('never changes the letter a seed gives: the look is drawn after the word', () => {
    for (let level = 1; level <= PLANS.length; level++)
      for (let seed = 0; seed < 40; seed++) {
        const plain = trailWord(level, 'Ada', new Rng(seed));
        const rng = new Rng(seed);
        const word = trailWord(level, 'Ada', rng);
        pickLook(rng);
        expect(word).toBe(plain);
      }
  });
});

describe('Level 9, Three times', () => {
  it('traces one capital from levels 1–6 three times, solid, then dots, then only the start', () => {
    const earlier = new Set(PLANS.slice(0, 6).flatMap((p) => p.letters.split('')));
    for (let seed = 0; seed < 200; seed++) {
      const word = trailWord(THREE_LEVEL, 'Ana', new Rng(seed));
      expect(word).toHaveLength(1);
      expect(earlier.has(word)).toBe(true);
    }
    expect(guidesFor(THREE_LEVEL)).toEqual(['solid', 'dotted', 'start']);
    for (let level = 1; level < THREE_LEVEL; level++) expect(guidesFor(level)).toEqual(['solid']);
    expect(LEVELS.prek!.max).toBeGreaterThanOrEqual(THREE_LEVEL);
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(THREE_LEVEL);
  });

  it('keeps acceptance unchanged: every try follows the same checkpoints and the bot route completes each', () => {
    for (const letter of Object.keys(LETTERS))
      for (const stroke of LETTERS[letter]) {
        const tries = GUIDES.map(() => sampleStroke(stroke));
        for (const t of tries) expect(t).toEqual(tries[0]);
        let progress = 0,
          previous = tries[0][0];
        for (const p of tries[0].slice(1)) {
          progress = advanceTrace(tries[0], progress, previous, p, 0.075);
          previous = p;
        }
        expect(progress).toBe(tries[0].length - 1);
      }
  });

  it('brings the solid trail back after a wander, and counts at most one hint per try', () => {
    for (const g of GUIDES) {
      expect(guideShown(g, 0)).toBe(g);
      expect(guideShown(g, 1)).toBe('solid');
    }
    expect(hintCounts(THREE_LEVEL, HINT_AFTER, 0)).toBe(true);
    expect(hintCounts(THREE_LEVEL, HINT_AFTER, 1)).toBe(false);
    expect(hintCounts(THREE_LEVEL, HINT_AFTER - 1, 0)).toBe(false);
    // Single-try levels count every due hint, as before.
    expect(hintCounts(3, HINT_AFTER, 1)).toBe(true);
  });

  it('is one letter, not a word: its picture is spoken and its count is not capped per letter', () => {
    expect(severalLetters(THREE_LEVEL)).toBe(false);
    expect(severalLetters(7)).toBe(true);
    expect(severalLetters(8)).toBe(true);
    expect(roundTally(THREE_LEVEL, [{ misses: 3, hints: 2 }])).toEqual({ misses: 3, hints: 2 });
  });
});

describe('Level 10, little letters in a four-line frame', () => {
  const group = 'cosvwt';
  const span = (letter: string) => strokesOf(letter).flatMap((s) => sampleStroke(s));
  const eps = 1e-9;

  it("draws one of the programme's first group, c o s v w t, each with its capital's picture", () => {
    expect(Object.keys(LOWER).sort().join('')).toBe(
      [...group, ...'adg', ...'uielkyj', ...'prnmhb', ...'fqxz'].sort().join(''),
    );
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const word = trailWord(LITTLE_LEVEL, 'Ana', new Rng(seed));
      expect(word).toHaveLength(1);
      expect(group).toContain(word);
      expect(isLower(word)).toBe(true);
      seen.add(word);
    }
    expect(seen.size).toBe(group.length);
    for (const l of group) expect(WORDS[l.toUpperCase()]).toBeTruthy();
    expect(inFrame(LITTLE_LEVEL)).toBe(true);
    for (let level = 1; level < LITTLE_LEVEL; level++) expect(inFrame(level)).toBe(false);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(LITTLE_LEVEL)).toEqual(['solid']);
    expect(severalLetters(LITTLE_LEVEL)).toBe(false);
  });

  it('keeps every stroke inside its band: the middle-to-base space, and the top line for t', () => {
    expect(FRAME.top).toBeLessThan(FRAME.mid);
    expect(FRAME.mid).toBeLessThan(FRAME.base);
    expect(FRAME.base).toBeLessThan(FRAME.bottom);
    for (const l of group) {
      const top = l === 't' ? FRAME.top : FRAME.mid;
      for (const [x, y] of span(l)) {
        expect(y).toBeGreaterThanOrEqual(top - eps);
        expect(y).toBeLessThanOrEqual(FRAME.base + eps);
        expect(x).toBeGreaterThanOrEqual(FRAME_X[0]);
        expect(x).toBeLessThanOrEqual(FRAME_X[1]);
      }
      // Each letter fills its band: it reaches the base line and the line it starts from.
      const ys = span(l).map((p) => p[1]);
      expect(Math.min(...ys)).toBeCloseTo(top, 2);
      expect(Math.max(...ys)).toBeCloseTo(FRAME.base, 2);
    }
  });

  it('starts every little letter at the top of its first stroke (no d or e in this group)', () => {
    for (const l of group) {
      const first = strokesOf(l)[0];
      const top = l === 't' ? FRAME.top : FRAME.mid;
      const height = FRAME.base - top;
      expect(first[0][1] - top).toBeLessThanOrEqual(height * 0.25);
    }
    // t's crossbar is its second stroke, on the middle line, left to right.
    const [, bar] = strokesOf('t');
    expect(bar.every((p) => p[1] === FRAME.mid)).toBe(true);
    expect(bar[0][0]).toBeLessThan(bar.at(-1)![0]);
  });

  it('writes c, o and s anticlockwise from the right, o closing where it began', () => {
    for (const l of 'cos') {
      const [a, b] = sampleStroke(strokesOf(l)[0]);
      expect(b[0]).toBeLessThan(a[0]); // heading left over the top
    }
    const o = strokesOf('o')[0];
    expect(Math.hypot(o[0][0] - o.at(-1)![0], o[0][1] - o.at(-1)![1])).toBeLessThan(1e-9);
    const c = strokesOf('c')[0];
    expect(c[0][0]).toBeGreaterThan(0.5);
    expect(c.at(-1)![0]).toBeGreaterThan(0.5);
    // s finishes low on the left, below where it began.
    const s = strokesOf('s')[0];
    expect(s.at(-1)![0]).toBeLessThan(0.5);
    expect(s.at(-1)![1]).toBeGreaterThan(s[0][1]);
  });

  it('accepts each stroke in order at the little letters’ corridor, and the bot route completes it', () => {
    const tol = trailTolerance(LITTLE_LEVEL);
    expect(tol).toBe(LITTLE_TOLERANCE);
    expect(trailTolerance(6)).toBe(0.075);
    for (const l of group + 'adg')
      for (const stroke of strokesOf(l)) {
        const points = sampleStroke(stroke);
        for (let i = 1; i < points.length; i++)
          expect(
            Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
          ).toBeLessThanOrEqual(0.02501);
        let index = 0;
        for (let i = 1; i < points.length; i++)
          index = advanceTrace(points, index, points[i - 1], points[i], tol);
        expect(index).toBe(points.length - 1);
        const route = traceWaypoints(points);
        let progress = 0,
          previous = route[0];
        for (const p of route.slice(1)) {
          progress = advanceTrace(points, progress, previous, p, tol);
          previous = p;
        }
        expect(progress).toBe(points.length - 1);
      }
  });

  it('never lets a shortcut finish a curve: a straight swipe from start to end stays near the start', () => {
    const tol = trailTolerance(LITTLE_LEVEL);
    for (const l of 'coswv') {
      const points = sampleStroke(strokesOf(l)[0]);
      expect(advanceTrace(points, 0, points[0], points.at(-1)!, tol)).toBeLessThan(points.length / 2);
    }
  });

  it('leaves the capitals alone: they keep their own strokes', () => {
    for (const l of Object.keys(LETTERS)) expect(strokesOf(l)).toBe(LETTERS[l]);
  });
});

describe('Level 11, Magic c: a, d and g', () => {
  const eps = 1e-9;
  const stemOf = (l: string) => strokesOf(l)[1];

  it('draws a, d or g, each with its capital’s picture, in the frame, for school', () => {
    expect(MAGIC_LEVEL).toBe(11);
    expect(inFrame(MAGIC_LEVEL)).toBe(true);
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(LAST_LEVEL);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(MAGIC_LEVEL)).toEqual(['solid']);
    expect(severalLetters(MAGIC_LEVEL)).toBe(false);
    const seen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const word = trailWord(MAGIC_LEVEL, 'Ana', new Rng(seed));
      expect('adg').toContain(word);
      expect(WORDS[word.toUpperCase()]).toBeTruthy();
      seen.add(word);
    }
    expect(seen.size).toBe(3);
    // b and d are taught apart, and g and q too: neither b nor q is in this level's pool.
    expect(PLANS[MAGIC_LEVEL - 1].letters).not.toMatch(/[bq]/);
  });

  it('starts each letter on the c-curve, the same way a c starts, then adds one line', () => {
    const c = sampleStroke(strokesOf('c')[0]);
    for (const l of 'adg') {
      expect(strokesOf(l)).toHaveLength(2);
      const curve = sampleStroke(strokesOf(l)[0]);
      expect(curve[0][1]).toBeGreaterThanOrEqual(FRAME.mid);
      expect(curve[0][1] - FRAME.mid).toBeLessThanOrEqual((FRAME.base - FRAME.mid) * 0.25);
      expect(curve[1][0]).toBeLessThan(curve[0][0]); // heading left over the top, anticlockwise
      expect(Math.abs(curve[0][0] - c[0][0])).toBeLessThan(0.05);
    }
  });

  it('puts each line against the curve: a short, d to the top line, g to the bottom line, turning left', () => {
    const edge = Math.max(...sampleStroke(strokesOf('a')[0]).map((p) => p[0]));
    for (const l of 'adg') expect(stemOf(l)[0][0]).toBeCloseTo(edge, 2);
    const ys = (l: string) => sampleStroke(stemOf(l)).map((p) => p[1]);
    expect(Math.min(...ys('a'))).toBeCloseTo(FRAME.mid, 2);
    expect(Math.max(...ys('a'))).toBeCloseTo(FRAME.base, 2);
    expect(Math.min(...ys('d'))).toBeCloseTo(FRAME.top, 2);
    expect(Math.max(...ys('d'))).toBeCloseTo(FRAME.base, 2);
    expect(Math.min(...ys('g'))).toBeCloseTo(FRAME.mid, 2);
    expect(Math.max(...ys('g'))).toBeCloseTo(FRAME.bottom, 2);
    const g = stemOf('g');
    expect(g.at(-1)![0]).toBeLessThan(g[0][0] - 0.05);
    for (const l of 'adg')
      for (const stroke of strokesOf(l))
        for (const [x, y] of sampleStroke(stroke)) {
          expect(x).toBeGreaterThanOrEqual(FRAME_X[0]);
          expect(x).toBeLessThanOrEqual(FRAME_X[1]);
          expect(y).toBeGreaterThanOrEqual(FRAME.top - eps);
          expect(y).toBeLessThanOrEqual(FRAME.bottom + eps);
        }
  });

  it('keeps a wander from the middle of the curve a wander at the little corridor', () => {
    const tol = trailTolerance(MAGIC_LEVEL);
    const centre: [number, number] = [0.5, (FRAME.mid + FRAME.base) / 2];
    const curve = sampleStroke(strokesOf('a')[0]);
    const nearest = Math.min(...curve.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1])));
    expect(tol * 2).toBeLessThan(nearest);
  });
});

describe('Level 12, Lines and hooks: u i e l k y j', () => {
  const group = 'uielkyj';
  const pts = (l: string) => strokesOf(l).flatMap((s) => sampleStroke(s));
  const eps = 1e-9;

  it('draws one of the seven, each with its capital’s picture, in the frame, for school only', () => {
    expect(HOOKS_LEVEL).toBe(12);
    expect(inFrame(HOOKS_LEVEL)).toBe(true);
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(LAST_LEVEL);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(HOOKS_LEVEL)).toEqual(['solid']);
    expect(severalLetters(HOOKS_LEVEL)).toBe(false);
    expect(trailTolerance(HOOKS_LEVEL)).toBe(LITTLE_TOLERANCE);
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const word = trailWord(HOOKS_LEVEL, 'Ana', new Rng(seed));
      expect(group).toContain(word);
      expect(WORDS[word.toUpperCase()]).toBeTruthy();
      seen.add(word);
    }
    expect(seen.size).toBe(group.length);
  });

  it('keeps every stroke in the frame, each letter reaching its own lines', () => {
    const tall = 'lk';
    const below = 'yj';
    for (const l of group) {
      const ys = pts(l).map((p) => p[1]);
      for (const [x, y] of pts(l)) {
        expect(x).toBeGreaterThanOrEqual(FRAME_X[0]);
        expect(x).toBeLessThanOrEqual(FRAME_X[1]);
        expect(y).toBeGreaterThanOrEqual(FRAME.top - eps);
        expect(y).toBeLessThanOrEqual(FRAME.bottom + eps);
      }
      if (tall.includes(l)) expect(Math.min(...ys)).toBeCloseTo(FRAME.top, 2);
      else if (l === 'i' || l === 'j')
        expect(Math.min(...ys)).toBeLessThan(FRAME.mid - 0.05); // the dot
      else expect(Math.min(...ys)).toBeGreaterThanOrEqual(FRAME.mid - eps);
      expect(Math.max(...ys)).toBeCloseTo(below.includes(l) ? FRAME.bottom : FRAME.base, 1);
    }
  });

  it('starts each letter at the top of its first stroke, except e, which starts mid-round', () => {
    for (const l of group.replace('e', '')) {
      const first = strokesOf(l)[0];
      const top = 'lk'.includes(l) ? FRAME.top : FRAME.mid;
      expect(first[0][1] - top).toBeLessThanOrEqual(0.02);
    }
    const e = strokesOf('e')[0];
    expect(e[0][1]).toBeCloseTo(FRAME.mid + (FRAME.base - FRAME.mid) / 2, 5);
    expect(e[1][0]).toBeGreaterThan(e[0][0]); // across to the right first
    expect(e.at(-1)![1]).toBeGreaterThan(FRAME.mid + (FRAME.base - FRAME.mid) / 2); // and ends low on the right
    expect(e.at(-1)![0]).toBeGreaterThan(0.5);
  });

  it('dots i and j over their lines, after the line, and turns j’s tail left', () => {
    for (const l of 'ij') {
      const [line, dot] = strokesOf(l);
      expect(strokesOf(l)).toHaveLength(2);
      expect(dot[0][0]).toBeCloseTo(line[0][0], 5);
      expect(dot.at(-1)![1]).toBeLessThan(FRAME.mid);
    }
    const j = strokesOf('j')[0];
    expect(j.at(-1)![0]).toBeLessThan(j[0][0] - 0.05);
  });

  it('writes k with a tall line then one in-and-out stroke, y with two slides, u with a curve then a line', () => {
    const [stem, kick] = strokesOf('k');
    expect(stem[0][0]).toBe(stem[1][0]);
    expect(kick[0][0]).toBeGreaterThan(stem[0][0]);
    expect(kick[1][0]).toBeCloseTo(stem[0][0], 2);
    expect(kick.at(-1)![0]).toBeGreaterThan(stem[0][0]);
    expect(kick[1][1]).toBeGreaterThan(kick[0][1]);
    expect(kick.at(-1)![1]).toBeGreaterThan(kick[1][1]);
    expect(strokesOf('y')).toHaveLength(2);
    const [left, right] = strokesOf('y');
    expect(right[0][0]).toBeGreaterThan(left[0][0]);
    expect(right.at(-1)![0]).toBeLessThan(right[0][0]);
    expect(strokesOf('u')).toHaveLength(2);
    const [bowl, line] = strokesOf('u');
    expect(bowl.at(-1)![0]).toBeCloseTo(line[0][0], 5);
  });

  it('accepts each stroke in order at the little corridor', () => {
    const tol = trailTolerance(HOOKS_LEVEL);
    for (const l of group)
      for (const stroke of strokesOf(l)) {
        const points = sampleStroke(stroke);
        for (let i = 1; i < points.length; i++) expect(offTrail(points[i], points[i - 1], tol)).toBe(false);
      }
  });
});

describe('Level 13, Down, up and over: p r n m h b', () => {
  const group = 'prnmhb';
  const pts = (l: string) => strokesOf(l).flatMap((s) => sampleStroke(s));
  const eps = 1e-9;

  it('draws one of the six, each with its capital’s picture, in the frame, for school only', () => {
    expect(OVER_LEVEL).toBe(13);
    expect(inFrame(OVER_LEVEL)).toBe(true);
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(LAST_LEVEL);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(OVER_LEVEL)).toEqual(['solid']);
    expect(severalLetters(OVER_LEVEL)).toBe(false);
    expect(trailTolerance(OVER_LEVEL)).toBe(LITTLE_TOLERANCE);
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const word = trailWord(OVER_LEVEL, 'Ana', new Rng(seed));
      expect(group).toContain(word);
      expect(WORDS[word.toUpperCase()]).toBeTruthy();
      seen.add(word);
    }
    expect(seen.size).toBe(group.length);
  });

  it('keeps every stroke in the frame, each letter reaching its own lines', () => {
    for (const l of group) {
      const ys = pts(l).map((p) => p[1]);
      for (const [x, y] of pts(l)) {
        expect(x).toBeGreaterThanOrEqual(FRAME_X[0]);
        expect(x).toBeLessThanOrEqual(FRAME_X[1]);
        expect(y).toBeGreaterThanOrEqual(FRAME.top - eps);
        expect(y).toBeLessThanOrEqual(FRAME.bottom + eps);
      }
      expect(Math.min(...ys)).toBeCloseTo('hb'.includes(l) ? FRAME.top : FRAME.mid, 2);
      expect(Math.max(...ys)).toBeCloseTo(l === 'p' ? FRAME.bottom : FRAME.base, 1);
      expect(strokesOf(l)).toHaveLength(1);
    }
  });

  it('starts each letter on its stem, at the top of it, and goes down first', () => {
    for (const l of group) {
      const [a, b] = strokesOf(l)[0];
      expect(a[1]).toBeCloseTo('hb'.includes(l) ? FRAME.top : FRAME.mid, 5);
      expect(b[0]).toBeCloseTo(a[0], 5);
      expect(b[1]).toBeGreaterThan(a[1]);
    }
  });

  it('goes back up the stem before it goes over, ending a hump on the right', () => {
    for (const l of group) {
      const s = strokesOf(l)[0];
      const down = s[1];
      const back = s[2];
      expect(back[0]).toBeCloseTo(down[0], 5);
      expect(back[1]).toBeLessThan(down[1]);
      expect(s[3][0]).toBeGreaterThanOrEqual(back[0] - eps);
    }
    for (const l of 'nhm') expect(strokesOf(l)[0].at(-1)![1]).toBeCloseTo(FRAME.base, 5);
    // r stops at the top of its hump, with no leg.
    expect(strokesOf('r')[0].at(-1)![1]).toBeLessThan(FRAME.mid + 0.1);
  });

  it('makes m two humps and gives p and b a closed bowl on the right of their stem', () => {
    const m = strokesOf('m')[0];
    const tops = m.filter(
      (p, i) =>
        i > 0 && i < m.length - 1 && p[1] < m[i - 1][1] && p[1] <= m[i + 1][1] && p[1] < FRAME.mid + 0.03,
    );
    expect(tops.length).toBe(2);
    for (const l of 'pb') {
      const s = strokesOf(l)[0];
      const stemX = s[0][0];
      const bowl = s.slice(2);
      expect(Math.min(...bowl.map((q) => q[0]))).toBeGreaterThanOrEqual(stemX - 1e-6);
      expect(Math.max(...bowl.map((q) => q[0]))).toBeGreaterThan(stemX + 0.2);
      expect(bowl.at(-1)![0]).toBeCloseTo(bowl[0][0], 5);
      expect(bowl.at(-1)![1]).toBeCloseTo(bowl[0][1], 5);
      expect(Math.min(...bowl.map((q) => q[1]))).toBeCloseTo(FRAME.mid, 2);
      expect(Math.max(...bowl.map((q) => q[1]))).toBeCloseTo(FRAME.base, 2);
    }
    // p's stem goes below the base line; b's stops on it, so b stays apart from d (stem on the left, bowl on the right) and p has no tail.
    expect(Math.max(...strokesOf('p')[0].map((q) => q[1]))).toBeCloseTo(FRAME.bottom, 5);
    expect(strokesOf('p')[0].every((q) => q[0] <= strokesOf('p')[0][0][0] + 0.25)).toBe(true);
  });

  it('accepts each stroke in order at the little corridor', () => {
    const tol = trailTolerance(OVER_LEVEL);
    for (const l of group)
      for (const stroke of strokesOf(l)) {
        const points = sampleStroke(stroke);
        for (let i = 1; i < points.length; i++) expect(offTrail(points[i], points[i - 1], tol)).toBe(false);
      }
  });
});

describe('Level 14, The last four: f q x z', () => {
  const group = 'fqxz';
  const pts = (l: string) => strokesOf(l).flatMap((s) => sampleStroke(s));
  const eps = 1e-9;

  it('draws one of the four, each with its capital’s picture, in the frame, for school only', () => {
    expect(LAST_LEVEL).toBe(14);
    expect(inFrame(LAST_LEVEL)).toBe(true);
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(LAST_LEVEL);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(LAST_LEVEL)).toEqual(['solid']);
    expect(severalLetters(LAST_LEVEL)).toBe(false);
    expect(trailTolerance(LAST_LEVEL)).toBe(LITTLE_TOLERANCE);
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const word = trailWord(LAST_LEVEL, 'Ana', new Rng(seed));
      expect(group).toContain(word);
      expect(WORDS[word.toUpperCase()]).toBeTruthy();
      seen.add(word);
    }
    expect(seen.size).toBe(group.length);
  });

  it('with levels 10–13 covers all 26 little letters exactly once', () => {
    const all = PLANS.slice(LITTLE_LEVEL - 1, LAST_LEVEL)
      .map((p) => p.letters)
      .join('');
    expect([...all].sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('keeps every stroke in the frame, each letter reaching its own lines', () => {
    for (const l of group) {
      const ys = pts(l).map((p) => p[1]);
      for (const [x, y] of pts(l)) {
        expect(x).toBeGreaterThanOrEqual(FRAME_X[0]);
        expect(x).toBeLessThanOrEqual(FRAME_X[1]);
        expect(y).toBeGreaterThanOrEqual(FRAME.top - eps);
        expect(y).toBeLessThanOrEqual(FRAME.bottom + eps);
      }
      expect(Math.min(...ys)).toBeCloseTo(l === 'f' ? FRAME.top : FRAME.mid, 2);
      expect(Math.max(...ys)).toBeCloseTo(l === 'q' ? FRAME.bottom : FRAME.base, 1);
    }
  });

  it('gives f a hook and a bar, x two crossing slides and z one zigzag', () => {
    const f = strokesOf('f');
    expect(f).toHaveLength(2);
    expect(f[0][0][1]).toBeGreaterThan(FRAME.top);
    expect(f[0].at(-1)![1]).toBeCloseTo(FRAME.base, 5);
    expect(f[0].at(-1)![0]).toBeLessThan(f[0][0][0]);
    expect(f[1][0][1]).toBeCloseTo(FRAME.mid, 5);
    expect(f[1][1][1]).toBeCloseTo(FRAME.mid, 5);
    const x = strokesOf('x');
    expect(x).toHaveLength(2);
    for (const s of x) {
      expect(s[0][1]).toBeCloseTo(FRAME.mid, 5);
      expect(s[1][1]).toBeCloseTo(FRAME.base, 5);
    }
    expect(Math.sign(x[0][1][0] - x[0][0][0])).toBe(-Math.sign(x[1][1][0] - x[1][0][0]));
    const z = strokesOf('z');
    expect(z).toHaveLength(1);
    expect(z[0]).toHaveLength(4);
    expect(z[0][1][1]).toBeCloseTo(FRAME.mid, 5);
    expect(z[0][2][1]).toBeCloseTo(FRAME.base, 5);
    expect(z[0][1][0]).toBeGreaterThan(z[0][0][0]);
    expect(z[0][2][0]).toBeCloseTo(z[0][0][0], 5);
  });

  it('turns q’s tail right where g’s turns left, and starts both with the magic c', () => {
    const q = strokesOf('q');
    const g = strokesOf('g');
    expect(q[0]).toEqual(g[0]);
    const stemX = q[1][0][0];
    expect(Math.max(...q[1].map((p) => p[0]))).toBeGreaterThan(stemX + 0.05);
    expect(Math.min(...q[1].map((p) => p[0]))).toBeGreaterThanOrEqual(stemX - eps);
    expect(Math.min(...g[1].map((p) => p[0]))).toBeLessThan(stemX - 0.05);
    expect(q[1].at(-1)![1]).toBeCloseTo(FRAME.bottom, 5);
  });

  it('accepts each stroke in order at the little corridor', () => {
    const tol = trailTolerance(LAST_LEVEL);
    for (const l of group)
      for (const stroke of strokesOf(l)) {
        const points = sampleStroke(stroke);
        for (let i = 1; i < points.length; i++) expect(offTrail(points[i], points[i - 1], tol)).toBe(false);
      }
  });
});

describe('Level 15, Big and little: any little letter beside its capital', () => {
  it('draws any of the 26 little letters in the frame, for school only', () => {
    expect(BIG_LEVEL).toBe(15);
    expect(inFrame(BIG_LEVEL)).toBe(true);
    expect(LEVELS.school!.max).toBe(BIG_LEVEL);
    expect(LEVELS.prek!.max).toBe(LITTLE_LEVEL);
    expect(guidesFor(BIG_LEVEL)).toEqual(['solid']);
    expect(severalLetters(BIG_LEVEL)).toBe(false);
    expect(trailTolerance(BIG_LEVEL)).toBe(LITTLE_TOLERANCE);
    const seen = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) seen.add(trailWord(BIG_LEVEL, 'Ana', new Rng(seed)));
    expect([...seen].sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('has a little-letter table and a capital with a picture and strokes for every letter', () => {
    for (const l of PLANS[BIG_LEVEL - 1].letters) {
      expect(strokesOf(l).length).toBeGreaterThan(0);
      expect(strokesOf(l.toUpperCase()).length).toBeGreaterThan(0);
      expect(WORDS[l.toUpperCase()]).toBeTruthy();
    }
  });
});
