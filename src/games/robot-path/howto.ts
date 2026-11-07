import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Explore how the robot follows or fixes a program.',
  steps: [
    { to: 10, text: 'Tap arrows to add steps to the program.' },
    { to: 10, text: 'Tap a program slot to remove it (and what follows), then press play.' },
    { from: 7, to: 8, text: 'Tap an arrow again to go further the same way ("right x4").' },
    { from: 9, to: 10, text: 'Use the loop button to repeat a few steps.' },
    { from: 11, to: 11, text: 'Read the shown program, tap the square where the robot will stop, then press play to watch.' },
    { from: 12, to: 12, text: 'Press play to watch the program once. Then tap the slot to fix and tap an arrow to change it. Press play again.' },
    { from: 13, to: 13, text: 'Make a path with counted steps that goes through the apple first, then ends on the star. Press play.' },
    { from: 14, text: 'Press play to watch the looped program once. Then either tap a slot and an arrow to change that step, or tap the loop button to change how many times it repeats. Press play again.' },
  ],
  finish: [
    { to: 10, text: 'The round ends when the robot reaches the star.' },
    { from: 11, to: 11, text: 'The round ends after the robot shows where the program stops.' },
    { from: 12, to: 12, text: 'The round ends when the fixed program reaches the star.' },
    { from: 13, to: 13, text: 'The round ends when the robot has picked up the apple and reached the star.' },
    { from: 14, text: 'The round ends when the mended loop reaches the star.' },
  ],
  note: [
    { to: 10, text: 'The board is drawn from three possible layouts. If the robot cannot get there it simply stops; edit the program and try again.' },
    { from: 11, to: 11, text: 'Predictions are just a chance to think; every guess is welcome.' },
    { from: 12, to: 12, text: 'The first watch is free. A repair that still stops short gets a gentle hint after two tries.' },
    { from: 13, to: 13, text: 'The apple never sits on the plain way to the star, so the shortest path forgets it. Ending on the star without it is a gentle miss and the apple glows.' },
    { from: 14, text: 'The first watch is free. Most boards need only one more turn of the loop; one needs a longer step inside it. A mend that still stops short is a gentle miss, and after two the slot or loop button to change glows.' },
  ],
};
