import { cleanPicture, cleanTune, type Creation, type StampPictureCreation, type TuneCreation } from './creations';
import { isSpecies, type SpeciesId } from '../creatures/species';
import type { Band } from '../progress/bands';
import type { LineId } from './voice-script';

/**
 * Welcome a New Friend (RW07, docs/rework/WELCOME-BUILD.md): the first project at the root, for preschool and pre-K.
 * Three steps in any order, each an ordinary round at the project's level, get the house ready for a newcomer. Slice 1
 * built `pretty` and `yummy`, slice 2 `song`; the ending (slice 3) waits on all three.
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
}

export const emptyWelcome = (): WelcomeProject => ({ band: null, steps: [], results: {}, newcomer: null, ended: false });

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
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

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
  return {
    band: WELCOME_BANDS.find((b) => b === raw.band) ?? null,
    steps,
    results,
    newcomer: isSpecies(raw.newcomer) ? raw.newcomer : null,
    ended: raw.ended === true && steps.length === WELCOME_STEPS.length,
  };
}

/** The first of river and glider she does not own yet, or river when she owns both. */
export function newcomerFor(owned: readonly { species: SpeciesId }[]): SpeciesId {
  return (['river', 'glider'] as const).find((s) => !owned.some((o) => o.species === s)) ?? 'river';
}

/** The project's band once a step was launched, otherwise the band her profile would launch it at (null outside the project's bands). */
export function welcomeBand(p: WelcomeProject, profile: Band): WelcomeBand | null {
  return p.band ?? WELCOME_BANDS.find((b) => b === profile) ?? null;
}

/** Home draws Continue while the project is open and is hers: a preschool or pre-K profile, or one that already began it. */
export const showsContinue = (p: WelcomeProject, profile: Band) => !p.ended && welcomeBand(p, profile) !== null;

/** Launching a step fixes the project's band and newcomer the first time; later launches change nothing. */
export function beginWelcome(p: WelcomeProject, band: WelcomeBand, owned: readonly { species: SpeciesId }[]): boolean {
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

/** The step's done line: for the song, the hum line when no tune was kept (fewer than two notes stayed lit). */
export function welcomeDoneLine(p: WelcomeProject, step: WelcomeStep, band: WelcomeBand): LineId {
  if (step === 'song' && !p.results.song) return 'welcome.done.song-hum';
  return WELCOME_PLAN[step]!.done[band];
}

/** The first built step not done yet, or null when every built step is done. */
export const nextWelcomeStep = (p: WelcomeProject): WelcomeStep | null => builtSteps().find((s) => !p.steps.includes(s)) ?? null;
