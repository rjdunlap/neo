import { get, set } from 'idb-keyval';
import { bandInfo, type Band } from './bands';
import { nextLevel, type LevelRange } from './difficulty';
import { flipItem, moveItem, tidy } from '../content/room';
import { canUndo, keepCreation, undoCreation, type Creation } from '../content/creations';
import { isNew, toggleFavorite } from '../content/shelf';
import { PICNIC_STEPS, type PicnicStep, type RoomItemId } from '../content/world';
import { defaults, HISTORY_LENGTH, migrate, type GameStats, type RoundRecord, type SaveData, type StoryProgress } from './save';

const KEY = 'neo.save';

/** Saved progress in IndexedDB. Reads are synchronous from memory; writes are batched. */
class Store {
  data: SaveData = defaults();
  private timer: number | undefined;

  async load() {
    try {
      this.data = migrate(await get(KEY));
    } catch (e) {
      console.warn('Could not read saved progress', e);
    }
    // Ask Safari not to clear our storage when space is low.
    void navigator.storage?.persist?.();
    // iPadOS may suspend a hidden web app before a pending write's timer runs.
    document.addEventListener('visibilitychange', () => document.hidden && this.flush());
    window.addEventListener('pagehide', () => this.flush());
  }

  save() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.write(), 300);
  }

  /** Writes a pending save right away. */
  flush() {
    if (this.timer === undefined) return;
    window.clearTimeout(this.timer);
    this.write();
  }

  private write() {
    this.timer = undefined;
    set(KEY, this.data).catch((e) => console.warn('Could not save progress', e));
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

  /** Bring back the earlier picture or tune; the one on show becomes the earlier one. */
  undoCreation(kind: Creation['kind']) {
    this.data.creations = undoCreation(this.data.creations, kind);
    this.save();
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
    this.data.settings.sessionMinutes = bandInfo(band).minutes;
    this.save();
  }

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(text: string): boolean {
    try {
      this.data = migrate(JSON.parse(text));
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    const { profile, settings, pet } = this.data;
    this.data = { ...defaults(), profile, settings, pet };
    this.save();
  }
}

export const store = new Store();
