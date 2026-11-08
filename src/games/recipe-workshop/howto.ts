import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put pretend things in a bowl, mix them, and serve what you made.',
  steps: [
    'Tap a pot to put some in the bowl; the spoon mixes everything in it.',
    { from: 1, to: 1, text: 'Any bowl is right: tap Serve when you like.' },
    { from: 2, to: 3, text: 'Make the bowl on the card: one of each, in either order, then mix.' },
    { from: 3, to: 3, text: "Tap a bowl to work on it; mix first, then put that friend's topping on top." },
  ],
  finish: [
    { from: 1, to: 1, text: 'Serve shows the bowl you made.' },
    { from: 2, to: 2, text: "When Serve matches the card, it's done." },
    { from: 3, to: 3, text: "When both friends have their bowl, it's done." },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Every bowl is right here, so this shows play, not following a recipe. Pretend food only: nothing here is a real recipe or advice about what to eat.',
    },
    {
      from: 2,
      to: 3,
      text: "Adding, mixing and Undo are free to try; only a Serve that doesn't match the card counts as a miss, and two on one bowl light up the next step and count as help. Pretend food only: nothing here is a real recipe or advice about what to eat.",
    },
  ],
};
