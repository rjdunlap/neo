import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fill, empty and refill: count pieces, pour water to a line, tell full from empty, or test which container holds more.',
  steps: [
    {
      to: 2,
      text: 'Tap the container or grass to tip the pieces out. Then tap a piece, the container or the grass to put pieces back.',
    },
    {
      from: 3,
      to: 4,
      text: 'Tap the pieces on the grass to put them in the container, as many as the voice asks for. The card beside the container has one dot for each; a dot fills as each piece goes in.',
    },
    { from: 3, to: 4, text: 'A piece beyond the number hangs below the card as an extra dot: too many.' },
    { from: 3, to: 4, text: 'Tap the container to take the last one back out if there are too many.' },
    { from: 3, to: 4, text: 'Tap the green check when the container has the right number.' },
    {
      from: 5,
      to: 5,
      text: 'Pull the jug right to pour. Pull farther for more water; lift at the purple line.',
    },
    { from: 5, to: 5, text: 'Tap the cup to empty into the tray. Tap the tray to refill the jug.' },
    { from: 5, to: 5, text: 'Tap the green check when the water reaches the line.' },
    {
      from: 6,
      to: 6,
      text: 'One basket is full of fruit, one is empty. Listen: tip out the full one, or fill the empty one.',
    },
    { from: 6, to: 6, text: 'Tap the basket the voice names. Every time, a new pair is set out.' },
    { from: 7, to: 7, text: 'Tap either container to guess which holds more. Every guess is welcome.' },
    {
      from: 7,
      to: 7,
      text: 'Pull the full left container right to pour all its water into the right one. Tap the green check when the left one is empty.',
    },
    {
      from: 7,
      to: 7,
      text: 'Look for overflow in the tray or room left in the right container. Tap the one that holds more. Tap the tray to return all water and pour again.',
    },
  ],
  finish: [
    { to: 1, text: 'The round ends when all the pieces are back in the container.' },
    { from: 2, to: 2, text: 'The round ends when all the pieces are back in after the second tip.' },
    {
      from: 3,
      to: 4,
      text: 'The round ends when the check is tapped with the right number in the container.',
    },
    { from: 5, to: 5, text: 'Fill three cups to their lines and check each one to finish the round.' },
    { from: 6, to: 6, text: 'The round ends after four requests, taking turns between tipping and filling.' },
    { from: 7, to: 7, text: 'Explore and answer three different capacity pairs to finish.' },
  ],
  note: [
    {
      to: 4,
      text: 'Each round chooses fruit in a basket, balls in a bucket, blocks in a toy box or ducks in a tub. Tip-out mixes designs; counting uses one design.',
    },
    {
      to: 2,
      text: 'There is no wrong move here. Grass taps scoop the nearest piece or tip a full container. After six idle seconds the next thing wiggles; this is never a hint.',
    },
    {
      from: 3,
      to: 4,
      text: 'Tapping the check with the wrong number is a gentle miss. After two, a glow shows what to do next.',
    },
    {
      from: 5,
      to: 5,
      text: 'Spills and empty checks are free. Other wrong checks count misses. Two misses glow the next move, once per cup.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tapping the other basket is a gentle miss. After two on one request, the right basket glows. The grass and the pile are never wrong.',
    },
    {
      from: 7,
      to: 7,
      text: 'Guesses, partial pours, spills and re-pours are free. Only choosing the smaller after pouring counts a miss. After two, the spill or empty space glows once per pair. Make your own guess aloud together, then test it.',
    },
  ],
};
