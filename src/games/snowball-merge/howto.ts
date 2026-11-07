import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide matching snowballs together until one reaches the target number.',
  steps: [
    'Tap an arrow to slide every snowball toward that edge. Equal neighbours join into their doubled number.',
    'Each snowball joins at most once per slide. No new snowballs arrive.',
    'Undo takes back a slide. Start over restores the same starting snowfield.',
    'Hint outlines an arrow on a finishing route, or Undo if your choices need revision.',
  ],
  finish: 'The round ends when the snowfield holds one snowball with the target number.',
  note: 'There is no clock or loss screen. Exploration and Undo count no misses; Hint and Start over count as help. An arrow that changes nothing adds no slide.',
};
