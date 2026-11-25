import type { LineId } from './voice-script';
import type { MelodyStep } from './world';

/**
 * The Missing Melody, the third Island Errands story, for the preschool band on Bumpy Hills. Wren, a small songbird
 * who sings the morning song, wakes with it gone quiet and asks for three jobs, in any order, each an ordinary round
 * of a game she knows:
 *
 * - **notes**, Song Maker 4: copy a short song by tapping its faint shadows.
 * - **highlow**, Sound Garden 2: hear a sound and say whether the bird or the frog sang it.
 * - **friends**, Sing-Along Barn 3: choose two friends to join the song.
 *
 * Finishing a round completes its step whatever its misses and hints. The round's result carries only misses and
 * hints, so each consequence on the hilltop is a fixed picture, and the ending plays the stated `MORNING_SONG`, not
 * her tune. Every level is in its game's `preschool` range (a test reads the game's own levels).
 * Voice lines carry her name so they stay on device speech until a clip pass renders them.
 */
export interface MelodyGameStep {
  id: MelodyStep;
  game: string;
  level: number;
}

export const MELODY_GAME_STEPS: MelodyGameStep[] = [
  { id: 'notes', game: 'song-maker', level: 4 },
  { id: 'highlow', game: 'sound-garden', level: 2 },
  { id: 'friends', game: 'sing-along-barn', level: 3 },
];

/** The band the story belongs to; its spot is only on that band's home spot, Bumpy Hills. */
export const MELODY_BAND = 'preschool' as const;

export const melodyLine: Record<MelodyStep, { ask: LineId; done: LineId; recap: LineId }> = {
  notes: { ask: 'melody.notes', done: 'melody.notes-done', recap: 'melody.notes-recap' },
  highlow: { ask: 'melody.highlow', done: 'melody.highlow-done', recap: 'melody.highlow-recap' },
  friends: { ask: 'melody.friends', done: 'melody.friends-done', recap: 'melody.friends-recap' },
};

/** The morning song's five notes, low to high, as steps up the pentatonic scale (`src/audio/notes.ts`, C5 to A5). One flower lights per note. */
export const MORNING_SONG = [5, 6, 7, 8, 9] as const;
