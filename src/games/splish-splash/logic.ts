import type { SpeciesId } from '../../creatures/species';

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

/** The parts the bath names, for the companion's part table (`src/creatures/parts.ts`): every species has each one. */
export const BATH_PARTS: readonly Part[] = ['tummy', 'head', 'cheeks', 'ears', 'nose'];

/** Each part's splotch size, against a 120 × 96 texture: the face's are smaller than the tummy's. */
export const PART_SIZE: Record<Part, number> = { tummy: 1, head: 0.9, cheeks: 0.62, ears: 0.7, nose: 0.42 };

/**
 * How each species sits in the tub (RW05 slice 2): its scale, and its splotches' share of `PART_SIZE`. The sprout stands
 * where the old pip did; the river and the glider are side on, with their whole face in a small corner of the picture, so
 * they sit larger and their face's splotches are smaller, or the five would pile into one.
 */
export const STAR: Record<SpeciesId, { scale: number; mud: number }> = {
  sprout: { scale: 1.2, mud: 1 },
  river: { scale: 1.7, mud: 0.6 },
  glider: { scale: 1.6, mud: 0.6 },
};

export interface Spot {
  part: Part;
  x: number;
  y: number;
  size: number;
}

/** The splotches on a star whose part points (in its own units) are `points`: one on each point, the tummy's kept full size. */
export function spotsOn(points: (p: Part) => readonly { x: number; y: number }[], mud = 1): Spot[] {
  return BATH_PARTS.flatMap((part) => points(part).map(({ x, y }) => ({ part, x, y, size: PART_SIZE[part] * (part === 'tummy' ? 1 : mud) })));
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
