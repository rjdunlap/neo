import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a picture with stamps.',
  steps: [
    { from: 7, to: 7, text: 'Pat the paper to press a big soft stamp. Pat as often as you like.' },
    { from: 1, to: 1, text: 'Tap the paper to press the stamp shown.' },
    { from: 2, to: 2, text: 'Choose either stamp, then tap the paper to press it.' },
    { from: 3, to: 6, text: 'Choose a stamp and a color, then tap the paper. Drag a stamp to move it.' },
    { from: 4, to: 6, text: 'Turn a stamp, or make it big or small.' },
    { from: 8, to: 8, text: 'Pat the mud: the leaf presses its shape there. Pat as often as you like.' },
    { from: 9, to: 9, text: 'Tap the duck foot or the cat paw, then tap the mud to make its print.' },
    { to: 2, text: 'The back arrow removes the latest stamp.' },
    { from: 7, to: 9, text: 'The back arrow removes the latest stamp or print.' },
    {
      from: 3,
      to: 6,
      text: 'The back arrow removes the latest stamp; pick up another and tap the bin to remove it.',
    },
    {
      from: 5,
      to: 6,
      text: 'Make the picture you are asked for (a garden, or two friends on an adventure) and tell its story.',
    },
  ],
  finish: [
    {
      from: 7,
      to: 7,
      text: 'The eighth pat finishes the picture by itself. After the round, the tree house button hangs it up.',
    },
    {
      from: 1,
      to: 2,
      text: 'Tap the green arrow to finish; it wiggles after five stamps. A full paper finishes itself. After the round, the tree house button hangs it up.',
    },
    {
      from: 3,
      to: 6,
      text: 'Tap the music note to hear the picture play, left to right; tap the green arrow when it is done. After the round, the tree house button hangs it up.',
    },
    { from: 8, to: 8, text: 'Tap the green arrow to finish; the eighth pat finishes by itself.' },
    { from: 9, to: 9, text: 'Tap the green arrow to finish; the tenth print finishes by itself.' },
  ],
  note: 'Every picture is welcome.',
};
