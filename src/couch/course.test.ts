import { describe, expect, it } from 'vitest';
import {
  BADGES, completeCourse, courseDefaults, courseOf, courseSpec, finishRun, noteProgress, repairCourse, startRun,
  type CourseSave, type CourseSpec,
} from './course';
import { couchDefaults, repairCouch, type CouchSave } from './party';

/** A short made-up course keeps the numbers readable: three ponds, twelve slides at the very best. */
const spec: CourseSpec = { id: 'ponds', game: 'penguin-slide', version: 1, boards: 3, minimum: 12 };
const reload = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Play a whole run: each pond takes the given number of slides. */
function play(course: CourseSave, player: 0 | 1, slides: number[], token: number, opts: { assisted?: boolean; now?: number } = {}) {
  startRun(course, player, token);
  slides.forEach((_, i) => noteProgress(course, spec, token, { slides: slides.slice(0, i + 1), attempts: 0, assisted: !!opts.assisted && i === 1 }));
  return finishRun(course, spec, token, opts.now ?? 1000);
}

describe('course runs and records', () => {
  it('settles a finished run once: total, best, badge and a cleared run', () => {
    const course = courseDefaults(spec);
    const out = play(course, 0, [4, 5, 6], 7)!;
    expect(out).toMatchObject({ player: 0, total: 15, minimum: 12, assisted: false, boards: [4, 5, 6], previous: null, improved: false, earned: ['finish'] });
    expect(course.run).toBe(null);
    expect(course.players[0]).toMatchObject({ runs: 1, clean: 15, assisted: null, badges: ['finish'] });
    expect(course.players[0].recent).toEqual([{ slides: 15, assisted: false, at: 1000 }]);
    expect(finishRun(course, spec, 7)).toBe(null);
    expect(course.players[0].runs).toBe(1);
  });

  it('refuses a stale token, or a run with ponds left to play', () => {
    const course = courseDefaults(spec);
    startRun(course, 0, 5);
    noteProgress(course, spec, 5, { slides: [3, 4], attempts: 2, assisted: false });
    expect(finishRun(course, spec, 5)).toBe(null);
    expect(course.run?.slides).toEqual([3, 4]);
    noteProgress(course, spec, 5, { slides: [3, 4, 5], attempts: 0, assisted: false });
    expect(finishRun(course, spec, 6)).toBe(null);
    expect(noteProgress(course, spec, 6, { slides: [1, 1, 1], attempts: 0, assisted: true })).toBe(false);
    expect(course.run?.slides).toEqual([3, 4, 5]);
    expect(finishRun(course, spec, 5)?.total).toBe(12);
  });

  it('keeps helped and unhelped bests apart, and calls only a beaten best an improvement', () => {
    const course = courseDefaults(spec);
    expect(play(course, 1, [8, 8, 8], 1, { assisted: true })).toMatchObject({ assisted: true, previous: null, improved: false });
    expect(course.players[1]).toMatchObject({ clean: null, assisted: 24 });
    expect(play(course, 1, [5, 5, 5], 2)).toMatchObject({ assisted: false, previous: null, improved: false });
    expect(course.players[1]).toMatchObject({ clean: 15, assisted: 24 });
    expect(play(course, 1, [4, 5, 5], 3)).toMatchObject({ previous: 15, improved: true });
    expect(play(course, 1, [6, 6, 6], 4)).toMatchObject({ previous: 14, improved: false });
    expect(course.players[1]).toMatchObject({ clean: 14, assisted: 24, runs: 4 });
  });

  it('never forgets help once a hint was shown, even if later reports say otherwise', () => {
    const course = courseDefaults(spec);
    startRun(course, 0, 9);
    noteProgress(course, spec, 9, { slides: [3], attempts: 0, assisted: true });
    noteProgress(course, spec, 9, { slides: [3, 4], attempts: 1, assisted: false });
    expect(course.run).toMatchObject({ assisted: true, slides: [3, 4], attempts: 1 });
  });

  it('awards the finish badge once and the perfect badge only for the minimum without a hint', () => {
    const course = courseDefaults(spec);
    expect(play(course, 0, [4, 4, 4], 1, { assisted: true })!.earned).toEqual(['finish']);
    expect(play(course, 0, [4, 4, 4], 2, { assisted: true })!.earned).toEqual([]);
    // The minimum with help is not a perfect route.
    expect(play(course, 0, [4, 4, 4], 3, { assisted: true })!.earned).toEqual([]);
    expect(course.players[0].badges).toEqual(['finish']);
    expect(play(course, 0, [4, 4, 4], 4)!.earned).toEqual(['minimum']);
    expect(play(course, 0, [4, 4, 4], 5)!.earned).toEqual([]);
    expect(course.players[0].badges).toEqual([...BADGES]);
    // The other player has earned nothing.
    expect(course.players[1].badges).toEqual([]);
    expect(course.players[1].runs).toBe(0);
  });

  it('keeps the ten newest runs, newest first', () => {
    const course = courseDefaults(spec);
    for (let i = 0; i < 14; i++) play(course, 0, [4, 4, 5 + i], 100 + i, { now: 5000 + i });
    expect(course.players[0].recent).toHaveLength(10);
    expect(course.players[0].recent[0]).toMatchObject({ slides: 13 + 13, at: 5013 });
    expect(course.players[0].recent.at(-1)!.at).toBe(5004);
    expect(course.players[0].runs).toBe(14);
  });
});

describe('course saves', () => {
  it('survives a reload byte for byte, with a run in progress and records for both players', () => {
    const course = courseDefaults(spec);
    play(course, 0, [4, 5, 6], 1, { now: 10 });
    play(course, 1, [4, 4, 5], 2, { assisted: true, now: 20 });
    startRun(course, 1, 3);
    noteProgress(course, spec, 3, { slides: [5, 6], attempts: 3, assisted: true });
    expect(repairCourse(reload(course), spec)).toEqual(course);
    expect(JSON.stringify(repairCourse(reload(course), spec))).toBe(JSON.stringify(course));
  });

  it('repairs damaged data inside its limits', () => {
    const out = repairCourse({
      version: 1,
      run: { player: 1, token: 'x', slides: [3, -4, 'q', 5, 6, 7, 8], attempts: -3, assisted: 'yes' },
      players: [{ runs: -1, clean: 0, assisted: 'fast', recent: Array(30).fill({ slides: 9, assisted: 1, at: -5 }), badges: ['finish', 'nonsense', 'finish'] }, 'junk'],
      retired: 'no',
    }, spec);
    expect(out.run).toEqual({ player: 1, token: 1, slides: [3], attempts: 0, assisted: false });
    expect(out.players[0]).toEqual({ runs: 0, clean: null, assisted: null, recent: Array(10).fill({ slides: 9, assisted: false, at: 0 }), badges: ['finish'] });
    expect(out.players[1]).toEqual({ runs: 0, clean: null, assisted: null, recent: [], badges: [] });
    expect(out.retired).toEqual([]);
    expect(repairCourse({ run: { player: 2 } }, spec).run).toBe(null);
    expect(repairCourse(null, spec)).toEqual(courseDefaults(spec));
  });

  it('keeps records from an older version of the course apart and drops the run on the old boards', () => {
    const old = courseDefaults({ ...spec, version: 1 });
    play(old, 0, [4, 5, 6], 1);
    startRun(old, 1, 2);
    const now = repairCourse(reload(old), { ...spec, version: 2 });
    expect(now.version).toBe(2);
    expect(now.run).toBe(null);
    expect(now.players).toEqual(courseDefaults({ ...spec, version: 2 }).players);
    expect(now.retired).toHaveLength(1);
    expect(now.retired[0]).toMatchObject({ version: 1 });
    expect(now.retired[0].players[0]).toMatchObject({ clean: 15, runs: 1 });
    // A third and a fourth version keep at most three old records, newest first.
    let c = now;
    for (const version of [3, 4, 5]) { play(c, 0, [4, 4, 4], version, {}); c = repairCourse(reload(c), { ...spec, version }); }
    expect(c.retired.length).toBeLessThanOrEqual(3);
    expect(c.retired[0].version).toBe(4);
    // Unused versions with no finished run leave nothing behind.
    expect(repairCourse(reload(courseDefaults(spec)), { ...spec, version: 9 }).retired).toEqual([]);
  });
});

describe('courses in the couch save', () => {
  const real = courseSpec('ponds');

  it('knows the real course', () => {
    expect(real).toMatchObject({ id: 'ponds', game: 'penguin-slide', version: 1, boards: 5, minimum: 30 });
  });

  it('settles a run once into records and a single couch sticker', () => {
    const save: CouchSave = couchDefaults();
    const course = courseOf(save, real);
    startRun(course, 0, 77);
    noteProgress(course, real, 77, { slides: [3, 5, 6, 7, 9], attempts: 0, assisted: false });
    const out = completeCourse(save, real, 77, 123)!;
    expect(out).toMatchObject({ total: 30, earned: ['finish', 'minimum'] });
    expect(save.stickers['penguin-slide']).toEqual({ count: 1, seed: 77 });
    expect(completeCourse(save, real, 77, 124)).toBe(null);
    expect(save.stickers['penguin-slide']!.count).toBe(1);
    expect(courseOf(save, real)).toBe(course);
  });

  it('survives a reload and a version 2 save, and drops courses it does not know', () => {
    const save = couchDefaults();
    const course = courseOf(save, real);
    startRun(course, 1, 5);
    noteProgress(course, real, 5, { slides: [3, 5], attempts: 4, assisted: true });
    expect(repairCouch(reload(save))).toEqual(save);
    expect(JSON.stringify(repairCouch(reload(save)))).toBe(JSON.stringify(save));
    expect(repairCouch({ version: 2, trips: 0, stickers: {}, party: null, seen: [] }).courses).toEqual({});
    expect(repairCouch({ ...reload(save), courses: { ...save.courses, mystery: { version: 1 } } }).courses).toEqual(save.courses);
  });
});
