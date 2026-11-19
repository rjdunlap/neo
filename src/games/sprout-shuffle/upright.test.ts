import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BENCH_S,
  BRIEF_H,
  BRIEF_W,
  BUD_H,
  BUD_W,
  BUTTON_PAD,
  CAN_R,
  CARD,
  CHECK_R,
  CLOSE_R,
  HIDDEN_PLANT_H,
  LENS_BIG_R,
  LENS_R,
  PACKET_R,
  PAIR_H,
  PAIR_W,
  PLANT_H,
  PLANT_W,
  TESTER_TILE,
  TESTER_TRAY_Y,
  TILE,
  conservatoryFan,
  conservatoryLayout,
  hiddenLayout,
  pairsLayout,
  shuffleLayout,
  type Spot,
} from './layout';
import {
  CONSERVATORY_LEVEL,
  HIDDEN_LEVEL,
  LEVELS,
  PAIRS_LEVEL,
  TESTER_LEVEL,
  conservatorySetupFor,
  setupFor,
} from './logic';

/**
 * Sprout Shuffle held upright (chunk 31, docs/definitions/phone-portrait.md): every level, at every moment of a round
 * that shows a different set of things to touch, on the three upright phone views, the captioned one and a short one.
 * The targets are whole touch areas: a tray tile, a bud card, a choice or pair card, a round button with its 14-unit
 * reach, level 6's tester with its tray, a conservatory plant card and the brief.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);

const button = (what: string, p: Spot, r: number) => square(what, p, 2 * (r + BUTTON_PAD));
const box = (what: string, p: Spot, w: number, h: number, scale = 1): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: w * scale,
  h: h * scale,
});
/** Level 6's tester: its touch rectangle reaches from above its bloom to under its tray (`testerArt`). */
function tester(what: string, feet: Spot, scale: number): Target {
  const up = HIDDEN_PLANT_H + 20;
  const down = TESTER_TRAY_Y + TESTER_TILE / 2 + 30;
  return { what, x: feet.x, y: feet.y + ((down - up) / 2) * scale, w: 220 * scale, h: (up + down) * scale };
}

/** Each moment's targets at `level`, by name. */
function moments(v: { w: number; h: number }, level: number): Record<string, Target[]> {
  if (level < PAIRS_LEVEL) {
    const tryOne = setupFor(level, new Rng(5)).plan.task === 'choose-always';
    const g = shuffleLayout(v, tryOne);
    const tiles = g.tiles.flat().map((p, i) => square(`tile ${i + 1}`, p, TILE));
    const buds = g.buds.map((p, i) => box(`bud ${i + 1}`, p, BUD_W, BUD_H));
    const out: Record<string, Target[]> = { 'giving a copy': tiles, 'the bud fan': [...tiles, ...buds] };
    if (level > 1)
      out['the choice'] = [
        ...buds,
        ...g.cards.map((p, i) => square(`card ${i + 1}`, p, CARD * g.cardScale)),
        button('the leaf', g.check, CHECK_R),
        ...(tryOne ? [button('the seed packet', g.tryOne, PACKET_R)] : []),
      ];
    return out;
  }
  if (level < HIDDEN_LEVEL) {
    const g = pairsLayout(v);
    const stack = [
      ...g.cards.map((p, i) => box(`pair card ${i + 1}`, p, PAIR_W, PAIR_H, g.cardScale)),
      ...g.lenses.map((p, i) => button(`magnifier ${i + 1}`, p, LENS_R)),
      button('the leaf', g.check, CHECK_R),
    ];
    return {
      'the cards': stack,
      'an open fan': [...stack, ...g.buds.map((p, i) => box(`bud ${i + 1}`, p, BUD_W, BUD_H, g.fanScale))],
    };
  }
  if (level < CONSERVATORY_LEVEL) {
    const g = hiddenLayout(v, 0);
    const cards = g.cards.map((p, i) => square(`card ${i + 1}`, p, CARD));
    const picked = level >= TESTER_LEVEL ? [tester('the potted tester', g.testerPlant, 1)] : [];
    const fan = hiddenLayout(v, 4);
    const out: Record<string, Target[]> = {
      'watering and choosing': [
        button('the can', g.can, CAN_R),
        button('the seed packet', g.tryOne, PACKET_R),
        ...cards,
        button('the leaf', g.check, CHECK_R),
        ...picked,
      ],
      'an open fan': [
        ...fan.buds.map((p, i) => box(`bud ${i + 1}`, p, BUD_W, BUD_H, fan.budScale)),
        ...cards,
        button('the leaf', g.check, CHECK_R),
      ],
    };
    if (level >= TESTER_LEVEL) {
      const waiting = g.benchPlants.map((p, i) => tester(`bench tester ${i + 1}`, p, BENCH_S));
      out['picking a tester'] = [button('the can', g.can, CAN_R), ...waiting];
      waiting.forEach((w, i) => {
        out[`tester ${2 - i} potted`] = [button('the can', g.can, CAN_R), w, ...picked];
      });
    }
    return out;
  }
  const out: Record<string, Target[]> = {};
  for (const seed of [3, 31, 77]) {
    const n = conservatorySetupFor(level, new Rng(seed)).bench.length;
    const g = conservatoryLayout(v, n);
    const fan = conservatoryFan(v, n);
    const fixed = [
      box('the brief', g.brief, BRIEF_W, BRIEF_H),
      ...g.potX.map((x, i) => box(`pot ${i + 1}`, { x, y: g.potCardY }, PLANT_W, PLANT_H, g.potScale)),
      button('the spots lens', g.ctrl.spots, LENS_BIG_R),
      button('the rim lens', g.ctrl.rim, LENS_BIG_R),
      button('the leaf', g.ctrl.check, CHECK_R),
      button('the star', g.ctrl.finish, CHECK_R),
    ];
    out[`a bench of ${n}`] = [
      ...fixed,
      ...g.benchPos.map((p, i) => box(`bench plant ${i + 1}`, p, PLANT_W, PLANT_H, g.bs)),
    ];
    out[`a lens open over a bench of ${n}`] = [
      ...fixed,
      ...fan.buds.map((p, i) => box(`bud ${i + 1}`, p, BUD_W, BUD_H, fan.scale)),
      button('close', fan.close, CLOSE_R),
    ];
  }
  return out;
}

it('covers levels 1 to 8', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

describe.each(Object.entries(views))('Sprout Shuffle upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      for (const [moment, targets] of Object.entries(moments(v, level)))
        expect(uprightProblems(v, targets), `level ${level}, ${moment}`).toEqual([]);
    },
  );

  it('levels 1–3: the plants stand below Home, and the slots between and above the trays', () => {
    for (const tryOne of [false, true]) {
      const g = shuffleLayout(v, tryOne);
      expect(g.plants[0].y - 190).toBeGreaterThan(170);
      expect(g.slots[0].y + 65).toBeLessThan(g.tiles[0][0].y - TILE / 2);
      expect(g.tiles[0][1].x + TILE / 2).toBeLessThan(g.tiles[1][0].x - TILE / 2);
      // The choice cards stand between the plants (a plant is about 120 wide), and the fan's feet above the bottom edge.
      expect(g.cards[0].x - (CARD * g.cardScale) / 2).toBeGreaterThan(g.plants[0].x + 60);
      expect(g.buds[3].y + BUD_H / 2).toBeLessThanOrEqual(v.h - 16);
      // On a taller phone the stack is centred: as much room above the blooms as under the fan, within a bloom's height.
      const above = g.plants[0].y - 190;
      const below = v.h - (g.buds[3].y + BUD_H / 2);
      expect(Math.abs(above - below)).toBeLessThan(190);
    }
  });

  it('levels 5–6: the record card, the hidden tray and the banner are inside the view', () => {
    const g = hiddenLayout(v, 8);
    expect(g.banner.x - 110).toBeGreaterThanOrEqual(0);
    expect(g.hiddenTiles[0].x - 36).toBeGreaterThanOrEqual(0);
    expect(g.sprout(0).x - 38).toBeGreaterThanOrEqual(0);
    expect(g.sprout(7).x + 38).toBeLessThanOrEqual(v.w);
    // Both fans together are a picture, not targets: eight buds inside the panel, none over another.
    const buds = g.buds.map((p, i) => box(`bud ${i + 1}`, p, BUD_W, BUD_H, g.budScale));
    expect(uprightProblems(v, buds, 0)).toEqual([]);
    expect(g.buds[0].y - (BUD_H / 2) * g.budScale).toBeGreaterThanOrEqual(g.panel.top);
    expect(g.buds[7].y + (BUD_H / 2) * g.budScale).toBeLessThanOrEqual(g.panel.bottom);
  });

  it('levels 7–8: the finished beds stand inside the view, beside the brief', () => {
    const g = conservatoryLayout(v, 4);
    expect(g.beds[0].x - 130 * g.bedScale).toBeGreaterThanOrEqual(0);
    expect(g.beds[1].x + 130 * g.bedScale).toBeLessThanOrEqual(v.w);
    expect(g.beds[0].x + 130 * g.bedScale).toBeLessThanOrEqual(g.brief.x - BRIEF_W / 2);
  });
});

describe('Sprout Shuffle sideways and on an iPad held upright, unchanged', () => {
  const v = computeView(1024, 768, NO_INSETS);
  const pad = computeView(768, 1024, NO_INSETS);

  it('levels 1–3', () => {
    const g = shuffleLayout(v, true);
    expect(g.plants).toEqual([
      { x: 1024 * 0.17, y: 300 },
      { x: 1024 * 0.83, y: 300 },
    ]);
    expect(g.tiles[0]).toEqual([
      { x: 1024 * 0.17 - 72, y: 390 },
      { x: 1024 * 0.17 + 72, y: 390 },
    ]);
    expect(g.slots).toEqual([
      { x: 422, y: 280 },
      { x: 602, y: 280 },
    ]);
    expect(g.sprout).toEqual({ x: 512, y: 260 });
    expect(g.cards).toEqual([
      { x: 402, y: 230 },
      { x: 622, y: 230 },
    ]);
    expect(g.cardScale).toBe(1);
    expect(g.check).toEqual({ x: 427, y: 430 });
    expect(g.tryOne).toEqual({ x: 597, y: 430 });
    expect(shuffleLayout(v, false).check).toEqual({ x: 512, y: 430 });
    expect(g.buds.map((b) => b.x)).toEqual([254.25, 462.75, 671.25, 879.75]);
    expect(new Set(g.buds.map((b) => b.y))).toEqual(new Set([628]));
    // An iPad held upright keeps its two-by-two fan from the middle of the screen, and the leaf between the trays.
    const p = shuffleLayout(pad, true);
    expect(pad.w).toBe(1024);
    expect(p.buds).toEqual([
      { x: 408, y: pad.h / 2 + 130 },
      { x: 616, y: pad.h / 2 + 130 },
      { x: 408, y: pad.h / 2 + 354 },
      { x: 616, y: pad.h / 2 + 354 },
    ]);
    expect(p.check).toEqual({ x: 427, y: 430 });
  });

  it('level 4', () => {
    const g = pairsLayout(v);
    expect(g.cardScale).toBeCloseTo(0.805);
    expect(g.fanScale).toBeCloseTo(0.805);
    expect(g.cards[1]).toEqual({ x: 567, y: 768 - 16 - 100 * g.cardScale });
    expect(g.cards[1].x - g.cards[0].x).toBeCloseTo(PAIR_W * 0.805 + 20);
    expect(g.lenses[0].y).toBeCloseTo(519);
    expect(g.check.x).toBe(512);
    expect(g.check.y).toBeCloseTo(355);
    expect(g.buds[0].y).toBeCloseTo(180.5);
    expect(g.friend.y).toBeCloseTo(261);
  });

  it('levels 5–6', () => {
    const g = hiddenLayout(v, 4);
    expect(g.hiddenPlant).toEqual({ x: 1024 * 0.28, y: 280 });
    expect(g.testerPlant).toEqual({ x: 1024 * 0.72, y: 280 });
    expect(g.can).toEqual({ x: 512, y: 190 });
    expect(g.tryOne).toEqual({ x: 934, y: 190 });
    expect(g.record).toEqual({ x: 512, y: 469 });
    expect(g.cards).toEqual([
      { x: 317, y: 652 },
      { x: 567, y: 652 },
    ]);
    expect(g.check).toEqual({ x: 817, y: 652 });
    expect(g.panel).toEqual({ top: 104, bottom: 388 });
    expect(g.budScale).toBe(1);
    expect(g.buds.map((b) => b.x)).toEqual([218, 414, 610, 806]);
    // The stack is centred on a taller view.
    expect(hiddenLayout(pad, 0).can.y).toBeCloseTo(190 + (pad.h - 768) / 2);
  });

  it('levels 7–8', () => {
    const g = conservatoryLayout(v, 5);
    expect(g.brief).toEqual({ x: 512, y: 110 });
    expect(g.potCardY).toBe(330);
    expect(g.potRim).toBe(444);
    expect(g.ctrl.spots).toEqual({ x: 1024 * 0.38 - 195, y: 270 });
    expect(g.ctrl.finish).toEqual({ x: 1024 * 0.62 + 200, y: 430 });
    expect(g.benchPos[0].y).toBe(632);
    expect(g.beds).toEqual([
      { x: 222, y: 140 },
      { x: 802, y: 140 },
    ]);
    expect(g.bedScale).toBe(0.8);
    const fan = conservatoryFan(v, 5);
    expect(fan.panel).toEqual({ top: 504, bottom: 760 });
    expect(fan.close).toEqual({ x: 946, y: 562 });
    // An iPad held upright: one row of four buttons under the pots, from 150 as before.
    const p = conservatoryLayout(pad, 5);
    expect(p.ctrl.spots.x).toBeCloseTo(567 - 285);
    expect(p.ctrl.finish.x).toBeCloseTo(567 + 285);
    expect(p.bedScale).toBe(0.8);
  });
});
