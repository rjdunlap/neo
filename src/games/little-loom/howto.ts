import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Send yarn over and under threads to make a scarf.',
  steps: [
    { to: 1, text: 'Tap the loom. Watch the shuttle cross and the beater pack each row.' },
    { from: 2, to: 2, text: 'Choose any marked yarn pot, then tap the shuttle. Keep or change yarn freely.' },
    {
      from: 3,
      to: 3,
      text: 'Press either pedal, then tap the shuttle. Use the other pedal for the next row.',
    },
    { from: 4, to: 4, text: 'Look at the sample. Pick the pedal and the yarn that make each row.' },
    { from: 5, text: 'Press the pedals in the order that makes the line climb.' },
    {
      from: 4,
      text: 'A row that looks different stays on the loom. Tap the Undo arrow to take it back, free.',
    },
    {
      from: 3,
      to: 3,
      text: 'A repeated lift slips back. Choose the other pedal and try again; no row is lost.',
    },
  ],
  finish: [
    { to: 3, text: 'Eight rows make a scarf. Keep offers it to the shared picture board.' },
    {
      from: 4,
      text: 'Eight rows that match the sample make a scarf. Keep offers it to the shared picture board.',
    },
  ],
  note: [
    { to: 2, text: 'Every choice is welcome. These modes have no misses or hints.' },
    {
      from: 4,
      text: 'A row that slips or looks different from the sample is one miss. Two misses at one row glow the pedal or yarn to try, once per row; Undo and the hint button are free to use.',
    },
    {
      from: 3,
      to: 3,
      text: 'Repeating a submitted lift is one miss under this island toy rule. Two slips glow the other pedal; help counts at most once per row. Exploring pedals and replaying speech are free.',
    },
    {
      text: 'Take turns choosing yarn or pressing a pedal and sending the shuttle. Find a stripe on your clothes together.',
    },
  ],
};
