import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a picture with stamps.',
  steps: [
    {
      from: 7,
      to: 7,
      text: 'Pat the paper, or anywhere around it, to press a big soft stamp there. Pat as often as you like.',
    },
    { from: 1, to: 1, text: 'Tap the paper to press the stamp shown.' },
    {
      from: 10,
      to: 10,
      text: 'A sparkle glows on the paper: tap it and a stamp lands there. A tap anywhere else stamps too, and the sparkle moves on either way.',
    },
    { from: 2, to: 2, text: 'Choose either stamp, then tap the paper to press it.' },
    {
      from: 11,
      to: 11,
      text: 'Tap the asked animal stamp (cat, fish or duck), then tap the paper.',
    },
    {
      from: 11,
      to: 11,
      text: 'Any other stamp still prints and is named; after two misses the asked button glows.',
    },
    { from: 3, to: 3, text: 'Choose a stamp and a color, then tap the paper. Drag a stamp to move it.' },
    { from: 4, to: 6, text: 'Choose a set, stamp and color, then tap the paper. Drag a stamp to move it.' },
    {
      from: 12,
      to: 12,
      text: 'On the farm, the voice asks for three places: up in the sky, on the grass, in the water. Any stamp there meets it; anywhere else is part of the picture.',
    },
    { from: 1, to: 3, text: 'Each stamp has its own sound, and the stamps are counted aloud up to ten.' },
    { from: 4, to: 6, text: 'Turn a stamp; the size button makes it big, then small, then middle again.' },
    { from: 8, to: 8, text: 'Pat the mud: the leaf presses its shape there. Pat as often as you like.' },
    { from: 9, to: 9, text: 'Tap the duck foot or the cat paw, then tap the mud to make its print.' },
    { to: 2, text: 'The back arrow removes the latest stamp.' },
    { from: 11, to: 11, text: 'The back arrow removes the latest stamp.' },
    { from: 8, to: 9, text: 'The back arrow removes the latest print.' },
    {
      from: 3,
      to: 6,
      text: 'The back arrow removes the latest stamp; pick up another and tap the bin to remove it.',
    },
    {
      from: 12,
      to: 12,
      text: 'Drag a stamp to move it; the back arrow removes the latest, the bin the one picked up.',
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
      text: 'There are no arrows: the eighth pat finishes the picture by itself. After the round, the tree house button hangs it up.',
    },
    {
      from: 10,
      to: 10,
      text: 'There are no arrows: the fifth stamp finishes the picture by itself. After the round, the tree house button hangs it up.',
    },
    {
      from: 1,
      to: 2,
      text: 'Tap the green arrow to finish (it wiggles after five stamps): the stamps wake up one by one. A full paper finishes itself. After the round, the tree house button hangs it up.',
    },
    {
      from: 11,
      to: 11,
      text: 'After three asks, tap the green arrow whenever you are ready to finish: the stamps wake up one by one. After the round, the tree house button hangs it up.',
    },
    {
      from: 3,
      to: 6,
      text: 'Tap the music note to hear the picture play, left to right; tap the green arrow to finish, and the stamps wake up one by one. After the round, the tree house button hangs it up.',
    },
    {
      from: 12,
      to: 12,
      text: 'Tap the green arrow whenever you are ready: the stamps wake up one by one. A place not yet found counts as one hint.',
    },
    { from: 8, to: 8, text: 'Tap the green arrow to finish; the eighth pat finishes by itself.' },
    { from: 9, to: 9, text: 'Tap the green arrow to finish; the tenth print finishes by itself.' },
  ],
  note: 'Every picture is welcome.',
};
