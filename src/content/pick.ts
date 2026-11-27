import type { ChallengeKind, GameModule } from '../games/types';
import type { Rng } from '../engine/random';
import type { Band } from '../progress/bands';
import type { GameStats } from '../progress/save';
import { CHALLENGE_KINDS } from '../games/types';
import { LANDS, visibleIn, type LandId } from './lands';
import { mixPlayable } from './mix';

/**
 * Pick for me (Discovery D7a): one game chosen from a named pool, shown on its card, and Another without replacement.
 * Every function here is pure: it reads the save's hearts and history and writes nothing, so passing over a game
 * leaves no mark (docs/definitions/pick-for-me.md).
 */

/** The most games Played lately holds: a screenful on a phone. */
export const LATELY_COUNT = 6;

export type PickScope =
  | { kind: 'everything' }
  | { kind: 'hearts' }
  | { kind: 'lately' }
  | { kind: 'land'; id: LandId }
  | { kind: 'challenge'; challenge: ChallengeKind };

export type PickCandidate = Pick<GameModule, 'id' | 'bands' | 'inputs' | 'challenge'>;

export interface PickSource<T extends PickCandidate = GameModule> {
  band: Band;
  catalog: readonly T[];
  favorites: readonly string[];
  stats: Readonly<Record<string, Pick<GameStats, 'history'>>>;
}

export const scopeKey = (s: PickScope): string =>
  s.kind === 'land' ? `land:${s.id}` : s.kind === 'challenge' ? `challenge:${s.challenge}` : s.kind;

export const sameScope = (a: PickScope, b: PickScope) => scopeKey(a) === scopeKey(b);

/** The one rule every scope passes through: registered, playable by touch at her band, at that band itself. */
export const pickable = (mod: PickCandidate | undefined, band: Band): boolean => mixPlayable(mod, band);

const latest = (stats: PickSource['stats'], id: string) =>
  Math.max(0, ...(stats[id]?.history ?? []).map((r) => r.at));

/** A scope's eligible games, deduplicated, in the scope's own order (the pick shuffles them afterwards). */
export function scopePool<T extends PickCandidate>(scope: PickScope, src: PickSource<T>): string[] {
  const ok = (id: string) =>
    pickable(
      src.catalog.find((m) => m.id === id),
      src.band,
    );
  const unique = (ids: readonly string[]) => ids.filter((id, i) => ids.indexOf(id) === i && ok(id));
  switch (scope.kind) {
    case 'hearts':
      return unique(src.favorites);
    case 'lately': {
      const played = src.catalog.map((m) => m.id).filter((id) => latest(src.stats, id) > 0);
      played.sort((a, b) => latest(src.stats, b) - latest(src.stats, a));
      return unique(played).slice(0, LATELY_COUNT);
    }
    case 'land': {
      const land = LANDS.find((l) => l.id === scope.id);
      return land
        ? unique(visibleIn(land, src.band, src.catalog as unknown as GameModule[]).map((g) => g.id))
        : [];
    }
    case 'challenge':
      return unique(src.catalog.filter((m) => m.challenge === scope.challenge).map((m) => m.id));
    case 'everything':
      return unique(
        LANDS.flatMap((l) => visibleIn(l, src.band, src.catalog as unknown as GameModule[]).map((g) => g.id)),
      );
  }
}

/**
 * The scopes she can choose from: Everything for me always (when anything is playable), then hearts, played lately,
 * each land she can see in `LANDS` order, and each kind of challenge. A scope with no eligible game is not drawn.
 */
export function scopesFor<T extends PickCandidate>(src: PickSource<T>): PickScope[] {
  const all: PickScope[] = [
    { kind: 'everything' },
    { kind: 'hearts' },
    { kind: 'lately' },
    ...LANDS.map((l): PickScope => ({ kind: 'land', id: l.id })),
    ...CHALLENGE_KINDS.map((challenge): PickScope => ({ kind: 'challenge', challenge })),
  ];
  return all.filter((s) => scopePool(s, src).length > 0);
}

/** A uniform shuffle of `pool`; with two or more games it never opens on `avoid` (the game last shown or played). */
export function shuffledOrder(pool: readonly string[], rng: Rng, avoid?: string): string[] {
  const order = rng.shuffle([...pool]);
  if (order.length > 1 && order[0] === avoid) {
    const j = rng.int(1, order.length - 1);
    [order[0], order[j]] = [order[j], order[0]];
  }
  return order;
}

/** One held pick: the scope, its shuffled order and where she is in it. `at === order.length` is the end of the order. */
export interface PickState {
  scope: PickScope;
  order: readonly string[];
  at: number;
}

export function openPick(
  scope: PickScope,
  pool: readonly string[],
  rng: Rng,
  avoid?: string,
): PickState | null {
  return pool.length ? { scope, order: shuffledOrder(pool, rng, avoid), at: 0 } : null;
}

/** The game on show, or undefined at the end of the order. */
export const pickShown = (s: PickState): string | undefined => s.order[s.at];
export const pickAtEnd = (s: PickState): boolean => s.at >= s.order.length;
/** A pool of one game has no Another; otherwise Another is offered until the end line has been shown. */
export const canAnother = (s: PickState): boolean => s.order.length > 1 && !pickAtEnd(s);

/** Steps to the next game in the same order; past the last it reaches the end (`pick.all`). Never repeats before then. */
export function anotherPick(s: PickState): PickState {
  return canAnother(s) ? { ...s, at: s.at + 1 } : s;
}

/** Again from the start: a fresh order that never opens on the game last shown. */
export function againPick(s: PickState, pool: readonly string[], rng: Rng): PickState | null {
  return openPick(s.scope, pool, rng, s.order[s.order.length - 1]);
}
