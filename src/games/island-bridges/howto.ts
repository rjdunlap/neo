import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Join the islands with bridges: each island needs as many planks as its number.',
  steps: [
    'Tap the water between two islands to lay a plank; tap again for a second. Bridges cannot cross.',
    'Tap Take off, then a bridge, to lift a plank.',
    'Hint shows a bridge to try; Start over clears the sea.',
    {
      from: 6,
      to: 6,
      text: 'Counting alone stalls here: a bridge that would leave a group of full islands cut off from the rest cannot be filled. Hint rings such a group with dashes.',
    },
    {
      from: 7,
      to: 7,
      text: 'A bridge can carry up to three planks here: tap the water a third time for a third. A fourth bumps. Numbers run to twelve.',
    },
  ],
  finish: 'The puzzle is done when every island has its planks and all the islands are joined.',
  note: 'Only a hint counts, as help: a plank that is not in the answer is not a miss, and taking a plank off is free. At school she plays the two small seas, 5 by 5 then 7 by 7 (about 9 and up), with bigger cells and buttons.',
};
