export type Part = 'tummy' | 'head' | 'cheeks' | 'ears' | 'nose';

export interface Plan {
  /** free: scrub it all off. parts: "wash my ears!", one body part at a time. */
  mode: 'free' | 'parts';
  parts: Part[];
  shuffle?: boolean;
  /** Ask for two parts in one breath ("wash my ears and my nose!"). */
  pairs?: boolean;
  /** With pairs: "first my nose, then my ears", in that order. */
  ordered?: boolean;
}

export const PLANS: Plan[] = [
  { mode: 'free', parts: ['tummy', 'head', 'cheeks'] },
  { mode: 'free', parts: ['tummy', 'head', 'cheeks', 'ears'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks', 'nose'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true, ordered: true },
];

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

/** Where each part's mud sits on Pip (x, y, size), in Pip's own units. */
export const PART_SPOTS: Record<Part, [number, number, number][]> = {
  tummy: [[0, -72, 1]],
  head: [[6, -214, 0.9]],
  cheeks: [
    [-98, -100, 0.62],
    [98, -100, 0.62],
  ],
  ears: [
    [-74, -226, 0.7],
    [74, -226, 0.7],
  ],
  nose: [[0, -112, 0.42]],
};

/** A splotch's texture, and the scrub radius in Pip body units: the brush reaches `SCRUB_R / size` texture units. */
export const MUD_W = 120;
export const MUD_H = 96;
export const SCRUB_R = 26;
/**
 * Half the box, from the middle of a splotch's texture, that any speck of its mud can lie in: blob centers at most 28 and 20 away,
 * a speck at most 0.9 of a blob's radius (26) from its center.
 */
export const MUD_BOX = { x: 52, y: 44 };

/** The part to scrub next: any muddy one when scrubbing freely, and otherwise the first the question allows. */
export function nextToScrub(plan: Plan, index: number, clean: (p: Part) => boolean): Part | null {
  if (plan.mode === 'free') return plan.parts.find((p) => !clean(p)) ?? null;
  return allowedParts(plan, index, clean)[0] ?? null;
}

/**
 * A zig-zag of scrubbing, in a splotch's own texture units (the middle is 0, 0), whose brush leaves no mud behind: every point
 * of the box mud can lie in is within the brush's reach of the path. Rows are 1.2 reaches apart and stop 0.55 of a reach short
 * of the box's sides, so the corners are still inside it.
 */
export function scrubPath(size: number): { x: number; y: number }[] {
  const reach = SCRUB_R / size;
  const rows = Math.ceil((2 * MUD_BOX.y) / (1.2 * reach));
  const half = Math.max(0, MUD_BOX.x - 0.55 * reach);
  const path: { x: number; y: number }[] = [];
  for (let k = 0; k < rows; k++) {
    const y = -MUD_BOX.y + ((k + 0.5) * 2 * MUD_BOX.y) / rows;
    const [a, b] = k % 2 ? [half, -half] : [-half, half];
    path.push({ x: a, y }, { x: b, y });
  }
  return path;
}

/** Whether a point in a splotch's own texture units is close enough to scrub it: on the texture, or within the brush's reach of it. */
export function nearMud(lx: number, ly: number, size: number): boolean {
  const reach = SCRUB_R / size;
  return Math.abs(lx) < MUD_W / 2 + reach && Math.abs(ly) < MUD_H / 2 + reach;
}

/**
 * The splotches a scrub point should count as "not that part" for. The splotches' reaches overlap (the ears reach into the head's,
 * the nose sits inside the tummy's), and a finger that has just finished one ear is still rubbing as the other is asked for, so a
 * point on a splotch that is asked for is scrubbing it, and a finger that has already scrubbed an asked one during this touch is
 * not told off for brushing a neighbor on the way. Only a finger on wrong splotches alone, which has not yet scrubbed the right one, is.
 */
export function wrongTouches(allowed: Part[], near: Part[], scrubbing = false): Part[] {
  return scrubbing || near.some((p) => allowed.includes(p)) ? [] : near;
}
