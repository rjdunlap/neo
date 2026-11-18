import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { levelsInOrder } from '../progress/difficulty';
import {
  gardenLayout,
  NEXT_H,
  PLANS as gardenPlans,
  UNDO_R,
  LEVELS as gardenLevels,
} from './block-garden/logic';
import { layoutFor as stonesLayout, LEVELS as stoneLevels, planFor as stonePlan } from './brain-break/logic';
import { phoneCrosswordLayout } from './crossword/grownup';
import { gemLayout } from './gem-swap';
import { LEVELS as gemLevels, planFor as gemPlan } from './gem-swap/logic';
import { songLayout } from './hat-band/logic';
import {
  LEVELS as bridgeLevels,
  planFor as bridgePlan,
  touchLayout as bridgeLayout,
} from './island-bridges/logic';
import { pondLayout } from './lantern-lights';
import { LEVELS as lanternLevels, planFor as lanternPlan } from './lantern-lights/logic';
import { BUTTON_SIZE, DIRECTION_SIZE, logRollLayout } from './log-roll';
import { FLOORS } from './log-roll/floors';
import { caseLayout, slidingLayout } from './logic-grid';
import { BUTTON_H as MARBLE_BUTTON_H } from './marble-jump/logic';
import { nookLayout, LEVELS as nookLevels, planFor as nookPlan } from './number-nook/logic';
import {
  clueDepths,
  ORDER as pictureOrder,
  poolFor,
  touchFrame as pictureFrame,
} from './picture-logic/logic';
import { pondTouchLayout } from './pond-conga/layout';
import { LEVELS as congaLevels, planFor as congaPlan } from './pond-conga/logic';
import { lensLayout, LEVELS as lensLevels, ringBox } from './puddle-lens/logic';
import { pyramidLayout } from './pyramid-solitaire';
import { planFor as pyramidPlan } from './pyramid-solitaire/logic';
import { GAMES } from './registry';
import { frameFor } from './ribbon-workshop/frame';
import { UNIT } from './ribbon-workshop/logic';
import { flatLayout, flatTargets } from './sorting-machine/flat';
import { isFlat, LEVELS as machineLevels, machineLayout } from './sorting-machine/logic';
import { comebackLayout } from './species-comeback';
import { makeRound as makeComeback, PLANS as comebackPlans } from './species-comeback/logic';
import { touchLayout as bedLayout } from './sudoku-garden/layout';
import { LEVELS as bedLevels, planFor as bedPlan } from './sudoku-garden/logic';
import { tilePairsLayout } from './tile-pairs';
import { LEVELS as tileLevels, makeBoard } from './tile-pairs/logic';
import { thumbPx, UPRIGHT_VIEWS } from './upright-check';
import { PAD, touchFrame as wordFrame, touchSquare } from './word-search/layout';
import { LEVELS as wordLevels, planFor as wordPlan } from './word-search/logic';

/**
 * The smallest thing a thumb has to hit in each upright grown-up game, at the grown-up band's levels on a 390 × 844 phone
 * (roadmap recommendation 6, docs/definitions/phone-portrait.md#thumb-sizes-of-the-upright-grown-up-games-measured-2026-11-18). Each entry
 * measures the game's own layout; the table records the result in CSS pixels, so a layout change that shrinks a target
 * fails here and the definition's table is kept honest. `slides` names a board that scrolls or is one swipe surface,
 * which the band rule allows under the 44-pixel comfort line.
 */
const v = UPRIGHT_VIEWS.phone;
/** A target's shorter side in units; `slides` marks a square of a board that slides under the thumb. */
type Size = [what: string, units: number, slides?: 'slides'];
const least = (sizes: Size[]): Size | undefined =>
  sizes.length ? sizes.reduce((a, b) => (b[1] < a[1] - 1e-6 ? b : a)) : undefined;
const side = (r: { w: number; h: number }) => Math.min(r.w, r.h);
const grown = (levels: Parameters<typeof levelsInOrder>[0]) => levelsInOrder(levels);

const MEASURE: Record<string, () => Size[]> = {
  'block-garden': () =>
    grown(gardenLevels.grownup!).flatMap((level) => {
      const l = gardenLayout(gardenPlans[level - 1], v);
      return [
        // A dragged piece lands on the bed's squares: a drop place, not a tap.
        ['bed square', l.cell],
        ...l.slots.map((r): Size => ['tray slot', side(r)]),
        ...l.next.map((r): Size => ['next tray', Math.min(r.w, r.h, NEXT_H)]),
        ['Undo', 2 * UNDO_R],
      ] as Size[];
    }),
  'brain-break': () =>
    grown(stoneLevels.grownup!).map((level) => ['stone', stonesLayout(v.w, v.h, stonePlan(level).side).size]),
  crossword: () => [8, 5].map((n) => ['square and key', phoneCrosswordLayout(v, n, n).tile]),
  'gem-swap': () => [
    ...grown(gemLevels.grownup!).map((level): Size => ['gem', gemLayout(v, gemPlan(level).size).pitch]),
    ['button', 88],
  ],
  'hat-band': () => {
    const l = songLayout(v);
    return [
      ...[...l.brief, ...l.spots, ...l.parts].map((r): Size => ['song card', side(r)]),
      ...[l.undo, l.play, l.check].map((d): Size => ['song control', 2 * d.r]),
    ];
  },
  'island-bridges': () =>
    grown(bridgeLevels.grownup!).flatMap((level) => {
      const fit = bridgeLayout(bridgePlan(level).size, v.w, v.h, false);
      return [['sea square', fit.cell], ...fit.slots.map((s): Size => ['button', side(s)])] as Size[];
    }),
  'lantern-lights': () => [
    ...grown(lanternLevels.grownup!).map((level): Size => [
      'lantern',
      pondLayout(v, lanternPlan(level).size).cell,
    ]),
    ['button', 100],
  ],
  'log-roll': () =>
    // The log rolls by the direction buttons; the stones are not tapped.
    FLOORS.flat().flatMap((floor) => {
      expect(logRollLayout(v, floor).cell).toBeGreaterThanOrEqual(76);
      return [
        ['direction button', side(DIRECTION_SIZE)],
        ['button', side(BUTTON_SIZE)],
      ] as Size[];
    }),
  'logic-grid': () => [
    // Level 7's case file sits whole in its window; level 8's L slides.
    ['case-file square', caseLayout(v, 6, true).cell],
    ['square', slidingLayout(v, 6, true).cell, 'slides'],
  ],
  // The holes are 78-unit hit circles (upright-batch-4.test.ts).
  'marble-jump': () => [
    ['hole', 78],
    ['button', MARBLE_BUTTON_H],
  ],
  'number-nook': () =>
    grown(nookLevels.grownup!).map((level) => {
      const { rows, cols } = nookPlan(level);
      return ['tile', nookLayout(v.w, v.h, rows, cols).cell - 1];
    }),
  'picture-logic': () =>
    pictureOrder.flatMap((level) =>
      poolFor(level).flatMap((p) => {
        const { rowDepth, colDepth } = clueDepths(p);
        const f = pictureFrame(v.w, v.h, p.size, rowDepth, colDepth, !!p.colors, v.upright);
        return [
          ['square', f.cell, 'slides'],
          ...f.slots.map((r): Size => ['tool button', side(r)]),
        ] as Size[];
      }),
    ),
  'pond-conga': () =>
    grown(congaLevels.grownup!).flatMap((level) => {
      const plan = congaPlan(level);
      // The pond is one swipe surface (a swipe anywhere steers), so only Hint and Start over are targets.
      return pondTouchLayout(plan.cols, plan.rows, v.w, v.h, false).slots.map((r): Size => [
        'button',
        side(r),
      ]);
    }),
  'puddle-lens': () =>
    grown(lensLevels.grownup!).flatMap((level) => {
      const l = lensLayout(v, level)!;
      return [
        ...l.stops.map((r): Size => ['stop', side(r)]),
        ...(l.answer ? ([['answer', side(l.answer)]] as Size[]) : []),
        ...l.choices.map((r): Size => ['choice', side(r)]),
        ...l.things.map((t): Size => ['thing', side(ringBox(t))]),
      ];
    }),
  'pyramid-solitaire': () =>
    [1, 2, 3, 4, 5, 6, 7, 8].map((level) => {
      const plan = pyramidPlan(level);
      const l =
        'columns' in plan
          ? pyramidLayout(v, plan.rows, 0, plan.columns, plan.depth)
          : pyramidLayout(v, plan.rows, 'shelf' in plan ? plan.shelf : 0);
      // An open card is 100 units; a covered one that level 5 lets her lift shows a strip as tall as the row gap. Level
      // 8's back cards are targets only once they stand whole.
      return ['card', Math.min(100, l.cards[1].y - l.cards[0].y)];
    }),
  'ribbon-workshop': () => {
    const f = frameFor(v);
    return [
      ['quarter ribbon', UNIT * f.s],
      ['bow, scissors and Undo', 120 * f.s],
    ];
  },
  'snowball-merge': () => [
    ['arrow', 100],
    ['button', 100],
  ],
  'sorting-machine': () =>
    grown(machineLevels.grownup!).flatMap((level) => {
      if (isFlat(level)) return flatTargets(flatLayout(v)!, level).map((t): Size => [t.what, side(t.rect)]);
      const l = machineLayout(level, v)!;
      return [...l.fixtures, l.send, l.slow, ...l.picks, ...(l.slot ? [l.slot] : [])].map((r): Size => [
        'machine button',
        side(r),
      ]);
    }),
  'species-comeback': () =>
    comebackPlans.flatMap(({ level }) =>
      [1, 2, 3].map((seed): Size => {
        const round = makeComeback(level, new Rng(seed));
        return ['turtle card', comebackLayout(v, round.tree, [], round.target).card];
      }),
    ),
  'sudoku-garden': () =>
    grown(bedLevels.grownup!).flatMap((level) => {
      const n = bedPlan(level).size;
      const fit = bedLayout(n, v.w, v.h, n === 9);
      return [
        ['bed square', fit.cell],
        ...fit.slots.map((s): Size => [s.kind === 'digit' ? 'number button' : 'button', side(s)]),
      ] as Size[];
    }),
  'tile-pairs': () =>
    grown(tileLevels.grownup!).flatMap((level) => {
      tilePairsLayout(v, makeBoard(level, new Rng(1)));
      return [
        ['tile', 108],
        ['button', 100],
      ] as Size[];
    }),
  'word-search': () =>
    grown(wordLevels.grownup!).flatMap((level) => {
      const plan = wordPlan(level);
      const g = { n: plan.size, school: !!plan.pictures, small: plan.size <= 6 };
      const f = wordFrame(v.w, v.h, { ...g, words: plan.words, message: !!plan.message });
      const cell = touchSquare(f.vp, g);
      // The grid slides when its squares cannot all show at 64 units.
      const slides = plan.size * cell + PAD > Math.min(f.vp.w, f.vp.h);
      return [
        slides ? ['letter square', cell, 'slides'] : ['letter square', cell],
        ...f.btn.map((b): Size => ['button', side(b)]),
      ] as Size[];
    }),
};

/**
 * The measured table, in CSS pixels to one decimal: each game's smallest fixed target and what it is, and `slides` for the
 * smallest square of a board that slides (allowed under the comfort line by the grown-up band rule).
 */
const THUMBS: Record<string, { px: number; what: string; slides?: number }> = {
  'block-garden': { px: 45.7, what: 'bed square' },
  'brain-break': { px: 50.8, what: 'stone' },
  crossword: { px: 44.7, what: 'square and key' },
  'gem-swap': { px: 44.7, what: 'button' },
  'hat-band': { px: 50.8, what: 'song card' },
  'island-bridges': { px: 32.5, what: 'sea square' },
  'lantern-lights': { px: 50.8, what: 'button' },
  'log-roll': { px: 50.8, what: 'direction button' },
  'logic-grid': { px: 32.5, what: 'case-file square', slides: 32.5 },
  'marble-jump': { px: 39.6, what: 'hole' },
  'number-nook': { px: 43.7, what: 'tile' },
  'picture-logic': { px: 44.7, what: 'tool button', slides: 44.7 },
  'pond-conga': { px: 44.7, what: 'button' },
  'puddle-lens': { px: 55.9, what: 'stop' },
  'pyramid-solitaire': { px: 50.8, what: 'card' },
  'ribbon-workshop': { px: 49.8, what: 'bow, scissors and Undo' },
  'snowball-merge': { px: 50.8, what: 'arrow' },
  'sorting-machine': { px: 52.8, what: 'machine button' },
  'species-comeback': { px: 32.5, what: 'turtle card' },
  'sudoku-garden': { px: 42.7, what: 'bed square' },
  'tile-pairs': { px: 50.8, what: 'button' },
  'word-search': { px: 35, what: 'letter square', slides: 32.5 },
};

/** About a comfortable thumb, in CSS pixels (roadmap recommendation 6). */
const COMFORT = 44;
/** The games with a fixed target under the comfort line: each is named on the READY fix lines until it is fixed. */
const UNDER = [
  'island-bridges',
  'logic-grid',
  'marble-jump',
  'species-comeback',
  'sudoku-garden',
  'word-search',
];

describe('Thumb sizes of the upright grown-up games at 390 × 844', () => {
  const games = GAMES.filter((g) => g.upright && g.bands.includes('grownup')).map((g) => g.id);
  const measured = (id: string) => {
    const sizes = MEASURE[id]();
    const fixed = least(sizes.filter((s) => !s[2]))!;
    const sliding = least(sizes.filter((s) => s[2]));
    return { px: thumbPx(fixed[1]), what: fixed[0], ...(sliding ? { slides: thumbPx(sliding[1]) } : {}) };
  };

  it('measures every upright grown-up game, and nothing else', () => {
    expect(Object.keys(MEASURE).sort()).toEqual([...games].sort());
  });

  it("records each game's smallest target as measured", () => {
    expect(Object.fromEntries(Object.keys(MEASURE).map((id) => [id, measured(id)]))).toEqual(THUMBS);
  });

  it('keeps the buttons fixed on 2026-11-18 at a comfortable thumb: Island Bridges, Marble Jump and Word Search', () => {
    for (const id of ['island-bridges', 'marble-jump', 'word-search'])
      for (const [what, units] of MEASURE[id]().filter((s) => s[0] === 'button'))
        expect(thumbPx(units), `${id} ${what}`).toBeGreaterThanOrEqual(COMFORT);
  });

  it('keeps every target at the grown-up minimum of 64 units, and names each game under a comfortable thumb', () => {
    for (const t of Object.values(THUMBS))
      expect(Math.min(t.px, t.slides ?? t.px)).toBeGreaterThanOrEqual(thumbPx(64));
    expect(Object.keys(THUMBS).filter((id) => THUMBS[id].px < COMFORT - 0.5)).toEqual(UNDER);
  });
});
