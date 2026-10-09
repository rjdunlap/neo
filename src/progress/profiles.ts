import { BANDS, type Band } from './bands';
import { migrate, type SaveData } from './save';

/**
 * Who has a save on this device. The first profile's save stays at `neo.save`, untouched, so an older cached build still
 * reads it; this index and every further save are new keys beside it. What identifies a person (birth month and year, a
 * "start here instead" band) lives in the index entry and never in the save: `migrate` rebuilds a save from a whitelist, so
 * an older build re-saving `neo.save` would strip any field added to it. Pure, so the rules are tested without a browser.
 */

export const INDEX_KEY = 'neo.profiles';
const LEGACY_SAVE_KEY = 'neo.save';
/** A household: two parents, two grandparents, and room for children. */
export const MAX_PROFILES = 8;

export interface Birth {
  month: number;
  year: number;
}

export interface ProfileEntry {
  id: string;
  /** The one profile whose save is the original `neo.save`. */
  legacy: boolean;
  birth: Birth | null;
  /** A grown-up's "start here instead": a child who plays above or below their age. Wins over the age. */
  startBand: Band | null;
  addedAt: number;
}

export interface ProfileIndex {
  version: 1;
  active: string;
  profiles: ProfileEntry[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const BAND_IDS: readonly Band[] = BANDS.map((b) => b.id);
const bandOrNull = (v: unknown): Band | null => BAND_IDS.find((b) => b === v) ?? null;

/** Ids become part of a storage key, so they are short and plain. */
export const isProfileId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]{4,32}$/.test(v);

/** Twelve random hex characters. `getRandomValues` works on a plain-http LAN dev host, unlike `randomUUID`. */
export function newProfileId(): string {
  const bytes = new Uint8Array(6);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const saveKey = (e: Pick<ProfileEntry, 'id' | 'legacy'>): string => (e.legacy ? LEGACY_SAVE_KEY : `${LEGACY_SAVE_KEY}.${e.id}`);
/** Each profile's one-step undo snapshot (see `PreviousSave`). */
export const previousKey = (e: Pick<ProfileEntry, 'id' | 'legacy'>): string => `${saveKey(e)}.previous`;

// ---- Birth month and year ---------------------------------------------------------------------------------------

/** What a stored birth must look like. Not the clock: a device with a wrong clock must not lose a birth when the index is rewritten. */
const BIRTH_YEARS = { min: 1900, max: 2100 };

const whole = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** Repairs a stored birth by shape alone, or gives null. */
export function cleanBirth(raw: unknown): Birth | null {
  if (!isObj(raw) || !whole(raw.month) || !whole(raw.year)) return null;
  if (raw.month < 1 || raw.month > 12 || raw.year < BIRTH_YEARS.min || raw.year > BIRTH_YEARS.max) return null;
  return { month: raw.month, year: raw.year };
}

/** What a person typed, held to the clock: no later than this month, no earlier than 120 years ago. */
export function checkBirthInput(month: unknown, year: unknown, now: Date): Birth | null {
  if (!whole(month) || !whole(year) || month < 1 || month > 12) return null;
  const y = now.getFullYear(), m = now.getMonth() + 1;
  if (year > y || (year === y && month > m) || year < y - 120) return null;
  return { month, year };
}

/**
 * Whole years old this month. Only the month is known, so a birthday counts from the first of its month: a child born in
 * October 2024 is two from October 2026. A birth in the future (a wrong clock) is 0.
 */
export function completedYears(birth: Birth, now: Date): number {
  const months = (now.getFullYear() - birth.year) * 12 + (now.getMonth() + 1 - birth.month);
  return Math.max(0, Math.floor(months / 12));
}

/**
 * Where age starts someone on the trail: under 2 lap, 2 toddler, 3 preschool, 4 and 5 pre-K, 6 and over school. There is no
 * `grownup` band yet (stage 3), so everyone from 6 up, 13 and over included, starts at the top band that exists.
 */
const AGE_STARTS: readonly (readonly [number, Band])[] = [[0, 'lap'], [2, 'toddler'], [3, 'preschool'], [4, 'prek'], [6, 'school']];

export function bandForYears(years: number): Band {
  let band: Band = 'lap';
  if (!Number.isFinite(years)) return band;
  for (const [from, b] of AGE_STARTS) if (years >= from) band = b;
  return band;
}

/** A chosen start wins; then the age; a profile with neither keeps the band its save already has. */
export function effectiveBand(entry: Pick<ProfileEntry, 'birth' | 'startBand'>, savedBand: Band, now: Date): Band {
  if (entry.startBand) return entry.startBand;
  if (entry.birth) return bandForYears(completedYears(entry.birth, now));
  return savedBand;
}

// ---- The index --------------------------------------------------------------------------------------------------

export const newEntry = (id: string, at: number, legacy = false): ProfileEntry => ({ id, legacy, birth: null, startBand: null, addedAt: at });

/**
 * Accepts anything the index key held and returns a valid one. It is never empty: nothing there (a first run, or a device
 * from before profiles) becomes the one legacy profile, so the app plays exactly as it did.
 */
export function repairIndex(raw: unknown, makeId: () => string, now: number): ProfileIndex {
  const given = isObj(raw) && Array.isArray(raw.profiles) ? raw.profiles : [];
  const profiles: ProfileEntry[] = [];
  let legacySeen = false;
  for (const p of given) {
    if (profiles.length >= MAX_PROFILES) break;
    if (!isObj(p) || !isProfileId(p.id) || profiles.some((q) => q.id === p.id)) continue;
    const legacy: boolean = p.legacy === true && !legacySeen;
    if (legacy) legacySeen = true;
    profiles.push({
      id: p.id,
      legacy,
      birth: cleanBirth(p.birth),
      startBand: bandOrNull(p.startBand),
      addedAt: typeof p.addedAt === 'number' && Number.isFinite(p.addedAt) ? Math.max(0, p.addedAt) : 0,
    });
  }
  if (!profiles.length) profiles.push(newEntry(makeId(), now, true));
  const active = isObj(raw) && profiles.some((p) => p.id === raw.active) ? (raw.active as string) : profiles[0].id;
  return { version: 1, active, profiles };
}

/** The index with one more profile, or null if the household is full. */
export function addEntry(index: ProfileIndex, entry: ProfileEntry): ProfileIndex | null {
  if (index.profiles.length >= MAX_PROFILES || index.profiles.some((p) => p.id === entry.id)) return null;
  return { ...index, profiles: [...index.profiles, entry] };
}

/**
 * Takes one profile out. The index is never left empty (a fresh blank profile takes the place of the last one) and, if the
 * active profile went, the first one left becomes active.
 */
export function removeEntry(index: ProfileIndex, id: string, makeId: () => string, now: number): ProfileIndex {
  if (!index.profiles.some((p) => p.id === id)) return index;
  const profiles = index.profiles.filter((p) => p.id !== id);
  if (!profiles.length) profiles.push(newEntry(makeId(), now));
  const active = profiles.some((p) => p.id === index.active) ? index.active : profiles[0].id;
  return { ...index, profiles, active };
}

/** The index with one entry's identity fields changed. */
export function updateEntry(index: ProfileIndex, id: string, patch: Partial<Pick<ProfileEntry, 'birth' | 'startBand'>>): ProfileIndex {
  return { ...index, profiles: index.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

// ---- Backup -----------------------------------------------------------------------------------------------------

export const BACKUP_KIND = 'puddle-island-backup';
/** The first two versions are the bare save; this one holds every profile. */
export const BACKUP_VERSION = 3;

export interface BackupProfile {
  id: string;
  birth: Birth | null;
  startBand: Band | null;
  save: SaveData;
}

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  active: string;
  profiles: BackupProfile[];
}

export function buildBackup(profiles: BackupProfile[], active: string, exportedAt: number): BackupFile {
  return { kind: BACKUP_KIND, version: BACKUP_VERSION, exportedAt, active, profiles };
}

/** Everyone in the file, or one bare save from today's single-profile backups. */
export type ParsedBackup = { kind: 'many'; profiles: BackupProfile[] } | { kind: 'single'; save: SaveData };

/** Keys that mark the couch save (`neo.couch.v1`), which also has `settings` and `stickers` and must never restore as a child's save. */
const COUCH_KEYS = ['party', 'trips', 'courses', 'names'];
/** A bare save is recognized by what only it has. `migrate` alone would take anything, `{}` included, and restore a blank. */
const SAVE_KEYS = ['profile', 'pet', 'games', 'settings'];

/** Reads a backup file, or gives null if it is not one of ours. Strict where `migrate` is lenient. */
export function parseBackup(text: string): ParsedBackup | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(raw)) return null;
  if (raw.kind === BACKUP_KIND) {
    if (!Array.isArray(raw.profiles)) return null;
    const profiles: BackupProfile[] = [];
    for (const p of raw.profiles) {
      if (profiles.length >= MAX_PROFILES) break;
      if (!isObj(p) || !isProfileId(p.id) || !isObj(p.save) || profiles.some((q) => q.id === p.id)) continue;
      profiles.push({ id: p.id, birth: cleanBirth(p.birth), startBand: bandOrNull(p.startBand), save: migrate(p.save) });
    }
    return profiles.length ? { kind: 'many', profiles } : null;
  }
  if (COUCH_KEYS.some((k) => k in raw)) return null;
  if (!SAVE_KEYS.some((k) => isObj(raw[k]))) return null;
  return { kind: 'single', save: migrate(raw) };
}

export interface RestorePlan {
  /**
   * Profiles to put a save back into, each keeping its own undo snapshot. `entry` is the backup's birth and start band, or
   * absent for a bare save, which leaves who the person is alone.
   */
  replace: { id: string; save: SaveData; entry?: { birth: Birth | null; startBand: Band | null } }[];
  /** People the backup has and this device does not. */
  add: BackupProfile[];
  /** People who would not fit in the household. */
  skipped: number;
}

/**
 * What a restore does. A profile with the same id is replaced; an unknown one is added if there is room; **nobody is ever
 * deleted**. A bare save from today's backups replaces the active profile, as a restore always has.
 */
export function planRestore(index: ProfileIndex, backup: ParsedBackup): RestorePlan {
  if (backup.kind === 'single') return { replace: [{ id: index.active, save: backup.save }], add: [], skipped: 0 };
  const plan: RestorePlan = { replace: [], add: [], skipped: 0 };
  let room = MAX_PROFILES - index.profiles.length;
  for (const p of backup.profiles) {
    if (index.profiles.some((q) => q.id === p.id)) plan.replace.push({ id: p.id, save: p.save, entry: { birth: p.birth, startBand: p.startBand } });
    else if (room > 0) {
      plan.add.push(p);
      room--;
    } else plan.skipped++;
  }
  return plan;
}
