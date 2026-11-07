import { describe, expect, it } from 'vitest';
// @ts-expect-error: a plain Node script with no type declarations.
import { barrels, gamesWith } from '../../scripts/content-barrels.mjs';
import { GAMES } from '../games/registry';
import { HOW_TO } from './howto';
import { SCRIPT, SHARED } from './voice-script';

const voices = import.meta.glob<{ VOICE: Record<string, string[]> }>('../games/*/voice.ts', { eager: true });

describe('per-game voice lines and how-to cards', () => {
  it('are gathered by current blocks (node scripts/content-barrels.mjs rewrites them)', () => {
    for (const b of barrels() as { path: string; stale: boolean }[]) expect(b.stale, `${b.path} is stale`).toBe(false);
  });

  it('give every registered game a folder with its own voice.ts and howto.ts', () => {
    const withVoice = new Set(gamesWith('voice.ts')), withCard = new Set(gamesWith('howto.ts'));
    for (const g of GAMES) {
      expect(withVoice.has(g.id), `${g.id}/voice.ts`).toBe(true);
      expect(withCard.has(g.id), `${g.id}/howto.ts`).toBe(true);
    }
    expect(Object.keys(HOW_TO).sort()).toEqual([...withCard].sort());
  });

  it('never define a line twice, since a later spread would silently replace it', () => {
    const owner = new Map<string, string>(Object.keys(SHARED).map((k) => [k, 'voice-script.ts']));
    for (const [path, mod] of Object.entries(voices)) {
      for (const k of Object.keys(mod.VOICE)) {
        expect(owner.get(k), `${k} is in ${path} and ${owner.get(k)}`).toBeUndefined();
        owner.set(k, path);
      }
    }
    expect(owner.size).toBe(Object.keys(SCRIPT).length);
  });
});
