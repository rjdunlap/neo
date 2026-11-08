import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Press the key a bubble shows, on a real keyboard. Played on the couch, on a laptop with its keyboard.',
  steps: [
    { from: 1, to: 1, text: "A bubble holds one letter. Press that letter's key and the bubble pops." },
    { from: 2, to: 2, text: 'The bubbles spell her name, one letter each, in order.' },
    {
      from: 3,
      to: 3,
      text: 'A bubble holds a word, typed letter by letter; two words need the space bar between them.',
    },
    {
      from: 4,
      to: 4,
      text: 'Copy a word or name with a capital first: tap Shift, then the letter. Holding Shift works too.',
    },
    {
      from: 5,
      to: 5,
      text: 'Copy the model line, including its capital, spaces and full stop. A wrong letter stays on your line until Backspace removes it.',
    },
    {
      from: 6,
      to: 6,
      text: 'Compare the two lines. Move the caret with Left and Right. Backspace removes the letter before it; type the right letter in the gap.',
    },
    'Esc opens the pause menu: turn Show the key on or off, glow a hint, or start this bubble again.',
  ],
  finish: 'The round ends when every bubble has popped.',
  note: 'Nothing is timed and no bubble drifts away. The first wrong key on a letter is free; each wrong key after that counts a miss, and a second wrong key glows the key, which counts as help.',
};
