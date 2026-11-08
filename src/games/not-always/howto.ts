import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Test the friend's claim about the cards: find the one card that shows it is not so, or check them all.",
  steps: [
    'The friend says something about all the cards; tap the friend or the sign to hear it again.',
    { from: 1, to: 1, text: 'Tap the card that breaks the claim.' },
    { from: 2, to: 2, text: 'Tap a card that breaks it, or press the stamp if it is true of every card.' },
    { from: 3, to: 3, text: 'After breaking the claim, choose the sign that is true of every card.' },
  ],
  finish: "The round ends after the friend's last claim; one sticker.",
  note: [
    {
      from: 2,
      to: 2,
      text: 'One card is enough to show "all" is wrong, and if two cards break a claim either is right. Every claim is about the cards on screen only. Rounds without hints move her up: she tested claims with the friend\'s spoken help, which is not evidence she reasons this way on her own.',
    },
    {
      text: 'One card is enough to show "all" is wrong. Every claim is about the cards on screen only. Rounds without hints move her up: she tested claims with the friend\'s spoken help, which is not evidence she reasons this way on her own.',
    },
  ],
};
