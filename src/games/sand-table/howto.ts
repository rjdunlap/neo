import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Play with dry sand and see how it moves.',
  steps: [
    { from: 1, to: 1, text: 'Tap the sand to pour a shower of grains. At lap age a tap anywhere pours.' },
    { from: 2, to: 3, text: 'Tap the sand to pour a shower of grains.' },
    { from: 1, to: 1, text: 'Tap a scoop to lift some sand back into the bucket. Lap age has no scoop.' },
    { from: 2, to: 3, text: 'Tap a scoop to lift some sand back into the bucket.' },
    { from: 2, to: 3, text: 'Tap a side to choose where the sand goes.' },
    { from: 3, to: 3, text: 'Make it tall, flat or hilly, then tap the flag and watch the pet walk it.' },
    { from: 4, to: 4, text: 'Tap the breeze and watch the shimmering grains.' },
    { from: 4, to: 4, text: 'Tap Replay to watch again.' },
    { from: 4, to: 4, text: 'Tap under the part where the sand landed.' },
  ],
  finish: [
    {
      from: 1,
      to: 1,
      text: 'Tap the flag whenever you like the sand. At lap age the round ends by itself after eight pours.',
    },
    { from: 2, to: 2, text: 'Tap the flag whenever you like the sand.' },
    { from: 3, to: 3, text: 'Tap the flag (Show) whenever you like the sand.' },
    { from: 4, to: 4, text: 'The round ends when she finds where it landed.' },
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
    {
      from: 4,
      to: 4,
      text: 'The breeze is a made-up toy rule. Real wind also carries sand downwind and drops it where it is sheltered, but not like this.',
    },
  ],
};
