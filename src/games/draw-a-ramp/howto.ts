import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Draw ramps so the marble rolls to the star balloon.',
  steps: [
    { text: 'Drag a line to draw a ramp, then tap Go', from: 1, to: 1 },
    { text: 'Draw one or two ramps over the block, then tap Go', from: 2, to: 2 },
    { text: 'Send the marble past the shelf, then draw a ramp back to the balloon', from: 3, to: 3 },
    'Use Undo or Clear any time to change your ramps',
  ],
  finish: 'Pop the star balloon on both puzzles.',
  note: 'Trying a run that misses is always free and leaves a dotted trail to help you adjust. After two misses, or on Hint, a dashed guide shows one ramp that works.',
};
