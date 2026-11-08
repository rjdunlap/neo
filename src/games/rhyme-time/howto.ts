import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find the words that rhyme.',
  steps: [
    { to: 2, text: 'Listen to the word.' },
    { from: 3, text: 'Listen to the words.' },
    { to: 2, text: 'Tap the picture that rhymes with it.' },
    { from: 3, to: 3, text: 'Tap the two pictures that rhyme with each other.' },
    { from: 4, to: 4, text: 'Tap the picture that does not rhyme with the others.' },
    {
      from: 5,
      to: 5,
      text: 'Listen to both clues, a sound ("it rhymes with bear") and then a meaning ("you can sit on it"), and tap the one picture of three that fits both.',
    },
    {
      from: 6,
      to: 6,
      text: 'Listen to both clues, a meaning ("you can sit on it") and then a sound ("it rhymes with bear"), and tap the one picture of four that fits both.',
    },
    {
      from: 7,
      to: 7,
      text: "The pet stars a picture. Tap a sound chip and a meaning chip that lead to it, then tap the pet's mouth to let it guess. A chip can be changed.",
    },
    {
      from: 8,
      to: 8,
      text: 'A place stands in the middle ("Who goes in the truck?"). Tap the one of three pictures below that rhymes with it, and it hops in: a duck in a truck.',
    },
    {
      from: 9,
      to: 9,
      text: 'A place stands in the middle, its word said twice ("truck… truck. Who rhymes with truck?"). Tap the one of two pictures below that rhymes with it, and it hops in: a duck in a truck.',
    },
    {
      from: 10,
      to: 10,
      text: 'Three baskets each show a picture on the front. Drag each of the six pictures below into the basket whose picture it rhymes with: the hat goes in the cat basket.',
    },
  ],
  finish: [
    { to: 6, text: 'The round ends when the rhyme question or riddle is answered.' },
    {
      from: 7,
      to: 7,
      text: 'Each of three riddles ends when the pet finds the starred picture from her clues.',
    },
    { from: 8, to: 8, text: 'The round ends after four silly scenes.' },
    { from: 9, to: 9, text: 'The round ends after three silly scenes.' },
    {
      from: 10,
      to: 10,
      text: 'The round ends after two trays of six pictures; when a tray is empty, the baskets sing their rhymes.',
    },
  ],
  note: [
    { to: 4, text: 'Tapping a picture replays its word.' },
    {
      from: 5,
      to: 6,
      text: 'A picture that fails a clue is told which clue it fails; after two, the right one glows. The music note repeats the riddle for free.',
    },
    {
      from: 7,
      to: 7,
      text: 'No mistakes are counted: a clue pair that finds another picture or nothing is part of the game. After two, the working chips glow.',
    },
    {
      from: 8,
      to: 9,
      text: 'A picture that does not rhyme hops in, the pet giggles that the two do not rhyme, and it hops back out; after two, the right one glows. The music note repeats the question for free.',
    },
    {
      from: 10,
      to: 10,
      text: 'A picture dropped on the wrong basket floats back and counts as a miss; after two misses with one picture, its basket glows. A drop anywhere else, or tapping a basket to hear its word, is free.',
    },
  ],
};
