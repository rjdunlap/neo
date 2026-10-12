import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { LETTERS } from './strokes';
import { WORDS } from './pictures';
import { LEVELS, PLANS, SHORT_WORDS, offTrail, stickerLetter, trailLevel, trailTolerance, trailWord } from './logic';

describe('Letter Trails plans', () => {
  it('keeps each band inside the authored ladder and every pool traceable', () => {
    for (const range of Object.values(LEVELS)) {
      expect(range!.min).toBeGreaterThanOrEqual(1);
      expect(range!.max).toBeLessThanOrEqual(PLANS.length);
    }
    for (let level = 1; level <= PLANS.length; level++) for (let seed = 0; seed < 100; seed++) {
      const word = trailWord(level, 'Zoë-Rose', new Rng(seed));
      expect(word.length).toBeGreaterThan(0);
      for (const letter of word) { expect(LETTERS[letter]).toBeTruthy(); expect(WORDS[letter]).toBeTruthy(); }
      if (level <= 6) expect(PLANS[level - 1].letters).toContain(word);
      if (level === 7) expect(SHORT_WORDS).toContain(word);
      if (level === 8) expect(word).toBe('ZOEROSE');
      expect(word).toBe(trailWord(level, 'Zoë-Rose', new Rng(seed)));
    }
  });
  it('uses the plan cap and preserves the easier early-level corridor', () => {
    expect(trailLevel(0)).toBe(1); expect(trailLevel(100)).toBe(PLANS.length);
    expect(trailWord(100, 'Mia', new Rng(2))).toBe('MIA');
    for (let level = 1; level <= PLANS.length; level++) expect(trailTolerance(level)).toBe(level <= 2 ? 0.095 : 0.075);
  });
  it('accepts a retraced upright at the exact corridor boundary after transform round-off', () => {
    expect(offTrail([0.15000000000000008, 1], [0.15, 0.85], 0.075)).toBe(false);
    expect(offTrail([0.15, 1], [0.15, 0.84], 0.075)).toBe(true);
  });
  it('pins historical sticker pictures independently of future letter pools', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(stickerLetter(seed)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[seed % 26]);
      expect(stickerLetter(-seed - 0.8)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[seed % 26]);
    }
  });
});
