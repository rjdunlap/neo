import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pull the ball back and let go to tip the towers onto their cushions.',
  steps: [
    { from: 1, to: 5, text: 'Pull the ball back and let go.' },
    { from: 2, to: 5, text: 'A longer pull goes farther. The faint path shows the last try.' },
    { from: 3, to: 3, text: 'Pull more downward to send the ball up and over the hill.' },
    { from: 4, to: 5, text: 'A bump high up tips a stack; a bump low down only wiggles it.' },
    { from: 5, to: 5, text: 'Count the fruit in the tray, the new ones and the ones already there.' },
  ],
  finish: 'Every friend is on a cushion.',
  note: [
    {
      from: 1,
      to: 1,
      text: 'Nothing here counts as a miss. After two shots that land short or fly over, a dotted path shows a pull that works, which counts as a hint.',
    },
    {
      from: 2,
      to: 5,
      text: 'A shot that lands short or flies over counts as a miss. A bump that tips nothing is never a miss. After two misses, a dotted path shows a pull that works, which counts as a hint.',
    },
    {
      from: 5,
      to: 5,
      text: 'A wrong count counts as one miss; the pet then counts the tray aloud. A second wrong count lights the right number, which counts as a hint.',
    },
    {
      text: 'After two bumps on a stack that tip nothing, a golden band shows how high a bump has to land, which counts as a hint.',
    },
    {
      text: 'The flight and the tip follow simple toy rules (slow gravity; a push as high as the stack is wide tips it), close to real but not exact.',
    },
  ],
};
