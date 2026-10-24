import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../src/content/voice-script.ts';
import { SETTINGS, chosenTexts, clipKey, hasSlot } from './clips.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(readFileSync(`${root}src/content/voice-clips.json`, 'utf8'));
const files = readdirSync(`${root}src/audio/clips`).filter((f) => f.endsWith('.m4a')).map((f) => f.slice(0, -4));
const allTexts = new Set(Object.values(SCRIPT).flat());

describe('rendered voice clips', () => {
  it('were rendered with the pinned settings', () => {
    expect(manifest.settings).toEqual(SETTINGS);
  });

  it('cover every chosen line exactly as the script says it (rerun scripts/voice-clips/render.mjs after changing one)', () => {
    const want = chosenTexts(SCRIPT);
    expect(Object.keys(manifest.clips).sort()).toEqual([...want].sort());
    for (const [text, key] of Object.entries(manifest.clips)) {
      expect(allTexts.has(text), text).toBe(true);
      expect(hasSlot(text), text).toBe(false);
      expect(key, text).toBe(clipKey(text));
    }
  });

  it('ship one file per entry and no orphans', () => {
    expect(files.sort()).toEqual(Object.values(manifest.clips).sort());
  });

  it('leave slotted variants on device speech', () => {
    expect(manifest.clips['Great job, {name}!']).toBeUndefined();
  });
});
