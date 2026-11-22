import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, type View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import {
  alongVine,
  ANCHOR_Y,
  angleAt,
  arcAt,
  BAND,
  beat,
  BOARD_H,
  BOARD_W,
  boardOrigin,
  cornerButtons,
  cutBy,
  fallbacksUsed,
  fallTime,
  leafFor,
  LEAF_Y,
  LEVELS,
  passDir,
  ringTime,
  whereArrive,
  whereFinish,
  whereHint,
  whereLand,
  whereLanding,
  whereLayout,
  whereNext,
  whereOrigin,
  wherePass,
  wherePick,
  whereReplay,
  whereReplayEnd,
  whereRound,
  whereSnip,
  type Dir,
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
  it('names levels 1–6 and clamps beyond', () => {
    expect(levels.map((l) => planFor(l).name)).toEqual([
      'Snip!',
      'Two vines',
      'Wait for the swing',
      'Which vine stays?',
      'Two friends',
      'Where will it land?',
    ]);
    expect(planFor(9).level).toBe(MAX_LEVEL);
    expect(planFor(0).level).toBe(1);
  });
  it('counts a missed drop or a hint only from level 3', () => {
    expect(levels.map((l) => planFor(l).counts)).toEqual([false, false, true, true, true, true]);
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
  it('following solve at the middle of its window always feeds the friend (levels 1–5; level 6 has no snip window)', () => {
    for (const level of levels.filter((l) => planFor(l).mode !== 'where')) {
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

describe('level 6, Where will it land?', () => {
  const plan = planFor(6);
  const dirs: Dir[] = [1, -1];
  it("is the school band's top level and no other band reaches it", () => {
    expect([plan.mode, plan.name, plan.lines]).toEqual(['where', 'Where will it land?', 1]);
    expect(LEVELS.school).toEqual({ min: 3, max: 6 });
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(LEVELS[band]!.max).toBeLessThan(6);
  });
  it('crosses the same ring in opposite directions, level and at the same speed', () => {
    const [r, l] = dirs.map((d) => whereLanding(d));
    for (const x of [r, l]) {
      expect(x.from.x).toBeCloseTo(360, 0);
      expect(Math.abs(x.from.y - 290)).toBeLessThan(0.5);
      expect(Math.abs(x.v.y)).toBeLessThan(0.01);
    }
    expect(Math.abs(r.v.x + l.v.x)).toBeLessThan(0.5);
    expect(r.v.x).toBeCloseTo(331.2, 0);
    expect(beat(wherePass(1).len)).toBeCloseTo(2.484, 2);
    expect(ringTime(wherePass(1))).toBeCloseTo(beat(250) / 4, 6);
  });
  it('lands each pass with the shared solver, mirrored about the anchor', () => {
    for (const d of dirs) {
      const w = whereLanding(d);
      expect(w.time).toBeCloseTo(fallTime(w.from, w.v, LEAF_Y), 9);
      const p = arcAt(w.from, w.v, w.time);
      expect([p.x, p.y]).toEqual([w.x, LEAF_Y]);
      expect(w.time).toBeCloseTo(0.581, 2);
    }
    expect(Math.abs(whereLanding(1).x - 360 - (360 - whereLanding(-1).x))).toBeLessThan(0.5);
    expect(whereLanding(1).x).toBeCloseTo(552.4, 0);
    expect(whereLanding(-1).x).toBeCloseTo(167.6, 0);
  });
  it('lands on distinct leaves, each landed fruit inside its own leaf target and clear of the other', () => {
    const L = whereLayout();
    expect(whereLanding(1).x - whereLanding(-1).x).toBeGreaterThanOrEqual(300);
    for (const d of dirs) {
      const x = whereLanding(d).x;
      const fruit: Box = { x: x - FRUIT_R, y: LEAF_Y - FRUIT_R, w: 2 * FRUIT_R, h: 2 * FRUIT_R };
      const own = L.leaves[leafFor(d) < 0 ? 0 : 1];
      const other = L.leaves[leafFor(d) < 0 ? 1 : 0];
      expect(leafFor(d)).toBe(d);
      expect(fruit.x >= own.x && fruit.x + fruit.w <= own.x + own.w).toBe(true);
      expect(fruit.y >= own.y && fruit.y + fruit.h <= own.y + own.h).toBe(true);
      expect(overlaps(fruit, other)).toBe(false);
    }
  });
  it('keeps the whole swing and both flights on the board and clear of Snip', () => {
    const snip = whereLayout().snip;
    const gap = (p: { x: number; y: number }) => {
      const dx = Math.max(snip.x - p.x, 0, p.x - (snip.x + snip.w));
      const dy = Math.max(snip.y - p.y, 0, p.y - (snip.y + snip.h));
      return Math.hypot(dx, dy) - FRUIT_R;
    };
    let least = Infinity;
    for (const d of dirs) {
      const s = wherePass(d);
      for (let t = 0; t <= beat(s.len); t += 1 / 240) {
        const p = posAt(s, t);
        expect(p.x - FRUIT_R).toBeGreaterThanOrEqual(0);
        expect(p.x + FRUIT_R).toBeLessThanOrEqual(BOARD_W);
        least = Math.min(least, gap(p));
      }
      const w = whereLanding(d);
      for (let t = 0; t <= w.time; t += 1 / 240) {
        const p = arcAt(w.from, w.v, t);
        expect(p.x - FRUIT_R).toBeGreaterThanOrEqual(0);
        expect(p.x + FRUIT_R).toBeLessThanOrEqual(BOARD_W);
        expect(p.y).toBeLessThanOrEqual(LEAF_Y + 1e-9);
        least = Math.min(least, gap(p));
      }
    }
    expect(least).toBeGreaterThanOrEqual(40);
  });
  it('every path finishes exactly once with no misses and at most two hints; the guess never changes the motion', () => {
    for (const g0 of dirs)
      for (const g1 of dirs)
        for (const hintMask of [0, 1, 2, 3])
          for (const replays of [0, 1, 3]) {
            const r = whereRound();
            let finishes = 0;
            for (const pass of [0, 1]) {
              expect(r.stage).toBe('approach');
              // A hint before the hold repeats the instruction and counts nothing.
              expect(whereHint(r)).toBe('instruct');
              whereArrive(r);
              expect(whereSnip(r)).toBe('pick-first');
              if (hintMask & (1 << pass)) {
                expect(whereHint(r)).toBe('counted');
                whereArrive(r);
                // A second hint in the same pass replays without counting.
                expect(whereHint(r)).toBe('replayed');
                whereArrive(r);
              }
              wherePick(r, -(pass ? g1 : g0) as Dir);
              wherePick(r, pass ? g1 : g0);
              const before = whereLanding(
                passDir({ first: 1, kind: 'orange', friends: ['bunny', 'duck'] }, pass),
              );
              expect(whereSnip(r)).toBe('snip');
              expect(whereHint(r)).toBe('instruct');
              whereLand(r);
              whereNext(r);
              expect(before).toEqual(
                whereLanding(passDir({ first: 1, kind: 'orange', friends: ['bunny', 'duck'] }, pass)),
              );
            }
            expect(r.stage).toBe('compare');
            expect(r.guesses).toEqual([g0, g1]);
            for (let i = 0; i < replays; i++) {
              expect(whereReplay(r)).toBe(true);
              expect(whereFinish(r)).toBe(false);
              whereReplayEnd(r);
            }
            for (let i = 0; i < 3; i++) if (whereFinish(r)) finishes++;
            expect(finishes).toBe(1);
            expect(r.misses).toBe(0);
            expect(r.hints).toBe([0, 1, 1, 2][hintMask]);
          }
  });
  it('authors the first round and seeds later ones: both directions first, two different friends', () => {
    const first = makeLine(plan, new Rng(7), 0);
    expect(first.where).toEqual({ first: 1, kind: 'orange', friends: ['bunny', 'duck'] });
    expect([first.fruit.kind, first.friend.kind, first.breeze, first.scoot]).toEqual([
      'orange',
      'bunny',
      false,
      false,
    ]);
    const seen = new Set<number>();
    for (const seed of seeds) {
      const l = makeLine(plan, new Rng(seed), 1);
      const w = l.where!;
      seen.add(w.first);
      expect(w.friends[0]).not.toBe(w.friends[1]);
      expect(l.fruit.kind).toBe(w.kind);
      expect(l.friend.x).toBeCloseTo(whereLanding(w.first).x, 6);
      expect(makeLine(plan, new Rng(seed), 1)).toEqual(l);
    }
    expect([...seen].sort()).toEqual([-1, 1]);
  });
  it('fits every control at every view: 100 units or more, apart, inside the view and clear of the pet, buttons and words', () => {
    const L = whereLayout();
    const targets = [...L.leaves, L.snip, L.replay, L.finish];
    for (const t of targets) expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
    for (let i = 0; i < targets.length; i++)
      for (let j = i + 1; j < targets.length; j++) expect(overlaps(targets[i], targets[j])).toBe(false);
    const phones = [computeView(667, 375), computeView(844, 390), computeView(568, 320)];
    const places = [
      ...views.flatMap((v) => [captionPlace(v, false), captionPlace(v, true)]),
      ...phones.flatMap((v) => [captionPlace(v, false), captionPlace(v, true)]),
    ];
    for (const place of places) {
      const v: View = place.game;
      const o = whereOrigin(v);
      for (const t of targets) {
        const b: Box = { x: o.x + t.x, y: o.y + t.y, w: t.w, h: t.h };
        expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h).toBe(true);
        for (const c of [...cornerButtons(v), petCorner(v)]) expect(overlaps(b, c)).toBe(false);
        // The bubble is drawn over the game's view; the rail and strip sit beside it.
        if (place.mode === 'bubble' && place.band) expect(overlaps(b, place.band)).toBe(false);
      }
      expect(o.x).toBeGreaterThanOrEqual(150);
    }
  });
});
