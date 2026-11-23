import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Fill the outline with the cut-outs’ shadows. Shadow size is cut-out size times 12 divided by its mark.',
  steps: [
    'Drag a cut-out along its rail or tap a numbered mark.',
    'Read sizes from the grid. The first touch of a cut-out says its size.',
    { from: 1, to: 2, text: 'Tap the cut-out where it stands to hear its size again.' },
    {
      from: 1,
      to: 1,
      text: 'The lamp is lit, so the shadow follows every slide. At mark 3 a shadow is twice as big as at mark 6.',
    },
    {
      from: 2,
      to: 2,
      text: 'With the lamp out, work from the outline: 6 is 3 times 2, so a cut-out 2 tall casts a shadow 6 tall at mark 4.',
    },
    {
      from: 3,
      to: 4,
      text: 'Tap the cut-out to turn it. Its shadow is half as wide and just as tall. Tap again to turn it back.',
    },
    {
      from: 4,
      to: 4,
      text: 'Tap two chips to swap their cut-outs, keeping each mark and turn. Tap a selected chip again to clear it.',
    },
  ],
  finish: [
    {
      from: 1,
      to: 1,
      text: 'Each of the two skylines finishes by itself when the shadow fills the outline.',
    },
    {
      from: 2,
      to: 4,
      text: 'Tap Light when every cut-out is set. If the shadow fills the outline, the show begins.',
    },
  ],
  note: [
    { from: 1, to: 1, text: 'Sliding is always free. Help works out one rail’s mark.' },
    {
      from: 2,
      to: 4,
      text: 'Moves are free. Light shows the shadow and names the first differing rail. Help shows one next step.',
    },
  ],
};
