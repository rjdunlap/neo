/**
 * Circuit Garden's rules: a toy flower lantern lights only when its two terminals join both battery terminals, so a
 * connector into the return gap closes the loop (level 1) and a switch opens and closes it (level 2). The board is an
 * undirected graph of named terminals; pieces only ever fill authored bridge slots. A Boolean connection model, not a
 * current calculation. Definition: docs/definitions/circuit-garden.md.
 */
import type { Rng } from '../../engine/random';

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
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'A way back: join the return gap', fixed: [SLOT_EDGES.supply], slots: ['return'], switch: false },
  { level: 2, name: 'A switch changes it: see the lantern on and off', fixed: [['P', 'U'], ['V', 'L'], SLOT_EDGES.return], slots: [], switch: true },
];

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
 * one lit state seen, level 2 both.
 */
export interface Seen {
  on: boolean;
  off: boolean;
}

export const doneReady = (plan: LevelPlan, seen: Seen) => (plan.switch ? seen.on && seen.off : seen.on);

/** Help's stable identity for this round, or null when nothing is left to show (help then only points at Done). */
export type HelpId = 'return' | 'supply' | 'show-on' | 'show-off';

export function nextHelp(plan: LevelPlan, s: BoardState, seen: Seen): HelpId | null {
  if (plan.switch) return !seen.on ? 'show-on' : !seen.off ? 'show-off' : null;
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
 * state not yet seen, otherwise press Done.
 */
export type Move = { fill: SlotId } | { flip: true } | { done: true };

export function nextMove(plan: LevelPlan, s: BoardState, seen: Seen): Move {
  if (doneReady(plan, seen)) return { done: true };
  if (plan.switch) return { flip: true };
  const gap = gaps(plan, s)[0];
  return gap ? { fill: gap } : { done: true };
}
