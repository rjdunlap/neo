import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pass a picture along visible paths to the waving receiver.',
  steps: [
    'Tap a connected friend to move the picture one hop. Wait for it to arrive before tapping again.',
    { from: 2, to: 2, text: 'Either route works. You can retrace your steps.' },
    {
      from: 3,
      to: 3,
      text: 'A log blocks one path. Retrace to find a clear way, or use the blue Start over arrow.',
    },
    {
      from: 4,
      to: 4,
      text: 'Compare the hop ribbons. A longer arrival is shown, then the same picture starts again. Find the route with the fewest hops.',
    },
    'The blue arrow starts this picture again. The yellow light shows a next step; ask again to watch the finger carry it through.',
  ],
  finish: [
    { to: 3, text: 'Any clear walk that reaches the receiver finishes the round.' },
    { from: 4, text: 'Reach the receiver using exactly the fewest hops.' },
  ],
  note: 'A fictional chain of friends. Retracing and restarting are free. Help stays recorded through retries. You may optionally Keep the delivered mosaic in the shared picture slot.',
};
