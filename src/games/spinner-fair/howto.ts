import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Spin the spinner and watch the blocks; then use the spinner's picture to say what's likely.",
  steps: [
    { from: 1, to: 1, text: 'Tap the spinner; a block drops on the bar of the critter it lands on.' },
    { from: 2, to: 2, text: 'After eight spins, tap the bar of the critter that came up most.' },
    { from: 3, to: 3, text: "Pick the spinner with more of the pet's favourite, then spin it ten times." },
    {
      from: 4,
      to: 4,
      text: "Drag sure, maybe or no way onto each spinner: all of the pet's favourite is sure, some is maybe, none is no way.",
    },
    {
      from: 5,
      to: 5,
      text: 'Tap fair or unfair. If it is unfair, drag wedges onto the racer with fewer until both have three, then tap Check; then tap the spinner six times to run the race.',
    },
    {
      from: 6,
      to: 6,
      text: "Tap the spinner, then the arrows twice, and watch the strip; then tap about how many of the next 60 spins will be the pet's favourite.",
    },
    {
      from: 7,
      to: 7,
      text: 'Tap the tray to roll the two dice, twelve times; watch the grid of every way they can land fill in; then tap the sum with the most squares, and the one of two sums that comes up more.',
    },
    {
      from: 8,
      to: 8,
      text: 'Tap the spinner six times; each spin stands as a tower. Tap how far apart the tallest and shortest are, drag blocks from tall towers onto short ones until they are as level as they can be, then tap the height the level towers show.',
    },
  ],
  finish: [
    { from: 1, to: 3, text: 'The round ends after the last spins; one sticker, whatever the spinner did.' },
    {
      from: 4,
      to: 4,
      text: 'With every face on its spinner, each spinner spins once to show it; after the second set, one sticker.',
    },
    { from: 5, to: 5, text: 'After the second race, one sticker, whoever went furthest.' },
    {
      from: 6,
      to: 6,
      text: 'After the right card, 60 more spins play to check it; after the second wheel, one sticker, whatever the spins did.',
    },
    { from: 7, to: 7, text: 'After the second question, one sticker, whatever the dice rolled.' },
    { from: 8, to: 8, text: "After the second wheel's typical spin, one sticker, whatever the spins were." },
  ],
  note: [
    {
      from: 1,
      to: 3,
      text: "A spin is never a mistake; only a question the spinner's picture answers can be. A better chance can still lose: that is the lesson, not a bug. Nothing in the game is won, bet or unlocked by a spin.",
    },
    {
      from: 4,
      to: 4,
      text: 'Picking up a face and putting it back is never counted. A face dropped on a spinner it does not fit is a miss and slides back with the reason; after two on a set the answer glows, which counts as a hint. The showing spins judge nothing. Nothing in the game is won, bet or unlocked by a spin.',
    },
    {
      from: 5,
      to: 5,
      text: 'Moving wedges, either way, is never counted, and neither is how the race turns out. A wrong fair or unfair, or a Check before both have three, is a miss; after two in a race the next move glows, which counts as a hint. Nothing in the game is won, bet or unlocked by a spin.',
    },
    {
      from: 6,
      to: 6,
      text: "A long run gets close to the wheel's share, but a short run can be anything: an unusual run is chance, not a mistake. Only a wrong card is a miss, and the answer is in the wedges (each one is about ten of sixty); after two misses on a wheel the answer glows, which counts as a hint. Nothing in the game is won, bet or unlocked by a spin.",
    },
    {
      from: 7,
      to: 7,
      text: 'A roll is never a mistake, and twelve rolls can make any sum look common: the grid, not the rolls, answers both questions. Only a wrong card is a miss (count the squares that make each sum); after two on a question the squares and the answer glow, which counts as a hint. The first time the grid is filled, a card goes in the journal, whatever the dice did. Nothing in the game is won, bet or unlocked by a roll.',
    },
    {
      from: 8,
      to: 8,
      text: 'A spin is never a mistake and neither is any block she moves, whichever way it goes. Only a wrong card is a miss: the range is the outline blocks between the tallest and shortest towers, and the typical spin is the height the level towers show (when the blocks do not share out exactly, either of the two heights is right: it is about that many). After two wrong cards on a question, or a second block moved onto a taller tower, the answer or the next move glows, which counts as one hint for that wheel. Nothing in the game is won, bet or unlocked by a spin.',
    },
  ],
};
