import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Take each used thing to the place on the island that gives it a second life.',
  steps: [
    { from: 1, to: 4, text: 'Drag the food bits to the worm bin.' },
    { from: 2, to: 4, text: 'Put whole things on the shelf to be used again.' },
    { from: 3, to: 4, text: 'Take a toy that lost a piece to the mending table.' },
    { from: 4, to: 4, text: 'Put squashed and worn-down things in the Remake machine.' },
    {
      from: 5,
      to: 6,
      text: 'Move every thing from the cart to its place (worms, shelf, mending or Remake), or give it to a friend who needs it.',
    },
    { from: 5, to: 6, text: "A friend's bubble shows what they need; give them something that fits." },
    { from: 5, to: 6, text: 'Ring the bell when your plan is ready.' },
    { from: 6, to: 6, text: 'Two friends need things, and one thing fits both: plan who gets what.' },
  ],
  finish: [
    { from: 1, to: 4, text: 'Every thing has found its place, and the yard shows what each one made.' },
    {
      from: 5,
      to: 6,
      text: 'A ring of the bell on a plan that works: every place makes its thing, then each friend uses the gift.',
    },
  ],
  note: [
    { from: 1, to: 1, text: 'Nothing is counted here; she just feeds the worms.' },
    {
      from: 2,
      to: 4,
      text: 'A drop in the wrong place counts as a miss and that place says why; after two, the right place glows, which counts as a hint.',
    },
    {
      from: 5,
      to: 6,
      text: "Moving things is free. Only a ring of the bell that doesn't work counts as a miss, and the friend or place says what is still missing; after two, the glow shows one fix, which counts as a hint.",
    },
    {
      from: 6,
      to: 6,
      text: 'A round with no misses may mean she planned who gets what, or that the friends happened to stand in an order where the first fitting thing works.',
    },
    {
      from: 1,
      to: 6,
      text: "These are the island's own rules. Check what your town's recycling and compost take.",
    },
  ],
};
