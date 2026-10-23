import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Garden Grow: tap the soil and a seed goes in; rain makes it grow into a smiling flower that
 * sings when tapped. Lap levels are pure cause and effect. Later levels plant the color asked for,
 * count flowers, mix colors, find one more than a picture, and build a two-by-three array. The lap entry (level 8)
 * is one big bed where any touch moves the flower on one stage. Pre-K then chooses a packet and plants it by position:
 * rows of colors (9), columns of colors (10) and the same number in every row (11).
 */
export type GardenMode = 'plant' | 'water' | 'color' | 'count' | 'mix' | 'more' | 'array' | 'big' | 'rows' | 'columns' | 'equal';

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
  { mode: 'more', requests: 3, name: 'Plant one more flower than the sign shows' },
  { mode: 'array', requests: 3, name: 'Plant two rows of three flowers' },
  { mode: 'big', requests: 0, name: 'One big bed: every touch grows the flower one step, three flowers' },
  { mode: 'rows', requests: 3, name: 'Rows of colors: choose a packet and plant each row its color' },
  { mode: 'columns', requests: 3, name: 'Columns of colors: plant each column its color' },
  { mode: 'equal', requests: 3, name: 'Same in every row: plant the same number in each row, in any beds' },
];

/** Levels 2–3 beds are a 2×3 grid: beds 0–2 are the top row, 3–5 the bottom, and a column is a bed's index mod 3. */
export const GRID_MODES: GardenMode[] = ['array', 'rows', 'columns', 'equal'];
/** Modes where she first chooses a packet (it lifts with a ring) and then taps beds. */
export const CHOOSE_MODES: GardenMode[] = ['rows', 'columns', 'equal'];
export const ROW_LEN = 3;
export const rowOf = (bed: number) => Math.floor(bed / ROW_LEN);
export const colOf = (bed: number) => bed % ROW_LEN;

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The shapes a flower can take. Only its color and number are ever judged, never its kind. */
export type FlowerKind = 'blossom' | 'daisy' | 'tulip' | 'sunflower' | 'bell';
export const KINDS: FlowerKind[] = ['blossom', 'daisy', 'tulip', 'sunflower', 'bell'];

/** Level 8: five touches grow one flower (seed in, sprout, leaves, bud, open), and three flowers end the round. */
export const BIG_STAGES = 5;
export const BIG_FLOWERS = 3;
export interface BigState {
  /** Flowers finished and in the vase. */
  done: number;
  /** Stages the current flower has been through, 0 (bare bed) to BIG_STAGES (open and singing). */
  stage: number;
}
/** One touch anywhere on the garden. A flower already open is vased by the touch, which also puts the next seed in. */
export function bigTouch(s: BigState): BigState {
  if (s.done >= BIG_FLOWERS) return s;
  if (s.stage >= BIG_STAGES) return { done: s.done + 1, stage: 1 };
  // The last flower opening ends the round; it needs no touch to be put away.
  if (s.stage + 1 >= BIG_STAGES && s.done + 1 >= BIG_FLOWERS) return { done: BIG_FLOWERS, stage: BIG_STAGES };
  return { done: s.done, stage: s.stage + 1 };
}
export const bigFinished = (s: BigState) => s.done >= BIG_FLOWERS;

/** Garden beds: always room for every request. */
export const BEDS = 6;
export const SEEDS: ColorName[] = ['red', 'yellow', 'blue', 'pink', 'purple', 'orange'];

/** What a request asks for: how many seeds of each color (one color for 'color' and 'count'). */
export interface Request {
  /** What the flowers look like on the sign and packets. */
  kind: FlowerKind;
  want: Partial<Record<ColorName, number>>;
  /** A pictured amount that the child uses to work out the requested amount. */
  shown?: Partial<Record<ColorName, number>>;
  /** Rows and columns levels: the color wanted in each of the six beds, by position. */
  grid?: ColorName[];
  /** 'equal' level: how many flowers each row takes (`want` holds the one color and the total). */
  perRow?: number;
}

/** Two requests are the same when they ask for the same layout, not just the same colors. */
export const requestKey = (r: Request) => JSON.stringify([r.want, r.grid, r.perRow]);

const countOf = (colors: ColorName[]) => {
  const want: Partial<Record<ColorName, number>> = {};
  for (const c of colors) want[c] = (want[c] ?? 0) + 1;
  return want;
};

/** One kind per request, never the same twice running. */
export function kindsFor(n: number, rng: Rng): FlowerKind[] {
  const out: FlowerKind[] = [];
  while (out.length < n) out.push(rng.pick(KINDS.filter((k) => k !== out.at(-1))));
  return out;
}

export function makeRequests(plan: GardenPlan, rng: Rng): Request[] {
  const out: Request[] = [];
  const key = requestKey;
  const kinds = kindsFor(plan.requests, rng);
  while (out.length < plan.requests) {
    const kind = kinds[out.length];
    let r: Request;
    if (plan.mode === 'color') r = { kind, want: { [rng.pick(SEEDS.slice(0, 3))]: 1 } };
    else if (plan.mode === 'count') r = { kind, want: { [rng.pick(SEEDS)]: rng.int(2, 5) } };
    else if (plan.mode === 'more') {
      const color = rng.pick(SEEDS);
      const shown = rng.int(1, 4);
      r = { kind, want: { [color]: shown + 1 }, shown: { [color]: shown } };
    } else if (plan.mode === 'array') {
      const color = SEEDS[out.length % SEEDS.length];
      r = { kind, want: { [color]: 6 }, shown: { [color]: 6 } };
    } else if (plan.mode === 'rows') {
      const [top, bottom] = rng.shuffle(SEEDS.slice(0, 4));
      const grid = [...Array<ColorName>(ROW_LEN).fill(top), ...Array<ColorName>(ROW_LEN).fill(bottom)];
      r = { kind, want: countOf(grid), grid };
    } else if (plan.mode === 'columns') {
      const pool = rng.shuffle(SEEDS.slice(0, 4));
      const cols: ColorName[] = rng.chance(0.5) ? [pool[0], pool[1], pool[0]] : [pool[0], pool[1], pool[2]];
      const grid = [...cols, ...cols];
      r = { kind, want: countOf(grid), grid };
    } else if (plan.mode === 'equal') {
      const n = rng.int(1, 2);
      r = { kind, want: { [rng.pick(SEEDS.slice(0, 4))]: 2 * n }, perRow: n };
    } else {
      const [a, b] = rng.shuffle(SEEDS.slice(0, 4)).slice(0, 2);
      const n = rng.int(1, 3);
      const m = rng.int(1, Math.min(3, BEDS - n));
      r = { kind, want: { [a]: n, [b]: m } };
    }
    if (out.length && key(out.at(-1)!) === key(r)) continue;
    out.push(r);
  }
  return out;
}

/** Packets to choose from: on 'count' levels just the one asked for; otherwise three colors including all wanted. */
export function packetsFor(plan: GardenPlan, r: Request | undefined, rng: Rng): ColorName[] {
  if (!r || plan.mode === 'plant' || plan.mode === 'water' || plan.mode === 'big') return [];
  const wanted = Object.keys(r.want) as ColorName[];
  if (plan.mode === 'count' || plan.mode === 'equal') return wanted;
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

/**
 * How a planted garden compares with a rows/columns/equal request. `wrong` lists the beds to light after two misses: a
 * rows or columns bed that is empty or the wrong color; in the equal level the free beds of a short row or the extra seeds
 * of an over-full one, never a bed that would break a row. `first` names the first thing to say: which row or column, and the
 * color it needs (for the equal level, the row's count).
 */
export interface GridJudgement {
  ok: boolean;
  wrong: number[];
  first: { row?: number; col?: number; color?: ColorName; have?: number } | null;
}
export function judgeGrid(r: Request, beds: readonly (ColorName | null)[]): GridJudgement {
  if (r.perRow !== undefined) {
    const color = Object.keys(r.want)[0] as ColorName;
    const wrong: number[] = [];
    let first: GridJudgement['first'] = null;
    for (let row = 0; row < 2; row++) {
      const idx = [0, 1, 2].map((c) => row * ROW_LEN + c);
      const planted = idx.filter((i) => beds[i]);
      if (planted.length === r.perRow && planted.every((i) => beds[i] === color)) continue;
      first ??= { row, color, have: planted.length };
      if (planted.length < r.perRow) wrong.push(...idx.filter((i) => !beds[i]));
      else wrong.push(...planted.slice(r.perRow));
    }
    return { ok: !first, wrong, first };
  }
  const grid = r.grid ?? [];
  const wrong = grid.map((c, i) => (beds[i] === c ? -1 : i)).filter((i) => i >= 0);
  if (!wrong.length) return { ok: true, wrong, first: null };
  const i = wrong[0];
  // A rows level names the row, a columns level the column; a row is one color all along, so the first wrong bed names it.
  const byRow = new Set(grid.slice(0, ROW_LEN)).size === 1 && new Set(grid.slice(ROW_LEN)).size === 1 && grid[0] !== grid[ROW_LEN];
  return { ok: false, wrong, first: byRow ? { row: rowOf(i), color: grid[i] } : { col: colOf(i), color: grid[i] } };
}

export const total = (r: Request) => Object.values(r.want).reduce((a, b) => a + (b ?? 0), 0);

/** What a bed holds, as far as the demonstration needs to know. */
export interface BedState {
  seed: ColorName | null;
  bloom: boolean;
}

/** One touch of the garden: a bed (by position), a seed packet (by color), or the rain cloud. */
export type GardenTouch = { bed: number } | { packet: ColorName } | 'rain';

/**
 * What a capable child touches next. Free play fills the beds, one tap each (and on the rain level, a tap on the cloud once
 * every bed has a seed); a color level takes the packet that was asked for; a counting level takes the packets until the
 * seeds in the beds are exactly what the sign shows, and only then makes it rain. Null while there is nothing left to do.
 */
export function gardenTouch(plan: GardenPlan, request: Request | undefined, beds: readonly BedState[], chosen: ColorName | null = null): GardenTouch | null {
  if (plan.mode === 'big') return null;
  if (plan.mode === 'plant' || plan.mode === 'water') {
    const empty = beds.findIndex((b) => !b.seed);
    if (empty >= 0) return { bed: empty };
    return plan.mode === 'water' && beds.some((b) => !b.bloom) ? 'rain' : null;
  }
  // Flowers in the beds mean the request was met (rain only grows what matches) and the next one is on its way.
  if (!request || beds.some((b) => b.bloom)) return null;
  if (CHOOSE_MODES.includes(plan.mode)) {
    const seeds = beds.map((b) => b.seed);
    const j = judgeGrid(request, seeds);
    if (j.ok) return 'rain';
    // The first bed still to plant (every wrong bed is empty for a capable child), with its color chosen first.
    // Keep planting the color already in hand while any wrong bed still wants it, so the packet is changed as few times as needed.
    const at = request.grid ? (j.wrong.find((i) => request.grid![i] === chosen) ?? j.wrong[0]) : j.wrong[0];
    const need = request.grid ? request.grid[at] : (Object.keys(request.want)[0] as ColorName);
    if (chosen !== need) return { packet: need };
    return { bed: at };
  }
  const want = Object.entries(request.want) as [ColorName, number][];
  // A color level is one seed of the color on the sign.
  if (plan.mode === 'color') return beds.some((b) => b.seed === want[0][0]) ? null : { packet: want[0][0] };
  const planted = beds.filter((b) => b.seed && !b.bloom).map((b) => b.seed!);
  for (const [color, n] of want) if (planted.filter((c) => c === color).length < n) return { packet: color };
  return 'rain';
}
