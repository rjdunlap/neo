import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a complete connection so the lantern lights, and watch a switch change it.',
  steps: [
    { from: 1, to: 1, text: 'Drag the wire piece into the gap, or tap the piece and then tap the gap.' },
    {
      from: 1,
      to: 1,
      text: 'Watch the lantern light. The arrow button puts the piece back; the round arrow undoes the last change.',
    },
    { from: 2, to: 2, text: 'Tap the switch to close and open it, and watch the lantern go on and off.' },
    {
      from: 3,
      to: 3,
      text: 'Fit a wire piece into each of the two gaps, in either order. The arrow button puts a selected piece back; the round arrow undoes.',
    },
    {
      from: 3,
      to: 3,
      text: 'Press the magnifier to check that the lantern lights. Changing a piece means checking again.',
    },
    'The hand button shows one next step.',
  ],
  finish: [
    {
      from: 1,
      to: 1,
      text: 'Press the tick once the lantern has lit; it may be on or off when she finishes.',
    },
    {
      from: 2,
      to: 2,
      text: 'Press the tick once she has seen the lantern both on and off; either final state is fine.',
    },
    { from: 3, to: 3, text: 'Press the tick after a check that found the lantern lit.' },
  ],
  note: [
    {
      from: 1,
      to: 2,
      text: 'Nothing here is a mistake: trying pieces, flipping the switch and pressing the tick early never count.',
    },
    {
      from: 3,
      to: 3,
      text: 'Trying pieces and pressing the tick early never count; a check while the lantern is off is a miss and names the open gap, which glows after two.',
    },
    {
      text: 'The hand button counts as a hint once for each thing it shows. A toy model: the flower is a made lamp, and the battery gives energy; nothing is used up.',
    },
  ],
};
