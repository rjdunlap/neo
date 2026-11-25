import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lead a little band: tap the turtle to play the tune slowly or the rabbit to play it fast.',
  steps: [
    'Tap the turtle or the rabbit; the band changes pace at the next beat.',
    { from: 1, to: 1, text: 'Hear the whole tune at your pace, then tap the green check.' },
    { from: 2, to: 2, text: 'Hear it both ways, then pick the way to finish with and tap the green check.' },
    {
      from: 4,
      to: 4,
      text: 'Tap the small drum for soft and the big drum for loud; hear the tune both ways, then pick the one to finish with and tap the green check.',
    },
    {
      from: 5,
      to: 5,
      text: 'Pick slow or fast with the turtle and rabbit, and soft or loud with the small and big drums; hear at least two of the four ways, then tap the green check to finish with the one you are playing.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tap a friend to ask them to play; tap again to ask them to stop. The change comes on the next beat. Hear at least two different groups of friends play the whole tune, then tap the green check to finish with the group you are playing.',
    },
    {
      from: 3,
      to: 3,
      text: "Look at the listener's sign, tap the pad it shows to hear that half, then tap the green check; once for each half of the tune.",
    },
  ],
  finish: [
    { from: 1, to: 2, text: 'The band plays your tune once more and takes a bow.' },
    {
      from: 4,
      to: 4,
      text: 'The band plays your tune once more, as softly or loudly as you chose, and takes a bow.',
    },
    {
      from: 5,
      to: 5,
      text: 'The band plays your tune once more, at the pace and strength you chose, and takes a bow.',
    },
    {
      from: 6,
      to: 6,
      text: 'The band plays your tune once more with the friends you chose, and takes a bow.',
    },
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
      from: 4,
      to: 4,
      text: 'Only how strongly the band plays changes: the notes and the pace stay the same, and soft is not better than loud. Nothing is ever louder than the device volume allows.',
    },
    {
      from: 5,
      to: 5,
      text: 'Both dials change on the next beat, and the notes never change. Nothing is a miss: no way is better, and the tune must be heard whole in the way you finish with.',
    },
    {
      from: 6,
      to: 6,
      text: 'The tune keeps going whoever is in, at one steady pace, and every friend joins or leaves on a beat. Nothing is a miss: no group is better, and a stage with nobody on it just waits to be invited.',
    },
    {
      from: 3,
      to: 3,
      text: 'A check that does not match the sign counts as a miss; after two on one half the right pad glows, which counts as a hint. The sign is a picture to follow, not a sound to judge.',
    },
  ],
};
