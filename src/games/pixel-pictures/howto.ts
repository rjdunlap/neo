import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Color squares to make a picture.',
  steps: [
    { to: 1, text: 'Tap squares to fill them and copy the little picture.' },
    { from: 2, to: 2, text: 'Pick a color first, then tap squares to fill them.' },
    { from: 9, to: 9, text: 'Pick a color first, then tap squares to fill them and copy the little picture.' },
    { from: 3, to: 3, text: 'Tap squares to fill the other half, so both sides match like a mirror.' },
    { from: 4, to: 6, text: 'The numbers say how many squares in a row or column are filled; tap squares to fill them.' },
    { from: 6, to: 6, text: 'Each number is colored to show the color of that run. Choose that color, then fill its squares.' },
    { from: 7, to: 7, text: 'One corner is drawn. Tap squares to copy it across both dashed lines, so all four corners match.' },
    { from: 8, to: 8, text: 'Copy the little picture twice as big: each little square becomes a block of four squares.' },
    { from: 10, to: 10, text: 'Make any picture: pick one of four colors and tap squares; tap a colored square again to clear it. Nothing is wrong here. The green check appears after four squares.' },
  ],
  finish: 'The round ends when the picture matches, or on My own picture when she taps the green check.',
};
