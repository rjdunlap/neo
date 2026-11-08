import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Look closer and closer with a lens.',
  steps: [
    { from: 1, to: 1, text: 'Tap the lens; each thing looks bigger, then goes back.' },
    { from: 2, to: 2, text: 'Drag the lens over all three things; the paw outside it stays the same size.' },
    {
      from: 3,
      to: 3,
      text: "Tap the dial's pictures to look closer; tap a swimmer, or No swimmers if the drop has none.",
    },
    { from: 4, to: 4, text: 'Tap the dial to just the view the friend asks for, then Show.' },
    {
      from: 5,
      to: 5,
      text: "Turn the dial until you can see the ringed speck's edge, then choose alive, not alive or can't tell yet.",
    },
    {
      from: 6,
      to: 6,
      text: 'Turn the dial until you can see the edges, then put the slide in one cell, many cells or not cells.',
    },
    {
      from: 7,
      to: 7,
      text: "Turn the dial until the edges show, then choose plant cells, animal cells or can't tell yet. The slides are onion skin, a leaf and cheek cells.",
    },
    {
      from: 8,
      to: 8,
      text: 'Turn the dial until you can tell why the water is green: tiny green living things, or green all through the water. One drop is just coloured water.',
    },
  ],
  finish: [
    { from: 1, to: 2, text: 'Three things looked at.' },
    { from: 3, to: 3, text: 'Every drop checked.' },
    { from: 4, to: 4, text: 'All three views shown.' },
    { from: 5, to: 5, text: 'Every ringed speck answered.' },
    { from: 6, to: 6, text: 'All four slides sorted.' },
    { from: 7, to: 7, text: 'All three slides answered.' },
    { from: 8, to: 8, text: 'All three drops answered.' },
  ],
  note: [
    {
      from: 1,
      to: 2,
      text: "The lens makes things look bigger; it doesn't make them bigger. Nothing here is ever wrong.",
    },
    {
      from: 3,
      to: 3,
      text: "Saying 'No swimmers' before the closest views is never wrong; it only asks to look closer. Show a hint turns the dial for her and counts as a hint, once per drop.",
    },
    {
      from: 4,
      to: 4,
      text: 'Too far and too close are both misses; turning the dial never is. Show a hint turns the dial for her and counts as a hint, once per question.',
    },
    {
      from: 5,
      to: 8,
      text: "Moving or being green never proves something is alive; the edge and what's inside do.",
    },
    {
      from: 5,
      to: 8,
      text: 'Answering before the view can show it is never wrong; it only asks to look closer.',
    },
    {
      from: 5,
      to: 8,
      text: 'Show a hint turns the dial for her and says what the view shows; it counts as a hint, once per speck, slide or drop.',
    },
    { from: 7, to: 7, text: 'The wall is the plant clue, not the colour: onion skin has no green.' },
    {
      from: 8,
      to: 8,
      text: "No edges even at the closest look means the green is in the water itself. It doesn't prove nothing is alive there.",
    },
  ],
};
