import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make the seesaw go up, balance, or show which friend is heavier or lighter.',
  steps: [
    {
      from: 17,
      to: 17,
      text: 'The prop holds both trays flat. Add the tagged weights and tap a tray to predict it goes down, or the equal sign in the middle for a balance. Watch the release and listen to the sums, then tap the green Continue arrow.',
    },
    {
      from: 14,
      to: 14,
      text: 'Drag pairs of presents onto the trays to compare freely. Drag each present to the light, middle or heavy shelf spot, marked by small, middle and big blocks. Either end can be filled first.',
    },
    {
      from: 15,
      to: 15,
      text: 'Tap a number to guess how heavy the pumpkin is; guessing is never wrong. Drag blocks to the other tray until balanced, then tap its measured weight. Your guess stays on the sign.',
    },
    {
      from: 16,
      to: 16,
      text: 'Drag blocks to the lighter, raised tray until the two tagged weights balance. Then tap how many blocks you added: the difference. A block on the heavy side comes back freely.',
    },
    {
      from: 12,
      to: 12,
      text: 'Touch anywhere on the empty side of the screen, even before the voice finishes, to send a bigger friend hopping on and lift the rider. Touching the rider is free play.',
    },
    {
      from: 13,
      to: 13,
      text: 'Listen for heavier or lighter, then tap that friend. The heavier friend goes down; the lighter one goes up. After two wrong taps the asked friend glows.',
    },
    { to: 2, text: 'Tap a friend, or drag it, to put it on the other side of the seesaw.' },
    { from: 3, to: 3, text: 'Tap blocks to put them on the other side until the seesaw balances.' },
    {
      from: 4,
      to: 4,
      text: 'Put the presents on the seesaw to see which side drops; the heaviest goes in the wagon.',
    },
    {
      from: 5,
      to: 5,
      text: 'Tap number weights onto the other side until it weighs the same as this side, using different pieces.',
    },
    {
      from: 6,
      to: 7,
      text: 'Tap blocks onto the other side until the seesaw balances, then tap the answer button for how heavy the box is.',
    },
    {
      from: 8,
      to: 9,
      text: 'Take the same thing off both sides, one at a time, until a box is alone; then tap the answer button for how heavy it is.',
    },
    {
      from: 10,
      to: 10,
      text: 'Take the same things off both sides. When two boxes balance the blocks, share the blocks fairly and tap how many belong to each box.',
    },
    {
      from: 11,
      to: 11,
      text: 'First tap how heavy the square box is, and it wears its number. Then take the same off both sides, counting the square box as its number of blocks, until the round box is alone; then tap how heavy the round box is.',
    },
  ],
  finish: [
    {
      from: 17,
      to: 17,
      text: 'Three predictions and Continue taps finish. Predictions are unscored, including when the seesaw shows something different.',
    },
    {
      from: 14,
      to: 16,
      text: 'Three completed puzzles finish the round, including with help. Two wrong shelf or final-number choices glow the right destination or answer.',
    },
    { from: 12, to: 12, text: 'Four wheees finish the round, with no wrong touches.' },
    { from: 13, to: 13, text: 'Three comparisons finish the round, including with help.' },
    { to: 4, text: 'The round ends when the seesaw is balanced or the heaviest is chosen, as asked.' },
    {
      from: 5,
      to: 11,
      text: 'The round ends when the seesaw is balanced as asked and the weight is chosen.',
    },
  ],
  note: [
    {
      to: 16,
      text: 'Tipping is how the seesaw explains weight; trying things is the game. A heavier side going down and equal sides lying flat are added to her discovery journal after she sees them.',
    },
    {
      from: 17,
      to: 17,
      text: 'Predictions compare weight only: distance never changes. Try a shared prediction; there is no penalty and no journal entry.',
    },
  ],
};
