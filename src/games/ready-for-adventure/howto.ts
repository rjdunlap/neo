import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Get the parade things ready, pack them, and watch {pet} use them.',
  steps: [
    { from: 1, to: 3, text: 'Look at the card: it shows what to bring. Tap it to hear it.' },
    { from: 1, to: 1, text: 'Drag the thing on the card into the bag.' },
    {
      from: 2,
      to: 2,
      text: 'Put the ribbon on the pole (or the beater with the drum), then drag it into the bag.',
    },
    { from: 3, to: 3, text: 'Get the flag and the drum ready and packed, in either order.' },
  ],
  finish: 'When the bag has what the card shows, the parade plays; a tap skips it.',
  note: [
    { from: 1, to: 3, text: 'Dragging or tapping both work: tap a thing, then tap where it goes.' },
    {
      from: 1,
      to: 3,
      text: 'Packing something not ready yet, or the wrong thing, counts as a miss; two on the same job light up the next step and count as help.',
    },
    {
      from: 1,
      to: 3,
      text: 'Show a hint lights the next step; tapping a lit thing lets {pet} do it, and finishing with help still earns the sticker.',
    },
    {
      from: 1,
      to: 3,
      text: 'Pretend parade things only: this is about getting things ready in order, not a lesson in real getting-ready routines.',
    },
  ],
};
