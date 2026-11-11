import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Keep something in the drawer and see that it stays.',
  steps: [
    { from: 1, to: 1, text: 'Tap a picture to put it on the tray.' },
    { from: 1, to: 1, text: 'Keep copies the tray into the drawer. Show copies the drawer into the window.' },
    { from: 1, to: 1, text: 'Change the tray, tap Show, then tap the tick.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The window shows what the drawer kept while the tray holds something else.' },
  ],
  note: [
    { from: 1, to: 1, text: 'This first look is a try-out, not a test. Trying things is never counted.' },
  ],
};
