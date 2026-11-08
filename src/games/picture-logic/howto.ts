import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fill the squares the numbers allow, and a picture appears.',
  steps: [
    'The numbers beside each row and column say how many squares in a row to fill. Touch a square to fill it, or drag along a row or column.',
    { from: 1, to: 5, text: 'Cross marks an empty square. Fill on a filled square empties it.' },
    { from: 7, to: 7, text: 'Cross marks an empty square. Fill on a filled square empties it.' },
    {
      from: 6,
      to: 6,
      text: "Each number is in its run's colour; different colours may touch. Choose a colour pot, then fill: a pot paints over the other colour and empties its own. Cross marks an empty square.",
    },
    { from: 2, to: 4, text: 'A big picture slides: choose Slide, or drag the numbers.' },
    { from: 6, to: 7, text: 'A big picture slides: choose Slide, or drag the numbers.' },
    'Hint rings a square; Start over empties the picture.',
  ],
  finish: 'The picture is done when every filled square matches its numbers.',
  note: 'Only a hint counts, as help: a fill outside the picture, or in the wrong colour, is not a miss, and crossing and emptying are free.',
};
