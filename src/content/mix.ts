import type { GameModule } from '../games/types';
import { playBand, type Band } from '../progress/bands';
import { DISCOVERY_IDS } from './discovery';

/**
 * Little surprises (Discovery D2b): one finite mix on a lap or toddler home spot, held in memory only.
 * The default lineup and its order are D1b's; a grown-up may line up one to five stops of her own (D5a, Make my mix).
 * Each stop is an ordinary round of its own game, so the mix awards and records nothing.
 */
export const MIX_IDS = DISCOVERY_IDS;
export const MIX_BANDS: readonly Band[] = ['lap', 'toddler'];
/** The most stops a lineup holds: five 100-unit tiles still clear Skip on the portrait stop card. */
export const MIX_MAX = 5;

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

/** One stop of a live mix, checked at its launch: her own lap or toddler home spot, and that game playable there by touch. */
export function mixStop<T extends Candidate>(profileBand: Band, placeBand: Band, catalog: readonly T[], id: string | undefined): T | null {
  if (!MIX_BANDS.includes(profileBand) || placeBand !== profileBand) return null;
  const mod = catalog.find(m => m.id === id);
  return mod && mixPlayable(mod, profileBand) ? mod : null;
}

/** The games a lineup may hold: her home spot's own games, in its order, that she can play at her band by touch. */
export function mixPool(profileBand: Band, placeIds: readonly string[], catalog: readonly Candidate[]): string[] {
  if (!MIX_BANDS.includes(profileBand)) return [];
  return placeIds.filter((id, i) => placeIds.indexOf(id) === i && mixPlayable(catalog.find(m => m.id === id), profileBand));
}

/** Lineup edits (D5a): pure, never empty, never more than `MIX_MAX`; a repeated game is two entries. */
export const lineup = {
  add(ids: readonly string[], id: string): readonly string[] {
    return ids.length >= MIX_MAX ? ids : [...ids, id];
  },
  move(ids: readonly string[], from: number, to: number): readonly string[] {
    if (from < 0 || from >= ids.length) return ids;
    const out = ids.filter((_, i) => i !== from);
    out.splice(Math.max(0, Math.min(out.length, to)), 0, ids[from]);
    return out;
  },
  remove(ids: readonly string[], p: number): readonly string[] {
    return ids.length <= 1 || p < 0 || p >= ids.length ? ids : ids.filter((_, i) => i !== p);
  },
  reset(): readonly string[] {
    return [...MIX_IDS];
  },
};

/** A held lineup after the pool changed (a birthday, a game gone): what is still in the pool, in order, or the default. */
export function repairLineup(ids: readonly string[], pool: readonly string[]): readonly string[] {
  const kept = ids.filter(id => pool.includes(id)).slice(0, MIX_MAX);
  return kept.length ? kept : lineup.reset();
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

/** One upcoming item per lineup entry. */
export function startMix(ids: readonly string[] = MIX_IDS): MixState {
  return { items: ids.map(() => ({ state: 'upcoming' as const })), at: null, round: 0 };
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

export type MixReturn = { kind: 'stop'; p: number } | { kind: 'ending' } | { kind: 'sheet' };

/**
 * Where a Home inside a live mix goes (D3). With how-to cards on, the next-up stop's own card is the preview; with them off,
 * the sheet on the home spot is. Once nothing is upcoming, both go to the ending.
 */
export function mixReturn(s: MixState, cardsOn: boolean): MixReturn {
  const p = nextUp(s);
  if (p === null) return { kind: 'ending' };
  return cardsOn ? { kind: 'stop', p } : { kind: 'sheet' };
}
