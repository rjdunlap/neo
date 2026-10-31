/**
 * Drop's Journey: one water drop moves between five places on a little land. Every move has a process and a driver
 * (the sun's warmth, the cold, or gravity); level 3 also offers one uphill place it can't reach from where it is.
 * The model, the cards offered, finishing and the layout are here; drawing and timing are in index.ts.
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
export const STATE: Record<Place, State> = { sea: 'liquid', river: 'liquid', ground: 'liquid', snow: 'ice', cloud: 'cloud' };

export interface Move { to: Place; process: Process; driver: Driver }
/** The whole lawful table. Staying put is lawful everywhere and is a separate choice. */
export const MOVES: Record<Place, readonly Move[]> = {
  sea: [{ to: 'cloud', process: 'evaporate', driver: 'warm' }],
  river: [{ to: 'cloud', process: 'evaporate', driver: 'warm' }, { to: 'sea', process: 'flow', driver: 'down' }],
  ground: [{ to: 'river', process: 'seep', driver: 'down' }],
  snow: [{ to: 'river', process: 'melt', driver: 'warm' }, { to: 'cloud', process: 'sublimate', driver: 'warm' }],
  cloud: [
    { to: 'sea', process: 'rain', driver: 'down' }, { to: 'river', process: 'rain', driver: 'down' },
    { to: 'ground', process: 'rainsoak', driver: 'down' }, { to: 'snow', process: 'snowfall', driver: 'cold' },
  ],
};

/** The only unlawful destinations ever offered (level 3): uphill as liquid, wrong in any picture of this land. */
export const CANT: Record<Place, readonly Place[]> = { sea: ['river', 'snow'], river: ['snow'], ground: ['snow'], snow: [], cloud: [] };

export type Choice =
  | { kind: 'move'; to: Place; process: Process; driver: Driver }
  | { kind: 'stay' }
  | { kind: 'cant'; to: Place; reason: 'uphill' };

export interface Stop { place: Place; via: Process | 'stay' }
export interface Journey { start: Place; stops: Stop[] }

export interface Plan { level: 1 | 2 | 3; name: string }
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Where can the drop go? Three places, finish after three stops' },
  { level: 2, name: "Send it to the postcard's place, any lawful route" },
  { level: 3, name: "Can it go there? One uphill place it can't reach is a miss" },
];
export const LEVELS: BandLevels = { preschool: { min: 1, max: 1 }, prek: { min: 1, max: 2 }, school: { min: 2, max: 3 } };
export function planFor(level: number): Plan { return PLANS[Math.max(1, Math.min(3, Math.round(level))) - 1]; }

/** Level 1 plays among three places only; the snow and the ground are scenery. */
export const LEVEL1_PLACES: readonly Place[] = ['sea', 'cloud', 'river'];

/** Level 2's postcard requests: (start, goal), each with a shortest route of two or three moves. */
export const PAIRS: readonly (readonly [Place, Place])[] = [
  ['sea', 'snow'], ['snow', 'ground'], ['ground', 'snow'], ['sea', 'ground'], ['river', 'snow'],
];

export interface Round { level: 1 | 2 | 3; start: Place; goal: Place | null }

export function makeRound(level: number, rng: Rng, authored: boolean): Round {
  const plan = planFor(level);
  if (plan.level === 1) return { level: 1, start: authored ? 'sea' : rng.pick(['sea', 'river'] as const), goal: null };
  if (plan.level === 2) {
    const [start, goal] = authored ? PAIRS[0] : rng.pick(PAIRS);
    return { level: 2, start, goal };
  }
  return { level: 3, start: authored ? 'sea' : rng.pick(['sea', 'river', 'ground'] as const), goal: null };
}

/** Every lawful choice from a place at a level (moves, then stay). Level 1 keeps to its three places. */
export function lawful(level: number, from: Place): Choice[] {
  const inPlay = (p: Place) => planFor(level).level !== 1 || LEVEL1_PLACES.includes(p);
  return [...MOVES[from].filter((m) => inPlay(m.to)).map((m): Choice => ({ kind: 'move', ...m })), { kind: 'stay' }];
}

export function moveTo(from: Place, to: Place): Move | undefined { return MOVES[from].find((m) => m.to === to); }

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
  const cards: Choice[] = cants.length ? [...picked, { kind: 'cant', to: rng.pick(cants), reason: 'uphill' }] : picked;
  return rng.shuffle(cards);
}

/** The most cards any stop offers at a level (the land keeps one size for the round). */
export function maxCards(level: number): number { return planFor(level).level === 2 ? 5 : 3; }

export function isLawful(c: Choice): boolean { return c.kind !== 'cant'; }

export function here(j: Journey): Place { return j.stops.length ? j.stops[j.stops.length - 1].place : j.start; }

/** One step: a new journey for a move or a stay; a can't-go card leaves the journey as it was. */
export function step(j: Journey, c: Choice): { journey: Journey } | { wrong: 'uphill' } {
  const from = here(j);
  if (c.kind === 'cant') return { wrong: c.reason };
  if (c.kind === 'stay') return { journey: { start: j.start, stops: [...j.stops, { place: from, via: 'stay' }] } };
  const m = moveTo(from, c.to);
  if (!m) throw new Error(`no move ${from} → ${c.to}`);
  return { journey: { start: j.start, stops: [...j.stops, { place: m.to, via: m.process }] } };
}

export function moves(j: Journey): number { return j.stops.filter((s) => s.via !== 'stay').length; }

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
    for (const m of MOVES[p]) if (!seen.has(m.to)) { seen.set(m.to, seen.get(p)! + 1); queue.push(m.to); }
  }
  return Infinity;
}

/**
 * The card the hint points at: at level 2 the next card on a shortest route to the postcard; otherwise the first
 * lawful move (so the drop travels and the finish comes nearer). Never a can't-go card.
 */
export function hintFor(round: Round, from: Place, cards: readonly Choice[], tapped: ReadonlySet<number> = new Set()): number {
  const live = cards.map((c, i) => ({ c, i })).filter(({ c, i }) => isLawful(c) && !tapped.has(i));
  if (round.level === 2 && round.goal) {
    const d = distance(from, round.goal);
    const next = live.find(({ c }) => c.kind === 'move' && distance(c.to, round.goal!) === d - 1);
    if (next) return next.i;
  }
  return (live.find(({ c }) => c.kind === 'move') ?? live[0]).i;
}

// ---- layout ----

export interface Box { x: number; y: number; w: number; h: number }
export interface Layout {
  portrait: boolean;
  /** The land picture's area. */
  land: Box;
  places: Record<Place, Box>;
  sun: { x: number; y: number };
  cards: Box[];
  strip: Box;
  book: Box;
  leaf: Box;
  postcard: Box;
}

export const CARD_W = 150, CARD_H = 130, RING = 124, LEAF = 120, BOOK = 110;
/** The shell's corners: Home and help down the top-left, the pet bottom-left. */
const LEFT_COLUMN = 125, PET_CORNER = 175;

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** Where each place sits in the land, as a fraction of its box (landscape, portrait). */
const SPOTS: Record<Place, [[number, number], [number, number]]> = {
  snow: [[0.14, 0.2], [0.2, 0.36]],
  cloud: [[0.5, 0.16], [0.42, 0.1]],
  ground: [[0.16, 0.68], [0.16, 0.64]],
  river: [[0.42, 0.56], [0.5, 0.56]],
  sea: [[0.78, 0.8], [0.72, 0.86]],
};

export function journeyLayout(view: { w: number; h: number }, cardCount: number): Layout | null {
  const { w, h } = view;
  const portrait = h > w;
  const top = 18;
  const leaf = box(w - 20 - LEAF / 2, top + LEAF / 2, LEAF, LEAF);
  const book = box(leaf.x - LEAF / 2 - 20 - BOOK / 2, top + BOOK / 2, BOOK, BOOK);
  const stripLeft = LEFT_COLUMN + 10, stripRight = book.x - BOOK / 2 - 16;
  const strip = box((stripLeft + stripRight) / 2, top + 50, stripRight - stripLeft, 92);
  // Cards along the bottom, right of the pet's corner; wrap to two rows if one row cannot hold them.
  const gap = 18;
  const rowLeft = PET_CORNER + 10, rowRight = w - 20;
  const perRow = Math.max(1, Math.floor((rowRight - rowLeft + gap) / (CARD_W + gap)));
  const rows = Math.ceil(cardCount / perRow);
  if (rows > 2) return null;
  const cards: Box[] = [];
  for (let r = 0; r < rows; r++) {
    const n = r === rows - 1 ? cardCount - perRow * (rows - 1) : perRow;
    const rowW = n * CARD_W + (n - 1) * gap;
    const x0 = Math.max(rowLeft, (rowLeft + rowRight) / 2 - rowW / 2);
    const y = h - 20 - CARD_H / 2 - (rows - 1 - r) * (CARD_H + 14);
    for (let i = 0; i < n; i++) cards.push(box(x0 + CARD_W / 2 + i * (CARD_W + gap), y, CARD_W, CARD_H));
  }
  const cardsTop = Math.min(h - 20 - CARD_H, ...cards.map((c) => c.y - c.h / 2));
  const land = box(w / 2, (top + 110 + cardsTop - 10) / 2, w, cardsTop - 10 - (top + 110));
  const places = {} as Record<Place, Box>;
  for (const p of PLACES) {
    const [fx, fy] = SPOTS[p][portrait ? 1 : 0];
    places[p] = box(land.x - land.w / 2 + fx * land.w, land.y - land.h / 2 + fy * land.h, RING, RING);
  }
  const sun = { x: land.x + land.w / 2 - (portrait ? 110 : 130), y: land.y - land.h / 2 + (portrait ? 70 : 60) };
  return { portrait, land, places, sun, cards, strip, book, leaf, postcard: leaf };
}

/** The sticker's stop: cloud, snow or river, seeded. */
export function stickerPlace(seed: number): Place { return (['cloud', 'snow', 'river'] as const)[Math.abs(seed) % 3]; }
