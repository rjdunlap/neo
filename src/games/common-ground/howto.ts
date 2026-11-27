import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'A friend says two things they would like. Arrange the room so both are kept.',
  steps: [
    { to: 2, text: 'Listen to the two request bubbles; tap a bubble to hear them again.' },
    {
      from: 3,
      text: 'Listen to the two friends; tap a card to hear one again. The solid row is a need, the star row is a wish.',
    },
    {
      to: 2,
      text: 'Drag the cushion to the wall with the window or door, and the book basket right beside it.',
    },
    {
      from: 3,
      text: 'Drag the easel to the top row by the window, and the drum to a spot that is not right next to the easel.',
    },
    { to: 2, text: 'Add the plant anywhere if you like. It is just an extra.' },
    {
      from: 3,
      text: 'Press Visit. Then keep the plan, or try another. Both friends cannot always get their wish.',
    },
    { to: 1, text: 'Press Visit to let the friend in.' },
    {
      from: 2,
      to: 2,
      text: 'Press Visit. The friend asks for the basket on a different side: drag it there (the dashed square is its old place; the back arrow undoes), then press Visit again.',
    },
  ],
  finish: [
    {
      from: 3,
      text: 'Press Keep this plan once both needs are kept. A round gives one sticker, whichever wish the plan serves.',
    },
    { from: 2, text: 'The friend sits down once the basket is on a new side. A round gives one sticker.' },
    { text: 'The friend sits down once both requests are kept. A round gives one sticker.' },
  ],
  note: [
    {
      from: 3,
      text: 'A wish is a nice extra, never a mistake. If a need is not kept the friend says which one, and the glow shows a move that helps.',
    },
    {
      text: 'Moving things around is never a mistake. If a request is not kept yet, the friend says which one, and the glow shows a move that helps.',
    },
  ],
};
