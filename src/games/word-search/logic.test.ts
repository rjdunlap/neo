import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ALL_DIRS, cellOf, cellsOfWord, hasBlocked, hintFor, lineBetween, makeGrid, makeGrids, occurrences, parseGrid, planFor, PLANS, rowsOf, textOf, wordAt,
} from './logic';
import { BLOCKED } from './blocked';
import { THEMES, themeById } from './words';

describe('the word lists', () => {
  it('are plain capital words of three to eight letters, none repeated, with enough in each theme for every level', () => {
    const most = Math.max(...PLANS.map((p) => p.words));
    expect(THEMES.length).toBeGreaterThanOrEqual(8);
    for (const t of THEMES) {
      expect(new Set(t.words).size, t.id).toBe(t.words.length);
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(most);
      for (const w of t.words) expect(w, `${t.id} ${w}`).toMatch(/^[A-Z]{3,8}$/);
      expect(t.name.length, t.id).toBeGreaterThan(5);
    }
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(themeById('pond').id).toBe('pond');
    expect(themeById('nope').id).toBe(THEMES[0].id);
  });
});

describe('lines of letters', () => {
  it('finds the squares between two, across, down and on a slant, and nothing for a crooked pair', () => {
    expect(lineBetween(5, 0, 4)).toEqual([0, 1, 2, 3, 4]);
    expect(lineBetween(5, 20, 0)).toEqual([20, 15, 10, 5, 0]);
    expect(lineBetween(5, 0, 24)).toEqual([0, 6, 12, 18, 24]);
    expect(lineBetween(5, 4, 20)).toEqual([4, 8, 12, 16, 20]);
    expect(lineBetween(5, 7, 7)).toEqual([7]);
    expect(lineBetween(5, 0, 7)).toBeNull();
    expect(lineBetween(5, 0, 11)).toBeNull();
  });

  it('reads a word either way, but only one not found yet', () => {
    const grid = parseGrid(['FROGX', 'QQQQX', 'QQQQX', 'QQQQX', 'QQQQX'], 'pond', ['FROG']);
    expect(grid.words[0]).toMatchObject({ word: 'FROG', r: 0, c: 0, dr: 0, dc: 1 });
    const line = lineBetween(5, 0, 3)!, back = lineBetween(5, 3, 0)!;
    expect(textOf(grid, line)).toBe('FROG');
    expect(wordAt(grid, line, new Set())).toBe(0);
    expect(wordAt(grid, back, new Set())).toBe(0);
    expect(wordAt(grid, line, new Set([0]))).toBe(-1);
    expect(wordAt(grid, lineBetween(5, 0, 2)!, new Set())).toBe(-1);
  });
});

describe('making grids', () => {
  it('hides every level\'s words exactly once, in the directions the level allows, in a grid of capital letters', () => {
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      for (let s = 1; s <= 12; s++) {
        const theme = THEMES[s % THEMES.length];
        const grid = makeGrid(plan, theme, new Rng(s * 977 + i));
        const label = `${plan.name} seed ${s}`;
        expect(grid.size, label).toBe(plan.size);
        expect(grid.letters, label).toHaveLength(plan.size * plan.size);
        expect(grid.letters.every((l) => /^[A-Z]$/.test(l)), label).toBe(true);
        expect(grid.words, label).toHaveLength(plan.words);
        expect(new Set(grid.words.map((w) => w.word)).size, label).toBe(plan.words);
        for (const p of grid.words) {
          expect(theme.words, label).toContain(p.word);
          expect(plan.dirs.some(([dr, dc]) => dr === p.dr && dc === p.dc), `${label} ${p.word} direction`).toBe(true);
          expect(textOf(grid, cellsOfWord(grid.size, p)), `${label} ${p.word}`).toBe(p.word);
          expect(occurrences(grid.size, grid.letters, p.word), `${label} ${p.word} once`).toHaveLength(1);
        }
      }
    });
  });

  it('only reads backwards where the level allows it, and the easy levels read forwards', () => {
    for (let s = 1; s <= 8; s++) {
      for (const level of [1, 2]) for (const p of makeGrid(planFor(level), THEMES[s % THEMES.length], new Rng(s)).words) expect(p.dr >= 0 && p.dc >= 0, `level ${level} ${p.word} reads forwards`).toBe(true);
      const hard = makeGrid(planFor(3), THEMES[0], new Rng(s + 100));
      expect(hard.words.every((p) => ALL_DIRS.some(([dr, dc]) => dr === p.dr && dc === p.dc))).toBe(true);
    }
    const backwards = Array.from({ length: 12 }, (_, s) => makeGrid(planFor(3), THEMES[s % THEMES.length], new Rng(s * 31))).flatMap((g) => g.words).filter((p) => p.dr < 0 || p.dc < 0 || (p.dr === 1 && p.dc === -1));
    expect(backwards.length).toBeGreaterThan(0);
  });

  it('is fair: the same seed gives the same grid, different seeds other ones', () => {
    const a = makeGrids(PLANS[1], new Rng(5)), b = makeGrids(PLANS[1], new Rng(5)), c = makeGrids(PLANS[1], new Rng(6));
    expect(a).toEqual(b);
    expect(a[0].letters).not.toEqual(c[0].letters);
    expect(a).toHaveLength(PLANS[1].grids);
  });

  it('climbs: bigger grids with more words', () => {
    expect(PLANS.map((p) => p.size)).toEqual([8, 10, 12, 14]);
    expect(PLANS.map((p) => p.words)).toEqual([5, 7, 9, 12]);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('reads a grid from its picture and finds each word where it is, complaining about one that is missing or repeated', () => {
    const rows = ['FROGQ', 'XXXXQ', 'DUCKQ', 'XXXXQ', 'XXXXQ'].map((r) => r.replace(/X/g, 'Z'));
    const g = parseGrid(rows, 'pond', ['FROG', 'DUCK']);
    expect(g.words.map((w) => [w.r, w.c])).toEqual([[0, 0], [2, 0]]);
    expect(rowsOf(g)).toEqual(rows);
    expect(() => parseGrid(rows, 'pond', ['SWAN'])).toThrow('exactly once');
    expect(() => parseGrid(['FROGF', 'ZZZZR', 'ZZZZO', 'ZZZZG', 'ZZZZZ'], 'pond', ['FROG'])).toThrow('exactly once');
    expect(() => parseGrid(['AB', 'ABC'], 'pond', ['AB'])).toThrow();
    expect(cellOf(5, 2, 3)).toBe(13);
  });
});

describe('hints', () => {
  it('point at the first letter of a word not found yet, the nearest to the cursor, and at nothing when all are found', () => {
    const grid = makeGrid(PLANS[1], THEMES[0], new Rng(3));
    const first = hintFor(grid, new Set(), 0)!;
    expect(first.word).toBeGreaterThanOrEqual(0);
    const p = grid.words[first.word];
    expect(first.cell).toBe(cellOf(grid.size, p.r, p.c));
    const some = new Set([first.word]);
    expect(hintFor(grid, some, 0)!.word).not.toBe(first.word);
    expect(hintFor(grid, new Set(grid.words.map((_, i) => i)), 0)).toBeNull();
    // Nearest wins: from each word's own first letter the hint is that word.
    for (let i = 0; i < grid.words.length; i++) expect(hintFor(grid, new Set(), cellOf(grid.size, grid.words[i].r, grid.words[i].c))!.word).toBe(i);
  });
});

describe('words that must not appear', () => {
  it('are never in a generated grid, and the check really reads every direction', () => {
    for (const plan of PLANS) for (let s = 1; s <= 10; s++) {
      const g = makeGrid(plan, THEMES[s % THEMES.length], new Rng(s * 53));
      expect(hasBlocked(g.size, g.letters, g.words.map((w) => w.word)), `${plan.name} seed ${s}`).toBe(false);
    }
    // The check itself: a blocked word hidden in any of the eight directions is seen.
    const quiet = Array<string>(25).fill('Q');
    for (const [dr, dc] of ALL_DIRS) {
      const letters = quiet.slice(), r0 = dr < 0 ? 4 : 0, c0 = dc < 0 ? 4 : 0;
      [...'CRAP'].forEach((ch, k) => { letters[cellOf(5, r0 + dr * k, c0 + dc * k)] = ch; });
      expect(hasBlocked(5, letters), `direction ${dr},${dc}`).toBe(true);
    }
    expect(hasBlocked(5, quiet)).toBe(false);
    for (const t of THEMES) for (const w of t.words) {
      expect(BLOCKED, `${t.id} ${w}`).not.toContain(w);
      // No listed word may hide a blocked one inside it, forwards or backwards.
      for (const b of BLOCKED) expect(w.includes(b) || [...w].reverse().join('').includes(b), `${t.id} ${w} contains ${b}`).toBe(false);
    }
  });
});

