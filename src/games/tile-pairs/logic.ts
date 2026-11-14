import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { POOLS } from './pools.ts';
import { PUZZLES } from './puzzles.ts';

export interface Tile {
  /** Column; level 13's brick wall lays raised tiles on half steps, so a tile can rest on two below it. */
  x: number;
  y: number;
  z: number;
  kind: number;
  /**
   * Which neighbours on its layer can hold a tile in: absent, its left and right ones (the classic rule); `'ends'`,
   * the ones just above and below it on the board (level 12, *Short sides*). Every tile of a board shares it.
   */
  open?: 'ends';
  /** How many alike tiles one move takes: absent, two; `3` on level 14, *Three alike*. Every tile of a board shares it. */
  take?: 3;
}
/** The tiles one move removes together: a pair, or on a three-alike board a set of three. */
export type Pair = readonly number[];
/**
 * `clear` is the deal dial: the band a deal's random-play clear rate must fall in (see `clearRate`).
 * Levels 1–2 keep the difficulty each had when every board shared one fixed route; levels 3–6 moved to harder
 * bands once Peek let her see why a choice went wrong (dive slice 7), and each later level states its own. A plan
 * with a `pool` deals from frozen boards in `pools.ts` instead (see `deal`).
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
    // Measured (300 seeded candidates, Mac): 60% land in the band, so the dial never runs out of candidates.
    clear: [0.6, 0.95],
  },
  {
    name: 'Long bridge · 24 tiles',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'bridge',
    kinds: 6,
    clear: [0.6, 0.95],
  },
  {
    name: 'Twin terraces · 24 tiles',
    cols: 6,
    rows: 2,
    layers: 3,
    layout: 'twins',
    kinds: 5,
    clear: [0.3, 0.8],
  },
  {
    name: 'Crown · 24 tiles, six of each picture',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'crown',
    kinds: 4,
    clear: [0.3, 0.8],
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
  {
    name: 'Tricky twins · a pair that strands a terrace',
    cols: 6,
    rows: 2,
    layers: 3,
    layout: 'twins',
    kinds: 5,
    // Too few seeded deals meet this band to find one at runtime, so the boards are frozen in `pools.ts` by
    // `scripts/tile-pairs-pool.mjs`: each clears, has a losing first pair and passes `fairTrap`.
    pool: 'twins',
    clear: [0, 0.35],
  },
  {
    name: 'Tricky tower · a pair that buries a stack',
    cols: 4,
    rows: 3,
    layers: 4,
    layout: 'tower',
    kinds: 6,
    // Level 7's tower from frozen deals, as level 10 is level 5's terraces: each clears, has a losing first pair
    // and passes `fairTrap`.
    pool: 'tower',
    clear: [0, 0.35],
  },
  {
    name: 'Short sides · tiles open above and below',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'crown',
    kinds: 4,
    // The crown as level 6 lays it out, read along the other axis (Kyodai's vertical variation): a tile is held in
    // by the tiles just above and below it on its layer, not beside it. Measured (300 seeded routes, Mac): random
    // play clears 18–100%, median 75% (level 6: median 72%), and 199 of 300 land in level 6's band, which it keeps.
    open: 'ends',
    clear: [0.3, 0.8],
  },
  {
    name: 'Brick wall · half steps',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'brick',
    kinds: 6,
    // Raised tiles sit on half steps, each resting on two below it, so one tile holds down two and one pair can
    // free four (the classic turtle is built this way). Measured (300 seeded routes, Mac): random play clears
    // 8–100%, median 68%, and 204 of 300 land in levels 7 and 9's band, which it keeps.
    clear: [0.45, 0.9],
  },
  {
    name: 'Three alike · 24 tiles',
    cols: 6,
    rows: 3,
    layers: 3,
    layout: 'crown',
    kinds: 4,
    // Level 6's crown, six of each picture, taken three at a time (Triple Mahjong without its clock): which three of
    // six copies to take, and which three to leave for later. Measured (300 seeded routes, Mac): random play clears
    // 0-97%, median 28%, and 138 of 300 land in level 6's band, which it keeps; 191 have a losing first set.
    take: 3,
    clear: [0.3, 0.8],
  },
  {
    name: 'Big stack · 36 tiles',
    cols: 6,
    rows: 4,
    layers: 3,
    layout: 'big',
    kinds: 6,
    // A 6 × 4 base, a 4 × 2 block on its middle rows and a 2 × 2 on that: 24 + 8 + 4. Past 32 tiles the mask is a
    // plain number of up to 53 bits (see `present`). Measured (300 seeded routes, Mac): random play clears 25–100%,
    // median 77%, and 252 of 300 land in levels 7, 9 and 13's band, which it keeps.
    clear: [0.45, 0.9],
  },
  {
    name: 'Great stack · 40 tiles',
    cols: 6,
    rows: 4,
    layers: 3,
    layout: 'great',
    kinds: 6,
    // Level 15's stack with its raised block reaching the front and back rows along the middle: 24 + 12 + 4. The dive
    // planned five rows, but five do not fit between the tally and the buttons in landscape at full tile size; four
    // do. The longest plan the exact search still proves quickly (a 48-tile board took seconds on one stranded
    // state). Measured (300 seeded routes): random play clears 30–98%, median 78%, 267 of 300 in band.
    clear: [0.45, 0.9],
  },
] as const;

/** Flower kinds come after a look's six pictures: `FLOWER + n` is the nth of the four flower drawings. */
export const FLOWER = 6;
export const FLOWER_ART = 4;
export const isFlower = (kind: number) => kind >= FLOWER;
/** Two tiles pair when they show the same picture, or when both are flowers. Symmetric. */
export const matches = (a: number, b: number) => a === b || (isFlower(a) && isFlower(b));
export const flowersIn = (plan: Plan): number => ('flowers' in plan ? plan.flowers : 0);

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

/**
 * Designed lesson boards (dive: *Puzzle challenges*). Each is a small sketched layout whose frozen boards, found by
 * `scripts/tile-pairs-pool.mjs` and kept in `puzzles.ts`, set one trap that is the lesson: a first pair that leaves
 * no route (`lessonHolds`). They take IDs 17–21, after the ordinary levels 1–16.
 */
export const PUZZLE_PLANS = {
  17: {
    name: 'Twins on twins · a lesson',
    cols: 5,
    rows: 2,
    layers: 2,
    layout: 'lesson',
    kinds: 4,
    puzzle: 'twins',
    clear: [0, 1],
  },
  18: {
    name: 'Three free copies · a lesson',
    cols: 5,
    rows: 2,
    layers: 3,
    layout: 'lesson',
    kinds: 4,
    puzzle: 'three',
    clear: [0, 1],
  },
  19: {
    name: 'Crossed stacks · a lesson',
    cols: 4,
    rows: 3,
    layers: 2,
    layout: 'lesson',
    kinds: 4,
    puzzle: 'crossed',
    clear: [0, 1],
  },
  20: {
    name: 'The long row · a lesson',
    cols: 6,
    rows: 3,
    layers: 1,
    layout: 'lesson',
    kinds: 4,
    puzzle: 'long',
    clear: [0, 1],
  },
  21: {
    name: 'Two pairs ahead · a lesson',
    cols: 5,
    rows: 2,
    layers: 3,
    layout: 'lesson',
    kinds: 4,
    puzzle: 'ahead',
    clear: [0, 1],
  },
} as const;
export type Lesson = (typeof PUZZLE_PLANS)[keyof typeof PUZZLE_PLANS]['puzzle'];
type Plan = (typeof PLANS)[number] | (typeof PUZZLE_PLANS)[keyof typeof PUZZLE_PLANS];
/** Each lesson's sketch, positions as [x, y, z]; every one is symmetric under the left-right mirror (test-checked). */
export const SKETCHES: Record<Lesson, readonly (readonly [number, number, number])[]> = {
  // Two rows of five; a raised tile on the second and fourth of each row, each with a free side.
  twins: [
    ...[0, 1].flatMap((y) => [0, 1, 2, 3, 4].map((x) => [x, y, 0] as const)),
    ...[0, 1].flatMap((y) => [1, 3].map((x) => [x, y, 1] as const)),
  ],
  // Two rows of five; three raised on the back row and one on the middle of those.
  three: [
    ...[0, 1].flatMap((y) => [0, 1, 2, 3, 4].map((x) => [x, y, 0] as const)),
    ...[1, 2, 3].map((x) => [x, 1, 1] as const),
    [2, 1, 2],
  ],
  // Three rows of four; two raised side by side on the middle row, so two stacks can cross.
  crossed: [...[0, 1, 2].flatMap((y) => [0, 1, 2, 3].map((x) => [x, y, 0] as const)), [1, 1, 1], [2, 1, 1]],
  // One flat layer: a row of six between two rows of four (eight would not fit a phone held upright), so only the
  // six row ends are free and nothing is covered.
  long: [
    ...[1, 2, 3, 4].map((x) => [x, 0, 0] as const),
    ...[0, 1, 2, 3, 4, 5].map((x) => [x, 1, 0] as const),
    ...[1, 2, 3, 4].map((x) => [x, 2, 0] as const),
  ],
  // Two rows of five, three raised on the middle of each and one on top of those: 18 tiles on three layers.
  ahead: [
    ...[0, 1].flatMap((y) => [0, 1, 2, 3, 4].map((x) => [x, y, 0] as const)),
    ...[0, 1].flatMap((y) => [1, 2, 3].map((x) => [x, y, 1] as const)),
    ...[0, 1].map((y) => [2, y, 2] as const),
  ],
};

/**
 * Lessons sit just before the size or rule that needs them, so the band steps through `order` (dive: proposed
 * order, kept to the levels that exist and to levels 1–10's own order).
 */
export const LEVELS: BandLevels = {
  grownup: {
    min: 1,
    max: 21,
    order: [1, 2, 17, 3, 18, 4, 19, 5, 20, 6, 7, 8, 9, 10, 21, 11, 12, 13, 14, 15, 16],
  },
};
export const planFor = (level: number): Plan =>
  (PUZZLE_PLANS as Record<number, Plan>)[Math.floor(level)] ??
  PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];
/** The lesson a level teaches, or null on an ordinary level. */
export const lessonFor = (level: number): Lesson | null => {
  const plan = planFor(level);
  return 'puzzle' in plan ? plan.puzzle : null;
};
/**
 * The remaining tiles as bits of a plain number. Up to 30 tiles it is the positive 32-bit integer it always was; levels
 * 15–16 (36 and 40 tiles) go past 32 bits, which a double holds exactly up to 53. Bitwise `&` reads its operand modulo
 * 2^32, so the low 32 bits are tested directly and higher ones on the quotient by 2^32.
 */
export const fullMask = (tiles: readonly Tile[]) => 2 ** tiles.length - 1;
const HIGH = 2 ** 32;
export const present = (mask: number, i: number) =>
  i < 32 ? !!(mask & (1 << i)) : !!(Math.floor(mask / HIGH) & (1 << (i - 32)));

/** Multi-layer stacks of remaining tiles, each ordered from bottom to top. */
export function peekStacks(tiles: readonly Tile[], mask: number): number[][] {
  const stacks = new Map<string, number[]>();
  tiles.forEach(({ x, y }, i) => {
    if (!present(mask, i)) return;
    // A half-step tile (level 13) joins the stack under its left half, so every tile is in exactly one stack.
    const key = `${Math.floor(x)},${Math.floor(y)}`;
    const stack = stacks.get(key);
    if (stack) stack.push(i);
    else stacks.set(key, [i]);
  });
  return [...stacks.values()]
    .filter((stack) => stack.length > 1)
    .map((stack) => stack.sort((a, b) => tiles[a].z - tiles[b].z));
}

/** Whether the board's tiles open above and below (level 12) rather than left and right. */
export const opensAtEnds = (tiles: readonly Tile[]) => tiles[0]?.open === 'ends';
/** How many alike tiles one move takes on this board: 2, or 3 on level 14. */
export const takeOf = (tiles: readonly Tile[]): 2 | 3 => tiles[0]?.take ?? 2;
/** Whether tile `b` covers part of tile `a`'s face: within less than a whole step both ways. */
const overlaps = (a: Tile, b: Tile) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
/**
 * A tile needs a clear top (no higher tile overlapping it, which on whole-step boards means one exactly above) and
 * at least one open side on its own layer: left or right, or on an `'ends'` board above or below.
 */
export function free(tiles: readonly Tile[], mask: number, i: number): boolean {
  if (!present(mask, i)) return false;
  const a = tiles[i],
    ends = a.open === 'ends';
  let before = false,
    after = false;
  for (let j = 0; j < tiles.length; j++) {
    if (j === i || !present(mask, j)) continue;
    const b = tiles[j];
    if (b.z > a.z && overlaps(a, b)) return false;
    if (a.z !== b.z) continue;
    const [line, along] = ends ? [Math.abs(b.x - a.x) < 1, b.y - a.y] : [Math.abs(b.y - a.y) < 1, b.x - a.x];
    if (!line) continue;
    if (along === -1) before = true;
    if (along === 1) after = true;
  }
  return !before || !after;
}
/** Which of a blocked-in tile's open-axis neighbours are present, for the scene's edge shadows. */
export function heldSides(
  tiles: readonly Tile[],
  mask: number,
  i: number,
): { before: boolean; after: boolean } {
  const a = tiles[i],
    ends = a.open === 'ends',
    at = (d: number) =>
      tiles.some(
        (b, j) =>
          j !== i &&
          present(mask, j) &&
          b.z === a.z &&
          (ends ? b.x === a.x && b.y === a.y + d : b.y === a.y && b.x === a.x + d),
      );
  return { before: at(-1), after: at(1) };
}
export const freeTiles = (tiles: readonly Tile[], mask: number): number[] =>
  tiles.map((_, i) => i).filter((i) => free(tiles, mask, i));
/** The mask without a move's tiles; a tile already gone stays gone (subtraction, since `& ~` would cut past 32 bits). */
export const removePair = (mask: number, group: Pair) =>
  group.reduce((m, i) => (present(m, i) ? m - 2 ** i : m), mask);
/**
 * Every move open now: free pairs that match, or on a three-alike board free sets of three showing one picture
 * (three alike pair no flowers). `geometryOnly` ignores pictures, for laying a route before they are placed.
 */
export function pairs(tiles: readonly Tile[], mask: number, geometryOnly = false): Pair[] {
  const open = freeTiles(tiles, mask),
    out: Pair[] = [],
    three = takeOf(tiles) === 3;
  open.forEach((a, i) => {
    for (let j = i + 1; j < open.length; j++) {
      const b = open[j];
      if (!geometryOnly && !matches(tiles[a].kind, tiles[b].kind)) continue;
      if (!three) {
        out.push([a, b]);
        continue;
      }
      for (const c of open.slice(j + 1))
        if (geometryOnly || (tiles[c].kind === tiles[a].kind && tiles[b].kind === tiles[a].kind))
          out.push([a, b, c]);
    }
  });
  return out;
}
/**
 * Exhaustive memoized search on at most 40 tiles (level 16; tests keep every state's search on levels 9, 15 and 16
 * under a node budget, and a 48-tile board took seconds on one stranded state). Null means no
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
    if (!geometryOnly && buried(tiles, m)) {
      dead.add(m);
      return null;
    }
    const open = pairs(tiles, m, geometryOnly),
      safe = geometryOnly ? undefined : open.find((p) => allCopiesFree(tiles, m, p[0]));
    for (const pair of safe ? [safe] : open) {
      const tail = visit(removePair(m, pair));
      if (tail) return [pair, ...tail];
    }
    dead.add(m);
    return null;
  }
  return visit(mask);
}

/** Whether two tiles can be taken in one move: the same picture, or both flowers. */
const alike = (a: number, b: number) => (isFlower(a) ? isFlower(b) : a === b);
/**
 * Whether some remaining tile lies on top of so many of its own picture's other copies that too few are left to take
 * with it: they stay covered while it is there, so it can never be taken and the board cannot clear.
 */
function buried(tiles: readonly Tile[], mask: number): boolean {
  const take = takeOf(tiles);
  for (let i = 0; i < tiles.length; i++) {
    if (!present(mask, i)) continue;
    const a = tiles[i];
    let partners = 0;
    for (let j = 0; j < tiles.length && partners < take - 1; j++) {
      if (j === i || !present(mask, j) || !alike(a.kind, tiles[j].kind)) continue;
      const b = tiles[j];
      if (!(a.z > b.z && overlaps(a, b))) partners++;
    }
    if (partners < take - 1) return true;
  }
  return false;
}
/**
 * Whether every remaining tile that can go with tile `i` (its picture, or any flower for a flower) is free. Removing
 * tiles never covers or hems in another, so those tiles stay free whatever else is taken: taking a move among them
 * now cannot spoil a route, and `solve` tries only that move (the standard pruning that keeps 40 tiles quick).
 */
function allCopiesFree(tiles: readonly Tile[], mask: number, i: number): boolean {
  const kind = tiles[i].kind;
  for (let j = 0; j < tiles.length; j++)
    if (j !== i && present(mask, j) && alike(kind, tiles[j].kind) && !free(tiles, mask, j)) return false;
  return true;
}
/**
 * A geometric clearing route chosen by the seed: the same search as `solve`, trying the free position pairs
 * in a shuffled order at every step, so one layout clears by a different pairing each round.
 */
export function seededRoute(tiles: readonly Tile[], rng: Rng): Pair[] | null {
  const dead = new Set<number>(),
    three = takeOf(tiles) === 3,
    height = (g: Pair) => g.reduce((h, i) => h + tiles[i].z, 0);
  function visit(m: number): Pair[] | null {
    if (!m) return [];
    if (dead.has(m)) return null;
    const moves = rng.shuffle(pairs(tiles, m, true));
    // Taken three at a time, a stack whose last tiles are alone strands, and the shuffled search wanders through
    // too many dead states; trying the highest sets first (ties still shuffled) keeps stacks coming down in step.
    if (three) moves.sort((p, q) => height(q) - height(p));
    for (const pair of moves) {
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
  if ('puzzle' in plan) return SKETCHES[plan.puzzle].map(([x, y, z]) => ({ x, y, z, kind: 0 }));
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
  } else if (plan.layout === 'brick') {
    // Five on the half steps of the middle row, each straddling two below, and three straddling those: 18 + 5 + 3.
    // No three straddling tiles can sit symmetrically on five, so the top row leans one half step to the left.
    for (let x = 0; x < 5; x++) add(x + 0.5, 1, 1);
    for (const x of [1, 2, 3]) add(x, 1, 2);
  } else if (plan.layout === 'big') {
    // A 4 × 2 block on the middle two of the four rows and a 2 × 2 on that: 24 + 8 + 4 = 36.
    for (let y = 1; y <= 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (let y = 1; y <= 2; y++) for (const x of [2, 3]) add(x, y, 2);
  } else if (plan.layout === 'great') {
    // A raised cross, a 4 × 2 block on the middle rows with the middle two columns running front to back, and a 2 × 2
    // on that: 24 + 12 + 4 = 40.
    for (let y = 1; y <= 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (const y of [0, 3]) for (const x of [2, 3]) add(x, y, 1);
    for (let y = 1; y <= 2; y++) for (const x of [2, 3]) add(x, y, 2);
  } else if (plan.layout === 'wide') {
    // The whole 6 × 3 base, a 4 × 2 block raised on its back two rows and a 2 × 2 on that: 18 + 8 + 4 = 30.
    for (let y = 0; y < 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (let y = 0; y < 2; y++) for (const x of [2, 3]) add(x, y, 2);
  } else {
    for (let y = 0; y < 2; y++) for (let x = 1; x <= 4; x++) add(x, y, 1);
    for (const x of [2, 3]) add(x, 1, 2);
  }
  if ('open' in plan) for (const t of tiles) t.open = plan.open;
  if ('take' in plan) for (const t of tiles) t.take = plan.take;
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
  if ('pool' in plan || 'puzzle' in plan) {
    const tiles = 'pool' in plan ? fromPool(level, rng) : fromPuzzles(level, rng),
      rate = clearRate(tiles, rng);
    return { tiles, rate, tries: 1, inBand: rate >= min && rate <= max };
  }
  let best: Deal | null = null,
    miss = Infinity;
  for (let tries = 1; tries <= CANDIDATES; tries++) {
    const tiles = layout(level);
    // More repeated pictures deepen the choice of which matching pair to remove, without adding tiles.
    const flowers = flowersIn(plan),
      symbols = Array.from({ length: tiles.length / takeOf(tiles) - flowers / 2 }, (_, i) => i % plan.kinds);
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

/** Left-right mirror of a layout position, which every pooled layout is symmetric under (test-checked). */
export const mirrorX = (plan: Plan, x: number) => plan.cols - 1 - x;
/**
 * A frozen board: the seed picks one of the pool's deals, may mirror it left to right and renames its pictures.
 * Neither changes which pairs are free, so each keeps its losing first pair, its clear rate and its fair trap.
 */
export function fromPool(level: number, rng: Rng): Tile[] {
  const plan = planFor(level);
  if (!('pool' in plan)) throw new Error('Tile Pairs level has no pool');
  const kinds = rng.pick(POOLS[plan.pool]),
    mirror = rng.chance(0.5),
    rename = rng.shuffle(Array.from({ length: plan.kinds }, (_, k) => k)),
    tiles = layout(level),
    at = new Map(tiles.map((t, i) => [`${t.x},${t.y},${t.z}`, i]));
  return tiles.map((t) => {
    const from = at.get(`${mirror ? mirrorX(plan, t.x) : t.x},${t.y},${t.z}`)!;
    return { ...t, kind: rename[Number(kinds[from])] };
  });
}

/**
 * A designed lesson board: the seed picks one of the lesson's boards, may mirror it left to right and gives its
 * pictures any of the look's six. Neither changes which pairs are free, so each keeps its lesson (test-checked).
 */
export function fromPuzzles(level: number, rng: Rng): Tile[] {
  const plan = planFor(level);
  if (!('puzzle' in plan)) throw new Error('Tile Pairs level has no lesson boards');
  const kinds = rng.pick(PUZZLES[plan.puzzle]),
    mirror = rng.chance(0.5),
    rename = rng.shuffle([0, 1, 2, 3, 4, 5]),
    tiles = layout(level),
    at = new Map(tiles.map((t, i) => [`${t.x},${t.y},${t.z}`, i]));
  return tiles.map((t) => {
    const from = at.get(`${mirror ? mirrorX(plan, t.x) : t.x},${t.y},${t.z}`)!;
    return { ...t, kind: rename[Number(kinds[from])] };
  });
}

/** The tile resting directly on tile `i`, or -1. */
const tileOn = (tiles: readonly Tile[], i: number) =>
  tiles.findIndex((t) => t.x === tiles[i].x && t.y === tiles[i].y && t.z === tiles[i].z + 1);
const sameKind = (tiles: readonly Tile[], [a, b]: Pair) => tiles[a].kind === tiles[b].kind;
/**
 * Whether a board teaches its lesson on the first move. Every lesson needs a clearing route and a first pair that
 * leaves none; then:
 * - `twins`: one picture has a copy resting on another copy and its other two copies free, and the only losing
 *   first pair is those two free copies (pairing the top twin with either is safe).
 * - `three`: one picture has three copies free and its fourth covered by a different picture; exactly one of the
 *   three pairs among them is safe, and every losing first pair is one of the other two.
 * - `crossed`: a copy of one picture rests on a copy of a second and a copy of the second on a copy of the first,
 *   and every losing first pair is of one of those two pictures.
 * - `long`: one flat layer, so nothing is covered; one picture has three copies free and its fourth buried inside a
 *   row, the only safe pair of the three is the two at that row's ends, and every losing first pair is among them.
 * - `ahead`: every losing first pair still leaves at least two pairs to take on every line before the board strands
 *   (`pairsBeforeStranded`), so the trap is not visible one pair out, and the fair-trap check passes.
 */
export function lessonHolds(lesson: Lesson, tiles: readonly Tile[]): boolean {
  const full = fullMask(tiles);
  if (!solve(tiles)) return false;
  const losing = losingFirstPairs(tiles);
  if (!losing.length) return false;
  const open = new Set(freeTiles(tiles, full)),
    kinds = [...new Set(tiles.map((t) => t.kind))],
    copies = (k: number) => tiles.flatMap((t, i) => (t.kind === k ? [i] : [])),
    key = ([a, b]: Pair) => `${Math.min(a, b)},${Math.max(a, b)}`;
  if (lesson === 'ahead')
    return losing.every((p) => pairsBeforeStranded(tiles, removePair(full, p)) >= 2) && fairTrap(tiles);
  if (lesson === 'long') {
    if (tiles.some((t) => t.z > 0)) return false;
    const lost = new Set(losing.map(key));
    return kinds.some((k) => {
      const all = copies(k),
        free = all.filter((i) => open.has(i)),
        buried = all.filter((i) => !open.has(i));
      if (all.length !== 4 || free.length !== 3 || buried.length !== 1) return false;
      const ends = free.filter((i) => tiles[i].y === tiles[buried[0]].y);
      if (ends.length !== 2) return false;
      const among = free.flatMap((a, n) => free.slice(n + 1).map((b): Pair => [a, b])),
        safe = among.filter((p) => !lost.has(key(p)));
      return (
        safe.length === 1 &&
        key(safe[0]) === key([ends[0], ends[1]]) &&
        losing.every((p) => free.includes(p[0]) && free.includes(p[1]))
      );
    });
  }
  if (lesson === 'crossed')
    return kinds.some((a) =>
      kinds.some((b) => {
        if (a === b) return false;
        const on = (top: number, under: number) =>
          copies(under).some((i) => {
            const j = tileOn(tiles, i);
            return j >= 0 && tiles[j].kind === top;
          });
        return on(a, b) && on(b, a) && losing.every((p) => [a, b].includes(tiles[p[0]].kind));
      }),
    );
  return kinds.some((k) => {
    const all = copies(k),
      free = all.filter((i) => open.has(i)),
      covered = all.filter((i) => !open.has(i));
    if (all.length !== 4 || free.length !== 3 || covered.length !== 1) return false;
    const top = tileOn(tiles, covered[0]),
      among: Pair[] = [
        [free[0], free[1]],
        [free[0], free[2]],
        [free[1], free[2]],
      ],
      lost = new Set(losing.map(key));
    if (lesson === 'twins') {
      if (top < 0 || tiles[top].kind !== k) return false;
      const others = free.filter((i) => i !== top);
      return losing.length === 1 && key(losing[0]) === key([others[0], others[1]]);
    }
    if (top >= 0 && tiles[top].kind === k) return false;
    return (
      among.filter((p) => !lost.has(key(p))).length === 1 &&
      losing.length === 2 &&
      losing.every((p) => sameKind(tiles, p) && tiles[p[0]].kind === k)
    );
  });
}

/**
 * The fewest pairs a player can take from `mask` before no pair is left (Infinity only when no line strands):
 * how far ahead the trap a losing pair sets is hidden.
 */
export function pairsBeforeStranded(tiles: readonly Tile[], mask: number): number {
  const known = new Map<number, number>();
  function fewest(m: number): number {
    if (!m) return Infinity;
    const seen = known.get(m);
    if (seen !== undefined) return seen;
    const open = pairs(tiles, m);
    let best = open.length ? Infinity : 0;
    for (const p of open) best = Math.min(best, 1 + fewest(removePair(m, p)));
    known.set(m, best);
    return best;
  }
  return fewest(mask);
}

/** First pairs on the full board that leave no clearing route: the trap a tricky deal sets. */
export function losingFirstPairs(tiles: readonly Tile[]): Pair[] {
  const full = fullMask(tiles);
  return pairs(tiles, full).filter((pair) => !solve(tiles, removePair(full, pair)));
}
/**
 * How good a pair looks to a player who keeps the most pairs open, looking two pairs ahead: the most open pairs
 * after it and one more pair (Infinity when the two empty the board, -1 when it leaves tiles and no pair).
 */
export function lookahead(tiles: readonly Tile[], mask: number, pair: Pair): number {
  const after = removePair(mask, pair);
  if (!after) return Infinity;
  const next = pairs(tiles, after);
  if (!next.length) return -1;
  let best = 0;
  for (const q of next) {
    const two = removePair(after, q);
    if (!two) return Infinity;
    best = Math.max(best, pairs(tiles, two).length);
  }
  return best;
}
/**
 * The fair-trap check (a frustration test turned into a rejection rule): a player who always takes a pair with
 * the best `lookahead` clears the board, however they break ties. So a trap is one a careful look avoids, never
 * one only luck or an exhaustive search gets past.
 */
export function fairTrap(tiles: readonly Tile[], mask = fullMask(tiles)): boolean {
  const known = new Map<number, boolean>();
  function clears(m: number): boolean {
    if (!m) return true;
    const seen = known.get(m);
    if (seen !== undefined) return seen;
    const open = pairs(tiles, m),
      scores = open.map((p) => lookahead(tiles, m, p)),
      top = Math.max(...scores);
    const ok = open.length > 0 && open.every((p, i) => scores[i] < top || clears(removePair(m, p)));
    known.set(m, ok);
    return ok;
  }
  return clears(mask);
}

const RESHUFFLE_BASE = 24;
// The first six keep level 9's recoveries as they were; the rest give a 36- or 40-tile remainder room (levels 15–16).
const RAISED = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 1, y: 2 },
  { x: 4, y: 2 },
  ...[0, 3].flatMap((y) => [1, 2, 3, 4].map((x) => ({ x, y }))),
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
  const symbols: number[] = [],
    take = takeOf(tiles);
  for (const [kind, count] of counts) {
    if (count % take)
      throw new Error('Remaining pictures must come in pairs, or threes on a three-alike board');
    for (let i = 0; i < count / take; i++) symbols.push(kind);
  }
  for (let n = 0; n < flowers.length / 2; n++) symbols.push(FLOWER_PAIR);
  // Four rows of six keep the targets clear of the buttons in landscape, so past 24 tiles (levels 9, 15 and 16) the
  // rest are raised on the rows; the route below still clears them.
  // Three alike deal down the four rows in turn, so the rows stay even: a last row of three would hold its middle in.
  const out: Tile[] = Array.from({ length: symbols.length * take }, (_, i) =>
    take === 3
      ? { x: Math.floor(i / 4), y: i % 4, z: 0, kind: 0 }
      : i < RESHUFFLE_BASE
        ? { x: i % 6, y: Math.floor(i / 6), z: 0, kind: 0 }
        : { ...RAISED[i - RESHUFFLE_BASE], z: 1, kind: 0 },
  );
  // A short-sides board keeps its rule: the rows' columns then open from their ends, and the route still clears.
  if (opensAtEnds(tiles)) for (const t of out) t.open = 'ends';
  // A three-alike board stays one: its rows clear three at a time.
  if (take === 3) for (const t of out) t.take = 3;
  // Recovery stays on the first route: open rows that pair off without planning.
  return assign(out, symbols, rng, solve(out, fullMask(out), true), flowers);
}
