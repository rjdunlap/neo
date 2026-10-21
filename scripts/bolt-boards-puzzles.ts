/*
 * Generates Bolt Boards' frozen board list, src/games/bolt-boards/puzzles.ts, by seeded rejection sampling against the
 * rules in logic.ts. Run with `node scripts/bolt-boards-puzzles.ts` (Node 23+ strips the types). The output is
 * committed; logic.test.ts checks every board in it, so regenerating only changes which boards are frozen.
 */
import { writeFileSync } from 'node:fs';
import {
  boltsIn, corners, covered, HEAD, MIN_ARM, moves, apply, openHoles, overlaps, planFor, pose, poses, solve, stuck,
  WALL_H, WALL_W, FRIEND, mustGo, type Puzzle, type State, type BoardDef, type BoltDef, type Pt,
} from '../src/games/bolt-boards/logic.ts';

let seed = 20261020;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const step = (a: number, b: number, s = 10) => int(a / s, b / s) * s;
const EDGE = 34;

/** Every pose each board can take: pinned (with two or more bolts) and hanging from each bolt. */
function allPoses(p: Puzzle, i: number) {
  const mine = p.bolts.map((_, b) => b).filter((b) => p.bolts[b].board === i);
  const out = mine.map((b) => pose(p, p.bolts.map((_, x) => (x === b ? b : -1)), i));
  if (mine.length >= 2) out.push(pose(p, p.bolts.map((_, x) => x), i));
  return out;
}

function wellFormed(p: Puzzle): boolean {
  const pts: Pt[] = [...p.bolts, ...p.holes];
  for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) if (Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y) < 120) return false;
  for (const h of p.holes) if (h.x < 50 || h.x > WALL_W - 50 || h.y < 50 || h.y > WALL_H - 50) return false;
  for (const [i] of p.boards.entries()) {
    const d = p.boards[i];
    for (const b of p.bolts.filter((x) => x.board === i)) {
      if (Math.abs(b.x - d.x) > d.w / 2 - EDGE || Math.abs(b.y - d.y) > d.h / 2 - EDGE) return false;
      if (Math.hypot(b.x - d.x, b.y - d.y) < MIN_ARM + 10) return false;
    }
    for (const q of allPoses(p, i)) for (const c of corners(p, i, q)) if (c.x < 6 || c.x > WALL_W - 6 || c.y < 6 || c.y > WALL_H - 6) return false;
  }
  if (p.friend) {
    // The friend peeks out: at least some of its circle shows between boards at the start? Only require it inside the wall.
    if (p.friend.x < 90 || p.friend.x > WALL_W - 90 || p.friend.y < 90 || p.friend.y > WALL_H - 90) return false;
  }
  return true;
}

/** Every state reachable by legal moves (capped). */
function reachable(p: Puzzle, holes: boolean, cap = 20000): State[] {
  const seen = new Map<string, State>();
  const todo: State[] = [p.bolts.map((_, b) => b)];
  while (todo.length && seen.size < cap) {
    const s = todo.pop()!;
    const k = s.join(',');
    if (seen.has(k)) continue;
    seen.set(k, s);
    for (const m of moves(p, s, holes)) todo.push(apply(s, m));
  }
  return [...seen.values()];
}

/** The longest chain of "lies over a bolt of" at the start, as layers. */
function layers(p: Puzzle): number {
  const s = p.bolts.map((_, b) => b), qs = poses(p, s);
  const depth = (i: number, seen: Set<number>): number => {
    let best = 1;
    for (const b of boltsIn(p, s, i)) {
      for (const [j, d] of p.boards.entries()) {
        if (d.z > p.boards[i].z && overlaps(p, j, qs[j], p.bolts[b], HEAD) && !seen.has(j)) best = Math.max(best, 1 + depth(j, new Set([...seen, j])));
      }
    }
    return best;
  };
  return Math.max(...p.boards.map((_, i) => depth(i, new Set([i]))));
}

function boltsOn(d: BoardDef, board: number, n: number): BoltDef[] | null {
  for (let tries = 0; tries < 40; tries++) {
    const out: BoltDef[] = [];
    for (let k = 0; k < n; k++) {
      const x = n === 2 && d.w >= d.h ? d.x + (k ? 1 : -1) * int(MIN_ARM + 10, d.w / 2 - EDGE) : d.x + int(-(d.w / 2 - EDGE), d.w / 2 - EDGE);
      const y = n === 2 && d.h > d.w ? d.y + (k ? 1 : -1) * int(MIN_ARM + 10, d.h / 2 - EDGE) : d.y + int(-(d.h / 2 - EDGE), d.h / 2 - EDGE);
      out.push({ x: Math.round(x), y: Math.round(y), board: board });
    }
    if (out.every((b, i) => Math.hypot(b.x - d.x, b.y - d.y) >= MIN_ARM + 10 && out.slice(0, i).every((c) => Math.hypot(b.x - c.x, b.y - c.y) >= 120))) return out;
  }
  return null;
}

interface Spec { boards: [number, number]; bolts: [number, number]; side?: boolean; holes?: number; friend?: boolean }

function randomPuzzle(spec: Spec): Puzzle | null {
  const n = int(spec.boards[0], spec.boards[1]);
  const boards: BoardDef[] = [];
  const bolts: BoltDef[] = [];
  for (let i = 0; i < n; i++) {
    let placed = false;
    for (let tries = 0; tries < 80 && !placed; tries++) {
      const count = int(spec.bolts[0], spec.bolts[1]);
      let d: BoardDef;
      if (spec.side) {
        const col = WALL_W / n;
        const w = step(count === 2 ? 200 : 140, Math.max(count === 2 ? 200 : 140, Math.min(260, col - 20))), h = step(140, 240);
        d = { x: Math.round(col * (i + 0.5)), y: step(140, 260), w, h, z: i + 1 };
      } else {
        const w = step(count >= 2 ? 200 : 150, 340), h = step(count === 3 ? 180 : 100, count === 3 ? 230 : 180);
        // Most boards are laid over an earlier bolt, so the wall builds up layers.
        const over = bolts.length && rand() < 0.75 ? bolts[int(0, bolts.length - 1)] : null;
        const x = over ? over.x + int(-w / 3, w / 3) : int(w / 2 + 20, WALL_W - w / 2 - 20);
        const y = over ? over.y + int(-h / 3, h / 3) : int(h / 2 + 20, 260);
        d = { x: Math.round(Math.max(w / 2 + 10, Math.min(WALL_W - w / 2 - 10, x)) / 10) * 10, y: Math.round(Math.max(h / 2 + 10, Math.min(280, y)) / 10) * 10, w, h, z: i + 1 };
      }
      const bs = boltsOn(d, i, count);
      if (!bs) continue;
      if (!bs.every((b) => bolts.every((c) => Math.hypot(b.x - c.x, b.y - c.y) >= 120))) continue;
      const trial: Puzzle = { boards: [...boards, d], bolts: [...bolts, ...bs], holes: [] };
      if (!wellFormed(trial)) continue;
      boards.push(d);
      bolts.push(...bs);
      placed = true;
    }
    if (!placed) return null;
  }
  const holes: Pt[] = [];
  for (let k = 0; k < (spec.holes ?? 0); k++) {
    for (let tries = 0; tries < 60; tries++) {
      const h = { x: step(60, WALL_W - 60), y: step(60, WALL_H - 60) };
      if ([...bolts, ...holes].every((c) => Math.hypot(h.x - c.x, h.y - c.y) >= 120)) { holes.push(h); break; }
    }
  }
  const p: Puzzle = { boards, bolts, holes };
  if (spec.friend) p.friend = { x: step(100, WALL_W - 100), y: step(110, 330) };
  return wellFormed(p) ? p : null;
}

type Check = (p: Puzzle) => boolean;
const plan = (id: number) => planFor(id);
const start = (p: Puzzle) => p.bolts.map((_, b) => b);
const coveredAtStart = (p: Puzzle) => p.bolts.some((_, b) => covered(p, start(p), b));
const neverCovered = (p: Puzzle) => reachable(p, false).every((s) => p.bolts.every((_, b) => s[b] !== b || !covered(p, s, b)));
const noOverlapAtStart = (p: Puzzle) => {
  const s = start(p), qs = poses(p, s);
  return p.boards.every((_, i) => p.boards.every((_, j) => i >= j || !corners(p, j, qs[j]).some((c) => overlaps(p, i, qs[i], c, 1)) && !corners(p, i, qs[i]).some((c) => overlaps(p, j, qs[j], c, 1))));
};
/** Some reachable swing covers a bolt that was free just before it. */
const swingCovers = (p: Puzzle) => reachable(p, false).some((s) => moves(p, s, false).some((m) => {
  const n = apply(s, m);
  return p.bolts.some((_, b) => s[b] === b && n[b] === b && !covered(p, s, b) && covered(p, n, b));
}));
const friendOk = (p: Puzzle) => {
  const s = start(p), qs = poses(p, s);
  const over = p.boards.filter((_, j) => overlaps(p, j, qs[j], p.friend!, FRIEND)).length;
  return over >= 2 && over <= 3 && mustGo(p, s, 'friend').size < p.boards.length;
};
const openAtStart = (p: Puzzle) => openHoles(p, start(p)).length;
const holesOk = (id: number) => (p: Puzzle) => {
  const pl = plan(id);
  const path = solve(p, start(p), pl);
  if (!path || path.length < pl.par![0] || path.length > pl.par![1]) return false;
  return reachable(p, true).some((s) => stuck(p, s, pl));
};
/** The authored first board of level 6: two boards, one over the other, one open hole; the order of the top board's bolts decides. */
const firstSixOk = (p: Puzzle) => {
  const s = start(p), pl = plan(6);
  if (p.boards.length !== 2 || openAtStart(p) !== 1) return false;
  const top = p.boards[0].z > p.boards[1].z ? 0 : 1;
  if (!p.bolts.every((b, i) => b.board === top || covered(p, s, i))) return false;
  const first = moves(p, s, true);
  if (first.length !== 2 || !first.every((m) => p.bolts[m.bolt].board === top)) return false;
  const outcomes = first.map((m) => solve(p, apply(s, m), pl));
  return outcomes.some((o) => Array.isArray(o)) && outcomes.some((o) => o === null);
};

const SPECS: Record<number, { spec: Spec; check: Check; count: number }> = {
  1: { spec: { boards: [3, 3], bolts: [1, 1], side: true }, count: 10, check: (p) => noOverlapAtStart(p) && neverCovered(p) && p.bolts.every((b) => Math.abs(b.x - p.boards[b.board].x) >= 30) },
  2: { spec: { boards: [2, 3], bolts: [2, 2], side: true }, count: 10, check: (p) => noOverlapAtStart(p) && neverCovered(p) },
  3: { spec: { boards: [3, 4], bolts: [1, 2] }, count: 10, check: (p) => coveredAtStart(p) && layers(p) === 2 },
  4: { spec: { boards: [4, 5], bolts: [2, 2] }, count: 10, check: (p) => layers(p) === 3 && swingCovers(p) },
  5: { spec: { boards: [5, 6], bolts: [1, 3], friend: true }, count: 10, check: (p) => layers(p) >= 2 && friendOk(p) },
  6: { spec: { boards: [3, 4], bolts: [2, 2], holes: 2 }, count: 10, check: (p) => openAtStart(p) >= 1 && openAtStart(p) <= 2 && layers(p) >= 2 && holesOk(6)(p) },
  7: { spec: { boards: [4, 5], bolts: [1, 3], holes: 2, friend: true }, count: 10, check: (p) => openAtStart(p) === 1 && layers(p) >= 2 && friendOk(p) && holesOk(7)(p) },
};

/** Level 1's authored first scene: three boards hanging straight from one bolt each at the top middle. */
const FIRST_ONE: Puzzle = {
  boards: [
    { x: 130, y: 260, w: 180, h: 200, z: 1 },
    { x: 350, y: 260, w: 180, h: 200, z: 2 },
    { x: 570, y: 260, w: 180, h: 200, z: 3 },
  ],
  bolts: [{ x: 130, y: 200, board: 0 }, { x: 350, y: 200, board: 1 }, { x: 570, y: 200, board: 2 }],
  holes: [],
};

const out: Record<number, Puzzle[]> = {};
for (const id of [1, 2, 3, 4, 5, 6, 7]) {
  const { spec, check, count } = SPECS[id];
  const list: Puzzle[] = id === 1 ? [FIRST_ONE] : [];
  if (id === 6) {
    let tries = 0;
    for (;;) {
      if (++tries > 400000) throw new Error('no first level-6 board');
      const p = randomPuzzle({ boards: [2, 2], bolts: [2, 2], holes: 1 });
      if (p && firstSixOk(p)) { list.push(p); break; }
    }
  }
  let tries = 0;
  while (list.length < count + (id === 6 ? 1 : 0)) {
    if (++tries > 2_000_000) throw new Error(`level ${id}: only ${list.length} boards`);
    const p = randomPuzzle(spec);
    if (p && check(p)) list.push(p);
  }
  out[id] = list;
  console.log(`level ${id}: ${list.length} boards after ${tries} tries`);
}

const lines = [
  '// Generated by scripts/bolt-boards-puzzles.ts; logic.test.ts checks every board. Regenerate rather than hand-edit.',
  "import type { Puzzle } from './logic';",
  '',
  '/** Frozen boards per level. Level 1 and level 6 start with their authored first board. */',
  'export const PUZZLES: Record<number, readonly Puzzle[]> = {',
];
for (const id of Object.keys(out)) {
  lines.push(`  ${id}: [`);
  for (const p of out[Number(id)]) lines.push(`    ${JSON.stringify(p).replace(/"(\w+)":/g, '$1: ')},`);
  lines.push('  ],');
}
lines.push('};', '');
writeFileSync(new URL('../src/games/bolt-boards/puzzles.ts', import.meta.url), lines.join('\n'));
