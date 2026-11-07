import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Replay how a creature might have moved, compare the footprints it leaves with the ones in the mud, and pick the way that fits every mark.',
  steps: [
    "Tap a card's Play to watch the gray creature move and leave ghost prints above the mud; drag it to go back and forth.",
    { from: 1, to: 2, text: 'Tap the card whose prints match the mud, then tap Check.' },
    { from: 2, to: 3, text: 'Tap a footprint to see which way its toes point.' },
    { from: 3, to: 3, text: "Tap the card that fits, or Can't tell if two cards leave the very same marks, then tap Check." },
  ],
  finish: 'Every footprint lights green and the card goes on the study board.',
  note: [
    { from: 1, to: 3, text: 'Replaying, dragging and looking closer are never counted against her. Checking a card that leaves different marks counts as a miss; after two the right card glows and the telling footprint is ringed, which counts as a hint.' },
    { from: 3, to: 3, text: 'A puddle hides part of the trackway, and standing still leaves no mark, so sometimes the marks truly cannot tell. Checking a card that fits while another fits too is not a miss.' },
    { from: 1, to: 3, text: 'The creature, the mud and the footprints are made up for the island; real tracks need a scientist, and nothing here says what kind of animal it was.' },
  ],
};
