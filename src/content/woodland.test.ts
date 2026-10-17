import { describe, expect, it } from 'vitest';
import { stepHz } from '../audio/notes';
import { gameById } from '../games/registry';
import { playBand } from '../progress/bands';
import { SCRIPT } from './voice-script';
import { PICNIC_BEAT, WOODLAND_BAND, WOODLAND_GAME_STEPS, woodlandLine } from './woodland';
import { WOODLAND_STEPS } from './world';

describe('The Woodland Picnic', () => {
  it('plays each step inside its game school range, at the level the story names', () => {
    for (const step of WOODLAND_GAME_STEPS) {
      const mod = gameById(step.game)!;
      expect(mod, step.game).toBeDefined();
      // The game has the school band itself, and its current school range holds the story level, so a later range change fails here.
      expect(playBand(mod.bands, WOODLAND_BAND)).toBe('school');
      const range = mod.levels('school');
      expect(step.level, step.id).toBeGreaterThanOrEqual(range.min);
      expect(step.level, step.id).toBeLessThanOrEqual(range.max);
    }
    // The levels mean what the story says: the woods map, two identical boxes, a beat copied by ear.
    const names = Object.fromEntries(WOODLAND_GAME_STEPS.map((s) => [s.id, gameById(s.game)!.describeLevel(s.level)]));
    expect(names.invitations).toMatch(/map of Wonder Woods/);
    expect(names.baskets).toMatch(/Two identical boxes/);
    expect(names.beat).toMatch(/by ear/);
  });

  it('has a game for every step, and speaks every request, its change and its recap', () => {
    expect(WOODLAND_GAME_STEPS.map((s) => s.id)).toEqual([...WOODLAND_STEPS]);
    for (const id of WOODLAND_STEPS) for (const line of Object.values(woodlandLine[id])) expect(SCRIPT[line], line).toBeDefined();
    for (const line of ['woodland.spot', 'woodland.hello', 'woodland.back', 'woodland.next', 'woodland.ready', 'woodland.keepsake', 'woodland.thanks', 'woodland.photo', 'woodland.again'] as const) expect(SCRIPT[line], line).toBeDefined();
  });

  it('plays a stated picnic beat of drums and pentatonic bells', () => {
    expect(PICNIC_BEAT).toHaveLength(8);
    const bells = PICNIC_BEAT.filter((h): h is { bell: number } => !!h && 'bell' in h);
    expect(bells.length).toBeGreaterThan(0);
    for (const b of bells) expect(Number.isInteger(b.bell) && Number.isFinite(stepHz(b.bell))).toBe(true);
    expect(PICNIC_BEAT.some((h) => h && 'drum' in h)).toBe(true);
  });
});
