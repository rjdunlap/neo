import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pop the bubbles.',
  steps: [
    { to: 3, text: 'Tap a bubble to pop it.' },
    { from: 15, to: 15, text: 'Tap or pat anywhere on the screen. The bubble nearest the touch pops, so there is nothing to aim at.' },
    { from: 4, to: 6, text: 'Listen for the color, then tap only the bubbles of that color.' },
    { from: 7, to: 9, text: 'Tap the numbered bubbles in order, starting at 1.' },
    { from: 12, to: 12, text: 'Tap the numbered bubbles in order, starting at the number on the sign at the top, then counting up.' },
    { from: 13, to: 13, text: 'Start at the number on the sign at the top, then tap the bubbles counting back, one less each time, down to 1.' },
    { from: 14, to: 14, text: 'The sign at the top says what to count by, tens or fives. Tap the bubbles in that order, starting with the smallest.' },
    { from: 7, to: 8, text: 'Count the dots beneath a number if you want help.' },
    { from: 10, to: 11, text: 'The sign at the top shows the number the two bubbles make together.' },
    { from: 10, to: 10, text: 'Count the dots on the two bubbles together to make 5.' },
    { from: 10, to: 10, text: 'Tap a bubble to hold it, then tap the bubble that makes 5 with it. Tap the held bubble again to let it go.' },
    { from: 11, to: 11, text: 'Tap a bubble to hold it, then tap the bubble that makes 10 with it. Tap the held bubble again to let it go.' },
  ],
  finish: [
    { to: 14, text: 'The round ends when the last bubble that was asked for is popped.' },
    { from: 15, text: 'After a few pops a rainbow bubble floats up; a touch anywhere pops it and the round ends.' },
  ],
  note: [
    { to: 14, text: 'A wrong bubble only wobbles and gets a spoken hint; nothing is lost.' },
    { from: 15, text: 'No touch is wrong: a touch with no bubble on the screen does nothing.' },
  ],
};
