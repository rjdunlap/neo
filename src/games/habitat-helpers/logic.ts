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
  'dandelions',
  'log-burrow',
  'pond-weed',
  'reed-island',
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
  dandelions: { id: 'dandelions', name: 'dandelions', for: { bunny: ['food'] } },
  'log-burrow': { id: 'log-burrow', name: 'log burrow', for: { bunny: ['shelter'] } },
  'pond-weed': { id: 'pond-weed', name: 'pond weed', for: { duck: ['food'] } },
  'reed-island': { id: 'reed-island', name: 'reed island', for: { duck: ['shelter'] } },
};

export type HabitatMode = 'build' | 'predict' | 'change';

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
  { mode: 'change', rounds: 2, name: 'Something changed: name the need a working garden lost, then restore it' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface HabitatRound {
  /** Visitors the child is trying to welcome; in prediction mode this is who the prepared garden really welcomes. */
  visitors: Visitor[];
  /** Pieces available to place. Prediction rounds instead show these already in the garden. */
  offered: PieceId[];
  capacity: number;
  prepared?: PieceId[];
  /** Level 7: the working garden (in `prepared`) loses one piece to a season or the weather. */
  change?: ChangeCase;
}

/**
 * Level 7's authored changes: a garden that works, one piece in it stops giving what it gave (a season or the weather,
 * never harm or blame), and a two-card repair tray where exactly one card restores the lost need.
 */
export interface ChangeCase {
  id: 'pool-dried' | 'reeds-flattened' | 'clover-finished' | 'seeds-gone';
  visitor: Visitor;
  garden: readonly [PieceId, PieceId, PieceId];
  changed: PieceId;
  repairs: readonly [PieceId, PieceId];
}

export const CHANGES: readonly ChangeCase[] = [
  { id: 'pool-dried', visitor: 'bunny', garden: ['clover', 'shallow-pool', 'brush-pile'], changed: 'shallow-pool', repairs: ['pond-reeds', 'seed-grass'] },
  { id: 'reeds-flattened', visitor: 'duck', garden: ['seed-grass', 'shallow-pool', 'tall-reeds'], changed: 'tall-reeds', repairs: ['reed-island', 'clover'] },
  { id: 'clover-finished', visitor: 'bunny', garden: ['clover', 'shallow-pool', 'brush-pile'], changed: 'clover', repairs: ['berry-hedge', 'pond-weed'] },
  { id: 'seeds-gone', visitor: 'duck', garden: ['seed-grass', 'shallow-pool', 'tall-reeds'], changed: 'seed-grass', repairs: ['pond-weed', 'log-burrow'] },
];

/** The pieces still giving something after the change. */
export const afterChange = (c: ChangeCase): PieceId[] => c.garden.filter((piece) => piece !== c.changed);

/** The need the change took away: the answer to "which need is missing now?". */
export const lostNeed = (c: ChangeCase): Need => missingNeeds(afterChange(c), [c.visitor])[0].need;

/** Whether placing this repair card welcomes the visitor back. */
export const restores = (c: ChangeCase, piece: PieceId): boolean => welcomes([...afterChange(c), piece], [c.visitor]);

/** Two pictured pieces that do the same single job; levels 1–3 pick one of each pair per round. */
export const EQUIVALENTS: Record<Visitor, Record<'food' | 'shelter', readonly [PieceId, PieceId]>> = {
  bunny: { food: ['clover', 'dandelions'], shelter: ['brush-pile', 'log-burrow'] },
  duck: { food: ['seed-grass', 'pond-weed'], shelter: ['tall-reeds', 'reed-island'] },
};

/** Water is the shallow pool for both visitors. */
const WATER: PieceId = 'shallow-pool';

/**
 * Every two-piece prepared garden that welcomes exactly one visitor: a multipurpose piece plus the need it leaves.
 * The model allows exactly two per visitor (the berry hedge with either water; the pond with reeds with either duck food).
 */
export const PREDICTION_GARDENS: Record<Visitor, readonly (readonly [PieceId, PieceId])[]> = {
  bunny: [
    ['berry-hedge', 'shallow-pool'],
    ['berry-hedge', 'pond-reeds'],
  ],
  duck: [
    ['pond-reeds', 'seed-grass'],
    ['pond-reeds', 'pond-weed'],
  ],
};

const other = (v: Visitor): Visitor => (v === 'bunny' ? 'duck' : 'bunny');

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

  // One food and one shelter for this visitor, each picked from its two equivalent pieces.
  const starter = (v: Visitor): PieceId[] => [rng.pick(EQUIVALENTS[v].food), WATER, rng.pick(EQUIVALENTS[v].shelter)];
  // Level 3's distractors: the other visitor's food and shelter, so exactly one set still works.
  const withDistractors = (v: Visitor): PieceId[] => [...starter(v), rng.pick(EQUIVALENTS[other(v)].food), rng.pick(EQUIVALENTS[other(v)].shelter)];

  switch (Math.min(PLANS.length, Math.max(1, level))) {
    case 1:
      return [round(['bunny'], starter('bunny'), 3)];
    case 2:
      return rng.shuffle([...VISITORS]).map((v) => round([v], starter(v), 3));
    case 3:
      return rng.shuffle([...VISITORS]).map((v) => round([v], withDistractors(v), 3));
    case 4: {
      // The first visitor comes twice, once to each of its gardens, so no prepared garden repeats in a play.
      const first = rng.pick(VISITORS);
      const [a, b] = rng.shuffle([...PREDICTION_GARDENS[first]]);
      const gardens: [Visitor, readonly PieceId[]][] = [[first, a], [other(first), rng.pick(PREDICTION_GARDENS[other(first)])], [first, b]];
      return gardens.map(([v, prepared]) => round([v], [], 2, [...prepared]));
    }
    case 5:
      return rng.shuffle([...VISITORS]).map((v) => round([v], compact[v], 2));
    case 6:
      return [round(['bunny', 'duck'], ['berry-hedge', 'seed-grass', 'pond-reeds', 'shallow-pool', 'clover', 'tall-reeds'], 3)];
    default: {
      // The dried pool opens every play (the dive's first round); the second change is drawn from the other three.
      const [first, ...rest] = CHANGES;
      return [first, rng.pick(rest)].map((c) => ({ ...round([c.visitor], [...c.repairs], 1, [...c.garden]), change: c }));
    }
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
export type HabitatTouch = { piece: PieceId } | { visitor: Visitor } | { need: Need } | 'gate';

/**
 * The ghost finger's rule. A building round places the pieces of the smallest accepted arrangement (its first, in
 * the order offered), then opens the gate; a prediction round picks the visitor the prepared garden really welcomes
 * and then opens the gate; a change round names the lost need, places the restoring card and opens the gate. Null once the garden is tested or when there is nothing left to touch.
 */
export function habitatTouch(round: HabitatRound, mode: HabitatMode, selected: readonly PieceId[], prediction: Visitor | null, needNamed = false): HabitatTouch | null {
  if (mode === 'change') {
    const c = round.change;
    if (!c) return null;
    if (!needNamed) return { need: lostNeed(c) };
    // Level 7's `selected` is the repair space only: take out a card that does not restore, place the one that does.
    const wrong = selected.find((piece) => !restores(c, piece));
    if (wrong) return { piece: wrong };
    if (selected.length) return 'gate';
    const fix = round.offered.find((piece) => restores(c, piece));
    return fix ? { piece: fix } : null;
  }
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
