import { del, get, set } from 'idb-keyval';
import type { Band } from './bands';
import { nextLevel, type LevelRange } from './difficulty';
import {
  addEntry,
  buildBackup,
  cleanBirth,
  effectiveBand,
  INDEX_KEY,
  newEntry,
  newProfileId,
  parseBackup,
  planRestore,
  previousKey,
  removeEntry,
  repairIndex,
  saveKey,
  updateEntry,
  type Birth,
  type ProfileEntry,
  type ProfileIndex,
} from './profiles';
import { flipItem, moveItem, tidy } from '../content/room';
import { canUndo, keepCreation, takeDownCreation, undoCreation, type Creation } from '../content/creations';
import { discover, hasNew, markSeen } from '../content/journal';
import { isNew, toggleFavorite } from '../content/shelf';
import { PICNIC_STEPS, type PicnicStep, type RoomItemId } from '../content/world';
import { defaults, HISTORY_LENGTH, migrate, remember, repairPrevious, swapWithPrevious, type GameStats, type PreviousSave, type RoundRecord, type SaveData, type StoryProgress } from './save';

export interface RestoreResult {
  replaced: number;
  added: number;
  /** People in the file who did not fit in the household. */
  skipped: number;
}

/**
 * Saved progress in IndexedDB. Reads are synchronous from memory; writes are batched.
 *
 * `data` is the **active profile's** save, so every scene reads and writes it as it always has. Which profile that is, and
 * who else has a save here, lives in the index (`profiles.ts`). The first profile's save is still `neo.save`.
 */
export class Store {
  data: SaveData = defaults();
  private index: ProfileIndex;
  /** False if the index could not be read: it is then never written, so a guess cannot overwrite the people on disk. */
  private indexTrusted = true;
  private previous: PreviousSave | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listening = false;

  constructor(
    private readonly makeId: () => string = newProfileId,
    private readonly clock: () => number = Date.now,
  ) {
    // Until `load` reads the real index, the app is the single-profile app it was: one blank save at `neo.save`.
    this.index = { version: 1, active: 'unloaded', profiles: [newEntry('unloaded', 0, true)] };
  }

  /** The active profile's place in the index: who they are (birth, start band), as against `data`, what they have done. */
  get entry(): ProfileEntry {
    return this.index.profiles.find((p) => p.id === this.index.active) ?? this.index.profiles[0];
  }

  get activeId(): string {
    return this.index.active;
  }

  get profiles(): readonly ProfileEntry[] {
    return this.index.profiles;
  }

  async load() {
    this.listen();
    this.indexTrusted = true;
    let raw: unknown;
    try {
      raw = await get(INDEX_KEY);
    } catch (e) {
      this.indexTrusted = false;
      console.warn('Could not read the list of players', e);
    }
    this.index = repairIndex(raw, this.makeId, this.clock());
    // A first run, or a device from before profiles, writes the one legacy profile down.
    if (JSON.stringify(raw) !== JSON.stringify(this.index)) this.saveIndex();
    const loaded = await this.read(this.entry);
    this.data = loaded.data;
    this.previous = loaded.previous;
    this.syncBand();
  }

  /** Once only, however many times `load` runs. */
  private listen() {
    if (this.listening) return;
    this.listening = true;
    // Ask Safari not to clear our storage when space is low.
    if (typeof navigator !== 'undefined') void navigator.storage?.persist?.();
    // iPadOS may suspend a hidden web app before a pending write's timer runs.
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.hidden && this.flush());
    if (typeof window !== 'undefined') window.addEventListener('pagehide', () => this.flush());
  }

  /** A profile's save and its undo snapshot; a save that is missing or cannot be read is a fresh one. */
  private async read(entry: ProfileEntry): Promise<{ data: SaveData; previous: PreviousSave | null }> {
    const out: { data: SaveData; previous: PreviousSave | null } = { data: defaults(), previous: null };
    try {
      out.data = migrate(await get(saveKey(entry)));
    } catch (e) {
      console.warn('Could not read saved progress', e);
    }
    try {
      out.previous = repairPrevious(await get(previousKey(entry)));
    } catch (e) {
      console.warn('Could not read the undo snapshot', e);
    }
    return out;
  }

  save() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.write(), 300);
  }

  /** Writes a pending save right away. */
  flush() {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.write();
  }

  private write() {
    this.timer = undefined;
    set(saveKey(this.entry), this.data).catch((e) => console.warn('Could not save progress', e));
  }

  private saveIndex() {
    if (!this.indexTrusted) return;
    set(INDEX_KEY, this.index).catch((e) => console.warn('Could not save the list of players', e));
  }

  /**
   * Once a profile has a birth (or a chosen start), its saved band follows the age, so the places, games and picnic that read
   * `profile.band` need no change. A profile with neither keeps the band its save has, exactly as before.
   */
  private syncBand() {
    const band = effectiveBand(this.entry, this.data.profile.band, new Date(this.clock()));
    if (band === this.data.profile.band) return;
    this.data.profile.band = band;
    this.save();
  }

  stats(gameId: string): GameStats {
    return (this.data.games[gameId] ??= { plays: 0, level: 1, pinned: null, history: [] });
  }

  /** The level to play now (a grown-up's pin wins), clamped to what the current band allows. */
  levelFor(gameId: string, range: LevelRange): number {
    const s = this.stats(gameId);
    return nextLevel(s.pinned ?? s.level, [], range);
  }

  /** Stay on one level, or pass null to go back to automatic. */
  pin(gameId: string, level: number | null) {
    this.stats(gameId).pinned = level;
    this.save();
  }

  /** With `adapt` false (a story round played at the story's own level), the game's level stays where it was. */
  recordRound(gameId: string, round: RoundRecord, range: LevelRange, adapt = true) {
    const stats = this.stats(gameId);
    stats.plays++;
    stats.history = [...stats.history, round].slice(-HISTORY_LENGTH);
    if (adapt) stats.level = nextLevel(round.level, stats.history, range);
    this.save();
  }

  /** Whether no round of this game has been finished yet (in any place). */
  isNew(gameId: string): boolean {
    return isNew(this.data.games, gameId);
  }

  get favorites(): readonly string[] {
    return this.data.favorites;
  }

  isFavorite(gameId: string): boolean {
    return this.data.favorites.includes(gameId);
  }

  /** Hearts a game or takes the heart back; returns whether it is hearted now. */
  toggleFavorite(gameId: string): boolean {
    this.data.favorites = toggleFavorite(this.data.favorites, gameId);
    this.save();
    return this.isFavorite(gameId);
  }

  get creations() {
    return this.data.creations;
  }

  /** Hang something she made in the treehouse, in place of what was there (which can be brought back). */
  keepCreation(made: Creation) {
    this.data.creations = keepCreation(this.data.creations, made);
    this.save();
  }

  hasEarlier(kind: Creation['kind']): boolean {
    return canUndo(this.data.creations, kind);
  }

  /** Bring back the earlier visual work or tune; the one on show becomes the earlier one. */
  undoCreation(kind: Creation['kind']) {
    this.data.creations = undoCreation(this.data.creations, kind);
    this.save();
  }

  /** Leave this creation's wall place empty, keeping the displayed work one touch away. */
  takeDownCreation(kind: Creation['kind']) {
    this.data.creations = takeDownCreation(this.data.creations, kind);
    this.save();
  }

  get journal() {
    return this.data.journal;
  }

  /** File what a round showed. Returns the entries that are new this time. */
  discover(ids: readonly string[] | undefined): string[] {
    const r = discover(this.data.journal, ids);
    if (r.added.length) {
      this.data.journal = r.journal;
      this.save();
    }
    return r.added;
  }

  /** She opened the journal: everything found so far counts as looked at. */
  openJournal() {
    const next = markSeen(this.data.journal);
    if (next === this.data.journal) return;
    this.data.journal = next;
    this.save();
  }

  get journalHasNew(): boolean {
    return hasNew(this.data.journal);
  }

  get picnic(): StoryProgress {
    return this.data.stories.picnic;
  }

  /** Marks a picnic request done. Doing it again changes nothing; returns whether it was new. */
  completeStep(step: PicnicStep): boolean {
    const p = this.picnic;
    if (p.steps.includes(step)) return false;
    p.steps = PICNIC_STEPS.filter((s) => s === step || p.steps.includes(s));
    this.save();
    return true;
  }

  /** The ending was shown: the telling is over and its keepsake is kept for good. */
  endStory() {
    const p = this.picnic;
    if (p.steps.length < PICNIC_STEPS.length) return;
    p.ended = true;
    p.keepsake = true;
    this.save();
  }

  /** Tell the story again from the start. The keepsake stays. */
  retellStory() {
    const p = this.picnic;
    p.steps = [];
    p.ended = false;
    this.save();
  }

  get room() {
    return this.data.room;
  }

  /** Move a furnishing (to the nearest spot on the floor). */
  moveRoomItem(id: RoomItemId, x: number, y: number) {
    this.data.room = moveItem(this.data.room, id, x, y);
    this.save();
  }

  flipRoomItem(id: RoomItemId) {
    this.data.room = flipItem(this.data.room, id);
    this.save();
  }

  /** Every furnishing back where it started. The picture in the frame stays. */
  tidyRoom() {
    this.data.room = tidy(this.data.room);
    this.save();
  }

  /** Hang one sticker in the frame, or empty it. The sticker stays in the book either way. */
  hangSticker(sticker: { game: string; seed: number } | null) {
    this.data.room = { ...this.data.room, frame: sticker ? { game: sticker.game, seed: sticker.seed } : null };
    this.save();
  }

  addSticker(game: string, seed: number) {
    this.data.stickers.push({ game, seed, at: Date.now() });
    this.save();
  }

  setBand(band: Band) {
    if (band === this.data.profile.band) return;
    this.data.profile.band = band;
    this.save();
  }

  /**
   * Makes another profile the active one. Its save is read first, with the profile being left still active; then, in one
   * step, the pending write of the one being left goes out under its own key and `data` becomes the other's. There is no
   * moment when `data` is empty and a stray `save()` could overwrite a real save.
   */
  async switchTo(id: string): Promise<boolean> {
    const target = this.index.profiles.find((p) => p.id === id);
    if (!target) return false;
    if (id === this.index.active) return true;
    const loaded = await this.read(target);
    // Someone may have been removed while the save was being read.
    if (!this.index.profiles.some((p) => p.id === id)) return false;
    this.flush();
    this.index = { ...this.index, active: id };
    this.data = loaded.data;
    this.previous = loaded.previous;
    this.saveIndex();
    this.syncBand();
    return true;
  }

  /** Adds a person and returns their id, or null if the household is full. They are not switched to; their save starts blank. */
  addProfile(birth: Birth | null = null): string | null {
    let id = this.makeId();
    for (let tries = 0; this.index.profiles.some((p) => p.id === id); tries++) {
      if (tries >= 5) return null;
      id = this.makeId();
    }
    const next = addEntry(this.index, { ...newEntry(id, this.clock()), birth: cleanBirth(birth) });
    if (!next) return null;
    this.index = next;
    this.saveIndex();
    return id;
  }

  /**
   * Takes a person and their save away for good (a caller asks first, behind the grown-ups' hold). If it was the active
   * profile, another becomes active; the last one is replaced by a blank profile, never by nothing.
   */
  async removeProfile(id: string): Promise<boolean> {
    const gone = this.index.profiles.find((p) => p.id === id);
    if (!gone) return false;
    const next = removeEntry(this.index, id, this.makeId, this.clock());
    const wasActive = id === this.index.active;
    if (wasActive) {
      const loaded = await this.read(next.profiles.find((p) => p.id === next.active)!);
      // Nothing pending may write the removed profile back.
      clearTimeout(this.timer);
      this.timer = undefined;
      this.data = loaded.data;
      this.previous = loaded.previous;
    }
    this.index = next;
    this.saveIndex();
    if (wasActive) this.syncBand();
    // The index goes first, so a crash leaves a stray save at worst and never an index that points at nothing.
    await Promise.all([del(saveKey(gone)), del(previousKey(gone))]).catch((e) => console.warn('Could not clear a removed player', e));
    return true;
  }

  /** The birth month and year of a profile, or null to forget it. Anything that is not a month and a year is forgotten. */
  setBirth(id: string, birth: Birth | null) {
    if (!this.index.profiles.some((p) => p.id === id)) return;
    this.index = updateEntry(this.index, id, { birth: cleanBirth(birth) });
    this.saveIndex();
    if (id === this.index.active) this.syncBand();
  }

  /** A grown-up's "start here instead": the band that wins over the age, or null to follow the age again. */
  setStartBand(id: string, band: Band | null) {
    if (!this.index.profiles.some((p) => p.id === id)) return;
    this.index = updateEntry(this.index, id, { startBand: band });
    this.saveIndex();
    if (id === this.index.active) this.syncBand();
  }

  /** Another profile's save, to draw its card on the chooser. The active profile's is the live one. */
  async peek(id: string): Promise<SaveData | null> {
    const entry = this.index.profiles.find((p) => p.id === id);
    if (!entry) return null;
    if (id === this.index.active) return this.data;
    return (await this.read(entry)).data;
  }

  /** One file with every profile. */
  async exportAll(): Promise<string> {
    this.flush();
    const profiles = [];
    for (const e of this.index.profiles) {
      const save = e.id === this.index.active ? this.data : (await this.read(e)).data;
      profiles.push({ id: e.id, birth: e.birth, startBand: e.startBand, save });
    }
    return JSON.stringify(buildBackup(profiles, this.index.active, this.clock()), null, 2);
  }

  /**
   * Puts a backup back (see `planRestore`): a profile with the same id is replaced and keeps its own undo snapshot, a new one
   * is added if there is room, and nobody is deleted. Returns null if the text is not a backup of ours.
   */
  async restoreAll(text: string): Promise<RestoreResult | null> {
    const parsed = parseBackup(text);
    if (!parsed) return null;
    this.flush();
    const plan = planRestore(this.index, parsed);
    let index = this.index;
    let activeReplaced = false;
    for (const r of plan.replace) {
      const entry = index.profiles.find((p) => p.id === r.id)!;
      const isActive = r.id === index.active;
      const current = isActive ? this.data : (await this.read(entry)).data;
      const snapshot = remember(current, this.clock());
      await set(previousKey(entry), snapshot).catch((e) => console.warn('Could not keep the undo snapshot', e));
      if (isActive) {
        this.previous = snapshot;
        this.data = r.save;
        activeReplaced = true;
      } else {
        await set(saveKey(entry), r.save).catch((e) => console.warn('Could not save progress', e));
      }
      if (r.entry) index = updateEntry(index, r.id, r.entry);
    }
    for (const a of plan.add) {
      const next = addEntry(index, { ...newEntry(a.id, this.clock()), birth: a.birth, startBand: a.startBand });
      if (!next) continue;
      index = next;
      await set(saveKey({ id: a.id, legacy: false }), a.save).catch((e) => console.warn('Could not save progress', e));
    }
    this.index = index;
    this.saveIndex();
    if (activeReplaced) {
      this.save();
      this.syncBand();
    }
    return { replaced: plan.replace.length, added: plan.add.length, skipped: plan.skipped };
  }

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(text: string): boolean {
    try {
      const next = migrate(JSON.parse(text));
      this.keep();
      this.data = next;
      this.syncBand();
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  /** Starts her progress over (name, settings and pet stay). `undo` brings it back. */
  reset() {
    this.keep();
    const { profile, settings, pet } = this.data;
    this.data = { ...defaults(), profile, settings, pet };
    this.save();
  }

  /** When the save that `undo` would bring back was set aside, or null if there is none. */
  get undoAt(): number | null {
    return this.previous?.at ?? null;
  }

  /** Swaps the save with the snapshot from before the last reset or restore; doing it again swaps back. */
  undo(): boolean {
    if (!this.previous) return false;
    const swapped = swapWithPrevious(this.data, this.previous, Date.now());
    this.data = swapped.data;
    this.previous = swapped.previous;
    this.persistPrevious();
    this.syncBand();
    this.save();
    return true;
  }

  /** Sets the current save aside, before something replaces it. */
  private keep() {
    this.previous = remember(this.data, Date.now());
    this.persistPrevious();
  }

  private persistPrevious() {
    if (this.previous) set(previousKey(this.entry), this.previous).catch((e) => console.warn('Could not keep the undo snapshot', e));
  }
}

export const store = new Store();
