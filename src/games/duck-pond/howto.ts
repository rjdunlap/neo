import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Count ducks and put the right number in the pond.',
  steps: [
    {
      from: 13,
      to: 13,
      text: 'Touch anywhere on the screen: the big duck quacks and a friend swims in, and the friends are counted, up to five.',
    },
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
    {
      from: 6,
      to: 7,
      text: 'Count the ducks, then tap the lily pad with that number. Each pad shows its number as dots too, so she can match dots to ducks before she reads it.',
    },
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
    { from: 13, to: 13, text: 'The round ends when five friends have swum in and everyone quacks.' },
    { from: 12, to: 12, text: 'The round ends when the ducks have come back and been counted.' },
    { from: 1, to: 2, text: 'The round ends when all the ducks are in the pond.' },
    { from: 3, to: 5, text: 'The round ends when the right number of ducks is in the pond.' },
    { from: 6, to: 11, text: 'The round ends when the answer is right.' },
  ],
  note: [
    {
      from: 13,
      to: 13,
      text: 'Nothing can go wrong and nothing waits: the first touch counts while the pet is still talking, a touch while a friend swims in brings the next, and a touch after the fifth gets a quack.',
    },
    {
      from: 3,
      to: 4,
      text: 'The dots beside a number are there to count; counting them aloud together helps.',
    },
    {
      from: 6,
      to: 6,
      text: 'The ducks sit like a dice face or in two rows of five, and are counted back row first. Once in a while the pond is empty: the answer is 0.',
    },
    {
      from: 7,
      to: 7,
      text: 'The ducks sit like a dice face, in two rows of five or scattered, and are counted back row first. Once in a while the pond is empty: the answer is 0.',
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
