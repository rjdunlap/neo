import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { hintPanels } from './daylight';
import { daylightLayout } from './layout';
import { DAYLIGHT_BARS, DAYLIGHT_SCALE, daylightTrue, makeDaylight } from './logic';

describe('Daylight records evidence', () => {
  it('is repeatable, on the toy scale, and every question has exactly one true summary', () => {
    const slots = [0, 0];
    let longerA = 0,
      longerB = 0,
      same = 0,
      different = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeDaylight(new Rng(seed));
      expect(round).toEqual(makeDaylight(new Rng(seed)));
      expect(round.questions).toHaveLength(2);
      for (const q of round.questions) {
        expect(q.records).toHaveLength(2);
        for (const r of q.records) {
          expect(r).toHaveLength(DAYLIGHT_BARS);
          expect(Object.isFrozen(r)).toBe(true);
          for (const v of r) {
            expect(Number.isInteger(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(DAYLIGHT_SCALE);
          }
        }
        expect(q.choices).toHaveLength(2);
        const truths = q.choices.map((s) => daylightTrue(q.records, s));
        expect(truths.filter(Boolean)).toHaveLength(1);
        slots[truths.indexOf(true)]++;
      }
      const [first, second] = round.questions;
      const [a, b] = first.records;
      // The first comparison is never a close call: one record is longer on every aligned bar, by at least two.
      const gaps = a.map((v, i) => v - b[i]);
      expect(gaps.every((g) => g >= 2) || gaps.every((g) => g <= -2)).toBe(true);
      if (gaps[0] > 0) longerA++;
      else longerB++;
      const [c, d] = second.records;
      if (c.every((v, i) => v === d[i])) same++;
      else {
        different++;
        // When the second pair differs, the other side is the longer one.
        const g = c.map((v, i) => v - d[i]);
        expect(g.every((x) => x * gaps[0] < 0 && Math.abs(x) >= 2)).toBe(true);
      }
    }
    for (const n of [longerA, longerB, same, different]) expect(n).toBeGreaterThan(100);
    for (const n of slots) expect(n).toBeGreaterThan(230);
  });
  it('reads relations from the actual bars, and never calls a mixed pair longer', () => {
    const mixed = [
      [5, 3, 5, 3, 5],
      [3, 5, 3, 5, 3],
    ];
    expect(daylightTrue(mixed, 'a-longer')).toBe(false);
    expect(daylightTrue(mixed, 'b-longer')).toBe(false);
    expect(daylightTrue(mixed, 'different')).toBe(true);
    expect(daylightTrue([mixed[0], mixed[0]], 'same')).toBe(true);
    expect(daylightTrue([mixed[0], mixed[0]], 'different')).toBe(false);
  });
  it('glows the longer record for a longer question and both for a same or different one', () => {
    const q = (records: number[][]) => ({ records, choices: [] as never[] });
    expect(
      hintPanels(
        q([
          [5, 5, 5, 5, 5],
          [2, 2, 2, 2, 2],
        ]),
      ),
    ).toEqual([0]);
    expect(
      hintPanels(
        q([
          [2, 2, 2, 2, 2],
          [5, 5, 5, 5, 5],
        ]),
      ),
    ).toEqual([1]);
    expect(
      hintPanels(
        q([
          [3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3],
        ]),
      ),
    ).toEqual([0, 1]);
  });
  it('keeps the records and controls full size, separate, on screen and clear of the corner guide', () => {
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [844, 390],
      [750, 369],
      [390, 844],
    ]) {
      const v = computeView(w, h, undefined, h > w),
        l = daylightLayout(v);
      const boxes = [
        ...l.panels.map((p) => ({ ...p, ...l.panel })),
        ...l.choices.map((p) => ({ ...p, w: 290, h: 140 })),
        { ...l.confirm, w: 120, h: 100 },
        { ...l.replay, w: 110, h: 100 },
      ];
      for (const [i, a] of boxes.entries()) {
        expect(a.w).toBeGreaterThanOrEqual(100);
        expect(a.h).toBeGreaterThanOrEqual(100);
        expect(a.x - a.w / 2).toBeGreaterThanOrEqual(100 - (v.upright ? 100 : 0));
        expect(a.x + a.w / 2).toBeLessThanOrEqual(v.w);
        expect(a.y - a.h / 2).toBeGreaterThan(100);
        expect(a.y + a.h / 2).toBeLessThan(v.h);
        for (const b of boxes.slice(i + 1))
          expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
      }
    }
  });
});
