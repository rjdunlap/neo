import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Serve ice cream to customers.',
  steps: [
    { to: 6, text: 'Tap a tub to put a scoop on the cone.' },
    { from: 8, to: 9, text: 'Tap a tub to put a scoop on the cone, bottom scoop first.' },
    {
      from: 10,
      to: 10,
      text: 'Tap any tub: one scoop is enough. Each of three customers munches it straight away.',
    },
    {
      from: 11,
      to: 11,
      text: 'The cone already has one scoop. Tap the customer whose picture matches its color. The other customer stays for the next cone.',
    },
    { to: 5, text: 'Tap the customer to hear the order again.' },
    { from: 2, to: 2, text: 'Choose the color the customer asks for.' },
    { from: 3, to: 3, text: 'Make the two scoops in the picture, in any order.' },
    {
      from: 4,
      to: 4,
      text: 'Stack the number and color of scoops the customer asks for. The picture shows that many scoops, and each one is counted aloud as it lands.',
    },
    { from: 5, to: 5, text: 'Stack the three flavors in the order of the picture, bottom to top.' },
    { from: 6, to: 6, text: 'Look at the picture, then stack the flavors in the same order after it hides.' },
    {
      from: 7,
      to: 7,
      text: 'Two friends order three scoops altogether. Tap a cone to choose it, then tap tubs. Tap a friend to peek; peeking counts as help.',
    },
    {
      from: 8,
      to: 8,
      text: 'Listen for one changed scoop, then build the new three-scoop order. Tap your friend to peek at the changed order.',
    },
    {
      from: 9,
      to: 9,
      text: 'Listen top first, then build bottom first. Tap your friend to see the upright cone.',
    },
    {
      from: 12,
      to: 12,
      text: 'Count the scoops already there. Tap the matching tub to add just enough to reach the number. Outlined slots show how many are missing; each added scoop is counted aloud.',
    },
    {
      from: 13,
      to: 13,
      text: 'Tap the tubs to match both color counts in the two picture rows. Either color can go first. Tap the customer to hear both counts again.',
    },
  ],
  finish: [
    {
      from: 7,
      to: 7,
      text: 'Serve both friends their matching cones, in either order, to finish the round.',
    },
    { from: 8, to: 9, text: 'Serve three matching three-scoop cones to finish the round.' },
    { to: 6, text: 'The round ends when all customers have their matching cones.' },
    { from: 10, to: 13, text: 'Serve three cones to finish the round.' },
  ],
  note: [
    {
      from: 7,
      to: 7,
      text: 'Both pictures hide after the two orders. A wrong scoop bounces back (one miss). The second miss on a cone glows its next tub (one hint for that cone). The first peek at each friend counts one hint; repeat peeks, choosing a cone and pet replay are free. Each cone keeps its scoops and help when you switch.',
    },
    {
      from: 8,
      to: 9,
      text: 'A wrong scoop bounces back (one miss). The second miss glows the next tub (one hint per customer). The first hidden-picture peek counts one more hint per customer; repeat peeks and pet replay are free. Scooping waits until the request or peek finishes.',
    },
    {
      from: 12,
      to: 13,
      text: 'Wrong colors and extra scoops bounce back (one miss). After two misses, a tub that still needs scoops glows (one hint). Tapping the customer repeats the order for free.',
    },
    { from: 10, to: 10, text: 'Every flavor works; there are no wrong scoops.' },
    {
      from: 11,
      to: 11,
      text: 'A wrong customer counts one miss and repeats their color. After two misses, the matching picture glows (one hint). Tapping the cone is free.',
    },
  ],
};
