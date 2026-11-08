import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Choose moves for the pet and watch their order.',
  steps: [
    { from: 1, to: 1, text: 'Tap the hand (Wave) or circle arrow (Turn) to fill the empty place.' },
    { from: 2, to: 2, text: 'Choose two moves to fill the shelf.' },
    { from: 3, to: 3, text: 'The top pictures ask for Wave, then Turn. Watch the swapped show freely.' },
    'Play runs the whole show; the arrow-and-bar runs one move. Each place lights as it runs.',
    'Tap an occupied place, then a move to replace it. Undo takes back one edit.',
    { from: 1, to: 2, text: 'The bulb offers a Wave in an empty place, then plays the show.' },
    {
      from: 3,
      to: 3,
      text: 'The bulb outlines the first mismatch and its request; press again to repair it, then repair the next. The orange Play button checks the whole show.',
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
      to: 3,
      text: 'A matching Check turns orange Play into the blue Finish tick. Edits and Undo require another Check.',
    },
  ],
  note: [
    {
      from: 1,
      to: 2,
      text: 'Every complete show is welcome; nothing counts as a miss. Supplied help counts once, even after Undo or Start again.',
    },
    {
      from: 3,
      to: 3,
      text: 'Only a wrong Check counts a miss. Two show a clue. Each clue or supplied repair counts once; Undo and Start again keep misses and help.',
    },
  ],
};
