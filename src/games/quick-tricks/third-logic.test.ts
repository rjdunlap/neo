import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder } from '../../progress/difficulty';
import type { Band } from '../../progress/bands';
import { emptyCup, pour, recoverTray } from '../fill-dump/logic';
import { demoLoop, type Point } from '../lasso-loops/logic';
import { quickTricks } from './index';
import {
  AMOUNTS,
  atLine,
  clusters,
  crankCircle,
  crankLift,
  crankStep,
  cupTarget,
  FLY_GAP,
  halfTurns,
  judgeLoop,
  LOOP_MIN,
  meadow,
  MEADOW,
  pourNeeded,
  releaseCup,
  showFor,
  startCups,
  startCrank,
  thirdAmounts,
  wholeTurns,
  type CrankState,
} from './third-logic';

const BANDS: Band[] = ['toddler', 'preschool', 'prek', 'school'];
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

const turn = (s: CrankState, from: number, delta: number, steps: number): CrankState => {
  let out = crankStep(s, from);
  for (let i = 1; i <= steps; i++) out = crankStep(out, from + (delta * i) / steps);
  return out;
};

describe('Quick Tricks, the third show', () => {
  describe('the show map and ladders', () => {
    it('maps levels to shows', () => {
      for (const l of [1, 2, 3, 7, 8]) expect(showFor(l)).toBe('first');
      for (const l of [4, 5, 6]) expect(showFor(l)).toBe('second');
      expect(showFor(9)).toBe('third');
    });

    it('every band ends its order with 9, lists only 1..9, and has 8 only in toddler and preschool', () => {
      for (const band of quickTricks.bands) {
        const order = levelsInOrder(quickTricks.levels(band));
        expect(order[order.length - 1]).toBe(9);
        expect(order.every((l) => Number.isInteger(l) && l >= 1 && l <= 9)).toBe(true);
        expect(new Set(order).size).toBe(order.length);
        expect(order.includes(8)).toBe(band === 'toddler' || band === 'preschool');
      }
    });
  });

  describe('the crank', () => {
    for (const dir of [1, -1]) {
      it(`a full circle of small moves ${dir > 0 ? 'forward' : 'backward'} is one whole turn`, () => {
        const s = turn(startCrank(), 0.7, dir * 2 * Math.PI, 48);
        expect(wholeTurns(s)).toBe(1);
        expect(halfTurns(s)).toBe(2);
      });
    }

    it('backward moves after the direction is set add and remove nothing', () => {
      let s = turn(startCrank(), 0, Math.PI, 36); // half a turn forward
      const before = s.total;
      expect(s.dir).toBe(1);
      s = turn(s, 0.0, -Math.PI / 2, 12);
      expect(s.total).toBe(before);
      expect(s.dir).toBe(1);
    });

    it('a jump over a quarter turn adds nothing but re-anchors', () => {
      let s = turn(startCrank(), 0, Math.PI, 36);
      const before = s.total;
      s = crankStep(s, 0.2);
      s = crankStep(s, 0.2 + Math.PI * 0.8);
      expect(s.total).toBe(before);
      expect(s.anchor).toBeCloseTo(0.2 + Math.PI * 0.8);
    });

    it('the dead zone adds nothing and re-anchors', () => {
      let s = turn(startCrank(), 0, Math.PI, 36);
      const before = s.total;
      s = crankStep(s, null);
      expect(s.anchor).toBeNull();
      s = crankStep(s, 1);
      expect(s.anchor).toBe(1);
      expect(s.total).toBe(before);
    });

    it('progress survives a lift and the next grasp may turn either way', () => {
      let s = turn(startCrank(), 0, Math.PI, 36);
      s = crankLift(s);
      expect(s.total).toBeCloseTo(Math.PI);
      expect(s.dir).toBe(0);
      s = turn(s, 1, -Math.PI, 36);
      expect(wholeTurns(s)).toBe(1);
    });

    it('half turns are exact at 2.5 turns (school needs 5)', () => {
      const s = turn(startCrank(), 0, 2.5 * 2 * Math.PI, 120);
      expect(halfTurns(s)).toBe(AMOUNTS.school.halves);
      expect(halfTurns(turn(startCrank(), 0, 2.4 * 2 * Math.PI, 120))).toBe(4);
    });

    it('the bot circle is one whole turn when fed through crankStep as angles', () => {
      for (const from of [0, 1, 2.5, -2, 3.1])
        for (const dir of [1, -1] as const) {
          let s = crankStep(startCrank(), from);
          for (const p of crankCircle(from, dir)) s = crankStep(s, Math.atan2(p.y, p.x));
          expect(wholeTurns(s)).toBe(1);
        }
    });
  });

  describe('the cups', () => {
    it('serves every cup at its line and finishes after three, at every band', () => {
      for (const band of BANDS)
        for (const seed of SEEDS.slice(0, 30)) {
          const s = startCups(band, new Rng(seed));
          const score = { hints: 0 };
          const results: string[] = [];
          while (!s.done && results.length < 3) {
            pour(s, pourNeeded(s));
            results.push(releaseCup(s, band, true, score));
          }
          expect(results).toEqual(['served', 'served', 'done']);
          expect(s.done).toBe(true);
          expect(score.hints).toBe(0);
        }
    });

    it('targets: toddler/preschool 0.5 x3; prek and school 0.5 then 0.25/0.75 shuffled', () => {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        expect(startCups('toddler', new Rng(seed)).targets).toEqual([0.5, 0.5, 0.5]);
        expect(startCups('preschool', new Rng(seed)).targets).toEqual([0.5, 0.5, 0.5]);
        for (const band of ['prek', 'school'] as const) {
          const t = startCups(band, new Rng(seed)).targets;
          expect(t[0]).toBe(0.5);
          expect([...t.slice(1)].sort()).toEqual([0.25, 0.75]);
          seen.add(t.join());
        }
      }
      expect(seen.size).toBe(2);
    });

    it('overfill then emptyCup and recoverTray conserves the water, and never a miss', () => {
      for (const band of ['preschool', 'prek', 'school'] as const)
        for (const seed of SEEDS.slice(0, 20)) {
          const s = startCups(band, new Rng(seed));
          const score = { hints: 0, misses: 0 };
          const total = () => s.jug + s.cup + s.tray;
          pour(s, 0.95);
          expect(total()).toBeCloseTo(3);
          expect(releaseCup(s, band, true, score)).toBe(cupTarget(s) < 0.95 ? 'over' : 'served');
          if (s.round > 0) continue;
          pour(s, 1); // spills to the tray
          expect(total()).toBeCloseTo(3);
          emptyCup(s);
          expect(total()).toBeCloseTo(3);
          recoverTray(s);
          expect(s.tray).toBe(0);
          expect(s.cup).toBe(0);
          expect(s.jug).toBeCloseTo(3);
          expect(score.misses).toBe(0);
        }
    });

    it('a second overfill on one cup helps once (hints +1) and a third does not add more', () => {
      for (const band of ['preschool', 'prek', 'school'] as const) {
        const s = startCups(band, new Rng(3));
        const score = { hints: 0 };
        const over = () => {
          pour(s, 0.9);
          const r = releaseCup(s, band, true, score);
          emptyCup(s);
          recoverTray(s);
          return r;
        };
        expect([over(), over(), over(), over()]).toEqual(['over', 'help', 'over', 'over']);
        expect(score.hints).toBe(1);
        expect(s.helped).toBe(true);
        expect(pourNeeded(s)).toBeCloseTo(cupTarget(s) * 2);
      }
    });

    it('help resets for the next cup, which can be helped again without a second hint', () => {
      const s = startCups('preschool', new Rng(1));
      const score = { hints: 0 };
      for (let i = 0; i < 2; i++) {
        pour(s, 0.9);
        releaseCup(s, 'preschool', true, score);
        emptyCup(s);
        recoverTray(s);
      }
      pour(s, 0.5);
      expect(releaseCup(s, 'preschool', true, score)).toBe('served');
      expect(s.helped).toBe(false);
      expect(s.overfills).toBe(0);
      for (let i = 0; i < 2; i++) {
        pour(s, 0.9);
        releaseCup(s, 'preschool', true, score);
        emptyCup(s);
        recoverTray(s);
      }
      expect(s.helped).toBe(true);
      expect(score.hints).toBe(1);
    });

    it('at toddler any water serves and nothing is ever helped', () => {
      const s = startCups('toddler', new Rng(1));
      const score = { hints: 0 };
      pour(s, 0.9);
      expect(releaseCup(s, 'toddler', true, score)).toBe('served');
      pour(s, 0.1);
      expect(releaseCup(s, 'toddler', true, score)).toBe('served');
      expect(score.hints).toBe(0);
    });

    it('a release without pouring does nothing; an under-filled cup asks for more', () => {
      for (const band of BANDS) {
        const s = startCups(band, new Rng(2));
        const score = { hints: 0 };
        expect(releaseCup(s, band, false, score)).toBe('none');
        pour(s, 0.1);
        expect(releaseCup(s, band, true, score)).toBe(thirdAmounts(band).counted ? 'more' : 'served');
        expect(score.hints).toBe(0);
      }
      const s = startCups('prek', new Rng(2));
      pour(s, 0.5);
      expect(atLine(s)).toBe(true);
    });
  });

  describe('the fireflies', () => {
    const close = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

    it('every seed and band gives the right count, inside the meadow, spaced, with a demo loop', () => {
      for (const band of BANDS) {
        const a = thirdAmounts(band);
        for (const seed of SEEDS) {
          const pts = meadow(band, new Rng(seed));
          expect(pts).toHaveLength(a.flies);
          for (const p of pts) {
            expect(p.x).toBeGreaterThanOrEqual(0);
            expect(p.x).toBeLessThanOrEqual(MEADOW.w);
            expect(p.y).toBeGreaterThanOrEqual(0);
            expect(p.y).toBeLessThanOrEqual(MEADOW.h);
          }
          for (let i = 0; i < pts.length; i++)
            for (let j = i + 1; j < i + pts.length && j < pts.length; j++)
              expect(close(pts[i], pts[j])).toBeGreaterThanOrEqual(FLY_GAP - 1e-6);
          expect(demoLoop(pts, a.want, 34)).not.toBeNull();
        }
      }
    });

    it('preschool clusters hold three and two, apart from each other, and meet the gap', () => {
      for (const seed of SEEDS) {
        const pts = clusters(new Rng(seed));
        expect(pts).toHaveLength(5);
        const cx = (ps: Point[]) => ({
          x: ps.reduce((s, p) => s + p.x, 0) / ps.length,
          y: ps.reduce((s, p) => s + p.y, 0) / ps.length,
        });
        const a = cx(pts.slice(0, 3));
        const b = cx(pts.slice(3));
        expect(close(a, b)).toBeGreaterThan(FLY_GAP);
        for (const p of pts.slice(0, 3)) expect(close(p, a)).toBeCloseTo(80);
        expect(close(pts[3], pts[4])).toBeCloseTo(130);
        for (let i = 0; i < 5; i++)
          for (let j = i + 1; j < 5; j++)
            expect(close(pts[i], pts[j])).toBeGreaterThanOrEqual(FLY_GAP - 1e-6);
        expect(demoLoop(pts, 3, 34)).not.toBeNull();
      }
    });

    const ring = (c: Point, r: number): Point[] => [
      { x: c.x - r, y: c.y - r },
      { x: c.x + r, y: c.y - r },
      { x: c.x + r, y: c.y + r },
      { x: c.x - r, y: c.y + r },
    ];

    it('a short trail is small, a loop around none is free, with no miss', () => {
      const flies = meadow('prek', new Rng(5));
      const score = { misses: 0, hints: 0 };
      const trick = { wrong: 0 };
      expect(judgeLoop('prek', ring(flies[0], 10), flies, score, trick).verdict).toBe('small');
      const empty = ring({ x: -500, y: -500 }, 100);
      expect(judgeLoop('prek', empty, flies, score, trick).verdict).toBe('free');
      expect(score).toEqual({ misses: 0, hints: 0 });
      expect(trick.wrong).toBe(0);
      expect(LOOP_MIN).toBe(120);
    });

    it('the right count catches; wrong counts miss, the second miss hints once, the third adds nothing', () => {
      for (const band of ['preschool', 'prek', 'school'] as const) {
        const a = thirdAmounts(band);
        const flies = meadow(band, new Rng(9));
        const right = demoLoop(flies, a.want, 34)!;
        const wrong = demoLoop(flies, a.want - 1, 34)!;
        const score = { misses: 0, hints: 0 };
        const trick = { wrong: 0 };
        expect(judgeLoop(band, right.loop, flies, score, trick).verdict).toBe('catch');
        expect(score.misses).toBe(0);
        const results: number[][] = [];
        for (let i = 1; i <= 3; i++) {
          const r = judgeLoop(band, wrong.loop, flies, score, trick);
          expect(r.verdict).toBe('miss');
          results.push([score.misses, score.hints]);
        }
        expect(results).toEqual([
          [1, 0],
          [2, 1],
          [3, 1],
        ]);
      }
    });

    it('at toddler a loop around any catches and nothing is counted', () => {
      for (const seed of SEEDS.slice(0, 30)) {
        const flies = meadow('toddler', new Rng(seed));
        const score = { misses: 0, hints: 0 };
        const trick = { wrong: 0 };
        for (const n of [1, 2, 3]) {
          const d = demoLoop(flies, n, 34);
          if (d) expect(judgeLoop('toddler', d.loop, flies, score, trick).verdict).toBe('catch');
        }
        expect(score).toEqual({ misses: 0, hints: 0 });
        expect(trick.wrong).toBe(0);
      }
    });
  });

  describe('the bot', () => {
    it('finishes every trick with no misses and no hints', () => {
      for (const band of BANDS)
        for (const seed of SEEDS.slice(0, 40)) {
          const a = thirdAmounts(band);
          const score = { misses: 0, hints: 0 };

          let crank = crankStep(startCrank(), 0.4);
          let guard = 0;
          while (halfTurns(crank) < a.halves && guard++ < 10) {
            const from = crank.anchor ?? 0.4;
            crank = crankLift(crank);
            crank = crankStep(crank, from);
            for (const p of crankCircle(from)) crank = crankStep(crank, Math.atan2(p.y, p.x));
          }
          expect(halfTurns(crank)).toBeGreaterThanOrEqual(a.halves);

          const cups = startCups(band, new Rng(seed));
          let last = '';
          for (let i = 0; i < 3; i++) {
            pour(cups, pourNeeded(cups));
            last = releaseCup(cups, band, true, score);
          }
          expect(last).toBe('done');

          const flies = meadow(band, new Rng(seed));
          const d = demoLoop(flies, a.want, 34)!;
          expect(judgeLoop(band, d.loop, flies, score, { wrong: 0 }).verdict).toBe('catch');
          expect(score).toEqual({ misses: 0, hints: 0 });
        }
    });
  });
});
