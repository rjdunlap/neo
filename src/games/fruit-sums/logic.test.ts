import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder } from '../../progress/difficulty';
import {
  BASKET_H,
  BASKET_SCALE,
  BASKET_W,
  DROP_GAP,
  DROP_TIME,
  LEVELS,
  LOOKS,
  PLANS,
  SLOT,
  TILE,
  WAYS_PER_ROUND,
  basketSpot,
  choosesSign,
  dropStep,
  hintGlow,
  hintWay,
  judge,
  layoutFor,
  makeRound,
  made,
  planFor,
  shapeFor,
  solutions,
  stickerNumber,
  takenWays,
  wayKey,
  waysNeeded,
  type HintGlow,
  type Op,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

describe('Fruit Sums rounds', () => {
  for (let level = 1; level <= PLANS.length; level++) {
    const plan = planFor(level);
    it(`level ${level}: every tray can be finished in two different ways, inside the level's numbers`, () => {
      for (const seed of SEEDS) {
        const { target, tray } = makeRound(level, new Rng(seed));
        expect(target).toBeGreaterThanOrEqual(plan.target[0]);
        expect(target).toBeLessThanOrEqual(plan.target[1]);
        expect(tray).toHaveLength(plan.tiles);
        for (const v of tray) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(plan.maxTile);
        }
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

  it('levels 1, 2, 4 and 5 add only, and the sign is a choice only at level 3', () => {
    for (const level of [1, 2, 4, 5]) expect(planFor(level).ops).toEqual(['plus']);
    expect([1, 2, 3, 4, 5].map(choosesSign)).toEqual([false, false, true, false, false]);
  });

  it('level 4: the sign holds a sum of two fruit up to 9, and at least two other ways make the same', () => {
    const plan = planFor(4);
    expect(plan.signPair).toBe(true);
    for (const seed of SEEDS) {
      const round = makeRound(4, new Rng(seed));
      const { target, tray, sign } = round;
      expect(sign).toBeDefined();
      const [p, q] = sign!;
      expect(p + q).toBe(target);
      for (const v of [p, q]) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9);
      }
      expect(target).toBeGreaterThanOrEqual(6);
      expect(target).toBeLessThanOrEqual(14);
      const signKey = wayKey(p, 'plus', q);
      const others = solutions(tray, plan.ops, target).filter(
        (w) => wayKey(tray[w.a], w.op, tray[w.b]) !== signKey,
      );
      expect(others.length).toBeGreaterThanOrEqual(WAYS_PER_ROUND);
      expect(takenWays(round, [])).toEqual([signKey]);
      expect(takenWays(round, ['+1,2'])).toEqual([signKey, '+1,2']);
    }
  });

  it('level 4: the sign’s own sum, either way round, is the same way and not a miss', () => {
    expect(judge(6, 'plus', 4, 10, [wayKey(6, 'plus', 4)])).toMatchObject({ kind: 'same' });
    expect(judge(4, 'plus', 6, 10, [wayKey(6, 'plus', 4)])).toMatchObject({ kind: 'same' });
    expect(judge(7, 'plus', 3, 10, [wayKey(6, 'plus', 4)])).toMatchObject({ kind: 'right' });
    expect(judge(5, 'plus', 3, 10, [wayKey(6, 'plus', 4)])).toMatchObject({ kind: 'wrong', made: 8 });
  });

  it('levels 1 to 3 have no sign sum, and nothing is taken before she starts', () => {
    for (const level of [1, 2, 3]) {
      const round = makeRound(level, new Rng(5));
      expect(round.sign).toBeUndefined();
      expect(takenWays(round, [])).toEqual([]);
    }
  });

  it('is the same round for the same seed', () => {
    expect(makeRound(2, new Rng(9))).toEqual(makeRound(2, new Rng(9)));
  });

  it('is a school ladder of five levels with Clear the tree after level 1, and a level beyond the plans reads as the last', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 5, order: [1, 5, 2, 4, 3] });
    expect([...levelsInOrder(LEVELS.school!)].sort()).toEqual(PLANS.map((_, i) => i + 1));
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(9)).toBe(PLANS[4]);
    expect(waysNeeded(planFor(1))).toBe(WAYS_PER_ROUND);
    expect(waysNeeded(planFor(5))).toBe(3);
  });
});

/** Every order of right picks over the fruit still on the tree empties it: no pick ever strands a fruit without a partner. */
function clearsInAnyOrder(tray: readonly number[], target: number, gone: boolean[]): boolean {
  const left = tray.map((_, i) => i).filter((i) => !gone[i]);
  if (left.length === 0) return true;
  let any = false;
  for (const a of left)
    for (const b of left) {
      if (b <= a || tray[a] + tray[b] !== target) continue;
      any = true;
      gone[a] = gone[b] = true;
      const ok = clearsInAnyOrder(tray, target, gone);
      gone[a] = gone[b] = false;
      if (!ok) return false;
    }
  return any;
}

describe('Fruit Sums level 5, Clear the tree', () => {
  const plan = planFor(5);

  it('every tray is six fruit to 9 that make three pairs to a number from 6 to 10, with a wrong pair to try', () => {
    expect(plan.clearTree).toBe(true);
    for (const seed of SEEDS) {
      const round = makeRound(5, new Rng(seed));
      const { target, tray } = round;
      expect(round.clear).toBe(true);
      expect(round.sign).toBeUndefined();
      expect(target).toBeGreaterThanOrEqual(6);
      expect(target).toBeLessThanOrEqual(10);
      expect(tray).toHaveLength(6);
      for (const v of tray) expect(v >= 1 && v <= 9).toBe(true);
      // Not three of the same pair: some two fruit make another number.
      expect(tray.some((v, i) => tray.some((u, j) => j > i && u + v !== target))).toBe(true);
    }
  });

  it('the no-dead-end invariant: each number comes as often as its partner, and any order of right pairs empties the tree', () => {
    for (const seed of SEEDS) {
      const { target, tray } = makeRound(5, new Rng(seed));
      const count = (v: number) => tray.filter((u) => u === v).length;
      for (const v of tray) {
        if (2 * v === target) expect(count(v) % 2).toBe(0);
        else expect(count(v)).toBe(count(target - v));
      }
      expect(
        clearsInAnyOrder(
          tray,
          target,
          tray.map(() => false),
        ),
      ).toBe(true);
    }
  });

  it('counts by fruit, not by number: a second 3 + 7 from two other fruit is a new pair, never "the same way"', () => {
    const round = { target: 10, tray: [3, 7, 3, 7, 5, 5], clear: true as const };
    const taken = takenWays(round, [wayKey(3, 'plus', 7)]);
    expect(taken).toEqual([]);
    expect(judge(7, 'plus', 3, 10, taken).kind).toBe('right');
    expect(judge(3, 'plus', 5, 10, taken)).toEqual({ kind: 'wrong', made: 8 });
  });

  it('fruit in the basket are off the tree: no way, hint or glow uses them', () => {
    const tray = [3, 7, 3, 7, 5, 5];
    const gone = [true, true, false, false, false, false];
    for (const w of solutions(tray, ['plus'], 10, gone)) {
      expect(gone[w.a]).toBe(false);
      expect(gone[w.b]).toBe(false);
    }
    const way = hintWay(tray, ['plus'], 10, [], null, gone)!;
    expect([way.a, way.b].some((i) => gone[i])).toBe(false);
    expect(
      hintWay(
        tray,
        ['plus'],
        10,
        [],
        null,
        tray.map(() => true),
      ),
    ).toBeNull();
  });

  it('following the glow from any boxes, with any pairs already in the basket, builds a right pair from fruit on the tree', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const { target, tray } = makeRound(5, new Rng(seed));
      // Every state reached by taking right pairs, in some order, out of the tree.
      const states: boolean[][] = [tray.map(() => false)];
      for (let n = 0; n < states.length && n < 40; n++) {
        const g = states[n];
        for (let a = 0; a < 6; a++)
          for (let b = a + 1; b < 6; b++)
            if (!g[a] && !g[b] && tray[a] + tray[b] === target && g.filter(Boolean).length < 4) {
              const next = [...g];
              next[a] = next[b] = true;
              states.push(next);
            }
      }
      for (const gone of states) {
        const live = [-1, ...tray.map((_, i) => i).filter((i) => !gone[i])];
        for (const a of live)
          for (const b of live) {
            if (a === b && a >= 0) continue;
            const s = { a: a < 0 ? null : a, b: b < 0 ? null : b };
            let done = false;
            for (let step = 0; step < 6 && !done; step++) {
              const glow = hintGlow(tray, ['plus'], target, [], s.a, s.b, 'plus', gone)!;
              expect(glow).not.toBeNull();
              if ('check' in glow) done = true;
              else if ('tile' in glow) {
                expect(gone[glow.tile]).toBe(false);
                if (s.a === glow.tile) s.a = null;
                else if (s.b === glow.tile) s.b = null;
                else if (s.a === null) s.a = glow.tile;
                else s.b = glow.tile;
              }
            }
            expect(done).toBe(true);
            expect(tray[s.a!] + tray[s.b!]).toBe(target);
          }
      }
    }
  });
});

describe('Fruit Sums answers', () => {
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
      const level = 1 + (seed % 3),
        plan = planFor(level);
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

describe('Fruit Sums layout', () => {
  const views: [number, number][] = [
    [1024, 768],
    [768, 1024],
    [1366, 1024],
    [1180, 820],
    [1024, 1366],
  ];
  for (const [w, h] of views) {
    for (const level of [1, 2, 3, 4, 5]) {
      it(`${w}x${h} level ${level}: every touch target is at least 100 units, on screen, apart, and clear of the pet corner`, () => {
        const plan = planFor(level),
          signs = choosesSign(level);
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
            const p = boxes[i],
              q = boxes[j],
              reach = (p.s + q.s) / 2;
            expect(Math.abs(p.x - q.x) >= reach || Math.abs(p.y - q.y) >= reach).toBe(true);
          }
        }
        expect(l.leaves).toHaveLength(signs ? 2 : 0);
        if (plan.clearTree) {
          // The basket is on screen, clear of the pet corner, and covers no touch target; the six fruit in it stay inside it.
          const k = l.basket;
          expect(k.x - BASKET_W / 2).toBeGreaterThanOrEqual(170);
          expect(k.x + BASKET_W / 2).toBeLessThanOrEqual(w);
          expect(k.y + BASKET_H / 2).toBeLessThanOrEqual(h);
          for (const b of boxes)
            expect(
              Math.abs(b.x - k.x) >= (b.s + BASKET_W) / 2 || Math.abs(b.y - k.y) >= (b.s + BASKET_H) / 2,
            ).toBe(true);
          for (let i = 0; i < plan.tiles; i++) {
            const at = basketSpot(k, i);
            expect(Math.abs(at.x - k.x) + (TILE * BASKET_SCALE) / 2).toBeLessThanOrEqual(BASKET_W / 2);
          }
        }
        // Below the sign and the found list, not under the home button.
        expect(l.a.y - SLOT / 2).toBeGreaterThan(l.found.y);
      });
    }
  }
});

describe('Fruit Sums sticker', () => {
  it('shows a numeral from 2 to 9', () => {
    for (const seed of SEEDS) {
      const n = stickerNumber(seed);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(9);
    }
  });
});

describe('Fruit Sums hint that follows through', () => {
  it('given the fruit in the first box, the hinted way starts with it when one does', () => {
    for (const level of [1, 2, 3]) {
      const ops = planFor(level).ops;
      for (const seed of SEEDS) {
        const { target, tray } = makeRound(level, new Rng(seed));
        for (let first = 0; first < tray.length; first++) {
          const starts = solutions(tray, ops, target).some(
            (w) => tray[w.a] === tray[first] || (w.op === 'plus' && tray[w.b] === tray[first]),
          );
          const way = hintWay(tray, ops, target, [], first)!;
          expect(way).not.toBeNull();
          expect(made(tray[way.a], way.op, tray[way.b])).toBe(target);
          expect(way.a === first).toBe(starts);
          expect(way.b).not.toBe(way.a);
        }
      }
    }
  });

  it('skips ways already found, even when the first box holds their start', () => {
    const tray = [3, 9, 5, 7, 1];
    const way = hintWay(tray, ['plus'], 12, [wayKey(3, 'plus', 9)], 0)!;
    expect(wayKey(tray[way.a], way.op, tray[way.b])).toBe(wayKey(5, 'plus', 7));
  });

  /** Taps the way the game does: a fruit in a box goes home, else it fills the first empty box, else it swaps the second. */
  const tapTile = (s: { a: number | null; b: number | null }, i: number) => {
    if (s.a === i) s.a = null;
    else if (s.b === i) s.b = null;
    else if (s.a === null) s.a = i;
    else s.b = i;
  };

  it('following the glow from any boxes and sign builds an unfound way and lights the check', () => {
    for (const level of [1, 3, 4]) {
      const ops = planFor(level).ops,
        signs = choosesSign(level);
      for (const seed of SEEDS.slice(0, 80)) {
        const round = makeRound(level, new Rng(seed));
        const { target, tray } = round;
        const taken0 = takenWays(round, []);
        const firstWay = hintWay(tray, ops, target, taken0)!;
        const firstKey = wayKey(tray[firstWay.a], firstWay.op, tray[firstWay.b]);
        for (const found of [taken0, takenWays(round, [firstKey])]) {
          for (let a = -1; a < tray.length; a++)
            for (let b = -1; b < tray.length; b++) {
              if (a === b && a >= 0) continue;
              const s = { a: a < 0 ? null : a, b: b < 0 ? null : b };
              let op: Op | null = signs ? 'minus' : 'plus';
              let done = false;
              for (let step = 0; step < 8 && !done; step++) {
                const glow: HintGlow = hintGlow(tray, ops, target, found, s.a, s.b, op)!;
                expect(glow).not.toBeNull();
                if ('check' in glow) done = true;
                else if ('leaf' in glow) op = glow.leaf;
                else tapTile(s, glow.tile);
              }
              expect(done).toBe(true);
              expect(judge(tray[s.a!], op!, tray[s.b!], target, found).kind).toBe('right');
            }
        }
      }
    }
  });

  it('once the glowing start fruit is in the first box, its partner glows next', () => {
    const tray = [3, 9, 5, 8, 1];
    const start = hintGlow(tray, ['plus'], 12, [], null, null, 'plus');
    expect(start).toEqual({ tile: 0 });
    expect(hintGlow(tray, ['plus'], 12, [], 0, null, 'plus')).toEqual({ tile: 1 });
    expect(hintGlow(tray, ['plus'], 12, [], 0, 1, 'plus')).toEqual({ check: true });
  });
});

describe('Fruit Sums looks', () => {
  it('each tree grows its own fruit, and the autumn tree mixes pears and plums', () => {
    expect(LOOKS).toEqual(['orchard', 'cove', 'autumn']);
    expect([0, 1, 2].map((i) => shapeFor('orchard', i))).toEqual(['round', 'round', 'round']);
    expect(shapeFor('cove', 3)).toBe('coconut');
    expect([0, 1].map((i) => shapeFor('autumn', i))).toEqual(['pear', 'plum']);
  });

  it('the drop lands every fruit quickly on falling pentatonic steps', () => {
    expect(5 * DROP_GAP + DROP_TIME).toBeLessThan(1.2);
    const steps = [0, 1, 2, 3, 4, 5].map(dropStep);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThan(steps[i - 1]);
    expect(Math.min(...steps)).toBeGreaterThanOrEqual(1);
  });
});
