import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BIG,
  diceLayout,
  dueLayout,
  gridSide,
  layout,
  LEVELS,
  planFor,
  raceLayout,
  RIG_COUNT,
  rigLayout,
  settleLayout,
  SETTLE_R,
  SMALL,
  SPIN_PAD,
  sureLayout,
  TRACK,
  typicalLayout,
  type Box,
  type Circle,
} from './logic';

/**
 * Spinner Fair upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band on the three upright
 * phone views, the captioned one and a short one. The boxes are each scene's own tap, drag and drop targets, from the
 * layout function the scene places them with and the hit sizes it sets.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const HAIR = 1e-7;
const rect = (what: string, b: Box): Target => ({ what, x: b.x, y: b.y, w: b.w - HAIR, h: b.h - HAIR });
/** A spinner's tap circle, as its bounding square; `scale` for a wheel the scene draws scaled. */
const wheel = (c: Circle, pad = SPIN_PAD, scale = 1, what = 'spinner'): Target => {
  const d = 2 * (c.r + pad) * scale - HAIR;
  return { what, x: c.x, y: c.y, w: d, h: d };
};

function check(v: View, targets: Target[]) {
  expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone)
    expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
}

/** Every screen a level shows, as its list of targets. */
function screens(level: number, v: View): Target[][] {
  const ask = planFor(level).ask;
  if (ask === 'see' || ask === 'most' || ask === 'pick') {
    // The one spinner over its bars: three critters at levels 1–2, two or three on level 3's picked wheel (which is
    // the small wheel's art scaled up to the big one's size, its tap circle with it).
    const spin = (bars: number, scale: number) => {
      const L = layout(v, bars);
      expect(L.portrait).toBe(true);
      return [
        wheel({ ...L.spinner, r: ask === 'pick' ? SMALL : BIG }, SPIN_PAD, scale),
        ...L.columns.map((c) => rect('bar', c)),
      ];
    };
    if (ask !== 'pick') return [spin(3, 1)];
    const L = layout(v, 3);
    return [
      [wheel(L.pair[0]), wheel(L.pair[1]), rect('favourite', L.favourite)],
      spin(2, BIG / SMALL),
      spin(3, BIG / SMALL),
    ];
  }
  if (ask === 'sure') {
    // Three spinners (tap to spin, drop a card on), the tray's cards, each card's slot once placed, the favourite.
    const L = sureLayout(v);
    return [
      [
        ...L.spinners.map((s) => wheel(s)),
        ...L.slots.map((s) => rect('slot', s)),
        ...L.tray.map((t) => rect('card', t)),
        rect('favourite', L.favourite),
      ],
    ];
  }
  if (ask === 'fair') {
    // The wheel of wedges, the three buttons and the two racers anywhere along their tracks.
    const L = raceLayout(v);
    const steps = Array.from({ length: TRACK + 1 }, (_, s) => s);
    return steps.flatMap((a) =>
      steps.map((b) => [
        wheel(L.spinner),
        rect('racer', L.racerAt(0, a)),
        rect('racer', L.racerAt(1, b)),
        rect('fair', L.fair),
        rect('unfair', L.unfair),
        rect('check', L.check),
      ]),
    );
  }
  if (ask === 'settle' || ask === 'hidden' || ask === 'due') {
    const L = ask === 'due' ? dueLayout(v) : settleLayout(v);
    return [[wheel(L.spinner), rect('fast forward', L.fast), ...L.cards.map((c) => rect('card', c))]];
  }
  if (ask === 'dice') {
    // The tray while rolling; then the grid in its place, with question one's three cards and question two's two.
    const L = diceLayout(v);
    const side = gridSide(L.grid);
    const grid = rect('grid', { x: L.grid.x + side / 2, y: L.grid.y + side / 2, w: side, h: side });
    return [
      [rect('tray', L.tray), ...L.most.map((c) => rect('card', c))],
      [grid, ...L.most.map((c) => rect('card', c))],
      [grid, ...L.pair.map((c) => rect('card', c))],
    ];
  }
  if (ask === 'typical') {
    const L = typicalLayout(v);
    return [
      [
        wheel({ ...L.spinner, r: SETTLE_R }, SPIN_PAD, L.spinner.r / SETTLE_R),
        ...L.towers.map((t) => rect('tower', t)),
        ...L.cards.map((c) => rect('card', c)),
      ],
    ];
  }
  // Level 9: the wheel of movable wedges (no pad: the wedges are the taps), the two boxes with their counts, Check.
  const L = rigLayout(v);
  return [
    [
      wheel(L.spinner, 0),
      ...L.boxes.map((b) => rect('box', { ...b, y: b.y + RIG_COUNT / 2, h: b.h + RIG_COUNT })),
      rect('check', L.check),
    ],
  ];
}

const levels = [
  ...new Set(
    Object.values(LEVELS).flatMap((r) => Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i)),
  ),
].sort((a, b) => a - b);

describe.each(Object.entries(views))('Spinner Fair upright on %s', (_, v) => {
  it('covers levels 1 to 11', () => expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  it.each(levels)(
    'level %i: every target is big enough, apart, in view and clear of the corners',
    (level) => {
      for (const targets of screens(level, v)) check(v, targets);
    },
  );
});
