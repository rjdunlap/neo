import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Choose moves for the pet and watch their order.',
  steps: [
    { from: 1, to: 1, text: 'Tap the hand (Wave) or circle arrow (Turn) to fill the empty place.' },
    { from: 2, to: 2, text: 'Choose two moves to fill the shelf.' },
    { from: 3, to: 3, text: 'The top pictures ask for Wave, then Turn. Watch the swapped show freely.' },
    {
      from: 4,
      to: 4,
      text: 'Each left picture asks one signal, bell or flower, to start one move. Tap it to hear it.',
    },
    {
      from: 4,
      to: 4,
      text: 'Choose a move for each row. Tap the bell or the flower to try it, in any order; the small card shows what the row did.',
    },
    {
      from: 1,
      to: 3,
      text: 'Play runs the whole show; the arrow-and-bar runs one move. Each place lights as it runs.',
    },
    'Tap an occupied place, then a move to replace it. Undo takes back one edit.',
    { from: 1, to: 2, text: 'The bulb offers a Wave in an empty place, then plays the show.' },
    {
      from: 3,
      to: 3,
      text: 'The bulb outlines the first mismatch and its request; press again to repair it, then repair the next. The orange Play button checks the whole show.',
    },
    {
      from: 4,
      to: 4,
      text: 'The bulb outlines the first row that does not match; press again to set it. The orange Play button checks both signals and marks each row with a tick or a cross.',
    },
  ],
  finish: [
    {
      from: 1,
      to: 2,
      text: 'After a complete run, the blue tick finishes your show. An edit needs a new run.',
    },
    {
      from: 3,
      to: 4,
      text: 'A matching Check turns orange Play into the blue Finish tick. Edits and Undo require another Check.',
    },
  ],
  note: [
    {
      from: 4,
      to: 4,
      text: 'Trying a signal is free. Each row is judged by its own signal, not by which was tried first.',
    },
    {
      from: 1,
      to: 2,
      text: 'Every complete show is welcome; nothing counts as a miss. Supplied help counts once, even after Undo or Start again.',
    },
    {
      from: 3,
      to: 4,
      text: 'Only a wrong Check counts a miss. Two show a clue. Each clue or supplied repair counts once; Undo and Start again keep misses and help.',
    },
  ],
};
