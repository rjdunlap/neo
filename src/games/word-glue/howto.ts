import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Stick two pictures together to make a new thing, and hear the word they make.',
  steps: [
    {
      from: 4,
      to: 4,
      text: 'One big picture. Touch anywhere: its partner flies in to stick on, the new thing goes up to the shelf, and the next picture rolls in. Say both little words together.',
    },
    { from: 4, to: 4, text: 'Five pictures make five new things along the top.' },
    { from: 1, to: 1, text: 'Drag one picture onto the other, or tap one, and they join.' },
    { from: 2, to: 2, text: 'Listen for the word, then join the two pictures that make it.' },
    { from: 3, to: 3, text: 'A friend needs the thing in the middle; join that friend to it.' },
    { from: 1, to: 3, text: 'Touch a picture to hear its word.' },
  ],
  finish: 'Every pair is joined and its new thing has come alive.',
  note: [
    {
      from: 1,
      to: 1,
      text: 'Every new word is two whole words she already knows. Nothing can go wrong here.',
    },
    {
      from: 4,
      to: 4,
      text: 'Every new word is two whole words she already knows. Any touch is right, and Show a hint counts nothing.',
    },
    {
      from: 2,
      to: 2,
      text: "Every new word is two whole words she already knows. A wrong pair is one miss and the pet says the word's parts; after two misses the right pictures glow, which counts as a hint. Hearing a word again never counts.",
    },
    {
      from: 3,
      to: 3,
      text: 'Every new word is two whole words she already knows. A wrong friend makes a real thing, and the pet says who it is for; that is one miss. After two misses the friend who asked glows, which counts as a hint. Hearing a word again never counts.',
    },
  ],
};
