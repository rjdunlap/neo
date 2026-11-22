import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Test the friend's claim about the cards: find the one card that shows it is not so, or check them all.",
  steps: [
    'The friend says something about all the cards; tap the friend or the sign to hear it again.',
    { from: 1, to: 1, text: 'Tap the card that breaks the claim.' },
    { from: 2, to: 2, text: 'Tap a card that breaks it, or press the stamp if it is true of every card.' },
    { from: 3, to: 3, text: 'After breaking the claim, choose the sign that is true of every card.' },
    {
      from: 4,
      to: 4,
      text: 'The claim is about some of the cards ("every red one is round"): tap one of those that breaks it, or press the stamp. Cards outside that group cannot break it.',
    },
    {
      from: 5,
      to: 5,
      text: 'Two friends disagree about a picture: tap a friend to hear them again, then choose the answer that shows who is right, not the one that is only sure or says it again.',
    },
    {
      from: 6,
      to: 6,
      text: 'Two signs about one row: tap a card that breaks either sign, or press the stamp when both are true. Afterwards, choose what to say to the friend; that choice is never scored.',
    },
  ],
  finish: "The round ends after the friend's last claim; one sticker.",
  note: [
    {
      from: 4,
      to: 4,
      text: "Every claim is checked against the picture on screen only. Rounds without hints move her up: she tested claims with the friend's spoken help, which is not evidence she reasons this way on her own.",
    },
    {
      from: 5,
      to: 6,
      text: "For about 10 and up. Every claim is checked against the picture on screen only. Rounds without hints move her up: she tested claims with the friend's spoken help, which is not evidence she reasons this way on her own.",
    },
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
