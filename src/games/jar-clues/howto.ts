import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Guess how many pebbles are in the jar, cross off what each clue rules out, then choose between the last few by eye.',
  steps: [
    'Tap a number to plant your first guess, then press First clue.',
    {
      from: 1,
      to: 1,
      text: 'Tap a number to cross it off, or drag along a row: "fewer than 35" sweeps off 35 to 60. Tap again to bring one back.',
    },
    {
      from: 2,
      to: 2,
      text: '"The digits add to 7" leaves 7, 16, 25, 34, 43 and 52.',
    },
    'A one-digit number has tens digit 0: 7 is "0 and 7".',
  ],
  finish:
    'When the clues run out, choose one of the cards by the jar and its ten line; it pours out in rows of ten. One sticker.',
  note: 'The guess and the last choice are never wrong. Next clue checks the board: a wrong board is one miss, and the note names a wrong number and why. The second brings a row hint; Help gives one any time.',
};
