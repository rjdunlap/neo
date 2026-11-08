import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Rain on a little garden and see where the water goes when the ground changes.',
  steps: [
    { to: 3, text: 'Tap the cloud: four drops fall, some stay in the ground and the rest run to the pond.' },
    { from: 1, to: 1, text: 'Tap the cloud again to rain on a fresh, dry garden.' },
    {
      from: 2,
      to: 2,
      text: 'Tap a ground tile to make that garden stone or soil; both gardens get the same rain.',
    },
    {
      from: 3,
      to: 3,
      text: 'The first rain is kept on a card; change the ground and rain again to compare.',
    },
    {
      from: 4,
      to: 4,
      text: "Tap a bed to make it stone or soil; the rain falls on the top bed and what it can't hold runs down.",
    },
    { from: 4, to: 4, text: 'Tap the cloud to try it as often as she likes; trying is free.' },
    { from: 4, to: 4, text: 'Tap the check when the leaf bed gets two drops and the pond at least one.' },
  ],
  finish: [
    { from: 1, to: 1, text: "Tap the leaf when she's done; it appears after one rain." },
    { from: 2, to: 2, text: "Tap the leaf when she's done; it appears after one rain on both gardens." },
    { from: 3, to: 3, text: "Tap the leaf when she's done; it appears after rain on two different grounds." },
    { from: 4, to: 4, text: 'The round ends when the check finds both needs met.' },
  ],
  note: [
    {
      to: 3,
      text: 'Every choice is fine here: there are no wrong answers and no misses. A pretend model: soil holds two drops and stone holds none. Real ground soaks rain in more slowly, and how much depends on how wet it already is. Show me has the pet point at the next step and counts as help; finishing with help still earns the sticker. Rounds without hints move her up, which means she joined in, not that she has learned fair tests.',
    },
    {
      from: 4,
      to: 4,
      text: 'Trying and changing the ground are free. A check that misses counts one miss and says where the water stayed; after two, the bed to change glows, which counts as help, as does Show me (the pet changes one bed). A pretend model: soil holds two drops, stone none; real ground soaks rain in slowly. Hard ground uphill sends its rain to the garden below, which is why real rain gardens sit low.',
    },
  ],
};
