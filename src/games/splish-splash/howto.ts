import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Give the pet a bath.',
  steps: [
    { to: 2, text: 'Rub or pat a finger over the mess to scrub it off.' },
    {
      from: 9,
      to: 9,
      text: 'Pat anywhere on the screen: each pat washes a third of the nearest patch of mess away.',
    },
    {
      from: 3,
      to: 6,
      text: 'Rub a finger over the body part the pet names to wash it, then the next one it asks for.',
    },
    { from: 7, to: 7, text: 'Rub a finger over each of the two body parts the pet names.' },
    { from: 8, to: 8, text: 'Wash the two body parts in the order the pet says: first one, then the other.' },
  ],
  finish: [
    {
      to: 2,
      text: 'The round ends when the mess is all gone: the shower pops the foam and the pet shakes dry.',
    },
    {
      from: 3,
      to: 8,
      text: 'The round ends when everything asked for is clean: the shower pops the foam and the pet shakes dry.',
    },
    {
      from: 9,
      to: 9,
      text: 'The round ends when the mess is all gone: the shower pops the foam and the pet shakes dry.',
    },
  ],
  note: [
    {
      to: 2,
      text: 'The pet names each part at its first touch and again when it is clean. After a quiet spell a messy spot sparkles and the pet wiggles; that is an invitation, not help. The toy on the left rim squeaks and says its name; the duck repeats the request.',
    },
    {
      from: 3,
      to: 8,
      text: 'Washing the wrong part just makes the pet giggle and repeats the request. Each part is named when it is clean. The toy on the left rim squeaks and says its name; the duck repeats the request.',
    },
    { from: 9, to: 9, text: 'The pet names each part at its first pat and again when it is clean.' },
    {
      from: 1,
      to: 9,
      text: 'Each round picks a room: the bathroom (mud), the garden (mud and grass), the beach (sand), the art room (paint in a colour that shows on the pet) or the kitchen (jam).',
    },
  ],
};
