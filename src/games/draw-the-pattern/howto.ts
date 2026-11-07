import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Keep going with the line or pattern the pet starts, using one finger.',
  steps: [
    { from: 1, to: 1, text: 'Draw anywhere on the paper. Four touches finish a strip.' },
    { from: 2, to: 9, text: 'Start on the green ring and follow the dashes to the end.' },
    { from: 2, to: 9, text: 'Lift any time; the crayon waits where you stopped.' },
    { from: 2, to: 2, text: 'Short lines start at the top and go down.' },
    { from: 3, to: 3, text: 'The line turns at each peak; the crayon waits there for the turn.' },
    { from: 5, to: 5, text: 'The line turns at each peak; the crayon waits there for the turn.' },
    { from: 4, to: 4, text: 'Go around the circle either way.' },
    { from: 5, to: 5, text: 'The dashes fade. The dots show where the pattern turns.' },
    { from: 6, to: 6, text: 'Each shape has its own ring and arrow; draw them in order.' },
    { from: 7, to: 8, text: 'Two faint paths are shown. Draw the one that continues the pattern.' },
    { from: 9, to: 9, text: 'Slanting lines start at the top and slide down. An X is two of them, one from each ring, in order.' },
    { from: 10, to: 10, text: 'Tap the shining dot and the crayon draws a line to it; sliding a finger along the dashes works too. A tap anywhere else is never wrong.' },
  ],
  finish: 'The picture is complete when every strip is drawn.',
  note: [
    { from: 1, to: 1, text: 'Nothing is timed, and nothing she does is counted against her. A tap on the picture draws the pet\'s part again.' },
    { from: 2, to: 6, text: 'Nothing is timed. A tap on the picture draws the pet\'s part again. Wandering off the path counts as a miss; after two misses the next stretch lights up and a sparkle flies it, which counts as a hint.' },
    { from: 9, to: 9, text: 'Nothing is timed. A tap on the picture draws the pet\'s part again. Wandering off the path counts as a miss; after two misses the next stretch lights up and a sparkle flies it, which counts as a hint.' },
    { from: 7, to: 8, text: 'Nothing is timed. A tap on the picture draws the pet\'s part again. Wandering off the path, or drawing the stroke that breaks the pattern, counts as a miss; after two misses the right path glows, which counts as a hint.' },
  ],
};
