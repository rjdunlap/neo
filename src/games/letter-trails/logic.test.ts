import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { LETTERS, advanceTrace, sampleStroke } from '../../learning/tracing/strokes';
import { WORDS } from '../../learning/words/letter-words';
import {
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
  LEVELS,
  NAME_CAP,
  PLANS,
  roundTally,
  SHORT_WORDS,
  stickerLetter,
  trailLevel,
  trailTolerance,
  trailWord,
} from './logic';
import { PICTURE_WORDS } from '../word-monsters/logic';

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
          expect(LETTERS[letter]).toBeTruthy();
          expect(WORDS[letter]).toBeTruthy();
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
    expect(trailWord(100, 'Mia', new Rng(2))).toBe('MIA');
    for (let level = 1; level <= PLANS.length; level++)
      expect(trailTolerance(level)).toBe(level <= 2 ? 0.095 : 0.075);
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
