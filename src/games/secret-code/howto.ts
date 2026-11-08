import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Work out the secret code from clues.',
  steps: [
    { to: 8, text: 'Tap stones to fill the slots, then turn the key.' },
    {
      from: 10,
      to: 10,
      text: 'One slot and three stones: tap a stone, then turn the key. A green check opens the door; a gray cross means not that one, and that stone dims in the tray.',
    },
    { from: 11, to: 11, text: 'Tap stones to fill the slots, then turn the key.' },
    {
      from: 12,
      text: 'Tap the two friends to play with a grown-up, or the pet’s face to play with the pet.',
    },
    {
      from: 12,
      text: 'She makes a code; a lid hides it. The grown-up fills the slots and turns the key; she taps each stone’s circle to its mark, then the arrow.',
    },
    {
      from: 12,
      text: 'Then swap: the grown-up makes a code and she cracks it from the island’s marks. With the pet, it cracks hers, then she cracks a door.',
    },
    {
      to: 2,
      text: 'A green check means the right stone is in the right place; gray means try another stone there.',
    },
    {
      from: 3,
      to: 9,
      text: 'Green means the right stone in the right place; yellow means that color is in the code but in another slot; gray means no more of that stone: it is not in the code, or the code has no other one.',
    },
    {
      from: 11,
      to: 11,
      text: 'Green means the right stone in the right place; yellow means that color is in the code but in another slot; gray means no more of that stone: it is not in the code, or the code has no other one.',
    },
    {
      from: 9,
      to: 9,
      text: 'Be the door: tap three stones to make any code (a color may repeat), then tap the check.',
    },
    {
      from: 9,
      to: 9,
      text: 'The pet tries a code. Tap the circle under each of its stones until it shows the right mark, then tap the arrow.',
    },
    { from: 6, to: 6, text: 'A color can be used twice in the code.' },
    {
      from: 7,
      to: 7,
      text: 'Two or three guesses are already shown. Find the one code that fits every mark; its colors are all different.',
    },
    {
      from: 8,
      to: 8,
      text: 'Four slots, and one color is used twice in the code, so that color can earn two marks.',
    },
    {
      from: 11,
      to: 11,
      text: 'A bigger detective door: four slots, five colors, and three guesses already shown. Find the one code that fits every mark; its colors are all different.',
    },
  ],
  finish: [
    { to: 8, text: 'The round ends when the code is cracked.' },
    { from: 10, to: 10, text: 'The round ends when three doors are open.' },
    { from: 9, to: 9, text: 'The round ends when the pet has cracked two of her codes.' },
    { from: 11, to: 11, text: 'The round ends when the code is cracked.' },
    { from: 12, text: 'The round ends when both codes are cracked, hers first.' },
  ],
  note: [
    {
      to: 6,
      text: 'A wrong try is how you learn the code. A miss is only a stone put where a mark still on screen already ruled it out; after two misses, or many tries, faint stones show a code that fits, and they update after every try.',
    },
    {
      from: 7,
      to: 7,
      text: 'A try that contradicts the shown clues gets a reminder. After two, faint stones help; the original clues stay visible.',
    },
    {
      from: 9,
      to: 9,
      text: 'Her code is never wrong. A miss is tapping the arrow with a mark the pet’s stone did not earn: the stone wobbles and the pet asks about it. After two on one try, the right mark glows around each disc still wrong.',
    },
    {
      from: 10,
      to: 10,
      text: 'A wrong stone is how you find the right one, never a miss. The only miss is tapping a stone that already has a gray cross: it wobbles and stays in the tray. After two, the stone behind the door glows.',
    },
    {
      from: 8,
      to: 8,
      text: 'A wrong try is how you learn the code. A miss is only a stone put where a mark still on screen already ruled it out; after two misses, or eight tries, faint stones show a code that fits, and they update after every try.',
    },
    {
      from: 11,
      to: 11,
      text: 'A try that contradicts the shown clues gets a reminder. After two, or five tries, faint stones help; the original clues stay visible and never fade.',
    },
    {
      from: 12,
      text: 'Only her misses count: a wrong mark, or a stone where a mark on screen ruled it out. A round with a grown-up counts as helped, so it never steps her up.',
    },
  ],
};
