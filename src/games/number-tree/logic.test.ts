import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS, PLANS, SLOT, TILE, WAYS_PER_ROUND, choosesSign, hintWay, judge, layoutFor, makeRound, made, planFor, solutions,
  stickerNumber, wayKey,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

describe('Number Tree rounds', () => {
  for (let level = 1; level <= PLANS.length; level++) {
    const plan = planFor(level);
    it(`level ${level}: every tray can be finished in two different ways, inside the level's numbers`, () => {
      for (const seed of SEEDS) {
        const { target, tray } = makeRound(level, new Rng(seed));
        expect(target).toBeGreaterThanOrEqual(plan.target[0]);
        expect(target).toBeLessThanOrEqual(plan.target[1]);
        expect(tray).toHaveLength(plan.tiles);
        for (const v of tray) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(plan.maxTile); }
        const ways = solutions(tray, plan.ops, target);
        expect(ways.length).toBeGreaterThanOrEqual(WAYS_PER_ROUND);
        expect(new Set(ways.map((w) => wayKey(tray[w.a], w.op, tray[w.b]))).size).toBe(ways.length);
        for (const w of ways) expect(made(tray[w.a], w.op, tray[w.b])).toBe(target);
      }
    });
  }

  it('level 3 trays can always be done with a plus and with a take away', () => {
    for (const seed of SEEDS) {
      const { target, tray } = makeRound(3, new Rng(seed));
      const ops = new Set(solutions(tray, planFor(3).ops, target).map((w) => w.op));
      expect(ops).toEqual(new Set(['plus', 'minus']));
    }
  });

  it('levels 1 and 2 add only, and the sign is not a choice until level 3', () => {
    expect(planFor(1).ops).toEqual(['plus']);
    expect(planFor(2).ops).toEqual(['plus']);
    expect([1, 2, 3].map(choosesSign)).toEqual([false, false, true]);
  });

  it('is the same round for the same seed', () => {
    expect(makeRound(2, new Rng(9))).toEqual(makeRound(2, new Rng(9)));
  });

  it('is a school ladder of three levels and a level beyond the plans reads as the last', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 3 });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(9)).toBe(PLANS[2]);
  });
});

describe('Number Tree answers', () => {
  it('accepts any sum that reaches the number, the other way round counting as the same way', () => {
    expect(judge(7, 'plus', 5, 12, [])).toMatchObject({ kind: 'right', made: 12 });
    expect(judge(5, 'plus', 7, 12, [wayKey(7, 'plus', 5)])).toMatchObject({ kind: 'same' });
    expect(judge(8, 'plus', 4, 12, [wayKey(7, 'plus', 5)])).toMatchObject({ kind: 'right' });
  });

  it('says what a wrong try made, and that is a miss', () => {
    expect(judge(3, 'plus', 5, 12, [])).toEqual({ kind: 'wrong', made: 8 });
    expect(judge(9, 'minus', 2, 12, [])).toEqual({ kind: 'wrong', made: 7 });
  });

  it('treats taking more than she has as nothing made, not a miss, and taking away keeps its order', () => {
    expect(judge(2, 'minus', 9, 7, [])).toMatchObject({ kind: 'below' });
    expect(judge(9, 'minus', 2, 7, [])).toMatchObject({ kind: 'right' });
    expect(wayKey(9, 'minus', 2)).not.toBe(wayKey(2, 'minus', 9));
    expect(wayKey(2, 'plus', 9)).toBe(wayKey(9, 'plus', 2));
  });

  it('counts a take away and a plus to the same number as different ways', () => {
    expect(wayKey(9, 'minus', 4)).not.toBe(wayKey(4, 'plus', 5));
    expect(judge(4, 'plus', 5, 5 + 4, [wayKey(9, 'minus', 4)])).toMatchObject({ kind: 'right' });
  });

  it('never needs the same fruit twice', () => {
    expect(solutions([6, 3], ['plus'], 12)).toEqual([]);
    expect(solutions([6, 6], ['plus'], 12)).toHaveLength(1);
  });

  it('lights a fruit that starts a way she has not found, and nothing once all are found', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const level = 1 + (seed % 3), plan = planFor(level);
      const { target, tray } = makeRound(level, new Rng(seed));
      const ways = solutions(tray, plan.ops, target);
      const firstKey = wayKey(tray[ways[0].a], ways[0].op, tray[ways[0].b]);
      const hint = hintWay(tray, plan.ops, target, [firstKey]);
      expect(hint).not.toBeNull();
      expect(wayKey(tray[hint!.a], hint!.op, tray[hint!.b])).not.toBe(firstKey);
      expect(made(tray[hint!.a], hint!.op, tray[hint!.b])).toBe(target);
      const all = ways.map((w) => wayKey(tray[w.a], w.op, tray[w.b]));
      expect(hintWay(tray, plan.ops, target, all)).toBeNull();
    }
  });
});

describe('Number Tree layout', () => {
  const views: [number, number][] = [[1024, 768], [768, 1024], [1366, 1024], [1180, 820], [1024, 1366]];
  for (const [w, h] of views) {
    for (const level of [1, 2, 3]) {
      it(`${w}x${h} level ${level}: every touch target is at least 100 units, on screen, apart, and clear of the pet corner`, () => {
        const plan = planFor(level), signs = choosesSign(level);
        const l = layoutFor(w, h, plan.tiles, signs);
        const boxes = [
          ...l.tiles.map((p) => ({ ...p, s: TILE })),
          ...[l.a, l.b].map((p) => ({ ...p, s: SLOT })),
          { ...l.check, s: SLOT },
          ...l.leaves.map((p) => ({ ...p, s: TILE })),
        ];
        for (const b of boxes) {
          expect(b.s).toBeGreaterThanOrEqual(100);
          expect(b.x - b.s / 2).toBeGreaterThanOrEqual(0);
          expect(b.x + b.s / 2).toBeLessThanOrEqual(w);
          expect(b.y - b.s / 2).toBeGreaterThanOrEqual(0);
          expect(b.y + b.s / 2).toBeLessThanOrEqual(h);
          // The pet's corner: the bottom-left 170 by 170.
          expect(b.x - b.s / 2 < 170 && b.y + b.s / 2 > h - 170).toBe(false);
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const p = boxes[i], q = boxes[j], reach = (p.s + q.s) / 2;
            expect(Math.abs(p.x - q.x) >= reach || Math.abs(p.y - q.y) >= reach).toBe(true);
          }
        }
        expect(l.leaves).toHaveLength(signs ? 2 : 0);
        // Below the sign and the found list, not under the home button.
        expect(l.a.y - SLOT / 2).toBeGreaterThan(l.found.y);
      });
    }
  }
});

describe('Number Tree sticker', () => {
  it('shows a numeral from 2 to 9', () => {
    for (const seed of SEEDS) { const n = stickerNumber(seed); expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(9); }
  });
});
