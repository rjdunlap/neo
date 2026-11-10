import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Walk the turtle along the moss to the pond.',
  steps: [
    { to: 3, text: 'Tap a tile beside the turtle to take one step. Each visited tile blooms.' },
    { to: 3, text: 'Plan around the rocks. Reach the pond only after all other tiles bloom.' },
    {
      to: 3,
      text: 'Undo takes back one step; Start over restores the same patch. Hint outlines a completing next step, or Undo until a route is possible.',
    },
    {
      from: 4,
      to: 5,
      text: 'Tap or slide along the moss to walk the turtle to the pond. Wrong turns are free: walk back the way you came.',
    },
    {
      from: 6,
      to: 6,
      text: 'Look ahead at each fork. A step into a dead end counts once; Hint lights the way.',
    },
    { from: 7, to: 7, text: 'Collect the berry first, then reach the pond.' },
    {
      from: 8,
      text: 'Tap a tile beside the turtle to take one step; each visited tile blooms. Reach the pond only after all other tiles bloom.',
    },
    {
      from: 8,
      text: 'Undo takes back one step; Start over restores the same patch. Hint outlines a completing next step, or Undo until a route is possible.',
    },
  ],
  finish: [
    { to: 3, text: 'Visiting every tile and reaching the pond finishes the round, including with help.' },
    { from: 4, to: 6, text: 'Reaching the pond finishes the round, including with help.' },
    { from: 7, to: 7, text: 'Reaching the pond with the berry finishes the round, including with help.' },
    { from: 8, text: 'Visiting every tile and reaching the pond finishes the round, including with help.' },
  ],
  note: [
    {
      to: 3,
      text: 'Legal route experiments and dead ends are free. Non-adjacent, visited and early-pond taps count a miss; two consecutive misses show help. Repeating help on the same path counts once. Undo and Start over preserve misses and hints.',
    },
    {
      from: 4,
      to: 5,
      text: 'Nothing counts as a miss. After a pause the next tile glows as a pace cue, never counted as a hint.',
    },
    {
      from: 6,
      to: 6,
      text: 'Each dead end counts one miss a round, however often she walks in. Two misses without progress light the way and count a hint. Walking back is free.',
    },
    {
      from: 7,
      to: 7,
      text: 'Each wrong branch counts one miss a round, and so does the first try at the pond without the berry. Two misses without progress light the way and count a hint. Walking back is free.',
    },
    {
      from: 8,
      text: 'A tap away from the turtle is free: the tiles it can step to pulse. Visited and early-pond taps count a miss; two consecutive misses show help. Repeating help on the same path counts once. Undo and Start over preserve misses and hints.',
    },
  ],
};
