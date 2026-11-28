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
      to: 3,
      text: 'Tap ducks into the pond until the number asked for is there; they are counted aloud.',
    },
    {
      from: 4,
      to: 5,
      text: 'Tap ducks into the pond, counted aloud, then tap the green check when the number asked for is there. A duck tapped on the pond hops back to the bank.',
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
    {
      from: 14,
      to: 14,
      text: 'A bridge splits the pond. Count the ducks on each side, then tap the lily pad with how many there are in all. The sides are equal at first; in the last two rounds one side has one more.',
    },
    {
      from: 15,
      to: 15,
      text: 'A full pond of ten splashes in at once, then a few more ducks swim into a second frame. Tap the lily pad with how many there are in all; in every other round the sign shows the whole, and she finds how many are past the ten.',
    },
    {
      from: 16,
      to: 16,
      text: 'The ducks start on one side of the bridge. Tap a duck to send it across (tap it again to bring it back), then tap the green check to keep the split. Every new way earns a card in the row below: "3 and 2", "2 and 3", and so on.',
    },
    {
      from: 17,
      to: 17,
      text: 'Ducks peek out from reeds and lily leaves all over the pond. First tap "a few" (two dots) or "lots" (many dots); either is fine. Then tap each duck as you count: it waves, gets a ring and the number is said. Tap the lily pad with how many there are.',
    },
    {
      from: 18,
      to: 18,
      text: 'The bridge splits the pond into two sides. Tap the side with more ducks, or the button with two matching sets of dots if both sides have the same. In the first round the ducks pair up across the bridge before the question, to show how.',
    },
  ],
  finish: [
    { from: 13, to: 13, text: 'The round ends when five friends have swum in and everyone quacks.' },
    { from: 12, to: 12, text: 'The round ends when the ducks have come back and been counted.' },
    { from: 1, to: 2, text: 'The round ends when all the ducks are in the pond.' },
    { from: 3, to: 3, text: 'The round ends when the right number of ducks is in the pond.' },
    {
      from: 4,
      to: 5,
      text: 'The round ends when she taps the check with the right number of ducks in the pond.',
    },
    { from: 6, to: 11, text: 'The round ends when the answer is right.' },
    { from: 14, to: 15, text: 'The round ends when the answer is right.' },
    { from: 17, to: 18, text: 'The round ends when the answer is right.' },
    { from: 16, to: 16, text: 'The round ends when every way to share the ducks has a card.' },
  ],
  note: [
    {
      from: 18,
      to: 18,
      text: 'She compares by matching one to one, not by counting: on a wrong answer the ducks line up in pairs across the bridge, each pair gets a ring, and the ducks with no partner hop and glow. After two misses the right side (or the same button) glows. From the third question the ducks start scattered, so a longer-looking side is not always the bigger one.',
    },
    {
      from: 17,
      to: 17,
      text: 'A ringed duck is never counted twice: tapping it again just quacks. A wrong pad counts the rings aloud and says whether ducks are still peeking; after two, the uncounted ducks glow.',
    },
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
      from: 4,
      to: 5,
      text: 'There is always one duck more than she needs, so stopping is her choice. Too few or too many at the check is counted together and tried again; sending a duck back costs nothing.',
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
      from: 14,
      to: 14,
      text: 'A wrong pad counts one side, then counts on across the bridge. After a right answer the sign shows the sentence, such as 4 + 4 = 8.',
    },
    {
      from: 15,
      to: 15,
      text: 'A wrong pad counts on from ten (ten, eleven, twelve…), or, when she is finding the part past ten, counts just those ducks. After a right answer the sign shows the sentence, such as 10 + 4 = 14.',
    },
    {
      from: 16,
      to: 16,
      text: 'Nothing here is a wrong answer: a split she has already kept just lights its card, and swapped sides ("2 and 3" after "3 and 2") count as a new way to share the same ducks. After two repeats in a row a duck glows to show where to go next.',
    },
    {
      from: 11,
      to: 11,
      text: 'The hidden ducks paddle out one by one so both parts of the whole can be seen.',
    },
  ],
};
