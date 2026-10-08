import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, coursePictures, isPictureCourse, type PictureCourseId } from './course';
import { isSolved, solvableByLines, FILLED, EMPTY, type Mark } from './logic';

const IDS: PictureCourseId[] = ['pictures', 'bigpictures'];
/** A fingerprint of a picture's clues, so editing a frozen picture without bumping its course's version fails here. */
const fingerprint = (clues: unknown) => [...JSON.stringify(clues)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const PINNED: Record<string, number> = {
  'a sailboat': 3027293296, 'a cat': 41781728, 'a duck': 1240589507, 'a lighthouse': 2190057317, 'a butterfly': 4210018513,
};

describe('the Picture Logic courses', () => {
  it('knows its ids', () => {
    for (const id of IDS) expect(isPictureCourse(id)).toBe(true);
    expect(isPictureCourse('beds')).toBe(false);
    expect(Object.keys(COURSES).sort()).toEqual([...IDS].sort());
  });

  it('has pictures that line logic alone can solve, of the size the course says', () => {
    for (const id of IDS) coursePictures(id).forEach((p, i) => {
      const label = `${id} picture ${i + 1}`;
      expect(solvableByLines(p), label).toBe(true);
      expect(p.size, label).toBe(id === 'pictures' ? 10 : 15);
      const solved = p.solution.map((on): Mark => (on ? FILLED : EMPTY));
      expect(isSolved(solved, p), label).toBe(true);
    });
  });

  it('has a par that is each picture\'s filled squares, summed for the course', () => {
    expect(courseBest('pictures')).toEqual([46, 76, 60]);
    expect(courseBest('bigpictures')).toEqual([102, 128]);
    expect(courseMinimum('pictures')).toBe(182);
    expect(courseMinimum('bigpictures')).toBe(230);
    for (const id of IDS) expect(courseMinimum(id)).toBe(courseBest(id).reduce((n, b) => n + b, 0));
  });

  it('is frozen: the clues of every picture are pinned, no picture repeats, and a version changes when one does', () => {
    const names = IDS.flatMap((id) => coursePictures(id).map((p) => p.name));
    expect(new Set(names).size).toBe(names.length);
    for (const id of IDS) {
      expect(COURSES[id].version).toBeGreaterThanOrEqual(1);
      for (const p of coursePictures(id)) expect(fingerprint([p.rowClues, p.colClues]), `${p.name}: change a course picture and the course's version together`).toBe(PINNED[p.name]);
    }
  });

  it('climbs: the first picture is the gentlest of its course', () => {
    expect(courseBest('pictures')[0]).toBe(Math.min(...courseBest('pictures')));
  });
});
