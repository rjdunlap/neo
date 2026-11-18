import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BOAT_HIT,
  BUTTON_HIT_R,
  CARD_PAD,
  CARD_W,
  cardHeight,
  COIN_HIT_R,
  COIN_SCALE,
  HEAD_H,
  LEVELS,
  planFor,
  ROW_H,
  standLayout,
  TOWER_GRIP_R,
  TOWER_GRIP_UP,
  towerLayout,
  type StandPlan,
} from './logic';

/**
 * Lemonade Stand held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone
 * views, the captioned one and a short one. The boxes are the touch areas the scene sets (a card's padded rectangle, the
 * box round a coin's, a button's and a tower grip's touch circle, a boat's box, a table row), placed by `standLayout` and
 * `towerLayout`, which the scene places from.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const { min, max } = rangeFor(LEVELS, 'school');
const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
/** Tower heights a level-7 morning can show: the sunny crowds as they come, levelled, and lopsided after odd moves. */
const TOWERS = [
  [6, 10, 14],
  [14, 6, 10],
  [10, 10, 10],
  [1, 15, 14],
  [20, 9, 1],
];

/** The lightbulb and every row of the table, which stay on screen through each moment of a day. */
function always(v: View, plan: StandPlan): Target[] {
  const L = standLayout(v, plan);
  return [
    square('lightbulb', L.help, 2 * BUTTON_HIT_R),
    ...Array.from({ length: plan.days }, (_, i) => ({
      what: `row ${i + 1}`,
      x: L.panelX + L.panelW / 2,
      y: L.panelY + HEAD_H + i * ROW_H + ROW_H / 2,
      w: L.panelW,
      h: ROW_H - 1e-7,
    })),
  ];
}

/** Each moment of a level's day as its own set of targets: the boats or the towers stand in the controls' place. */
function screens(v: View, plan: StandPlan): Target[][] {
  const L = standLayout(v, plan);
  const base = always(v, plan);
  const controls = [
    ...base,
    ...L.cards.map((p) => ({
      what: 'batch card',
      ...p,
      w: CARD_W + 2 * CARD_PAD,
      h: cardHeight(plan) + 2 * CARD_PAD,
    })),
    square('OPEN', L.open, 2 * BUTTON_HIT_R),
    ...L.coins.map((p) => square('price', p, 2 * COIN_HIT_R)),
  ];
  const out = [controls];
  if (plan.boats)
    out.push([
      ...base,
      ...L.boats.map((p) => ({
        what: 'boat',
        x: p.x + BOAT_HIT.x + BOAT_HIT.w / 2,
        y: p.y + BOAT_HIT.y + BOAT_HIT.h / 2,
        w: BOAT_HIT.w,
        h: BOAT_HIT.h,
      })),
    ]);
  if (plan.typical)
    for (const towers of TOWERS) {
      const T = towerLayout(v, L, towers);
      out.push([
        ...base,
        ...T.xs.map((x, t) =>
          square(
            'tower top',
            { x, y: T.baseY - (towers[t] - 1) * T.step - T.step * TOWER_GRIP_UP },
            2 * TOWER_GRIP_R,
          ),
        ),
      ]);
    }
  return out;
}

describe.each(Object.entries(views))('Lemonade Stand upright on %s', (_, v) => {
  it('covers levels 1 to 7', () => expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7]));

  it.each(levels)(
    'level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (level) => {
      const plan = planFor(level);
      const all = screens(v, plan);
      expect(all).toHaveLength(1 + (plan.boats ? 1 : 0) + (plan.typical ? TOWERS.length : 0));
      for (const targets of all) {
        expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
        if (v === UPRIGHT_VIEWS.phone)
          expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
      }
    },
  );

  it.each(levels)('level %i: the picture stays on the screen and out from under the controls', (level) => {
    const plan = planFor(level);
    const L = standLayout(v, plan);
    // The counter (160 either side of the stand's middle) is on the screen and left of the table.
    expect(L.cx - 160).toBeGreaterThanOrEqual(0);
    expect(L.cx + 160).toBeLessThanOrEqual(L.panelX);
    // The banner has the full width, and the table starts under it.
    expect(L.bannerRight - 150).toBeGreaterThanOrEqual(520);
    expect(L.panelY).toBeGreaterThanOrEqual(24 + 96 + 5);
    // The lightbulb's touch circle ends above the awning; the picnic rug (30 below its middle) ends above the controls.
    expect(L.help.y + BUTTON_HIT_R).toBeLessThanOrEqual(L.top);
    const controlsTop = L.coins.length
      ? L.coins[0].y - COIN_HIT_R
      : L.cards[0].y - cardHeight(plan) / 2 - CARD_PAD;
    expect(L.blanket.y + 30).toBeLessThanOrEqual(controlsTop);
    expect(L.blanket.y + 30).toBeLessThanOrEqual(L.boats[0].y + BOAT_HIT.y);
    // The table ends above the prices, which reach under it.
    expect(L.panelY + HEAD_H + plan.days * ROW_H + 13).toBeLessThanOrEqual(controlsTop);
    if (plan.typical)
      for (const towers of TOWERS) {
        const T = towerLayout(v, L, towers);
        // The towers' board: on the screen, left of the table, under the lightbulb and above the guide's corner.
        expect(T.board.x).toBeGreaterThanOrEqual(0);
        expect(T.board.x + T.board.w).toBeLessThanOrEqual(L.panelX);
        expect(T.board.y).toBeGreaterThanOrEqual(L.help.y + BUTTON_HIT_R);
        expect(T.board.y + T.board.h + 5).toBeLessThanOrEqual(v.h - 170);
        // A friend dropped within half a gap of a tower joins it: the towers are at least a grip apart.
        expect(T.gap).toBeGreaterThanOrEqual(2 * TOWER_GRIP_R);
        // The tallest tower's top friend stays on the board.
        expect(T.baseY - Math.max(...towers) * T.step).toBeGreaterThanOrEqual(T.board.y);
      }
  });
});

describe('Lemonade Stand prices', () => {
  it('draws a price coin at least 100 units across (the coin art is 64 wide)', () => {
    expect(64 * COIN_SCALE).toBeGreaterThanOrEqual(100);
    expect(64 * COIN_SCALE).toBeLessThanOrEqual(2 * COIN_HIT_R);
  });
});

describe('Lemonade Stand sideways', () => {
  const spots = (ps: { x: number; y: number }[]) => ps.map((p) => [p.x, p.y]);

  it('keeps the tablet layout at 1366 x 1024', () => {
    const v = { w: 1366, h: 1024 };
    const one = standLayout(v, planFor(1));
    expect(one).toMatchObject({
      panelX: 1084,
      panelY: 40,
      panelW: 264,
      bannerRight: 1070,
      cx: 610,
      top: 266,
    });
    expect(one).toMatchObject({ counterY: 416, ground: 524, tally: { x: 828, y: 322 } });
    expect(one).toMatchObject({
      blanket: { x: 170, y: 538 },
      open: { x: 608, y: 874 },
      help: { x: 190, y: 350 },
    });
    expect(spots(one.cards)).toEqual([210, 344, 478].map((x) => [x, 874]));
    expect(one.coins).toEqual([]);
    const four = standLayout(v, planFor(4));
    expect(four).toMatchObject({ panelX: 1028, panelW: 320, cx: 582, tally: { x: 800, y: 346 } });
    expect(spots(four.coins)).toEqual([280, 420, 560].map((x) => [x, 724]));
    expect(spots(standLayout(v, planFor(5)).boats)).toEqual([280, 540].map((x) => [x, 854]));
    const seven = standLayout(v, planFor(7));
    const T = towerLayout(v, seven, [6, 10, 14]);
    expect(T).toMatchObject({ xs: [472, 642, 812], baseY: 954, gap: 170 });
    expect(T.step).toBeCloseTo(598 / 15);
    expect(T.board).toEqual({ x: 377, y: 256, w: 530, h: 738 });
  });

  it('keeps the small landscape layout at 1024 x 768', () => {
    const v = { w: 1024, h: 768 };
    const one = standLayout(v, planFor(1));
    expect(one).toMatchObject({ panelX: 742, panelY: 40, panelW: 264, bannerRight: 728, cx: 439, top: 138 });
    expect(one).toMatchObject({
      open: { x: 608, y: 618 },
      help: { x: 190, y: 222 },
      blanket: { x: 170, y: 410 },
    });
    expect(spots(one.cards)).toEqual([210, 344, 478].map((x) => [x, 618]));
    const four = standLayout(v, planFor(4));
    expect(four).toMatchObject({ panelX: 686, cx: 397 });
    expect(spots(four.coins)).toEqual([280, 420, 560].map((x) => [x, 468]));
    const T = towerLayout(v, standLayout(v, planFor(7)), [10, 10, 10]);
    expect(T).toMatchObject({ xs: [337, 471, 605], baseY: 698, gap: 134 });
    expect(T.step).toBeCloseTo(470 / 14);
  });
});
