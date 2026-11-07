/**
 * Circuit Garden's rules: a toy flower lantern lights only when its two terminals join both battery terminals, so a
 * connector into the return gap closes the loop (level 1), a switch opens and closes it (level 2), and two gaps are mended
 * before a deliberate Check that the lantern lights (level 3). The board is an
 * undirected graph of named terminals; pieces only ever fill authored bridge slots. A Boolean connection model, not a
 * current calculation. Definition: docs/definitions/circuit-garden.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Battery `P`/`N`, lamp `L`/`R`, and the switch's two ends `U`/`V`. */
export type Terminal = 'P' | 'N' | 'L' | 'R' | 'U' | 'V';
export type Edge = readonly [Terminal, Terminal];
/** The two bridges a connector can fill: battery to lamp (`supply`) and lamp back to the battery (`return`). */
export type SlotId = 'supply' | 'return';

export const LAMP: Edge = ['L', 'R'];
export const SLOT_EDGES: Record<SlotId, Edge> = { supply: ['P', 'L'], return: ['R', 'N'] };

export interface LevelPlan {
  level: number;
  name: string;
  /** Wires drawn from the start (the lamp is its own labelled edge and never listed here). */
  fixed: readonly Edge[];
  /** Bridges a connector can fill, all empty at the start. */
  slots: readonly SlotId[];
  /** A switch between `U` and `V`, open at the start. */
  switch: boolean;
  /** Done waits on a correct Check of the lamp (level 3), not on what she has seen; only a wrong Check is a miss. */
  check: boolean;
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'A way back: join the return gap', fixed: [SLOT_EDGES.supply], slots: ['return'], switch: false, check: false },
  { level: 2, name: 'A switch changes it: see the lantern on and off', fixed: [['P', 'U'], ['V', 'L'], SLOT_EDGES.return], slots: [], switch: true, check: false },
  { level: 3, name: 'Mend the lantern: fill both gaps, then check it lights', fixed: [], slots: ['supply', 'return'], switch: false, check: true },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 1, max: 3 },
};

export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/** What can change during a round: which bridges hold a connector, and whether the switch is closed. */
export interface BoardState {
  filled: Record<SlotId, boolean>;
  closed: boolean;
}

export const initialState = (): BoardState => ({ filled: { supply: false, return: false }, closed: false });

/** Every conducting edge on the board now, without the lamp. */
export function conductors(plan: LevelPlan, s: BoardState): Edge[] {
  const edges: Edge[] = [...plan.fixed];
  for (const slot of plan.slots) if (s.filled[slot]) edges.push(SLOT_EDGES[slot]);
  if (plan.switch && s.closed) edges.push(['U', 'V']);
  return edges;
}

/** The terminals joined to `from` by conductors alone (the battery itself never conducts from P to N). */
export function reach(edges: readonly Edge[], from: Terminal): Set<Terminal> {
  const seen = new Set<Terminal>([from]);
  const queue: Terminal[] = [from];
  while (queue.length) {
    const t = queue.shift()!;
    for (const [a, b] of edges) {
      const next = a === t ? b : b === t ? a : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen;
}

/** A wire joining the battery's terminals without the lamp: no admitted board has one. */
export const bypass = (edges: readonly Edge[]) => reach(edges, 'P').has('N');

/** The lamp lights when one of its terminals joins P and the other joins N, and nothing bypasses it. */
export function litWith(edges: readonly Edge[]): boolean {
  if (bypass(edges)) return false;
  const p = reach(edges, 'P'), n = reach(edges, 'N');
  return (p.has(LAMP[0]) && n.has(LAMP[1])) || (p.has(LAMP[1]) && n.has(LAMP[0]));
}

export const lit = (plan: LevelPlan, s: BoardState) => litWith(conductors(plan, s));

/** The empty bridges, supply first: the gap a hint or the ghost finger fills next. */
export const gaps = (plan: LevelPlan, s: BoardState): SlotId[] => plan.slots.filter((slot) => !s.filled[slot]);

/** Seeded dressing only: which side the battery sits on and the lantern's petal colour. Never the topology. */
export interface Dressing {
  mirror: boolean;
  petals: 'pink' | 'purple' | 'orange';
}

export const dressingFor = (rng: Rng): Dressing => ({ mirror: rng.chance(0.5), petals: rng.pick(['pink', 'purple', 'orange'] as const) });

/**
 * What the round has shown her (round-local, only ever set): the lantern lit, and off. Done waits on these: level 1 needs
 * one lit state seen, level 2 both. Level 3 waits instead on `checked`: a correct Check of the board as it is now, which
 * any real edit clears.
 */
export interface Seen {
  on: boolean;
  off: boolean;
}

export const doneReady = (plan: LevelPlan, seen: Seen, checked = false) =>
  plan.check ? checked : plan.switch ? seen.on && seen.off : seen.on;

/**
 * A deliberate Check at level 3: right when the lantern lights now. A wrong Check names the break to mend, supply
 * before return, and is the only thing in the game that counts as a miss.
 */
export type CheckResult = { right: true } | { right: false; brk: SlotId };

export function checkBoard(plan: LevelPlan, s: BoardState): CheckResult {
  if (lit(plan, s)) return { right: true };
  return { right: false, brk: gaps(plan, s)[0] ?? 'return' };
}

/** After this many wrong Checks the next empty bridge glows by itself (and counts as that bridge's hint). */
export const GLOW_AFTER = 2;

/** Help's stable identity for this round, or null when nothing is left to show (help then only points at Done). */
export type HelpId = 'return' | 'supply' | 'show-on' | 'show-off';

export function nextHelp(plan: LevelPlan, s: BoardState, seen: Seen): HelpId | null {
  if (plan.switch) return !seen.on ? 'show-on' : !seen.off ? 'show-off' : null;
  if (plan.check) return gaps(plan, s)[0] ?? null;
  if (seen.on) return null;
  return gaps(plan, s)[0] ?? null;
}

/**
 * Counts each help identity once a round, requested or automatic: repeating a help, or helping again after Undo or a
 * restart, adds nothing.
 */
export class HelpTally {
  private readonly given = new Set<HelpId>();
  get count() { return this.given.size; }
  give(id: HelpId) { this.given.add(id); }
  has(id: HelpId) { return this.given.has(id); }
}

/**
 * What a capable player does next: fill the next gap (or put the piece back, so a lit state is seen), flip the switch to a
 * state not yet seen, Check a mended board, otherwise press Done.
 */
export type Move = { fill: SlotId } | { flip: true } | { check: true } | { done: true };

export function nextMove(plan: LevelPlan, s: BoardState, seen: Seen, checked = false): Move {
  if (doneReady(plan, seen, checked)) return { done: true };
  if (plan.switch) return { flip: true };
  const gap = gaps(plan, s)[0];
  if (gap) return { fill: gap };
  return plan.check ? { check: true } : { done: true };
}
