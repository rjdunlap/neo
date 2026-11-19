import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  boardOrigin,
  boardScale,
  boardsFor,
  bowlAt,
  BOWL_R,
  columnsFor,
  coverBoardsFor,
  HIT_R,
  LEVELS,
  makeToss,
  pairBoard,
  planFor,
  signAt,
  SIGN_W,
  STRIP_MAX,
  TOKEN,
  tokenAt,
  type Pt,
} from './logic';

/**
 * Fruit Slice held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone
 * views, the captioned one and a short one. What a level shows to touch: the fruit where each hangs (a hit circle
 * 150 wide, drifting up to 26 either way), the sign, the bowl (send, or level 10's put-back), level 10's token strip,
 * and the still boards' fruit at the board's scale.
 */
const views: Record<string, View> = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);
const DRIFT = 26;

const perSeed = (v: View, level: number): Target[][] => {
  const plan = planFor(level);
  return Array.from({ length: 25 }, (_, i) => {
    const rng = new Rng(i + 1);
    const tosses = Array.from({ length: plan.aloft }, (_, c) => makeToss('apple', c, plan.aloft, rng, v.w));
    return tosses.map((t, c) => {
      const toward = c === 0 ? 1 : c === tosses.length - 1 ? -1 : 0;
      return square(`fruit ${c + 1}`, { x: t.ax * v.w + toward * DRIFT, y: t.ay * v.h }, 2 * HIT_R);
    });
  });
};

const chrome = (v: View, level: number): Target[] => {
  const out: Target[] = [
    square('the sign', signAt(v), SIGN_W),
    { what: 'the bowl', x: bowlAt(v).x, y: bowlAt(v).y - 20, w: 2 * BOWL_R, h: 2 * BOWL_R },
  ];
  if (planFor(level).mode === 'mixed')
    for (let i = 0; i < STRIP_MAX; i++) out.push(square(`token ${i + 1}`, tokenAt(v, i), TOKEN));
  return out;
};

const boardFruit = (v: View, fruit: Pt[]): Target[] => {
  const o = boardOrigin(v),
    k = boardScale(v);
  return fruit.map((p, i) =>
    square(`board fruit ${i + 1}`, { x: o.x + p.x * k, y: o.y + p.y * k }, 2 * HIT_R * k),
  );
};

describe.each(Object.entries(views))('Fruit Slice upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: the hanging fruit, sign, bowl and tokens are whole, apart, in view and clear of the chrome',
    (level) => {
      for (const round of perSeed(v, level))
        expect(uprightProblems(v, [...round, ...chrome(v, level)]), `level ${level}`).toEqual([]);
    },
  );

  it('the still boards keep every fruit and its hit circle whole in the view, clear of the sign and (level 7) apart', () => {
    const sign = [square('the sign', signAt(v), SIGN_W)];
    // The hit circles are round, so two on a diagonal can touch without their squares meeting: spacing is checked as a distance.
    const problems = (b: { fruit: Pt[] }) =>
      uprightProblems(v, [...boardFruit(v, b.fruit), ...sign]).filter((p) => !p.includes('overlaps'));
    const k = boardScale(v);
    for (let seed = 1; seed <= 12; seed++) {
      const rng = new Rng(seed);
      expect(problems(pairBoard(rng))).toEqual([]);
      for (const b of boardsFor(rng)) {
        expect(problems(b)).toEqual([]);
        for (let i = 0; i < b.fruit.length; i++)
          for (let j = i + 1; j < b.fruit.length; j++)
            expect(
              Math.hypot(b.fruit[i].x - b.fruit[j].x, b.fruit[i].y - b.fruit[j].y) * k,
            ).toBeGreaterThanOrEqual(2 * HIT_R * k - 1e-6);
      }
      // Level 9's fruit may sit close on purpose (a strip a line can clear).
      for (const b of coverBoardsFor(rng)) expect(problems(b)).toEqual([]);
    }
  });

  it('the bowl and the token strip stand up from the bottom edge, clear of the guide', () => {
    expect(v.h - bowlAt(v).y).toBeLessThanOrEqual(90);
    for (let i = 0; i < STRIP_MAX; i++) expect(tokenAt(v, i).y).toBeGreaterThan(v.h - 300);
  });
});

describe('Fruit Slice keeps its sideways layout', () => {
  it('scales nothing and keeps its columns on the 1024-wide area', () => {
    const v = computeView(1024, 768);
    expect(boardScale(v)).toBe(1);
    expect(columnsFor(3, v.w)).toEqual([0.28, 0.5, 0.72]);
    expect(boardOrigin(v).x).toBe(102);
  });
  it('spreads two and three columns on the 768-wide area so neighbours drifting together keep their circles apart', () => {
    const jitter = 2 * 0.012 * 768;
    for (const n of [2, 3]) {
      const xs = columnsFor(n, 768).map((f) => f * 768);
      for (let i = 1; i < xs.length; i++)
        expect(xs[i] - xs[i - 1] - 2 * DRIFT - jitter).toBeGreaterThanOrEqual(2 * HIT_R);
    }
    expect(boardScale(computeView(390, 844, NO_INSETS, true))).toBeLessThan(1);
  });
});
