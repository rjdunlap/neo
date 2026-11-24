import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Light every stone by following the order for this board.',
  steps: [
    { to: 3, text: 'Tap the stone with the number shown above the pond.' },
    { to: 3, text: 'Find the next number on the same shuffled board. Checked stones stay where they are.' },
    {
      from: 4,
      to: 6,
      text: 'Each stone shows a sum. Find the one that makes the number on the sign; a lit stone shows its answer.',
    },
    { from: 6, to: 6, text: 'Some stones take away, such as 12 − 3.' },
    {
      from: 7,
      to: 8,
      text: 'The sign says how to count and which number comes before. Work out the next number, then find its stone.',
    },
    { from: 8, to: 8, text: 'Some rounds count back, starting at the biggest number.' },
    {
      from: 9,
      to: 10,
      text: 'The stones hold different numbers. Find the smallest one still unlit; the sign shows the last one lit.',
    },
    { from: 10, to: 10, text: 'Some numbers are below zero: −12 is smaller than −3.' },
    {
      from: 11,
      to: 11,
      text: 'Alternate numbers and letters. Start with 1, then A, 2, B, and keep both trails going up.',
    },
    { from: 12, to: 12, text: 'Start with 1, then L, 2, K. Numbers go up and letters go backwards.' },
    {
      from: 13,
      to: 13,
      text: 'Some stones are fractions and some are decimals. Find the smallest one still unlit, such as 2/3 before 0.7.',
    },
    {
      from: 14,
      to: 14,
      text: 'Each stone shows a sum, a take-away or a times. Work out what each makes and find the smallest answer still unlit; a lit stone shows its answer.',
    },
    {
      from: 11,
      to: 12,
      text: 'The sign shows up to two lit stones and whether a number or letter comes next.',
    },
    'Hint outlines the next stone; there is no time limit.',
  ],
  finish: 'Finding the final stone finishes the round, including with help.',
  note: 'A different unfinished stone counts a miss. Two consecutive misses reveal a hint. Checked stones can be touched freely. This is trail-order practice, without claims about general brain training.',
};
