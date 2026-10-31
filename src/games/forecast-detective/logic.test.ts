import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  AUTHORED, CLUES, LEVEL1_WORLDS, WEATHERS, WORLDS, answerOf, answersFor, available, canTell, check, clueOrder, decided,
  forecastLayout, freshHistory, isMiss, makeCase, possible, rainUpwind, ruledOutBy, tomorrow, usefulClue,
  type Answer, type Box, type Case, type ClueId, type History, type Weather,
} from './logic';

const subsets = <T,>(xs: readonly T[]): T[][] => xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);
const MISSINGS: (ClueId | undefined)[] = [undefined, ...CLUES];
const ALL_CASES: Case[] = WORLDS.flatMap((w) => MISSINGS.map((missing): Case => (missing ? { ...w, missing } : { ...w })));
const names = (s: Set<Weather>) => WEATHERS.filter((w) => s.has(w));
const W = (s: string): Weather[] => s.split(',').filter(Boolean) as Weather[];
const ALL4 = 'sunny,cloudy,rainy,snowy';

describe('tomorrow', () => {
  it('is the upwind sky, rain plus freezing gives snow, and the downwind sky never matters', () => {
    expect(WORLDS.length).toBe(36);
    for (const w of WORLDS) {
      const sky = w[w.wind];
      const want = sky === 'sun' ? 'sunny' : sky === 'cloud' ? 'cloudy' : w.temp === 'freezing' ? 'snowy' : 'rainy';
      expect(tomorrow(w)).toBe(want);
      if (tomorrow(w) === 'snowy') expect(sky === 'rain' && w.temp === 'freezing').toBe(true);
      const down = w.wind === 'west' ? 'east' : 'west';
      for (const s of ['sun', 'cloud', 'rain'] as const) expect(tomorrow({ ...w, [down]: s })).toBe(tomorrow(w));
    }
  });
});

describe('possible sets', () => {
  const rows1: [ClueId[], string][] = [
    [[], ALL4], [['wind'], ALL4], [['west'], ALL4], [['east'], ALL4], [['temp'], 'sunny,cloudy,rainy'],
    [['wind', 'west'], 'rainy,snowy'], [['wind', 'east'], ALL4], [['wind', 'temp'], 'sunny,cloudy,rainy'],
    [['west', 'east'], 'sunny,rainy,snowy'], [['west', 'temp'], 'sunny,cloudy,rainy'], [['temp', 'east'], 'sunny,cloudy,rainy'],
    [['wind', 'west', 'temp'], 'rainy'], [['wind', 'west', 'east'], 'rainy,snowy'], [['wind', 'temp', 'east'], 'sunny,cloudy,rainy'],
    [['west', 'temp', 'east'], 'sunny,rainy'], [['wind', 'west', 'east', 'temp'], 'rainy'],
  ];
  it('level-1 authored table, row for row (16 rows, any order)', () => {
    expect(rows1.length).toBe(16);
    expect(AUTHORED[1]).toEqual({ wind: 'west', west: 'rain', east: 'sun', temp: 'warm' });
    expect(tomorrow(AUTHORED[1])).toBe('rainy');
    for (const [open, want] of rows1) {
      expect(names(possible(AUTHORED[1], open))).toEqual(W(want));
      expect(names(possible(AUTHORED[1], [...open].reverse()))).toEqual(W(want));
    }
    expect(decided(AUTHORED[1], ['wind', 'west', 'temp'])).toBe(true);
  });
  it('level-2 authored table, row for row (8 rows)', () => {
    const c = AUTHORED[2];
    expect(c.missing).toBe('east');
    const rows: [ClueId[], string][] = [
      [[], ALL4], [['wind'], ALL4], [['west'], ALL4], [['temp'], 'sunny,cloudy,rainy'], [['wind', 'west'], ALL4],
      [['wind', 'temp'], 'sunny,cloudy,rainy'], [['west', 'temp'], 'sunny,cloudy,rainy'], [['wind', 'west', 'temp'], 'sunny,cloudy,rainy'],
    ];
    expect(rows.length).toBe(8);
    for (const [open, want] of rows) expect(names(possible(c, open))).toEqual(W(want));
    expect(available(c)).toEqual(['wind', 'west', 'temp']);
    expect(canTell(c)).toBe(false);
    expect(answerOf(c)).toBe('cant-tell');
  });
  it('contains the truth, is monotone, and a full level-1 case is decided (all 36)', () => {
    for (const c of ALL_CASES) {
      for (const open of subsets(CLUES)) {
        const p = possible(c, open);
        expect(p.has(tomorrow(c))).toBe(true);
        for (const k of CLUES) if (!open.includes(k)) for (const w of possible(c, [...open, k])) expect(p.has(w)).toBe(true);
      }
    }
    for (const w of WORLDS) { expect(decided(w, CLUES)).toBe(true); expect(answerOf(w)).toBe(tomorrow(w)); }
  });
  it('has no likelihoods: a Set of weathers only, nothing numeric per weather', () => {
    for (const c of ALL_CASES) for (const open of subsets(CLUES)) {
      const p = possible(c, open);
      expect(p).toBeInstanceOf(Set);
      for (const w of p) expect(WEATHERS).toContain(w);
      expect(p.size).toBeGreaterThan(0);
      expect(p.size).toBeLessThanOrEqual(4);
    }
    const p: Set<Weather> = possible(AUTHORED[1], []);
    expect(Object.keys(p)).toEqual([]);
  });
  it('level-1 pool: 24 worlds with differing postcards, 8 rain upwind (12 of 36 overall)', () => {
    expect(LEVEL1_WORLDS.length).toBe(24);
    expect(LEVEL1_WORLDS.every((w) => w.west !== w.east)).toBe(true);
    expect(LEVEL1_WORLDS.filter(rainUpwind).length).toBe(8);
    expect(WORLDS.filter(rainUpwind).length).toBe(12);
    for (const w of LEVEL1_WORLDS) {
      expect(decided(w, ['wind', w.wind])).toBe(!rainUpwind(w));
      expect(decided(w, ['wind', w.wind, 'temp'])).toBe(true);
    }
  });
});

describe('check', () => {
  const answers: Answer[] = [...WEATHERS, 'cant-tell'];
  it('follows the four rules for every case, open set and answer', () => {
    let rights = 0;
    for (const c of ALL_CASES) {
      const av = available(c);
      for (const open of subsets(av)) {
        const left = possible(c, open);
        const allOpen = open.length === av.length;
        for (const a of answers) {
          const v = check(c, open, a);
          let want: string;
          if (a === 'cant-tell') want = left.size === 1 ? 'overclaim' : allOpen ? 'right' : 'not-yet';
          else if (!left.has(a)) want = 'ruled-out';
          else if (left.size === 1) want = 'right';
          else want = allOpen ? 'overclaim' : 'not-yet';
          expect(v.kind).toBe(want);
          expect(isMiss(v)).toBe(want === 'ruled-out' || want === 'overclaim');
          if (v.kind === 'ruled-out') {
            expect(open).toContain(v.by);
            expect(ruledOutBy(c, open, a as Weather)).toBe(v.by);
          }
          if (v.kind === 'right') rights++;
        }
        if (allOpen) {
          const right = answers.filter((a) => check(c, open, a).kind === 'right');
          expect(right).toEqual([answerOf(c)]);
        }
      }
    }
    expect(rights).toBeGreaterThan(0);
  });
  it('not-yet is free; ruled-out and overclaim are misses', () => {
    expect(isMiss({ kind: 'not-yet' })).toBe(false);
    expect(isMiss({ kind: 'right' })).toBe(false);
    expect(isMiss({ kind: 'ruled-out', by: 'wind' })).toBe(true);
    expect(isMiss({ kind: 'overclaim' })).toBe(true);
    expect(check(AUTHORED[1], [], 'rainy').kind).toBe('not-yet');
    expect(check(AUTHORED[1], ['wind', 'west'], 'snowy').kind).toBe('not-yet');
    expect(check(AUTHORED[1], ['wind', 'west', 'east', 'temp'], 'snowy')).toEqual({ kind: 'ruled-out', by: 'temp' });
    expect(check(AUTHORED[2], ['wind', 'west', 'temp'], 'sunny').kind).toBe('overclaim');
    expect(check(AUTHORED[2], ['wind', 'west', 'temp'], 'cant-tell').kind).toBe('right');
    expect(check(AUTHORED[1], ['wind', 'west', 'temp'], 'cant-tell').kind).toBe('overclaim');
  });
  it('ruledOutBy names an open clue whose presence removes the weather, cumulatively in teaching order', () => {
    for (const c of ALL_CASES) for (const open of subsets(available(c))) for (const wx of WEATHERS) {
      const by = ruledOutBy(c, open, wx);
      if (by === null) {
        if (possible(c, open).has(wx)) continue;
        throw new Error('ruled out but no remover');
      }
      expect(open).toContain(by);
      expect(possible(c, open).has(wx)).toBe(false);
      const order = clueOrder(c);
      const prior = order.slice(0, order.indexOf(by)).filter((k) => open.includes(k));
      expect(possible(c, prior).has(wx)).toBe(true);
      expect(possible(c, [...prior, by]).has(wx)).toBe(false);
      const down = c.wind === 'west' ? 'east' : 'west';
      if (by === down) expect(open).not.toContain('wind');
      expect(by).not.toBe('wind');
    }
  });
  it('clueOrder is wind, upwind postcard, temp, downwind postcard', () => {
    expect(clueOrder({ wind: 'west', west: 'sun', east: 'sun', temp: 'warm' })).toEqual(['wind', 'west', 'temp', 'east']);
    expect(clueOrder({ wind: 'east', west: 'sun', east: 'sun', temp: 'warm' })).toEqual(['wind', 'east', 'temp', 'west']);
  });
  it('level 2: Can\'t tell yet is right exactly when every available clue is open and canTell is false', () => {
    for (const c of ALL_CASES.filter((x) => x.missing)) {
      const av = available(c);
      for (const open of subsets(av)) {
        const right = check(c, open, 'cant-tell').kind === 'right';
        expect(right).toBe(open.length === av.length && !canTell(c));
      }
    }
  });
});

describe('hints', () => {
  it('lead somewhere: decided or all open within three steps; strict shrink when any clue would shrink', () => {
    for (const c of ALL_CASES) {
      const av = available(c);
      for (const start of subsets(av)) {
        let open: ClueId[] = [...start];
        let steps = 0;
        while (!decided(c, open) && open.length < av.length) {
          const k = usefulClue(c, open);
          expect(k).not.toBeNull();
          expect(av).toContain(k);
          expect(open).not.toContain(k);
          const size = possible(c, open).size;
          const closed = av.filter((x) => !open.includes(x));
          if (closed.some((x) => possible(c, [...open, x]).size < size)) expect(possible(c, [...open, k!]).size).toBeLessThan(size);
          open = [...open, k!];
          steps++;
          expect(steps).toBeLessThanOrEqual(3);
        }
        expect(decided(c, open) || open.length === av.length).toBe(true);
      }
    }
  });
  it('is null exactly when decided or nothing is closed', () => {
    for (const c of ALL_CASES) {
      const av = available(c);
      for (const open of subsets(av)) {
        expect(usefulClue(c, open) === null).toBe(decided(c, open) || open.length === av.length);
      }
    }
  });
  it('picks the fewest-left clue (the thermometer first at the start), then ties in teaching order', () => {
    expect(usefulClue(AUTHORED[1], [])).toBe('temp');
    // the missing-wind case: nothing shrinks the set, so the order decides
    expect(usefulClue({ ...AUTHORED[1], west: 'sun', east: 'sun', missing: 'temp' }, ['wind'])).toBe('west');
    expect(usefulClue(AUTHORED[1], ['wind'])).toBe('west');
    expect(usefulClue(AUTHORED[1], ['wind', 'west'])).toBe('temp');
  });
});

describe('seeded rounds', () => {
  const run = (level: number, seed: number, n: number): Case[] => {
    const rng = new Rng(seed);
    let h: History = freshHistory();
    const out: Case[] = [];
    for (let i = 0; i < n; i++) {
      const r = makeCase(level, rng, i === 0, h);
      out.push(r.c);
      h = r.next;
    }
    return out;
  };
  it('the first round of each level is the authored case', () => {
    for (const lv of [1, 2] as const) for (let s = 1; s <= 20; s++) expect(run(lv, s, 1)[0]).toEqual(AUTHORED[lv]);
  });
  it('makeCase is pure: same seed and history give the same case and history', () => {
    for (const lv of [1, 2]) for (let s = 1; s <= 50; s++) {
      expect(run(lv, s, 8)).toEqual(run(lv, s, 8));
      const a = makeCase(lv, new Rng(s), false, freshHistory());
      const b = makeCase(lv, new Rng(s), false, freshHistory());
      expect(a).toEqual(b);
    }
  });
  it('level 1: postcards differ, always decidable, and rain upwind in every window of three rounds (300 seeds)', () => {
    for (let s = 1; s <= 300; s++) {
      const cs = run(1, s, 14);
      cs.slice(1).forEach((c) => { expect(c.west).not.toBe(c.east); expect(c.missing).toBeUndefined(); });
      cs.forEach((c) => expect(canTell(c)).toBe(true));
      for (let i = 0; i + 3 <= cs.length; i++) expect(cs.slice(i, i + 3).some(rainUpwind)).toBe(true);
    }
  });
  it('level 2: both kinds occur, they alternate after the authored round, never two can\'t-tell in a row (300 seeds)', () => {
    let tell = 0, cant = 0;
    for (let s = 1; s <= 300; s++) {
      const cs = run(2, s, 10);
      const kinds = cs.map(canTell);
      expect(kinds[0]).toBe(false);
      for (let i = 1; i < kinds.length; i++) expect(kinds[i]).toBe(!kinds[i - 1]);
      kinds.forEach((k) => (k ? tell++ : cant++));
      cs.forEach((c) => expect(c.missing).toBeDefined());
    }
    expect(tell).toBeGreaterThan(0);
    expect(cant).toBeGreaterThan(0);
  });
  it('answers: four weathers at level 1, plus Can\'t tell at level 2', () => {
    expect(answersFor(1)).toEqual([...WEATHERS]);
    expect(answersFor(2)).toEqual([...WEATHERS, 'cant-tell']);
  });
});

describe('layout', () => {
  const VIEWS = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), phone: computeView(844, 390), notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }) };
  const overlap = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) => b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) => b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const level of [1, 2]) {
      it(`${name}, level ${level}: big targets, inside, apart, corners clear`, () => {
        const l = forecastLayout(v, level)!;
        expect(l).not.toBeNull();
        expect(l.cards.length).toBe(answersFor(level).length);
        const targets = [l.rule, ...CLUES.map((k) => l.flaps[k]), ...l.cards, l.checkBtn];
        for (const b of targets) {
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          expect(inside(b, v)).toBe(true);
          expect(corner(b, 0, 0, 120, 215)).toBe(false);
          expect(corner(b, 0, v.h - 170, 170, v.h)).toBe(false);
        }
        for (let i = 0; i < targets.length; i++) for (let k = i + 1; k < targets.length; k++) expect(overlap(targets[i], targets[k])).toBe(false);
        for (const k of CLUES) { expect(l.flaps[k].w).toBeGreaterThanOrEqual(150); expect(l.flaps[k].h).toBeGreaterThanOrEqual(150); }
        expect(l.rule.w).toBeGreaterThanOrEqual(110);
        expect(l.rule.h).toBeGreaterThanOrEqual(110);
        for (const c of l.cards) { expect(c.w).toBeGreaterThanOrEqual(150); expect(c.h).toBeGreaterThanOrEqual(170); }
        expect(l.checkBtn.w).toBeGreaterThanOrEqual(130);
        expect(l.checkBtn.h).toBeGreaterThanOrEqual(130);
      });
    }
  }
});
