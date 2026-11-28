import { describe, expect, it } from 'vitest';
import { WEARABLES } from '../art/creatures/wear-slots';
import type { Band } from '../progress/bands';
import { defaults, migrate } from '../progress/save';
import { emptyShells } from './shells';
import {
  buy,
  cleanShop,
  COLOR_PRICE,
  colorId,
  emptyShop,
  hasLook,
  sellsLooks,
  MIXED_COLOR_PRICE,
  priceOf,
  SHOP_IDS,
  shopName,
  wearId,
} from './shop';
import { ALL_PET_COLORS, MIXED_COLORS, PET_COLORS } from './world';

const rich = (balance: number) => ({ ...emptyShells(), balance });
const friend = { look: { color: 'teal' as const, worn: ['scarf' as const] } };

describe('the friend shop', () => {
  it('has a shown price for every thing to wear and every colour', () => {
    expect(SHOP_IDS).toHaveLength(WEARABLES.length + ALL_PET_COLORS.length);
    for (const id of SHOP_IDS) {
      expect(priceOf(id)).toBeGreaterThan(0);
      expect(Number.isInteger(priceOf(id))).toBe(true);
      expect(shopName(id)).toMatch(/^[A-Z]/);
    }
    for (const c of PET_COLORS) expect(priceOf(colorId(c))).toBe(COLOR_PRICE);
    for (const c of MIXED_COLORS) expect(priceOf(colorId(c))).toBe(MIXED_COLOR_PRICE);
    expect(shopName(wearId('sunhat'))).toBe('Sun hat');
    expect(shopName(colorId('lilac'))).toBe('Lilac paint');
  });

  it('only a band that earns shells can buy', () => {
    const bands: Band[] = ['lap', 'toddler', 'preschool', 'prek'];
    for (const band of bands)
      expect(buy(emptyShop(), rich(1000), 'wear:crown', band)).toEqual({ refused: 'band' });
  });

  it('takes the price off the balance and keeps the thing, once', () => {
    const r = buy(emptyShop(), rich(300), 'wear:crown', 'grownup');
    if ('refused' in r) throw new Error(r.refused);
    expect(r.shop.owned).toEqual(['wear:crown']);
    expect(r.shells.balance).toBe(50);
    expect(buy(r.shop, r.shells, 'wear:crown', 'grownup')).toEqual({ refused: 'owned' });
  });

  it('refuses a short balance or an unknown thing, changing nothing', () => {
    expect(buy(emptyShop(), rich(249), 'wear:crown', 'grownup')).toEqual({ refused: 'short' });
    expect(buy(emptyShop(), rich(999), 'wear:jetpack', 'grownup')).toEqual({ refused: 'unknown' });
    expect(buy(emptyShop(), rich(999), 'color:gold', 'grownup')).toEqual({ refused: 'unknown' });
  });

  it('lets a friend keep what it already has on and its own colour, never taking anything away', () => {
    expect(hasLook(emptyShop(), friend, 'teal', 'wear:scarf')).toBe(true);
    expect(hasLook(emptyShop(), friend, 'teal', 'color:teal')).toBe(true);
    expect(hasLook(emptyShop(), friend, 'teal', 'wear:crown')).toBe(false);
    expect(hasLook(emptyShop(), friend, 'teal', 'color:pink')).toBe(false);
    expect(hasLook({ owned: ['color:pink'] }, friend, 'teal', 'color:pink')).toBe(true);
  });

  it('repairs a damaged save: known ids, each once', () => {
    expect(cleanShop(undefined)).toEqual(emptyShop());
    expect(cleanShop({ owned: 'crown' })).toEqual(emptyShop());
    expect(cleanShop({ owned: ['wear:crown', 'wear:crown', 'wear:cape', 7, 'color:lilac'] })).toEqual({
      owned: ['wear:crown', 'color:lilac'],
    });
    expect(defaults().shop).toEqual(emptyShop());
    expect(migrate({ ...defaults(), shop: { owned: ['color:red', 'nope'] } }).shop).toEqual({
      owned: ['color:red'],
    });
  });
  it("sells a friend's looks to grown-ups only: a school-age friend has them all in Dress", () => {
    expect(sellsLooks('grownup')).toBe(true);
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as Band[])
      expect(sellsLooks(band)).toBe(false);
    expect(buy(emptyShop(), { ...emptyShells(), balance: 500 }, 'wear:scarf', 'school')).toEqual({
      refused: 'band',
    });
  });
});
