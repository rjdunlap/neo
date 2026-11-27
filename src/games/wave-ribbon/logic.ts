/**
 * Wave Ribbon's rules: one smooth pulse runs along a stretched ribbon at a fixed speed. A beaded ring on the ribbon rises and
 * settles right back where it was while the crest travels on to a flag; a taller pulse lifts the bead higher but reaches the
 * flag at the very same moment. An ideal one-way teaching model in closed form (no solver, no physics library), so a run is the
 * same in every browser. Level 1 watches a pulse, level 2 compares a small and a tall one and matches a pictured bead trace.
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
/** Pulse heights in board units: tall is more than two and a half times small. */
export const AMPLITUDES: Record<Preset, number> = { small: 28, medium: 48, tall: 72 };

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

export interface LevelPlan {
  level: number;
  name: string;
  /** The heights she can send, and the one she starts on. */
  presets: readonly Preset[];
  /** Level 2 compares trace cards after a deliberate Check; Done waits on a correct one. */
  check: boolean;
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'Watch the pulse', presets: ['medium'], check: false },
  { level: 2, name: 'Tall and small', presets: ['small', 'tall'], check: true },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 2 } };

export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const describeLevel = (level: number) => planFor(level).name;

/** The seeded part of a round: colours, and at level 2 the pulse she is asked about and the cards' order. Never the physics. */
export interface Round {
  ribbon: 'orange' | 'pink' | 'purple';
  bead: 'blue' | 'green' | 'teal';
  /** The pulse the badge pictures, so the matching card is the one for its height. */
  target: 'small' | 'tall';
  cards: CardId[];
}

export function makeRound(plan: LevelPlan, rng: Rng): Round {
  const ribbon = rng.pick(['orange', 'pink', 'purple'] as const);
  const bead = rng.pick(['blue', 'green', 'teal'] as const);
  const target = rng.pick(['small', 'tall'] as const);
  const cards = plan.check ? rng.shuffle([...CARDS]) : [...CARDS];
  return { ribbon, bead, target, cards };
}

/** What she has watched, per height: the bead at its highest, and the crest reaching the flag. Only ever set. */
export type Seen = Record<Preset, { peak: boolean; arrival: boolean }>;

export const emptySeen = (): Seen => ({
  small: { peak: false, arrival: false },
  medium: { peak: false, arrival: false },
  tall: { peak: false, arrival: false },
});

/** Notes what the ribbon showed at time `t` for a height: the peak once `T_PEAK` is shown, the arrival once `T_ARRIVE` is. */
export function noteTime(seen: Seen, preset: Preset, t: number) {
  if (t >= T_PEAK - 1e-9) seen[preset].peak = true;
  if (t >= T_ARRIVE - 1e-9) seen[preset].arrival = true;
}

export const watched = (seen: Seen, preset: Preset) => seen[preset].peak && seen[preset].arrival;

/** Done waits for the whole watch at level 1 (a medium pulse), and at level 2 for both heights watched and a correct Check. */
export function doneReady(plan: LevelPlan, seen: Seen, checked: boolean) {
  if (!plan.check) return watched(seen, 'medium');
  return checked && watched(seen, 'small') && watched(seen, 'tall');
}

/** The card that matches a requested height. */
export const rightCard = (target: 'small' | 'tall'): CardId => target;

export type CheckResult =
  { kind: 'need-both' } | { kind: 'pick-card' } | { kind: 'right' } | { kind: 'wrong'; card: CardId };

/** A Check: waits on both pulses watched and a card picked (neither is a miss); only a picked wrong card is. */
export function checkCard(plan: LevelPlan, seen: Seen, round: Round, picked: CardId | null): CheckResult {
  if (!plan.check) return { kind: 'right' };
  if (!watched(seen, 'small') || !watched(seen, 'tall')) return { kind: 'need-both' };
  if (!picked) return { kind: 'pick-card' };
  return picked === rightCard(round.target) ? { kind: 'right' } : { kind: 'wrong', card: picked };
}

/** After this many wrong Checks the matching card glows by itself (and counts as that card's one hint). */
export const GLOW_AFTER = 2;

/** Help's stable identity: what it showed. Each counts once a round, asked for or automatic. */
export type HelpId = 'send-pulse' | 'run-both' | 'pick-trace';

/** What Help shows next, or null when it only points at Check or Done. */
export function nextHelp(plan: LevelPlan, seen: Seen): HelpId | null {
  if (!plan.check) return watched(seen, 'medium') ? null : 'send-pulse';
  if (!watched(seen, 'small') || !watched(seen, 'tall')) return 'run-both';
  return 'pick-trace';
}

/** The height Help sends when she has not watched both: the one not yet watched, small first. */
export const unwatched = (seen: Seen): 'small' | 'tall' => (watched(seen, 'small') ? 'tall' : 'small');

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
  { preset: 'small' | 'tall' } | { send: true } | { card: CardId } | { check: true } | { done: true };

export function nextMove(
  plan: LevelPlan,
  seen: Seen,
  round: Round,
  picked: CardId | null,
  checked: boolean,
  current: Preset,
  running: boolean,
): Move | null {
  if (running) return null;
  if (doneReady(plan, seen, checked)) return { done: true };
  if (!plan.check) return { send: true };
  if (!watched(seen, 'small') || !watched(seen, 'tall')) {
    const want = unwatched(seen);
    return current === want ? { send: true } : { preset: want };
  }
  const right = rightCard(round.target);
  return picked === right ? { check: true } : { card: right };
}
