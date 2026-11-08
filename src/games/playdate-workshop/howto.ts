import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Listen to what two friends would like, and help them make it with the craft things.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap a friend to give them the stamp pad; tap their page to stamp, and tap the pad to pass it.',
    },
    { from: 2, to: 3, text: 'Pick a way to make it on a card; Try it shows what happens, Make it starts.' },
    {
      from: 2,
      to: 3,
      text: "Make the plan: give the tools, stamp or roll, and pass the pad when it's the other friend's turn.",
    },
    { from: 3, to: 3, text: 'Both friends tell you what they want; a plan that leaves one out shows which.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'When both pages have their star, tap Finish.' },
    { from: 2, to: 2, text: 'When the banner is full, tap Finish.' },
    { from: 3, to: 3, text: 'When the plan is made and both friends have what they asked for, tap Finish.' },
  ],
  note: "Nothing here counts as a miss: trying plans, out-of-turn taps and Undo are free. The lightbulb and the pet's help count as help. These are pretend friends' requests, not advice about real friendships.",
};
