import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../content/voice-script';
import { couchGameById as gameById } from '../games/registry';
import { COUCH_INFO } from './catalog';
import { courseSpec } from './course';
import { COURSE_IDS, countOf, courseInfo, isCourseId } from './courses';
import { COUCH_IDS } from './party';

describe('the couch courses', () => {
  it('describes every course the same way', () => {
    expect(COURSE_IDS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(COURSE_IDS).size).toBe(COURSE_IDS.length);
    for (const id of COURSE_IDS) {
      const info = courseInfo(id);
      expect(info.id).toBe(id);
      expect(COUCH_IDS).toContain(info.game);
      expect(info.version).toBeGreaterThanOrEqual(1);
      expect(info.best.length).toBeGreaterThanOrEqual(2);
      expect(info.best.every(n => Number.isInteger(n) && n >= 1)).toBe(true);
      expect(info.minimum).toBe(info.best.reduce((a, b) => a + b, 0));
      expect(info.name.length).toBeGreaterThan(3);
      expect(info.part).toMatch(/^[a-z]+$/);
      expect(info.unit).toMatch(/^[a-z]+$/);
      expect(Object.keys(SCRIPT)).toContain(info.done);
      for (const badge of [info.badges.finish, info.badges.minimum]) expect(badge.title.length > 3 && badge.how.length > 10).toBe(true);
      expect(info.badges.finish.title).not.toBe(info.badges.minimum.title);
    }
  });

  it('builds the rules spec from the same numbers, so records and screens agree', () => {
    for (const id of COURSE_IDS) {
      const info = courseInfo(id), spec = courseSpec(id);
      expect(spec).toEqual({ id, game: info.game, version: info.version, boards: info.best.length, minimum: info.minimum });
    }
    expect(courseSpec('ponds')).toMatchObject({ game: 'penguin-slide', boards: 5, minimum: 30 });
    expect(courseSpec('practice')).toMatchObject({ game: 'penguin-slide', boards: 5, minimum: 18 });
    expect(courseSpec('clouds')).toMatchObject({ game: 'bouncy-launch', boards: 12, minimum: 12 });
    expect(courseSpec('beds')).toMatchObject({ game: 'sudoku-garden', boards: 6, minimum: 124 });
    expect(courseSpec('bigbeds')).toMatchObject({ game: 'sudoku-garden', boards: 3, minimum: 149 });
    expect(courseSpec('lanterns')).toMatchObject({ game: 'lantern-lights', boards: 5, minimum: 36 });
    expect(courseSpec('pictures')).toMatchObject({ game: 'picture-logic', boards: 3, minimum: 182 });
    expect(courseSpec('bigpictures')).toMatchObject({ game: 'picture-logic', boards: 2, minimum: 230 });
  });

  it("is played by a game that is on the couch, at a level its band really has", () => {
    for (const id of COURSE_IDS) {
      const info = courseInfo(id), mod = gameById(info.game)!, band = COUCH_INFO[info.game].band;
      expect(mod.bands).toContain(band);
      const range = mod.levels(band);
      expect(info.level).toBeGreaterThanOrEqual(range.min);
      expect(info.level).toBeLessThanOrEqual(range.max);
    }
  });

  it('knows its ids and counts in the right unit', () => {
    expect(isCourseId('ponds')).toBe(true);
    expect(isCourseId('practice')).toBe(true);
    expect(isCourseId('clouds')).toBe(true);
    expect(isCourseId('nope')).toBe(false);
    expect(isCourseId(undefined)).toBe(false);
    expect(countOf(courseInfo('ponds'), 1)).toBe('1 slide');
    expect(countOf(courseInfo('ponds'), 12)).toBe('12 slides');
    expect(countOf(courseInfo('clouds'), 1)).toBe('1 launch');
    expect(countOf(courseInfo('clouds'), 3)).toBe('3 launches');
    expect(countOf(courseInfo('beds'), 1)).toBe('1 entry');
    expect(countOf(courseInfo('beds'), 130)).toBe('130 entries');
    expect(isCourseId('bigbeds')).toBe(true);
    expect(isCourseId('lanterns')).toBe(true);
    expect(countOf(courseInfo('lanterns'), 1)).toBe('1 press');
    expect(countOf(courseInfo('lanterns'), 36)).toBe('36 presses');
    expect(countOf(courseInfo('pictures'), 1)).toBe('1 fill');
    expect(countOf(courseInfo('pictures'), 182)).toBe('182 fills');
  });
});
