import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { UPRIGHT_VIEWS, uprightProblems, type Target } from '../upright-check';
import {
  CHOICE,
  PLACE,
  RECORD,
  REPLAY,
  SUBMIT,
  SUMMARY,
  TAB,
  weekLayout,
  windowLayout,
  wrapPath,
} from './layout';
import { COUNT_LEVEL, PLANS, planFor } from './logic';

const compact = { w: 768, h: 1024, scale: 0.5, upright: true } as const;
const shortPhone = computeView(390, 625, NO_INSETS, true);
const views = { ...UPRIGHT_VIEWS, compact, shortPhone };
const box = (what: string, position: { x: number; y: number }, w: number, h: number): Target => ({
  what,
  ...position,
  w,
  h,
});
const levelNumbers = [...PLANS.map((_, i) => i + 1), COUNT_LEVEL];

describe.each(Object.entries(views))('Day by Day upright on %s', (_, view) => {
  it.each(levelNumbers)('level %i keeps all available controls and labels clear', (level) => {
    const l = level === 6 ? windowLayout(view) : weekLayout(view);
    const records = l.records.map((p, i) => box(`day ${i + 1}`, p, RECORD.w, RECORD.h));
    expect(records.slice(0, 4).every((r) => r.y === records[0].y)).toBe(true);
    expect(records.slice(4).every((r) => r.y === records[4].y && r.y > records[0].y)).toBe(true);
    expect(records.slice(0, 4).map((r) => r.x)).toEqual(
      records
        .slice(0, 4)
        .map((r) => r.x)
        .sort((a, b) => a - b),
    );
    expect(records.slice(4).map((r) => r.x)).toEqual(
      records
        .slice(4)
        .map((r) => r.x)
        .sort((a, b) => a - b),
    );
    const labels = [
      box('heading', l.heading, 500, 38),
      box('question', l.caption, 590, 40),
      box('note', l.note, 640, 52),
    ];
    const targets = [...records];
    if ('tabs' in l) {
      targets.push(
        ...l.tabs.map((p, i) => box(`week ${i + 1}`, p, TAB.w, TAB.h)),
        box('replay', l.replay, REPLAY.w, REPLAY.h),
        ...l.choices.map((p, i) => box(`summary ${i + 1}`, p, SUMMARY.w, SUMMARY.h)),
        box('submit', l.confirm, SUBMIT.w, SUBMIT.h),
      );
    } else {
      targets.push(...l.choices.map((p, i) => box(`answer ${i + 1}`, p, CHOICE.w, CHOICE.h)));
      if (level !== COUNT_LEVEL) targets.push(box('place', l.confirm, PLACE.w, PLACE.h));
      const garden = { ...l.garden, y: l.garden.y + 13 * l.garden.scale };
      labels.push(box('garden', garden, 644 * l.garden.scale, 108 * l.garden.scale));
      if (level !== COUNT_LEVEL) labels.push(box('sky picture', l.sky, 92, 90));
    }
    expect(uprightProblems(view, targets)).toEqual([]);
    expect(uprightProblems(view, [...targets, ...labels], 0)).toEqual([]);
  });

  it.each(levelNumbers.filter((level) => level <= 3 && planFor(level).relatives))(
    'level %i routes the week return around the full record',
    () => {
      const l = weekLayout(view);
      const path = wrapPath(l.records);
      expect(path[0].x).toBe(l.records[6].x);
      expect(path.at(-1)?.x).toBe(l.records[0].x);
      for (const [i, a] of path.slice(0, -1).entries()) {
        const b = path[i + 1];
        expect(a.x === b.x || a.y === b.y).toBe(true);
        for (const record of l.records) {
          expect(
            Math.max(a.x, b.x) < record.x - RECORD.w / 2 ||
              Math.min(a.x, b.x) > record.x + RECORD.w / 2 ||
              Math.max(a.y, b.y) < record.y - RECORD.h / 2 ||
              Math.min(a.y, b.y) > record.y + RECORD.h / 2,
          ).toBe(true);
        }
      }
    },
  );
});

it('keeps controls out of the temporary caption on a short upright phone', () => {
  const place = captionPlace(shortPhone, true);
  expect(place.mode).toBe('bubble');
  const band = place.band!;
  const bubble = box('caption bubble', { x: band.x + band.w / 2, y: band.y + band.h / 2 }, band.w, band.h);
  const week = weekLayout(place.game);
  const window = windowLayout(place.game);
  // The last set of controls sits lowest in each layout, so all earlier rows clear the bubble too.
  expect(
    uprightProblems(
      place.game,
      [
        bubble,
        ...week.choices.map((p, i) => box(`answer ${i + 1}`, p, CHOICE.w, CHOICE.h)),
        box('place', week.confirm, PLACE.w, PLACE.h),
      ],
      0,
    ),
  ).toEqual([]);
  expect(
    uprightProblems(
      place.game,
      [
        bubble,
        ...window.choices.map((p, i) => box(`summary ${i + 1}`, p, SUMMARY.w, SUMMARY.h)),
        box('submit', window.confirm, SUBMIT.w, SUBMIT.h),
      ],
      0,
    ),
  ).toEqual([]);
});
