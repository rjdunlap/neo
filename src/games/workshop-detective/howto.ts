import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'A made-up bench lamp follows one of two notes. Decide what the records can show, then find a test that tells the notes apart.',
  steps: [
    'Two records start the bench: both levers down, dim; both up, bright. Tap a card to hear it.',
    'Mark each note fits or ruled out and tap Check. Both notes fit those two records, so they cannot tell.',
    'Then the levers unlock. Set one lever up and the other down, and tap Try it. The lamp lights and a new record joins the bench.',
    'Mark the note that fits every record, rule out the other, and tap Check.',
  ],
  finish: 'The case closes when the note that fits every record is marked fits and the other is ruled out.',
  note: 'Tries, repeats and marks are free. A wrong Check shows the record that decides it; Help shows the next step.',
};
