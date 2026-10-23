import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { WHERE_WORDS } from '../peekaround-island/logic';
import {
  LANDMARKS, PATH_WORDS, STOPS, askHint, askedSlot, botSlot, callAt, choose, groupOf, makeRoute, restart, startWalk, step, stopLayout, waysAt, wayInSlot,
  type Rect, type WalkState,
} from './logic';

const seeds = Array.from({ length: 500 }, (_, i) => i + 1);
const hit = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

describe('Adventure Walk: table', () => {
  it('has five landmarks, two different words each, and every path word turns up', () => {
    expect(LANDMARKS).toHaveLength(5);
    const all = new Set<string>();
    for (const l of LANDMARKS) {
      expect(l.ways[0].word).not.toBe(l.ways[1].word);
      expect(l.ways[0].sound).not.toBe(l.ways[1].sound);
      for (const w of l.ways) { all.add(w.word); expect(PATH_WORDS).toContain(w.word); expect(w.phrase.startsWith(w.word)).toBe(true); }
    }
    expect([...all].sort()).toEqual([...PATH_WORDS].sort());
  });
  it('shares no word with Peekaround Island', () => {
    const where = Object.values(WHERE_WORDS);
    for (const l of LANDMARKS) for (const w of l.ways) for (const p of where) expect(w.phrase).not.toContain(p);
  });
});

describe('Adventure Walk: routes', () => {
  for (const level of [1, 2, 3]) {
    it(`level ${level}: three different landmarks, deterministic, every landmark and side used`, () => {
      const seen = new Set<string>();
      const firsts = new Set<number>();
      for (const seed of seeds) {
        const r = makeRoute(level, new Rng(seed));
        expect(r.stops).toHaveLength(STOPS);
        expect(new Set(r.stops.map((s) => s.landmark)).size).toBe(STOPS);
        expect(makeRoute(level, new Rng(seed))).toEqual(r);
        r.stops.forEach((s) => { seen.add(s.landmark); firsts.add(s.first); });
      }
      expect(seen.size).toBe(5);
      expect(firsts.size).toBe(2);
    });
  }
  it('levels 2 and 3 ask for at least two words and both sides in every round', () => {
    for (const level of [2, 3]) {
      for (const seed of seeds) {
        const r = makeRoute(level, new Rng(seed));
        expect(new Set(r.stops.map((s) => waysAt(s)[s.asked!].word)).size).toBeGreaterThanOrEqual(2);
        expect(new Set(r.stops.map(askedSlot)).size).toBe(2);
      }
    }
  });
  it('level 1 asks for nothing; level 3 calls stops 0-1 together, then 2', () => {
    const r1 = makeRoute(1, new Rng(1));
    expect(r1.stops.every((s) => s.asked === null)).toBe(true);
    const r3 = makeRoute(3, new Rng(1));
    expect(callAt(r3, 0)).toEqual([0, 1]);
    expect(callAt(r3, 1)).toBeNull();
    expect(callAt(r3, 2)).toEqual([2]);
    expect(groupOf(r3, 1)).toEqual([0, 1]);
  });
});

describe('Adventure Walk: choices', () => {
  it('level 1: every way at every stop goes', () => {
    for (const seed of seeds.slice(0, 50)) {
      const r = makeRoute(1, new Rng(seed));
      r.stops.forEach((_, i) => { expect(choose(r, i, 0).kind).toBe('go'); expect(choose(r, i, 1).kind).toBe('go'); });
    }
  });
  it('levels 2-3: only the asked way goes; the other names both words', () => {
    for (const seed of seeds.slice(0, 50)) {
      const r = makeRoute(2, new Rng(seed));
      r.stops.forEach((s, i) => {
        expect(choose(r, i, s.asked!).kind).toBe('go');
        const o = choose(r, i, (1 - s.asked!) as 0 | 1);
        expect(o.kind).toBe('other');
        if (o.kind === 'other') expect(o.took.word).not.toBe(o.asked.word);
      });
    }
  });
  it('drawn slots map to the two ways', () => {
    const r = makeRoute(2, new Rng(9));
    for (const s of r.stops) expect(new Set([wayInSlot(s, 0), wayInSlot(s, 1)])).toEqual(new Set([0, 1]));
  });
});

describe('Adventure Walk: misses and hints', () => {
  const wrongSlot = (s: WalkState): 0 | 1 => (askedSlot(s.route.stops[s.stop]) === 0 ? 1 : 0);
  it('level 1 is always 0/0 and reaches the picnic', () => {
    const s = startWalk(1, new Rng(3));
    for (let i = 0; i < STOPS; i++) { const r = step(s, (i % 2) as 0 | 1); expect(r.kind).toBe('go'); }
    expect([s.misses, s.hints, s.stop]).toEqual([0, 0, STOPS]);
  });
  it('a scripted level-2 round: misses count each wrong tap; two at a stop light the way once; Show a hint is once per stop', () => {
    const s = startWalk(2, new Rng(5));
    expect(step(s, wrongSlot(s)).kind).toBe('other');
    expect([s.misses, s.hints, s.glow]).toEqual([1, 0, false]);
    const second = step(s, wrongSlot(s));
    expect(second.kind === 'other' && second.glow).toBe(true);
    expect([s.misses, s.hints, s.glow]).toEqual([2, 1, true]);
    step(s, wrongSlot(s));
    expect([s.misses, s.hints]).toEqual([3, 1]);
    expect(step(s, askedSlot(s.route.stops[s.stop])!).kind).toBe('go');
    expect([s.glow, s.stop]).toEqual([false, 1]);
    expect(step(s, wrongSlot(s)).kind).toBe('other');
    expect(askHint(s)).toBe('glow');
    expect(askHint(s)).toBe('repeat');
    expect(s.hints).toBe(2);
  });
  it('Show a hint does nothing at level 1', () => {
    const s = startWalk(1, new Rng(2));
    expect(askHint(s)).toBe('none');
    expect(s.hints).toBe(0);
  });
  it('start again returns to stop 1 and keeps the counts', () => {
    const s = startWalk(2, new Rng(4));
    step(s, wrongSlot(s));
    step(s, askedSlot(s.route.stops[0])!);
    restart(s);
    expect([s.stop, s.misses]).toEqual([0, 1]);
  });
  it('the bot finishes every level with no misses', () => {
    for (const level of [1, 2, 3]) {
      for (const seed of seeds.slice(0, 60)) {
        const s = startWalk(level, new Rng(seed));
        for (let i = 0; i < STOPS; i++) expect(step(s, botSlot(s)).kind).toBe('go');
        expect(s.misses).toBe(0);
        expect(s.stop).toBe(STOPS);
      }
    }
  });
});

describe('Adventure Walk: layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), phone: computeView(844, 390), notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }) };
  for (const [name, view] of Object.entries(views)) {
    for (const level of [1, 2, 3]) {
      it(`fits level ${level} in ${name}`, () => {
        const l = stopLayout(view, level);
        const targets = l.badge ? [...l.zones, l.badge] : [...l.zones];
        for (const r of targets) {
          expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w); expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          expect(r.w).toBeGreaterThanOrEqual(100); expect(r.h).toBeGreaterThanOrEqual(100);
        }
        expect(l.zones[0].w).toBeGreaterThanOrEqual(view.w >= view.h ? 280 : 300);
        expect(l.zones[0].h).toBeGreaterThanOrEqual(view.w >= view.h ? 260 : 240);
        expect(hit(l.zones[0], l.zones[1], 39)).toBe(false);
        if (l.badge) for (const z of l.zones) expect(hit(z, l.badge)).toBe(false);
        const pet: Rect = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home: Rect = { x: 0, y: 0, w: 110, h: 110 };
        for (const r of targets) { expect(hit(r, pet)).toBe(false); expect(hit(r, home)).toBe(false); }
        expect(l.stand.y).toBeLessThanOrEqual(view.h);
      });
    }
  }
});
