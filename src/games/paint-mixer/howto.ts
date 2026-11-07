import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Match the sample jar's colour by its recipe of drops.",
  steps: [
    { from: 1, to: 1, text: "Tap a pot to pour a drop; copy the sample's row of drops into the bucket, then tap Check." },
    { from: 2, to: 2, text: "Make twice as much: fill two rows of the sample's drops, then tap Check." },
    { from: 3, to: 3, text: "Fill the bucket to the line, batch by batch; the table fills a column when a row is complete. One pot on the shelf isn't in this sample." },
    { from: 4, to: 4, text: 'Any amount works if it is the same way; then make it again, a different amount (the same amount again is named, not counted).' },
    { from: 5, to: 5, text: 'Three pots: pour batch by batch to the line; every pot keeps the same number per batch.' },
    { from: 6, to: 6, text: "Read each jar's label against the sample's table, tap every jar that matches, then Check; a lifted lid shows how its label fits the table." },
    { from: 1, to: 5, text: 'Undo takes the last drop back and Tip out empties the bucket; tapping the jar says its recipe.' },
    { from: 6, to: 6, text: 'Tapping a jar chooses it or puts it back; tapping the sample jar says its recipe.' },
  ],
  finish: [
    { from: 1, to: 5, text: 'Check holds the bucket beside the jar; a match chimes, and the round ends after two matches.' },
    { from: 6, to: 6, text: 'Check compares the chosen jars with the sample; the round ends after two shelves are matched.' },
  ],
  note: [
    { from: 1, to: 4, text: "Pouring, undo and tipping out are never counted; only a Check that doesn't match is, and after two misses the next pot or button glows (one hint). Colour words are labels. This is a toy: the bucket's colour is an average of its drops; real paint doesn't mix by averaging, and more paint is not a stronger colour." },
    { from: 5, to: 5, text: "Pouring, undo and tipping out are free; only a Check that doesn't match is a miss, and after two misses the next pot or button glows (one hint). A match files its colour on the journal's paint shelf. A toy: the colour is an average of the drops; real paint doesn't mix by averaging, thickness, drying and brand are left out, there is no colour wheel, and more paint is not a stronger colour." },
    { from: 6, to: 6, text: 'Choosing jars is free; a Check with the wrong set is one miss. The first lid opened in a shelf is its one hint; after two misses the named jar\'s lid opens itself, and asking again chooses the right jars (a supported finish, not evidence she compares ratios). Some different labels look the same colour, so the labels and the table decide.' },
  ],
};
