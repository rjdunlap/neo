import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Picnic Pantry's rules (docs/definitions/picnic-pantry.md): three dish cards draw on one pantry of three jars, a plan is two
 * different dishes, and every pair the pantry can cover is accepted. Every dish and count is invented puzzle data, not a recipe.
 */
export const LEVELS: BandLevels = { school: { min: 1, max: 1 } };
export const describeLevel = (_level: number) =>
  'Two dishes, one pantry: pick two of three dishes that three jars can cover (about 9 and up)';

/** A token kind: eight fruit pictures from `src/art/props.ts` and the game's own oat. */
export type Ingredient =
  'blueberries' | 'oat' | 'apple' | 'pear' | 'plum' | 'orange' | 'banana' | 'strawberry' | 'lemon';

/** Spoken names, one and many ("blueberries" is said as "berries"). */
export const INGREDIENT_WORDS: Record<Ingredient, readonly [one: string, many: string]> = {
  blueberries: ['berry', 'berries'],
  oat: ['oat', 'oats'],
  apple: ['apple', 'apples'],
  pear: ['pear', 'pears'],
  plum: ['plum', 'plums'],
  orange: ['orange', 'oranges'],
  banana: ['banana', 'bananas'],
  strawberry: ['strawberry', 'strawberries'],
  lemon: ['lemon', 'lemons'],
};

export type Triple = readonly [number, number, number];
/** What a dish picture is: the container it is served in. Its two ingredients come from its cost. */
export type DishShape = 'bowl' | 'cup' | 'square' | 'boat' | 'stack';

export interface Dish {
  name: string;
  shape: DishShape;
  /** Tokens it takes from each jar, in jar order. A dish serves two seats. */
  cost: Triple;
}

export interface Case {
  id: 'A' | 'B' | 'C' | 'D';
  /** Jar order, left to right. */
  ingredients: readonly [Ingredient, Ingredient, Ingredient];
  pantry: Triple;
  dishes: readonly [Dish, Dish, Dish];
}

/** The four frozen cases. Exactly two of each case's three pairs fit; the rule tests repeat the enumeration. */
export const CASES: readonly Case[] = [
  {
    id: 'A',
    ingredients: ['blueberries', 'oat', 'apple'],
    pantry: [4, 2, 2],
    dishes: [
      { name: 'Swirl', shape: 'bowl', cost: [2, 1, 0] },
      { name: 'Crunch', shape: 'square', cost: [0, 1, 2] },
      { name: 'Apple Bowl', shape: 'bowl', cost: [1, 0, 2] },
    ],
  },
  {
    id: 'B',
    ingredients: ['pear', 'oat', 'plum'],
    pantry: [3, 3, 2],
    dishes: [
      { name: 'Pear Boats', shape: 'boat', cost: [2, 1, 0] },
      { name: 'Pear Crumble', shape: 'square', cost: [2, 2, 0] },
      { name: 'Plum Cup', shape: 'cup', cost: [1, 0, 2] },
    ],
  },
  {
    id: 'C',
    ingredients: ['orange', 'oat', 'banana'],
    pantry: [2, 2, 3],
    dishes: [
      { name: 'Sunny Squares', shape: 'square', cost: [1, 2, 0] },
      { name: 'Banana Bites', shape: 'stack', cost: [0, 1, 2] },
      { name: 'Orange Cups', shape: 'cup', cost: [1, 0, 1] },
    ],
  },
  {
    id: 'D',
    ingredients: ['strawberry', 'oat', 'lemon'],
    pantry: [3, 2, 2],
    dishes: [
      { name: 'Berry Stack', shape: 'stack', cost: [2, 1, 0] },
      { name: 'Lemon Twists', shape: 'cup', cost: [1, 0, 2] },
      { name: 'Zesty Oats', shape: 'bowl', cost: [0, 1, 2] },
    ],
  },
];

/** Dishes on the blanket, as indexes into the case's dishes, in the order she placed them. The blanket has two places. */
export type Selection = readonly number[];

const JARS = [0, 1, 2] as const;

export function demand(c: Case, sel: Selection): Triple {
  return JARS.map((j) => sel.reduce((sum, d) => sum + c.dishes[d].cost[j], 0)) as unknown as Triple;
}

/** What the jars hold after the placed dishes took theirs; negative where a jar ran dry. */
export function remaining(c: Case, sel: Selection): Triple {
  const need = demand(c, sel);
  return JARS.map((j) => c.pantry[j] - need[j]) as unknown as Triple;
}

export interface Shortage {
  /** Jar index. */
  jar: number;
  short: number;
}

export function shortages(c: Case, sel: Selection): Shortage[] {
  const left = remaining(c, sel);
  return JARS.filter((j) => left[j] < 0).map((j) => ({ jar: j, short: -left[j] }));
}

/** A plan: two dishes and nothing short. Every plan that fits is accepted; leftovers are not scored. */
export const fits = (c: Case, sel: Selection) => sel.length === 2 && shortages(c, sel).length === 0;

/** The pairs of the case, as dish indexes in card-table order. */
export const PAIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [1, 2],
];
export const menusThatFit = (c: Case) => PAIRS.filter((p) => fits(c, p));
export const sameMenu = (a: Selection, b: Selection) =>
  a.length === b.length && a.every((d) => b.includes(d));

/**
 * How the tokens lie: each placed dish, in placement order, takes what its jar can still give; the rest of its cost shows as
 * empty outlines. `got[k][j]` tokens of jar `j` sit beside the `k`th placed dish, and `cost − got` are outlines.
 */
export function allocation(c: Case, sel: Selection): Triple[] {
  const left = [...c.pantry];
  return sel.map(
    (d) =>
      JARS.map((j) => {
        const take = Math.min(left[j], c.dishes[d].cost[j]);
        left[j] -= take;
        return take;
      }) as unknown as Triple,
  );
}

export type Repair = { add: number } | { putBack: number } | 'lay';

export interface RepairOptions {
  /** Menus already laid in this case: a tie goes to one she has not laid. */
  laid?: readonly Selection[];
  /** The cards' screen order, as dish indexes; table order when absent. */
  order?: readonly number[];
}

/**
 * The first step of a shortest path of edits to a plan that fits. Ties keep the dish she placed first, then prefer a menu
 * she has not laid yet, then follow screen order. An empty blanket starts with a dish that is in every menu that fits.
 * The path only ever adds a dish of the menu it is heading for, so it never passes through the pair that does not fit.
 */
export function repair(c: Case, sel: Selection, opts: RepairOptions = {}): Repair {
  if (fits(c, sel)) return 'lay';
  const order = opts.order ?? [0, 1, 2];
  const laid = opts.laid ?? [];
  const rank = (d: number) => order.indexOf(d);
  const menus = menusThatFit(c);
  const edits = (m: readonly number[]) =>
    sel.filter((d) => !m.includes(d)).length + m.filter((d) => !sel.includes(d)).length;
  const key = (m: readonly number[]) => [
    edits(m),
    sel.length && m.includes(sel[0]) ? 0 : 1,
    laid.some((l) => sameMenu(l, m)) ? 1 : 0,
    Math.min(...m.map(rank)),
    Math.max(...m.map(rank)),
  ];
  const target = [...menus].sort((a, b) => {
    const ka = key(a),
      kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return 0;
  })[0];
  // The dish placed last goes back first, so the one she chose first stays whenever it can.
  const extra = [...sel].reverse().find((d) => !target.includes(d));
  if (extra !== undefined) return { putBack: extra };
  const missing = target.filter((d) => !sel.includes(d));
  const inEvery = (d: number) => menus.every((m) => m.includes(d));
  missing.sort((a, b) => Number(inEvery(b)) - Number(inEvery(a)) || rank(a) - rank(b));
  return { add: missing[0] };
}

export interface ShortReason {
  jar: number;
  /** What each of the two placed dishes needs from this jar, in placement order. */
  needs: readonly [number, number];
  sum: number;
  pantry: number;
}

/** Why a pair does not fit: each short jar with the two needs, their sum and what the pantry holds. Empty for any other selection. */
export function explain(c: Case, sel: Selection): ShortReason[] {
  if (sel.length !== 2) return [];
  return shortages(c, sel).map(({ jar }) => {
    const needs = [c.dishes[sel[0]].cost[jar], c.dishes[sel[1]].cost[jar]] as const;
    return { jar, needs, sum: needs[0] + needs[1], pantry: c.pantry[jar] };
  });
}

export interface Picnic {
  case: Case;
  /** The cards' screen order, as dish indexes. */
  order: number[];
}

/** A round is two picnics: two different cases, each with its cards in a seeded order. Nothing carries between them. */
export function makeRound(rng: Rng): [Picnic, Picnic] {
  const [first, second] = rng.shuffle([...CASES]);
  const picnic = (c: Case): Picnic => ({ case: c, order: rng.shuffle([0, 1, 2]) });
  return [picnic(first), picnic(second)];
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);
export const ingredientWord = (i: Ingredient, n: number) => INGREDIENT_WORDS[i][n === 1 ? 0 : 1];
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "two berries and one oat": the jars with a count above zero, in jar order. Empty when every count is zero. */
export function countPhrase(c: Case, counts: Triple): string {
  const parts = JARS.filter((j) => counts[j] > 0).map(
    (j) => `${numberWord(counts[j])} ${ingredientWord(c.ingredients[j], counts[j])}`,
  );
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** The same phrase starting a sentence. */
export const countSentence = (c: Case, counts: Triple) => capital(countPhrase(c, counts));
export const jarName = (c: Case, jar: number) => capital(INGREDIENT_WORDS[c.ingredients[jar]][1]);

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PantryLayout {
  jars: Box[];
  blanket: Box;
  /** The two dish places on the blanket. */
  places: Box[];
  /** Four cushions around the blanket's dishes. */
  seats: { x: number; y: number }[];
  cards: Box[];
  bell: Box;
  next: Box;
  another: Box;
}

const seatsAround = (b: Box) =>
  [-1, 1].flatMap((side) => [-40, 130].map((dy) => ({ x: b.x + side * 255, y: b.y + dy })));

/**
 * Where everything sits, by center, for a view of `w` × `h` units. Sideways: the shelf across the top, the cards in a column
 * at the right, the bell bottom-right. Upright: shelf, blanket with the bell beside it, then the cards in one row. Both keep
 * clear of Home and help (top-left) and the guide (bottom-left), and both sit in the guaranteed design rectangle.
 */
export function pantryLayout(w: number, h: number, upright: boolean): PantryLayout {
  const box = (x: number, y: number, bw: number, bh: number): Box => ({ x, y, w: bw, h: bh });
  if (upright) {
    const ox = (w - 768) / 2,
      oy = (h - 1024) / 2;
    const blanket = box(ox + 300, oy + 455, 560, 390);
    return {
      jars: [230, 420, 610].map((x) => box(ox + x, oy + 150, 170, 180)),
      blanket,
      places: [-115, 115].map((dx) => box(blanket.x + dx, blanket.y, 220, 230)),
      seats: seatsAround(blanket),
      cards: [128, 384, 640].map((x) => box(ox + x, oy + 745, 236, 150)),
      bell: box(ox + 678, oy + 455, 150, 150),
      another: box(ox + 320, oy + 940, 280, 110),
      next: box(ox + 620, oy + 940, 260, 110),
    };
  }
  const ox = (w - 1024) / 2,
    oy = (h - 768) / 2;
  const blanket = box(ox + 450, oy + 420, 560, 390);
  return {
    jars: [270, 450, 630].map((x) => box(ox + x, oy + 120, 170, 180)),
    blanket,
    places: [-115, 115].map((dx) => box(blanket.x + dx, blanket.y, 220, 230)),
    seats: seatsAround(blanket),
    cards: [100, 260, 420].map((y) => box(ox + 885, oy + y, 236, 150)),
    bell: box(ox + 885, oy + 610, 150, 150),
    another: box(ox + 330, oy + 695, 280, 110),
    next: box(ox + 620, oy + 695, 260, 110),
  };
}
