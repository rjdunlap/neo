import { describe, expect, it } from 'vitest';
import { RAINBOW } from '../../art/palette';
import { FRIENDS } from '../../games/bubble-pop/logic';
import { FAVORITE, FIRST_ANIMALS } from '../../games/animal-snack/logic';
import { STICKER_ANIMALS } from '../../games/peekaboo-barn/logic';
import { PT_PT, WORD_KEYS, wordKey } from './pt-PT';

describe('the European Portuguese pilot words (WL2)', () => {
  it('has exactly the 20 keys, each with a nonempty entry', () => {
    expect(WORD_KEYS).toHaveLength(20);
    expect(new Set(WORD_KEYS).size).toBe(20);
    expect(Object.keys(PT_PT).sort()).toEqual([...WORD_KEYS].sort());
    for (const key of WORD_KEYS) expect(PT_PT[key].trim()).not.toBe('');
  });

  it("covers the three hosts' first seven animals, their snacks and all six colours", () => {
    const seven = [...STICKER_ANIMALS].sort();
    expect([...FRIENDS].sort()).toEqual(seven);
    expect([...FIRST_ANIMALS].sort()).toEqual(seven);
    for (const a of seven) {
      expect(wordKey('animal', a)).toBe(`animal.${a}`);
      expect(wordKey('food', FAVORITE[a]!)).toBe(`food.${FAVORITE[a]}`);
    }
    for (const c of RAINBOW) expect(wordKey('color', c)).toBe(`color.${c}`);
    const used = new Set([
      ...seven.map((a) => wordKey('animal', a)),
      ...seven.map((a) => wordKey('food', FAVORITE[a]!)),
      ...RAINBOW.map((c) => wordKey('color', c)),
    ]);
    expect(used.size).toBe(20);
  });

  it('has no word for the later animals and snacks, which stay English', () => {
    for (const a of ['sheep', 'horse', 'hen', 'mouse']) expect(wordKey('animal', a)).toBeNull();
    for (const f of ['oats', 'corn', 'grain']) expect(wordKey('food', f)).toBeNull();
    expect(wordKey('color', 'pink')).toBeNull();
  });
});
