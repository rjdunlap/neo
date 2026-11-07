import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Set a shell on the sand to make or stop a row of three.',
  steps: [
    { from: 1, to: 1, text: 'Two shells in a row: tap the square that makes three.' },
    { from: 2, to: 2, text: 'The pet has two pebbles in a row: tap the square that stops it.' },
    { from: 3, to: 3, text: 'Both have two in a row: take the square that makes your three first.' },
  ],
  finish: 'Three puzzles make a round; one sticker.',
  note: "A wrong square is answered by the pet's move, then the board goes back to her turn; that reply is the lesson. Each wrong empty square is a miss; after two on one puzzle the right square glows (one hint). A tap on a full square is never counted.",
};
