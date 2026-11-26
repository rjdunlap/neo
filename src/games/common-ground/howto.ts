import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'A friend says two things they would like. Arrange the room so both are kept.',
  steps: [
    'Listen to the two request bubbles; tap a bubble to hear them again.',
    'Drag the cushion to the wall with the window or door, and the book basket right beside it.',
    'Add the plant anywhere if you like. It is just an extra.',
    { to: 1, text: 'Press Visit to let the friend in.' },
    {
      from: 2,
      text: 'Press Visit. The friend asks for the basket on a different side: drag it there (the dashed square is its old place; the back arrow undoes), then press Visit again.',
    },
  ],
  finish: [
    { from: 2, text: 'The friend sits down once the basket is on a new side. A round gives one sticker.' },
    { text: 'The friend sits down once both requests are kept. A round gives one sticker.' },
  ],
  note: 'Moving things around is never a mistake. If a request is not kept yet, the friend says which one, and the glow shows a move that helps.',
};
