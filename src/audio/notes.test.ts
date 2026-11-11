import { describe, expect, it } from 'vitest';
import { midiToHz, PITCH_COLORS, pitchColor, stepFromUnit, stepToMidi } from './notes';

const READERS = import.meta.glob<string>(
  ['../games/jelly-drums/index.ts', '../games/song-maker/index.ts', '../ui/creation-art.ts'],
  { query: '?raw', import: 'default', eager: true },
);

describe('pentatonic steps', () => {
  it('walks C D E G A up from middle C', () => {
    expect([0, 1, 2, 3, 4, 5].map(stepToMidi)).toEqual([60, 62, 64, 67, 69, 72]);
  });

  it('goes below middle C for negative steps', () => {
    expect(stepToMidi(-1)).toBe(57);
    expect(stepToMidi(-5)).toBe(48);
  });

  it('tunes A4 to 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(stepToMidi(4))).toBeCloseTo(440);
  });

  it('maps a unit range onto steps and clamps the ends', () => {
    expect(stepFromUnit(0, 3, 10)).toBe(3);
    expect(stepFromUnit(0.999, 3, 10)).toBe(12);
    expect(stepFromUnit(1.5, 3, 10)).toBe(12);
    expect(stepFromUnit(-1, 3, 10)).toBe(3);
  });
});

describe('one rainbow, one direction', () => {
  it('runs red for the lowest pitch to blue for the highest', () => {
    expect(PITCH_COLORS).toEqual(['red', 'orange', 'yellow', 'green', 'blue']);
    expect(PITCH_COLORS.map((_, i) => pitchColor(i))).toEqual(PITCH_COLORS);
  });

  it('keeps red lowest and blue highest for three, four and five pitches, never stepping back', () => {
    for (const count of [3, 4, 5]) {
      const colors = Array.from({ length: count }, (_, rank) => pitchColor(rank, count));
      expect(colors[0]).toBe('red');
      expect(colors[count - 1]).toBe('blue');
      const at = colors.map((c) => PITCH_COLORS.indexOf(c));
      expect(new Set(at).size).toBe(count);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
    }
    expect([0, 1, 2].map((rank) => pitchColor(rank, 3))).toEqual(['red', 'yellow', 'blue']);
  });

  it('clamps a rank outside the range and survives a single pitch', () => {
    expect(pitchColor(-1, 5)).toBe('red');
    expect(pitchColor(9, 5)).toBe('blue');
    expect(pitchColor(0, 1)).toBe('red');
  });

  // The music games and the tune plaque must not keep a rainbow of their own: that is how red came to mean the low
  // note in one game and the high note in another.
  it('finds the two games and the plaque', () => {
    expect(Object.keys(READERS)).toHaveLength(3);
  });

  it.each(Object.entries(READERS))('%s reads its pitch colours from here', (_path, source) => {
    expect(source).toMatch(/import \{[^}]*\bpitchColor\b[^}]*\} from '(\.\.\/)+audio\/notes'/);
    expect(source).not.toMatch(/\[\s*'(red|pink)',\s*'orange',\s*'yellow'/);
    expect(source).not.toMatch(/'blue',\s*'green',\s*'yellow'/);
  });
});
