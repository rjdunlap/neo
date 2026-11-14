import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { POOLS } from './pools.ts';

export type Removal = readonly number[];
export interface Puzzle {
  rows: number;
  ranks: number[];
  /** Level 5's cover lift: an open card may go with the one card under it when nothing else lies on that card. */
  lift?: true;
  /** Level 6's shelf: this many open spare cards after the pyramid's, none of them covered. */
  shelf?: number;
  /** Level 8's spare columns (after Giza): this many columns of spare cards after the pyramid's, each card covered by the
   * one in front of it, so only a column's front card is open. */
  columns?: number;
}
/**
 * Each plan's band for the deal dial: the exact chance that someone lifting a uniformly random legal removal every turn
 * clears the pyramid (`clearRate`). Level 1 stays a round that cannot go wrong; level 2 has a copy choice that matters;
 * level 3 has several, and level 4 keeps them over a longer route. Bands measured 2026-11-11 (docs/deep-dives/pyramid-solitaire.md, "A deal dial").
 */
export const PLANS = [
  { rows: 3, name: 'Six face-up cards: complements to thirteen', band: { min: 0.95, max: 1 } },
  { rows: 4, name: 'Ten cards: uncover the next pair', band: { min: 0.5, max: 0.95, below: true } },
  { rows: 5, name: 'Fifteen cards: plan through five rows', band: { min: 0.4, max: 0.8 } },
  // Six rows (measured 2026-11-12 over 300 seeds): undialled, the median candidate clears 59% of random play and 73% hold a
  // dead end; dialled, every round lands in the band (median 50%) and reaches at most 61 positions.
  { rows: 6, name: 'Twenty-one cards: spend copies over six rows', band: { min: 0.3, max: 0.75 } },
  // Five rows with the cover lift (measured 2026-11-12 over 300 seeds, LIFT_CHANCE 0.35): undialled the median candidate
  // clears every random play, so the dial does the work; dialled, 298 land in the band (median 67%), the top card is not a
  // king on 157, 290 cannot clear without a lift, at most 30 positions, slowest deal 5 ms.
  { rows: 5, name: 'Lift the cover: a card with the one under it', band: { min: 0.4, max: 0.8 }, lift: true },
  // Five rows and a shelf of five open spare cards, strict rule. Measured 2026-11-12 over 300 seeds with SHELF_CHANCE 0.25:
  // undialled the median candidate clears 18% of random play (285 hold a dead end; spending spares early is the usual
  // loss); dialled, all 300 land in the band (median 50%), the top leaves with a spare on 258, at most 248 positions,
  // slowest deal 7 ms.
  { rows: 5, name: 'The shelf: five open spare cards', band: { min: 0.4, max: 0.8 }, shelf: 5 },
  // The classic pyramid: seven rows, twenty-eight cards from one pack, no stock, strict rule (no cover lift).
  { rows: 7, name: 'The classic pyramid: twenty-eight cards, seven rows', band: { min: 0.3, max: 0.7 } },
  // Five rows and three columns of two spare cards, strict rule: only a column's front card is open, after Giza. Measured
  // 2026-11-13 over 300 seeds on the plain walk (no column step): undialled the median candidate clears 72% of random play
  // and 258 hold a dead end; dialled, all 300 land in the band (median 50%), at most 300 positions, at most 3 kings,
  // slowest deal under 1 ms.
  {
    rows: 5,
    name: 'Three columns: dig into two-card spare columns',
    band: { min: 0.3, max: 0.7 },
    columns: 3,
    depth: 2,
  },
  // Lesson deals (levels 9-10): designed puzzles frozen in pools.ts by scripts/pyramid-lesson-search.mjs, each teaching one
  // copy choice. They are dealt from the pool, not the dial, so the band is never read.
  {
    rows: 4,
    name: 'One way in: one safe first pair among three',
    band: { min: 0, max: 1 },
    lesson: 'one-way',
  },
  {
    rows: 5,
    name: 'Count the copies: spend the copy that buries a partner',
    band: { min: 0, max: 1 },
    lesson: 'copies',
  },
] as const;
/** How often the generator's backward walk takes a cover-lift step when one is open (level 5 only). */
export const LIFT_CHANCE = 0.35;
/** How often a level-6 step pairs an open pyramid card with a spare from the shelf while other pyramid pairs are open. */
export const SHELF_CHANCE = 0.25;
/** Candidate deals the dial draws before it keeps the one closest to the band. */
export const CANDIDATES = 40;
/** A real pack: no rank more than four times, so the paper version deals as shown and counting a rank is true. */
export const PACK_LIMIT = 4;

/** Each lesson arrives before the board that needs it: one way in after level 2, count the copies after level 3. */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 10, order: [1, 2, 9, 3, 10, 4, 5, 6, 7, 8] } };
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const countFor = (rows: number) => (rows * (rows + 1)) / 2;
export const fullMask = (rows: number) => (1 << countFor(rows)) - 1;
/** Every card of a deal, pyramid and shelf (the shelf's bits follow the pyramid's). */
export const startMask = (p: Puzzle) => (1 << p.ranks.length) - 1;
/** The first spare card's index (shelf or columns); a puzzle without spares has none. */
export const shelfStart = (p: Puzzle) => countFor(p.rows);
export const at = (row: number, col: number) => (row * (row + 1)) / 2 + col;
/** Level 8: a spare card's column and its place in it (0 at the back). */
export function columnOf(p: Puzzle, i: number): { column: number; depth: number } | null {
  if (!p.columns || i < shelfStart(p)) return null;
  const depth = (p.ranks.length - shelfStart(p)) / p.columns,
    j = i - shelfStart(p);
  return { column: Math.floor(j / depth), depth: j % depth };
}
export const present = (mask: number, i: number) => !!(mask & (1 << i));
export function covers(rows: number, i: number): number[] {
  for (let row = 0; row < rows; row++)
    if (i >= at(row, 0) && i <= at(row, row)) {
      const col = i - at(row, 0);
      return row === rows - 1 ? [] : [at(row + 1, col), at(row + 1, col + 1)];
    }
  return [];
}
const lists = new WeakMap<Puzzle, readonly (readonly number[])[]>();
/**
 * The cards lying on each card, one list per card: the pyramid's two from the row below as `covers` gives them, a shelf
 * card's none. Levels 1-5 reproduce `covers` exactly; level 8's column cards each lie under the next card in their column.
 */
export function coverList(p: Puzzle): readonly (readonly number[])[] {
  let list = lists.get(p);
  if (!list) {
    list = p.ranks.map((_, i) => {
      if (i < shelfStart(p)) return covers(p.rows, i);
      // Level 8: a column's card lies under the next one in the same column (back first, front last).
      const place = columnOf(p, i);
      if (!place) return [];
      const depth = (p.ranks.length - shelfStart(p)) / p.columns!;
      return place.depth < depth - 1 ? [i + 1] : [];
    });
    lists.set(p, list);
  }
  return list;
}
export const exposed = (p: Puzzle, mask: number, i: number) =>
  i >= 0 && i < p.ranks.length && present(mask, i) && coverList(p)[i].every((k) => !present(mask, k));
export const remove = (mask: number, move: Removal) => move.reduce((m, i) => m & ~(1 << i), mask);
/** The cards `i` lies on: one or two in the row above (a shelf card lies on none). */
export function under(p: Puzzle, i: number): number[] {
  return coverList(p).flatMap((list, k) => (list.includes(i) ? [k] : []));
}
/** Cards present under open card `a` that `a` alone still lies on: the cards a cover lift could take with it. */
export function liftable(p: Puzzle, mask: number, a: number): number[] {
  if (!exposed(p, mask, a)) return [];
  return under(p, a).filter(
    (b) => present(mask, b) && coverList(p)[b].every((k) => k === a || !present(mask, k)),
  );
}
/** Legal removals; on a lift level, cover pairs come after the open ones, always as `[open card, covered card]`. */
export function moves(p: Puzzle, mask: number): Removal[] {
  const free = p.ranks.map((_, i) => i).filter((i) => exposed(p, mask, i));
  const open: Removal[] = free.flatMap((a, k) =>
    p.ranks[a] === 13
      ? [[a]]
      : free
          .slice(k + 1)
          .filter((b) => p.ranks[a] + p.ranks[b] === 13)
          .map((b) => [a, b]),
  );
  if (!p.lift) return open;
  return open.concat(
    free.flatMap((a) =>
      liftable(p, mask, a)
        .filter((b) => p.ranks[a] + p.ranks[b] === 13)
        .map((b) => [a, b]),
    ),
  );
}
/** Exact finite search: every move removes at least one card. Cache belongs to this deal. */
export function solver(p: Puzzle) {
  const memo = new Map<number, readonly Removal[] | null>();
  const solve = (mask: number): readonly Removal[] | null => {
    if (mask === 0) return [];
    if (memo.has(mask)) return memo.get(mask)!;
    for (const move of moves(p, mask)) {
      const tail = solve(remove(mask, move));
      if (tail) {
        const route = [move, ...tail];
        memo.set(mask, route);
        return route;
      }
    }
    memo.set(mask, null);
    return null;
  };
  return solve;
}
/**
 * Exact chance of clearing when every turn takes a uniformly random legal removal: a stand-in for a player who does not
 * plan. The same memoised walk over remaining-card masks as `solver` (at most 39 positions at five rows, 71 at six,
 * 483 with the shelf).
 */
export function clearRate(p: Puzzle, mask = startMask(p)): number {
  const memo = new Map<number, number>();
  const walk = (m: number): number => {
    if (m === 0) return 1;
    const cached = memo.get(m);
    if (cached !== undefined) return cached;
    const options = moves(p, m);
    const rate = options.length
      ? options.reduce((sum, move) => sum + walk(remove(m, move)), 0) / options.length
      : 0;
    memo.set(m, rate);
    return rate;
  };
  return walk(mask);
}
export interface Candidate {
  puzzle: Puzzle;
  /** Kings the clearing order forced (a lone open card, always including the top) and kings added by chance. */
  forcedKings: number;
  chanceKings: number;
}
/**
 * One candidate: assign complements along a legal seeded clearing order, so every deal clears; no stock or hidden
 * information. A king goes where the order forces one (a lone open card) plus at most one by chance, and a pair's rank is
 * drawn only from ranks that would not deal a fifth of either rank. Level 1 adds no chance king, so its six cards are
 * always two pairs and two kings.
 */
export function dealCandidate(level: number, rng: Rng): Candidate {
  const plan = planFor(level),
    rows = plan.rows,
    shelf = 'shelf' in plan ? plan.shelf : 0,
    spares = 'columns' in plan ? plan.columns * plan.depth : shelf,
    p: Puzzle = { rows, ranks: Array<number>(countFor(rows) + spares).fill(0) },
    used = Array<number>(14).fill(0);
  if ('lift' in plan) p.lift = true;
  // Level 6: the shelf's cards are open from the start, so the backward walk may pair any of them with a pyramid card
  // (the top included) or with each other; nothing else in the walk changes, so levels 1-5 deal exactly as before.
  if (shelf) p.shelf = shelf;
  // Level 8: the plain walk below already follows the column covers through `exposed`; no draw changes for levels 1-7.
  if ('columns' in plan) p.columns = plan.columns;
  let mask = startMask(p),
    forcedKings = 0,
    chanceKings = 0;
  while (mask) {
    const free = rng.shuffle(p.ranks.map((_, i) => i).filter((i) => exposed(p, mask, i)));
    // Level 5: sometimes (and always instead of a forced king) the step lifts an open card with the one card under it.
    // Every draw here sits behind the flag, so levels 1-4 deal exactly as before.
    if (p.lift) {
      const covered = free.flatMap((a) => liftable(p, mask, a).map((b) => [a, b] as const));
      if (covered.length && (free.length === 1 || rng.chance(LIFT_CHANCE))) {
        const [a, b] = rng.pick(covered);
        const rank = rng.pick(
          Array.from({ length: 12 }, (_, k) => k + 1).filter(
            (r) => used[r] < PACK_LIMIT && used[13 - r] < PACK_LIMIT,
          ),
        );
        p.ranks[a] = rank;
        p.ranks[b] = 13 - rank;
        used[rank]++;
        used[13 - rank]++;
        mask = remove(mask, [a, b]);
        continue;
      }
    }
    // Level 6: the walk spends shelf cards only now and then, so spares last into the late pyramid: a lone open pyramid
    // card (the top included) takes a spare instead of being forced to a king, and spares left when the pyramid is clear
    // pair with each other. Every draw here sits behind the flag, so levels 1-5 deal exactly as before.
    if (shelf) {
      const pyramid = free.filter((i) => i < shelfStart(p)),
        spare = free.filter((i) => i >= shelfStart(p));
      const pair =
        spare.length && (pyramid.length === 1 || (pyramid.length > 1 && rng.chance(SHELF_CHANCE)))
          ? [pyramid[0], spare[0]]
          : pyramid.length > 1
            ? [pyramid[0], pyramid[1]]
            : spare.length > 1 && !pyramid.length
              ? [spare[0], spare[1]]
              : null;
      if (pair) {
        const rank = rng.pick(
          Array.from({ length: 12 }, (_, k) => k + 1).filter(
            (r) => used[r] < PACK_LIMIT && used[13 - r] < PACK_LIMIT,
          ),
        );
        p.ranks[pair[0]] = rank;
        p.ranks[pair[1]] = 13 - rank;
        used[rank]++;
        used[13 - rank]++;
        mask = remove(mask, pair);
        continue;
      }
    }
    const a = free[0];
    const forced = free.length === 1;
    // Level 1 never adds one: on three rows the forced kings alone always come to two (the top, and one lone open card).
    const chance = !forced && level > 1 && chanceKings === 0 && used[13] < PACK_LIMIT && rng.chance(0.15);
    if (forced || chance) {
      p.ranks[a] = 13;
      used[13]++;
      if (forced) forcedKings++;
      else chanceKings++;
      mask = remove(mask, [a]);
    } else {
      const b = free[1],
        open = Array.from({ length: 12 }, (_, k) => k + 1).filter(
          (r) => used[r] < PACK_LIMIT && used[13 - r] < PACK_LIMIT,
        ),
        rank = rng.pick(open);
      p.ranks[a] = rank;
      p.ranks[b] = 13 - rank;
      used[rank]++;
      used[13 - rank]++;
      mask = remove(mask, [a, b]);
    }
  }
  return { puzzle: p, forcedKings, chanceKings };
}
/** How far a clear rate sits outside the plan's band (0 inside it). */
export function bandDistance(level: number, rate: number): number {
  const band = planFor(level).band;
  const top = 'below' in band && band.below ? band.max - 1e-9 : band.max;
  return rate < band.min ? band.min - rate : rate > top ? rate - top : 0;
}
/**
 * The deal dial: draw up to `CANDIDATES` seeded candidates from the round's one rng and keep the first whose clear rate
 * is in the level's band, or the closest if none is, so a seed still gives exactly one deal. A candidate with a fifth king
 * (forced by the order) is not a pack and is skipped.
 */
export function makePuzzle(level: number, rng: Rng): Puzzle {
  const plan = planFor(level);
  // Levels 9-10 deal a frozen lesson deal; levels 1-8 make no new draw, so they deal exactly as before.
  if ('lesson' in plan) return decodeDeal(plan.rows, rng.pick(POOLS[plan.lesson]));
  let best: Puzzle | null = null,
    bestDistance = Infinity;
  // Kings are forced by the clearing order, so a rare deep deal forces a fifth; it is skipped, not counted, and drawing
  // stops at a bound that a pack-legal deal always reaches first in practice.
  for (let k = 0, tries = 0; (k < CANDIDATES || !best) && tries < 10 * CANDIDATES; tries++) {
    const { puzzle } = dealCandidate(level, rng);
    if (puzzle.ranks.filter((r) => r === 13).length > PACK_LIMIT) continue;
    k++;
    const distance = bandDistance(level, clearRate(puzzle));
    if (distance === 0) return puzzle;
    if (distance < bestDistance) [best, bestDistance] = [puzzle, distance];
  }
  return best ?? dealCandidate(level, rng).puzzle;
}
/** A frozen deal's card letters, rank 1 to 13. */
export const DEAL_LETTERS = 'A23456789TJQK';
export const encodeDeal = (p: Puzzle) => p.ranks.map((r) => DEAL_LETTERS[r - 1]).join('');
export const decodeDeal = (rows: number, deal: string): Puzzle => ({
  rows,
  ranks: [...deal].map((c) => DEAL_LETTERS.indexOf(c) + 1),
});
/** Every card `c` lies on, directly or through others: none of them can open while `c` is present. */
export function buried(p: Puzzle, c: number): Set<number> {
  const seen = new Set<number>(),
    todo = under(p, c);
  while (todo.length) {
    const k = todo.pop()!;
    if (!seen.has(k)) {
      seen.add(k);
      todo.push(...under(p, k));
    }
  }
  return seen;
}
/**
 * Cards that have lost their partner (strict rule): a present card other than a king for which every present card of the
 * complement rank is buried under it, so the two can never be open together and the position cannot clear.
 */
export function stranded(p: Puzzle, mask: number): number[] {
  return p.ranks.flatMap((rank, c) => {
    if (rank === 13 || !present(mask, c)) return [];
    const partners = p.ranks.flatMap((r, y) => (r === 13 - rank && present(mask, y) ? [y] : []));
    const below = buried(p, c);
    return partners.length && partners.every((y) => below.has(y)) ? [c] : [];
  });
}
/** The card a lesson line names after a losing removal: the one stranded card, or null when none or several are. */
export function lessonCard(p: Puzzle, mask: number): number | null {
  const s = stranded(p, mask);
  return s.length === 1 ? s[0] : null;
}
/** Opening removals that keep the deal clearable, and those that lose it. */
export function openings(p: Puzzle) {
  const solve = solver(p),
    start = startMask(p),
    all = moves(p, start);
  return {
    safe: all.filter((m) => solve(remove(start, m))),
    losing: all.filter((m) => !solve(remove(start, m))),
  };
}
/** Every losing opening leaves exactly one stranded card, so the lesson line always names the right one. */
const lessonsNamed = (p: Puzzle) =>
  openings(p).losing.every((m) => lessonCard(p, remove(startMask(p), m)) !== null);
/**
 * Level 9 *One way in*: a deal that clears, opens with three or more removals, all pairs (an open king is always safe,
 * so it would be the answer every time), exactly one of them safe, and every losing one strands one named card.
 */
export function oneWayIn(p: Puzzle): boolean {
  const start = startMask(p),
    { safe, losing } = openings(p);
  return (
    !!solver(p)(start) &&
    safe.length === 1 &&
    safe.length + losing.length >= 3 &&
    moves(p, start).every((m) => m.length === 2) &&
    lessonsNamed(p)
  );
}
export interface CopiesShape {
  /** The open copy that buries the second partner: spend it first. */
  keep: number;
  /** The other open copy: pairing it with the easy partner loses. */
  spend: number;
  /** The open partner both copies could take. */
  easy: number;
  /** The covered partner, buried under `keep`. */
  buriedPartner: number;
}
/**
 * Level 10 *Count the copies*: a rank with exactly two copies, both open, and exactly two partners, one open (`easy`) and
 * one covered and buried under one copy (`keep`) but not the other (`spend`). Spending the easy pair with `spend` first
 * strands `keep` over the buried partner; pairing `keep` with `easy` is safe. The deal clears and every losing opening
 * names its stranded card. Returns the first such rank's shape, or null.
 */
export function countTheCopies(p: Puzzle): CopiesShape | null {
  const start = startMask(p),
    solve = solver(p);
  if (!solve(start) || !lessonsNamed(p)) return null;
  for (let rank = 1; rank <= 12; rank++) {
    const copies = p.ranks.flatMap((r, i) => (r === rank ? [i] : [])),
      partners = p.ranks.flatMap((r, i) => (r === 13 - rank ? [i] : []));
    if (copies.length !== 2 || partners.length !== 2 || !copies.every((i) => exposed(p, start, i))) continue;
    const easy = partners.find((i) => exposed(p, start, i)),
      hidden = partners.find((i) => !exposed(p, start, i));
    if (easy === undefined || hidden === undefined) continue;
    for (const [keep, spend] of [copies, [copies[1], copies[0]]]) {
      if (!buried(p, keep).has(hidden) || buried(p, spend).has(hidden)) continue;
      const lose = remove(start, [spend, easy]),
        win = remove(start, [keep, easy]);
      if (!solve(lose) && lessonCard(p, lose) === keep && solve(win))
        return { keep, spend, easy, buriedPartner: hidden };
    }
  }
  return null;
}
/** A rank as the lesson line says it. */
export const rankWord = (rank: number) =>
  ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'][
    rank - 1
  ];
export const rankName = (rank: number) =>
  rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
