import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Light every lantern on the pond.',
  steps: [
    'Tap a lantern to flip it and the lanterns above, below and beside it.',
    'Tap Undo to take the last tap back; Start over puts the pond back as it began.',
    'Tap Hint to see which lantern to try next; the voice says if it is the only short way.',
    {
      from: 7,
      to: 8,
      text: 'A 6 by 6 pond has only one set of lanterns that lights it all: tap each of them once, in any order.',
    },
    {
      from: 9,
      text: 'Lily pads have no lantern: a tap on one does nothing, and a press beside a pad flips only the lanterns around it.',
    },
  ],
  finish:
    'A pond is done when all its lanterns glow: Show me a short way replays the fewest taps, and Next pond goes on.',
  note: 'There is no wrong tap, and taking one back is free. Each hint counts as help. At school she plays the two 3 by 3 ponds (about 7 and up). If she presses a lot without lighting the pond, she is told where Hint is; that counts nothing.',
};
