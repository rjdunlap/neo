import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Choose two dishes that one pantry of three jars can cover, and see why another pair cannot. About 9 and up.',
  steps: [
    'Tap two dishes. Each takes its tokens from the jars; an empty outline is a token a jar could not give.',
    'Tap a dish on the blanket, or its card, to put it back. Tap a jar to hear what is left.',
    'Ring the bell to lay the picnic. Then Next, or Another way? to try a different menu.',
  ],
  finish: 'A round is two picnics. It ends with Next after the second.',
  note: 'More than one menu is right. Only a bell on a pair the pantry cannot cover is a miss; after two on a picnic the next step glows (a hint), as with Show a hint on the pause sheet. Another way? is never judged. The dishes are pretend: not a recipe or advice about food.',
};
