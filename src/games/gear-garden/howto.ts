import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make the flowers spin with a machine of gears.',
  steps: [
    { from: 1, to: 1, text: 'Tap the machine to turn the handle; the gears turn the flower.' },
    { from: 2, to: 2, text: 'Drag the loose gear into the gap, then tap to turn.' },
    { from: 3, to: 3, text: 'Pick one of two broken machines, put its gear in the gap and turn.' },
    'The round arrow turns it the other way.',
  ],
  finish: 'Every flower has bloomed.',
  note: [
    {
      from: 1,
      to: 1,
      text: 'Nothing here is ever wrong; Show a hint turns the handle once by itself and counts as a hint.',
    },
    {
      from: 2,
      to: 2,
      text: 'Nothing here is ever wrong: turning a broken machine shows where the turning stops. Show a hint, the glow on the gap and the gear going in by itself count as one hint per machine.',
    },
    {
      from: 3,
      to: 3,
      text: 'Nothing here is ever wrong. Three gears turn the flower the same way as the handle and four the other way; she only watches this. Help counts as one hint per machine.',
    },
  ],
};
