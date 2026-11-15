import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Paint with colors.',
  steps: [
    { to: 1, text: 'Drag, pat or hold a finger on the page to paint; a quick tap splats a flower.' },
    {
      from: 2,
      to: 2,
      text: 'Tap a paint pot to pick a color and hear its name, then drag, pat or hold a finger on the page to paint. Each pot has its own mark as well as its color.',
    },
    {
      from: 2,
      to: 2,
      text: 'Some pages have a fold down the middle: paint, then tap the fold button to press the paper closed and print a matching copy on the other side.',
    },
    {
      from: 3,
      to: 4,
      text: 'Tap the paint pot for the color asked, then drag a finger across the named part, like the sun.',
    },
    {
      from: 5,
      to: 5,
      text: 'Think what color the named thing is (an apple), tap that paint pot, then drag a finger across it.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tap two paint pots to pour them into the bowl, then drag a finger across the named part to paint it with the mixed color.',
    },
    {
      from: 7,
      to: 7,
      text: 'Remember the pumpkin’s color, then tap two paint pots to mix it before dragging a finger across the pumpkin.',
    },
    {
      from: 8,
      to: 8,
      text: 'A color wheel with three empty petals: look at the two painted petals beside the empty one, tap those two paint pots to mix their color, then drag a finger across the empty petal. The recipe is shown by the neighbors, never said.',
    },
    {
      from: 9,
      to: 9,
      text: 'A white pot joins red, yellow and blue. Tap red and white to pour them into the bowl and make pink, then drag a finger across the pink picture (a pig, a flamingo, a cupcake or a tulip). The recipe is told.',
    },
    {
      from: 10,
      to: 10,
      text: 'The bowl takes three pours: tap red, yellow and blue to mix brown, then drag a finger across the brown picture (a bear, an acorn or an owl). A fourth pour starts the bowl over. The recipe is told.',
    },
    {
      from: 11,
      to: 11,
      text: 'Three pictures, each a different mixed color and at least one pink or brown. Remember the color, then pour its paints into the bowl (white is there, and the bowl takes three pours) and drag a finger across the picture. A first wrong color only names the right one; the recipe is told on the second, when the pots glow.',
    },
  ],
  finish: [
    {
      to: 2,
      text: 'A frame appears after five touches of any kind (or one touch and about 25 seconds); tap it to hang the painting up.',
    },
    { from: 3, text: 'The round ends when every asked-for part is colored.' },
  ],
  note: [
    {
      to: 2,
      text: 'Any color is welcome in free painting. After eight quiet seconds a blank spot sparkles and the pet hops, an invitation only, never counted as a hint.',
    },
    {
      from: 2,
      to: 2,
      text: 'Folding is never needed: any painting can be hung up, a fold counts as one of the five touches, and folding again only prints the new paint.',
    },
  ],
};
