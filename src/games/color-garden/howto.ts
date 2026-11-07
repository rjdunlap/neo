import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Explore colors and sort fruit, balloons and flowers into matching baskets.',
  steps: [
    { to: 1, text: 'Drag each fruit to the basket.' },
    { from: 2, to: 5, text: 'Drag each fruit to the basket of the same color.' },
    { from: 6, to: 6, text: 'Drag each fruit, balloon and flower to the basket of the same color. A balloon or flower can be any color.' },
    { from: 7, to: 7, text: 'Both baskets are blue. Drag each balloon and flower to the light blue basket or the dark blue one, whichever matches.' },
    { from: 8, to: 8, text: 'The sign over the tree says how to sort: by color (two color baskets) or by what it is (a fruit basket and a balloon basket). Drag each fruit and balloon to the basket the sign asks for.' },
    { from: 9, to: 9, text: 'Tap any fruit. It hops into its own color basket and the pet names its color. Every choice works.' },
  ],
  finish: 'The round ends when everything is in a basket.',
};
