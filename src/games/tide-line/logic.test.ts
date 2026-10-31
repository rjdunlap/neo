import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  BAND, BAND_LEVELS, CREATURES, CycleCounter, DOWN, HIGHS, PAIL, PET, PailTurn, UP, clampFeet, cornerButtons, creatureSpot, drySpot, fifthCrossed, hAt, highFor, isDry, overlaps,
  pailBox, petCorner, reach, seaGrab, shoreLayout, tidePlan, waterAt, wetSpot, wrack, yAt, type Box,
} from './logic';

const seeds = Array.from({ length: 500 }, (_, i) => i + 1);
const views = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })];
const inside = (b: Box, w: number, h: number) => b.x >= 0 && b.y >= 0 && b.x + b.w <= w && b.y + b.h <= h;

describe('the sea', () => {
  it('stays within low..high, rises over the first half, falls over the second', () => {
    for (const seed of seeds) {
      const rng = new Rng(seed);
      const low = rng.next() * 0.1;
      const high = HIGHS[seed % 3];
      expect(waterAt(0, low, high)).toBeCloseTo(low, 9);
      expect(waterAt(0.5, low, high)).toBeCloseTo(high, 9);
      let prev = waterAt(0, low, high);
      for (let i = 1; i <= 100; i++) {
        const w = waterAt(i / 200, low, high);
        expect(w).toBeGreaterThanOrEqual(low - 1e-9);
        expect(w).toBeLessThanOrEqual(high + 1e-9);
        expect(w).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = w;
      }
      for (let i = 101; i <= 200; i++) {
        const w = waterAt(i / 200, low, high);
        expect(w).toBeLessThanOrEqual(prev + 1e-9);
        prev = w;
      }
    }
  });

  it('counts one cycle per rise past UP then fall below DOWN', () => {
    const c = new CycleCounter();
    const run = (hs: number[]) => hs.filter((h) => c.feed(h)).length;
    let done = 0;
    for (let k = 1; k <= 3; k++) {
      done += run(Array.from({ length: 101 }, (_, i) => waterAt(i / 100, 0, 1)));
      expect(c.cycles).toBe(k);
    }
    expect(done).toBe(3);
  });

  it('ignores jitter around UP that never falls below DOWN', () => {
    const c = new CycleCounter();
    for (let i = 0; i < 50; i++) c.feed(UP + (i % 2 ? 0.02 : -0.02) + 0.05 * (i % 3 === 0 ? 1 : 0));
    expect(c.cycles).toBe(0);
    expect(c.up).toBe(true);
    c.feed(DOWN + 0.01);
    expect(c.cycles).toBe(0);
    c.feed(DOWN - 0.01);
    expect(c.cycles).toBe(1);
  });

  it('plays each fifth once on a full rise and none on a fall', () => {
    const rise: (number | null)[] = [];
    let prev = 0;
    for (let i = 1; i <= 100; i++) {
      const w = waterAt(i / 200, 0, 1);
      rise.push(fifthCrossed(prev, w));
      prev = w;
    }
    const got = rise.filter((x): x is number => x !== null);
    expect(got).toEqual([0, 1, 2, 3]);
    for (let i = 101; i <= 200; i++) {
      const w = waterAt(i / 200, 0, 1);
      expect(fifthCrossed(prev, w)).toBeNull();
      prev = w;
    }
  });
});

describe('the seaweed line', () => {
  it('is a band centred on the high; dry exactly when feet are above its top', () => {
    for (const h of HIGHS) {
      const w = wrack(h);
      expect(w.mid).toBe(h);
      expect(w.top - w.bottom).toBeCloseTo(BAND, 9);
      expect((w.top + w.bottom) / 2).toBeCloseTo(h, 9);
      expect(isDry(w.top + 1e-6, [h])).toBe(true);
      expect(isDry(w.top, [h])).toBe(false);
      expect(isDry(h, [h])).toBe(false);
      expect(isDry(reach(h), [h])).toBe(false);
      expect(reach(h)).toBeCloseTo(w.top, 9);
    }
  });

  it('with two highs, dry means above the higher', () => {
    expect(isDry(wrack(0.45).top + 0.01, [0.45, 0.65])).toBe(false);
    expect(isDry(wrack(0.65).top + 0.01, [0.45, 0.65])).toBe(true);
  });

  it('seeds highs only from HIGHS and uses all three', () => {
    const seen = new Set<number>();
    for (const s of seeds) seen.add(highFor(new Rng(s)));
    for (const h of seen) expect(HIGHS as readonly number[]).toContain(h);
    expect(seen.size).toBe(3);
  });

  it('is deterministic per seed', () => {
    for (const s of seeds.slice(0, 50)) expect(highFor(new Rng(s))).toBe(highFor(new Rng(s)));
  });
});

describe('PailTurn', () => {
  const wet = wrack(0.55).bottom;
  const dry = wrack(0.55).top + 0.1;

  it('counts a wet wave as one miss, glows and hints on the second', () => {
    const t = new PailTurn();
    expect(t.wave(wet, 0.55)).toEqual({ dry: false, glow: false });
    expect(t.misses).toBe(1);
    expect(t.glow).toBe(false);
    expect(t.hint).toBe(false);
    expect(t.wave(wet, 0.55)).toEqual({ dry: false, glow: true });
    expect(t.misses).toBe(2);
    expect(t.glow && t.hint).toBe(true);
    expect(t.wave(wet, 0.55).glow).toBe(false);
    expect(t.misses).toBe(3);
  });

  it('asks glow then carry, and the hint is a flag so it counts once', () => {
    const t = new PailTurn();
    expect(t.ask()).toBe('glow');
    expect(t.hint).toBe(true);
    expect(t.ask()).toBe('carry');
    expect(t.ask()).toBe('carry');
    t.wave(wet, 0.55);
    t.wave(wet, 0.55);
    expect(t.hint).toBe(true);
    expect(t.misses).toBe(2);
    expect(t.wave(wet, 0.55).glow).toBe(false);
  });

  it('a dry wave ends the turn and nothing changes after', () => {
    const t = new PailTurn();
    t.wave(wet, 0.55);
    expect(t.wave(dry, 0.55)).toEqual({ dry: true, glow: false });
    expect(t.done).toBe(true);
    const snap = { m: t.misses, h: t.hint, g: t.glow };
    expect(t.wave(wet, 0.55).dry).toBe(true);
    expect(t.ask()).toBeNull();
    expect({ m: t.misses, h: t.hint, g: t.glow }).toEqual(snap);
  });

  it('following the hint (drySpot) makes the next wave dry from any wet state', () => {
    for (const view of views) {
      const L = shoreLayout(view);
      for (const high of HIGHS) {
        for (const asks of [0, 1, 2]) {
          const t = new PailTurn();
          const w = wetSpot(L, view, high);
          t.wave(hAt(L, w.y), high);
          for (let i = 0; i < asks; i++) t.ask();
          const d = drySpot(L, view, high);
          expect(t.wave(hAt(L, d.y), high).dry).toBe(true);
          expect(t.done).toBe(true);
        }
      }
    }
  });
});

describe('layout', () => {
  for (const view of views) {
    const tag = `${view.w}x${view.h}`;
    const L = shoreLayout(view);
    const pet = petCorner(view);
    const clear = (b: Box, what: string) => {
      expect(inside(b, view.w, view.h), `${tag} ${what} on screen ${JSON.stringify(b)}`).toBe(true);
      expect(overlaps(b, pet), `${tag} ${what} pet`).toBe(false);
      for (const c of cornerButtons(view)) expect(overlaps(b, c), `${tag} ${what} corner`).toBe(false);
    };

    it(`${tag}: dry and wet spots, round trips`, () => {
      for (const h of [0, 0.3, 1]) expect(hAt(L, yAt(L, h))).toBeCloseTo(h, 9);
      for (const high of HIGHS) {
        const d = drySpot(L, view, high);
        expect(hAt(L, d.y), `${tag} dry ${high}`).toBeGreaterThan(wrack(high).top);
        expect(d.x >= L.sand.x && d.x <= L.sand.x + L.sand.w && d.y >= L.sand.y && d.y <= L.sand.y + L.sand.h).toBe(true);
        clear(pailBox(d.x, d.y), `dry ${high}`);
        const w = wetSpot(L, view, high);
        expect(isDry(hAt(L, w.y), [high]), `${tag} wet ${high}`).toBe(false);
      }
    });

    it(`${tag}: roomy dry zone, tray, sea grab`, () => {
      expect(yAt(L, wrack(0.65).top) - L.sand.y).toBeGreaterThanOrEqual(140);
      clear(pailBox(L.tray.x, L.tray.y), 'tray');
      for (const crest of [yAt(L, 0), yAt(L, 0.95)]) {
        const g = seaGrab(view, crest);
        expect(g.h).toBeGreaterThanOrEqual(140);
        expect(inside(g, view.w, view.h), `${tag} grab ${crest}`).toBe(true);
        expect(overlaps(g, pet)).toBe(false);
      }
    });

    it(`${tag}: clampFeet keeps feet in the sand and the pail clear of the pet`, () => {
      const pts = [[-500, -500], [0, view.h + 500], [10, view.h - 10], [PET.w / 2, view.h], [view.w + 500, view.h + 500], [view.w / 2, L.sand.y - 99], [30, L.low]];
      for (const [x, y] of pts) {
        const p = clampFeet(L, view, x, y);
        expect(p.x >= L.sand.x && p.x <= L.sand.x + L.sand.w && p.y >= L.sand.y && p.y <= L.sand.y + L.sand.h, `${tag} ${x},${y}`).toBe(true);
        expect(overlaps(pailBox(p.x, p.y), pet), `${tag} ${x},${y} pet`).toBe(false);
      }
    });

    it(`${tag}: creatures are on screen, clear and apart`, () => {
      const boxes = CREATURES.map((c) => {
        const p = creatureSpot(L, view, c);
        return { x: p.x - 55, y: p.y - 50, w: 110, h: 100 };
      });
      boxes.forEach((b, i) => {
        clear(b, `creature ${i}`);
        for (let j = i + 1; j < boxes.length; j++) expect(overlaps(b, boxes[j]), `${tag} creatures ${i},${j}`).toBe(false);
      });
    });

    it(`${tag}: drySpot avoids a placed pail`, () => {
      for (const high of HIGHS) {
        const first = drySpot(L, view, high);
        const second = drySpot(L, view, high, [first]);
        expect(Math.abs(second.x - first.x)).toBeGreaterThanOrEqual(PAIL);
      }
    });
  }
});

describe('levels and bands', () => {
  it('lap 1, toddler 1-2, preschool 2, nothing else', () => {
    expect(BAND_LEVELS).toEqual({ lap: { min: 1, max: 1 }, toddler: { min: 1, max: 2 }, preschool: { min: 2, max: 2 } });
  });
  it('level 1 is the wave, level 2 the pail', () => {
    expect(tidePlan(1).mode).toBe('wave');
    expect(tidePlan(2).mode).toBe('pail');
  });
});

describe('speech', () => {
  it('avoids moon, clock, metres and frightening or litter words', () => {
    const forbidden = ['moon', 'clock', "o'clock", 'metre', 'meter', 'danger', 'drown', 'litter', 'rubbish', 'trash'];
    const ids = Object.keys(SCRIPT).filter((id) => id.startsWith('tl.'));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const v = (SCRIPT as Record<string, unknown>)[id];
      const text = JSON.stringify(v).toLowerCase();
      for (const w of forbidden) expect(text, `${id} says ${w}`).not.toContain(w);
    }
  });
});
