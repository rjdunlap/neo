/**
 * Wave Ribbon's rules: one smooth pulse runs along a stretched ribbon at a fixed speed. A beaded ring on the ribbon rises and
 * settles right back where it was while the crest travels on to a flag; a taller pulse lifts the bead higher but reaches the
 * flag at the very same moment. An ideal one-way teaching model in closed form (no solver, no physics library), so a run is the
 * same in every browser. Level 1 watches a pulse, level 2 compares a small and a tall one and matches a pictured bead trace, and
 * level 3 compares two lanes side by side to check whether a taller pulse arrives sooner or at the same mark.
 * Definition: docs/definitions/wave-ribbon.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** The ribbon runs from the driver at 0 to a tie-post at `L_RIBBON`; the bead stays at `X_MARKER`, the pennant at `X_FLAG`. */
export const L_RIBBON = 560;
export const X_MARKER = 240;
export const X_FLAG = 480;
/** Board units per second, the same for every pulse, and how long one pulse lasts (so it is `V_WAVE * W_PULSE` wide). */
export const V_WAVE = 240;
export const W_PULSE = 1;
/** The ruler: `STEP_COUNT` frames of `DT_STEP` seconds, the whole run `T_RUN`. */
export const DT_STEP = 0.25;
export const STEP_COUNT = 12;
export const T_RUN = STEP_COUNT * DT_STEP;
/** The crest reaches the bead at `T_PEAK` and the flag at `T_ARRIVE`; the frames that show them. */
export const T_PEAK = X_MARKER / V_WAVE + W_PULSE / 2;
export const T_ARRIVE = X_FLAG / V_WAVE + W_PULSE / 2;
export const PEAK_STEP = Math.round(T_PEAK / DT_STEP);
export const ARRIVAL_STEP = Math.round(T_ARRIVE / DT_STEP);

export type Preset = 'small' | 'medium' | 'tall';
export type PulseSize = 'small' | 'tall';
/** Pulse heights in board units: tall is more than two and a half times small. */
export const AMPLITUDES: Record<Preset, number> = { small: 28, medium: 48, tall: 72 };
/** Every pulse arrives at the pennant at the same time regardless of height. */
export const arrivalTime = (_amp?: number | Preset) => T_ARRIVE;
/** Level 3 requires two different pulse heights to test whether height changes arrival time. */
export const isInformativePair = (a: PulseSize, b: PulseSize) => a !== b;

/** A smooth finite hump (a raised cosine) of width `W_PULSE`: 0 before, 0 after, 1 at its middle. */
export const hump = (u: number) =>
  u >= 0 && u <= W_PULSE ? 0.5 * (1 - Math.cos((2 * Math.PI * u) / W_PULSE)) : 0;

/** How far the ribbon is lifted at `x` at time `t` for a pulse of height `amp`. */
export const displacementAt = (x: number, t: number, amp: number) => amp * hump(t - x / V_WAVE);

/** Where the crest is along the ribbon at `t` (it enters at `W_PULSE / 2`). */
export const crestX = (t: number) => V_WAVE * (t - W_PULSE / 2);

/** The bead never leaves its post: only its height changes. */
export const markerState = (t: number, amp: number) => ({
  x: X_MARKER,
  dy: displacementAt(X_MARKER, t, amp),
});

/** `samples + 1` points `(x, dy)` along the ribbon, left to right. */
export function sampleRibbon(t: number, amp: number, samples = 56): { x: number; dy: number }[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const x = (i / samples) * L_RIBBON;
    return { x, dy: displacementAt(x, t, amp) };
  });
}

/** The bead's height at each of the ruler's frames `0..STEP_COUNT`: what a trace card pictures. */
export const markerTrace = (amp: number): number[] =>
  Array.from({ length: STEP_COUNT + 1 }, (_, k) => markerState(k * DT_STEP, amp).dy);

/** The frame a time falls in (never past the last). */
export const frameAt = (t: number) => Math.max(0, Math.min(STEP_COUNT, Math.floor(t / DT_STEP + 1e-9)));

export type CardId = 'small' | 'tall' | 'sideways';
export const CARDS: readonly CardId[] = ['small', 'tall', 'sideways'];
export type ClaimId = 'same-time' | 'tall-sooner';
export const CLAIMS: readonly ClaimId[] = ['same-time', 'tall-sooner'];

export interface LevelPlan {
  level: number;
  name: string;
  /** The heights she can send, and the one she starts on. */
  presets: readonly Preset[];
  /** Levels 2–3 compare picture cards after a deliberate Check; Done waits on a correct one. */
  check: boolean;
  /** Level 3 runs two stacked lanes side by side against a shared time ruler. */
  twoLane: boolean;
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'Watch the pulse', presets: ['medium'], check: false, twoLane: false },
  { level: 2, name: 'Tall and small', presets: ['small', 'tall'], check: true, twoLane: false },
  { level: 3, name: 'Same speed, bigger wave', presets: ['small', 'tall'], check: true, twoLane: true },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 3 }, grownup: { min: 3, max: 3 } };

export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const describeLevel = (level: number) => planFor(level).name;

export type RibbonColor = 'orange' | 'pink' | 'purple';
export type BeadColor = 'blue' | 'green' | 'teal';

/** The seeded part of a round: colours, and at levels 2–3 the asked pulse and the cards' order. Never the physics. */
export interface Round {
  ribbon: RibbonColor;
  ribbonB: RibbonColor;
  bead: BeadColor;
  beadB: BeadColor;
  /** The pulse the badge pictures, so the matching card is the one for its height. */
  target: PulseSize;
  cards: CardId[];
  claims: ClaimId[];
}

export function makeRound(plan: LevelPlan, rng: Rng): Round {
  const ribbon = rng.pick(['orange', 'pink', 'purple'] as const);
  const ribbonB = rng.pick((['orange', 'pink', 'purple'] as const).filter((c) => c !== ribbon));
  const bead = rng.pick(['blue', 'green', 'teal'] as const);
  const beadB = rng.pick((['blue', 'green', 'teal'] as const).filter((c) => c !== bead));
  const target = rng.pick(['small', 'tall'] as const);
  const cards = plan.check && !plan.twoLane ? rng.shuffle([...CARDS]) : [...CARDS];
  const claims = plan.twoLane ? rng.shuffle([...CLAIMS]) : [...CLAIMS];
  return { ribbon, ribbonB, bead, beadB, target, cards, claims };
}

/** What she has watched, per height (or contrasting pair at level 3): peak and flag arrival. Only ever set. */
export type SeenKey = Preset | 'contrast';
export type Seen = Record<SeenKey, { peak: boolean; arrival: boolean }>;

export const emptySeen = (): Seen => ({
  small: { peak: false, arrival: false },
  medium: { peak: false, arrival: false },
  tall: { peak: false, arrival: false },
  contrast: { peak: false, arrival: false },
});

/** Notes what the ribbon showed at time `t` for a height or contrasting pair: peak at `T_PEAK`, arrival at `T_ARRIVE`. */
export function noteTime(seen: Seen, key: SeenKey, t: number) {
  if (t >= T_PEAK - 1e-9) seen[key].peak = true;
  if (t >= T_ARRIVE - 1e-9) seen[key].arrival = true;
}

export const watched = (seen: Seen, key: SeenKey) => seen[key].peak && seen[key].arrival;

/** Done waits for the watch at level 1, both heights + Check at level 2, and a contrasting run + Check at level 3. */
export function doneReady(plan: LevelPlan, seen: Seen, checked: boolean) {
  if (!plan.check) return watched(seen, 'medium');
  if (plan.twoLane) return checked && watched(seen, 'contrast');
  return checked && watched(seen, 'small') && watched(seen, 'tall');
}

/** The card that matches a requested height. */
export const rightCard = (target: PulseSize): CardId => target;

export type CheckResult =
  { kind: 'need-both' } | { kind: 'pick-card' } | { kind: 'right' } | { kind: 'wrong'; card: CardId };

export type ClaimCheckResult =
  { kind: 'need-both' } | { kind: 'pick-card' } | { kind: 'right' } | { kind: 'wrong'; card: ClaimId };

/** A Check at level 2: waits on both pulses watched and a card picked (neither is a miss); only a wrong card is. */
export function checkCard(plan: LevelPlan, seen: Seen, round: Round, picked: CardId | null): CheckResult {
  if (!plan.check || plan.twoLane) return { kind: 'right' };
  if (!watched(seen, 'small') || !watched(seen, 'tall')) return { kind: 'need-both' };
  if (!picked) return { kind: 'pick-card' };
  return picked === rightCard(round.target) ? { kind: 'right' } : { kind: 'wrong', card: picked };
}

/** A Check at level 3: waits on a contrasting pair watched and a hypothesis picked; only `tall-sooner` is a miss. */
export function checkClaim(plan: LevelPlan, seen: Seen, picked: ClaimId | null): ClaimCheckResult {
  if (!plan.twoLane) return { kind: 'right' };
  if (!watched(seen, 'contrast')) return { kind: 'need-both' };
  if (!picked) return { kind: 'pick-card' };
  return picked === 'same-time' ? { kind: 'right' } : { kind: 'wrong', card: picked };
}

/** After this many wrong Checks the matching card glows by itself (and counts as that card's one hint). */
export const GLOW_AFTER = 2;

/** Help's stable identity: what it showed. Each counts once a round, asked for or automatic. */
export type HelpId = 'send-pulse' | 'run-both' | 'pick-trace' | 'run-contrast' | 'pick-claim';

/** What Help shows next, or null when it only points at Check or Done. */
export function nextHelp(plan: LevelPlan, seen: Seen): HelpId | null {
  if (!plan.check) return watched(seen, 'medium') ? null : 'send-pulse';
  if (plan.twoLane) return watched(seen, 'contrast') ? 'pick-claim' : 'run-contrast';
  if (!watched(seen, 'small') || !watched(seen, 'tall')) return 'run-both';
  return 'pick-trace';
}

/** The height Help sends when she has not watched both: the one not yet watched, small first. */
export const unwatched = (seen: Seen): PulseSize => (watched(seen, 'small') ? 'tall' : 'small');

export class HelpTally {
  private readonly given = new Set<HelpId>();
  get count() {
    return this.given.size;
  }
  give(id: HelpId) {
    this.given.add(id);
  }
  has(id: HelpId) {
    return this.given.has(id);
  }
}

/** What a capable player does next, for the ghost finger. */
export type Move =
  | { preset: PulseSize }
  | { lane: 'A' | 'B' }
  | { send: true }
  | { card: CardId }
  | { claim: ClaimId }
  | { check: true }
  | { done: true };

export function nextMove(
  plan: LevelPlan,
  seen: Seen,
  round: Round,
  picked: CardId | null,
  checked: boolean,
  current: Preset,
  running: boolean,
  laneA: PulseSize = 'small',
  laneB: PulseSize = 'small',
  pickedClaim: ClaimId | null = null,
): Move | null {
  if (running) return null;
  if (doneReady(plan, seen, checked)) return { done: true };
  if (!plan.check) return { send: true };
  if (plan.twoLane) {
    if (!watched(seen, 'contrast')) return isInformativePair(laneA, laneB) ? { send: true } : { lane: 'B' };
    return pickedClaim === 'same-time' ? { check: true } : { claim: 'same-time' };
  }
  if (!watched(seen, 'small') || !watched(seen, 'tall')) {
    const want = unwatched(seen);
    return current === want ? { send: true } : { preset: want };
  }
  const right = rightCard(round.target);
  return picked === right ? { check: true } : { card: right };
}
