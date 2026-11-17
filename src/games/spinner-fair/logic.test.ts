import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { CRITTERS } from '../../art/critter';
import {
  KINDS,
  COLOR_OF,
  WEDGES,
  WEDGE_DEG,
  EDGE_DEG,
  LEVELS,
  PICK_PAIRS,
  planFor,
  makeRound,
  countOf,
  sections,
  kindsOf,
  contiguous,
  betterOf,
  spin,
  stopRotation,
  wedgeAt,
  tally,
  tallest,
  layout,
  BIG,
  SMALL,
  CARDS,
  cardFor,
  fits,
  homeOf,
  isFair,
  give,
  nextGive,
  raceWheel,
  racePositions,
  TRACK,
  sureLayout,
  raceLayout,
  MID,
  CARD_W,
  CARD_H,
  RACER,
  SETTLE_K,
  SETTLE_RUNS,
  CHECK_SPINS,
  ABOUT_CARDS,
  ABOUT_W,
  ABOUT_H,
  RULER,
  expected60,
  aboutRight,
  inBand,
  spinRun,
  settleLayout,
  SUMS,
  SUM_CARD,
  TRAY_W,
  TRAY_H,
  roll,
  sumOf,
  ways,
  gridRows,
  waysTally,
  rollTally,
  rollsMislead,
  mostCards,
  pairCards,
  moreWays,
  diceLayout,
  gridSide,
  barsBox,
  MAX_TOWER,
  TOWER_W,
  TOWER_H,
  TOWER_LABEL,
  BLOCK_H,
  NUM_CARD,
  numWheel,
  towersOf,
  range,
  extremes,
  rangeCards,
  moveBlock,
  tallerMove,
  nearlyLevel,
  typicalAccepted,
  typicalCards,
  nextMove,
  typicalLayout,
  RIG_WEDGES,
  RIG_EIGHTHS,
  RIG_QUARTERS,
  PROOF_SPINS,
  RIG_BOX,
  RIG_COUNT,
  RIG_TALLY,
  rigTarget,
  rigSet,
  rigRight,
  nextRig,
  rigLayout,
  type Roll,
  type Kind,
  type Circle,
  type Box,
  type Wheel,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

describe('plans', () => {
  it('level ranges', () => {
    expect(LEVELS).toEqual({
      preschool: { min: 1, max: 2 },
      prek: { min: 2, max: 3 },
      school: { min: 3, max: 9 },
    });
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
        for (const c of [a, b]) {
          expect(c).toBeGreaterThanOrEqual(1);
          expect(c).toBeLessThanOrEqual(5);
        }
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
    expect(sections(w)).toEqual([
      { kind: 'duck', start: 0, count: 2 },
      { kind: 'pig', start: 2, count: 1 },
      { kind: 'cat', start: 3, count: 3 },
    ]);
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
    const p = rectOf(a),
      q = rectOf(b);
    return p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  };
  const circlesHit = (a: Circle, b: Circle) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
  const inside = (r: { x0: number; y0: number; x1: number; y1: number }, v: { w: number; h: number }) =>
    r.x0 >= 0 && r.y0 >= 0 && r.x1 <= v.w && r.y1 <= v.h;
  const circleRect = (c: Circle) => ({ x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r });

  for (const [w, h] of [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
  ]) {
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
        L.columns.forEach((a, i) =>
          L.columns.slice(i + 1).forEach((b) => expect(boxesHit(a, b)).toBe(false)),
        );
        expect(circlesHit(L.pair[0], L.pair[1])).toBe(false);
        for (const c of L.pair) expect(circleHitsRect(c, rectOf(L.favourite))).toBe(false);
        if (L.portrait)
          for (const c of L.columns) expect(c.y - c.h / 2).toBeGreaterThanOrEqual(L.spinner.y + L.spinner.r);
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
    let fair2 = 0,
      uneven2 = 0;
    const starts = new Set<string>();
    for (const seed of SEEDS) {
      const [r1, r2] = makeRound(5, new Rng(seed));
      for (const r of [r1, r2]) {
        expect(r.racers).toHaveLength(2);
        expect(new Set(r.wheels[0])).toEqual(new Set(r.racers));
        expect(r.wheels[0]).toEqual(raceWheel(r.racers!, countOf(r.wheels[0], r.racers![0])));
      }
      const [a, b] = r1.racers!.map((k) => countOf(r1.wheels[0], k));
      expect([
        [4, 2],
        [2, 4],
        [5, 1],
        [1, 5],
      ]).toContainEqual([a, b]);
      starts.add(`${a}-${b}`);
      expect(isFair(r1.wheels[0], r1.racers!)).toBe(false);
      if (isFair(r2.wheels[0], r2.racers!)) fair2++;
      else uneven2++;
    }
    expect(starts.size).toBe(4);
    expect(fair2).toBeGreaterThan(50);
    expect(uneven2).toBeGreaterThan(50);
  });
  it('isFair only at three and three', () => {
    for (let a = 1; a <= 5; a++) expect(isFair(raceWheel(racers, a), racers)).toBe(a === 3);
  });
  it("give keeps six wedges, contiguous owners, and never takes a racer's last wedge", () => {
    for (let a = 1; a <= 5; a++) {
      const w = raceWheel(racers, a);
      for (const to of racers) {
        const next = give(w, racers, to);
        const from = to === 'duck' ? 'pig' : 'duck';
        if (countOf(w, from) <= 1) {
          expect(next).toBeNull();
          continue;
        }
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
      for (let to = nextGive(w, racers); to; to = nextGive(w, racers)) {
        w = give(w, racers, to)!;
        moves++;
      }
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
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
    [1366, 768],
    [1194, 834],
  ];
  const rect = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
  const hit = (p: ReturnType<typeof rect>, q: ReturnType<typeof rect>) =>
    p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  const circleHits = (c: Circle, r: ReturnType<typeof rect>, extra = 8) => {
    const dx = c.x - Math.max(r.x0, Math.min(c.x, r.x1));
    const dy = c.y - Math.max(r.y0, Math.min(c.y, r.y1));
    return dx * dx + dy * dy < (c.r + extra) ** 2;
  };
  const inside = (r: ReturnType<typeof rect>, w: number, h: number) =>
    r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h;
  for (const [w, h] of VIEWS) {
    const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
    const corners = [
      { x0: 0, y0: 0, x1: 120, y1: 120 },
      { x0: w - 120, y0: 0, x1: w, y1: 120 },
    ];
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
      for (const b of [...L.slots, ...L.tray]) {
        expect(b.w).toBe(CARD_W);
        expect(b.h).toBe(CARD_H);
      }
      boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(hit(rect(a), rect(b))).toBe(false)));
      for (const s of L.spinners) {
        expect(s.r).toBe(MID);
        expect(inside(rect({ x: s.x, y: s.y, w: 2 * s.r + 16, h: 2 * s.r + 16 }), w, h)).toBe(true);
        expect(circleHits(s, pet)).toBe(false);
        for (const c of corners) expect(circleHits(s, c)).toBe(false);
      }
      L.spinners.forEach((a, i) =>
        L.spinners
          .slice(i + 1)
          .forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * (MID + 8))),
      );
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
      buttons.forEach((a, i) =>
        buttons.slice(i + 1).forEach((b) => expect(hit(rect(a), rect(b))).toBe(false)),
      );
      for (const b of buttons) for (const t of L.tracks) expect(hit(rect(b), rect(t))).toBe(false);
      expect(hit(rect(L.tracks[0]), rect(L.tracks[1]))).toBe(false);
      // The whole wheel and its pointer (30 above the rim) are on screen.
      expect(
        inside(
          {
            x0: L.spinner.x - BIG - 8,
            y0: L.spinner.y - BIG - 30,
            x1: L.spinner.x + BIG + 8,
            y1: L.spinner.y + BIG + 8,
          },
          w,
          h,
        ),
      ).toBe(true);
      for (const c of corners) expect(circleHits(L.spinner, c)).toBe(false);
      expect(circleHits(L.spinner, pet)).toBe(false);
    });
  }
});

describe('level 6: watch it settle', () => {
  const sets = (seed: number) => makeRound(6, new Rng(seed));
  it('the plan and the school range', () => {
    expect(planFor(6)).toEqual({ level: 6, ask: 'settle', name: 'Watch it settle', sets: 2, spins: 240 });
    expect(SETTLE_RUNS[SETTLE_RUNS.length - 1]).toBe(planFor(6).spins);
    expect(LEVELS.school).toEqual({ min: 3, max: 9 });
  });
  it('each set is a six-wedge wheel of the favourite and one friend, k of 1, 3 or 5, and the two sets differ', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const [a, b] = sets(seed);
      expect(a.favourite).toBe(b.favourite);
      expect(a.k).not.toBe(b.k);
      expect(a.friend).not.toBe(b.friend);
      for (const s of [a, b]) {
        const w = s.wheels[0];
        expect(s.wheels).toHaveLength(1);
        expect(w).toHaveLength(WEDGES);
        expect(SETTLE_K).toContain(s.k);
        expect(countOf(w, s.favourite!)).toBe(s.k);
        expect(countOf(w, s.friend!)).toBe(WEDGES - s.k!);
        expect(contiguous(w)).toBe(true);
        expect(COLOR_OF[s.favourite!]).not.toBe(COLOR_OF[s.friend!]);
      }
    }
  });
  it('exactly one card is right, and it comes from the wedges', () => {
    for (const k of SETTLE_K) {
      expect(expected60(k)).toBe(10 * k);
      expect(ABOUT_CARDS.filter((c) => aboutRight(c, k))).toEqual([10 * k]);
    }
    expect(inBand(40, 3)).toBe(true);
    expect(inBand(20, 3)).toBe(true);
    expect(inBand(41, 3)).toBe(false);
    expect(inBand(19, 3)).toBe(false);
  });
  it('a run is spin(rng) again and again: nothing filtered, shortened or drawn twice', () => {
    for (const seed of [1, 7, 99]) {
      const a = new Rng(seed),
        b = new Rng(seed);
      const run = spinRun(a, 240);
      expect(run).toHaveLength(240);
      expect(run).toEqual(Array.from({ length: 240 }, () => spin(b)));
      expect(a.next()).toBe(b.next());
    }
  });
  // Honesty measured, never enforced: the answer never depends on these runs.
  it('over 2000 seeds, 240 spins end within 0.08 of the share and a 60-spin check is in its band, 97% of the time', () => {
    for (const k of SETTLE_K) {
      const wheel = raceWheel(['duck', 'pig'], k);
      let close = 0,
        band = 0;
      for (let seed = 1; seed <= 2000; seed++) {
        const rng = new Rng(seed * 31 + k);
        const duck = (n: number) => spinRun(rng, n).filter((s) => wheel[s.wedge] === 'duck').length;
        if (Math.abs(duck(240) / 240 - k / WEDGES) <= 0.08) close++;
        if (inBand(duck(CHECK_SPINS), k)) band++;
      }
      expect(close / 2000).toBeGreaterThanOrEqual(0.97);
      expect(band / 2000).toBeGreaterThanOrEqual(0.97);
    }
  });
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
    [1366, 768],
    [1194, 834],
  ];
  type R = { x0: number; y0: number; x1: number; y1: number };
  const rect = (b: Box): R => ({
    x0: b.x - b.w / 2,
    y0: b.y - b.h / 2,
    x1: b.x + b.w / 2,
    y1: b.y + b.h / 2,
  });
  const hit = (p: R, q: R) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  for (const [w, h] of VIEWS)
    it(`layout at ${w}x${h}`, () => {
      const L = settleLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
      const corners = [
        { x0: 0, y0: 0, x1: 120, y1: 120 },
        { x0: w - 120, y0: 0, x1: w, y1: 120 },
      ];
      // The wheel with its rim and pointer, and the strip with its ruler and marker.
      const s = L.spinner;
      const wheel = { x0: s.x - s.r - 8, y0: s.y - s.r - 30, x1: s.x + s.r + 8, y1: s.y + s.r + 8 };
      const strip = { ...rect(L.strip), y1: L.strip.y + L.strip.h / 2 + RULER };
      const all: R[] = [wheel, strip, rect(L.counts), rect(L.fast), ...L.cards.map(rect)];
      for (const r of all) {
        expect(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h).toBe(true);
        expect(hit(r, pet)).toBe(false);
        for (const c of corners) expect(hit(r, c)).toBe(false);
      }
      all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(hit(a, b)).toBe(false)));
      // Targets: the spinner, the fast-forward button and each card, never under 100.
      expect(2 * s.r).toBeGreaterThanOrEqual(100);
      for (const b of [L.fast, ...L.cards]) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      for (const b of L.cards) expect([b.w, b.h]).toEqual([ABOUT_W, ABOUT_H]);
      expect(L.cards).toHaveLength(ABOUT_CARDS.length);
      expect(L.strip.w).toBeGreaterThanOrEqual(480);
    });
});

describe('level 7: two dice', () => {
  it('the plan and the school range', () => {
    expect(planFor(7)).toEqual({ level: 7, ask: 'dice', name: 'Two dice', sets: 1, spins: 12 });
    expect(LEVELS.school).toEqual({ min: 3, max: 9 });
    // Levels 1–6 keep their numbers and asks, so saved levels and pins stay valid.
    expect([1, 2, 3, 4, 5, 6].map((l) => planFor(l).ask)).toEqual([
      'see',
      'most',
      'pick',
      'sure',
      'fair',
      'settle',
    ]);
  });
  it('ways is 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 for 2–12 and sums to 36', () => {
    expect(SUMS).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(SUMS.map(ways)).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
    expect(SUMS.map(ways).reduce((a, b) => a + b)).toBe(36);
    expect([0, 1, 13].map(ways)).toEqual([0, 0, 0]);
  });
  it('the grid is every pair of faces once, and counting its squares gives ways', () => {
    const rows = gridRows();
    expect(rows).toHaveLength(6);
    rows.forEach((row, a) => expect(row).toEqual([1, 2, 3, 4, 5, 6].map((b) => a + 1 + b)));
    const all = rows.flat();
    for (const s of SUMS) expect(all.filter((x) => x === s).length).toBe(ways(s));
    expect(waysTally()).toEqual(SUMS.map(ways));
    expect(waysTally(0)).toEqual(SUMS.map(() => 0));
    // After the first row: one square each for 2 to 7.
    expect(waysTally(6)).toEqual([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
    for (let n = 0; n <= 36; n++) expect(waysTally(n).reduce((a, b) => a + b)).toBe(n);
  });
  it('question one always holds 7 and two other sums with different, smaller square counts; 7 is right', () => {
    const orders = new Set<number>();
    for (const seed of SEEDS) {
      const cards = mostCards(new Rng(seed));
      expect(cards).toHaveLength(3);
      expect(new Set(cards).size).toBe(3);
      expect(cards).toContain(7);
      const [a, b] = cards.filter((c) => c !== 7);
      for (const c of [a, b]) {
        expect(SUMS).toContain(c);
        expect(ways(c)).toBeLessThan(6);
      }
      expect(ways(a)).not.toBe(ways(b));
      expect(moreWays(cards)).toBe(7);
      orders.add(cards.indexOf(7));
    }
    // The right card is not always in the same place.
    expect(orders.size).toBe(3);
  });
  it('question two never holds 7 or a tie, and the right card has more squares', () => {
    const firstRight = new Set<boolean>();
    for (const seed of SEEDS) {
      const pair = pairCards(new Rng(seed));
      expect(pair).toHaveLength(2);
      expect(pair).not.toContain(7);
      for (const c of pair) expect(SUMS).toContain(c);
      expect(ways(pair[0])).not.toBe(ways(pair[1]));
      const right = moreWays(pair);
      expect(ways(right)).toBe(Math.max(ways(pair[0]), ways(pair[1])));
      firstRight.add(right === pair[0]);
    }
    expect(firstRight.size).toBe(2);
  });
  it('a roll is rng.int(1, 6) twice: nothing filtered or drawn again', () => {
    for (const seed of [1, 7, 99]) {
      const a = new Rng(seed),
        b = new Rng(seed);
      for (let i = 0; i < 50; i++) expect(roll(a)).toEqual([b.int(1, 6), b.int(1, 6)]);
      expect(a.next()).toBe(b.next());
    }
  });
  // Honesty measured, never enforced: no answer depends on a roll.
  it('over 60 000 rolls each face of each die is within a point of a sixth', () => {
    const rng = new Rng(20261116);
    const faces = [Array(6).fill(0), Array(6).fill(0)];
    const N = 60000;
    for (let i = 0; i < N; i++) {
      const r = roll(rng);
      faces[0][r[0] - 1]++;
      faces[1][r[1] - 1]++;
    }
    for (const die of faces) for (const n of die) expect(Math.abs(n / N - 1 / 6)).toBeLessThan(0.01);
  });
  it('the roll bars count every roll once, on its sum', () => {
    const rolls: Roll[] = [
      [1, 1],
      [3, 4],
      [6, 1],
      [6, 6],
      [2, 5],
    ];
    expect(rolls.map(sumOf)).toEqual([2, 7, 7, 12, 7]);
    expect(rollTally(rolls)).toEqual([1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1]);
    expect(rollTally([])).toEqual(SUMS.map(() => 0));
  });
  it('the pet says twelve rolls is only a few unless seven alone came up most', () => {
    expect(rollsMislead([[3, 4]])).toBe(false);
    expect(
      rollsMislead([
        [3, 4],
        [1, 1],
      ]),
    ).toBe(true);
    expect(
      rollsMislead([
        [3, 4],
        [1, 1],
        [1, 1],
      ]),
    ).toBe(true);
    expect(rollsMislead([])).toBe(true);
  });
  it('help leads to the right card: the glowing card is the one with the most squares on the grid', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      for (const cards of [mostCards(rng), pairCards(rng)]) {
        const counts = cards.map(
          (c) =>
            gridRows()
              .flat()
              .filter((x) => x === c).length,
        );
        const best = cards[counts.indexOf(Math.max(...counts))];
        expect(counts.filter((n) => n === Math.max(...counts))).toHaveLength(1);
        expect(moreWays(cards)).toBe(best);
      }
    }
  });
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
    [1366, 768],
    [1194, 834],
    [1662, 768],
    [768, 1662],
  ];
  type R = { x0: number; y0: number; x1: number; y1: number };
  const rect = (b: Box): R => ({
    x0: b.x - b.w / 2,
    y0: b.y - b.h / 2,
    x1: b.x + b.w / 2,
    y1: b.y + b.h / 2,
  });
  const hit = (p: R, q: R) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  for (const [w, h] of VIEWS)
    it(`layout at ${w}x${h}`, () => {
      const L = diceLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
      const corners = [
        { x0: 0, y0: 0, x1: 120, y1: 120 },
        { x0: w - 120, y0: 0, x1: w, y1: 120 },
      ];
      const side = gridSide(L.grid);
      const grid = { x0: L.grid.x, y0: L.grid.y, x1: L.grid.x + side, y1: L.grid.y + side };
      const rolls = rect(barsBox(L.rolls)),
        waysBars = rect(barsBox(L.ways));
      const clear = (all: R[]) => {
        for (const r of all) {
          expect(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h).toBe(true);
          expect(hit(r, pet)).toBe(false);
          for (const c of corners) expect(hit(r, c)).toBe(false);
        }
        all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(hit(a, b)).toBe(false)));
      };
      // The rolls: the tray and the roll bars.
      clear([rect(L.tray), rolls]);
      // Each question: the grid, both bar sets and the cards, none overlapping.
      clear([grid, rolls, waysBars, ...L.most.map(rect)]);
      clear([grid, rolls, waysBars, ...L.pair.map(rect)]);
      // Targets: the tray and every card, never under 100.
      expect([L.tray.w, L.tray.h]).toEqual([TRAY_W, TRAY_H]);
      expect(Math.min(TRAY_W, TRAY_H)).toBeGreaterThanOrEqual(100);
      expect(L.most).toHaveLength(3);
      expect(L.pair).toHaveLength(2);
      for (const b of [...L.most, ...L.pair]) {
        expect([b.w, b.h]).toEqual([SUM_CARD, SUM_CARD]);
        expect(SUM_CARD).toBeGreaterThanOrEqual(100);
      }
      // The grid and the bars are display only, but stay readable: squares of 60 or more, bars 80 or more tall.
      expect(L.grid.cell).toBeGreaterThanOrEqual(60);
      expect(L.rolls.h).toBeGreaterThanOrEqual(80);
      expect(L.ways.h).toBeGreaterThanOrEqual(80);
    });
});

describe('level 8: the typical spin', () => {
  /** Every way six spins of a 1–6 wheel can stand: 46 656 tower sets. */
  const everySix = function* () {
    for (let n = 0; n < 6 ** 6; n++) {
      const t: number[] = [];
      for (let k = 0, m = n; k < 6; k++, m = Math.floor(m / 6)) t.push((m % 6) + 1);
      yield t;
    }
  };
  const sum = (t: readonly number[]) => t.reduce((a, b) => a + b, 0);
  it('the plan and the school range', () => {
    expect(planFor(8)).toEqual({ level: 8, ask: 'typical', name: 'The typical spin', sets: 2, spins: 6 });
    expect(LEVELS.school).toEqual({ min: 3, max: 9 });
    // Levels 1–7 keep their numbers and asks, so saved levels and pins stay valid.
    expect([1, 2, 3, 4, 5, 6, 7].map((l) => planFor(l).ask)).toEqual([
      'see',
      'most',
      'pick',
      'sure',
      'fair',
      'settle',
      'dice',
    ]);
  });
  it('the number wheel is 1–6 once each, in more than one order, and a spin gives each number about a sixth', () => {
    const orders = new Set<string>();
    for (const seed of SEEDS) {
      const w = numWheel(new Rng(seed));
      expect([...w].sort()).toEqual([1, 2, 3, 4, 5, 6]);
      orders.add(w.join(''));
    }
    expect(orders.size).toBeGreaterThan(20);
    const rng = new Rng(8);
    const w = numWheel(rng);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[w[spin(rng).wedge] - 1]++;
    for (const c of counts) expect(Math.abs(c / 60000 - 1 / 6)).toBeLessThan(0.01);
  });
  it('six spins are spin(rng) six times: nothing filtered, and totals that do not share out evenly are kept', () => {
    let uneven = 0;
    for (const seed of SEEDS) {
      const a = new Rng(seed),
        b = new Rng(seed);
      const w = numWheel(a);
      numWheel(b);
      const spins = Array.from({ length: 6 }, () => w[spin(a).wedge]);
      // A spin is one wedge draw and one stopping-angle draw, and nothing else touches the RNG between spins.
      const again = Array.from({ length: 6 }, () => {
        const wedge = b.int(0, 5);
        b.next();
        return w[wedge];
      });
      expect(towersOf(spins)).toEqual(spins);
      expect(spins).toEqual(again);
      if (sum(spins) % 6 !== 0) uneven++;
    }
    // About five sets in six have a mean that is not whole; the game never avoids them.
    expect(uneven / SEEDS.length).toBeGreaterThan(0.7);
  });
  it('the range is the biggest take away the smallest, and its cards hold it with two other numbers from 0–5', () => {
    expect(range([6, 2, 4, 4, 3, 5])).toBe(4);
    expect(range([3, 3, 3, 3, 3, 3])).toBe(0);
    expect(extremes([2, 6, 2, 6, 3, 3])).toEqual({ tall: 1, short: 0 });
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      for (let r = 0; r <= 5; r++) {
        const cards = rangeCards(rng, r);
        expect(cards).toHaveLength(3);
        expect(new Set(cards).size).toBe(3);
        expect(cards).toContain(r);
        for (const c of cards) expect(c >= 0 && c <= 5).toBe(true);
      }
    }
  });
  it('a block move keeps the total, never empties below zero and never overfills a column', () => {
    const t = [6, 2, 4, 4, 3, 5];
    expect(moveBlock(t, 0, 1)).toEqual([5, 3, 4, 4, 3, 5]);
    expect(moveBlock(t, 0, 0)).toBeNull();
    expect(moveBlock([0, 6, 3, 3, 3, 3], 0, 1)).toBeNull();
    expect(moveBlock([1, MAX_TOWER, 3, 3, 3, 3], 0, 1)).toBeNull();
    expect(MAX_TOWER * BLOCK_H).toBeLessThanOrEqual(TOWER_H);
    const rng = new Rng(5);
    let towers = [6, 1, 4, 2, 5, 3];
    for (let i = 0; i < 2000; i++) {
      const next = moveBlock(towers, rng.int(0, 5), rng.int(0, 5));
      if (!next) continue;
      expect(sum(next)).toBe(21);
      for (const h of next) expect(h >= 0 && h <= MAX_TOWER).toBe(true);
      towers = next;
    }
    // A move onto a tower at least as tall is allowed (and said), not refused.
    expect(tallerMove(t, 1, 0)).toBe(true);
    expect(tallerMove(t, 2, 3)).toBe(true);
    expect(tallerMove(t, 0, 1)).toBe(false);
    expect(moveBlock(t, 1, 0)).toEqual([7, 1, 4, 4, 3, 5]);
  });
  it('from every set of six spins, the hinted move reaches nearly level without a taller move, within sum(|h − mean|) moves', () => {
    for (const start of everySix()) {
      const mean = sum(start) / 6;
      const bound = start.reduce((a, h) => a + Math.abs(h - mean), 0);
      let towers = start;
      let moves = 0;
      for (let m = nextMove(towers); m; m = nextMove(towers)) {
        expect(tallerMove(towers, m.from, m.to)).toBe(false);
        towers = moveBlock(towers, m.from, m.to)!;
        moves++;
      }
      expect(nearlyLevel(towers)).toBe(true);
      expect(moves).toBeLessThanOrEqual(bound);
      expect(sum(towers)).toBe(sum(start));
      // The right answers are exactly the heights the level towers show: one when the mean is whole, two otherwise.
      const shown = [...new Set(towers)].sort();
      expect(typicalAccepted(start)).toEqual(shown);
      expect(typicalAccepted(towers)).toEqual(shown);
      expect(shown).toEqual(Number.isInteger(mean) ? [mean] : [Math.floor(mean), Math.ceil(mean)]);
    }
  });
  it('the typical cards are three numbers from 1–6 holding every accepted height', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const w = numWheel(rng);
      const towers = Array.from({ length: 6 }, () => w[spin(rng).wedge]);
      const cards = typicalCards(rng, towers);
      expect(cards).toHaveLength(3);
      expect(new Set(cards).size).toBe(3);
      for (const c of cards) expect(c >= 1 && c <= 6).toBe(true);
      for (const a of typicalAccepted(towers)) expect(cards).toContain(a);
    }
  });
  it('help names the outline gap, a move or the level line, and following it reaches a right answer', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const w = numWheel(rng);
      let towers = Array.from({ length: 6 }, () => w[spin(rng).wedge]);
      // Range: the outline blocks above the shortest tower, up to the tallest, number the range.
      const { tall, short } = extremes(towers);
      expect(towers[tall] - towers[short]).toBe(range(towers));
      expect(rangeCards(rng, range(towers))).toContain(range(towers));
      for (let m = nextMove(towers); m; m = nextMove(towers)) towers = moveBlock(towers, m.from, m.to)!;
      // Typical: the level line sits on the shortest tower's top, an accepted height.
      expect(typicalAccepted(towers)).toContain(Math.min(...towers));
    }
  });
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
    [1366, 768],
    [1194, 834],
    [1662, 768],
    [768, 1662],
  ];
  type R = { x0: number; y0: number; x1: number; y1: number };
  const rect = (b: Box): R => ({
    x0: b.x - b.w / 2,
    y0: b.y - b.h / 2,
    x1: b.x + b.w / 2,
    y1: b.y + b.h / 2,
  });
  const hit = (p: R, q: R) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  for (const [w, h] of VIEWS)
    it(`layout at ${w}x${h}`, () => {
      const L = typicalLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
      const corners = [
        { x0: 0, y0: 0, x1: 120, y1: 120 },
        { x0: w - 120, y0: 0, x1: w, y1: 120 },
      ];
      // The spinner with its rim and its pointer above it.
      const s = L.spinner;
      const spinner = { x0: s.x - s.r - 8, y0: s.y - s.r - 30, x1: s.x + s.r + 8, y1: s.y + s.r + 8 };
      // The shell's help button sits under the home button, about (60, 170) and 40 in radius: the round spinner clears it.
      expect(Math.hypot(s.x - 60, s.y - 170)).toBeGreaterThanOrEqual(s.r + 8 + 40);
      // The towers with the counts under them.
      const cols = L.towers.map(rect);
      const towers = {
        x0: cols[0].x0,
        y0: cols[0].y0,
        x1: cols[5].x1,
        y1: L.base + TOWER_LABEL,
      };
      const all = [spinner, towers, ...L.cards.map(rect)];
      for (const r of all) {
        expect(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h).toBe(true);
        expect(hit(r, pet)).toBe(false);
        for (const c of corners) expect(hit(r, c)).toBe(false);
      }
      all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(hit(a, b)).toBe(false)));
      // Targets: the spinner, each tower's whole column and every card, never under 100; columns never overlap.
      expect(2 * s.r).toBeGreaterThanOrEqual(200);
      expect(L.towers).toHaveLength(6);
      for (const c of L.towers) {
        expect([c.w, c.h]).toEqual([TOWER_W, TOWER_H]);
        expect(c.y + c.h / 2).toBe(L.base);
      }
      expect(Math.min(TOWER_W, TOWER_H)).toBeGreaterThanOrEqual(100);
      cols.forEach((c, i) => i && expect(c.x0).toBeGreaterThanOrEqual(cols[i - 1].x1));
      expect(L.cards).toHaveLength(3);
      for (const b of L.cards) expect([b.w, b.h]).toEqual([NUM_CARD, NUM_CARD]);
      expect(NUM_CARD).toBeGreaterThanOrEqual(100);
    });
});

describe('wheel size: six wedges by default, eight at level 9', () => {
  it('with the default, spin, spinRun, raceWheel and wedgeAt are what they were with six', () => {
    for (const seed of [1, 7, 99, 2026]) {
      const a = new Rng(seed),
        b = new Rng(seed);
      for (let i = 0; i < 200; i++) expect(spin(a)).toEqual(spin(b, 6));
      expect(spinRun(a, 50)).toEqual(spinRun(b, 50, WEDGES));
      expect(a.next()).toBe(b.next());
    }
    // The six-wedge draw is still one rng.int(0, 5) and one rng.next(), in that order, so every level 1–8 seed replays the same.
    const a = new Rng(11),
      b = new Rng(11);
    const s = spin(a);
    const wedge = b.int(0, 5);
    expect(s).toEqual({ wedge, angle: wedge * 60 + 12 + b.next() * 36 });
    expect(raceWheel(['duck', 'pig'], 4)).toEqual(raceWheel(['duck', 'pig'], 4, 6));
    for (let r = -7; r < 7; r += 0.013) expect(wedgeAt(r)).toBe(wedgeAt(r, 6));
  });
  it('an eight-wedge stop lies at least 9° inside its 45° wedge, and stopRotation lands it under the pointer', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 5000; i++) {
      const s = spin(rng, RIG_WEDGES);
      expect(s.wedge).toBeGreaterThanOrEqual(0);
      expect(s.wedge).toBeLessThanOrEqual(7);
      expect(s.angle).toBeGreaterThanOrEqual(s.wedge * 45 + 9);
      expect(s.angle).toBeLessThanOrEqual((s.wedge + 1) * 45 - 9);
      expect(wedgeAt(stopRotation(i * 0.7, s.angle, 0), RIG_WEDGES)).toBe(s.wedge);
    }
  });
  it('over 80 000 eight-wedge spins each wedge is within a point of an eighth', () => {
    const rng = new Rng(2026);
    const hits = Array(8).fill(0);
    for (let i = 0; i < 80000; i++) hits[spin(rng, RIG_WEDGES).wedge]++;
    for (const h of hits) expect(Math.abs(h / 80000 - 1 / 8)).toBeLessThan(0.01);
  });
  it('give works on a wheel of either size and keeps its size', () => {
    const racers: [Kind, Kind] = ['duck', 'pig'];
    for (const size of [6, 8])
      for (let a = 1; a < size; a++) {
        const w = raceWheel(racers, a, size);
        expect(w).toHaveLength(size);
        for (const to of racers) {
          const from = to === 'duck' ? 'pig' : 'duck';
          const next = give(w, racers, to);
          if (countOf(w, from) <= 1) {
            expect(next).toBeNull();
            continue;
          }
          expect(next).toHaveLength(size);
          expect(contiguous(next!)).toBe(true);
          expect(countOf(next!, to)).toBe(countOf(w, to) + 1);
          expect(give(next!, racers, from)).toEqual(w);
        }
      }
  });
});

describe('level 9: rig it', () => {
  const sets = (seed: number) => makeRound(9, new Rng(seed));
  it('the plan and the school range', () => {
    expect(planFor(9)).toEqual({ level: 9, ask: 'rig', name: 'Rig it', sets: 2, spins: 80 });
    expect(PROOF_SPINS).toBe(planFor(9).spins);
    expect(LEVELS.school).toEqual({ min: 3, max: 9 });
    // Levels 1–8 keep their numbers and asks, so saved levels and pins stay valid.
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((l) => planFor(l).ask)).toEqual([
      'see',
      'most',
      'pick',
      'sure',
      'fair',
      'settle',
      'dice',
      'typical',
    ]);
  });
  it('each set starts 4–4 on eight wedges with two critters; eighths first, then quarters; one favourite, a new friend', () => {
    const first = new Set<number>(),
      second = new Set<number>();
    for (let seed = 1; seed <= 400; seed++) {
      const round = sets(seed);
      expect(round).toHaveLength(2);
      const [a, b] = round;
      expect(a.favourite).toBe(b.favourite);
      expect(a.friend).not.toBe(b.friend);
      expect(RIG_EIGHTHS).toContain(a.target!.k);
      expect(RIG_QUARTERS).toContain(b.target!.k);
      first.add(a.target!.k);
      second.add(b.target!.k);
      for (const s of round) {
        const w = s.wheels[0];
        expect(s.wheels).toHaveLength(1);
        expect(w).toHaveLength(RIG_WEDGES);
        expect(s.racers).toEqual([s.favourite, s.friend]);
        expect(countOf(w, s.favourite!)).toBe(4);
        expect(countOf(w, s.friend!)).toBe(4);
        expect(contiguous(w)).toBe(true);
        expect(COLOR_OF[s.favourite!]).not.toBe(COLOR_OF[s.friend!]);
        // A half is never the target, so the wheel never starts right.
        expect(s.target!.k).not.toBe(4);
        expect(s.k).toBe(s.target!.k);
        expect(rigRight(w, s.favourite!, s.target!.k)).toBe(false);
      }
      expect(sets(seed)).toEqual(round);
    }
    expect([...first].sort()).toEqual([1, 3, 5, 7]);
    expect([...second].sort()).toEqual([2, 6]);
  });
  it('rigSet keeps the favourite it is given, never repeats the last friend, and asks eighths first and quarters after', () => {
    for (let seed = 1; seed <= 300; seed++)
      for (const fav of KINDS)
        for (const last of KINDS.filter((k) => k !== fav)) {
          const first = rigSet(new Rng(seed), fav, true, last);
          const second = rigSet(new Rng(seed), fav, false, last);
          for (const s of [first, second]) {
            expect(s.favourite).toBe(fav);
            expect(s.friend).not.toBe(last);
            expect(s.friend).not.toBe(fav);
            expect(COLOR_OF[s.friend!]).not.toBe(COLOR_OF[fav]);
          }
          expect(RIG_EIGHTHS).toContain(first.target!.k);
          expect(RIG_QUARTERS).toContain(second.target!.k);
        }
  });
  it('the spoken n out of every of is k eighths in lowest terms', () => {
    expect([1, 2, 3, 5, 6, 7].map(rigTarget)).toEqual([
      { k: 1, n: 1, of: 8 },
      { k: 2, n: 1, of: 4 },
      { k: 3, n: 3, of: 8 },
      { k: 5, n: 5, of: 8 },
      { k: 6, n: 3, of: 4 },
      { k: 7, n: 7, of: 8 },
    ]);
    for (let k = 1; k <= 7; k++) {
      const t = rigTarget(k);
      expect(t.n * 8).toBe(k * t.of);
      // Lowest terms: no smaller pair says the same share.
      for (let of = 1; of < t.of; of++) expect(Number.isInteger((k * of) / 8)).toBe(false);
    }
  });
  it('rigRight accepts exactly the wheels with k of the favourite, whoever the friend is', () => {
    const racers: [Kind, Kind] = ['duck', 'pig'];
    for (let k = 1; k <= 7; k++)
      for (let a = 1; a <= 7; a++) expect(rigRight(raceWheel(racers, a, 8), 'duck', k)).toBe(a === k);
  });
  it('from 4–4 (and from any wheel), nextRig reaches the target in |k − have| moves and nobody loses their last wedge', () => {
    const racers: [Kind, Kind] = ['duck', 'pig'];
    for (const k of [...RIG_EIGHTHS, ...RIG_QUARTERS])
      for (let start = 1; start <= 7; start++) {
        let w: Wheel = raceWheel(racers, start, 8);
        let moves = 0;
        for (let to = nextRig(w, racers, k); to; to = nextRig(w, racers, k)) {
          const next = give(w, racers, to);
          expect(next).not.toBeNull();
          w = next!;
          expect(countOf(w, 'duck')).toBeGreaterThanOrEqual(1);
          expect(countOf(w, 'pig')).toBeGreaterThanOrEqual(1);
          moves++;
        }
        expect(rigRight(w, 'duck', k)).toBe(true);
        expect(moves).toBe(Math.abs(k - start));
      }
  });
  it('the proof run is spin(rng, 8) eighty times: nothing filtered, shortened or drawn twice', () => {
    for (const seed of [1, 7, 99]) {
      const a = new Rng(seed),
        b = new Rng(seed);
      const run = spinRun(a, PROOF_SPINS, RIG_WEDGES);
      expect(run).toHaveLength(80);
      expect(run).toEqual(Array.from({ length: 80 }, () => spin(b, 8)));
      expect(a.next()).toBe(b.next());
    }
  });
  // Honesty measured, never enforced: Check is judged from the wedges and never from this run.
  it('over 2000 seeds the proof run is within ten of ten a wedge in at least 97% of sets, for each k', () => {
    for (const k of [...RIG_EIGHTHS, ...RIG_QUARTERS]) {
      const wheel = raceWheel(['duck', 'pig'], k, 8);
      let band = 0;
      for (let seed = 1; seed <= 2000; seed++) {
        const run = spinRun(new Rng(seed * 37 + k), PROOF_SPINS, RIG_WEDGES);
        if (inBand(run.filter((s) => wheel[s.wedge] === 'duck').length, k)) band++;
      }
      expect(band / 2000).toBeGreaterThanOrEqual(0.97);
    }
    expect(inBand(30, 2)).toBe(true);
    expect(inBand(31, 2)).toBe(false);
    expect(inBand(10, 2)).toBe(true);
    expect(inBand(9, 2)).toBe(false);
  });
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [1024, 700],
    [700, 1024],
    [1366, 768],
    [1194, 834],
  ];
  type R = { x0: number; y0: number; x1: number; y1: number };
  const rect = (b: Box): R => ({
    x0: b.x - b.w / 2,
    y0: b.y - b.h / 2,
    x1: b.x + b.w / 2,
    y1: b.y + b.h / 2,
  });
  const hit = (p: R, q: R) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  for (const [w, h] of VIEWS)
    it(`layout at ${w}x${h}`, () => {
      const L = rigLayout({ w, h });
      expect(L.portrait).toBe(h > w);
      const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
      const corners = [
        { x0: 0, y0: 0, x1: 120, y1: 120 },
        { x0: w - 120, y0: 0, x1: w, y1: 120 },
      ];
      // The wheel with its rim and pointer; each box with the count under it; the strip with the counts above and the ruler below.
      const s = L.spinner;
      const wheel = { x0: s.x - s.r - 8, y0: s.y - s.r - 30, x1: s.x + s.r + 8, y1: s.y + s.r + 8 };
      const boxes = L.boxes.map((b) => ({ ...rect(b), y1: b.y + b.h / 2 + RIG_COUNT }));
      const strip = {
        ...rect(L.strip),
        y0: L.strip.y - L.strip.h / 2 - RIG_TALLY,
        y1: L.strip.y + L.strip.h / 2 + RULER,
      };
      const all: R[] = [wheel, ...boxes, strip, rect(L.check)];
      for (const r of all) {
        expect(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h).toBe(true);
        expect(hit(r, pet)).toBe(false);
        for (const c of corners) expect(hit(r, c)).toBe(false);
      }
      all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(hit(a, b)).toBe(false)));
      // Targets: the spinner (its wedges), the two boxes and Check, never under 100; a wedge can always reach a box.
      expect(2 * s.r).toBeGreaterThanOrEqual(100);
      expect(L.boxes).toHaveLength(2);
      for (const b of L.boxes) expect([b.w, b.h]).toEqual([RIG_BOX, RIG_BOX]);
      for (const b of [...L.boxes, L.check]) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      // The boxes are far enough apart that a dropped wedge is nearer one than the other.
      expect(Math.abs(L.boxes[0].x - L.boxes[1].x)).toBeGreaterThanOrEqual(RIG_BOX + 40);
      expect(L.strip.w).toBeGreaterThanOrEqual(480);
    });
});
