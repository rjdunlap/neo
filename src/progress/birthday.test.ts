import { describe, expect, it } from 'vitest';
import { birthdayDue, settleWorldBand, type Band } from './bands';

describe('the birthday rule (map and Home)', () => {
  it('is due once when her band goes up, never for a new player or a band moved down', () => {
    const world: { band: Band | null } = { band: null };
    expect(birthdayDue(world, 'lap')).toBe(false);
    settleWorldBand(world, 'lap');
    expect(world.band).toBe('lap');
    expect(birthdayDue(world, 'lap')).toBe(false);
    expect(birthdayDue(world, 'toddler')).toBe(true);
    settleWorldBand(world, 'toddler');
    expect(birthdayDue(world, 'toddler')).toBe(false);
    // A grown-up moving her back down throws nothing and keeps the world's band.
    expect(birthdayDue(world, 'lap')).toBe(false);
    settleWorldBand(world, 'lap');
    expect(world.band).toBe('toddler');
  });
});
