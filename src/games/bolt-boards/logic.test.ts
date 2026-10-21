import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  apply, boardLayout, boltAt, corners, covered, done, freeBolts, FRIEND, HEAD, HIT, hintMove, holeAt, holeCount, HOLE, MIN_ARM, mirror, moves,
  mustGo, openHoles, PET_H, PET_W, planFor, PLANS, pose, poses, remove, removed, SEARCH_CAP, solve, startState, stuck, toView, WALL_H, WALL_W,
  type Pose, type Pt, type Puzzle, type State,
} from './logic';
import { PUZZLES } from './puzzles';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const all = () => PLANS.flatMap((plan) => PUZZLES[plan.id].map((p, k) => ({ plan, p, k })));

/** Every state reachable by legal moves. */
function reachable(p: Puzzle, holes: boolean, cap = 20000): State[] {
  const seen = new Map<string, State>();
  const todo: State[] = [startState(p)];
  while (todo.length && seen.size < cap) {
    const s = todo.pop()!;
    const k = s.join(',');
    if (seen.has(k)) continue;
    seen.set(k, s);
    for (const m of moves(p, s, holes)) todo.push(apply(s, m));
  }
  return [...seen.values()];
}

/** Every pose a board can take: pinned (two or more bolts) and hanging from each of its bolts. */
function everyPose(p: Puzzle, i: number): Pose[] {
  const mine = p.bolts.map((_, b) => b).filter((b) => p.bolts[b].board === i);
  const out = mine.map((b) => pose(p, p.bolts.map((_, x) => (x === b ? b : -1)), i));
  if (mine.length >= 2) out.push(pose(p, p.bolts.map((_, x) => x), i));
  return out;
}

/** An independent overlap check: the circle's centre inside the board's corner polygon, or within r of an edge. */
function polyOverlaps(p: Puzzle, i: number, q: Pose, c: Pt, r: number): boolean {
  const cs = corners(p, i, q);
  if (!cs.length) return false;
  let inside = true;
  for (let k = 0; k < 4; k++) {
    const a = cs[k], b = cs[(k + 1) % 4];
    if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0) inside = false;
  }
  if (inside) return true;
  for (let k = 0; k < 4; k++) {
    const a = cs[k], b = cs[(k + 1) % 4];
    const t = Math.max(0, Math.min(1, ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)));
    if (Math.hypot(a.x + t * (b.x - a.x) - c.x, a.y + t * (b.y - a.y) - c.y) < r) return true;
  }
  return false;
}

describe('Bolt Boards poses', () => {
  it('pins a board with two bolts, hangs it straight below one, and drops it with none', () => {
    for (const { p } of all()) {
      p.boards.forEach((d, i) => {
        const mine = p.bolts.map((_, b) => b).filter((b) => p.bolts[b].board === i);
        for (const b of mine) expect(Math.hypot(p.bolts[b].x - d.x, p.bolts[b].y - d.y)).toBeGreaterThanOrEqual(MIN_ARM);
        for (const q of everyPose(p, i)) {
          if (q.kind !== 'hanging') { expect(q).toMatchObject({ x: d.x, y: d.y, rot: 0 }); continue; }
          const bolt = p.bolts[q.bolt];
          expect(Math.abs(q.x - bolt.x)).toBeLessThan(0.01);
          expect(q.y).toBeGreaterThan(bolt.y);
          expect(Math.abs(q.rot)).toBeLessThanOrEqual(Math.PI);
          // The hanging bolt stays on its own spot of the board.
          const local = { x: bolt.x - d.x, y: bolt.y - d.y }, c = Math.cos(q.rot), s = Math.sin(q.rot);
          expect(q.x + local.x * c - local.y * s).toBeCloseTo(bolt.x, 6);
          expect(q.y + local.x * s + local.y * c).toBeCloseTo(bolt.y, 6);
        }
        expect(pose(p, p.bolts.map(() => -1), i).kind).toBe('down');
        if (mine.length === 1) expect(pose(p, startState(p), i).kind).toBe('hanging');
      });
    }
  });

  it('agrees with a direct polygon check on covers and open holes, and never moves a lower board', () => {
    for (const { plan, p } of all()) {
      const states = reachable(p, plan.holes, 400);
      for (const s of states.slice(0, 60)) {
        const qs = poses(p, s);
        p.bolts.forEach((bolt, b) => {
          if (s[b] !== b) return;
          const z = p.boards[bolt.board].z;
          const direct = p.boards.some((d, j) => d.z > z && polyOverlaps(p, j, qs[j], bolt, HEAD));
          expect(covered(p, s, b)).toBe(direct);
        });
        const open = openHoles(p, s);
        for (let h = 0; h < holeCount(p); h++) {
          const at = holeAt(p, h);
          const direct = !s.includes(h) && !p.boards.some((_, j) => polyOverlaps(p, j, qs[j], at, HOLE));
          expect(open.includes(h)).toBe(direct);
        }
        // Taking a bolt out moves only its own board.
        for (const m of moves(p, s, plan.holes).slice(0, 3)) {
          const n = apply(s, m), qn = poses(p, n);
          p.boards.forEach((_, i) => { if (i !== p.bolts[m.bolt].board) expect(qn[i]).toEqual(qs[i]); });
        }
      }
    }
  });
});

describe('Bolt Boards levels 1–5 never dead-end', () => {
  it('finishes from any order of free bolts, 200 seeded tries per board', () => {
    for (const { plan, p } of all().filter((x) => !x.plan.holes)) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let s: State = startState(p);
        for (let n = 0; n < 40 && !done(p, s, plan.goal); n++) {
          const free = freeBolts(p, s);
          expect(free.length).toBeGreaterThan(0);
          const r = remove(p, s, rng.pick(free), false);
          expect(removed(r)).toBe(true);
          if (removed(r)) s = r.state;
        }
        expect(done(p, s, plan.goal)).toBe(true);
      }
    }
  });
});

describe('Bolt Boards frozen list', () => {
  it('has ten boards a level (level 6 has its authored first board too)', () => {
    for (const plan of PLANS) expect(PUZZLES[plan.id].length).toBeGreaterThanOrEqual(plan.id === 6 ? 11 : 10);
  });

  it('is well formed: distinct layers, bolts inside their boards and apart, holes apart, at most six boards', () => {
    for (const { p } of all()) {
      expect(new Set(p.boards.map((d) => d.z)).size).toBe(p.boards.length);
      expect(p.boards.length).toBeLessThanOrEqual(6);
      for (const b of p.bolts) {
        const d = p.boards[b.board];
        expect(Math.abs(b.x - d.x)).toBeLessThanOrEqual(d.w / 2 - HEAD);
        expect(Math.abs(b.y - d.y)).toBeLessThanOrEqual(d.h / 2 - HEAD);
      }
      const pts: Pt[] = [...p.bolts, ...p.holes];
      for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
        expect(Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y)).toBeGreaterThanOrEqual(120);
      }
    }
  });

  it('is solvable, with the shortest solution inside the par range at levels 6–7', () => {
    for (const { plan, p } of all()) {
      const path = solve(p, startState(p), plan);
      expect(Array.isArray(path)).toBe(true);
      if (plan.par) {
        expect(path!.length).toBeGreaterThanOrEqual(plan.par[0]);
        expect(path!.length).toBeLessThanOrEqual(plan.par[1]);
      }
    }
  });

  it('keeps levels 1–2 side by side: no bolt is ever covered', () => {
    for (const { plan, p } of all().filter((x) => x.plan.id <= 2)) {
      for (const s of reachable(p, plan.holes)) p.bolts.forEach((_, b) => { if (s[b] === b) expect(covered(p, s, b)).toBe(false); });
    }
  });

  it('starts level 3 with a board lying over another board’s bolt', () => {
    for (const { p } of all().filter((x) => x.plan.id === 3)) {
      expect(p.bolts.some((_, b) => covered(p, startState(p), b))).toBe(true);
    }
  });

  it('gives every level-4 board a swing that covers a bolt that was free', () => {
    for (const { p } of all().filter((x) => x.plan.id === 4)) {
      const found = reachable(p, false).some((s) => moves(p, s, false).some((m) => {
        const n = apply(s, m);
        return p.bolts.some((_, b) => s[b] === b && n[b] === b && !covered(p, s, b) && covered(p, n, b));
      }));
      expect(found).toBe(true);
    }
  });

  it('leaves a board that need not go at friend levels, with two or three boards over the friend', () => {
    for (const { plan, p } of all().filter((x) => x.plan.goal === 'friend')) {
      expect(mustGo(p, startState(p), plan.goal).size).toBeLessThan(p.boards.length);
      const qs = poses(p, startState(p));
      const over = p.boards.filter((_, j) => polyOverlaps(p, j, qs[j], p.friend!, FRIEND)).length;
      expect(over).toBeGreaterThanOrEqual(2);
      expect(over).toBeLessThanOrEqual(3);
    }
  });

  it('can get stuck at levels 6–7, so holes really matter', () => {
    for (const { plan, p } of all().filter((x) => x.plan.holes)) {
      expect(reachable(p, true).some((s) => stuck(p, s, plan))).toBe(true);
    }
  });

  it('opens one or two holes at the start of level 6 and one at level 7', () => {
    for (const { plan, p } of all().filter((x) => x.plan.holes)) {
      const n = openHoles(p, startState(p)).length;
      if (plan.id === 6) { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(2); } else expect(n).toBe(1);
    }
  });

  it('authors level 6’s first board so one order of the top board’s bolts works and the other gets stuck', () => {
    const p = PUZZLES[6][0], plan = planFor(6), s = startState(p);
    expect(p.boards.length).toBe(2);
    expect(openHoles(p, s).length).toBe(1);
    const first = moves(p, s, true);
    expect(first.length).toBe(2);
    const top = p.boards[0].z > p.boards[1].z ? 0 : 1;
    expect(first.every((m) => p.bolts[m.bolt].board === top)).toBe(true);
    const outcomes = first.map((m) => solve(p, apply(s, m), plan));
    expect(outcomes.filter((o) => Array.isArray(o)).length).toBe(1);
    expect(outcomes.filter((o) => o === null).length).toBe(1);
  });

  it('starts level 1 with three boards hanging straight from one bolt each', () => {
    const p = PUZZLES[1][0], qs = poses(p, startState(p));
    expect(p.boards.length).toBe(3);
    for (const q of qs) expect(q.kind === 'hanging' && Math.abs(q.rot) < 1e-9).toBe(true);
  });
});

describe('Bolt Boards mirror', () => {
  it('keeps every pose, cover, mustGo set and solution length', () => {
    for (const { plan, p } of all()) {
      const m = mirror(p), s = startState(p);
      const a = poses(p, s), b = poses(m, s);
      a.forEach((q, i) => {
        const r = b[i];
        expect(r.kind).toBe(q.kind);
        if (q.kind !== 'down' && r.kind !== 'down') {
          expect(r.x).toBeCloseTo(WALL_W - q.x, 6);
          expect(r.y).toBeCloseTo(q.y, 6);
          expect(r.rot).toBeCloseTo(-q.rot, 6);
        }
      });
      p.bolts.forEach((_, k) => expect(covered(m, s, k)).toBe(covered(p, s, k)));
      expect([...mustGo(m, s, plan.goal)].sort()).toEqual([...mustGo(p, s, plan.goal)].sort());
      expect(solve(m, s, plan)?.length).toBe(solve(p, s, plan)?.length);
    }
  });
});

describe('Bolt Boards hints', () => {
  it('points at a free bolt on a board that has to go, at levels 1–5', () => {
    for (const { plan, p } of all().filter((x) => !x.plan.holes)) {
      for (const s of reachable(p, false, 300)) {
        const h = hintMove(p, s, plan);
        if (done(p, s, plan.goal)) { expect(h).toBeNull(); continue; }
        expect(h && 'move' in h).toBe(true);
        if (!h || !('move' in h)) continue;
        expect(freeBolts(p, s)).toContain(h.move.bolt);
        expect(mustGo(p, s, plan.goal).has(p.bolts[h.move.bolt].board)).toBe(true);
      }
    }
  });

  it('shortens the solution by exactly one at levels 6–7, or is undo at a proved dead end, fast', () => {
    let worst = 0;
    for (const { plan, p } of all().filter((x) => x.plan.holes)) {
      for (const s of reachable(p, true, 120)) {
        if (done(p, s, plan.goal)) continue;
        const t0 = performance.now();
        const h = hintMove(p, s, plan);
        worst = Math.max(worst, performance.now() - t0);
        const len = solve(p, s, plan);
        expect(len).not.toBeUndefined();
        if (len === null) { expect(h).toEqual({ undo: true }); continue; }
        expect(h && 'move' in h).toBe(true);
        if (!h || !('move' in h)) continue;
        const r = remove(p, s, h.move.bolt, true, h.move.hole);
        expect(removed(r)).toBe(true);
        if (removed(r)) expect(solve(p, r.state, plan)!.length).toBe(len!.length - 1);
      }
    }
    expect(worst).toBeLessThan(100);
    expect(SEARCH_CAP).toBe(50_000);
  });
});

describe('Bolt Boards layout', () => {
  it('keeps every reachable pose inside the wall and out of the pet’s corner, at every view', () => {
    for (const [name, v] of Object.entries(VIEWS)) {
      const L = boardLayout(v);
      expect(L.y, name).toBeGreaterThanOrEqual(120 - 1e-6);
      expect(L.y + WALL_H * L.scale, name).toBeLessThanOrEqual(v.h - 150 + 1e-6);
      expect(L.x, name).toBeGreaterThanOrEqual(0);
      expect(L.x + WALL_W * L.scale, name).toBeLessThanOrEqual(v.w);
      // Bolt and hole circles are at least 50 on screen, and bolts 120 apart never share a touch.
      expect(HIT * L.scale, name).toBeGreaterThanOrEqual(50);
      for (const { p } of all()) {
        p.boards.forEach((_, i) => {
          for (const q of everyPose(p, i)) {
            for (const c of corners(p, i, q)) {
              expect(c.x).toBeGreaterThanOrEqual(0);
              expect(c.x).toBeLessThanOrEqual(WALL_W);
              expect(c.y).toBeGreaterThanOrEqual(0);
              expect(c.y).toBeLessThanOrEqual(WALL_H);
              const at = toView(L, c);
              expect(at.x < PET_W && at.y > v.h - PET_H, `${name} pet corner`).toBe(false);
            }
          }
        });
      }
    }
  });

  it('resolves a touch to the nearest free bolt before a covered one', () => {
    for (const { p } of all()) {
      const s = startState(p);
      p.bolts.forEach((b, k) => {
        const hit = boltAt(p, s, b);
        expect(hit?.bolt).toBe(k);
        expect(hit?.free).toBe(!covered(p, s, k));
      });
    }
  });
});
