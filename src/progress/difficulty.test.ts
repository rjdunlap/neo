import { describe, expect, it } from 'vitest';
import { nextLevel, nextLevelOffer, stepLevel } from './difficulty';
import type { RoundRecord } from './save';

const round = (level: number, misses: number, hints = 0): RoundRecord => ({ level, misses, hints, seconds: 60, at: 0 });
const range = { min: 1, max: 6 };

describe('stepLevel', () => {
  it('moves one level at a time and stops at the ends of the band', () => {
    expect(stepLevel(3, 1, range)).toBe(4);
    expect(stepLevel(3, -1, range)).toBe(2);
    expect(stepLevel(6, 1, range)).toBe(6);
    expect(stepLevel(1, -1, range)).toBe(1);
    expect(stepLevel(4, -1, { min: 4, max: 9 })).toBe(4);
  });
});

describe('nextLevel', () => {
  it('steps up after two smooth rounds at the current level', () => {
    expect(nextLevel(2, [round(2, 0), round(2, 1)], range)).toBe(3);
  });

  it('needs two rounds at the new level before moving again', () => {
    expect(nextLevel(3, [round(2, 0), round(3, 0)], range)).toBe(3);
  });

  it('steps down after two struggling rounds', () => {
    expect(nextLevel(3, [round(3, 5), round(3, 0, 2)], range)).toBe(2);
  });

  it('holds steady on mixed rounds', () => {
    expect(nextLevel(3, [round(3, 0), round(3, 3)], range)).toBe(3);
  });

  it('stays inside the age band range', () => {
    expect(nextLevel(6, [round(6, 0), round(6, 0)], range)).toBe(6);
    expect(nextLevel(1, [round(1, 9), round(1, 9)], range)).toBe(1);
    expect(nextLevel(9, [], range)).toBe(6);
    expect(nextLevel(1, [], { min: 4, max: 9 })).toBe(4);
  });
});

describe('nextLevelOffer', () => {
  const range = { min: 2, max: 5 };
  it('offers the level above the one just played', () => {
    expect(nextLevelOffer(3, 3, range)).toBe(4);
    expect(nextLevelOffer(2, 2, range)).toBe(3);
  });
  it('offers nothing at the top of the range', () => {
    expect(nextLevelOffer(5, 5, range)).toBeNull();
  });
  it('offers nothing when "again" already goes there, so the two buttons never repeat each other', () => {
    expect(nextLevelOffer(3, 4, range)).toBeNull();
  });
  it('still offers a step up after a struggle stepped her saved level down', () => {
    expect(nextLevelOffer(4, 3, range)).toBe(5);
  });
});
