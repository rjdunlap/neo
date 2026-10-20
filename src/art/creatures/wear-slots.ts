/**
 * RW06 (docs/rework/HOME.md#the-saved-look): the nine wearables' ids and the slot each fills, so a hat replaces a hat
 * instead of stacking. Pixi-free, so the save can repair a creature's `look.worn` against it; the sprites and fits are in
 * `wearables.ts`, which re-exports these.
 */
export const WEARABLES = ['crown', 'scarf', 'sunhat', 'sunglasses', 'raincoat', 'umbrella', 'beanie', 'boots', 'mittens'] as const;
export type WearableId = (typeof WEARABLES)[number];
export type WearSlot = 'head' | 'face' | 'neck' | 'body' | 'held' | 'hands' | 'feet';

export const SLOT: Readonly<Record<WearableId, WearSlot>> = {
  crown: 'head',
  sunhat: 'head',
  beanie: 'head',
  sunglasses: 'face',
  scarf: 'neck',
  raincoat: 'body',
  umbrella: 'held',
  mittens: 'hands',
  boots: 'feet',
};

/** At most one item per slot: seven. */
export const MAX_WORN = 7;

export const isWearable = (v: unknown): v is WearableId => typeof v === 'string' && (WEARABLES as readonly string[]).includes(v);

/**
 * Repairs a saved `worn` list: unknown ids dropped, a repeated id keeps its first place, of two items in one slot the later
 * (the one put on last) stays, and the list is cut at seven. A misfit for the species is kept (it is just not drawn), so a
 * changed wear table never changes her save.
 */
export function cleanWorn(raw: unknown): WearableId[] {
  const out: WearableId[] = [];
  for (const v of Array.isArray(raw) ? raw : []) {
    if (!isWearable(v) || out.includes(v)) continue;
    const clash = out.findIndex((w) => SLOT[w] === SLOT[v]);
    if (clash >= 0) out.splice(clash, 1);
    out.push(v);
  }
  return out.slice(0, MAX_WORN);
}

/** `worn` after putting an item on (replacing whatever shares its slot, appended last) or taking it off. */
export function changeWorn(worn: readonly WearableId[], item: WearableId, on: boolean): WearableId[] {
  const rest = worn.filter((w) => w !== item && (!on || SLOT[w] !== SLOT[item]));
  return on ? [...rest, item] : rest;
}
