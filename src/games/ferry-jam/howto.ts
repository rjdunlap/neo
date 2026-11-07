import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide the boats out of the way so the red ferry can reach the dock on the right.',
  steps: [
    'Drag a boat along the way it points; it stops at the next boat or the wall.',
    'Tap the round arrow to take back the last slide.',
    "Work out which boat is in the ferry's way and where it can go.",
    { from: 7, to: 7, text: 'A grey rock never moves: a boat has to wait somewhere else. Touching the rock only makes it wobble.' },
    { from: 8, to: 8, text: 'Two ferries: the red one leaves on the right, the yellow one at the bottom. A ferry sails away as soon as it reaches its dock, so one of them can go first to make room for the other; once one has sailed, the slides before it cannot be taken back.' },
    { from: 9, to: 9, text: "Only one boat is in the ferry's way: slide the one boat, and the ferry can sail." },
    { from: 10, to: 10, text: "Before any slide, tap the boat in the ferry's way, the one in its row in front of it; then the boats can slide. Another boat in the way stops it, so that one has to move first." },
  ],
  finish: 'The round ends when every ferry has sailed out of every harbor.',
  note: [
    { to: 9, text: 'Nothing is a mistake here: slide as much as you like. After many slides without getting closer, the glowing boat shows a next slide.' },
    { from: 10, text: "Tapping a boat that is not in the ferry's way counts as a mistake, and after two the right boat glows. The slides afterwards are never mistakes; after many slides without getting closer, the glowing boat shows a next slide." },
  ],
};
