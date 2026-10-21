import { checkPour, emptyCup, pour, pourAmount, pourHint, POUR_DISTANCE, POUR_TOLERANCE, recoverTray, startPour } from './logic';
import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { DESIGN_H, DESIGN_W } from '../../engine/view';
import {
  FILL_PLANS,
  MAX_PIECES,
  SPOT_GAP,
  basketSlot,
  countSign,
  describeFill,
  hintFor,
  insideCount,
  landingSpots,
  groundTap,
  nextTouch,
  planFor,
  startState,
  tap,
  targetFor,
  type FillState,
  type FillTap,
  type Rect,
  BASKET_HIT,
  FILL_LEVELS,
  PAIR_REQUESTS,
  PAIR_SCALE,
  kindFor,
  pairLayout,
  pairNext,
  pairTap,
  rightBasket,
  startPair,
} from './logic';

const fresh = (level: number, seed = 1) => {
  const plan = planFor(level);
  return startState(plan, targetFor(plan, new Rng(seed)));
};

/** Every tap a person could make right now. */
function liveTaps(s: FillState): FillTap[] {
  const taps: FillTap[] = [{ on: 'basket' }];
  s.inside.forEach((inside, i) => !inside && taps.push({ on: 'piece', i }));
  if (s.target !== null) taps.push({ on: 'tick' });
  return taps;
}

describe('Fill and Dump levels', () => {
  it('has four plans: two tip-out levels, then two counting levels with a range to draw from', () => {
    expect(FILL_PLANS).toHaveLength(4);
    expect(FILL_PLANS.slice(0, 2).every((p) => p.count === null && p.dumps >= 1)).toBe(true);
    expect(FILL_PLANS.slice(2).every((p) => p.count !== null && p.dumps === 0)).toBe(true);
    for (const p of FILL_PLANS) if (p.count) expect(p.count[1]).toBeLessThan(p.pieces); // there is always fruit left over to leave out
    expect(planFor(0)).toBe(FILL_PLANS[0]);
    expect(planFor(99)).toBe(FILL_PLANS[3]);
    expect(MAX_PIECES).toBe(7);
  });

  it('draws the asked number inside its range and describes every level', () => {
    for (let level = 3; level <= 4; level++) {
      const [lo, hi] = planFor(level).count!;
      const seen = new Set<number>();
      for (let seed = 1; seed <= 60; seed++) {
        const n = targetFor(planFor(level), new Rng(seed))!;
        expect(n).toBeGreaterThanOrEqual(lo);
        expect(n).toBeLessThanOrEqual(hi);
        seen.add(n);
      }
      expect(seen.size).toBe(hi - lo + 1);
    }
    expect(targetFor(planFor(1), new Rng(1))).toBeNull();
    for (let level = 1; level <= 4; level++) expect(describeFill(level).length).toBeGreaterThan(10);
  });
});

describe('Fill and Dump tip-out levels', () => {
  it('cannot go wrong: any taps at all never make a miss or a hint, and always finish', () => {
    for (const level of [1, 2]) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const s = fresh(level, seed);
        let taps = 0;
        // Random taps on live targets and open ground; the bound is the most a round could take (every tip, then every piece, plus slack).
        const bound = s.plan.dumps * (1 + s.plan.pieces) + 1;
        while (!s.done && taps < bound * 4) {
          const spots = Array.from({ length: s.plan.pieces }, (_, x) => ({ x: x * 128, y: 500 }));
          const action = rng.chance(0.5) ? groundTap(s, spots, { x: rng.range(0, 1024), y: rng.range(384, 768) })! : rng.pick(liveTaps(s));
          tap(s, action);
          taps++;
        }
        expect(s.done, `level ${level} seed ${seed}`).toBe(true);
        expect(taps).toBeLessThanOrEqual(bound * 4);
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(0);
        expect(s.dumps).toBe(s.plan.dumps);
      }
    }
  });

  it('ground tips a full basket, scoops the nearest outside fruit, and ignores counting and done states', () => {
    const spots = [{ x: 200, y: 500 }, { x: 400, y: 600 }, { x: 600, y: 500 }];
    const s = fresh(1);
    expect(tap(s, groundTap(s, spots, spots[2])!)).toEqual({ kind: 'dump' });
    expect(tap(s, groundTap(s, spots, spots[2])!)).toMatchObject({ kind: 'in', i: 2 });
    expect(tap(s, groundTap(s, spots, spots[2])!)).toMatchObject({ kind: 'in', i: 1 });
    tap(s, groundTap(s, spots, spots[0])!);
    expect(s.done).toBe(true);
    expect(groundTap(s, spots, spots[0])).toBeNull();
    for (const level of [3, 4]) {
      const count = fresh(level);
      const before = structuredClone(count);
      expect(groundTap(count, spots, spots[0])).toBeNull();
      expect(count).toEqual(before);
    }
  });

  it('tips out a full basket, then a tap on the basket or on a piece scoops one back', () => {
    const s = fresh(1);
    expect(s.order).toHaveLength(3);
    expect(tap(s, { on: 'piece', i: 0 })).toEqual({ kind: 'ignored' }); // a piece in the basket is not a target
    expect(tap(s, { on: 'basket' })).toEqual({ kind: 'dump' });
    expect(s.inside).toEqual([false, false, false]);
    expect(tap(s, { on: 'basket', pick: 2 })).toEqual({ kind: 'in', i: 2, n: 1, refilled: false });
    expect(tap(s, { on: 'piece', i: 0 })).toEqual({ kind: 'in', i: 0, n: 2, refilled: false });
    expect(tap(s, { on: 'piece', i: 0 })).toEqual({ kind: 'ignored' }); // already in
    expect(tap(s, { on: 'basket', pick: 2 })).toMatchObject({ kind: 'in', i: 1 }); // a stale pick falls back to a piece still out
    expect(s.done).toBe(true);
    expect(tap(s, { on: 'basket' })).toEqual({ kind: 'ignored' });
  });

  it('level 2 fills the basket again after the first tip, and finishes only after the second', () => {
    const s = fresh(2);
    tap(s, { on: 'basket' });
    for (let i = 0; i < 3; i++) expect(tap(s, { on: 'piece', i })).toMatchObject({ refilled: false });
    expect(tap(s, { on: 'piece', i: 3 })).toMatchObject({ refilled: true });
    expect(s.done).toBe(false);
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'ignored' });
    expect(tap(s, { on: 'basket' })).toEqual({ kind: 'dump' });
    for (let i = 0; i < 4; i++) tap(s, { on: 'piece', i });
    expect(s.done).toBe(true);
    expect(s.dumps).toBe(2);
  });
});

describe('Fill and Dump counting levels', () => {
  it('starts with an empty basket and every piece out', () => {
    for (const level of [3, 4]) {
      const s = fresh(level);
      expect(s.order).toEqual([]);
      expect(s.inside.every((v) => !v)).toBe(true);
      expect(s.target).toBeGreaterThan(0);
    }
  });

  it('a piece goes in, the basket takes the latest back out, and the check judges the count', () => {
    const s = startState(planFor(3), 2);
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'again' }); // nothing in yet: say it again, no miss
    expect(s.misses).toBe(0);
    expect(tap(s, { on: 'piece', i: 4 })).toEqual({ kind: 'in', i: 4, n: 1, refilled: false });
    expect(tap(s, { on: 'piece', i: 1 })).toEqual({ kind: 'in', i: 1, n: 2, refilled: false });
    expect(tap(s, { on: 'piece', i: 0 })).toMatchObject({ n: 3 });
    expect(tap(s, { on: 'basket' })).toEqual({ kind: 'out', i: 0, n: 2 }); // the latest comes out first
    expect(s.inside[0]).toBe(false);
    expect(s.done).toBe(false); // having the right number in does not end the round: the check does
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'done' });
    expect(s.done).toBe(true);
    expect([s.misses, s.hints]).toEqual([0, 0]);
  });

  it('the count sign fills one dot per piece in the basket and hangs the rest outside the card', () => {
    for (const level of [3, 4]) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = fresh(level, seed);
        const n = s.target!;
        expect(countSign(s)).toEqual({ slots: n, filled: 0, extras: 0 });
        for (let i = 0; i < s.plan.pieces; i++) {
          tap(s, { on: 'piece', i });
          const sign = countSign(s)!;
          expect(sign.slots).toBe(n);
          expect(sign.filled).toBe(Math.min(insideCount(s), n));
          expect(sign.extras).toBe(Math.max(0, insideCount(s) - n));
          expect(sign.filled + sign.extras).toBe(insideCount(s));
        }
        expect(countSign(s)!.extras).toBe(s.plan.pieces - n);
        while (insideCount(s) > n) tap(s, { on: 'basket' });
        expect(countSign(s)).toEqual({ slots: n, filled: n, extras: 0 });
        expect(tap(s, { on: 'tick' }).kind).toBe('done');
      }
    }
    expect(countSign(fresh(1))).toBeNull();
    expect(countSign(fresh(2))).toBeNull();
  });

  it('a wrong check is a miss; every second miss brings a hint that leads to the answer', () => {
    const s = startState(planFor(4), 4);
    tap(s, { on: 'piece', i: 0 });
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'wrong', have: 1, hint: null });
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'wrong', have: 1, hint: 'add' });
    expect([s.misses, s.hints]).toEqual([2, 1]);
    for (let i = 1; i <= 5; i++) tap(s, { on: 'piece', i });
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'wrong', have: 6, hint: null });
    expect(tap(s, { on: 'tick' })).toEqual({ kind: 'wrong', have: 6, hint: 'remove' });
    expect(hintFor(4, 4)).toBe('check');
    expect(hintFor(3, 4)).toBe('add');
    expect(hintFor(5, 4)).toBe('remove');
  });

  it('has no dead end: from any reachable state, the ghost finger finishes within a few taps and makes no miss', () => {
    for (const level of [3, 4]) {
      for (let seed = 1; seed <= 150; seed++) {
        const rng = new Rng(seed);
        const s = fresh(level, seed);
        // Wander: only pieces and the basket, never the check.
        for (let i = 0; i < rng.int(0, 14); i++) tap(s, rng.pick(liveTaps(s).filter((t) => t.on !== 'tick')));
        let steps = 0;
        let next = nextTouch(s);
        while (next && steps < 20) {
          tap(s, next);
          steps++;
          next = nextTouch(s);
        }
        expect(s.done, `level ${level} seed ${seed}`).toBe(true);
        expect(steps).toBeLessThanOrEqual(s.plan.pieces + 1);
        expect(s.misses).toBe(0);
      }
    }
  });

  it('the ghost finger tips a full basket, scoops pieces, and reaches done in every tip-out level', () => {
    for (const level of [1, 2]) {
      const s = fresh(level);
      let steps = 0;
      for (let next = nextTouch(s); next && steps < 40; next = nextTouch(s)) {
        tap(s, next);
        steps++;
      }
      expect(s.done).toBe(true);
      expect(steps).toBe(s.plan.dumps * (1 + s.plan.pieces));
      expect(nextTouch(s)).toBeNull();
    }
  });
});

describe('Fill and Dump placement', () => {
  /** The ground a round lands fruit on in a view of this size: below the basket, clear of the pet and the edges. */
  const ground = (w: number, h: number): Rect => ({ x: 170, y: h * 0.52, w: w - 170 - 50, h: h * 0.48 - 100 });
  const views: [number, number][] = [
    [DESIGN_W, DESIGN_H],
    [DESIGN_W + 340, DESIGN_H], // a wide laptop
    [DESIGN_H, DESIGN_W], // an iPad held upright
    [DESIGN_H, DESIGN_W + 300], // a tall phone shape
  ];

  it('lands every piece of every level apart from the others, inside the ground, in every view', () => {
    for (const [w, h] of views) {
      const rect = ground(w, h);
      for (let seed = 1; seed <= 100; seed++) {
        const spots = landingSpots(new Rng(seed), MAX_PIECES, rect);
        expect(spots, `${w}x${h} has room for ${MAX_PIECES}`).not.toBeNull();
        for (const a of spots!) {
          expect(a.x).toBeGreaterThanOrEqual(rect.x);
          expect(a.x).toBeLessThanOrEqual(rect.x + rect.w);
          expect(a.y).toBeGreaterThanOrEqual(rect.y);
          expect(a.y).toBeLessThanOrEqual(rect.y + rect.h);
          // Clear of the pet in the bottom-left corner and the home button at the top left.
          expect(a.x).toBeGreaterThan(150);
        }
        for (let i = 0; i < spots!.length; i++) {
          for (let j = i + 1; j < spots!.length; j++) {
            expect(Math.hypot(spots![i].x - spots![j].x, spots![i].y - spots![j].y)).toBeGreaterThanOrEqual(SPOT_GAP - 1e-6);
          }
        }
      }
    }
  });

  it('is the same for the same seed, and says so when a rect is too small', () => {
    const rect = ground(DESIGN_W, DESIGN_H);
    expect(landingSpots(new Rng(5), 5, rect)).toEqual(landingSpots(new Rng(5), 5, rect));
    expect(landingSpots(new Rng(5), 0, rect)).toEqual([]);
    expect(landingSpots(new Rng(5), 4, { x: 0, y: 0, w: 200, h: 200 })).toBeNull();
  });

  it('sits seven pieces in the basket without two on the same spot', () => {
    const slots = Array.from({ length: MAX_PIECES }, (_, i) => basketSlot(i));
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) expect(Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y)).toBeGreaterThan(30);
    }
    for (const s of slots) expect(Math.abs(s.x)).toBeLessThanOrEqual(110);
  });
});

describe('Pouring to a line', () => {
  it('has three reachable, distinct lines, first half full, seeded order after that', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = startPour(new Rng(seed));
      expect(s).toEqual(startPour(new Rng(seed)));
      expect(s.targets[0]).toBe(0.5);
      expect([...s.targets].sort()).toEqual([0.25, 0.5, 0.75]);
      for (const target of s.targets) {
        pour(s, target);
        expect(pourHint(s)).toBe('check');
        checkPour(s);
      }
      expect(s.done).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
  });
  it('conserves all water through overflows, emptying and recovery; any experiment can be retried', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const s = startPour(rng);
      for (let i = 0; i < 40; i++) {
        pour(s, rng.range(0, 4));
        expect(s.cup).toBeLessThanOrEqual(1);
        expect(s.jug + s.cup + s.tray).toBeCloseTo(3);
        if (rng.chance(0.5)) emptyCup(s);
        if (rng.chance(0.5)) recoverTray(s);
        expect(Math.min(s.cup, s.jug, s.tray)).toBeGreaterThanOrEqual(-1e-9);
      }
      emptyCup(s); recoverTray(s);
      pour(s, s.targets[0]);
      expect(checkPour(s)).toBe('next');
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
  });
  it('checks the visible tolerance, empty checks are reminders, hints occur only once per cup', () => {
    const s = startPour(new Rng(1));
    expect(checkPour(s)).toBe('again');
    pour(s, 0.9);
    expect(checkPour(s)).toBe('wrong');
    expect(s.hints).toBe(0);
    expect(checkPour(s)).toBe('wrong');
    expect(s.hints).toBe(1);
    checkPour(s); checkPour(s);
    expect(s.hints).toBe(1);
    expect(pourHint(s)).toBe('empty');
    emptyCup(s); recoverTray(s);
    pour(s, s.targets[0] - POUR_TOLERANCE);
    expect(checkPour(s)).toBe('next');
    expect(s.helped).toBe(false);
    pour(s, s.targets[1] - POUR_TOLERANCE - 0.001);
    expect(pourHint(s)).toBe('more');
    checkPour(s); checkPour(s);
    expect(s.hints).toBe(2);
  });
  it('measures displacement, handles bad amounts, and freezes a completed round', () => {
    expect(pourAmount(-100)).toBe(0);
    expect(pourAmount(POUR_DISTANCE / 2)).toBe(0.5);
    expect(pourAmount(POUR_DISTANCE * 8)).toBe(3);
    const s = startPour(new Rng(1));
    pour(s, NaN); pour(s, Infinity); pour(s, -1);
    expect(s.jug).toBe(3);
    for (const target of s.targets) { pour(s, target); checkPour(s); }
    const before = structuredClone(s);
    pour(s, 1); emptyCup(s); recoverTray(s);
    expect(checkPour(s)).toBe('ignored');
    expect(s).toEqual(before);
  });
});

describe('Full and empty (level 6)', () => {
  it('routes each level ID through the plan table: basket 1–4, the jug at 5, the pair at 6', () => {
    expect([1, 2, 3, 4, 5, 6].map(kindFor)).toEqual(['basket', 'basket', 'basket', 'basket', 'pour', 'pair']);
    expect(Object.keys(FILL_LEVELS).map(Number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(describeFill(6)).toMatch(/full/i);
    expect(describeFill(5)).toMatch(/jug/);
  });

  it('asks four requests that alternate, each with exactly one right basket, and the full one on each side twice', () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const s = startPair(new Rng(seed));
      expect(s.requests).toHaveLength(PAIR_REQUESTS);
      for (let i = 1; i < s.requests.length; i++) expect(s.requests[i].ask).not.toBe(s.requests[i - 1].ask);
      expect(s.requests.filter((r) => r.full === 0)).toHaveLength(2);
      for (const r of s.requests) {
        const right = rightBasket(r);
        // The full basket is the one to tip, the empty one (the other side) the one to fill: never both, never neither.
        expect(right === r.full).toBe(r.ask === 'tip');
      }
      firsts.add(`${s.requests[0].ask}${s.requests.map((r) => r.full).join('')}`);
    }
    // Which comes first and where the full one stands vary by seed, so position cannot be memorized.
    expect(firsts.size).toBeGreaterThan(6);
  });

  it('the ghost finger finishes with no miss', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = startPair(new Rng(seed));
      let taps = 0;
      for (let side = pairNext(s); side !== null; side = pairNext(s)) {
        expect(pairTap(s, side).kind).toBe('right');
        taps++;
      }
      expect([s.done, s.misses, s.hints, taps]).toEqual([true, 0, 0, PAIR_REQUESTS]);
      expect(pairTap(s, 0).kind).toBe('ignored');
    }
  });

  it('a wrong basket is one miss; the second on one request brings the one hint, and the count starts over on the next', () => {
    const s = startPair(new Rng(3));
    const wrong = (rightBasket(s.requests[0]) === 0 ? 1 : 0) as 0 | 1;
    expect(pairTap(s, wrong)).toEqual({ kind: 'wrong', ask: s.requests[0].ask, hint: false });
    expect(pairTap(s, wrong)).toMatchObject({ kind: 'wrong', hint: true });
    expect(pairTap(s, wrong)).toMatchObject({ kind: 'wrong', hint: false });
    expect([s.misses, s.hints, s.round]).toEqual([3, 1, 0]);
    expect(pairTap(s, pairNext(s)!)).toMatchObject({ kind: 'right', done: false });
    const wrong2 = (rightBasket(s.requests[1]) === 0 ? 1 : 0) as 0 | 1;
    pairTap(s, wrong2);
    expect(pairTap(s, wrong2)).toMatchObject({ kind: 'wrong', hint: true });
    expect([s.misses, s.hints]).toEqual([5, 2]);
  });

  it('stands both baskets apart with 100-unit touch boxes, the pile between them, all on screen and clear of the pet, in every view', () => {
    const views: [number, number][] = [
      [DESIGN_W, DESIGN_H],
      [DESIGN_W + 340, DESIGN_H],
      [DESIGN_H, DESIGN_W],
      [DESIGN_H, DESIGN_W + 300],
    ];
    const w0 = BASKET_HIT.halfW * 2 * PAIR_SCALE;
    const h0 = (BASKET_HIT.top + BASKET_HIT.bottom) * PAIR_SCALE;
    expect(Math.min(w0, h0)).toBeGreaterThanOrEqual(100);
    for (const [w, h] of views) {
      const l = pairLayout(w, h);
      const half = BASKET_HIT.halfW * PAIR_SCALE;
      const [left, right] = l.xs;
      expect(left - half, `${w}x${h} left edge`).toBeGreaterThanOrEqual(40);
      expect(right + half, `${w}x${h} right edge`).toBeLessThanOrEqual(w - 40);
      expect(right - left - 2 * half, 'a gap between the baskets').toBeGreaterThanOrEqual(80);
      expect(l.feetY - BASKET_HIT.top * PAIR_SCALE - 130 * PAIR_SCALE, 'the handle under the corner buttons').toBeGreaterThan(130);
      for (const p of l.pile) {
        expect(p.x).toBeGreaterThan(left + half - 60);
        expect(p.x).toBeLessThan(right - half + 60);
      }
      // The pile and a tipped basket's fruit stay a fruit's width apart.
      for (const p of l.pile) for (const q of [...l.landing[0], ...l.landing[1]]) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(90);
      // Everything sits above the bottom band where the pet stands, and on screen.
      for (const p of [...l.pile, ...l.landing[0], ...l.landing[1]]) {
        expect(p.x).toBeGreaterThan(50);
        expect(p.x).toBeLessThan(w - 50);
        expect(p.y).toBeLessThan(h - 180);
      }
    }
  });
});
