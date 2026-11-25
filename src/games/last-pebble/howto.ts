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
    {
      from: 3,
      to: 3,
      text: 'First pick who starts: tap I go first or Pet goes first. Then count back in threes from the far bank.',
    },
    {
      from: 4,
      to: 4,
      text: 'The row of stones beside the stream shows how many you may lay. Stepping stones are one more apart than that.',
    },
    {
      from: 5,
      to: 5,
      text: 'Do not land on the whirlpool. Aim for the stone just before it, then count back.',
    },
  ],
  finish: [
    { from: 1, to: 1, text: 'Three short crossings make a round; one sticker.' },
    { from: 2, to: 2, text: 'Reach the far bank stone to finish the round; one sticker.' },
    { from: 3, to: 3, text: 'Three crossings make a round; one sticker.' },
    { from: 4, to: 5, text: 'Two crossings make a round; one sticker.' },
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
    {
      from: 3,
      to: 4,
      text: 'About 10 and up. Picking the wrong starter, or missing a stepping stone, counts a miss when the pet reaches the far bank: the stream steps back and explains (glow after every second miss). Laid or out-of-reach stones count nothing, and Show me stays available.',
    },
    {
      from: 5,
      to: 5,
      text: 'About 10 and up. Being left the whirlpool, or laying a stone on it, counts a miss: the stream steps back and explains (glow after every second miss). Laid or out-of-reach stones count nothing, and Show me stays available.',
    },
  ],
};
