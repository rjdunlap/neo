import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../content/voice-script';
import { couchGameById as gameById } from '../games/registry';
import { COUCH_INFO, couchLine } from './catalog';
import { COUCH_IDS } from './party';

describe('couch catalog', () => {
  it('explains every couch game with speakable lines, at a level the game really offers', () => {
    expect(Object.keys(COUCH_INFO).sort()).toEqual([...COUCH_IDS].sort());
    for (const id of COUCH_IDS) {
      const mod = gameById(id)!, info = COUCH_INFO[id];
      // One variant, so the text on screen is exactly what is spoken.
      expect(SCRIPT[info.goal], id).toHaveLength(1);
      expect(info.controls.length, id).toBeGreaterThan(0);
      for (const row of info.controls) {
        expect(row.parts.length).toBeGreaterThan(0);
        expect(row.text.length).toBeGreaterThan(0);
      }
      expect(mod.bands, id).toContain(info.band);
      const { min, max } = mod.levels(info.band);
      expect(info.demoLevel, id).toBeGreaterThanOrEqual(min);
      expect(info.demoLevel, id).toBeLessThanOrEqual(max);
      // Every stop of a trip plays a level the game really has.
      for (let stop = 0; stop < 6; stop++) {
        expect(info.level(stop), `${id} stop ${stop}`).toBeGreaterThanOrEqual(min);
        expect(info.level(stop), `${id} stop ${stop}`).toBeLessThanOrEqual(max);
      }
      // A face-off that compares scores says how.
      if (info.faceoff !== 'team') expect(info.score, id).toBeDefined();
    }
  });

  it('swaps touch wording for controller wording only where a replacement exists', () => {
    for (const id of COUCH_IDS) {
      for (const [original, replacement] of Object.entries(COUCH_INFO[id].lines ?? {})) {
        expect(SCRIPT, original).toHaveProperty(original);
        expect(SCRIPT, String(replacement)).toHaveProperty(String(replacement));
        expect(SCRIPT[replacement as keyof typeof SCRIPT], String(replacement)).toHaveLength(1);
      }
    }
    expect(couchLine('penguin-slide', 'slide.go')).toBe('couch.slide.go');
    expect(couchLine('penguin-slide', 'slide.yum')).toBe('slide.yum');
    expect(couchLine('bounce-back', 'slide.go')).toBe('slide.go');
  });
});
