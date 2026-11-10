import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  applyPicnicMove,
  centre,
  checkPicnic,
  dropOneUse,
  dropVessel,
  emptyPicnic,
  heapOf,
  ITEM_IDS,
  LEVELS,
  nearestPicnic,
  nextPicnicMove,
  PICNIC_PAD,
  picnicBoard,
  picnicDayFor,
  picnicDistance,
  picnicLayout,
  picnicSpotAt,
  PlanTally,
  planFor,
  PLAN_MAX,
  roundFor,
  schedules,
  SEATS,
  TUB_SLOTS,
  VESSEL_IDS,
  type PicnicDay,
  type PicnicPlan,
  type PicnicSchedule,
  type PicnicStop,
  type Rect,
  type VesselId,
} from './logic';

const L7: PicnicDay = { level: 7, picnics: 2, target: 2, promise: null };
const A: PicnicDay = { level: 8, picnics: 3, target: 5, promise: { after: 1 } };
const B: PicnicDay = { level: 8, picnics: 3, target: 5, promise: { after: 0 } };
const seat = (picnic: number, k: number): PicnicStop => ({ at: 'seat', picnic, seat: k });
const tub = (t: number, slot: number): PicnicStop => ({ at: 'tub', tub: t, slot });
const PAINTER: PicnicStop = { at: 'painter' };

/** Lay a plan out drop by drop, as she would: [vessel, stops in order] and one-use cups per seat. */
function lay(day: PicnicDay, routes: Partial<Record<VesselId, PicnicStop[]>>, oneUse: PicnicStop[] = []) {
  let plan = emptyPicnic();
  for (const v of VESSEL_IDS) for (const s of routes[v] ?? []) plan = dropVessel(day, plan, v, s);
  for (const s of oneUse) plan = dropOneUse(day, plan, 'stack', s);
  return plan;
}
/** Fill every empty seat with a one-use cup. */
function fill(day: PicnicDay, plan: PicnicPlan) {
  const b = picnicBoard(day, plan);
  b.seats.forEach((row, p) =>
    row.forEach((c, k) => {
      if (c === null) plan = dropOneUse(day, plan, 'stack', seat(p, k));
    }),
  );
  return plan;
}

/** Orbits of accepted schedules when the given vessels are interchangeable. */
function orbits(list: PicnicSchedule[], swap: number[]) {
  const keys = new Set<string>();
  for (const s of list) {
    const enc = s.map((v) => JSON.stringify(v));
    const swapped = swap.map((i) => enc[i]).sort();
    keys.add(JSON.stringify([swapped, enc.filter((_, i) => !swap.includes(i))]));
  }
  return keys.size;
}

describe('picnic table', () => {
  it('no level 1–6 round contains a vessel; levels 7–8 are picnic days', () => {
    for (let level = 1; level <= PLAN_MAX; level++)
      for (let seed = 0; seed < 500; seed++)
        for (const id of roundFor(level, new Rng(seed)).items) expect(VESSEL_IDS).not.toContain(id as never);
    for (const v of VESSEL_IDS) expect(ITEM_IDS).not.toContain(v as never);
    expect(() => roundFor(7, new Rng(1))).toThrow();
    expect(planFor(7).name).toBe('Picnic Loop');
    expect(planFor(8).name).toBe('Three picnics');
    expect(LEVELS.school).toEqual({ min: 4, max: 8 });
  });

  it('level 8 picks each authored case about half the time', () => {
    let after1 = 0;
    for (let seed = 0; seed < 400; seed++) {
      const d = picnicDayFor(8, new Rng(seed));
      expect(d.picnics).toBe(3);
      expect(d.target).toBe(5);
      if (d.promise!.after === 1) after1++;
    }
    expect(after1).toBeGreaterThan(140);
    expect(after1).toBeLessThan(260);
    expect(picnicDayFor(7, new Rng(1))).toEqual(L7);
  });
});

describe('picnic enumeration', () => {
  it('level 7: 24 schedules, 3 with all four vessels alike; the minimum heap is 2', () => {
    expect(schedules(L7)).toHaveLength(24);
    expect(orbits(schedules(L7), [0, 1, 2, 3])).toBe(3);
    expect(schedules(L7, 1)).toHaveLength(0);
  });
  it('level 8 case A: 312, and 61 up to swapping the three cups', () => {
    expect(schedules(A)).toHaveLength(312);
    expect(orbits(schedules(A), [0, 1, 2])).toBe(61);
  });
  it('level 8 case B: 93, and 19', () => {
    expect(schedules(B)).toHaveLength(93);
    expect(orbits(schedules(B), [0, 1, 2])).toBe(19);
  });
  it('each case minimum is 5, one more than the promise-free day reaches', () => {
    expect(schedules(A, 4)).toHaveLength(0);
    expect(schedules(B, 4)).toHaveLength(0);
    const free: PicnicDay = { level: 8, picnics: 3, target: 4, promise: null };
    expect(schedules(free, 4).length).toBeGreaterThan(0);
    expect(schedules(free, 3)).toHaveLength(0);
  });
  it('every enumerated schedule laid on a board is accepted', () => {
    for (const day of [L7, A, B])
      for (const s of schedules(day)) {
        const plan = boardOf(day, s);
        expect(checkPicnic(day, plan)).toEqual({ kind: 'ok' });
      }
  });
});

/** A schedule laid on the board: each washable's route drop by drop, then one-use cups in the empty seats. */
function boardOf(day: PicnicDay, sched: PicnicSchedule): PicnicPlan {
  let plan = emptyPicnic();
  const used = Array.from({ length: day.picnics }, () => 0);
  const slot = Array.from({ length: day.picnics - 1 }, () => 0);
  VESSEL_IDS.forEach((v, i) => {
    const s = sched[i];
    const stops: [number, PicnicStop][] = [];
    s.serves.forEach((b, p) => b && stops.push([2 * p, seat(p, used[p]++)]));
    s.tubs.forEach((b, t) => b && stops.push([2 * t + 1, tub(t, slot[t]++)]));
    if (s.painter) stops.push([2 * day.promise!.after + 1.5, PAINTER]);
    for (const [, st] of stops.sort((a, b) => a[0] - b[0])) plan = dropVessel(day, plan, v, st);
  });
  return fill(day, plan);
}

describe('tempting plans fail exactly one limit', () => {
  it('level 7: four one-use cups at breakfast keeps the good cups clean but sends four', () => {
    const plan = lay(L7, { red: [seat(1, 0)], blue: [seat(1, 1)], yellow: [seat(1, 2)], mug: [seat(1, 3)] }, [
      seat(0, 0),
      seat(0, 1),
      seat(0, 2),
      seat(0, 3),
    ]);
    expect(checkPicnic(L7, plan)).toEqual({ kind: 'overTarget', heap: 4 });
  });
  it('level 7: a cup carried to lunch without the tub', () => {
    const plan = fill(
      L7,
      lay(L7, { red: [seat(0, 0), seat(1, 0)], blue: [seat(0, 1), tub(0, 0), seat(1, 1)] }),
    );
    expect(checkPicnic(L7, plan)).toEqual({ kind: 'unwashed', vessel: 'red', picnic: 1 });
  });
  it('case A: the mug at all three picnics, washed twice, is under target but breaks the promise', () => {
    const mug = [seat(0, 3), tub(0, 0), seat(1, 3), tub(1, 0), seat(2, 3)];
    const plan = fill(
      A,
      lay(A, {
        red: [seat(0, 0)],
        blue: [seat(0, 1)],
        yellow: [seat(0, 2), tub(0, 1), seat(1, 2), tub(1, 1), seat(2, 2)],
        mug,
      }),
    );
    expect(heapOf(plan)).toBe(4);
    expect(checkPicnic(A, plan)).toEqual({ kind: 'promise', why: 'later' });
  });
  it('case B: the mug used at breakfast and given unwashed, the tub washing two cups instead', () => {
    const twice = (k: number) => [seat(0, k), tub(0, k), seat(1, k), tub(1, k), seat(2, k)];
    const plan = fill(
      B,
      lay(B, { red: twice(0), blue: twice(1), yellow: [seat(0, 2)], mug: [seat(0, 3), PAINTER] }),
    );
    expect(heapOf(plan)).toBe(4);
    expect(checkPicnic(B, plan)).toEqual({ kind: 'promise', why: 'dirty' });
  });
});

describe('checkPicnic', () => {
  it('reports in order: empty seats, unwashed, one-use in a tub, promise, unmet, over target', () => {
    expect(checkPicnic(A, emptyPicnic()).kind).toBe('emptySeat');
    let plan = fill(
      A,
      lay(A, { red: [seat(0, 0), seat(1, 0)], blue: [seat(0, 1), seat(2, 1)] }, [tub(0, 0)]),
    );
    expect(checkPicnic(A, plan)).toEqual({ kind: 'unwashed', vessel: 'red', picnic: 1 });
    plan = fill(A, lay(A, {}, [tub(0, 0), PAINTER]));
    expect(checkPicnic(A, plan)).toEqual({ kind: 'oneUseInTub', tub: 0, slot: 0 });
    plan = fill(A, lay(A, { red: [PAINTER] }));
    expect(checkPicnic(A, plan)).toEqual({ kind: 'promise', why: 'notmug' });
    plan = fill(A, lay(A, {}));
    expect(checkPicnic(A, plan)).toEqual({ kind: 'unmet' });
    plan = fill(A, lay(A, { mug: [PAINTER] }));
    expect(checkPicnic(A, plan)).toEqual({ kind: 'overTarget', heap: 12 });
  });
  it('ties go to the earliest picnic, then vessel order', () => {
    const plan = fill(A, lay(A, { blue: [seat(0, 1), seat(1, 1)], red: [seat(1, 0), seat(2, 0)] }));
    expect(checkPicnic(A, plan)).toEqual({ kind: 'unwashed', vessel: 'blue', picnic: 1 });
    const tie = fill(A, lay(A, { blue: [seat(0, 1), seat(1, 1)], red: [seat(0, 0), seat(1, 0)] }));
    expect(checkPicnic(A, tie)).toEqual({ kind: 'unwashed', vessel: 'red', picnic: 1 });
  });
  it('accepts a clean cup in a tub, a cup washed and never used again, and a cup left on the shelf', () => {
    const base = {
      red: [seat(0, 0), tub(0, 0), seat(1, 0)],
      blue: [seat(0, 1), tub(0, 1), seat(1, 1)],
      yellow: [seat(0, 2)],
      mug: [seat(1, 2)],
    };
    expect(checkPicnic(L7, fill(L7, lay(L7, base)))).toEqual({ kind: 'ok' });
    // Shelf → tub → lunch for the mug: a clean wash only uses a slot (a day with room for one more on the heap).
    const roomy = { ...L7, target: 3 };
    const clean = lay(roomy, {
      red: [seat(0, 0), tub(0, 0), seat(1, 0)],
      blue: [seat(0, 1)],
      yellow: [seat(0, 2)],
      mug: [tub(0, 1), seat(1, 1)],
    });
    expect(checkPicnic(roomy, fill(roomy, clean))).toEqual({ kind: 'ok' });
    const usedThenWashed = lay(A, {
      red: [seat(0, 0), tub(0, 0), seat(1, 0), tub(1, 0), seat(2, 0)],
      blue: [seat(0, 1), tub(0, 1), seat(1, 1), tub(1, 1)],
      yellow: [seat(0, 2)],
      mug: [seat(0, 3), PAINTER],
    });
    expect(checkPicnic(A, fill(A, usedThenWashed)).kind).toBe('promise');
    // Red is washed after breakfast and never used again: harmless.
    const washedOnly = lay(roomy, {
      red: [seat(0, 0), tub(0, 0)],
      blue: [seat(0, 1), tub(0, 1), seat(1, 1)],
      yellow: [seat(0, 2)],
      mug: [seat(1, 2)],
    });
    expect(checkPicnic(roomy, fill(roomy, washedOnly))).toEqual({ kind: 'ok' });
  });
  it('refuses a one-use cup in a tub', () => {
    const plan = fill(
      L7,
      lay(L7, { red: [seat(0, 0), tub(0, 0), seat(1, 0)], blue: [seat(0, 1), seat(1, 1)] }, [tub(0, 1)]),
    );
    expect(checkPicnic(L7, plan).kind).toBe('unwashed');
    const only = fill(L7, lay(L7, { red: [seat(0, 0), tub(0, 0), seat(1, 0)] }, [tub(0, 1)]));
    expect(checkPicnic(L7, only)).toEqual({ kind: 'oneUseInTub', tub: 0, slot: 1 });
  });
});

describe('routes', () => {
  it('breakfast → tub → lunch keeps all three stops; an earlier drop takes back the later ones', () => {
    let plan = lay(L7, { red: [seat(0, 0), tub(0, 0), seat(1, 2)] });
    expect(plan.routes.red).toEqual([seat(0, 0), tub(0, 0), seat(1, 2)]);
    plan = dropVessel(L7, plan, 'red', tub(0, 1));
    expect(plan.routes.red).toEqual([seat(0, 0), tub(0, 1)]);
    plan = dropVessel(L7, plan, 'red', seat(0, 3));
    expect(plan.routes.red).toEqual([seat(0, 3)]);
  });
  it('a drop on an occupied stop cuts the other cup back; a one-use cup there goes to the stack', () => {
    let plan = lay(L7, { red: [seat(0, 0), tub(0, 0), seat(1, 0)], blue: [seat(0, 1)] }, [seat(1, 1)]);
    plan = dropVessel(L7, plan, 'blue', tub(0, 0));
    expect(plan.routes.red).toEqual([seat(0, 0)]);
    expect(plan.routes.blue).toEqual([seat(0, 1), tub(0, 0)]);
    plan = dropVessel(L7, plan, 'blue', seat(1, 1));
    expect(plan.oneUse).toEqual([]);
    plan = dropOneUse(L7, plan, 'stack', seat(0, 0));
    expect(plan.routes.red).toEqual([]);
  });
  it('the shelf clears a route; a one-use cup is never on two seats', () => {
    let plan = lay(L7, { red: [seat(0, 0), tub(0, 0), seat(1, 0)] }, [seat(0, 1)]);
    plan = dropVessel(L7, plan, 'red', 'shelf');
    expect(plan.routes.red).toEqual([]);
    plan = dropOneUse(L7, plan, 0, seat(1, 1));
    expect(plan.oneUse).toEqual([seat(1, 1)]);
    plan = dropOneUse(L7, plan, 0, 'stack');
    expect(plan.oneUse).toEqual([]);
  });
});

describe('Picnic Loop accounting (level 8 case A, as in the first round)', () => {
  it('counts one miss per changed failed ring, glows once, and finishes once', () => {
    const t = new PlanTally();
    const twice = (k: number) => [seat(0, k), tub(0, k - 2), seat(1, k), tub(1, k - 2), seat(2, k)];
    let plan = fill(A, lay(A, { red: [seat(0, 0)], blue: [seat(0, 1)], yellow: twice(2), mug: twice(3) }));
    expect(heapOf(plan)).toBe(4);
    let r = t.ringPicnic(A, plan);
    expect(r.kind === 'fail' && r.check).toEqual({ kind: 'promise', why: 'later' });
    expect([t.misses, t.hints]).toEqual([1, 0]);
    t.ringPicnic(A, plan);
    expect([t.misses, t.hints]).toEqual([1, 0]);
    plan = dropVessel(A, plan, 'mug', tub(1, 1));
    expect(t.ringPicnic(A, plan).kind).toBe('seats');
    expect(t.misses).toBe(1);
    plan = fill(A, plan);
    expect(heapOf(plan)).toBe(5);
    r = t.ringPicnic(A, plan);
    expect(r.kind === 'fail' && r.check).toEqual({ kind: 'unmet' });
    expect(r.kind === 'fail' && r.glowed).toBe(true);
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(1);
    expect(t.ask()).toBe('move');
    expect(t.hints).toBe(2);
    const m = nextPicnicMove(A, plan)!;
    expect(m).toEqual({ kind: 'vessel', vessel: 'mug', to: PAINTER });
    const after = applyPicnicMove(A, plan, m);
    expect(picnicBoard(A, after).seats).toEqual(picnicBoard(A, plan).seats);
    expect(after.routes.mug).toEqual([...plan.routes.mug, PAINTER]);
    expect(t.ringPicnic(A, after)).toEqual({ kind: 'ok' });
    expect(nextPicnicMove(A, after)).toBeNull();
  });
});

/** A random board: drops of washables and one-use cups anywhere, as a child might. */
function randomPlan(day: PicnicDay, rng: Rng): PicnicPlan {
  const stops: PicnicStop[] = [
    ...Array.from({ length: day.picnics }, (_, p) =>
      Array.from({ length: SEATS }, (_, k) => seat(p, k)),
    ).flat(),
    ...Array.from({ length: day.picnics - 1 }, (_, t) =>
      Array.from({ length: TUB_SLOTS }, (_, k) => tub(t, k)),
    ).flat(),
    ...(day.promise ? [PAINTER] : []),
  ];
  let plan = emptyPicnic();
  const n = rng.int(0, 16);
  for (let i = 0; i < n; i++) {
    const to = rng.pick(stops);
    if (rng.chance(0.6)) plan = dropVessel(day, plan, rng.pick(VESSEL_IDS), to);
    else plan = dropOneUse(day, plan, 'stack', to);
  }
  return plan;
}

describe('Picnic Loop help leads somewhere', () => {
  for (const day of [L7, A, B]) {
    it(`level ${day.level}${day.promise ? ` after ${day.promise.after}` : ''}: Show me one reaches an accepted board`, () => {
      const rng = new Rng(17 + day.picnics + (day.promise?.after ?? 0));
      const boards = [emptyPicnic(), ...Array.from({ length: 200 }, () => randomPlan(day, rng))];
      for (let plan of boards) {
        for (let step = 0; step < 40; step++) {
          if (checkPicnic(day, plan).kind === 'ok') break;
          const nearest = nearestPicnic(day, plan)!;
          const d = picnicDistance(day, plan, nearest);
          const m = nextPicnicMove(day, plan);
          expect(m).not.toBeNull();
          const next = applyPicnicMove(day, plan, m!);
          expect(picnicDistance(day, next, nearest)).toBeLessThan(d);
          plan = next;
        }
        expect(checkPicnic(day, plan)).toEqual({ kind: 'ok' });
        expect(nextPicnicMove(day, plan)).toBeNull();
      }
    });
  }
});

describe('Picnic Loop layout', () => {
  const VIEWS = [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(1366, 1024),
    computeView(820, 1180),
    computeView(844, 390),
  ];
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const pad = (r: Rect): Rect => ({
    x: r.x - PICNIC_PAD,
    y: r.y - PICNIC_PAD,
    w: r.w + 2 * PICNIC_PAD,
    h: r.h + 2 * PICNIC_PAD,
  });
  for (const view of VIEWS)
    for (const day of [L7, A]) {
      it(`${view.w}x${view.h} level ${day.level}: big targets, clear corners, no overlapping drop areas`, () => {
        const l = picnicLayout(view, day);
        const pet = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home = { x: 0, y: 0, w: 110, h: 110 };
        const help = { x: 0, y: 110, w: 110, h: 100 };
        const seats = l.seats.flat();
        const slots = l.slots.flat();
        expect(seats).toHaveLength(day.picnics * SEATS);
        const drops = [l.back, ...seats, ...slots, ...(l.painter ? [l.painter] : [])];
        for (const r of [...drops, ...Object.values(l.shelf), l.stack, l.bell, l.heap]) {
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          for (const corner of [pet, home, help]) expect(overlap(r, corner)).toBe(false);
        }
        expect(l.bell.w).toBeGreaterThanOrEqual(120);
        expect(l.bell.h).toBeGreaterThanOrEqual(120);
        for (let i = 0; i < drops.length; i++) {
          expect(overlap(pad(drops[i]), l.bell)).toBe(false);
          expect(overlap(pad(drops[i]), l.heap)).toBe(false);
          for (const o of drops.slice(i + 1)) expect(overlap(pad(drops[i]), pad(o))).toBe(false);
        }
        l.seats.forEach((col, p) =>
          col.forEach((r, k) => expect(picnicSpotAt(l, centre(r).x, centre(r).y)).toEqual(seat(p, k))),
        );
        l.slots.forEach((col, t) =>
          col.forEach((r, k) => expect(picnicSpotAt(l, centre(r).x, centre(r).y)).toEqual(tub(t, k))),
        );
        expect(picnicSpotAt(l, centre(l.stack).x, centre(l.stack).y)).toBe('back');
        if (l.painter) expect(picnicSpotAt(l, centre(l.painter).x, centre(l.painter).y)).toEqual(PAINTER);
      });
    }
});
