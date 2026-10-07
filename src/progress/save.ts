import type { Band } from './bands';
import { PET_COLORS, PICNIC_STEPS, STICKER_PAGES, type PetColor, type PicnicStep, type StickerPage } from '../content/world';

export interface StickerPlacement {
  page: StickerPage;
  x: number;
  y: number;
}

export interface RoundRecord {
  level: number;
  misses: number;
  hints: number;
  seconds: number;
  at: number;
}

export interface GameStats {
  plays: number;
  /** Where adaptive difficulty has her now. */
  level: number;
  /** A level a grown-up chose to stay on, or null for automatic. */
  pinned: number | null;
  /** The most recent rounds, oldest first. */
  history: RoundRecord[];
}

export interface StickerRecord {
  game: string;
  seed: number;
  at: number;
  placement?: StickerPlacement;
}

/** One island story: which requests are done in this telling, and whether its keepsake was earned. */
export interface StoryProgress {
  steps: PicnicStep[];
  /** This telling's ending has been shown. */
  ended: boolean;
  /** The story's one known keepsake (the picnic photo). Telling the story again never takes it away or adds another. */
  keepsake: boolean;
}

/** Everything the app remembers, as one versioned record so a backup is a single file. */
export interface SaveData {
  version: 2;
  profile: { name: string; band: Band };
  pet: { name: string; color: PetColor; hatched: boolean };
  /** Highest band celebrated on the map; null before the first visit. */
  world: { band: Band | null };
  settings: { placeLayout: 'path' | 'subjects'; volume: number; music: boolean; sessionMinutes: number; coplayHints: boolean };
  games: Record<string, GameStats>;
  stickers: StickerRecord[];
  stories: { picnic: StoryProgress };
}

export const HISTORY_LENGTH = 10;
const BAND_IDS: Band[] = ['lap', 'toddler', 'preschool', 'prek', 'school'];

export function defaults(): SaveData {
  return {
    version: 2,
    profile: { name: '', band: 'lap' },
    pet: { name: 'Pip', color: 'teal', hatched: false },
    world: { band: null },
    settings: { placeLayout: 'path', volume: 0.8, music: true, sessionMinutes: 5, coplayHints: true },
    games: {},
    stickers: [],
    stories: { picnic: { steps: [], ended: false, keepsake: false } },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

function placement(raw: unknown): StickerPlacement | undefined {
  if (!isObj(raw)) return;
  const page = STICKER_PAGES.find((p) => p === raw.page);
  if (!page || typeof raw.x !== 'number' || !Number.isFinite(raw.x) || typeof raw.y !== 'number' || !Number.isFinite(raw.y)) return;
  return { page, x: Math.max(0, Math.min(1, raw.x)), y: Math.max(0, Math.min(1, raw.y)) };
}

function story(raw: unknown): StoryProgress {
  const r = isObj(raw) ? raw : {};
  const steps = PICNIC_STEPS.filter((id) => Array.isArray(r.steps) && r.steps.includes(id));
  // A telling can only have ended once every step is done; an ending always left its keepsake.
  const ended = bool(r.ended, false) && steps.length === PICNIC_STEPS.length;
  return { steps, ended, keepsake: bool(r.keepsake, false) || ended };
}

/** Accepts anything (old saves, hand-edited backups, garbage) and returns a valid save. */
export function migrate(raw: unknown): SaveData {
  const d = defaults();
  if (!isObj(raw)) return d;

  const profile = isObj(raw.profile) ? raw.profile : {};
  const band = BAND_IDS.find((b) => b === profile.band) ?? d.profile.band;
  const settings = isObj(raw.settings) ? raw.settings : {};
  const pet = isObj(raw.pet) ? raw.pet : {};
  const world = isObj(raw.world) ? raw.world : {};
  const stories = isObj(raw.stories) ? raw.stories : {};

  const games: Record<string, GameStats> = {};
  if (isObj(raw.games)) {
    for (const [id, g] of Object.entries(raw.games)) {
      if (!isObj(g)) continue;
      const history = Array.isArray(g.history) ? g.history.filter(isObj) : [];
      games[id] = {
        plays: Math.max(0, Math.floor(num(g.plays, 0))),
        level: Math.max(1, Math.floor(num(g.level, 1))),
        pinned: typeof g.pinned === 'number' && Number.isFinite(g.pinned) ? Math.max(1, Math.floor(g.pinned)) : null,
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
        .map((s) => {
          const p = placement(s.placement);
          return { game: s.game as string, seed: num(s.seed, 1), at: num(s.at, 0), ...(p ? { placement: p } : {}) };
        })
    : [];

  return {
    version: 2,
    profile: { name: str(profile.name, d.profile.name).slice(0, 40), band },
    pet: {
      name: str(pet.name, 'Pip').trim().slice(0, 40) || 'Pip',
      color: PET_COLORS.find((c) => c === pet.color) ?? 'teal',
      hatched: bool(pet.hatched, false),
    },
    // Older saves also listed opened regions; the age trail has no closed places, so that is dropped.
    world: {
      band: BAND_IDS.find((b) => b === world.band) ?? null,
    },
    settings: {
      placeLayout: settings.placeLayout === 'subjects' ? 'subjects' : 'path',
      volume: Math.min(1, Math.max(0, num(settings.volume, d.settings.volume))),
      music: bool(settings.music, d.settings.music),
      sessionMinutes: Math.max(0, num(settings.sessionMinutes, d.settings.sessionMinutes)),
      coplayHints: bool(settings.coplayHints, d.settings.coplayHints),
    },
    games,
    stickers,
    stories: { picnic: story(stories.picnic) },
  };
}
