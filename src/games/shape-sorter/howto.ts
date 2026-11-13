import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put each shape in the hole or mouth it fits.',
  steps: [
    { to: 8, text: 'Drag a shape to a hole and let go.' },
    {
      from: 9,
      to: 9,
      text: 'Tap a shape and it hops into the hole by itself. Dragging it there works too. At lap age one big circle waits beside the box, a touch anywhere puts it in, and the next rolls out.',
    },
    { from: 10, to: 11, text: 'Drag a shape to a hole and let go.' },
    { to: 4, text: 'Each hole is the color of the shape that fits it.' },
    { from: 5, to: 5, text: 'The holes are plain, so match by shape alone.' },
    { from: 10, to: 10, text: 'Two plain holes, a circle and a square: match by shape alone.' },
    {
      from: 6,
      to: 6,
      text: 'Every shape is the same color, and some are bigger than others: match by shape alone. Any size fits.',
    },
    {
      from: 7,
      to: 7,
      text: 'Every shape is the same color, some bigger, some smaller, and tilted: match by shape, however it leans.',
    },
    {
      from: 8,
      to: 8,
      text: 'Every shape is the same color. Listen to the shape clue, then drag that shape into the box.',
    },
    {
      from: 13,
      to: 13,
      text: 'Drag shapes with only curves to the round mouth with the circle sign. Shapes with corners go to the zigzag mouth with the triangle sign.',
    },
    {
      from: 14,
      to: 14,
      text: 'Count a shape’s corners, then drag it to the hole with that numeral and number of dots. Different shapes can share a hole; circles and ovals have zero corners.',
    },
    {
      from: 12,
      to: 12,
      text: 'Tap a shape to turn it one notch (30 degrees), then drag it to its upright hole. A circle fits at any angle.',
    },
    {
      from: 11,
      to: 11,
      text: 'One shape in three sizes, big, middle and little. Put each in the hole its size.',
    },
  ],
  finish: 'The round ends when every shape is in a hole.',
  note: [
    {
      from: 9,
      to: 9,
      text: 'There is no wrong move here. A tap on the box makes it giggle, a tap on the floor wiggles the nearest shape and names it, and a shape let go far from the hole plops and slides home. At lap age every touch, held or quick, puts the circle in.',
    },
    {
      to: 1,
      text: 'There is no wrong move here. A tap on the box makes it giggle, a tap on the floor wiggles the nearest shape and names it, and a shape let go far from the hole plops and slides home.',
    },
    {
      from: 2,
      to: 7,
      text: 'A shape in the wrong hole slides back with a boing, a miss. Every second miss makes the right hole glow, whichever shapes were tried.',
    },
    {
      from: 10,
      to: 10,
      text: 'A shape in the wrong hole slides back with a boing, a miss. Every second miss makes the right hole glow, whichever shapes were tried.',
    },
    {
      from: 5,
      to: 7,
      text: 'Now and then the box says something true about the shape it ate, like three corners. Nothing to answer.',
    },
    {
      from: 6,
      to: 8,
      text: 'The shapes change from round to round, from circle and square to oval, rectangle, diamond, pentagon and trapezoid.',
    },
    {
      from: 8,
      to: 8,
      text: 'A shape that is not the one asked for slides back, a miss; if it fits its own hole, the voice names it and repeats the clue. Every second miss makes the asked hole glow.',
    },
    {
      from: 13,
      to: 14,
      text: 'A wrong target sends the shape home with a boing and a spoken property hint, one miss. Every second miss lights the right target, one hint.',
    },
    {
      from: 14,
      to: 14,
      text: 'On the lit target, the dots light one by one. At least two different four-corner shapes share the 4 hole. Hearts and stars are left out.',
    },
    {
      from: 12,
      to: 12,
      text: 'A shape at the right hole but turned too far waits there and jiggles: one miss. Tap it to turn, then drag it into the hole again. Two turning misses on that piece turn it to fit, one hint. Wrong holes send it home; every second miss lights the right hole. Equivalent turns fit, within 15 degrees.',
    },
    {
      from: 11,
      to: 11,
      text: 'A shape on a hole of the wrong size slides back, too big or too little, a miss. Every second miss makes the right-size hole glow.',
    },
  ],
};
