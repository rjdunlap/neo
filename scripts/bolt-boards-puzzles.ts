/*
 * Generates Bolt Boards' frozen board list, src/games/bolt-boards/puzzles.ts, by seeded rejection sampling against the
 * rules in logic.ts. Run with `node scripts/bolt-boards-puzzles.ts` (Node 23+ strips the types). The output is
 * committed; logic.test.ts checks every board in it, so regenerating only changes which boards are frozen.
 */
import { writeFileSync } from 'node:fs';
import {
  boltsIn, canFinish, corners, covered, emptyState, HEAD, MIN_ARM, moves, apply, openHoles, overlaps, planFor, pose, poses, solve, stuck,
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

/** Level 8: holes to spare, so no reachable state is stuck, and some move swings a board over an open hole. */
const neverStuck = (p: Puzzle) => {
  const all = reachable(p, true, 60000);
  return all.length < 60000 && all.every((s) => !stuck(p, s, plan(8)));
};
const swingClosesHole = (p: Puzzle) => reachable(p, true, 60000).some((s) => moves(p, s, true).some((m) => {
  const was = openHoles(p, s), now = openHoles(p, apply(s, m));
  return was.some((h) => h !== m.hole && !now.includes(h));
}));

const SPECS: Record<number, { spec: Spec; check: Check; count: number }> = {
  1: { spec: { boards: [3, 3], bolts: [1, 1], side: true }, count: 10, check: (p) => noOverlapAtStart(p) && neverCovered(p) && p.bolts.every((b) => Math.abs(b.x - p.boards[b.board].x) >= 30) },
  2: { spec: { boards: [2, 3], bolts: [2, 2], side: true }, count: 10, check: (p) => noOverlapAtStart(p) && neverCovered(p) },
  3: { spec: { boards: [3, 4], bolts: [1, 2] }, count: 10, check: (p) => coveredAtStart(p) && layers(p) === 2 },
  4: { spec: { boards: [4, 5], bolts: [2, 2] }, count: 10, check: (p) => layers(p) === 3 && swingCovers(p) },
  5: { spec: { boards: [5, 6], bolts: [1, 3], friend: true }, count: 10, check: (p) => layers(p) >= 2 && friendOk(p) },
  6: { spec: { boards: [3, 4], bolts: [2, 2], holes: 2 }, count: 10, check: (p) => openAtStart(p) >= 1 && openAtStart(p) <= 2 && layers(p) >= 2 && holesOk(6)(p) },
  7: { spec: { boards: [4, 5], bolts: [1, 3], holes: 2, friend: true }, count: 10, check: (p) => openAtStart(p) === 1 && layers(p) >= 2 && friendOk(p) && holesOk(7)(p) },
  8: { spec: { boards: [3, 4], bolts: [2, 2], holes: 4 }, count: 20, check: (p) => openAtStart(p) >= 3 && layers(p) === 2 && swingClosesHole(p) && neverStuck(p) },
};

/**
 * Level 8's authored first board: two boards side by side, two bolts each, three open holes below them. Whichever of
 * the left board's bolts she takes first, it swings down right over one of the three holes; no first move covers two.
 */
const FIRST_EIGHT: Puzzle = {
  boards: [{ x: 190, y: 180, w: 240, h: 140, z: 1 }, { x: 510, y: 180, w: 240, h: 140, z: 2 }],
  bolts: [{ x: 110, y: 180, board: 0 }, { x: 270, y: 180, board: 0 }, { x: 430, y: 180, board: 1 }, { x: 590, y: 180, board: 1 }],
  holes: [{ x: 110, y: 330 }, { x: 270, y: 330 }, { x: 590, y: 330 }],
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

/*
 * The second batch (2026-11-06): a fresh seed appends as many boards again to every level, so the first batch, with
 * level 1's and level 6's authored first boards, keeps its positions.
 */
seed = 20261106;
for (const id of [1, 2, 3, 4, 5, 6, 7]) {
  const { spec, check, count } = SPECS[id];
  const list = out[id], target = list.length + count;
  const seen = new Set(list.map((p) => JSON.stringify(p)));
  let tries = 0;
  while (list.length < target) {
    if (++tries > 4_000_000) throw new Error(`level ${id}, second batch: only ${list.length} boards`);
    const p = randomPuzzle(spec);
    if (p && !seen.has(JSON.stringify(p)) && check(p)) { list.push(p); seen.add(JSON.stringify(p)); }
  }
  console.log(`level ${id}: ${list.length} boards after ${tries} more tries`);
}

/* Level 8 (2026-11-06): its own seed, after both batches, so levels 1–7 are unchanged. */
seed = 20261107;
{
  const p = FIRST_EIGHT, s = start(p);
  const extra = (st: State) => p.holes.filter((h) => p.boards.some((_, j) => overlaps(p, j, pose(p, st, j), h, 30))).length;
  if (!wellFormed(p) || openAtStart(p) !== 3 || !neverStuck(p) || !moves(p, s, true).every((m) => {
    const n = extra(apply(s, m));
    return p.bolts[m.bolt].board === 0 ? n === 1 : n <= 1;
  })) throw new Error('level 8: authored board fails');
  const { spec, check, count } = SPECS[8];
  const list: Puzzle[] = [p], seen = new Set<string>();
  let tries = 0;
  while (list.length < count + 1) {
    if (++tries > 4_000_000) throw new Error(`level 8: only ${list.length} boards`);
    const q = randomPuzzle(spec);
    if (q && !seen.has(JSON.stringify(q)) && check(q)) { list.push(q); seen.add(JSON.stringify(q)); }
  }
  out[8] = list;
  console.log(`level 8: ${list.length} boards after ${tries} tries`);
}

/*
 * Level 9 (2026-11-07), Put it back: one authored board, two small boards with one big board across them. Its other
 * scenes reuse the level-3 and level-4 lists. No random draws, so levels 1–8 are unchanged. The small boards' bolts
 * sit at y 254 and 345 (the definition had 245 and 340), so the heads stay on the board and 120 apart; the board keeps
 * the definition's 64 reachable states, 28 of them dead ends.
 */
{
  const p: Puzzle = {
    boards: [{ x: 220, y: 300, w: 180, h: 160, z: 1 }, { x: 480, y: 300, w: 180, h: 160, z: 2 }, { x: 350, y: 200, w: 420, h: 160, z: 3 }],
    bolts: [
      { x: 180, y: 254, board: 0 }, { x: 260, y: 345, board: 0 },
      { x: 520, y: 254, board: 1 }, { x: 440, y: 345, board: 1 },
      { x: 280, y: 155, board: 2 }, { x: 420, y: 155, board: 2 },
    ],
    holes: [],
  };
  // The empty wall can be finished, and bolting the big board up first covers both small boards' first holes.
  const big = [-1, -1, -1, -1, 4, 5];
  if (!wellFormed(p) || !canFinish(p, emptyState(p)) || canFinish(p, big) || !covered(p, big, 0) || !covered(p, big, 2)) {
    throw new Error('level 9: authored board fails');
  }
  out[9] = [p];
  console.log('level 9: the authored board');
}

const lines = [
  '// Generated by scripts/bolt-boards-puzzles.ts; logic.test.ts checks every board. Regenerate rather than hand-edit.',
  "import type { Puzzle } from './logic';",
  '',
  '/** Frozen boards per level. Levels 1, 6 and 8 start with their authored first board; level 9 holds only its own. */',
  'export const PUZZLES: Record<number, readonly Puzzle[]> = {',
];
for (const id of Object.keys(out)) {
  lines.push(`  ${id}: [`);
  for (const p of out[Number(id)]) lines.push(`    ${JSON.stringify(p).replace(/"(\w+)":/g, '$1: ')},`);
  lines.push('  ],');
}
lines.push('};', '');
writeFileSync(new URL('../src/games/bolt-boards/puzzles.ts', import.meta.url), lines.join('\n'));
