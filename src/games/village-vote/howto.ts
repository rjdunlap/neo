import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Count the toy preferences and carry out the choice with the most votes.',
  steps: [
    {
      from: 2,
      to: 2,
      text: 'First choose either picture for your pet. Wait for the pet to join that group.',
    },
    'Tap a friend’s whole paw panel to count it once. Tap it again or tap the tally board to replay its count.',
    { to: 2, text: 'Tap the toy picture with more votes. You can choose it without counting first.' },
    {
      from: 3,
      to: 3,
      text: 'Compare all three groups. Tap the toy picture with the most votes, even when the other two groups are equal.',
    },
    {
      from: 4,
      to: 4,
      text: 'Count, then tap either tied picture: it’s a tie, and the picture with fewest votes closes this time.',
    },
    {
      from: 4,
      to: 4,
      text: 'Tap each friend from the closed picture, then the toy on its small badge, to move its vote there.',
    },
    { from: 4, to: 4, text: 'When everyone has moved, tap the toy picture with the most votes now.' },
  ],
  finish: 'Everyone tries the chosen toy, then the round ends with one sticker.',
  note: [
    {
      from: 2,
      to: 2,
      text: 'The pet’s free preference can be on the smaller side. The pet still plays first. Counting and replays are free; help stays assisted.',
    },
    {
      from: 4,
      to: 4,
      text: 'Finding the tie and tapping the closed picture are never mistakes. Sending a friend to the other tied toy, or choosing the smaller group, is. Help is offered once for the moves and once for the final choice.',
    },
    {
      text: 'Tallies show only the friends counted so far. A winner is checked against all actual votes. Help counts all groups and guides the winning tap.',
    },
  ],
};
