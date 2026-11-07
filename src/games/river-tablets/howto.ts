import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a clay record, then open it up and see it match.',
  steps: [
    { from: 1, to: 1, text: 'Tap the jar each time a sheep comes in, then tap it again to tip it.' },
    { from: 2, to: 2, text: 'Press one mark for each token, then tap Crack to open the ball. Tap the ball to peek inside.' },
    { from: 3, to: 3, text: 'Press the row with the picture of the thing on the cart.' },
    { from: 4, to: 4, text: 'Press the big stamp for each ten and the small stamp for each one, then hand in the tablet. Tap the yard to count the cart.' },
    { from: 5, to: 5, text: 'Is the cart short, right or extra? Tap one, then how many.' },
    { from: 6, to: 6, text: "Tap the tablet that matches the cart, or neither, or can't tell when the cart is empty. Tap a tablet to hear it." },
  ],
  finish: 'The marks and the things line up, one for one.',
  note: [
    { from: 1, to: 1, text: 'Nothing is counted. A tap while a sheep is still walking just wobbles the jar.' },
    { from: 2, to: 2, text: 'Pressing, lifting a mark and peeking are never counted; only cracking the ball is. After two wrong cracks the fix glows, which counts as one hint. Long ago, by the big rivers, people pressed marks in clay to remember how many.' },
    { from: 3, to: 3, text: 'A wrong row bounces the mark back and counts one miss; on the second wrong press the pet moves the mark itself, which counts as one hint. Long ago, by the big rivers, people pressed marks in clay to remember how many.' },
    { from: 4, to: 4, text: 'Pressing, lifting and counting the yard are never counted; only handing in is. Ten small marks for a ten is right, and the pet shows the shorter way. After two wrong tablets the next step glows, which counts as one hint. Long ago, people used a different mark for ten.' },
    { from: 5, to: 5, text: 'Only an answer counts; a wrong one is a miss and the pet says why. After two misses the goods line up, which counts as one hint. Long ago, by the big rivers, people pressed marks in clay to remember how many.' },
    { from: 6, to: 6, text: "Only an answer counts; a wrong one is a miss and the pet says why. After two misses the goods line up under each tablet (or the empty cart glows), which counts as one hint. Can't tell is the right answer when nothing is left to count. Long ago, by the big rivers, people pressed marks in clay to remember how many." },
  ],
};
