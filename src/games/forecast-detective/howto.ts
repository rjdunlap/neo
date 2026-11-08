import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Work out tomorrow's weather from clues, or say when the clues can't tell.",
  steps: [
    'Tap a flap to see a clue: the wind vane, a postcard from each island, the thermometer.',
    "Tomorrow's sky comes on the wind from one island; freezing turns rain to snow.",
    { from: 1, to: 1, text: 'Pick a weather and press Check.' },
    {
      from: 2,
      to: 2,
      text: "One clue didn't come: pick a weather if the others still decide, or Can't tell yet if they don't.",
    },
  ],
  finish: "A right Check shows tomorrow's sky arriving.",
  note: [
    {
      from: 1,
      to: 1,
      text: "Opening clues is never wrong, and not every clue is needed. A ruled-out weather, or one when the clues can't decide, is a miss; two misses cross out the impossible ones (one hint). A pretend valley rule: real forecasts use many measurements and are still sometimes wrong. Moving up means she reasoned with the valley's rule, not that she can forecast real weather.",
    },
    {
      from: 2,
      to: 2,
      text: "About 10 and up. Opening clues is never wrong, and not every clue is needed. A ruled-out weather, or one when the clues can't decide, is a miss; two misses cross out the impossible ones (one hint). A pretend valley rule: real forecasts use many measurements and are still sometimes wrong. Moving up means she reasoned with the valley's rule, not that she can forecast real weather.",
    },
  ],
};
