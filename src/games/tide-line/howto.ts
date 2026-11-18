import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Watch the sea come in and go out, and work out where the water will be.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Pull the wave up the sand and let it go; on a lap, a tap anywhere (sea, sand or sky) sends one whole wave, and a tap while it runs gets a splash.',
    },
    { from: 2, to: 2, text: 'Put the pail above the seaweed line; then the sea comes in.' },
    {
      from: 3,
      to: 3,
      text: "With the sea out, drag the pail, the flag and the towel where they'll stay dry, then tap the wave; with two lines, the sea reaches the top one.",
    },
    { from: 4, to: 4, text: 'Tap the picture that fills the gap: in, out, in, out.' },
    {
      from: 5,
      to: 5,
      text: 'Slide along the day and mark one time the pool shows and one time the sea covers it.',
    },
    { from: 6, to: 6, text: 'Look at the height of the line. Put each picture on a time that fits.' },
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
    { from: 5, to: 5, text: 'The round ends when both times are flagged.' },
    { from: 6, to: 6, text: 'The round ends when all three pictures sit beside a time.' },
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
    {
      from: 5,
      to: 5,
      text: 'Drag the round marker, or tap one of the four times of day; the flag button marks the time it rests on. Sliding and flagging the other state are looking around, never a miss. Help lights the two times that fit; asked again, it flags the first of them. On this island the sea comes in and goes out twice a day, evenly; real shores vary.',
    },
    {
      from: 6,
      to: 6,
      text: 'Drag the picture card onto one of the four times, or tap the card and then the time; touching a time alone shows the shore then, and never counts. The dashed mark is the height that picture needs the line above or below. A time that does not fit is a miss and the card comes back; after two, or with Help, the two times that fit glow, and Help asked again places the card. Two pictures can share a time. The chart is a made-up day on this island, not a real tide table.',
    },
  ],
};
