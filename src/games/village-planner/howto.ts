import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Schedule every village job in order, using one bench and one cart.',
  steps: [
    'Drag a job, or tap it and then tap a step, onto its row: Bench jobs go on the top row and cart jobs on the bottom.',
    'A job that needs another goes in a step after it. The small picture on a tile shows what it needs.',
    { text: 'Jobs at the same place side by side save cart trips.', from: 2 },
  ],
  finish: 'Tap Run plan when every job is placed.',
  note: [
    {
      text: 'A plan that runs in order finishes the round. Saving cart trips is optional, and a plan that stops early only shows which job came too soon.',
      from: 2,
    },
    { text: 'A plan that stops early only shows which job came too soon; move it and run again.' },
  ],
};
