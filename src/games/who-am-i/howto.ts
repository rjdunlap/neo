import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Listen to the clue and find the friend it is about.',
  steps: [
    { from: 1, to: 5, text: 'Tap the sign any time to hear the clue again.' },
    { from: 8, to: 8, text: 'Tap the sign any time to hear the clue again.' },
    { from: 6, to: 6, text: 'Tap the sign any time to hear the answer again.' },
    { from: 1, to: 1, text: 'Tap the friend the clue fits.' },
    {
      from: 2,
      to: 5,
      text: 'Tap each friend the clue rules out to turn it over; the next clue comes when they are all down.',
    },
    {
      from: 8,
      to: 8,
      text: 'Tap each friend the clue rules out to turn it over; the next clue comes when they are all down.',
    },
    { from: 6, to: 6, text: 'Tap a question card to ask it; the pet answers yes or no.' },
    {
      from: 6,
      to: 6,
      text: 'Turn over every friend the answer rules out. After a no, those are the friends who have it.',
    },
    { from: 7, to: 7, text: 'Tap a friend for the pet to guess; it will not look.' },
    {
      from: 7,
      to: 7,
      text: 'Tap a clue card to give the pet that clue. Every card is true of her friend; a cross means her friend does not have it.',
    },
    { from: 7, to: 7, text: 'Keep giving clues until only her friend is left.' },
    { from: 8, to: 8, text: 'Some friends do two surprising things. Turn over who the clue is not.' },
    { from: 2, to: 8, text: 'Tap a turned-over friend to peek at it.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The friend who fits jumps out and says its name.' },
    { from: 2, to: 6, text: 'The last friend left jumps out and says its name.' },
    { from: 8, to: 8, text: 'The last friend left jumps out and says its name.' },
    { from: 7, to: 7, text: 'The pet finds her friend and says her riddle back.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Hearing a clue again is never counted against her. Tapping a friend the clue does not fit counts as a miss, with the reason spoken; after two the right friend glows, which counts as a hint.',
    },
    {
      from: 2,
      to: 5,
      text: 'Hearing a clue again and peeking at a hidden friend are never counted against her. Turning over a friend the clue keeps counts as a miss, with the reason spoken; after two on one clue the friends it rules out shimmer, which counts as a hint.',
    },
    {
      from: 4,
      to: 5,
      text: 'Some clues surprise: the penguin has feathers but cannot fly, and the bat flies but feeds its babies milk. The pet explains each once, and that is never counted.',
    },
    {
      from: 8,
      to: 8,
      text: 'Hearing a clue again and peeking at a hidden friend are never counted against her. Turning over a friend the clue keeps counts as a miss, with the reason spoken; after two on one clue the friends it rules out shimmer, which counts as a hint. The platypus lays eggs and feeds its babies milk; the pet explains it once, and that is never counted.',
    },
    {
      from: 6,
      to: 6,
      text: 'Asking is never counted against her, however many questions she asks, and neither is hearing an answer again or peeking. Turning over a friend the answer keeps counts as a miss, with the reason spoken; after two on one answer the friends it rules out shimmer, which counts as a hint. If she asks for the glowing question, or it shows after two questions in a row that tell nobody apart, that counts as a hint once.',
    },
    {
      from: 7,
      to: 7,
      text: 'Nothing is counted against her, and she can change her friend until her first clue. Asking for the glowing card counts as a hint.',
    },
    {
      from: 5,
      to: 5,
      text: 'The first clue is a group: a bird has feathers, and a mammal has fur or hair and feeds its babies milk. If she is stuck twice, the pet shows what the group means, which counts as a hint.',
    },
  ],
};
