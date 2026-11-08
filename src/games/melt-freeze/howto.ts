import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Warm and cool things, and see which ones melt and which go hard again.',
  steps: [
    { to: 2, text: 'Tap the sun to warm the thing, and the snowflake to cool it.' },
    { from: 3, to: 3, text: 'Make the thing the way the card shows: choose the sun or the snowflake.' },
    { from: 4, to: 4, text: 'Warm and cool the whole tray and see which things change.' },
  ],
  finish: [
    { to: 2, text: 'She has seen the thing melt and go hard again.' },
    { from: 3, to: 3, text: 'The thing is the way the card shows, three times.' },
    { from: 4, to: 4, text: 'Both tools used on each of two trays.' },
  ],
  note: [
    { to: 2, text: 'Nothing here counts as a mistake.' },
    {
      from: 3,
      to: 3,
      text: 'Choosing the wrong tool shows what it does; the pet gives a hint, and after two it glows.',
    },
    {
      from: 4,
      to: 4,
      text: 'Nothing here counts as a mistake. Each thing she watches melt on the tray is added to her discovery journal in the treehouse.',
    },
  ],
};
