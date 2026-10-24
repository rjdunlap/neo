import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  centre, GLOW_AFTER, ITEM_IDS, ITEMS, judge, KIND_OF_PLACE, PLACES, placeAt, planFor, PLANS, roundFor, shedLayout, ShedTally,
  type Place, type Rect,
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
      expect(id).not.toContain('tin');
    }
  });
  it('has at least two items for every place', () => {
    for (const p of PLACES) expect(ITEM_IDS.filter((id) => ITEMS[id].place === p).length).toBeGreaterThanOrEqual(2);
  });
});

describe('rounds', () => {
  for (const plan of PLANS) {
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
