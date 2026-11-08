import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Tip a log across stepping stones and stand it in the dark hollow with the gold rim.',
  steps: ['Tap an arrow to roll. A standing log tips onto two stones. Tipping along its length stands it up; rolling sideways moves one space.', 'Both ends need stones. The hollow supports a lying log, but only standing in it finishes.', 'Undo takes back a roll. Hint glows a direction on a shortest route. Start over restores the starting position.'],
  finish: 'Stand upright in the hollow to finish one puzzle and earn one sticker.',
  note: 'No misses: a refused roll leans and stays put; two in a row show a hint. A glowing hint counts once. The finish shows the shortest route. Undo and Start over keep rolls and hints.',
};
