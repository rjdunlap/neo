import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Look at the whole picture and spot what could not happen in real life.',
  steps: [
    { to: 1, text: 'Tap the one thing that could not happen.' },
    { from: 2, text: 'Tap the two things that could not happen. A star marks each find.' },
    { from: 3, text: 'Some unusual things could really happen. Listen to why they fit.' },
    'The pet says why each find cannot happen and the picture puts itself right.',
  ],
  finish: [
    { to: 1, text: 'The sticker comes after the silly thing is found and fixed.' },
    { from: 2, text: 'The sticker comes after both silly things are found and fixed.' },
  ],
  note: [
    {
      text: 'The pet repeats the instruction. An empty spot or a find tapped again is free. Each other thing counts once per find. Two misses or Show me highlight an unfound thing.',
    },
  ],
};
