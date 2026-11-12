import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find out which things float and which sink.',
  steps: [
    { to: 2, text: 'Tap a thing to drop it in the water and watch.' },
    { from: 3, to: 3, text: 'Tap a guess (float or sink) first, then drop the thing in to test it.' },
    { from: 4, to: 5, text: 'Sort each thing into the float or the sink basket.' },
    { from: 6, to: 6, text: 'Tap a guess (float or sink) first, then test the surprising thing.' },
    { from: 7, to: 7, text: 'Tap a shape for the clay; it goes in the water.' },
    { from: 7, to: 7, text: 'Find the shape that floats.' },
    { from: 9, to: 9, text: 'Watch the big thing go in the water by itself.' },
    {
      from: 9,
      to: 9,
      text: 'Tap a guess (float or sink) for the small one of the same stuff, then watch it tested.',
    },
    {
      from: 10,
      to: 10,
      text: 'Shake salt into one tank, then drop a duck and an egg into both and compare.',
    },
    {
      from: 10,
      to: 10,
      text: 'Then a tank gets salt in secret: tap the egg or duck to test, and tap the tank that has the salt.',
    },
    {
      from: 12,
      text: 'Touch anywhere: the big thing over the water drops in. A touch on the water splashes.',
    },
  ],
  finish: [
    { to: 6, text: 'The round ends when every thing has been dropped (or sorted).' },
    { from: 7, to: 7, text: 'The round ends when the clay has floated as a boat twice, once for each lump.' },
    { from: 9, to: 9, text: 'The round ends when three pairs (wood, stone and a ball) have both gone in.' },
    { from: 10, to: 10, text: 'The round ends when she has found the salty tank four times.' },
    {
      from: 12,
      text: 'The round ends when five things have gone in. The next one comes only after her touch drops the last.',
    },
  ],
  note: [
    {
      from: 12,
      text: 'Nothing here can be wrong and nothing is counted. Each thing she watches go into the water is added to her discovery journal in the treehouse.',
    },
    {
      from: 3,
      to: 3,
      text: 'A guess is never wrong; testing is how to find out. Each thing she watches go into the water is added to her discovery journal in the treehouse.',
    },
    {
      from: 6,
      to: 6,
      text: 'A guess is never wrong; testing is how to find out. Each thing she watches go into the water is added to her discovery journal in the treehouse.',
    },
    {
      from: 7,
      to: 7,
      text: 'A shape that sinks is an experiment, never a wrong answer; after two, the boat glows (one hint). The model: the hollow boat pushes away more water while weighing the same, so the water holds it up. Real clay boats need thin walls and can tip over, and a real boat can still sink with too much cargo or waves over the side.',
    },
    {
      to: 6,
      text: 'Each thing she watches go into the water is added to her discovery journal in the treehouse.',
    },
    {
      from: 9,
      to: 9,
      text: 'A guess is never wrong, so a round has no misses or hints. Whatever the guess, the pet says the stuff\'s rule ("Big or small, wood floats"): size does not decide it. Nothing new goes in the journal.',
    },
    {
      from: 10,
      to: 10,
      text: "Part one is watched, never scored. In part two a wrong tank counts as a miss, because she has already seen the test; after two on one question the salty tank glows (one hint). The model: salt makes the water heavier, so it pushes up harder. The duck's rise is drawn bigger than in real life. At home it takes a fresh egg and a lot of salt (an old egg can float even in plain water). Nothing new goes in the journal.",
    },
  ],
};
