import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Make the three cut-outs’ shadow fill the outline on the screen. A cut-out nearer the lamp casts a bigger shadow: 12 divided by its mark, times its size.',
  steps: [
    'Each cut-out stands on its own rail. Drag it along the rail, or tap a mark, to move it nearer the lamp or the screen.',
    'Read the outline’s sizes off the grid. The first touch of a cut-out says its size; tap it to hear it again.',
    {
      from: 1,
      to: 1,
      text: 'The lamp is lit, so the shadow follows every slide. At mark 3 a shadow is twice as big as at mark 6.',
    },
    {
      from: 2,
      to: 2,
      text: 'The lamp is out. Work out each mark from the outline: an outline part 6 tall from a cut-out 2 tall is 3 times, and 12 divided by 3 is mark 4.',
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
      to: 2,
      text: 'Tap Light when every cut-out is set. If the shadow fills the outline, the show begins.',
    },
  ],
  note: 'Sliding is always free. Lighting a wrong arrangement shows the real shadow and names the first rail that differs; Help works out one rail’s mark.',
};
