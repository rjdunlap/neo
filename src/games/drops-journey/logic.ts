/**
 * Drop's Journey: one water drop moves between five places on a little land. Every move has a process and a driver
 * (the sun's warmth, the cold, or gravity); level 3 also offers one uphill place it can't reach from where it is.
 * The model, the cards offered and finishing are here; where things sit is in layout.ts, drawing and timing in index.ts.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const PLACES = ['sea', 'cloud', 'river', 'snow', 'ground'] as const;
export type Place = (typeof PLACES)[number];
export type Process = 'evaporate' | 'flow' | 'seep' | 'melt' | 'sublimate' | 'rain' | 'rainsoak' | 'snowfall';
export type Driver = 'warm' | 'cold' | 'down';
export type State = 'liquid' | 'ice' | 'cloud';

/** Heights on the picture: up is higher. */
export const HEIGHT: Record<Place, number> = { cloud: 4, snow: 3, ground: 2, river: 1, sea: 0 };
export const STATE: Record<Place, State> = {
  sea: 'liquid',
  river: 'liquid',
  ground: 'liquid',
  snow: 'ice',
  cloud: 'cloud',
};

export interface Move {
  to: Place;
  process: Process;
  driver: Driver;
}
/** The whole lawful table. Staying put is lawful everywhere and is a separate choice. */
export const MOVES: Record<Place, readonly Move[]> = {
  sea: [{ to: 'cloud', process: 'evaporate', driver: 'warm' }],
  river: [
    { to: 'cloud', process: 'evaporate', driver: 'warm' },
    { to: 'sea', process: 'flow', driver: 'down' },
  ],
  ground: [{ to: 'river', process: 'seep', driver: 'down' }],
  snow: [
    { to: 'river', process: 'melt', driver: 'warm' },
    { to: 'cloud', process: 'sublimate', driver: 'warm' },
  ],
  cloud: [
    { to: 'sea', process: 'rain', driver: 'down' },
    { to: 'river', process: 'rain', driver: 'down' },
    { to: 'ground', process: 'rainsoak', driver: 'down' },
    { to: 'snow', process: 'snowfall', driver: 'cold' },
  ],
};

/** The only unlawful destinations ever offered (level 3): uphill as liquid, wrong in any picture of this land. */
export const CANT: Record<Place, readonly Place[]> = {
  sea: ['river', 'snow'],
  river: ['snow'],
  ground: ['snow'],
  snow: [],
  cloud: [],
};

export type Choice =
  | { kind: 'move'; to: Place; process: Process; driver: Driver }
  | { kind: 'stay' }
  | { kind: 'cant'; to: Place; reason: 'uphill' };

export interface Stop {
  place: Place;
  via: Process | 'stay';
}
export interface Journey {
  start: Place;
  stops: Stop[];
}

export interface Plan {
  level: 1 | 2 | 3;
  name: string;
}
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Where can the drop go? Three places, finish after three stops' },
  { level: 2, name: "Send it to the postcard's place, any lawful route" },
  { level: 3, name: "Can it go there? One uphill place it can't reach is a miss" },
];
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 2 },
  school: { min: 2, max: 3 },
};
export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(3, Math.round(level))) - 1];
}

/** Level 1 plays among three places only; the snow and the ground are scenery. */
export const LEVEL1_PLACES: readonly Place[] = ['sea', 'cloud', 'river'];

/** Level 2's postcard requests: (start, goal), each with a shortest route of two or three moves. */
export const PAIRS: readonly (readonly [Place, Place])[] = [
  ['sea', 'snow'],
  ['snow', 'ground'],
  ['ground', 'snow'],
  ['sea', 'ground'],
  ['river', 'snow'],
];

export interface Round {
  level: 1 | 2 | 3;
  start: Place;
  goal: Place | null;
}

export function makeRound(level: number, rng: Rng, authored: boolean): Round {
  const plan = planFor(level);
  if (plan.level === 1)
    return { level: 1, start: authored ? 'sea' : rng.pick(['sea', 'river'] as const), goal: null };
  if (plan.level === 2) {
    const [start, goal] = authored ? PAIRS[0] : rng.pick(PAIRS);
    return { level: 2, start, goal };
  }
  return { level: 3, start: authored ? 'sea' : rng.pick(['sea', 'river', 'ground'] as const), goal: null };
}

/** Every lawful choice from a place at a level (moves, then stay). Level 1 keeps to its three places. */
export function lawful(level: number, from: Place): Choice[] {
  const inPlay = (p: Place) => planFor(level).level !== 1 || LEVEL1_PLACES.includes(p);
  return [
    ...MOVES[from].filter((m) => inPlay(m.to)).map((m): Choice => ({ kind: 'move', ...m })),
    { kind: 'stay' },
  ];
}

export function moveTo(from: Place, to: Place): Move | undefined {
  return MOVES[from].find((m) => m.to === to);
}

/**
 * The cards offered at a stop. Levels 1–2: every lawful choice, in table order. Level 3: three cards, exactly one of
 * them a can't-go card where the place has one (seeded among its uphill places), the rest lawful (seeded among them);
 * `authored` gives the first round's first stop as defined: cloud, river (can't go), stay.
 */
export function offer(level: number, from: Place, rng: Rng, authored = false): Choice[] {
  const plan = planFor(level);
  const ok = lawful(level, from);
  if (plan.level !== 3) return ok;
  if (authored && from === 'sea') return [ok[0], { kind: 'cant', to: 'river', reason: 'uphill' }, ok[1]];
  const cants = CANT[from];
  const nLawful = cants.length ? 2 : 3;
  const picked = rng.shuffle(ok.slice()).slice(0, nLawful);
  const cards: Choice[] = cants.length
    ? [...picked, { kind: 'cant', to: rng.pick(cants), reason: 'uphill' }]
    : picked;
  return rng.shuffle(cards);
}

/** The most cards any stop offers at a level (the land keeps one size for the round). */
export function maxCards(level: number): number {
  return planFor(level).level === 2 ? 5 : 3;
}

export function isLawful(c: Choice): boolean {
  return c.kind !== 'cant';
}

export function here(j: Journey): Place {
  return j.stops.length ? j.stops[j.stops.length - 1].place : j.start;
}

/** One step: a new journey for a move or a stay; a can't-go card leaves the journey as it was. */
export function step(j: Journey, c: Choice): { journey: Journey } | { wrong: 'uphill' } {
  const from = here(j);
  if (c.kind === 'cant') return { wrong: c.reason };
  if (c.kind === 'stay')
    return { journey: { start: j.start, stops: [...j.stops, { place: from, via: 'stay' }] } };
  const m = moveTo(from, c.to);
  if (!m) throw new Error(`no move ${from} → ${c.to}`);
  return { journey: { start: j.start, stops: [...j.stops, { place: m.to, via: m.process }] } };
}

export function moves(j: Journey): number {
  return j.stops.filter((s) => s.via !== 'stay').length;
}

export function canFinish(round: Round, j: Journey): boolean {
  if (round.level === 1) return j.stops.length >= 3;
  if (round.level === 2) return round.goal !== null && here(j) === round.goal && j.stops.length > 0;
  return moves(j) >= 4;
}

/** When the leaf glows to suggest stopping (not a hint): six stops at level 1, six moves at level 3. */
export function enough(round: Round, j: Journey): boolean {
  if (round.level === 1) return j.stops.length >= 6;
  if (round.level === 3) return moves(j) >= 6;
  return false;
}

/** Fewest moves from a place to a goal by lawful moves (all five places). */
export function distance(from: Place, goal: Place): number {
  const seen = new Map<Place, number>([[from, 0]]);
  const queue: Place[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    if (p === goal) return seen.get(p)!;
    for (const m of MOVES[p])
      if (!seen.has(m.to)) {
        seen.set(m.to, seen.get(p)! + 1);
        queue.push(m.to);
      }
  }
  return Infinity;
}

/**
 * The card the hint points at: at level 2 the next card on a shortest route to the postcard; otherwise the first
 * lawful move (so the drop travels and the finish comes nearer). Never a can't-go card.
 */
export function hintFor(
  round: Round,
  from: Place,
  cards: readonly Choice[],
  tapped: ReadonlySet<number> = new Set(),
): number {
  const live = cards.map((c, i) => ({ c, i })).filter(({ c, i }) => isLawful(c) && !tapped.has(i));
  if (round.level === 2 && round.goal) {
    const d = distance(from, round.goal);
    const next = live.find(({ c }) => c.kind === 'move' && distance(c.to, round.goal!) === d - 1);
    if (next) return next.i;
  }
  return (live.find(({ c }) => c.kind === 'move') ?? live[0]).i;
}

/** The sticker's stop: cloud, snow or river, seeded. */
export function stickerPlace(seed: number): Place {
  return (['cloud', 'snow', 'river'] as const)[Math.abs(seed) % 3];
}
