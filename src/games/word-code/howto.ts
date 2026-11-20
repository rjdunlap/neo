import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Work out the hidden word from the marks on each try.',
  steps: [
    {
      to: 2,
      text: 'One of the four pictured words is hiding. Tap tray letters to try a word, then the check. Tap a picture to hear it.',
    },
    {
      from: 3,
      text: 'Type a five-letter word on the keys, then the check key. A word not on the list is turned down, free.',
    },
    {
      text: 'Green check: right place. Yellow dot: in the word, elsewhere. Gray cross: not in the word.',
    },
    { text: 'The light bulb shows one letter of the hidden word in its place.' },
  ],
  finish: 'The round ends when she builds the hidden word. The number of tries is never counted.',
  note: 'A try is never a mistake. The one miss is ignoring a mark still showing; the try still plays and the pet says which mark to look back at. After two misses the ruled-out letters dim and the light bulb glows.',
};
