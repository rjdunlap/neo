import type { BandLevels } from '../../progress/difficulty';

/**
 * Fence the Field (docs/definitions/fence-the-field.md): dots and boxes on a field of nine plots, three by three, against
 * the pet, from a part-fenced start. A position is a 24-bit set of laid rails; who owns a claimed plot is the scene's
 * business, because what is still to win depends only on the rails.
 *
 * Rails are numbered in reading order, across rails first: across rail `r * 3 + c` runs along the top of row `r`
 * (`r` 0–3, `c` 0–2), down rail `12 + r * 4 + c` along the left of column `c` (`r` 0–2, `c` 0–3).
 */

export const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };

export const RAILS = 24;
export const PLOTS = 9;
export const FULL = (1 << RAILS) - 1;

export interface Plan {
  level: number;
  name: string;
  /** Open rails at the start, inclusive. */
  open: [number, number];
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Close it', open: [6, 9] },
  { level: 2, name: "Don't hand it over", open: [8, 12] },
  { level: 3, name: 'Smallest first', open: [8, 12] },
  { level: 4, name: 'Leave two', open: [9, 12] },
];
export const planFor = (level: number): Plan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

const DESCRIBE = [
  'Close it: claim the plots that are ready, then play out the field',
  "Don't hand it over: find the rail that makes no plot ready",
  'Smallest first: every rail gives something, so give the short run',
  'Leave two: take all but the last two plots of a run',
];
export const describeLevel = (level: number) => DESCRIBE[planFor(level).level - 1];

// ---- the field ----

/** A plot's four rails: top, bottom, left, right. */
export const PLOT_RAILS: readonly (readonly number[])[] = Array.from({ length: PLOTS }, (_, p) => {
  const r = Math.floor(p / 3),
    c = p % 3;
  return [r * 3 + c, (r + 1) * 3 + c, 12 + r * 4 + c, 12 + r * 4 + c + 1];
});

/** The one or two plots a rail borders. */
export const RAIL_PLOTS: readonly (readonly number[])[] = Array.from({ length: RAILS }, (_, e) =>
  PLOT_RAILS.flatMap((rails, p) => (rails.includes(e) ? [p] : [])),
);

/** A rail's two posts on the 4 × 4 post grid, as [x, y] pairs. */
export function railPosts(e: number): [[number, number], [number, number]] {
  if (e < 12) {
    const r = Math.floor(e / 3),
      c = e % 3;
    return [
      [c, r],
      [c + 1, r],
    ];
  }
  const r = Math.floor((e - 12) / 4),
    c = (e - 12) % 4;
  return [
    [c, r],
    [c, r + 1],
  ];
}

const laid = (mask: number, e: number) => (mask & (1 << e)) !== 0;

export function openRails(mask: number): number[] {
  const out: number[] = [];
  for (let e = 0; e < RAILS; e++) if (!laid(mask, e)) out.push(e);
  return out;
}

export function countOpen(mask: number): number {
  let n = 0;
  for (let e = 0; e < RAILS; e++) if (!laid(mask, e)) n++;
  return n;
}

/** How many of a plot's rails are still open. */
export function plotOpen(mask: number, p: number): number {
  let n = 0;
  for (const e of PLOT_RAILS[p]) if (!laid(mask, e)) n++;
  return n;
}

/** Plots not yet fenced all round. */
export function openPlots(mask: number): number {
  let n = 0;
  for (let p = 0; p < PLOTS; p++) if (plotOpen(mask, p) > 0) n++;
  return n;
}

/** A plot with three rails laid. */
export const ready = (mask: number, p: number) => plotOpen(mask, p) === 1;
export const readyPlots = (mask: number): number[] => [...Array(PLOTS).keys()].filter((p) => ready(mask, p));

/** The plots laying open rail `e` fences all round. */
export const completes = (mask: number, e: number): number[] => RAIL_PLOTS[e].filter((p) => ready(mask, p));

// ---- the solver ----

const memo = new Map<number, number>();

/** Forget solved positions (the pool script solves many unrelated ones). */
export const clearSolver = () => memo.clear();

/**
 * The net number of the still-open plots the player to move gains with best play on both sides. A start position has at
 * most 12 open rails, so the search below it visits at most 2¹² positions.
 */
export function value(mask: number): number {
  if (mask === FULL) return 0;
  const known = memo.get(mask);
  if (known !== undefined) return known;
  let best = -Infinity;
  for (let e = 0; e < RAILS; e++) {
    if (laid(mask, e)) continue;
    const k = completes(mask, e).length;
    const after = value(mask | (1 << e));
    const v = k > 0 ? k + after : -after;
    if (v > best) best = v;
  }
  memo.set(mask, best);
  return best;
}

/** How many of the still-open plots the player to move gets with best play: her target, from a start. */
export const best = (mask: number): number => (openPlots(mask) + value(mask)) / 2;

/** How many of the still-open plots the mover ends with after laying `e` and best play from there. */
export function gain(mask: number, e: number): number {
  const k = completes(mask, e).length;
  const after = mask | (1 << e);
  return k > 0 ? k + best(after) : openPlots(after) - best(after);
}

/** Plots of target that laying `e` costs the mover; 0 for a sound rail. */
export const drop = (mask: number, e: number): number => best(mask) - gain(mask, e);
export const sound = (mask: number, e: number): boolean => drop(mask, e) === 0;
export const soundRails = (mask: number): number[] => openRails(mask).filter((e) => sound(mask, e));

// ---- kinds of rail and runs ----

export type Kind = 'claim' | 'safe' | 'give' | 'leave-two';

/** Two neighbouring ready plots whose one open rail is the rail between them. */
function pairLeft(mask: number): boolean {
  for (let e = 0; e < RAILS; e++)
    if (!laid(mask, e) && RAIL_PLOTS[e].length === 2 && RAIL_PLOTS[e].every((p) => ready(mask, p)))
      return true;
  return false;
}

export function kindOf(mask: number, e: number): Kind {
  if (completes(mask, e).length) return 'claim';
  const after = mask | (1 << e);
  const made = RAIL_PLOTS[e].filter((p) => ready(after, p));
  if (!made.length) return 'safe';
  // A give laid while a claim was there to take, leaving two ready plots that share their last rail.
  if (readyPlots(mask).length && pairLeft(after) && !pairLeft(mask)) return 'leave-two';
  return 'give';
}

/** A maximal set of plots with exactly two rails open, joined through open rails: a chain, or a ring with no end. */
export interface Run {
  plots: number[];
  loop: boolean;
}

export function runs(mask: number): Run[] {
  const two = (p: number) => plotOpen(mask, p) === 2;
  const seen = new Set<number>();
  const out: Run[] = [];
  const next = (p: number) =>
    PLOT_RAILS[p]
      .filter((e) => !laid(mask, e))
      .flatMap((e) => RAIL_PLOTS[e].filter((q) => q !== p && two(q)));
  for (let p = 0; p < PLOTS; p++) {
    if (!two(p) || seen.has(p)) continue;
    const plots: number[] = [];
    const todo = [p];
    seen.add(p);
    while (todo.length) {
      const q = todo.pop()!;
      plots.push(q);
      for (const n of next(q))
        if (!seen.has(n)) {
          seen.add(n);
          todo.push(n);
        }
    }
    plots.sort((a, b) => a - b);
    out.push({ plots, loop: plots.length >= 4 && plots.every((q) => next(q).length === 2) });
  }
  return out;
}

/** The run a give opens: the one holding a plot that `e` makes ready. */
export function runOf(mask: number, e: number): Run | null {
  const hit = RAIL_PLOTS[e].filter((p) => plotOpen(mask, p) === 2);
  if (!hit.length) return null;
  return runs(mask).find((r) => r.plots.includes(hit[0])) ?? null;
}

const shortest = (mask: number): number => Math.min(...runs(mask).map((r) => r.plots.length));

/** A give into a shortest run; a run of two only by its middle rail when `middle` is asked. */
export function shortGive(mask: number, e: number, middle = false): boolean {
  if (kindOf(mask, e) !== 'give') return false;
  const run = runOf(mask, e);
  if (!run || run.plots.length !== shortest(mask)) return false;
  if (middle && run.plots.length === 2 && !run.loop)
    return RAIL_PLOTS[e].every((p) => run.plots.includes(p)) && RAIL_PLOTS[e].length === 2;
  return true;
}

// ---- hints ----

export type HintKind = 'claim' | 'safe' | 'run1' | 'run2' | 'run3' | 'loop' | 'give' | 'leave-two';
export interface Hint {
  rail: number;
  kind: HintKind;
}

/** What a hinted rail is called, so its line is true of the position. */
export function hintKind(mask: number, e: number): HintKind {
  const kind = kindOf(mask, e);
  // A claim on a turn that only a leave-two finishes well says the plan, not just "close this plot".
  if (kind === 'claim' && turnEndsOnLeaveTwo(mask)) return 'leave-two';
  if (kind !== 'give') return kind;
  // "Every rail gives something" is only said when it is so.
  const allGive = openRails(mask).every((x) => kindOf(mask, x) === 'give');
  const run = runOf(mask, e);
  if (!run || !shortGive(mask, e, true)) return 'give';
  if (run.plots.length === 2 && !run.loop) return 'run2';
  if (!allGive) return 'give';
  if (run.loop) return 'loop';
  if (run.plots.length === 1) return 'run1';
  if (run.plots.length === 3) return 'run3';
  return 'give';
}

const PREFER: readonly (readonly Kind[])[] = [
  ['claim', 'safe', 'give', 'leave-two'],
  ['safe', 'claim', 'give', 'leave-two'],
  ['give', 'claim', 'safe', 'leave-two'],
  ['leave-two', 'claim', 'safe', 'give'],
];

/** One sound rail to glow, preferring the level's kind; among gives, the shortest run by its middle. Always sound. */
export function hint(mask: number, level: number): Hint {
  const rails = soundRails(mask);
  const order = PREFER[planFor(level).level - 1];
  const rank = (e: number) => {
    const kind = kindOf(mask, e);
    let r = order.indexOf(kind) * 100;
    if (kind === 'give') r += (shortGive(mask, e, true) ? 0 : 50) + (runOf(mask, e)?.plots.length ?? 9);
    return r;
  };
  const rail = rails.reduce((a, b) => (rank(b) < rank(a) ? b : a));
  return { rail, kind: hintKind(mask, rail) };
}

// ---- the pet ----

/** The mover's choices: its sound rails, only the claims when a claim is sound. The pet plays from these. */
export function petChoices(mask: number): number[] {
  const rails = soundRails(mask);
  const claims = rails.filter((e) => completes(mask, e).length);
  return claims.length ? claims : rails;
}

export interface Step {
  rail: number;
  who: 'her' | 'pet';
}

/**
 * What *show me why* plays after her rail `e`: best play on both sides, rail by rail, until the pet has taken a plot and
 * it is her turn again (or the last rail). When `e` claimed a plot the turn is still hers, so her own play comes first:
 * taking a whole run shows the run she must open next and what the pet does with it. When the pet's first answer takes
 * nothing (it leaves two, or lays a quiet rail), play goes on to where the cost shows. `handed` counts the pet's plots.
 */
export function petReply(mask: number, e: number): { steps: Step[]; handed: number } {
  const steps: Step[] = [];
  let handed = 0;
  let m = mask | (1 << e);
  let who: Step['who'] = completes(mask, e).length ? 'her' : 'pet';
  while (m !== FULL && !(who === 'her' && handed > 0)) {
    const rail = petChoices(m)[0];
    const k = completes(m, rail).length;
    steps.push({ rail, who });
    if (who === 'pet') handed += k;
    m |= 1 << rail;
    if (!k) who = who === 'her' ? 'pet' : 'her';
  }
  return { steps, handed };
}

// ---- symmetry ----

function railBetween(a: [number, number], b: [number, number]): number {
  const [x, y] = [Math.min(a[0], b[0]), Math.min(a[1], b[1])];
  return a[1] === b[1] ? y * 3 + x : 12 + y * 4 + x;
}

/** The eight symmetries of the square, each as where every rail goes. */
export const SYMMETRIES: readonly (readonly number[])[] = (() => {
  const maps: ((p: [number, number]) => [number, number])[] = [];
  for (let turn = 0; turn < 4; turn++)
    for (const flip of [false, true])
      maps.push(([x, y]) => {
        let p: [number, number] = flip ? [3 - x, y] : [x, y];
        for (let i = 0; i < turn; i++) p = [3 - p[1], p[0]];
        return p;
      });
  return maps.map((f) =>
    Array.from({ length: RAILS }, (_, e) => {
      const [a, b] = railPosts(e);
      return railBetween(f(a), f(b));
    }),
  );
})();

export function transform(mask: number, s: number): number {
  const map = SYMMETRIES[s];
  let out = 0;
  for (let e = 0; e < RAILS; e++) if (laid(mask, e)) out |= 1 << map[e];
  return out;
}

/** The smallest of a position's eight images: its symmetry class. */
export const canonical = (mask: number): number => Math.min(...SYMMETRIES.map((_, s) => transform(mask, s)));

// ---- each level's test of a start position ----

/**
 * Whether sound play from `start` (her to move, any sound rail for either side) reaches a turn of hers that `needs` a
 * skill: some rail is unsound, and every sound rail is of the kind `only` names.
 */
function reaches(start: number, only: (mask: number, e: number) => boolean): boolean {
  const seen = new Set<number>();
  const walk = (mask: number, hers: boolean): boolean => {
    if (mask === FULL) return false;
    const key = mask * 2 + (hers ? 1 : 0);
    if (seen.has(key)) return false;
    seen.add(key);
    const rails = soundRails(mask);
    if (hers && rails.length < countOpen(mask) && rails.every((e) => only(mask, e))) return true;
    return rails.some((e) => walk(mask | (1 << e), completes(mask, e).length ? hers : !hers));
  };
  return walk(start, true);
}

const needsLeaveTwo = (start: number) => reaches(start, (m, e) => kindOf(m, e) === 'leave-two');
const needsShortest = (start: number) => reaches(start, (m, e) => shortGive(m, e));

/** Every way to play this turn with sound rails ends on a leave-two (level 4's test, and the plan its hint says). */
export function turnEndsOnLeaveTwo(mask: number): boolean {
  if (mask === FULL) return false;
  return soundRails(mask).every((e) =>
    completes(mask, e).length ? turnEndsOnLeaveTwo(mask | (1 << e)) : kindOf(mask, e) === 'leave-two',
  );
}

/** Whether `mask` is a start position of `level`, by the definition's table and its two play-out filters. */
export function fits(level: number, mask: number): boolean {
  const plan = planFor(level);
  const open = countOpen(mask);
  if (open < plan.open[0] || open > plan.open[1]) return false;
  if (openPlots(mask) !== PLOTS) return false;
  const rails = openRails(mask);
  const kinds = rails.map((e) => kindOf(mask, e));
  const good = rails.map((e) => sound(mask, e));
  const anyReady = readyPlots(mask).length > 0;
  switch (plan.level) {
    case 1:
      return (
        anyReady &&
        good.includes(false) &&
        rails.every((_, i) => !good[i] || kinds[i] === 'claim') &&
        !needsLeaveTwo(mask) &&
        !needsShortest(mask)
      );
    case 2:
      return (
        !anyReady &&
        kinds.includes('safe') &&
        rails.every((_, i) => !good[i] || kinds[i] === 'safe') &&
        rails.some((_, i) => !good[i] && kinds[i] === 'give') &&
        !needsLeaveTwo(mask) &&
        !needsShortest(mask)
      );
    case 3: {
      if (anyReady || kinds.includes('safe')) return false;
      if ([...Array(PLOTS).keys()].some((p) => plotOpen(mask, p) !== 2)) return false;
      const all = runs(mask);
      const min = shortest(mask);
      if (all.length < 2 || all.every((r) => r.plots.length === min)) return false;
      return (
        rails.some((e, i) => good[i] && shortGive(mask, e, true)) &&
        rails.some((e, i) => !good[i] && (runOf(mask, e)?.plots.length ?? 0) > min) &&
        !needsLeaveTwo(mask)
      );
    }
    default: {
      // The pet has just given a chain of three or more: the ready plots and the two-rail plots joined to them.
      const given = readyPlots(mask);
      if (!given.length) return false;
      const chain = new Set<number>(given);
      for (const p of given)
        for (const e of PLOT_RAILS[p])
          if (!laid(mask, e))
            for (const q of RAIL_PLOTS[e]) {
              const run = plotOpen(mask, q) === 2 ? runs(mask).find((r) => r.plots.includes(q)) : null;
              if (run?.loop) return false;
              run?.plots.forEach((x) => chain.add(x));
            }
      if (chain.size < 3) return false;
      // One chain only: every ready plot reaches every other through it.
      if (given.length > 2) return false;
      return turnEndsOnLeaveTwo(mask);
    }
  }
}

// ---- a round's start ----

export type Pools = Record<string, number[]>;

export interface Start {
  /** The pool class the position came from, so the next round takes another. */
  klass: number;
  mask: number;
  target: number;
}

/** One pool position under a random symmetry, never the previous round's class when the pool has another. */
export function pickStart(
  pool: readonly number[],
  rng: { int(min: number, max: number): number },
  last?: number,
): Start {
  const choices = pool.length > 1 ? pool.filter((m) => m !== last) : pool;
  const klass = choices[rng.int(0, choices.length - 1)];
  const mask = transform(klass, rng.int(0, SYMMETRIES.length - 1));
  return { klass, mask, target: best(mask) };
}

// ---- misses ----

/** One miss per distinct unsound rail at a given position; laying it again is free. */
export class Misses {
  private readonly seen = new Set<string>();
  /** True when this rail at this position has not been counted before. */
  count(mask: number, e: number): boolean {
    const key = `${mask}:${e}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }
}
