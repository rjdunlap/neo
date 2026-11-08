/**
 * Sprout Shuffle's model and plans (genetics G2–G3; definition: docs/definitions/sprout-shuffle.md).
 *
 * One invented plant, one petal marking, two kinds of copy. Each plant holds two copies and gives a sprout one of
 * them; a pair of plants therefore has exactly four routes, and duplicate routes stay separate. One spot copy is
 * enough to make spots; only two plain copies make a plain sprout. A declared toy rule, not a claim about any flower.
 */
import type { Rng } from '../../engine/random';
import type { ColorName } from '../../art/palette';
import type { BandLevels } from '../../progress/difficulty';

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
  for (const i of [0, 1] as const)
    for (const j of [0, 1] as const) out.push({ from: [i, j], sprout: [left[i], right[j]] });
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
    if (!picked.has(look))
      return { ok: false, missing: look, route: rs.find((r) => looks(r.sprout) === look)! };
  }
  for (const look of picked) if (!can.has(look)) return { ok: false, extra: look };
  return { ok: true };
}

/** Level 3's claim about two spotted plants' sprouts: spotted sometimes (plain can grow too), or always spotted. */
export type Claim = 'sometimes' | 'always';

/** The claim that fits these routes: "always spotted" only when every route is spotted. */
export function acceptedClaim(rs: readonly Route[]): Claim {
  return always('spotted', rs) ? 'always' : 'sometimes';
}

export type ClaimVerdict =
  | { ok: true }
  /** A wrong claim, with a route that shows it (null only when "sometimes" is said of a cross that is always spotted). */
  | { ok: false; route: Route | null };

/** "Always" is wrong whenever one route is not spotted, and that route is the counterexample. */
export function checkClaim(claim: Claim, rs: readonly Route[]): ClaimVerdict {
  if (claim === acceptedClaim(rs)) return { ok: true };
  return { ok: false, route: rs.find((r) => looks(r.sprout) !== 'spotted') ?? null };
}

export interface Plan {
  level: number;
  name: string;
  /** The two parents' copies; which side each stands on, and each tray's order, are seeded. */
  parents: readonly [Genotype, Genotype];
  /** After the sprout: open every bud (1), finish the missing bud and choose every look that could grow (2), or
   * build all four buds and say whether spotted is always (3). */
  task: 'open-all' | 'choose-could' | 'choose-always';
}

export const PLANS: readonly Plan[] = [
  {
    level: 1,
    name: 'One route, then every route',
    parents: [
      ['A', 'A'],
      ['a', 'a'],
    ],
    task: 'open-all',
  },
  {
    level: 2,
    name: 'Which sprouts could grow?',
    parents: [
      ['A', 'a'],
      ['a', 'a'],
    ],
    task: 'choose-could',
  },
  {
    level: 3,
    name: 'Could be, or always?',
    parents: [
      ['A', 'a'],
      ['A', 'a'],
    ],
    task: 'choose-always',
  },
];

export const LEVELS: BandLevels = {
  school: { min: 1, max: 8 },
};

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
  /** The buds she builds by tapping their source tiles, in order: level 2's one missing bud, level 3's all four,
   * level 1's none (she opens them). The other buds open already at level 2. */
  build: readonly number[];
}

export function setupFor(level: number, rng: Rng): Setup {
  const plan = planFor(level);
  const shuffle = (g: Genotype): Genotype => (rng.chance(0.5) ? [g[1], g[0]] : [g[0], g[1]]);
  const firstLeft = rng.chance(0.5);
  const left = shuffle(plan.parents[firstLeft ? 0 : 1]);
  const right = shuffle(plan.parents[firstLeft ? 1 : 0]);
  const [c0, c1] = rng.shuffle([...PETAL_COLORS]);
  const rs = routes(left, right);
  const build =
    plan.task === 'choose-could' ? [rng.int(0, 3)] : plan.task === 'choose-always' ? [0, 1, 2, 3] : [];
  return { plan, left, right, colors: [c0, c1], routes: rs, build };
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
  /** Which source tiles of the bud she is building she has tapped: the left plant's and the right plant's. */
  built: readonly [boolean, boolean];
  chosen: ReadonlySet<Look>;
  /** Level 3's chosen claim card. */
  claim: Claim | null;
}

export function freshRound(setup: Setup): Round {
  return {
    setup,
    phase: 'give',
    slots: [null, null],
    opened: setup.routes.map((_, i) => setup.build.length > 0 && !setup.build.includes(i)),
    built: [false, false],
    chosen: new Set(),
    claim: null,
  };
}

/** The bud she is building now: the first of the setup's build list still closed, or null. */
export function buildingBud(r: Round): number | null {
  return r.setup.build.find((i) => !r.opened[i]) ?? null;
}

/** The next thing a capable child would do, for the ghost finger and for Show me; null when the round is done or waiting. */
export type Step =
  | { give: 0 | 1; tile: 0 | 1 }
  | { open: number }
  | { build: number; side: 0 | 1; tile: 0 | 1 }
  | { choose: Look }
  | { claim: Claim }
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
      if (s.build.length === 0) {
        const i = r.opened.findIndex((o) => !o);
        return i < 0 ? null : { open: i };
      }
      const b = buildingBud(r);
      if (b === null) return null;
      const route = s.routes[b];
      if (!r.built[0]) return { build: b, side: 0, tile: route.from[0] };
      if (!r.built[1]) return { build: b, side: 1, tile: route.from[1] };
      return null;
    }
    case 'choose': {
      if (s.plan.task === 'choose-always') {
        const want = acceptedClaim(s.routes);
        return r.claim === want ? { check: true } : { claim: want };
      }
      for (const look of ['spotted', 'plain'] as const)
        if (support(s.routes).has(look) && !r.chosen.has(look)) return { choose: look };
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

// ——— Level 4: which pairs always make spotted? (Hidden Sprouts G5; definition: docs/definitions/hidden-sprouts.md) ———

/** The top level; level 4 plays the pair cards, not a cross, so `planFor` and `setupFor` stay levels 1–3's. */
export const PAIRS_LEVEL = 4;
export const PAIRS_NAME = 'Which pairs always make spotted?';

/** The grown-up name of any level, 1 to 8. */
export function levelName(level: number): string {
  const l = Math.round(level);
  return l >= CONSERVATORY_LEVEL
    ? CONSERVATORY_NAMES[Math.min(l, CONSERVATORY_TOP) - CONSERVATORY_LEVEL]
    : l >= TESTER_LEVEL
      ? TESTER_NAME
      : l >= HIDDEN_LEVEL
        ? HIDDEN_NAME
        : l >= PAIRS_LEVEL
          ? PAIRS_NAME
          : planFor(level).name;
}

/** Two plants on one pair card: the left plant's copies and the right plant's, as their trays show them. */
export type Pair = readonly [Genotype, Genotype];

const AA: Genotype = ['A', 'A'];
const Aa: Genotype = ['A', 'a'];
const aa: Genotype = ['a', 'a'];

/** The definition's authored pools, one per round: each has an accepted and a rejected pair, and pool C two accepted. */
export const PAIR_POOLS: readonly (readonly Pair[])[] = [
  [
    [AA, aa],
    [Aa, aa],
    [aa, aa],
  ],
  [
    [AA, Aa],
    [Aa, Aa],
    [aa, aa],
  ],
  [
    [AA, AA],
    [Aa, aa],
    [AA, aa],
  ],
];

/** The pairs (by index) whose every route makes this look. */
export function pairsAlways(pool: readonly Pair[], look: Look): number[] {
  return pool.flatMap((p, i) => (always(look, routes(p[0], p[1])) ? [i] : []));
}

/** A route of this pair that makes a plain sprout, or null when every route is spotted. */
export function counterexample(pair: Pair): Route | null {
  return routes(pair[0], pair[1]).find((r) => looks(r.sprout) === 'plain') ?? null;
}

export interface PairsSetup {
  /** Which of `PAIR_POOLS` the round plays. */
  pool: number;
  /** The three pair cards in order, each as its card shows it. Card order, sides and tile order are seeded. */
  pairs: readonly Pair[];
  /** Each card's left and right petal colours (two different ones). */
  colors: readonly (readonly [ColorName, ColorName])[];
  /** The cards whose sprouts are always spotted. */
  accepted: ReadonlySet<number>;
}

export function pairsSetupFor(rng: Rng): PairsSetup {
  const pool = rng.int(0, PAIR_POOLS.length - 1);
  const flip = (g: Genotype): Genotype => (rng.chance(0.5) ? [g[1], g[0]] : [g[0], g[1]]);
  const pairs = rng.shuffle([...PAIR_POOLS[pool]]).map((p): Pair => {
    const swap = rng.chance(0.5);
    return [flip(swap ? p[1] : p[0]), flip(swap ? p[0] : p[1])];
  });
  const colors = pairs.map((): readonly [ColorName, ColorName] => {
    const [c0, c1] = rng.shuffle([...PETAL_COLORS]);
    return [c0, c1];
  });
  return { pool, pairs, colors, accepted: new Set(pairsAlways(pairs, 'spotted')) };
}

export type PairsVerdict =
  | { ok: true }
  /** A chosen card that can make a plain sprout, with the route that makes it. */
  | { ok: false; extra: number; route: Route }
  /** An always-spotted card she did not choose. */
  | { ok: false; missing: number };

/** The only accepted choice is exactly the always-spotted cards (equivalent cards are all accepted together). */
export function checkPairs(chosen: Iterable<number>, s: PairsSetup): PairsVerdict {
  const picked = [...new Set(chosen)].sort((a, b) => a - b);
  for (const i of picked)
    if (!s.accepted.has(i)) return { ok: false, extra: i, route: counterexample(s.pairs[i])! };
  for (const i of [...s.accepted].sort((a, b) => a - b))
    if (!picked.includes(i)) return { ok: false, missing: i };
  return { ok: true };
}

/** The next thing a capable child would do: let go of a wrong card, choose a missing one, then Check. */
export type PairsStep = { choose: number } | { unchoose: number } | { check: true };

export function pairsNextStep(chosen: ReadonlySet<number>, s: PairsSetup): PairsStep {
  for (const i of [...chosen].sort((a, b) => a - b)) if (!s.accepted.has(i)) return { unchoose: i };
  for (const i of [...s.accepted].sort((a, b) => a - b)) if (!chosen.has(i)) return { choose: i };
  return { check: true };
}

/** A plant's copies as a spoken key, spot copies first: two spot, one of each, or two plain. */
export function copiesKey(g: Genotype): 'AA' | 'Aa' | 'aa' {
  const spots = g.filter((c) => c === 'A').length;
  return spots === 2 ? 'AA' : spots === 1 ? 'Aa' : 'aa';
}

// ——— Level 5: Hidden Sprouts (G6; definition: docs/definitions/hidden-sprouts.md) ———

export const HIDDEN_LEVEL = 5;
export const HIDDEN_NAME = 'Hidden Sprouts';

/** What a spotted plant could hold: two spot copies, or one spot copy and one plain. Nothing else makes spots. */
export type Candidate = 'AA' | 'Aa';
export const CANDIDATES: readonly Candidate[] = ['AA', 'Aa'];
export const GENOTYPES: Readonly<Record<'AA' | 'Aa' | 'aa', Genotype>> = { AA, Aa, aa };
/** The record card's sprout slots. */
export const RECORD_SLOTS = 8;
/** How many sprouts each watering grows. */
export const WATERING = 3;

/** A candidate fits the record when every look on it is one its fan with the tester can make. Order and counts never matter. */
export function compatible(candidate: Genotype, tester: Genotype, record: readonly Look[]): boolean {
  const can = support(routes(candidate, tester));
  return record.every((look) => can.has(look));
}

/** The candidates that fit the record, in `CANDIDATES` order. */
export function candidates(tester: Genotype, record: readonly Look[]): Candidate[] {
  return CANDIDATES.filter((c) => compatible(GENOTYPES[c], tester, record));
}

/** Whether this tester could ever tell the candidates apart: some look one candidate can make with it and the other cannot. */
export function couldTell(tester: Genotype): boolean {
  const [a, b] = CANDIDATES.map((c) => support(routes(GENOTYPES[c], tester)));
  return [...a].some((l) => !b.has(l)) || [...b].some((l) => !a.has(l));
}

/** A record no candidate fits (for instance a plain sprout against an `AA` tester). No authored case is one. */
export function contradicts(tester: Genotype, record: readonly Look[]): boolean {
  return candidates(tester, record).length === 0;
}

export interface HiddenSetup {
  /** The hidden plant's true copies, as its covered tray holds them. */
  truth: Candidate;
  hidden: Genotype;
  /** The tester whose watering grows the authored record: always plain. At level 6 she plants it herself. */
  tester: Genotype;
  /** The authored sprouts of the first and second watering. The second holds one plain sprout only when the truth is `Aa`. */
  first: readonly Look[];
  second: readonly Look[];
  /** Petal colours of the hidden plant (its sprouts too) and the tester. */
  colors: readonly [ColorName, ColorName];
  /** The two candidate cards, left to right. */
  order: readonly Candidate[];
  /** Level 6's bench: the known plants she can grow it with, left to right, each with its petal colour. Empty at level 5. */
  bench: readonly BenchPlant[];
}

export interface BenchPlant {
  key: Tester;
  color: ColorName;
}

/** One of the two authored cases, seeded, with the plain sprout's place, tray order, colours and card order seeded too. Level 6 adds the bench, drawn after level 5's draws so a level 5 seed plays the same case. */
export function hiddenSetupFor(rng: Rng, level = HIDDEN_LEVEL): HiddenSetup {
  const truth: Candidate = rng.chance(0.5) ? 'Aa' : 'AA';
  const g = GENOTYPES[truth];
  const hidden: Genotype = rng.chance(0.5) ? [g[1], g[0]] : [g[0], g[1]];
  const first: Look[] = ['spotted', 'spotted', 'spotted'];
  const second: Look[] = ['spotted', 'spotted', 'spotted'];
  if (truth === 'Aa') second[rng.int(0, WATERING - 1)] = 'plain';
  const [c0, c1, c2] = rng.shuffle([...PETAL_COLORS]);
  const order = rng.chance(0.5) ? [...CANDIDATES] : [...CANDIDATES].reverse();
  const bench: BenchPlant[] = [];
  if (Math.round(level) >= TESTER_LEVEL) {
    const keys: Tester[] = rng.chance(0.5) ? ['AA', 'aa'] : ['aa', 'AA'];
    bench.push(
      { key: keys[0], color: keys[0] === 'aa' ? c1 : c2 },
      { key: keys[1], color: keys[1] === 'aa' ? c1 : c2 },
    );
  }
  return { truth, hidden, tester: aa, first, second, colors: [c0, c1], order, bench };
}

/** Where a level 5 or 6 round is: (level 6) pick a tester, water, choose, water again, choose again, then the reveal. */
export type HiddenPhase = 'pick' | 'water1' | 'choose1' | 'water2' | 'choose2' | 'done';

export type HiddenVerdict =
  | { ok: true }
  /** A chosen candidate the record rules out. */
  | { ok: false; extra: Candidate }
  /** A candidate that still fits the record but was left out. */
  | { ok: false; missing: Candidate };

/** The accepted choice is every candidate that fits the record as shown; a ruled-out choice is reported before a missing one. */
export function checkCandidates(
  chosen: Iterable<Candidate>,
  tester: Genotype,
  record: readonly Look[],
): HiddenVerdict {
  const picked = new Set(chosen);
  const fit = candidates(tester, record);
  for (const c of CANDIDATES) if (picked.has(c) && !fit.includes(c)) return { ok: false, extra: c };
  for (const c of fit) if (!picked.has(c)) return { ok: false, missing: c };
  return { ok: true };
}

/** Try one: a sprout from one route of the hidden plant's true copies with the tester, by chance. */
export function drawSprout(hidden: Genotype, tester: Genotype, rng: Rng): Look {
  return looks(rng.pick(routes(hidden, tester)).sprout);
}

/** How many Try one sprouts still fit: none before the first watering or after the end, and room is kept for the second watering. */
export function tryRoom(phase: HiddenPhase, recordLength: number): number {
  if (phase === 'pick' || phase === 'water1' || phase === 'done') return 0;
  const reserved = phase === 'choose1' || phase === 'water2' ? WATERING : 0;
  return Math.max(0, RECORD_SLOTS - reserved - recordLength);
}

/** The next thing a capable child would do: water, let go of a ruled-out card, choose a fitting one, then Check. */
export type HiddenStep = { water: true } | { choose: Candidate } | { unchoose: Candidate } | { check: true };

export function hiddenNextStep(
  phase: HiddenPhase,
  chosen: ReadonlySet<Candidate>,
  tester: Genotype,
  record: readonly Look[],
): HiddenStep | null {
  if (phase === 'water1' || phase === 'water2') return { water: true };
  if (phase === 'pick' || phase === 'done') return null;
  const fit = candidates(tester, record);
  for (const c of CANDIDATES) if (chosen.has(c) && !fit.includes(c)) return { unchoose: c };
  for (const c of fit) if (!chosen.has(c)) return { choose: c };
  return { check: true };
}

// ——— Level 6: which plant could tell us? (G5's last level; definition: docs/definitions/hidden-sprouts.md) ———

export const TESTER_LEVEL = 6;
export const TESTER_NAME = 'Which plant could tell us?';

/** The two known plants on level 6's bench: two spot copies, or two plain. */
export type Tester = 'AA' | 'aa';
export const TESTERS: readonly Tester[] = ['AA', 'aa'];

/** What a watering grows with a tester that cannot tell: every look both candidates can make with it, three times (with `AA`, three spotted). */
export function cantTellSprouts(tester: Genotype): Look[] {
  const [a, b] = CANDIDATES.map((c) => support(routes(GENOTYPES[c], tester)));
  const shared = [...a].filter((l) => b.has(l));
  return Array.from({ length: WATERING }, (_, i) => shared[i % shared.length]);
}

/** Level 6 with a tester that can tell grows the whole authored record in one watering: the first three, then the next three. */
export function testerRecord(s: HiddenSetup): Look[] {
  return [...s.first, ...s.second];
}

/** The ghost finger's pick: plant the tester that could tell, then water. Choosing the other first is exploration, never needed. */
export type PickStep = { plant: Tester } | { water: true };

export function pickStep(potted: Tester | null): PickStep {
  const telling = TESTERS.find((t) => couldTell(GENOTYPES[t]))!;
  return potted === telling ? { water: true } : { plant: telling };
}

// ——— Levels 7–8: Patchwork Conservatory (G7; definition: docs/definitions/patchwork-conservatory.md) ———

export const CONSERVATORY_LEVEL = 7;
export const CONSERVATORY_TOP = 8;
export const CONSERVATORY_NAMES = [
  'Patchwork Conservatory: one pair never misses',
  'Patchwork Conservatory: two good plans',
] as const;

/**
 * The two markings. Each is G1's rule on its own: a plant holds two copies, gives one, and one showing copy is enough.
 * Both are stored as G1's `Copy`, where `A` is the copy that shows (a spot copy, or a rim copy) and `a` the one that
 * does not (plain, or no-rim); only the art prints the rim's copies as `B` and `b`. In this toy the two are given
 * independently: a declared game rule, true of some real gene pairs and not of others.
 */
export type Marking = 'spots' | 'rim';
export const MARKINGS: readonly Marking[] = ['spots', 'rim'];

/** A conservatory plant: two copies of each marking. */
export interface Plant2 {
  spots: Genotype;
  rim: Genotype;
}

/** A plant's look: whether it shows spots, and whether it shows a rim. */
export type Look2 = Record<Marking, boolean>;

export function looks2(p: Plant2): Look2 {
  return { spots: looks(p.spots) === 'spotted', rim: looks(p.rim) === 'spotted' };
}

/** G1's four routes on one marking. */
export function locusRoutes(left: Plant2, right: Plant2, m: Marking): Route[] {
  return routes(left[m], right[m]);
}

/** A planting brief: the markings every sprout must show. Levels 7–8 ask for both. */
export type Brief = readonly Marking[];
export const BRIEF: Brief = MARKINGS;

/** True when every route of every marking the brief names shows that marking. Needs no independence. */
export function guaranteed(left: Plant2, right: Plant2, brief: Brief = BRIEF): boolean {
  return brief.every((m) => always('spotted', locusRoutes(left, right, m)));
}

/** The first marking (in brief order) with a route that misses the brief, and that route; null when the pair is guaranteed. */
export function failingRoute(
  left: Plant2,
  right: Plant2,
  brief: Brief = BRIEF,
): { marking: Marking; route: Route } | null {
  for (const m of brief) {
    const route = locusRoutes(left, right, m).find((r) => looks(r.sprout) !== 'spotted');
    if (route) return { marking: m, route };
  }
  return null;
}

/** Every unordered pair of distinct bench plants (by index, smaller first, in index order) that is guaranteed. */
export function acceptedPairs(bench: readonly Plant2[], brief: Brief = BRIEF): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < bench.length; i++)
    for (let j = i + 1; j < bench.length; j++) if (guaranteed(bench[i], bench[j], brief)) out.push([i, j]);
  return out;
}

/** The markings whose look this plant shows while carrying a copy that does not show it: one of each kind of copy. */
export function hiddenCopies(p: Plant2): Marking[] {
  return MARKINGS.filter((m) => p[m][0] !== p[m][1]);
}

/** One of the sixteen combined routes: a spots route and a rim route together. For tests only; never drawn. */
export interface CombinedRoute {
  spots: Route;
  rim: Route;
  look: Look2;
}

export function combinedRoutes(left: Plant2, right: Plant2): CombinedRoute[] {
  const out: CombinedRoute[] = [];
  for (const spots of locusRoutes(left, right, 'spots')) {
    for (const rim of locusRoutes(left, right, 'rim')) {
      out.push({
        spots,
        rim,
        look: { spots: looks(spots.sprout) === 'spotted', rim: looks(rim.sprout) === 'spotted' },
      });
    }
  }
  return out;
}

const P = (spots: Genotype, rim: Genotype): Plant2 => ({ spots, rim });

/** The authored benches, in the definition's order. Level 7: one accepted pair, excluding the plant that matches the brief. Level 8: two. */
export const BENCHES: Readonly<Record<7 | 8, readonly Plant2[]>> = {
  7: [P(AA, aa), P(aa, AA), P(Aa, Aa)],
  8: [P(AA, aa), P(aa, AA), P(Aa, AA), P(aa, aa)],
};

/** The ghost finger's plan: level 7's only pair, and at level 8 the pair with the plant that shows both traits. */
export const BOT_PAIRS: Readonly<Record<7 | 8, readonly [number, number]>> = { 7: [0, 1], 8: [0, 2] };

/** The plant's copies as a spoken key: the spot reading, then the rim reading. */
export function plantKey(p: Plant2): `${'AA' | 'Aa' | 'aa'}-${'BB' | 'Bb' | 'bb'}` {
  const rim = copiesKey(p.rim);
  return `${copiesKey(p.spots)}-${rim === 'AA' ? 'BB' : rim === 'Aa' ? 'Bb' : 'bb'}`;
}

export interface ConservatorySetup {
  level: 7 | 8;
  /** The bench in authored order, each tray's copy order seeded. Plant indices are authored and never change. */
  bench: readonly Plant2[];
  /** Each plant's petal colour, seeded; carries no meaning. */
  colors: readonly ColorName[];
  /** The bench places, left to right: `places[k]` is the plant standing in place k. */
  places: readonly number[];
  /** The rim colour of the round, seeded and never a petal colour; carries no meaning. */
  rimColor: ColorName;
  /** The accepted pairs, by plant index. */
  accepted: readonly (readonly [number, number])[];
}

export function conservatorySetupFor(level: number, rng: Rng): ConservatorySetup {
  const l: 7 | 8 = Math.round(level) >= CONSERVATORY_TOP ? 8 : 7;
  const flip = (g: Genotype): Genotype => (rng.chance(0.5) ? [g[1], g[0]] : [g[0], g[1]]);
  const bench = BENCHES[l].map((p) => P(flip(p.spots), flip(p.rim)));
  const shuffled = rng.shuffle([...PETAL_COLORS]);
  const colors = bench.map((_, i) => shuffled[i % shuffled.length]);
  const places = rng.shuffle(bench.map((_, i) => i));
  // The rim is never a petal colour, nor teal beside a blue petal, so a rim always stands out from its petal.
  const rims: ColorName[] = colors.includes('blue') ? ['red'] : ['red', 'teal'];
  const rimColor = rng.pick(rims);
  return { level: l, bench, colors, places, rimColor, accepted: acceptedPairs(bench) };
}

const samePair = (a: readonly number[], b: readonly number[]) =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);

/** Whether this unordered pair is one of these. */
export function hasPair(pairs: readonly (readonly number[])[], pair: readonly number[]): boolean {
  return pairs.some((p) => samePair(p, pair));
}

/**
 * The pair Show me plants and the level-8 glow lights: the accepted pair that keeps a potted plant, or the first
 * accepted pair (`AA bb` × `aa BB`) when both or neither do. With `except`, a pair already found is never offered.
 */
export function helpPair(
  s: ConservatorySetup,
  potted: readonly (number | null)[],
  except: readonly number[] | null = null,
): readonly [number, number] {
  const open = s.accepted.filter((p) => !except || !samePair(p, except));
  const keeps = open.filter((p) => potted.some((k) => k !== null && p.includes(k)));
  return keeps.length === 1 ? keeps[0] : open[0];
}

/** What a failing Check says: the marking whose route fails, and the potted plant (if any) that shows it yet carries the failing copy. */
export interface Counter {
  marking: Marking;
  route: Route;
  /** The potted plant's index to pulse, or null when no potted plant hides the failing copy. */
  hider: number | null;
  /** That plant's hidden markings, for the line it speaks. */
  hidden: Marking[];
}

export function counterFor(s: ConservatorySetup, pair: readonly [number, number]): Counter | null {
  const [l, r] = [s.bench[pair[0]], s.bench[pair[1]]];
  const fail = failingRoute(l, r);
  if (!fail) return null;
  const hider = pair.find((k) => hiddenCopies(s.bench[k]).includes(fail.marking)) ?? null;
  return { ...fail, hider, hidden: hider === null ? [] : hiddenCopies(s.bench[hider]) };
}

/** The ghost finger's next move. `pots` holds plant indices; `seen` the lenses opened since the pots last changed. */
export type ConservatoryStep =
  { unpot: number } | { pot: number } | { lens: Marking } | { check: true } | { finish: true };

export function conservatoryStep(
  level: 7 | 8,
  pots: readonly (number | null)[],
  seen: ReadonlySet<Marking>,
  found: boolean,
): ConservatoryStep {
  if (found) return { finish: true };
  const target = BOT_PAIRS[level];
  for (const k of pots) if (k !== null && !target.includes(k)) return { unpot: k };
  for (const k of target) if (!pots.includes(k)) return { pot: k };
  for (const m of MARKINGS) if (!seen.has(m)) return { lens: m };
  return { check: true };
}
