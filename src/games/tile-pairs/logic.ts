import type { Rng } from '../../engine/random';

export interface Tile { x: number; y: number; z: number; kind: number }
export type Pair = [number, number];
export const PLANS = [
  { name: 'Open rows · 12 tiles', rows: 3, layers: 1 },
  { name: 'A raised square · 20 tiles', rows: 4, layers: 2 },
  { name: 'Three layers · 24 tiles', rows: 4, layers: 3 },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(2, Math.floor(level) - 1))];
export const fullMask = (tiles: readonly Tile[]) => (1 << tiles.length) - 1;
export const present = (mask: number, i: number) => !!(mask & (1 << i));

/** A tile needs a clear top and at least one open horizontal side on its own layer. */
export function free(tiles: readonly Tile[], mask: number, i: number): boolean {
  if (!present(mask, i)) return false;
  const a = tiles[i];
  let left = false, right = false;
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
export const freeTiles = (tiles: readonly Tile[], mask: number): number[] => tiles.map((_, i) => i).filter(i => free(tiles, mask, i));
export const removePair = (mask: number, [a, b]: Pair) => mask & ~(1 << a) & ~(1 << b);
export function pairs(tiles: readonly Tile[], mask: number, geometryOnly = false): Pair[] {
  const open = freeTiles(tiles, mask), out: Pair[] = [];
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

/** Assign complete symbol pairs along a known geometric clearing route, so generation never rerolls. */
function assign(tiles: Tile[], symbols: number[], rng: Rng): Tile[] {
  const route = solve(tiles, fullMask(tiles), true);
  if (!route || route.length !== symbols.length) throw new Error('Tile Pairs layout cannot clear');
  rng.shuffle(symbols);
  for (let k = 0; k < route.length; k++) for (const i of route[k]) tiles[i].kind = symbols[k];
  return tiles;
}
export function makeBoard(level: number, rng: Rng): Tile[] {
  const plan = planFor(level), tiles: Tile[] = [];
  for (let y = 0; y < plan.rows; y++) for (let x = 0; x < 4; x++) tiles.push({ x, y, z: 0, kind: 0 });
  for (let z = 1; z < plan.layers; z++) for (let y = 1; y <= 2; y++) for (let x = 1; x <= 2; x++) tiles.push({ x, y, z, kind: 0 });
  // Four copies of each picture on deeper stacks allow different matching choices.
  const symbols = Array.from({ length: tiles.length / 2 }, (_, i) => i % 6);
  return assign(tiles, symbols, rng);
}

/** Recovery keeps exactly the remaining pictures, laid in open rows. Even a stranded tower can be rescued. */
export function reshuffle(tiles: readonly Tile[], mask: number, rng: Rng): Tile[] {
  const counts = new Map<number, number>();
  tiles.forEach((t, i) => { if (present(mask, i)) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1); });
  const symbols: number[] = [];
  for (const [kind, count] of counts) {
    if (count % 2) throw new Error('Remaining pictures must come in pairs');
    for (let i = 0; i < count / 2; i++) symbols.push(kind);
  }
  const out = Array.from({ length: symbols.length * 2 }, (_, i) => ({ x: i % 6, y: Math.floor(i / 6), z: 0, kind: 0 }));
  return assign(out, symbols, rng);
}
