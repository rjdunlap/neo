import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseBoards, courseMinimum, isLightCourse, parseBoard } from './course';
import { hintMirror, minTurns, solved, type Tilt } from './logic';

describe('Light Lab courses', () => {
  it('keeps Sunbeam Run frozen: five boards and their fewest turns, worked out by the solver', () => {
    expect(isLightCourse('sunbeams')).toBe(true);
    expect(isLightCourse('lanterns')).toBe(false);
    expect(COURSES.sunbeams.version).toBe(1);
    expect(courseBest('sunbeams')).toEqual([2, 2, 3, 4, 4]);
    expect(courseMinimum('sunbeams')).toBe(15);
  });

  it('reads every board as a fair planning board: one sun on its edge, rectangular, unsolved at the start, with an answer', () => {
    for (const rows of COURSES.sunbeams.boards) {
      expect(new Set(rows.map((r) => r.length)).size).toBe(1);
      const p = parseBoard(rows);
      expect(p.sunCol).toBe(p.sunDir === 0 ? 0 : p.cols - 1);
      expect(p.things.some((t) => t.x === p.sunCol && t.y === p.sunRow)).toBe(false);
      expect(p.tray).toEqual([]);
      expect(solved(p, p.start)).toBe(false);
      expect(solved(p, p.solution)).toBe(true);
      expect(p.pathMirrors.length).toBeGreaterThan(0);
      expect(p.pathMirrors.every((i) => p.things[i].kind === 'mirror')).toBe(true);
    }
  });

  it('goes from right-hand and left-hand suns, through two flowers, to coloured glass', () => {
    const boards = courseBoards('sunbeams');
    expect(new Set(boards.map((p) => p.sunDir))).toEqual(new Set([0, 2]));
    expect(boards.some((p) => p.things.filter((t) => t.kind === 'flower').length === 2)).toBe(true);
    expect(boards.some((p) => p.things.some((t) => t.kind === 'glass'))).toBe(true);
  });

  it('has hints that reach an answer in exactly the par, so the par can be met by following them', () => {
    courseBoards('sunbeams').forEach((p, b) => {
      let tilts: Tilt[] = [...p.start];
      let turns = 0;
      while (!solved(p, tilts) && turns < 10) {
        const i = hintMirror(p, tilts);
        expect(i).toBeGreaterThanOrEqual(0);
        tilts = tilts.map((t, k) => (k === i ? ((1 - t) as Tilt) : t));
        turns++;
      }
      expect(turns).toBe(courseBest('sunbeams')[b]);
      expect(minTurns(p, tilts)).toBe(0);
    });
  });

  it('rejects a board without exactly one sun or with an unknown cell', () => {
    expect(() => parseBoard(['..y', '...'])).toThrow();
    expect(() => parseBoard(['>.y', '..<'])).toThrow();
    expect(() => parseBoard(['>.z', '...'])).toThrow();
  });
});
