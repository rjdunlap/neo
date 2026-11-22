import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Trade pictured toys to meet the friends’ requests.',
  steps: [
    {
      to: 1,
      text: 'Drag the pictured thing from your basket to the friend. Watch the other toy come back. Visit three friends.',
    },
    {
      from: 2,
      to: 2,
      text: 'Drag each requested toy from your basket to its friend. Either friend can go first; returned toys stay on display.',
    },
    {
      from: 3,
      to: 3,
      text: 'Drag one friend’s toy to a friend who wants it. Both friends must want the other’s toy. Find both pairs in either order.',
    },
    {
      from: 4,
      to: 4,
      text: 'Look at your companion’s goal. Trade your basket toy for the thing the second friend wants, then trade for the goal.',
    },
    {
      from: 5,
      to: 5,
      text: 'Three trades reach the goal. One extra friend wants the same toy as a chain friend: trading there leaves a toy nobody wants, and the blue back arrow trades back.',
    },
    {
      from: 6,
      text: 'Trade with three friends to reach the goal. Then it resets and the shell stall opens: drop a toy on it for two shells, then the shells on the toy you want.',
    },
    'Touch a friend or held toy to hear its name and request. The blue back arrow undoes an accepted exchange, including a previous visit.',
    'The yellow light shows the next trade. Ask again to watch one ghost-finger trade, then continue playing.',
  ],
  finish: [
    { to: 1, text: 'All three visits finish one round.' },
    { from: 2, to: 3, text: 'Complete both exchanges to finish one round.' },
    { from: 4, to: 4, text: 'Trade twice to hold the companion’s goal.' },
    { from: 5, to: 5, text: 'Hold the companion’s goal; the extra friend can be left waiting.' },
    {
      from: 6,
      text: 'Reach the goal twice, then say which way took fewer trades. No answer is marked wrong.',
    },
  ],
  note: [
    {
      to: 1,
      text: 'Incompatible offers teach the pictured request without misses. Two rejections glow a useful trade and record help. Undo and exploring are free.',
    },
    {
      from: 2,
      text: 'A deliberate incompatible offer to an active friend counts one miss. Dropping elsewhere, inspecting and Undo are free. Two rejections glow a useful trade. Help persists through Undo, capped at two distinct tasks.',
    },
    {
      from: 5,
      text: 'A legal trade is never a miss, even one that leads nowhere. Shells exist only in the round: no count, change or saving.',
    },
  ],
};
