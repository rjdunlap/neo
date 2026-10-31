import { spread } from '../../engine/view';
import { swatch, type Swatch } from '../../art/palette';

export interface SizePlan {
  count: number; order: 'big' | 'small'; mode: 'pick' | 'line' | 'cycle' | 'fit' | 'insert'; name: string;
  /** *Darkest first*: the ranks are shades of one colour (rank 0 the darkest), every friend one size, and a second line runs lightest first. */
  shade?: boolean;
  /** Some questions ask for the middle one. */
  middle?: boolean;
  /** *Big one, little one*: the big one, then the little one, then the big one again, in plain words. */
  bigLittle?: boolean;
}
export const SIZE_PLANS: readonly SizePlan[] = [
  { count: 2, order: 'big', mode: 'pick', name: 'Find the bigger of two friends' },
  { count: 2, order: 'small', mode: 'pick', name: 'Find the smaller of two friends' },
  { count: 3, order: 'big', mode: 'pick', name: 'Find the biggest of three friends' },
  { count: 4, order: 'small', mode: 'pick', name: 'Find the smallest of four friends' },
  { count: 3, order: 'small', mode: 'line', name: 'Line up three friends, smallest first' },
  { count: 3, order: 'big', mode: 'line', name: 'Line up three friends, biggest first' },
  { count: 5, order: 'small', mode: 'line', name: 'Line up five friends, smallest first' },
  { count: 5, order: 'big', mode: 'line', name: 'Line up five friends, biggest first' },
];
/**
 * Levels with high IDs, placed among the first eight by a band's `order`: 17 *Two in a line*, 10 *Big, middle, little*,
 * 9 *Big one, little one* (lap second, toddler first) and 16 *Big duck, little duck* (lap first).
 */
export const TWO_IN_A_LINE: SizePlan = { count: 2, order: 'small', mode: 'line', name: 'Line up two friends, smaller first' };
export const MIDDLE_ONE: SizePlan = { count: 3, order: 'big', mode: 'pick', middle: true, name: 'Find the middle-sized friend of three' };
export const BIG_LITTLE: SizePlan = { count: 2, order: 'big', mode: 'pick', bigLittle: true, name: 'Tap the big one, then the little one' };
export const SIZE_CYCLE: SizePlan = { count: 1, order: 'big', mode: 'cycle', name: 'Tap one friend to make it bigger, then smaller' };
/** 11 *Who fits?* (preschool top and pre-K, after 6): a bed, a chair, a bowl and a door, each fitting exactly one of three friends. */
export const WHO_FITS: SizePlan = { count: 3, order: 'big', mode: 'fit', name: 'Tap the friend who fits the bed, chair, bowl and door' };
/** 12 *Where does this one go?* (pre-K top, school first): a fifth friend dragged into its gap in an ordered line of four. */
export const WHERE_DOES_IT_GO: SizePlan = { count: 5, order: 'small', mode: 'insert', name: 'Put a fifth friend into its place in a line of four' };
/** 15 *Darkest first* (pre-K top and school, after 8): five friends of one size in five shades, darkest first, then lightest first. */
export const DARKEST_FIRST: SizePlan = { count: 5, order: 'small', mode: 'line', shade: true, name: 'Line up five friends by shade, darkest first, then lightest first' };
const HIGH_LEVELS: Record<number, SizePlan> = { 9: BIG_LITTLE, 10: MIDDLE_ONE, 11: WHO_FITS, 12: WHERE_DOES_IT_GO, 15: DARKEST_FIRST, 16: SIZE_CYCLE, 17: TWO_IN_A_LINE };
export const sizePlan = (level: number): SizePlan =>
  HIGH_LEVELS[level] ?? SIZE_PLANS[Math.max(0, Math.min(SIZE_PLANS.length - 1, level - 1))];
/** How many questions a pick level asks: three at *Big one, little one*, otherwise four (one per prop at *Who fits?*). */
export const pickRounds = (plan: SizePlan): number => plan.bigLittle ? 3 : 4;

export type SizeAsk = 'big' | 'middle' | 'small';
/** The four questions of *Big, middle, little*: at least two ask for the middle, so it is not the only answer. */
export function middleAsks(rng: { shuffle<T>(a: T[]): T[]; pick<T>(a: readonly T[]): T }): SizeAsk[] {
  const extra = rng.pick(['big', 'small'] as const), other = rng.pick(['big', 'middle', 'small'] as const);
  return rng.shuffle<SizeAsk>(['middle', 'middle', extra, other]);
}
/**
 * *Who fits?*: the four props in the order they are asked, each sized as a fixed multiple of the friend who fits it (its main
 * measure over that friend's height): a bed as long as the friend lying down, a chair whose back reaches its shoulders, a bowl it
 * sits in, a door it walks through. Goldilocks without the house.
 */
export type FitProp = 'bed' | 'chair' | 'bowl' | 'door';
export const FIT_PROPS: readonly { kind: FitProp; ratio: number }[] = [
  { kind: 'bed', ratio: 1.35 }, { kind: 'chair', ratio: 0.8 }, { kind: 'bowl', ratio: 0.9 }, { kind: 'door', ratio: 1.2 },
];
/** A prop's main measure (the bed's length, the chair's and door's height, the bowl's width) for the friend `height` tall who fits it. */
export const propSize = (kind: FitProp, height: number): number => FIT_PROPS.find((p) => p.kind === kind)!.ratio * height;
/**
 * Which of the three friends fits each of the four props: one rank per prop, never the same twice running, so "always the
 * biggest" fails, and every rank fits at least once.
 */
export function fitAsks(rng: { shuffle<T>(a: T[]): T[]; pick<T>(a: readonly T[]): T }): SizeAsk[] {
  const all: SizeAsk[] = ['big', 'middle', 'small'];
  const asks = rng.shuffle([...all]);
  asks.push(rng.pick(all.filter((a) => a !== asks[asks.length - 1])));
  return asks;
}
/** How a friend fares at a prop: it fits, or hangs over the end (too big), or vanishes into it (too little). */
export const fitTry = (rank: number, fitting: number): 'fits' | 'big' | 'little' => rank === fitting ? 'fits' : rank > fitting ? 'big' : 'little';

/**
 * *Where does this one go?*: four questions, each a newcomer's rank among five friends of the five steps and the line's order.
 * Two lines run smallest first and two biggest first, and in at least two the newcomer belongs inside the line, not at an end.
 */
export interface InsertAsk { rank: number; order: 'big' | 'small' }
export function insertAsks(rng: { shuffle<T>(a: T[]): T[]; pick<T>(a: readonly T[]): T }): InsertAsk[] {
  const inner = [1, 2, 3] as const, any = [0, 1, 2, 3, 4] as const;
  const ranks = rng.shuffle([rng.pick(inner), rng.pick(inner), rng.pick(any), rng.pick(any)]);
  const orders = rng.shuffle<'big' | 'small'>(['small', 'small', 'big', 'big']);
  return ranks.map((rank, i) => ({ rank, order: orders[i] }));
}
/** The four friends already in the line, in line order: every rank of five but the newcomer's. */
export const insertLine = (ask: InsertAsk): number[] => sizeOrder(5, ask.order).filter((r) => r !== ask.rank);
/** The gap the newcomer belongs in (0 before the first friend of the line, 4 after the last): the one between the one smaller and the one bigger. */
export const insertGapFor = (ask: InsertAsk): number => insertLine(ask).filter((r) => ask.order === 'small' ? r < ask.rank : r > ask.rank).length;
/** The middle of each of the five gaps of a closed line of four friends standing at `rest`, both ends included. */
export function gapMids(rest: number[]): number[] {
  const step = rest[1] - rest[0];
  return [rest[0] - step / 2, ...rest.slice(1).map((x, i) => (rest[i] + x) / 2), rest[rest.length - 1] + step / 2];
}
/**
 * The gap a carried friend at (x, y) (its feet, as `draggable` reports it) is over: the nearest middle of the closed line's
 * gaps, so a gap opening under the finger never changes which gap is nearest; null when it is not beside the line.
 */
export function insertGap(x: number, y: number, rest: number[], lineY: number): number | null {
  if (y < lineY - 230 || y > lineY + 80) return null;
  const mids = gapMids(rest), half = (rest[1] - rest[0]) / 2;
  if (x < mids[0] - half || x > mids[mids.length - 1] + half) return null;
  let best = 0;
  mids.forEach((m, i) => { if (Math.abs(x - m) < Math.abs(x - mids[best])) best = i; });
  return best;
}
/**
 * Where the friends of the line stand: at `rest` with no gap open, otherwise on five evenly spread places with `gap` left empty.
 * Returns the four line friends' x and the open gap's middle.
 */
export function insertLayout(w: number, gap: number | null) {
  const five = spread(5, 165, w - 40, 175), rest = spread(4, 165, w - 40, 175);
  return { rest, five, xs: gap === null ? rest : rest.map((_, i) => five[i < gap ? i : i + 1]), openW: five[1] - five[0] };
}
/**
 * Why a wrong gap is wrong, said of the one friend beside it that shows it: dropped too early, the friend after the gap comes
 * before the newcomer; too late, the friend before the gap comes after it. `friend` is that friend's place in the line, `cmp`
 * how the newcomer compares with it, and `side` where it goes, so the words point to the right gap.
 */
export function insertWhy(ask: InsertAsk, gap: number): { friend: number; cmp: 'bigger' | 'smaller'; side: 'after' | 'before' } | null {
  const right = insertGapFor(ask);
  if (gap === right) return null;
  const line = insertLine(ask), friend = gap < right ? gap : gap - 1;
  return { friend, cmp: ask.rank > line[friend] ? 'bigger' : 'smaller', side: gap < right ? 'after' : 'before' };
}

/**
 * *Darkest first*: five shades of one palette colour, darkest first, made by setting the colour's lightness to five evenly
 * spaced values; each shade's outline is the same hue darker, so a pale friend still has an edge.
 */
/** Colours whose five shades step at least 1.35 apart in contrast (green's and teal's pale steps are nearer 1.2). */
export const SHADE_COLORS = ['blue', 'purple', 'red'] as const;
export const SHADE_LIGHTNESS = [0.3, 0.42, 0.54, 0.66, 0.78] as const;
/** The friends' one size step at *Darkest first*: large enough that the colour reads. */
export const SHADE_STEP = 3;
function hsl(color: number): [number, number, number] {
  const r = (color >> 16 & 255) / 255, g = (color >> 8 & 255) / 255, b = (color & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export function fromHsl(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255);
}
export function shades(color: (typeof SHADE_COLORS)[number]): Swatch[] {
  const [h, s] = hsl(swatch[color].fill), sat = Math.min(0.75, s);
  return SHADE_LIGHTNESS.map((l) => ({ fill: fromHsl(h, sat, l), line: fromHsl(h, sat, Math.max(0.12, l - 0.2)), light: fromHsl(h, sat, Math.min(0.92, l + 0.12)) }));
}
/** WCAG relative luminance of a colour, for the shade steps' rule test. */
export function luminance(color: number): number {
  const ch = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(color >> 16 & 255) + 0.7152 * ch(color >> 8 & 255) + 0.0722 * ch(color & 255);
}

/** The three asks of *Big one, little one*: big and little alternate, the big one first. */
export const BIG_LITTLE_ASKS: readonly SizeAsk[] = ['big', 'small', 'big'];
/** The rank an ask names among `count` friends (the middle one is always of three). */
export const askRank = (ask: SizeAsk, count = 3): number => ask === 'small' ? 0 : ask === 'middle' ? 1 : count - 1;

/** Ranks describe size only; shuffling position or changing the animal cannot change the answer. */
export function sizeOrder(count: number, order: 'big' | 'small'): number[] {
  const ranks = Array.from({ length: count }, (_, i) => i);
  return order === 'small' ? ranks : ranks.reverse();
}
/** The five-step size scale every friend is drawn from: step 0 is the littlest, step 4 the biggest (2.4 times it). */
export const STEPS = 5;
export const stepScale = (step: number): number => 0.42 + 0.58 * step / (STEPS - 1);
/** `count` friends spread evenly over the scale: the ends are always dealt, so two friends differ 2.4 times. */
export const evenSteps = (count: number): number[] => Array.from({ length: count }, (_, rank) => Math.round((STEPS - 1) * rank / Math.max(1, count - 1)));
export function sizeScale(rank: number, count: number): number { return stepScale(evenSteps(count)[rank]); }
/** The asked friend is at least this much bigger or smaller than its neighbour in a dealt row, so a varied row is never a near call. */
export const MIN_RATIO = 1.3;
/** Every way to choose `count` of the five steps, littlest first. */
function combos(count: number, from = 0): number[][] {
  if (count === 0) return [[]];
  const out: number[][] = [];
  for (let s = from; s <= STEPS - count; s++) for (const rest of combos(count - 1, s + 1)) out.push([s, ...rest]);
  return out;
}
/**
 * The steps dealt to a row's ranks, littlest first. The line levels and a pick level's first row use the even spread, so the
 * first right answer needs no adult; later pick rows draw from the scale (two friends at least two steps apart; three or four
 * friends any distinct steps that keep the asked rank at least `MIN_RATIO` from each neighbour), so the picture changes while
 * the question stays the same.
 */
export function dealSteps(rng: { int(min: number, max: number): number; pick<T>(a: readonly T[]): T }, plan: SizePlan, row: number, asked = plan.order === 'small' ? 0 : plan.count - 1): number[] {
  if ((plan.mode !== 'pick' && plan.mode !== 'fit') || row === 0 || plan.bigLittle) return evenSteps(plan.count);
  if (plan.count === 2) { const lo = rng.int(0, STEPS - 3); return [lo, rng.int(lo + 2, STEPS - 1)]; }
  const fair = combos(plan.count).filter((steps) => [asked - 1, asked + 1].every((n) => steps[n] === undefined || Math.max(stepScale(steps[n]), stepScale(steps[asked])) / Math.min(stepScale(steps[n]), stepScale(steps[asked])) >= MIN_RATIO));
  return rng.pick(fair);
}

/** The eight friends who join the parade; a round's rows share one of them. */
export const FRIENDS = ['duck', 'bunny', 'cat', 'pip', 'cow', 'pig', 'bear', 'dog'] as const;
export type Friend = (typeof FRIENDS)[number];
/** The flag's and the bunting's colours, by seed. */
export const FLAG_COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'] as const;

/**
 * *Big duck, little duck*: one friend grows a step on each tap, then shrinks, in a cycle of three sizes (littlest, middle,
 * biggest, middle), with the size word for each step. Three cycles end the round; nothing is asked and nothing is wrong.
 */
export const CYCLE: readonly { step: number; word: 'bigger' | 'biggest' | 'smaller' | 'littlest' }[] = [
  { step: 2, word: 'bigger' }, { step: 4, word: 'biggest' }, { step: 2, word: 'smaller' }, { step: 0, word: 'littlest' },
];
export const CYCLE_TAPS = CYCLE.length * 3;
/** The size after `taps` taps (tap 0 is the start, the littlest). */
export const cycleAt = (taps: number): { step: number; word: (typeof CYCLE)[number]['word'] | null } =>
  taps <= 0 ? { step: 0, word: null } : CYCLE[(taps - 1) % CYCLE.length];
/** The one friend of the cycle stands larger than a row's friends: its biggest size still fits a portrait view with the pet clear. */
export const CYCLE_SCALE = 2.6;

/**
 * What a capable child touches next: the friend whose size is the next answer (the biggest or smallest in the pick levels,
 * the next one in the line in the line-up levels), by its place among the friends on the ground. Friends already in the line
 * are not touched again, and a wrong friend never is.
 */
export function sizeTouch(order: number[], step: number, friends: { rank: number; placed: boolean }[]): number | null {
  const i = friends.findIndex((f) => f.rank === order[step] && !f.placed);
  return i < 0 ? null : i;
}

/** A friend is a `Critter` drawn at this scale times its size; a critter's body is 250 tall at scale 1 (`bodyPath`). */
export const FRIEND_SCALE = 0.59;
export const CRITTER_H = 250;
/** Every friend's tap rectangle, whatever its size: the smallest is as easy to touch as the biggest. */
export const TARGET = { w: 154, h: 190 };

/** The size word asked for: comparative between two friends (bigger, smaller), superlative among more. */
export function sizeWord(plan: { count: number; order: 'big' | 'small'; bigLittle?: boolean }, ask?: SizeAsk): string {
  if (ask === 'middle') return 'middle-sized';
  if (plan.bigLittle) return ask === 'small' ? 'little' : 'big';
  if (ask) return ask === 'big' ? 'biggest' : 'smallest';
  if (plan.count === 2) return plan.order === 'big' ? 'bigger' : 'smaller';
  return plan.order === 'big' ? 'biggest' : 'smallest';
}

/** The chime for a friend: a pentatonic step by its place on the five-step size scale, the biggest lowest. */
export function sizeBell(rank: number, count: number): number { return stepBell(evenSteps(count)[rank]); }
export const stepBell = (step: number): number => 9 - step;

/** Where the friends stand and the line's spots sit across a view `w` wide, and how wide a friend's target may be without overlapping its neighbour. */
export function paradeLayout(friends: number, spots: number, w: number, gap = 175) {
  const xs = spread(friends, 165, w - 40, gap);
  const step = xs.length > 1 ? xs[1] - xs[0] : Infinity;
  return { friends: xs, targetW: Math.min(TARGET.w, step), spots: spread(spots, 130, w - 70, 165) };
}

/**
 * Which spot a dropped friend lands on: the glowing spot when the drop is within reach of it (as generous as ever), otherwise
 * the nearest other spot within half a spot's spacing, or null for a drop away from the line.
 */
export function dropSpot(x: number, y: number, spots: number[], spotY: number, glowing: number): number | null {
  if (Math.abs(y - spotY) > 95) return null;
  if (spots[glowing] !== undefined && Math.abs(x - spots[glowing]) <= 82) return glowing;
  const half = spots.length > 1 ? (spots[1] - spots[0]) / 2 : 82;
  let best: number | null = null;
  spots.forEach((s, i) => { if (Math.abs(x - s) <= half && (best === null || Math.abs(x - s) < Math.abs(x - spots[best]))) best = i; });
  return best;
}
