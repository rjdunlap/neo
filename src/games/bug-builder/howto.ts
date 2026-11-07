import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Decorate a bug so it matches.',
  steps: [
    { to: 2, text: 'Drag a shape or a color onto a spot on the bug.' },
    { from: 3, to: 4, text: 'Look at the model bug, then drag the same shapes and colors onto the same spots.' },
    { from: 5, text: 'Look at one wing, then drag matching shapes and colors across onto the other wing, like a mirror.' },
    { from: 5, to: 7, text: 'When the wings match, watch them fold across the middle and open together.' },
  ],
  finish: 'The round ends when the bug matches what was asked for.',
};
