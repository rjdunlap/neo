import type { Band } from './bands';
import { PET_COLORS, ROOM_ITEMS, STICKER_PAGES, STORY_STEPS, type PetColor, type RoomItemId, type StickerPage, type StoryId, type StoryStep } from '../content/world';
import { clampSpot, starterItem, starterRoom } from '../content/room';
import { cleanCreations, emptyCreations, type CreationsSave } from '../content/creations';
import { cleanJournal, emptyJournal, type JournalSave } from '../content/journal';
import { cleanFavorites } from '../content/shelf';
import { isSpecies, SPECIES, type SpeciesId } from '../creatures/species';
import { cleanWelcome, emptyWelcome, type WelcomeProject } from '../content/welcome';
import { cleanWorn, type WearableId } from '../art/creatures/wear-slots';
import { isLandId, type LandId } from '../content/lands';

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
export interface StoryProgress<S extends StoryId = StoryId> {
  steps: StoryStep<S>[];
  /** This telling's ending has been shown. */
  ended: boolean;
  /** The story's one known keepsake (its picnic photo). Telling the story again never takes it away or adds another. */
  keepsake: boolean;
}

/** One furnishing in the pet's treehouse: where its feet are (fractions of the room) and which way it faces. */
export interface RoomItem {
  id: RoomItemId;
  x: number;
  y: number;
  flip: boolean;
}

/** The treehouse: always all six furnishings, plus the one sticker hung in the frame (shown, never used up). */
export interface RoomSave {
  items: RoomItem[];
  frame: { game: string; seed: number } | null;
}

/**
 * One creature she owns (RW05): its own id, species, name and look. `metAt` is the token that brought it, so a replayed
 * meeting can never bring a second one (`start` for the first friend, `dev:<species>` for a development seed).
 */
export interface Individual {
  id: string;
  species: SpeciesId;
  name: string;
  /** Its colour, and what it wears (RW06): wearable ids, one per slot, in the order put on (`cleanWorn`). */
  look: { color: PetColor; worn: WearableId[] };
  metAt: string;
}

/** The friends she has met, in the order met, and which one travels with her: null exactly when she has met none. */
export interface CreaturesSave {
  owned: Individual[];
  companion: string | null;
}

export const MAX_CREATURES = 24;
export const CREATURE_ID = /^[a-z0-9]{4,32}$/;

/** Everything the app remembers, as one versioned record so a backup is a single file. */
export interface SaveData {
  version: 3;
  profile: { name: string; band: Band };
  creatures: CreaturesSave;
  /** Highest band celebrated on the map; null before the first visit. */
  world: { band: Band | null };
  /**
   * `sessionMinutes` is retired and always 0 ("no limit"): the app has no timer, because play limits belong to the device
   * (Screen Time, Guided Access). The field stays so an older cached build that reads a newer backup finds 0, not its
   * old default of a few minutes, and never starts a goodnight scene.
   */
  settings: { placeLayout: 'path' | 'subjects'; volume: number; music: boolean; sessionMinutes: 0; coplayHints: boolean; howToCards: boolean; speech: boolean };
  games: Record<string, GameStats>;
  stickers: StickerRecord[];
  stories: { picnic: StoryProgress<'picnic'>; woodland: StoryProgress<'woodland'> };
  /** The root's projects (RW07): Welcome a New Friend, its steps and what she made for it. Never the treehouse's slots. */
  projects: { welcome: WelcomeProject };
  room: RoomSave;
  /** Games she has hearted, oldest first: the island's favorites shelf. Bounded; never a way to lock a game. */
  favorites: string[];
  /** What she made and kept for the treehouse: one visual work and one tune, each with the one before it. */
  creations: CreationsSave;
  /** Discoveries she has seen for herself (known entries only), and how many she had looked at when she last opened the journal. */
  journal: JournalSave;
  /**
   * The root's Explore (RW14 slice 8): the last location she visited, so Explore can open with its postcard first. Only a
   * shortcut, kept per profile; null before her first visit. Never a gate or a reminder.
   */
  explore: { last: LandId | null };
}

export const HISTORY_LENGTH = 10;
const BAND_IDS: Band[] = ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup'];

export function defaults(): SaveData {
  return {
    version: 3,
    profile: { name: '', band: 'lap' },
    creatures: { owned: [], companion: null },
    world: { band: null },
    settings: { placeLayout: 'path', volume: 0.8, music: true, sessionMinutes: 0, coplayHints: true, howToCards: true, speech: true },
    games: {},
    stickers: [],
    stories: { picnic: { steps: [], ended: false, keepsake: false }, woodland: { steps: [], ended: false, keepsake: false } },
    projects: { welcome: emptyWelcome() },
    room: starterRoom(),
    favorites: [],
    creations: emptyCreations(),
    journal: emptyJournal(),
    explore: { last: null },
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

/** A story's saved telling, keeping only its own step IDs, in story order. An older save has no woodland telling: it starts empty. */
function story<S extends StoryId>(id: S, raw: unknown): StoryProgress<S> {
  const r = isObj(raw) ? raw : {};
  const all: readonly StoryStep<S>[] = STORY_STEPS[id];
  const steps = all.filter((step) => Array.isArray(r.steps) && r.steps.includes(step));
  // A telling can only have ended once every step is done; an ending always left its keepsake.
  const ended = bool(r.ended, false) && steps.length === all.length;
  return { steps, ended, keepsake: bool(r.keepsake, false) || ended };
}

/** Always six items, one of each: anything missing or damaged goes back to its starting spot. */
function room(raw: unknown): RoomSave {
  const r = isObj(raw) ? raw : {};
  const given = Array.isArray(r.items) ? r.items.filter(isObj) : [];
  const items = ROOM_ITEMS.map((id): RoomItem => {
    const it = given.find((g) => g.id === id);
    if (!it) return starterItem(id);
    const start = starterItem(id);
    return { id, ...clampSpot(num(it.x, start.x), num(it.y, start.y)), flip: bool(it.flip, false) };
  });
  const f = isObj(r.frame) ? r.frame : null;
  const frame = f && typeof f.game === 'string' && f.game.length > 0 && f.game.length <= 60 && typeof f.seed === 'number' && Number.isFinite(f.seed) ? { game: f.game, seed: f.seed } : null;
  return { items, frame };
}

/**
 * Rebuilds the collection from a whitelist: an unknown species or a malformed id drops that creature, a duplicate id keeps
 * the first, and the list keeps the earliest 24. An older save has no `creatures` block, so it owns no creature and meets its
 * first friend again at the egg: the retired `pet` field is not read (the development-save exception, RW05).
 */
export function cleanCreatures(raw: unknown): CreaturesSave {
  const r = isObj(raw) ? raw : {};
  const owned: Individual[] = [];
  for (const c of Array.isArray(r.owned) ? r.owned.filter(isObj) : []) {
    if (owned.length >= MAX_CREATURES) break;
    if (!isSpecies(c.species) || typeof c.id !== 'string' || !CREATURE_ID.test(c.id) || owned.some((o) => o.id === c.id)) continue;
    const sp = SPECIES[c.species];
    const look = isObj(c.look) ? c.look : {};
    owned.push({
      id: c.id,
      species: c.species,
      name: str(c.name, '').trim().slice(0, 40) || sp.names[0],
      look: { color: PET_COLORS.find((p) => p === look.color) ?? sp.color, worn: cleanWorn(look.worn) },
      metAt: str(c.metAt, '').slice(0, 60),
    });
  }
  const companion = owned.find((o) => o.id === r.companion)?.id ?? owned[0]?.id ?? null;
  return { owned, companion };
}

/**
 * The one way a creature comes to exist. Idempotent on `metAt`: a token already met returns that creature and changes
 * nothing. Null (and nothing changes) once the collection is full. The first friend met becomes the companion.
 */
export function meetIn(c: CreaturesSave, species: SpeciesId, name: string, color: PetColor, metAt: string, newId: () => string): Individual | null {
  const token = metAt.slice(0, 60);
  const known = c.owned.find((o) => o.metAt === token);
  if (known) return known;
  if (c.owned.length >= MAX_CREATURES) return null;
  let id = newId();
  while (c.owned.some((o) => o.id === id)) id = newId();
  const sp = SPECIES[species];
  const met: Individual = { id, species, name: name.trim().slice(0, 40) || sp.names[0], look: { color: PET_COLORS.includes(color) ? color : sp.color, worn: [] }, metAt: token };
  c.owned.push(met);
  if (c.companion === null) c.companion = id;
  return met;
}

/** The friend who travels with her, or null before the first is met. */
export const companionOf = (c: CreaturesSave): Individual | null => c.owned.find((o) => o.id === c.companion) ?? null;

/** Accepts anything (old saves, hand-edited backups, garbage) and returns a valid save. */
export function migrate(raw: unknown): SaveData {
  const d = defaults();
  if (!isObj(raw)) return d;

  const profile = isObj(raw.profile) ? raw.profile : {};
  const band = BAND_IDS.find((b) => b === profile.band) ?? d.profile.band;
  const settings = isObj(raw.settings) ? raw.settings : {};
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
    version: 3,
    profile: { name: str(profile.name, d.profile.name).slice(0, 40), band },
    creatures: cleanCreatures(raw.creatures),
    // Older saves also listed opened regions; the age trail has no closed places, so that is dropped.
    world: {
      band: BAND_IDS.find((b) => b === world.band) ?? null,
    },
    settings: {
      placeLayout: settings.placeLayout === 'subjects' ? 'subjects' : 'path',
      volume: Math.min(1, Math.max(0, num(settings.volume, d.settings.volume))),
      music: bool(settings.music, d.settings.music),
      sessionMinutes: 0,
      coplayHints: bool(settings.coplayHints, d.settings.coplayHints),
      howToCards: bool(settings.howToCards, d.settings.howToCards),
      speech: bool(settings.speech, d.settings.speech),
    },
    games,
    stickers,
    stories: { picnic: story('picnic', stories.picnic), woodland: story('woodland', stories.woodland) },
    projects: { welcome: cleanWelcome(isObj(raw.projects) ? raw.projects.welcome : undefined) },
    room: room(raw.room),
    favorites: cleanFavorites(raw.favorites),
    creations: cleanCreations(raw.creations),
    journal: cleanJournal(raw.journal),
    explore: { last: isObj(raw.explore) && isLandId(raw.explore.last) ? raw.explore.last : null },
  };
}

/**
 * The save as it was just before the last reset or restore, kept for exactly one undo so a slip never costs her
 * stickers. It is not part of a backup: one snapshot, repaired by `migrate` when read, replaced by the next reset.
 */
export interface PreviousSave {
  at: number;
  data: SaveData;
}

/** A copy that later changes to `data` cannot touch. */
export function remember(data: SaveData, at: number): PreviousSave {
  return { at, data: structuredClone(data) };
}

/** What IndexedDB gave back, or null if it is not a snapshot. */
export function repairPrevious(raw: unknown): PreviousSave | null {
  if (!isObj(raw) || typeof raw.at !== 'number' || !Number.isFinite(raw.at) || !isObj(raw.data)) return null;
  return { at: raw.at, data: migrate(raw.data) };
}

/** Undo swaps rather than discards, so undoing twice is a redo. */
export function swapWithPrevious(current: SaveData, previous: PreviousSave, at: number): { data: SaveData; previous: PreviousSave } {
  return { data: previous.data, previous: remember(current, at) };
}
