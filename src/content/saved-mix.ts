/**
 * The saved mix (D5b): the lineup a grown-up arranged per home spot, and one unfinished Little surprises session, kept in
 * `SaveData.mix` so a reload, a closed tab or a crash does not lose them. Only shape and bounds are repaired here; registry,
 * band and sticker checks run when the saved value is used (`hydrateSession`, `repairLineup`).
 */
export type MixPlace = 'lap' | 'toddler';
/** upcoming, played, skipped, unavailable */
export type SavedItemState = 'u' | 'p' | 's' | 'x';
export interface SavedItem {
  s: SavedItemState;
  /** Only on a played item: the seed of the sticker its round awarded (the receipt). */
  seed?: number;
}
export interface SavedSession {
  place: MixPlace;
  /** 1–5 IDs, frozen when the session started. */
  ids: string[];
  /** Same length as `ids`. Always at least one `u`: the write that settles the last stop clears the session. */
  items: SavedItem[];
}
export interface SavedMix {
  /** Per home spot; absent = the default Little surprises. */
  lineups: Partial<Record<MixPlace, string[]>>;
  session: SavedSession | null;
}

export const SAVED_MIX_MAX = 5;
const PLACES: readonly MixPlace[] = ['lap', 'toddler'];
const STATES: readonly SavedItemState[] = ['u', 'p', 's', 'x'];
const ID = /^[a-z0-9-]{1,40}$/;

export const emptyMix = (): SavedMix => ({ lineups: {}, session: null });
export const isMixPlace = (v: unknown): v is MixPlace => PLACES.includes(v as MixPlace);

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const cleanIds = (raw: unknown): string[] | null => {
  if (!Array.isArray(raw) || !raw.length || !raw.every((v) => typeof v === 'string' && ID.test(v)))
    return null;
  return (raw as string[]).slice(0, SAVED_MIX_MAX);
};

function cleanSession(raw: unknown): SavedSession | null {
  if (!isObj(raw) || !isMixPlace(raw.place) || !Array.isArray(raw.items)) return null;
  if (!Array.isArray(raw.ids) || raw.ids.length > SAVED_MIX_MAX) return null;
  const ids = cleanIds(raw.ids);
  if (!ids) return null;
  const items: SavedItem[] = [];
  for (let i = 0; i < ids.length; i++) {
    const it: unknown = raw.items[i];
    if (it === undefined) {
      items.push({ s: 'u' });
      continue;
    }
    if (!isObj(it) || !STATES.includes(it.s as SavedItemState)) return null;
    const s = it.s as SavedItemState;
    if (s === 'p') {
      // A played item with no usable receipt is simply still to play: a repair never awards anything.
      items.push(
        typeof it.seed === 'number' && Number.isInteger(it.seed) ? { s, seed: it.seed } : { s: 'u' },
      );
    } else items.push({ s });
  }
  return items.some((it) => it.s === 'u') ? { place: raw.place, ids, items } : null;
}

/** Shape and bounds only: anything else becomes the default. */
export function cleanMix(raw: unknown): SavedMix {
  if (!isObj(raw)) return emptyMix();
  const lineups: SavedMix['lineups'] = {};
  if (isObj(raw.lineups))
    for (const place of PLACES) {
      const ids = cleanIds(raw.lineups[place]);
      if (ids) lineups[place] = ids;
    }
  return { lineups, session: cleanSession(raw.session) };
}
