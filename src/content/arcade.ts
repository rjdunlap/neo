import type { GameModule } from '../games/types';
import { playsByTouch } from '../games/registry';
import type { Band } from '../progress/bands';
import type { GameStats } from '../progress/save';
import { ageOf, allGames } from './explore';
import type { Land } from './lands';
import type { LineId } from './voice-script';
import { SUBJECTS, type RegionId } from './world';

/**
 * The Arcade's lists (docs/rework/ARCADE.md): every game in one grid, filtered by a topic, with tags derived from the
 * registry. Built fresh each time from the games and lands, never from a copied list. Nothing here gates: the other ages'
 * games are listed after hers and only tagged as such.
 */

/** What the Topics sheet offers: every game, the ones she has played (last played first), or one subject. */
export type ArcadeFilter = 'all' | 'played' | RegionId;

/** A subject's one-word tag, from its spoken line (`subject.music` → Music). */
const TOPIC_WORDS: Record<string, string> = {
  senses: 'Senses', music: 'Music', art: 'Art', animals: 'Animals', numbers: 'Numbers',
  everyday: 'Everyday', shapes: 'Shapes', puzzles: 'Puzzles', stories: 'Stories', science: 'Science',
};

export function topicWord(region: RegionId): string {
  const s = SUBJECTS.find((x) => x.id === region);
  return s ? TOPIC_WORDS[s.line.slice('subject.'.length)] ?? s.name : region;
}

/** The filters in the order the Topics sheet shows them: All, Played before, then each subject that has a game. */
export function arcadeFilters(games: readonly GameModule[]): ArcadeFilter[] {
  return ['all', 'played', ...SUBJECTS.filter((s) => games.some((g) => g.region === s.id)).map((s) => s.id)];
}

export const isArcadeFilter = (v: unknown, games: readonly GameModule[]): v is ArcadeFilter => arcadeFilters(games).includes(v as ArcadeFilter);

/** A filter's name on its tile and on the Topics button. */
export function filterName(f: ArcadeFilter): string {
  return f === 'all' ? 'All games' : f === 'played' ? 'Played before' : topicWord(f);
}

/** What a filter's tile says when it is chosen. */
export function filterLine(f: ArcadeFilter): LineId {
  return f === 'all' ? 'explore.all' : f === 'played' ? 'arcade.played' : SUBJECTS.find((s) => s.id === f)!.line;
}

/** When she last finished a round of a game, or 0. */
export function lastPlayed(stats: GameStats | undefined): number {
  return stats?.history.reduce((t, r) => Math.max(t, r.at), 0) ?? 0;
}

/**
 * The games a filter shows, in order. All games and a subject: hers (and younger ones) land by land, then the other ages'.
 * Played before: every game with a finished round, the most recent first.
 */
export function arcadeList(
  filter: ArcadeFilter,
  band: Band,
  games: readonly GameModule[],
  lands: readonly Land[],
  stats: Readonly<Record<string, GameStats | undefined>>,
): GameModule[] {
  const ordered = [...allGames(band, games, lands), ...allGames(band, games, lands, true)];
  if (filter === 'played') {
    return ordered
      .map((g) => ({ g, at: lastPlayed(stats[g.id]) }))
      .filter((x) => x.at > 0)
      .sort((a, b) => b.at - a.at)
      .map((x) => x.g);
  }
  return filter === 'all' ? ordered : ordered.filter((g) => g.region === filter);
}

/** A card's tags: its subject, who it is for when that is not her, and Pads for a game played only with a controller. */
export function tagsFor(mod: GameModule, band: Band): string[] {
  const tags = [topicWord(mod.region)];
  const age = ageOf(mod, band);
  if (age === 'bigger') tags.push('Bigger kids');
  else if (age === 'little') tags.push('Little ones');
  if (!playsByTouch(mod)) tags.push('Pads');
  return tags;
}

/** The cards on one page of a list, and how many pages it takes (at least one: an empty page says so). */
export const arcadePages = (n: number, perPage: number) => Math.max(1, Math.ceil(n / perPage));
export const clampArcadePage = (page: number, n: number, perPage: number) => Math.min(Math.max(0, Math.floor(page) || 0), arcadePages(n, perPage) - 1);
export function arcadePage<T>(items: readonly T[], page: number, perPage: number): T[] {
  const p = clampArcadePage(page, items.length, perPage);
  return items.slice(p * perPage, (p + 1) * perPage);
}

/** Where she was in the Arcade this visit: the filter and the spotlit game, kept so Back from a game lands where she was. */
export interface ArcadeMemory {
  filter: ArcadeFilter;
  spotlight: string | null;
}

export const arcadeMemory: ArcadeMemory = { filter: 'all', spotlight: null };

export function forgetArcade() {
  arcadeMemory.filter = 'all';
  arcadeMemory.spotlight = null;
}
