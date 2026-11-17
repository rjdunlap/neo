import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Set up the helper, then watch the house run its day.',
  steps: [
    { from: 1, to: 1, text: 'Drag the eye to the door.' },
    { from: 2, to: 2, text: 'Pick the sensor the lamp needs.' },
    { from: 3, to: 3, text: 'Add the missing row so the lamp turns off too.' },
    { from: 4, to: 4, text: 'Pick which warmth turns the heater on and which turns it off.' },
    { from: 5, to: 5, text: "Move the sensor where the lamp's own light can't reach it." },
    { from: 6, to: 6, text: 'Drag the line so the nook stays comfy.' },
    { from: 7, to: 7, text: 'Pull the two lines apart so the heater can rest between them.' },
    { from: 8, to: 8, text: 'Move the lines so the heater and the fan never run together.' },
    { from: 9, to: 9, text: 'Find one setup that keeps the plants comfy on all three days.' },
    'Tap Watch and see what the helper does.',
  ],
  finish: 'The helper does its job all day by itself.',
  note: [
    {
      from: 1,
      to: 2,
      text: 'This is a try-out, not a test. Watching is never counted; if it does not work, look at what the friend and the helper did.',
    },
    {
      from: 3,
      to: 3,
      text: 'Watching is never counted. If it does not work, look at what the friend and the lamp did; the same trouble twice makes the part to change glow.',
    },
    {
      from: 4,
      to: 4,
      text: 'Watching is never counted. The thermometer shows cool, warm or hot by how full it is; if the nook gets too chilly or too hot, look at when the heater came on and went off. The same trouble twice makes the part to change glow.',
    },
    {
      from: 5,
      to: 5,
      text: 'Watching is never counted. The rules are already right; if the lamp flickers, look at what its sensor saw. The same trouble twice makes the sensor glow.',
    },
    {
      from: 6,
      to: 6,
      text: 'Watching is never counted, and neither is the guess before the first day. Below the line the heater turns on, above it the heater turns off; the dots on the gauge show the warmth climbing one step at a time. The same trouble twice makes the line glow.',
    },
    {
      from: 7,
      to: 7,
      text: 'Watching is never counted. Between the two lines the heater keeps doing what it was doing; every switch drops a pebble in the jar, and the goal is a day with no pebble rolling out. The same trouble twice makes the line to move glow.',
    },
    {
      from: 8,
      to: 8,
      text: 'Watching is never counted. Below its line the heater turns on; above its line the fan turns on; where the lines cross, both run at once and cancel each other. The pebbles only count clicks. They are never scored. The same trouble twice makes the line to move glow.',
    },
    {
      from: 9,
      to: 9,
      text: 'Watching is never counted. Watch plays an ordinary day, a heat wave and a cold snap with the same two lines; a day that works puts a leaf on its card, and the first day that does not work stops the Watch. Moving a line clears the leaves, because the new setup has not been watched yet. The pebbles only count clicks. They are never scored. The same trouble twice makes the line to move glow.',
    },
  ],
};
