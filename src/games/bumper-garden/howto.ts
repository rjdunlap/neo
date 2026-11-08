import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Bump the ladybug into flowers so they bloom.',
  steps: [
    { to: 1, text: 'Tap to send the ladybug up.' },
    { from: 2, text: 'Tap the left or right side of the screen to flip the ladybug back up.' },
    { from: 3, to: 3, text: 'Bump the flowers of the color asked for.' },
    {
      from: 8,
      to: 8,
      text: 'Bump every flower that is not the color asked for. The flowers of that color fall asleep; bumping one only chimes.',
    },
    { from: 4, to: 5, text: 'Bump the numbered flowers in order.' },
    {
      from: 6,
      to: 6,
      text: 'Start at the highlighted number in the strip. Bump each numbered flower to count on by one.',
    },
    {
      from: 9,
      to: 9,
      text: 'Start at the highlighted number in the strip. Bump each numbered flower to count back by one to 1.',
    },
  ],
  finish: [
    { from: 1, to: 1, text: 'The round ends after six launches.' },
    { from: 2, to: 2, text: 'The round ends when every flower has bloomed.' },
    { from: 3, to: 3, text: 'The round ends when all the flowers of that color have bloomed.' },
    { from: 4, to: 6, text: 'The round ends when the last numbered flower has bloomed.' },
    { from: 8, to: 8, text: 'The round ends when every awake flower has bloomed.' },
    { from: 9, to: 9, text: 'The round ends when flower 1 blooms, after all the numbers before it.' },
  ],
  note: [
    {
      text: 'Each round has a Meadow, Pond or Hive table. Lily pads and hexagonal flowers bloom by the same rule.',
    },
    {
      from: 2,
      to: 6,
      text: 'A pulsing ring at a flipper tip shows when the falling ladybug is close enough to flip.',
    },
    {
      from: 8,
      to: 9,
      text: 'A pulsing ring at a flipper tip shows when the falling ladybug is close enough to flip.',
    },
  ],
};
