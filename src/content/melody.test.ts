import { describe, expect, it } from 'vitest';
import { stepHz } from '../audio/notes';
import { gameById } from '../games/registry';
import { playBand } from '../progress/bands';
import { libraryBooks } from './library';
import { MELODY_BAND, MELODY_GAME_STEPS, melodyLine, MORNING_SONG } from './melody';
import { SCRIPT } from './voice-script';
import { MELODY_STEPS } from './world';

describe('The Missing Melody', () => {
  it('plays each step inside its game preschool range, at the level the story names', () => {
    for (const step of MELODY_GAME_STEPS) {
      const mod = gameById(step.game)!;
      expect(mod, step.game).toBeDefined();
      // The game has the preschool band itself, and its current preschool range holds the story level, so a later range change fails here.
      expect(playBand(mod.bands, MELODY_BAND)).toBe('preschool');
      const range = mod.levels('preschool');
      expect(step.level, step.id).toBeGreaterThanOrEqual(range.min);
      expect(step.level, step.id).toBeLessThanOrEqual(range.max);
    }
    // The levels mean what the story says: a shown song copied, high or low, two friends to join.
    const names = Object.fromEntries(
      MELODY_GAME_STEPS.map((s) => [s.id, gameById(s.game)!.describeLevel(s.level)]),
    );
    expect(names.notes).toMatch(/cop|shadow|song|tune/i);
    expect(names.highlow).toMatch(/high|low/i);
    expect(names.friends).toMatch(/friend|verse|sing/i);
  });

  it('has a game for every step, and speaks every request, its change and its recap with her name', () => {
    expect(MELODY_GAME_STEPS.map((s) => s.id)).toEqual([...MELODY_STEPS]);
    for (const id of MELODY_STEPS)
      for (const line of Object.values(melodyLine[id])) {
        expect(SCRIPT[line], line).toBeDefined();
        // A slotted line stays on device speech until a clip pass renders it.
        for (const text of SCRIPT[line]) expect(text, line).toContain('{name}');
      }
    for (const line of [
      'melody.spot',
      'melody.hello',
      'melody.back',
      'melody.next',
      'melody.ready',
      'melody.keepsake',
      'melody.thanks',
      'melody.card',
      'melody.again',
    ] as const)
      for (const text of SCRIPT[line]) expect(text, line).toContain('{name}');
  });

  it('sings a stated morning song of five rising pentatonic notes', () => {
    expect(MORNING_SONG).toHaveLength(5);
    for (const n of MORNING_SONG) expect(Number.isInteger(n) && Number.isFinite(stepHz(n))).toBe(true);
    for (let i = 1; i < MORNING_SONG.length; i++)
      expect(MORNING_SONG[i]).toBeGreaterThan(MORNING_SONG[i - 1]);
  });

  it('shows its library book only at the preschool band', () => {
    expect(libraryBooks('preschool')).toContain('melody');
    for (const band of ['lap', 'toddler', 'prek', 'school', 'grownup'] as const)
      expect(libraryBooks(band)).not.toContain('melody');
  });
});
