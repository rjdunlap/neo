import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { FRUIT_FOR, type PropKind } from '../../art/props';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export interface GardenPlan {
  /** A tap sends each item to its own basket; there is no sorting choice. */
  tap?: boolean;
  colors: number;
  items: number;
  /** Fruit whose kind gives the color away (an apple is red); otherwise balloons and flowers. */
  fruit: boolean;
  /** Fruit, balloons and flowers all mix in one round, so the kind of thing never gives the color away. */
  mixed?: boolean;
  /** Both baskets are blue, one light and one dark: she sorts by shade, not by color. */
  shades?: boolean;
  /** Three baskets of one color, light, middle and dark: the middle one is the new decision. */
  tones?: boolean;
  /** Fruit and balloons in two colors: a sign says whether this round sorts by color or by what each thing is. */
  rule?: boolean;
  /** One big fruit on the tree at a time; a touch anywhere hops it home and the next grows. Lap only. */
  big?: boolean;
  /** Four baskets in a 2×2 grid, one per color and kind (a red fruit basket, a red balloon basket…): she sorts by both at once. */
  both?: boolean;
}

export type Rule = 'color' | 'kind';
export const RULES: Rule[] = ['color', 'kind'];

export type Shade = 'light' | 'middle' | 'dark';
/** Level 7's two blues. */
export const SHADES: Shade[] = ['light', 'dark'];
/** Level 11's three tones of one color. */
export const TONES: Shade[] = ['light', 'middle', 'dark'];
/** The colors level 11 shades: each has a clear light, middle and dark. */
export const TONE_HUES = ['blue', 'red', 'green', 'purple'] as const satisfies readonly ColorName[];
export type ToneHue = (typeof TONE_HUES)[number];

/** Level 12's two kinds of thing: a fruit of the color (an apple is red) or a balloon. */
export type Kind = 'fruit' | 'balloon';
export const KINDS: Kind[] = ['fruit', 'balloon'];
/** Level 12's basket and item keys: a color and a kind together. */
export type BothKey = `${ColorName}-${Kind}`;

/** What an item or basket is sorted by: its color, its shade of one color, (level 8) what it is, or (level 12) both. */
export type SortKey = ColorName | `${Shade}-${ToneHue}` | 'kind-fruit' | 'kind-balloon' | BothKey;

export const PLANS: GardenPlan[] = [
  { colors: 1, items: 4, fruit: true },
  { colors: 2, items: 6, fruit: true },
  { colors: 3, items: 6, fruit: true },
  { colors: 4, items: 8, fruit: true },
  { colors: 5, items: 10, fruit: true },
  { colors: 6, items: 12, fruit: false, mixed: true },
  { colors: 2, items: 8, fruit: false, shades: true },
  { colors: 2, items: 8, fruit: false, rule: true },
  { colors: 2, items: 4, fruit: true, tap: true },
  { colors: 2, items: 6, fruit: true, tap: true, big: true },
  { colors: 3, items: 9, fruit: false, tones: true },
  { colors: 4, items: 10, fruit: false, both: true },
];

/** Level 10, lap's opening before level 9's four fruit: one big fruit, and a touch anywhere hops it to its basket. */
export const BIG_LEVEL = 10;
/** Level 11, Light, middle, dark: pre-K's top, after level 8. */
export const TONES_LEVEL = 11;
/** Level 12, Two ways at once: pre-K's top, after level 11. */
export const BOTH_LEVEL = 12;

export const LEVELS: BandLevels = {
  // Level 10, One big fruit, opens lap before level 9; toddler still starts at 9.
  lap: { min: 9, max: BIG_LEVEL, order: [BIG_LEVEL, 9] },
  toddler: { min: 1, max: 9, order: [9, 1, 2, 3, 4, 5] },
  preschool: { min: 3, max: 8 },
  // Level 11, Light, middle, dark, follows level 8, then level 12, Two ways at once; levels 9 and 10 are the lap and toddler tap entries.
  prek: { min: 4, max: BOTH_LEVEL, order: [4, 5, 6, 7, 8, TONES_LEVEL, BOTH_LEVEL] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Basket width: narrower when five or six share the ground. */
export const basketWidth = (plan: GardenPlan) => (plan.colors > 4 ? 130 : 160);

/** How far past a basket's rim (sideways) and above its base a drop still lands in it. */
export const REACH_X = 30;
export const REACH_UP = 230;

/** What each item is: its own fruit, a balloon or a flower; a mixed round has all three kinds, so "red" is an apple, a balloon or a flower. */
function kindsFor(rng: Rng, plan: GardenPlan, items: SortKey[]): PropKind[] {
  if (plan.fruit) return items.map((c) => FRUIT_FOR[c as ColorName]!);
  if (!plan.mixed) return items.map((_, i) => (i % 2 ? 'balloon' : 'flower'));
  const slots: (0 | 1 | 2)[] = items.map((_, i) => (i < 3 ? (i as 0 | 1 | 2) : rng.pick([0, 1, 2] as const)));
  rng.shuffle(slots);
  return items.map((c, i) => [FRUIT_FOR[c as ColorName]!, 'balloon' as const, 'flower' as const][slots[i]]);
}

/** The baskets' colors, then one thing per color and the rest at random, shuffled. */
export function deal(
  rng: Rng,
  plan: GardenPlan,
): { colors: SortKey[]; items: SortKey[]; kinds: PropKind[]; looks?: ColorName[]; rule?: Rule } {
  if (plan.rule) return dealRule(rng, plan);
  if (plan.both) return dealBoth(rng, plan);
  if (plan.tones) {
    const hue = rng.pick(TONE_HUES);
    const keys: SortKey[] = rng.shuffle(TONES.map((t): SortKey => `${t}-${hue}`));
    const items = [...keys];
    while (items.length < plan.items) items.push(rng.pick(keys));
    rng.shuffle(items);
    return { colors: keys, items, kinds: items.map((_, i) => (i % 2 ? 'balloon' : 'flower')) };
  }
  if (plan.shades) {
    const keys: SortKey[] = rng.shuffle(SHADES.map((s): SortKey => `${s}-blue`));
    const items = [...keys];
    while (items.length < plan.items) items.push(rng.pick(keys));
    rng.shuffle(items);
    return { colors: keys, items, kinds: items.map((_, i) => (i % 2 ? 'balloon' : 'flower')) };
  }
  const colors = rng.shuffle([...RAINBOW]).slice(0, plan.colors);
  // One big fruit at a time: the colors take turns, so each hop names a new color and lands in the other basket.
  if (plan.big) {
    const items = Array.from({ length: plan.items }, (_, i) => colors[i % colors.length]);
    return { colors, items, kinds: kindsFor(rng, plan, items) };
  }
  const items = [...colors];
  while (items.length < plan.items) items.push(rng.pick(colors));
  rng.shuffle(items);
  return { colors, items, kinds: kindsFor(rng, plan, items) };
}

/** A tone key's shade and color, or undefined for an ordinary color or kind. */
export function toneOf(key: SortKey): { shade: Shade; hue: ToneHue } | undefined {
  const [shade, hue] = key.split('-') as [Shade, ToneHue];
  return (TONES as string[]).includes(shade) && (TONE_HUES as readonly string[]).includes(hue)
    ? { shade, hue }
    : undefined;
}

/** How a toned thing is drawn: a prop of `base`, multiplied by `tint`, and its basket's cloth. */
export interface ToneLook {
  base: ColorName;
  tint: number;
  cloth: { fill: number; line: number };
}

/** Level 7's two blues, kept exactly: tints over white and blue props, and the basket cloth to match. */
const BLUES: Partial<Record<SortKey, ToneLook>> = {
  'light-blue': { base: 'white', tint: 0xa9d3ff, cloth: { fill: 0xa9d3ff, line: 0x6f9fd6 } },
  'dark-blue': { base: 'blue', tint: 0x5a7fb5, cloth: { fill: 0x1c51b2, line: 0x143a80 } },
};

/** The multiplier that darkens a color's own prop into its dark tone. */
export const DARK_TINT = 0x808080;

/** Two colors multiplied channel by channel, as a Pixi tint multiplies a drawing. */
export const multiply = (a: number, b: number) =>
  [16, 8, 0].reduce((out, s) => out | (Math.round((((a >> s) & 255) * ((b >> s) & 255)) / 255) << s), 0);

/**
 * A toned key's look, from the palette: light is a white prop tinted the color's pale swatch, middle is the color's own prop,
 * dark is that prop darkened. Light and dark blue keep level 7's look, so a blue means the same in both levels.
 */
export function toneLook(key: SortKey): ToneLook | undefined {
  if (BLUES[key]) return BLUES[key];
  const tone = toneOf(key);
  if (!tone) return undefined;
  const sw = swatch[tone.hue];
  if (tone.shade === 'light')
    return { base: 'white', tint: sw.light, cloth: { fill: sw.light, line: sw.fill } };
  if (tone.shade === 'middle')
    return { base: tone.hue, tint: 0xffffff, cloth: { fill: sw.fill, line: sw.line } };
  return {
    base: tone.hue,
    tint: DARK_TINT,
    cloth: { fill: multiply(sw.fill, DARK_TINT), line: multiply(sw.line, DARK_TINT) },
  };
}

/**
 * Two colors, each as a fruit and as a balloon (at least once), then the rest at random. The rule is color (a basket per color)
 * or kind (a fruit basket and a balloon basket); the same pile suits either, so only the sign tells her which.
 */
function dealRule(rng: Rng, plan: GardenPlan) {
  const hues = rng.shuffle([...RAINBOW]).slice(0, 2);
  const combos = hues.flatMap((c) => [true, false].map((fruit) => ({ c, fruit })));
  const pile = [...combos];
  while (pile.length < plan.items) pile.push(rng.pick(combos));
  rng.shuffle(pile);
  const rule = rng.pick(RULES);
  const baskets: SortKey[] = rng.shuffle(
    rule === 'color' ? [...hues] : (['kind-fruit', 'kind-balloon'] as SortKey[]),
  );
  return {
    colors: baskets,
    items: pile.map((p): SortKey => (rule === 'color' ? p.c : p.fruit ? 'kind-fruit' : 'kind-balloon')),
    kinds: pile.map((p): PropKind => (p.fruit ? FRUIT_FOR[p.c]! : 'balloon')),
    looks: pile.map((p) => p.c),
    rule,
  };
}

/** A level 12 key's color and kind, or undefined for any other key. */
export function bothOf(key: SortKey): { color: ColorName; kind: Kind } | undefined {
  const [color, kind] = key.split('-') as [ColorName, Kind];
  return RAINBOW.includes(color) && KINDS.includes(kind) ? { color, kind } : undefined;
}

/**
 * Two colors, each as a fruit and as a balloon (at least once), then the rest at random. The four baskets are a grid:
 * the colors' columns (which color goes left is random) and the kinds' rows, fruit at the back and balloons in front.
 */
function dealBoth(rng: Rng, plan: GardenPlan) {
  const hues = rng.shuffle([...RAINBOW]).slice(0, 2);
  const baskets = KINDS.flatMap((k) => hues.map((c): BothKey => `${c}-${k}`));
  const pile: BothKey[] = [...baskets];
  while (pile.length < plan.items) pile.push(rng.pick(baskets));
  rng.shuffle(pile);
  return {
    colors: baskets as SortKey[],
    items: pile as SortKey[],
    kinds: pile.map((k): PropKind =>
      bothOf(k)!.kind === 'fruit' ? FRUIT_FOR[bothOf(k)!.color]! : 'balloon',
    ),
    looks: pile.map((k) => bothOf(k)!.color),
  };
}

/** What a wrong level 12 basket got wrong: the color, the kind or both; undefined when it is the right basket. */
export function mismatch(item: SortKey, basket: SortKey): 'color' | 'kind' | 'both' | undefined {
  const a = bothOf(item);
  const b = bothOf(basket);
  if (!a || !b) return undefined;
  const color = a.color !== b.color;
  const kind = a.kind !== b.kind;
  return color && kind ? 'both' : color ? 'color' : kind ? 'kind' : undefined;
}

/** Level 12's rows: the back (fruit) row's base sits this far above the front (balloon) row's, so its band shows clear. */
export const GRID_ROW_GAP = 150;
/** Level 12's columns: this far apart, center to center. */
export const GRID_COL_GAP = 250;

/** Where level 12's four baskets stand, in `deal`'s order: the fruit row at the back, colors as columns. */
export function gridSpots(vw: number, vh: number): { x: number; y: number }[] {
  const front = vh - 26;
  return [0, 1, 2, 3].map((i) => ({
    x: vw / 2 + ((i % 2) - 0.5) * GRID_COL_GAP,
    y: i < 2 ? front - GRID_ROW_GAP : front,
  }));
}

/** How far from a grid basket's mouth (sideways or up) a drop still lands in it; the nearest mouth wins. */
export const GRID_REACH = 170;

/**
 * Level 12's grid: the basket whose mouth (`DROP_ABOVE` over its base) is nearest the drop, within `GRID_REACH`.
 * Two rows share each column, so the ordinary sideways-only test would let the back basket take a front drop.
 */
export function gridBasketAt<B extends { x: number; y: number; w: number }>(
  baskets: readonly B[],
  x: number,
  y: number,
): B | undefined {
  let best: B | undefined;
  let bestD = Infinity;
  for (const b of baskets) {
    const dx = Math.abs(b.x - x);
    const d = Math.hypot(dx, b.y - DROP_ABOVE - y);
    if (dx >= b.w / 2 + REACH_X || d > GRID_REACH || d >= bestD) continue;
    best = b;
    bestD = d;
  }
  return best;
}

/**
 * The basket a drop lands in: the nearest one sideways, if the drop is over it or just above it.
 * Neighbouring baskets' reach overlaps when six share the ground, so the nearest wins.
 */
export function basketAt<B extends { x: number; y: number; w: number }>(
  baskets: readonly B[],
  x: number,
  y: number,
): B | undefined {
  let best: B | undefined;
  for (const b of baskets) {
    const dx = Math.abs(b.x - x);
    if (dx >= b.w / 2 + REACH_X || y <= b.y - REACH_UP) continue;
    if (!best || dx < Math.abs(best.x - x)) best = b;
  }
  return best;
}

/** The ghost finger lets an item go this far above a basket's base, over the middle of its mouth (inside `REACH_UP`, and clear of its neighbours). */
export const DROP_ABOVE = 60;

/**
 * What a capable child does next: take the first piece of fruit still on the tree to the basket of its own color.
 * The ghost finger follows this, so a test can check that it sorts everything and never picks the wrong basket.
 */
export function nextToSort<I extends { key: SortKey }, B extends { key: SortKey }>(
  items: readonly I[],
  baskets: readonly B[],
): { item: I; basket: B } | undefined {
  for (const item of items) {
    const basket = baskets.find((b) => b.key === item.key);
    if (basket) return { item, basket };
  }
  return undefined;
}
