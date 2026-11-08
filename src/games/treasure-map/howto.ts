import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Use the grid to find or place things.',
  steps: [
    { to: 1, text: 'Find the picture row and the color column, then tap the square where they meet.' },
    { from: 2, to: 2, text: 'Find the column letter, then the row number (like "B3"), and tap that square.' },
    { from: 3, to: 3, text: 'Find the square, like D2, and tap it to put the thing there.' },
    {
      from: 4,
      to: 4,
      text: 'Follow the directions from the start, like "3 right, then 1 up", and tap the square where you end up.',
    },
    {
      from: 5,
      to: 5,
      text: 'Read both landmark clues. Follow each line to the square where they meet, then tap it.',
    },
    {
      from: 6,
      to: 6,
      text: 'Write the card that walks the pet to the chest: tap the number and the arrow on each line until the footprints reach it, then press Go.',
    },
    {
      from: 7,
      to: 7,
      text: 'The chest is hidden. Dig anywhere: the footprints and the number say how many steps away it is, across plus up. Dig where every number still fits.',
    },
    {
      from: 8,
      to: 8,
      text: 'Slide the raft as the sign says, like "2 right and 1 up": tap the square where its flag lands, then tap the card showing the whole raft after the slide. A slide never turns the raft over.',
    },
    {
      from: 9,
      to: 9,
      text: 'Find the one color column or picture row the pet names, like "the red column", and tap any square in it.',
    },
    {
      from: 10,
      to: 11,
      text: 'A river and a road cross the map. Count squares out from the road and the river, like "2 squares right of the road and 1 below the river", and tap that square.',
    },
    {
      from: 11,
      text: 'The twin is just as far on the other side of the shimmering line: count from the thing to the line, then the same number across it, and tap there.',
    },
  ],
  finish: [
    { to: 2, text: 'The round ends when the treasure is found.' },
    { from: 3, to: 3, text: 'The round ends when the thing is placed.' },
    { from: 4, to: 7, text: 'The round ends when the treasure is found.' },
    { from: 8, to: 8, text: 'The round ends when three rafts have slid into place.' },
    { from: 9, text: 'The round ends after four finds.' },
  ],
};
