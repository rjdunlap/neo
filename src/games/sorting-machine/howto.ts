import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Build the machine the sign asks for, then check it on every friend.',
  steps: [
    'Tap a friend, then Send, and watch the sensor and the door.',
    { from: 1, to: 1, text: 'Send both friends, then tap the tick.' },
    { from: 2, to: 2, text: 'Tap the slot to choose the sensor.' },
    { from: 2, to: 2, text: 'Check tries every friend at once.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Both friends have been through the machine.' },
    { from: 2, to: 2, text: 'Every friend gets the answer the sign wants.' },
  ],
  note: [
    { from: 1, to: 1, text: 'This first look is a try-out, not a test. Sending is never counted.' },
    { from: 2, to: 2, text: 'Sending is never counted. A wrong Check only costs a gentle hint.' },
  ],
};
