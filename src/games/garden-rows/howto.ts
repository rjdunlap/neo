import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Plant a flower bed so no flower repeats in a row, or in a column.',
  steps: [
    'Tap a flower packet to choose it, then tap an empty spot to plant it.',
    'Tap a flower you planted to take it out again.',
    { to: 1, text: 'Each row needs one of every flower.' },
    { from: 2, to: 9, text: 'Each row and each column needs one of every flower.' },
    {
      from: 10,
      to: 10,
      text: 'The bed is one row of three spots, with one spot empty. Plant the flower the row is missing; then the next bed has a different spot empty.',
    },
    {
      from: 8,
      to: 9,
      text: 'Hedges split the bed into four boxes of four spots, and each hedge box needs one of every flower too.',
    },
    {
      from: 7,
      to: 7,
      text: 'The bed starts full, but two flowers in one row have swapped places, so two columns each have a repeat. Tap them to lift them out, then plant them back where they belong.',
    },
  ],
  finish: 'The round ends when every bed is full and right.',
  note: [
    {
      to: 6,
      text: 'A flower that repeats in a row or column will not stay. Every bed has exactly one way to finish it, and the glowing spot is a hint.',
    },
    {
      from: 7,
      to: 7,
      text: 'Lifting a flower is free; a replanted flower that repeats in a row or column will not stay. Any bed with no repeat counts, and the glowing flower is a hint.',
    },
    {
      from: 8,
      to: 9,
      text: 'A flower that repeats in a row, a column or a hedge box will not stay. Every bed has exactly one way to finish it, and the glowing spot is a hint.',
    },
    {
      from: 10,
      to: 10,
      text: 'A flower already in the row will not stay. Only one flower fits, and after two tries the glowing spot and packet show it.',
    },
  ],
};
