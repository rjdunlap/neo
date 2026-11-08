import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Watch the sea come in and go out, and use the seaweed line to keep things dry.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Pull the wave up the sand and let it go; on a lap, a tap on the sea sends one wave.',
    },
    { from: 2, to: 2, text: 'Put the pail above the seaweed line; then the sea comes in.' },
    {
      from: 3,
      to: 3,
      text: "With the sea out, drag the pail, the flag and the towel where they'll stay dry, then tap the wave; with two lines, the sea reaches the top one.",
    },
    { from: 4, to: 4, text: 'Tap the picture that fills the gap: in, out, in, out.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The round ends when the sea has been in and out twice.' },
    { from: 2, to: 2, text: 'The round ends when both pails stay dry.' },
    {
      from: 3,
      to: 3,
      text: 'The round ends when all three things stay dry under the ordinary line, then under the windy-day line.',
    },
    { from: 4, to: 4, text: 'The round ends when both strips are done.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Nothing here counts as a mistake. Some anemones close up out of the water and open again in it.',
    },
    {
      from: 2,
      to: 2,
      text: 'The seaweed line is where the last high tide reached. A pail below it floats (one miss) and the pet fetches it back, never lost; after two, the line and the dry sand glow, and Show me does the same.',
    },
    {
      from: 3,
      to: 3,
      text: 'Things can be moved freely before the wave. Each thing the sea reaches floats (one miss each) and comes back to the rocks; the dry ones stay. After two, the line the sea will reach glows; Show me asked again carries them up.',
    },
    {
      from: 4,
      to: 4,
      text: 'On this island the sea comes in twice and goes out twice a day; many shores do, not all, and the times shift each day. A wrong card is a miss; the halfway picture never fits. Tapping a picture in the strip says in or out.',
    },
  ],
};
