/**
 * Sprout Shuffle's model and plans (genetics G2; definition: docs/definitions/sprout-shuffle.md).
 *
 * One invented plant, one petal marking, two kinds of copy. Each plant holds two copies and gives a sprout one of
 * them; a pair of plants therefore has exactly four routes, and duplicate routes stay separate. One spot copy is
 * enough to make spots; only two plain copies make a plain sprout. A declared toy rule, not a claim about any flower.
 */
import type { Rng } from '../../engine/random';
import type { ColorName } from '../../art/palette';

/** `A` is a spot copy, `a` a plain copy. The letters are a grown-up aid printed small; they are never spoken. */
export type Copy = 'A' | 'a';
/** A plant's two copies, in the order its tray shows them. */
export type Genotype = readonly [Copy, Copy];
export type Look = 'spotted' | 'plain';

/** One of the four ways two plants can make a sprout: the left plant's copy `from[0]` with the right plant's copy `from[1]`. */
export interface Route {
  from: readonly [0 | 1, 0 | 1];
  sprout: Genotype;
}

/** How a sprout with these copies looks: one spot copy is enough. */
export function looks(g: Genotype): Look {
  return g[0] === 'A' || g[1] === 'A' ? 'spotted' : 'plain';
}

/** The four routes, in fan order: left copy 1 or 2, paired with right copy 1 or 2. Duplicates are never merged. */
export function routes(left: Genotype, right: Genotype): Route[] {
  const out: Route[] = [];
  for (const i of [0, 1] as const) for (const j of [0, 1] as const) out.push({ from: [i, j], sprout: [left[i], right[j]] });
  return out;
}

/** Every look the routes can make. */
export function support(rs: readonly Route[]): Set<Look> {
  return new Set(rs.map((r) => looks(r.sprout)));
}

/** Whether every route has this look. */
export function always(look: Look, rs: readonly Route[]): boolean {
  return rs.every((r) => looks(r.sprout) === look);
}

export type Verdict =
  | { ok: true }
  /** A look these plants can make that she did not choose, with a route that makes it. */
  | { ok: false; missing: Look; route: Route }
  /** A look she chose that no route makes. */
  | { ok: false; extra: Look };

/** The only accepted set of looks is exactly the support; a wrong set gets a counterexample. */
export function checkLooks(chosen: Iterable<Look>, rs: readonly Route[]): Verdict {
  const picked = new Set(chosen);
  const can = support(rs);
  for (const look of can) {
    if (!picked.has(look)) return { ok: false, missing: look, route: rs.find((r) => looks(r.sprout) === look)! };
  }
  for (const look of picked) if (!can.has(look)) return { ok: false, extra: look };
  return { ok: true };
}

export interface Plan {
  level: number;
  name: string;
  /** The spotted plant's copies and the plain plant's; which side each stands on is seeded. */
  spotted: Genotype;
  plain: Genotype;
  /** After the sprout: open every bud (1), or finish the missing bud and choose every look that could grow (2). */
  task: 'open-all' | 'choose-could';
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'One route, then every route', spotted: ['A', 'A'], plain: ['a', 'a'], task: 'open-all' },
  { level: 2, name: 'Which sprouts could grow?', spotted: ['A', 'a'], plain: ['a', 'a'], task: 'choose-could' },
];

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
}

/** Petal colours carry no meaning; a round's two parents take two different ones. */
export const PETAL_COLORS: readonly ColorName[] = ['pink', 'purple', 'orange', 'yellow', 'blue'];

/** A round's seeded presentation of a plan. The rules and crosses are the plan's; sides, tile order, colours and the missing bud are the seed's. */
export interface Setup {
  plan: Plan;
  /** The left and right plants' copies, as their trays show them. */
  left: Genotype;
  right: Genotype;
  /** Petal colours of the left and right plants. */
  colors: readonly [ColorName, ColorName];
  /** The four routes of this cross, in fan order. */
  routes: Route[];
  /** Level 2: the one bud that opens closed, for her to build. Level 1: none, she opens all four. */
  missing: number | null;
}

export function setupFor(level: number, rng: Rng): Setup {
  const plan = planFor(level);
  const shuffle = (g: Genotype): Genotype => (rng.chance(0.5) ? [g[1], g[0]] : [g[0], g[1]]);
  const spottedLeft = rng.chance(0.5);
  const left = shuffle(spottedLeft ? plan.spotted : plan.plain);
  const right = shuffle(spottedLeft ? plan.plain : plan.spotted);
  const [c0, c1] = rng.shuffle([...PETAL_COLORS]);
  const rs = routes(left, right);
  return { plan, left, right, colors: [c0, c1], routes: rs, missing: plan.task === 'choose-could' ? rng.int(0, 3) : null };
}

/** Where a round is: giving the sprout its copies, the bud fan, the choice, or finished. */
export type Phase = 'give' | 'fan' | 'choose' | 'done';

export interface Round {
  setup: Setup;
  phase: Phase;
  /** The tile each parent has given, by tray position, or null while the slot is empty. */
  slots: readonly [0 | 1 | null, 0 | 1 | null];
  /** Which buds of the fan are open. */
  opened: readonly boolean[];
  /** At level 2, which source tiles of the missing bud she has tapped: the left plant's and the right plant's. */
  built: readonly [boolean, boolean];
  chosen: ReadonlySet<Look>;
}

export function freshRound(setup: Setup): Round {
  return {
    setup,
    phase: 'give',
    slots: [null, null],
    opened: setup.routes.map((_, i) => setup.missing !== null && i !== setup.missing),
    built: [false, false],
    chosen: new Set(),
  };
}

/** The next thing a capable child would do, for the ghost finger and for Show me; null when the round is done or waiting. */
export type Step =
  | { give: 0 | 1; tile: 0 | 1 }
  | { open: number }
  | { build: number; side: 0 | 1; tile: 0 | 1 }
  | { choose: Look }
  | { check: true };

export function nextStep(r: Round): Step | null {
  const s = r.setup;
  switch (r.phase) {
    case 'give': {
      if (r.slots[0] === null) return { give: 0, tile: 0 };
      if (r.slots[1] === null) return { give: 1, tile: 0 };
      return null;
    }
    case 'fan': {
      if (s.missing === null) {
        const i = r.opened.findIndex((o) => !o);
        return i < 0 ? null : { open: i };
      }
      const route = s.routes[s.missing];
      if (!r.built[0]) return { build: s.missing, side: 0, tile: route.from[0] };
      if (!r.built[1]) return { build: s.missing, side: 1, tile: route.from[1] };
      return null;
    }
    case 'choose': {
      for (const look of ['spotted', 'plain'] as const) if (support(s.routes).has(look) && !r.chosen.has(look)) return { choose: look };
      if (r.chosen.size > 0 && checkLooks(r.chosen, s.routes).ok) return { check: true };
      return null;
    }
    case 'done':
      return null;
  }
}

/** The fan bud whose route she built with the sprout's two copies (the first match, when duplicate routes make the same choice). */
export function builtBud(r: Round): number | null {
  const [i, j] = r.slots;
  if (i === null || j === null) return null;
  return r.setup.routes.findIndex((route) => route.from[0] === i && route.from[1] === j);
}

/** How many routes make each look. */
export function lookCounts(rs: readonly Route[]): Record<Look, number> {
  const counts: Record<Look, number> = { spotted: 0, plain: 0 };
  for (const r of rs) counts[looks(r.sprout)]++;
  return counts;
}
