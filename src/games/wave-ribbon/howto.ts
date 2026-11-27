import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Send pulses along the ribbon and watch how the bead and the wave move.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap Send to launch a pulse. The round arrow plays it again and the next arrow moves it one frame at a time.',
    },
    {
      from: 2,
      to: 2,
      text: 'Tap the small and the tall pulse in either order and send each. The bead goes up more for the tall one, and the flag is reached at the same time mark.',
    },
    {
      from: 2,
      to: 2,
      text: 'Pick the picture of the bead that matches the pulse shown in the purple badge, then press the magnifier to check.',
    },
    'The hand button shows one next step.',
  ],
  finish: [
    { from: 1, to: 1, text: 'Press the tick once she has watched a pulse reach the flag.' },
    { from: 2, to: 2, text: 'Press the tick after a check that found the matching picture.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Sending, replaying and stepping are always free, and pressing the tick early never counts.',
    },
    {
      from: 2,
      to: 2,
      text: 'Sending, stepping and trying either height never count; a check of the wrong picture is a miss, replays the pulse, and the right picture glows after two.',
    },
    {
      text: 'The hand button counts as a hint once for each thing it shows. A toy model: one pulse on a ribbon, with nothing else in the way.',
    },
  ],
};
