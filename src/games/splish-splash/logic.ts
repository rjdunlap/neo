import type { SpeciesId } from '../../creatures/species';
import { swatch } from '../../art/palette';
import type { PetColor } from '../../content/world';
import type { BandLevels } from '../../progress/difficulty';

export type Part = 'tummy' | 'head' | 'cheeks' | 'ears' | 'nose';

export interface Plan {
  /** free: scrub it all off. parts: "wash my ears!", one body part at a time. pat: any touch anywhere takes a third off the nearest patch. */
  mode: 'free' | 'parts' | 'pat';
  parts: Part[];
  shuffle?: boolean;
  /** Ask for two parts in one breath ("wash my ears and my nose!"). */
  pairs?: boolean;
  /** With pairs: "first my nose, then my ears", in that order. */
  ordered?: boolean;
  /** How much wider than `SCRUB_R` the brush is, so a palm-sized pat clears a palm-sized disc. */
  brush?: number;
}

export const PLANS: Plan[] = [
  { mode: 'free', parts: ['tummy', 'head', 'cheeks'], brush: 1.6 },
  { mode: 'free', parts: ['tummy', 'head', 'cheeks', 'ears'], brush: 1.6 },
  { mode: 'parts', parts: ['tummy', 'ears', 'head'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks', 'nose'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true, ordered: true },
  { mode: 'pat', parts: ['tummy', 'head', 'cheeks'] },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 9, order: [9, 1, 2] },
  toddler: { min: 1, max: 4 },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 8 },
};

/** Pats it takes to wash one patch of mud off in `pat` mode. */
export const PATS_PER_PATCH = 3;

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
}

/** The parts asked for right now, starting at `index`: one, or a pair. */
export function askedParts(plan: Plan, index: number): Part[] {
  return plan.parts.slice(index, index + (plan.pairs ? 2 : 1));
}

/** The asked-for parts that may be scrubbed now: in order, only the first one still muddy. */
export function allowedParts(plan: Plan, index: number, clean: (p: Part) => boolean): Part[] {
  const left = askedParts(plan, index).filter((p) => !clean(p));
  return plan.ordered ? left.slice(0, 1) : left;
}

/** Each part's splotch size, against a `MUD_W` × `MUD_H` texture: the face's are smaller than the tummy's. */
export const PART_SIZE: Record<Part, number> = { tummy: 1, head: 0.9, cheeks: 0.62, ears: 0.7, nose: 0.42 };

/** The old pip's stage scale, at which the brush was `SCRUB_R` body units: a star drawn larger gets a smaller brush in its own units, so on screen it stays finger-sized. */
export const PIP_SCALE = 1.2;

/**
 * How each species sits in the tub (RW05 slice 2b, docs/rework/CREATURE-COLLECTION.md): its stage scale, its splotches'
 * share of `PART_SIZE` (the tummy's own share apart, since it has room), and the parts the bath asks for on it. Decided
 * 2026-10-23: a species is asked only for parts its table has that sit far enough apart at stage scale for "not that
 * part" to fire (`separable`). The river and the glider are side on, with the whole face in a small corner, so only the
 * tummy and the head are far enough apart; the sprout keeps four, with smaller splotches than the pip had: its nose sits between a cheek and an eye, inside both one's reach.
 */
export const STAR: Record<SpeciesId, { scale: number; mud: number; tummy: number; parts: readonly Part[] }> =
  {
    sprout: { scale: 1.2, mud: 0.55, tummy: 0.7, parts: ['tummy', 'head', 'cheeks', 'ears'] },
    river: { scale: 1.7, mud: 0.7, tummy: 0.9, parts: ['tummy', 'head'] },
    glider: { scale: 1.8, mud: 0.6, tummy: 0.5, parts: ['tummy', 'head'] },
  };

/** The brush's width on a star at `scale`, as a share of `SCRUB_R` in its own units. */
export const brushOn = (scale: number, brush = 1) => (brush * PIP_SCALE) / scale;

/** A level's plan on one species: only the parts it is asked for there, in the plan's order. */
export function planOn(plan: Plan, parts: readonly Part[]): Plan {
  return { ...plan, parts: plan.parts.filter((p) => parts.includes(p)) };
}

export interface Spot {
  part: Part;
  x: number;
  y: number;
  size: number;
}

/** The splotches on a star whose part points (in its own units) are `points`: one on each point of each part asked for. */
export function spotsOn(
  parts: readonly Part[],
  points: (p: Part) => readonly { x: number; y: number }[],
  star: { mud: number; tummy: number },
): Spot[] {
  return parts.flatMap((part) =>
    points(part).map(({ x, y }) => ({
      part,
      x,
      y,
      size: PART_SIZE[part] * (part === 'tummy' ? star.tummy : star.mud),
    })),
  );
}

/** Whether a finger on `b`'s centre would scrub `a` too (it lies in `a`'s reach, exactly as the game tests a touch). */
export const reaches = (a: Spot, b: Spot, brush = 1) =>
  nearMud((b.x - a.x) / a.size, (b.y - a.y) / a.size, a.size, brush);

/** Every pair of different parts' splotches that are too close for "not that part": each centre must lie outside the other's reach. */
export function crowded(spots: readonly Spot[], brush = 1): [Part, Part][] {
  const out: [Part, Part][] = [];
  for (const a of spots)
    for (const b of spots) if (a.part !== b.part && reaches(a, b, brush)) out.push([a.part, b.part]);
  return out;
}

/** A splotch's texture, and the scrub radius in Pip body units: the brush reaches `SCRUB_R / size` texture units. */
export const MUD_W = 120;
export const MUD_H = 96;
export const SCRUB_R = 26;
/**
 * Half the box, from the middle of a splotch's texture, that any speck of its mud can lie in: blob centers at most 28 and 20 away,
 * a speck at most 0.9 of a blob's radius (26) from its center.
 */
export const MUD_BOX = { x: 52, y: 44 };

/** The brush's reach in a splotch's own texture units: the same on screen whatever the splotch's size. */
export function reach(size: number, brush = 1): number {
  return (SCRUB_R * brush) / size;
}

/** How each part is spoken: its word, and whether it is a pair, so the lines read naturally ("Those are my cheeks!", not "That's my cheeks!"). */
export const PHRASES: Record<Part, { word: string; plural: boolean }> = {
  tummy: { word: 'tummy', plural: false },
  head: { word: 'head', plural: false },
  cheeks: { word: 'cheeks', plural: true },
  ears: { word: 'ears', plural: true },
  nose: { word: 'nose', plural: false },
};

/** The parts as said after "Wash": "my ears", or "my ears and my nose". */
export function askedPhrase(parts: Part[]): string {
  return parts.map((p) => `my ${PHRASES[p].word}`).join(' and ');
}

/** The parts as said after "Clean": "ears", or "ears and nose". */
export function cleanPhrase(parts: Part[]): string {
  return parts.map((p) => PHRASES[p].word).join(' and ');
}

/** The least time between two spoken names, so a busy finger does not chatter. */
export const NAME_GAP = 2.5;

/**
 * Names each part once a round at its first touch, in free play. A name that comes too soon after the last (or before the
 * opening instruction has finished) is not said and not marked, so the next touch on that part tries again.
 */
export class Namer {
  private readonly said = new Set<Part>();
  private last = -Infinity;

  /** The part to name now for a touch on `part` at `now` seconds, or null. `quiet` holds every name (the pet is still talking). */
  touch(part: Part, now: number, quiet = false): Part | null {
    if (quiet || this.said.has(part) || now - this.last < NAME_GAP) return null;
    this.said.add(part);
    this.last = now;
    return part;
  }

  /** Something else was just said: wait a gap before the next name. */
  spoke(now: number) {
    this.last = now;
  }

  named(part: Part): boolean {
    return this.said.has(part);
  }
}

/** Seconds without a touch on a free level before a muddy spot sparkles and the pet wiggles: an invitation, never a hint. */
export const NUDGE_AFTER = 8;

/** Counts quiet time in free play; `tick` is true once each time NUDGE_AFTER seconds pass without a touch. */
export class IdleNudge {
  private quiet = 0;

  touch() {
    this.quiet = 0;
  }

  tick(dt: number): boolean {
    this.quiet += dt;
    if (this.quiet < NUDGE_AFTER) return false;
    this.quiet = 0;
    return true;
  }
}

/** Seconds without progress on a parts question before the asked-for splotches glow: a free reminder, never a hint. */
export const GLOW_AFTER = 7;

/** Misses on one question before the glow counts as that question's one hint. */
export const MISSES_FOR_HINT = 2;

/**
 * Help on one parts question (decided 2026-10-23): seven quiet seconds light the glow for free; the second miss
 * lights it and counts one hint. At most one hint per question; `ask` starts the next question.
 */
export class QuestionHelp {
  private quiet = 0;
  private missed = 0;
  private glowed = false;
  private counted = false;

  ask() {
    this.quiet = 0;
    this.missed = 0;
    this.glowed = false;
    this.counted = false;
  }

  progress() {
    this.quiet = 0;
  }

  /** True once per question, when the quiet time first passes GLOW_AFTER: light the glow, count nothing. */
  tick(dt: number): boolean {
    this.quiet += dt;
    if (this.glowed || this.quiet <= GLOW_AFTER) return false;
    this.glowed = true;
    return true;
  }

  /** A counted miss. True when it is the one that lights the glow as this question's hint. */
  miss(): boolean {
    this.missed++;
    if (this.counted || this.missed < MISSES_FOR_HINT) return false;
    this.counted = this.glowed = true;
    return true;
  }
}

/** The part to scrub next: any muddy one when scrubbing freely, and otherwise the first the question allows. */
export function nextToScrub(plan: Plan, index: number, clean: (p: Part) => boolean): Part | null {
  if (plan.mode !== 'parts') return plan.parts.find((p) => !clean(p)) ?? null;
  return allowedParts(plan, index, clean)[0] ?? null;
}

/**
 * A zig-zag of scrubbing, in a splotch's own texture units (the middle is 0, 0), whose brush leaves no mud behind: every point
 * of the box mud can lie in is within the brush's reach of the path. Rows are 1.2 reaches apart and stop 0.55 of a reach short
 * of the box's sides, so the corners are still inside it.
 */
export function scrubPath(size: number, brush = 1): { x: number; y: number }[] {
  const r = reach(size, brush);
  const rows = Math.ceil((2 * MUD_BOX.y) / (1.2 * r));
  const half = Math.max(0, MUD_BOX.x - 0.55 * r);
  const path: { x: number; y: number }[] = [];
  for (let k = 0; k < rows; k++) {
    const y = -MUD_BOX.y + ((k + 0.5) * 2 * MUD_BOX.y) / rows;
    const [a, b] = k % 2 ? [half, -half] : [-half, half];
    path.push({ x: a, y }, { x: b, y });
  }
  return path;
}

/** Whether a point in a splotch's own texture units is close enough to scrub it: on the texture, or within the brush's reach of it. */
export function nearMud(lx: number, ly: number, size: number, brush = 1): boolean {
  const r = reach(size, brush);
  return Math.abs(lx) < MUD_W / 2 + r && Math.abs(ly) < MUD_H / 2 + r;
}

/**
 * The splotches a scrub point should count as "not that part" for. The splotches' reaches overlap (the ears reach into the head's,
 * the nose sits inside the tummy's), so a point on a splotch that is asked for is scrubbing it, and a finger rubbing on past one it
 * has just cleaned is still within that splotch's reach (`forgiven`, the caller checks `nearMud` against each splotch it scrubbed): neither is a mistake. A finger that
 * slides on to a different part (outside the reach of what it scrubbed) is told off, so "first this, then that" still teaches.
 */
export function wrongTouches(allowed: Part[], near: Part[], forgiven = false): Part[] {
  return forgiven || near.some((p) => allowed.includes(p)) ? [] : near;
}

/** The index of the point nearest (x, y), for a pat that lands anywhere; null when there are none. */
export function nearestIndex(points: { x: number; y: number }[], x: number, y: number): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** The least distance between two foam puffs, as a share of the brush's reach: a trail, not a pile. */
export const FOAM_GAP = 0.7;
/** The most foam puffs one splotch carries, so a long scrub never builds a heavy drawing. */
export const FOAM_MAX = 24;

/**
 * The white foam trail scrubbing leaves on one splotch (slice 3), in its own texture units: a puff where the brush has been,
 * never closer than `FOAM_GAP` reaches to another and never more than `FOAM_MAX`. Only looks; the shower pops it all.
 */
export class FoamTrail {
  readonly puffs: { x: number; y: number }[] = [];

  constructor(private readonly reach: number) {}

  /** A puff to lay at (x, y), or null when one is already near or the splotch is full. */
  lay(x: number, y: number): { x: number; y: number; r: number } | null {
    if (this.puffs.length >= FOAM_MAX) return null;
    const gap = FOAM_GAP * this.reach;
    if (this.puffs.some((p) => Math.hypot(p.x - x, p.y - y) < gap)) return null;
    this.puffs.push({ x, y });
    return { x, y, r: 0.5 * this.reach };
  }
}

/** The old pip's tummy splotch sat this far above the tub's line, just over the foam: every star sits with its lowest splotch there. */
export const TUMMY_Y = -86;

/**
 * Where the rim's two toys sit, from the middle of the tub's top edge, and their tap circles (in stage units): the duck on the
 * right repeats the instruction, the second toy on the left squeaks and says its name. Each circle is over 100 units across.
 */
export const DUCK_AT = { x: 236, y: -18 };
export const TOY_AT = { x: -236, y: -18 };
export const DUCK_HIT = { x: DUCK_AT.x, y: DUCK_AT.y - 30, r: 55 };
export const TOY_HIT = { x: TOY_AT.x, y: TOY_AT.y - 30, r: 56 };

/** The second bath toy, chosen by seed each round; the word is what it says. */
export const TOYS = ['boat', 'fish', 'whale'] as const;
export type Toy = (typeof TOYS)[number];

/** Where the bath is, chosen by seed each round (slice 4): each room brings its own mess and its own opening word. */
export const ROOMS = ['bathroom', 'garden', 'beach', 'art', 'kitchen'] as const;
export type Room = (typeof ROOMS)[number];

/** A mess's three shades: the blobs, the dark specks and the light specks. */
export interface Mess {
  fill: number;
  dark: number;
  light: number;
}

/** The art room's paint colours, the rainbow's six. */
export const PAINT_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export type Paint = (typeof PAINT_COLORS)[number];

/** The paints of the art room: the deeper `line` shade of each rainbow colour, so paint reads on a pale highlight too. */
export const PAINTS: Record<Paint, number> = {
  red: 0xc23a40,
  orange: 0xd9731a,
  yellow: 0xd9a520,
  green: 0x4a9a35,
  blue: 0x2f78c9,
  purple: 0x6c45c4,
};

/**
 * Each room's mess and how the opening line says it ("{pet} is {messy}!"). The art room's paint is chosen per pet
 * (`paintsFor`), so its `mess` is null here. The bathroom is the bath before slice 4: the same mud.
 */
export const ROOM_MESS: Record<Room, { mess: Mess | null; messy: string }> = {
  bathroom: { mess: { fill: 0x8b5a2b, dark: 0x6b4423, light: 0xa8743f }, messy: 'muddy' },
  // Dark garden mud with blades of grass in it.
  garden: { mess: { fill: 0x6e4a2a, dark: 0x3f8f2f, light: 0x2f6e22 }, messy: 'muddy and grassy' },
  // Damp grey sand: dry yellow sand would vanish on a yellow or orange pet.
  beach: { mess: { fill: 0xa8946e, dark: 0x8a7652, light: 0xb5a17a }, messy: 'sandy' },
  art: { mess: null, messy: 'covered in paint' },
  // Berry jam with chocolate cake crumbs.
  kitchen: { mess: { fill: 0xa3214f, dark: 0x7a1638, light: 0x5a3a22 }, messy: 'sticky with jam' },
};

/** How far apart two colours look (the "redmean" weighted RGB distance, 0 to about 765). */
export function colorDistance(a: number, b: number): number {
  const [r1, g1, b1] = [(a >> 16) & 255, (a >> 8) & 255, a & 255];
  const [r2, g2, b2] = [(b >> 16) & 255, (b >> 8) & 255, b & 255];
  const rm = (r1 + r2) / 2;
  return Math.sqrt(
    (2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2,
  );
}

/** The least distance at which a mess shade reads on the pet: mud on a red pet is 186, damp sand on an orange one 142; red paint on a red pet (104) fails. */
export const READS_AT = 130;

/**
 * Whether a mess shade reads on a pet of `color`, against both its `fill` and its pale `light`. The swatch stands in for
 * the pet: the illustrated skin is hue-turned toward it (`recolor`), not filled with the exact swatch.
 */
export function readsOn(shade: number, color: PetColor): boolean {
  const tone = swatch[color];
  return colorDistance(shade, tone.fill) >= READS_AT && colorDistance(shade, tone.light) >= READS_AT;
}

/** `a` moved a share `t` of the way to `b`, channel by channel. */
const mix = (a: number, b: number, t: number) =>
  [16, 8, 0].reduce((out, s) => {
    const ca = (a >> s) & 255;
    return out | (Math.round(ca + (((b >> s) & 255) - ca) * t) << s);
  }, 0);

/** A paint mess in `paint`: the blobs, a deeper speck and a lighter one. */
export function paintMess(paint: Paint): Mess {
  const fill = PAINTS[paint];
  return { fill, dark: mix(fill, 0x000000, 0.25), light: mix(fill, 0xffffff, 0.15) };
}

/** Whether every shade of a mess reads on a pet of `color`. */
export const messReadsOn = (mess: Mess, color: PetColor) =>
  [mess.fill, mess.dark, mess.light].every((shade) => readsOn(shade, color));

/** The paints whose every shade reads on a pet of `color` (never its own colour, nor a near one). */
export function paintsFor(color: PetColor): Paint[] {
  return PAINT_COLORS.filter((c) => c !== color && messReadsOn(paintMess(c), color));
}

/** The round's room and its mess on a pet of `color`, drawn from `rng`: the room, then (in the art room) the paint. */
export function pickRoom(
  rng: { pick<T>(items: readonly T[]): T },
  color: PetColor,
): { room: Room; mess: Mess; messy: string } {
  const room = rng.pick(ROOMS);
  const { mess, messy } = ROOM_MESS[room];
  return { room, mess: mess ?? paintMess(rng.pick(paintsFor(color))), messy };
}
