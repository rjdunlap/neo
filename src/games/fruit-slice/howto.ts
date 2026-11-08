import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slice the fruit as it floats up.',
  steps: [
    { from: 1, to: 1, text: 'Touch the fruit to slice it.' },
    { from: 2, to: 6, text: 'Swipe a finger across the fruit.' },
    { from: 8, to: 8, text: 'Swipe a finger across the fruit.' },
    { from: 11, to: 11, text: 'Swipe a finger across the fruit.' },
    { from: 10, to: 10, text: 'Swipe a finger across the fruit. An apple makes two pieces and an orange three: make the number on the sign.' },
    { from: 3, to: 6, text: 'The sign shows which ones to slice.' },
    { from: 5, to: 6, text: 'When the bowl has enough, tap it to send it.' },
    { from: 8, to: 8, text: 'When the bowl has enough, tap it to send it.' },
    { from: 11, to: 11, text: 'The sign shows how many: just two or three. When the bowl has enough, tap it to send it.' },
    { from: 7, to: 7, text: 'Draw one straight line: it cuts every fruit it crosses. Make it cross the number on the sign.' },
    { from: 8, to: 8, text: 'Each fruit makes two pieces. On the last sign the fruit hold still: draw a straight line through two.' },
    { from: 9, to: 9, text: 'The fruit hold still. Draw two straight lines that together cut every fruit.' },
    { from: 10, to: 10, text: 'Each fruit in the bowl has a card above it: tap one to put that fruit back. When the bowl has enough, tap it to send it.' },
  ],
  finish: 'The bowl is full.',
  note: [
    { from: 1, to: 2, text: 'Fruit that falls just comes back. Nothing is timed, and nothing she does is counted against her.' },
    { from: 3, to: 6, text: 'Fruit that falls just comes back. Nothing is timed. Slicing something the sign does not ask for counts as a miss; after two misses the next right one glows, which counts as a hint.' },
    { from: 11, to: 11, text: 'Fruit that falls just comes back. Nothing is timed. A slice that would pass the sign counts as a miss; tapping the bowl too soon just says how many more. After two misses the next right one glows, which counts as a hint.' },
    { from: 7, to: 7, text: 'Nothing is timed, and a line through no fruit is free. A line through the wrong number counts as a miss; after two misses a dashed line shows one that works, which counts as a hint.' },
    { from: 9, to: 9, text: 'Nothing is timed, and a line through no fruit is free. If the first line leaves fruit that one line cannot reach, or the second leaves any, the fruit come back whole and it counts as a miss; after two misses a dashed line shows one that works, which counts as a hint.' },
    { from: 8, to: 8, text: 'Fruit that falls just comes back. Nothing is timed. A slice that would pass the sign counts as a miss; after two misses the next right one glows, which counts as a hint.' },
    { from: 10, to: 10, text: 'Fruit that falls just comes back. Nothing is timed. A slice that would pass the sign counts as a miss. One piece short is never a miss: no fruit makes one, so the fruit pause until she puts one back, which is always free. After two misses the next good slice or put-back glows, which counts as a hint.' },
  ],
};
