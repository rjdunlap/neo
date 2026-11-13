import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  alongVine,
  ANCHOR_Y,
  angleAt,
  BAND,
  beat,
  BOARD_H,
  BOARD_W,
  boardOrigin,
  cornerButtons,
  cutBy,
  fallbacksUsed,
  FRIEND_MAX,
  FRIEND_MIN,
  FRUIT_R,
  G,
  GROW,
  growAt,
  KEEP_GAP,
  keepFor,
  landing,
  level3Fair,
  linesFor,
  longest,
  makeLine,
  MAX_LEVEL,
  MIN_WINDOW,
  MOUTH_Y,
  nearestVine,
  overlaps,
  pairsOf,
  petCorner,
  planFor,
  plans,
  posAt,
  solve,
  solvePair,
  startSwing,
  STEP,
  swingFrom,
  TAP_R,
  velocityAt,
  vineGap,
  windows,
  type Box,
  type Line,
} from './logic';

const seeds = Array.from({ length: 500 }, (_, i) => i + 1);
const views = [
  computeView(1024, 768),
  computeView(768, 1024),
  computeView(844, 390),
  computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
];
const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

const allLines = (level: number) => seeds.flatMap((seed) => linesFor(planFor(level), new Rng(seed)));

describe('plans', () => {
  it('names levels 1–5 and clamps beyond', () => {
    expect(levels.map((l) => planFor(l).name)).toEqual([
      'Snip!',
      'Two vines',
      'Wait for the swing',
      'Which vine stays?',
      'Two friends',
    ]);
    expect(planFor(9).level).toBe(MAX_LEVEL);
    expect(planFor(0).level).toBe(1);
  });
  it('counts a missed drop or a hint only from level 3', () => {
    expect(levels.map((l) => planFor(l).counts)).toEqual([false, false, true, true, true]);
  });
});

describe('the model', () => {
  it('keeps every vine taut: the rest point is exactly each length from its anchor', () => {
    for (const level of levels) {
      for (const l of allLines(level)) {
        for (const { fruit } of pairsOf(l))
          for (const v of fruit.vines)
            expect(Math.abs(Math.hypot(fruit.rest.x - v.ax, fruit.rest.y - ANCHOR_Y) - v.len)).toBeLessThan(
              0.5,
            );
      }
    }
  });
  it('a pendulum returns to its start after one beat, and the beat grows with √L', () => {
    const s = swingFrom({ x: 400, y: 240 }, { ax: 300, len: Math.hypot(100, 200) });
    const T = beat(s.len);
    expect(angleAt(s, T)).toBeCloseTo(s.amp, 9);
    expect(beat(4 * 100) / beat(100)).toBeCloseTo(2, 9);
    expect(beat(250)).toBeCloseTo(2.48, 2);
  });
  it('a vine straight above the fruit gives no swing', () => {
    const s = swingFrom({ x: 300, y: 250 }, { ax: 300, len: 210 });
    expect(s.amp).toBe(0);
    for (const t of [0, 0.3, 1.1]) expect(posAt(s, t)).toEqual({ x: 300, y: 250 });
  });
  it('a fruit snipped at a turnaround falls straight down; mid-swing it lands ahead the way it was going', () => {
    const rest = { x: 300 + 120, y: ANCHOR_Y + Math.sqrt(240 ** 2 - 120 ** 2) };
    const s = swingFrom(rest, { ax: 300, len: 240 });
    const T = beat(240);
    expect(landing(s, 0, rest, 0).x).toBeCloseTo(rest.x, 6);
    const mid = landing(s, T / 4, rest, 0);
    const v = velocityAt(s, T / 4);
    expect(v.x).toBeLessThan(0);
    expect(mid.x).toBeLessThan(posAt(s, T / 4).x);
  });
  it('is finite and deterministic over 500 seeds at any snip time', () => {
    for (const l of allLines(3)) {
      const s = startSwing(l)!;
      for (let t = 0; t < beat(s.len); t += 0.05) {
        const a = landing(s, t, l.fruit.rest, l.friend.x),
          b = landing(s, t, l.fruit.rest, l.friend.x);
        expect(Number.isFinite(a.x) && Number.isFinite(a.time)).toBe(true);
        expect(a).toEqual(b);
      }
    }
  });
});

describe('levels', () => {
  it('level 1: one vine straight above the friend, and the one snip feeds it', () => {
    for (const l of allLines(1)) {
      expect(l.fruit.vines).toHaveLength(1);
      expect(l.fruit.rest.x).toBe(l.friend.x);
      expect(landing(null, 0, l.fruit.rest, l.friend.x).caught).toBe(true);
    }
  });
  it('level 2: two anchors 260–300 apart, and the scooting friend can reach every landing after either first snip', () => {
    for (const l of allLines(2)) {
      const [a, b] = l.fruit.vines;
      expect(b.ax - a.ax).toBeGreaterThanOrEqual(260);
      expect(b.ax - a.ax).toBeLessThanOrEqual(340);
      expect(l.scoot).toBe(true);
      for (const keep of l.fruit.vines) {
        const s = swingFrom(l.fruit.rest, keep);
        for (let t = 0; t < beat(s.len); t += STEP) {
          const x = landing(s, t, l.fruit.rest, 0).x;
          expect(x).toBeGreaterThanOrEqual(FRIEND_MIN - BAND / 2);
          expect(x).toBeLessThanOrEqual(FRIEND_MAX + BAND / 2);
          const p = posAt(s, t);
          expect(p.x - FRUIT_R).toBeGreaterThanOrEqual(0);
          expect(p.x + FRUIT_R).toBeLessThanOrEqual(BOARD_W);
        }
      }
      // Snipping both at once drops it from rest, also within reach.
      expect(
        landing(null, 0, l.fruit.rest, Math.min(FRIEND_MAX, Math.max(FRIEND_MIN, l.fruit.rest.x))).caught,
      ).toBe(true);
    }
  });
  it('level 3: a window of at least 0.4 s every beat; the opposite turnaround and straight below miss and name their side', () => {
    let sides = new Set<number>();
    for (const l of allLines(3)) {
      const s = startSwing(l)!;
      expect(longest(windows(s, l.friend.x))).toBeGreaterThanOrEqual(MIN_WINDOW);
      expect(level3Fair(s, l.friend.x)).toBe(true);
      const T = beat(s.len);
      const start = landing(s, 0, l.fruit.rest, l.friend.x);
      expect(start.caught).toBe(false);
      expect(start.side).toBe('early');
      const back = landing(s, (3 * T) / 4, l.fruit.rest, l.friend.x);
      expect(back.caught).toBe(false);
      expect(back.side).toBe('late');
      expect(landing(s, T / 4, l.fruit.rest, l.friend.x).caught).toBe(false);
      // The top of the swing on the friend's side feeds it.
      expect(landing(s, T / 2, l.fruit.rest, l.friend.x).caught).toBe(true);
      expect(l.friend.x).toBeGreaterThanOrEqual(FRIEND_MIN);
      expect(l.friend.x).toBeLessThanOrEqual(FRIEND_MAX);
      for (let t = 0; t < T; t += 0.05) {
        const p = posAt(s, t);
        expect(p.x - FRUIT_R).toBeGreaterThanOrEqual(0);
        expect(p.x + FRUIT_R).toBeLessThanOrEqual(BOARD_W);
      }
      sides.add(Math.sign(l.friend.x - s.ax));
    }
    expect([...sides].sort()).toEqual([-1, 1]);
  });
});

/** Every landing x of a fruit kept on `keep`, over one beat. */
const landingsOf = (l: { fruit: Line['fruit'] }, keep: number) => {
  const s = swingFrom(l.fruit.rest, l.fruit.vines[keep]);
  const out: number[] = [];
  for (let t = 0; t < beat(s.len); t += STEP) out.push(landing(s, t, l.fruit.rest, 0).x);
  return out;
};

describe('which vine stays (levels 4–5)', () => {
  it("level 4: exactly one keep has a window of at least 0.4 s, the one on the friend's side; the straight-above vine hangs still and never feeds", () => {
    for (const seed of seeds) {
      const round = linesFor(planFor(4), new Rng(seed));
      expect(round.some((l) => l.fruit.vines.length === 3)).toBe(true);
      const sides = new Set(round.map((l) => Math.sign(l.friend.x - l.fruit.rest.x)));
      expect([...sides].sort()).toEqual([-1, 1]);
      for (const l of round) {
        expect(l.second).toBeUndefined();
        expect([2, 3]).toContain(l.fruit.vines.length);
        const ks = plans(l);
        expect(ks.filter((k) => k.window > 0)).toHaveLength(1);
        const keep = keepFor(l);
        expect(ks[keep].window).toBeGreaterThanOrEqual(MIN_WINDOW);
        expect(Math.sign(l.fruit.vines[keep].ax - l.fruit.rest.x)).toBe(
          Math.sign(l.friend.x - l.fruit.rest.x),
        );
        const above = l.fruit.vines.findIndex((v) => v.ax === l.fruit.rest.x);
        if (l.fruit.vines.length === 3) {
          expect(above).toBe(1);
          expect(swingFrom(l.fruit.rest, l.fruit.vines[1]).amp).toBe(0);
          expect(ks[1].window).toBe(0);
        }
        // Dropping it from rest (every vine at once, or the still vine last) misses.
        expect(landing(null, 0, l.fruit.rest, l.friend.x).caught).toBe(false);
        // A snip where the kept swing starts misses; the top on the friend's side feeds it.
        const s = swingFrom(l.fruit.rest, l.fruit.vines[keep]);
        expect(landing(s, 0, l.fruit.rest, l.friend.x).caught).toBe(false);
        expect(landing(s, beat(s.len) / 2, l.fruit.rest, l.friend.x).caught).toBe(true);
      }
    }
  });
  it('level 4: the authored first line is a lemon on left, straight-above and right vines with Pig on the right', () => {
    const l = makeLine(planFor(4), new Rng(7), 0);
    expect([l.fruit.kind, l.friend.kind, l.fruit.vines.length]).toEqual(['lemon', 'pig', 3]);
    expect(l.friend.x).toBeGreaterThan(l.fruit.rest.x);
    expect(keepFor(l)).toBe(2);
    expect(plans(l).map((k) => k.window > 0)).toEqual([false, false, true]);
  });
  it('level 5: each fruit has one working keep, sending the two fruits to different friends; no fruit can reach the other friend', () => {
    for (const l of allLines(5)) {
      const [a, b] = pairsOf(l);
      expect(b).toBeDefined();
      expect(a.friend.x).toBeLessThan(b.friend.x);
      expect(b.friend.x - a.friend.x).toBeGreaterThanOrEqual(BAND * 2);
      for (const [p, other] of [
        [a, b],
        [b, a],
      ] as const) {
        expect(p.fruit.vines).toHaveLength(2);
        expect(plans(p).filter((k) => k.window > 0)).toHaveLength(1);
        expect(plans(p)[keepFor(p)].window).toBeGreaterThanOrEqual(MIN_WINDOW);
        for (const keep of [0, 1])
          for (const x of landingsOf(p, keep)) expect(Math.abs(x - other.friend.x)).toBeGreaterThan(BAND / 2);
        expect(Math.abs(p.fruit.rest.x - other.friend.x)).toBeGreaterThan(BAND / 2);
      }
      // The left fruit keeps its left vine, the right fruit its right.
      expect(keepFor(a)).toBe(0);
      expect(keepFor(b)).toBe(1);
    }
    const first = makeLine(planFor(5), new Rng(7), 0);
    expect([
      first.fruit.kind,
      first.second!.fruit.kind,
      first.friend.kind,
      first.second!.friend.kind,
    ]).toEqual(['apple', 'apple', 'dog', 'cat']);
  });
  it("level 5: the two fruits' swings, kept either way, never meet each other or the other fruit's hanging vines", () => {
    for (const l of allLines(5).slice(0, 200)) {
      const [a, b] = pairsOf(l);
      const arc = (f: Line['fruit']) =>
        f.vines.flatMap((v) => {
          const s = swingFrom(f.rest, v);
          return Array.from({ length: 40 }, (_, k) => posAt(s, (beat(s.len) * k) / 40));
        });
      for (const p of arc(a.fruit))
        for (const q of arc(b.fruit))
          expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(2 * FRUIT_R);
    }
  });
  it('levels 4–5: every swing stays on the board, and neighbouring vines are at least 100 apart where a finger reaches them', () => {
    for (const level of [4, 5]) {
      for (const l of allLines(level)) {
        expect(vineGap(l)).toBeGreaterThanOrEqual(KEEP_GAP);
        for (const p of pairsOf(l)) {
          for (const v of p.fruit.vines) {
            const s = swingFrom(p.fruit.rest, v);
            for (let t = 0; t < beat(s.len); t += 0.05) {
              const q = posAt(s, t);
              expect(q.x - FRUIT_R).toBeGreaterThanOrEqual(0);
              expect(q.x + FRUIT_R).toBeLessThanOrEqual(BOARD_W);
            }
          }
          // A tap near a vine resolves to that vine.
          p.fruit.vines.forEach((v, i) => {
            for (const f of [0.15, 0.3])
              expect(nearestVine(alongVine(v, p.fruit.rest, f), p.fruit.vines, p.fruit.rest)).toBe(i);
          });
        }
      }
    }
  });
});

describe('generation', () => {
  it('is seeded, well formed, and never needs the fallback', () => {
    for (const level of levels) {
      for (const seed of seeds.slice(0, 100)) {
        expect(linesFor(planFor(level), new Rng(seed))).toEqual(linesFor(planFor(level), new Rng(seed)));
      }
      allLines(level);
    }
    expect(fallbacksUsed).toBe(0);
  });
  it('authors each first line as the definition describes', () => {
    const first = (level: number) => makeLine(planFor(level), new Rng(7), 0);
    const one = first(1);
    expect([one.fruit.kind, one.friend.kind, one.fruit.vines.length]).toEqual(['apple', 'bunny', 1]);
    const two = first(2);
    expect([two.fruit.kind, two.friend.kind, two.fruit.vines.length, two.friend.x]).toEqual([
      'pear',
      'bear',
      2,
      two.fruit.rest.x,
    ]);
    const three = first(3);
    expect([three.fruit.kind, three.friend.kind, three.breeze]).toEqual(['orange', 'duck', true]);
    // The duck is on the right; the swing starts at its left end, and a snip there drops it short.
    const s = startSwing(three)!;
    expect(three.friend.x).toBeGreaterThan(s.ax);
    expect(three.fruit.rest.x).toBeLessThan(s.ax);
    expect(landing(s, 0, three.fruit.rest, three.friend.x)).toMatchObject({ caught: false, side: 'early' });
  });
});

describe('the hint', () => {
  it('following solve at the middle of its window always feeds the friend', () => {
    for (const level of levels) {
      for (const l of allLines(level)) {
        if (level >= 4) {
          for (const p of pairsOf(l)) {
            const plan = solvePair(p, l);
            expect(plan.order.at(-1)).toBe(plan.keep);
            expect([...plan.order].sort()).toEqual(p.fruit.vines.map((_, i) => i));
            const s = swingFrom(p.fruit.rest, p.fruit.vines[plan.keep]);
            expect(landing(s, plan.at!, p.fruit.rest, p.friend.x).caught).toBe(true);
          }
          continue;
        }
        const plan = solve(l);
        const s = startSwing(l);
        if (s) {
          expect(plan.at).not.toBeNull();
          expect(landing(s, plan.at!, l.fruit.rest, l.friend.x).caught).toBe(true);
        } else expect(plan.order).toHaveLength(l.fruit.vines.length);
      }
    }
  });
});

describe('input geometry', () => {
  const line: Line = makeLine(planFor(2), new Rng(3), 0);
  const fruit = line.fruit.rest;
  const [a, b] = line.fruit.vines;
  it('a stroke that crosses a vine cuts it, one that misses does not', () => {
    const p = alongVine(a, fruit, 0.4);
    expect(cutBy({ x: p.x - 60, y: p.y }, { x: p.x + 60, y: p.y }, line.fruit.vines, fruit)).toEqual([0]);
    expect(
      cutBy({ x: p.x - 60, y: p.y - 300 }, { x: p.x + 60, y: p.y - 300 }, line.fruit.vines, fruit),
    ).toEqual([]);
  });
  it('a fast stroke in long segments cuts the same vines as a slow one', () => {
    const from = { x: 100, y: 150 },
      to = { x: 620, y: 170 };
    const fast = cutBy(from, to, line.fruit.vines, fruit);
    const slow = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const p = { x: from.x + ((to.x - from.x) * i) / 40, y: from.y + ((to.y - from.y) * i) / 40 };
      const q = {
        x: from.x + ((to.x - from.x) * (i + 1)) / 40,
        y: from.y + ((to.y - from.y) * (i + 1)) / 40,
      };
      for (const k of cutBy(p, q, line.fruit.vines, fruit)) slow.add(k);
    }
    expect(fast.sort()).toEqual([...slow].sort());
    expect(fast).toEqual([0, 1]);
  });
  it('a tap resolves to the nearest vine within reach; the vines are at least 140 apart where a finger reaches them', () => {
    for (const l of allLines(2).slice(0, 200)) {
      const [v, w] = l.fruit.vines;
      for (const f of [0.15, 0.3, 0.45]) {
        const p = alongVine(v, l.fruit.rest, f),
          q = alongVine(w, l.fruit.rest, f);
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(140);
        expect(nearestVine({ x: p.x + 20, y: p.y }, l.fruit.vines, l.fruit.rest)).toBe(0);
        expect(nearestVine({ x: q.x - 20, y: q.y }, l.fruit.vines, l.fruit.rest)).toBe(1);
      }
    }
    const p = alongVine(b, fruit, 0.3);
    expect(nearestVine({ x: p.x + TAP_R + 40, y: p.y }, line.fruit.vines, fruit)).toBe(-1);
  });
});

describe('layout', () => {
  const inside = (r: Box, v: { w: number; h: number }) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
  it('keeps the board, its contents and Grow back inside the view, clear of the pet and the corner buttons, unscaled', () => {
    for (const v of views) {
      const o = boardOrigin(v);
      const board: Box = { x: o.x, y: o.y, w: BOARD_W, h: BOARD_H };
      expect(inside(board, v)).toBe(true);
      for (const c of cornerButtons(v)) expect(overlaps(board, c)).toBe(false);
      expect(overlaps(board, petCorner(v))).toBe(false);
      const g = growAt(v);
      const grow: Box = { x: g.x - GROW / 2, y: g.y - GROW / 2, w: GROW, h: GROW };
      expect(inside(grow, v)).toBe(true);
      expect(overlaps(grow, board)).toBe(false);
      for (const c of [...cornerButtons(v), petCorner(v)]) expect(overlaps(grow, c)).toBe(false);
      // Catch bands, mouths and every swing stay on the board.
      for (const level of levels) {
        for (const { friend } of allLines(level).slice(0, 50).flatMap(pairsOf)) {
          expect(friend.x - BAND / 2).toBeGreaterThanOrEqual(0);
          expect(friend.x + BAND / 2).toBeLessThanOrEqual(BOARD_W);
          expect(MOUTH_Y).toBeLessThan(BOARD_H);
        }
      }
    }
  });
  it('uses the stated toy gravity', () => {
    expect(G).toBe(1600);
  });
});
