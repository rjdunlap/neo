import type { Rng } from '../../engine/random';

/**
 * Light Lab: a sunbeam crosses a grid; mirrors turn it a quarter. Tap a mirror to tilt it the
 * other way. Flowers wake up when the light reaches them, and let it pass on. Colored glass
 * tints the beam, and a colored flower only wakes in its own color.
 *
 * Puzzles are built backwards from a random beam path, so every one has a known solution; extra
 * mirrors and rocks are placed off that path, and the mirrors start tilted so it isn't solved yet.
 */
export type LightMode = 'live' | 'plan' | 'predict';

export interface LightPlan {
  mode: LightMode;
  cols: number;
  rows: number;
  /** Mirrors on the solution path. */
  turns: number;
  /** Extra mirrors and rocks off the path. */
  decoys: number;
  rocks: number;
  flowers: 1 | 2;
  /** A tinted glass on the path before the last flower, which wants that color. */
  glass: boolean;
  puzzles: number;
  name: string;
}

export const PLANS: LightPlan[] = [
  { mode: 'live', cols: 6, rows: 4, turns: 1, decoys: 0, rocks: 0, flowers: 1, glass: false, puzzles: 3, name: 'Tap a mirror to turn the sunbeam onto the flower (the light shows as you turn)' },
  { mode: 'live', cols: 6, rows: 4, turns: 2, decoys: 1, rocks: 1, flowers: 1, glass: false, puzzles: 3, name: 'Two mirrors to turn, plus a spare mirror and a rock' },
  { mode: 'plan', cols: 6, rows: 4, turns: 2, decoys: 1, rocks: 1, flowers: 1, glass: false, puzzles: 3, name: 'Plan first: turn the mirrors, then tap the sun to shine' },
  { mode: 'plan', cols: 7, rows: 5, turns: 3, decoys: 2, rocks: 2, flowers: 2, glass: false, puzzles: 2, name: 'Wake two flowers with one beam (three mirrors to plan)' },
  { mode: 'plan', cols: 7, rows: 5, turns: 3, decoys: 2, rocks: 1, flowers: 2, glass: true, puzzles: 2, name: 'Colored glass: wake the yellow flower, then shine through pink glass for the pink one' },
  { mode: 'plan', cols: 7, rows: 5, turns: 4, decoys: 3, rocks: 2, flowers: 2, glass: false, puzzles: 2, name: 'A longer path: four mirrors, spare mirrors and rocks in the way' },
  { mode: 'predict', cols: 7, rows: 5, turns: 4, decoys: 3, rocks: 2, flowers: 2, glass: false, puzzles: 4, name: 'Predict where the locked beam stops, then plan the mirrors and shine' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** 0 right, 1 down, 2 left, 3 up. */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [1, 0, -1, 0];
export const DY = [0, 1, 0, -1];

/** Tilt 0 is "/", tilt 1 is "\". */
export type Tilt = 0 | 1;

/** "/" sends right↔up and left↔down; "\" sends right↔down and left↔up. */
export function reflect(dir: Dir, tilt: Tilt): Dir {
  if (tilt === 0) return ([3, 2, 1, 0] as Dir[])[dir];
  return ([1, 0, 3, 2] as Dir[])[dir];
}

/** The tilt that turns a beam travelling `from` into `to` (a quarter turn). */
export function tiltFor(from: Dir, to: Dir): Tilt {
  return reflect(from, 0) === to ? 0 : 1;
}

export type Tint = 'sun' | 'pink' | 'blue';

export type Thing =
  | { kind: 'mirror'; x: number; y: number }
  | { kind: 'rock'; x: number; y: number }
  | { kind: 'flower'; x: number; y: number; wants: Tint }
  | { kind: 'glass'; x: number; y: number; tint: Tint };

export interface LightPuzzle {
  cols: number;
  rows: number;
  /** The sun sits in column 0 and shines right. */
  sunRow: number;
  things: Thing[];
  /** One tilt per thing (only mirrors use theirs): a known answer. */
  solution: Tilt[];
  /** The tilts the mirrors start with: never already solved. */
  start: Tilt[];
  /** Mirror indices in the order the solution's beam meets them. */
  pathMirrors: number[];
}

export interface Trace {
  /** Cells the beam passes through, starting beside the sun; the last one is where it stops or leaves. */
  cells: { x: number; y: number; tint: Tint }[];
  /** Flower indices woken by light of the color they want. */
  woken: number[];
  /** Flowers the beam reached in the wrong color. */
  wrongColor: number[];
  end: 'edge' | 'rock' | 'loop';
}

export interface BeamEnd {
  key: string;
  kind: 'edge' | 'rock' | 'loop';
  /** The endpoint's board cell, or the last cell beyond the board for an edge. */
  x: number;
  y: number;
  /** Where to place its tap target on the board. */
  targetX: number;
  targetY: number;
  /** Direction the beam leaves the board, for edge endpoints. */
  exit?: Dir;
}

export function trace(p: LightPuzzle, tilts: Tilt[]): Trace {
  const at = new Map(p.things.map((t, i) => [`${t.x},${t.y}`, i]));
  let x = 0;
  let y = p.sunRow;
  let dir: Dir = 0;
  let tint: Tint = 'sun';
  const cells: Trace['cells'] = [];
  const woken = new Set<number>();
  const wrongColor = new Set<number>();
  const seen = new Set<string>();
  for (;;) {
    x += DX[dir];
    y += DY[dir];
    if (x < 0 || y < 0 || x >= p.cols || y >= p.rows) {
      cells.push({ x, y, tint });
      return { cells, woken: [...woken], wrongColor: [...wrongColor], end: 'edge' };
    }
    const key = `${x},${y},${dir}`;
    if (seen.has(key)) return { cells, woken: [...woken], wrongColor: [...wrongColor], end: 'loop' };
    seen.add(key);
    cells.push({ x, y, tint });
    const i = at.get(`${x},${y}`);
    if (i === undefined) continue;
    const t = p.things[i];
    if (t.kind === 'rock') return { cells, woken: [...woken], wrongColor: [...wrongColor], end: 'rock' };
    if (t.kind === 'mirror') dir = reflect(dir, tilts[i]);
    else if (t.kind === 'glass') tint = t.tint;
    else if (t.wants === tint) woken.add(i);
    else wrongColor.add(i);
  }
}

export const flowerCount = (p: LightPuzzle) => p.things.filter((t) => t.kind === 'flower').length;
export const solved = (p: LightPuzzle, tilts: Tilt[]) => trace(p, tilts).woken.length === flowerCount(p);

export function beamEnd(p: LightPuzzle, tilts: Tilt[]): BeamEnd {
  const result = trace(p, tilts);
  const path = result.cells;
  const last = path[path.length - 1];
  const rock = p.things.find((t) => t.kind === 'rock' && t.x === last.x && t.y === last.y);
  if (rock) return { key: `rock:${last.x},${last.y}`, kind: 'rock', x: last.x, y: last.y, targetX: last.x, targetY: last.y };
  if (result.end === 'loop') {
    const targetX = Math.max(0, Math.min(p.cols - 1, last.x));
    const targetY = Math.max(0, Math.min(p.rows - 1, last.y));
    return { key: `loop:${last.x},${last.y}`, kind: 'loop', x: last.x, y: last.y, targetX, targetY };
  }
  const before = path[path.length - 2];
  const exit = ([0, 1, 2, 3] as Dir[]).find((d) => before.x + DX[d] === last.x && before.y + DY[d] === last.y)!;
  const targetX = Math.max(0, Math.min(p.cols - 1, last.x));
  const targetY = Math.max(0, Math.min(p.rows - 1, last.y));
  return { key: `edge:${last.x},${last.y}`, kind: 'edge', x: last.x, y: last.y, targetX, targetY, exit };
}

/** Distinct board positions where any mirror arrangement could stop this beam. */
export function predictionChoices(p: LightPuzzle, actual: Tilt[] = p.start): BeamEnd[] {
  const mirrors = p.things.flatMap((t, i) => (t.kind === 'mirror' ? [i] : []));
  const outcomes = new Map<string, BeamEnd>();
  const answer = beamEnd(p, actual);
  if (answer.kind === 'loop') return [];
  outcomes.set(`${answer.targetX},${answer.targetY}`, answer);
  for (let mask = 0; mask < 2 ** mirrors.length; mask++) {
    const tilts = [...actual];
    mirrors.forEach((index, bit) => { tilts[index] = ((mask >> bit) & 1) as Tilt; });
    const end = beamEnd(p, tilts);
    if (end.kind === 'loop') continue;
    const target = `${end.targetX},${end.targetY}`;
    if (!outcomes.has(target)) outcomes.set(target, end);
  }
  return [...outcomes.values()];
}

/** Builds a puzzle backwards from a random path; retries until every rule holds. */
export function makePuzzle(plan: LightPlan, rng: Rng): LightPuzzle {
  for (let attempt = 0; attempt < 500; attempt++) {
    const p = tryPuzzle(plan, rng);
    if (p) return p;
  }
  throw new Error('no light puzzle');
}

function tryPuzzle(plan: LightPlan, rng: Rng): LightPuzzle | null {
  const { cols, rows } = plan;
  const sunRow = rng.int(0, rows - 1);
  const used = new Set<string>([`0,${sunRow}`]);
  const things: Thing[] = [];
  const solution: Tilt[] = [];
  const pathMirrors: number[] = [];
  /** Cells the beam only passes through: room for a flower or glass on the way. */
  const passing: { x: number; y: number }[] = [];
  let x = 0;
  let y = sunRow;
  let dir: Dir = 0;
  for (let turn = 0; turn <= plan.turns; turn++) {
    // How far it can run before leaving the board or crossing itself.
    let room = 0;
    while (true) {
      const nx = x + DX[dir] * (room + 1);
      const ny = y + DY[dir] * (room + 1);
      if (nx < 1 || ny < 0 || nx >= cols || ny >= rows || used.has(`${nx},${ny}`)) break;
      room++;
    }
    if (room < 1) return null;
    const run = rng.int(1, Math.min(room, 4));
    for (let k = 1; k < run; k++) {
      x += DX[dir];
      y += DY[dir];
      used.add(`${x},${y}`);
      passing.push({ x, y });
    }
    x += DX[dir];
    y += DY[dir];
    used.add(`${x},${y}`);
    if (turn === plan.turns) {
      things.push({ kind: 'flower', x, y, wants: plan.glass ? 'pink' : 'sun' });
      solution.push(0);
      break;
    }
    const next = (rng.chance(0.5) ? (dir + 1) % 4 : (dir + 3) % 4) as Dir;
    pathMirrors.push(things.length);
    things.push({ kind: 'mirror', x, y });
    solution.push(tiltFor(dir, next));
    dir = next;
  }
  // A second flower on the way (before the glass, so it wants sunlight), then the glass.
  if (plan.flowers === 2 || plan.glass) {
    const need = plan.glass ? 2 : 1;
    if (passing.length < need) return null;
    const picks = rng.shuffle(passing.map((_, i) => i)).slice(0, need).sort((a, b) => a - b);
    if (plan.flowers === 2) {
      const f = passing[picks[0]];
      things.push({ kind: 'flower', x: f.x, y: f.y, wants: 'sun' });
      solution.push(0);
    }
    if (plan.glass) {
      const g = passing[picks[need - 1]];
      things.push({ kind: 'glass', x: g.x, y: g.y, tint: 'pink' });
      solution.push(0);
    }
  }
  // Spare mirrors, rocks and (with glass) a blue glass, all off the path.
  const free: { x: number; y: number }[] = [];
  for (let cx = 1; cx < cols; cx++) for (let cy = 0; cy < rows; cy++) if (!used.has(`${cx},${cy}`)) free.push({ x: cx, y: cy });
  const extras = rng.shuffle(free);
  const take = (n: number) => extras.splice(0, n);
  for (const c of take(plan.decoys)) {
    things.push({ kind: 'mirror', ...c });
    solution.push(rng.chance(0.5) ? 0 : 1);
  }
  for (const c of take(plan.rocks)) {
    things.push({ kind: 'rock', ...c });
    solution.push(0);
  }
  if (plan.glass) for (const c of take(1)) {
    things.push({ kind: 'glass', ...c, tint: 'blue' });
    solution.push(0);
  }
  const puzzle: LightPuzzle = { cols, rows, sunRow, things, solution, start: [], pathMirrors };
  if (!solved(puzzle, solution)) return null;
  // Start tilted wrong: shuffle until unsolved, flipping at least one path mirror.
  for (let tries = 0; tries < 20; tries++) {
    const start = solution.map((t, i) => (things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t));
    const first = pathMirrors[rng.int(0, pathMirrors.length - 1)];
    if (start[first] === solution[first]) start[first] = (1 - solution[first]) as Tilt;
    if (!solved(puzzle, start)) {
      const result = { ...puzzle, start };
      if (plan.mode === 'predict' && predictionChoices(result).length < 3) continue;
      return result;
    }
  }
  return null;
}

/** The next mirror on the known path that is tilted the other way: where a hint points. */
export function hintMirror(p: LightPuzzle, tilts: Tilt[]): number {
  return p.pathMirrors.find((i) => tilts[i] !== p.solution[i]) ?? -1;
}

/** Why a shine didn't wake everything: for the spoken explanation. */
export function whyNot(p: LightPuzzle, tilts: Tilt[]): 'color' | 'sleeping' | 'rock' | 'edge' | 'loop' | 'none' {
  const t = trace(p, tilts);
  if (t.woken.length === flowerCount(p)) return 'none';
  if (t.wrongColor.length) return 'color';
  if (t.woken.length) return 'sleeping';
  return t.end;
}
