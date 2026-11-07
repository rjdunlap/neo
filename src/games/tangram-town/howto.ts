import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fit shapes together to build a picture.',
  steps: [
    { to: 6, text: 'Drag each shape onto its shadow.' },
    { from: 7, to: 7, text: 'Make the house wall with one square or two triangles; add its roof. Either way finishes.' },
    { from: 7, to: 7, text: 'Leave spare shapes in the tray.' },
    { from: 3, to: 7, text: 'To turn a shape, choose it and tap the round arrow; the yellow button helps.' },
    { from: 8, to: 8, text: 'Find a shape facing the wrong way. Tap it, then use the round arrow to turn it in place.' },
    { from: 8, to: 8, text: 'Turns are free experiments; four turns put a shape back. The yellow button shows a mismatch.' },
    { from: 8, to: 8, text: 'Tap the green check when every shape matches its outline.' },
    { from: 6, to: 7, text: 'Fill the whole silhouette; the yellow button shows outlines and the next turn.' },
  ],
  finish: [{ to: 7, text: 'The round ends when the shapes fill the picture.' }, { from: 8, to: 8, text: 'A correct green check ends the repaired picture.' }],
  note: 'For toddler, preschool and pre-K play, each piece says its shape name the first time you pick it up.',
};
