import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put four rock events in the order this made-up cliff shows, then say whether the rocks tell that order for sure.',
  steps: [
    'Tap a card, then another, to swap them. Play builds the story’s cliff in the empty frame, card by card.',
    'Tap Check when the story’s cliff matches the real one.',
    { from: 1, to: 1, text: 'Then answer: Yes, only this story, or Not enough to tell.' },
    {
      from: 2,
      to: 2,
      text: 'Sand hides one contact, so two stories fit: Not enough to tell. Pick the look that could tell them apart and tap Look.',
    },
  ],
  finish: [
    { from: 1, to: 1, text: 'The case closes when the story fits and the answer is given.' },
    { from: 2, to: 2, text: 'The case closes when the one story that still fits is checked.' },
  ],
  note: 'The island’s rules: layers laid flat, lower first; nothing flipped; dark rock cuts what was already there. Real cliffs can be bent or broken; this one is not. Swaps, Play and look cards are free; a wrong Check, answer or look is a miss.',
};
