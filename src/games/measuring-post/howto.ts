import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Choose the tool for how long, how heavy or how much, and compare measures only in the same units.',
  steps: [
    { from: 1, to: 1, text: 'Listen to the friend’s question, then tap the rope, the balance or the cup.' },
    { from: 1, to: 1, text: 'Watch the tool measure, then press the paper plane to send the answer.' },
    {
      from: 2,
      to: 2,
      text: 'Tap the tool, watch one big unit match two little ones, then watch both friends measure.',
    },
    {
      from: 2,
      to: 2,
      text: 'Tap the friend who used the smaller units; the last friend asks who used the bigger ones.',
    },
    {
      from: 3,
      to: 3,
      text: 'Tap the tool, then the big or little unit to measure both things the same way.',
    },
    {
      from: 3,
      to: 3,
      text: 'Tap the longer, heavier or fuller one, or the two bars when they are the same.',
    },
    {
      from: 4,
      to: 4,
      text: 'Watch four 250-gram weights balance one kilogram, then fill the table: tap a number of grams.',
    },
    { from: 4, to: 4, text: 'Press the tick to check it, then the paper plane to send.' },
    'The speaker says it again. The hand points at what to do next; pressed again, it does it.',
  ],
  finish: [
    { from: 1, to: 1, text: 'The round ends when the third answer is sent.' },
    { from: 2, to: 3, text: 'The round ends when the third friend’s question is answered.' },
    { from: 4, to: 4, text: 'The round ends when the second row is sent.' },
  ],
  note: 'A wrong tool, friend, comparison or checked row is a miss and says why; a unit that does not fit both is no miss. Two misses make the useful choice glow; the hand is one hint per step. The measurements are made up.',
};
