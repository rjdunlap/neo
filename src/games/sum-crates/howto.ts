import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fill the crates with numbered fruit so every row and column adds up to its sign, with no fruit twice in a line.',
  steps: [
    'Tap a crate, then a fruit below to put it in; tap a filled crate to take its fruit back. Dragging a fruit onto a crate works too, and the fruit never run out.',
    {
      to: 2,
      text: 'A sign sits at the start of its line: left of a row, above a column. The dots on a fruit show its number.',
    },
    {
      from: 3,
      text: 'A crate where a row and a column cross has to suit both signs.',
    },
    'Hint glows the next crate the rules settle, or a fruit to take back.',
  ],
  finish: 'It ends by itself when every line adds up to its sign with no repeat.',
  note: 'A full line says what it made, free; a repeated fruit wobbles. Only a full stack that is wrong counts once. There is exactly one answer.',
};
