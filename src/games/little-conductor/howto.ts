import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lead a little band: tap the turtle to play the tune slowly or the rabbit to play it fast.',
  steps: [
    'Tap the turtle or the rabbit; the band changes pace at the next beat.',
    { from: 1, to: 1, text: 'Hear the whole tune at your pace, then tap the green check.' },
    { from: 2, to: 2, text: 'Hear it both ways, then pick the way to finish with and tap the green check.' },
    {
      from: 3,
      to: 3,
      text: "Look at the listener's sign, tap the pad it shows to hear that half, then tap the green check; once for each half of the tune.",
    },
  ],
  finish: [
    { from: 1, to: 2, text: 'The band plays your tune once more and takes a bow.' },
    { from: 3, to: 3, text: 'Both halves match the signs and the band takes a bow.' },
  ],
  note: [
    {
      text: 'Tapping, switching and listening again are never counted; the notes never change, only how quickly they come, and fast is not better than slow.',
    },
    {
      from: 1,
      to: 2,
      text: 'Moving up a level here means she is ready for the next thing to try, not that she can tell tempos apart.',
    },
    {
      from: 3,
      to: 3,
      text: 'A check that does not match the sign counts as a miss; after two on one half the right pad glows, which counts as a hint. The sign is a picture to follow, not a sound to judge.',
    },
  ],
};
