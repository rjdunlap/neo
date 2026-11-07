import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Form capital letters, words and names by following a trail with one finger.',
  steps: [
    'Start at the glowing dot. The little arrow beside it shows which way the stroke goes.',
    "Drag along the firefly's path to draw the letter. Its note climbs as the stroke goes on.",
    { from: 7, to: 8, text: 'Trace each letter in turn, from the first to the last.' },
  ],
  finish: [
    { to: 6, text: 'The round ends when the whole letter has been traced.' },
    { from: 7, to: 8, text: 'The round ends when the whole word or name has been traced.' },
  ],
  note: 'Leaving the trail counts as a miss. On the second miss on one stroke the firefly flies the next stretch by itself and comes back; that counts as one hint. The ink color changes from round to round and never changes the trail.',
};
