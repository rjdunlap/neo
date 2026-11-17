import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Make the ribbon each gift's tag asks for: the right length from halves and quarters, the right name for the spool you choose at Whole Switch, or at Ribbon Cases two ribbons from one tray, mended when the order changes.",
  steps: [
    { from: 1, to: 3, text: 'Tap a piece and it joins the ribbon.' },
    { from: 7, to: 7, text: "Tap a gift, then tap pieces: each one joins that gift's ribbon." },
    {
      from: 7,
      to: 7,
      text: 'Tap a piece on a ribbon to take it back. The scissors snip a half into two quarters.',
    },
    { from: 1, to: 3, text: 'Tap a piece on the ribbon to take it back.' },
    { from: 2, to: 3, text: 'Tap the scissors, then a half, to snip it into two quarters.' },
    { from: 6, to: 6, text: 'Tap a spool to make it the whole.' },
    { from: 6, to: 6, text: 'Tap a name card: a quarter, a half or three quarters.' },
    { from: 1, to: 6, text: 'Tap the bow to check.' },
    { from: 7, to: 7, text: 'Tap the bow to check both ribbons.' },
    { from: 6, to: 6, text: 'Then give the same ribbon its other name by changing the spool.' },
    { from: 7, to: 7, text: 'When the order changes, move a piece from one gift to the other.' },
  ],
  finish: [
    { from: 7, to: 7, text: 'Two orders, one sticker.' },
    { from: 6, to: 6, text: 'Two names, one sticker.' },
    { from: 1, to: 3, text: 'Two gifts, one sticker.' },
  ],
  note: [
    {
      from: 7,
      to: 7,
      text: 'There is more than one right way to share the pieces. Three quarters and three quarters is the same amount of ribbon as one whole and a half.',
    },
    {
      from: 6,
      to: 6,
      text: 'Both names are right. A half of the short spool and a quarter of the long spool are the same ribbon.',
    },
    { from: 1, to: 3, text: 'Any way that makes the length counts: two quarters are as long as a half.' },
  ],
};
