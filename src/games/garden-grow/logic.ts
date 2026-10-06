import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Garden Grow: tap the soil and a seed goes in; rain makes it grow into a smiling flower that
 * sings when tapped. Lap levels are pure cause and effect. Later levels plant the color asked for,
 * grow exactly so many flowers before the rain, then two colors with a number of each.
 */
export type GardenMode = 'plant' | 'water' | 'color' | 'count' | 'mix';

export interface GardenPlan {
  mode: GardenMode;
  /** Requests in the round; free-play levels fill every bed instead. */
  requests: number;
  name: string;
}

export const PLANS: GardenPlan[] = [
  { mode: 'plant', requests: 0, name: 'Tap the soil: a seed goes in and grows into a flower' },
  { mode: 'water', requests: 0, name: 'Plant seeds, then tap the cloud to make it rain and grow them' },
  { mode: 'color', requests: 4, name: 'Plant the color asked for: "a red flower"' },
  { mode: 'count', requests: 3, name: 'Plant exactly 2 to 5 seeds, then make it rain' },
  { mode: 'mix', requests: 3, name: 'Two colors with a number of each: "2 red and 3 yellow"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Garden beds: always room for every request. */
export const BEDS = 6;
export const SEEDS: ColorName[] = ['red', 'yellow', 'blue', 'pink', 'purple', 'orange'];

/** What a request asks for: how many seeds of each color (one color for 'color' and 'count'). */
export interface Request {
  want: Partial<Record<ColorName, number>>;
}

export function makeRequests(plan: GardenPlan, rng: Rng): Request[] {
  const out: Request[] = [];
  const key = (r: Request) => JSON.stringify(r.want);
  while (out.length < plan.requests) {
    let r: Request;
    if (plan.mode === 'color') r = { want: { [rng.pick(SEEDS.slice(0, 3))]: 1 } };
    else if (plan.mode === 'count') r = { want: { [rng.pick(SEEDS)]: rng.int(2, 5) } };
    else {
      const [a, b] = rng.shuffle(SEEDS.slice(0, 4)).slice(0, 2);
      const n = rng.int(1, 3);
      const m = rng.int(1, Math.min(3, BEDS - n));
      r = { want: { [a]: n, [b]: m } };
    }
    if (out.length && key(out.at(-1)!) === key(r)) continue;
    out.push(r);
  }
  return out;
}

/** Packets to choose from: on 'count' levels just the one asked for; otherwise three colors including all wanted. */
export function packetsFor(plan: GardenPlan, r: Request | undefined, rng: Rng): ColorName[] {
  if (!r || plan.mode === 'plant' || plan.mode === 'water') return [];
  const wanted = Object.keys(r.want) as ColorName[];
  if (plan.mode === 'count') return wanted;
  const extra = rng.shuffle(SEEDS.filter((c) => !wanted.includes(c)));
  return rng.shuffle([...wanted, ...extra].slice(0, 3));
}

/** Whether the planted seeds match the request exactly. */
export function matches(r: Request, planted: ColorName[]): boolean {
  const counts: Partial<Record<ColorName, number>> = {};
  for (const c of planted) counts[c] = (counts[c] ?? 0) + 1;
  const keys = new Set([...Object.keys(counts), ...Object.keys(r.want)]) as Set<ColorName>;
  return [...keys].every((k) => (counts[k] ?? 0) === (r.want[k] ?? 0));
}

export const total = (r: Request) => Object.values(r.want).reduce((a, b) => a + (b ?? 0), 0);
