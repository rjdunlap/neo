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
