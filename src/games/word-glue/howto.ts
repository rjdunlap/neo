import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hear how two whole words make the name of a thing.',
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
    { from: 5, to: 5, text: 'Listen to the question, then tap the part the thing really is.' },
    { from: 6, to: 6, text: 'Two things from the same parts: tap the one the pet asks for.' },
    { from: 6, to: 6, text: 'Touch a picture and slide off to hear its name.' },
    { from: 7, to: 7, text: 'Tap two pictures to name the new thing: the thing it is goes last.' },
    {
      from: 7,
      to: 7,
      text: 'Tap a picture in a name card to take it back out; tap the thing itself to hear the question again.',
    },
    { from: 8, to: 8, text: 'Listen for the word, then join its action to the person.' },
    { from: 1, to: 3, text: 'Touch a picture to hear its word.' },
    { from: 8, to: 8, text: 'Touch an action or the person to hear it.' },
    {
      from: 5,
      to: 5,
      text: 'Touch a part and slide off to hear its word without answering; tap the thing itself to hear the question again.',
    },
  ],
  finish: [
    { from: 1, to: 4, text: 'Every pair is joined and its new thing has come alive.' },
    { from: 5, to: 5, text: 'Every question is answered and its thing has come alive.' },
    { from: 6, to: 6, text: 'Four pairs of pictures have gone to the shelf.' },
    { from: 7, to: 7, text: 'Five new things are named and have come alive.' },
    { from: 8, to: 8, text: 'Five words are made and their someones have come alive.' },
  ],
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
    {
      from: 5,
      to: 7,
      text: 'In English the last part names the thing: a doghouse is a house. Many languages put it first, so this question works in English only.',
    },
    {
      from: 6,
      to: 6,
      text: 'These examples use English word order and US names for cake pan and dog sled. After two misses, the right picture glows and counts as one hint.',
    },
    {
      from: 5,
      to: 5,
      text: 'A wrong tap is one miss and the pet says what the thing is; after two misses the right picture glows, which counts as a hint.',
    },
    {
      from: 7,
      to: 7,
      text: 'Either detail can go first: a star hat and a bell hat are both good names.',
    },
    {
      from: 7,
      to: 7,
      text: 'A name with the wrong part last is one miss and the pet says what that name would call; after two misses the thing and the last card glow, which counts as a hint.',
    },
    {
      from: 8,
      to: 8,
      text: 'Every word is a word she knows plus an ending, and the pet always says the whole word and what it means (someone who paints), never the ending alone. These endings are English only.',
    },
    {
      from: 8,
      to: 8,
      text: 'A wrong action makes a real someone, and the pet says who; the same action again counts nothing more. After two different wrong actions the right one glows, which counts as a hint.',
    },
  ],
};
