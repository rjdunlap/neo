import { describe, expect, it } from 'vitest';
import type { Band } from '../progress/bands';
import { defaults, migrate } from '../progress/save';
import { claimGift, cleanGift, DAILY_GIFT, emptyGift } from './gift';
import { emptyShells } from './shells';

describe('the daily gift', () => {
  it('arrives once a day for a grown-up and never stacks', () => {
    const a = claimGift(emptyGift(), emptyShells(), '2026-11-28', 'grownup');
    expect(a.amount).toBe(DAILY_GIFT);
    expect(a.shells.balance).toBe(DAILY_GIFT);
    expect(claimGift(a.gift, a.shells, '2026-11-28', 'grownup').amount).toBe(0);
    // Days away bring one gift, not one per day missed.
    const b = claimGift(a.gift, a.shells, '2026-12-05', 'grownup');
    expect(b.amount).toBe(DAILY_GIFT);
    expect(b.shells.balance).toBe(2 * DAILY_GIFT);
  });

  it('gives a child nothing', () => {
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as Band[])
      expect(claimGift(emptyGift(), emptyShells(), '2026-11-28', band).amount).toBe(0);
  });

  it('repairs a damaged save', () => {
    expect(cleanGift(null)).toEqual(emptyGift());
    expect(cleanGift({ day: 'today' })).toEqual(emptyGift());
    expect(cleanGift({ day: '2026-11-28' })).toEqual({ day: '2026-11-28' });
    expect(defaults().gift).toEqual(emptyGift());
    expect(migrate({ ...defaults(), gift: { day: 4 } }).gift).toEqual(emptyGift());
  });
});
