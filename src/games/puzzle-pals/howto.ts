import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put a picture together.',
  steps: [
    { to: 2, text: 'Tap a piece and it hops into its place. Dragging it there works too.' },
    { from: 3, to: 7, text: 'Drag a piece to where it belongs and let go.' },
    {
      from: 8,
      to: 8,
      text: 'One big piece waits beside the frame. A touch anywhere hops it into its place, and the next piece comes out.',
    },
    {
      from: 9,
      to: 9,
      text: 'Some pieces are upside down. Tap a piece to turn it round, then drag it to where it belongs.',
    },
    {
      from: 10,
      to: 10,
      text: 'Two faint pictures wait side by side and eight pieces are mixed in one tray. Drag each piece onto the picture it belongs to, using its colors.',
    },
    {
      from: 11,
      to: 11,
      text: 'A finished picture has two pieces mixed up. Tap one of them, then the other, and they swap places.',
    },
    {
      from: 12,
      to: 12,
      text: 'Twelve square pieces and the box lid show the picture. Some pieces are on their side or upside down: each tap turns a piece a quarter turn, so up to three taps set it right. Then drag it to where it belongs.',
    },
    { to: 1, text: 'One half is already in place: fit the other half to finish the picture.' },
    { from: 2, to: 4, text: 'A faint picture under the frame shows where each piece goes.' },
    {
      from: 5,
      to: 7,
      text: 'The frame is empty, but the small picture on the box lid beside it shows the whole picture. Thick flat sides belong along its outside edge; corners have two.',
    },
    {
      from: 9,
      to: 9,
      text: 'The frame is empty, and the small picture on the box lid beside it shows the whole picture. Thick flat sides belong along its outside edge; corners have two.',
    },
  ],
  finish: 'The round ends when every piece is in place.',
  note: [
    {
      to: 8,
      text: 'After two wrong places, one piece and its place glow, and the pet names where it goes. Help starts with a corner, then builds beside completed pieces.',
    },
    {
      from: 9,
      to: 9,
      text: 'Turning is free, and dropping a turned piece in its right place hops it back without a miss. After two wrong places, a piece and its place glow (its arrow pulses if it still needs turning), and the pet names where it goes.',
    },
    {
      from: 10,
      to: 10,
      text: 'A piece dropped on the other picture is a miss. After two wrong places, the piece she is holding glows, and so does its own place on its own picture.',
    },
    {
      from: 11,
      to: 11,
      text: 'A swap that does not put both pieces right goes straight back, as a miss with no loss. After two misses the two mixed-up pieces glow.',
    },
    {
      from: 12,
      to: 12,
      text: 'Turning is free, and dropping a turned piece in its right place hops it back without a miss. After two wrong places, a piece and its place glow (its arrow pulses if it still needs turning), and the pet names where it goes.',
    },
  ],
};
