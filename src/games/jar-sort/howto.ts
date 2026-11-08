import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Move the fruit one at a time until every jar holds one kind.',
  steps: [
    'Tap a jar to lift its top fruit, then tap another jar to drop it there.',
    'A fruit can go on the same fruit or into an empty jar.',
    { from: 1, to: 2, text: 'Bright jars show where it can go.' },
    { from: 9, to: 9, text: 'Bright jars show where it can go.' },
    { from: 8, to: 8, text: 'Each fruit has its own labelled jar.' },
  ],
  finish: 'Every jar is one kind of fruit.',
  note: [
    {
      from: 3,
      to: 8,
      text: 'The round arrow takes back a move, as often as you like. Moving fruit around is never counted against her; a fruit dropped where it cannot go counts as a mistake.',
    },
    {
      to: 2,
      text: 'The round arrow takes back a move, as often as you like. Moving fruit around is never counted against her.',
    },
    {
      from: 9,
      to: 9,
      text: 'The round arrow takes back a move, as often as you like. Moving fruit around is never counted against her.',
    },
  ],
};
