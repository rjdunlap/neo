import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find friends around the tree on a round island, put them where they are asked, find who cannot see a picture, choose what a friend sees, and read the island from the sky.',
  steps: [
    { to: 2, text: 'Tap an arrow, or the tree, to turn the island round and look behind the tree.' },
    { to: 1, text: 'Tap the friend who was hiding once you can see them.' },
    {
      from: 2,
      to: 2,
      text: 'Tap the friend you are asked for. The friends already in plain sight are not the one.',
    },
    {
      from: 3,
      to: 3,
      text: 'Three friends are showing. Tap the picture of the friend you cannot see; the island turns to show them.',
    },
    {
      from: 4,
      to: 4,
      text: 'Drag each friend from the shore behind, in front of or next to the tree, as asked.',
    },
    {
      from: 5,
      to: 5,
      text: 'Drag two friends where you are asked, two directions at once. Then tap the picture of the friend you think will be in front once the island turns halfway; any guess is fine, and the friend who was behind comes round to the front.',
    },
    {
      from: 6,
      to: 6,
      text: "A picture stands on the island. Tap the friend who can't see it: the one on the other side of the tree. The island turns so you see what that friend sees.",
    },
    {
      from: 7,
      to: 7,
      text: "Three friends stand round the tree, and three pictures show the island from each friend's side. Tap the picture of what the friend named sees; the island turns to the side of the picture you chose.",
    },
    {
      from: 8,
      text: 'Tap the map that shows the island from the sky. The boat is your side. A map with left and right swapped is named; a map from another side makes the island turn to match it, then back.',
    },
  ],
  finish: [
    { to: 3, text: 'The round ends after three hidden friends are found.' },
    { from: 4, to: 4, text: 'The round ends when all three friends are on the island.' },
    { from: 5, to: 5, text: 'The round ends after two pairs, each followed by a half turn.' },
    { from: 6, to: 7, text: 'The round ends after three pictures.' },
    { from: 8, text: 'The round ends after three maps.' },
  ],
};
