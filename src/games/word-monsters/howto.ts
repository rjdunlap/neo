import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Meet the letter monsters and hear their sounds.',
  steps: [
    { to: 1, text: 'Tap a monster to hear its letter or sound.' },
    { from: 2, to: 2, text: 'Tap the monster whose letter was named.' },
    { from: 3, to: 3, text: 'Tap the monster whose letter makes the sound you hear.' },
    { from: 4, to: 4, text: 'Listen to the word, then tap the monster whose letter makes its first sound.' },
    { from: 5, to: 5, text: 'Put the letters into the slots to build the three-letter word.' },
    { from: 6, to: 6, text: 'Listen to the sounds of the word and build it from the letters; one letter is a spare.' },
    { from: 7, to: 7, text: 'Change the first sound to make the next word in the family, like hat, cat, bat.' },
    { from: 8, to: 8, text: 'Keep the first two sounds. Change the last sound to make the pictured word.' },
  ],
  finish: 'The round ends when the asked-for letters or word are found.',
  note: "Spoken letter sounds depend on the device's speech voice.",
};
