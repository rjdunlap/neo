import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Set a shell on the sand to make or stop a row of three.',
  steps: [
    { from: 1, to: 1, text: 'Two shells in a row: tap the square that makes three.' },
    { from: 2, to: 2, text: 'The pet has two pebbles in a row: tap the square that stops it.' },
    { from: 3, to: 3, text: 'Both have two in a row: take the square that makes your three first.' },
    { from: 4, to: 4, text: 'Nobody has two in a row: tap the square that makes two rows at once.' },
    { from: 5, to: 5, text: "A whole game: you go first; make three, and stop the pet's rows." },
  ],
  finish: [
    { to: 4, text: 'Three puzzles make a round; one sticker.' },
    {
      from: 5,
      text: 'A game ends when someone gets three or the sand is full; a tie finishes the round too.',
    },
  ],
  note: [
    {
      to: 4,
      text: "A wrong square is answered by the pet's move, then the board goes back to her turn; that reply is the lesson. Each wrong empty square is a miss; after two on one puzzle the right square glows (one hint). A tap on a full square is never counted.",
    },
    {
      from: 5,
      text: 'If the pet gets three, the board goes back to where the game turned (one miss); after a second time, the square that keeps the game safe glows (one hint). A tap on a full square is never counted.',
    },
  ],
};
