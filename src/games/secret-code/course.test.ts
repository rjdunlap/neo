import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseDoors, courseMinimum, isCodeCourse } from './course';
import { candidates, nextMove, score, solverTries, type Guess } from './logic';

describe('the Code Doors course', () => {
  const doors = courseDoors('codedoors');

  it('is five doors at levels 4 to 6, each a code its level could make', () => {
    expect(COURSES.codedoors.doors.map((d) => d.level)).toEqual([4, 4, 5, 5, 6]);
    for (const { plan, code } of doors) {
      expect(code).toHaveLength(plan.slots);
      expect(code.every((c) => c >= 0 && c < plan.colors)).toBe(true);
      // Levels 4 and 5 never repeat a color; level 6's door really does, so its rule matters.
      expect(new Set(code).size < code.length).toBe(plan.repeats);
      expect(candidates(plan, []).some((c) => c.join() === code.join())).toBe(true);
    }
  });

  it('takes its par from the reference solver, never the first try, and climbs gently', () => {
    expect(courseBest('codedoors')).toEqual([2, 3, 3, 4, 4]);
    expect(courseMinimum('codedoors')).toBe(16);
    for (const { plan, code } of doors) expect(solverTries(plan, code)).toBeGreaterThanOrEqual(2);
  });

  it('counts the same turns the couch bot takes, every try fitting the marks so far', () => {
    for (const { plan, code } of doors) {
      const history: Guess[] = [];
      for (;;) {
        const guess: (number | null)[] = Array(plan.slots).fill(null);
        for (
          let m = nextMove(plan, history, code, guess);
          'stone' in m;
          m = nextMove(plan, history, code, guess)
        )
          guess[guess.indexOf(null)] = m.stone;
        expect(candidates(plan, history).some((c) => c.join() === guess.join())).toBe(true);
        const marks = score(code, guess as number[], plan.yellow);
        history.push({ stones: guess as number[], marks });
        if (marks.every((m) => m === 'green')) break;
      }
      expect(history.length).toBe(solverTries(plan, code));
      // The game's own hint comes after slots + 4 tries; the solver never needs it.
      expect(history.length).toBeLessThan(plan.slots + 4);
    }
  });

  it('knows its own name', () => {
    expect(isCodeCourse('codedoors')).toBe(true);
    expect(isCodeCourse('sunbeams')).toBe(false);
  });
});
