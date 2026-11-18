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
export const GROWNUP_FIRST = 4;
const ISLAND_GROWNUP_FIRST = 2;

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

/** Pick one game per kind before repeating kinds, preferring a land not yet taken. */
function dealSix(
  pool: readonly GameModule[],
  band: Band,
  upright: boolean,
  lastDealt?: ReadonlyMap<GameModule, number>,
): GameModule[] {
  const chosen: GameModule[] = [];
  const kinds = new Set<GameModule['challenge']>();
  const lands = new Set<string>();
  const take = (from: readonly GameModule[], count: number) => {
    const upTo = Math.min(chosen.length + count, DAILY_COUNT);
    const left = from.filter((m) => !chosen.includes(m));
    while (chosen.length < upTo && left.length) {
      // Draw from the oldest deals first. A game that has never had a day is older than any deal this week.
      const age = (m: GameModule) => lastDealt?.get(m) ?? -1;
      const oldest = Math.min(...left.map(age));
      const candidates = lastDealt ? left.filter((m) => age(m) === oldest) : left;
      const unusedKinds = candidates.filter((m) => !kinds.has(m.challenge));
      // During a weekly deal, keep the day's kinds and lands in mind even when the oldest games repeat one.
      if (!unusedKinds.length && !lastDealt) kinds.clear();
      if (candidates.every((m) => lands.has(m.region)) && !lastDealt) lands.clear();
      const options = unusedKinds.length ? unusedKinds : candidates;
      const next = options.find((m) => !lands.has(m.region)) ?? options[0];
      left.splice(left.indexOf(next), 1);
      chosen.push(next);
      kinds.add(next.challenge);
      lands.add(next.region);
    }
  };
  const grown = (m: GameModule) => m.bands.includes('grownup');
  const ready = upright ? pool.filter((m) => m.upright) : pool;
  if (lastDealt && band === 'grownup') {
    take(ready.filter(grown), GROWNUP_FIRST);
    take(pool.filter(grown), GROWNUP_FIRST - chosen.length);
    const schoolSlots = DAILY_COUNT - GROWNUP_FIRST;
    const beforeSchool = chosen.length;
    take(
      ready.filter((m) => !grown(m)),
      schoolSlots,
    );
    take(
      pool.filter((m) => !grown(m)),
      schoolSlots - (chosen.length - beforeSchool),
    );
  } else if (band === 'grownup') {
    take(ready.filter(grown), ISLAND_GROWNUP_FIRST);
  }
  take(ready, DAILY_COUNT);
  if (upright && !lastDealt && band === 'grownup')
    take(pool.filter(grown), ISLAND_GROWNUP_FIRST - chosen.length);
  take(pool, DAILY_COUNT);
  return chosen;
}

/** Rebuild the phone's deals from Monday through this day, using dates as calendar days even across clock changes. */
function weeklyDeal(day: string, band: Band, pool: GameModule[]): GameModule[] {
  const monday = new Date(`${day}T00:00:00Z`);
  const weekday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - weekday);
  const deck = new Rng(daySeed(monday.toISOString().slice(0, 10), band)).shuffle(pool);
  const lastDealt = new Map<GameModule, number>();
  for (let offset = 0; offset < weekday; offset++) {
    for (const mod of dealSix(deck, band, true, lastDealt)) lastDealt.set(mod, offset);
  }
  return dealSix(deck, band, true, lastDealt);
}

/**
 * The island deals from a daily shuffle. The phone deals from a weekly shuffle and prefers upright-ready games in both
 * orientations so a turn keeps the same cards. Pins and first launches affect levels only, and the daily origin turns
 * adaptation off when the round is saved.
 */
export function dailySix(
  day: string,
  band: Band,
  games: readonly GameModule[],
  pinned: (id: string) => number | null = () => null,
  upright = false,
  fresh: (id: string) => boolean = () => false,
  phone = false,
): DailyPick[] {
  const rng = new Rng(daySeed(day, band));
  const pool = dailyPool(band, games);
  const chosen = phone ? weeklyDeal(day, band, pool) : dealSix(rng.shuffle(pool), band, upright);
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
 * A grown-up card's level line, short enough to read at full size: the whole line when it `fits` (the caller measures the
 * drawn text), else its leading clauses (cut at a semicolon), else the first clause's leading words and an ellipsis.
 */
export function levelLine(text: string, fits: (line: string) => boolean): string {
  if (!text || fits(text)) return text;
  const clauses = text.split(/;\s*/);
  for (let n = clauses.length - 1; n >= 1; n--) {
    const line = clauses.slice(0, n).join('; ');
    if (fits(line)) return line;
  }
  const words = clauses[0].split(/\s+/);
  for (let n = words.length - 1; n > 1; n--) {
    const line = `${words
      .slice(0, n)
      .join(' ')
      .replace(/[\s,:·(–-]+$/, '')}…`;
    if (fits(line)) return line;
  }
  return `${words[0]}…`;
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
