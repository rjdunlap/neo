import type { GameModule } from '../games/types';
import { playBand, type Band } from '../progress/bands';
import { DISCOVERY_IDS } from './discovery';

/**
 * Little surprises (Discovery D2b): one finite three-game mix on a lap or toddler home spot, held in memory only.
 * The pool and its order are D1b's; each stop is an ordinary round of its own game, so the mix awards and records nothing.
 */
export const MIX_IDS = DISCOVERY_IDS;
export const MIX_BANDS: readonly Band[] = ['lap', 'toddler'];

type Candidate = Pick<GameModule, 'id' | 'bands' | 'inputs'>;

/** A stop she can play at her own band by touch. */
export function mixPlayable(mod: Candidate | undefined, band: Band): boolean {
  return !!mod && (mod.inputs ?? ['touch']).includes('touch') && mod.bands.includes(band) && playBand(mod.bands, band) === band;
}

/** The whole mix, in order, or null: her own home spot at lap or toddler, and every stop playable. Never a partial mix. */
export function mixGames<T extends Candidate>(profileBand: Band, placeBand: Band, catalog: readonly T[], ids: readonly string[] = MIX_IDS): T[] | null {
  if (!MIX_BANDS.includes(profileBand) || placeBand !== profileBand) return null;
  const mods = ids.map(id => catalog.find(m => m.id === id));
  return mods.every(m => mixPlayable(m, profileBand)) ? mods as T[] : null;
}

export type ItemState = 'upcoming' | 'played' | 'skipped' | 'unavailable';
export interface MixItem { state: ItemState; /** The sticker seed of the position's first completed round. */ seed?: number }
export interface MixState {
  readonly items: readonly MixItem[];
  /** The position the current round plays, or null before the first launch. */
  readonly at: number | null;
  /** The current round token; only a finish carrying it settles an item. */
  readonly round: number;
}

export type MixEvent =
  | { type: 'launch'; p: number }
  | { type: 'finish'; round: number; seed: number }
  | { type: 'skip'; p: number }
  | { type: 'unavailable'; p: number };

export function startMix(count = MIX_IDS.length): MixState {
  return { items: Array.from({ length: count }, () => ({ state: 'upcoming' as const })), at: null, round: 0 };
}

const settle = (s: MixState, p: number, item: MixItem): MixState =>
  s.items[p]?.state === 'upcoming' ? { ...s, items: s.items.map((it, i) => i === p ? item : it) } : s;

/** Pure transitions. An item leaves `upcoming` exactly once; a played item is never skipped or played again. */
export function step(s: MixState, e: MixEvent): MixState {
  switch (e.type) {
    case 'launch':
      return e.p >= 0 && e.p < s.items.length ? { ...s, at: e.p, round: s.round + 1 } : s;
    case 'finish':
      return e.round === s.round && s.at !== null ? settle(s, s.at, { state: 'played', seed: e.seed }) : s;
    case 'skip':
      return settle(s, e.p, { state: 'skipped' });
    case 'unavailable':
      return settle(s, e.p, { state: 'unavailable' });
  }
}

/** The next upcoming position, or null when only the ending is left. */
export function nextUp(s: MixState): number | null {
  const i = s.items.findIndex(it => it.state === 'upcoming');
  return i < 0 ? null : i;
}

/** "That was Little surprises!" after any play; the quiet ending when every stop was hopped over. */
export function endingLine(s: MixState): 'mix.end' | 'mix.end.quiet' {
  return s.items.some(it => it.state === 'played') ? 'mix.end' : 'mix.end.quiet';
}
