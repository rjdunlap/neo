import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  AUTHORED_STRIP, BAND, BAND_LEVELS, CREATURES, CycleCounter, DOWN, HIGHS, LineRound, PAIL, PET, PIC, PailTurn, SIZES, SLOTS, StripTurn, THINGS, UP, WINDY, answerOf, betweenSpot,
  drySpots, hitSize, lineTray, linesFor, makeStrip, seaReach, stripLayout, thingBox, wrongLine, type Pic, type Thing, type WrongLine, clampFeet, cornerButtons, creatureSpot, drySpot, fifthCrossed, hAt, highFor, isDry, overlaps,
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
  it('lap 1, toddler 1-2, preschool 2-3, pre-K 3-4, nothing else', () => {
    expect(BAND_LEVELS).toEqual({ lap: { min: 1, max: 1 }, toddler: { min: 1, max: 2 }, preschool: { min: 2, max: 3 }, prek: { min: 3, max: 4 } });
  });
  it('level 1 is the wave, 2 the pail, 3 the line, 4 the cycle', () => {
    expect(tidePlan(1).mode).toBe('wave');
    expect(tidePlan(2).mode).toBe('pail');
    expect(tidePlan(3).mode).toBe('line');
    expect(tidePlan(4).mode).toBe('cycle');
  });
});

const sandBox = (L: ReturnType<typeof shoreLayout>, p: { x: number; y: number }) => p.x >= L.sand.x && p.x <= L.sand.x + L.sand.w && p.y >= L.sand.y && p.y <= L.sand.y + L.sand.h;
const roundCases = HIGHS.flatMap((high) => [0, 1].map((round) => ({ high, round, lines: linesFor(round, high) })));
const feetOf = (L: ReturnType<typeof shoreLayout>, spots: Record<Thing, { y: number }>) => Object.fromEntries(THINGS.map((t) => [t, hAt(L, spots[t].y)])) as Record<Thing, number>;

describe('level 3: lines', () => {
  it('round 0 has one line; round 1 adds a higher windy line within 0.12..0.85 of it', () => {
    for (const high of HIGHS) {
      expect(linesFor(0, high)).toEqual([high]);
      const l = linesFor(1, high);
      expect(l).toHaveLength(2);
      expect(l[0]).toBe(high);
      expect(l[1] - l[0]).toBeGreaterThanOrEqual(0.12 - 1e-9);
      expect(l[1]).toBeLessThanOrEqual(0.85 + 1e-9);
      expect(l[1]).toBeGreaterThan(l[0]);
      expect(l[1] - l[0]).toBeLessThanOrEqual(WINDY + 1e-9);
      expect(seaReach(l)).toBeCloseTo(wrack(Math.max(...l)).top, 9);
      expect(seaReach(l)).toBeGreaterThan(seaReach([high]));
    }
  });

  const wetAll: Record<Thing, number> = { pail: 0, flag: 0, towel: 0 };
  const dryAll: Record<Thing, number> = { pail: 0.99, flag: 0.99, towel: 0.99 };

  it('misses are the number of wet things per wave', () => {
    const r = new LineRound([0.55]);
    expect(r.wave({ pail: 0.99, flag: 0, towel: 0.99 }).wet).toEqual(['flag']);
    expect(r.misses).toBe(1);
    expect(r.glow).toBe(false);
    expect(r.wave({ pail: 0, flag: 0.99, towel: 0.99 }).wet).toEqual(['pail']);
    expect(r.misses).toBe(2);
    expect(r.glow && r.hint).toBe(true);
  });

  it('a single wave with two or more wet things glows at once; the hint is a flag', () => {
    const r = new LineRound([0.55]);
    expect(r.wave(wetAll)).toEqual({ wet: ['pail', 'flag', 'towel'], glow: true });
    expect(r.misses).toBe(3);
    expect(r.hint).toBe(true);
    expect(r.wave(wetAll).glow).toBe(false);
    expect(r.hint).toBe(true);
  });

  it('asks glow then carry; done when nothing is wet and then nothing changes', () => {
    const r = new LineRound([0.55]);
    expect(r.ask()).toBe('glow');
    expect(r.ask()).toBe('carry');
    expect(r.hint).toBe(true);
    expect(r.wave(dryAll)).toEqual({ wet: [], glow: false });
    expect(r.done).toBe(true);
    expect(r.glow).toBe(false);
    const snap = { m: r.misses, h: r.hint, g: r.glow };
    expect(r.wave(wetAll).wet).toEqual([]);
    expect(r.ask()).toBeNull();
    expect({ m: r.misses, h: r.hint, g: r.glow }).toEqual(snap);
  });

  it('with two lines a thing between them is wet', () => {
    const lines = linesFor(1, 0.55);
    const r = new LineRound(lines);
    expect(r.wave({ pail: wrack(lines[0]).top + 0.02, flag: 0.99, towel: 0.99 }).wet).toEqual(['pail']);
  });

  for (const view of views) {
    const tag = `${view.w}x${view.h}`;
    const L = shoreLayout(view);
    const pet = petCorner(view);
    const clear = (b: Box, what: string) => {
      expect(inside(b, view.w, view.h), `${tag} ${what} on screen ${JSON.stringify(b)}`).toBe(true);
      expect(overlaps(b, pet), `${tag} ${what} pet`).toBe(false);
      for (const c of cornerButtons(view)) expect(overlaps(b, c), `${tag} ${what} corner`).toBe(false);
    };

    it(`${tag}: drySpots are dry, in the sand, on screen, clear and apart; following them finishes the round`, () => {
      for (const { high, round, lines } of roundCases) {
        const spots = drySpots(L, view, lines);
        const feet = feetOf(L, spots);
        const what = `high ${high} round ${round}`;
        THINGS.forEach((t, i) => {
          expect(isDry(feet[t], lines), `${tag} ${what} ${t} dry`).toBe(true);
          expect(sandBox(L, spots[t]), `${tag} ${what} ${t} sand`).toBe(true);
          const b = thingBox(t, spots[t].x, spots[t].y);
          clear(b, `${what} ${t}`);
          for (const u of THINGS.slice(i + 1)) expect(overlaps(b, thingBox(u, spots[u].x, spots[u].y)), `${tag} ${what} ${t}/${u}`).toBe(false);
        });
        for (const asks of [0, 1, 2]) {
          const r = new LineRound(lines);
          r.wave(feetOf(L, lineTray(L, view).spots));
          for (let k = 0; k < asks; k++) r.ask();
          expect(r.wave(feet).wet, `${tag} ${what}`).toEqual([]);
          expect(r.done).toBe(true);
        }
      }
    });

    it(`${tag}: betweenSpot is wet against both lines but dry against the lower alone`, () => {
      for (const high of HIGHS) {
        const lines = linesFor(1, high);
        for (const t of THINGS) {
          for (const fx of [0.5, 0.3, 0.7]) {
            const p = betweenSpot(L, view, lines, t, fx);
            const h = hAt(L, p.y);
            expect(isDry(h, lines), `${tag} ${high} ${t} wet`).toBe(false);
            expect(isDry(h, [lines[0]]), `${tag} ${high} ${t} dry vs lower`).toBe(true);
            clear(thingBox(t, p.x, p.y), `between ${t}`);
          }
        }
      }
    });

    it(`${tag}: lineTray spots and button are on screen, clear and apart, with wet feet`, () => {
      const { spots, button } = lineTray(L, view);
      expect(button.w).toBe(130);
      expect(button.h).toBe(120);
      clear(button, 'button');
      const boxes = THINGS.map((t) => ({ t, b: thingBox(t, spots[t].x, spots[t].y) }));
      boxes.forEach(({ t, b }, i) => {
        clear(b, `tray ${t}`);
        expect(overlaps(b, button), `${tag} ${t}/button`).toBe(false);
        for (const o of boxes.slice(i + 1)) expect(overlaps(b, o.b), `${tag} ${t}/${o.t}`).toBe(false);
        for (const high of HIGHS) for (const lines of [linesFor(0, high), linesFor(1, high)]) expect(isDry(hAt(L, spots[t].y), lines), `${tag} ${t} tray wet`).toBe(false);
      });
    });

    it(`${tag}: clampFeet with sizes keeps a flag's top no higher than a pail's, in the sand, clear of the pet and corners`, () => {
      const pts = [[-500, -500], [0, view.h + 500], [10, view.h - 10], [PET.w / 2, view.h], [view.w + 500, -500], [view.w / 2, L.sand.y - 99], [30, L.low], [view.w, L.sand.y]];
      for (const [x, y] of pts) {
        const pailTop = clampFeet(L, view, x, y).y - PAIL;
        for (const t of THINGS) {
          const p = clampFeet(L, view, x, y, SIZES[t]);
          expect(sandBox(L, p), `${tag} ${t} ${x},${y} sand`).toBe(true);
          expect(p.y - SIZES[t].h, `${tag} ${t} top ${x},${y}`).toBeGreaterThanOrEqual(L.sand.y - PAIL - 1e-9);
          expect(overlaps(thingBox(t, p.x, p.y), pet), `${tag} ${t} ${x},${y} pet`).toBe(false);
          for (const c of cornerButtons(view)) expect(overlaps(thingBox(t, p.x, p.y), c), `${tag} ${t} ${x},${y} corner`).toBe(false);
        }
        expect(pailTop).toBeGreaterThanOrEqual(L.sand.y - PAIL - 1e-9);
      }
      expect(clampFeet(L, view, 500, 400, SIZES.pail)).toEqual(clampFeet(L, view, 500, 400));
    });
  }

  it('touch sizes are at least 120 each way', () => {
    for (const t of THINGS) {
      expect(hitSize(t).w).toBeGreaterThanOrEqual(120);
      expect(hitSize(t).h).toBeGreaterThanOrEqual(120);
    }
  });
});

describe('level 4: the strip', () => {
  it('alternates high and low with exactly one gap; cards are a permutation with one right answer, never mid as the answer', () => {
    const gaps = new Set<number>();
    const starts = new Set<string>();
    for (const seed of seeds) {
      const s = makeStrip(new Rng(seed));
      expect(s.pics).toHaveLength(SLOTS);
      s.pics.forEach((p, i) => i > 0 && expect(p).not.toBe(s.pics[i - 1]));
      expect(Number.isInteger(s.gap) && s.gap >= 0 && s.gap < SLOTS).toBe(true);
      expect([...s.cards].sort()).toEqual(['high', 'low', 'mid']);
      expect(s.cards.filter((c) => c === answerOf(s))).toHaveLength(1);
      expect(answerOf(s)).not.toBe('mid');
      gaps.add(s.gap);
      starts.add(s.pics[0]);
    }
    expect(gaps.size).toBe(SLOTS);
    expect(starts.size).toBe(2);
  });

  it('is deterministic per seed, and the authored strip is valid', () => {
    for (const seed of seeds.slice(0, 50)) expect(makeStrip(new Rng(seed))).toEqual(makeStrip(new Rng(seed)));
    const a = AUTHORED_STRIP;
    expect(a.pics).toHaveLength(SLOTS);
    a.pics.forEach((p, i) => i > 0 && expect(p).not.toBe(a.pics[i - 1]));
    expect([...a.cards].sort()).toEqual(['high', 'low', 'mid']);
    expect(answerOf(a)).toBe('low');
    expect(a.gap).toBeLessThan(SLOTS);
  });

  it('wrongLine: mid is halfway; otherwise names the neighbour and the wrong card is that neighbour kind', () => {
    for (const seed of seeds) {
      const s = makeStrip(new Rng(seed));
      expect(wrongLine(s, 'mid')).toBe('tl.halfway');
      const wrong = (['high', 'low'] as const).find((c) => c !== answerOf(s))!;
      const line = wrongLine(s, wrong);
      const neighbour = s.gap > 0 ? s.pics[s.gap - 1] : s.pics[1];
      const expected: WrongLine = s.gap > 0 ? (neighbour === 'high' ? 'tl.after-in' : 'tl.after-out') : neighbour === 'high' ? 'tl.before-in' : 'tl.before-out';
      expect(line).toBe(expected);
      expect(wrong).toBe(neighbour);
    }
  });

  const strip = (gap: number) => makeStrip(new Rng(gap + 1));
  const wrongCard = (s: ReturnType<typeof makeStrip>): Pic => (s.cards.find((c) => c !== answerOf(s)) as Pic);

  it('StripTurn: a wrong tap is a miss, glow and hint on the second, hint once', () => {
    const s = strip(1);
    const t = new StripTurn(s);
    expect(t.tap(wrongCard(s))).toEqual({ right: false, glow: false });
    expect(t.misses).toBe(1);
    expect(t.hint).toBe(false);
    expect(t.tap(wrongCard(s))).toEqual({ right: false, glow: true });
    expect(t.glow && t.hint).toBe(true);
    expect(t.tap(wrongCard(s)).glow).toBe(false);
    expect(t.misses).toBe(3);
  });

  it('StripTurn: ask glows then taps; the right tap finishes and then nothing changes', () => {
    const s = strip(2);
    const t = new StripTurn(s);
    expect(t.ask()).toBe('glow');
    expect(t.ask()).toBe('tap');
    expect(t.hint).toBe(true);
    expect(t.tap(answerOf(s))).toEqual({ right: true, glow: false });
    expect(t.done).toBe(true);
    const snap = { m: t.misses, h: t.hint, g: t.glow };
    expect(t.tap(wrongCard(s)).right).toBe(false);
    expect(t.ask()).toBeNull();
    expect({ m: t.misses, h: t.hint, g: t.glow }).toEqual(snap);
  });

  it('following the hint finishes the strip from any state', () => {
    for (const seed of seeds) {
      const s = makeStrip(new Rng(seed));
      for (const misses of [0, 1, 2]) {
        const t = new StripTurn(s);
        for (let i = 0; i < misses; i++) t.tap(wrongCard(s));
        if (t.ask() === 'glow') expect(t.glow).toBe(true);
        expect(t.tap(answerOf(s)).right).toBe(true);
        expect(t.done).toBe(true);
      }
    }
  });

  for (const view of views) {
    const tag = `${view.w}x${view.h}`;
    it(`${tag}: stripLayout pictures and cards are on screen, big, and clear of the pet, corners and each other`, () => {
      const { pics, cards } = stripLayout(view);
      expect(pics).toHaveLength(SLOTS);
      expect(cards).toHaveLength(3);
      const all = [...pics.map((b, i) => ({ b, n: `pic${i}` })), ...cards.map((b, i) => ({ b, n: `card${i}` }))];
      const pet = petCorner(view);
      all.forEach(({ b, n }, i) => {
        expect(inside(b, view.w, view.h), `${tag} ${n} on screen ${JSON.stringify(b)}`).toBe(true);
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        expect(b.w).toBe(PIC.w);
        expect(overlaps(b, pet), `${tag} ${n} pet`).toBe(false);
        for (const c of cornerButtons(view)) expect(overlaps(b, c), `${tag} ${n} corner`).toBe(false);
        for (const o of all.slice(i + 1)) expect(overlaps(b, o.b), `${tag} ${n}/${o.n}`).toBe(false);
      });
    });
  }
});

describe('voice keys', () => {
  it('every tl.* line the game uses exists', () => {
    const wrongs: WrongLine[] = ['tl.halfway', 'tl.after-in', 'tl.after-out', 'tl.before-in', 'tl.before-out'];
    const keys = [...wrongs, 'tl.instruct.3', 'tl.instruct.4', 'tl.place-all', 'tl.wet.pail', 'tl.wet.flag', 'tl.wet.towel', 'tl.top-line', 'tl.windy', 'tl.dry-all', 'tl.look-line', 'tl.pic-in', 'tl.pic-out', 'tl.look-card', 'tl.right', 'tl.next-strip'];
    for (const k of keys) expect(Object.keys(SCRIPT), k).toContain(k);
    for (const t of THINGS) expect(Object.keys(SCRIPT)).toContain(`tl.wet.${t}`);
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
