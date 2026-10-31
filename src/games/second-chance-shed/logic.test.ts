import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  accepts, CASES, centre, checkPlan, distance, GLOW_AFTER, greedyWorks, ITEM_IDS, ITEMS, judge, KIND_OF_PLACE, moveTo, nearestSolution,
  nextMove, PLACES, placeAt, planFor, planLayout, PlanTally, PLANS, roundFor, shedLayout, ShedTally, solutions, SORT_MAX, spotAt, DROP_PAD,
  type Place, type PlanMap, type Rect, type Round, type Spot,
} from './logic';

const SEEDS = 500;
const VIEWS = [computeView(1024, 768), computeView(768, 1024), computeView(1366, 1024), computeView(820, 1180), computeView(844, 390)];

describe('item table', () => {
  it('gives every item one place of the matching kind and no paper', () => {
    for (const id of ITEM_IDS) {
      expect(ITEMS[id].id).toBe(id);
      expect(PLACES).toContain(ITEMS[id].place);
      expect(ITEMS[id].kind).toBe(KIND_OF_PLACE[ITEMS[id].place]);
      expect(ITEMS[id].paper).toBe(false);
    }
  });
  it('keeps the tin out of levels 1–4: it is the only item with another place (Remake) and a first level', () => {
    expect(ITEM_IDS.filter((id) => ITEMS[id].also)).toEqual(['tin']);
    expect(ITEMS.tin.also).toEqual(['remake']);
    expect(ITEM_IDS.filter((id) => ITEMS[id].from)).toEqual(['tin']);
    expect(ITEMS.tin.from).toBe(SORT_MAX + 1);
    for (let level = 1; level <= SORT_MAX; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) expect(roundFor(level, new Rng(seed)).items).not.toContain('tin');
    }
  });
  it('gives fits only to whole things, and none to the bag', () => {
    for (const id of ITEM_IDS) if (ITEMS[id].fits.length) expect(ITEMS[id].kind).toBe('whole');
    expect(ITEMS.bag.fits).toEqual([]);
    expect(ITEMS.tin.fits).toEqual(['pencils']);
    expect(ITEMS.box.fits).toEqual(['pencils', 'bed']);
    expect(ITEMS.tub.fits).toEqual(['pencils', 'seedling']);
  });
  it('has at least two items for every place', () => {
    for (const p of PLACES) expect(ITEM_IDS.filter((id) => ITEMS[id].place === p).length).toBeGreaterThanOrEqual(2);
  });
});

describe('rounds', () => {
  for (const plan of PLANS.filter((p) => p.level <= SORT_MAX)) {
    it(`level ${plan.level} is a playable round across seeds`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const round = roundFor(plan.level, new Rng(seed));
        expect(planFor(plan.level)).toBe(plan);
        expect(round.open).toEqual(plan.open);
        expect(round.items).toHaveLength(plan.count);
        expect(new Set(round.items).size).toBe(round.items.length);
        const places = round.items.map((id) => ITEMS[id].place);
        for (const p of places) expect(plan.open).toContain(p);
        for (const p of plan.open) expect(places).toContain(p);
        for (const id of round.items) expect(ITEMS[id].paper).toBe(false);
        if (plan.open.length > 1) {
          for (let i = 2; i < places.length; i++) expect(places[i] === places[i - 1] && places[i] === places[i - 2]).toBe(false);
        }
        expect(roundFor(plan.level, new Rng(seed))).toEqual(round);
      }
    });
  }
  it('clamps out-of-range levels', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(99).level).toBe(PLANS.length);
  });
});

describe('judging drops', () => {
  const view = VIEWS[0];
  const layout = shedLayout(view, PLACES);
  it('resolves each open place centre to itself', () => {
    for (const p of PLACES) {
      const c = centre(layout.places[p]!);
      expect(placeAt(layout, c.x, c.y)).toBe(p);
    }
  });
  it('resolves a point between neighbours to the nearer one', () => {
    for (let i = 0; i < PLACES.length - 1; i++) {
      const a = layout.places[PLACES[i]]!, b = layout.places[PLACES[i + 1]]!;
      const y = centre(a).y;
      const mid = (centre(a).x + centre(b).x) / 2;
      expect(placeAt(layout, mid - 5, y)).toBe(PLACES[i]);
      expect(placeAt(layout, mid + 5, y)).toBe(PLACES[i + 1]);
    }
  });
  it('treats the empty yard as no place and ignores closed places', () => {
    const c = centre(layout.cart);
    expect(placeAt(layout, c.x, c.y)).toBeNull();
    const one = shedLayout(view, ['worm']);
    expect(Object.keys(one.places)).toEqual(['worm']);
    const w = one.places.worm!;
    expect(placeAt(one, w.x + w.w + 200, w.y)).toBeNull();
  });
  it('judges right, wrong and none', () => {
    expect(judge('peel', 'worm')).toBe('right');
    expect(judge('peel', 'shelf')).toBe('wrong');
    expect(judge('peel', null)).toBe('none');
  });
});

describe('accounting', () => {
  it('level 1 counts nothing and only glows', () => {
    const t = new ShedTally(false);
    for (let i = 0; i < 4; i++) { t.drop('wrong'); t.drop('none'); t.drop('right'); expect(t.ask()).toBe('glow'); }
    expect(t.misses).toBe(0);
    expect(t.hints).toBe(0);
  });
  it('counts misses and one hint for a two-miss glow, then carries on a second ask', () => {
    const t = new ShedTally(true);
    t.drop('wrong');
    expect(t.glowing).toBe(false);
    t.drop('wrong');
    expect([t.misses, t.hints, t.glowing]).toEqual([GLOW_AFTER, 1, true]);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(1);
    expect(t.ask()).toBe('carry');
    expect(t.hints).toBe(1);
  });
  it('counts a shown hint once, with no second hint from a later glow on the same item', () => {
    const t = new ShedTally(true);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(1);
    t.drop('wrong'); t.drop('wrong');
    expect([t.misses, t.hints]).toEqual([2, 1]);
  });
  it('resets per-item help on nextItem but keeps totals', () => {
    const t = new ShedTally(true);
    t.drop('wrong'); t.drop('wrong');
    t.nextItem();
    expect(t.glowing).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(2);
  });
});

describe('layout', () => {
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const gap = (a: Rect, b: Rect) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
  for (const view of VIEWS) {
    for (let n = 1; n <= 4; n++) {
      it(`${view.w}x${view.h} with ${n} open place(s) is roomy and clear`, () => {
        const open: Place[] = PLACES.slice(0, n);
        const layout = shedLayout(view, open);
        const pet = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home = { x: 0, y: 0, w: 110, h: 110 };
        const rects = open.map((p) => layout.places[p]!);
        expect(rects.every(Boolean)).toBe(true);
        rects.forEach((r, i) => {
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
          expect(overlap(r, pet)).toBe(false);
          expect(overlap(r, home)).toBe(false);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          expect(overlap(layout.item, r)).toBe(false);
          for (const o of rects.slice(i + 1)) expect(gap(r, o)).toBeGreaterThanOrEqual(24);
        });
        if (view.h > view.w && n === 4) {
          expect(new Set(rects.map((r) => r.y)).size).toBe(2);
          for (const y of new Set(rects.map((r) => r.y))) expect(rects.filter((r) => r.y === y)).toHaveLength(2);
        }
      });
    }
  }
});


describe('Start again', () => {
  it('never counts the same item\'s hint twice', () => {
    const t = new ShedTally(true);
    t.nextItem(0);
    t.drop('wrong'); t.drop('wrong');
    t.nextItem(0);
    t.drop('wrong'); t.drop('wrong');
    expect(t.ask()).toBe('glow');
    expect([t.misses, t.hints]).toEqual([4, 1]);
    t.nextItem(1);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(2);
  });
});


// ---- levels 5–6 ----

const solved = (round: Round, plan: PlanMap) => checkPlan(round, plan).kind === 'ok';
/** Follow Show me one from a plan until it works; returns the steps taken (or -1 if it stalls). */
function follow(round: Round, start: PlanMap): number {
  let plan = start;
  for (let steps = 0; steps < 20; steps++) {
    const m = nextMove(round, plan);
    if (!m) return solved(round, plan) ? steps : -1;
    const sol = nearestSolution(round, plan)!;
    expect(plan[m.index]).not.toBe(sol[m.index]);
    const next = moveTo(plan, m.index, m.to);
    const kept = plan.map((s, i) => s === sol[i]);
    next.forEach((s, i) => { if (kept[i]) expect(s).toBe(plan[i]); });
    expect(distance(next, sol)).toBeLessThan(distance(plan, sol));
    plan = next;
  }
  return -1;
}
function randomPlan(round: Round, rng: Rng): PlanMap {
  let plan: PlanMap = round.items.map((): Spot => 'cart');
  const spots: Spot[] = ['cart', ...round.open, ...round.requests.map((_, f): Spot => (f === 0 ? 'f0' : 'f1'))];
  round.items.forEach((_, i) => { plan = moveTo(plan, i, rng.pick(spots)); });
  return plan;
}

describe('level 5: someone needs it', () => {
  it('lays out the tin, the bag and one each of food, broken and squashed for the pencils friend', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const round = roundFor(5, new Rng(seed));
      expect(round.items).toHaveLength(5);
      expect(new Set(round.items).size).toBe(5);
      expect(round.items).toContain('tin');
      expect(round.items).toContain('bag');
      for (const k of ['food', 'broken', 'squashed'] as const) expect(round.items.filter((id) => ITEMS[id].kind === k)).toHaveLength(1);
      expect(round.requests).toEqual(['pencils']);
      expect(round.items.filter((id) => ITEMS[id].fits.includes('pencils'))).toEqual(['tin']);
      for (const id of round.items) expect(ITEMS[id].paper).toBe(false);
      const sols = solutions(round);
      expect(sols.length).toBeGreaterThanOrEqual(1);
      for (const sol of sols) expect(sol[round.items.indexOf('tin')]).toBe('f0');
      const remade = sols[0].slice();
      remade[round.items.indexOf('tin')] = 'remake';
      expect(checkPlan(round, remade)).toEqual({ kind: 'unmet', friend: 0 });
      expect(roundFor(5, new Rng(seed))).toEqual(round);
    }
  });
});

describe('level 6: two friends', () => {
  it('has the case candidates, one accepted pairing, the both-fit thing first, and greedy failing with pencils first', () => {
    const pencilsFirst = [0, 0], perCase = [0, 0];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const round = roundFor(6, new Rng(seed));
      const ci = CASES.findIndex((c) => round.items.includes(c.both) && round.requests.includes(c.other));
      expect(ci).toBeGreaterThanOrEqual(0);
      const c = CASES[ci];
      perCase[ci]++;
      expect(round.items).toHaveLength(5);
      expect(new Set(round.items).size).toBe(5);
      expect([...round.requests].sort()).toEqual(['pencils', c.other].sort());
      const fitting = round.items.filter((id) => ITEMS[id].fits.some((r) => round.requests.includes(r)));
      expect(fitting.sort()).toEqual([c.both, 'tin'].sort());
      for (const id of round.items) if (id !== c.both && id !== 'tin' && ITEMS[id].kind === 'whole') expect(id).toBe('bag');
      expect(round.items.indexOf(c.both)).toBeLessThan(round.items.indexOf('tin'));
      const sols = solutions(round);
      expect(sols).toHaveLength(1);
      const sol = sols[0];
      expect(sol[round.items.indexOf(c.both)]).toBe(round.requests[0] === c.other ? 'f0' : 'f1');
      expect(sol[round.items.indexOf('tin')]).toBe(round.requests[0] === 'pencils' ? 'f0' : 'f1');
      if (round.requests[0] === 'pencils') { pencilsFirst[ci]++; expect(greedyWorks(round)).toBe(false); }
      else expect(greedyWorks(round)).toBe(true);
    }
    for (let i = 0; i < 2; i++) {
      expect(perCase[i]).toBeGreaterThan(0);
      expect(pencilsFirst[i] / perCase[i]).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe('checkPlan', () => {
  const round: Round = { level: 6, open: [...PLACES], items: ['box', 'tin', 'peel', 'kite', 'caps'], requests: ['pencils', 'bed'] };
  const good: PlanMap = ['f1', 'f0', 'worm', 'mend', 'remake'];
  it('checks the cart, then misplaced things left to right, then empty friends in screen order', () => {
    expect(checkPlan(round, good)).toEqual({ kind: 'ok' });
    expect(checkPlan(round, ['f1', 'cart', 'shelf', 'cart', 'remake'])).toEqual({ kind: 'onCart', indices: [1, 3] });
    expect(checkPlan(round, ['f1', 'f0', 'shelf', 'worm', 'remake'])).toEqual({ kind: 'misplaced', index: 2, at: 'shelf' });
    expect(checkPlan(round, ['f0', 'f1', 'worm', 'mend', 'remake'])).toEqual({ kind: 'misplaced', index: 1, at: 'f1' });
    expect(checkPlan(round, ['shelf', 'shelf', 'worm', 'mend', 'remake'])).toEqual({ kind: 'unmet', friend: 0 });
    expect(checkPlan(round, ['f0', 'shelf', 'worm', 'mend', 'remake'])).toEqual({ kind: 'unmet', friend: 1 });
  });
  it('takes the tin on the shelf, in Remake and with the pencils friend, never with Bunny or the seedling friend', () => {
    expect(accepts(round, 'tin', 'shelf')).toBe(true);
    expect(accepts(round, 'tin', 'remake')).toBe(true);
    expect(accepts(round, 'tin', 'f0')).toBe(true);
    expect(accepts(round, 'tin', 'f1')).toBe(false);
    expect(accepts(round, 'tin', 'worm')).toBe(false);
    expect(accepts({ ...round, requests: ['seedling', 'pencils'] }, 'tin', 'f0')).toBe(false);
    expect(accepts(round, 'can', 'shelf')).toBe(false);
  });
  it('lets a friend hold one thing: a second gift sends the first back to the cart', () => {
    const p = moveTo(['f0', 'cart', 'cart', 'cart', 'cart'], 1, 'f0');
    expect(p.slice(0, 2)).toEqual(['cart', 'f0']);
  });
});

describe('levels 5–6 accounting', () => {
  it('scripted case A: an unchanged failed plan counts nothing, the second miss glows once, Show me one counts and swaps', () => {
    const round: Round = { level: 6, open: [...PLACES], items: ['box', 'tin', 'peel', 'kite', 'caps'], requests: ['pencils', 'bed'] };
    const t = new PlanTally();
    expect(t.ring(round, round.items.map((): Spot => 'cart')).kind).toBe('cart');
    let plan: PlanMap = ['f0', 'shelf', 'worm', 'mend', 'remake'];
    let r = t.ring(round, plan);
    expect(r).toMatchObject({ kind: 'fail', check: { kind: 'unmet', friend: 1 }, counted: true, glowed: false });
    expect([t.misses, t.hints]).toEqual([1, 0]);
    expect(t.ring(round, plan)).toMatchObject({ kind: 'fail', counted: false });
    expect(t.misses).toBe(1);
    plan = moveTo(plan, 1, 'f1');
    r = t.ring(round, plan);
    expect(r).toMatchObject({ kind: 'fail', check: { kind: 'misplaced', index: 1, at: 'f1' }, counted: true, glowed: true });
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
    expect(t.ask()).toBe('glow');
    expect(t.hints).toBe(1);
    expect(t.ask()).toBe('move');
    expect(t.hints).toBe(2);
    const m = nextMove(round, plan)!;
    expect(m).toEqual({ index: 1, to: 'f0' });
    plan = moveTo(plan, m.index, m.to);
    expect(plan).toEqual(['cart', 'f0', 'worm', 'mend', 'remake']);
    plan = moveTo(plan, 0, 'f1');
    expect(t.ring(round, plan)).toEqual({ kind: 'ok' });
    expect([t.misses, t.hints]).toEqual([2, 2]);
  });
  it('a shown hint before any miss counts once, and a later automatic glow adds nothing', () => {
    const round = roundFor(5, new Rng(3));
    const t = new PlanTally();
    expect(t.ask()).toBe('glow');
    const bad = round.items.map((id): Spot => (id === 'tin' ? 'remake' : ITEMS[id].place));
    t.ring(round, bad);
    t.ring(round, moveTo(bad, round.items.indexOf('tin'), 'shelf'));
    expect([t.misses, t.hints]).toEqual([GLOW_AFTER, 1]);
  });
});

describe('levels 5–6 help leads somewhere', () => {
  for (const level of [5, 6]) {
    it(`level ${level}: Show me one reaches a working plan from any plan, one fix at a time`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const round = roundFor(level, new Rng(seed));
        const rng = new Rng(seed * 31 + 7);
        expect(follow(round, round.items.map((): Spot => 'cart'))).toBeGreaterThan(0);
        for (let k = 0; k < 6; k++) expect(follow(round, randomPlan(round, rng))).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

describe('levels 5–6 layout', () => {
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const pad = (r: Rect): Rect => ({ x: r.x - DROP_PAD, y: r.y - DROP_PAD, w: r.w + 2 * DROP_PAD, h: r.h + 2 * DROP_PAD });
  for (const view of VIEWS) {
    for (const level of [5, 6]) {
      it(`${view.w}x${view.h} level ${level}: big targets, clear corners, no overlapping drop areas`, () => {
        const round = roundFor(level, new Rng(11));
        const l = planLayout(view, round);
        const pet = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home = { x: 0, y: 0, w: 110, h: 110 };
        const help = { x: 0, y: 110, w: 110, h: 100 };
        const places = round.open.map((p) => l.places[p]!);
        expect(l.slots).toHaveLength(5);
        expect(l.friends).toHaveLength(round.requests.length);
        for (const r of [...l.slots, l.bell, ...l.friends, ...places]) {
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          for (const corner of [pet, home, help]) expect(overlap(r, corner)).toBe(false);
        }
        expect(l.bell.w).toBeGreaterThanOrEqual(120);
        for (let i = 1; i < l.slots.length; i++) expect(l.slots[i].x - (l.slots[i - 1].x + l.slots[i - 1].w)).toBeGreaterThanOrEqual(20);
        const drops = [l.row, ...l.friends, ...places];
        for (let i = 0; i < drops.length; i++) {
          expect(overlap(pad(drops[i]), l.bell)).toBe(false);
          // Neighbouring places may share padding (the nearest wins, as at levels 1–4); nothing else may.
          for (const o of drops.slice(i + 1)) if (!(places.includes(drops[i]) && places.includes(o))) expect(overlap(pad(drops[i]), pad(o))).toBe(false);
        }
        for (const f of l.friends) expect(spotAt(l, centre(f).x, centre(f).y)).toMatch(/^f[01]$/);
        for (const p of round.open) expect(spotAt(l, centre(l.places[p]!).x, centre(l.places[p]!).y)).toBe(p);
        expect(spotAt(l, centre(l.slots[2]).x, centre(l.slots[2]).y)).toBe('cart');
      });
    }
  }
});
