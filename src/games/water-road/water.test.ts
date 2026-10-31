import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  abutmentsFor, abutmentsInTray, archesInTray, chooseChannel, corners, downhillPlan, downhillStart, emptyArcade, falls, fallingSettings, firstStuck, firstUnsupported,
  followHint, heights, MAX_STEP, MIN_TARGET, moveAbutment, moveArch, nearestFalling, nextRoad, openSpring, openValley, overlaps, pierHint, planFor, pressArrow, pressesLeft,
  pressPier, roadNow, standsArcade, stuckKind, Tally, valleyHint, valleyPlan, waterBotMove, waterLayout,
  type Arcade, type DownhillState, type Rect, type Road, type Valley, type ValleyState,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const road = (spring: number, piers: number[], fountain: number): Road => ({ spring, fountain, piers });
const strictlyDown = (h: number[]) => h.every((x, i) => i === 0 || x < h[i - 1]);

describe('level 4: the fall rule', () => {
  it('falls exactly when every stretch drops; flat does not fall', () => {
    expect(falls(road(6, [4, 2], 0))).toBe(true);
    expect(falls(road(6, [4, 4], 0))).toBe(false);
    expect(stuckKind(road(6, [4, 4], 0))).toBe('flat');
    expect(falls(road(6, [3, 5], 0))).toBe(false);
    expect(stuckKind(road(6, [3, 5], 0))).toBe('up');
    expect(falls(road(5, [3, 1], 1))).toBe(false);
    expect(firstStuck(road(5, [3, 1], 1))).toBe(2);
    expect(firstStuck(road(5, [6, 1], 0))).toBe(0);
    expect(firstStuck(road(6, [4, 2], 0))).toBeNull();
  });

  it('firstStuck is the first non-dropping stretch and null iff falls, over every setting', () => {
    for (const spring of [5, 6]) for (const fountain of [0, 1]) for (let a = 0; a <= MAX_STEP; a++) for (let b = 0; b <= MAX_STEP; b++) {
      const r = road(spring, [a, b], fountain);
      const h = heights(r);
      expect(falls(r)).toBe(strictlyDown(h));
      const i = firstStuck(r);
      expect(i === null).toBe(falls(r));
      if (i !== null) {
        expect(h[i + 1]).toBeGreaterThanOrEqual(h[i]);
        for (let k = 0; k < i; k++) expect(h[k + 1]).toBeLessThan(h[k]);
      }
    }
  });

  it('accepts every falling setting, not only the one the hint aims at', () => {
    const r = road(6, [0, 0], 0);
    const all = fallingSettings(r);
    expect(all.length).toBeGreaterThan(1);
    for (const p of all) expect(falls({ ...r, piers: p })).toBe(true);
    // And no falling setting is missing.
    let count = 0;
    for (let a = 0; a <= MAX_STEP; a++) for (let b = 0; b <= MAX_STEP; b++) if (falls({ ...r, piers: [a, b] })) count++;
    expect(count).toBe(all.length);
  });

  it('a press never moves a pier outside 0–6; at the limit it bumps', () => {
    expect(pressPier(road(6, [6, 2], 0), 0, 1)).toEqual({ road: road(6, [6, 2], 0), bumped: true });
    expect(pressPier(road(6, [6, 0], 0), 1, -1).bumped).toBe(true);
    expect(pressPier(road(6, [5, 2], 0), 0, 1).road.piers).toEqual([6, 2]);
  });
});

describe('level 4: plans', () => {
  it('pre-K: two roads, each with exactly one falling card and one that climbs by two or more in one stretch, never flat', () => {
    for (const seed of SEEDS) {
      const plan = downhillPlan('prek', new Rng(seed));
      expect(plan.kind).toBe('cards');
      expect(plan.roads).toHaveLength(2);
      for (const r of plan.roads) {
        const cards = r.cards!;
        expect(falls({ ...r, piers: cards[r.good] })).toBe(true);
        const bad = heights({ ...r, piers: cards[1 - r.good] });
        expect(falls({ ...r, piers: cards[1 - r.good] })).toBe(false);
        const rises = bad.slice(1).map((h, i) => h - bad[i]);
        expect(rises.filter((d) => d >= 2)).toHaveLength(1);
        expect(rises.filter((d) => d >= 0)).toHaveLength(1);
        for (const h of [...cards[0], ...cards[1]]) { expect(h).toBeGreaterThanOrEqual(0); expect(h).toBeLessThanOrEqual(MAX_STEP); }
      }
    }
  });

  it('school: spring − fountain ≥ 4, a falling setting exists, road 1 starts with a hump, road 2 with a dip', () => {
    for (const seed of SEEDS) {
      const plan = downhillPlan('school', new Rng(seed));
      expect(plan.kind).toBe('piers');
      plan.roads.forEach((r, k) => {
        expect(r.spring - r.fountain).toBeGreaterThanOrEqual(4);
        expect(fallingSettings({ ...r, piers: r.start }).length).toBeGreaterThan(0);
        const start = { ...r, piers: r.start };
        expect(falls(start)).toBe(false);
        const h = heights(start);
        if (k === 0) {
          // A hump: one pier at least as high as the height before it.
          expect([1, 2].some((i) => h[i] >= h[i - 1])).toBe(true);
          expect(pierHint(start)!.dir).toBe(-1);
        } else {
          // A dip: one pier at most the fountain's height.
          expect(r.start.some((p) => p <= r.fountain)).toBe(true);
          expect(pierHint(start)!.dir).toBe(1);
        }
      });
    }
  });

  it('the same seed gives the same plan', () => {
    for (const band of ['prek', 'school'] as const) expect(downhillPlan(band, new Rng(42))).toEqual(downhillPlan(band, new Rng(42)));
    expect(valleyPlan(new Rng(42))).toEqual(valleyPlan(new Rng(42)));
  });
});

describe('level 4: the hint from any reachable state', () => {
  it('every hinted press strictly reduces the distance and following it falls within that many presses', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const plan = downhillPlan('school', new Rng(seed));
      const rng = new Rng(seed + 1000);
      for (let k = 0; k < plan.roads.length; k++) {
        let s = downhillStart(plan, k);
        for (let walk = 0; walk < 6; walk++) {
          // Random presses first (free), then follow the hint from wherever she is.
          for (let n = rng.int(0, 4); n > 0; n--) s = pressArrow(plan, s, rng.int(0, 1), rng.pick([1, -1] as const)).state;
          let r = roadNow(plan, s)!;
          const budget = pressesLeft(r);
          let presses = 0;
          while (!falls(r)) {
            const h = pierHint(r)!;
            const before = pressesLeft(r);
            r = pressPier(r, h.pier, h.dir).road;
            expect(pressesLeft(r)).toBeLessThan(before);
            presses++;
            expect(presses).toBeLessThanOrEqual(budget);
          }
          expect(nearestFalling(r)).toEqual(r.piers);
        }
      }
    }
  });
});

describe('level 4: accounting', () => {
  it('an opening that pools is one miss and changes nothing; presses, swaps and a no-channel opening are free', () => {
    const plan = downhillPlan('school', new Rng(7));
    let s = downhillStart(plan);
    const t = new Tally();
    const o = openSpring(plan, s);
    expect(o.event).toBe('stuck');
    expect(o.state).toEqual(s);
    t.miss();
    s = pressArrow(plan, s, 0, 1).state;
    s = pressArrow(plan, s, 0, -1).state;
    expect(t.misses).toBe(1);
    const pk = downhillPlan('prek', new Rng(7));
    let p: DownhillState = downhillStart(pk);
    expect(openSpring(pk, p).event).toBe('none');
    p = chooseChannel(pk, p, 0);
    p = chooseChannel(pk, p, 1);
    expect(p.chosen).toBe(1);
    expect(p.piers).toEqual(pk.roads[0].cards![1]);
    p = chooseChannel(pk, p, pk.roads[0].good);
    expect(openSpring(pk, p).event).toBe('falls');
    expect(nextRoad(pk, p).road).toBe(1);
  });

  it('the hint counts at most once per road', () => {
    const t = new Tally();
    t.miss(); t.miss(); t.help(); t.miss();
    expect([t.misses, t.hints]).toEqual([3, 1]);
    t.next();
    t.help(); t.help();
    expect(t.hints).toBe(2);
  });
});

const arcade = (arches: boolean[], near = false, far = false): Arcade => ({ arches, abut: { near, far } });

describe('level 5: the arcade rule', () => {
  const v: Valley = { spans: 3, ends: { near: 'rock', far: 'earth' } };

  it('stands exactly when every span is filled and each end arch is held by rock or an abutment', () => {
    expect(standsArcade(v, arcade([true, true, true], false, true))).toBe(true);
    expect(standsArcade(v, arcade([true, true, true]))).toBe(false);
    expect(standsArcade(v, arcade([true, false, true], false, true))).toBe(false);
    expect(standsArcade(v, arcade([true, true, true], true, false))).toBe(false);
  });

  it('firstUnsupported names the first problem from the spring end and is null iff it stands', () => {
    expect(firstUnsupported(v, arcade([false, false, false]))).toEqual({ kind: 'gap', span: 0 });
    expect(firstUnsupported(v, arcade([true, false, true]))).toEqual({ kind: 'gap', span: 1 });
    expect(firstUnsupported(v, arcade([true, true, true]))).toEqual({ kind: 'end', end: 'far' });
    const earth: Valley = { spans: 4, ends: { near: 'earth', far: 'earth' } };
    expect(firstUnsupported(earth, arcade([true, true, true, true], false, true))).toEqual({ kind: 'end', end: 'near' });
    for (const seed of SEEDS) {
      const plan = valleyPlan(new Rng(seed));
      const rng = new Rng(seed + 7);
      for (const vv of plan.valleys) {
        const a = arcade(Array.from({ length: vv.spans }, () => rng.int(0, 1) === 1), rng.int(0, 1) === 1, rng.int(0, 1) === 1);
        expect(firstUnsupported(vv, a) === null).toBe(standsArcade(vv, a));
      }
    }
  });

  it('with one abutment on the rock end, the opening fails at the earth end', () => {
    const r = openValley(v, arcade([true, true, true], true, false));
    expect(r.stands).toBe(false);
    expect(r.problem).toEqual({ kind: 'end', end: 'far' });
    expect(valleyHint(v, arcade([true, true, true], true, false))).toEqual({ kind: 'move', from: 'near', to: 'far' });
  });

  it('a failed opening returns exactly the unheld arches and keeps held arches and abutments', () => {
    const four: Valley = { spans: 4, ends: { near: 'earth', far: 'rock' } };
    const r = openValley(four, arcade([true, false, true, true], true, false));
    expect(r.slid).toEqual([0, 2]);
    expect(r.arcade).toEqual(arcade([false, false, false, true], true, false));
    const lone = openValley(v, arcade([true, true, true], false, false));
    expect(lone.slid).toEqual([2]);
    expect(lone.arcade.arches).toEqual([true, true, false]);
  });

  it('moves are refused onto a taken place and never create or lose pieces', () => {
    let a = emptyArcade(v);
    expect(moveArch(v, a, 1, 2)).toBeNull();
    a = moveArch(v, a, 'tray', 1)!;
    expect(moveArch(v, a, 'tray', 1)).toBeNull();
    a = moveArch(v, a, 1, 0)!;
    expect(a.arches).toEqual([true, false, false]);
    expect(archesInTray(v, a)).toBe(2);
    a = moveAbutment(v, a, 'tray', 'near')!;
    expect(moveAbutment(v, a, 'tray', 'far')).toBeNull();
    expect(abutmentsInTray(v, a)).toBe(0);
  });

  it('following the hint repeatedly stands from any placement', () => {
    for (const seed of SEEDS) {
      const plan = valleyPlan(new Rng(seed));
      const rng = new Rng(seed + 99);
      for (const vv of plan.valleys) {
        // A random legal placement: some arches out, the abutments anywhere (rock included).
        let a = emptyArcade(vv);
        for (let i = 0; i < vv.spans; i++) if (rng.int(0, 1)) a = moveArch(vv, a, 'tray', i)!;
        for (let k = abutmentsFor(vv); k > 0; k--) a = moveAbutment(vv, a, 'tray', rng.pick(['near', 'far'] as const)) ?? a;
        let steps = 0;
        for (let h = valleyHint(vv, a); h; h = valleyHint(vv, a)) {
          a = followHint(vv, a, h);
          expect(++steps).toBeLessThanOrEqual(vv.spans + 2);
        }
        expect(standsArcade(vv, a)).toBe(true);
      }
    }
  });
});

describe('level 5: plans', () => {
  it('3 then 3 or 4 spans; one rock end on the first valley; enough pieces to stand', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const plan = valleyPlan(new Rng(seed));
      expect(plan.valleys).toHaveLength(2);
      expect(plan.valleys[0].spans).toBe(3);
      expect([3, 4]).toContain(plan.valleys[1].spans);
      expect(abutmentsFor(plan.valleys[0])).toBe(1);
      expect(abutmentsFor(plan.valleys[1])).toBeGreaterThanOrEqual(1);
      seen.add(`${plan.valleys[1].spans}/${abutmentsFor(plan.valleys[1])}`);
      for (const vv of plan.valleys) {
        const a = emptyArcade(vv);
        expect(archesInTray(vv, a)).toBe(vv.spans);
        expect(abutmentsInTray(vv, a)).toBe(abutmentsFor(vv));
      }
    }
    expect(seen).toEqual(new Set(['3/1', '3/2', '4/1', '4/2']));
  });
});

describe('levels 4–5: the ghost finger', () => {
  it('never opens a road that pools and always reaches the fountain', () => {
    for (const band of ['prek', 'school'] as const) for (const seed of SEEDS) {
      const plan = downhillPlan(band, new Rng(seed));
      let s = downhillStart(plan);
      for (let guard = 0; guard < 60; guard++) {
        const m = waterBotMove(plan, s);
        if (!m) break;
        if ('drag' in m) throw new Error('no drags at level 4');
        if (m.tap === 'open') {
          const o = openSpring(plan, s);
          expect(o.event).toBe('falls');
          s = o.state.road + 1 < plan.roads.length ? nextRoad(plan, o.state) : o.state;
        } else if (m.tap === 'card') s = chooseChannel(plan, s, m.card);
        else s = pressArrow(plan, s, m.pier, m.dir).state;
      }
      expect(s.road).toBe(1);
      expect(s.done).toBe(true);
    }
  });

  it("the bot's placement stands for every seed", () => {
    for (const seed of SEEDS) {
      const plan = valleyPlan(new Rng(seed));
      for (let k = 0; k < plan.valleys.length; k++) {
        const vv = plan.valleys[k];
        const s: ValleyState = { valley: k, arcade: emptyArcade(vv), done: false };
        for (let guard = 0; guard < 12; guard++) {
          const m = waterBotMove(plan, s)!;
          if ('tap' in m) { expect(m.tap).toBe('open'); break; }
          s.arcade = m.drag === 'arch' ? moveArch(vv, s.arcade, m.from, m.to)! : moveAbutment(vv, s.arcade, m.from, m.to)!;
          if (m.drag === 'abutment') expect(vv.ends[m.to]).toBe('earth');
        }
        expect(standsArcade(vv, s.arcade)).toBe(true);
      }
    }
  });
});

describe('levels 4–5: plans and layout', () => {
  it('levels 4 and 5 are the downhill and valley plans', () => {
    expect(planFor(4).id).toBe('downhill');
    expect(planFor(5).id).toBe('valley');
    expect(planFor(3).id).toBe('buttress');
  });

  const inputs = (l: NonNullable<ReturnType<typeof waterLayout>>): Rect[] => [
    ...l.cards, ...l.arrows.flatMap((a) => [a.up, a.down]), l.open, ...l.spans, ...(l.ends ? [l.ends.near, l.ends.far] : []), ...l.trayArches, ...l.trayAbutments,
  ];

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`fits at ${name}: every input at least 100, inside, clear of the corners and each other`, () => {
      const cases = [
        waterLayout(4, 'prek', v), waterLayout(4, 'school', v), waterLayout(5, 'school', v, 3), waterLayout(5, 'school', v, 4),
      ];
      for (const l of cases) {
        expect(l).not.toBeNull();
        const rs = inputs(l!);
        for (const r of rs) {
          expect(r.w).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(r.h).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h).toBeLessThanOrEqual(v.h);
          for (const c of corners(v)) expect(overlaps(r, c)).toBe(false);
        }
        for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) expect(overlaps(rs[i], rs[j])).toBe(false);
      }
      const pk = waterLayout(4, 'prek', v)!;
      expect(pk.cards).toHaveLength(2);
      for (const c of pk.cards) { expect(c.w).toBe(300); expect(c.h).toBe(200); }
      const sc = waterLayout(4, 'school', v)!;
      expect(sc.xs[3] - sc.xs[0]).toBeGreaterThanOrEqual(600);
      expect(sc.xs[2] - sc.xs[1]).toBeGreaterThanOrEqual(160);
      // The hill top stays below the home corner.
      expect(sc.ground - MAX_STEP * 36).toBeGreaterThanOrEqual(0);
      expect(waterLayout(5, 'school', v, 4)!.spans).toHaveLength(4);
    });
  }
});
