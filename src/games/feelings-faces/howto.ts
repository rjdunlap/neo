import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Notice how the pet and its friends feel.',
  steps: [
    { to: 1, text: 'Tap a feeling bubble to see the pet show that feeling.' },
    { from: 2, to: 2, text: "Look at the pet's face, then tap the matching face." },
    { from: 3, to: 4, text: 'Listen for the feeling named, then tap the face that shows it.' },
    { from: 5, to: 5, text: 'Listen to what the pet needs, then tap what helps.' },
    { from: 6, to: 6, text: 'Watch what happens, then tap how the pet feels.' },
    { from: 7, to: 7, text: 'Listen for the feeling named, then tap the friend who feels it.' },
    { from: 8, to: 8, text: 'Watch what happens, then choose what would help the pet feel better.' },
    {
      from: 9,
      to: 9,
      text: 'Tap the pet: each tap shows the next feeling and says its word. When it is sad, the next tap gives it a hug.',
    },
    { from: 9, to: 9, text: 'Make the face back, and say the word together.' },
    { from: 2, to: 6, text: 'Tap the pet to hear the question again.' },
    { from: 8, to: 8, text: 'Tap the pet to hear the question again.' },
    {
      from: 10,
      to: 10,
      text: 'Listen to what the pet needs, then choose one of the two helpers. Tap the pet to hear it again.',
    },
    {
      from: 11,
      to: 11,
      text: 'Watch Cat and Bunny react to the same happening. Listen for a name and look at the blue ring, then tap that friend’s face. Tap a friend to hear the question again.',
    },
    {
      from: 12,
      to: 12,
      text: 'Tap the friend to ask what they want. Listen and look at the thought bubble, then tap the matching offer. Tap the friend to hear the wish again.',
    },
    {
      from: 13,
      to: 13,
      text: 'Look at the pet’s face and the leftover clue, then choose the happening that explains both. Tap the pet to hear the question again.',
    },
  ],
  finish: [
    { to: 1, text: 'Free play ends by itself after a few taps, with a sticker.' },
    { from: 2, to: 8, text: 'Four questions, then a sticker.' },
    { from: 9, to: 9, text: 'Ends by itself after six taps, with a sticker.' },
    { from: 10, to: 12, text: 'Four questions, then a sticker.' },
    { from: 13, to: 13, text: 'Four questions, then a sticker.' },
  ],
  note: [
    {
      from: 12,
      to: 12,
      text: 'Each wish appears once, including quiet space. A calm friend is a successful ending too; the friend does not have to become happy.',
    },
    { to: 1, text: 'Pure exploring: tap bubbles to see each feeling.' },
    { from: 9, to: 9, text: 'Pure exploring: no wrong taps, one big target.' },
  ],
};
