import type { CritterName } from '../../art/critter';
import type { PropKind } from '../../art/props';
import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { BandLevels } from '../../progress/difficulty';
import { handsFor } from '../clock-tower/logic';
import type { Rng } from '../../engine/random';

export const PLANS = [
  { pairs: 2, mode: 'pictures', name: 'Four cards: two picture pairs' },
  { pairs: 3, mode: 'pictures', name: 'Six cards: three picture pairs' },
  { pairs: 4, mode: 'pictures', name: 'Eight cards: four picture pairs' },
  { pairs: 6, mode: 'pictures', name: 'Twelve cards: six picture pairs' },
  { pairs: 8, mode: 'pictures', name: 'Sixteen cards: eight picture pairs' },
  { pairs: 4, mode: 'numbers', name: 'Match numbers 1–4 to dots' },
  { pairs: 8, mode: 'numbers', name: 'Match numbers 1–8 to dots' },
  { pairs: 8, mode: 'attributes', name: 'Match both shape and color' },
  { pairs: 8, mode: 'letters', name: 'Match uppercase and lowercase letters' },
  { pairs: 10, mode: 'number-words', name: 'Match number words one–ten to numerals' },
  { pairs: 3, mode: 'fractions', name: 'Match fraction pictures to names' },
  { pairs: 3, mode: 'clocks', name: 'Same time: match hour and half-hour clocks' },
  { pairs: 3, mode: 'totals', name: 'Same total: two groups of dots and the number they make' },
] as const;
export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 5 },
  prek: { min: 3, max: 9 },
  school: { min: 8, max: 13, order: [8, 12, 13, 9, 10, 11] },
};
const COLORS: ColorName[] = ['red', 'blue', 'yellow', 'purple', 'green', 'pink', 'orange', 'teal'];
const SHAPES: ShapeKind[] = ['circle', 'star', 'square', 'heart', 'triangle', 'hexagon', 'circle', 'star'];

export type MemoryPicture =
  | { kind: 'shape'; id: string; name: string; color: ColorName; shape: ShapeKind }
  | { kind: 'friend'; id: string; name: string; animal: CritterName }
  | { kind: 'prop'; id: string; name: string; prop: PropKind; color: ColorName }
  | { kind: 'vehicle'; id: string; name: string; vehicle: VehicleKind; color: ColorName };

/** Eight vehicles that look different even in outline; drawn in `art.ts`. */
export const VEHICLES = [
  ['car', 'red'],
  ['bus', 'yellow'],
  ['truck', 'blue'],
  ['train', 'green'],
  ['boat', 'teal'],
  ['plane', 'purple'],
  ['rocket', 'orange'],
  ['tractor', 'pink'],
] as const;
export type VehicleKind = (typeof VEHICLES)[number][0];

/** Each family has eight visually distinct identities; never mix families on one board. */
export const PICTURE_POOLS: readonly (readonly MemoryPicture[])[] = [
  COLORS.map((color, i) => ({
    kind: 'shape' as const,
    id: `shape-${color}-${SHAPES[i]}`,
    name: `${color} ${SHAPES[i]}`,
    color,
    shape: SHAPES[i],
  })),
  (['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny', 'pip'] as const).map((animal) => ({
    kind: 'friend' as const,
    id: `friend-${animal}`,
    name: animal === 'pip' ? 'Pip' : animal,
    animal,
  })),
  (
    [
      ['apple', 'red'],
      ['orange', 'orange'],
      ['lemon', 'yellow'],
      ['pear', 'green'],
      ['blueberries', 'blue'],
      ['grapes', 'purple'],
      ['balloon', 'pink'],
      ['flower', 'teal'],
    ] as const
  ).map(([prop, color]) => ({ kind: 'prop' as const, id: `prop-${prop}`, name: prop, prop, color })),
  VEHICLES.map(([vehicle, color]) => ({
    kind: 'vehicle' as const,
    id: `vehicle-${vehicle}`,
    name: vehicle,
    vehicle,
    color,
  })),
];

/** Pair IDs index this seeded content selection, rather than a fixed renderer index. */
export function selectPictures(pairs: number, rng: Rng): MemoryPicture[] {
  return rng.shuffle([...rng.pick(PICTURE_POOLS)]).slice(0, pairs);
}

export type MemoryMode = (typeof PLANS)[number]['mode'];
export function planFor(level: number) {
  return PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
}
export function pictureIdentity(mode: MemoryMode, pair: number) {
  return {
    color: mode === 'attributes' ? COLORS[pair % 2] : COLORS[pair],
    shape: mode === 'attributes' ? SHAPES[Math.floor(pair / 2)] : SHAPES[pair],
  };
}
export function cardLabel(
  mode: MemoryMode,
  card: MemoryCard,
  letters: readonly string[],
  pictures?: readonly MemoryPicture[],
  times: readonly number[] = [],
  sums: readonly TotalSum[] = [],
): string {
  if (mode === 'clocks') return clockLabel(times[card.pair]);
  if (mode === 'totals')
    return card.side ? numberWord(sums[card.pair].total - 1) : groupsLabel(sums[card.pair]);
  if (mode === 'pictures' && pictures) return pictures[card.pair].name;
  if (mode === 'fractions') return fraction(card.pair).name;
  if (mode === 'letters') return letters[card.pair];
  if (mode === 'numbers' || mode === 'number-words') return numberWord(card.pair);
  const { color, shape } = pictureIdentity(mode, card.pair);
  return `${color} ${shape}`;
}

/** Help only points to a partner this player has actually revealed. */
export function hintPartner(
  cards: readonly MemoryCard[],
  first: number,
  seen: ReadonlySet<number>,
  wrong: number,
): number | null {
  if (wrong < 2) return null;
  const partner = cards.findIndex((card, i) => i !== first && card.pair === cards[first].pair);
  return partner >= 0 && seen.has(partner) ? partner : null;
}

export interface DotSpot {
  x: number;
  y: number;
}
/** Dot radius on a card face; layouts keep every centre this far apart (twice the radius plus a gap) and inside DOT_REACH. */
export const DOT_RADIUS = 9;
export const DOT_GAP = 22;
export const DOT_REACH = { x: 54, y: 50 };
const grid = (rows: number[], dx: number, dy: number): DotSpot[] =>
  rows.flatMap((count, r) =>
    Array.from({ length: count }, (_, c) => ({
      x: (c - (count - 1) / 2) * dx,
      y: (r - (rows.length - 1) / 2) * dy,
    })),
  );
const SCATTER: Record<number, DotSpot[]> = {
  2: [
    { x: -26, y: -22 },
    { x: 26, y: 24 },
  ],
  3: [
    { x: -30, y: -24 },
    { x: 30, y: -14 },
    { x: 0, y: 30 },
  ],
  4: [
    { x: -28, y: -28 },
    { x: 28, y: -28 },
    { x: -28, y: 28 },
    { x: 28, y: 28 },
  ],
  5: [
    { x: -28, y: -28 },
    { x: 28, y: -28 },
    { x: 0, y: 0 },
    { x: -28, y: 28 },
    { x: 28, y: 28 },
  ],
  6: [
    { x: -26, y: -32 },
    { x: 26, y: -32 },
    { x: -26, y: 0 },
    { x: 26, y: 0 },
    { x: -26, y: 32 },
    { x: 26, y: 32 },
  ],
  7: [
    { x: -40, y: -30 },
    { x: 0, y: -38 },
    { x: 38, y: -26 },
    { x: -22, y: 0 },
    { x: 24, y: 6 },
    { x: -38, y: 32 },
    { x: 8, y: 38 },
  ],
  8: [
    { x: -40, y: -30 },
    { x: 0, y: -38 },
    { x: 38, y: -26 },
    { x: -22, y: 0 },
    { x: 24, y: 6 },
    { x: -38, y: 32 },
    { x: 8, y: 38 },
    { x: 42, y: 36 },
  ],
};
/**
 * Curated ways to show n dots on a card (n 1–8): two columns (the original), a dice-like scatter, rows and a
 * five-frame (a row of five, then the rest). Different cards can show the same number differently, so the match is the
 * quantity, never one picture of it. Duplicates (one row is also the frame at 1–4) are dropped.
 */
export function dotLayouts(n: number): DotSpot[][] {
  const frame = grid(n <= 5 ? [n] : [5, n - 5], 24, 30);
  const rows = n <= 4 ? grid([n], 30, 0) : grid([Math.ceil(n / 2), Math.floor(n / 2)], 30, 32);
  const columns = Array.from({ length: n }, (_, i) => ({
    x: (i % 2) * 34 - (n === 1 ? 0 : 17),
    y: Math.floor(i / 2) * 25 - (Math.ceil(n / 2) - 1) * 12.5,
  }));
  const all = [columns, SCATTER[n] ?? grid([1], 0, 0), rows, frame];
  const seen = new Set<string>();
  return all.filter((layout) => {
    const key = layout
      .map((d) => `${d.x.toFixed(1)},${d.y.toFixed(1)}`)
      .sort()
      .join('|');
    return seen.has(key) ? false : (seen.add(key), true);
  });
}
/** One layout per pair, drawn with the seeded RNG; both faces of a pair share its quantity, not its arrangement. */
export function selectDotLayouts(pairs: number, rng: Rng): DotSpot[][] {
  return Array.from({ length: pairs }, (_, pair) => rng.pick(dotLayouts(pair + 1)));
}

export interface MemoryCard {
  pair: number;
  side: 0 | 1;
}
/** The reading pairs for level 10. Index zero is the numeral one. */
export const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
] as const;
export function numberWord(pair: number): string {
  return NUMBER_WORDS[pair] ?? '';
}
export const FRACTIONS = [
  { name: 'a half', numerator: 1, denominator: 2 },
  { name: 'a quarter', numerator: 1, denominator: 4 },
  { name: 'three quarters', numerator: 3, denominator: 4 },
] as const;
export function fraction(pair: number) {
  return FRACTIONS[pair];
}
/** A single 64-unit square, partitioned into exactly two or four equal rectangles. */
export interface FractionSquare {
  rotation: number;
  parts: { x: number; y: number; width: number; height: number; shaded: boolean }[];
}
/** Select the filled parts independently of orientation; neither changes the fraction's identity. */
export function selectFractionSquares(rng: Rng): FractionSquare[] {
  return FRACTIONS.map((amount) => {
    const shaded = new Set(
      rng.shuffle(Array.from({ length: amount.denominator }, (_, i) => i)).slice(0, amount.numerator),
    );
    const width = 32,
      height = 128 / amount.denominator;
    return {
      rotation: (rng.int(0, 7) * Math.PI) / 4,
      parts: Array.from({ length: amount.denominator }, (_, i) => ({
        x: -32 + (i % 2) * width,
        y: -32 + Math.floor(i / 2) * height,
        width,
        height,
        shaded: shaded.has(i),
      })),
    };
  });
}
export function makeDeck(pairs: number, rng: Rng): MemoryCard[] {
  return rng.shuffle(
    Array.from({ length: pairs }, (_, pair) => [
      { pair, side: 0 as const },
      { pair, side: 1 as const },
    ]).flat(),
  );
}

/** Only penalize a choice when the matching card was already known. */
export function knownMismatch(
  cards: MemoryCard[],
  first: number,
  second: number,
  seen: ReadonlySet<number>,
): boolean {
  return (
    cards[first].pair !== cards[second].pair &&
    cards.some((card, i) => i !== first && card.pair === cards[first].pair && seen.has(i))
  );
}

/**
 * The card a player who remembers what has been turned over picks next (the couch bot and the how-to card's ghost finger):
 * as a second card, the first card's partner if it has been seen, else one nobody has seen; as a first card, one whose
 * partner is already known, else one nobody has seen. -1 when nothing is left to pick.
 */
export function nextCard(
  cards: readonly MemoryCard[],
  seen: ReadonlySet<number>,
  matched: (i: number) => boolean,
  first: number | null,
): number {
  const open = (k: number) => !matched(k) && k !== first;
  const partner = (k: number) => cards.findIndex((c, j) => j !== k && c.pair === cards[k].pair);
  if (first !== null) {
    const friend = partner(first);
    return seen.has(friend) ? friend : cards.findIndex((_, k) => open(k) && !seen.has(k));
  }
  const known = cards.findIndex((_, k) => open(k) && seen.has(partner(k)));
  return known >= 0 ? known : cards.findIndex((_, k) => open(k) && !seen.has(k));
}

/** Normalized minutes on a twelve-hour dial, with both kinds and no repeated displayed hour. */
export function selectTimes(rng: Rng): number[] {
  const hours = rng.shuffle(Array.from({ length: 12 }, (_, h) => h)).slice(0, 3);
  const minutes = rng.shuffle([
    ...rng.pick([
      [0, 0, 30],
      [0, 30, 30],
    ]),
  ]);
  return hours.map((hour, i) => hour * 60 + minutes[i]);
}
const HOUR_WORDS = [
  'twelve',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
];
export function clockLabel(time: number): string {
  const hour = HOUR_WORDS[Math.floor(time / 60) % 12];
  return time % 60 === 0 ? `${hour} o'clock` : `half past ${hour}`;
}
export const digitalTime = (time: number): string =>
  `${Math.floor(time / 60) % 12 || 12}:${String(time % 60).padStart(2, '0')}`;
/** Actual learning-face geometry; reuse Clock Tower's continuous hour motion, in degrees from twelve. */
export function clockDrawing(time: number) {
  const hands = handsFor(time);
  const hand = (marks: number, length: number, width: number) => {
    const degrees = marks * 6,
      angle = (degrees * Math.PI) / 180;
    return { degrees, x: Math.sin(angle) * length, y: -Math.cos(angle) * length, length, width };
  };
  return {
    radius: 56,
    numeralSize: 14,
    digitalSize: 36,
    numerals: Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1,
        angle = (hour * Math.PI) / 6;
      return { text: String(hour), x: Math.sin(angle) * 45, y: -Math.cos(angle) * 45 };
    }),
    hour: hand(hands.hour, 24, 8),
    minute: hand(hands.minute, 34, 4),
  };
}

// Same total (level 13) -------------------------------------------------------------------------------------------------

/** One pair of level 13: a card of two groups of dots (`a` then `b`) and a card with their total as a numeral. */
export interface TotalSum {
  a: number;
  b: number;
  total: number;
}
/** Each group holds 1–5 dots, so totals run 2–10. */
export const TOTAL_PART = { min: 1, max: 5 } as const;
/**
 * Three distinct totals from 2–10, each split into two pictured groups of 1–5 with the seeded RNG. The pair is keyed to
 * the total's value, so no two total cards on a board name the same number and every split of a total has one partner.
 */
export function selectSums(rng: Rng): TotalSum[] {
  const totals = rng.shuffle(Array.from({ length: 9 }, (_, i) => i + 2)).slice(0, 3);
  return totals.map((total) => {
    const a = rng.int(
      Math.max(TOTAL_PART.min, total - TOTAL_PART.max),
      Math.min(TOTAL_PART.max, total - TOTAL_PART.min),
    );
    return { a, b: total - a, total };
  });
}
/** "two and three": what the groups card says when it turns over. */
export const groupsLabel = (sum: TotalSum): string => `${numberWord(sum.a - 1)} and ${numberWord(sum.b - 1)}`;
/** Counting across both groups, one number per dot: "one, two, three, four, five". */
export const countAcross = (total: number): string => NUMBER_WORDS.slice(0, total).join(', ');
/**
 * One group's dots in its half of a card: two columns, filled row by row, centred on (cx, 0). Five dots make rows of
 * two, two and one. The two groups sit either side of the card's centre line so they read as two parts of one total.
 */
export function groupDots(n: number, cx: number): DotSpot[] {
  const rows = Math.ceil(n / 2);
  return Array.from({ length: n }, (_, i) => {
    const inRow = i >= n - (n % 2) ? 1 : 2;
    return {
      x: cx + (inRow === 1 ? 0 : (i % 2) * 26 - 13),
      y: Math.floor(i / 2) * 26 - (rows - 1) * 13,
    };
  });
}
/** Both groups of a sum card: the first left of the centre line, the second right of it. */
export const totalCardDots = (sum: TotalSum): DotSpot[][] => [groupDots(sum.a, -32), groupDots(sum.b, 32)];

// Layout ---------------------------------------------------------------------------------------------------------------

export interface BoardLayout {
  cols: number;
  /** A card's side, in units. */
  size: number;
  /** The cards' centres, in deal order. */
  cards: { x: number; y: number }[];
  /** The face-off scoreboard's centre. */
  board: { x: number; y: number };
}

/**
 * The grid of `count` cards (`pairs` across when six or fewer, else four across), under the scoreboard and right of the
 * corner buttons and the pet. Upright the grid starts below the corner buttons and ends above the pet's corner, so it is
 * centred on the whole width and its cards grow to fill it; there a board of six or fewer goes two across, so a phone's
 * tall screen gives its cards (and the dots, clocks and words on them) room to be larger.
 */
export function boardLayout(v: { w: number; h: number }, count: number, pairs: number): BoardLayout {
  const upright = v.h > v.w;
  const cols = count <= 6 ? (upright ? 2 : pairs) : 4;
  const rows = Math.ceil(count / cols);
  const top = upright ? 230 : 115;
  const size = upright
    ? Math.min(cols === 2 ? 300 : 170, (v.h - top - 190) / rows - 16, (v.w - 40) / cols - 16)
    : Math.min(150, (v.h - 170) / rows - 16, (v.w - 240) / cols - 16);
  const step = size + 16;
  const cx = upright ? v.w / 2 : v.w / 2 + 40;
  return {
    cols,
    size,
    cards: Array.from({ length: count }, (_, i) => ({
      x: cx + ((i % cols) - (cols - 1) / 2) * step,
      y: top + size / 2 + Math.floor(i / cols) * step,
    })),
    board: { x: cx, y: upright ? 150 : 84 },
  };
}
