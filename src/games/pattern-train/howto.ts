import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Finish the pattern on the train.',
  steps: [
    { to: 5, text: 'Look to see what repeats, then tap the choice that comes next.' },
    {
      from: 6,
      to: 6,
      text: 'Look to see what repeats, then tap the choice that fits the gap in the middle.',
    },
    {
      from: 7,
      to: 8,
      text: 'Listen to the bells on the train. Tap a bell to hear it, choose the bell that comes next, then tap the arrow.',
    },
    { from: 9, to: 9, text: 'Look to see what repeats, then tap the choice for each of the two empty cars.' },
    {
      from: 10,
      to: 10,
      text: 'The train rolls into a tunnel with dots for the cars hiding inside. Keep the pattern going through them, then tap the car that comes out.',
    },
    {
      from: 11,
      to: 11,
      text: 'The colors repeat in their own pattern and the shapes in theirs. Look at both, then tap the car that fits the glowing space. It can be anywhere after the first car.',
    },
    {
      from: 12,
      to: 12,
      text: 'Count the numbered cars by 2, 5, or 10, then tap the number for the glowing car. It can be at the end or in the middle.',
    },
    {
      from: 13,
      to: 13,
      text: 'One car does not belong in the pattern. Tap it and it hops off. Tapping a car that fits is a gentle miss.',
    },
    {
      from: 14,
      to: 14,
      text: 'One car shows the wrong piece. Tap it, then choose the piece that belongs there.',
    },
    {
      from: 15,
      to: 15,
      text: 'The train on top has a pattern. Tap the row of animals that repeats the same way, even though the pieces are different.',
    },
    {
      from: 16,
      to: 16,
      text: 'Build the same pattern with the animals. Fill each glowing car so cars that match on top match below, and cars that differ on top differ below. Any animals that do this are right.',
    },
  ],
  finish:
    'The round ends when the missing car or cars are filled in correctly, or the wrong car is found and mended.',
};
