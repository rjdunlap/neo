import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Tip a log across stepping stones to its finish inside the gold rim.',
  steps: [
    'Tap an arrow to roll. A standing log tips onto two stones. Tipping along its length stands it up; rolling sideways moves one space.',
    {
      text: 'Both ends need stones. The hollow supports a lying log, but only standing in it finishes.',
      to: 4,
    },
    {
      text: 'Both ends need stones. The finish is a wooden cradle on two stones: only lying across both finishes, and standing on one does not.',
      from: 5,
      to: 5,
    },
    {
      text: 'Both ends need stones. Green moss supports a lying log, but refuses a standing log. Cross it lying down, then stand in the hollow.',
      from: 6,
      to: 6,
    },
    {
      text: 'Stand on the purple ring to raise the two sunken bridge stones. Lying on the switch does nothing. The bridge stays raised until Undo takes back the press or Start over resets the puzzle.',
      from: 7,
    },
    'Undo takes back a roll. Hint glows a direction on a shortest route. Start over restores the starting position.',
  ],
  finish: [
    { text: 'Stand upright in the hollow to finish one puzzle and earn one sticker.', to: 4 },
    {
      text: 'Lie the log across both cradle stones to finish one puzzle and earn one sticker.',
      from: 5,
      to: 5,
    },
    { text: 'Stand upright in the hollow to finish one puzzle and earn one sticker.', from: 6 },
  ],
  note: 'No misses: a refused roll leans and stays put; two in a row show a hint. A glowing hint counts once. The finish shows the shortest route. Undo and Start over keep rolls and hints.',
};
