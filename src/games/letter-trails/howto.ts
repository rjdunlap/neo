import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Form capital letters, words and names by following a trail with one finger.',
  steps: [
    'Start at the glowing dot. The little arrow beside it shows which way the stroke goes.',
    "Drag along the firefly's path to draw the letter. Its note climbs as the stroke goes on.",
    { from: 7, to: 8, text: 'Trace each letter in turn, from the first to the last.' },
    {
      from: 9,
      to: 9,
      text: 'The same capital three times: a solid trail, then dots, then only the start ring. Three dots under the letter show the try.',
    },
  ],
  finish: [
    { to: 6, text: 'The round ends when the whole letter has been traced.' },
    {
      from: 7,
      to: 7,
      text: "The round ends when the whole word has been traced and the word's own picture appears.",
    },
    {
      from: 8,
      to: 8,
      text: 'The round ends when the name has been traced (up to eight letters) and a sign shows the whole name.',
    },
    {
      from: 9,
      to: 9,
      text: "The round ends after the third try, when the letter's picture appears.",
    },
  ],
  note: [
    {
      to: 6,
      text: 'Leaving the trail counts as a miss. On the second miss on one stroke the firefly flies the next stretch by itself and comes back; that counts as one hint. The ink color changes from round to round and never changes the trail.',
    },
    {
      from: 7,
      to: 8,
      text: 'Leaving the trail is a miss; on the second miss on one stroke the firefly flies the next stretch and comes back (a hint). Each letter counts at most one miss and one hint, so a long name is judged like a short word.',
    },
    {
      from: 9,
      to: 9,
      text: 'The path is the same on every try; only what is drawn changes. Leaving it is a miss and brings the solid trail back; a second miss and the firefly shows the way (one hint per try at most).',
    },
  ],
};
