import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Decorate a bug so it matches.',
  steps: [
    { to: 2, text: 'Drag a shape or a color onto a spot on the bug.' },
    {
      from: 3,
      to: 4,
      text: 'Look at the model bug, then drag the same shapes and colors onto the same spots.',
    },
    {
      from: 5,
      to: 7,
      text: 'Look at one wing, then drag matching shapes and colors across onto the other wing, like a mirror.',
    },
    {
      from: 8,
      to: 8,
      text: 'Count the spots: drag any shape onto any place until the bug has the number on the sign, then tap the check. Tap a spot to take it off.',
    },
    {
      from: 9,
      to: 9,
      text: 'Count a kind: the sign shows a number and one color or one shape. Drag only stamps of that kind onto the bug until it has the number, then tap the check. Tap a spot to take it off.',
    },
    {
      from: 10,
      text: 'Fold a friend: look at the spots on one wing, then tap the finished bug the fold will make. Any choice is fine: the wing folds over and shows the answer.',
    },
    { from: 5, to: 7, text: 'When the wings match, watch them fold across the middle and open together.' },
  ],
  finish: [
    {
      from: 10,
      text: 'The round ends once the wing has folded over and shown the answer; any choice is fine.',
    },
    {
      text: 'The round ends when the bug matches what was asked for, or has just the number of spots (of the right kind) on the sign.',
    },
  ],
};
