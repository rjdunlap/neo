import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lead Mama Duck so the ducklings follow her to the pond.',
  steps: [
    { to: 1, text: 'Tap the grass to walk Mama Duck; ducklings join her line as she passes them.' },
    {
      from: 2,
      text: 'Tap the grass or lead with a finger to walk Mama Duck; ducklings join her line as she passes them.',
    },
    { from: 3, to: 3, text: 'Bring exactly the number of ducklings asked for to the pond.' },
    { from: 4, to: 4, text: 'Bring only the ducklings of the color asked for to the pond.' },
    { from: 5, to: 5, text: 'Bring exactly the number of ducklings asked for to the pond.' },
    { from: 6, to: 6, text: 'Bring exactly the number of ducklings of the color named to the pond.' },
    {
      from: 7,
      to: 8,
      text: 'Collect ducklings in the color pattern asked for, in order, then bring them to the pond.',
    },
    { from: 9, to: 9, text: 'Repeat a group of two matching colors followed by one different color.' },
    {
      from: 10,
      to: 10,
      text: 'Follow the shown color pattern in order; leave the spare duckling in the meadow.',
    },
    { from: 11, text: 'Repeat a group of one color followed by two matching colors of another.' },
  ],
  finish: 'The round ends when the right ducklings reach the pond.',
};
