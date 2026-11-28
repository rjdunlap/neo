import { describe, expect, it } from 'vitest';
import { PIECE_AT } from '../art/lodge';
import type { Band } from '../progress/bands';
import { defaults, migrate } from '../progress/save';
import { emptyShells } from './shells';
import { build, canBuild, cleanLodge, emptyLodge, LODGE_PIECES, LODGE_TOTAL, PIECES } from './lodge';

const rich = (balance: number) => ({ ...emptyShells(), balance });

describe('Lantern Lodge', () => {
  it('names and prices every piece, each resting on a piece listed before it, and places it in the picture', () => {
    for (const p of LODGE_PIECES) {
      expect(PIECES[p].name).toMatch(/^[A-Z]/);
      expect(PIECES[p].price).toBeGreaterThan(0);
      const n = PIECES[p].needs;
      if (n) expect(LODGE_PIECES.indexOf(n)).toBeLessThan(LODGE_PIECES.indexOf(p));
      const at = PIECE_AT[p];
      expect(at.x - at.w / 2).toBeGreaterThanOrEqual(0);
      expect(at.x + at.w / 2).toBeLessThanOrEqual(1200);
    }
    expect(LODGE_TOTAL).toBe(LODGE_PIECES.reduce((n, p) => n + PIECES[p].price, 0));
  });

  it('builds a piece once its support is built, paying its price', () => {
    expect(canBuild(emptyLodge(), 'roof')).toBe(false);
    expect(build(emptyLodge(), rich(999), 'roof', 'grownup')).toEqual({ refused: 'needs' });
    const a = build(emptyLodge(), rich(300), 'foundation', 'grownup');
    if ('refused' in a) throw new Error(a.refused);
    expect(a.shells.balance).toBe(220);
    const b = build(a.lodge, a.shells, 'walls', 'grownup');
    if ('refused' in b) throw new Error(b.refused);
    expect(b.lodge.built).toEqual(['foundation', 'walls']);
    expect(b.shells.balance).toBe(70);
    expect(build(b.lodge, b.shells, 'roof', 'grownup')).toEqual({ refused: 'short' });
    expect(build(b.lodge, rich(999), 'walls', 'grownup')).toEqual({ refused: 'built' });
    expect(build(b.lodge, rich(999), 'tower', 'grownup')).toEqual({ refused: 'unknown' });
  });

  it('builds nothing for a child', () => {
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as Band[])
      expect(build(emptyLodge(), rich(999), 'dock', band)).toEqual({ refused: 'band' });
  });

  it('repairs a damaged save: known pieces once, each with its supports', () => {
    expect(cleanLodge(null)).toEqual(emptyLodge());
    expect(cleanLodge({ built: ['roof', 'walls', 'dock', 'dock', 'tower', 3] })).toEqual({ built: ['dock'] });
    expect(cleanLodge({ built: ['roof', 'walls', 'foundation'] })).toEqual({
      built: ['roof', 'walls', 'foundation'],
    });
    expect(defaults().lodge).toEqual(emptyLodge());
    expect(migrate({ ...defaults(), lodge: { built: ['chimney'] } }).lodge).toEqual(emptyLodge());
  });
});
