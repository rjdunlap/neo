import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  BOARD_H,
  BOARD_W,
  BUTTON,
  DROP_Y,
  FLOOR,
  LAST_SIZE,
  LEVELS,
  MAX_DROPS,
  MAX_PIECES,
  SIZES,
  STEP,
  canDrop,
  clonePond,
  describeLevel,
  drop,
  emptyPond,
  hintDrop,
  makeRound,
  planFor,
  playGreedy,
  pondLayout,
  reachedGoal,
  settle,
  step,
  type Pond,
} from './logic';

const rad = (s: number) => SIZES[s].r;
const place = (pond: Pond, size: number, x: number, y: number) =>
  pond.pieces.push({ id: pond.nextId++, size, x, y, vx: 0, vy: 0, calm: 0 });
const round = (level: number, seed: number) => makeRound(planFor(level), new Rng(seed));

describe('Pond Merge levels', () => {
  it('lists the ladder and names each level', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 3 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 1 });
    expect([1, 2, 3].map(describeLevel)).toEqual(['Make a duck', 'Make a goose', 'Make a swan']);
    expect(planFor(2).goal).toBe(4);
    expect(planFor(99).level).toBe(3);
  });
});

describe('Pond Merge solver', () => {
  it('is deterministic, and replaying one drop fewer gives the pond before the last drop', () => {
    const r = round(3, 7);
    const xs = [60, 300, 180, 60, 250, 120, 330, 200];
    const play = (n: number) => {
      const pond = emptyPond(r.goal);
      const events: unknown[] = [];
      for (let i = 0; i < n; i++) events.push(...drop(pond, r.items[i], xs[i]), ...settle(pond, 3));
      return { pond, events };
    };
    const a = play(xs.length);
    const b = play(xs.length);
    expect(a.pond).toEqual(b.pond);
    expect(a.events).toEqual(b.events);
    // A snapshot taken before the last drop equals a replay of one drop fewer (what take-back restores).
    const before = play(xs.length - 1);
    const snap = clonePond(before.pond);
    expect(snap).toEqual(before.pond);
    expect(snap.pieces[0]).not.toBe(before.pond.pieces[0]);
  });

  it('stays finite with no deep overlap (under 3 units) and at most MAX_PIECES, over 100 seeds of random drops', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const r = round(3, seed);
      const pond = emptyPond(99);
      for (let i = 0; i < 40; i++) {
        drop(pond, r.items[i], rng.range(0, BOARD_W));
        settle(pond, 2);
        expect(pond.pieces.length).toBeLessThanOrEqual(MAX_PIECES);
      }
      settle(pond, 6);
      for (const p of pond.pieces) {
        expect(
          Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.vx) && Number.isFinite(p.vy),
        ).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(rad(p.size) - 0.01);
        expect(p.x).toBeLessThanOrEqual(BOARD_W - rad(p.size) + 0.01);
        expect(p.y).toBeLessThanOrEqual(FLOOR - rad(p.size) + 0.01);
      }
      for (let i = 0; i < pond.pieces.length; i++)
        for (let j = i + 1; j < pond.pieces.length; j++) {
          const a = pond.pieces[i];
          const b = pond.pieces[j];
          const overlap = rad(a.size) + rad(b.size) - Math.hypot(a.x - b.x, a.y - b.y);
          expect(overlap).toBeLessThan(3);
        }
    }
  });

  it('merges two equal pieces in contact into one of the next size at the weighted midpoint, and nothing else', () => {
    const pond = emptyPond(5);
    place(pond, 1, 200, 400);
    place(pond, 1, 200 + 2 * rad(1), 400);
    const ev = step(pond);
    expect(ev.filter((e) => e.kind === 'merge')).toHaveLength(1);
    expect(pond.pieces).toHaveLength(1);
    expect(pond.pieces[0].size).toBe(2);
    expect(pond.pieces[0].id).toBe(1);
    expect(pond.pieces[0].x).toBeGreaterThan(200 + rad(1) - 2);
    expect(pond.pieces[0].x).toBeLessThan(200 + rad(1) + 2);

    const odd = emptyPond(5);
    place(odd, 1, 200, 400);
    place(odd, 2, 200 + rad(1) + rad(2), 400);
    step(odd);
    expect(odd.pieces.map((p) => p.size).sort()).toEqual([1, 2]);

    const swans = emptyPond(99);
    place(swans, LAST_SIZE, 150, 400);
    place(swans, LAST_SIZE, 150 + 2 * rad(LAST_SIZE), 400);
    step(swans);
    expect(swans.pieces).toHaveLength(2);
  });

  it('lets each piece join at most one merge per step', () => {
    const pond = emptyPond(5);
    place(pond, 0, 200, 500);
    place(pond, 0, 244, 500);
    place(pond, 0, 288, 500);
    step(pond);
    expect(pond.pieces.map((p) => p.size).sort()).toEqual([0, 1]);
  });

  it('resolves four equal pieces in a square to two, then one, the same way every run', () => {
    const run = () => {
      const pond = emptyPond(9);
      const r = rad(1);
      place(pond, 1, 200, 500);
      place(pond, 1, 200 + 2 * r, 500);
      place(pond, 1, 200, 500 - 2 * r);
      place(pond, 1, 200 + 2 * r, 500 - 2 * r);
      const counts: number[] = [];
      for (let k = 0; k < 80; k++) {
        step(pond);
        if (counts.at(-1) !== pond.pieces.length) counts.push(pond.pieces.length);
      }
      return { counts, sizes: pond.pieces.map((p) => p.size) };
    };
    const a = run();
    expect(a.counts[0]).toBe(2);
    expect(a.sizes).toEqual([3]);
    expect(run()).toEqual(a);
  });

  it('reports the goal once, when a piece of the goal size appears', () => {
    const pond = emptyPond(2);
    place(pond, 1, 200, 500);
    place(pond, 1, 200 + 2 * rad(1), 500);
    const ev = step(pond);
    expect(ev.filter((e) => e.kind === 'goal')).toHaveLength(1);
    expect(reachedGoal(pond, 2)).toBe(true);
    expect(step(pond).filter((e) => e.kind === 'goal')).toHaveLength(0);
  });

  it('lifts the smallest friends from a full pond, keeps the biggest, and the round goes on', () => {
    // A tall column of alternating ducklings and chicks (never two equal neighbours) that reaches the drop line.
    const pond = emptyPond(5);
    const lifts: { size: number; count: number }[] = [];
    for (let k = 0; k < 8; k++) {
      drop(pond, k % 2 ? 1 : 2, 210);
      for (const e of settle(pond, 3)) if (e.kind === 'lift') lifts.push(e);
    }
    for (let k = 0; k < 3 / STEP; k++) for (const e of step(pond)) if (e.kind === 'lift') lifts.push(e);
    expect(lifts.length).toBeGreaterThan(0);
    expect(lifts[0].size).toBe(1);
    expect(lifts[0].count).toBeGreaterThan(0);
    expect(pond.pieces.some((p) => p.size === 1)).toBe(false);
    expect(Math.max(...pond.pieces.map((p) => p.size))).toBeGreaterThanOrEqual(2);
    // Nothing was lost: a friend can still be dropped and merges are still possible.
    expect(canDrop(pond)).toBe(true);
    drop(pond, 2, hintDrop(pond, 2));
    settle(pond, 5);
    expect(pond.pieces.length).toBeGreaterThan(0);
  });

  it('floats the smallest away rather than refuse a drop when the pond holds MAX_PIECES', () => {
    const pond = emptyPond(5);
    for (let k = 0; k < MAX_PIECES; k++)
      place(pond, k % 2 ? 0 : 1, 30 + (k % 14) * 25, 30 + Math.floor(k / 14) * 5);
    const ev = drop(pond, 0, 200);
    expect(ev.some((e) => e.kind === 'lift')).toBe(true);
    expect(pond.pieces.length).toBeLessThanOrEqual(MAX_PIECES);
  });

  it('accepts the next drop only after the gap, and never because the pile is still settling', () => {
    const pond = emptyPond(5);
    expect(canDrop(pond)).toBe(true);
    drop(pond, 0, 200);
    expect(canDrop(pond)).toBe(false);
    for (let k = 0; k < Math.ceil(0.36 / STEP); k++) step(pond);
    expect(canDrop(pond)).toBe(true);
    expect(pond.pieces[0].y).toBeGreaterThan(DROP_Y);
  });
});

describe('Pond Merge rounds', () => {
  it('builds blocks of six where every size of the drop set appears an even number of times', () => {
    for (const level of [1, 2, 3])
      for (let seed = 1; seed <= 100; seed++) {
        const { items, plan } = round(level, seed);
        expect(items.length % 6).toBe(0);
        for (let b = 0; b < items.length; b += 6) {
          const block = items.slice(b, b + 6);
          for (const s of plan.dropSet) expect(block.filter((x) => x === s).length % 2).toBe(0);
          expect(block.every((x) => plan.dropSet.includes(x))).toBe(true);
        }
        expect(items[0]).toBe(plan.dropSet[0]);
        expect(items[1]).toBe(plan.dropSet[0]);
      }
  });

  it('is the same for the same seed and differs between seeds', () => {
    expect(round(2, 5).items).toEqual(round(2, 5).items);
    expect(round(2, 5).items).not.toEqual(round(2, 6).items);
  });

  it('can always be finished by a player who follows the hint, within the measured cap', () => {
    for (const level of [1, 2, 3])
      for (let seed = 1; seed <= 40; seed++) {
        const r = playGreedy(round(level, seed));
        expect(r, `level ${level} seed ${seed}`).not.toBeNull();
        expect(r!.drops).toBeLessThanOrEqual(MAX_DROPS[level]);
        expect(reachedGoal(r!.pond, planFor(level).goal)).toBe(true);
      }
  });

  it('never reaches the goal with no drops', () => {
    for (const level of [1, 2, 3])
      expect(reachedGoal(emptyPond(planFor(level).goal), planFor(level).goal)).toBe(false);
  });
});

describe('Pond Merge hint', () => {
  it('points at a free piece of the same size, else at the lowest spot, always inside the walls', () => {
    const pond = emptyPond(5);
    place(pond, 1, 300, FLOOR - rad(1));
    place(pond, 0, 100, FLOOR - rad(0));
    expect(hintDrop(pond, 1)).toBe(300);
    const x = hintDrop(pond, 2);
    expect(x).toBeGreaterThanOrEqual(rad(2));
    expect(x).toBeLessThanOrEqual(BOARD_W - rad(2));
    expect(hintDrop(emptyPond(5), 0)).toBeGreaterThanOrEqual(rad(0));
  });
});

describe('Pond Merge layout', () => {
  const views = [
    { w: 1024, h: 768 },
    { w: 1366, h: 768 },
    { w: 768, h: 1024, upright: true as const },
    { w: 768, h: 1231, upright: true as const },
    { w: 768, h: 1662, upright: true as const },
  ];
  it('keeps the board and both 100-unit buttons inside the view, apart, clear of the top buttons and the pet corner', () => {
    for (const v of views) {
      const l = pondLayout(v);
      expect(l.board.x).toBeGreaterThanOrEqual(0);
      expect(l.board.x + BOARD_W).toBeLessThanOrEqual(v.w);
      expect(l.board.y).toBeGreaterThanOrEqual(v.upright ? 150 : 100);
      expect(l.board.y + BOARD_H).toBeLessThanOrEqual(v.h);
      expect(BUTTON.w).toBeGreaterThanOrEqual(100);
      expect(BUTTON.h).toBeGreaterThanOrEqual(100);
      const boxes = [l.takeBack, l.hint].map((c) => ({
        x0: c.x - BUTTON.w / 2,
        x1: c.x + BUTTON.w / 2,
        y0: c.y - BUTTON.h / 2,
        y1: c.y + BUTTON.h / 2,
      }));
      for (const b of boxes) {
        expect(b.x0).toBeGreaterThanOrEqual(0);
        expect(b.x1).toBeLessThanOrEqual(v.w);
        expect(b.y0).toBeGreaterThanOrEqual(0);
        expect(b.y1).toBeLessThanOrEqual(v.h);
        // The pet sits bottom-left, 150 units square.
        expect(b.x0 >= 150 || b.y1 <= v.h - 150).toBe(true);
        // Never over the board.
        expect(b.x1 <= l.board.x || b.x0 >= l.board.x + BOARD_W || b.y0 >= l.board.y + BOARD_H).toBe(true);
      }
      const [a, b] = boxes;
      expect(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0).toBe(true);
    }
  });

  it('puts the six chain pictures inside the view', () => {
    for (const v of views) {
      const { strip } = pondLayout(v);
      for (let k = 0; k < SIZES.length; k++) {
        const x = strip.x + strip.dx * k;
        const y = strip.y + strip.dy * k;
        expect(x).toBeGreaterThanOrEqual(30);
        expect(x).toBeLessThanOrEqual(v.w - 30);
        expect(y).toBeGreaterThanOrEqual(30);
        expect(y).toBeLessThanOrEqual(v.h - 30);
      }
    }
  });
});
