import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Puddle Lens: a lens over one fixed slide (a leaf, a drop from the puddle, a pinch of sand). What you can see, and so what you can
 * tell, depends on how close you look. Four stops, never a number: eyes, hand lens, microscope, closer microscope. Each feature of a
 * sample is drawn whole inside its window of stops, not at all below it, and cropped past the view's edge above it.
 */
export type Stop = 1 | 2 | 3 | 4;
export const STOPS: readonly Stop[] = [1, 2, 3, 4];

export type SampleId = 'leaf' | 'drop' | 'sand' | 'drop-empty';
export type FeatureId =
  | 'leaf'
  | 'leaf-hairs'
  | 'boxes'
  | 'beads'
  | 'drop'
  | 'specks'
  | 'swimmers'
  | 'swimmer-hairs'
  | 'pinch'
  | 'grains'
  | 'grain-bumps'
  | 'speck-close';

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
  'drop-empty': [
    ...DROP.filter((f) => f.id !== 'swimmers' && f.id !== 'swimmer-hairs'),
    { id: 'speck-close', window: [4, 4] },
  ],
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
export const visibleAt = (sample: SampleId, stop: Stop): FeatureId[] =>
  FEATURES[sample].filter((f) => fitAt(f, stop) === 'fits').map((f) => f.id);

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
  { sample: 'drop', feature: 'swimmer-hairs', thing: 'swimmer', what: "are the swimmer's tiny hairs" },
  { sample: 'sand', feature: 'pinch', thing: 'pinch of sand', what: 'is the whole pinch of sand' },
  { sample: 'sand', feature: 'grains', thing: 'grain', what: 'are the separate grains' },
  { sample: 'sand', feature: 'grain-bumps', thing: 'grain', what: 'are the bumps on the grain' },
];

export const windowOf = (q: Question) => featureOf(q.sample, q.feature).window;
/** The stops that show what a question asks for. */
export const acceptedStops = (q: Question): Stop[] =>
  STOPS.filter((s) => fitAt(featureOf(q.sample, q.feature), s) === 'fits');
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

function makeSwimmer(rng: Rng, shape: SwimmerShape, i: number, n: number, r = 0.28): Swimmer {
  const a = (Math.PI * 2 * i) / n + rng.range(-0.4, 0.4);
  const amp = SWIMMER_FIELD - r;
  const rx = rng.range(0.1, amp);
  const ry = rng.range(0.1, amp);
  // The drift's reach from its spot is hypot(ax, ay): keep it within amp so the centre never leaves SWIMMER_FIELD.
  const shrink = Math.min(1, amp / Math.hypot(rx, ry));
  const ax = rx * shrink;
  const ay = ry * shrink;
  // Speed is at most hypot(ax·wx, ay·wy): keep it under the limit.
  const w = MAX_DROP_SPEED / Math.hypot(ax, ay);
  return {
    shape,
    cx: Math.cos(a) * r,
    cy: Math.sin(a) * r,
    ax,
    ay,
    wx: w * rng.range(0.6, 1),
    wy: w * rng.range(0.6, 1),
    px: rng.range(0, Math.PI * 2),
    py: rng.range(0, Math.PI * 2),
  };
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
  if (stop < DECIDING)
    return { result: 'free', line: answer.kind === 'none' ? 'lens.cant-tell' : 'lens.not-yet' };
  if (answer.kind === 'none')
    return populated ? { result: 'miss', line: 'lens.look-again' } : { result: 'right', line: 'lens.none' };
  if (!populated) return { result: 'free', line: 'lens.only-specks' };
  return answer.swimmer === null
    ? { result: 'free', line: 'lens.find-one' }
    : { result: 'right', line: 'lens.found' };
}

/** The swimmer a tap at (x, y) means: the nearest within reach whose centre is in view, or null. Positions in screen units from the lens centre. */
export function nearestSwimmer(
  at: { x: number; y: number },
  swimmers: readonly { x: number; y: number }[],
  viewR: number,
): number | null {
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
  update(
    dt: number,
    glass: { x: number; y: number },
    things: readonly { x: number; y: number }[],
  ): number | null {
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

// ----- levels 5–6: alive, and cells -----

/**
 * What a candidate shows at a stop that can decide something. Moving and colour are drawn but are never evidence: a drifting bubble
 * and a swimmer both move, and a green ball and a brown speck differ only in colour until the closest stop.
 */
export type Evidence =
  'edge' | 'inside' | 'hairs' | 'empty' | 'ragged' | 'boxes' | 'cracks' | 'wall' | 'soft-edge' | 'even';
export type CandidateId = 'swimmer' | 'green-ball' | 'mud-speck' | 'silt' | 'bubble';
export type Motion = 'swims' | 'drifts' | 'still';

export interface Candidate {
  id: CandidateId;
  alive: boolean;
  /** Evidence at stops 1–4 (index 0 is stop 1). */
  evidence: readonly (readonly Evidence[])[];
  motion: Motion;
}

/** The level-5 candidates (the definition's table, row for row). Nothing separate shows at stops 1–2. */
export const CANDIDATES: Record<CandidateId, Candidate> = {
  swimmer: {
    id: 'swimmer',
    alive: true,
    evidence: [[], [], ['edge', 'inside'], ['edge', 'inside', 'hairs']],
    motion: 'swims',
  },
  'green-ball': {
    id: 'green-ball',
    alive: true,
    evidence: [[], [], [], ['edge', 'inside']],
    motion: 'still',
  },
  'mud-speck': {
    id: 'mud-speck',
    alive: false,
    evidence: [[], [], ['ragged'], ['ragged']],
    motion: 'drifts',
  },
  silt: { id: 'silt', alive: false, evidence: [[], [], [], ['ragged']], motion: 'still' },
  bubble: {
    id: 'bubble',
    alive: false,
    evidence: [[], [], ['edge', 'empty'], ['edge', 'empty']],
    motion: 'drifts',
  },
};

export const evidenceAt = (c: CandidateId, stop: Stop): readonly Evidence[] =>
  CANDIDATES[c].evidence[stop - 1];
const sameSet = (a: readonly Evidence[], b: readonly Evidence[]) =>
  a.length === b.length && a.every((e) => b.includes(e));
/** Alive exactly when an edge all round and parts inside show. */
export const looksAlive = (ev: readonly Evidence[]) => ev.includes('edge') && ev.includes('inside');

export type PairId = 'A' | 'B' | 'C';
/** The reviewed pairs: one alive and one not alive, both moving or both still. */
export const PAIRS: Record<PairId, readonly [CandidateId, CandidateId]> = {
  A: ['swimmer', 'mud-speck'],
  B: ['swimmer', 'bubble'],
  C: ['green-ball', 'silt'],
};
export const PAIR_IDS: readonly PairId[] = ['A', 'B', 'C'];

/** The lowest stop where the pair's evidence differs. */
export function decidingStop(pair: PairId): Stop {
  const [a, b] = PAIRS[pair];
  return STOPS.find((s) => !sameSet(evidenceAt(a, s), evidenceAt(b, s))) ?? 4;
}

export type LifeAnswer = 'alive' | 'not-alive' | 'cant-tell';
export type LifeVerdict =
  | { result: 'free'; line: 'lens.could-be' | 'lens.right-for-now' }
  | { result: 'right'; line: 'lens.alive.yes' | 'lens.alive.no' }
  | { result: 'miss'; line: 'lens.can-tell-now' | LookLine };
export type LookLine = 'lens.look.inside' | 'lens.look.empty' | 'lens.look.ragged';

/** What the companion says to point at the ringed thing's evidence, never the verdict. */
export function lookLine(c: CandidateId, stop: Stop): LookLine {
  const ev = evidenceAt(c, stop);
  return ev.includes('inside')
    ? 'lens.look.inside'
    : ev.includes('empty')
      ? 'lens.look.empty'
      : 'lens.look.ragged';
}

/** Judge an answer about the ringed candidate (0 or 1 of the pair) at a stop. Below the deciding stop nothing counts, either way. */
export function judgeLife(pair: PairId, ringed: 0 | 1, stop: Stop, answer: LifeAnswer): LifeVerdict {
  const c = PAIRS[pair][ringed];
  if (stop < decidingStop(pair))
    return answer === 'cant-tell'
      ? { result: 'free', line: 'lens.right-for-now' }
      : { result: 'free', line: 'lens.could-be' };
  if (answer === 'cant-tell') return { result: 'miss', line: 'lens.can-tell-now' };
  const alive = looksAlive(evidenceAt(c, stop));
  if ((answer === 'alive') === alive)
    return { result: 'right', line: alive ? 'lens.alive.yes' : 'lens.alive.no' };
  return { result: 'miss', line: lookLine(c, stop) };
}

/** The answer that is right at a stop, for the glow and the ghost finger. */
export const rightLife = (pair: PairId, ringed: 0 | 1, stop: Stop): LifeAnswer =>
  stop < decidingStop(pair)
    ? 'cant-tell'
    : looksAlive(evidenceAt(PAIRS[pair][ringed], stop))
      ? 'alive'
      : 'not-alive';

/** How far each level-5 speck's spot is from the middle of the drop. */
export const LIFE_SPOT = 0.4;

/** A level-5 drop: a pair, which one the companion rings, and each one's path (a still one's amplitudes are zero). */
export interface LifeDrop {
  pair: PairId;
  ringed: 0 | 1;
  paths: [Swimmer, Swimmer];
}

function makePath(rng: Rng, id: CandidateId | FileSampleId, i: number, r = LIFE_SPOT): Swimmer {
  const motion =
    id in CANDIDATES ? CANDIDATES[id as CandidateId].motion : FILE_SAMPLES[id as FileSampleId].motion;
  // At level 5 the two sit well apart, on opposite sides of the drop, so the ring round one never takes in the other.
  if (motion === 'swims') return makeSwimmer(rng, rng.pick(['round', 'long', 'bean'] as const), i, 2, r);
  const a = Math.PI * i + rng.range(-0.4, 0.4);
  const base: Swimmer = {
    shape: 'round',
    cx: Math.cos(a) * r,
    cy: Math.sin(a) * r,
    ax: 0,
    ay: 0,
    wx: 0,
    wy: 0,
    px: 0,
    py: 0,
  };
  if (motion === 'still') return base;
  // A slow straight drift with the water, back and forth along one line.
  const d = rng.range(0, Math.PI * 2);
  const amp = rng.range(0.06, SWIMMER_FIELD - r);
  const w = (MAX_DROP_SPEED * 0.8) / amp;
  const p = rng.range(0, Math.PI * 2);
  return { ...base, ax: Math.cos(d) * amp, ay: Math.sin(d) * amp, wx: w, wy: w, px: p, py: p };
}

/**
 * Three drops, one of each pair in a shuffled order (no pair twice), with at least one ringed alive and one ringed not alive. The
 * authored round is A with the swimmer ringed, C with the silt ringed, then B.
 */
export function lifeDropsFor(rng: Rng, authored: boolean): LifeDrop[] {
  let order: PairId[];
  let rings: (0 | 1)[];
  if (authored) {
    order = ['A', 'C', 'B'];
    rings = [0, 1, rng.next() < 0.5 ? 0 : 1];
  } else {
    order = rng.shuffle([...PAIR_IDS]);
    for (;;) {
      rings = order.map(() => (rng.next() < 0.5 ? 0 : 1));
      const alive = rings.map((k, i) => CANDIDATES[PAIRS[order[i]][k]].alive);
      if (alive.includes(true) && alive.includes(false)) break;
    }
  }
  return order.map((pair, i) => {
    const [a, b] = PAIRS[pair];
    const paths: [Swimmer, Swimmer] = [makePath(rng, a, 0), makePath(rng, b, 1)];
    return { pair, ringed: rings[i], paths };
  });
}

export type CellClass = 'one' | 'many' | 'not';
export type SortSampleId =
  'leaf' | 'onion-skin' | 'green-thread' | 'swimmer' | 'green-ball' | 'sand' | 'bubble' | 'mud-speck';

export interface SortSample {
  id: SortSampleId;
  cls: CellClass;
  /** The evidence that shows its class, drawn whole from the deciding stop on. */
  evidence: readonly Evidence[];
  deciding: Stop;
}

/** The level-6 samples (the definition's table, row for row). */
export const SORT_SAMPLES: Record<SortSampleId, SortSample> = {
  leaf: { id: 'leaf', cls: 'many', evidence: ['boxes'], deciding: 3 },
  'onion-skin': { id: 'onion-skin', cls: 'many', evidence: ['boxes'], deciding: 3 },
  'green-thread': { id: 'green-thread', cls: 'many', evidence: ['boxes'], deciding: 3 },
  swimmer: { id: 'swimmer', cls: 'one', evidence: ['edge', 'inside'], deciding: 3 },
  'green-ball': { id: 'green-ball', cls: 'one', evidence: ['edge', 'inside'], deciding: 4 },
  sand: { id: 'sand', cls: 'not', evidence: ['cracks'], deciding: 3 },
  bubble: { id: 'bubble', cls: 'not', evidence: ['edge', 'empty'], deciding: 3 },
  'mud-speck': { id: 'mud-speck', cls: 'not', evidence: ['ragged'], deciding: 3 },
};
export const SORT_IDS = Object.keys(SORT_SAMPLES) as SortSampleId[];
export const CLASSES: readonly CellClass[] = ['one', 'many', 'not'];

/** The evidence a sample shows at a stop: its class evidence from the deciding stop on, nothing that decides below it. */
export const sortEvidenceAt = (s: SortSampleId, stop: Stop): readonly Evidence[] =>
  stop >= SORT_SAMPLES[s].deciding ? SORT_SAMPLES[s].evidence : [];

export type SeeLine =
  'lens.see.boxes' | 'lens.see.one' | 'lens.see.empty' | 'lens.see.ragged' | 'lens.see.cracks';
/** What the view shows, said on a wrong tray and by Show a hint. */
export function seeLine(s: SortSampleId): SeeLine {
  const ev = SORT_SAMPLES[s].evidence;
  return ev.includes('boxes')
    ? 'lens.see.boxes'
    : ev.includes('inside')
      ? 'lens.see.one'
      : ev.includes('empty')
        ? 'lens.see.empty'
        : ev.includes('ragged')
          ? 'lens.see.ragged'
          : 'lens.see.cracks';
}

export type SortVerdict =
  | { result: 'free'; line: 'lens.look-closer-edges' }
  | { result: 'right'; line: 'lens.sorted.one' | 'lens.sorted.many' | 'lens.sorted.not' }
  | { result: 'miss'; line: SeeLine };

export function judgeSort(s: SortSampleId, stop: Stop, tray: CellClass): SortVerdict {
  const sample = SORT_SAMPLES[s];
  if (stop < sample.deciding) return { result: 'free', line: 'lens.look-closer-edges' };
  if (tray === sample.cls) return { result: 'right', line: `lens.sorted.${tray}` };
  return { result: 'miss', line: seeLine(s) };
}

/** Four slides, no sample twice, every class at least once, and the green ball (decided only at the closest stop). Authored: thread, swimmer, sand, green ball. */
export function sortRoundFor(rng: Rng, authored: boolean): SortSampleId[] {
  if (authored) return ['green-thread', 'swimmer', 'sand', 'green-ball'];
  const pick = (cls: CellClass, not: SortSampleId[] = []) =>
    rng.pick(SORT_IDS.filter((id) => SORT_SAMPLES[id].cls === cls && !not.includes(id)));
  const chosen: SortSampleId[] = ['green-ball', pick('many'), pick('not')];
  chosen.push(rng.pick(SORT_IDS.filter((id) => !chosen.includes(id))));
  return rng.shuffle(chosen);
}

// ----- levels 7–8: the wall clue, and why the water is green -----

/** Level 7's slides: true plant and animal cells only (no swimmer, thread or green ball, which are neither). */
export type WallSlideId = 'onion-skin' | 'leaf' | 'cheek-cells';
export type WallKind = 'plant' | 'animal';
export type WallAnswer = WallKind | 'cant-tell';

export interface WallSlide {
  id: WallSlideId;
  kind: WallKind;
  /** Evidence at stops 1–4 (index 0 is stop 1). Colour is drawn but is never evidence. */
  evidence: readonly (readonly Evidence[])[];
  colour: 'none' | 'green' | 'pale';
}

/** The level-7 slides (the definition's table, row for row). `wall` and `soft-edge` decide; `inside` shows on both and decides nothing. */
export const WALL_SLIDES: Record<WallSlideId, WallSlide> = {
  'onion-skin': {
    id: 'onion-skin',
    kind: 'plant',
    evidence: [[], [], ['wall'], ['wall', 'inside']],
    colour: 'none',
  },
  leaf: { id: 'leaf', kind: 'plant', evidence: [[], [], ['wall'], ['wall']], colour: 'green' },
  'cheek-cells': {
    id: 'cheek-cells',
    kind: 'animal',
    evidence: [[], [], ['soft-edge', 'inside'], ['soft-edge', 'inside']],
    colour: 'pale',
  },
};
export const WALL_IDS = Object.keys(WALL_SLIDES) as WallSlideId[];

/** Plant exactly when a wall shows, animal exactly when soft edges show, otherwise not yet. */
export const wallKindOf = (ev: readonly Evidence[]): WallKind | null =>
  ev.includes('wall') ? 'plant' : ev.includes('soft-edge') ? 'animal' : null;
export const wallEvidenceAt = (s: WallSlideId, stop: Stop): readonly Evidence[] =>
  WALL_SLIDES[s].evidence[stop - 1];
/** The lowest stop where the truth rule can tell. */
export const wallDeciding = (s: WallSlideId): Stop =>
  STOPS.find((stop) => wallKindOf(wallEvidenceAt(s, stop)) !== null) ?? 4;

export type WallSeeLine = 'lens.wall.see.wall' | 'lens.wall.see.no-green' | 'lens.wall.see.soft';
/** What the view shows (a wrong kind, and Show a hint), never the verdict. */
export const wallSeeLine = (s: WallSlideId): WallSeeLine =>
  WALL_SLIDES[s].kind === 'animal'
    ? 'lens.wall.see.soft'
    : WALL_SLIDES[s].colour === 'none'
      ? 'lens.wall.see.no-green'
      : 'lens.wall.see.wall';

export type WallVerdict =
  | { result: 'free'; line: 'lens.could-be' | 'lens.right-for-now' }
  | { result: 'right'; line: 'lens.wall.yes.plant' | 'lens.wall.yes.animal' }
  | { result: 'miss'; line: 'lens.wall.can-tell-now' | WallSeeLine };

/** Below the deciding stop both kinds get the same free line (never an answer key); at or above it the true kind finishes the slide. */
export function judgeWall(s: WallSlideId, stop: Stop, answer: WallAnswer): WallVerdict {
  if (stop < wallDeciding(s))
    return answer === 'cant-tell'
      ? { result: 'free', line: 'lens.right-for-now' }
      : { result: 'free', line: 'lens.could-be' };
  if (answer === 'cant-tell') return { result: 'miss', line: 'lens.wall.can-tell-now' };
  const kind = wallKindOf(wallEvidenceAt(s, stop))!;
  if (answer === kind) return { result: 'right', line: `lens.wall.yes.${kind}` };
  return { result: 'miss', line: wallSeeLine(s) };
}

/** Level 8's drops: all the same even green at stops 1–2. */
export type GreenDropId = 'green-threads' | 'green-balls' | 'green-water';
export type GreenKind = 'living' | 'all-through';
export type GreenAnswer = GreenKind | 'cant-tell';

export interface GreenDrop {
  id: GreenDropId;
  answer: GreenKind;
  evidence: readonly (readonly Evidence[])[];
}

/** The level-8 drops (the definition's table). Tiny dots, or nothing, at stop 3 decide nothing: smaller things would show nothing there too. */
export const GREEN_DROPS: Record<GreenDropId, GreenDrop> = {
  'green-threads': { id: 'green-threads', answer: 'living', evidence: [[], [], ['boxes'], ['boxes']] },
  'green-balls': { id: 'green-balls', answer: 'living', evidence: [[], [], [], ['edge', 'inside']] },
  'green-water': { id: 'green-water', answer: 'all-through', evidence: [[], [], [], ['even']] },
};
export const GREEN_IDS = Object.keys(GREEN_DROPS) as GreenDropId[];

/** Living exactly when cells show (boxes, or an edge with parts inside); all through exactly when the colour is even with no edges. */
export const greenKindOf = (ev: readonly Evidence[]): GreenKind | null =>
  ev.includes('boxes') || looksAlive(ev) ? 'living' : ev.includes('even') ? 'all-through' : null;
export const greenEvidenceAt = (d: GreenDropId, stop: Stop): readonly Evidence[] =>
  GREEN_DROPS[d].evidence[stop - 1];
export const greenDeciding = (d: GreenDropId): Stop =>
  STOPS.find((stop) => greenKindOf(greenEvidenceAt(d, stop)) !== null) ?? 4;

export type GreenSeeLine = 'lens.green.see.threads' | 'lens.green.see.balls' | 'lens.green.see.even';
export const greenSeeLine = (d: GreenDropId): GreenSeeLine =>
  d === 'green-threads'
    ? 'lens.green.see.threads'
    : d === 'green-balls'
      ? 'lens.green.see.balls'
      : 'lens.green.see.even';

export type GreenVerdict =
  | { result: 'free'; line: 'lens.could-be' | 'lens.right-for-now' }
  | { result: 'right'; line: 'lens.green.yes.living' | 'lens.green.yes.through' }
  | { result: 'miss'; line: 'lens.green.can-tell-now' | GreenSeeLine };

export function judgeGreen(d: GreenDropId, stop: Stop, answer: GreenAnswer): GreenVerdict {
  if (stop < greenDeciding(d))
    return answer === 'cant-tell'
      ? { result: 'free', line: 'lens.right-for-now' }
      : { result: 'free', line: 'lens.could-be' };
  if (answer === 'cant-tell') return { result: 'miss', line: 'lens.green.can-tell-now' };
  const kind = greenKindOf(greenEvidenceAt(d, stop))!;
  if (answer === kind)
    return { result: 'right', line: kind === 'living' ? 'lens.green.yes.living' : 'lens.green.yes.through' };
  return { result: 'miss', line: greenSeeLine(d) };
}

/** Three slides (level 7) or drops (level 8), one of each in a seeded order. Authored: onion skin, cheek cells, leaf; green balls, green water, threads. */
export function wallRoundFor(rng: Rng, authored: boolean): WallSlideId[] {
  return authored ? ['onion-skin', 'cheek-cells', 'leaf'] : rng.shuffle([...WALL_IDS]);
}
export function greenRoundFor(rng: Rng, authored: boolean): GreenDropId[] {
  return authored ? ['green-balls', 'green-water', 'green-threads'] : rng.shuffle([...GREEN_IDS]);
}

/** Level 8: the threads and balls drift with the water as one, in art units, at most this far from the middle. */
export const GREEN_DRIFT = 18;
/** The drift's angular speed: at the largest lens its fastest is under `MAX_SPEED` screen units a second. */
export const GREEN_DRIFT_W = (MAX_SPEED * 0.8) / (GREEN_DRIFT * Math.SQRT2 * MAX_ART_SCALE);

/** Seeded looks for levels 7–8: an angle for the walls, a seed for cheek outlines, threads and balls, and the drift's phase. */
export interface Looks78 {
  wallAngle: number;
  seed: number;
  phase: number;
}
export const looks78For = (rng: Rng): Looks78 => ({
  wallAngle: rng.range(-0.5, 0.5),
  seed: rng.int(1, 9999),
  phase: rng.range(0, Math.PI * 2),
});

/** Where the drifting level-8 contents sit at time `t`, in art units. */
export const greenDriftAt = (phase: number, t: number) => ({
  x: GREEN_DRIFT * Math.sin(GREEN_DRIFT_W * t + phase),
  y: GREEN_DRIFT * Math.sin(GREEN_DRIFT_W * 0.8 * t + phase * 1.7),
});

// ----- level 9: slide files (name the slide) -----

/**
 * The samples a case folder can hold or name. Each row restates the built evidence of the sample it reuses (`CANDIDATES`,
 * `WALL_SLIDES`, `SORT_SAMPLES`), so one comparison serves every case. Nothing shows at stops 1–2 on any row.
 */
export type FileSampleId =
  'swimmer' | 'green-ball' | 'silt' | 'mud-speck' | 'bubble' | 'onion-skin' | 'cheek-cells' | 'sand-grain';

/** The samples a card can name (the sand grain is measured, never a card), and the ones a level-9 slide can be. */
export type FileCardId = Exclude<FileSampleId, 'sand-grain'>;
export type FileUnknownId = Exclude<FileCardId, 'mud-speck'>;

export interface FileSample {
  id: FileSampleId;
  /** Evidence at stops 1–4 (index 0 is stop 1). Colour and motion are drawn and are never evidence. */
  evidence: readonly (readonly Evidence[])[];
  motion: Motion;
}

/** The file samples (the definition's table, the built rows). */
export const FILE_SAMPLES: Record<FileSampleId, FileSample> = {
  swimmer: {
    id: 'swimmer',
    evidence: [[], [], ['edge', 'inside'], ['edge', 'inside', 'hairs']],
    motion: 'swims',
  },
  'green-ball': { id: 'green-ball', evidence: [[], [], [], ['edge', 'inside']], motion: 'still' },
  silt: { id: 'silt', evidence: [[], [], [], ['ragged']], motion: 'still' },
  'mud-speck': { id: 'mud-speck', evidence: [[], [], ['ragged'], ['ragged']], motion: 'drifts' },
  bubble: { id: 'bubble', evidence: [[], [], ['edge', 'empty'], ['edge', 'empty']], motion: 'drifts' },
  'onion-skin': { id: 'onion-skin', evidence: [[], [], ['wall'], ['wall', 'inside']], motion: 'still' },
  'cheek-cells': {
    id: 'cheek-cells',
    evidence: [[], [], ['soft-edge', 'inside'], ['soft-edge', 'inside']],
    motion: 'still',
  },
  'sand-grain': { id: 'sand-grain', evidence: [[], [], ['cracks'], ['cracks']], motion: 'still' },
};
export const FILE_SAMPLE_IDS = Object.keys(FILE_SAMPLES) as FileSampleId[];

export const fileEvidenceAt = (s: FileSampleId, stop: Stop): readonly Evidence[] =>
  FILE_SAMPLES[s].evidence[stop - 1];

export type FileCaseId = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6';

/** A case: an unknown slide and three field-guide cards, one of which is the unknown's own row. */
export interface FileCase {
  id: FileCaseId;
  unknown: FileUnknownId;
  candidates: readonly [FileCardId, FileCardId, FileCardId];
}

/** The level-9 cases (the definition's table, row for row). */
export const FILE_CASES: Record<FileCaseId, FileCase> = {
  N1: { id: 'N1', unknown: 'green-ball', candidates: ['green-ball', 'silt', 'bubble'] },
  N2: { id: 'N2', unknown: 'bubble', candidates: ['bubble', 'swimmer', 'mud-speck'] },
  N3: { id: 'N3', unknown: 'cheek-cells', candidates: ['cheek-cells', 'onion-skin', 'swimmer'] },
  N4: { id: 'N4', unknown: 'onion-skin', candidates: ['onion-skin', 'cheek-cells', 'mud-speck'] },
  N5: { id: 'N5', unknown: 'silt', candidates: ['silt', 'green-ball', 'swimmer'] },
  N6: { id: 'N6', unknown: 'swimmer', candidates: ['swimmer', 'bubble', 'green-ball'] },
};
export const FILE_CASE_IDS = Object.keys(FILE_CASES) as FileCaseId[];

/** The cards the view has not ruled out: those whose evidence at this stop equals the unknown's. Never grows as the stop rises. */
export function survivors(c: FileCase, stop: Stop): FileCardId[] {
  const seen = fileEvidenceAt(c.unknown, stop);
  return c.candidates.filter((id) => sameSet(fileEvidenceAt(id, stop), seen));
}

/** The lowest stop that leaves one card standing. */
export const closingStop = (c: FileCase): Stop => STOPS.find((s) => survivors(c, s).length === 1) ?? 4;

export type FileSeeLine =
  | 'lens.file.see.only-dot'
  | 'lens.look.inside'
  | 'lens.look.empty'
  | 'lens.look.ragged'
  | 'lens.wall.see.wall'
  | 'lens.wall.see.soft'
  | 'lens.see.cracks';

/** What the view of a sample shows at a stop (a ruled-out card, and Show a hint), never the verdict. */
export function fileSeeLine(s: FileSampleId, stop: Stop): FileSeeLine {
  const ev = fileEvidenceAt(s, stop);
  if (ev.includes('wall')) return 'lens.wall.see.wall';
  if (ev.includes('soft-edge')) return 'lens.wall.see.soft';
  if (ev.includes('empty')) return 'lens.look.empty';
  if (ev.includes('inside')) return 'lens.look.inside';
  if (ev.includes('ragged')) return 'lens.look.ragged';
  if (ev.includes('cracks')) return 'lens.see.cracks';
  return 'lens.file.see.only-dot';
}

export type FileAnswer = FileCardId | 'cant-tell';
export type FileVerdict =
  | { result: 'free'; line: 'lens.could-be' | 'lens.right-for-now' }
  | { result: 'right'; line: `lens.file.yes.${FileUnknownId}` }
  | { result: 'miss'; line: 'lens.file.can-tell-now' | FileSeeLine };

/**
 * A card the view has ruled out is a miss at any stop. While more than one card stands, naming any of them is free (the same line
 * for a true and a false guess, never an answer key) and can't tell yet is right for now. With one card standing, naming it closes
 * the file and can't tell yet is a miss.
 */
export function judgeCase(c: FileCase, stop: Stop, answer: FileAnswer): FileVerdict {
  const standing = survivors(c, stop);
  if (answer !== 'cant-tell' && !standing.includes(answer))
    return { result: 'miss', line: fileSeeLine(c.unknown, stop) };
  if (standing.length > 1)
    return answer === 'cant-tell'
      ? { result: 'free', line: 'lens.right-for-now' }
      : { result: 'free', line: 'lens.could-be' };
  if (answer === 'cant-tell') return { result: 'miss', line: 'lens.file.can-tell-now' };
  return { result: 'right', line: `lens.file.yes.${c.unknown}` };
}

/** A file in a round: its case, the seeded order of its three cards, and the unknown's path in the water. */
export interface SlideFile {
  case: FileCase;
  cards: FileCardId[];
  path: Swimmer;
}

/** How far a file's unknown sits from the middle of the view, in drop units. */
export const FILE_SPOT = 0.1;

/**
 * Three files: no unknown twice, and at least one that closes only at the closest stop. The authored round is the bubble, the silt,
 * then the cheek cells (N2, N5, N3). Seeded: the cases, their order, the order of the cards, and positions.
 */
export function fileRoundFor(rng: Rng, authored: boolean): SlideFile[] {
  let ids: FileCaseId[];
  if (authored) ids = ['N2', 'N5', 'N3'];
  else
    for (;;) {
      ids = rng.shuffle([...FILE_CASE_IDS]).slice(0, 3);
      if (ids.some((id) => closingStop(FILE_CASES[id]) === 4)) break;
    }
  return ids.map((id) => {
    const c = FILE_CASES[id];
    return { case: c, cards: rng.shuffle([...c.candidates]), path: makePath(rng, c.unknown, 0, FILE_SPOT) };
  });
}

// ----- level 10: slide files (measure it) -----

/** A swimmer's body length in art units at stop 3 (stop 4 draws it `STOP4_ZOOM` times as long), and the green ball's radius at stop 4. */
export const SWIMMER_ART_LEN = SWIMMER_LENGTH * ART_R;
export const GREEN_BALL_R = 44;

/** The things measured at level 10 (the cheek cell is left out: no source for its length was opened). */
export type MeasuredId = 'swimmer' | 'green-ball' | 'sand-grain';

export interface Measured {
  id: MeasuredId;
  /** The length the drawing stands for, in micrometres, and the sourced range it lies in. */
  microns: number;
  range: readonly [number, number];
  /** How long it is drawn at stops 1–4, in art units; 0 where it shows no evidence yet. The art draws from this row. */
  drawn: readonly [number, number, number, number];
}

/** The measured samples (the definition's table). The views are separate drawings, not one magnification, so each has its own bar. */
export const MEASURED: Record<MeasuredId, Measured> = {
  swimmer: {
    id: 'swimmer',
    microns: 200,
    range: [60, 300],
    drawn: [0, 0, SWIMMER_ART_LEN, SWIMMER_ART_LEN * STOP4_ZOOM],
  },
  'green-ball': { id: 'green-ball', microns: 10, range: [2, 12], drawn: [0, 0, 0, GREEN_BALL_R * 2] },
  'sand-grain': { id: 'sand-grain', microns: 300, range: [200, 630], drawn: [0, 0, 300, 660] },
};
export const MEASURED_IDS = Object.keys(MEASURED) as MeasuredId[];

/** The scale bar's values in micrometres (1 mm, 100 µm, 10 µm, 1 µm), and how long a bar may be drawn, in art units. */
export const BAR_VALUES = [1000, 100, 10, 1] as const;
export type BarValue = (typeof BAR_VALUES)[number];
export const BAR_MIN = 60;
export const BAR_MAX = 240;
/** The widest thing that shows both its ends in the view, in art units. */
export const FITS_WHOLE = ART_R * 2 * 0.9;

/** Art units to one micrometre in a view, or 0 where the sample shows nothing to measure yet. */
export const unitsPerMicron = (s: MeasuredId, stop: Stop): number =>
  MEASURED[s].drawn[stop - 1] / MEASURED[s].microns;

/** The bar a view shows: the largest value drawn between 60 and 240 art units long, from the stop where the sample first shows evidence. */
export function barAt(s: MeasuredId, stop: Stop): { value: BarValue; units: number } | null {
  const k = unitsPerMicron(s, stop);
  if (!k) return null;
  const value = BAR_VALUES.find((v) => v * k >= BAR_MIN && v * k <= BAR_MAX);
  return value ? { value, units: value * k } : null;
}

/** The lowest stop where the sample shows evidence and both its ends fit in the view. */
export const measuringStop = (s: MeasuredId): Stop =>
  STOPS.find((stop) => MEASURED[s].drawn[stop - 1] > 0 && MEASURED[s].drawn[stop - 1] <= FITS_WHOLE) ?? 4;

/** How many bars long the sample is in a view (the same count at every stop that shows a bar; a test). */
export const barsAlong = (s: MeasuredId, stop: Stop): number => {
  const bar = barAt(s, stop);
  return bar ? MEASURED[s].microns / bar.value : 0;
};

/** Which of the three length buttons is the right one. */
export type SizeSlot = 0 | 1 | 2;
export const SIZE_SLOTS: readonly SizeSlot[] = [0, 1, 2];

/** Three lengths ten times apart in rising order, in micrometres, with the true length at `slot`. */
export function sizeChoices(s: MeasuredId, slot: SizeSlot): [number, number, number] {
  const m = MEASURED[s].microns;
  const ladder = [m / 100, m / 10, m, m * 10, m * 100];
  return [ladder[2 - slot], ladder[3 - slot], ladder[4 - slot]];
}

/** A length as its button shows it: micrometres below a millimetre, millimetres from there up. */
export const lengthLabel = (microns: number): string =>
  microns >= 1000 ? `${microns / 1000} mm` : `${microns} µm`;

/** The voice line that says a length in full (`lens.file.len.200-um`; a tenth of a micrometre is `tenth-um`). */
export type LengthKey = `${number}-um` | `${number}-mm` | 'tenth-um';
export const lengthKey = (microns: number): LengthKey =>
  microns >= 1000 ? `${microns / 1000}-mm` : microns < 1 ? 'tenth-um' : `${microns}-um`;

export type SizeVerdict =
  | { result: 'free'; line: 'lens.file.need-ends' }
  | { result: 'right'; line: `lens.file.yes.size.${MeasuredId}` }
  | { result: 'miss'; line: `lens.file.see.bars.${BarValue}` };

/**
 * Below the measuring stop every length is free (both ends are not beside a bar yet). At or above it the true length closes the
 * file, and a wrong one is a miss whose line names the bar and never the answer.
 */
export function judgeSize(s: MeasuredId, slot: SizeSlot, stop: Stop, choice: SizeSlot): SizeVerdict {
  const bar = barAt(s, stop);
  if (stop < measuringStop(s) || !bar) return { result: 'free', line: 'lens.file.need-ends' };
  if (choice === slot) return { result: 'right', line: `lens.file.yes.size.${s}` };
  return { result: 'miss', line: `lens.file.see.bars.${bar.value}` };
}

/** A level-10 file: the thing to measure, which button holds its true length, and its path in the water. */
export interface MeasureFile {
  sample: MeasuredId;
  slot: SizeSlot;
  path: Swimmer;
}

/**
 * Three files, one of each measured sample. The authored round is the swimmer (20 µm, 200 µm, 2 mm), the green ball, then the sand
 * grain. Seeded: the order, where the true length sits among the three (never the same place on all three files), and positions.
 */
export function measureRoundFor(rng: Rng, authored: boolean): MeasureFile[] {
  const ids: MeasuredId[] = authored
    ? ['swimmer', 'green-ball', 'sand-grain']
    : rng.shuffle([...MEASURED_IDS]);
  let slots: SizeSlot[];
  do {
    slots = ids.map((_, i) => (authored && i === 0 ? 1 : rng.pick(SIZE_SLOTS)));
  } while (slots.every((k) => k === slots[0]));
  return ids.map((sample, i) => ({ sample, slot: slots[i], path: makePath(rng, sample, 0, FILE_SPOT) }));
}

// ----- help -----

/**
 * Level 1 at lap: what a touch anywhere does. Swollen, it shrinks and the next thing comes (her touch, not a timer,
 * moves on); while the lens is still moving it only gets a sound; otherwise it swells the lens.
 */
export type LapTouch = 'swell' | 'shrink' | 'sound';
export function lapLensTouch(s: { swollen: boolean; moving: boolean }): LapTouch {
  if (s.swollen) return 'shrink';
  return s.moving ? 'sound' : 'swell';
}

export type Help = { do: 'tap-lens' } | { do: 'glide'; to: number } | { do: 'turn'; stop: Stop };

/**
 * What Show a hint does: tap the lens (1), glide to the nearest thing not yet looked at (2), turn to the stop that decides (3 and 5–8)
 * or closes the file (9), the stop that shows both ends beside the bar (10), or the lowest that shows the asked thing (4).
 */
export function helpFor(
  level: number,
  s: {
    glass?: { x: number; y: number };
    things?: readonly { x: number; y: number }[];
    looked?: ReadonlySet<number>;
    question?: Question;
    pair?: PairId;
    sample?: SortSampleId;
    wall?: WallSlideId;
    green?: GreenDropId;
    file?: FileCase;
    measure?: MeasuredId;
  },
): Help | null {
  if (level === 1) return { do: 'tap-lens' };
  if (level === 10) return s.measure ? { do: 'turn', stop: measuringStop(s.measure) } : null;
  if (level === 9) return s.file ? { do: 'turn', stop: closingStop(s.file) } : null;
  if (level === 7) return s.wall ? { do: 'turn', stop: wallDeciding(s.wall) } : null;
  if (level === 8) return s.green ? { do: 'turn', stop: greenDeciding(s.green) } : null;
  if (level === 5) return s.pair ? { do: 'turn', stop: decidingStop(s.pair) } : null;
  if (level === 6) return s.sample ? { do: 'turn', stop: SORT_SAMPLES[s.sample].deciding } : null;
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
/** Level 9's three cards and can't tell yet where four full-size answers do not fit: four in the space of three (grown-up targets may be 64 or more). */
export const CARD_SIZE = 87;
export const MIN_GROWNUP = 64;
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
  /** Levels 3–10: the four stop buttons; levels 3–4: the answer button; levels 5–8 and 10: the three answers or trays; level 9: four. */
  stops: Rect[];
  answer: Rect | null;
  choices: Rect[];
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

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
export const ringBox = (c: Ring): Rect => ({ x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 });
/** A ring overlaps a rectangle (exactly, not by its box). */
export function ringHits(c: Ring, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return Math.hypot(nx - c.x, ny - c.y) < c.r;
}

/**
 * Where everything goes, or null rather than a button under 110, a lens under 360 (300 at level 1), a level-2 thing under 160 or a
 * level-9 card under 87.
 */
export function lensLayout(v: View, level: number): LensLayout | null {
  const wide = v.w >= v.h;
  const none = { stops: [], answer: null, choices: [], things: [], rest: null, table: null, paw: null };
  const ok = (l: LensLayout) => {
    const rects = [
      ...l.stops,
      ...(l.answer ? [l.answer] : []),
      ...l.choices,
      ...l.things.map(ringBox),
      ...(l.paw ? [ringBox(l.paw)] : []),
    ];
    if (!rects.every((r) => inside(r, v))) return null;
    if (rects.some((r) => corners(v).some((k) => overlaps(r, k)))) return null;
    if (rects.some((a, i) => rects.some((b, j) => i < j && overlaps(a, b)))) return null;
    if (level !== 2) {
      if (!inside(ringBox(l.lens), v) || corners(v).some((k) => ringHits(l.lens, k))) return null;
      if (rects.some((r) => ringHits(l.lens, r))) return null;
    }
    return l;
  };
  const maxR = ART_R * MAX_ART_SCALE;
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
  // Level 9 has four answers (three cards and can't tell yet): full-size where the row or column fits, otherwise four in the
  // space of three, which a grown-up's targets allow.
  const place = (size: number): LensLayout | null => {
    let stops: Rect[];
    let answer: Rect | null = null;
    let choices: Rect[] = [];
    let area: Rect;
    const three = level >= 5;
    const n = level === 9 ? 4 : 3;
    if (size < MIN_GROWNUP) return null;
    const each = Array.from({ length: n }, (_, i) => i);
    const row = n * size + (n - 1) * GAP;
    if (three && wide) {
      // Two columns at the right: the stops, and the three answers or trays beside them.
      const cx = v.w - M - ANSWER_SIZE / 2;
      const sx = cx - ANSWER_SIZE / 2 - GAP - STOP_SIZE;
      const stopsH = 4 * STOP_SIZE + 3 * GAP;
      stops = STOPS.map((_, i) => ({
        x: sx,
        y: (v.h - stopsH) / 2 + i * (STOP_SIZE + GAP),
        w: STOP_SIZE,
        h: STOP_SIZE,
      }));
      choices = each.map((i) => ({
        x: cx - size / 2,
        y: (v.h - row) / 2 + i * (size + GAP),
        w: size,
        h: size,
      }));
      area = { x: PET_CORNER.w + 10, y: M, w: sx - 2 * M - PET_CORNER.w - 10, h: v.h - 2 * M };
    } else if (three) {
      // The answers along the bottom edge right of the guide's corner, the stops above them.
      const ax = Math.max(PET_CORNER.w + 10, (v.w - row) / 2);
      const ay = v.h - M - size;
      choices = each.map((i) => ({ x: ax + i * (size + GAP), y: ay, w: size, h: size }));
      const stopsW = 4 * STOP_SIZE + 3 * GAP;
      const sx = Math.max(PET_CORNER.w + 10, (v.w - stopsW) / 2);
      const sy = ay - GAP - STOP_SIZE;
      stops = STOPS.map((_, i) => ({ x: sx + i * (STOP_SIZE + GAP), y: sy, w: STOP_SIZE, h: STOP_SIZE }));
      const top = HOME_CORNER.h + 10;
      area = { x: M, y: top, w: v.w - 2 * M, h: sy - M - top };
    } else if (wide) {
      const total = 4 * STOP_SIZE + 3 * GAP + 20 + ANSWER_SIZE;
      const top = (v.h - total) / 2;
      const cx = v.w - M - ANSWER_SIZE / 2;
      stops = STOPS.map((_, i) => ({
        x: cx - STOP_SIZE / 2,
        y: top + i * (STOP_SIZE + GAP),
        w: STOP_SIZE,
        h: STOP_SIZE,
      }));
      answer = { x: cx - ANSWER_SIZE / 2, y: top + total - ANSWER_SIZE, w: ANSWER_SIZE, h: ANSWER_SIZE };
      area = { x: PET_CORNER.w + 10, y: M, w: v.w - ANSWER_SIZE - 3 * M - PET_CORNER.w - 10, h: v.h - 2 * M };
    } else {
      const total = 4 * STOP_SIZE + 4 * GAP + ANSWER_SIZE;
      const x0 = (v.w - total) / 2;
      const bottom = v.h - PET_CORNER.h - 10;
      stops = STOPS.map((_, i) => ({
        x: x0 + i * (STOP_SIZE + GAP),
        y: bottom - STOP_SIZE - (ANSWER_SIZE - STOP_SIZE) / 2,
        w: STOP_SIZE,
        h: STOP_SIZE,
      }));
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
    const withPaw = ok({ ...none, lens, stops, answer, choices, paw });
    return withPaw ?? ok({ ...none, lens, stops, answer, choices });
  };
  if (level !== 9) return place(ANSWER_SIZE);
  return place(ANSWER_SIZE) ?? place(CARD_SIZE);
}

/** The glass stays on the table. */
export function clampGlass(p: { x: number; y: number }, table: Rect): { x: number; y: number } {
  return {
    x: Math.min(table.x + table.w - GLASS_R, Math.max(table.x + GLASS_R, p.x)),
    y: Math.min(table.y + table.h - GLASS_R, Math.max(table.y + GLASS_R, p.y)),
  };
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
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  name: string;
}
export const PLANS: readonly PlanInfo[] = [
  { level: 1, name: 'Look closer: tap the lens and each thing looks bigger' },
  { level: 2, name: 'Lens over: slide a hand lens over three things' },
  { level: 3, name: 'Anyone there? Turn the dial to find swimmers in a drop' },
  { level: 4, name: 'Just enough: set the dial to just the view asked for' },
  { level: 5, name: "Alive or can't tell yet: look closer, then say if the ringed speck is alive" },
  {
    level: 6,
    name: 'One cell or many: look closer, then sort each slide into one cell, many cells or not cells',
  },
  {
    level: 7,
    name: "Wall clue: look closer, then say plant cells, animal cells or can't tell yet; the wall is the clue, not the colour",
  },
  {
    level: 8,
    name: "Why green? Look closer, then say if the green is tiny living things, all through the water, or can't tell yet",
  },
  { level: 9, name: 'Name the slide: look closer, then tap the card the view leaves standing' },
  { level: 10, name: 'Measure it: look closer, then read its length from the scale bar' },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 8 },
  grownup: { min: 9, max: 10 },
};
export const planFor = (level: number): PlanInfo =>
  PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
