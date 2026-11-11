import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Keep something in the drawer and see that it stays.',
  steps: [
    { from: 1, to: 1, text: 'Tap a picture to put it on the tray.' },
    { from: 1, to: 1, text: 'Keep copies the tray into the drawer. Show copies the drawer into the window.' },
    { from: 1, to: 1, text: 'Change the tray, tap Show, then tap the tick.' },
    { from: 2, to: 3, text: 'An open hatch lets the new one in. A shut hatch keeps the old one.' },
    { from: 2, to: 3, text: 'Step runs one step. The tick runs every step and checks the window.' },
    { from: 3, to: 3, text: 'One hatch is wrong. Find it.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The window shows what the drawer kept while the tray holds something else.' },
    { from: 2, to: 3, text: 'The window ends on what the sign asks for, twice.' },
  ],
  note: [
    { from: 1, to: 1, text: 'This first look is a try-out, not a test. Trying things is never counted.' },
    { from: 2, to: 3, text: 'Trying things is never counted. A wrong Check only costs a gentle hint.' },
  ],
};
