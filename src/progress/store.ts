import { get, set } from 'idb-keyval';
import { bandInfo, type Band } from './bands';
import { nextLevel, type LevelRange } from './difficulty';
import { defaults, HISTORY_LENGTH, migrate, type GameStats, type RoundRecord, type SaveData } from './save';

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
  }

  save() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      set(KEY, this.data).catch((e) => console.warn('Could not save progress', e));
    }, 300);
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

  recordRound(gameId: string, round: RoundRecord, range: LevelRange) {
    const stats = this.stats(gameId);
    stats.plays++;
    stats.history = [...stats.history, round].slice(-HISTORY_LENGTH);
    stats.level = nextLevel(round.level, stats.history, range);
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
    const { profile, settings } = this.data;
    this.data = { ...defaults(), profile, settings };
    this.save();
  }
}

export const store = new Store();
