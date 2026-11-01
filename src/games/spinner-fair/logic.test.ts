import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { CRITTERS } from '../../art/critter';
import {
  KINDS, COLOR_OF, WEDGES, WEDGE_DEG, EDGE_DEG, LEVELS, PICK_PAIRS, planFor, makeRound, countOf, sections, kindsOf,
  contiguous, betterOf, spin, stopRotation, wedgeAt, tally, tallest, layout, BIG, SMALL, CARDS, cardFor, fits, homeOf,
  isFair, give, nextGive, raceWheel, racePositions, TRACK, sureLayout, raceLayout, MID, CARD_W, CARD_H, RACER,
  type Kind, type Circle, type Box, type Wheel,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

describe('plans', () => {
  it('level ranges', () => {
    expect(LEVELS).toEqual({ preschool: { min: 1, max: 2 }, prek: { min: 2, max: 3 }, school: { min: 3, max: 5 } });
  });
  it('plans ask see / most / pick / sure / fair', () => {
    expect([1, 2, 3, 4, 5].map((l) => planFor(l).ask)).toEqual(['see', 'most', 'pick', 'sure', 'fair']);
    expect([1, 2, 3, 4, 5].map((l) => planFor(l).sets)).toEqual([1, 2, 2, 2, 2]);
    expect([1, 2, 3, 4, 5].map((l) => planFor(l).spins)).toEqual([6, 8, 10, 1, 6]);
  });
  it('critter colours match the art', () => {
    for (const k of KINDS) expect(COLOR_OF[k]).toBe(CRITTERS[k].color);
  });
});

describe('wheels', () => {
  it('every level: six wedges, contiguous, no shared colour, deterministic', () => {
    for (const level of [1, 2, 3, 4, 5]) {
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed));
        expect(round).toHaveLength(planFor(level).sets);
        for (const set of round) {
          expect(set.wheels).toHaveLength(level === 3 ? 2 : level === 4 ? 3 : 1);
          for (const w of set.wheels) {
            expect(w).toHaveLength(WEDGES);
            expect(contiguous(w)).toBe(true);
            const kinds = [...new Set(w)];
            const colours = kinds.map((k) => COLOR_OF[k]);
            expect(new Set(colours).size).toBe(kinds.length);
            if (level < 3) {
              expect(kinds).toHaveLength(3);
              for (const k of kinds) expect(countOf(w, k)).toBe(2);
            }
          }
        }
        expect(makeRound(level, new Rng(seed))).toEqual(round);
      }
    }
  });

  it('level 3: favourite pairs, gap, better', () => {
    const seen = new Set<string>();
    const sides = new Set<number>();
    for (const seed of SEEDS) {
      const round = makeRound(3, new Rng(seed));
      for (const set of round) {
        const fav = set.favourite!;
        const [a, b] = set.wheels.map((w) => countOf(w, fav));
        expect(PICK_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))).toBe(true);
        expect(Math.abs(a - b)).toBeGreaterThanOrEqual(2);
        for (const c of [a, b]) { expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(5); }
        expect(set.better).toBe(betterOf(set));
        expect(set.better).toBe(a > b ? 0 : 1);
        seen.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        sides.add(set.better!);
      }
      expect(round[0].favourite).not.toBe(round[1].favourite);
    }
    expect(seen.size).toBe(PICK_PAIRS.length);
    expect(sides).toEqual(new Set([0, 1]));
  });
});

describe('spin', () => {
  it('angle sits inside its wedge, clear of the lines', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 5000; i++) {
      const s = spin(rng);
      expect(s.wedge).toBeGreaterThanOrEqual(0);
      expect(s.wedge).toBeLessThanOrEqual(5);
      expect(s.angle).toBeGreaterThanOrEqual(s.wedge * WEDGE_DEG + EDGE_DEG);
      expect(s.angle).toBeLessThanOrEqual((s.wedge + 1) * WEDGE_DEG - EDGE_DEG);
    }
  });
  it('is fair: each wedge about 1/6, a 5-1 wheel gives the big section about 5/6', () => {
    const rng = new Rng(2026);
    const N = 60000;
    const hits = Array(6).fill(0);
    const wheel: Kind[] = ['duck', 'duck', 'duck', 'duck', 'duck', 'pig'];
    let big = 0;
    for (let i = 0; i < N; i++) {
      const s = spin(rng);
      hits[s.wedge]++;
      if (wheel[s.wedge] === 'duck') big++;
    }
    for (const h of hits) expect(Math.abs(h / N - 1 / 6)).toBeLessThan(0.01);
    expect(Math.abs(big / N - 5 / 6)).toBeLessThan(0.01);
  });
  it('stopRotation moves forward and lands in the wedge', () => {
    const rng = new Rng(77);
    for (let i = 0; i < 2000; i++) {
      const from = rng.range(-20, 20);
      const s = spin(rng);
      const turns = rng.int(0, 6);
      const r = stopRotation(from, s.angle, turns);
      expect(r).toBeGreaterThan(from);
      expect(wedgeAt(r)).toBe(Math.floor(s.angle / WEDGE_DEG));
    }
  });
});

describe('tally', () => {
  it('sums and ties', () => {
    expect(tally(['duck', 'pig'], ['duck', 'duck', 'pig', 'cat'])).toEqual([2, 1]);
    expect(tallest([2, 3, 3])).toEqual([1, 2]);
    expect(tallest([4, 1, 2])).toEqual([0]);
    expect(tallest([0, 0, 0])).toEqual([0, 1, 2]);
  });
  it('eight spins of a level-2 wheel tally to 8 with at most two tied', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const wheel = makeRound(2, rng)[0].wheels[0];
      const results = Array.from({ length: 8 }, () => wheel[spin(rng).wedge]);
      const counts = tally(kindsOf(wheel), results);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(8);
      expect(tallest(counts).length).toBeLessThanOrEqual(2);
    }
  });
  it('sections and kindsOf', () => {
    const w: Kind[] = ['duck', 'duck', 'pig', 'cat', 'cat', 'cat'];
    expect(sections(w)).toEqual([{ kind: 'duck', start: 0, count: 2 }, { kind: 'pig', start: 2, count: 1 }, { kind: 'cat', start: 3, count: 3 }]);
    expect(kindsOf(w)).toEqual(['duck', 'pig', 'cat']);
    expect(contiguous(['duck', 'pig', 'duck', 'cat', 'cat', 'cat'])).toBe(false);
  });
});

describe('layout', () => {
  const circleHitsRect = (c: Circle, r: { x0: number; y0: number; x1: number; y1: number }) => {
    const dx = c.x - Math.max(r.x0, Math.min(c.x, r.x1));
    const dy = c.y - Math.max(r.y0, Math.min(c.y, r.y1));
    return dx * dx + dy * dy < c.r * c.r;
  };
  const rectOf = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
  const boxesHit = (a: Box, b: Box) => {
    const p = rectOf(a), q = rectOf(b);
    return p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  };
  const circlesHit = (a: Circle, b: Circle) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
  const inside = (r: { x0: number; y0: number; x1: number; y1: number }, v: { w: number; h: number }) =>
    r.x0 >= 0 && r.y0 >= 0 && r.x1 <= v.w && r.y1 <= v.h;
  const circleRect = (c: Circle) => ({ x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r });

  for (const [w, h] of [[1024, 768], [768, 1024], [1024, 700], [700, 1024]]) {
    for (const bars of [2, 3]) {
      it(`${w}x${h}, ${bars} bars`, () => {
        const view = { w, h };
        const L = layout(view, bars);
        expect(L.portrait).toBe(h > w);
        expect(L.columns).toHaveLength(bars);
        const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
        const corner = { x0: 0, y0: 0, x1: 120, y1: 120 };
        const circles = [L.spinner, ...L.pair];
        expect(L.spinner.r).toBe(BIG);
        for (const c of L.pair) expect(c.r).toBe(SMALL);
        for (const c of circles) {
          expect(inside(circleRect(c), view)).toBe(true);
          expect(circleHitsRect(c, pet)).toBe(false);
          expect(circleHitsRect(c, corner)).toBe(false);
        }
        for (const b of [...L.columns, L.favourite]) {
          expect(inside(rectOf(b), view)).toBe(true);
          const r = rectOf(b);
          expect(r.x0 < pet.x1 && pet.x0 < r.x1 && r.y0 < pet.y1 && pet.y0 < r.y1).toBe(false);
          expect(r.x0 < corner.x1 && corner.x0 < r.x1 && r.y0 < corner.y1 && corner.y0 < r.y1).toBe(false);
        }
        for (const c of L.columns) {
          expect(c.w).toBeGreaterThanOrEqual(100);
          expect(c.h).toBeGreaterThanOrEqual(100);
          expect(circleHitsRect(L.spinner, rectOf(c))).toBe(false);
        }
        L.columns.forEach((a, i) => L.columns.slice(i + 1).forEach((b) => expect(boxesHit(a, b)).toBe(false)));
        expect(circlesHit(L.pair[0], L.pair[1])).toBe(false);
        for (const c of L.pair) expect(circleHitsRect(c, rectOf(L.favourite))).toBe(false);
        if (L.portrait) for (const c of L.columns) expect(c.y - c.h / 2).toBeGreaterThanOrEqual(L.spinner.y + L.spinner.r);
      });
    }
  }
});

describe('level 4: sure, maybe, no way', () => {
  it('cardFor: six is sure, none is no way, anything between is maybe', () => {
    for (let n = 0; n <= 6; n++) {
      const w = [...Array(n).fill('duck'), ...Array(6 - n).fill('pig')] as Wheel;
      expect(cardFor(w, 'duck')).toBe(n === 6 ? 'sure' : n === 0 ? 'none' : 'maybe');
      expect(CARDS.filter((c) => fits(c, w, 'duck'))).toEqual([cardFor(w, 'duck')]);
    }
  });
  it('each set: one all-favourite, one 2–4, one none; each card fits exactly one spinner', () => {
    const orders = new Set<string>();
    const someCounts = new Set<number>();
    for (const seed of SEEDS) {
      const round = makeRound(4, new Rng(seed));
      expect(round[0].favourite).not.toBe(round[1].favourite);
      for (const set of round) {
        const fav = set.favourite!;
        const counts = set.wheels.map((w) => countOf(w, fav));
        expect([...counts].sort()).toEqual([0, counts.find((c) => c > 0 && c < 6)!, 6].sort());
        const some = counts.find((c) => c > 0 && c < 6)!;
        expect(some).toBeGreaterThanOrEqual(2);
        expect(some).toBeLessThanOrEqual(4);
        someCounts.add(some);
        // The none spinner holds one or two other critters, never the favourite.
        const none = set.wheels[counts.indexOf(0)];
        expect(new Set(none).size).toBeLessThanOrEqual(2);
        expect([...set.cards!].sort()).toEqual([...CARDS].sort());
        const homes = set.cards!.map((c) => homeOf(set, c));
        expect([...homes].sort()).toEqual([0, 1, 2]);
        for (const c of CARDS) expect(set.wheels.filter((w) => fits(c, w, fav))).toHaveLength(1);
        orders.add(counts.map((c) => (c === 6 ? 's' : c === 0 ? 'n' : 'm')).join(''));
      }
    }
    expect(orders.size).toBe(6);
    expect(someCounts).toEqual(new Set([2, 3, 4]));
  });
});

describe('level 5: fair or unfair', () => {
  const racers: [Kind, Kind] = ['duck', 'pig'];
  it('race 1 starts uneven; race 2 is fair or uneven; both kinds appear', () => {
    let fair2 = 0, uneven2 = 0;
    const starts = new Set<string>();
    for (const seed of SEEDS) {
      const [r1, r2] = makeRound(5, new Rng(seed));
      for (const r of [r1, r2]) {
        expect(r.racers).toHaveLength(2);
        expect(new Set(r.wheels[0])).toEqual(new Set(r.racers));
        expect(r.wheels[0]).toEqual(raceWheel(r.racers!, countOf(r.wheels[0], r.racers![0])));
      }
      const [a, b] = r1.racers!.map((k) => countOf(r1.wheels[0], k));
      expect([[4, 2], [2, 4], [5, 1], [1, 5]]).toContainEqual([a, b]);
      starts.add(`${a}-${b}`);
      expect(isFair(r1.wheels[0], r1.racers!)).toBe(false);
      if (isFair(r2.wheels[0], r2.racers!)) fair2++; else uneven2++;
    }
    expect(starts.size).toBe(4);
    expect(fair2).toBeGreaterThan(50);
    expect(uneven2).toBeGreaterThan(50);
  });
  it('isFair only at three and three', () => {
    for (let a = 1; a <= 5; a++) expect(isFair(raceWheel(racers, a), racers)).toBe(a === 3);
  });
  it('give keeps six wedges, contiguous owners, and never takes a racer\'s last wedge', () => {
    for (let a = 1; a <= 5; a++) {
      const w = raceWheel(racers, a);
      for (const to of racers) {
        const next = give(w, racers, to);
        const from = to === 'duck' ? 'pig' : 'duck';
        if (countOf(w, from) <= 1) { expect(next).toBeNull(); continue; }
        expect(next).toHaveLength(6);
        expect(contiguous(next!)).toBe(true);
        expect(countOf(next!, to)).toBe(countOf(w, to) + 1);
        // A move the wrong way can be moved straight back.
        expect(give(next!, racers, from)).toEqual(w);
      }
    }
  });
  it('nextGive (the hint and the ghost) reaches three and three in exactly |a − 3| moves', () => {
    for (let a = 1; a <= 5; a++) {
      let w: Wheel = raceWheel(racers, a);
      let moves = 0;
      for (let to = nextGive(w, racers); to; to = nextGive(w, racers)) { w = give(w, racers, to)!; moves++; }
      expect(isFair(w, racers)).toBe(true);
      expect(moves).toBe(Math.abs(a - 3));
    }
  });
  it('a race moves the winner of each spin one step and ends within the track', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const rng = new Rng(seed);
      const w = raceWheel(racers, 3);
      const results = Array.from({ length: 6 }, () => w[spin(rng).wedge]);
      const [a, b] = racePositions(racers, results);
      expect(a + b).toBe(6);
      expect(Math.max(a, b)).toBeLessThanOrEqual(TRACK);
    }
  });
});

describe('levels 4–5 layout', () => {
  const VIEWS = [[1024, 768], [768, 1024], [1024, 700], [700, 1024], [1366, 768], [1194, 834]];
  const rect = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
  const hit = (p: ReturnType<typeof rect>, q: ReturnType<typeof rect>) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  const circleHits = (c: Circle, r: ReturnType<typeof rect>, extra = 8) => {
    const dx = c.x - Math.max(r.x0, Math.min(c.x, r.x1));
    const dy = c.y - Math.max(r.y0, Math.min(c.y, r.y1));
    return dx * dx + dy * dy < (c.r + extra) ** 2;
  };
  const inside = (r: ReturnType<typeof rect>, w: number, h: number) => r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h;
  for (const [w, h] of VIEWS) {
    const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
    const corners = [{ x0: 0, y0: 0, x1: 120, y1: 120 }, { x0: w - 120, y0: 0, x1: w, y1: 120 }];
    it(`level 4 at ${w}x${h}`, () => {
      const L = sureLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      const boxes = [...L.slots, ...L.tray, L.favourite];
      for (const b of boxes) {
        const r = rect(b);
        expect(inside(r, w, h)).toBe(true);
        expect(hit(r, pet)).toBe(false);
        for (const c of corners) expect(hit(r, c)).toBe(false);
        for (const s of L.spinners) expect(circleHits(s, r)).toBe(false);
      }
      for (const b of [...L.slots, ...L.tray]) { expect(b.w).toBe(CARD_W); expect(b.h).toBe(CARD_H); }
      boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(hit(rect(a), rect(b))).toBe(false)));
      for (const s of L.spinners) {
        expect(s.r).toBe(MID);
        expect(inside(rect({ x: s.x, y: s.y, w: 2 * s.r + 16, h: 2 * s.r + 16 }), w, h)).toBe(true);
        expect(circleHits(s, pet)).toBe(false);
        for (const c of corners) expect(circleHits(s, c)).toBe(false);
      }
      L.spinners.forEach((a, i) => L.spinners.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * (MID + 8))));
    });
    it(`level 5 at ${w}x${h}`, () => {
      const L = raceLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      expect(L.spinner.r).toBe(BIG);
      // A wedge's arc at mid-radius stays a big target.
      expect((BIG / 2) * (Math.PI / 3)).toBeGreaterThanOrEqual(100);
      const buttons = [L.fair, L.unfair, L.check];
      const racers = [0, 1].flatMap((i) => Array.from({ length: TRACK + 1 }, (_, s) => L.racerAt(i, s)));
      for (const b of [...buttons, ...racers, ...L.tracks]) {
        const r = rect(b);
        expect(inside(r, w, h)).toBe(true);
        expect(hit(r, pet)).toBe(false);
        for (const c of corners) expect(hit(r, c)).toBe(false);
        expect(circleHits(L.spinner, r)).toBe(false);
        expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      }
      for (const r of racers) expect(r.w).toBe(RACER);
      buttons.forEach((a, i) => buttons.slice(i + 1).forEach((b) => expect(hit(rect(a), rect(b))).toBe(false)));
      for (const b of buttons) for (const t of L.tracks) expect(hit(rect(b), rect(t))).toBe(false);
      expect(hit(rect(L.tracks[0]), rect(L.tracks[1]))).toBe(false);
      // The whole wheel and its pointer (30 above the rim) are on screen.
      expect(inside({ x0: L.spinner.x - BIG - 8, y0: L.spinner.y - BIG - 30, x1: L.spinner.x + BIG + 8, y1: L.spinner.y + BIG + 8 }, w, h)).toBe(true);
      for (const c of corners) expect(circleHits(L.spinner, c)).toBe(false);
      expect(circleHits(L.spinner, pet)).toBe(false);
    });
  }
});
