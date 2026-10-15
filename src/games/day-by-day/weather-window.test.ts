import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { makeWindow, summaryTrue, toggleMark, weatherCount, windowLayout } from './logic';

describe('Weather Window evidence', () => {
  it('supplies two repeatable immutable seven-day records and two uniquely true comparisons', () => {
    const more = [0, 0], ties = [0, 0], slots = [0, 0];
    let introductory = false, empty = false;
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeWindow(new Rng(seed));
      expect(round).toEqual(makeWindow(new Rng(seed)));
      expect(round.weeks).toHaveLength(2);
      expect(round.questions).toHaveLength(2);
      for (const week of round.weeks) {
        expect(week).toHaveLength(7);
        expect(week.every(w => [0, 1, 2].includes(w))).toBe(true);
        expect(Object.isFrozen(week)).toBe(true);
        const before = [...week];
        let marks: number[] = [];
        for (let day = 0; day < 7; day++) marks = toggleMark(marks, day, 7);
        expect(marks).toHaveLength(7); // all observations remain inspectable, even irrelevant ones
        expect(week).toEqual(before);
      }
      for (const q of round.questions) {
        expect(q.choices).toHaveLength(2);
        expect(new Set(q.choices).size).toBe(2);
        const truths = q.choices.map(s => summaryTrue(round.weeks, q.weather, s));
        expect(truths.filter(Boolean)).toHaveLength(1);
        slots[truths.indexOf(true)]++;
      }
      const rains = round.weeks.map(w => weatherCount(w, 2));
      const suns = round.weeks.map(w => weatherCount(w, 0));
      more[rains[0] > rains[1] ? 0 : 1]++;
      ties[suns[0] === suns[1] ? 0 : 1]++;
      if (rains[0] === 2 && rains[1] === 4 && suns[0] === suns[1]) introductory = true;
      if (suns[0] === 0 && suns[1] === 0) empty = true;
    }
    for (const counts of [more, ties]) for (const count of counts) expect(count).toBeGreaterThan(100);
    for (const count of slots) expect(count).toBeGreaterThan(230);
    expect(introductory).toBe(true);
    expect(empty).toBe(true); // zero = zero is equality, not evidence of missing data
  });
  it('evaluates relations from the actual records, including equality and both directions', () => {
    const weeks = [[2, 2, 0, 0, 1, 1, 1], [2, 2, 2, 2, 0, 0, 1]];
    expect(summaryTrue(weeks, 2, 'b-more')).toBe(true);
    expect(summaryTrue(weeks, 2, 'a-more')).toBe(false);
    expect(summaryTrue([...weeks].reverse(), 2, 'a-more')).toBe(true);
    expect(summaryTrue(weeks, 0, 'equal')).toBe(true);
    expect(summaryTrue(weeks, 0, 'different')).toBe(false);
    expect(summaryTrue(weeks, 1, 'different')).toBe(true);
  });
  it('keeps all full-size controls separate, on screen and clear of the corner guide', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [844, 390], [750, 369]]) {
      const v = computeView(w, h), l = windowLayout(v.w);
      const boxes = [
        ...l.records.map(p => ({ ...p, w: 108, h: 112 })),
        ...l.tabs.map(p => ({ ...p, w: 160, h: 100 })),
        ...l.choices.map(p => ({ ...p, w: 290, h: 140 })),
        { ...l.confirm, w: 120, h: 100 }, { x: v.w / 2 - 350, y: 234, w: 110, h: 100 },
      ];
      for (const [i, a] of boxes.entries()) {
        expect(a.w).toBeGreaterThanOrEqual(100); expect(a.h).toBeGreaterThanOrEqual(100);
        expect(a.x - a.w / 2).toBeGreaterThanOrEqual(100);
        expect(a.x + a.w / 2).toBeLessThanOrEqual(v.w);
        expect(a.y - a.h / 2).toBeGreaterThan(100);
        expect(a.y + a.h / 2).toBeLessThan(v.h);
        expect(a.y + a.h / 2 < v.h - 170 || a.x - a.w / 2 > 220).toBe(true);
        for (const b of boxes.slice(i + 1)) expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
      }
    }
  });
});
