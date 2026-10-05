import type { Band } from './bands';

export interface RoundRecord {
  level: number;
  misses: number;
  hints: number;
  seconds: number;
  at: number;
}

export interface GameStats {
  plays: number;
  level: number;
  /** The most recent rounds, oldest first. */
  history: RoundRecord[];
}

export interface StickerRecord {
  game: string;
  seed: number;
  at: number;
}

/** Everything the app remembers, as one versioned record so a backup is a single file. */
export interface SaveData {
  version: 1;
  profile: { name: string; band: Band };
  settings: { volume: number; music: boolean; sessionMinutes: number; coplayHints: boolean };
  games: Record<string, GameStats>;
  stickers: StickerRecord[];
}

export const HISTORY_LENGTH = 10;
const BAND_IDS: Band[] = ['lap', 'toddler', 'preschool', 'prek'];

export function defaults(): SaveData {
  return {
    version: 1,
    profile: { name: '', band: 'lap' },
    settings: { volume: 0.8, music: true, sessionMinutes: 5, coplayHints: true },
    games: {},
    stickers: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

/** Accepts anything (old saves, hand-edited backups, garbage) and returns a valid save. */
export function migrate(raw: unknown): SaveData {
  const d = defaults();
  if (!isObj(raw)) return d;

  const profile = isObj(raw.profile) ? raw.profile : {};
  const band = BAND_IDS.find((b) => b === profile.band) ?? d.profile.band;
  const settings = isObj(raw.settings) ? raw.settings : {};

  const games: Record<string, GameStats> = {};
  if (isObj(raw.games)) {
    for (const [id, g] of Object.entries(raw.games)) {
      if (!isObj(g)) continue;
      const history = Array.isArray(g.history) ? g.history.filter(isObj) : [];
      games[id] = {
        plays: Math.max(0, Math.floor(num(g.plays, 0))),
        level: Math.max(1, Math.floor(num(g.level, 1))),
        history: history.slice(-HISTORY_LENGTH).map((r) => ({
          level: num(r.level, 1),
          misses: num(r.misses, 0),
          hints: num(r.hints, 0),
          seconds: num(r.seconds, 0),
          at: num(r.at, 0),
        })),
      };
    }
  }

  const stickers = Array.isArray(raw.stickers)
    ? raw.stickers
        .filter(isObj)
        .filter((s) => typeof s.game === 'string')
        .map((s) => ({ game: s.game as string, seed: num(s.seed, 1), at: num(s.at, 0) }))
    : [];

  return {
    version: 1,
    profile: { name: str(profile.name, d.profile.name).slice(0, 40), band },
    settings: {
      volume: Math.min(1, Math.max(0, num(settings.volume, d.settings.volume))),
      music: bool(settings.music, d.settings.music),
      sessionMinutes: Math.max(0, num(settings.sessionMinutes, d.settings.sessionMinutes)),
      coplayHints: bool(settings.coplayHints, d.settings.coplayHints),
    },
    games,
    stickers,
  };
}
