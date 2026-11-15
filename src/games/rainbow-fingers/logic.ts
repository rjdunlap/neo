import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { PAINTING_MAX_MARKS, type PaintingMark } from '../../content/creations';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Primary = 'red' | 'yellow' | 'blue';
/** What can go into the mixing bowl: the primaries, and at level 9 white, the first pour that makes a color lighter. */
export type Pour = Primary | 'white';
export type ThingId =
  | 'sun'
  | 'apple'
  | 'leaf'
  | 'pumpkin'
  | 'grapes'
  | 'blueberry'
  | 'banana'
  | 'chick'
  | 'lemon'
  | 'strawberry'
  | 'ladybug'
  | 'cherries'
  | 'frog'
  | 'turtle'
  | 'broccoli'
  | 'whale'
  | 'puddle'
  | 'plum'
  | 'eggplant'
  | 'carrot'
  | 'basketball'
  | 'pig'
  | 'flamingo'
  | 'cupcake'
  | 'tulip'
  | 'bear'
  | 'acorn'
  | 'owl';
export type Circle = [x: number, y: number, r: number];

/** A coloring-page picture: its true color and the circles whose union is the part to paint. */
export interface Thing {
  id: ThingId;
  color: ColorName;
  circles: Circle[];
}

export const THINGS: Thing[] = [
  { id: 'sun', color: 'yellow', circles: [[0, 0, 84]] },
  {
    id: 'apple',
    color: 'red',
    circles: [
      [-38, 8, 62],
      [38, 8, 62],
      [0, 22, 66],
    ],
  },
  {
    id: 'leaf',
    color: 'green',
    circles: [
      [-92, 46, 20],
      [-62, 31, 36],
      [-22, 11, 50],
      [20, -10, 50],
      [58, -29, 36],
      [86, -43, 20],
    ],
  },
  {
    id: 'pumpkin',
    color: 'orange',
    circles: [
      [-52, 12, 56],
      [52, 12, 56],
      [0, 6, 68],
    ],
  },
  {
    id: 'grapes',
    color: 'purple',
    circles: [
      [-62, -36, 36],
      [0, -36, 36],
      [62, -36, 36],
      [-31, 20, 36],
      [31, 20, 36],
      [0, 74, 36],
    ],
  },
  { id: 'blueberry', color: 'blue', circles: [[0, 0, 82]] },
  {
    id: 'banana',
    color: 'yellow',
    // A smile of circles, thickest in the middle.
    circles: [
      [-106, -34, 21],
      [-85, -12, 27],
      [-64, 4, 32],
      [-43, 16, 35],
      [-22, 24, 37],
      [0, 26, 38],
      [22, 24, 37],
      [43, 16, 35],
      [64, 4, 32],
      [85, -12, 27],
      [106, -34, 21],
    ],
  },
  {
    id: 'chick',
    color: 'yellow',
    circles: [
      [-8, 30, 72],
      [40, -52, 46],
      [-74, 6, 24],
    ],
  },
  {
    id: 'lemon',
    color: 'yellow',
    circles: [
      [-52, 0, 50],
      [-28, 0, 60],
      [0, 0, 66],
      [28, 0, 60],
      [52, 0, 50],
      [-98, 0, 18],
      [98, 0, 18],
    ],
  },
  {
    id: 'strawberry',
    color: 'red',
    circles: [
      [-46, -30, 44],
      [46, -30, 44],
      [0, -6, 68],
      [0, 44, 50],
      [0, 84, 22],
    ],
  },
  { id: 'ladybug', color: 'red', circles: [[0, 18, 82]] },
  {
    id: 'cherries',
    color: 'red',
    circles: [
      [-50, 52, 48],
      [50, 60, 48],
    ],
  },
  {
    id: 'frog',
    color: 'green',
    // A round body with two eye bumps on top.
    circles: [
      [0, 30, 76],
      [-46, -40, 32],
      [46, -40, 32],
    ],
  },
  {
    id: 'turtle',
    color: 'green',
    // A domed shell, a head out to the right and two feet below.
    circles: [
      [-8, 0, 72],
      [92, -4, 28],
      [-56, 66, 22],
      [40, 66, 22],
    ],
  },
  {
    id: 'broccoli',
    color: 'green',
    // Bumpy florets on a thick stalk.
    circles: [
      [-52, -34, 44],
      [0, -56, 48],
      [52, -34, 44],
      [0, -14, 48],
      [0, 46, 30],
      [0, 82, 28],
    ],
  },
  {
    id: 'whale',
    color: 'blue',
    // A big round body and a tail that tapers up at the left (the flukes are drawn on top).
    circles: [
      [-4, 22, 74],
      [62, 28, 56],
      [-76, 6, 28],
      [-92, -16, 21],
      [-102, -36, 16],
      [-108, -52, 12],
    ],
  },
  {
    id: 'puddle',
    color: 'blue',
    // A wide, flat oval, like the banana a row of circles that is fattest in the middle.
    circles: [
      [-90, 30, 26],
      [-72, 30, 31],
      [-54, 30, 35],
      [-36, 30, 37],
      [-18, 30, 38],
      [0, 30, 38],
      [18, 30, 38],
      [36, 30, 37],
      [54, 30, 35],
      [72, 30, 31],
      [90, 30, 26],
    ],
  },
  { id: 'plum', color: 'purple', circles: [[0, 14, 78]] },
  {
    id: 'eggplant',
    color: 'purple',
    // Narrow at the top left, fat at the bottom right.
    circles: [
      [-62, -52, 32],
      [-32, -22, 44],
      [6, 12, 56],
      [40, 44, 58],
    ],
  },
  {
    id: 'carrot',
    color: 'orange',
    // Wide at the top under its leaves, tapering to a point at the bottom.
    circles: [
      [0, -56, 52],
      [0, -22, 48],
      [0, 12, 41],
      [0, 42, 33],
      [0, 68, 25],
      [0, 89, 18],
      [0, 104, 12],
    ],
  },
  { id: 'basketball', color: 'orange', circles: [[0, 0, 84]] },
  // The pinks, for level 9 only (pink is not a pot and not on the wheel, so no older level deals one).
  {
    id: 'pig',
    color: 'pink',
    // A round body, a head up to the right and its snout (ears, legs and tail are drawn on top).
    circles: [
      [-24, 22, 68],
      [56, -6, 50],
      [100, 6, 22],
    ],
  },
  {
    id: 'flamingo',
    color: 'pink',
    // A plump body, an S of a neck rising at the left and a round head (beak and legs are drawn on top).
    circles: [
      [10, 34, 50],
      [52, 26, 36],
      [-18, 6, 17],
      [-24, -6, 16],
      [-28, -18, 15],
      [-31, -30, 15],
      [-33, -42, 15],
      [-32, -54, 15],
      [-29, -66, 15],
      [-22, -78, 16],
      [-8, -90, 22],
    ],
  },
  {
    id: 'cupcake',
    color: 'pink',
    // A swirl of frosting (the paper wrapper and the cherry are drawn on top).
    circles: [
      [-50, -6, 40],
      [0, -18, 52],
      [50, -6, 40],
      [0, -64, 32],
    ],
  },
  {
    id: 'tulip',
    color: 'pink',
    // A cup of petals with three points at the top (the stem and leaf are drawn on top).
    circles: [
      [-36, -14, 36],
      [36, -14, 36],
      [0, -4, 46],
      [0, -48, 32],
      [-30, -50, 20],
      [30, -50, 20],
    ],
  },
  // The browns, for level 10 only (brown is three pours, not a pot and not on the wheel, so no older level deals one).
  {
    id: 'bear',
    color: 'brown',
    // A sitting bear: a round body, a round head and two round ears (eyes, muzzle and paws are drawn on top).
    circles: [
      [0, 44, 70],
      [0, -46, 50],
      [-40, -86, 18],
      [40, -86, 18],
    ],
  },
  {
    id: 'acorn',
    color: 'brown',
    // The nut, rounding to a point at the bottom (the cap and its stem are drawn on top).
    circles: [
      [0, 6, 64],
      [0, 46, 50],
      [0, 82, 26],
    ],
  },
  {
    id: 'owl',
    color: 'brown',
    // A plump body, a round head and two ear tufts (eyes, beak, belly marks and feet are drawn on top).
    circles: [
      [0, 30, 68],
      [0, -42, 54],
      [-38, -88, 16],
      [38, -88, 16],
    ],
  },
];

/**
 * Pictures a page may name but never ask her to remember: a four-year-old would not give one color for a puddle, so recall pages
 * leave it out and a named page says "Paint the puddle blue!".
 */
export const NAMED_ONLY: ReadonlySet<ThingId> = new Set<ThingId>(['puddle']);

/**
 * Pictures only for a page that tells the recipe (level 9): a cupcake or a tulip comes in many colors, so a later recall page must
 * not ask her to remember one. The pig and the flamingo are pink to anyone.
 */
export const TOLD_ONLY: ReadonlySet<ThingId> = new Set<ThingId>(['cupcake', 'tulip']);

/** Every picture, outline included, fits the page's 280 by 270 slot around its centre (`layoutPictures` in `index.ts`). */
export const SLOT = { w: 280, h: 270 };

/** What the voice calls each picture. A name never equals a color word, so no line can say "paint the orange orange". */
export const THING_NAMES: Record<ThingId, string> = {
  sun: 'sun',
  apple: 'apple',
  leaf: 'leaf',
  pumpkin: 'pumpkin',
  grapes: 'grapes',
  blueberry: 'blueberry',
  banana: 'banana',
  chick: 'chick',
  lemon: 'lemon',
  strawberry: 'strawberry',
  ladybug: 'ladybug',
  cherries: 'cherries',
  frog: 'frog',
  turtle: 'turtle',
  broccoli: 'broccoli',
  whale: 'whale',
  puddle: 'puddle',
  plum: 'plum',
  eggplant: 'eggplant',
  carrot: 'carrot',
  basketball: 'basketball',
  pig: 'pig',
  flamingo: 'flamingo',
  cupcake: 'cupcake',
  tulip: 'tulip',
  bear: 'bear',
  acorn: 'acorn',
  owl: 'owl',
};

/**
 * The colors a picture may honestly be painted when she has to remember it: the told answer first (its `color`), then real
 * alternatives (apples and grapes come green too). Only the recall level takes an alternative; where the voice names the color,
 * or a recipe, that color is the one asked for.
 */
export const ACCEPTS: Record<ThingId, ColorName[]> = {
  sun: ['yellow'],
  apple: ['red', 'green'],
  leaf: ['green'],
  pumpkin: ['orange'],
  grapes: ['purple', 'green'],
  blueberry: ['blue'],
  banana: ['yellow'],
  chick: ['yellow'],
  lemon: ['yellow'],
  strawberry: ['red'],
  ladybug: ['red'],
  cherries: ['red'],
  frog: ['green'],
  turtle: ['green'],
  broccoli: ['green'],
  whale: ['blue'],
  puddle: ['blue'],
  plum: ['purple'],
  eggplant: ['purple'],
  carrot: ['orange'],
  basketball: ['orange'],
  pig: ['pink'],
  flamingo: ['pink'],
  cupcake: ['pink'],
  tulip: ['pink'],
  bear: ['brown'],
  acorn: ['brown'],
  owl: ['brown'],
};

/** Whether a dab of `color` paints `thing` on a page of this mode. */
export function accepts(thing: Thing | Petal, mode: PaintMode, color: ColorName | null): boolean {
  if (!color) return false;
  return mode === 'recall' && thing.id !== 'petal'
    ? ACCEPTS[thing.id].includes(color)
    : color === thing.color;
}

/** The line the voice says when a picture is finished in an accepted color that is not the told one: "Green apples are real too!" */
export const alsoLine = (thing: Thing, color: ColorName) => `paint.also.${thing.id}.${color}` as const;

/**
 * The rainbow name nearest a hue in degrees, as the free brush draws it (`hsl(h, 0.85, 0.62)`): red at 0 and again past 322,
 * orange near 30, yellow near 58, green near 120, blue near 215 and purple near 280.
 */
export function hueName(h: number): ColorName {
  const hue = ((h % 360) + 360) % 360;
  if (hue < 15 || hue >= 322) return 'red';
  if (hue < 44) return 'orange';
  if (hue < 90) return 'yellow';
  if (hue < 170) return 'green';
  if (hue < 250) return 'blue';
  return 'purple';
}

/** The free levels say the color of a finished stroke or a splat, at most this often (seconds). */
export const ECHO_EVERY = 6;
export const echoes = (mode: PaintMode) => mode === 'free' || mode === 'pots';

/**
 * free: rainbow painting. pots: pick a color. named: "paint the sun yellow". recall: "paint the sun" (what color is it?). mix: make
 * the color from two pots. recall-mix: remember the color, then mix it. wheel: finish a color wheel, mixing each empty petal from the
 * two painted petals beside it.
 */
export type PaintMode = 'free' | 'pots' | 'named' | 'recall' | 'mix' | 'recall-mix' | 'wheel';
/** The mixing pages pour primaries into a bowl instead of selecting a pot directly. */
export function pours(mode: PaintMode): boolean {
  return mode === 'mix' || mode === 'recall-mix' || mode === 'wheel';
}

export interface PaintPlan {
  mode: PaintMode;
  /** Pictures on the page. */
  count: number;
  /** A white pot joins the primaries and the pictures are the pinks (level 9). */
  white?: boolean;
  /** The bowl takes three pours and the pictures are the browns: red, yellow and blue together (level 10). */
  three?: boolean;
}

export const PLANS: PaintPlan[] = [
  { mode: 'free', count: 0 },
  { mode: 'pots', count: 0 },
  { mode: 'named', count: 2 },
  { mode: 'named', count: 3 },
  { mode: 'recall', count: 3 },
  { mode: 'mix', count: 2 },
  { mode: 'recall-mix', count: 1 },
  { mode: 'wheel', count: 3 },
  { mode: 'mix', count: 2, white: true },
  { mode: 'mix', count: 2, three: true },
];

/** Rainbows, then pots, then coloring pages: named colors, remembered colors, mixed colors, and a recalled mix (`logic.ts`). */
export const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 10 },
};

export function planFor(level: number): PaintPlan {
  return PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
}

/**
 * The pours that make each mixed color: the three secondaries, pink (red and white, told only at level 9) and brown (all three
 * primaries, told only at level 10).
 */
export const RECIPES: Partial<Record<ColorName, readonly Pour[]>> = {
  orange: ['red', 'yellow'],
  green: ['yellow', 'blue'],
  purple: ['red', 'blue'],
  pink: ['red', 'white'],
  brown: ['red', 'yellow', 'blue'],
};

/**
 * What a bowl of pours makes. Only which paints are in it matters, not the order or a repeat: one paint stays itself, and a set of
 * paints that is exactly a recipe makes that color. White with yellow or blue stays that color (lighter paint, but no new name), so
 * white only ever makes pink, and two different primaries always make their secondary, whatever repeats.
 */
export function mix(...poured: Pour[]): ColorName {
  const set = [...new Set(poured)];
  if (set.length === 1) return set[0];
  for (const [color, recipe] of Object.entries(RECIPES))
    if (recipe!.length === set.length && set.every((p) => recipe!.includes(p))) return color as ColorName;
  const paints = set.filter((p) => p !== 'white');
  return paints.length < set.length && paints.length > 0 ? mix(...paints) : set[0];
}

/** How many pours the bowl holds on a page: three at level 10 (brown), two everywhere else. */
export function bowlHolds(plan: PaintPlan): number {
  return plan.three ? 3 : 2;
}

/** The bowl after one more pour: a full bowl starts over with this pour. */
export function pourInto(poured: readonly Pour[], pour: Pour, holds: number): Pour[] {
  return poured.length >= holds ? [pour] : [...poured, pour];
}

/**
 * The next pour toward a recipe: the first missing paint while everything in the bowl belongs to it once; a full bowl starts over
 * with the first paint; anything else (a wrong paint, or one poured twice) empties the bowl first.
 */
export function nextPour(recipe: readonly Pour[], poured: readonly Pour[]): Pour | 'empty' {
  if (poured.length >= recipe.length) return recipe[0];
  if (new Set(poured).size === poured.length && poured.every((p) => recipe.includes(p)))
    return recipe.find((p) => !poured.includes(p))!;
  return 'empty';
}

/** The paper the pictures are painted on. */
export const PAPER = 0xfffdf6;

/**
 * How the bowl shows what is in it: one pour is that paint, two are their mix. The rim is the paint's own darker line, so a pour of
 * white still shows on the white dish and the paper.
 */
export function bowlLook(poured: readonly Pour[]): { fill: number; rim: number } | null {
  if (poured.length === 0) return null;
  const sw = swatch[mix(...poured)];
  return { fill: sw.fill, rim: sw.line };
}

/**
 * The pictures for one page: first `count` different colors, then one picture of each, so a page never asks for two yellows and a
 * color with more pictures is not drawn more often. Mixing pages only use colors that need mixing; recall pages skip `NAMED_ONLY`.
 * The color wheel's pictures are its three empty petals, asked once each in a seeded order.
 */
export function pickThings(plan: PaintPlan, rng: Rng): (Thing | Petal)[] {
  if (plan.mode === 'wheel') return rng.shuffle(WHEEL.filter((petal) => RECIPES[petal.color]));
  if (plan.mode === 'recall-mix') return [THINGS.find((thing) => thing.id === 'pumpkin')!];
  // Level 9's pictures are all pink, so they are drawn as distinct pictures, not distinct colors.
  if (plan.white) return rng.shuffle(THINGS.filter((t) => t.color === 'pink')).slice(0, plan.count);
  // Level 10's are all brown, drawn the same way.
  if (plan.three) return rng.shuffle(THINGS.filter((t) => t.color === 'brown')).slice(0, plan.count);
  // The older pages keep to the rainbow, so their seeded pictures are as they were before the pinks came.
  const pool = THINGS.filter(
    (t) =>
      RAINBOW.includes(t.color) &&
      (plan.mode === 'mix' ? RECIPES[t.color] : plan.mode !== 'recall' || !NAMED_ONLY.has(t.id)),
  );
  const colors = rng.shuffle([...new Set(pool.map((t) => t.color))]).slice(0, plan.count);
  return colors.map((color) => rng.pick(pool.filter((t) => t.color === color)));
}

/** A petal of the level-8 color wheel: its color and the circles (around the wheel's centre) whose union is the part to paint. */
export interface Petal {
  id: 'petal';
  color: ColorName;
  circles: Circle[];
}

/** Each petal is three circles out along its spoke: (distance from the centre, radius). The widest is 108 across. */
const PETAL_CIRCLES: [d: number, r: number][] = [
  [104, 42],
  [156, 54],
  [208, 42],
];
/** The plain disc in the middle of the flower, which is never painted; the petals start just outside it. */
export const WHEEL_HUB = 50;
/** From the centre to the outside of the outline (the farthest petal circle plus the outline's 12-unit pad). */
export const WHEEL_REACH = 208 + 42 + 12;

/**
 * The six petals in `RAINBOW` order, red at the top and going clockwise, so each secondary sits between the two primaries that make
 * it (purple between blue and red, round the back).
 */
export const WHEEL: Petal[] = RAINBOW.map((color, i) => {
  const a = ((-90 + 60 * i) * Math.PI) / 180;
  return {
    id: 'petal',
    color,
    circles: PETAL_CIRCLES.map(([d, r]): Circle => [d * Math.cos(a), d * Math.sin(a), r]),
  };
});

/** The two petals either side of a petal: for an empty petal, the two colors that mix to make it. */
export function wheelNeighbors(color: ColorName): [ColorName, ColorName] {
  const i = RAINBOW.indexOf(color);
  return [RAINBOW[(i + RAINBOW.length - 1) % RAINBOW.length], RAINBOW[(i + 1) % RAINBOW.length]];
}

/** Where the wheel sits and how big: centred in the paper above the pots, as large as fits, at most 1.15. */
export function wheelLayout(w: number, h: number): { x: number; y: number; scale: number } {
  const top = MARGIN + 30;
  const bottom = h - 130;
  const across = w - 2 * (MARGIN + 30);
  const scale = Math.min(1.15, across / (2 * WHEEL_REACH), (bottom - top) / (2 * WHEEL_REACH));
  return { x: w / 2, y: (top + bottom) / 2, scale };
}

export function inside(circles: Circle[], x: number, y: number): boolean {
  return circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r);
}

/** Tracks how much of a picture has been painted by sampling a grid of points inside it. */
export class Coverage {
  private readonly points: { x: number; y: number }[] = [];
  readonly total: number;

  constructor(circles: Circle[], step = 14) {
    const x0 = Math.min(...circles.map(([x, , r]) => x - r));
    const x1 = Math.max(...circles.map(([x, , r]) => x + r));
    const y0 = Math.min(...circles.map(([, y, r]) => y - r));
    const y1 = Math.max(...circles.map(([, y, r]) => y + r));
    for (let y = y0 + step / 2; y < y1; y += step)
      for (let x = x0 + step / 2; x < x1; x += step) if (inside(circles, x, y)) this.points.push({ x, y });
    this.total = this.points.length;
  }

  /** Paint a dab of radius r. Returns how much of the picture is now covered (0..1). */
  paint(x: number, y: number, r: number): number {
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      if (Math.hypot(p.x - x, p.y - y) <= r) this.points.splice(i, 1);
    }
    return this.covered;
  }

  get covered(): number {
    return 1 - this.points.length / this.total;
  }
}

/** The paper's margin, and the brush: stamps are `BRUSH_RADIUS` wide, `SPACING` apart along a stroke, and every second one dabs a picture. */
export const MARGIN = 18;
export const BRUSH_RADIUS = 24;
export const SPACING = 5;
/** A picture counts as painted when this much of it is covered; then it fills in neatly. */
export const PAINTED = 0.7;

export interface PaintState {
  mode: PaintMode;
  /** Strokes finished so far: the free levels show the hang-it-up button after five. */
  strokes: number;
  /** The picked color (null: rainbow, or none yet), and what has been poured into the bowl. */
  brush: ColorName | null;
  poured: Pour[];
  /** The color of the picture being asked for, or null when there is none (the free levels, or every picture done). */
  picture: ColorName | null;
  /** The hang-it-up button is showing. */
  frame: boolean;
  /** A fold page, and whether it has been folded yet. */
  fold?: boolean;
  folded?: boolean;
}

export type PaintMove =
  { do: 'pot'; pot: ColorName } | { do: 'bowl' } | { do: 'stroke' } | { do: 'frame' } | { do: 'fold' };

/** On a fold page the ghost finger presses fold after this many strokes (or sooner, once the frame shows); with the fold that makes the five touches the frame needs. */
export const FOLD_AFTER = 4;

/**
 * What a capable child does next. Free painting: five strokes, then the frame. Pots: a different color for each of five strokes.
 * A picture: pick the pot of its color (or pour the two primaries that make it), then fill it; and when every picture is painted, the
 * frame. It never paints with a color that is not the picture's, which is the one wrong move.
 */
export function paintStep(s: PaintState): PaintMove | null {
  // A fold page is folded once before it is hung up, even when the frame came early (one touch and a long look).
  if (s.fold && !s.folded && (s.strokes >= FOLD_AFTER || (s.frame && s.strokes > 0))) return { do: 'fold' };
  if (s.frame) return { do: 'frame' };
  if (s.mode === 'free') return { do: 'stroke' };
  if (s.mode === 'pots') {
    const want = RAINBOW[s.strokes % RAINBOW.length];
    return s.brush === want ? { do: 'stroke' } : { do: 'pot', pot: want };
  }
  if (!s.picture) return null;
  if (s.brush === s.picture) return { do: 'stroke' };
  if (!pours(s.mode)) return { do: 'pot', pot: s.picture };
  const next = nextPour(RECIPES[s.picture]!, s.poured);
  return next === 'empty' ? { do: 'bowl' } : { do: 'pot', pot: next };
}

export interface Pt {
  x: number;
  y: number;
}

/** What a lifted touch was: a quick pat (it splats a flower), a press held in place, or a drag that paints a line. */
export type Touch = 'pat' | 'hold' | 'drag';

export function touchKind(travelled: number, seconds: number): Touch {
  if (travelled < 14 && seconds < 0.5) return 'pat';
  return travelled > 40 ? 'drag' : 'hold';
}

/** Every kind of touch counts toward hanging the painting up, so a child who only pats, slaps or holds finishes too. */
export function strokesCounted(touches: readonly Touch[]): number {
  return touches.length;
}

/** The free levels show the hang-it-up button after five touches, or after one and a long look. */
export function frameShows(counted: number, seconds: number): boolean {
  return counted >= 5 || (counted >= 1 && seconds > 25);
}

/** A pat's splat: a flower on a round blot this far across from its centre, so it is at least 100 units wide. */
export const SPLAT_RADIUS = 50;

/** Pots are 104 across (hit circles of 52) and 104 apart; the mixing bowl takes 1.4 slots. */
export const POT_RADIUS = 52;
export const POT_SPACING = 104;
const BOWL_SLOTS = 1.4;
/** The bottom-left corner the pet stands in: nothing touchable sits left of this. */
export const PET_CLEAR = 150;
const ROW_GAP = 120;

/**
 * Centres for `n` pots (and the bowl after them, when mixing) along the bottom of a `w` × `h` view: one centred row clear of the pet,
 * wrapping to two rows (the top row first, the longer one) when one would not fit between the pet and the right edge.
 */
export function potLayout(n: number, w: number, h: number, bowl = false): { pots: Pt[]; bowl?: Pt } {
  const left = PET_CLEAR + POT_RADIUS;
  const right = w - MARGIN - 22 - POT_RADIUS;
  const slots = n + (bowl ? BOWL_SLOTS : 0);
  const fits = (k: number) => (k - 1) * POT_SPACING <= right - left;
  const rows = fits(slots) ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
  const pots: Pt[] = [];
  let bowlAt: Pt | undefined;
  rows.forEach((count, r) => {
    const span = count + (bowl && r === rows.length - 1 ? BOWL_SLOTS : 0);
    const width = (span - 1) * POT_SPACING;
    const centre = Math.min(right - width / 2, Math.max(left + width / 2, w / 2));
    const y = h - 58 - (rows.length - 1 - r) * ROW_GAP;
    const x0 = centre - width / 2;
    for (let i = 0; i < count; i++) pots.push({ x: x0 + i * POT_SPACING, y });
    if (bowl && r === rows.length - 1) bowlAt = { x: x0 + (span - 1) * POT_SPACING - 10, y };
  });
  return bowlAt ? { pots, bowl: bowlAt } : { pots };
}

/** A mark on each color pot, so the color is not the only way to tell the pots apart. */
export type PotMark = 'dot' | 'stripe' | 'star' | 'heart' | 'swirl' | 'ring' | 'cloud';
export const POT_MARKS: Record<string, PotMark> = {
  red: 'dot',
  orange: 'stripe',
  yellow: 'star',
  green: 'heart',
  blue: 'swirl',
  purple: 'ring',
  white: 'cloud',
};

/** The free levels nudge after this long without a touch: a sparkle on a blank spot and a wiggle from the pet. Never a hint. */
export const NUDGE_AFTER = 8;
export const nudges = (mode: PaintMode) => mode === 'free' || mode === 'pots';

/** Of the candidate spots, the one farthest from any paint already on the page. */
export function blankSpot(painted: readonly Pt[], candidates: readonly Pt[]): Pt {
  let best = candidates[0];
  let far = -1;
  for (const c of candidates) {
    const d = painted.length ? Math.min(...painted.map((p) => Math.hypot(p.x - c.x, p.y - c.y))) : Infinity;
    if (d > far) [best, far] = [c, d];
  }
  return best;
}

/** The part of the paper free strokes stay in: clear of the home button, the pet, the pots below and the frame button above right. */
export const scribbleArea = (w: number, h: number) => ({
  x: 150,
  y: 140,
  w: Math.max(200, w - 150 - 130),
  h: Math.max(120, h - 140 - 180),
});

/** A wavy band across the paper for the i-th free stroke, long enough to count as a stroke (over 40 units), the bands one above the other. */
export function scribble(i: number, area: { x: number; y: number; w: number; h: number }): Pt[] {
  const row = i % 5;
  const y = area.y + ((row + 0.5) * area.h) / 5;
  const amp = Math.min(30, area.h / 12);
  const forward = row % 2 === 0;
  return Array.from({ length: 7 }, (_, k) => {
    const t = forward ? k / 6 : 1 - k / 6;
    return { x: area.x + area.w * (0.1 + 0.8 * t), y: y + (k % 2 ? amp : -amp) };
  });
}

/**
 * A zig-zag, in a picture's own units, that paints at least `PAINTED` of it: horizontal rows across the union of its circles, a
 * little over one brush reach apart (the brush reaches `BRUSH_RADIUS + 6` paper units, `1 / scale` times that in picture units),
 * each pulled in a few units from the edge so every dab lands on the picture.
 */
export function fillPath(circles: Circle[], scale: number): Pt[] {
  const reach = (BRUSH_RADIUS + 6) / scale;
  const y0 = Math.min(...circles.map(([, y, r]) => y - r));
  const y1 = Math.max(...circles.map(([, y, r]) => y + r));
  const rows = Math.max(2, Math.ceil((y1 - y0) / (reach * 1.1)));
  const path: Pt[] = [];
  for (let k = 0; k < rows; k++) {
    const y = y0 + ((k + 0.5) * (y1 - y0)) / rows;
    const spans = circles
      .filter(([, cy, r]) => Math.abs(y - cy) < r - 4)
      .map(([cx, cy, r]) => [cx - Math.sqrt(r * r - (y - cy) ** 2), cx + Math.sqrt(r * r - (y - cy) ** 2)]);
    if (!spans.length) continue;
    const x0 = Math.min(...spans.map((q) => q[0])) + 4;
    const x1 = Math.max(...spans.map((q) => q[1])) - 4;
    path.push(
      ...(k % 2
        ? [
            { x: x1, y },
            { x: x0, y },
          ]
        : [
            { x: x0, y },
            { x: x1, y },
          ]),
    );
  }
  return path;
}

/** A level-2 page is plain or a fold page (paint, then press the paper closed to print a mirror copy); every other level is plain. */
export type PageKind = 'plain' | 'fold';
export function pageKind(level: number, rng: Rng): PageKind {
  // Only level 2 draws, so every other level's seeded pictures stay as they were.
  if (level !== 2) return 'plain';
  return rng.next() < 0.5 ? 'fold' : 'plain';
}

/** The fold line is the middle of the paper: a mirror sends x (a fraction of the paper's width) to 1 - x. */
export const mirrorX = (x: number) => Math.min(1, Math.max(0, 1 - x));

/**
 * The painting after a fold: everything already there, plus a mirror copy of each mark made since index `since` (the marks before it
 * are dry and already printed). A mark that already sits across the crease (nearer to it than its own radius, in paper units, where
 * `aspect` is the paper's width over its shorter side) is not copied. The result keeps to `max` marks by the same halving the
 * painting uses while it grows.
 */
export function foldMarks(
  marks: readonly PaintingMark[],
  since: number,
  aspect = 1,
  max = PAINTING_MAX_MARKS,
): PaintingMark[] {
  const copies = marks
    .slice(since)
    .filter((m) => Math.abs(m.x - 0.5) * aspect >= m.r)
    .map((m) => ({ ...m, x: mirrorX(m.x) }));
  return capMarks([...marks, ...copies], max).marks;
}

/** Halve a painting's marks (every second one) until it fits `max`; `halvings` says how many times, so sampling can coarsen to match. */
export function capMarks(
  marks: PaintingMark[],
  max = PAINTING_MAX_MARKS,
): { marks: PaintingMark[]; halvings: number } {
  let halvings = 0;
  while (marks.length > max) {
    marks = marks.filter((_, i) => i % 2 === 0);
    halvings++;
  }
  return { marks, halvings };
}

/** Where `since` lands after the marks are halved `halvings` times: the even-indexed marks before it survive. */
export function halvedIndex(since: number, halvings: number): number {
  for (let k = 0; k < halvings; k++) since = Math.ceil(since / 2);
  return since;
}

/** Fold button: radius 52 (104 across), on the crease just above the top row of pots. */
export const FOLD_RADIUS = 52;
export function foldButtonPlace(w: number, h: number): Pt {
  const top = Math.min(...potLayout(7, w, h).pots.map((p) => p.y));
  return { x: w / 2, y: top - 126 };
}

/** Where the ghost finger paints on a fold page: the left half only, clear of the crease and the fold button, so the print makes the right. */
export function foldScribbleArea(w: number, h: number) {
  const a = scribbleArea(w, h);
  const right = w / 2 - FOLD_RADIUS - BRUSH_RADIUS - 8;
  return { ...a, w: Math.max(120, right - a.x) };
}
