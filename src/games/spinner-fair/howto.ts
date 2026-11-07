import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Spin the spinner and watch the blocks; then use the spinner's picture to say what's likely.",
  steps: [
    { from: 1, to: 1, text: 'Tap the spinner; a block drops on the bar of the critter it lands on.' },
    { from: 2, to: 2, text: 'After eight spins, tap the bar of the critter that came up most.' },
    { from: 3, to: 3, text: "Pick the spinner with more of the pet's favourite, then spin it ten times." },
    { from: 4, to: 4, text: "Drag sure, maybe or no way onto each spinner: all of the pet's favourite is sure, some is maybe, none is no way." },
    { from: 5, to: 5, text: 'Tap fair or unfair. If it is unfair, drag wedges onto the racer with fewer until both have three, then tap Check; then tap the spinner six times to run the race.' },
  ],
  finish: [
    { from: 1, to: 3, text: 'The round ends after the last spins; one sticker, whatever the spinner did.' },
    { from: 4, to: 4, text: 'With every face on its spinner, each spinner spins once to show it; after the second set, one sticker.' },
    { from: 5, to: 5, text: 'After the second race, one sticker, whoever went furthest.' },
  ],
  note: [
    { from: 1, to: 3, text: "A spin is never a mistake; only a question the spinner's picture answers can be. A better chance can still lose: that is the lesson, not a bug. Nothing in the game is won, bet or unlocked by a spin." },
    { from: 4, to: 4, text: "Picking up a face and putting it back is never counted. A face dropped on a spinner it does not fit is a miss and slides back with the reason; after two on a set the answer glows, which counts as a hint. The showing spins judge nothing. Nothing in the game is won, bet or unlocked by a spin." },
    { from: 5, to: 5, text: "Moving wedges, either way, is never counted, and neither is how the race turns out. A wrong fair or unfair, or a Check before both have three, is a miss; after two in a race the next move glows, which counts as a hint. Nothing in the game is won, bet or unlocked by a spin." },
  ],
};
