import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Plant seeds and watch them grow.',
  steps: [
    {
      to: 1,
      text: 'Tap the soil: a seed goes in and grows into a flower. Each bed grows by itself, so tap as fast as you like.',
    },
    { from: 2, to: 2, text: 'Tap the soil to plant seeds, then tap the cloud to make it rain.' },
    { from: 3, to: 3, text: 'Tap the seeds of the color asked for: the seed goes in and grows at once.' },
    {
      from: 4,
      to: 4,
      text: 'Plant exactly the number of seeds asked for, then tap the cloud to make it rain; tap a seed to take it out.',
    },
    {
      from: 5,
      to: 5,
      text: 'Plant the number of seeds of each color asked for, like "2 red and 3 yellow", then tap the cloud; tap a seed to take it out.',
    },
    {
      from: 6,
      to: 6,
      text: 'Look at the flowers on the sign. Plant one more of that color than the sign shows, then tap the cloud; tap a seed to take it out.',
    },
    {
      from: 7,
      to: 7,
      text: 'Plant the flowers shown in two rows of three, then tap the cloud; tap a seed to take it out.',
    },
    {
      from: 8,
      to: 8,
      text: 'Touch anywhere on the garden: each touch grows the flower one step, from seed to sprout, leaves, bud and bloom. Touch again to put it in the vase.',
    },
    {
      from: 9,
      to: 9,
      text: 'Tap a seed packet to choose it, then tap beds to plant that color. Look at the sign: the top row and the bottom row each have their own color. Tap the cloud when the rows match; tap a seed to take it out.',
    },
    {
      from: 10,
      to: 10,
      text: 'Tap a seed packet to choose it, then tap beds to plant that color. Look at the sign: each column has its own color, top and bottom the same. Tap the cloud when the columns match; tap a seed to take it out.',
    },
    {
      from: 11,
      to: 11,
      text: 'The sign shows how many flowers go in each row. Plant that many in the top row and that many in the bottom row, in any beds, then tap the cloud; tap a seed to take it out.',
    },
    {
      from: 12,
      to: 12,
      text: 'Two beds grow from the same seeds. Tap the pair of cards that is different, tap the sun and cloud to grow both beds, then tap the bed that grew taller; count the steps on the rulers.',
    },
    {
      from: 13,
      to: 13,
      text: 'A question asks about sun or water. Tap a card on the second bed (the right-hand one) to flip it so that only that one thing is different from the first bed, then tap the sun and cloud; tap Undo to start the second bed again.',
    },
  ],
  note: [
    {
      from: 12,
      text: 'Real plants vary. This is a toy garden: it shows what changing one thing does, not how every plant grows. Ask: "Which bed would you put the plant in? What would you change next?" After the round you can flip any card and grow again to see what changes; that is never a mistake.',
    },
  ],
  finish: [
    {
      from: 12,
      to: 12,
      text: 'The round ends when three pairs of beds have grown and the taller bed was found.',
    },
    { from: 13, to: 13, text: 'The round ends when two questions have each been answered with a fair test.' },
    { to: 7, text: 'The round ends when the garden has grown as asked.' },
    { from: 9, to: 11, text: 'The round ends when three gardens have grown as the signs ask.' },
    { from: 8, to: 8, text: 'The round ends when three flowers are in the vase.' },
  ],
};
