import { describe, expect, it } from 'vitest';
import { BLOCKED } from './blocked';
import { COURSES, courseBest, courseGrids, courseMinimum, isWordCourse, type WordCourseId } from './course';
import { hasBlocked, occurrences, textOf, cellsOfWord } from './logic';
import { themeById } from './words';

const IDS: WordCourseId[] = ['words', 'bigwords'];

describe('the Word Search courses', () => {
  it('knows its ids', () => {
    for (const id of IDS) expect(isWordCourse(id)).toBe(true);
    expect(isWordCourse('beds')).toBe(false);
    expect(Object.keys(COURSES).sort()).toEqual([...IDS].sort());
  });

  it('has grids that are square capital letters, with every listed word from its theme in the grid exactly once', () => {
    for (const id of IDS) courseGrids(id).forEach((g, i) => {
      const label = `${id} grid ${i + 1}`;
      expect(g.letters.every((l) => /^[A-Z]$/.test(l)), label).toBe(true);
      expect(g.size, label).toBe(id === 'words' ? (i === 0 ? 10 : 12) : 14);
      const theme = themeById(g.theme);
      for (const p of g.words) {
        expect(theme.words, label).toContain(p.word);
        expect(occurrences(g.size, g.letters, p.word), `${label} ${p.word}`).toHaveLength(1);
        expect(textOf(g, cellsOfWord(g.size, p)), `${label} ${p.word}`).toBe(p.word);
      }
      expect(new Set(g.words.map((w) => w.word)).size, label).toBe(g.words.length);
    });
  });

  it('has no word in it that must not appear, and uses every direction in the big hunt', () => {
    for (const id of IDS) courseGrids(id).forEach((g, i) => expect(hasBlocked(g.size, g.letters, g.words.map((w) => w.word)), `${id} grid ${i + 1}`).toBe(false));
    expect(BLOCKED.length).toBeGreaterThan(10);
    const dirs = new Set(courseGrids('bigwords').flatMap((g) => g.words.map((w) => `${w.dr},${w.dc}`)));
    expect(dirs.size).toBeGreaterThanOrEqual(4);
    expect([...dirs].some((d) => d.startsWith('-') || d.endsWith(',-1'))).toBe(true);
  });

  it('has a par that is the number of words, summed for the course', () => {
    expect(courseBest('words')).toEqual([7, 9, 9]);
    expect(courseBest('bigwords')).toEqual([12, 12]);
    expect(courseMinimum('words')).toBe(25);
    expect(courseMinimum('bigwords')).toBe(24);
  });

  it('is frozen: no two grids the same, and a version to change when one does', () => {
    const all = IDS.flatMap((id) => COURSES[id].grids.map((g) => g.rows.join('')));
    expect(new Set(all).size).toBe(all.length);
    for (const id of IDS) expect(COURSES[id].version).toBeGreaterThanOrEqual(1);
  });
});
