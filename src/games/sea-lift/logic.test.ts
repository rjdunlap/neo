import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  AUTHORED, apply, cardAt, cardLayout, check, countAloud, crossesZero, giveHint, HOME_BOX, hintFor, howFarAnswer, howFarCards, LANDING,
  level1, level2, level3, level4, level5, makeRound, MIN_PITCH, nearestLanding, numeral, path, PET_CORNER, pickOrder, roundState, sameSide,
  shaftLayout, startStop, STOPS, stopName, type Box, type HowFar, type Item, type LevelId, type Twin,
} from './logic';

const SEEDS = 500;
const views = [{ w: 1024, h: 768 }, { w: 1024, h: 1365 }, { w: 1366, h: 768 }, { w: 1180, h: 768 }];

/** Play a round straight through, tapping the right stop each time. */
function solve(level: LevelId, items: Item[]) {
  const s = roundState(level, items);
  let guard = 0;
  while (!s.done && guard++ < 50) {
    const c = check(s, hintFor(s));
    expect(c.kind).toBe('right');
    apply(s, c);
  }
  return s;
}

describe('stops', () => {
  it('names every stop from the water, never with a bare sign, and its numeral agrees', () => {
    expect(stopName(0)).toBe('the water');
    expect(stopName(3)).toBe('three above the water');
    expect(stopName(-2, true)).toBe('Two below the water');
    for (const s of STOPS) {
      expect(stopName(s)).not.toMatch(/minus|negative|-|−/);
      if (s < 0) { expect(stopName(s)).toContain('below'); expect(numeral(s)).toBe(`−${-s}`); }
      if (s > 0) { expect(stopName(s)).toContain('above'); expect(numeral(s)).toBe(String(s)); }
    }
    expect(numeral(0)).toBe('0');
  });

  it('walks a ride stop by stop and counts the water by name', () => {
    expect(path(2, -3)).toEqual([1, 0, -1, -2, -3]);
    expect(path(-1, 1)).toEqual([0, 1]);
    expect(countAloud(2, -1)).toBe('One, the water, three');
    expect(crossesZero({ from: 2, to: -3 })).toBe(true);
    expect(crossesZero({ from: 0, to: -3 })).toBe(false);
  });
});

describe('level 1, up or down', () => {
  it('asks for one to five stops each way, both ways at least twice, never the same stop twice running', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = level1(new Rng(seed));
      expect(r).toHaveLength(5);
      for (const [i, ride] of r.entries()) {
        expect(ride.from).toBe(0);
        expect(Math.abs(ride.to)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(ride.to)).toBeLessThanOrEqual(5);
        if (i > 0) expect(ride.to).not.toBe(r[i - 1].to);
      }
      expect(r.filter((x) => x.to > 0).length).toBeGreaterThanOrEqual(2);
      expect(r.filter((x) => x.to < 0).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('level 2, through the water', () => {
  it('rides always cross the water and end off it, in range; two start above and two below', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = level2(new Rng(seed));
      expect(r).toHaveLength(5);
      for (const ride of r) {
        expect(Math.abs(ride.from)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(ride.from)).toBeLessThanOrEqual(4);
        expect(crossesZero(ride)).toBe(true);
        expect(ride.to).not.toBe(0);
        expect(Math.abs(ride.to)).toBeLessThanOrEqual(5);
        expect(Math.abs(ride.to - ride.from)).toBeGreaterThan(Math.abs(ride.from));
      }
      expect(r.filter((x) => x.from > 0).length).toBeGreaterThanOrEqual(2);
      expect(r.filter((x) => x.from < 0).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('level 3, deepest first', () => {
  it('gives three friends at different stops, two below the water, with a pair where the bigger number is lower', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const cases = level3(new Rng(seed));
      expect(cases).toHaveLength(3);
      expect(cases.some((c) => c.mode === 'deepest')).toBe(true);
      expect(cases.some((c) => c.mode === 'highest')).toBe(true);
      expect(cases.some((c) => c.friends.some((f) => f.stop > 0))).toBe(true);
      for (const c of cases) {
        const stops = c.friends.map((f) => f.stop);
        expect(new Set(stops).size).toBe(3);
        expect(new Set(c.friends.map((f) => f.friend)).size).toBe(3);
        const below = stops.filter((s) => s < 0);
        expect(below.length).toBeGreaterThanOrEqual(2);
        // Two below the water: the one with the bigger number is the lower stop.
        const [a, b] = below;
        expect(Math.abs(a) > Math.abs(b) ? a < b : b < a).toBe(true);
      }
    }
  });

  it('accepts exactly the next friend in the asked order', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const items = makeRound(3, new Rng(seed), false);
      const s = roundState(3, items);
      while (!s.done) {
        const it = s.items[s.index];
        if (it.kind !== 'pick') throw new Error('pick');
        const next = pickOrder(it.pick)[s.picked.length].stop;
        for (const f of it.pick.friends) {
          const c = check(s, f.stop);
          if (s.picked.includes(f.stop)) expect(c.kind).toBe('ignore');
          else expect(c.kind).toBe(f.stop === next ? 'right' : 'wrong');
        }
        apply(s, check(s, next));
      }
      expect(s.misses).toBe(0);
    }
  });
});

describe('authored first rounds', () => {
  it('open on the stories the how-to card tells', () => {
    const r1 = AUTHORED[1].map((i) => i.kind === 'ride' && [i.ride.friend, i.ride.to]);
    expect(r1.slice(0, 2)).toEqual([['duck', 3], ['fish', -2]]);
    const r2 = AUTHORED[2].map((i) => i.kind === 'ride' && [i.ride.friend, i.ride.from, i.ride.to]);
    expect(r2.slice(0, 2)).toEqual([['bunny', 2, -3], ['turtle', -1, 3]]);
    const first = AUTHORED[3][0];
    expect(first.kind === 'pick' && pickOrder(first.pick).map((f) => f.stop)).toEqual([-5, -2, 3]);
  });

  it('keep the generated rules, and solve straight through', () => {
    for (const level of [1, 2, 3] as LevelId[]) {
      const s = solve(level, AUTHORED[level]);
      expect(s.misses).toBe(0);
      expect(s.hints).toBe(0);
    }
    const rides1 = AUTHORED[1].flatMap((i) => (i.kind === 'ride' ? [i.ride] : []));
    expect(rides1.filter((r) => r.to > 0).length).toBeGreaterThanOrEqual(2);
    expect(rides1.filter((r) => r.to < 0).length).toBeGreaterThanOrEqual(2);
    for (const i of AUTHORED[2]) if (i.kind === 'ride') expect(crossesZero(i.ride)).toBe(true);
  });

  it('level 3 opens with the -2 before -5 mistake costing one miss, the penguin staying put', () => {
    const s = roundState(3, AUTHORED[3]);
    const c = check(s, -2);
    expect(c).toMatchObject({ kind: 'wrong', right: -5, counted: true, support: false });
    apply(s, c);
    expect(s.misses).toBe(1);
    expect(s.picked).toEqual([]);
    expect(check(s, -2)).toMatchObject({ kind: 'wrong', counted: false });
    apply(s, check(s, -5));
    apply(s, check(s, -2));
    apply(s, check(s, 3));
    expect(s.index).toBe(1);
    expect(s.misses).toBe(1);
  });
});

describe('misses, hints and the supported finish', () => {
  it('counts one miss per distinct wrong stop, one hint per request, then rides there itself', () => {
    const s = roundState(1, AUTHORED[1]); // the duck wants three above the water
    apply(s, check(s, 2));
    apply(s, check(s, 2));
    expect([s.misses, s.hints, s.hinted]).toEqual([1, 0, false]);
    apply(s, check(s, -3));
    expect([s.misses, s.hints, s.hinted]).toEqual([2, 1, true]);
    expect(giveHint(s)).toBe(false);
    expect(giveHint(s)).toBe(false);
    expect(s.hints).toBe(1);
    const third = check(s, 5);
    expect(third).toMatchObject({ kind: 'wrong', support: true });
    apply(s, third);
    expect([s.misses, s.hints, s.index, s.wrong.length, s.hinted]).toEqual([3, 1, 1, 0, false]);
  });

  it('never counts the stop the lift is at, an empty landing, or a picked-up friend', () => {
    const s1 = roundState(1, AUTHORED[1]);
    expect(check(s1, 0).kind).toBe('ignore');
    const s2 = roundState(2, AUTHORED[2]);
    expect(check(s2, 2).kind).toBe('ignore');
    const s3 = roundState(3, AUTHORED[3]);
    expect(check(s3, 1).kind).toBe('ignore');
    apply(s3, check(s3, -5));
    expect(check(s3, -5).kind).toBe('ignore');
  });

  it('Show a hint glows once per request and the glow is the right landing', () => {
    for (let seed = 1; seed <= 50; seed++) for (const level of [1, 2, 3] as LevelId[]) {
      const s = roundState(level, makeRound(level, new Rng(seed), false));
      while (!s.done) {
        giveHint(s); giveHint(s);
        expect(check(s, hintFor(s)).kind).toBe('right');
        apply(s, check(s, hintFor(s)));
      }
      const asks = s.items.reduce((n, i) => n + (i.kind === 'pick' ? i.pick.friends.length : 1), 0);
      expect(s.hints).toBe(asks);
      expect(s.misses).toBe(0);
    }
  });
});

describe('the shaft layout', () => {
  it('fits all eleven stops to scale, landings big and apart, corners clear, on every view', () => {
    for (const v of views) {
      const L = shaftLayout(v)!;
      expect(L).not.toBeNull();
      expect(L.pitch).toBeGreaterThanOrEqual(MIN_PITCH);
      for (const s of STOPS) if (s < 5) expect(L.stopY(s) - L.stopY(s + 1)).toBeCloseTo(L.pitch);
      const boxes = [...L.landings.entries()];
      expect(boxes).toHaveLength(11);
      for (const [i, [stop, b]] of boxes.entries()) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        expect(b.w).toBe(LANDING.w);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h).toBeLessThanOrEqual(v.h);
        expect(b.x).toBeGreaterThan(HOME_BOX.w);
        expect(b.x > PET_CORNER || b.y + b.h < v.h - PET_CORNER).toBe(true);
        for (const [, o] of boxes.slice(i + 1)) {
          const apart = b.x + b.w <= o.x || o.x + o.w <= b.x || b.y + b.h <= o.y || o.y + o.h <= b.y;
          expect(apart).toBe(true);
        }
        expect(nearestLanding(L, b.x + b.w / 2, b.y + b.h / 2)).toBe(stop);
      }
      const c = L.card;
      expect(c.x).toBeGreaterThanOrEqual(HOME_BOX.w);
      expect(c.y + c.h).toBeLessThanOrEqual(v.h - PET_CORNER);
      expect(c.x + c.w).toBeLessThan(Math.min(...boxes.map(([, b]) => b.x)));
    }
  });

  it('refuses a view too short for an even pitch rather than shrink the landings', () => {
    expect(shaftLayout({ w: 1024, h: 600 })).toBeNull();
  });
});

/* Levels 4 and 5 ------------------------------------------------------------------------------------ */

function expectHowFarRound(cases: HowFar[]) {
  expect(cases).toHaveLength(5);
  let side = 0;
  for (const [i, c] of cases.entries()) {
    for (const stop of [c.from.stop, c.to.stop]) {
      expect(Math.abs(stop)).toBeGreaterThanOrEqual(1);
      expect(Math.abs(stop)).toBeLessThanOrEqual(5);
    }
    expect(c.from.friend).not.toBe(c.to.friend);
    if (sameSide(c)) {
      side++;
      expect(i).toBeGreaterThan(0);
      expect(c.from.stop).toBeLessThan(0);
      expect(c.to.stop).toBeLessThan(0);
      expect(c.from.stop).not.toBe(c.to.stop);
    } else {
      expect(Math.abs(c.from.stop)).not.toBe(Math.abs(c.to.stop));
    }
    const k = howFarCards(c.from.stop, c.to.stop);
    expect(new Set(c.cards).size).toBe(3);
    expect([...c.cards].sort((a, b) => a - b)).toEqual([k.right, k.magnitude, k.bothEnds].sort((a, b) => a - b));
    expect(c.cards.filter((v) => v === howFarAnswer(c))).toHaveLength(1);
    for (const v of c.cards) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    if (i > 0) expect(howFarAnswer(c)).not.toBe(howFarAnswer(cases[i - 1]));
  }
  expect(side).toBeLessThanOrEqual(1);
  expect(cases.filter((c) => !sameSide(c)).length).toBeGreaterThanOrEqual(4);
  expect(cases.some((c) => c.from.stop > 0)).toBe(true);
  expect(cases.some((c) => c.from.stop < 0)).toBe(true);
}

function expectTwinRound(cases: Twin[]) {
  expect(cases).toHaveLength(5);
  const docks = cases.map((c, i) => (c.stop === 0 ? i : -1)).filter((i) => i >= 0);
  expect(docks).toHaveLength(1);
  expect(docks[0]).toBeGreaterThan(0);
  expect(cases.filter((c) => c.stop > 0).length).toBeGreaterThanOrEqual(2);
  expect(cases.filter((c) => c.stop < 0).length).toBeGreaterThanOrEqual(2);
  const distances = cases.filter((c) => c.stop !== 0).map((c) => Math.abs(c.stop));
  expect(new Set(distances).size).toBe(4);
  for (const c of cases) {
    expect(Math.abs(c.stop)).toBeLessThanOrEqual(5);
    const twin = -c.stop;
    expect(Math.abs(twin)).toBe(Math.abs(c.stop));
    // Opposites share a side of the zig-zag (even stops left, odd stops right).
    expect(Math.abs(twin % 2)).toBe(Math.abs(c.stop % 2));
  }
}

describe('level 4, how far', () => {
  it('offers the answer, the magnitude mistake and the both-ends mistake as three distinct cards, within the round rules', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const cases = level4(new Rng(seed));
      expectHowFarRound(cases);
      for (const c of cases) positions.add(c.cards.indexOf(howFarAnswer(c)));
    }
    expect([...positions].sort()).toEqual([0, 1, 2]);
    expectHowFarRound(AUTHORED[4].flatMap((i) => (i.kind === 'howfar' ? [i.howfar] : [])));
  });

  it("follows the definition's card table", () => {
    expect(howFarCards(-3, 4)).toEqual({ right: 7, magnitude: 1, bothEnds: 8 });
    expect(howFarCards(2, -5)).toEqual({ right: 7, magnitude: 3, bothEnds: 8 });
    expect(howFarCards(-5, -2)).toEqual({ right: 3, magnitude: 7, bothEnds: 4 });
    expect(howFarCards(-1, 2)).toEqual({ right: 3, magnitude: 1, bothEnds: 4 });
    expect(howFarCards(-5, 4)).toEqual({ right: 9, magnitude: 1, bothEnds: 10 });
    expect(howFarCards(-1, -2)).toEqual({ right: 1, magnitude: 3, bothEnds: 2 });
    // Every pair the generator can draw keeps the three apart and within 1–10.
    for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) {
      if (a === 0 || b === 0 || a === b || (Math.sign(a) !== Math.sign(b) && Math.abs(a) === Math.abs(b))) continue;
      if (Math.sign(a) === Math.sign(b) && a > 0) continue;
      const k = howFarCards(a, b);
      expect(new Set([k.right, k.magnitude, k.bothEnds]).size).toBe(3);
      for (const v of [k.right, k.magnitude, k.bothEnds]) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    }
  });

  it('opens on the fish at three below and the duck at four above, cards 1, 7 and 8, answers 7, 6, 7, 3, 5', () => {
    const r = AUTHORED[4].map((i) => i.kind === 'howfar' && [i.howfar.from.friend, i.howfar.from.stop, i.howfar.to.friend, i.howfar.to.stop]);
    expect(r[0]).toEqual(['fish', -3, 'duck', 4]);
    expect(AUTHORED[4][0].kind === 'howfar' && AUTHORED[4][0].howfar.cards).toEqual([1, 7, 8]);
    expect(AUTHORED[4].map((i) => (i.kind === 'howfar' ? howFarAnswer(i.howfar) : -1))).toEqual([7, 6, 7, 3, 5]);
    const s = solve(4, AUTHORED[4]);
    expect([s.misses, s.hints]).toEqual([0, 0]);
  });

  it('a wrong card is one miss and dims, the same card again is free, two misses glow, Show a hint counts once, then only the right card is left', () => {
    const s = roundState(4, AUTHORED[4]);
    expect(startStop(s)).toBe(-3);
    expect(s.car).toBe(-3);
    expect(check(s, 4).kind).toBe('ignore');
    expect(check(s, -3).kind).toBe('ignore');
    const first = check(s, 1);
    expect(first).toMatchObject({ kind: 'wrong', right: 7, counted: true, support: false });
    apply(s, first);
    expect([s.misses, s.hints, s.wrong]).toEqual([1, 0, [1]]);
    expect(check(s, 1).kind).toBe('ignore');
    apply(s, check(s, 8));
    expect([s.misses, s.hints, s.hinted, s.wrong]).toEqual([2, 1, true, [1, 8]]);
    expect(giveHint(s)).toBe(false);
    expect(giveHint(s)).toBe(false);
    expect(s.hints).toBe(1);
    expect(hintFor(s)).toBe(7);
    apply(s, check(s, 7));
    expect([s.index, s.car, s.misses, s.hints, s.wrong]).toEqual([1, -1, 2, 1, []]);
    for (let seed = 1; seed <= 50; seed++) {
      const r = roundState(4, makeRound(4, new Rng(seed), false));
      while (!r.done) {
        const it = r.items[r.index];
        if (it.kind !== 'howfar') throw new Error('howfar');
        for (const v of it.howfar.cards) if (v !== hintFor(r)) apply(r, check(r, v));
        expect(check(r, hintFor(r)).kind).toBe('right');
        expect(r.hinted).toBe(true);
        apply(r, check(r, hintFor(r)));
      }
      expect([r.misses, r.hints]).toEqual([10, 5]);
    }
  });
});

describe('level 5, twin stops', () => {
  it('asks for the opposite stop: one dock case (never first), two above, two below, four different distances', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const cases = level5(new Rng(seed));
      expectTwinRound(cases);
      const s = roundState(5, cases.map((twin) => ({ kind: 'twin' as const, twin })));
      while (!s.done) {
        const it = s.items[s.index];
        if (it.kind !== 'twin') throw new Error('twin');
        expect(hintFor(s)).toBe(0 - it.twin.stop + 0);
        expect(s.car).toBe(it.twin.stop);
        apply(s, check(s, hintFor(s)));
      }
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
    expectTwinRound(AUTHORED[5].flatMap((i) => (i.kind === 'twin' ? [i.twin] : [])));
  });

  it("the friend's own stop is free, the dock is its own twin, and a third miss gets the supported finish", () => {
    const s = roundState(5, AUTHORED[5]); // the duck at four above
    expect(check(s, 4).kind).toBe('ignore');
    expect(check(s, 6).kind).toBe('ignore');
    apply(s, check(s, -2));
    apply(s, check(s, -2));
    expect([s.misses, s.hints, s.hinted]).toEqual([1, 0, false]);
    apply(s, check(s, 2));
    expect([s.misses, s.hints, s.hinted]).toEqual([2, 1, true]);
    const third = check(s, -5);
    expect(third).toMatchObject({ kind: 'wrong', right: -4, support: true });
    apply(s, third);
    expect([s.misses, s.hints, s.index, s.car]).toEqual([3, 1, 1, -2]);
    apply(s, check(s, 2));
    apply(s, check(s, -5));
    expect(s.index).toBe(3);
    const dock = s.items[3];
    expect(dock.kind === 'twin' && dock.twin.stop).toBe(0);
    expect(s.car).toBe(0);
    expect(check(s, 0).kind).toBe('right');
    expect(check(s, 3)).toMatchObject({ kind: 'wrong', right: 0 });
    apply(s, check(s, 0));
    expect([s.index, s.car, s.misses]).toEqual([4, -3, 3]);
  });
});

describe('the card layout', () => {
  it('fits three number cards below a shorter request card, clear of everything, on every view', () => {
    for (const v of views) {
      const L = shaftLayout(v)!, C = cardLayout(v)!;
      expect(C).not.toBeNull();
      expect(C.card.h).toBeLessThan(L.card.h);
      const others: Box[] = [C.card, HOME_BOX, ...L.landings.values()];
      const apart = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      for (const [i, b] of C.cards.entries()) {
        expect(b.w).toBeGreaterThanOrEqual(120);
        expect(b.h).toBeGreaterThanOrEqual(110);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h).toBeLessThanOrEqual(v.h);
        expect(b.x > PET_CORNER || b.y + b.h < v.h - PET_CORNER).toBe(true);
        for (const o of others) expect(apart(b, o)).toBe(true);
        for (const o of C.cards.slice(i + 1)) {
          expect(apart(b, o)).toBe(true);
          expect(Math.min(Math.abs(o.y - (b.y + b.h)), Math.abs(b.y - (o.y + o.h)))).toBeGreaterThanOrEqual(16);
        }
        expect(cardAt(C.cards, b.x + b.w / 2, b.y + b.h / 2)).toBe(i);
        expect(nearestLanding(L, b.x + b.w / 2, b.y + b.h / 2)).toBeNull();
      }
      expect(cardAt(C.cards, C.card.x + 10, C.card.y + 10)).toBeNull();
    }
    expect(cardLayout({ w: 1024, h: 600 })).toBeNull();
  });
});
