import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Read the tide heights and fit three jobs into one harbor schedule.',
  steps: [
    { from: 1, to: 1, text: 'Read a row’s water height. Tap a job, then a time that meets its condition.' },
    {
      from: 2,
      to: 2,
      text: 'Check the order on the picnic card. Move a job if its time crowds out another.',
    },
  ],
  finish: 'Tap Check when every job has a time. The keeper works through a fitting plan in time order.',
  note: 'Try changes freely and use Undo to bring back the last plan. Help points out a job and time that can lead to a fitting plan.',
};
