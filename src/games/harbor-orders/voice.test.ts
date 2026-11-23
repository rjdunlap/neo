import { describe, expect, it } from 'vitest';
import type { Hint, Send } from './logic';
import { VOICE } from './voice';
import clips from '../../content/voice-clips.json';

describe('Harbor Orders voice', () => {
  it('names every supported kind of fault or hint', () => {
    const outcomes: Record<Hint['kind'] | Exclude<Send['kind'], 'ready'>, true> = {
      short: true,
      spare: true,
      add: true,
      remove: true,
      send: true,
      row: true,
    };
    for (const kind of Object.keys(outcomes)) expect(VOICE).toHaveProperty([`harbor-orders.${kind}`]);
  });

  it.each(Object.keys(VOICE))('precaches the recorded wording for %s', (id) => {
    for (const line of VOICE[id as keyof typeof VOICE])
      expect((clips.clips as Record<string, string>)[line]).toMatch(/^[a-f0-9]+$/);
  });
});
