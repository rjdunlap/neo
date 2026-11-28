import { isWearable, WEARABLES, type WearableId } from '../art/creatures/wear-slots';
import type { Band } from '../progress/bands';
import { ALL_PET_COLORS, isPetColor, MIXED_COLORS, type PetColor } from './world';
import { earnsShells, type ShellsSave } from './shells';

/**
 * The friend's shop: the progression loop's first way to spend shells (chunk 32, docs/definitions/progression-loop.md,
 * slice 4). A grown-up buys things to wear and colours for their own friend, each at a price shown before it is bought,
 * bought once and kept for good. Nothing is ever taken away or wears out, nothing is left to chance, and buying never
 * opens a game or a level: it only changes how the friend looks. Children's Dress keeps every item and colour free.
 */
export type ShopId = `wear:${WearableId}` | `color:${PetColor}`;

/** What each thing to wear costs: small things first, the crown last. */
export const WEAR_PRICE: Record<WearableId, number> = {
  sunglasses: 60,
  scarf: 60,
  mittens: 60,
  beanie: 80,
  boots: 80,
  sunhat: 100,
  umbrella: 120,
  raincoat: 150,
  crown: 250,
};

/** A colour of the first eight; a paint-shelf colour costs more. */
export const COLOR_PRICE = 50;
export const MIXED_COLOR_PRICE = 120;

export const wearId = (w: WearableId): ShopId => `wear:${w}`;
export const colorId = (c: PetColor): ShopId => `color:${c}`;

/** Every thing on sale: the things to wear, then the colours. */
export const SHOP_IDS: readonly ShopId[] = [...WEARABLES.map(wearId), ...ALL_PET_COLORS.map(colorId)];

export const isShopId = (v: unknown): v is ShopId => typeof v === 'string' && SHOP_IDS.includes(v as ShopId);

export function priceOf(id: ShopId): number {
  const [kind, name] = id.split(':') as ['wear' | 'color', string];
  if (kind === 'wear') return WEAR_PRICE[name as WearableId];
  return (MIXED_COLORS as readonly string[]).includes(name) ? MIXED_COLOR_PRICE : COLOR_PRICE;
}

export interface ShopSave {
  /** What has been bought, in the order bought. */
  owned: ShopId[];
}

export const emptyShop = (): ShopSave => ({ owned: [] });

/** A stored record, repaired: known ids only, each once (the first kept). */
export function cleanShop(raw: unknown): ShopSave {
  const list =
    typeof raw === 'object' && raw !== null && Array.isArray((raw as { owned?: unknown }).owned)
      ? (raw as { owned: unknown[] }).owned
      : [];
  const owned: ShopId[] = [];
  for (const v of list) if (isShopId(v) && !owned.includes(v)) owned.push(v);
  return { owned: owned.slice(0, SHOP_IDS.length) };
}

/**
 * Whether the friend may wear or show a thing without buying it: bought, already on the friend (an older save, or a
 * friend dressed before the shop), or the friend's own colour. Never takes anything off a friend.
 */
export function hasLook(
  shop: ShopSave,
  friend: { look: { color: PetColor; worn: readonly WearableId[] } },
  own: PetColor,
  id: ShopId,
): boolean {
  if (shop.owned.includes(id)) return true;
  const [kind, name] = id.split(':');
  if (kind === 'wear') return isWearable(name) && friend.look.worn.includes(name);
  return isPetColor(name) && (name === own || name === friend.look.color);
}

export type BuyRefusal = 'band' | 'unknown' | 'owned' | 'short';

/**
 * Buys one thing: the price comes off the balance and the thing is kept. Refused, with nothing changed, for a band that
 * does not earn shells, an unknown id, a thing already owned, or a balance short of the price.
 */
export function buy(
  shop: ShopSave,
  shells: ShellsSave,
  id: string,
  band: Band,
): { shop: ShopSave; shells: ShellsSave } | { refused: BuyRefusal } {
  if (!earnsShells(band)) return { refused: 'band' };
  if (!isShopId(id)) return { refused: 'unknown' };
  if (shop.owned.includes(id)) return { refused: 'owned' };
  const price = priceOf(id);
  if (shells.balance < price) return { refused: 'short' };
  return {
    shop: { owned: [...shop.owned, id] },
    shells: { ...shells, balance: shells.balance - price },
  };
}

/** The words for a thing on sale. */
export function shopName(id: ShopId): string {
  const name = id.slice(id.indexOf(':') + 1);
  const words: Partial<Record<string, string>> = { sunhat: 'Sun hat', crown: 'Flower crown' };
  const label = words[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
  return id.startsWith('color:') ? `${label} paint` : label;
}
