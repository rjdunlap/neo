import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Feed the machine, watch what comes out, then say what it will do.',
  steps: [
    { from: 1, to: 1, text: 'Watch three go through, then tap what the next one will look like.' },
    { from: 2, to: 2, text: 'Send a car in; before it runs, tap how many will come out.' },
    {
      from: 3,
      to: 3,
      text: 'After three cars, tap the card that fits every row of the table, then send one more car and tap how many.',
    },
    {
      from: 4,
      to: 4,
      text: 'The machine is covered: choose cars that tell the three cards apart, tap the card, then tap how many the last car makes. The eye lifts the lid for one car.',
    },
  ],
  finish: 'The round ends after two machines; one sticker.',
  note: [
    {
      from: 1,
      to: 3,
      text: 'Feeding the machine is never a mistake, and neither is a guess made before the machine has shown what it does: its answer is the lesson. After two wrong taps on one guess or card the right one glows (one hint).',
    },
    {
      from: 4,
      to: 4,
      text: "Feeding any car is never a mistake. A card is only judged when the table can tell: while two cards still fit, a tap just asks for another car; a card the table rules out is one miss. The eye (Peek) and Show me are the machine's one hint.",
    },
  ],
};
