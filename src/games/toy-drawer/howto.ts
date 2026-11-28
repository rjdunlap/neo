import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fit every toy into the drawer. Any layout that keeps the toys inside, not overlapping, is right.',
  steps: [
    'Drag a toy from the tray into the drawer, or tap the toy and then tap the drawer.',
    'To make room, drag a toy to another spot or back to the tray. The arrow button undoes the last move.',
    { from: 3, text: 'To turn a toy, tap it and then tap the round arrow. Tall toys can lie down.' },
    {
      from: 4,
      text: 'Some toys start in the drawer and one waits in the tray. Drag a toy out, move it, then fit the newcomer. Start over brings back the first arrangement.',
    },
  ],
  finish: 'When every toy is in, tap the green check to close the drawer.',
  note: 'Nothing here is ever wrong: a toy that will not fit just slides back. The yellow hand shows a spot that fits, or which toy to move.',
};
