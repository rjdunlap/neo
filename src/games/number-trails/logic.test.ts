import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import { firstLevel, landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  ARRANGEMENTS,
  ENTRY_LEVELS,
  FIRST_NUMBERS,
  LEVELS,
  MAX_THINGS,
  PLANS,
  SPARE,
  arrangedSpots,
  askLayout,
  cardHintDue,
  cardsFor,
  CARD_H,
  CARD_W,
  GUIDE_CLEAR,
  REVERSED_OFTEN,
  spotsFor,
  THINGS,
  THING_GAP,
  THING_HIT,
  groupSize,
  guidesFor,
  hintCounts,
  numeralFor,
  planFor,
  roundFor,
  stickerDigit,
  thingFor,
  thingSpots,
  thingWord,
  trailTolerance,
} from './logic';
import {
  GUIDES,
  LOOKS,
  guideDots,
  guideShown,
  hintDue,
  pickLook,
  showTheWay,
  tuneStep,
} from '../../learning/tracing/feedback';
import { sampleStroke } from '../../learning/tracing/strokes';
import { DIGITS } from './digits';

describe('number trails levels', () => {
  it('describes every level and clamps the ones outside the ladder', () => {
    expect(PLANS.every((p) => p.name.length > 10)).toBe(true);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });
  it('ends each band inside the ladder and opens pre-K at the bigger numbers', () => {
    expect(rangeFor(LEVELS, 'preschool')).toEqual({ min: 1, max: 4, order: [4, 1, 2] });
    expect(rangeFor(LEVELS, 'prek')).toEqual({ min: 2, max: 6, order: [2, 3, 5, 6] });
    for (const band of ['preschool', 'prek'] as const)
      expect(rangeFor(LEVELS, band).max).toBeLessThanOrEqual(PLANS.length);
  });
  it('draws only 1 to 5 at level 1 and all of 0 to 9 above it', () => {
    const rng = new Rng(7);
    const first = new Set(Array.from({ length: 200 }, () => numeralFor(1, rng)));
    expect([...first].sort()).toEqual([1, 2, 3, 4, 5]);
    const second = new Set(Array.from({ length: 400 }, () => numeralFor(2, rng)));
    expect(second.size).toBe(10);
    expect(second.has(0)).toBe(true);
  });
  it('is the same round for the same seed, and every thing has a plural', () => {
    expect(numeralFor(2, new Rng(3))).toBe(numeralFor(2, new Rng(3)));
    expect(thingFor(new Rng(3))).toBe(thingFor(new Rng(3)));
    expect(THINGS.every((t) => t.plural.endsWith('s'))).toBe(true);
    expect(THINGS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(THINGS.map((t) => t.id)).size).toBe(THINGS.length);
  });
});

describe('level 4, First numbers', () => {
  it('draws only 1, 2, 3 and 7, each a single stroke, and every one of them', () => {
    expect([...FIRST_NUMBERS]).toEqual([1, 2, 3, 7]);
    for (const n of FIRST_NUMBERS) expect(DIGITS[n]).toHaveLength(1);
    const rng = new Rng(11);
    const drawn = new Set(Array.from({ length: 300 }, () => numeralFor(4, rng)));
    expect([...drawn].sort()).toEqual([1, 2, 3, 7]);
  });
  it('lets the things appear by themselves, with the wide trail of level 1', () => {
    expect(planFor(4).wakeThem).toBe(false);
    expect(trailTolerance(4)).toBe(trailTolerance(1));
    expect(trailTolerance(4)).toBeGreaterThan(trailTolerance(2));
  });
  it("opens preschool, steps up to 1 then 2, and lands a saved 4 on pre-K's first level", () => {
    const pre = rangeFor(LEVELS, 'preschool'),
      prek = rangeFor(LEVELS, 'prek');
    expect(levelsInOrder(pre)).toEqual([4, 1, 2]);
    expect(firstLevel(pre, ENTRY_LEVELS)).toBe(4);
    expect(stepLevel(4, 1, pre)).toBe(1);
    expect(stepLevel(1, -1, pre)).toBe(4);
    expect(stepLevel(2, 1, pre)).toBe(2);
    expect(landing(4, prek, ENTRY_LEVELS)).toBe(2);
    expect(landing(4, pre, ENTRY_LEVELS)).toBe(4);
  });
  it('keeps levels 1 to 3 the same for a seed', () => {
    expect(planFor(1).digits).toEqual([1, 2, 3, 4, 5]);
    expect(planFor(2).digits).toHaveLength(10);
    expect(planFor(3).wakeThem).toBe(true);
    expect(trailTolerance(1)).toBe(0.1);
    expect(trailTolerance(3)).toBe(0.085);
  });
});

describe('level 5, Write how many', () => {
  it('is a pre-K level after 3 that draws 0 to 9 and asks before the trace', () => {
    const prek = rangeFor(LEVELS, 'prek'),
      pre = rangeFor(LEVELS, 'preschool');
    expect(levelsInOrder(prek)).toEqual([2, 3, 5, 6]);
    expect(stepLevel(3, 1, prek)).toBe(5);
    expect(stepLevel(5, -1, prek)).toBe(3);
    expect(levelsInOrder(pre)).not.toContain(5);
    expect(planFor(5).writeHowMany).toBe(true);
    expect(planFor(5).wakeThem).toBe(false);
    expect(planFor(5).digits).toHaveLength(10);
    expect([1, 2, 3, 4].some((l) => planFor(l).writeHowMany)).toBe(false);
  });
  it("still lands a saved 4 on pre-K's first level now that 4 sits inside pre-K's span", () => {
    expect(landing(4, rangeFor(LEVELS, 'prek'), ENTRY_LEVELS)).toBe(2);
    expect(landing(5, rangeFor(LEVELS, 'prek'), ENTRY_LEVELS)).toBe(5);
  });
  it('puts the count among three distinct cards exactly once, with a neighbour, all 0 to 9', () => {
    const rng = new Rng(21);
    const places = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const n = i % 10,
        cards = cardsFor(n, rng);
      expect(cards).toHaveLength(3);
      expect(new Set(cards).size).toBe(3);
      expect(cards.filter((c) => c === n)).toHaveLength(1);
      expect(cards.every((c) => Number.isInteger(c) && c >= 0 && c <= 9)).toBe(true);
      expect(cards.some((c) => Math.abs(c - n) === 1)).toBe(true);
      expect(cards.some((c) => c !== n && (REVERSED_OFTEN as readonly number[]).includes(c))).toBe(true);
      places.add(cards.indexOf(n));
    }
    expect(places.size).toBe(3);
  });
  it('keeps the round the same for a seed when the cards are drawn after it', () => {
    const a = new Rng(5),
      b = new Rng(5);
    const round = roundFor(5, a);
    cardsFor(round.n, a);
    expect(roundFor(5, b)).toEqual(round);
  });
  it('glows the right card at the second wrong one, once', () => {
    expect([1, 2, 3, 4].map(cardHintDue)).toEqual([false, true, false, false]);
  });
  it('lays out every group of 0 to 9 above three cards that are big, apart, inside the view and clear of the guide', () => {
    const views = [
      [1024, 768],
      [768, 1024],
      [1366, 1024],
      [1180, 820],
      [1662, 768],
    ];
    expect(Math.min(CARD_W, CARD_H)).toBeGreaterThanOrEqual(100);
    for (const [w, h] of views) {
      const { things, cards } = askLayout({ w, h });
      for (const [i, c] of cards.entries()) {
        expect(c.x - CARD_W / 2).toBeGreaterThanOrEqual(GUIDE_CLEAR);
        expect(c.x + CARD_W / 2).toBeLessThanOrEqual(w);
        expect(c.y + CARD_H / 2).toBeLessThanOrEqual(h);
        expect(c.y - CARD_H / 2).toBeGreaterThanOrEqual(things.y + things.h);
        for (const d of cards.slice(i + 1)) expect(Math.abs(d.x - c.x)).toBeGreaterThanOrEqual(CARD_W + 20);
      }
      for (let count = 0; count <= 9; count++)
        for (const arrangement of ARRANGEMENTS) {
          const spots = spotsFor(arrangement, count, things);
          expect(spots, `${count} in ${arrangement} at ${w}x${h}`).not.toBeNull();
          for (const s of spots!) {
            expect(s.x - THING_HIT).toBeGreaterThanOrEqual(things.x - 1e-9);
            expect(s.y + THING_HIT).toBeLessThanOrEqual(things.y + things.h + 1e-9);
          }
        }
    }
  });
});

describe('how many things wait', () => {
  it('shows exactly the numeral when they appear by themselves, and none for zero', () => {
    for (let n = 0; n <= 9; n++) expect(groupSize(n, false)).toBe(n);
  });
  it('waits with more than she needs when she wakes them herself, so stopping is a choice', () => {
    for (let n = 1; n <= 9; n++) {
      expect(groupSize(n, true)).toBeGreaterThan(n);
      expect(groupSize(n, true)).toBeLessThanOrEqual(MAX_THINGS);
    }
    expect(groupSize(0, true)).toBe(0);
    expect(groupSize(4, true)).toBe(4 + SPARE);
  });
  it('lets a waking round reach exactly the numeral from every group, with sleepers left over', () => {
    for (let n = 1; n <= 9; n++) expect(groupSize(n, true) - n).toBeGreaterThanOrEqual(1);
  });
  it('says one thing in the singular and every other count in the plural', () => {
    for (const thing of THINGS) {
      expect(thingWord(thing, 1)).toBe(thing.one);
      for (const n of [0, 2, 3, 9]) expect(thingWord(thing, n)).toBe(thing.plural);
      expect(thing.plural).toBe(`${thing.one}s`);
    }
  });
});

describe('where things sit', () => {
  const views = [
    [1024, 768],
    [768, 1024],
    [1366, 1024],
    [1024, 1366],
    [1180, 820],
  ];
  it('puts every group inside the room with every circle at least 100 units across and none touching', () => {
    expect(THING_HIT * 2).toBeGreaterThanOrEqual(100);
    for (const [w, h] of views)
      for (let count = 0; count <= MAX_THINGS; count++) {
        const rect = { x: 150, y: 140, w: w - 190, h: h - 190 };
        const spots = thingSpots(count, rect);
        expect(spots, `${count} things in ${w}x${h}`).not.toBeNull();
        expect(spots!.length).toBe(count);
        for (const [i, a] of spots!.entries()) {
          expect(a.x - THING_HIT).toBeGreaterThanOrEqual(rect.x - 1e-9);
          expect(a.x + THING_HIT).toBeLessThanOrEqual(rect.x + rect.w + 1e-9);
          expect(a.y - THING_HIT).toBeGreaterThanOrEqual(rect.y - 1e-9);
          expect(a.y + THING_HIT).toBeLessThanOrEqual(rect.y + rect.h + 1e-9);
          for (const b of spots!.slice(i + 1))
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(THING_GAP - 1e-9);
        }
      }
  });
  const inside = (
    spots: { x: number; y: number }[],
    rect: { x: number; y: number; w: number; h: number },
  ) => {
    for (const [i, a] of spots.entries()) {
      expect(a.x - THING_HIT).toBeGreaterThanOrEqual(rect.x - 1e-9);
      expect(a.x + THING_HIT).toBeLessThanOrEqual(rect.x + rect.w + 1e-9);
      expect(a.y - THING_HIT).toBeGreaterThanOrEqual(rect.y - 1e-9);
      expect(a.y + THING_HIT).toBeLessThanOrEqual(rect.y + rect.h + 1e-9);
      for (const b of spots.slice(i + 1))
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(THING_GAP - 1e-9);
    }
  };
  it('keeps every arrangement inside the room with 128-unit gaps at every view, falling back to rows, never null', () => {
    for (const [w, h] of views)
      for (const arrangement of ARRANGEMENTS)
        for (let count = 0; count <= MAX_THINGS; count++) {
          const rect = { x: 150, y: 140, w: w - 190, h: h - 190 };
          const own = arrangedSpots(arrangement, count, rect);
          if (own) {
            expect(own.length).toBe(count);
            inside(own, rect);
          }
          const spots = spotsFor(arrangement, count, rect);
          expect(spots, `${arrangement} of ${count} in ${w}x${h}`).not.toBeNull();
          expect(spots!.length).toBe(count);
          inside(spots!, rect);
        }
  });
  it('really shows each arrangement for the counts it suits, in the smallest room', () => {
    const small = { x: 150, y: 140, w: 1024 - 190, h: 768 - 190 },
      upright = { x: 150, y: 140, w: 768 - 190, h: 1024 - 190 };
    for (const rect of [small, upright]) {
      for (let count = 3; count <= 11; count++) expect(arrangedSpots('ring', count, rect)).not.toBeNull();
      for (let count = 2; count <= MAX_THINGS; count++)
        expect(arrangedSpots('pairs', count, rect)).not.toBeNull();
      for (let count = 4; count <= 8; count++) expect(arrangedSpots('twoRows', count, rect)).not.toBeNull();
    }
    expect(arrangedSpots('ring', 2, small)).toBeNull();
    expect(arrangedSpots('ring', 12, small)).toBeNull();
    expect(arrangedSpots('twoRows', 12, upright)).toBeNull();
    const twoRows = arrangedSpots('twoRows', 7, small)!;
    expect(new Set(twoRows.map((s) => s.y)).size).toBe(2);
  });
  it('counts a ring clockwise from the top and pairs two by two, an odd one alone', () => {
    const rect = { x: 150, y: 140, w: 834, h: 578 };
    const ring = arrangedSpots('ring', 9, rect)!;
    expect(ring[0].y).toBeLessThan(Math.min(...ring.slice(1).map((s) => s.y)));
    expect(ring[1].x).toBeGreaterThan(ring[0].x);
    const pairs = arrangedSpots('pairs', 5, rect)!;
    expect(pairs[0].y).toBe(pairs[1].y);
    expect(pairs[1].x - pairs[0].x).toBeCloseTo(THING_GAP);
    expect(pairs[2].y).toBeGreaterThan(pairs[0].y);
    expect(pairs[4].x).toBe(pairs[0].x);
    expect(pairs.filter((s) => s.y === pairs[4].y)).toHaveLength(1);
  });
  it('says so rather than shrinking a target when the room is too small', () => {
    expect(thingSpots(9, { x: 0, y: 0, w: 600, h: 130 })).toBeNull();
  });
  it('draws a sticker numeral for any seed', () => {
    for (const seed of [0, 1, 9, 10, 12345, -7]) expect(stickerDigit(seed)).toBeGreaterThanOrEqual(0);
    expect(stickerDigit(23)).toBe(3);
  });
});

describe('number trails hint, looks and tune', () => {
  it('draws the look after the numeral and the thing, and the arrangement last, so a seed keeps its round', () => {
    for (let seed = 1; seed <= 200; seed++)
      for (const level of [1, 2, 3]) {
        const a = new Rng(seed),
          round = roundFor(level, a);
        const b = new Rng(seed);
        expect(round.n).toBe(numeralFor(level, b));
        expect(round.thing).toBe(thingFor(b));
        expect(round.look).toBe(pickLook(b));
        expect(ARRANGEMENTS).toContain(round.arrangement);
      }
    const looks = new Set(Array.from({ length: 200 }, (_, i) => roundFor(2, new Rng(i + 1)).look));
    expect(looks.size).toBe(LOOKS.length);
  });
  it('counts the hint at the second wander on a stroke, once', () => {
    expect([1, 2, 3, 4].map(hintDue)).toEqual([false, true, false, false]);
  });
  it('flies the shown stretch forward along every numeral stroke, from where she is, never past its end', () => {
    for (const strokes of Object.values(DIGITS))
      for (const stroke of strokes) {
        const points = sampleStroke(stroke);
        for (let progress = 0; progress < points.length - 1; progress++) {
          const shown = showTheWay(points, progress);
          expect(shown[0]).toBe(points[progress]);
          expect(shown.length).toBeGreaterThan(1);
          expect(points.indexOf(shown[shown.length - 1])).toBeGreaterThan(progress);
          expect(points.indexOf(shown[shown.length - 1])).toBeLessThan(points.length);
        }
      }
  });
  it('climbs the tune one pentatonic step a fifth of the way, from the first note to the top at the end', () => {
    for (const strokes of Object.values(DIGITS))
      for (const stroke of strokes) {
        const n = sampleStroke(stroke).length;
        const steps = Array.from({ length: n }, (_, i) => tuneStep(i, n));
        expect(steps[0]).toBe(0);
        expect(steps[n - 1]).toBe(4);
        steps.slice(1).forEach((s, i) => expect(s - steps[i]).toBeGreaterThanOrEqual(0));
        expect(new Set(steps).size).toBe(5);
      }
  });
});

describe('level 6, Less help each time', () => {
  it("is pre-K's last level, after 5, drawing 0 to 9 with the usual trail and things that appear by themselves", () => {
    const plan = planFor(6);
    expect(plan.fading).toBe(true);
    expect(plan.wakeThem).toBe(false);
    expect(plan.writeHowMany).toBeUndefined();
    expect(plan.tolerance).toBe(trailTolerance(2));
    const prek = rangeFor(LEVELS, 'prek');
    expect(levelsInOrder(prek)).toEqual([2, 3, 5, 6]);
    expect(stepLevel(5, 1, prek)).toBe(6);
    expect(stepLevel(6, 1, prek)).toBe(6);
    expect(stepLevel(6, -1, prek)).toBe(5);
    const rng = new Rng(11);
    expect(new Set(Array.from({ length: 400 }, () => numeralFor(6, rng))).size).toBe(10);
  });
  it('traces one numeral three times, solid then dotted then only the start, and once on every other level', () => {
    expect(guidesFor(6)).toEqual(['solid', 'dotted', 'start']);
    expect(guidesFor(6)).toBe(GUIDES);
    for (const level of [1, 2, 3, 4, 5]) expect(guidesFor(level)).toEqual(['solid']);
  });
  it('keeps levels 1 to 5 the same round for a seed, and level 6 the round level 2 would draw', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(roundFor(6, new Rng(seed))).toEqual(roundFor(2, new Rng(seed)));
      for (const level of [1, 2, 3, 4, 5]) expect(planFor(level).fading).toBeUndefined();
    }
  });
  it('brings the solid trail back for a stroke once she wanders on it, and only then', () => {
    for (const guide of GUIDES) {
      expect(guideShown(guide, 0)).toBe(guide);
      for (const wanders of [1, 2, 5]) expect(guideShown(guide, wanders)).toBe('solid');
    }
  });
  it('dots every numeral stroke from its start to its end, closer together than the trail is wide', () => {
    for (const strokes of Object.values(DIGITS))
      for (const stroke of strokes) {
        const points = sampleStroke(stroke),
          dots = guideDots(points);
        expect(dots[0]).toBe(points[0]);
        expect(dots[dots.length - 1]).toBe(points[points.length - 1]);
        expect(dots.length).toBeLessThan(points.length);
        dots
          .slice(1)
          .forEach((d, i) =>
            expect(Math.hypot(d[0] - dots[i][0], d[1] - dots[i][1])).toBeLessThanOrEqual(
              2 * trailTolerance(6),
            ),
          );
      }
  });
  it('counts at most one hint a try on a fading round, and one a stroke as before below it', () => {
    // Second wander on a stroke, nothing counted yet on this try: one hint.
    expect(hintCounts(6, 2, 0)).toBe(true);
    // The second stroke of a 4, 5 or 9 on the same try: the firefly still shows the way (hintDue), but it is not counted.
    expect(hintCounts(6, 2, 1)).toBe(false);
    expect(hintDue(2)).toBe(true);
    expect([1, 3, 4].some((wrong) => hintCounts(6, wrong, 0))).toBe(false);
    for (const level of [1, 2, 3, 4, 5]) {
      expect(hintCounts(level, 2, 0)).toBe(true);
      expect(hintCounts(level, 2, 1)).toBe(true);
      expect(hintCounts(level, 1, 0)).toBe(false);
    }
  });
});
