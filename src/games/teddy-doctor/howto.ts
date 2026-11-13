import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Look after the teddy patient.',
  steps: [
    {
      to: 1,
      text: 'Tap the patient anywhere: the nearest boo-boo gets a bandage. For the littlest, a tap anywhere in the room does it too.',
    },
    {
      from: 2,
      to: 2,
      text: 'Listen to where the patient hurts, then tap that place on the patient, or drag the bandage there.',
    },
    { from: 3, to: 3, text: 'Look at what is wrong, then drag what helps onto the patient.' },
    { from: 4, to: 4, text: 'Listen to what hurts, then use the right thing in the right place.' },
    { from: 5, to: 5, text: 'Do the check-up in the order shown on the picture card.' },
    { from: 6, to: 6, text: 'Do the check-up in the order the patient says.' },
    {
      from: 7,
      to: 7,
      text: 'Tap the friend with a boo-boo, then tap the patient to put on a bandage. Help three friends.',
    },
    {
      from: 8,
      to: 8,
      text: 'Listen to the patient’s rule. Drag the tools onto the patient in any order that keeps it. The pictures show the tools, without an order.',
    },
  ],
  finish: 'The round ends when the patient is all better.',
};
