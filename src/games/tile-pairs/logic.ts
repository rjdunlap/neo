import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export interface Tile {
  x: number;
  y: number;
  z: number;
  kind: number;
}
export type Pair = [number, number];
/**
 * `clear` is the deal dial: the band a deal's random-play clear rate must fall in (see `clearRate`).
 * These bands keep the difficulty each level had when every board shared one fixed route.
 */
export const PLANS = [
  { name: 'Open rows · 12 tiles', cols: 4, rows: 3, layers: 1, layout: 'square', kinds: 6, clear: [0.95, 1] },
  {
    name: 'A raised square · 20 tiles',
    cols: 4,
    rows: 4,
    layers: 2,
    layout: 'square',
    kinds: 6,
    clear: [0.95, 1],
  },
  {
    name: 'Three layers · 24 tiles',
    cols: 4,
    rows: 4,
    layers: 3,
    layout: 'square',
    kinds: 6,
    clear: [0.95, 1],
  },
  {
    name: 'Long bridge · 24 tiles',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'bridge',
    kinds: 6,
    clear: [0.95, 1],
  },
  {
    name: 'Twin terraces · 24 tiles',
    cols: 6,
    rows: 2,
    layers: 3,
    layout: 'twins',
    kinds: 5,
    clear: [0.85, 1],
  },
  {
    name: 'Crown · 24 tiles, six of each picture',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'crown',
    kinds: 4,
    clear: [0.75, 1],
  },
] as const;

export const LEVELS: BandLevels = { grownup: { min: 1, max: 6 } };
export const planFor = (level: number) =>
  PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];
export const fullMask = (tiles: readonly Tile[]) => (1 << tiles.length) - 1;
export const present = (mask: number, i: number) => !!(mask & (1 << i));

/** Multi-layer stacks of remaining tiles, each ordered from bottom to top. */
export function peekStacks(tiles: readonly Tile[], mask: number): number[][] {
  const stacks = new Map<string, number[]>();
  tiles.forEach(({ x, y }, i) => {
    if (!present(mask, i)) return;
    const key = `${x},${y}`;
    const stack = stacks.get(key);
    if (stack) stack.push(i);
    else stacks.set(key, [i]);
  });
  return [...stacks.values()]
    .filter((stack) => stack.length > 1)
    .map((stack) => stack.sort((a, b) => tiles[a].z - tiles[b].z));
}

/** A tile needs a clear top and at least one open horizontal side on its own layer. */
export function free(tiles: readonly Tile[], mask: number, i: number): boolean {
  if (!present(mask, i)) return false;
  const a = tiles[i];
  let left = false,
    right = false;
  for (let j = 0; j < tiles.length; j++) {
    if (j === i || !present(mask, j)) continue;
    const b = tiles[j];
    if (a.x === b.x && a.y === b.y && b.z > a.z) return false;
    if (a.y !== b.y || a.z !== b.z) continue;
    if (b.x === a.x - 1) left = true;
    if (b.x === a.x + 1) right = true;
  }
  return !left || !right;
}
export const freeTiles = (tiles: readonly Tile[], mask: number): number[] =>
  tiles.map((_, i) => i).filter((i) => free(tiles, mask, i));
export const removePair = (mask: number, [a, b]: Pair) => mask & ~(1 << a) & ~(1 << b);
export function pairs(tiles: readonly Tile[], mask: number, geometryOnly = false): Pair[] {
  const open = freeTiles(tiles, mask),
    out: Pair[] = [];
  open.forEach((a, i) => {
    for (const b of open.slice(i + 1)) if (geometryOnly || tiles[a].kind === tiles[b].kind) out.push([a, b]);
  });
  return out;
}
/** Exhaustive memoized search on at most 24 tiles. Null means no clearing route, not merely no pair now. */
export function solve(tiles: readonly Tile[], mask = fullMask(tiles), geometryOnly = false): Pair[] | null {
  const dead = new Set<number>();
  function visit(m: number): Pair[] | null {
    if (!m) return [];
    if (dead.has(m)) return null;
    for (const pair of pairs(tiles, m, geometryOnly)) {
      const tail = visit(removePair(m, pair));
      if (tail) return [pair, ...tail];
    }
    dead.add(m);
    return null;
  }
  return visit(mask);
}

/**
 * A geometric clearing route chosen by the seed: the same search as `solve`, trying the free position pairs
 * in a shuffled order at every step, so one layout clears by a different pairing each round.
 */
export function seededRoute(tiles: readonly Tile[], rng: Rng): Pair[] | null {
  const dead = new Set<number>();
  function visit(m: number): Pair[] | null {
    if (!m) return [];
    if (dead.has(m)) return null;
    for (const pair of rng.shuffle(pairs(tiles, m, true))) {
      const tail = visit(removePair(m, pair));
      if (tail) return [pair, ...tail];
    }
    dead.add(m);
    return null;
  }
  return visit(fullMask(tiles));
}
/** Put complete symbol pairs on a geometric clearing route, so generation never rerolls for solvability. */
function assign(tiles: Tile[], symbols: number[], rng: Rng, route: Pair[] | null): Tile[] {
  if (!route || route.length !== symbols.length) throw new Error('Tile Pairs layout cannot clear');
  rng.shuffle(symbols);
  for (let k = 0; k < route.length; k++) for (const i of route[k]) tiles[i].kind = symbols[k];
  return tiles;
}
export const PLAYOUTS = 60;
/**
 * The share of play-outs that clear when every turn takes a uniformly random matching pair: a stand-in for
 * a player who does not plan, and so a measure of how much planning a deal asks for.
 */
export function clearRate(tiles: readonly Tile[], rng: Rng, playouts = PLAYOUTS): number {
  let cleared = 0;
  for (let n = 0; n < playouts; n++) {
    let mask = fullMask(tiles);
    for (;;) {
      const open = pairs(tiles, mask);
      if (!open.length) break;
      mask = removePair(mask, rng.pick(open));
    }
    if (!mask) cleared++;
  }
  return cleared / playouts;
}
/** The level's layout: positions only, the same for every seed. */
export function layout(level: number): Tile[] {
  const plan = planFor(level),
    tiles: Tile[] = [];
  const add = (x: number, y: number, z: number) => tiles.push({ x, y, z, kind: 0 });
  for (let y = 0; y < plan.rows; y++)
    for (let x = 0; x < plan.cols; x++) {
      // The crown's missing corners open different paths into its two raised rows.
      if (plan.layout === 'crown' && y !== 1 && (x === 0 || x === 5)) continue;
      add(x, y, 0);
    }
  if (plan.layout === 'square') {
    for (let z = 1; z < plan.layers; z++)
      for (let y = 1; y <= 2; y++) for (let x = 1; x <= 2; x++) add(x, y, z);
  } else if (plan.layout === 'bridge') {
    for (let x = 1; x <= 4; x++) add(x, 1, 1);
    for (const x of [2, 3]) add(x, 1, 2);
  } else if (plan.layout === 'twins') {
    for (let y = 0; y < 2; y++) for (const x of [0, 1, 4, 5]) add(x, y, 1);
    for (let y = 0; y < 2; y++) for (const x of [1, 4]) add(x, y, 2);
  } else {
    for (let y = 0; y < 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (const x of [2, 3]) add(x, 1, 2);
  }
  return tiles;
}
export const CANDIDATES = 40;
export interface Deal {
  tiles: Tile[];
  /** The kept candidate's measured random-play clear rate. */
  rate: number;
  /** Candidates dealt. */
  tries: number;
  /** False only when every candidate missed the band and the closest was kept. */
  inBand: boolean;
}
/**
 * Deal the level along seeded routes until one lands in the plan's clear-rate band (the closest if none
 * does). Everything draws from `rng`, so one seed still gives one board and a face-off still shares it.
 */
export function deal(level: number, rng: Rng): Deal {
  const plan = planFor(level),
    [min, max] = plan.clear;
  let best: Deal | null = null,
    miss = Infinity;
  for (let tries = 1; tries <= CANDIDATES; tries++) {
    const tiles = layout(level);
    // More repeated pictures deepen the choice of which matching pair to remove, without adding tiles.
    const symbols = Array.from({ length: tiles.length / 2 }, (_, i) => i % plan.kinds);
    assign(tiles, symbols, rng, seededRoute(tiles, rng));
    const rate = clearRate(tiles, rng),
      off = Math.max(min - rate, rate - max, 0);
    if (!off) return { tiles, rate, tries, inBand: true };
    if (off < miss) [best, miss] = [{ tiles, rate, tries: CANDIDATES, inBand: false }, off];
  }
  return best!;
}
export const makeBoard = (level: number, rng: Rng): Tile[] => deal(level, rng).tiles;

/** Recovery keeps exactly the remaining pictures, laid in open rows. Even a stranded tower can be rescued. */
export function reshuffle(tiles: readonly Tile[], mask: number, rng: Rng): Tile[] {
  const counts = new Map<number, number>();
  tiles.forEach((t, i) => {
    if (present(mask, i)) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
  });
  const symbols: number[] = [];
  for (const [kind, count] of counts) {
    if (count % 2) throw new Error('Remaining pictures must come in pairs');
    for (let i = 0; i < count / 2; i++) symbols.push(kind);
  }
  const out = Array.from({ length: symbols.length * 2 }, (_, i) => ({
    x: i % 6,
    y: Math.floor(i / 6),
    z: 0,
    kind: 0,
  }));
  // Recovery stays on the first route: open rows that pair off without planning.
  return assign(out, symbols, rng, solve(out, fullMask(out), true));
}
