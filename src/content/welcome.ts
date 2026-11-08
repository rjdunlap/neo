import {
  cleanPicture,
  cleanTune,
  type Creation,
  type StampPictureCreation,
  type TuneCreation,
} from './creations';
import { isSpecies, type SpeciesId } from '../creatures/species';
import type { Band } from '../progress/bands';
import type { LineId } from './voice-script';

/**
 * Welcome a New Friend (RW07, docs/rework/WELCOME-BUILD.md): the first project at the root, for preschool and pre-K.
 * Three steps in any order, each an ordinary round at the project's level, get the house ready for a newcomer. Slice 1
 * built `pretty` and `yummy`, slice 2 `song`; slice 3 the ending, which waits on all three and adopts the newcomer.
 */
export const WELCOME_STEPS = ['pretty', 'yummy', 'song'] as const;
export type WelcomeStep = (typeof WELCOME_STEPS)[number];
export type WelcomeBand = 'preschool' | 'prek';
export const WELCOME_BANDS: readonly WelcomeBand[] = ['preschool', 'prek'];

export interface WelcomeProject {
  /** Fixed by the first step launched; null before. */
  band: WelcomeBand | null;
  /** Completed steps, unique, in `WELCOME_STEPS` order. */
  steps: WelcomeStep[];
  /** Her actual picture and tune; a step with no result kept has none here. */
  results: { pretty?: StampPictureCreation; song?: TuneCreation };
  /** Who is coming, fixed with `band`. */
  newcomer: SpeciesId | null;
  /** The ending's last write happened (slice 3). */
  ended: boolean;
  /** What happened the last time each step was played (RW09, docs/rework/LEARNING-RECAP.md#the-saved-record). */
  evidence: Partial<Record<WelcomeStep, StepEvidence>>;
}

/** One step's record. Its class (independent, supported, …) is derived on read, never stored. */
export interface StepEvidence {
  /** True once a round of the step finished; false while it has only been opened. */
  finished: boolean;
  /** The last finished round's counts (0 while unfinished). */
  misses: number;
  hints: number;
  /** The level that round played: always the plan's level for the project's band. */
  level: number;
  /** Finished rounds of this step, 0–9. */
  rounds: number;
  /** When it was last opened or finished. */
  at: number;
}

export const MAX_STEP_ROUNDS = 9;
const MAX_COUNT = 99;

export const emptyWelcome = (): WelcomeProject => ({
  band: null,
  steps: [],
  results: {},
  newcomer: null,
  ended: false,
  evidence: {},
});

export interface WelcomeStepPlan {
  game: string;
  /** The level the step plays at, per band. */
  level: Record<WelcomeBand, number>;
  ask: Record<WelcomeBand, LineId>;
  done: Record<WelcomeBand, LineId>;
  /**
   * The one stated exception (decided 2026-10-23): a free-making level with no right answers may sit below the band's
   * range. A story round never moves the saved level, and free play scores no misses. A test allows only this.
   */
  freeBelowRange?: true;
}

/**
 * Each built step's game and level. Pet Kitchen 2 finishes only on four plates of one quarter, and 5 only on the
 * recipe's one berry and one apple doubled, so the page can picture what the round guaranteed (a test pins both).
 */
export const WELCOME_PLAN: Partial<Record<WelcomeStep, WelcomeStepPlan>> = {
  pretty: {
    game: 'stamp-studio',
    level: { preschool: 3, prek: 4 },
    ask: { preschool: 'welcome.ask.pretty', prek: 'welcome.ask.pretty' },
    done: { preschool: 'welcome.done.pretty', prek: 'welcome.done.pretty' },
  },
  yummy: {
    game: 'pet-kitchen',
    level: { preschool: 2, prek: 5 },
    ask: { preschool: 'welcome.ask.yummy', prek: 'welcome.ask.yummy-prek' },
    done: { preschool: 'welcome.done.yummy', prek: 'welcome.done.yummy-prek' },
  },
  // Song Maker 2, free on a 6-beat loop: the only level that keeps her tune (the copy levels in range keep none).
  song: {
    game: 'song-maker',
    level: { preschool: 2, prek: 2 },
    ask: { preschool: 'welcome.ask.song', prek: 'welcome.ask.song' },
    done: { preschool: 'welcome.done.song', prek: 'welcome.done.song' },
    freeBelowRange: true,
  },
};

/** The steps the page shows a card for, in order: the ones built so far. */
export const builtSteps = (): WelcomeStep[] => WELCOME_STEPS.filter((s) => WELCOME_PLAN[s]);

const isStep = (s: unknown): s is WelcomeStep => WELCOME_STEPS.some((w) => w === s);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Only a Stamp Studio picture is a `pretty` result: the board over the bed draws stamps. */
export function stampPicture(raw: unknown): StampPictureCreation | null {
  const p = cleanPicture(raw);
  return p && 'stamps' in p ? (p as StampPictureCreation) : null;
}

/** Accepts anything and returns a valid record (docs/rework/WELCOME-BUILD.md#the-saved-record). */
export function cleanWelcome(raw: unknown): WelcomeProject {
  if (!isObj(raw)) return emptyWelcome();
  const listed = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = WELCOME_STEPS.filter((s) => listed.some((r) => r === s));
  const results: WelcomeProject['results'] = {};
  const r = isObj(raw.results) ? raw.results : {};
  const pretty = steps.includes('pretty') ? stampPicture(r.pretty) : null;
  if (pretty) results.pretty = pretty;
  const song = steps.includes('song') ? cleanTune(r.song) : null;
  if (song) results.song = song;
  const band = WELCOME_BANDS.find((b) => b === raw.band) ?? null;
  return {
    band,
    steps,
    results,
    newcomer: isSpecies(raw.newcomer) ? raw.newcomer : null,
    ended: raw.ended === true && steps.length === WELCOME_STEPS.length,
    evidence: cleanEvidence(raw.evidence, band, steps),
  };
}

const whole = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;

/**
 * Unknown steps go; counts are clamped; a finished record needs its step done; a record at any level but the plan's for
 * the project's band goes (so none survives without a band).
 */
function cleanEvidence(
  raw: unknown,
  band: WelcomeBand | null,
  steps: readonly WelcomeStep[],
): WelcomeProject['evidence'] {
  const out: WelcomeProject['evidence'] = {};
  if (!isObj(raw) || !band) return out;
  for (const step of WELCOME_STEPS) {
    const r = raw[step];
    const plan = WELCOME_PLAN[step];
    if (!isObj(r) || !plan || r.level !== plan.level[band]) continue;
    const finished = r.finished === true;
    if (finished && !steps.includes(step)) continue;
    out[step] = {
      finished,
      misses: finished ? whole(r.misses, MAX_COUNT) : 0,
      hints: finished ? whole(r.hints, MAX_COUNT) : 0,
      level: plan.level[band],
      rounds: whole(r.rounds, MAX_STEP_ROUNDS),
      at: typeof r.at === 'number' && Number.isFinite(r.at) && r.at >= 0 ? r.at : 0,
    };
  }
  return out;
}

/** The adoption's `metAt` token: `meet` is idempotent on it, so the project adopts one friend however often it ends. */
export const WELCOME_MET_AT = 'project:welcome';

/** The friend the project adopted, if it has (it stays hers through a reset). */
export const welcomeFriend = <T extends { metAt?: string }>(owned: readonly T[]): T | null =>
  owned.find((o) => o.metAt === WELCOME_MET_AT) ?? null;

/**
 * The first of river and glider she does not own yet, or river when she owns both. Once the project has adopted, the
 * same species again: after a reset the ending finds the friend already adopted, and the page shows that friend.
 */
export function newcomerFor(owned: readonly { species: SpeciesId; metAt?: string }[]): SpeciesId {
  const adopted = welcomeFriend(owned);
  if (adopted) return adopted.species;
  return (['river', 'glider'] as const).find((s) => !owned.some((o) => o.species === s)) ?? 'river';
}

/** Every step is done: the page plays the ending instead of the cards. */
export const welcomeReady = (p: WelcomeProject) => WELCOME_STEPS.every((s) => p.steps.includes(s));

/** The project's band once a step was launched, otherwise the band her profile would launch it at (null outside the project's bands). */
export function welcomeBand(p: WelcomeProject, profile: Band): WelcomeBand | null {
  return p.band ?? WELCOME_BANDS.find((b) => b === profile) ?? null;
}

/** Home draws Continue while the project is open and is hers: a preschool or pre-K profile, or one that already began it. */
export const showsContinue = (p: WelcomeProject, profile: Band) =>
  !p.ended && welcomeBand(p, profile) !== null;

/** Launching a step fixes the project's band and newcomer the first time; later launches change nothing. */
export function beginWelcome(
  p: WelcomeProject,
  band: WelcomeBand,
  owned: readonly { species: SpeciesId; metAt?: string }[],
): boolean {
  if (p.band) return false;
  p.band = band;
  p.newcomer ??= newcomerFor(owned);
  return true;
}

/**
 * A finished round completes its step. A finished replay replaces the step's result; a picture that does not clean
 * (or is not stamps) keeps the result already there. Steps stay in order and unique. False for an unknown step.
 */
export function completeWelcome(p: WelcomeProject, step: WelcomeStep, made: Creation | null): boolean {
  if (!isStep(step) || p.ended) return false;
  p.steps = WELCOME_STEPS.filter((s) => s === step || p.steps.includes(s));
  if (step === 'pretty') {
    const picture = stampPicture(made);
    if (picture) p.results.pretty = picture;
  } else if (step === 'song') {
    const tune = made?.kind === 'tune' ? cleanTune(made) : null;
    if (tune) p.results.song = tune;
  }
  return true;
}

/**
 * A step was launched (after `beginWelcome` fixed the band): a step with no record gets an unfinished one. A finished
 * record is left alone, so an unfinished replay never downgrades it, and a step finished before records existed gets
 * none. Nothing after the ending. True when it wrote.
 */
export function openWelcomeStep(p: WelcomeProject, step: WelcomeStep, at: number): boolean {
  const plan = WELCOME_PLAN[step];
  if (!isStep(step) || !plan || p.ended || !p.band || p.evidence[step] || p.steps.includes(step))
    return false;
  p.evidence[step] = { finished: false, misses: 0, hints: 0, level: plan.level[p.band], rounds: 0, at };
  return true;
}

/** A finished round's counts, as `GameScene.finish` has them. */
export interface StepRound {
  misses: number;
  hints: number;
  level: number;
}

/**
 * A finished round of a step (with `completeWelcome`, in the same write): the last round's counts replace the earlier
 * ones and `rounds` counts up to 9. Nothing after the ending, without a band, or at a level the plan does not play.
 */
export function finishWelcomeStep(
  p: WelcomeProject,
  step: WelcomeStep,
  round: StepRound,
  at: number,
): boolean {
  const plan = WELCOME_PLAN[step];
  if (!isStep(step) || !plan || p.ended || !p.band || round.level !== plan.level[p.band]) return false;
  const rounds = Math.min((p.evidence[step]?.rounds ?? 0) + 1, MAX_STEP_ROUNDS);
  p.evidence[step] = {
    finished: true,
    misses: whole(round.misses, MAX_COUNT),
    hints: whole(round.hints, MAX_COUNT),
    level: round.level,
    rounds,
    at,
  };
  return true;
}

/** The step's done line: for the song, the hum line when no tune was kept (fewer than two notes stayed lit). */
export function welcomeDoneLine(p: WelcomeProject, step: WelcomeStep, band: WelcomeBand): LineId {
  if (step === 'song' && !p.results.song) return 'welcome.done.song-hum';
  return WELCOME_PLAN[step]!.done[band];
}

/** The first built step not done yet, or null when every built step is done. */
export const nextWelcomeStep = (p: WelcomeProject): WelcomeStep | null =>
  builtSteps().find((s) => !p.steps.includes(s)) ?? null;
