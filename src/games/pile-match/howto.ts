import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Gather the heap into sets of three the same.',
  steps: [
    { from: 1, to: 2, text: 'Tap the kind the pet names; three go in the basket.' },
    { from: 3, to: 11, text: 'Tap anything on top of the heap; it goes into the tray.' },
    { from: 3, to: 11, text: 'Three the same in the tray pop away.' },
    { from: 2, to: 2, text: 'Things underneath wait until what is on top is gone.' },
    { from: 4, to: 11, text: 'Things underneath wait until what is on top is gone.' },
    { from: 4, to: 9, text: 'When the tray is full, tap a thing in the tray to put it back.' },
  ],
  finish: 'The grass is clear.',
  note: [
    { from: 1, to: 1, text: 'Tapping a different kind counts as a mistake.' },
    {
      from: 2,
      to: 2,
      text: 'Touching something underneath is never counted; tapping a different kind counts as a mistake.',
    },
    { from: 3, to: 3, text: 'Putting things back is never counted.' },
    {
      from: 11,
      to: 11,
      text: 'A little pile of two kinds: the tray can never fill, and touching something underneath or putting things back is never counted.',
    },
    {
      from: 4,
      to: 9,
      text: 'Touching something underneath and putting things back are never counted. A tap the full tray turns away counts as a mistake, once until something leaves the tray.',
    },
    { from: 9, to: 9, text: 'The tray has four places, so finish one kind before starting too many others.' },
  ],
};
