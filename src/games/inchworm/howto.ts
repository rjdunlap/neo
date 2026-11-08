import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Measure things, first with inchworms and then with a ruler.',
  steps: [
    { to: 1, text: 'Drag inchworms end to end along the leaf, and count them.' },
    {
      from: 2,
      to: 2,
      text: 'Drag inchworms end to end along the object, count them, then choose how many worms long it is.',
    },
    {
      from: 3,
      to: 3,
      text: 'Measure each thing with inchworms, then answer which is longer, and by how many worms. One round measures two jumps in a sand pit, from the board to the footprints.',
    },
    { from: 4, to: 4, text: 'Count the ruler spaces the object covers, even when it does not start at 0.' },
    {
      from: 5,
      to: 5,
      text: 'Two things sit on one ruler. Count the extra spaces the longer one covers, and choose how much longer it is.',
    },
    {
      from: 6,
      to: 6,
      text: 'Two things sit end to end on the ruler. Count the spaces of both, and choose how long they are together.',
    },
    {
      from: 7,
      to: 7,
      text: 'Measure the same thing twice: big inchworms first, then little ones. Then tap the number the little worms made (or the big worms, when the pet asks).',
    },
    {
      from: 8,
      to: 8,
      text: 'The ruler is broken and has no 0. Count the spaces the object covers, not the mark where it ends.',
    },
    {
      from: 9,
      to: 9,
      text: 'Tap the one inchworm to move it along the object, one hop at a time; each hop leaves a chalk mark. When it reaches the end, choose how many hops long the object is.',
    },
    {
      from: 10,
      to: 10,
      text: 'The object is longer than the short ruler. Drag the ruler under it with 0 at the start; a chalk mark shows where it ended. Drag it on to start at the mark, then choose the whole length: the first part plus the rest.',
    },
  ],
  finish: 'The round ends when the measurement is chosen.',
};
