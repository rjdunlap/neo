import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put a picture together.',
  steps: [
    { to: 2, text: 'Tap a piece and it hops into its place. Dragging it there works too.' },
    { from: 3, text: 'Drag a piece to where it belongs and let go.' },
    { to: 1, text: 'One half is already in place: fit the other half to finish the picture.' },
    { from: 2, to: 4, text: 'A faint picture under the frame shows where each piece goes.' },
    { from: 5, to: 7, text: 'The frame is empty. Thick flat sides belong along its outside edge; corners have two.' },
  ],
  finish: 'The round ends when every piece is in place.',
  note: 'After two wrong places, one piece and its place glow, and the pet names where it goes. Help starts with a corner, then builds beside completed pieces.',
};
