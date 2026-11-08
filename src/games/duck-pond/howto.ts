import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Count ducks and put the right number in the pond.',
  steps: [
    {
      from: 12,
      to: 12,
      text: 'Tap a duck on the pond to wave it bye-bye; it swims off and the pet counts down. When the last one has gone, they all swim back.',
    },
    { from: 1, to: 2, text: 'Tap a duck to send it into the pond; the ducks are counted aloud.' },
    {
      from: 3,
      to: 5,
      text: 'Tap ducks into the pond until the number asked for is there; they are counted aloud.',
    },
    { from: 6, to: 7, text: 'Count the ducks, then tap the answer button with that number.' },
    {
      from: 8,
      to: 9,
      text: 'Work out how many ducks there are after some join (or swim away), then tap the answer button.',
    },
    { from: 10, to: 10, text: 'Work out how many more ducks make ten, then tap that lily pad.' },
    {
      from: 11,
      to: 11,
      text: 'The sign tells the whole pond. Count the ducks you can see, then find how many are hiding under the bridge.',
    },
  ],
  finish: [
    { from: 12, to: 12, text: 'The round ends when the ducks have come back and been counted.' },
    { from: 1, to: 2, text: 'The round ends when all the ducks are in the pond.' },
    { from: 3, to: 5, text: 'The round ends when the right number of ducks is in the pond.' },
    { from: 6, to: 11, text: 'The round ends when the answer is right.' },
  ],
  note: [
    {
      from: 3,
      to: 4,
      text: 'The dots beside a number are there to count; counting them aloud together helps.',
    },
    {
      from: 8,
      to: 11,
      text: 'After a right answer, the sign shows the number sentence and the pet reads it aloud.',
    },
    {
      from: 11,
      to: 11,
      text: 'The hidden ducks paddle out one by one so both parts of the whole can be seen.',
    },
  ],
};
