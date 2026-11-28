import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pop the bubbles.',
  steps: [
    { to: 3, text: 'Tap a bubble to pop it.' },
    {
      from: 15,
      to: 15,
      text: 'Tap or pat anywhere on the screen. The bubble nearest the touch pops, so there is nothing to aim at.',
    },
    {
      from: 16,
      to: 16,
      text: 'Listen for the size, big or little, then tap only the bubbles of that size.',
    },
    {
      from: 17,
      to: 17,
      text: 'Listen for the number, then tap the bubble with that many dots. There are no numerals: the dots are the number.',
    },
    {
      from: 18,
      to: 18,
      text: 'Each number is on two bubbles: once as a numeral and once as dots. Tap one to hold it, then tap its partner. Tap the held bubble again to let it go.',
    },
    {
      from: 19,
      to: 19,
      text: 'Swipe a finger across the empty screen to blow a trail of bubbles, or touch it to blow one. Then tap the bubbles to pop them.',
    },
    { from: 4, to: 6, text: 'Listen for the color, then tap only the bubbles of that color.' },
    { from: 7, to: 9, text: 'Tap the numbered bubbles in order, starting at 1.' },
    {
      from: 12,
      to: 12,
      text: 'Tap the numbered bubbles in order, starting at the number on the sign at the top, then counting up.',
    },
    {
      from: 13,
      to: 13,
      text: 'Start at the number on the sign at the top, then tap the bubbles counting back, one less each time, down to 1.',
    },
    {
      from: 14,
      to: 14,
      text: 'The sign at the top says what to count by, tens or fives. Tap the bubbles in that order, starting with the smallest.',
    },
    { from: 7, to: 8, text: 'Count the dots beneath a number if you want help.' },
    { from: 10, to: 11, text: 'The sign at the top shows the number the two bubbles make together.' },
    { from: 10, to: 10, text: 'Count the dots on the two bubbles together to make 5.' },
    {
      from: 10,
      to: 10,
      text: 'Tap a bubble to hold it, then tap the bubble that makes 5 with it. Tap the held bubble again to let it go.',
    },
    {
      from: 11,
      to: 11,
      text: 'Tap a bubble to hold it, then tap the bubble that makes 10 with it. Tap the held bubble again to let it go.',
    },
    {
      from: 20,
      to: 20,
      text: 'The sign at the top shows 20, the number the two bubbles make together.',
    },
    {
      from: 20,
      to: 20,
      text: 'Tap a bubble to hold it, then tap the bubble that makes 20 with it. Tap the held bubble again to let it go.',
    },
    {
      from: 20,
      to: 20,
      text: "Most pairs are a small number and a teen: the small number and the teen's ones make 10, then the ten makes 20 (3 and 17). 10 and 10 is a pair too.",
    },
  ],
  finish: [
    { to: 14, text: 'The round ends when the last bubble that was asked for is popped.' },
    {
      from: 15,
      to: 15,
      text: 'After a few pops a rainbow bubble floats up; a touch anywhere pops it and the round ends.',
    },
    { from: 16, to: 18, text: 'The round ends when the last bubble that was asked for is popped.' },
    {
      from: 19,
      to: 19,
      text: 'After a few pops a rainbow bubble floats up; tap it and the round ends.',
    },
    { from: 20, to: 20, text: 'The round ends when the last pair is popped.' },
  ],
  note: [
    {
      from: 19,
      to: 19,
      text: 'Nothing is wrong: a touch that is not on a bubble just blows one, and the screen holds only a few at a time. If none is showing for a while, one floats up on its own.',
    },
    { to: 14, text: 'A wrong bubble only wobbles and gets a spoken hint; nothing is lost.' },
    { from: 15, to: 15, text: 'No touch is wrong: a touch with no bubble on the screen does nothing.' },
    {
      from: 16,
      to: 16,
      text: 'A bubble of the other size only wobbles and is named ("That one\'s little"); after two in a row the right size glows.',
    },
    {
      from: 17,
      to: 17,
      text: 'A wrong bubble only wobbles and its dots are counted aloud; after two in a row the right one glows.',
    },
    {
      from: 18,
      to: 18,
      text: 'A bubble that is not the partner only wobbles and the held one stays held; after two in a row the partner glows. Tapping another of the same kind just moves the hold. A held numeral is read aloud; held dots are not, so the counting is hers.',
    },
    {
      from: 20,
      to: 20,
      text: 'A pair that does not make 20 only wobbles and its total is said; after two in a row, the first bubble of the try and its partner glow and the pet says how making 10 gets there.',
    },
  ],
};
