import type { ColorName } from '../art/palette';

/** The major pentatonic scale: any of its notes sound good together, so every tap is musical. */
export const PENTATONIC = [0, 2, 4, 7, 9];
export const MIDDLE_C = 60;

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Scale steps count up the pentatonic from middle C: 0 = C4, 4 = A4, 5 = C5, -1 = A3. */
export function stepToMidi(step: number): number {
  const octave = Math.floor(step / 5);
  const degree = ((step % 5) + 5) % 5;
  return MIDDLE_C + 12 * octave + PENTATONIC[degree];
}

export function stepHz(step: number): number {
  return midiToHz(stepToMidi(step));
}

/** Maps a 0..1 position (say, a finger's height) onto `count` scale steps starting at `from`. */
export function stepFromUnit(u: number, from: number, count: number): number {
  return from + Math.min(count - 1, Math.max(0, Math.floor(u * count)));
}

/**
 * One rainbow, one direction: wherever a game colours its notes by pitch, red is the lowest and blue the highest, so a
 * colour she learns in one music game means the same in the next. Jelly Drums' five jellies are these in order (steps 0
 * to 4); Song Maker's rows and the treehouse's tune plaque read them from the bottom row up.
 */
export const PITCH_COLORS: readonly ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue'];

/**
 * The colour of the `rank`-th lowest of `count` pitches (0 is the lowest). Fewer pitches than colours spread across the
 * whole rainbow, so the lowest is always red and the highest always blue: three are red, yellow, blue.
 */
export function pitchColor(rank: number, count: number = PITCH_COLORS.length): ColorName {
  const top = PITCH_COLORS.length - 1;
  const at = count <= 1 ? 0 : Math.round((rank * top) / (count - 1));
  return PITCH_COLORS[Math.min(top, Math.max(0, at))];
}
