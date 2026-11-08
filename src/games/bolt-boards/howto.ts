import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Take the boards down by their bolts, or bolt them back up to match a picture.',
  steps: [
    { from: 1, to: 8, text: 'Tap a bolt to take it out.' },
    { from: 2, to: 9, text: 'Two bolts hold a board up; with one, it swings; with none, it comes down.' },
    { from: 3, to: 8, text: 'A bolt under another board waits until that board is gone.' },
    { from: 6, to: 6, text: 'Tap a bolt, then tap a glowing empty hole for it.' },
    {
      from: 8,
      to: 8,
      text: 'Tap a bolt, then tap a glowing empty hole for it. A board that swings can cover a hole; there are always holes to spare.',
    },
    { from: 7, to: 7, text: 'Tap a bolt, then tap an empty hole for it.' },
    {
      from: 9,
      to: 9,
      text: 'Pick a board from the woodpile, then tap its glowing holes. Make the wall look like the picture: the board at the back goes up first.',
    },
  ],
  finish: [
    { from: 1, to: 4, text: 'Every board is down.' },
    { from: 5, to: 5, text: 'Nothing covers the friend.' },
    { from: 6, to: 6, text: 'Every board is down.' },
    { from: 7, to: 7, text: 'Nothing covers the friend.' },
    { from: 8, to: 8, text: 'Every board is down.' },
    { from: 9, to: 9, text: 'The wall matches the picture.' },
  ],
  note: [
    { from: 1, to: 3, text: 'The round arrow puts a bolt back, as often as you like.' },
    {
      from: 4,
      to: 6,
      text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake.',
    },
    {
      from: 7,
      to: 7,
      text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake, and so does putting a bolt in a covered hole.',
    },
    {
      from: 8,
      to: 8,
      text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake; a covered hole does not.',
    },
    {
      from: 9,
      to: 9,
      text: 'The round arrow takes back the last bolt, as often as you like. Tapping a covered hole counts as a mistake, unless the wall is already stuck.',
    },
  ],
};
