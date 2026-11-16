import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find the animals in the barnyard, garden, beach or bedroom.',
  steps: [
    {
      from: 16,
      to: 16,
      text: 'Touch anywhere on the screen: the big house opens and an animal says hello. If she waits, it opens by itself.',
    },
    {
      from: 1,
      to: 2,
      text: 'Tap a hiding place to see who is behind it. Sometimes the animal is sleepy, surprised or singing, and the voice says so.',
    },
    {
      from: 17,
      to: 17,
      text: 'Watch the animal trot in and hop behind one of the two hiding places, then tap where it went. The other one is empty.',
    },
    { from: 3, to: 5, text: 'Listen for the animal asked about, then tap where it is peeking.' },
    { from: 6, to: 8, text: 'Watch who hides where, then tap the hiding place of the animal asked about.' },
    {
      from: 9,
      to: 9,
      text: 'Three animals stand up. Listen to the clue (who is sleepy, or who has spots or long ears), then tap that animal.',
    },
    {
      from: 10,
      to: 11,
      text: 'Only the tops of their heads show. Listen for the animal asked about, then tap the one whose ears (or horns, or tuft) are its own.',
    },
    {
      from: 12,
      to: 14,
      text: 'Watch who hides where, then follow the houses as they trade places. Tap the house the animal asked about ended up in.',
    },
    {
      from: 15,
      to: 15,
      text: 'Four animals stand up. Listen to both clues, then tap the one animal with both features. Tap the guide to hear the clues again.',
    },
  ],
  finish: [
    {
      from: 16,
      to: 16,
      text: 'The round ends after six touched reveals; the house opening by itself does not count.',
    },
    { to: 1, text: 'The round ends after eight reveals.' },
    { from: 2, to: 2, text: 'The round ends after twelve reveals.' },
    { from: 17, to: 17, text: 'The round ends when she has found where the animal went four times.' },
    { from: 3, to: 15, text: 'The round ends when every animal asked about has been found.' },
  ],
};
