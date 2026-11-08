import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Follow a water drop as it moves between the sea, the sky, the mountain, the river and the ground.',
  steps: [
    'Tap a picture to choose where the drop goes next; dots show it rising, because real water vapour is invisible.',
    { from: 1, to: 1, text: 'Three places: the sea, the cloud and the river.' },
    { from: 2, to: 2, text: "A friend's postcard shows where to send the drop; any way there counts." },
    {
      from: 3,
      to: 3,
      text: "One picture is a place water can't reach from here; pick the places it really can go.",
    },
    'The book button replays the whole trip with the pet telling it.',
  ],
  finish: [
    { from: 1, to: 1, text: 'Tap the leaf; it appears after three stops.' },
    { from: 2, to: 2, text: "Tap the leaf; it appears when the drop reaches the postcard's place." },
    { from: 3, to: 3, text: 'Tap the leaf; it appears after four moves.' },
  ],
  note: [
    {
      from: 1,
      to: 2,
      text: 'No wrong answers here: every picture shown is a real move. A pretend model with five places: real water takes many more paths, can stay in one place for a very long time, and never has to come back where it started. Rounds without hints move her up, which means she joined in, not that she knows the water cycle.',
    },
    {
      from: 3,
      to: 3,
      text: "Picking a place water can't reach counts as a miss; two make the right ones glow, which counts as help. A pretend model with five places: real water takes many more paths, can stay in one place for a very long time, and never has to come back where it started. Rounds without hints move her up, which means she joined in, not that she knows the water cycle.",
    },
  ],
};
