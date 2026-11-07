import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Mark where each friend is, then tap who has the missing treat or toy.',
  steps: [
    'Tap a square once for yes, twice for no, again to clear. A yes crosses its row and column.',
    { to: 1, text: 'Each clue card says where a friend is; tap it to hear it again.' },
    { from: 2, to: 2, text: 'A *not* clue makes its square a no; the friend\'s one place left is the yes.' },
    { from: 3, to: 5, text: 'Three friends, three places, *not* clues: rule out till each friend and place has one yes.' },
    { from: 4, to: 4, text: 'Clues name a friend by the hat on their card (red stripes, blue spots, yellow stars).' },
    { from: 5, to: 5, text: 'Two grids, where and what; some clues use hats. Place ✗ thing: who is there lacks it.' },
    { from: 6, to: 6, text: 'Four friends, four places. *Or* clues: the friend is in one of two places, so the other two are no. *Neither…nor*: both are no there. Some use hats (green zigzag too).' },
    { from: 7, to: 7, text: 'Case file: three linked grids (friend and place, friend and snack, snack and place) at grown-up size, from a written clue list; tap a clue to hear it. A yes in two grids decides the third.' },
    { from: 8, to: 8, text: 'Five friends, places and times of day; *before* clues rule out times. Drag the names to slide the big grid.' },
    'When all are placed, the missing thing appears by its place or thing: tap who has it. Help (?) points at the next clue to use; again marks it.',
  ],
  finish: [{ to: 2, text: 'The round ends after two mysteries.' }, { from: 3, text: 'The round ends after one mystery.' }],
  note: 'A mark one clue rules out by itself is one miss (judged once it rests), as are a full grid that breaks a clue and the wrong friend. After two misses the next square glows. Help is a hint; the press that marks is not.',
};
