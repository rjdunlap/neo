import { describe, expect, it } from 'vitest';
import { HARBORS } from './harbors';
import { COURSES, courseBest, courseHarbors, courseMinimum, isHarborCourse } from './course';
import { atDock, boatToward, focusPath, parse, solve, start, wellFormed } from './logic';

describe('the Busy Harbors course', () => {
  it('knows its id', () => {
    expect(isHarborCourse('harbors')).toBe(true);
    expect(isHarborCourse('beds')).toBe(false);
    expect(Object.keys(COURSES)).toEqual(['harbors']);
  });

  it('has harbors that are well formed, drawn from the game\'s own list, and can be finished in the fewest slides the solver finds', () => {
    const all = new Set(Object.values(HARBORS).flat().map((rows) => rows.join('/')));
    courseHarbors('harbors').forEach(({ harbor, best }, i) => {
      const label = `harbor ${i + 1}`;
      expect(wellFormed(harbor), label).toBe(true);
      expect(all.has(COURSES.harbors.harbors[i].join('/')), label).toBe(true);
      const way = solve(harbor)!;
      expect(way, label).not.toBeNull();
      expect(way.length, label).toBe(best);
      // Playing the way out slide by slide really does bring the ferry to the dock.
      const layout = start(harbor);
      for (const s of way) layout[s.boat] = s.to;
      expect(atDock(harbor, layout), label).toBe(true);
    });
  });

  it('climbs, and the par is the solver\'s, summed for the course', () => {
    expect(courseBest('harbors')).toEqual([8, 10, 12, 16, 18]);
    expect(courseBest('harbors')).toEqual([...courseBest('harbors')].sort((a, b) => a - b));
    expect(courseMinimum('harbors')).toBe(64);
  });

  it('is frozen: no two harbors the same, and a version to change when one does', () => {
    const all = COURSES.harbors.harbors.map((rows) => rows.join('/'));
    expect(new Set(all).size).toBe(all.length);
    expect(COURSES.harbors.version).toBeGreaterThanOrEqual(1);
  });
});

describe('moving the highlight between boats', () => {
  it('goes to the nearest boat in the direction pushed, or nowhere', () => {
    const h = parse(['aa..', 'ffb.', '..b.', 'cc..']);
    const layout = start(h);
    const ferry = 0, boats = h.boats;
    expect(boats[ferry].row).toBe(1);
    // From the ferry: right is the upright boat b, up is the sideways boat a, down is c; nothing lies to the left.
    const right = boatToward(h, layout, ferry, 0)!;
    expect(boats[right]).toMatchObject({ dir: 'v', col: 2 });
    expect(boats[boatToward(h, layout, ferry, 3)!]).toMatchObject({ row: 0, dir: 'h' });
    expect(boats[boatToward(h, layout, ferry, 1)!]).toMatchObject({ row: 3, dir: 'h' });
    expect(boatToward(h, layout, ferry, 2)).toBeNull();
  });

  it('can reach every boat from the ferry in every harbor of the game, so the highlight is never stuck', () => {
    for (const [level, list] of Object.entries(HARBORS)) list.forEach((rows, i) => {
      const h = parse(rows), layout = start(h);
      h.boats.forEach((_, to) => {
        const path = focusPath(h, layout, 0, to);
        expect(path, `level ${level} harbor ${i} boat ${to}`).not.toBeNull();
        // Following the pushes really does end on that boat.
        let at = 0;
        for (const dir of path!) at = boatToward(h, layout, at, dir)!;
        expect(at).toBe(to);
      });
    });
  });

  it('keeps reaching every boat as the boats move, along the best way out', () => {
    for (const { harbor } of courseHarbors('harbors')) {
      const layout = start(harbor);
      for (const s of solve(harbor)!) {
        layout[s.boat] = s.to;
        harbor.boats.forEach((_, to) => expect(focusPath(harbor, layout, 0, to)).not.toBeNull());
      }
    }
  });
});
