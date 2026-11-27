import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  BUTTON_SIZE,
  LEVELS,
  MAX_SEGS_PER_STROKE,
  R_KEEP_GOAL,
  R_KEEP_START,
  SAMPLE_STEP,
  SEG_R,
  describeLevel,
  makeRound,
  nextHintStroke,
  planFor,
  rampLayout,
  referenceStrokes,
  sampleStroke,
  simulate,
  type Point,
  type Puzzle,
  type Stroke,
} from './logic';

const pt = (x: number, y: number): Point => ({ x, y });
const round = (level: number, seed: number) => makeRound(planFor(level), new Rng(seed));
const nudge = (strokes: Stroke[], si: number, end: number, dx: number, dy: number) =>
  strokes.map((s, i) =>
    i === si ? s.map((p, j) => (j === (end ? s.length - 1 : 0) ? pt(p.x + dx, p.y + dy) : p)) : s,
  );

describe('Draw a Ramp rules', () => {
  it('has a described ladder per band, 1 to 3', () => {
    expect(LEVELS.preschool).toEqual({ min: 1, max: 2 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 3 });
    expect(LEVELS.school).toEqual({ min: 2, max: 3 });
    for (const l of [1, 2, 3]) expect(describeLevel(l).length).toBeGreaterThan(20);
    expect([1, 2, 3].map((l) => planFor(l).maxStrokes)).toEqual([1, 2, 3]);
  });

  it('runs are deterministic and finite', () => {
    for (let seed = 1; seed <= 500; seed++)
      for (const level of [1, 2, 3]) {
        const p = round(level, seed)[0];
        const raw = [pt((seed * 37) % 700, (seed * 53) % 500), pt((seed * 91) % 700, (seed * 17) % 500)];
        const s = sampleStroke(raw, p);
        const strokes = s ? [s] : [];
        const a = simulate(p, strokes);
        const b = simulate(p, strokes);
        expect(b).toEqual(a);
        for (const q of a.path) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
      }
  });

  it('rolls gently down a 20 degree ramp without bouncing off or tunnelling', () => {
    const p: Puzzle = {
      level: 1,
      start: { x: 100, y: 100, vx: 0, vy: 0 },
      goal: pt(650, 480),
      fixed: [],
      ref: [],
    };
    const run = simulate(p, [[pt(60, 140), pt(500, 140 + 440 * Math.tan((20 * Math.PI) / 180))]]);
    // The marble stays on the ramp's top surface the whole way along it.
    for (const q of run.path) {
      if (q.x < 120 || q.x > 480) continue;
      const lineY = 140 + (q.x - 60) * Math.tan((20 * Math.PI) / 180);
      const normalGap = (lineY - q.y) * Math.cos((20 * Math.PI) / 180);
      if (q.y > 140) expect(normalGap).toBeGreaterThan(BALL_R + SEG_R - 3);
      if (q.y > 140) expect(normalGap).toBeLessThan(BALL_R + SEG_R + 6);
    }
  });

  it('solves every round: the reference pops the balloon, nothing at all does not', () => {
    for (let seed = 1; seed <= 500; seed++)
      for (const level of [1, 2, 3]) {
        const puzzles = round(level, seed);
        expect(puzzles).toHaveLength(2);
        for (const p of puzzles) {
          expect(p.level).toBe(level);
          expect(simulate(p, referenceStrokes(p)).hit).toBe(true);
          expect(simulate(p, []).hit).toBe(false);
          expect(referenceStrokes(p).length).toBeLessThanOrEqual(planFor(level).maxStrokes);
        }
      }
  });

  it('keeps the reference ramps on the board, outside the keep-out circles, and in the sampler as drawn', () => {
    for (const level of [1, 2, 3])
      for (const p of round(level, 3)) {
        for (const s of referenceStrokes(p)) {
          for (const q of s) {
            expect(q.x).toBeGreaterThan(0);
            expect(q.x).toBeLessThan(BOARD_W);
            expect(q.y).toBeLessThan(BOARD_H);
            expect(Math.hypot(q.x - p.start.x, q.y - p.start.y)).toBeGreaterThanOrEqual(R_KEEP_START);
            expect(Math.hypot(q.x - p.goal.x, q.y - p.goal.y)).toBeGreaterThanOrEqual(R_KEEP_GOAL);
          }
          const sampled = sampleStroke(s, p);
          expect(sampled).not.toBeNull();
          expect(
            simulate(
              p,
              referenceStrokes(p).map((r) => (r === s ? sampled! : r)),
            ).hit,
          ).toBe(true);
        }
      }
  });

  it('still pops the balloon when a reference ramp end is off by up to 15 units', () => {
    for (const level of [1, 2, 3])
      for (const p of round(level, 5)) {
        const ref = referenceStrokes(p);
        for (let si = 0; si < ref.length; si++)
          for (const end of [0, 1])
            for (const [dx, dy] of [
              [15, 0],
              [-15, 0],
              [0, 15],
              [0, -15],
            ])
              expect(simulate(p, nudge(ref, si, end, dx, dy)).hit).toBe(true);
      }
  });

  it('blocks one straight ramp from the chute to the balloon on levels 2 and 3', () => {
    for (const level of [2, 3])
      for (const p of round(level, 9)) {
        const exit = pt(p.start.x + (p.start.x < 360 ? 60 : -60), p.start.y + 50);
        const direct = sampleStroke([exit, p.goal], p);
        expect(direct).not.toBeNull();
        expect(simulate(p, [direct!]).hit).toBe(false);
      }
  });

  it('a missed run ends on the grass, in a dip or out of time, never by popping', () => {
    const p = round(1, 4)[0];
    const miss = simulate(p, []);
    expect(['floor', 'stalled', 'timeout']).toContain(miss.reason);
    expect(miss.path.length).toBeGreaterThan(2);
  });

  it('records which ramp the marble touched first', () => {
    const p = round(1, 2)[0];
    const s = sampleStroke(referenceStrokes(p)[0], p)!;
    const run = simulate(p, [s]);
    expect(run.firstTouch.slice(p.fixed.length).some((i) => i >= 0)).toBe(true);
  });
});

describe('Draw a Ramp strokes', () => {
  const p = round(1, 1)[0];
  it('drops points inside the chute and balloon circles and thins the rest', () => {
    const s = sampleStroke([p.start, pt(p.start.x + 200, p.start.y + 80), p.goal], p)!;
    expect(s).not.toBeNull();
    for (const q of s) {
      expect(Math.hypot(q.x - p.start.x, q.y - p.start.y)).toBeGreaterThanOrEqual(R_KEEP_START - 0.001);
      expect(Math.hypot(q.x - p.goal.x, q.y - p.goal.y)).toBeGreaterThanOrEqual(R_KEEP_GOAL - 0.001);
    }
    for (let i = 2; i < s.length - 1; i++) {
      expect(Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y)).toBeCloseTo(SAMPLE_STEP, 1);
    }
  });
  it('returns null for a tap, a stroke made only in a keep-out, and caps long scribbles', () => {
    expect(sampleStroke([pt(300, 300), pt(310, 305)], p)).toBeNull();
    expect(sampleStroke([p.start, pt(p.start.x + 10, p.start.y + 10)], p)).toBeNull();
    const long = Array.from({ length: 400 }, (_, i) =>
      pt(40 + (i % 2 ? 300 : 0) + (i % 7), 300 + (i % 5) * 20),
    );
    const s = sampleStroke(long, p)!;
    expect(s.length).toBeLessThanOrEqual(MAX_SEGS_PER_STROKE + 1);
  });
});

describe('Draw a Ramp hints', () => {
  it('lead somewhere: adding each hint ramp in turn pops the balloon, and a solved board needs none', () => {
    for (const level of [1, 2, 3])
      for (const p of round(level, 11)) {
        const drawn: Stroke[] = [];
        for (let guard = 0; guard < 4; guard++) {
          const h = nextHintStroke(p, drawn);
          if (!h) break;
          drawn.push(h);
        }
        expect(simulate(p, drawn).hit).toBe(true);
        expect(nextHintStroke(p, drawn)).toBeNull();
      }
  });
  it('skips a ramp she already drew near the reference', () => {
    const p = round(3, 2)[0];
    const ref = referenceStrokes(p);
    expect(nextHintStroke(p, [ref[0]])).toEqual(ref[1]);
  });
});

describe('Draw a Ramp layout', () => {
  const views = [
    { w: 1024, h: 768 },
    { w: 768, h: 1024, upright: true as const },
    { w: 768, h: 1662, upright: true as const },
    { w: 768, h: 1231, upright: true as const },
  ];
  it('fits the board and four 100-unit buttons, apart, clear of the top buttons and the pet corner', () => {
    for (const v of views) {
      const l = rampLayout(v);
      expect(l.board.x).toBeGreaterThanOrEqual(0);
      expect(l.board.x + BOARD_W).toBeLessThanOrEqual(v.w);
      expect(l.board.y).toBeGreaterThanOrEqual(v.upright ? 150 : 96);
      const boxes = (['go', 'undo', 'clear', 'hint'] as const).map((k) => {
        const s = BUTTON_SIZE[k];
        expect(s.h).toBeGreaterThanOrEqual(100);
        expect(s.w).toBeGreaterThanOrEqual(100);
        const c = l[k];
        return { k, x0: c.x - s.w / 2, x1: c.x + s.w / 2, y0: c.y - s.h / 2, y1: c.y + s.h / 2 };
      });
      for (const b of boxes) {
        expect(b.x0).toBeGreaterThanOrEqual(0);
        expect(b.x1).toBeLessThanOrEqual(v.w);
        expect(b.y1).toBeLessThanOrEqual(v.h);
        expect(b.y0).toBeGreaterThanOrEqual(l.board.y + BOARD_H);
        // The pet sits bottom-left, 150 units square.
        expect(b.x0 >= 150 || b.y1 <= v.h - 150).toBe(true);
      }
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].x0).toBeGreaterThanOrEqual(boxes[i - 1].x1);
    }
  });
});
