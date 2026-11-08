import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pour and scoop sand to shape a little landscape.',
  steps: [
    'Tap the sand to pour a shower of grains.',
    'Tap a scoop to lift some sand back into the bucket.',
    { from: 2, to: 3, text: 'Tap a side to choose where the sand goes.' },
    { from: 3, to: 3, text: 'Make it tall, flat or hilly, then tap the flag and watch the pet walk it.' },
  ],
  finish: [
    { from: 1, to: 2, text: 'Tap the flag whenever you like the sand.' },
    { from: 3, to: 3, text: 'Tap the flag (Show) whenever you like the sand.' },
  ],
  note: [
    {
      from: 1,
      to: 2,
      text: 'Nothing here is wrong, and finishing is not a test. The sand follows a made-up toy rule; real sand behaves differently.',
    },
    {
      from: 3,
      to: 3,
      text: 'The picture is an idea to try, never a target. The sand follows a made-up toy rule; real sand behaves differently.',
    },
  ],
};
