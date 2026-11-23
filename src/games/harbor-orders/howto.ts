import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Fill the order in the fewest mornings.',
  steps: [
    'Each sign shows how many of each good its workshop makes in a morning.',
    { to: 3, text: 'Tap a square to pick crates or boats. Watch the order card fill.' },
    {
      from: 4,
      text: 'Tap a square again to step it through crates, boats and lanterns. Watch the order card fill.',
    },
    { from: 2, to: 2, text: 'Add or take away mornings. Being best at both does not mean doing both.' },
    { from: 3, text: 'Add or take away mornings. A workshop can split its mornings between goods.' },
    { to: 3, text: 'Tap Send it when both goods are ready.' },
    { from: 4, text: 'Tap Send it when every line of the order is ready.' },
  ],
  finish: 'The boat leaves when the order is full and no shorter plan can fill it.',
  note: [
    { to: 1, text: 'The mornings are given. Try any plan and tap Help if you get stuck.' },
    {
      from: 2,
      text: 'Trying ideas is free. A full order sent with extra mornings counts once per plan. Help shows a step.',
    },
  ],
};
