import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Warm and cool things, and see which ones melt, which go hard again, and which changes can’t go back.',
  steps: [
    { to: 2, text: 'Tap the sun to warm the thing, and the snowflake to cool it.' },
    { from: 3, to: 3, text: 'Make the thing the way the card shows: choose the sun or the snowflake.' },
    { from: 4, to: 4, text: 'Warm and cool the whole tray and see which things change.' },
    { from: 5, to: 5, text: 'Tap anywhere a few times to melt the ice. Then tap the snowflake.' },
    {
      from: 6,
      to: 6,
      text: 'Tap the card that shows what you think the sun will do, then tap the sun to find out.',
    },
    {
      from: 7,
      to: 7,
      text: 'Tap the snowflake to test the changed thing, then tap where it belongs: goes back, or can’t go back.',
    },
  ],
  finish: [
    { to: 2, text: 'She has seen the thing melt and go hard again.' },
    { from: 3, to: 3, text: 'The thing is the way the card shows, three times.' },
    { from: 4, to: 4, text: 'Both tools used on each of two trays.' },
    { from: 5, to: 5, text: 'The ice melts and freezes again.' },
    { from: 6, to: 6, text: 'Four things guessed and tested.' },
    { from: 7, to: 7, text: 'Four things filed.' },
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
    { from: 5, to: 5, text: 'There are no mistakes to count. Let her tap at her own pace.' },
    { from: 6, to: 6, text: 'A guess is never a mistake; a surprise is the point.' },
    {
      from: 7,
      to: 7,
      text: 'Testing is free. A thing filed in the wrong place comes back with a hint, and after two the right place glows.',
    },
  ],
};
