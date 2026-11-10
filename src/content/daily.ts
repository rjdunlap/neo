import { Rng } from '../engine/random';
import { playsByTouch } from '../games/registry';
import type { GameModule } from '../games/types';
import { playBand, type Band } from '../progress/bands';
import { firstLevel, levelsInOrder } from '../progress/difficulty';
import type { GameStats, RoundRecord } from '../progress/save';

/**
 * Today's six (D10, docs/definitions/todays-six.md): six games chosen for the day from her band, each at a preset level from
 * that band's ladder, the same six all day for everyone at that band, a new six tomorrow. Reached from Home's button or
 * `?daily` at the root. Nothing is owed: there is no streak, no count across days and nothing missed; every game stays in
 * Explore as before.
 */
export const DAILY_COUNT = 6;
/** How many of a grown-up's six are games made for grown-ups (the rest are early-school games at their hardest). */
export const GROWNUP_FIRST = 2;

export interface DailyPick {
  mod: GameModule;
  /** The band the round plays at (`playBand`). */
  band: Band;
  /** The day's level from the band's own ladder, or a grown-up's pin for the game. */
  level: number;
}

/** The local calendar day, `YYYY-MM-DD`: the six change at her midnight, not UTC's. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** FNV-1a: a stable 32-bit seed from the day and band. */
export function daySeed(day: string, band: Band): number {
  let h = 0x811c9dc5;
  for (const ch of `${day}|${band}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Touch-playable and not opted out (`daily: false`): the games any band's six can come from. */
export const dailyEligible = (m: GameModule) => playsByTouch(m) && m.daily !== false;

/**
 * The games a band's six come from: eligible games that list the band itself (no younger top-up; every band has far more
 * than six). A grown-up gets the games made for grown-ups and for early school (played at their hardest levels).
 */
export function dailyPool(band: Band, games: readonly GameModule[]): GameModule[] {
  const ok = games.filter(dailyEligible);
  if (band === 'grownup') return ok.filter((m) => m.bands.includes('grownup') || m.bands.includes('school'));
  return ok.filter((m) => m.bands.includes(band));
}

/**
 * A game's ladder at `band` in play order, entry levels left out (easy rounds with high IDs, placed first for a younger band);
 * a band whose whole ladder is entry levels plays from those.
 */
export function presetLevels(mod: GameModule, band: Band): number[] {
  const entries = mod.entryLevels ?? [];
  const all = levelsInOrder(mod.levels(band));
  const order = all.filter((l) => !entries.includes(l));
  return order.length ? order : all;
}

/** The harder end of a game's ladder at `band`: the top third of `presetLevels`, a grown-up's day. */
export function hardLevels(mod: GameModule, band: Band): number[] {
  const order = presetLevels(mod, band);
  return order.slice(Math.floor((order.length * 2) / 3));
}

/**
 * The day's six: a seeded shuffle of the pool, taken so each kind of challenge (`challenge`) appears once before any appears
 * twice, preferring a subject (`region`) not yet taken, so a band with six kinds gets six different kinds and lands repeat only
 * when they must. Each pick gets a seeded level from its game's ladder at the band it plays (`presetLevels`; a grown-up's from
 * `hardLevels`), unless `pinned` names a grown-up's pin for that game inside the ladder, which wins. A preset level is the
 * day's choice, not her progress: the round records with `adapt` off (`dailyOrigin`).
 *
 * On a phone held upright (`upright`, chunk 31) the same pick runs over the upright-ready games first (`upright: true`), then
 * fills from the rest of the pool if fewer than six are ready; the seed is unchanged, so a sideways day is exactly as before.
 *
 * A game `fresh` names as new to her today (`newToday`, U5a) plays its band's first level (`firstLevel`, where an ordinary
 * first launch starts) instead of the preset, at every child's band; a pin still wins, and a grown-up's six ignore it. The
 * seed is untouched, so the games, their order and every other card's level are the same for everyone at a band on a day.
 */
export function dailySix(
  day: string,
  band: Band,
  games: readonly GameModule[],
  pinned: (id: string) => number | null = () => null,
  upright = false,
  fresh: (id: string) => boolean = () => false,
): DailyPick[] {
  const rng = new Rng(daySeed(day, band));
  const pool = rng.shuffle([...dailyPool(band, games)]);
  const chosen: GameModule[] = [];
  const kinds = new Set<GameModule['challenge']>();
  const lands = new Set<string>();
  const take = (from: readonly GameModule[], upTo: number) => {
    for (
      let left = from.filter((m) => !chosen.includes(m));
      chosen.length < upTo && left.length;
      left = left.filter((m) => !chosen.includes(m))
    ) {
      // Every kind (or every land) left has had a turn: start its round again.
      if (left.every((m) => kinds.has(m.challenge))) kinds.clear();
      if (left.every((m) => lands.has(m.region))) lands.clear();
      const fresh = left.filter((m) => !kinds.has(m.challenge));
      const next = fresh.find((m) => !lands.has(m.region)) ?? fresh[0];
      chosen.push(next);
      kinds.add(next.challenge);
      lands.add(next.region);
    }
  };
  // A grown-up's six lead with two of the games made for grown-ups, so the day is not all early-school play.
  const grown = (from: readonly GameModule[]) => from.filter((m) => m.bands.includes('grownup'));
  const ready = upright ? pool.filter((m) => m.upright) : pool;
  if (band === 'grownup') take(grown(ready), GROWNUP_FIRST);
  if (upright) {
    take(ready, DAILY_COUNT);
    // Too few ready grown-up games still leaves a grown-up two of theirs.
    if (band === 'grownup') take(grown(pool), GROWNUP_FIRST);
  }
  take(pool, DAILY_COUNT);
  return chosen.map((mod) => {
    const at = playBand(mod.bands, band);
    // The preset is drawn for every pick, pinned or not, so one pin never reshuffles the other cards' levels.
    const preset = rng.pick(band === 'grownup' ? hardLevels(mod, at) : presetLevels(mod, at));
    const pin = pinned(mod.id);
    const range = mod.levels(at);
    const start = band !== 'grownup' && fresh(mod.id) ? firstLevel(range, mod.entryLevels) : preset;
    return {
      mod,
      band: at,
      level: pin !== null && levelsInOrder(range).includes(pin) ? pin : start,
    };
  });
}

/** Where on its ladder a pick's level sits, for the card's dot row: `at` of `of` dots, easiest first. */
export function levelDots(pick: DailyPick): { at: number; of: number } {
  const order = levelsInOrder(pick.mod.levels(pick.band));
  return { at: Math.max(0, order.indexOf(pick.level)) + 1, of: order.length };
}

/**
 * The game is new to her today: she had finished no round of it before `day`. History keeps only the last rounds, so the
 * count of every round ever finished (`plays`) settles it: new when no stats, or when every counted round was today's. A
 * round finished today does not end newness until tomorrow, so a card never changes level during the day.
 */
export function newToday(stats: Pick<GameStats, 'plays' | 'history'> | undefined, day: string): boolean {
  if (!stats) return true;
  return stats.plays === stats.history.filter((r) => dayKey(new Date(r.at)) === day).length;
}

/** She finished a round of this game on `day` (a round's record carries its time): the card shows a tick. */
export const playedOn = (history: readonly RoundRecord[] | undefined, day: string) =>
  !!history?.some((r) => dayKey(new Date(r.at)) === day);

/**
 * The next of the day's six to play after `after` (a game ID, or null from the page): the first not yet played today, in
 * card order, starting from the card after it and wrapping. Null when every other card is played: the day's set is done.
 */
export function nextOfSix(
  picks: readonly DailyPick[],
  after: string | null,
  played: (id: string) => boolean,
): DailyPick | null {
  const at = picks.findIndex((p) => p.mod.id === after);
  for (let i = 1; i <= picks.length; i++) {
    const p = picks[(at + i + picks.length) % picks.length];
    if (p.mod.id !== after && !played(p.mod.id)) return p;
  }
  return null;
}
