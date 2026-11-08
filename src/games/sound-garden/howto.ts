import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make music with the garden friends and listen to their sounds.',
  steps: [
    {
      to: 1,
      text: 'Tap a friend to hear it sing: the bird sings high, the frog low, the bunny pats fast and the turtle plods slow. Five of the six friends stand in the garden each round.',
    },
    {
      from: 2,
      to: 2,
      text: 'Listen to the bird and the frog, then tap the one that sings high (or low), as asked.',
    },
    {
      from: 3,
      to: 3,
      text: 'Listen to the bunny and the turtle, then tap the one that is fast (or slow), as asked.',
    },
    { from: 4, to: 4, text: 'Listen to the tune, then tap whether it goes up or down.' },
    {
      from: 5,
      to: 5,
      text: 'Watch the dots as the woodpecker knocks, then tap its rhythm back on the drum to wake the tree. Tap the woodpecker to listen again. After two misses, the drum lights for each remaining tap.',
    },
    { from: 6, to: 6, text: 'Listen closely, then answer: high or low, fast or slow, up or down.' },
    {
      from: 7,
      to: 7,
      text: 'Listen to the tune, then tap the rising steps, falling steps or flat path: up, down or the same note.',
    },
    {
      from: 9,
      to: 9,
      text: 'Drag along the flower stem to hear six pitches. Moving up raises the pitch; moving down lowers it. Lift to make a note; the bell, frog and bunny join on a lower pitch. Every choice is welcome.',
    },
    {
      from: 10,
      to: 10,
      text: 'Listen to the bird and watch its shape. Drag your singer and lift once for each note: first two notes, then three. Copy the directions, using any starting note with room to move. Tap the other bird to listen again. After two misses, the stem lights possible next notes.',
    },
    {
      from: 8,
      to: 8,
      text: 'Tap the big friend or the space around it to hear it sing. After four taps it waves and the next friend takes a turn. The corner controls and pet stay clear.',
    },
  ],
  finish: [
    { to: 1, text: 'The round ends after twelve songs.' },
    { from: 2, to: 4, text: 'The round ends when the listening questions are answered.' },
    { from: 5, to: 5, text: 'The round ends when the rhythms are echoed.' },
    { from: 6, to: 7, text: 'The round ends when the listening questions are answered.' },
    { from: 8, to: 8, text: 'Twelve songs finish the round. Every musical choice is welcome.' },
    {
      from: 9,
      to: 9,
      text: 'Twelve released notes gently finish the round. Cancelling a drag adds no note.',
    },
    {
      from: 10,
      to: 10,
      text: 'Six copied shapes finish the round, including with stem hints. Replays are always free.',
    },
  ],
};
