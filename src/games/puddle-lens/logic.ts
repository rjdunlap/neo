import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Puddle Lens: a lens over one fixed slide (a leaf, a drop from the puddle, a pinch of sand). What you can see, and so what you can
 * tell, depends on how close you look. Four stops, never a number: eyes, hand lens, microscope, closer microscope. Each feature of a
 * sample is drawn whole inside its window of stops, not at all below it, and cropped past the view's edge above it.
 */
export type Stop = 1 | 2 | 3 | 4;
export const STOPS: readonly Stop[] = [1, 2, 3, 4];

export type SampleId = 'leaf' | 'drop' | 'sand' | 'drop-empty';
export type FeatureId = 'leaf' | 'leaf-hairs' | 'boxes' | 'beads' | 'drop' | 'specks' | 'swimmers' | 'swimmer-hairs' | 'pinch' | 'grains' | 'grain-bumps' | 'speck-close';

export interface Feature {
  id: FeatureId;
  /** Drawn whole from the first stop to the last, inclusive. */
  window: readonly [Stop, Stop];
}

const DROP: Feature[] = [
  { id: 'drop', window: [1, 2] },
  { id: 'specks', window: [2, 3] },
  { id: 'swimmers', window: [3, 4] },
  { id: 'swimmer-hairs', window: [4, 4] },
];

/** The feature tables (the definition's model, row for row). */
export const FEATURES: Record<SampleId, readonly Feature[]> = {
  leaf: [
    { id: 'leaf', window: [1, 2] },
    { id: 'leaf-hairs', window: [2, 3] },
    { id: 'boxes', window: [3, 4] },
    { id: 'beads', window: [4, 4] },
  ],
  drop: DROP,
  sand: [
    { id: 'pinch', window: [1, 1] },
    { id: 'grains', window: [2, 3] },
    { id: 'grain-bumps', window: [3, 4] },
  ],
  // The same drop with its specks but no swimmers, and one speck up close so the closest stop still shows something.
  'drop-empty': [...DROP.filter((f) => f.id !== 'swimmers' && f.id !== 'swimmer-hairs'), { id: 'speck-close', window: [4, 4] }],
};

export const featureOf = (sample: SampleId, id: FeatureId): Feature => {
  const f = FEATURES[sample].find((x) => x.id === id);
  if (!f) throw new Error(`${sample} has no ${id}`);
  return f;
};

export type Fit = 'fits' | 'too-small' | 'too-close';

/** Whether a feature is drawn whole at a stop, too small to see yet, or too close to fit. */
export function fitAt(f: Feature, stop: Stop): Fit {
  return stop < f.window[0] ? 'too-small' : stop > f.window[1] ? 'too-close' : 'fits';
}

/** The features drawn whole at a stop. */
export const visibleAt = (sample: SampleId, stop: Stop): FeatureId[] => FEATURES[sample].filter((f) => fitAt(f, stop) === 'fits').map((f) => f.id);

// ----- level 4: the questions -----

export interface Question {
  sample: 'leaf' | 'drop' | 'sand';
  feature: FeatureId;
  /** The thing that no longer fits when she looks too close ("The whole {thing} doesn't fit!"). */
  thing: string;
  /** Said when it is shown: "There {what}!" */
  what: string;
}

export const QUESTIONS: readonly Question[] = [
  { sample: 'leaf', feature: 'leaf', thing: 'leaf', what: 'is the whole leaf' },
  { sample: 'leaf', feature: 'leaf-hairs', thing: 'hair', what: 'are the tiny hairs' },
  { sample: 'leaf', feature: 'boxes', thing: 'box', what: 'are the little boxes' },
  { sample: 'leaf', feature: 'beads', thing: 'bead', what: 'are the green beads' },
  { sample: 'drop', feature: 'drop', thing: 'drop', what: 'is the whole drop' },
  { sample: 'drop', feature: 'specks', thing: 'speck', what: 'are the specks' },
  { sample: 'drop', feature: 'swimmers', thing: 'swimmer', what: 'are the swimmers' },
  { sample: 'drop', feature: 'swimmer-hairs', thing: 'swimmer', what: 'are the swimmer\'s tiny hairs' },
  { sample: 'sand', feature: 'pinch', thing: 'pinch of sand', what: 'is the whole pinch of sand' },
  { sample: 'sand', feature: 'grains', thing: 'grain', what: 'are the separate grains' },
  { sample: 'sand', feature: 'grain-bumps', thing: 'grain', what: 'are the bumps on the grain' },
];

export const windowOf = (q: Question) => featureOf(q.sample, q.feature).window;
/** The stops that show what a question asks for. */
export const acceptedStops = (q: Question): Stop[] => STOPS.filter((s) => fitAt(featureOf(q.sample, q.feature), s) === 'fits');
export const canBeTooClose = (q: Question) => windowOf(q)[1] < 4;

export type ViewVerdict = 'ok' | 'too-small' | 'too-close';
export function judgeView(q: Question, stop: Stop): ViewVerdict {
  const f = fitAt(featureOf(q.sample, q.feature), stop);
  return f === 'fits' ? 'ok' : f;
}

const questionsOf = (sample: Question['sample']) => QUESTIONS.filter((q) => q.sample === sample);
const goodRound = (qs: Question[]) => qs.some(canBeTooClose) && qs.some((q) => windowOf(q)[0] >= 3);

/** Three questions on one sample, one that can be too close and one that needs stop 3 or closer. The authored round is the leaf: boxes, then the whole leaf. */
export function questionsFor(rng: Rng, authored: boolean): Question[] {
  if (authored) {
    const leaf = questionsOf('leaf');
    const third = rng.pick(leaf.filter((q) => q.feature !== 'boxes' && q.feature !== 'leaf'));
    return [leaf.find((q) => q.feature === 'boxes')!, leaf.find((q) => q.feature === 'leaf')!, third];
  }
  const all = questionsOf(rng.pick(['leaf', 'drop', 'sand'] as const));
  for (;;) {
    const qs = rng.shuffle([...all]).slice(0, 3);
    if (goodRound(qs)) return qs;
  }
}

// ----- level 3: drops and swimmers -----

export type SwimmerShape = 'round' | 'long' | 'bean';

/** A swimmer's drift, in drop units (the stop-3 view's radius is 1): a slow, gentle loop around its own spot. */
export interface Swimmer {
  shape: SwimmerShape;
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  wx: number;
  wy: number;
  px: number;
  py: number;
}

export interface Drop {
  swimmers: Swimmer[];
}

/** A swimmer's length in drop units: 130 art units at stop 3. */
export const SWIMMER_LENGTH = 0.65;
/** How much closer stop 4 looks than stop 3, inside the drop. */
export const STOP4_ZOOM = 1.7;
/** The lens view's radius in art units; the drawing is scaled to the real lens. */
export const ART_R = 200;
/** No swimmer drifts faster than this, in screen units a second, at the largest lens and the closest stop. */
export const MAX_SPEED = 30;
/** A tap within this many screen units of a swimmer's centre is a tap on it. */
export const SWIMMER_REACH = 90;
/** The farthest a swimmer's centre goes from the middle of the drop, so it stays in view at stop 4 too. */
export const SWIMMER_FIELD = 0.55;

/** How large a lens art unit is drawn, at most, so the drift speed stays gentle on the widest screens. */
export const MAX_ART_SCALE = 1.75;
const MAX_DROP_SPEED = MAX_SPEED / (ART_R * STOP4_ZOOM * MAX_ART_SCALE);

function makeSwimmer(rng: Rng, shape: SwimmerShape, i: number, n: number): Swimmer {
  const a = (Math.PI * 2 * i) / n + rng.range(-0.4, 0.4);
  const r = 0.28;
  const amp = SWIMMER_FIELD - r;
  const rx = rng.range(0.1, amp);
  const ry = rng.range(0.1, amp);
  // The drift's reach from its spot is hypot(ax, ay): keep it within amp so the centre never leaves SWIMMER_FIELD.
  const shrink = Math.min(1, amp / Math.hypot(rx, ry));
  const ax = rx * shrink;
  const ay = ry * shrink;
  // Speed is at most hypot(ax·wx, ay·wy): keep it under the limit.
  const w = MAX_DROP_SPEED / Math.hypot(ax, ay);
  return { shape, cx: Math.cos(a) * r, cy: Math.sin(a) * r, ax, ay, wx: w * rng.range(0.6, 1), wy: w * rng.range(0.6, 1), px: rng.range(0, Math.PI * 2), py: rng.range(0, Math.PI * 2) };
}

/** Where a swimmer is at time `t` (drop units) and which way it heads. */
export function swimmerAt(s: Swimmer, t: number): { x: number; y: number; angle: number } {
  const x = s.cx + s.ax * Math.sin(s.wx * t + s.px);
  const y = s.cy + s.ay * Math.sin(s.wy * t + s.py);
  const vx = s.ax * s.wx * Math.cos(s.wx * t + s.px);
  const vy = s.ay * s.wy * Math.cos(s.wy * t + s.py);
  return { x, y, angle: Math.atan2(vy, vx) };
}

/** The fastest a swimmer can drift, in drop units a second. */
export const swimmerSpeed = (s: Swimmer) => Math.hypot(s.ax * s.wx, s.ay * s.wy);

/** Drop units to art units at a stop (stops 3 and 4 look inside the drop). */
export const dropScale = (stop: Stop) => ART_R * (stop === 4 ? STOP4_ZOOM : 1);

/** Three drops: at least two with swimmers, at most one empty. The authored first drop has two round swimmers. */
export function dropsFor(rng: Rng, authored: boolean): Drop[] {
  const empty = authored ? (rng.next() < 0.5 ? 2 : -1) : rng.next() < 0.6 ? rng.int(0, 2) : -1;
  return [0, 1, 2].map((i) => {
    if (i === empty) return { swimmers: [] };
    const n = authored && i === 0 ? 2 : rng.int(2, 3);
    const shape = authored && i === 0 ? 'round' : rng.pick(['round', 'long', 'bean'] as const);
    return { swimmers: Array.from({ length: n }, (_, k) => makeSwimmer(rng, shape, k, n)) };
  });
}

export type SwimmerAnswer = { kind: 'none' } | { kind: 'tap'; swimmer: number | null };
export type SwimmerVerdict =
  /** A swimmer tapped, or No swimmers on an empty drop: the drop is done. */
  | { result: 'right'; line: 'lens.found' | 'lens.none' }
  /** Nothing to judge yet, or a tap off every swimmer: a prompt, never a miss. */
  | { result: 'free'; line: 'lens.not-yet' | 'lens.cant-tell' | 'lens.find-one' | 'lens.only-specks' }
  /** No swimmers when there are swimmers, at a stop that shows them. */
  | { result: 'miss'; line: 'lens.look-again' };

/** The stop that decides whether a drop has swimmers (where they first show). */
export const DECIDING: Stop = featureOf('drop', 'swimmers').window[0];

export function judgeSwimmers(drop: Drop, stop: Stop, answer: SwimmerAnswer): SwimmerVerdict {
  const populated = drop.swimmers.length > 0;
  if (stop < DECIDING) return { result: 'free', line: answer.kind === 'none' ? 'lens.cant-tell' : 'lens.not-yet' };
  if (answer.kind === 'none') return populated ? { result: 'miss', line: 'lens.look-again' } : { result: 'right', line: 'lens.none' };
  if (!populated) return { result: 'free', line: 'lens.only-specks' };
  return answer.swimmer === null ? { result: 'free', line: 'lens.find-one' } : { result: 'right', line: 'lens.found' };
}

/** The swimmer a tap at (x, y) means: the nearest within reach whose centre is in view, or null. Positions in screen units from the lens centre. */
export function nearestSwimmer(at: { x: number; y: number }, swimmers: readonly { x: number; y: number }[], viewR: number): number | null {
  let best: number | null = null;
  let bestD = SWIMMER_REACH;
  swimmers.forEach((s, i) => {
    if (Math.hypot(s.x, s.y) > viewR) return;
    const d = Math.hypot(s.x - at.x, s.y - at.y);
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

// ----- levels 1–2 -----

export const THINGS: readonly ('leaf' | 'drop' | 'sand')[] = ['leaf', 'drop', 'sand'];

/** Level 2: a thing counts as looked at once the glass's centre has stayed this close for this long. */
export const LOOK_NEAR = 50;
export const LOOK_TIME = 0.6;

/** Level 2's looking: which things have been looked at, each once. */
export class LookTracker {
  readonly looked = new Set<number>();
  private at = -1;
  private held = 0;
  /** The glass is at `glass`; returns a thing just looked at, or null. */
  update(dt: number, glass: { x: number; y: number }, things: readonly { x: number; y: number }[]): number | null {
    const near = things.findIndex((t) => Math.hypot(t.x - glass.x, t.y - glass.y) <= LOOK_NEAR);
    if (near !== this.at) {
      this.at = near;
      this.held = 0;
    }
    if (near < 0 || this.looked.has(near)) return null;
    this.held += dt;
    if (this.held < LOOK_TIME) return null;
    this.looked.add(near);
    return near;
  }
  get done() {
    return this.looked.size >= 3;
  }
}

// ----- help -----

export type Help = { do: 'tap-lens' } | { do: 'glide'; to: number } | { do: 'turn'; stop: Stop };

/** What Show a hint does: tap the lens (1), glide to the nearest thing not yet looked at (2), turn to the stop that decides (3) or the lowest that shows the asked thing (4). */
export function helpFor(level: number, s: { glass?: { x: number; y: number }; things?: readonly { x: number; y: number }[]; looked?: ReadonlySet<number>; question?: Question }): Help | null {
  if (level === 1) return { do: 'tap-lens' };
  if (level === 3) return { do: 'turn', stop: DECIDING };
  if (level === 4) return s.question ? { do: 'turn', stop: windowOf(s.question)[0] } : null;
  const { glass, things = [], looked = new Set() } = s;
  let best = -1;
  let bestD = Infinity;
  things.forEach((t, i) => {
    if (looked.has(i)) return;
    const d = glass ? Math.hypot(t.x - glass.x, t.y - glass.y) : i;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best < 0 ? null : { do: 'glide', to: best };
}

// ----- variety -----

export type LeafKind = 'round' | 'long' | 'maple';
export interface Looks {
  leaf: LeafKind;
  sand: ColorName[];
}
export const looksFor = (rng: Rng, authored: boolean): Looks => ({
  leaf: authored ? 'round' : rng.pick(['round', 'long', 'maple'] as const),
  sand: rng.shuffle(['yellow', 'orange', 'brown', 'white', 'red'] as ColorName[]).slice(0, 3),
});

// ----- layout -----

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Ring {
  x: number;
  y: number;
  r: number;
}

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export const STOP_SIZE = 110;
export const ANSWER_SIZE = 120;
export const MIN_LENS = 360;
export const MIN_LENS_1 = 300;
export const THING_SIZE = 160;
export const THING_GAP = 60;
export const GLASS_R = 125;
const M = 20;
const GAP = 12;

export interface LensLayout {
  /** The lens view (levels 1, 3 and 4). */
  lens: Ring;
  /** Levels 3–4: the four stop buttons, then the answer button. */
  stops: Rect[];
  answer: Rect | null;
  /** Level 2: the three things on the table, the hand lens's resting place and the area its glass stays inside. */
  things: Ring[];
  rest: { x: number; y: number } | null;
  table: Rect | null;
  /** The companion's paw, outside the lens view (levels 2–4), or null where there is no room. */
  paw: Ring | null;
}

export const corners = (v: View): Rect[] => [
  { x: 0, y: 0, ...HOME_CORNER },
  { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER },
];

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
export const ringBox = (c: Ring): Rect => ({ x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 });
/** A ring overlaps a rectangle (exactly, not by its box). */
export function ringHits(c: Ring, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return Math.hypot(nx - c.x, ny - c.y) < c.r;
}

/** Where everything goes, or null rather than a button under 110, a lens under 360 (300 at level 1) or a level-2 thing under 160. */
export function lensLayout(v: View, level: number): LensLayout | null {
  const wide = v.w >= v.h;
  const none = { stops: [], answer: null, things: [], rest: null, table: null, paw: null };
  const ok = (l: LensLayout) => {
    const rects = [...l.stops, ...(l.answer ? [l.answer] : []), ...l.things.map(ringBox), ...(l.paw ? [ringBox(l.paw)] : [])];
    if (!rects.every((r) => inside(r, v))) return null;
    if (rects.some((r) => corners(v).some((k) => overlaps(r, k)))) return null;
    if (rects.some((a, i) => rects.some((b, j) => i < j && overlaps(a, b)))) return null;
    if (level !== 2) {
      if (!inside(ringBox(l.lens), v) || corners(v).some((k) => ringHits(l.lens, k))) return null;
      if (rects.some((r) => ringHits(l.lens, r))) return null;
    }
    return l;
  };
  const maxR = (ART_R * MAX_ART_SCALE);
  if (level === 1) {
    const area = { x: PET_CORNER.w + 10, y: M, w: v.w - 2 * (PET_CORNER.w + 10), h: v.h - 2 * M };
    const r = Math.min(maxR, (Math.min(area.w, area.h) - 40) / 2);
    if (r * 2 < MIN_LENS_1) return null;
    return ok({ ...none, lens: { x: v.w / 2, y: v.h / 2, r } });
  }
  if (level === 2) {
    const rowY = v.h * (wide ? 0.62 : 0.6);
    const step = Math.min(THING_SIZE + 100, (v.w - 2 * M - THING_SIZE) / 2);
    if (step < THING_SIZE + THING_GAP) return null;
    const things = [-1, 0, 1].map((k) => ({ x: v.w / 2 + k * step, y: rowY, r: THING_SIZE / 2 }));
    const paw = { x: v.w / 2, y: rowY + THING_SIZE / 2 + 70, r: 55 };
    const rest = { x: v.w / 2, y: rowY - THING_SIZE / 2 - 40 - GLASS_R };
    const table = { x: PET_CORNER.w + 10, y: M, w: v.w - PET_CORNER.w - 10 - M, h: v.h - 2 * M };
    if (rest.y - GLASS_R < M) return null;
    return ok({ ...none, lens: { ...rest, r: GLASS_R }, things, rest, table, paw });
  }
  let stops: Rect[];
  let answer: Rect;
  let area: Rect;
  if (wide) {
    const total = 4 * STOP_SIZE + 3 * GAP + 20 + ANSWER_SIZE;
    const top = (v.h - total) / 2;
    const cx = v.w - M - ANSWER_SIZE / 2;
    stops = STOPS.map((_, i) => ({ x: cx - STOP_SIZE / 2, y: top + i * (STOP_SIZE + GAP), w: STOP_SIZE, h: STOP_SIZE }));
    answer = { x: cx - ANSWER_SIZE / 2, y: top + total - ANSWER_SIZE, w: ANSWER_SIZE, h: ANSWER_SIZE };
    area = { x: PET_CORNER.w + 10, y: M, w: v.w - ANSWER_SIZE - 3 * M - PET_CORNER.w - 10, h: v.h - 2 * M };
  } else {
    const total = 4 * STOP_SIZE + 4 * GAP + ANSWER_SIZE;
    const x0 = (v.w - total) / 2;
    const bottom = v.h - PET_CORNER.h - 10;
    stops = STOPS.map((_, i) => ({ x: x0 + i * (STOP_SIZE + GAP), y: bottom - STOP_SIZE - (ANSWER_SIZE - STOP_SIZE) / 2, w: STOP_SIZE, h: STOP_SIZE }));
    answer = { x: x0 + total - ANSWER_SIZE, y: bottom - ANSWER_SIZE, w: ANSWER_SIZE, h: ANSWER_SIZE };
    const top = HOME_CORNER.h + 10;
    area = { x: M, y: top, w: v.w - 2 * M, h: bottom - ANSWER_SIZE - M - top };
  }
  const r = Math.min(maxR, (Math.min(area.w, area.h) - 40) / 2);
  if (r * 2 < MIN_LENS) return null;
  const lens = { x: area.x + area.w / 2, y: area.y + area.h / 2, r };
  // The paw rests just outside the lens, down and to the left, where there is room.
  const d = (r + 70) / Math.SQRT2;
  const paw = { x: lens.x - d, y: lens.y + d, r: 45 };
  const withPaw = ok({ ...none, lens, stops, answer, paw });
  return withPaw ?? ok({ ...none, lens, stops, answer });
}

/** The glass stays on the table. */
export function clampGlass(p: { x: number; y: number }, table: Rect): { x: number; y: number } {
  return { x: Math.min(table.x + table.w - GLASS_R, Math.max(table.x + GLASS_R, p.x)), y: Math.min(table.y + table.h - GLASS_R, Math.max(table.y + GLASS_R, p.y)) };
}

// ----- the round's tally -----

/** Misses and hints, at most one hint per question (thing, drop or view), and the misses on the question in hand for the glow. */
export class LensTally {
  misses = 0;
  hints = 0;
  here = 0;
  private hinted = false;
  next() {
    this.here = 0;
    this.hinted = false;
  }
  miss() {
    this.misses++;
    this.here++;
  }
  /** Returns whether this hint counts (the first on this question). */
  hint(): boolean {
    if (this.hinted) return false;
    this.hinted = true;
    this.hints++;
    return true;
  }
  /** Two misses on this question: the glow shows. */
  get glow() {
    return this.here >= 2;
  }
}

export interface PlanInfo {
  level: 1 | 2 | 3 | 4;
  name: string;
}
export const PLANS: readonly PlanInfo[] = [
  { level: 1, name: 'Look closer: tap the lens and each thing looks bigger' },
  { level: 2, name: 'Lens over: slide a hand lens over three things' },
  { level: 3, name: 'Anyone there? Turn the dial to find swimmers in a drop' },
  { level: 4, name: 'Just enough: set the dial to just the view asked for' },
];
export const planFor = (level: number): PlanInfo => PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
