import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { stepHz } from '../../audio/notes';
import {
  cloudBag,
  nearestPad,
  notchesReached,
  notchPull,
  notchStep,
  padAt,
  padHit,
  PADS,
  reach,
  SKIES,
  skyIndex,
} from './logic';

describe('Bouncy Launch notches, notes and bag', () => {
  it('puts five notches on the spring, each landing on its own cloud', () => {
    expect(Array.from({ length: PADS }, (_, i) => Math.round(notchPull(i)))).toEqual([44, 72, 100, 128, 156]);
    for (let i = 0; i < PADS; i++) {
      expect(padHit(reach(notchPull(i)))).toBe(i);
      expect(nearestPad(reach(notchPull(i)))).toBe(i);
    }
  });

  it('counts notches reached as the pull grows, never going back down as it rises', () => {
    expect(notchesReached(0)).toBe(0);
    expect(notchesReached(43)).toBe(0);
    expect(notchesReached(notchPull(0))).toBe(1);
    expect(notchesReached(notchPull(4))).toBe(PADS);
    let last = 0;
    for (let p = 0; p <= 200; p++) {
      const n = notchesReached(p);
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
  });

  it('gives every landing a rising note: the same step for a cloud and its notch', () => {
    const hz = Array.from({ length: PADS }, (_, i) => stepHz(notchStep(i)));
    expect([...hz].sort((a, b) => a - b)).toEqual(hz);
    expect(new Set(hz).size).toBe(PADS);
    expect(nearestPad(-0.2)).toBe(0);
    expect(nearestPad(1.3)).toBe(PADS - 1);
    expect(nearestPad(padAt(2) + 0.05)).toBe(2);
  });

  it('visits the five clouds once each in a seeded round of five taps', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const bag = cloudBag(new Rng(seed));
      expect(bag).toHaveLength(PADS);
      expect([...bag].sort()).toEqual([0, 1, 2, 3, 4]);
      expect(cloudBag(new Rng(seed))).toEqual(bag);
    }
  });

  it('refills the bag without repeating a cloud back to back', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const bag = cloudBag(new Rng(seed), 12);
      expect(bag).toHaveLength(12);
      bag.forEach((c, i) => i && expect(c).not.toBe(bag[i - 1]));
    }
  });

  it('draws one of four distinct skies from the seed', () => {
    expect(new Set(SKIES.map((s) => s.sky[0])).size).toBe(4);
    const seen = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) {
      const i = skyIndex(new Rng(seed));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(SKIES.length);
      seen.add(i);
    }
    expect(seen.size).toBe(4);
  });
});
