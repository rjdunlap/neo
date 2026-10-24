import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  acceptedStops, ANSWER_SIZE, ART_R, canBeTooClose, clampGlass, corners, DECIDING, dropScale, dropsFor, FEATURES, helpFor, judgeSwimmers, judgeView,
  lensLayout, LensTally, LOOK_NEAR, LOOK_TIME, LookTracker, MAX_ART_SCALE, MAX_SPEED, MIN_LENS, MIN_LENS_1, nearestSwimmer, QUESTIONS, questionsFor,
  ringBox, ringHits, STOPS, STOP_SIZE, swimmerAt, swimmerSpeed, SWIMMER_FIELD, SWIMMER_LENGTH, SWIMMER_REACH, THING_GAP, THING_SIZE, visibleAt, windowOf,
  type Drop, type SampleId, type Stop,
} from './logic';

const SAMPLES = Object.keys(FEATURES) as SampleId[];
const seeds = (n: number) => Array.from({ length: n }, (_, i) => i * 7919 + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('feature tables', () => {
  it('windows lie in 1-4 with first <= last', () => {
    for (const s of SAMPLES) for (const f of FEATURES[s]) {
      expect(f.window[0]).toBeGreaterThanOrEqual(1);
      expect(f.window[1]).toBeLessThanOrEqual(4);
      expect(f.window[0]).toBeLessThanOrEqual(f.window[1]);
    }
  });
  it('visibleAt is total and non-empty at every stop', () => {
    for (const s of SAMPLES) for (const st of STOPS) expect(visibleAt(s, st).length).toBeGreaterThan(0);
  });
  it('drop-empty is the drop minus swimmers plus a close speck', () => {
    const expected = FEATURES.drop.filter((f) => f.id !== 'swimmers' && f.id !== 'swimmer-hairs').map((f) => f.id);
    expect(FEATURES['drop-empty'].map((f) => f.id)).toEqual([...expected, 'speck-close']);
    expect(FEATURES['drop-empty'].find((f) => f.id === 'speck-close')!.window).toEqual([4, 4]);
  });
  it('the whole leaf and drop leave at 3, the pinch at 2', () => {
    expect(visibleAt('leaf', 2)).toContain('leaf');
    expect(visibleAt('leaf', 3)).not.toContain('leaf');
    expect(visibleAt('drop', 2)).toContain('drop');
    expect(visibleAt('drop', 3)).not.toContain('drop');
    expect(visibleAt('sand', 1)).toContain('pinch');
    expect(visibleAt('sand', 2)).not.toContain('pinch');
  });
});

describe('level 4 questions', () => {
  const rows: [string, string, Stop[], Stop[], Stop[]][] = [
    ['leaf', 'leaf', [1, 2], [], [3, 4]],
    ['leaf', 'leaf-hairs', [2, 3], [1], [4]],
    ['leaf', 'boxes', [3, 4], [1, 2], []],
    ['leaf', 'beads', [4], [1, 2, 3], []],
    ['drop', 'drop', [1, 2], [], [3, 4]],
    ['drop', 'specks', [2, 3], [1], [4]],
    ['drop', 'swimmers', [3, 4], [1, 2], []],
    ['drop', 'swimmer-hairs', [4], [1, 2, 3], []],
    ['sand', 'pinch', [1], [], [2, 3, 4]],
    ['sand', 'grains', [2, 3], [1], [4]],
    ['sand', 'grain-bumps', [3, 4], [1, 2], []],
  ];
  it('matches the definition row for row', () => {
    expect(QUESTIONS.length).toBe(11);
    rows.forEach(([sample, feature, ok, small, close], i) => {
      const q = QUESTIONS[i];
      expect([q.sample, q.feature]).toEqual([sample, feature]);
      expect(acceptedStops(q)).toEqual(ok);
      expect(STOPS.filter((s) => judgeView(q, s) === 'too-small')).toEqual(small);
      expect(STOPS.filter((s) => judgeView(q, s) === 'too-close')).toEqual(close);
      expect(STOPS.filter((s) => judgeView(q, s) === 'ok')).toEqual(ok);
    });
  });
  it('never has an empty or full accepted set; counts of too-close / too-small match', () => {
    for (const q of QUESTIONS) {
      expect(acceptedStops(q).length).toBeGreaterThan(0);
      expect(acceptedStops(q).length).toBeLessThan(4);
    }
    expect(QUESTIONS.filter(canBeTooClose).length).toBe(6);
    expect(QUESTIONS.filter((q) => windowOf(q)[0] > 1).length).toBe(8);
  });
  it('rounds are three questions on one sample with a too-close and a late one', () => {
    for (const seed of seeds(500)) {
      const qs = questionsFor(new Rng(seed), false);
      expect(qs.length).toBe(3);
      expect(new Set(qs.map((q) => q.sample)).size).toBe(1);
      expect(new Set(qs).size).toBe(3);
      expect(qs.filter(canBeTooClose).length).toBeGreaterThanOrEqual(1);
      expect(qs.some((q) => windowOf(q)[0] >= 3)).toBe(true);
    }
  });
  it('the authored round is the leaf: boxes, whole leaf, then hairs or beads', () => {
    for (const seed of seeds(500)) {
      const qs = questionsFor(new Rng(seed), true);
      expect(qs.map((q) => q.sample)).toEqual(['leaf', 'leaf', 'leaf']);
      expect(qs[0].feature).toBe('boxes');
      expect(qs[1].feature).toBe('leaf');
      expect(['leaf-hairs', 'beads']).toContain(qs[2].feature);
    }
  });
  it('the same seed gives the same round', () => {
    for (const seed of seeds(20)) expect(questionsFor(new Rng(seed), false)).toEqual(questionsFor(new Rng(seed), false));
  });
});

describe('level 3 judging', () => {
  const populated = dropsFor(new Rng(3), true)[0];
  const empty: Drop = { swimmers: [] };
  it('is free below the deciding stop', () => {
    expect(DECIDING).toBe(3);
    for (const d of [populated, empty]) for (const st of [1, 2] as Stop[]) {
      expect(judgeSwimmers(d, st, { kind: 'none' }).result).toBe('free');
      expect(judgeSwimmers(d, st, { kind: 'tap', swimmer: 0 }).result).toBe('free');
      expect(judgeSwimmers(d, st, { kind: 'tap', swimmer: null }).result).toBe('free');
    }
  });
  it('misses only for none on a populated drop at 3-4', () => {
    for (const st of [3, 4] as Stop[]) {
      expect(judgeSwimmers(populated, st, { kind: 'none' }).result).toBe('miss');
      expect(judgeSwimmers(populated, st, { kind: 'tap', swimmer: 1 }).result).toBe('right');
      expect(judgeSwimmers(populated, st, { kind: 'tap', swimmer: null }).result).toBe('free');
      expect(judgeSwimmers(empty, st, { kind: 'none' }).result).toBe('right');
      expect(judgeSwimmers(empty, st, { kind: 'tap', swimmer: null }).result).not.toBe('miss');
      expect(judgeSwimmers(empty, st, { kind: 'tap', swimmer: 0 }).result).not.toBe('miss');
    }
  });
  it('drops: three, at least two populated, at most one empty, 2-3 swimmers', () => {
    for (const seed of seeds(500)) {
      for (const authored of [false, true]) {
        const drops = dropsFor(new Rng(seed), authored);
        expect(drops.length).toBe(3);
        const empties = drops.filter((d) => d.swimmers.length === 0).length;
        expect(empties).toBeLessThanOrEqual(1);
        for (const d of drops) if (d.swimmers.length) expect([2, 3]).toContain(d.swimmers.length);
        if (authored) {
          expect(drops[0].swimmers.length).toBe(2);
          expect(drops[0].swimmers.every((s) => s.shape === 'round')).toBe(true);
        }
      }
    }
  });
});

describe('swimmers', () => {
  const swimmers = seeds(100).flatMap((s) => dropsFor(new Rng(s), false).flatMap((d) => d.swimmers));
  it('stay inside the drop for ten minutes', () => {
    for (const s of swimmers) for (let t = 0; t <= 600; t += 0.25) {
      const p = swimmerAt(s, t);
      const d = Math.hypot(p.x, p.y);
      expect(d + SWIMMER_LENGTH / 2).toBeLessThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(SWIMMER_FIELD);
    }
  });
  it('never drift faster than the limit at the closest stop and largest lens', () => {
    for (const s of swimmers) expect(swimmerSpeed(s) * dropScale(4) * MAX_ART_SCALE).toBeLessThanOrEqual(MAX_SPEED + 1e-9);
  });
  it('are at least 100 units long on the smallest lens at stop 3', () => {
    expect(SWIMMER_LENGTH * dropScale(3) * (MIN_LENS / 2 / ART_R)).toBeGreaterThanOrEqual(100);
  });
  it('nearestSwimmer picks the closest in reach and ignores out-of-view ones', () => {
    const sw = [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 500, y: 0 }];
    expect(nearestSwimmer({ x: 40, y: 0 }, sw, 300)).toBe(1);
    expect(nearestSwimmer({ x: 10, y: 0 }, sw, 300)).toBe(0);
    expect(nearestSwimmer({ x: 0, y: SWIMMER_REACH + 40 }, sw, 300)).toBeNull();
    expect(nearestSwimmer({ x: 500, y: 0 }, sw, 300)).toBeNull();
    expect(nearestSwimmer({ x: 0, y: SWIMMER_REACH - 1 }, sw, 300)).toBe(0);
  });
});

describe('help', () => {
  it('level 3 turns to stop 3', () => expect(helpFor(3, {})).toEqual({ do: 'turn', stop: 3 }));
  it('level 4 turns to the first stop of the window, where the view is ok', () => {
    for (const q of QUESTIONS) {
      const h = helpFor(4, { question: q });
      expect(h).toEqual({ do: 'turn', stop: windowOf(q)[0] });
      expect(judgeView(q, windowOf(q)[0])).toBe('ok');
    }
  });
  it('level 2 glides to the nearest thing not yet looked at, null when all looked', () => {
    const things = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }];
    expect(helpFor(2, { glass: { x: 190, y: 0 }, things, looked: new Set() })).toEqual({ do: 'glide', to: 2 });
    expect(helpFor(2, { glass: { x: 190, y: 0 }, things, looked: new Set([2]) })).toEqual({ do: 'glide', to: 1 });
    expect(helpFor(2, { glass: { x: 190, y: 0 }, things, looked: new Set([0, 1, 2]) })).toBeNull();
  });
  it('level 1 says tap the lens', () => expect(helpFor(1, {})).toEqual({ do: 'tap-lens' }));
});

describe('LensTally', () => {
  it('counts a scripted question and resets on next', () => {
    const t = new LensTally();
    t.miss();
    expect(t.glow).toBe(false);
    expect(t.hint()).toBe(true);
    expect(t.hint()).toBe(false);
    t.miss();
    expect([t.misses, t.hints, t.glow]).toEqual([2, 1, true]);
    t.next();
    expect(t.glow).toBe(false);
    expect(t.hint()).toBe(true);
    expect([t.misses, t.hints]).toEqual([2, 2]);
  });
});

describe('LookTracker', () => {
  const things = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 600, y: 0 }];
  it('counts after the dwell, once each, done at three', () => {
    const lt = new LookTracker();
    const dwell = (i: number) => {
      let got: number | null = null;
      for (let k = 0; k < 20; k++) got = lt.update(LOOK_TIME / 10, { x: things[i].x + LOOK_NEAR - 1, y: 0 }, things) ?? got;
      return got;
    };
    expect(lt.update(LOOK_TIME - 0.05, things[0], things)).toBeNull();
    expect(lt.update(0.1, things[0], things)).toBe(0);
    expect(lt.update(5, things[0], things)).toBeNull();
    expect(lt.done).toBe(false);
    expect(dwell(1)).toBe(1);
    expect(lt.done).toBe(false);
    expect(dwell(2)).toBe(2);
    expect(lt.done).toBe(true);
    expect(lt.looked.size).toBe(3);
  });
  it('does not count beyond LOOK_NEAR, and moving away resets the dwell', () => {
    const lt = new LookTracker();
    expect(lt.update(5, { x: LOOK_NEAR + 1, y: 0 }, things)).toBeNull();
    lt.update(LOOK_TIME - 0.1, things[0], things);
    lt.update(0.1, { x: 150, y: 0 }, things);
    expect(lt.update(0.2, things[0], things)).toBeNull();
    expect(lt.update(LOOK_TIME, things[0], things)).toBe(0);
  });
});

describe('layout', () => {
  for (const [name, v] of Object.entries(views)) for (const level of [1, 2, 3, 4]) {
    it(`${name} level ${level}`, () => {
      const l = lensLayout(v, level);
      expect(l).not.toBeNull();
      if (!l) return;
      const rects = [...l.stops, ...(l.answer ? [l.answer] : []), ...l.things.map(ringBox), ...(l.paw ? [ringBox(l.paw)] : [])];
      if (level >= 3) {
        expect(l.stops.length).toBe(4);
        for (const s of l.stops) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(STOP_SIZE);
        expect(Math.min(l.answer!.w, l.answer!.h)).toBeGreaterThanOrEqual(ANSWER_SIZE);
      }
      if (level !== 2) expect(l.lens.r * 2).toBeGreaterThanOrEqual(level === 1 ? MIN_LENS_1 : MIN_LENS);
      if (level === 2) {
        expect(l.things.length).toBe(3);
        for (const t of l.things) expect(t.r * 2).toBeGreaterThanOrEqual(THING_SIZE);
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
          expect(Math.hypot(l.things[i].x - l.things[j].x, l.things[i].y - l.things[j].y) - l.things[i].r - l.things[j].r).toBeGreaterThanOrEqual(THING_GAP);
        }
      }
      const all = level === 2 ? rects : [...rects, ringBox(l.lens)];
      for (const r of all) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h).toBeLessThanOrEqual(v.h);
      }
      for (const r of rects) for (const k of corners(v)) {
        expect(r.x < k.x + k.w && k.x < r.x + r.w && r.y < k.y + k.h && k.y < r.y + r.h).toBe(false);
      }
      if (level !== 2) for (const k of corners(v)) expect(ringHits(l.lens, k)).toBe(false);
      rects.forEach((a, i) => rects.forEach((b, j) => {
        if (i < j) expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
      }));
      if (level !== 2) for (const r of rects) expect(ringHits(l.lens, r)).toBe(false);
    });
  }
  it('clampGlass keeps the glass inside the table', () => {
    const l = lensLayout(views.landscape, 2)!;
    const t = l.table!;
    for (const p of [{ x: -999, y: -999 }, { x: 9999, y: 9999 }, { x: t.x + t.w / 2, y: t.y + t.h / 2 }]) {
      const c = clampGlass(p, t);
      expect(c.x).toBeGreaterThanOrEqual(t.x + 125);
      expect(c.x).toBeLessThanOrEqual(t.x + t.w - 125);
      expect(c.y).toBeGreaterThanOrEqual(t.y + 125);
      expect(c.y).toBeLessThanOrEqual(t.y + t.h - 125);
    }
    expect(clampGlass({ x: t.x + t.w / 2, y: t.y + t.h / 2 }, t)).toEqual({ x: t.x + t.w / 2, y: t.y + t.h / 2 });
  });
});
