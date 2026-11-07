import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Send each seed across to the tray, and find out how each one travels.',
  steps: [
    { from: 1, to: 1, text: 'Tap the bellows to blow the fluffy seed.' },
    { from: 1, to: 1, text: "Tap the basket when you're done." },
    { from: 2, to: 2, text: 'Tap the hooky seed, then tap the critter.' },
    { from: 3, to: 3, text: 'Choose a seed and a helper, in either order.' },
    { from: 3, to: 3, text: 'If it stays, try another helper.' },
  ],
  finish: 'Every seed in the tray earns a sticker.',
  note: 'A seed that stays is a good test, not a mistake. This is a toy model: real seeds travel in many ways.',
};
