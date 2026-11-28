import { describe, expect, it } from 'vitest';
import { entriesOf } from '../../content/journal';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  ALL_MATERIALS,
  cupLayout,
  cupOf,
  DISCOVERIES,
  emptyCup,
  FindRound,
  findRound,
  GuessRound,
  guessRound,
  heapSpoons,
  LEVELS,
  MATERIALS,
  outcomeOf,
  OUTCOMES,
  overlaps,
  PLANS,
  poolFor,
  sayStir,
  SortRound,
  sortRound,
  stir,
  stirPlan,
  stirRound,
  threeRound,
  type Box,
  type Material,
  type Mode,
} from './logic';
import { VOICE } from './voice';

const rngs = Array.from({ length: 40 }, (_, i) => new Rng(i + 1));
const outcomes = (ms: Material[]) => ms.map(outcomeOf);

describe('the material table', () => {
  it('authors one outcome for each of six materials', () => {
    expect(ALL_MATERIALS).toEqual(['sugar', 'salt', 'sand', 'pebble', 'leaf', 'oil']);
    expect(outcomes(['sugar', 'salt'])).toEqual(['vanish', 'vanish']);
    expect(outcomes(['sand', 'pebble'])).toEqual(['settle', 'settle']);
    expect(outcomes(['leaf', 'oil'])).toEqual(['float', 'float']);
    for (const m of ALL_MATERIALS) expect(MATERIALS[m].word.length).toBeGreaterThan(0);
  });

  it('introduces materials by level: sugar and sand, then the leaf, then all six', () => {
    expect(poolFor(1)).toEqual(['sugar', 'sand']);
    expect(poolFor(2)).toEqual(['sugar', 'sand', 'leaf']);
    expect(poolFor(3)).toEqual(ALL_MATERIALS);
  });
});

describe('stirring', () => {
  it('a vanish leaves only its shimmer; a settle only a heap; a float only something on top', () => {
    expect(cupOf('sugar')).toEqual({ shimmer: ['sugar'], heap: [], floating: [] });
    expect(cupOf('sand')).toEqual({ shimmer: [], heap: [{ material: 'sand', spoons: 1 }], floating: [] });
    expect(cupOf('oil')).toEqual({ shimmer: [], heap: [], floating: ['oil'] });
  });

  it('a heap only grows; a shimmer and a floater stay one piece; the same material always does the same thing', () => {
    let cup = emptyCup();
    for (let i = 1; i <= 4; i++) {
      cup = stir(cup, 'sand');
      expect(heapSpoons(cup)).toBe(i);
    }
    cup = stir(stir(cup, 'sugar'), 'sugar');
    expect(cup.shimmer).toEqual(['sugar']);
    cup = stir(stir(cup, 'oil'), 'oil');
    expect(cup.floating).toEqual(['oil']);
    for (const m of ALL_MATERIALS) expect(stir(emptyCup(), m)).toEqual(cupOf(m));
  });

  it('never changes the cup it was given', () => {
    const cup = cupOf('sand');
    stir(cup, 'sand');
    expect(heapSpoons(cup)).toBe(1);
  });

  it('names what happened in a line that exists', () => {
    for (const m of ALL_MATERIALS) {
      const line = SCRIPT[sayStir(m)];
      expect(line, m).toBeDefined();
      expect(line.join(' ')).toContain(m === 'oil' ? 'oil' : m);
    }
  });
});

describe('rounds', () => {
  it('level 1 is sugar then sand', () => expect(stirRound()).toEqual(['sugar', 'sand']));

  it('level 2 is one of each outcome from its pool, the authored round sugar, sand, leaf', () => {
    expect(threeRound(new Rng(1), true)).toEqual(['sugar', 'sand', 'leaf']);
    for (const rng of rngs) {
      const r = threeRound(rng, false);
      expect(new Set(outcomes(r)).size).toBe(3);
      for (const m of r) expect(poolFor(2)).toContain(m);
    }
  });

  it('level 3 asks for each outcome once, each question solved by exactly one cup', () => {
    const authored = findRound(new Rng(1), true);
    expect(authored.map((q) => outcomeOf(q.target))).toEqual(['vanish', 'settle', 'float']);
    for (const round of [authored, ...rngs.map((r) => findRound(r, false))]) {
      expect(round).toHaveLength(3);
      expect(new Set(round.map((q) => outcomeOf(q.target))).size).toBe(3);
      for (const q of round) {
        expect(q.cups.filter((m) => m === q.target)).toHaveLength(1);
        expect(new Set(outcomes(q.cups)).size).toBe(3);
      }
    }
  });

  it('level 4 holds one of each outcome plus a repeat, never two alike in a row', () => {
    expect(guessRound(new Rng(1), true)).toEqual(['salt', 'pebble', 'leaf', 'sugar']);
    for (const rng of rngs) {
      const r = guessRound(rng, false);
      expect(r).toHaveLength(4);
      expect(new Set(r).size).toBe(4);
      expect(new Set(outcomes(r)).size).toBe(3);
      for (let i = 1; i < r.length; i++) expect(outcomeOf(r[i])).not.toBe(outcomeOf(r[i - 1]));
    }
  });

  it('level 5 shows every outcome twice', () => {
    expect(sortRound(new Rng(1), true)).toEqual(['salt', 'pebble', 'oil', 'sand', 'sugar', 'leaf']);
    for (const rng of rngs) {
      const r = sortRound(rng, false);
      for (const o of OUTCOMES) expect(outcomes(r).filter((x) => x === o)).toHaveLength(2);
      for (let i = 1; i < r.length; i++) expect(outcomeOf(r[i])).not.toBe(outcomeOf(r[i - 1]));
    }
  });
});

describe('accounting', () => {
  it('level 3: a wrong cup is one miss, again is none, two hints asked are one, a third wrong tap is a supported finish', () => {
    const round = new FindRound(findRound(new Rng(1), true));
    expect(round.tap(round.answer)).toMatchObject({ right: true, miss: false, done: true });
    expect([round.misses, round.hints, round.index]).toEqual([0, 0, 1]);
    const w = round.answer === 0 ? 1 : 0;
    const first = round.tap(w);
    expect(first).toMatchObject({ miss: true, glow: false, done: false, hint: 'stirsee.hint.settle' });
    expect(round.tap(w)).toMatchObject({ miss: false, glow: true, done: false });
    expect([round.misses, round.hints]).toEqual([1, 1]);
    round.ask();
    round.ask();
    expect(round.hints).toBe(1);
    expect(round.tap(w)).toMatchObject({ supported: true, done: true });
    expect([round.misses, round.hints, round.index]).toEqual([1, 1, 2]);
  });

  it('level 3: each hint names the outcome its question asks for', () => {
    for (const q of findRound(new Rng(3), false)) {
      const round = new FindRound([q]);
      expect(round.ask().hint).toBe(`stirsee.hint.${outcomeOf(q.target)}`);
      expect(round.ask().glow).toBe(q.cups.indexOf(q.target));
    }
  });

  it('level 4 counts nothing for any taps, and the spoon waits for a guess', () => {
    const round = new GuessRound(guessRound(new Rng(1), true));
    expect(round.test()).toBeNull();
    round.choose('float');
    round.choose('vanish');
    expect(round.test()).toMatchObject({ material: 'salt', match: true, line: 'stirsee.match' });
    round.choose('vanish');
    expect(round.test()).toMatchObject({ material: 'pebble', match: false, line: 'stirsee.surprise' });
    round.choose('float');
    round.test();
    round.choose('settle');
    round.test();
    expect(round.finished).toBe(true);
    expect([round.misses, round.hints]).toEqual([0, 0]);
    expect(round.record.map((r) => r.result)).toEqual(['vanish', 'settle', 'float', 'vanish']);
  });

  it('level 5: looking is free, a wrong tray is a miss, a glow from the second, the pet files on the third', () => {
    const round = new SortRound(sortRound(new Rng(1), true));
    round.look();
    round.look();
    expect([round.misses, round.hints]).toEqual([0, 0]);
    expect(round.file('vanish')).toMatchObject({ done: true, miss: false, looked: false });
    // The pebble, filed before looking: the cup settles first, then the wrong tray is judged.
    expect(round.file('float')).toMatchObject({
      done: false,
      miss: true,
      looked: true,
      glow: false,
      hint: 'stirsee.hint.settle',
    });
    expect(round.file('vanish')).toMatchObject({ done: false, miss: true, glow: true });
    round.ask();
    expect(round.file('float')).toMatchObject({ done: true, supported: true, tray: 'settle' });
    expect([round.misses, round.hints, round.index]).toEqual([3, 1, 2]);
    expect([...round.seen]).toEqual(['vanish', 'settle']);
  });
});

describe('levels', () => {
  it('defines five plans and bands that match the definition', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['stir', 'three', 'find', 'guess', 'sort']);
    expect(rangeFor(LEVELS, 'toddler')).toMatchObject({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'preschool')).toMatchObject({ min: 1, max: 4 });
    expect(rangeFor(LEVELS, 'prek')).toMatchObject({ min: 3, max: 4 });
    expect(rangeFor(LEVELS, 'school')).toMatchObject({ min: 4, max: 5 });
    expect(stirPlan(9).mode).toBe('sort');
  });
});

describe('speech', () => {
  it('never says the words kept for later levels', () => {
    const banned = [
      'react',
      'reaction',
      'chemical',
      'melt',
      'taste',
      'eat',
      'drink',
      'sweet',
      'fizz',
      'dissolve',
    ];
    const lines = [...Object.values(VOICE).flat(), ...entriesOf('stir-see').flatMap((e) => SCRIPT[e.line])]
      .join(' ')
      .toLowerCase();
    for (const w of banned) expect(lines, w).not.toMatch(new RegExp(`\\b${w}`));
  });

  it('files one journal entry per discovery, each with a spoken line', () => {
    expect(entriesOf('stir-see').map((e) => e.key)).toEqual(DISCOVERIES);
    for (const e of entriesOf('stir-see')) expect(SCRIPT[e.line]?.length).toBeGreaterThan(0);
  });
});

const sideways = {
  landscape: computeView(1024, 768),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  wide: computeView(1366, 768),
};
const ipadUpright = computeView(768, 1024);
const MODES: Mode[] = ['stir', 'three', 'find', 'guess', 'sort'];
const targetsOf = (view: { w: number; h: number }, mode: Mode) => {
  const L = cupLayout(view, mode);
  const boxes: [string, Box][] = [
    ...L.cups.map((b, i): [string, Box] => [`cup ${i}`, b]),
    ...(L.spoon ? [['spoon', L.spoon] as [string, Box]] : []),
    ...L.choices.map((b, i): [string, Box] => [`choice ${i}`, b]),
    ...(L.card ? [['card', L.card] as [string, Box]] : []),
  ];
  return boxes;
};

describe('cupLayout', () => {
  it('keeps every target big, apart and clear of Home and the guide upright', () => {
    for (const [name, view] of Object.entries({
      ...UPRIGHT_VIEWS,
      short: computeView(375, 601, NO_INSETS, true),
    }))
      for (const mode of MODES) {
        const targets: Target[] = targetsOf(view, mode).map(([what, b]) => ({
          what,
          x: b.x + b.w / 2,
          y: b.y + b.h / 2,
          w: b.w - 1e-7,
          h: b.h - 1e-7,
        }));
        expect(uprightProblems(view, targets, 120), `${name} ${mode}`).toEqual([]);
      }
  });

  it('sideways and on an upright iPad: inside the view, apart, clear of the corners and the pet', () => {
    for (const [name, view] of Object.entries({ ...sideways, ipadUpright }))
      for (const mode of MODES) {
        const boxes = targetsOf(view, mode);
        const keepOut: Box[] = [
          { x: 0, y: 0, w: 120, h: 210 },
          { x: view.w - 120, y: 0, w: 120, h: 120 },
          { x: 0, y: view.h - 230, w: 230, h: 230 },
        ];
        for (const [what, b] of boxes) {
          expect(Math.min(b.w, b.h), `${name} ${mode} ${what}`).toBeGreaterThanOrEqual(120);
          expect(
            b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h,
            `${name} ${mode} ${what}`,
          ).toBe(true);
          for (const k of keepOut) expect(overlaps(b, k), `${name} ${mode} ${what} corner`).toBe(false);
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++)
            expect(overlaps(boxes[i][1], boxes[j][1]), `${name} ${mode} ${boxes[i][0]}/${boxes[j][0]}`).toBe(
              false,
            );
      }
  });

  it('gives a single cup at least 220 units and level 3 cups at least 150', () => {
    for (const view of [...Object.values(sideways), ...Object.values(UPRIGHT_VIEWS)])
      for (const mode of MODES) {
        const L = cupLayout(view, mode);
        for (const c of L.cups) expect(c.w).toBeGreaterThanOrEqual(mode === 'find' ? 150 : 220);
      }
  });
});
