import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Give animals places with what they need, in a garden or on a rocky shore.',
  steps: [
    { to: 3, text: 'Tap a garden piece to put it in the habitat. Tap it again to take it out.' },
    { from: 4, to: 4, text: 'Tap the pieces in the prepared habitat to hear what each one gives, then tap Bunny or Duck to predict who will visit.' },
    { from: 5, to: 6, text: 'Tap garden pieces to fill the open spaces. Some pieces meet more than one need.' },
    { from: 7, to: 7, text: 'Watch one piece of a working garden change, then tap the need the visitor lost: food, water or shelter. The before picture shows the garden as it was.' },
    { from: 7, to: 7, text: 'Tap a repair piece to put it in the empty space. Tap it again to take it out.' },
    { to: 7, text: 'Tap the green gate to test the habitat and see who comes.' },
    { from: 8, text: 'Tap a friend, then a place for it. Tap a placed friend, then the sand, to take it back.' },
    { from: 8, text: 'With no friend picked, tap a place to hear what it gives.' },
    { from: 8, text: 'Tap the blue wave to let the sea go out.' },
  ],
  finish: [
    { to: 7, text: 'The round ends after every habitat has been tested and its visitor arrives.' },
    { from: 8, text: 'A round ends when the sea goes out and every friend has what it needs.' },
  ],
  note: [
    { to: 3, text: 'Testing an incomplete habitat is a free experiment. After two tests, a useful piece glows.' },
    { from: 4, to: 4, text: 'A prediction that does not match is still a useful observation, not a mistake.' },
    { from: 5, to: 6, text: 'Testing an incomplete habitat is a free experiment. After two tests, a useful piece glows.' },
    { from: 7, to: 7, text: 'Naming the wrong need counts as a miss, and the before picture pulses; after two, the right need glows (one hint). Testing a repair is a free experiment; after two tests, the piece that restores the need glows.' },
    { from: 8, text: 'The sea going out is a free test; after two, a friend and a good place glow (one hint). Here the high rock dries, the pool stays wet, and seaweed hides a crab.' },
  ],
};
