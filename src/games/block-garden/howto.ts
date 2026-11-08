import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Plant shapes until every bud blooms.',
  steps: [
    'Drag a seed tray from the side onto the bed. A shadow shows where it lands.',
    'A full row or column blooms, and its flowers are picked.',
    { from: 1, to: 2, text: 'The striped lines still need filling.' },
    { from: 9, to: 9, text: 'The striped lines still need filling. One piece can finish two of them.' },
    { from: 6, to: 8, text: 'When these three are planted, three more arrive.' },
    { from: 11, to: 11, text: 'When these three are planted, three more arrive.' },
    {
      from: 10,
      to: 10,
      text: 'The faded pieces come next: they arrive when these three are planted, so leave room for them.',
    },
    { from: 11, to: 11, text: "Never fill the snail's row or column: its stone is its house." },
    { from: 8, to: 8, text: 'Empty the whole bed.' },
  ],
  finish: [
    { from: 1, to: 7, text: 'Every bud has bloomed.' },
    { from: 9, to: 11, text: 'Every bud has bloomed.' },
    { from: 8, to: 8, text: 'The bed is empty.' },
  ],
  note: [
    {
      to: 2,
      text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her.',
    },
    {
      from: 9,
      to: 9,
      text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her.',
    },
    {
      from: 10,
      to: 10,
      text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her. A shape dropped where it cannot fit counts as a mistake; touching a faded piece never does.',
    },
    {
      from: 3,
      to: 8,
      text: 'Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her. A shape dropped where it cannot fit counts as a mistake.',
    },
    {
      from: 11,
      to: 11,
      text: "Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her. A shape dropped where it cannot fit, or where it would fill the snail's line, counts as a mistake.",
    },
  ],
};
