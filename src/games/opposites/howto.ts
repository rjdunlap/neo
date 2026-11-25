import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find opposite words and pictures.',
  steps: [
    {
      to: 1,
      text: 'Tap a picture to flip it to its opposite. Big and small friends step, fast and slow friends move, and the balloon rises or sinks.',
    },
    {
      from: 6,
      to: 6,
      text: 'One big picture. Touch anywhere: it flips to its opposite and the word is said, then it joins the row along the bottom and the next picture comes. Say each word together.',
    },
    { from: 2, to: 2, text: 'Tap the one that is named, like "the big one".' },
    { from: 3, to: 3, text: 'Look at the picture, then tap its opposite.' },
    { from: 4, to: 4, text: 'Tap a picture, then tap its opposite, to match all three pairs.' },
    { from: 5, to: 5, text: 'Five pictures, but only two are opposites. Tap one of them, then the other.' },
    {
      from: 7,
      to: 7,
      text: 'Three pictures of one word: two ends, like empty and full, and one in between. Tap the one in between. After two misses the two ends light up, then the middle one glows.',
    },
    {
      from: 8,
      to: 8,
      text: 'The same three pictures, mixed up. Tap them in order, from one end to the other ("from empty to full"); each one slides into the line. Next time it goes the other way. After two misses the next one glows.',
    },
    {
      from: 9,
      to: 9,
      text: 'Listen: the word is said, but its picture hides behind a speaker. Tap the speaker to hear it again, then tap its opposite among three pictures. The first miss shows the hidden picture; after two misses the opposite glows.',
    },
    {
      from: 10,
      to: 10,
      text: 'Two pictures, like a zipped bag and an unzipped one. Hear "unzipped" and tap it: un turns a word the other way. The word is shown too, with its "un" in a bubble, but reading is optional; tap it to hear it again. After two misses the right one glows.',
    },
    {
      from: 11,
      to: 11,
      text: 'Some words have two opposites: light can be heavy or dark. Hear the word and tap both pictures that are its opposite, in any order. A picture of the word itself, like a feather for light, just gets a hint. After two misses an answer glows.',
    },
  ],
  finish: [
    { to: 1, text: 'Flip eight pictures to finish the round.' },
    { from: 6, to: 6, text: 'Eight pictures in the row finish the round.' },
    { from: 2, to: 2, text: 'Find five named pictures to finish the round.' },
    { from: 3, to: 3, text: 'Find four opposites to finish the round.' },
    { from: 4, to: 4, text: 'Match all three pairs on each of two boards to finish the round.' },
    { from: 5, to: 5, text: 'Find the opposite pair in each of three boards to finish the round.' },
    {
      from: 7,
      to: 7,
      text: 'Find the one in between on four boards (cup, mug, sky, balloon) to finish the round.',
    },
    {
      from: 8,
      to: 8,
      text: 'Line up four sets of three (cup, mug, sky, balloon), two each way, to finish the round.',
    },
    { from: 9, to: 9, text: 'Find the opposite of four heard words to finish the round.' },
    { from: 10, to: 10, text: 'Find four un- words to finish the round.' },
    { from: 11, to: 11, text: 'Find both opposites of light, short and old to finish the round.' },
  ],
};
