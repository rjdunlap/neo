import { describe, expect, it } from 'vitest';
import { courseDefaults, courseOf, courseSpec, finishRun, noteProgress, startRun } from './course';
import { COURSE_IDS, courseInfo } from './courses';
import { couchDefaults, repairCouch } from './party';
import { canWatchRoute, shelf, shelfEntry, standing } from './shelf';

/** Finish a run of a real course: every part takes the given number of tries. */
function finish(save: ReturnType<typeof couchDefaults>, id: 'practice' | 'ponds' | 'clouds', player: 0 | 1, tries: number[], assisted = false) {
  const spec = courseSpec(id), course = courseOf(save, spec);
  startRun(course, player, 11);
  noteProgress(course, spec, 11, { slides: tries, attempts: 0, assisted });
  return finishRun(course, spec, 11, 1000);
}

describe('the puzzle shelf', () => {
  it('lists every puzzle at once, gentlest first, with nothing locked and nothing played', () => {
    const rows = shelf(couchDefaults());
    expect(rows.map(r => r.id)).toEqual([...COURSE_IDS]);
    expect(rows.map(r => r.id)).toEqual(['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
    for (const row of rows) {
      expect(row).toMatchObject({ best: null, helped: false, over: null, runs: 0, inProgress: false });
      expect(row.minimum).toBe(courseInfo(row.id).minimum);
      expect(standing(row)).toBe(`Not finished yet · par ${row.minimum}`);
    }
  });

  it('shows how far her best is above par, and a perfect run as par itself', () => {
    const save = couchDefaults();
    // Pond Practice: par 18, five ponds of 2, 3, 4, 4 and 5.
    finish(save, 'practice', 0, [3, 3, 5, 4, 6]);
    expect(shelfEntry(save, 'practice')).toMatchObject({ best: 21, helped: false, minimum: 18, over: 3, runs: 1 });
    expect(standing(shelfEntry(save, 'practice'))).toBe('21 slides · 3 above par (18)');
    finish(save, 'practice', 0, [2, 3, 4, 4, 5]);
    expect(shelfEntry(save, 'practice')).toMatchObject({ best: 18, over: 0, runs: 2 });
    expect(standing(shelfEntry(save, 'practice'))).toBe('18 slides · par: the fewest possible');
    // A slower run later never worsens the best.
    finish(save, 'practice', 0, [9, 9, 9, 9, 9]);
    expect(shelfEntry(save, 'practice')).toMatchObject({ best: 18, over: 0, runs: 3 });
  });

  it('counts the launches of the cloud course in launches, and says when the best needed help', () => {
    const save = couchDefaults();
    finish(save, 'clouds', 0, [1, 1, 2, 1, 1, 1, 3, 1, 1, 1, 1, 1], true);
    expect(shelfEntry(save, 'clouds')).toMatchObject({ best: 15, helped: true, minimum: 12, over: 3 });
    expect(standing(shelfEntry(save, 'clouds'))).toBe('15 launches · 3 above par (12) · with help');
    // A run with no hint takes over as the best, even when it was longer: the two kinds are never compared.
    finish(save, 'clouds', 0, [2, 2, 2, 1, 1, 1, 3, 1, 1, 1, 1, 1]);
    expect(shelfEntry(save, 'clouds')).toMatchObject({ best: 17, helped: false, over: 5 });
    expect(standing(shelfEntry(save, 'clouds'))).toBe('17 launches · 5 above par (12)');
    expect(standing(shelfEntry(save, 'clouds', 1))).toBe('Not finished yet · par 12');
  });

  it("reads one player's records and never mixes in the other's", () => {
    const save = couchDefaults();
    finish(save, 'ponds', 1, [3, 5, 6, 7, 9]);
    expect(shelfEntry(save, 'ponds', 0)).toMatchObject({ best: null, over: null, runs: 0 });
    expect(shelfEntry(save, 'ponds', 1)).toMatchObject({ best: 30, over: 0, runs: 1 });
  });

  it('marks a puzzle that is half played, and survives a reload', () => {
    const save = couchDefaults();
    startRun(courseOf(save, courseSpec('ponds')), 0, 5);
    expect(shelfEntry(save, 'ponds').inProgress).toBe(true);
    expect(shelfEntry(repairCouch(JSON.parse(JSON.stringify(save))), 'ponds').inProgress).toBe(true);
    expect(shelfEntry(save, 'practice').inProgress).toBe(false);
    expect(courseDefaults(courseSpec('ponds')).run).toBe(null);
  });
});

describe('Watch the best route', () => {
  it('is only for courses whose game can replay the best way through a part', () => {
    expect(courseInfo('practice').routes).toBe(true);
    expect(courseInfo('ponds').routes).toBe(true);
    expect(courseInfo('clouds').routes).toBe(false);
    const save = couchDefaults();
    finish(save, 'clouds', 0, Array(12).fill(1));
    expect(canWatchRoute(save, 'clouds', true)).toBe(false);
  });

  it('never gives the answer away in the middle of a run, and waits until the course has been finished once', () => {
    const save = couchDefaults();
    expect(canWatchRoute(save, 'ponds')).toBe(false);
    startRun(courseOf(save, courseSpec('ponds')), 0, 3);
    expect(canWatchRoute(save, 'ponds')).toBe(false);
    expect(canWatchRoute(save, 'ponds', true)).toBe(false);
    save.courses.ponds = undefined;
    finish(save, 'ponds', 0, [4, 6, 7, 8, 10]);
    expect(canWatchRoute(save, 'ponds')).toBe(true);
    expect(canWatchRoute(save, 'practice')).toBe(false);
    // The result page offers it the moment a run is done, whatever the records say.
    expect(canWatchRoute(couchDefaults(), 'practice', true)).toBe(true);
    // A fresh run in progress closes it again.
    startRun(courseOf(save, courseSpec('ponds')), 0, 4);
    expect(canWatchRoute(save, 'ponds')).toBe(false);
  });
});
