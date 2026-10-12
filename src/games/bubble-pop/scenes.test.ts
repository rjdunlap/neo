import { describe, expect, it } from 'vitest';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { backgroundsOf, bubbleOver, colorGap, LOOKS, SCENES, sceneFor } from './scenes';

describe('Bubble Pop scenes', () => {
  it('draws each of the four from the seeded RNG, the same one for the same seed', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const scene = sceneFor(new Rng(seed));
      expect(sceneFor(new Rng(seed))).toBe(scene);
      seen.add(scene);
    }
    expect([...seen].sort()).toEqual([...SCENES].sort());
    // The shore comes first and stays as it was: the sticker and map icon are drawn on it.
    expect(SCENES[0]).toBe('shore');
    expect(LOOKS.shore.rim).toBe(0x8fd0ff);
  });

  it('keeps every colored bubble plainly different from everything it can float over, in every scene', () => {
    // The shore\'s weakest pair (a blue bubble on the sky) is the floor; no new scene is worse than a plain-different pair.
    for (const scene of SCENES) {
      for (const bg of backgroundsOf(LOOKS[scene])) {
        for (const color of RAINBOW) expect(colorGap(bubbleOver(color, bg), bg), `${scene} ${color} over ${bg.toString(16)}`).toBeGreaterThanOrEqual(18);
      }
    }
  });

  it('gives a plain bubble a rim that shows in the new scenes', () => {
    for (const scene of SCENES.filter((s) => s !== 'shore')) {
      for (const bg of backgroundsOf(LOOKS[scene])) expect(colorGap(LOOKS[scene].rim, bg), `${scene} over ${bg.toString(16)}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('puts the horizon low enough to leave room for the bubbles, and the sun only on the shore', () => {
    for (const scene of SCENES) {
      expect(LOOKS[scene].horizon).toBeGreaterThanOrEqual(0.78);
      expect(LOOKS[scene].horizon).toBeLessThanOrEqual(0.9);
      expect(LOOKS[scene].sun).toBe(scene === 'shore');
    }
  });
});
