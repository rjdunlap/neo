import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Nine villagers ranked three rides. Count their first choices, and keep counting until one ride has five.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap a ballot, then the pile of the ride it likes best. If no pile has five, the smallest pile is out: move those ballots to their next choice.',
    },
    {
      from: 2,
      to: 2,
      text: 'Do the same, then count only the first choices and tap the ride that wins. Is it the same ride?',
    },
  ],
  finish: 'The round ends when one ride has five ballots and the last question is answered; one sticker.',
  note: 'Drag a ballot to a pile or tap it and the pile; arrow keys, 1 to 3 and Enter also work. Undo takes the last move back and Restart deals the same hand again; neither counts. A ballot in the wrong pile goes back with a spoken hint; after two misses on one ballot the right pile glows (one hint), and Help glows it at any time. The words never say one way of counting is fairer.',
};
