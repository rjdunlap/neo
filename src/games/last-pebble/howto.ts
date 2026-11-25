import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Take turns laying one or two stones across the stream to land on the far bank.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap one or two stones ahead to reach the far bank, or leave three spots at the end.',
    },
    {
      from: 2,
      to: 2,
      text: 'Tap one or two stones ahead. Count back in threes from the far bank to find the stepping stones.',
    },
  ],
  finish: [
    { from: 1, to: 1, text: 'Three short crossings make a round; one sticker.' },
    { from: 2, to: 2, text: 'Reach the far bank stone to finish the round; one sticker.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'About 10 and up. A wrong move plays the show-me-why reply, rewinds to the turning point, and counts a miss (glow after two misses on one crossing); laid or out-of-reach stones count nothing, and Show me stays available.',
    },
    {
      from: 2,
      to: 2,
      text: 'About 10 and up. When the pet reaches the far bank, the show-me-why replay rewinds to the turning point and counts a miss (glow after every second miss); laid or out-of-reach stones count nothing, and Show me stays available.',
    },
  ],
};
