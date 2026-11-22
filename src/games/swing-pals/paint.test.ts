import { describe, expect, it } from 'vitest';
import { cleanPicture, PAINTING_MAX_MARKS, PAINTING_MIN_MARKS } from '../../content/creations';
import { computeView, NO_INSETS } from '../../engine/view';
import { HOOKS, period, ropeOf, SETTLE, showsSlower, type PaintRound } from './logic';
import {
  blankTrace,
  changeHook,
  comparedHooks,
  DRIP_MIN,
  dripAt,
  endSection,
  HOOK_MOVE,
  keptPainting,
  PAINT_COLOR,
  paintBack,
  paintHeight,
  paintLayout,
  paintPush,
  paperStep,
  PAPER_SPEED,
  ROLL_SECONDS,
  sections,
  type PaintSwing,
  type Trace,
} from './paint';

const L = paintLayout(computeView(1024, 768));
const upright = paintLayout(computeView(390, 844, NO_INSETS, true));
const stroke = (hook: PaintSwing['hook'], height = 25): PaintSwing => ({ hook, height, start: 0 });

function paintFor(trace: Trace, swing: PaintSwing, from: number, to: number, layout = L) {
  for (let t = from; t < to;) {
    const next = Math.min(to, t + 1 / 60);
    paperStep(trace, layout, swing, t, next);
    t = next;
  }
}

describe('Paint the beat', () => {
  it('has one, one and a half or two seconds per wiggle, independent of height', () => {
    expect(HOOKS.map((hook) => period(hook) * PAPER_SPEED)).toEqual([60, 90, 120]);
    for (const hook of HOOKS)
      for (const height of [8, 25])
        for (const phase of [0, 0.5, 1]) {
          const time = phase * period(hook);
          const swing = stroke(hook, height);
          const reach = ropeOf(L, hook) * Math.sin((paintHeight(swing, time) * Math.PI) / 180);
          expect(dripAt(L, swing, time) - L.columns[0].pivot[hook].x).toBeCloseTo(
            phase === 0.5 ? reach : -reach,
          );
        }
  });

  it('waits at rest, lands the next push at the back and settles independently of frame rate', () => {
    const trace = blankTrace();
    const still = stroke('long', 0);
    paintFor(trace, still, 0, 1);
    expect(trace.seconds).toBe(0);
    const first = paintPush(still, 1);
    expect(first.height).toBe(6.25);
    expect(paintBack(first, 1.2)).toBe(3);
    expect(paintHeight(first, 3)).toBeCloseTo(6.25 * SETTLE);
    expect(paintPush(first, 3).height).toBeGreaterThan(first.height);
    paintFor(trace, first, 1, 29);
    expect(paintHeight(first, 29)).toBeLessThan(DRIP_MIN);
    const rolled = trace.seconds;
    paperStep(trace, L, first, 29, 40);
    expect(trace.seconds).toBe(rolled);
    expect(paintPush(first, 40).height).toBe(6.25);
  });

  it('lifts the pot through a rope change, preserves height and counts whole wiggles on distinct ropes', () => {
    const trace = blankTrace();
    const long = stroke('long');
    paintFor(trace, long, 0, 4);
    expect(changeHook(long, 'long', 4)).toBe(long);
    const next = changeHook(long, 'short', 4);
    endSection(trace);
    expect(next.height).toBe(paintHeight(long, 4));
    expect(next.start).toBe(4 + HOOK_MOVE);
    paintFor(trace, next, 4, next.start);
    expect(trace.seconds).toBeCloseTo(4);
    const round: PaintRound = { kind: 'paint', hook: 'long', friend: 'duck' };
    paintFor(trace, next, next.start, next.start + 1.5);
    expect(showsSlower(round, comparedHooks(trace))).toBe(false);
    paintFor(trace, next, next.start + 1.5, next.start + 2.1);
    expect(sections(trace)).toEqual([
      { hook: 'long', wiggles: 2 },
      { hook: 'short', wiggles: 2 },
    ]);
    expect(showsSlower(round, comparedHooks(trace))).toBe(true);
  });

  it('keeps the same measured position after rotation', () => {
    for (const hook of HOOKS) {
      const swing = stroke(hook);
      const sideways = blankTrace();
      const turned = blankTrace();
      paintFor(sideways, swing, 0, 2);
      paintFor(turned, swing, 0, 1);
      paintFor(turned, swing, 1, 2, upright);
      const a = keptPainting(sideways);
      const b = keptPainting(turned);
      expect(a.marks.length).toBe(b.marks.length);
      for (let i = 0; i < a.marks.length; i++) {
        expect(a.marks[i].x).toBeCloseTo(b.marks[i].x, 8);
        expect(a.marks[i].y).toBeCloseTo(b.marks[i].y, 8);
      }
    }
  });

  it('keeps a valid one-wiggle picture and a full three-color roll, capped exactly at 24 seconds', () => {
    const short = stroke('short');
    const trace = blankTrace();
    paintFor(trace, short, 0, 1);
    let picture = keptPainting(trace);
    expect(picture.marks.length).toBeGreaterThanOrEqual(PAINTING_MIN_MARKS);
    expect(cleanPicture(picture)).toEqual(picture);
    paintFor(trace, short, 1, 8);
    endSection(trace);
    paintFor(trace, { ...stroke('middle'), start: 8 }, 8, 16);
    endSection(trace);
    paintFor(trace, { ...stroke('long'), start: 16 }, 16, 30);
    expect(trace.seconds).toBe(ROLL_SECONDS);
    expect(trace.sections[0].dots.length / 8).toBeGreaterThanOrEqual(8);
    picture = keptPainting(trace);
    expect(picture.marks.length).toBeLessThanOrEqual(PAINTING_MAX_MARKS);
    expect(new Set(picture.marks.map((mark) => mark.color))).toEqual(new Set(Object.values(PAINT_COLOR)));
    expect(cleanPicture(picture)).toEqual(picture);
  });
});
