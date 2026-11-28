import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hop the frog along a number line.',
  steps: [
    { to: 1, text: 'Tap the lily pad with the number asked for to hop the frog there.' },
    { from: 2, to: 2, text: 'Hop one more or one less: tap the next lily pad up, or the one just before.' },
    {
      from: 3,
      to: 3,
      text: 'Start at the number shown and hop on the number of hops asked for: tap the lily pad where the frog lands.',
    },
    {
      from: 4,
      to: 4,
      text: 'Start at the number shown and hop back the number of hops asked for: tap the lily pad where the frog lands.',
    },
    { from: 5, to: 5, text: 'Count the hops from one number to the other, then tap a number card.' },
    {
      from: 6,
      to: 6,
      text: 'Hop on or back along the long line, and tap the lily pad where the frog lands.',
    },
    {
      from: 7,
      to: 7,
      text: 'The sign shows the whole sum. First tap the number card for the hops that reach 10. Listen to the split, then tap the lily pad where the rest of the hops land.',
    },
    {
      from: 8,
      to: 8,
      text: 'The sign shows a take-away across 10. First tap the number card for the hops back that reach 10. Listen to the split, then tap the lily pad where the rest of the hops back land.',
    },
    { from: 9, to: 9, text: 'Hop quarters and halves: tap where the frog lands.' },
    {
      from: 10,
      to: 10,
      text: 'Land on a lily, then choose how many hops of the other size reach it.',
    },
    {
      from: 11,
      to: 11,
      text: 'The sign shows a take-away like 13 − 9. The frog stands on the number taken away and a flag marks the other: count the hops up to the flag, then tap that number card.',
    },
    {
      from: 12,
      to: 12,
      text: 'The sign shows a sum or take-away across 10. Tap the lily pad where the frog lands, or tap 10 first to stop there on the way, then tap the landing.',
    },
    {
      from: 13,
      to: 13,
      text: 'The lily pads count by tens, 0 to 100. Start at the number shown and hop on or back the tens asked for: tap the lily pad where the frog lands.',
    },
    {
      from: 14,
      to: 14,
      text: 'Tap the big lily to hop ten and the little lily to hop one. Land the frog on the flag.',
    },
    {
      from: 15,
      to: 15,
      text: 'The line goes from 0 to 100 with no other numbers. Tap where the number on the sign goes, or slide the frog there. On the last line the marks count by tens: put the frog on the right mark.',
    },
    {
      from: 16,
      to: 16,
      text: 'Tap anywhere on the pond: the frog hops pad by pad to the lily pad nearest the tap, saying each number. Tap the bank to hop it home.',
    },
    {
      from: 17,
      to: 17,
      text: 'The sign shows dots. Tap the lily pad with that many dots, and the frog hops there pad by pad, saying each number.',
    },
    {
      from: 18,
      to: 18,
      text: 'A leaf hides one number on a short row of lily pads. Tap the number card for the hidden number, and the frog hops the whole row, saying each number.',
    },
  ],
  finish: [
    { to: 14, text: 'Answer the questions to bring the frog home.' },
    { from: 15, to: 15, text: 'Three guesses, then one number placed on the marked line.' },
    { from: 16, to: 16, text: 'Six taps, then a big splash.' },
    { from: 17, to: 17, text: 'Five dot signs, then the frog is home.' },
    { from: 18, to: 18, text: 'Five hidden numbers, then the frog is home.' },
  ],
  note: [
    {
      to: 14,
      text: 'Two misses show the hops and glow the answer. Help counts once per question; tapping a pad when a number card is wanted is free.',
    },
    {
      from: 15,
      to: 15,
      text: 'A guess is never a mistake: the frog hops to the real place. On the marked line a wrong mark counts, and after two the right mark glows.',
    },
    { from: 16, to: 16, text: 'Nothing here is wrong: every tap hops the frog, forward or back.' },
    {
      from: 18,
      to: 18,
      text: 'Two misses lift the corner of the leaf and glow the right card. Help counts once per question; tapping a pad is free.',
    },
  ],
};
