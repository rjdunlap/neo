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
      text: 'Tap the spinner six times; each spin stands as a tower. Tap how far apart the tallest and shortest are, drag blocks from tall towers onto short ones until the towers are as even as they can be, then tap the height they show.',
    },
    {
      from: 9,
      to: 9,
      text: "Hand wedges between the two critters (tap a critter's box, or drag a wedge onto it) until the pet's favourite has the share it asked for, then tap Check.",
    },
    {
      from: 10,
      to: 10,
      text: 'Tap the spinner (or the arrows, to hurry): it spins until one critter comes up five times in a row. Then tap who is more likely next (either critter, or the same), and spin once more.',
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
    {
      from: 9,
      to: 9,
      text: 'After a right Check, 80 spins play to bear it out; after the second wheel, one sticker, whatever the spins did.',
    },
    { from: 10, to: 10, text: "After the second wheel's one more spin, one sticker, whoever came up." },
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
      text: 'No spin or block move is ever a mistake; only a wrong card is a miss. The range is the outline blocks between the tallest and shortest towers; the typical spin is the height the evened towers show (if they show two, either is right). After two wrong cards on a question, or a second block moved onto a taller tower, the answer or next move glows: one hint for that wheel.',
    },
    {
      from: 9,
      to: 9,
      text: 'Moving wedges, either way, is never counted, and neither is how the 80 spins turn out: a run far from the share is called unusual, not a mistake. Only a Check on a wheel that is not the share is a miss (each wedge is one of eight, so 1 out of every 4 is two wedges); after two on a wheel the share is marked on the rim and the next move glows, which counts as a hint. Nothing in the game is won, bet or unlocked by a spin.',
    },
    {
      from: 10,
      to: 10,
      text: 'A run of one result does not change the next spin: the chance is in the wheel. No spin is ever a mistake. Only a wrong card is a miss: with three wedges each the answer is the same, otherwise it is the critter with more wedges. After two wrong cards on a wheel the wedge counts and the answer glow, which counts as a hint. Nothing is won, bet or unlocked by a spin.',
    },
  ],
};
