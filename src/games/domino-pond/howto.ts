import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Lay a path of stepping stones for the duck.',
  steps: [
    'Tap a stone to pick it up. Tap the curved arrow to turn it.',
    'Tap a space with a diamond to put the marked end there.',
    { from: 1, to: 1, text: 'Match the number of dots at both ends.' },
    { from: 2, to: 2, text: 'Make each row add up to its number.' },
    { from: 3, to: 3, text: 'Match each column’s sign for fewer than, exactly, or more than.' },
    'Tap a placed stone to lift it back out. The back arrow undoes your last placement or lift.',
  ],
  finish: [
    { from: 1, to: 1, text: 'Match both pairs of dots and watch the duck cross.' },
    { from: 2, to: 3, text: 'Fill the pond, then tap the check mark to see if the duck can cross.' },
  ],
  note: 'The light bulb shows a stone to place or lift.',
};
