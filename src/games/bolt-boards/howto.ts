import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Take out the bolts so the boards come down.',
  steps: [
    'Tap a bolt to take it out.',
    { from: 2, to: 8, text: 'Two bolts hold a board up; with one, it swings; with none, it comes down.' },
    { from: 3, to: 8, text: 'A bolt under another board waits until that board is gone.' },
    { from: 6, to: 6, text: 'Tap a bolt, then tap a glowing empty hole for it.' },
    { from: 8, to: 8, text: 'Tap a bolt, then tap a glowing empty hole for it. A board that swings can cover a hole; there are always holes to spare.' },
    { from: 7, to: 7, text: 'Tap a bolt, then tap an empty hole for it.' },
  ],
  finish: [
    { from: 1, to: 4, text: 'Every board is down.' },
    { from: 5, to: 5, text: 'Nothing covers the friend.' },
    { from: 6, to: 6, text: 'Every board is down.' },
    { from: 7, to: 7, text: 'Nothing covers the friend.' },
    { from: 8, to: 8, text: 'Every board is down.' },
  ],
  note: [
    { from: 1, to: 3, text: 'The round arrow puts a bolt back, as often as you like.' },
    { from: 4, to: 6, text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake.' },
    { from: 7, to: 7, text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake, and so does putting a bolt in a covered hole.' },
    { from: 8, to: 8, text: 'The round arrow puts a bolt back, as often as you like. Tapping a bolt that is under a board counts as a mistake; a covered hole does not.' },
  ],
};
