import type { Rng } from '../../engine/random';

/**
 * Species Comeback's rules: a family tree of the island's (invented) pond turtles, the one pairing rule (no close family),
 * an exact solver over every plan, the one-step help, the spring hatch and the release sites.
 * See docs/definitions/species-comeback.md.
 */

export type Sex = 'f' | 'm';
export type Pair = readonly [number, number];
export type Plan = readonly Pair[];

export interface Turtle {
  id: number;
  name: string;
  sex: Sex;
  /** Both parents' ids, or null for a founder. */
  parents: readonly [number, number] | null;
  /** 0 founders, 1 their young, 2 the third generation, 3 this spring's hatchlings. */
  gen: number;
  /** Index into the shell tints. */
  tint: number;
}

export interface Tree {
  turtles: Turtle[];
  /** Young pairs who nested in an earlier spring: their turtles are not candidates. */
  nested: Pair[];
}

export interface ComebackPlan {
  level: number;
  name: string;
  founders: number;
  /** How many young the founder families have, by family, before shuffling. */
  young: readonly number[];
  /** Third-generation turtles under the one young pair that already nested (0 at level 1). */
  third: readonly [number, number];
  /** 1: siblings are close family. 2: cousins, aunts and uncles too. */
  depth: 1 | 2;
  target: number;
  /** Level 3: after Spring, pick the release site. */
  site: boolean;
}

export const PLANS: readonly ComebackPlan[] = [
  { level: 1, name: 'Not brothers and sisters', founders: 2, young: [3, 2], third: [0, 0], depth: 1, target: 2, site: false },
  { level: 2, name: 'Not cousins either', founders: 3, young: [3, 2, 2], third: [2, 3], depth: 2, target: 3, site: false },
  { level: 3, name: 'Where will they live?', founders: 3, young: [3, 2, 2], third: [2, 3], depth: 2, target: 3, site: true },
];

export const planFor = (level: number): ComebackPlan => PLANS.find((p) => p.level === level) ?? PLANS[0];

/** Names for the tree; never the island's named friends. */
export const NAMES = ['Pebble', 'Moss', 'Fern', 'Reed', 'Willow', 'Brook', 'Sorrel', 'Thistle', 'Bramble', 'Dune', 'Lichen', 'Marsh', 'Pine', 'Ash', 'Sage', 'Flint'] as const;
/** Hatchlings' names, so a spring never runs out. */
export const HATCHLING_NAMES = ['Rush', 'Sedge', 'Briar', 'Tansy', 'Rowan', 'Heath', 'Cress', 'Juniper'] as const;
export const TINTS = 6;

/* ---------------------------------------------------------------------------------------------- */
/* Kin and pairs                                                                                   */
/* ---------------------------------------------------------------------------------------------- */

export const byId = (tree: Tree, id: number): Turtle => {
  const t = tree.turtles.find((x) => x.id === id);
  if (!t) throw new Error(`no turtle ${id}`);
  return t;
};

/** A turtle's parents (depth 1), and grandparents too (depth 2), inside the tree. */
export function ancestors(tree: Tree, id: number, depth: number): Set<number> {
  const out = new Set<number>();
  let layer = [id];
  for (let d = 0; d < depth; d++) {
    const next: number[] = [];
    for (const t of layer) for (const p of byId(tree, t).parents ?? []) { out.add(p); next.push(p); }
    layer = next;
  }
  return out;
}

/** Close family: they share a parent (depth 1) or a parent or grandparent (depth 2), or one is the other's. */
export function kin(tree: Tree, a: number, b: number, depth: number): boolean {
  const aa = ancestors(tree, a, depth), bb = ancestors(tree, b, depth);
  if (aa.has(b) || bb.has(a)) return true;
  for (const x of aa) if (bb.has(x)) return true;
  return false;
}

/** The nearest relative two kin share, and what that relative is to each: 'mother', 'grandfather' and so on. */
export function sharedRelative(tree: Tree, a: number, b: number): { id: number; toA: string; toB: string } | null {
  const steps = (from: number) => {
    const m = new Map<number, number>();
    for (const p of byId(tree, from).parents ?? []) {
      m.set(p, 1);
      for (const g of byId(tree, p).parents ?? []) if (!m.has(g)) m.set(g, 2);
    }
    return m;
  };
  const sa = steps(a), sb = steps(b);
  let best: { id: number; d: number } | null = null;
  for (const [id, da] of sa) {
    const db = sb.get(id);
    if (db === undefined) continue;
    const d = da + db;
    // Prefer the mother over the father when both are shared, so a sibling's explanation is the same every time.
    if (!best || d < best.d || (d === best.d && byId(tree, id).sex === 'f' && byId(tree, best.id).sex === 'm')) best = { id, d };
  }
  if (!best) return null;
  const word = (d: number) => `${d === 2 ? 'grand' : ''}${byId(tree, best!.id).sex === 'f' ? 'mother' : 'father'}`;
  return { id: best.id, toA: word(sa.get(best.id)!), toB: word(sb.get(best.id)!) };
}

/** Turtles who may still go in a nest: not founders, and not a pair who nested before. */
export function candidates(tree: Tree): number[] {
  const done = new Set(tree.nested.flat());
  return tree.turtles.filter((t) => t.gen >= 1 && t.gen <= 2 && !done.has(t.id)).map((t) => t.id);
}

export type PairVerdict = 'ok' | 'same-sex' | 'kin' | 'taken';

export function judge(tree: Tree, plan: Plan, a: number, b: number, depth: number): PairVerdict {
  if (a === b || plan.some((p) => p.includes(a) || p.includes(b))) return 'taken';
  if (byId(tree, a).sex === byId(tree, b).sex) return 'same-sex';
  if (kin(tree, a, b, depth)) return 'kin';
  return 'ok';
}

export const allowed = (tree: Tree, plan: Plan, a: number, b: number, depth: number) => judge(tree, plan, a, b, depth) === 'ok';

/** A pair written mother first, so two plans compare equal. */
export const ordered = (tree: Tree, a: number, b: number): Pair => (byId(tree, a).sex === 'f' ? [a, b] : [b, a]);

const key = (plan: Plan) => plan.map((p) => `${p[0]}-${p[1]}`).sort().join(',');

/* ---------------------------------------------------------------------------------------------- */
/* The solver                                                                                      */
/* ---------------------------------------------------------------------------------------------- */

/** Every maximal plan (no allowed pair left among the unpaired), each once. */
export function plans(tree: Tree, depth: number): Pair[][] {
  const ids = candidates(tree);
  const out: Pair[][] = [];
  const seen = new Set<string>();
  const walk = (i: number, used: Set<number>, plan: Pair[]) => {
    if (i === ids.length) {
      const free = ids.filter((x) => !used.has(x));
      for (let x = 0; x < free.length; x++) for (let y = x + 1; y < free.length; y++) if (allowed(tree, [], free[x], free[y], depth)) return;
      const k = key(plan);
      if (!seen.has(k)) { seen.add(k); out.push(plan.slice()); }
      return;
    }
    const a = ids[i];
    if (used.has(a)) return walk(i + 1, used, plan);
    walk(i + 1, used, plan);
    for (let j = i + 1; j < ids.length; j++) {
      const b = ids[j];
      if (used.has(b) || !allowed(tree, [], a, b, depth)) continue;
      used.add(a); used.add(b); plan.push(ordered(tree, a, b));
      walk(i + 1, used, plan);
      plan.pop(); used.delete(a); used.delete(b);
    }
  };
  walk(0, new Set(), []);
  return out;
}

export const best = (tree: Tree, depth: number) => Math.max(0, ...plans(tree, depth).map((p) => p.length));

export const complete = (plan: Plan, target: number) => plan.length === target;

/** A full plan that keeps every pair she has, or null when her pairs so far block every one. */
export function extend(tree: Tree, plan: Plan, depth: number, target: number): Pair[] | null {
  const used = new Set(plan.flat());
  const free = candidates(tree).filter((x) => !used.has(x));
  const go = (rest: number[], acc: Pair[]): Pair[] | null => {
    if (acc.length >= target) return acc;
    if (acc.length + Math.floor(rest.length / 2) < target || rest.length < 2) return null;
    const [a, ...others] = rest;
    for (let j = 0; j < others.length; j++) {
      const b = others[j];
      if (!allowed(tree, [], a, b, depth)) continue;
      const found = go(others.filter((_, k) => k !== j), [...acc, ordered(tree, a, b)]);
      if (found) return found;
    }
    return go(others, acc);
  };
  return go(free, plan.slice());
}

/**
 * The nest to undo when the plan is blocked: the first whose undo makes the plan extendable, else the newest nest
 * (undoing nests one by one always reaches a plan that extends, since the empty plan does).
 */
export function blocking(tree: Tree, plan: Plan, depth: number, target: number): number {
  for (let i = 0; i < plan.length; i++) if (extend(tree, plan.filter((_, k) => k !== i), depth, target)) return i;
  return plan.length - 1;
}

export type Help = { kind: 'pair'; pair: Pair } | { kind: 'undo'; nest: number } | { kind: 'spring' };

/** The one useful step from here: the next good pair, the nest to undo, or Spring when the nests are full. */
export function helpFor(tree: Tree, plan: Plan, depth: number, target: number): Help {
  if (plan.length >= target) return { kind: 'spring' };
  const full = extend(tree, plan, depth, target);
  if (full) return { kind: 'pair', pair: full[plan.length] };
  return { kind: 'undo', nest: blocking(tree, plan, depth, target) };
}

/** Opposite-sex candidate pairs the rule forbids: the tree tests the rule at least once. */
export function tempting(tree: Tree, depth: number): Pair[] {
  const ids = candidates(tree), out: Pair[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    if (byId(tree, ids[i]).sex !== byId(tree, ids[j]).sex && kin(tree, ids[i], ids[j], depth)) out.push(ordered(tree, ids[i], ids[j]));
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------- */
/* Sites                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export type Feature = 'water' | 'logs' | 'sand' | 'plants' | 'quiet';
export const NEEDS: readonly Feature[] = ['water', 'logs', 'sand', 'plants'];

export interface Site { id: string; name: string; features: readonly Feature[] }

/** Authored release sites (decision 1: the developer reviews them). Two suit; each other lacks one need, each need once. */
export const SITES: readonly Site[] = [
  { id: 'reedy-pond', name: 'Reedy Pond', features: ['water', 'logs', 'sand', 'plants', 'quiet'] },
  { id: 'sunny-bank', name: 'Sunny Bank', features: ['water', 'logs', 'sand', 'plants'] },
  { id: 'quarry-pool', name: 'Quarry Pool', features: ['water', 'logs', 'plants', 'quiet'] },
  { id: 'mill-stream', name: 'Mill Stream', features: ['logs', 'sand', 'plants', 'quiet'] },
  { id: 'orchard-ditch', name: 'Old Orchard Ditch', features: ['water', 'sand', 'plants'] },
  { id: 'harbour-marsh', name: 'Harbour Marsh', features: ['water', 'logs', 'sand', 'quiet'] },
];

export const missing = (site: Site): Feature[] => NEEDS.filter((n) => !site.features.includes(n));
export const suits = (site: Site) => missing(site).length === 0;

/** Three sites: two that suit and one missing exactly one need, in a seeded order. */
export function pickSites(rng: Rng): Site[] {
  const good = SITES.filter(suits), bad = SITES.filter((s) => missing(s).length === 1);
  return rng.shuffle([...rng.shuffle(good.slice()).slice(0, 2), rng.pick(bad)]);
}

/* ---------------------------------------------------------------------------------------------- */
/* A round                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export interface Round {
  plan: ComebackPlan;
  tree: Tree;
  target: number;
  sites: Site[];
}

export const MAX_DRAWS = 400;

function drawTree(p: ComebackPlan, rng: Rng): Tree | null {
  const names = rng.shuffle(NAMES.slice());
  let next = 0;
  const turtles: Turtle[] = [];
  const add = (sex: Sex, parents: readonly [number, number] | null, gen: number) => {
    const t: Turtle = { id: next, name: names[next], sex, parents, gen, tint: rng.int(0, TINTS - 1) };
    next++;
    turtles.push(t);
    return t;
  };
  const families: Turtle[][] = [];
  const sizes = rng.shuffle(p.young.slice());
  for (let f = 0; f < p.founders; f++) {
    const mum = add('f', null, 0), dad = add('m', null, 0);
    const kids: Turtle[] = [];
    for (let k = 0; k < sizes[f]; k++) kids.push(add(rng.chance(0.5) ? 'f' : 'm', [mum.id, dad.id], 1));
    families.push(kids);
  }
  const nested: Pair[] = [];
  const thirdCount = p.third[1] > 0 ? rng.int(p.third[0], p.third[1]) : 0;
  if (thirdCount > 0) {
    // One young mother and father from two different families nested last spring.
    const options: Pair[] = [];
    for (let i = 0; i < families.length; i++) for (let j = 0; j < families.length; j++) {
      if (i === j) continue;
      for (const a of families[i]) for (const b of families[j]) if (a.sex === 'f' && b.sex === 'm') options.push([a.id, b.id]);
    }
    if (!options.length) return null;
    const pair = rng.pick(options);
    nested.push(pair);
    for (let k = 0; k < thirdCount; k++) add(rng.chance(0.5) ? 'f' : 'm', [pair[0], pair[1]], 2);
  }
  if (next > NAMES.length) return null;
  return { turtles, nested };
}

/** Whether a drawn tree meets every condition the definition sets for its level. */
export function fits(tree: Tree, p: ComebackPlan): boolean {
  const all = plans(tree, p.depth);
  const top = Math.max(0, ...all.map((x) => x.length));
  if (top !== p.target) return false;
  if (all.filter((x) => x.length === p.target).length < 2) return false;
  const tempt = tempting(tree, p.depth);
  if (!tempt.length) return false;
  if (p.depth === 2 && !tempt.some(([a, b]) => !kin(tree, a, b, 1))) return false;
  return true;
}

export function makeRound(level: number, rng: Rng): Round {
  const p = planFor(level);
  for (let i = 0; i < MAX_DRAWS; i++) {
    const tree = drawTree(p, rng);
    if (tree && fits(tree, p)) return { plan: p, tree, target: p.target, sites: p.site ? pickSites(rng) : [] };
  }
  throw new Error(`species-comeback: no tree for level ${level}`);
}

/** Spring: two hatchlings in every nest, a new generation with both parents set. */
export function hatch(tree: Tree, plan: Plan, rng: Rng): Turtle[] {
  const used = new Set(tree.turtles.map((t) => t.name));
  const pool = rng.shuffle([...HATCHLING_NAMES, ...NAMES].filter((n) => !used.has(n)));
  let id = Math.max(...tree.turtles.map((t) => t.id)) + 1;
  const out: Turtle[] = [];
  for (const [a, b] of plan) for (let k = 0; k < 2; k++) {
    out.push({ id: id++, name: pool[out.length], sex: rng.chance(0.5) ? 'f' : 'm', parents: [a, b], gen: 3, tint: byId(tree, rng.chance(0.5) ? a : b).tint });
  }
  tree.turtles.push(...out);
  return out;
}
