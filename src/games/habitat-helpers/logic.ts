import type { Rng } from '../../engine/random';

/**
 * Habitat Helpers uses a deliberately small garden model: a visitor comes when the garden supplies
 * food, water and shelter that work for it. Some garden pieces meet two needs, and the pond can be
 * drinking water for both visitors. The model is shown explicitly in the game rather than claiming
 * that these are the only things a real animal needs.
 */
export const VISITORS = ['bunny', 'duck'] as const;
export type Visitor = (typeof VISITORS)[number];

export const NEEDS = ['food', 'water', 'shelter'] as const;
export type Need = (typeof NEEDS)[number];

export const PIECE_IDS = [
  'clover',
  'shallow-pool',
  'brush-pile',
  'seed-grass',
  'tall-reeds',
  'berry-hedge',
  'pond-reeds',
] as const;
export type PieceId = (typeof PIECE_IDS)[number];

export interface HabitatPiece {
  id: PieceId;
  name: string;
  for: Partial<Record<Visitor, readonly Need[]>>;
}

/** Every useful feature in the stylized model. */
export const PIECES: Record<PieceId, HabitatPiece> = {
  clover: { id: 'clover', name: 'clover', for: { bunny: ['food'] } },
  'shallow-pool': { id: 'shallow-pool', name: 'shallow pool', for: { bunny: ['water'], duck: ['water'] } },
  'brush-pile': { id: 'brush-pile', name: 'brush pile', for: { bunny: ['shelter'] } },
  'seed-grass': { id: 'seed-grass', name: 'seed grass', for: { duck: ['food'] } },
  'tall-reeds': { id: 'tall-reeds', name: 'tall reeds', for: { duck: ['shelter'] } },
  'berry-hedge': { id: 'berry-hedge', name: 'berry hedge', for: { bunny: ['food', 'shelter'] } },
  'pond-reeds': { id: 'pond-reeds', name: 'pond with reeds', for: { bunny: ['water'], duck: ['water', 'shelter'] } },
};

export type HabitatMode = 'build' | 'predict';

export interface HabitatPlan {
  mode: HabitatMode;
  rounds: number;
  name: string;
}

export const PLANS: readonly HabitatPlan[] = [
  { mode: 'build', rounds: 1, name: "Place Bunny's food, water and shelter, then open the garden" },
  { mode: 'build', rounds: 2, name: 'Build an obvious three-piece habitat for Bunny, then Duck' },
  { mode: 'build', rounds: 2, name: 'Choose food, water and shelter from pieces for both visitors' },
  { mode: 'predict', rounds: 3, name: 'Inspect a prepared habitat and predict which visitor will come' },
  { mode: 'build', rounds: 2, name: 'Use a multipurpose piece to fit each habitat into two spaces' },
  { mode: 'build', rounds: 1, name: 'Build one three-piece habitat that welcomes Bunny and Duck together' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface HabitatRound {
  /** Visitors the child is trying to welcome; in prediction mode this is who the prepared garden really welcomes. */
  visitors: Visitor[];
  /** Pieces available to place. Prediction rounds instead show these already in the garden. */
  offered: PieceId[];
  capacity: number;
  prepared?: PieceId[];
}

const starters: Record<Visitor, PieceId[]> = {
  bunny: ['clover', 'shallow-pool', 'brush-pile'],
  duck: ['seed-grass', 'shallow-pool', 'tall-reeds'],
};

const choices: Record<Visitor, PieceId[]> = {
  bunny: ['clover', 'shallow-pool', 'brush-pile', 'seed-grass', 'tall-reeds'],
  duck: ['seed-grass', 'shallow-pool', 'tall-reeds', 'clover', 'brush-pile'],
};

const compact: Record<Visitor, PieceId[]> = {
  bunny: ['berry-hedge', 'shallow-pool', 'clover', 'brush-pile', 'seed-grass'],
  duck: ['seed-grass', 'pond-reeds', 'shallow-pool', 'tall-reeds', 'clover'],
};

export function makeRounds(level: number, rng: Rng): HabitatRound[] {
  const round = (visitors: Visitor[], offered: PieceId[], capacity: number, prepared?: PieceId[]): HabitatRound => ({
    visitors,
    offered: rng.shuffle(offered),
    capacity,
    prepared: prepared ? rng.shuffle(prepared) : undefined,
  });

  switch (Math.min(PLANS.length, Math.max(1, level))) {
    case 1:
      return [round(['bunny'], starters.bunny, 3)];
    case 2:
      return rng.shuffle([...VISITORS]).map((v) => round([v], starters[v], 3));
    case 3:
      return rng.shuffle([...VISITORS]).map((v) => round([v], choices[v], 3));
    case 4: {
      const first = rng.pick(VISITORS);
      const order: Visitor[] = [first, first === 'bunny' ? 'duck' : 'bunny', first];
      return order.map((v) => round([v], [], 2, v === 'bunny' ? ['berry-hedge', 'shallow-pool'] : ['seed-grass', 'pond-reeds']));
    }
    case 5:
      return rng.shuffle([...VISITORS]).map((v) => round([v], compact[v], 2));
    default:
      return [round(['bunny', 'duck'], ['berry-hedge', 'seed-grass', 'pond-reeds', 'shallow-pool', 'clover', 'tall-reeds'], 3)];
  }
}

export interface MissingNeed {
  visitor: Visitor;
  need: Need;
}

export function covers(piece: PieceId, visitor: Visitor, need: Need): boolean {
  return PIECES[piece].for[visitor]?.includes(need) ?? false;
}

/** Every need not supplied by at least one selected piece. */
export function missingNeeds(selected: readonly PieceId[], visitors: readonly Visitor[]): MissingNeed[] {
  return visitors.flatMap((visitor) => NEEDS.filter((need) => !selected.some((piece) => covers(piece, visitor, need))).map((need) => ({ visitor, need })));
}

export const welcomes = (selected: readonly PieceId[], visitors: readonly Visitor[]) => missingNeeds(selected, visitors).length === 0;

/** Which of the two known visitors would come to this completed garden. */
export const visitorsFor = (selected: readonly PieceId[]) => VISITORS.filter((visitor) => welcomes(selected, [visitor]));

/**
 * Unplaced pieces worth a glow: the ones that bring the garden closer to an arrangement that works. They come from the
 * accepted arrangements that already share the most with the garden, so on a two-space level the glow points at the
 * multipurpose piece rather than at everything that meets some need. Each one meets a need the garden is still missing.
 */
export function helpingPieces(round: HabitatRound, selected: readonly PieceId[]): PieceId[] {
  const missing = missingNeeds(selected, round.visitors);
  const meetsMissing = (piece: PieceId) => missing.some((m) => covers(piece, m.visitor, m.need));
  const overlap = (s: readonly PieceId[]) => s.filter((piece) => selected.includes(piece)).length;
  const all = solutions(round);
  const best = Math.max(0, ...all.map(overlap));
  const wanted = new Set(all.filter((s) => overlap(s) === best).flat());
  const glow = round.offered.filter((piece) => !selected.includes(piece) && wanted.has(piece) && meetsMissing(piece));
  // The arrangement they share most with might need nothing the garden lacks (it is a superset of a finished garden); fall back to any useful piece.
  return glow.length ? glow : round.offered.filter((piece) => !selected.includes(piece) && meetsMissing(piece));
}

/** All accepted arrangements, used by tests to prove each generated garden can be completed. */
export function solutions(round: HabitatRound): PieceId[][] {
  const out: PieceId[][] = [];
  const pieces = round.offered;
  for (let bits = 1; bits < 1 << pieces.length; bits++) {
    const selected = pieces.filter((_, i) => bits & (1 << i));
    if (selected.length <= round.capacity && welcomes(selected, round.visitors)) out.push(selected);
  }
  return out;
}

/** What the ghost finger touches next. */
export type HabitatTouch = { piece: PieceId } | { visitor: Visitor } | 'gate';

/**
 * The ghost finger's rule. A building round places the pieces of the smallest accepted arrangement (its first, in
 * the order offered), then opens the gate; a prediction round picks the visitor the prepared garden really welcomes
 * and then opens the gate. Null once the garden is tested or when there is nothing left to touch.
 */
export function habitatTouch(round: HabitatRound, mode: HabitatMode, selected: readonly PieceId[], prediction: Visitor | null): HabitatTouch | null {
  if (mode === 'predict') {
    if (!prediction) {
      const answer = visitorsFor(round.prepared ?? [])[0];
      return answer ? { visitor: answer } : null;
    }
    return 'gate';
  }
  if (welcomes(selected, round.visitors)) return 'gate';
  const plan = solutions(round).sort((a, b) => a.length - b.length)[0];
  if (!plan) return null;
  const next = round.offered.find((piece) => plan.includes(piece) && !selected.includes(piece));
  return next ? { piece: next } : null;
}
