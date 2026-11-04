import type { Rng } from '../../engine/random';

/**
 * Light Lab: a sunbeam crosses a grid; mirrors turn it a quarter. Tap a mirror to tilt it the
 * other way. Flowers wake up when the light reaches them, and let it pass on. Colored glass
 * tints the beam, and a colored flower only wakes in its own color.
 *
 * Puzzles are built backwards from a random beam path, so every one has a known solution; extra
 * mirrors and rocks are placed off that path, and the mirrors start tilted so it isn't solved yet. From level 3 the
 * whole board may be mirrored, with the sun on the right shining left. From level 8 some path mirrors wait in a tray:
 * she drags them onto the board, and no answer works without every one of them.
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
  /** The fewest mirror turns any answer needs from the start (a floor; spare mirrors count). */
  startWrong: number;
  /** The starting tilts wake no flower, so a two-flower plan is never a one-turn fix. */
  startDark: boolean;
  /** The sun may sit on the right and shine left (a seeded mirror image of the board). */
  eitherSide: boolean;
  /** Path mirrors taken off the board into a tray for her to place (levels 8–9); 0 elsewhere. */
  tray: number;
  name: string;
}

export const PLANS: LightPlan[] = [
  { mode: 'live', cols: 6, rows: 4, turns: 1, decoys: 0, rocks: 0, flowers: 1, glass: false, puzzles: 3, startWrong: 1, startDark: false, eitherSide: false, tray: 0, name: 'Tap a mirror to turn the sunbeam onto the flower (the light shows as you turn)' },
  { mode: 'live', cols: 6, rows: 4, turns: 2, decoys: 1, rocks: 1, flowers: 1, glass: false, puzzles: 3, startWrong: 1, startDark: false, eitherSide: false, tray: 0, name: 'Two mirrors to turn, plus a spare mirror and a rock' },
  { mode: 'plan', cols: 6, rows: 4, turns: 2, decoys: 1, rocks: 1, flowers: 1, glass: false, puzzles: 3, startWrong: 1, startDark: false, eitherSide: true, tray: 0, name: 'Plan first: turn the mirrors, then tap the sun to shine' },
  { mode: 'plan', cols: 7, rows: 5, turns: 3, decoys: 2, rocks: 2, flowers: 2, glass: false, puzzles: 2, startWrong: 2, startDark: true, eitherSide: true, tray: 0, name: 'Wake two flowers with one beam (three mirrors to plan)' },
  { mode: 'plan', cols: 7, rows: 5, turns: 3, decoys: 2, rocks: 1, flowers: 2, glass: true, puzzles: 2, startWrong: 2, startDark: true, eitherSide: true, tray: 0, name: 'Colored glass: wake the yellow flower, then shine through pink glass for the pink one' },
  { mode: 'plan', cols: 7, rows: 5, turns: 4, decoys: 3, rocks: 2, flowers: 2, glass: false, puzzles: 2, startWrong: 3, startDark: false, eitherSide: true, tray: 0, name: 'A longer path: four mirrors, spare mirrors and rocks in the way' },
  { mode: 'predict', cols: 7, rows: 5, turns: 4, decoys: 3, rocks: 2, flowers: 2, glass: false, puzzles: 4, startWrong: 3, startDark: false, eitherSide: true, tray: 0, name: 'Predict where the locked beam stops, then plan the mirrors and shine' },
  // Tray levels keep 4 rows so the tray fits under the board in landscape. Level 9's rock sits on the sun's row.
  { mode: 'plan', cols: 6, rows: 4, turns: 2, decoys: 0, rocks: 0, flowers: 1, glass: false, puzzles: 3, startWrong: 1, startDark: false, eitherSide: true, tray: 1, name: 'Place a mirror: drag one from the tray onto the board, turn the mirrors, then shine' },
  { mode: 'plan', cols: 7, rows: 4, turns: 2, decoys: 0, rocks: 1, flowers: 1, glass: false, puzzles: 2, startWrong: 0, startDark: false, eitherSide: true, tray: 2, name: 'Two to place: two tray mirrors, and a rock in the way of the straight beam' },
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
  /** The sun's cell: column 0 shining right (`sunDir` 0), or the last column shining left (2). */
  sunRow: number;
  sunCol: number;
  sunDir: 0 | 2;
  things: Thing[];
  /** One tilt per thing (only mirrors use theirs): a known answer. */
  solution: Tilt[];
  /** The tilts the mirrors start with: never already solved. */
  start: Tilt[];
  /** Mirror indices in the order the solution's beam meets them (the ones on the board). */
  pathMirrors: number[];
  /** The known answer's cells and tilts for the tray's mirrors, in the order the beam meets them (empty without a tray). */
  tray: Placed[];
}

/** A mirror she put on the board from the tray. */
export interface Placed {
  x: number;
  y: number;
  tilt: Tilt;
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
  let x = p.sunCol;
  let y = p.sunRow;
  let dir: Dir = p.sunDir;
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
  // With a tray, a rock goes on the sun's row past the first turn, so the straight beam can't be the short way round.
  const rockCells = plan.tray ? extras.filter((c) => c.y === sunRow) : extras;
  for (const c of rockCells.slice(0, plan.rocks)) {
    extras.splice(extras.indexOf(c), 1);
    things.push({ kind: 'rock', ...c });
    solution.push(0);
  }
  if (plan.tray && rockCells.length < plan.rocks) return null;
  if (plan.glass) for (const c of take(1)) {
    things.push({ kind: 'glass', ...c, tint: 'blue' });
    solution.push(0);
  }
  const puzzle: LightPuzzle = { cols, rows, sunRow, sunCol: 0, sunDir: 0, things, solution, start: [], pathMirrors, tray: [] };
  if (!solved(puzzle, solution)) return null;
  if (plan.tray) return trayPuzzle(plan, puzzle, rng);
  // Start tilted wrong: at least `startWrong` path mirrors flipped, the spares at random, and kept only when
  // no answer (spares included) is fewer turns away and, where asked, no flower is awake yet.
  for (let tries = 0; tries < 20; tries++) {
    const flip = new Set(rng.shuffle([...pathMirrors]).slice(0, plan.startWrong));
    const start = solution.map((t, i) => (things[i].kind === 'mirror' && (flip.has(i) || rng.chance(0.5)) ? ((1 - t) as Tilt) : t));
    const result = { ...puzzle, start };
    if (solved(result, start) || minTurns(result, start) < plan.startWrong) continue;
    if (plan.startDark && trace(result, start).woken.length) continue;
    if (plan.mode === 'predict' && predictionChoices(result).length < 3) continue;
    return plan.eitherSide && rng.chance(0.5) ? mirrorPuzzle(result) : result;
  }
  return null;
}

/** The board seen in a mirror: the sun moves to the last column and shines left, and every tilt swaps ("/" seen in a mirror is "\"). */
export function mirrorPuzzle(p: LightPuzzle): LightPuzzle {
  const flip = (t: Tilt) => (1 - t) as Tilt;
  return {
    ...p,
    sunCol: p.cols - 1 - p.sunCol,
    sunDir: p.sunDir === 0 ? 2 : 0,
    things: p.things.map((t) => ({ ...t, x: p.cols - 1 - t.x })),
    solution: p.solution.map(flip),
    start: p.start.map(flip),
    tray: p.tray.map((m) => ({ x: p.cols - 1 - m.x, y: m.y, tilt: flip(m.tilt) })),
  };
}

/**
 * Takes `plan.tray` path mirrors off a solved board into the tray, and starts the board mirrors left on the path tilted
 * wrong. Kept only when every answer needs every tray mirror (`fewestPlaced`).
 */
function trayPuzzle(plan: LightPlan, full: LightPuzzle, rng: Rng): LightPuzzle | null {
  const pulled = new Set(rng.shuffle([...full.pathMirrors]).slice(0, plan.tray));
  const keep = full.things.map((_, i) => !pulled.has(i));
  const reindex = new Map<number, number>();
  full.things.forEach((_, i) => keep[i] && reindex.set(i, reindex.size));
  const solution = full.solution.filter((_, i) => keep[i]);
  const things = full.things.filter((_, i) => keep[i]);
  const p: LightPuzzle = {
    ...full,
    things,
    solution,
    start: solution.map((t, i) => (things[i].kind === 'mirror' ? ((1 - t) as Tilt) : t)),
    pathMirrors: full.pathMirrors.filter((i) => keep[i]).map((i) => reindex.get(i)!),
    tray: full.pathMirrors.filter((i) => pulled.has(i)).map((i) => ({ x: full.things[i].x, y: full.things[i].y, tilt: full.solution[i] })),
  };
  const [bp, bt] = boardWith(p, p.solution, p.tray);
  if (!solved(bp, bt) || fewestPlaced(p) !== plan.tray) return null;
  return plan.eitherSide && rng.chance(0.5) ? mirrorPuzzle(p) : p;
}

/** The board with her placed mirrors added as ordinary mirrors after the fixed things, and the tilts to match. */
export function boardWith(p: LightPuzzle, tilts: Tilt[], placed: Placed[]): [LightPuzzle, Tilt[]] {
  return [
    { ...p, things: [...p.things, ...placed.map((m) => ({ kind: 'mirror' as const, x: m.x, y: m.y }))] },
    [...tilts.slice(0, p.things.length), ...placed.map((m) => m.tilt)],
  ];
}

/** Cells a tray mirror may go: on the board, not the sun's, and not under anything. */
export function freeCells(p: LightPuzzle, placed: Placed[] = []): { x: number; y: number }[] {
  const taken = new Set([`${p.sunCol},${p.sunRow}`, ...p.things.map((t) => `${t.x},${t.y}`), ...placed.map((m) => `${m.x},${m.y}`)]);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < p.rows; y++) for (let x = 0; x < p.cols; x++) if (!taken.has(`${x},${y}`)) cells.push({ x, y });
  return cells;
}

/** Every way to put `n` mirrors on free cells with any tilts. */
function* placements(p: LightPuzzle, n: number, from = 0, cells = freeCells(p)): Generator<Placed[]> {
  if (n === 0) return yield [];
  for (let c = from; c < cells.length; c++) {
    for (const rest of placements(p, n - 1, c + 1, cells)) {
      for (const tilt of [0, 1] as Tilt[]) yield [{ ...cells[c], tilt }, ...rest];
    }
  }
}

/** Every tilt arrangement of the board's own mirrors. */
function* boardTilts(p: LightPuzzle): Generator<Tilt[]> {
  const mirrors = p.things.flatMap((t, i) => (t.kind === 'mirror' ? [i] : []));
  for (let mask = 0; mask < 2 ** mirrors.length; mask++) {
    const tilts = [...p.solution];
    mirrors.forEach((index, bit) => { tilts[index] = ((mask >> bit) & 1) as Tilt; });
    yield tilts;
  }
}

/** The fewest tray mirrors any answer needs (a placed mirror the beam never meets changes nothing, so fewer placed is the same as unused). */
export function fewestPlaced(p: LightPuzzle): number {
  for (let n = 0; n <= p.tray.length; n++) {
    for (const placed of placements(p, n)) for (const tilts of boardTilts(p)) if (solved(...boardWith(p, tilts, placed))) return n;
  }
  return Infinity;
}

/** A placed mirror lands as "/" (tilt 0) until she turns it. */
export const DROP_TILT: Tilt = 0;

/**
 * The answer nearest to what is on the board now: every tray mirror placed, counting a mirror to carry for each answer cell
 * that is still empty (plus a turn if it lands the wrong way) and a turn for each mirror tilted the other way. The known answer
 * wins ties.
 */
export function nearestPlacement(p: LightPuzzle, tilts: Tilt[], placed: Placed[]): { tilts: Tilt[]; placed: Placed[]; cost: number } | null {
  const here = new Map(placed.map((m) => [`${m.x},${m.y}`, m.tilt]));
  // Cells under her own placed mirrors are free for an answer too: those mirrors can move.
  const cells = freeCells(p);
  const known = (s: Placed[]) => s.every((m) => p.tray.some((k) => k.x === m.x && k.y === m.y && k.tilt === m.tilt));
  let best: { tilts: Tilt[]; placed: Placed[]; cost: number } | null = null;
  for (const want of placements(p, p.tray.length, 0, cells)) {
    let carry = 0;
    for (const m of want) {
      const at = here.get(`${m.x},${m.y}`);
      carry += at === undefined ? 1 + (m.tilt !== DROP_TILT ? 1 : 0) : at !== m.tilt ? 1 : 0;
    }
    if (best && carry > best.cost) continue;
    for (const board of boardTilts(p)) {
      const cost = carry + p.things.reduce((n, t, i) => n + (t.kind === 'mirror' && board[i] !== tilts[i] ? 1 : 0), 0);
      if (best && (cost > best.cost || (cost === best.cost && !(known(want) && !known(best.placed))))) continue;
      if (!solved(...boardWith(p, board, want))) continue;
      best = { tilts: board, placed: want, cost };
    }
  }
  return best;
}

export type PlaceHint = { cell: { x: number; y: number } } | { mirror: number } | { placed: number } | null;

/**
 * Where a hint points on a tray level: the first cell along the nearest answer's beam that still needs a mirror carried to
 * it; once every answer cell holds one, the first board mirror (`mirror`, a thing index) or placed mirror (`placed`, an index
 * into `placed`) tilted the other way.
 */
export function placeHint(p: LightPuzzle, tilts: Tilt[], placed: Placed[]): PlaceHint {
  const near = nearestPlacement(p, tilts, placed);
  if (!near) return null;
  const [bp, bt] = boardWith(p, near.tilts, near.placed);
  const cells = trace(bp, bt).cells;
  for (const c of cells) {
    if (near.placed.some((m) => m.x === c.x && m.y === c.y) && !placed.some((m) => m.x === c.x && m.y === c.y)) return { cell: { x: c.x, y: c.y } };
  }
  for (const c of cells) {
    const want = near.placed.find((m) => m.x === c.x && m.y === c.y);
    const at = placed.findIndex((m) => m.x === c.x && m.y === c.y);
    if (want && placed[at].tilt !== want.tilt) return { placed: at };
    const i = p.things.findIndex((t) => t.kind === 'mirror' && t.x === c.x && t.y === c.y);
    if (i >= 0 && tilts[i] !== near.tilts[i]) return { mirror: i };
  }
  return null;
}

/** Every mirror arrangement that wakes all the flowers and is fewest turns from `tilts` (the known answer first when it is one). */
export function nearestSolutions(p: LightPuzzle, tilts: Tilt[]): Tilt[][] {
  const mirrors = p.things.flatMap((t, i) => (t.kind === 'mirror' ? [i] : []));
  let best = Infinity;
  let found: Tilt[][] = [];
  for (let mask = 0; mask < 2 ** mirrors.length; mask++) {
    const next = [...tilts];
    let turns = 0;
    mirrors.forEach((index, bit) => {
      if ((mask >> bit) & 1) {
        next[index] = (1 - next[index]) as Tilt;
        turns++;
      }
    });
    if (turns > best || !solved(p, next)) continue;
    if (turns < best) (best = turns), (found = []);
    found.push(next);
  }
  const known = found.findIndex((s) => mirrors.every((i) => s[i] === p.solution[i]));
  if (known > 0) found.unshift(...found.splice(known, 1));
  return found;
}

/** The fewest mirror turns from `tilts` to any answer: the couch par and the fair-start floor. */
export function minTurns(p: LightPuzzle, tilts: Tilt[]): number {
  const [nearest] = nearestSolutions(p, tilts);
  return nearest ? p.things.reduce((n, t, i) => n + (t.kind === 'mirror' && nearest[i] !== tilts[i] ? 1 : 0), 0) : Infinity;
}

/**
 * Where a hint points: the first mirror along the nearest answer's beam that is tilted the other way (the known
 * answer when it is among the nearest), so following hints takes the fewest turns there are.
 */
export function hintMirror(p: LightPuzzle, tilts: Tilt[]): number {
  const [nearest] = nearestSolutions(p, tilts);
  if (!nearest) return -1;
  const at = new Map(p.things.map((t, i) => [`${t.x},${t.y}`, i]));
  for (const c of trace(p, nearest).cells) {
    const i = at.get(`${c.x},${c.y}`);
    if (i !== undefined && p.things[i].kind === 'mirror' && tilts[i] !== nearest[i]) return i;
  }
  return -1;
}

/** Why a shine didn't wake everything: for the spoken explanation. */
export function whyNot(p: LightPuzzle, tilts: Tilt[]): 'color' | 'sleeping' | 'rock' | 'edge' | 'loop' | 'none' {
  const t = trace(p, tilts);
  if (t.woken.length === flowerCount(p)) return 'none';
  if (t.wrongColor.length) return 'color';
  if (t.woken.length) return 'sleeping';
  return t.end;
}
