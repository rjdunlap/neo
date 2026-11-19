import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BOARD_TALL, BUTTON, postLayout, TOOL_PAD, type Box, type Layout, type Pt } from './layout';
import { LEVELS, planFor, type Mode } from './logic';

/**
 * Measuring Post held upright (chunk 31, docs/definitions/phone-portrait.md): every level and every moment of its round
 * that shows something to touch, on the three upright phone views, the captioned one and a short one.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const pad = (what: string, p: Pt, size: { w: number; h: number } = TOOL_PAD): Target => ({
  what,
  ...p,
  ...size,
});

/**
 * What can be touched at each moment of a round in `mode`, as the scene shows it: Help and Replay always, with the tool
 * shelf; the unit tokens; the answer rows, comparison pads or grams pads with Check; or Send.
 */
function moments(mode: Mode, l: Layout): Record<string, Target[]> {
  const always = [square('Help', l.help, BUTTON), square('Replay', l.replay, BUTTON)];
  const three = (what: string) => l.tools.map((p, i) => pad(`${what} ${i + 1}`, p));
  const send = { send: [...always, square('Send', l.send, BUTTON)] };
  if (mode === 'table')
    return { choose: [...always, ...three('grams pad'), square('Check', l.send, BUTTON)], ...send };
  const tool = { tool: [...always, ...three('tool')] };
  if (mode === 'tool') return { ...tool, ...send };
  if (mode === 'rows')
    return { ...tool, answer: [...always, ...l.answers.map((p, i) => pad(`row ${i + 1}`, p, l.answerSize))] };
  return {
    ...tool,
    unit: [...always, ...l.units.map((p, i) => pad(`unit ${i + 1}`, p))],
    answer: [...always, ...three('comparison pad')],
  };
}

const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x - 1e-6 &&
  inner.y >= outer.y - 1e-6 &&
  inner.x + inner.w <= outer.x + outer.w + 1e-6 &&
  inner.y + inner.h <= outer.y + outer.h + 1e-6;

it('covers levels 1 to 4, one of each mode', () => {
  expect(levels).toEqual([1, 2, 3, 4]);
  expect(levels.map((l) => planFor(l).mode)).toEqual(['tool', 'rows', 'common', 'table']);
});

describe.each(Object.entries(views))('Measuring Post upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      const mode = planFor(level).mode;
      const l = postLayout(v, mode);
      expect(l.landscape).toBe(false);
      for (const [moment, targets] of Object.entries(moments(mode, l)))
        expect(uprightProblems(v, targets), `level ${level}, ${moment}`).toEqual([]);
    },
  );

  it.each(levels)(
    'level %i: everything she touches is in the bottom of the screen, under the board',
    (level) => {
      const mode = planFor(level).mode;
      const l = postLayout(v, mode);
      const targets = Object.values(moments(mode, l)).flat();
      const top = Math.min(...targets.map((t) => t.y - t.h / 2));
      // 410 units is 208 px of a 390 × 844 phone's 844.
      expect(v.h - top).toBeLessThanOrEqual(410);
      expect(top - (l.board.y + l.board.h)).toBeCloseTo(20);
      // The round-ending button (Send, or Check) is in the bottom row, at the right.
      expect(v.h - l.send.y).toBe(94);
      expect(l.send.x).toBeGreaterThan(l.replay.x);
    },
  );

  it.each(levels)('level %i: the board keeps its shape and its parts tile it', (level) => {
    const mode = planFor(level).mode;
    const { board, strip, slots, pair } = postLayout(v, mode);
    expect(board.x).toBeGreaterThanOrEqual(125);
    expect(board.x + board.w).toBeLessThanOrEqual(v.w - 20);
    expect(board.y).toBeGreaterThanOrEqual(40);
    expect(board.h).toBeLessThanOrEqual(BOARD_TALL[mode] * board.w + 1e-6);
    // Room for the picture: one object at level 1, two stacked records or objects after it.
    expect(board.h).toBeGreaterThanOrEqual(mode === 'tool' ? 500 : 700);
    for (const part of [strip, ...slots, ...pair]) expect(inside(part, board)).toBe(true);
    expect(strip.h).toBe(100);
    expect(slots[0].y).toBe(strip.y + strip.h);
    expect(slots[1].y).toBeCloseTo(slots[0].y + slots[0].h);
    expect(slots[1].y + slots[1].h).toBeCloseTo(board.y + board.h);
    expect(slots[0].h).toBeGreaterThanOrEqual(mode === 'rows' ? 300 : 0);
    expect(pair[1].y).toBeCloseTo(pair[0].y + pair[0].h);
    expect(pair[0].h).toBeCloseTo(board.h / 2);
  });
});

describe('Measuring Post on other views', () => {
  it('sideways keeps the centred 1024 × 768 plan at every level', () => {
    for (const level of levels) {
      const l = postLayout(computeView(1024, 768, NO_INSETS), planFor(level).mode);
      expect(l.landscape).toBe(true);
      expect(l.board).toEqual({ x: 180, y: 150, w: 780, h: 330 });
      expect(l.tools).toEqual([340, 520, 700].map((x) => ({ x, y: 555 })));
      expect(l.answers).toEqual([375, 765].map((x) => ({ x, y: 555 })));
      expect([l.help, l.replay, l.send]).toEqual([340, 550, 800].map((x) => ({ x, y: 700 })));
    }
  });

  it('an upright tablet, which is not an upright phone, keeps the stretched 768 × 1024 plan', () => {
    const v = computeView(768, 1024, NO_INSETS);
    expect(v.upright).toBeUndefined();
    // The plan's positions stretch with the view (1024 × 1365.3 here); the pads and buttons keep their size.
    const sx = v.w / 768,
      sy = v.h / 1024;
    const P = (x: number, y: number) => ({ x: x * sx, y: y * sy });
    for (const level of levels) {
      const l = postLayout(v, planFor(level).mode);
      expect(l.board).toEqual({ x: 170 * sx, y: 150 * sy, w: 560 * sx, h: 460 * sy });
      expect(l.tools).toEqual([260, 440, 620].map((x) => P(x, 700)));
      expect(l.answers).toEqual([672, 800].map((y) => P(450, y)));
      expect([l.help, l.replay, l.send]).toEqual([260, 440, 620].map((x) => P(x, 930)));
      expect(l.answerSize).toEqual({ w: 540, h: 110 });
    }
  });
});
