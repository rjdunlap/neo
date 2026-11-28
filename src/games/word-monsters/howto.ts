import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Meet the letter monsters and hear their sounds.',
  steps: [
    { to: 1, text: 'Tap a monster to hear its letter or sound.' },
    {
      from: 9,
      to: 9,
      text: 'One big letter monster. Touch anywhere: it says its sound, its picture pops up to the top and stays, and the next monster wakes. Make each sound together.',
    },
    { from: 9, to: 9, text: 'Six monsters leave six pictures along the top.' },
    {
      from: 15,
      to: 15,
      text: "One of three monsters wears the first letter of her name (Pip's P if no name is set). Tap it when its letter is named; only letter names are said.",
    },
    { from: 2, to: 2, text: 'Tap the monster whose letter was named.' },
    { from: 3, to: 3, text: 'Tap the monster whose letter makes the sound you hear.' },
    { from: 4, to: 4, text: 'Listen to the word, then tap the monster whose letter makes its first sound.' },
    { from: 5, to: 5, text: 'Put the letters into the slots to build the three-letter word.' },
    {
      from: 6,
      to: 6,
      text: 'Listen to the sounds of the word and build it from the letters; one letter is a spare.',
    },
    {
      from: 7,
      to: 7,
      text: 'Change the first sound to make the next word in the family, like hat, cat, bat. The first word tells you the sound; after that, listen for the word, or tap the picture to hear it again.',
    },
    {
      from: 8,
      to: 8,
      text: 'Keep the first two sounds. Change the last sound to make the pictured word. The first word tells you the sounds; after that, tap the picture to hear the word again.',
    },
    {
      from: 10,
      to: 10,
      text: 'Listen to the pictured word, then tap the monster that says its last sound. Tap the picture to hear the word again.',
    },
    {
      from: 16,
      to: 16,
      text: 'The monsters light up one by one and say their sounds. Listen, run the sounds together and tap the picture of the word they make. Tap a monster to hear the sounds again.',
    },
    {
      from: 19,
      to: 19,
      text: 'Listen to the pictured word, then tap the vowel monster that says the sound in its middle. Tap the picture to hear the word again.',
    },
    {
      from: 17,
      to: 17,
      text: 'A word is built. Drag the quiet e to the empty box at the end and the vowel says its name. Another letter makes a different word.',
    },
    {
      from: 18,
      to: 18,
      text: 'A word stands in the boxes. Tap the box that changes to lift its letter out, then drag the new letter in to make the next word on the ladder.',
    },
    {
      from: 11,
      to: 11,
      text: 'Only the word is said. Say it slowly together, then build it in the boxes; one letter is a spare. Tap the boxes to hear the sounds, or the picture to hear the word.',
    },
    {
      from: 12,
      to: 12,
      text: "Tap the wrong letter in the pet's word to lift it out. Drag the right letter into the empty box.",
    },
    {
      from: 12,
      to: 12,
      text: 'Tap the speaker to hear what the pet built, or tap the picture to hear the word it meant.',
    },
    {
      from: 13,
      to: 13,
      text: 'Build the pictured word in the boxes. One monster wears two letters (sh, ch, th or ck) and fills one box: together they make one sound. Tap the boxes to hear the sounds, or the picture to hear the word.',
    },
    {
      from: 14,
      to: 14,
      text: 'Say the pictured word slowly and drag one monster into each of the four boxes. In frog, f and r go in separate boxes. Tap the boxes to hear the sounds.',
    },
  ],
  finish: 'The round ends when the asked-for letters or word are found.',
  note: "Spoken letter sounds depend on the device's speech voice.",
};
