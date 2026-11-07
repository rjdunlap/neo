import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Penguin Slide, after the ice puzzles in Pokémon and Zelda: the penguin slides until something
 * stops it (a snowy rock, the edge of the pond, or a patch of soft snow it sinks into). Fish are
 * eaten on the way past. The puzzle is planning a few slides ahead.
 *
 * Puzzles are generated at random and kept only when the shortest solution has the planned
 * number of moves, found by searching every slide.
 *
 * Ice blocks (from level 6) are pushed: when a slide ends beside a block, the next slide in that
 * direction sends the block skating instead, until it meets a rock, the pond's edge, another block
 * or a fish (it never covers one), or sinks into soft snow. Only the block moves; the penguin
 * stays put. A block that cannot move yet behaves like a rock. Pushing counts as a slide.
 */
export interface SlidePlan {
  cols: number;
  rows: number;
  fish: 0 | 1 | 2 | 3;
  /** Soft snow patches: the penguin stops on them. */
  soft: number;
  rocks: number;
  /** Ice blocks to push; 0 on the levels before level 6. */
  blocks?: number;
  /** Authored paired-block boards, reflected by the round seed. */
  pairedBlocks?: boolean;
  /** Shortest solution, in slides (a push is one). */
  moves: [number, number];
  /** No dead ends: every place the penguin can reach can still reach every fish (the younger levels). */
  fair?: boolean;
  /** At most this many ponds of a round are solved in a single slide. */
  maxSingles?: number;
  /** No first slide from the start eats two fish at once, so the order is hers to plan. */
  apartFromStart?: boolean;
  /** Stars on the ice: the pond is done when every star has a block on it (and every fish is eaten). */
  stars?: number;
  /** Prediction ponds: three shown slides, and she taps where each will stop before it goes (`makePrediction`). */
  predict?: boolean;
  /** A second penguin (with a scarf): she chooses which to slide, and each is a stop for the other (`solvePair`). */
  pal?: boolean;
  puzzles: number;
  name: string;
}

export const PLANS: SlidePlan[] = [
  { cols: 5, rows: 4, fish: 1, soft: 0, rocks: 3, moves: [1, 2], fair: true, maxSingles: 1, puzzles: 3, name: 'Slide to the fish in one or two slides' },
  { cols: 6, rows: 4, fish: 1, soft: 0, rocks: 4, moves: [2, 3], fair: true, puzzles: 3, name: 'Plan two or three slides; rocks are the only way to stop' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 5, moves: [3, 4], fair: true, puzzles: 3, name: 'Three or four slides around the rocks' },
  { cols: 6, rows: 5, fish: 2, soft: 0, rocks: 5, moves: [3, 5], fair: true, puzzles: 2, name: 'Two fish to collect, in any order' },
  { cols: 7, rows: 5, fish: 2, soft: 2, rocks: 5, moves: [4, 6], puzzles: 2, name: 'Soft snow stops the penguin: use it to plan a longer route' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 4, blocks: 1, moves: [3, 5], puzzles: 2, name: 'Push an ice block: it skates until it bumps into something, so park it to make a stop' },
  { cols: 6, rows: 5, fish: 2, soft: 0, rocks: 4, blocks: 1, moves: [4, 6], puzzles: 2, name: 'Park an ice block to collect two fish: plan how each new stopping place helps the route' },
  { cols: 6, rows: 5, fish: 2, soft: 1, rocks: 4, blocks: 1, moves: [4, 6], puzzles: 2, name: 'Park a block and use soft snow to stop on a route to both fish' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 3, blocks: 2, pairedBlocks: true, moves: [6, 9], puzzles: 2, name: 'Use two blocks to plan stopping places on the way to a fish' },
  { cols: 7, rows: 5, fish: 3, soft: 0, rocks: 5, moves: [5, 8], apartFromStart: true, puzzles: 2, name: 'Three fish: plan which to eat first, second and third' },
  { cols: 5, rows: 4, fish: 1, soft: 0, rocks: 3, moves: [3, 3], predict: true, puzzles: 2, name: 'Where will it stop? An arrow shows the slide; tap where the penguin will stop (two ponds, three slides each)' },
  { cols: 6, rows: 5, fish: 0, soft: 1, rocks: 3, blocks: 1, stars: 1, moves: [3, 6], puzzles: 2, name: 'A block onto the star: plan where to push the ice block from so it stops on the star' },
  { cols: 6, rows: 5, fish: 1, soft: 0, rocks: 4, pal: true, moves: [4, 7], puzzles: 2, name: 'Two penguins: choose which to slide, and park one as a stop for the other' },
];

export const LEVELS: BandLevels = {
  // Level 11 (Where will it stop?) is the easier step between 2 and 3.
  preschool: { min: 1, max: 11, order: [1, 2, 11] },
  prek: { min: 1, max: 11, order: [1, 2, 11, 3, 4] },
  // Level 12 (A block onto the star) follows 10; 11 is the younger bands' prediction step.
  // Level 13 (Two penguins) is the top.
  school: { min: 2, max: 13, order: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Cell {
  x: number;
  y: number;
}

export interface SlidePuzzle {
  cols: number;
  rows: number;
  rocks: Cell[];
  soft: Cell[];
  /** Ice blocks where they start; absent on the boards without any. */
  blocks?: Cell[];
  /** Star marks on the ice, each needing a block parked on it; absent on the boards without any. */
  stars?: Cell[];
  start: Cell;
  /** The second penguin's start, on the two-penguin ponds; either penguin may eat the fish. */
  pal?: Cell;
  fish: Cell[];
  /** The fewest slides that eat every fish. */
  best: number;
}

/** Small authored ponds: freezing either block makes the best route worse or impossible. */
export const PAIRED_BLOCK_PONDS: readonly SlidePuzzle[] = [{"cols":6,"rows":5,"rocks":[{"x":5,"y":3},{"x":3,"y":3},{"x":4,"y":1}],"soft":[],"blocks":[{"x":1,"y":3},{"x":3,"y":2}],"start":{"x":0,"y":3},"fish":[{"x":2,"y":3}],"best":9},{"cols":6,"rows":5,"rocks":[{"x":5,"y":3},{"x":5,"y":4},{"x":4,"y":3}],"soft":[],"blocks":[{"x":0,"y":3},{"x":5,"y":1}],"start":{"x":4,"y":4},"fish":[{"x":0,"y":0}],"best":9},{"cols":6,"rows":5,"rocks":[{"x":4,"y":2},{"x":3,"y":0},{"x":0,"y":0}],"soft":[],"blocks":[{"x":2,"y":2},{"x":1,"y":2}],"start":{"x":1,"y":4},"fish":[{"x":1,"y":0}],"best":7},{"cols":6,"rows":5,"rocks":[{"x":0,"y":0},{"x":5,"y":1},{"x":0,"y":2}],"soft":[],"blocks":[{"x":4,"y":3},{"x":4,"y":4}],"start":{"x":3,"y":2},"fish":[{"x":0,"y":1}],"best":6}];

/** 0 right, 1 down, 2 left, 3 up. */
export type Dir = 0 | 1 | 2 | 3;
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];
const key = (c: Cell) => `${c.x},${c.y}`;

/** Which way a tap on the ice sends the penguin: the side of it the tap is on, along the longer way. */
export const tapDirection = (dx: number, dy: number): Dir => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3);

/** The cell beside `from` in direction `dir`: where the how-to card's ghost finger taps to send the penguin that way. */
export const beside = (from: Cell, dir: Dir): Cell => ({ x: from.x + DX[dir], y: from.y + DY[dir] });

/** Where a slide stops, and every cell it passes over on the way (including where it stops). */
export function slide(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[] = p.blocks ?? []): { to: Cell; passed: Cell[] } {
  const rocks = new Set([...p.rocks, ...blocks].map(key));
  const soft = new Set(p.soft.map(key));
  let x = from.x;
  let y = from.y;
  const passed: Cell[] = [];
  for (;;) {
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    if (nx < 0 || ny < 0 || nx >= p.cols || ny >= p.rows || rocks.has(`${nx},${ny}`)) break;
    x = nx;
    y = ny;
    passed.push({ x, y });
    if (soft.has(`${x},${y}`)) break;
  }
  return { to: { x, y }, passed };
}

/** Which fish a slide eats, as a bit mask over `p.fish`. */
export function eaten(p: SlidePuzzle, passed: Cell[]): number {
  let mask = 0;
  p.fish.forEach((f, i) => {
    if (passed.some((c) => c.x === f.x && c.y === f.y)) mask |= 1 << i;
  });
  return mask;
}

/** Where an ice block that is pushed from `from` ends up, or null when it cannot move at all. */
function skate(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[]): Cell | null {
  const stops = new Set([...p.rocks, ...blocks, ...p.fish].map(key));
  const soft = new Set(p.soft.map(key));
  let { x, y } = from;
  for (;;) {
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    if (nx < 0 || ny < 0 || nx >= p.cols || ny >= p.rows || stops.has(`${nx},${ny}`)) break;
    x = nx;
    y = ny;
    if (soft.has(`${x},${y}`)) break;
  }
  return x === from.x && y === from.y ? null : { x, y };
}

/** One move of the penguin: a slide, or (standing beside a block that can move) a push. */
export interface Move {
  /** Where the penguin ends up (unchanged by a push). */
  to: Cell;
  /** Every cell the penguin passes, including where it stops; empty for a push. */
  passed: Cell[];
  /** Where every block is afterwards. */
  blocks: Cell[];
  /** The block that was pushed, if one was. */
  pushed: { index: number; to: Cell } | null;
}

/** What a tap in `dir` does: null when nothing moves (a bump), never a mistake. */
export function move(p: SlidePuzzle, from: Cell, dir: Dir, blocks: Cell[] = p.blocks ?? []): Move | null {
  const { to, passed } = slide(p, from, dir, blocks);
  if (passed.length) return { to, passed, blocks, pushed: null };
  const ahead = beside(from, dir);
  const index = blocks.findIndex((b) => b.x === ahead.x && b.y === ahead.y);
  if (index < 0) return null;
  const dest = skate(p, ahead, dir, blocks);
  if (!dest) return null;
  return { to: from, passed: [], blocks: blocks.map((b, i) => (i === index ? dest : b)), pushed: { index, to: dest } };
}

const blockKey = (blocks: Cell[]) => blocks.map(key).sort().join(';');

/** Whether a pond is finished: every fish eaten (`have`) and every star covered by a block. */
export function solved(p: SlidePuzzle, have: number, blocks: Cell[]): boolean {
  if (have !== (1 << p.fish.length) - 1) return false;
  return (p.stars ?? []).every((s) => blocks.some((b) => b.x === s.x && b.y === s.y));
}

/**
 * The fewest slides from here (with `have` fish already eaten) to eat them all, and the first
 * slide of one such route; `moves` is -1 when the fish can't be reached any more.
 */
export function solve(p: SlidePuzzle, from: Cell, have = 0, blocks: Cell[] = p.blocks ?? []): { moves: number; first: Dir | -1 } {
  if (solved(p, have, blocks)) return { moves: 0, first: -1 };
  const seen = new Set<string>([`${key(from)},${have},${blockKey(blocks)}`]);
  let frontier: { at: Cell; have: number; blocks: Cell[]; first: Dir | -1 }[] = [{ at: from, have, blocks, first: -1 }];
  for (let depth = 1; frontier.length && depth <= 30; depth++) {
    const next: typeof frontier = [];
    for (const s of frontier) {
      for (const dir of [0, 1, 2, 3] as Dir[]) {
        const m = move(p, s.at, dir, s.blocks);
        if (!m) continue;
        const h = s.have | eaten(p, m.passed);
        const first = s.first === -1 ? dir : s.first;
        if (solved(p, h, m.blocks)) return { moves: depth, first };
        const k = `${key(m.to)},${h},${blockKey(m.blocks)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ at: m.to, have: h, blocks: m.blocks, first });
      }
    }
    frontier = next;
  }
  return { moves: -1, first: -1 };
}

/**
 * Whether some run of slides from the start leaves the penguin where it can no longer reach every
 * fish (only undo would help). Walks every state reachable from the start.
 */
export function hasDeadEnd(p: SlidePuzzle): boolean {
  const start = { at: p.start, have: 0, blocks: p.blocks ?? [] };
  const seen = new Set<string>([`${key(start.at)},0,${blockKey(start.blocks)}`]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift()!;
    if (solved(p, s.have, s.blocks)) continue;
    if (solve(p, s.at, s.have, s.blocks).moves === -1) return true;
    for (const dir of [0, 1, 2, 3] as Dir[]) {
      const m = move(p, s.at, dir, s.blocks);
      if (!m) continue;
      const next = { at: m.to, have: s.have | eaten(p, m.passed), blocks: m.blocks };
      const k = `${key(next.at)},${next.have},${blockKey(next.blocks)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(next);
    }
  }
  return false;
}

/** Whether one slide from the start eats two or more fish at once. */
export function eatsTwoFromStart(p: SlidePuzzle): boolean {
  return ([0, 1, 2, 3] as Dir[]).some((dir) => {
    const m = move(p, p.start, dir);
    const mask = m ? eaten(p, m.passed) : 0;
    return (mask & (mask - 1)) !== 0;
  });
}

/** Which penguin slides (0 the first, 1 the scarf penguin), and which way. */
export interface PairStep {
  who: 0 | 1;
  dir: Dir;
}

/**
 * One slide on a two-penguin pond: penguin `who` slides from `spots[who]`, the other one stopping it
 * like a rock. Null when it cannot move (a bump); penguins never push each other.
 */
export function movePair(p: SlidePuzzle, spots: readonly Cell[], who: 0 | 1, dir: Dir): { spots: Cell[]; passed: Cell[] } | null {
  const { to, passed } = slide(p, spots[who], dir, [spots[1 - who]]);
  if (!passed.length) return null;
  return { spots: spots.map((c, i) => (i === who ? to : c)), passed };
}

/** The fewest slides of either penguin to eat every fish from here, and the first of one such route (null when none is left). */
export function solvePair(p: SlidePuzzle, spots: readonly Cell[], have = 0): { moves: number; first: PairStep | null } {
  if (solved(p, have, [])) return { moves: 0, first: null };
  const state = (s: readonly Cell[], h: number) => `${key(s[0])},${key(s[1])},${h}`;
  const seen = new Set<string>([state(spots, have)]);
  let frontier: { spots: readonly Cell[]; have: number; first: PairStep | null }[] = [{ spots, have, first: null }];
  for (let depth = 1; frontier.length && depth <= 30; depth++) {
    const next: typeof frontier = [];
    for (const s of frontier) {
      for (const who of [0, 1] as const) {
        for (const dir of [0, 1, 2, 3] as Dir[]) {
          const m = movePair(p, s.spots, who, dir);
          if (!m) continue;
          const h = s.have | eaten(p, m.passed);
          const first = s.first ?? { who, dir };
          if (solved(p, h, [])) return { moves: depth, first };
          const k = state(m.spots, h);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ spots: m.spots, have: h, first });
        }
      }
    }
    frontier = next;
  }
  return { moves: -1, first: null };
}

/** How many slides each penguin alone needs with the other frozen like a rock (-1: it cannot reach every fish). */
export function alone(p: SlidePuzzle): [number, number] {
  const pal = p.pal!;
  return [solve({ ...p, rocks: [...p.rocks, pal], pal: undefined }, p.start).moves, solve({ ...p, rocks: [...p.rocks, p.start], pal: undefined }, pal).moves];
}

/** A pond, unlike the ones already made this round when the plan caps single-slide ponds. */
export function makePuzzle(plan: SlidePlan, rng: Rng, earlier: readonly SlidePuzzle[] = []): SlidePuzzle {
  const singlesLeft = plan.maxSingles === undefined || earlier.filter((e) => e.best === 1).length < plan.maxSingles;
  if (plan.pairedBlocks) {
    const p = rng.pick(PAIRED_BLOCK_PONDS), flipX = rng.chance(0.5), flipY = rng.chance(0.5);
    const cell = (c: Cell): Cell => ({x: flipX ? p.cols - 1 - c.x : c.x, y: flipY ? p.rows - 1 - c.y : c.y});
    return {...p, start: cell(p.start), rocks: p.rocks.map(cell), soft: p.soft.map(cell), fish: p.fish.map(cell), blocks: p.blocks!.map(cell)};
  }
  for (let attempt = 0; attempt < 2000; attempt++) {
    const cells: Cell[] = [];
    for (let x = 0; x < plan.cols; x++) for (let y = 0; y < plan.rows; y++) cells.push({ x, y });
    const pool = rng.shuffle(cells);
    const start = pool.pop()!;
    const pal = plan.pal ? pool.pop()! : undefined;
    const rocks = pool.splice(0, plan.rocks);
    const soft = pool.splice(0, plan.soft);
    const fish = pool.splice(0, plan.fish);
    const blocks = pool.splice(0, plan.blocks ?? 0);
    // Stars come from what is left, so never under a rock, a snow patch, a block or the penguin.
    const stars = pool.splice(0, plan.stars ?? 0);
    const p: SlidePuzzle = { cols: plan.cols, rows: plan.rows, rocks, soft, ...(blocks.length ? { blocks } : {}), ...(stars.length ? { stars } : {}), start, ...(pal ? { pal } : {}), fish, best: 0 };
    const { moves } = pal ? solvePair(p, [start, pal]) : solve(p, start);
    if (moves < plan.moves[0] || moves > plan.moves[1]) continue;
    if (moves === 1 && !singlesLeft) continue;
    // Soft snow should matter: without it, the puzzle would play differently.
    if (plan.soft && solve({ ...p, soft: [] }, start).moves === moves) continue;
    // Blocks should matter: with them frozen like rocks, the fish must be out of reach or take longer.
    if (blocks.length) {
      const frozen = solve({ ...p, rocks: [...rocks, ...blocks], blocks: [] }, start).moves;
      if (frozen !== -1 && frozen <= moves) continue;
    }
    // Both penguins should matter: with either one frozen like a rock, the other alone takes longer or cannot reach the fish.
    if (pal && alone(p).some((m) => m !== -1 && m <= moves)) continue;
    if (plan.apartFromStart && eatsTwoFromStart(p)) continue;
    if (plan.fair && hasDeadEnd(p)) continue;
    return { ...p, best: moves };
  }
  throw new Error('no slide puzzle');
}

/** One shown slide of a prediction pond: which way it goes from where, and where it stops. */
export interface ShownSlide {
  dir: Dir;
  from: Cell;
  to: Cell;
}

/** A prediction pond and the slides it shows, in order; only the last one eats the fish. */
export interface PredictionPond {
  puzzle: SlidePuzzle;
  slides: ShownSlide[];
}

/** How many slides a prediction pond shows. */
export const PREDICTIONS = 3;

/**
 * A prediction pond: three shown slides that each really move the penguin (never a bump or a push), never straight back
 * the way it came, with the fish passed only on the last; at least two of the three stop further away than the cell
 * beside the penguin, so "right next to it" is not always the answer.
 */
export function makePrediction(plan: SlidePlan, rng: Rng): PredictionPond {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const cells: Cell[] = [];
    for (let x = 0; x < plan.cols; x++) for (let y = 0; y < plan.rows; y++) cells.push({ x, y });
    const pool = rng.shuffle(cells);
    const start = pool.pop()!;
    const rocks = pool.splice(0, plan.rocks);
    const p: SlidePuzzle = { cols: plan.cols, rows: plan.rows, rocks, soft: [], start, fish: [], best: PREDICTIONS };
    const slides: ShownSlide[] = [];
    const passed: Cell[][] = [];
    let at = start;
    for (let n = 0; n < PREDICTIONS; n++) {
      const last = slides[slides.length - 1];
      const ways = ([0, 1, 2, 3] as Dir[]).filter((d) => slide(p, at, d).passed.length && (!last || d !== (last.dir + 2) % 4));
      if (!ways.length) break;
      const dir = rng.pick(ways);
      const s = slide(p, at, dir);
      slides.push({ dir, from: at, to: s.to });
      passed.push(s.passed);
      at = s.to;
    }
    if (slides.length < PREDICTIONS) continue;
    if (slides.filter((s) => far(s) > 1).length < 2) continue;
    const seen = new Set([start, ...passed[0], ...passed[1]].map(key));
    const spots = passed[2].filter((c) => !seen.has(key(c)));
    if (!spots.length) continue;
    return { puzzle: { ...p, fish: [rng.pick(spots)] }, slides };
  }
  throw new Error('no prediction pond');
}

const far = (s: ShownSlide) => Math.abs(s.to.x - s.from.x) + Math.abs(s.to.y - s.from.y);

/** What stopped a slide that ended at `to` going `dir`: a rock (and which cell it is on), or the pond's edge. */
export function stopper(p: SlidePuzzle, to: Cell, dir: Dir): { kind: 'rock'; cell: Cell } | { kind: 'edge' } {
  const next = beside(to, dir);
  return p.rocks.some((r) => r.x === next.x && r.y === next.y) ? { kind: 'rock', cell: next } : { kind: 'edge' };
}

/** The pond cell under a point in board units, clamped to the pond. */
export const cellAt = (p: { cols: number; rows: number }, x: number, y: number, size: number): Cell => ({
  x: Math.min(p.cols - 1, Math.max(0, Math.floor(x / size))),
  y: Math.min(p.rows - 1, Math.max(0, Math.floor(y / size))),
});

/** What a pond's rocks look like; every look is a rock to the stop rule. */
export const ROCK_LOOKS = ['rock', 'igloo', 'snowman'] as const;
export type RockLook = (typeof ROCK_LOOKS)[number];
/** The fish colours a pond can have. */
export const FISH_COLORS = ['orange', 'pink', 'teal'] as const;
export type FishColor = (typeof FISH_COLORS)[number];

/** A pond's seeded look: how its rocks are drawn and its fish's colour. */
export const pickLook = (rng: Rng): { rock: RockLook; fish: FishColor } => ({ rock: rng.pick(ROCK_LOOKS), fish: rng.pick(FISH_COLORS) });

/** Extra slides allowed before the hint arrow appears. */
export const HINT_AFTER = 3;
