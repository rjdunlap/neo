import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Plant an orchard in equal rows and count its trees.',
  steps: [
    { to: 2, text: 'Tap each empty row to plant all its trees.' },
    { from: 3, to: 3, text: 'Choose how many trees fill the empty row, then tap that row to plant them.' },
    { to: 3, text: 'Tap each full row to count equal groups aloud, then choose the total on a number button.' },
    { from: 2, to: 3, text: 'Tap the turning arrow to view the same orchard from the side. Tap each group to count by columns, then choose the total again.' },
    { from: 4, to: 4, text: 'Tap the arrows to change how many rows. The saplings deal into equal rows and any left over stay in the basket. Tap Plant when the basket is empty.' },
    { from: 5, to: 5, text: 'Plant every different orchard for one basket. Each fills its frame, and the same orchard turned on its side is the same frame.' },
    { from: 6, to: 6, text: 'Tap a basket to try it in rows. When one leaves saplings over for every number of rows, tap the one-long-row button.' },
    { from: 8, to: 8, text: 'First tap the up and down arrows to move the path between rows, then tap the path button to lay it there. Anywhere works.' },
    { from: 7, to: 9, text: 'A path splits the orchard into two parts. Choose how many trees are in each part on the number buttons, then how many in the whole orchard. After a part is answered, tap its sign to hear it counted again.' },
  ],
  finish: [
    { to: 3, text: 'The round ends after two orchards are planted and counted.' },
    { from: 4, to: 4, text: 'Two baskets planted in equal rows make a round; one sticker.' },
    { from: 5, to: 5, text: 'Every shape for one basket makes a round; one sticker.' },
    { from: 6, to: 6, text: 'Two sets of baskets make a round; one sticker.' },
    { from: 7, to: 9, text: 'Two orchards split and counted make a round; one sticker.' },
  ],
  note: [
    { to: 3, text: 'Rows can be planted or counted in any order. Replaying a counted row adds nothing and is free support. Two wrong number choices glow the answer.' },
    { from: 4, to: 6, text: 'Arrows, trying baskets and a shape already planted are free. Plant with saplings left (or a wrong one-long-row claim) is a miss; a second glows the way. The row counts with none left over are the basket\'s factors; a basket with only one long row is a prime number, the others are composite.' },
    { from: 7, to: 9, text: 'Each wrong number is a miss; a second on one question glows the answer. Moving and laying the path and sign taps are free. Two parts that make the whole is the distributive property: 7 × 4 = 5 × 4 + 2 × 4, or 3 × 14 = 3 × 10 + 3 × 4.' },
  ],
};
