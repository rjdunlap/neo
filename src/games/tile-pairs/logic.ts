import type { ColorName } from '../../art/palette';
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
 * Levels 1–6 keep the difficulty each had when every board shared one fixed route; level 7, built after Peek,
 * states its own.
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
  {
    name: 'Tall tower · four layers',
    cols: 4,
    rows: 3,
    layers: 4,
    layout: 'tower',
    kinds: 6,
    // Measured on seeded routes (100 seeds, Mac): random play clears 11–98%, median 57%, and a third of deals
    // have a first pair that leaves no route. The band keeps the middle, so a choice matters without a trap deal.
    clear: [0.45, 0.9],
  },
  {
    name: 'Flower friends · any two flowers pair',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'crown',
    kinds: 5,
    // Four flower tiles, each drawn differently, that pair with one another: four tiles, six possible pairs.
    flowers: 4,
    clear: [0.45, 0.9],
  },
  {
    name: 'Wide stack · 30 tiles',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'wide',
    kinds: 6,
    clear: [0.45, 0.9],
  },
] as const;

/** Flower kinds come after a look's six pictures: `FLOWER + n` is the nth of the four flower drawings. */
export const FLOWER = 6;
export const FLOWER_ART = 4;
export const isFlower = (kind: number) => kind >= FLOWER;
/** Two tiles pair when they show the same picture, or when both are flowers. Symmetric. */
export const matches = (a: number, b: number) => a === b || (isFlower(a) && isFlower(b));
export const flowersIn = (plan: (typeof PLANS)[number]): number => ('flowers' in plan ? plan.flowers : 0);

/**
 * A look is the set of six pictures a round deals, chosen by the round's seed and fixed for the round. Within a
 * look every picture differs from the others in outline and in colour (test-checked); `art` names a shape from
 * `src/art/shapes.ts` or a prop from `src/art/props.ts`, mapped to a drawing in the scene. Look 0 is the
 * original set, which stickers and the hub icon keep.
 */
export const LOOKS = [
  [
    { art: 'circle', color: 'red' },
    { art: 'square', color: 'orange' },
    { art: 'triangle', color: 'yellow' },
    { art: 'star', color: 'green' },
    { art: 'heart', color: 'blue' },
    { art: 'hexagon', color: 'purple' },
  ],
  // The five later shapes and the star, whose points stand apart from all five at tile size.
  [
    { art: 'oval', color: 'teal' },
    { art: 'rectangle', color: 'pink' },
    { art: 'diamond', color: 'yellow' },
    { art: 'pentagon', color: 'purple' },
    { art: 'trapezoid', color: 'brown' },
    { art: 'star', color: 'red' },
  ],
  // Island things: a round fruit, a heart-shaped one, a curved one, a pear, a ribbed fan and a cluster.
  [
    { art: 'strawberry', color: 'red' },
    { art: 'orange', color: 'orange' },
    { art: 'banana', color: 'yellow' },
    { art: 'pear', color: 'green' },
    { art: 'shell', color: 'blue' },
    { art: 'grapes', color: 'purple' },
  ],
] as const satisfies readonly (readonly { art: string; color: ColorName }[])[];
export type Look = (typeof LOOKS)[number];
/** The round's look, drawn from the round's rng after the board is dealt so a seed's board is unchanged. */
export const pickLook = (rng: Rng): number => rng.int(0, LOOKS.length - 1);

export const LEVELS: BandLevels = { grownup: { min: 1, max: 9 } };
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
    for (const b of open.slice(i + 1))
      if (geometryOnly || matches(tiles[a].kind, tiles[b].kind)) out.push([a, b]);
  });
  return out;
}
/**
 * Exhaustive memoized search on at most 30 tiles (the mask is a positive 32-bit integer up to 31; level 9's
 * 30 tiles are the most it holds, and a test keeps every state's search under a node budget). Null means no
 * clearing route, not merely no pair now. `stats.nodes` counts the states visited, for that budget.
 */
export function solve(
  tiles: readonly Tile[],
  mask = fullMask(tiles),
  geometryOnly = false,
  stats?: { nodes: number },
): Pair[] | null {
  const dead = new Set<number>();
  function visit(m: number): Pair[] | null {
    if (stats) stats.nodes++;
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
/** A route symbol that stands for two flower tiles, drawn from the flowers still to place. */
const FLOWER_PAIR = -1;
/**
 * Put complete symbol pairs on a geometric clearing route, so generation never rerolls for solvability. A
 * `FLOWER_PAIR` symbol puts two of `flowers` (distinct flower kinds, shuffled) on its route pair.
 */
function assign(
  tiles: Tile[],
  symbols: number[],
  rng: Rng,
  route: Pair[] | null,
  flowers: number[] = [],
): Tile[] {
  if (!route || route.length !== symbols.length) throw new Error('Tile Pairs layout cannot clear');
  rng.shuffle(symbols);
  const left = rng.shuffle([...flowers]);
  for (let k = 0; k < route.length; k++)
    for (const i of route[k]) tiles[i].kind = symbols[k] === FLOWER_PAIR ? left.pop()! : symbols[k];
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
  } else if (plan.layout === 'tower') {
    // A 2 × 3 block, a 2 × 2 on that and two on top: most of the stack starts covered.
    for (let y = 0; y < 3; y++) for (const x of [1, 2]) add(x, y, 1);
    for (let y = 1; y < 3; y++) for (const x of [1, 2]) add(x, y, 2);
    for (const x of [1, 2]) add(x, 1, 3);
  } else if (plan.layout === 'wide') {
    // The whole 6 × 3 base, a 4 × 2 block raised on its back two rows and a 2 × 2 on that: 18 + 8 + 4 = 30.
    for (let y = 0; y < 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (let y = 0; y < 2; y++) for (const x of [2, 3]) add(x, y, 2);
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
    const flowers = flowersIn(plan),
      symbols = Array.from({ length: tiles.length / 2 - flowers / 2 }, (_, i) => i % plan.kinds);
    for (let n = 0; n < flowers / 2; n++) symbols.push(FLOWER_PAIR);
    const kinds = Array.from({ length: flowers }, (_, n) => FLOWER + (n % FLOWER_ART));
    assign(tiles, symbols, rng, seededRoute(tiles, rng), kinds);
    const rate = clearRate(tiles, rng),
      off = Math.max(min - rate, rate - max, 0);
    if (!off) return { tiles, rate, tries, inBand: true };
    if (off < miss) [best, miss] = [{ tiles, rate, tries: CANDIDATES, inBand: false }, off];
  }
  return best!;
}
export const makeBoard = (level: number, rng: Rng): Tile[] => deal(level, rng).tiles;

const RESHUFFLE_BASE = 24;
const RAISED = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
];
/**
 * Recovery keeps exactly the remaining pictures, laid in open rows. Even a stranded tower can be rescued. Flowers
 * count as one family, so the remaining flowers (always an even number) stay in twos.
 */
export function reshuffle(tiles: readonly Tile[], mask: number, rng: Rng): Tile[] {
  const counts = new Map<number, number>(),
    flowers: number[] = [];
  tiles.forEach((t, i) => {
    if (!present(mask, i)) return;
    if (isFlower(t.kind)) flowers.push(t.kind);
    else counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
  });
  if (flowers.length % 2) throw new Error('Remaining flowers must come in pairs');
  const symbols: number[] = [];
  for (const [kind, count] of counts) {
    if (count % 2) throw new Error('Remaining pictures must come in pairs');
    for (let i = 0; i < count / 2; i++) symbols.push(kind);
  }
  for (let n = 0; n < flowers.length / 2; n++) symbols.push(FLOWER_PAIR);
  // At most four rows of six fit above the buttons in landscape, so past 24 tiles (level 9) the rest are raised
  // on the middle of the rows; the route below still clears them.
  const out = Array.from({ length: symbols.length * 2 }, (_, i) =>
    i < RESHUFFLE_BASE
      ? { x: i % 6, y: Math.floor(i / 6), z: 0, kind: 0 }
      : { ...RAISED[i - RESHUFFLE_BASE], z: 1, kind: 0 },
  );
  // Recovery stays on the first route: open rows that pair off without planning.
  return assign(out, symbols, rng, solve(out, fullMask(out), true), flowers);
}
