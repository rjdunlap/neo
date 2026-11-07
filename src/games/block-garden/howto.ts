import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Plant shapes until every bud blooms.',
  steps: [
    'Drag a seed tray from the side onto the bed. A shadow shows where it lands.',
    'A full row or column blooms, and its flowers are picked.',
    { from: 1, to: 2, text: 'The striped lines still need filling.' },
    { from: 6, to: 8, text: 'When these three are planted, three more arrive.' },
    { from: 8, to: 8, text: 'Empty the whole bed.' },
  ],
  finish: [
    { from: 1, to: 7, text: 'Every bud has bloomed.' },
    { from: 8, to: 8, text: 'The bed is empty.' },
  ],
  note: [
    { to: 2, text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her.' },
    { from: 3, text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her. A shape dropped where it cannot fit counts as a mistake.' },
  ],
};
