import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Cut along the line to make pieces for the picture.',
  steps: [
    { from: 1, to: 1, text: 'Tap each thick line to snip it.' },
    { from: 2, to: 10, text: 'Start the scissors on the green ring and follow the dashes.' },
    { from: 2, to: 10, text: 'Lift any time; the scissors wait where you stopped.' },
    { from: 4, to: 6, text: 'Lines bend and turn corners.' },
    { from: 5, to: 7, text: 'Go around either way.' },
    { from: 8, to: 8, text: 'Choose the piece that fits the gap, then cut it out.' },
    { from: 9, to: 9, text: 'Keep turning the same way round, all the way to the middle.' },
    { from: 10, to: 10, text: 'Choose the line that cuts the sheet into the two pieces the picture needs, then cut it from edge to edge.' },
  ],
  finish: 'The picture is complete.',
  note: [
    { from: 1, to: 2, text: 'Nothing is timed, and nothing she does is counted against her.' },
    { from: 3, to: 7, text: 'Nothing is timed. Wandering off the line counts as a miss; after two misses, the next stretch lights up and a paper bee flies it, which counts as a hint.' },
    { from: 8, to: 8, text: 'Nothing is timed. Wandering off the line, or cutting a fifth of a piece that does not fit, counts as a miss; after two misses, the piece that fits glows, which counts as a hint.' },
    { from: 9, to: 9, text: 'Nothing is timed. Wandering off the line counts as a miss; after two misses, the next stretch lights up and a paper bee flies it, which counts as a hint.' },
    { from: 10, to: 10, text: 'Nothing is timed. Wandering off the line, or cutting a fifth of a line that makes the wrong pieces, counts as a miss (once for each line); after two misses, the line that works glows, which counts as a hint.' },
  ],
};
