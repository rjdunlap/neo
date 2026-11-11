import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide matching snowballs together until the snowfield holds what the round asks for.',
  steps: [
    'Tap an arrow to slide every snowball toward that edge. Equal neighbours join into their doubled number.',
    { text: 'Each snowball joins at most once per slide. No new snowballs arrive.', to: 4 },
    {
      text: 'The ice rock never moves and never joins. Snowballs stop beside it, so choose which side of the rock a pair meets on.',
      from: 5,
      to: 5,
    },
    {
      text: 'Finish with exactly three snowballs, each a 16. Two 16s that meet join, so keep them apart.',
      from: 6,
    },
    'Undo takes back a slide. Start over restores the same starting snowfield.',
    'Hint outlines an arrow on a finishing route, or Undo at a dead end. Two still arrows in a row, or a dead end, light it on their own.',
  ],
  finish: [
    {
      text: 'The round ends at one snowball with the target number; the shortest route then shows beside your slides.',
      to: 5,
    },
    {
      text: 'The round ends when only three 16s are left: they stack into a snowman.',
      from: 6,
    },
  ],
  note: 'There is no clock or loss screen. Exploration and Undo count no misses; Hint, a glow that lights on its own and Start over count as help. An arrow that changes nothing adds no slide.',
};
