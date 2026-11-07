import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find out what is in the parcel, then put its toy on the shelf.',
  steps: [
    { from: 1, to: 5, text: "Tap the window to peek at the toy's shape." },
    { from: 2, to: 2, text: "Tap the ear to hear the toy inside." },
    { from: 1, to: 2, text: 'Tap a toy on the shelf to choose it; it plays its own sound.' },
    { from: 3, to: 4, text: 'Tap every toy it could be; tap one again to put it back.' },
    { from: 5, to: 5, text: "The parcel is wrapped in a quilt, so choose the one toy it must be, or the 'can't tell yet' card when two could fit." },
    { from: 5, to: 5, text: "If she chose 'can't tell yet', choose the eye or the ear: which would tell them apart?" },
    { from: 1, to: 2, text: 'Press the green tick when the clues show which toy it is.' },
    { from: 3, to: 5, text: 'Press the green tick to check.' },
    { from: 4, to: 4, text: 'When the tick says yes, tap the ear and keep only the toys that still fit.' },
  ],
  finish: [
    { from: 1, to: 2, text: 'The parcel opens and the toy jumps onto the shelf.' },
    { from: 3, to: 5, text: 'Each parcel opens and its toy jumps onto the shelf.' },
  ],
  note: [
    { from: 3, to: 4, text: 'Leaving out a toy that fits is not a miss: the tick asks for one more. Keeping in a toy the clues rule out is a miss, with the reason spoken.' },
    { from: 5, to: 5, text: "Choosing one toy when two still fit is not a miss: the pet shows the other. Choosing 'can't tell yet' when the look decides it, or the eye when only listening would help, is a miss." },
    { from: 3, to: 5, text: 'After two misses on one parcel, the card to change glows, which counts as a hint.' },
    { from: 1, to: 5, text: 'Peeking, listening and changing her mind are never counted.' },
    { from: 2, to: 2, text: 'If the clues still fit two toys, the tick asks for another clue instead of counting a miss; a lucky guess does not finish the round.' },
    { from: 1, to: 2, text: 'Choosing a toy the clues rule out counts as a miss, with the reason spoken; after two the right toy glows, which counts as a hint.' },
    { from: 1, to: 5, text: 'Every sound has a matching picture, so she can play without hearing it.' },
  ],
};
