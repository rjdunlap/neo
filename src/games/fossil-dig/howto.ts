import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Brush the dust off a stone, mark where the leaf print was found, then pick the leaf it looks like.',
  steps: [
    'Rub or tap the dusty stone until the leaf print shows.',
    'Tap the flag of the square the stone is in.',
    { from: 1, to: 1, text: 'Tap the leaf whose shape matches the print, then tap Check.' },
    {
      from: 2,
      to: 2,
      text: "Tap the print, or a leaf's magnifying glass, to see its edge up close. Then tap the leaf whose edge matches, and tap Check.",
    },
  ],
  finish: 'The record card goes into the field notebook.',
  note: [
    {
      from: 1,
      to: 1,
      text: 'Brushing, looking and swapping a leaf are never counted against her. A wrong flag or a wrong leaf counts as a miss; after two the right one glows, which counts as a hint. The leaves and the cliff are made up for the island; nothing here is a real fossil, a real place or advice about digging.',
    },
    {
      from: 2,
      to: 2,
      text: 'Brushing, looking and swapping a leaf are never counted against her. A wrong flag or a wrong leaf counts as a miss; after two the right one glows, which counts as a hint. Both leaves have the same shape here; only the edge, teeth or smooth, tells them apart. The leaves and the cliff are made up for the island; nothing here is a real fossil, a real place or advice about digging.',
    },
  ],
};
