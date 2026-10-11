import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { choicesFor, DAYS, makeWeek, neighbor, sunnyCount, toggleMark, weekLayout } from './logic';

describe('Day by Day', () => {
  it('creates a repeatable seven-day record with all weather categories and varied weeks', () => {
    const weeks = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const week = makeWeek(new Rng(seed));
      expect(week).toEqual(makeWeek(new Rng(seed)));
      expect(week).toHaveLength(DAYS.length);
      expect([...new Set(week)].sort()).toEqual([0, 1, 2]);
      expect(sunnyCount(week)).toBeGreaterThanOrEqual(1);
      expect(sunnyCount(week)).toBeLessThanOrEqual(5);
      weeks.add(week.join(','));
    }
    expect(weeks.size).toBeGreaterThan(70);
  });
  it('wraps the week in both directions and undoes a yesterday with tomorrow', () => {
    expect(neighbor(6, 1)).toBe(0);
    expect(neighbor(0, -1)).toBe(6);
    for (let day = 0; day < 7; day++) expect(neighbor(neighbor(day, -1), 1)).toBe(day);
  });
  it('gives every question one reachable answer among three distinct valid choices', () => {
    for (let seed = 1; seed <= 30; seed++) for (const kind of ['day', 'number'] as const) for (let answer = 0; answer < 7; answer++) {
      const choices = choicesFor(answer, new Rng(seed), kind);
      expect(choices).toHaveLength(3);
      expect(new Set(choices).size).toBe(3);
      expect(choices.filter(n => n === answer)).toHaveLength(1);
      expect(choices.every(n => n >= 0 && n < (kind === 'day' ? 7 : 8))).toBe(true);
    }
  });
  it('lets counting marks be revised without changing records or double counting', () => {
    const marks = [2];
    expect(toggleMark(marks, 2, 7)).toEqual([]);
    expect(toggleMark(marks, 4, 7)).toEqual([2, 4]);
    expect(toggleMark(marks, 7, 7)).toEqual(marks);
    expect(toggleMark(marks, 1, 1)).toEqual(marks);
    expect(toggleMark(marks, -1, 7)).toEqual(marks);
    expect(marks).toEqual([2]);
    expect(sunnyCount([0, 2, 0, 1, 2, 0, 1])).toBe(3);
  });
  it('keeps controls large, separate, on screen and clear of the guide in four views', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [844, 390], [750, 369]]) {
      const v = computeView(w, h); const l = weekLayout(v.w, v.h);
      const boxes = [...l.records.map(p => ({ ...p, w: 108, h: 112 })), ...l.choices.map(p => ({ ...p, w: 170, h: 110 })), { ...l.confirm, w: 120, h: 110 }];
      for (const [i, box] of boxes.entries()) {
        expect(box.x - box.w / 2).toBeGreaterThanOrEqual(100);
        expect(box.x + box.w / 2).toBeLessThanOrEqual(v.w);
        expect(box.y - box.h / 2).toBeGreaterThan(100);
        expect(box.y + box.h / 2).toBeLessThan(v.h - 170);
        for (const b of boxes.slice(i + 1)) expect(Math.abs(b.x - box.x) >= (b.w + box.w) / 2 || Math.abs(b.y - box.y) >= (b.h + box.h) / 2).toBe(true);
      }
    }
  });
});
