import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Move fruit between jars to solve each board.',
  steps: [
    { to: 11, text: 'Tap a jar to lift its top fruit, then tap another jar to drop it there.' },
    { to: 10, text: 'A fruit can go on the same fruit or into an empty jar.' },
    { from: 11, to: 11, text: 'A fruit can go on any kind if there is room.' },
    { from: 12, text: 'Tap a jar to scoop its matching fruit from the top.' },
    { from: 12, text: 'Tap an empty jar or one with the same fruit on top. As many as fit hop in.' },
    { from: 1, to: 2, text: 'Bright jars show where it can go.' },
    { from: 9, to: 9, text: 'Bright jars show where it can go.' },
    { from: 8, to: 8, text: 'Each fruit has its own labelled jar.' },
    { from: 10, to: 10, text: 'The little jar holds only two: a place to park, never a finished jar.' },
  ],
  finish: [
    { to: 10, text: 'Every jar is empty or filled with one kind of fruit.' },
    { from: 11, to: 11, text: 'Each cup matches the picture above it, in the same order.' },
    { from: 12, text: 'Every jar is empty or filled with one kind of fruit.' },
  ],
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
    {
      from: 10,
      text: 'Use the round arrow to undo. Only refused drops count as mistakes.',
    },
  ],
};
