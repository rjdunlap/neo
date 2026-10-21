import type { View } from '../../engine/view';

/*
 * Bolt Boards' rules. Boards hang on a 700 × 560 wall, held by bolts at fixed wall points. A board with two or more of
 * its bolts in is pinned in its authored pose, with one it hangs straight down from that bolt, with none it is down.
 * Every pose is computed exactly; there is no physics. Levels 1–5 drop removed bolts in a toolbox with no limit;
 * levels 6–7 need an open hole on the wall for every bolt taken out.
 */

export const WALL_W = 700;
export const WALL_H = 560;
/** A bolt head's circle: a board on a higher layer that overlaps it covers the bolt. */
export const HEAD = 30;
/** A hole is closed while any board lies over this circle. */
export const HOLE = 30;
/** A touch within this many wall units of a bolt or hole lands on it: 120 across. */
export const HIT = 60;
/** At friend levels the round is finished when no board overlaps this circle round the friend. */
export const FRIEND = 70;
/** Bolts sit at least this far from their board's centre, so a hanging pose is always defined. */
export const MIN_ARM = 40;
/** The solver gives up after this many states (the frozen boards stay far below it). */
export const SEARCH_CAP = 50_000;

export interface Pt { x: number; y: number }
/** A board in its authored (pinned, level) pose: its centre, size and layer. Every board's `z` differs. */
export interface BoardDef { x: number; y: number; w: number; h: number; z: number }
export interface BoltDef { x: number; y: number; board: number }
/**
 * A frozen board set. Bolt `b` starts in hole `b`; `holes` lists the extra holes, which start empty (levels 6–7).
 * `friend` is set at friend levels (5 and 7).
 */
export interface Puzzle { boards: BoardDef[]; bolts: BoltDef[]; holes: Pt[]; friend?: Pt }

/** Where each bolt is: the hole it sits in, or −1 for the toolbox. Bolt `b` holds its board only in hole `b`. */
export type State = readonly number[];
export const startState = (p: Puzzle): number[] => p.bolts.map((_, b) => b);
export const holeCount = (p: Puzzle) => p.bolts.length + p.holes.length;
export const holeAt = (p: Puzzle, h: number): Pt => (h < p.bolts.length ? p.bolts[h] : p.holes[h - p.bolts.length]);

export type Goal = 'all' | 'friend';
export interface BoltPlan {
  id: number;
  name: string;
  goal: Goal;
  /** Bolts go into holes on the wall rather than the toolbox. */
  holes: boolean;
  /** Open holes glow while a bolt is lifted, and a closed hole is never counted. */
  litHoles: boolean;
  /** A tap on a covered bolt counts one miss from here up. */
  coveredMiss: boolean;
  scenes: number;
  /** The shortest solution's range, for levels with holes. It is never shown to her. */
  par?: [number, number];
}

export const PLANS: readonly BoltPlan[] = [
  { id: 1, name: 'One bolt each', goal: 'all', holes: false, litHoles: false, coveredMiss: false, scenes: 2 },
  { id: 2, name: 'Two bolts hold a board', goal: 'all', holes: false, litHoles: false, coveredMiss: false, scenes: 2 },
  { id: 3, name: 'Boards on top', goal: 'all', holes: false, litHoles: false, coveredMiss: false, scenes: 2 },
  { id: 4, name: 'Watch it swing', goal: 'all', holes: false, litHoles: false, coveredMiss: true, scenes: 1 },
  { id: 5, name: 'Find the friend', goal: 'friend', holes: false, litHoles: false, coveredMiss: true, scenes: 1 },
  { id: 6, name: 'Every bolt needs a hole', goal: 'all', holes: true, litHoles: true, coveredMiss: true, scenes: 1, par: [4, 8] },
  { id: 7, name: 'Holes and a friend', goal: 'friend', holes: true, litHoles: false, coveredMiss: true, scenes: 1, par: [2, 8] },
];
export const planFor = (level: number): BoltPlan => PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];

/* ---------------------------------------------------------------------------------------------- */
/* Poses                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

/** Where a board is up: its centre and rotation. */
export type Placed = { x: number; y: number; rot: number };
export type Pose =
  | { kind: 'pinned'; x: number; y: number; rot: number }
  | { kind: 'hanging'; x: number; y: number; rot: number; bolt: number }
  | { kind: 'down' };

/** The bolts holding board `i`: those still in their own hole. */
export const boltsIn = (p: Puzzle, s: State, i: number) => p.bolts.map((_, b) => b).filter((b) => p.bolts[b].board === i && s[b] === b);

/** The rotation that hangs a board from a bolt at `bolt` with its centre at `c` (authored, level): centre straight below. */
export function hangAngle(c: Pt, bolt: Pt): number {
  const a = Math.PI / 2 - Math.atan2(c.y - bolt.y, c.x - bolt.x);
  // The short way round, in (−π, π], so a swing falls rather than going over the top.
  return a > Math.PI ? a - 2 * Math.PI : a;
}

/** A board's pose from the bolts left in it. */
export function pose(p: Puzzle, s: State, i: number): Pose {
  const d = p.boards[i];
  const holding = boltsIn(p, s, i);
  if (holding.length >= 2) return { kind: 'pinned', x: d.x, y: d.y, rot: 0 };
  if (holding.length === 0) return { kind: 'down' };
  const b = p.bolts[holding[0]];
  const arm = Math.hypot(d.x - b.x, d.y - b.y);
  return { kind: 'hanging', x: b.x, y: b.y + arm, rot: hangAngle(d, b), bolt: holding[0] };
}

/** A point in the board's own (authored, unrotated) frame, centred on its middle, for a pose. */
export function toLocal(q: Placed, pt: Pt): Pt {
  const dx = pt.x - q.x, dy = pt.y - q.y, c = Math.cos(-q.rot), s = Math.sin(-q.rot);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}

/** Whether board `i` in pose `q` overlaps a circle. A down board overlaps nothing. */
export function overlaps(p: Puzzle, i: number, q: Pose, c: Pt, r: number): boolean {
  if (q.kind === 'down') return false;
  const d = p.boards[i], l = toLocal(q, c);
  const nx = Math.max(-d.w / 2, Math.min(d.w / 2, l.x)), ny = Math.max(-d.h / 2, Math.min(d.h / 2, l.y));
  return Math.hypot(l.x - nx, l.y - ny) < r;
}

/** The four corners of a board in a pose, in wall units. */
export function corners(p: Puzzle, i: number, q: Pose): Pt[] {
  if (q.kind === 'down') return [];
  const d = p.boards[i], c = Math.cos(q.rot), s = Math.sin(q.rot);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
    const x = (u * d.w) / 2, y = (v * d.h) / 2;
    return { x: q.x + x * c - y * s, y: q.y + x * s + y * c };
  });
}

export const poses = (p: Puzzle, s: State): Pose[] => p.boards.map((_, i) => pose(p, s, i));

/** The boards above layer `z` that lie over a circle, topmost first. */
export function coveringBoards(p: Puzzle, s: State, z: number, c: Pt, r: number, qs = poses(p, s)): number[] {
  return p.boards.map((_, j) => j)
    .filter((j) => p.boards[j].z > z && overlaps(p, j, qs[j], c, r))
    .sort((a, b) => p.boards[b].z - p.boards[a].z);
}

/** A bolt still holding its board is covered while a board on a higher layer lies over its head. */
export function covered(p: Puzzle, s: State, b: number, qs = poses(p, s)): boolean {
  const bolt = p.bolts[b];
  return coveringBoards(p, s, p.boards[bolt.board].z, bolt, HEAD, qs).length > 0;
}

/** Only bolts still holding their board can turn, and only when nothing covers them. Parked bolts pin nothing and stay. */
export const isFree = (p: Puzzle, s: State, b: number, qs = poses(p, s)) => s[b] === b && !covered(p, s, b, qs);
export const freeBolts = (p: Puzzle, s: State) => {
  const qs = poses(p, s);
  return p.bolts.map((_, b) => b).filter((b) => isFree(p, s, b, qs));
};

/** An empty hole that no board lies over. */
export function openHoles(p: Puzzle, s: State): number[] {
  const qs = poses(p, s), out: number[] = [];
  for (let h = 0; h < holeCount(p); h++) {
    if (s.includes(h)) continue;
    const at = holeAt(p, h);
    if (p.boards.some((_, j) => overlaps(p, j, qs[j], at, HOLE))) continue;
    out.push(h);
  }
  return out;
}

export type Refusal = 'gone' | 'covered' | 'no-hole' | 'hole-closed';
export type Removal = { state: number[] } | { refused: Refusal };
export const removed = (r: Removal): r is { state: number[] } => 'state' in r;

/** Take bolt `b` out: into the toolbox (no `hole`) at levels 1–5, into an open hole at levels 6–7. */
export function remove(p: Puzzle, s: State, b: number, holes: boolean, hole?: number): Removal {
  if (s[b] !== b) return { refused: 'gone' };
  if (covered(p, s, b)) return { refused: 'covered' };
  if (holes) {
    if (hole === undefined) return { refused: 'no-hole' };
    if (!openHoles(p, s).includes(hole)) return { refused: 'hole-closed' };
  }
  const next = [...s];
  next[b] = holes ? hole! : -1;
  return { state: next };
}

/** All boards down, or (friend levels) no board over the friend. */
export function done(p: Puzzle, s: State, goal: Goal): boolean {
  const qs = poses(p, s);
  if (goal === 'all') return qs.every((q) => q.kind === 'down');
  return !p.boards.some((_, j) => overlaps(p, j, qs[j], p.friend!, FRIEND));
}

/** The boards that have to go: those over the friend (or every board up), plus whatever covers their bolts, transitively. */
export function mustGo(p: Puzzle, s: State, goal: Goal): Set<number> {
  const qs = poses(p, s);
  const up = p.boards.map((_, j) => j).filter((j) => qs[j].kind !== 'down');
  const out = new Set(goal === 'all' ? up : up.filter((j) => overlaps(p, j, qs[j], p.friend!, FRIEND)));
  const todo = [...out];
  while (todo.length) {
    const i = todo.pop()!;
    for (const b of boltsIn(p, s, i)) {
      for (const j of coveringBoards(p, s, p.boards[i].z, p.bolts[b], HEAD, qs)) {
        if (!out.has(j)) { out.add(j); todo.push(j); }
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------- */
/* Solving and hints                                                                              */
/* ---------------------------------------------------------------------------------------------- */

export interface Move { bolt: number; hole?: number }

/** Every legal move from a state. */
export function moves(p: Puzzle, s: State, holes: boolean): Move[] {
  const free = freeBolts(p, s);
  if (!holes) return free.map((bolt) => ({ bolt }));
  const open = openHoles(p, s);
  return free.flatMap((bolt) => open.map((hole) => ({ bolt, hole })));
}

export const apply = (s: State, m: Move): number[] => {
  const next = [...s];
  next[m.bolt] = m.hole ?? -1;
  return next;
};

/** Stuck: some board still has to go, and no move is left. Only possible with holes. */
export const stuck = (p: Puzzle, s: State, plan: BoltPlan) => !done(p, s, plan.goal) && moves(p, s, plan.holes).length === 0;

/**
 * A shortest solution by breadth-first search over bolt positions: the moves, `[]` when already done, `null` when
 * proved impossible, `undefined` when the cap ran out first.
 */
export function solve(p: Puzzle, s: State, plan: BoltPlan, cap = SEARCH_CAP): Move[] | null | undefined {
  if (done(p, s, plan.goal)) return [];
  const key = (x: State) => x.join(',');
  const prev = new Map<string, { from: string; move: Move } | null>([[key(s), null]]);
  const states = new Map<string, State>([[key(s), s]]);
  let frontier: string[] = [key(s)];
  let seen = 1;
  while (frontier.length) {
    const next: string[] = [];
    for (const k of frontier) {
      const cur = states.get(k)!;
      for (const m of moves(p, cur, plan.holes)) {
        const n = apply(cur, m), nk = key(n);
        if (prev.has(nk)) continue;
        prev.set(nk, { from: k, move: m });
        states.set(nk, n);
        if (done(p, n, plan.goal)) {
          const path: Move[] = [];
          for (let at: string | undefined = nk; at !== undefined;) {
            const e = prev.get(at);
            if (!e) break;
            path.unshift(e.move);
            at = e.from;
          }
          return path;
        }
        if (++seen > cap) return undefined;
        next.push(nk);
      }
    }
    frontier = next;
  }
  return null;
}

export type Hint = { move: Move } | { undo: true };

/**
 * What to glow. Levels 1–5: a free bolt on the highest board that has to go, which nothing can cover. Levels 6–7:
 * the first move of a shortest solution, or the undo arrow at a proved dead end (or when the search ran out).
 */
export function hintMove(p: Puzzle, s: State, plan: BoltPlan): Hint | null {
  if (done(p, s, plan.goal)) return null;
  if (!plan.holes) {
    const need = [...mustGo(p, s, plan.goal)].sort((a, b) => p.boards[b].z - p.boards[a].z);
    const free = freeBolts(p, s);
    for (const i of need) {
      const b = free.find((x) => p.bolts[x].board === i);
      if (b !== undefined) return { move: { bolt: b } };
    }
    return null;
  }
  const path = solve(p, s, plan);
  return path && path.length ? { move: path[0] } : { undo: true };
}

/* ---------------------------------------------------------------------------------------------- */
/* Mirroring                                                                                      */
/* ---------------------------------------------------------------------------------------------- */

/** A horizontal flip of the wall. It keeps every pose, cover, `mustGo` set and solution length. */
export function mirror(p: Puzzle): Puzzle {
  const f = <T extends Pt>(q: T): T => ({ ...q, x: WALL_W - q.x });
  return { boards: p.boards.map(f), bolts: p.bolts.map(f), holes: p.holes.map(f), friend: p.friend && f(p.friend) };
}

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export const HEADER = 120;
/** The basket strip along the bottom, where the basket and the undo arrow sit (and the pet, to the left). */
export const STRIP = 150;

export interface BoltLayout {
  /** The wall's top-left corner in view units, and view units per wall unit. */
  x: number;
  y: number;
  scale: number;
  /** In the strip: the basket, the undo arrow and the toolbox, centres in view units. */
  basket: Pt;
  undo: Pt;
  toolbox: Pt;
}

/** The pet's corner at the bottom left (as `petCorner` in lands.ts): the wall keeps right of it where they would meet. */
export const PET_W = 200, PET_H = 205;

/** The wall under the header and above the basket strip, scaled to fit (never larger than 1.1) and clear of the pet. */
export function boardLayout(v: View): BoltLayout {
  const top = HEADER, room = v.h - HEADER - STRIP;
  let scale = Math.min(1.1, (v.w - 80) / WALL_W, room / WALL_H);
  let x = (v.w - WALL_W * scale) / 2;
  let y = top + (room - WALL_H * scale) / 2;
  if (y + WALL_H * scale > v.h - PET_H && x < PET_W + 10) {
    scale = Math.min(scale, (v.w - PET_W - 10 - 40) / WALL_W);
    x = Math.max(PET_W + 10, (v.w - WALL_W * scale) / 2);
    y = top + (room - WALL_H * scale) / 2;
  }
  const sy = v.h - STRIP / 2;
  return { x, y, scale, basket: { x: v.w - 130, y: sy }, undo: { x: v.w - 290, y: sy }, toolbox: { x: v.w - 440, y: sy } };
}

export const toView = (L: BoltLayout, q: Pt): Pt => ({ x: L.x + q.x * L.scale, y: L.y + q.y * L.scale });
export const toWall = (L: BoltLayout, q: Pt): Pt => ({ x: (q.x - L.x) / L.scale, y: (q.y - L.y) / L.scale });

/** The bolt a touch lands on: the nearest free one in reach, else the nearest covered one, so a near miss is never counted. */
export function boltAt(p: Puzzle, s: State, at: Pt): { bolt: number; free: boolean } | null {
  const qs = poses(p, s);
  const near = (b: number) => Math.hypot(p.bolts[b].x - at.x, p.bolts[b].y - at.y);
  const inReach = p.bolts.map((_, b) => b).filter((b) => s[b] === b && near(b) <= HIT).sort((a, b) => near(a) - near(b));
  const free = inReach.find((b) => !covered(p, s, b, qs));
  if (free !== undefined) return { bolt: free, free: true };
  return inReach.length ? { bolt: inReach[0], free: false } : null;
}

/** The empty hole a touch lands on, open or not. */
export function holeAtPoint(p: Puzzle, s: State, at: Pt): number | null {
  let best: number | null = null, dist = HIT;
  for (let h = 0; h < holeCount(p); h++) {
    if (s.includes(h)) continue;
    const q = holeAt(p, h), d = Math.hypot(q.x - at.x, q.y - at.y);
    if (d <= dist) { best = h; dist = d; }
  }
  return best;
}
