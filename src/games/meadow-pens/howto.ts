import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Count grass squares and fence pieces to help friends with their pens.',
  steps: [
    { from: 1, to: 3, text: 'Tap or drag to paint grass; tap a square again to lift it.' },
    { from: 1, to: 1, text: 'Paint as many squares as your friend asks, any shape, then ring the bell.' },
    { from: 2, to: 2, text: "Count the field's rows and tap the card for the whole field." },
    {
      from: 3,
      to: 3,
      text: 'Paint six squares so the fence uses every piece on the stack, then ring the bell.',
    },
    {
      from: 4,
      to: 4,
      text: 'Listen for grass or fence; touch both pens to count; choose a flower pen or the same.',
    },
    { from: 5, to: 5, text: 'Touch each part to count it; choose the card for all the grass.' },
    { from: 6, to: 6, text: 'Count the rows. Choose how long the strip is.' },
    { from: 7, to: 7, text: 'Count the bales on one tray. Choose how many fill the loft.' },
  ],
  finish: [
    { from: 1, to: 1, text: "When every friend has a pen, it's done." },
    { from: 2, to: 2, text: "After five fields, it's done." },
    { from: 3, to: 3, text: "When every friend has a pen, it's done." },
    { from: 4, to: 7, text: "After five questions, it's done." },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Painting and lifting are free; only a bell ring with the wrong pen counts as a miss, and two light up a pen that works. Grass is the area and the fence is the perimeter; the game says only squares of grass and fence pieces.',
    },
    {
      from: 2,
      to: 2,
      text: 'A wrong card fills the field row by row; two light up the right card. Grass is the area and the fence is the perimeter; the game says only squares of grass and fence pieces.',
    },
    {
      from: 3,
      to: 3,
      text: 'Painting and lifting are free; only a bell ring with the wrong pen or the wrong fence counts as a miss, and two light up a pen that works. Grass is the area and the fence is the perimeter; the game says only squares of grass and fence pieces.',
    },
    {
      from: 4,
      to: 4,
      text: 'Compare area and perimeter, including equal counts. Only wrong answer cards miss; count replay is free. Two misses or Show a hint glow the correct card; then touching any answer card completes with help.',
    },
    {
      from: 5,
      to: 5,
      text: 'Add the areas of two rectangles. Only wrong answer cards miss; counting either part is free. Two misses or Show a hint glow the correct card; then touching any answer card completes with help.',
    },
    {
      from: 6,
      to: 6,
      text: "Find a strip of grass's hidden length from its squares and its rows. Only wrong answer cards miss; replays and touching the blanket are free. Two misses or Show a hint glow the correct card; then touching any answer card completes with help.",
    },
    {
      from: 7,
      to: 7,
      text: 'Find the bales in a loft from one tray and its layers. Only wrong answer cards miss; counting the tray or a layer is free. Two misses or Show a hint glow the correct card; then touching any answer card completes with help.',
    },
  ],
};
