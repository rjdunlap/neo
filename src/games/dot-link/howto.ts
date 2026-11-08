import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Link dots of the same color.',
  steps: [
    { to: 1, text: 'Tap a dot to pop it.' },
    { from: 2, to: 2, text: 'Drag from one dot to another of the same color to link them.' },
    {
      from: 11,
      to: 11,
      text: 'Two dots wiggle: drag from one to the other to link them. Another line just shakes and stays.',
    },
    {
      from: 3,
      to: 3,
      text: 'Drag from one dot to another of the color asked for, until the number asked for have popped.',
    },
    { from: 4, to: 4, text: 'Drag from dot to dot of one color to make a chain of four; make three chains.' },
    {
      from: 5,
      to: 5,
      text: 'Drag a line all the way around four dots of one color to close a square; do it twice.',
    },
    { from: 6, to: 6, text: 'Drag through exactly five neighboring dots of one color; make three chains.' },
  ],
  finish: 'The round ends when the asked-for dots are cleared.',
};
