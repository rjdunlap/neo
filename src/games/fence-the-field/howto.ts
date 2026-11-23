import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Take turns with the pet laying fence rails; the fourth rail round a plot claims it.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'A plot with three rails is ready: tap its last rail to claim it, then lay again.',
    },
    { from: 2, to: 2, text: 'No plot is ready: tap a rail that leaves every plot with two rails or fewer.' },
    {
      from: 3,
      to: 3,
      text: 'Every rail makes a plot ready: give the shortest run of plots, a run of two by its middle rail.',
    },
    {
      from: 4,
      to: 4,
      text: 'The pet gave you a run: take all but the last two, then lay the far rail, so the pet takes two and opens the next run.',
    },
    { text: 'Tap between two posts to lay a rail; a tap inside a plot lays its nearest open rail.' },
  ],
  finish:
    'The round ends on the last rail, when you hold the number of plots the strip says you can get; one sticker.',
  note: "A rail that costs a plot is answered by the pet's best reply, then the field steps back to before it; that reply is the lesson. Each different costly rail is a miss; the second brings a glowing rail (one hint), and Help glows one at any time.",
};
