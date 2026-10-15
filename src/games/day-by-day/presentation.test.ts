import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { choicesFor, makeWeek, relativeQuestions, weekLayout } from './logic';
import { gardenTreatment, wrapPath } from './presentation';

it('varies garden treatments repeatably without changing any round questions', () => {
  const seen = new Set<number>();
  for (let seed = 1; seed <= 100; seed++) {
    const rng = new Rng(seed), unchanged = new Rng(seed);
    expect(makeWeek(rng)).toEqual(makeWeek(unchanged));
    expect(relativeQuestions(2, rng)).toEqual(relativeQuestions(2, unchanged));
    const treatment = gardenTreatment(rng);
    expect(gardenTreatment(rng)).toBe(treatment);
    seen.add(treatment);
    for (let day = 0; day < 7; day++) expect(choicesFor(day, rng, 'day')).toEqual(choicesFor(day, unchanged, 'day'));
    expect(choicesFor(3, rng, 'number')).toEqual(choicesFor(3, unchanged, 'number'));
  }
  expect([...seen].sort()).toEqual([0, 1, 2]);
});

it('connects Sunday to Monday below the records and above answer controls in either orientation', () => {
  for (const w of [1024, 1365]) {
    const l = weekLayout(w, 1024), path = wrapPath(w);
    expect(path[0].x).toBe(l.records[6].x);
    expect(path[3].x).toBe(l.records[0].x);
    for (const p of path) {
      expect(p.y).toBeGreaterThan(l.records[0].y + 56);
      expect(p.y).toBeLessThan(l.choices[0].y - 55);
    }
  }
});
