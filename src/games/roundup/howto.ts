import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Herd the farm animals where they belong.',
  steps: [
    {
      from: 12,
      to: 12,
      text: 'Shoo the big pigs into the pen with the big picture and the little pigs into the pen with the little picture.',
    },
    { to: 1, text: 'Tap an animal to hop it into the pen. At lap age the animals come out one at a time.' },
    {
      from: 2,
      to: 3,
      text: 'Wiggle a finger behind the animals to shoo them through the gate into the pen.',
    },
    { from: 4, to: 4, text: 'Shoo each kind into the pen with its picture on the sign.' },
    { from: 5, to: 5, text: 'Put exactly the number asked for in the pen, then ring the bell.' },
    {
      from: 6,
      to: 6,
      text: 'Sort the two kinds into their pictured pens, putting in the number of each that was asked for, then ring the bell.',
    },
    {
      from: 7,
      to: 7,
      text: 'Shoo pigs into the mud and bunnies into the carrots. Leave the cows on the grass: they have no pen.',
    },
    {
      from: 9,
      to: 9,
      text: 'The pen already holds some animals. Count them, then shoo in just enough more to match the numeral and dots (4 or 5). Ring the bell when it is full.',
    },
    {
      from: 8,
      to: 8,
      text: 'Shoo the animals into the two pens so each pen holds the same number, then ring the bell. The sign shows no number: how many is her choice.',
    },
    { from: 10, to: 10, text: 'Wiggle a finger behind the single animal to shoo it through the wide gate.' },
    {
      from: 11,
      to: 11,
      text: 'Put a finger on the grass and the animals gather round it. Drag slowly, or tap a little ahead of them again and again, to lead them through the wide gate into the pen.',
    },
  ],
  finish: [
    { from: 12, to: 12, text: 'All six pigs sorted by size finish the round. No bell is needed.' },
    {
      from: 9,
      to: 9,
      text: 'The bell finishes the round when the pen holds exactly its requested total, including the animals already inside.',
    },
    {
      from: 7,
      to: 7,
      text: 'Both pigs and both bunnies in their own pens finish the round, with the cows still outside. No bell is needed.',
    },
    { to: 6, text: 'The round ends when every animal is where it was asked to go.' },
    {
      from: 10,
      to: 10,
      text: 'Help one animal home, then a second one. Both successes make one round and one sticker.',
    },
    { from: 11, to: 11, text: 'The round ends when all three animals are in the pen, in any order.' },
    {
      from: 8,
      to: 8,
      text: 'A bell with the same number in each pen finishes the round, even with some left on the grass (two and two out of six is fair; an empty pen is not).',
    },
  ],
  note: [
    {
      from: 12,
      to: 12,
      text: 'A wrong gate counts a miss: the pig hops out and the pet names the pen’s size. Two misses or fifteen idle seconds glow the animals and matching gates (one hint), with a spoken size reminder. A thirty-second trot-home counts another hint.',
    },
    {
      from: 9,
      to: 9,
      text: 'A wrong bell counts one miss. The pet counts the pen aloud and says how many more are needed; extras hop back out. Two wrong bells or fifteen idle seconds glow the needed animals and gate (one hint), with a spoken recount. A thirty-second trot-home counts another hint.',
    },
    {
      from: 7,
      to: 7,
      text: 'An animal entering a wrong pen counts a miss and hops back out. After two misses only animals that need a pen and their gates glow (one hint); cows never glow. After thirty seconds without progress, a needed animal trots home (another hint).',
    },
    {
      to: 6,
      text: 'A wrong pen or a wrong bell counts a miss. If no animal gets home for thirty seconds, the nearest one trots home by itself, and that counts as a hint.',
    },
    {
      from: 10,
      to: 10,
      text: 'Nothing counts as a miss. After ten seconds without a success the animal and gate glow (one hint); at twenty seconds it trots home (another hint). Support starts afresh for the second animal.',
    },
    {
      from: 8,
      to: 8,
      text: "An unequal bell counts a miss: the pet says each pen's number and the extras hop out of the fuller pen (none while the other is empty). Two wrong bells glow the emptier pen (one hint). Thirty idle seconds with uneven pens trot one in (another hint).",
    },
    {
      from: 11,
      to: 11,
      text: 'Nothing counts as a miss. After fifteen seconds without an animal getting home, the herd glows and drifts toward the gate by itself for the rest of the round (one hint). If one still is not home thirty seconds after the last, it trots in (another hint).',
    },
  ],
};
