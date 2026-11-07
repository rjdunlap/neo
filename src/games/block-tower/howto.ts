import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Explore tower height and balance by stacking, comparing and predicting.',
  steps: [
    { from: 1, to: 1, text: 'Tap anywhere to stack six blocks, then tap again to knock the tower down.' },
    { from: 2, to: 2, text: 'Tap anywhere to stack until the tower is as tall as the friend, then tap again to knock it down.' },
    { from: 3, to: 4, text: 'Tap the basket for blocks; tap the tower to take the top block off.' },
    { from: 3, to: 3, text: 'Build up to the kite flag: its number and dots show how many blocks. Then ring the bell.' },
    { from: 4, to: 4, text: "Build a tower as tall as Duck's, one block taller or one shorter, as asked, then ring the bell." },
    { from: 5, to: 5, text: 'Tap the tower you think will stand. The ropes let go automatically; watch what happens.' },
    { from: 5, to: 5, text: 'The round arrow watches the same release again. The forward arrow continues to the next observation.' },
    { from: 6, to: 6, text: 'Drag blocks from the tray out past this table edge so one touches the star line without tipping. One task reaches left and one right.' },
    { from: 6, to: 6, text: 'Drag the top block to move it, or drag it back to the tray to take it off.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The round ends after two towers are knocked down.' },
    { from: 2, to: 2, text: 'The round ends after three friend-height towers are knocked down.' },
    { from: 3, to: 3, text: 'The round ends after three towers reach their flags and are checked with the bell.' },
    { from: 4, to: 4, text: "The round ends after three towers match the requests and are checked with the bell." },
    { from: 5, to: 5, text: 'Press Continue after each observation. The third Continue ends the round, whichever towers you chose.' },
    { from: 6, to: 6, text: 'The round ends after two standing stacks touch their star lines.' },
  ],
  note: [{ from: 5, to: 5, text: 'Either prediction is welcome; choosing the tower that falls counts no miss or hint.' }],
};
