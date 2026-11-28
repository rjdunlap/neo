import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Stir things into a cup of water and see which vanish into it, which sink and stay, and which float on top.',
  steps: [
    { to: 2, text: 'Tap the spoon to stir the next thing into the cup.' },
    {
      from: 3,
      to: 3,
      text: 'Three cups are already stirred. Tap the one that has the thing on the card in it.',
    },
    {
      from: 4,
      to: 4,
      text: 'Tap the picture that shows what you think will happen, then tap the spoon to find out.',
    },
    {
      from: 5,
      to: 5,
      text: 'Tap the swirling cup to let it settle and look, then tap where it goes: vanished, sank or floated.',
    },
  ],
  finish: [
    { to: 1, text: 'Sugar and sand stirred in.' },
    { from: 2, to: 2, text: 'Three things stirred in, one of each kind.' },
    { from: 3, to: 3, text: 'Three cups found.' },
    { from: 4, to: 4, text: 'Four things guessed and stirred in.' },
    { from: 5, to: 5, text: 'Six cups put away.' },
  ],
  note: [
    {
      to: 2,
      text: 'Nothing here counts as a mistake. Tap a cup with sugar in it: the shimmer shows it is still in there.',
    },
    {
      from: 3,
      to: 3,
      text: 'A wrong cup shows what is in it, with a hint; after two the right cup glows.',
    },
    { from: 4, to: 4, text: 'A guess is never a mistake; a surprise is the point.' },
    {
      from: 5,
      to: 5,
      text: 'Looking is free. A cup put in the wrong place comes back with a hint, and after two the right place glows.',
    },
  ],
};
